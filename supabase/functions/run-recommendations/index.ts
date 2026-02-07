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

    // Get all products with min_stock
    const { data: products } = await supabase.from('products').select('id, name, sku, min_stock')
    if (!products) throw new Error('No products found')

    // Get all warehouses
    const { data: warehouses } = await supabase.from('warehouses').select('id, name, region')
    if (!warehouses) throw new Error('No warehouses found')

    // Get all inventory
    const { data: inventory } = await supabase.from('inventory').select('*')
    if (!inventory) throw new Error('No inventory found')

    // Get all dealers
    const { data: dealers } = await supabase.from('dealers').select('id, name, region, warehouse_id')

    // Get next 7 days forecast aggregated by product
    const today = new Date()
    const weekAhead = new Date(today)
    weekAhead.setDate(weekAhead.getDate() + 7)
    
    const { data: forecasts } = await supabase
      .from('forecasts')
      .select('product_id, region, predicted_demand')
      .gte('forecast_date', today.toISOString().split('T')[0])
      .lte('forecast_date', weekAhead.toISOString().split('T')[0])

    // Aggregate forecast demand per product per region
    const forecastMap: Record<string, number> = {}
    if (forecasts) {
      for (const f of forecasts) {
        const key = `${f.product_id}_${f.region}`
        forecastMap[key] = (forecastMap[key] || 0) + f.predicted_demand
      }
    }

    // Clear old pending recommendations (keep approved/executed)
    await supabase.from('recommendations').delete().eq('status', 'pending')

    const recommendations: any[] = []

    // Check each warehouse-product combo
    for (const wh of warehouses) {
      for (const product of products) {
        const invItem = inventory.find(i => i.warehouse_id === wh.id && i.product_id === product.id)
        const currentStock = invItem?.quantity || 0
        const safetyStock = product.min_stock
        const forecastDemand = forecastMap[`${product.id}_${wh.region}`] || 0
        const fiveDayDemand = Math.round(forecastDemand * 5 / 7)

        // Reorder recommendation: if stock below safety
        if (currentStock < safetyStock) {
          const deficit = safetyStock * 2 - currentStock // Order up to 2x safety stock
          
          // Check if another warehouse has surplus
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
              reason: `${product.name} at ${currentStock} units (safety: ${safetyStock}). Surplus available at ${transferSource.name}.`,
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
        // Pick top 2 products where dealer's region has high demand
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
              quantity: Math.round(demand / 7 * 5), // 5 day supply
              reason: `High demand predicted in ${dealer.region}: ${demand} units/week. Order to avoid stockout.`,
              priority: demand > product.min_stock ? 'high' : 'medium',
              ai_confidence: Math.round(78 + Math.random() * 17),
              status: 'pending',
            })
          }
        }
      }
    }

    // Insert recommendations (limit to top 20 most important)
    const sorted = recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 2)
    }).slice(0, 20)

    if (sorted.length > 0) {
      const { error } = await supabase.from('recommendations').insert(sorted)
      if (error) throw error
    }

    // Log activity
    await supabase.from('activity_log').insert({
      user_name: body.user_name || 'System',
      action: 'recommendations_generated',
      entity_type: 'recommendation',
      details: { count: sorted.length },
    })

    return new Response(JSON.stringify({
      success: true,
      recommendations_generated: sorted.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
