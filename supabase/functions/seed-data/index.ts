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
    // Get all products and warehouses
    const { data: products } = await supabase.from('products').select('id, min_stock')
    const { data: warehouses } = await supabase.from('warehouses').select('id')
    
    if (!products || !warehouses) throw new Error('No products or warehouses found')

    // Seed inventory: each product in each warehouse
    const inventoryRows = []
    for (const wh of warehouses) {
      for (const prod of products) {
        // Realistic stock levels: some low, some optimal, some overstocked
        const rand = Math.random()
        let qty: number
        if (rand < 0.15) {
          qty = Math.floor(prod.min_stock * 0.3 * Math.random()) // Low stock
        } else if (rand < 0.85) {
          qty = Math.floor(prod.min_stock * (1.2 + Math.random() * 2)) // Optimal
        } else {
          qty = Math.floor(prod.min_stock * (4 + Math.random() * 3)) // Overstocked
        }
        inventoryRows.push({
          warehouse_id: wh.id,
          product_id: prod.id,
          quantity: qty,
        })
      }
    }

    // Batch insert inventory
    const { error: invError } = await supabase.from('inventory').upsert(inventoryRows, { onConflict: 'warehouse_id,product_id' })
    if (invError) throw invError

    // Seed 60 days of historical sales
    const regions = ['North', 'South', 'East', 'West', 'Central']
    const today = new Date()
    const salesRows: { product_id: string; region: string; sale_date: string; quantity: number }[] = []
    
    // Seasonality factors by month
    const seasonality: Record<number, number> = {
      0: 0.7, 1: 0.75, 2: 0.9, 3: 1.2, 4: 1.3, 5: 1.1,
      6: 0.8, 7: 0.85, 8: 1.0, 9: 1.4, 10: 1.5, 11: 0.9,
    }

    for (const product of products) {
      for (const region of regions) {
        const baseDemand = 15 + Math.random() * 50 // Base daily demand varies by product-region
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

    // Insert in batches of 1000
    for (let i = 0; i < salesRows.length; i += 1000) {
      const batch = salesRows.slice(i, i + 1000)
      const { error: salesError } = await supabase.from('historical_sales').insert(batch)
      if (salesError) throw salesError
    }

    // Seed initial alerts based on actual inventory
    const { data: inventory } = await supabase.from('inventory').select('*, products(name, sku, min_stock)')
    const alertRows: { type: string; severity: string; title: string; description: string; region: string; sku: string | null }[] = []
    
    if (inventory) {
      for (const item of inventory) {
        const prod = (item as any).products
        if (!prod) continue
        if (item.quantity < prod.min_stock * 0.3) {
          const wh = warehouses.find(w => w.id === item.warehouse_id)
          alertRows.push({
            type: 'stockout_risk',
            severity: 'critical',
            title: `Critical Stockout Risk: ${prod.name}`,
            description: `${prod.name} (${prod.sku}) stock at ${item.quantity} units, well below minimum of ${prod.min_stock}.`,
            region: regions[Math.floor(Math.random() * 5)],
            sku: prod.sku,
          })
        } else if (item.quantity > prod.min_stock * 4) {
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
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
