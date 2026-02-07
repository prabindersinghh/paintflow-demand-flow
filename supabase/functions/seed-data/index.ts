import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Indian paint industry seasonal patterns
const SEASONAL_FACTORS: Record<number, number> = {
  0: 0.70,  // Jan - post-wedding low
  1: 0.75,  // Feb - slow
  2: 0.90,  // Mar - Holi bump
  3: 1.15,  // Apr - pre-summer
  4: 1.25,  // May - summer construction peak
  5: 0.65,  // Jun - monsoon dip
  6: 0.55,  // Jul - heavy monsoon
  7: 0.60,  // Aug - monsoon continues
  8: 0.95,  // Sep - monsoon recedes
  9: 1.40,  // Oct - Navratri/Dussehra surge
  10: 1.55, // Nov - Diwali peak
  11: 1.00, // Dec - moderate/weddings
}

// Regional demand multipliers
const REGION_MULTIPLIERS: Record<string, number> = {
  North: 1.1,
  South: 1.2,
  East: 0.85,
  West: 1.15,
  Central: 0.9,
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
    const chainForecast = body.chain_forecast !== false // default true

    // Get existing master data
    const { data: products } = await supabase.from('products').select('id, sku, name, category, min_stock, unit_price')
    const { data: warehouses } = await supabase.from('warehouses').select('id, name, region, capacity')
    const { data: dealers } = await supabase.from('dealers').select('id, name, region, warehouse_id')

    if (!products || products.length === 0) throw new Error('No products found. Seed products first.')
    if (!warehouses || warehouses.length === 0) throw new Error('No warehouses found. Seed warehouses first.')

    // ─── 1. CLEAR OLD SEEDED DATA ───
    await Promise.all([
      supabase.from('planned_actions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('inventory_projection').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('recommendations').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('inventory_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('forecasts').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('historical_sales').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('activity_log').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ])

    // ─── 2. SEED INVENTORY ───
    // Realistic distribution: some low, some optimal, some overstocked
    const inventoryRows: { warehouse_id: string; product_id: string; quantity: number }[] = []
    const categoryBias: Record<string, number> = {
      'Interior': 1.3, 'Exterior': 1.0, 'Industrial': 0.7, 'Specialty': 0.5,
    }

    for (const wh of warehouses) {
      for (const prod of products) {
        const bias = categoryBias[prod.category] || 1.0
        const regionBias = REGION_MULTIPLIERS[wh.region] || 1.0
        const rand = Math.random()
        let qty: number
        if (rand < 0.12) {
          // Critically low (12%)
          qty = Math.floor(prod.min_stock * 0.15 * (0.5 + Math.random()))
        } else if (rand < 0.28) {
          // Below safety (16%)
          qty = Math.floor(prod.min_stock * (0.4 + Math.random() * 0.5))
        } else if (rand < 0.82) {
          // Optimal (54%)
          qty = Math.floor(prod.min_stock * (1.2 + Math.random() * 1.8) * bias * regionBias)
        } else {
          // Overstocked (18%)
          qty = Math.floor(prod.min_stock * (4 + Math.random() * 3) * bias)
        }
        inventoryRows.push({ warehouse_id: wh.id, product_id: prod.id, quantity: Math.max(1, qty) })
      }
    }

    const { error: invError } = await supabase.from('inventory').upsert(inventoryRows, { onConflict: 'warehouse_id,product_id' })
    if (invError) throw invError

    // ─── 3. SEED 90 DAYS HISTORICAL SALES ───
    const regions = ['North', 'South', 'East', 'West', 'Central']
    const today = new Date()
    const salesRows: { product_id: string; region: string; sale_date: string; quantity: number }[] = []

    // Generate base demand per product-region (persistent across days for consistency)
    const baseDemand: Record<string, number> = {}
    for (const product of products) {
      const catMultiplier = categoryBias[product.category] || 1.0
      for (const region of regions) {
        const regionMult = REGION_MULTIPLIERS[region] || 1.0
        baseDemand[`${product.id}_${region}`] = (12 + Math.random() * 45) * catMultiplier * regionMult
      }
    }

    for (const product of products) {
      for (const region of regions) {
        const base = baseDemand[`${product.id}_${region}`]
        let trend = 1.0 // Simulate a gradual trend

        for (let dayOffset = 90; dayOffset >= 1; dayOffset--) {
          const date = new Date(today)
          date.setDate(date.getDate() - dayOffset)
          const month = date.getMonth()
          const dow = date.getDay()

          // Trend: slight upward over 90 days
          trend = 1.0 + (90 - dayOffset) * 0.001

          // Weekend dip
          const weekdayFactor = dow === 0 ? 0.35 : dow === 6 ? 0.55 : 1.0

          // Seasonal factor
          const seasonFactor = SEASONAL_FACTORS[month] || 1.0

          // Holi boost (around mid-March)
          let eventBoost = 1.0
          if (month === 2 && date.getDate() >= 12 && date.getDate() <= 18) {
            eventBoost = 1.6 // Holi color festival → paint demand spike
          }
          // Diwali boost (late Oct - early Nov)
          if ((month === 9 && date.getDate() >= 20) || (month === 10 && date.getDate() <= 10)) {
            eventBoost = 1.8
          }

          // Random noise
          const noise = 0.65 + Math.random() * 0.7

          const qty = Math.max(1, Math.round(base * seasonFactor * weekdayFactor * trend * eventBoost * noise))
          salesRows.push({
            product_id: product.id,
            region,
            sale_date: date.toISOString().split('T')[0],
            quantity: qty,
          })
        }
      }
    }

    // Insert sales in batches of 1000
    for (let i = 0; i < salesRows.length; i += 1000) {
      const batch = salesRows.slice(i, i + 1000)
      const { error } = await supabase.from('historical_sales').insert(batch)
      if (error) throw error
    }

    // ─── 4. SEED PAST INVENTORY MOVEMENTS (last 30 days) ───
    const movementRows: {
      source_warehouse_id?: string;
      destination_warehouse_id?: string;
      product_id: string;
      quantity: number;
      movement_type: string;
      status: string;
      created_at: string;
    }[] = []

    // Generate ~40 past transfers and reorders
    for (let i = 0; i < 25; i++) {
      const dayOffset = Math.floor(Math.random() * 30) + 1
      const moveDate = new Date(today)
      moveDate.setDate(moveDate.getDate() - dayOffset)
      const product = products[Math.floor(Math.random() * products.length)]
      const qty = 20 + Math.floor(Math.random() * 150)

      if (Math.random() < 0.6 && warehouses.length >= 2) {
        // Transfer between warehouses
        const srcIdx = Math.floor(Math.random() * warehouses.length)
        let destIdx = Math.floor(Math.random() * warehouses.length)
        while (destIdx === srcIdx) destIdx = Math.floor(Math.random() * warehouses.length)

        movementRows.push({
          source_warehouse_id: warehouses[srcIdx].id,
          destination_warehouse_id: warehouses[destIdx].id,
          product_id: product.id,
          quantity: qty,
          movement_type: 'transfer',
          status: 'completed',
          created_at: moveDate.toISOString(),
        })
      } else {
        // Reorder (inbound from supplier)
        const wh = warehouses[Math.floor(Math.random() * warehouses.length)]
        movementRows.push({
          destination_warehouse_id: wh.id,
          product_id: product.id,
          quantity: qty + 50,
          movement_type: 'reorder',
          status: 'completed',
          created_at: moveDate.toISOString(),
        })
      }
    }

    // Dealer orders (past)
    if (dealers && dealers.length > 0) {
      for (let i = 0; i < 15; i++) {
        const dayOffset = Math.floor(Math.random() * 30) + 1
        const moveDate = new Date(today)
        moveDate.setDate(moveDate.getDate() - dayOffset)
        const dealer = dealers[Math.floor(Math.random() * dealers.length)]
        const product = products[Math.floor(Math.random() * products.length)]

        movementRows.push({
          source_warehouse_id: dealer.warehouse_id || warehouses[0].id,
          product_id: product.id,
          quantity: 10 + Math.floor(Math.random() * 80),
          movement_type: 'order',
          status: 'completed',
          created_at: moveDate.toISOString(),
        })
      }
    }

    if (movementRows.length > 0) {
      await supabase.from('inventory_movements').insert(movementRows)
    }

    // ─── 5. SEED ACTIVITY LOG ───
    const activityRows: { user_name: string; action: string; entity_type: string; details: Record<string, unknown>; created_at: string }[] = []
    const actions = ['forecast_run', 'recommendations_generated', 'transfer_executed', 'reorder_executed', 'order_placed', 'alerts_evaluated', 'plan_approved', 'plan_executed']
    const users = ['Rajesh Kumar', 'Priya Sharma', 'System', 'Admin', 'Deepak Patel']

    for (let i = 0; i < 30; i++) {
      const dayOffset = Math.floor(Math.random() * 30) + 1
      const logDate = new Date(today)
      logDate.setDate(logDate.getDate() - dayOffset)

      activityRows.push({
        user_name: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        entity_type: 'system',
        details: { seeded: true, day: dayOffset },
        created_at: logDate.toISOString(),
      })
    }

    await supabase.from('activity_log').insert(activityRows)

    // ─── 6. SEED INITIAL ALERTS ───
    const { data: freshInventory } = await supabase.from('inventory').select('*, products(name, sku, min_stock), warehouses(name, region)')
    const alertRows: { type: string; severity: string; title: string; description: string; region: string; sku?: string }[] = []

    if (freshInventory) {
      for (const item of freshInventory) {
        const prod = (item as Record<string, unknown>).products as Record<string, unknown> | null
        const wh = (item as Record<string, unknown>).warehouses as Record<string, string> | null
        if (!prod) continue

        if (item.quantity < (prod.min_stock as number) * 0.3) {
          alertRows.push({
            type: 'stockout_risk',
            severity: 'critical',
            title: `Critical: ${prod.name}`,
            description: `Only ${item.quantity} units at ${wh?.name || 'warehouse'} (min: ${prod.min_stock}). Immediate planning required.`,
            region: wh?.region || 'Central',
            sku: prod.sku as string,
          })
        } else if (item.quantity < (prod.min_stock as number)) {
          alertRows.push({
            type: 'stockout_risk',
            severity: 'warning',
            title: `Low Stock: ${prod.name}`,
            description: `${item.quantity} units at ${wh?.name || 'warehouse'}, below safety stock of ${prod.min_stock}.`,
            region: wh?.region || 'Central',
            sku: prod.sku as string,
          })
        }
      }
    }

    if (alertRows.length > 0) {
      await supabase.from('alerts').insert(alertRows.slice(0, 20))
    }

    // ─── 7. CHAIN: FORECAST → RECOMMENDATIONS ───
    let forecastResult = null
    let planResult = null

    if (chainForecast) {
      const baseUrl = Deno.env.get('SUPABASE_URL')!
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

      // Run forecast
      const fcRes = await fetch(`${baseUrl}/functions/v1/run-forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify({ user_name: 'System (Auto-Seed)' }),
      })
      forecastResult = await fcRes.json()

      // Run recommendations (planning mode)
      const recRes = await fetch(`${baseUrl}/functions/v1/run-recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify({ user_name: 'System (Auto-Seed)' }),
      })
      planResult = await recRes.json()

      // Evaluate alerts with projections
      await fetch(`${baseUrl}/functions/v1/evaluate-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify({}),
      })
    }

    return new Response(JSON.stringify({
      success: true,
      seeded: {
        inventory: inventoryRows.length,
        historical_sales: salesRows.length,
        movements: movementRows.length,
        activity_log: activityRows.length,
        alerts: Math.min(alertRows.length, 20),
      },
      chained: chainForecast ? {
        forecast: forecastResult,
        plan: planResult,
      } : null,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
