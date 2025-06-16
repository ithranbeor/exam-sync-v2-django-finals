/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const body = await req.json();

    const {
      user_id,
      username,
      first_name,
      last_name,
      middle_name,
      email_address,
      contact_number,
      status,
      password,
      role_ids,
    } = body;

    if (
      !user_id ||
      !username ||
      !first_name ||
      !last_name ||
      !email_address ||
      !password ||
      !Array.isArray(role_ids) ||
      role_ids.length === 0
    ) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Create user in Supabase Auth
    const { data: _authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email_address,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error(authError);
      return new Response(JSON.stringify({ message: 'Auth error', error: authError.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 2. Insert into tbl_users
    const { error: insertError } = await supabaseAdmin.from('tbl_users').insert([{
      user_id,
      username,
      first_name,
      last_name,
      middle_name,
      email_address,
      contact_number,
      status,
      password,
    }]);

    if (insertError) {
      console.error(insertError);
      return new Response(JSON.stringify({ message: 'Failed to insert user', error: insertError }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 3. Assign roles
    const roleInserts = role_ids.map((rid: string) => ({
      user_id,
      role_id: rid,
    }));

    const { error: roleError } = await supabaseAdmin.from('tbl_user_roles').insert(roleInserts);

    if (roleError) {
      console.error(roleError);
      return new Response(JSON.stringify({
        message: 'User created but failed role assignment',
        error: roleError,
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(JSON.stringify({ message: 'Created successfully' }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: 'Unexpected error', error: (err as Error).message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
