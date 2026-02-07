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
    const body = await req.json()
    const { action, recommendation_id, user_name } = body

    if (!recommendation_id || !action) {
      return new Response(JSON.stringify({ error: 'Missing recommendation_id or action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get the recommendation
    const { data: rec, error: recErr } = await supabase
      .from('recommendations')
      .select('*')
      .eq('id', recommendation_id)
      .maybeSingle()

    if (recErr || !rec) {
      return new Response(JSON.stringify({ error: 'Recommendation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (rec.status !== 'pending') {
      return new Response(JSON.stringify({ error: `Recommendation already ${rec.status}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'reject') {
      // Reject recommendation and its planned action
      await supabase.from('recommendations').update({ status: 'rejected' }).eq('id', recommendation_id)
      await supabase.from('planned_actions').update({ status: 'rejected' }).eq('recommendation_id', recommendation_id)
      
      await supabase.from('activity_log').insert({
        user_name: user_name || 'Unknown',
        action: 'recommendation_rejected',
        entity_type: 'recommendation',
        entity_id: recommendation_id,
        details: { type: rec.type, product_id: rec.product_id },
      })

      return new Response(JSON.stringify({ success: true, action: 'rejected' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'approve') {
      // PLANNING MODE: Only mark as approved — DO NOT execute inventory changes
      await supabase.from('recommendations').update({ status: 'approved' }).eq('id', recommendation_id)
      
      // Update planned_action status to approved
      await supabase.from('planned_actions')
        .update({ 
          status: 'approved', 
          approved_by: user_name || 'Admin',
          approved_at: new Date().toISOString(),
        })
        .eq('recommendation_id', recommendation_id)

      await supabase.from('activity_log').insert({
        user_name: user_name || 'Admin',
        action: 'plan_approved',
        entity_type: 'recommendation',
        entity_id: recommendation_id,
        details: { 
          type: rec.type, 
          product_id: rec.product_id, 
          quantity: rec.quantity,
          note: 'Plan approved — awaiting execution',
        },
      })

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'approved',
        message: 'Plan approved. Use Execute Plan to apply changes to inventory.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
