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
    const userName = body.user_name || 'Admin'

    // Get all approved planned actions
    const { data: approvedPlans, error: planErr } = await supabase
      .from('planned_actions')
      .select('*, recommendations(*)')
      .eq('status', 'approved')
      .order('created_at')

    if (planErr) throw planErr
    if (!approvedPlans || approvedPlans.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        executed: 0, 
        message: 'No approved plans to execute.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get warehouses for name-to-id lookup
    const { data: warehouses } = await supabase.from('warehouses').select('id, name')
    const { data: dealers } = await supabase.from('dealers').select('id, name, warehouse_id')

    let executed = 0
    const errors: string[] = []

    for (const plan of approvedPlans) {
      try {
        if (plan.action_type === 'transfer') {
          const sourceWh = warehouses?.find(w => w.name === plan.from_location)
          const destWh = warehouses?.find(w => w.name === plan.to_location)
          
          if (!sourceWh || !destWh) {
            errors.push(`Transfer skipped: warehouse not found for ${plan.from_location} → ${plan.to_location}`)
            continue
          }

          const { data: result } = await supabase.rpc('execute_transfer', {
            p_recommendation_id: plan.recommendation_id,
            p_source_warehouse_id: sourceWh.id,
            p_dest_warehouse_id: destWh.id,
            p_product_id: plan.product_id,
            p_quantity: plan.quantity,
            p_user_name: userName,
          })

          if (result && typeof result === 'object' && 'success' in result && !(result as Record<string, unknown>).success) {
            errors.push(`Transfer failed: ${(result as Record<string, unknown>).error}`)
            continue
          }
        } else if (plan.action_type === 'reorder') {
          const destWh = warehouses?.find(w => w.name === plan.to_location)
          if (!destWh) {
            errors.push(`Reorder skipped: warehouse ${plan.to_location} not found`)
            continue
          }

          // Add stock (simulates receiving from supplier)
          const { data: currentInv } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('warehouse_id', destWh.id)
            .eq('product_id', plan.product_id)
            .maybeSingle()

          const newQty = (currentInv?.quantity || 0) + plan.quantity
          await supabase.from('inventory').upsert({
            warehouse_id: destWh.id,
            product_id: plan.product_id,
            quantity: newQty,
            last_updated: new Date().toISOString(),
          }, { onConflict: 'warehouse_id,product_id' })

          // Update recommendation
          if (plan.recommendation_id) {
            await supabase.from('recommendations')
              .update({ status: 'executed', executed_at: new Date().toISOString() })
              .eq('id', plan.recommendation_id)
          }

          await supabase.from('inventory_movements').insert({
            recommendation_id: plan.recommendation_id,
            destination_warehouse_id: destWh.id,
            product_id: plan.product_id,
            quantity: plan.quantity,
            movement_type: 'reorder',
          })

          await supabase.from('activity_log').insert({
            user_name: userName,
            action: 'reorder_executed',
            entity_type: 'planned_action',
            entity_id: plan.id,
            details: { product_id: plan.product_id, quantity: plan.quantity, warehouse: destWh.name },
          })
        } else if (plan.action_type === 'order') {
          const dealer = dealers?.find(d => d.name === plan.to_location)
          if (!dealer || !dealer.warehouse_id) {
            errors.push(`Order skipped: dealer ${plan.to_location} not found`)
            continue
          }

          const { data: result } = await supabase.rpc('execute_dealer_order', {
            p_dealer_id: dealer.id,
            p_product_id: plan.product_id,
            p_quantity: plan.quantity,
            p_warehouse_id: dealer.warehouse_id,
            p_recommendation_id: plan.recommendation_id,
            p_user_name: userName,
          })

          if (result && typeof result === 'object' && 'success' in result && !(result as Record<string, unknown>).success) {
            errors.push(`Order failed: ${(result as Record<string, unknown>).error}`)
            continue
          }
        }

        // Mark planned action as executed
        await supabase.from('planned_actions')
          .update({ status: 'executed', executed_at: new Date().toISOString() })
          .eq('id', plan.id)

        // Update recommendation status
        if (plan.recommendation_id) {
          await supabase.from('recommendations')
            .update({ status: 'executed', executed_at: new Date().toISOString() })
            .eq('id', plan.recommendation_id)
        }

        executed++
      } catch (planError: unknown) {
        const msg = planError instanceof Error ? planError.message : 'Unknown error'
        errors.push(`Plan ${plan.id}: ${msg}`)
      }
    }

    // Log the execution event
    await supabase.from('activity_log').insert({
      user_name: userName,
      action: 'plan_executed',
      entity_type: 'plan',
      details: { executed, total: approvedPlans.length, errors: errors.length },
    })

    return new Response(JSON.stringify({
      success: true,
      executed,
      total: approvedPlans.length,
      errors,
      message: `Executed ${executed}/${approvedPlans.length} planned actions.`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
