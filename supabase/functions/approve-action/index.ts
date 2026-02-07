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
      await supabase.from('recommendations').update({ status: 'rejected' }).eq('id', recommendation_id)
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
      // Get warehouses to find IDs from names
      const { data: warehouses } = await supabase.from('warehouses').select('id, name')
      
      if (rec.type === 'transfer') {
        const sourceWh = warehouses?.find(w => w.name === rec.from_location)
        const destWh = warehouses?.find(w => w.name === rec.to_location)
        
        if (!sourceWh || !destWh) {
          return new Response(JSON.stringify({ error: 'Warehouse not found for transfer' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const { data: result } = await supabase.rpc('execute_transfer', {
          p_recommendation_id: recommendation_id,
          p_source_warehouse_id: sourceWh.id,
          p_dest_warehouse_id: destWh.id,
          p_product_id: rec.product_id,
          p_quantity: rec.quantity,
          p_user_name: user_name || 'Admin',
        })

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else if (rec.type === 'reorder') {
        // For reorder, just mark as approved and add stock
        const destWh = warehouses?.find(w => w.name === rec.to_location)
        if (!destWh) {
          return new Response(JSON.stringify({ error: 'Warehouse not found' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Add stock (simulates receiving from supplier)
        await supabase
          .from('inventory')
          .update({ quantity: supabase.rpc ? rec.quantity : rec.quantity })

        // Actually just use raw upsert
        const { data: currentInv } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('warehouse_id', destWh.id)
          .eq('product_id', rec.product_id)
          .maybeSingle()

        const newQty = (currentInv?.quantity || 0) + rec.quantity
        await supabase
          .from('inventory')
          .upsert({
            warehouse_id: destWh.id,
            product_id: rec.product_id,
            quantity: newQty,
            last_updated: new Date().toISOString(),
          }, { onConflict: 'warehouse_id,product_id' })

        await supabase.from('recommendations').update({ status: 'executed', executed_at: new Date().toISOString() }).eq('id', recommendation_id)

        await supabase.from('inventory_movements').insert({
          recommendation_id,
          destination_warehouse_id: destWh.id,
          product_id: rec.product_id,
          quantity: rec.quantity,
          movement_type: 'reorder',
        })

        await supabase.from('activity_log').insert({
          user_name: user_name || 'Admin',
          action: 'reorder_executed',
          entity_type: 'recommendation',
          entity_id: recommendation_id,
          details: { product_id: rec.product_id, quantity: rec.quantity, warehouse: destWh.name },
        })

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else if (rec.type === 'order') {
        // Dealer order - find dealer and their warehouse
        const { data: dealers } = await supabase.from('dealers').select('id, name, warehouse_id').eq('name', rec.to_location)
        const dealer = dealers?.[0]
        
        if (!dealer || !dealer.warehouse_id) {
          return new Response(JSON.stringify({ error: 'Dealer not found' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const { data: result } = await supabase.rpc('execute_dealer_order', {
          p_dealer_id: dealer.id,
          p_product_id: rec.product_id,
          p_quantity: rec.quantity,
          p_warehouse_id: dealer.warehouse_id,
          p_recommendation_id: recommendation_id,
          p_user_name: user_name || 'Dealer',
        })

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
