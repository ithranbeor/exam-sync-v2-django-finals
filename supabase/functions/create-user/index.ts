import { serve } from 'https://deno.land/std@0.202.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

// Supabase client with service role key
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  try {
    const body = await req.json()

    const {
      user_id,
      email_address,
      password,
      username,
      first_name,
      last_name,
      middle_name,
      contact_number,
      status,
      role_ids,
    } = body

    if (!user_id || !email_address || !password || !first_name || !last_name || !role_ids?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
      })
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email_address,
      password,
      email_confirm: true,
      user_metadata: {
        user_id,
        first_name,
        last_name,
        middle_name,
        contact_number,
        status,
        username,
      },
    })

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
      })
    }

    // Create user in tbl_users
    const { error: userInsertError } = await supabase.from('tbl_users').insert([
      {
        user_id,
        username,
        first_name,
        last_name,
        middle_name,
        email_address,
        contact_number,
        status,
        password, // optional: remove if not storing plaintext
      },
    ])

    if (userInsertError) {
      return new Response(JSON.stringify({ error: userInsertError.message }), {
        status: 500,
      })
    }

    // Assign roles
    const roleInserts = role_ids.map((rid: string) => ({ user_id, role_id: rid }))
    const { error: roleError } = await supabase.from('tbl_user_roles').insert(roleInserts)

    if (roleError) {
      return new Response(JSON.stringify({ error: 'User created but role assignment failed' }), {
        status: 500,
      })
    }

    return new Response(JSON.stringify({ message: 'User created successfully', auth_user_id: authData.user?.id }), {
      status: 200,
    })
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Invalid request body or server error' }), {
      status: 500,
    })
  }
})
