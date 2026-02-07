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

    const { data: products } = await supabase.from('products').select('id, name, sku, min_stock')
    if (!products) throw new Error('No products found')

    const { data: warehouses } = await supabase.from('warehouses').select('id, name, region')
    if (!warehouses) throw new Error('No warehouses found')

    const { data: inventory } = await supabase.from('inventory').select('*')
    if (!inventory) throw new Error('No inventory found')

    const { data: dealers } = await supabase.from('dealers').select('id, name, region, warehouse_id')

    const today = new Date()
    const weekAhead = new Date(today)
    weekAhead.setDate(weekAhead.getDate() + 7)
    
    const { data: forecasts } = await supabase
      .from('forecasts')
      .select('product_id, region, predicted_demand')
      .gte('forecast_date', today.toISOString().split('T')[0])
      .lte('forecast_date', weekAhead.toISOString().split('T')[0])

    const forecastMap: Record<string, number> = {}
    if (forecasts) {
      for (const f of forecasts) {
        const key = `${f.product_id}_${f.region}`
        forecastMap[key] = (forecastMap[key] || 0) + f.predicted_demand
      }
    }

    // Clear old pending recommendations and planned actions
    await supabase.from('planned_actions').delete().eq('status', 'pending')
    await supabase.from('recommendations').delete().eq('status', 'pending')

    // Also clear old projections
    await supabase.from('inventory_projection').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    const recommendations: Record<string, unknown>[] = []

    for (const wh of warehouses) {
      for (const product of products) {
        const invItem = inventory.find(i => i.warehouse_id === wh.id && i.product_id === product.id)
        const currentStock = invItem?.quantity || 0
        const safetyStock = product.min_stock
        const forecastDemand = forecastMap[`${product.id}_${wh.region}`] || 0

        if (currentStock < safetyStock) {
          const deficit = safetyStock * 2 - currentStock

          const otherWarehouses = warehouses.filter(w => w.id !== wh.id)
          let transferSource = null
          for (const otherWh of otherWarehouses) {
            const otherInv = inventory.find(i => i.warehouse_id === otherWh.id && i.product_id === product.id)
            if (otherInv && otherInv.quantity > safetyStock * 2) {
              transferSource = otherWh
              break
            }
          }

          if (transferSource) {
            recommendations.push({
              type: 'transfer',
              from_location: transferSource.name,
              to_location: wh.name,
              product_id: product.id,
              quantity: Math.min(deficit, 200),
              reason: `${product.name} at ${currentStock} units (safety: ${safetyStock}). Surplus at ${transferSource.name}.`,
              priority: currentStock < safetyStock * 0.3 ? 'high' : 'medium',
              ai_confidence: Math.round(85 + Math.random() * 10),
              status: 'pending',
            })
          } else {
            recommendations.push({
              type: 'reorder',
              to_location: wh.name,
              product_id: product.id,
              quantity: deficit,
              reason: `Stock at ${currentStock}/${safetyStock}. Forecasted ${forecastDemand} units demand in 7 days.`,
              priority: currentStock < safetyStock * 0.3 ? 'high' : 'medium',
              ai_confidence: Math.round(80 + Math.random() * 15),
              status: 'pending',
            })
          }
        }
      }
    }

    // Dealer order recommendations
    if (dealers) {
      for (const dealer of dealers) {
        const regionProducts = products.filter(p => {
          const demand = forecastMap[`${p.id}_${dealer.region}`] || 0
          return demand > 0
        }).sort((a, b) => {
          const demandA = forecastMap[`${a.id}_${dealer.region}`] || 0
          const demandB = forecastMap[`${b.id}_${dealer.region}`] || 0
          return demandB - demandA
        }).slice(0, 2)

        for (const product of regionProducts) {
          const demand = forecastMap[`${product.id}_${dealer.region}`] || 0
          if (demand > product.min_stock * 0.5) {
            recommendations.push({
              type: 'order',
              to_location: dealer.name,
              product_id: product.id,
              quantity: Math.round(demand / 7 * 5),
              reason: `High demand predicted in ${dealer.region}: ${demand} units/week.`,
              priority: demand > product.min_stock ? 'high' : 'medium',
              ai_confidence: Math.round(78 + Math.random() * 17),
              status: 'pending',
            })
          }
        }
      }
    }

    const sorted = recommendations.sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return (priorityOrder[a.priority as string] || 2) - (priorityOrder[b.priority as string] || 2)
    }).slice(0, 20)

    // Insert recommendations
    if (sorted.length > 0) {
      const { data: insertedRecs, error } = await supabase.from('recommendations').insert(sorted).select('id, type, from_location, to_location, product_id, quantity')
      if (error) throw error

      // Create planned_actions for each recommendation (NO inventory mutation)
      if (insertedRecs) {
        const plannedActions = insertedRecs.map((rec: Record<string, unknown>) => ({
          recommendation_id: rec.id,
          action_type: rec.type,
          product_id: rec.product_id,
          from_location: rec.from_location || null,
          to_location: rec.to_location,
          quantity: rec.quantity,
          planned_execution_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          status: 'pending',
        }))
        await supabase.from('planned_actions').insert(plannedActions)
      }
    }

    // Generate inventory projections (7-day and 30-day)
    const projectionRows: Record<string, unknown>[] = []
    const projectionDays = [7, 30]

    for (const days of projectionDays) {
      const projDate = new Date(today)
      projDate.setDate(projDate.getDate() + days)
      const projDateStr = projDate.toISOString().split('T')[0]

      for (const wh of warehouses) {
        for (const product of products) {
          const invItem = inventory.find(i => i.warehouse_id === wh.id && i.product_id === product.id)
          const currentQty = invItem?.quantity || 0
          const dailyDemand = (forecastMap[`${product.id}_${wh.region}`] || 0) / 7
          const forecastedDemand = Math.round(dailyDemand * days)

          // Calculate planned inbound/outbound from recommendations
          let plannedInbound = 0
          let plannedOutbound = 0
          for (const rec of sorted) {
            if (rec.product_id !== product.id) continue
            if (rec.type === 'transfer') {
              if (rec.to_location === wh.name) plannedInbound += (rec.quantity as number)
              if (rec.from_location === wh.name) plannedOutbound += (rec.quantity as number)
            } else if (rec.type === 'reorder' && rec.to_location === wh.name) {
              plannedInbound += (rec.quantity as number)
            } else if (rec.type === 'order' && rec.to_location) {
              // Dealer orders reduce warehouse stock
              const dealer = dealers?.find(d => d.name === rec.to_location && d.warehouse_id === wh.id)
              if (dealer) plannedOutbound += (rec.quantity as number)
            }
          }

          const projectedQty = Math.max(0, currentQty + plannedInbound - plannedOutbound - forecastedDemand)

          projectionRows.push({
            product_id: product.id,
            warehouse_id: wh.id,
            projected_date: projDateStr,
            current_quantity: currentQty,
            planned_inbound: plannedInbound,
            planned_outbound: plannedOutbound,
            forecasted_demand: forecastedDemand,
            projected_quantity: projectedQty,
            based_on_plan: true,
          })
        }
      }
    }

    // Insert projections in batches
    for (let i = 0; i < projectionRows.length; i += 500) {
      const batch = projectionRows.slice(i, i + 500)
      await supabase.from('inventory_projection').insert(batch)
    }

    await supabase.from('activity_log').insert({
      user_name: body.user_name || 'System',
      action: 'recommendations_generated',
      entity_type: 'recommendation',
      details: { count: sorted.length, projections: projectionRows.length, mode: 'planning' },
    })

    return new Response(JSON.stringify({
      success: true,
      recommendations_generated: sorted.length,
      projections_generated: projectionRows.length,
      mode: 'planning',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
