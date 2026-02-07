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
    const targetSku = body.sku || null
    const targetRegion = body.region || null

    let productQuery = supabase.from('products').select('id, sku, min_stock')
    if (targetSku) productQuery = productQuery.eq('sku', targetSku)
    const { data: products, error: pErr } = await productQuery
    if (pErr) throw pErr

    const regions = targetRegion ? [targetRegion] : ['North', 'South', 'East', 'West', 'Central']
    const today = new Date()
    
    const seasonality: Record<number, number> = {
      0: 0.7, 1: 0.75, 2: 0.9, 3: 1.2, 4: 1.3, 5: 1.1,
      6: 0.8, 7: 0.85, 8: 1.0, 9: 1.4, 10: 1.5, 11: 0.9,
    }

    const productIds = products!.map(p => p.id)
    await supabase.from('forecasts').delete().in('product_id', productIds).in('region', regions)

    const forecastRows: Record<string, unknown>[] = []

    for (const product of products!) {
      for (const region of regions) {
        const fourteenDaysAgo = new Date(today)
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
        
        const { data: recentSales } = await supabase
          .from('historical_sales')
          .select('quantity, sale_date')
          .eq('product_id', product.id)
          .eq('region', region)
          .gte('sale_date', fourteenDaysAgo.toISOString().split('T')[0])
          .order('sale_date', { ascending: true })

        const avgDemand = recentSales && recentSales.length > 0
          ? recentSales.reduce((sum: number, s: Record<string, unknown>) => sum + (s.quantity as number), 0) / recentSales.length
          : 20

        let trendFactor = 1.0
        if (recentSales && recentSales.length >= 7) {
          const firstHalf = recentSales.slice(0, Math.floor(recentSales.length / 2))
          const secondHalf = recentSales.slice(Math.floor(recentSales.length / 2))
          const avgFirst = firstHalf.reduce((s: number, r: Record<string, unknown>) => s + (r.quantity as number), 0) / firstHalf.length
          const avgSecond = secondHalf.reduce((s: number, r: Record<string, unknown>) => s + (r.quantity as number), 0) / secondHalf.length
          if (avgFirst > 0) {
            trendFactor = Math.max(0.8, Math.min(1.3, avgSecond / avgFirst))
          }
        }

        for (let day = 1; day <= 30; day++) {
          const forecastDate = new Date(today)
          forecastDate.setDate(forecastDate.getDate() + day)
          const month = forecastDate.getMonth()
          const dow = forecastDate.getDay()
          const weekdayFactor = (dow === 0 || dow === 6) ? 0.55 : 1.0
          const seasonFactor = seasonality[month] || 1.0
          
          const predicted = Math.max(1, Math.round(avgDemand * seasonFactor * trendFactor * weekdayFactor))
          const confidence = Math.min(95, Math.max(65, 85 - day * 0.5 + (recentSales?.length || 0) * 0.5))

          forecastRows.push({
            product_id: product.id,
            region,
            forecast_date: forecastDate.toISOString().split('T')[0],
            predicted_demand: predicted,
            confidence: Math.round(confidence * 10) / 10,
          })
        }
      }
    }

    for (let i = 0; i < forecastRows.length; i += 500) {
      const batch = forecastRows.slice(i, i + 500)
      const { error } = await supabase.from('forecasts').insert(batch)
      if (error) throw error
    }

    await supabase.from('activity_log').insert({
      user_name: body.user_name || 'System',
      action: 'forecast_run',
      entity_type: 'forecast',
      details: { products_count: products!.length, regions: regions.length, forecasts_generated: forecastRows.length },
    })

    return new Response(JSON.stringify({
      success: true,
      forecasts_generated: forecastRows.length,
      products_processed: products!.length,
      regions_processed: regions.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
