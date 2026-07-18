// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get the auth event from the webhook
    const payload = await req.json()
    const { event, table, record, old_record } = payload

    // Only handle INSERT events (new user created)
    if (event !== 'INSERT') {
      return new Response(
        JSON.stringify({ message: 'Event not handled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract user data from the auth event
    const { id, email, raw_user_meta_data } = record
    
    // Get the full name from metadata
    const fullName = raw_user_meta_data?.full_name || 
                     raw_user_meta_data?.name || 
                     email?.split('@')[0] || 
                     'Usuario'
    
    // Get the avatar URL from metadata
    const avatarUrl = raw_user_meta_data?.avatar_url || 
                      raw_user_meta_data?.picture || 
                      null
    
    // Get the provider
    const provider = raw_user_meta_data?.provider || 'email'
    const providerId = raw_user_meta_data?.provider_id || null

    // Insert or update the user profile in the users table
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: id,
        email: email,
        full_name: fullName,
        avatar_url: avatarUrl,
        provider: provider,
        provider_id: providerId,
        plan_type: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      })
      .select()
      .single()

    if (error) {
      console.error('Error syncing profile:', error)
      throw error
    }

    console.log('Profile synced successfully:', data)

    return new Response(
      JSON.stringify({ 
        message: 'Profile synced successfully',
        user: data 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
