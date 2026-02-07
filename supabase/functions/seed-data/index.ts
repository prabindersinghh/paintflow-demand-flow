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
    const { data: products } = await supabase.from('products').select('id, min_stock')
    const { data: warehouses } = await supabase.from('warehouses').select('id')
    
    if (!products || !warehouses) throw new Error('No products or warehouses found')

    const inventoryRows = []
    for (const wh of warehouses) {
      for (const prod of products) {
        const rand = Math.random()
        let qty: number
        if (rand < 0.15) {
          qty = Math.floor(prod.min_stock * 0.3 * Math.random())
        } else if (rand < 0.85) {
          qty = Math.floor(prod.min_stock * (1.2 + Math.random() * 2))
        } else {
          qty = Math.floor(prod.min_stock * (4 + Math.random() * 3))
        }
        inventoryRows.push({
          warehouse_id: wh.id,
          product_id: prod.id,
          quantity: qty,
        })
      }
    }

    const { error: invError } = await supabase.from('inventory').upsert(inventoryRows, { onConflict: 'warehouse_id,product_id' })
    if (invError) throw invError

    const regions = ['North', 'South', 'East', 'West', 'Central']
    const today = new Date()
    const salesRows: Record<string, unknown>[] = []
    
    const seasonality: Record<number, number> = {
      0: 0.7, 1: 0.75, 2: 0.9, 3: 1.2, 4: 1.3, 5: 1.1,
      6: 0.8, 7: 0.85, 8: 1.0, 9: 1.4, 10: 1.5, 11: 0.9,
    }

    for (const product of products) {
      for (const region of regions) {
        const baseDemand = 15 + Math.random() * 50
        for (let dayOffset = 60; dayOffset >= 1; dayOffset--) {
          const date = new Date(today)
          date.setDate(date.getDate() - dayOffset)
          const month = date.getMonth()
          const dow = date.getDay()
          const weekdayFactor = (dow === 0 || dow === 6) ? 0.5 : 1.0
          const seasonFactor = seasonality[month] || 1.0
          const noise = 0.7 + Math.random() * 0.6
          const qty = Math.max(1, Math.round(baseDemand * seasonFactor * weekdayFactor * noise))
          
          salesRows.push({
            product_id: product.id,
            region,
            sale_date: date.toISOString().split('T')[0],
            quantity: qty,
          })
        }
      }
    }

    for (let i = 0; i < salesRows.length; i += 1000) {
      const batch = salesRows.slice(i, i + 1000)
      const { error: salesError } = await supabase.from('historical_sales').insert(batch)
      if (salesError) throw salesError
    }

    const { data: inv } = await supabase.from('inventory').select('*, products(name, sku, min_stock)')
    const alertRows: Record<string, unknown>[] = []
    
    if (inv) {
      for (const item of inv) {
        const prod = (item as Record<string, unknown>).products as Record<string, unknown> | null
        if (!prod) continue
        if (item.quantity < (prod.min_stock as number) * 0.3) {
          alertRows.push({
            type: 'stockout_risk',
            severity: 'critical',
            title: `Critical Stockout Risk: ${prod.name}`,
            description: `${prod.name} (${prod.sku}) stock at ${item.quantity} units, well below minimum of ${prod.min_stock}.`,
            region: regions[Math.floor(Math.random() * 5)],
            sku: prod.sku,
          })
        } else if (item.quantity > (prod.min_stock as number) * 4) {
          alertRows.push({
            type: 'overstock',
            severity: 'info',
            title: `Overstock: ${prod.name}`,
            description: `${prod.name} exceeds optimal levels at ${item.quantity} units (min: ${prod.min_stock}).`,
            region: regions[Math.floor(Math.random() * 5)],
            sku: prod.sku,
          })
        }
      }
    }

    if (alertRows.length > 0) {
      await supabase.from('alerts').insert(alertRows.slice(0, 15))
    }

    return new Response(JSON.stringify({
      success: true,
      inventory_count: inventoryRows.length,
      sales_count: salesRows.length,
      alerts_count: Math.min(alertRows.length, 15),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
