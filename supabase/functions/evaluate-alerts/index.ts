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
    const { data: inventory } = await supabase.from('inventory').select('*, warehouses(name, region)')

    if (!products || !inventory) throw new Error('Missing data')

    const today = new Date()
    const sevenAgo = new Date(today); sevenAgo.setDate(sevenAgo.getDate() - 7)
    const fourteenAgo = new Date(today); fourteenAgo.setDate(fourteenAgo.getDate() - 14)

    const { data: recentSales } = await supabase
      .from('historical_sales')
      .select('product_id, region, quantity, sale_date')
      .gte('sale_date', fourteenAgo.toISOString().split('T')[0])

    const demandByProductRegion: Record<string, { recent: number; previous: number }> = {}
    if (recentSales) {
      for (const sale of recentSales) {
        const key = `${sale.product_id}_${sale.region}`
        if (!demandByProductRegion[key]) demandByProductRegion[key] = { recent: 0, previous: 0 }
        const saleDate = new Date(sale.sale_date)
        if (saleDate >= sevenAgo) {
          demandByProductRegion[key].recent += sale.quantity
        } else {
          demandByProductRegion[key].previous += sale.quantity
        }
      }
    }

    const { data: existingAlerts } = await supabase
      .from('alerts')
      .select('id')
      .order('created_at', { ascending: false })
      .range(50, 1000)
    
    if (existingAlerts && existingAlerts.length > 0) {
      await supabase.from('alerts').delete().in('id', existingAlerts.map(a => a.id))
    }

    const newAlerts: Record<string, unknown>[] = []

    for (const item of inventory) {
      const product = products.find(p => p.id === item.product_id)
      if (!product) continue
      const wh = (item as Record<string, unknown>).warehouses as Record<string, string> | null

      if (item.quantity < product.min_stock * 0.3) {
        newAlerts.push({
          type: 'stockout_risk',
          severity: 'critical',
          title: `Critical Stockout: ${product.name}`,
          description: `Only ${item.quantity} units remaining at ${wh?.name || 'warehouse'} (min: ${product.min_stock}). Immediate action required.`,
          region: wh?.region || 'Central',
          sku: product.sku,
        })
      } else if (item.quantity < product.min_stock) {
        newAlerts.push({
          type: 'stockout_risk',
          severity: 'warning',
          title: `Low Stock: ${product.name}`,
          description: `${item.quantity} units at ${wh?.name || 'warehouse'}, below safety stock of ${product.min_stock}.`,
          region: wh?.region || 'Central',
          sku: product.sku,
        })
      }

      if (item.quantity > product.min_stock * 5) {
        newAlerts.push({
          type: 'overstock',
          severity: 'info',
          title: `Overstock: ${product.name}`,
          description: `${item.quantity} units at ${wh?.name || 'warehouse'} exceeds optimal levels by ${Math.round((item.quantity / product.min_stock - 1) * 100)}%.`,
          region: wh?.region || 'Central',
          sku: product.sku,
        })
      }
    }

    // Also check projected inventory for FUTURE risks
    const { data: projections } = await supabase
      .from('inventory_projection')
      .select('*, products:product_id(name, sku, min_stock), warehouses:warehouse_id(name, region)')
    
    if (projections) {
      for (const proj of projections) {
        const prod = (proj as Record<string, unknown>).products as Record<string, unknown> | null
        const wh = (proj as Record<string, unknown>).warehouses as Record<string, string> | null
        if (!prod) continue

        if (proj.projected_quantity < (prod.min_stock as number) * 0.3) {
          newAlerts.push({
            type: 'projected_stockout',
            severity: 'warning',
            title: `Projected Stockout: ${prod.name} by ${proj.projected_date}`,
            description: `Projected to ${proj.projected_quantity} units at ${wh?.name || 'warehouse'} by ${proj.projected_date}. Plan actions to prevent.`,
            region: wh?.region || 'Central',
            sku: prod.sku as string,
          })
        }
      }
    }

    for (const [key, data] of Object.entries(demandByProductRegion)) {
      const [productId, region] = key.split('_')
      const product = products.find(p => p.id === productId)
      if (!product || data.previous === 0) continue
      
      const changePercent = ((data.recent - data.previous) / data.previous) * 100
      if (changePercent > 30) {
        newAlerts.push({
          type: 'demand_spike',
          severity: 'warning',
          title: `Demand Spike: ${product.name}`,
          description: `${Math.round(changePercent)}% increase in demand in ${region} region over last 7 days.`,
          region,
          sku: product.sku,
        })
      }
    }

    const month = today.getMonth()
    if (month >= 8 && month <= 10) {
      newAlerts.push({
        type: 'seasonal',
        severity: 'info',
        title: 'Festival Season Active',
        description: 'Diwali/festival season driving higher interior paint demand across all regions.',
        region: 'Central',
      })
    }

    if (newAlerts.length > 0) {
      const { error } = await supabase.from('alerts').insert(newAlerts.slice(0, 25))
      if (error) throw error
    }

    await supabase.from('activity_log').insert({
      user_name: 'System',
      action: 'alerts_evaluated',
      entity_type: 'alert',
      details: { alerts_generated: Math.min(newAlerts.length, 25) },
    })

    return new Response(JSON.stringify({
      success: true,
      alerts_generated: Math.min(newAlerts.length, 25),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
