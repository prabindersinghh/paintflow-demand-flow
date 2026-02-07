import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const body = await req.json().catch(() => ({}))

    // 1. Read current state
    const [
      { data: products },
      { data: warehouses },
      { data: inventory },
      { data: recommendations },
      { data: forecasts },
    ] = await Promise.all([
      supabase.from('products').select('id, name, sku, min_stock, pack_size_litres, unit_price'),
      supabase.from('warehouses').select('id, name, region'),
      supabase.from('inventory').select('product_id, warehouse_id, quantity'),
      supabase.from('recommendations').select('*').eq('status', 'pending'),
      supabase.from('forecasts').select('product_id, region, predicted_demand, forecast_date')
        .gte('forecast_date', new Date().toISOString().split('T')[0]),
    ])

    if (!products || !warehouses || !inventory) {
      throw new Error('Missing master data')
    }

    // 2. Clear previous simulation (non-destructive to real tables)
    await Promise.all([
      supabase.from('virtual_inventory_projection').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('virtual_inventory_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ])

    // 3. Build forecast demand map: product_id+region → total demand over 7 days
    const forecastMap: Record<string, number> = {}
    if (forecasts) {
      const sevenAhead = new Date()
      sevenAhead.setDate(sevenAhead.getDate() + 7)
      for (const f of forecasts) {
        if (new Date(f.forecast_date) <= sevenAhead) {
          const key = `${f.product_id}_${f.region}`
          forecastMap[key] = (forecastMap[key] || 0) + f.predicted_demand
        }
      }
    }

    // 4. Build recommendation impact maps
    const inboundMap: Record<string, number> = {} // wh_id+prod_id → litres incoming
    const outboundMap: Record<string, number> = {} // wh_id+prod_id → litres outgoing
    const movementRows: Record<string, unknown>[] = []

    const whByName = new Map(warehouses.map(w => [w.name, w]))
    const prodById = new Map(products.map(p => [p.id, p]))

    if (recommendations) {
      for (const rec of recommendations) {
        const prod = prodById.get(rec.product_id)
        if (!prod) continue
        const litres = rec.quantity * (prod.pack_size_litres || 1)

        if (rec.type === 'transfer') {
          const fromWh = whByName.get(rec.from_location)
          const toWh = whByName.get(rec.to_location)
          if (fromWh) {
            const fKey = `${fromWh.id}_${rec.product_id}`
            outboundMap[fKey] = (outboundMap[fKey] || 0) + litres
          }
          if (toWh) {
            const tKey = `${toWh.id}_${rec.product_id}`
            inboundMap[tKey] = (inboundMap[tKey] || 0) + litres
          }
          movementRows.push({
            sku_id: rec.product_id,
            from_warehouse: fromWh?.id || null,
            to_warehouse: toWh?.id || null,
            quantity_l: litres,
            movement_type: 'transfer',
            simulated_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          })
        } else if (rec.type === 'reorder') {
          const toWh = whByName.get(rec.to_location)
          if (toWh) {
            const tKey = `${toWh.id}_${rec.product_id}`
            inboundMap[tKey] = (inboundMap[tKey] || 0) + litres
          }
          movementRows.push({
            sku_id: rec.product_id,
            from_warehouse: null,
            to_warehouse: toWh?.id || null,
            quantity_l: litres,
            movement_type: 'reorder',
            simulated_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          })
        } else if (rec.type === 'order') {
          // Dealer orders — find the dealer's warehouse
          const dealers = (await supabase.from('dealers').select('id, name, warehouse_id').eq('name', rec.to_location)).data
          const dealer = dealers?.[0]
          if (dealer?.warehouse_id) {
            const oKey = `${dealer.warehouse_id}_${rec.product_id}`
            outboundMap[oKey] = (outboundMap[oKey] || 0) + litres
          }
          movementRows.push({
            sku_id: rec.product_id,
            from_warehouse: dealer?.warehouse_id || null,
            to_warehouse: null,
            quantity_l: litres,
            movement_type: 'consumption',
            simulated_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          })
        }
      }
    }

    // 5. Add forecasted demand as consumption movements
    for (const wh of warehouses) {
      for (const prod of products) {
        const demand = forecastMap[`${prod.id}_${wh.region}`] || 0
        if (demand > 0) {
          const litres = demand * (prod.pack_size_litres || 1)
          const oKey = `${wh.id}_${prod.id}`
          outboundMap[oKey] = (outboundMap[oKey] || 0) + litres
        }
      }
    }

    // 6. Calculate projected stock for each warehouse × product
    const projectionRows: Record<string, unknown>[] = []

    for (const wh of warehouses) {
      for (const prod of products) {
        const invItem = inventory.find(i => i.warehouse_id === wh.id && i.product_id === prod.id)
        const currentQty = invItem?.quantity || 0
        const currentStockL = currentQty * (prod.pack_size_litres || 1)
        const key = `${wh.id}_${prod.id}`
        const incoming = inboundMap[key] || 0
        const outgoing = outboundMap[key] || 0
        const projectedL = Math.max(0, currentStockL + incoming - outgoing)

        projectionRows.push({
          warehouse_id: wh.id,
          sku_id: prod.id,
          current_stock_l: currentStockL,
          projected_stock_l: projectedL,
          incoming_l: incoming,
          outgoing_l: outgoing,
        })
      }
    }

    // 7. Insert virtual projections in batches
    for (let i = 0; i < projectionRows.length; i += 500) {
      await supabase.from('virtual_inventory_projection').insert(projectionRows.slice(i, i + 500))
    }

    // 8. Insert virtual movements
    if (movementRows.length > 0) {
      for (let i = 0; i < movementRows.length; i += 500) {
        await supabase.from('virtual_inventory_movements').insert(movementRows.slice(i, i + 500))
      }
    }

    // 9. Log simulation
    await supabase.from('activity_log').insert({
      user_name: body.user_name || 'System',
      action: 'forecast_run',
      entity_type: 'simulation',
      details: {
        projections: projectionRows.length,
        movements: movementRows.length,
        mode: 'virtual_simulation',
      },
    })

    return new Response(JSON.stringify({
      success: true,
      projections: projectionRows.length,
      movements: movementRows.length,
      mode: 'virtual_simulation',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
