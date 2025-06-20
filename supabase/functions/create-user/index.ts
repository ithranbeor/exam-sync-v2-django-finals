/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

serve(async (req) => {
  // CORS preflight
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
      first_name,
      last_name,
      middle_name,
      email_address,
      contact_number,
      status,
      password,
    } = body;

    // Validate required fields
    if (
      !user_id ||
      !first_name ||
      !last_name ||
      !email_address ||
      !contact_number ||
      !status ||
      !password
    ) {
      return new Response(
        JSON.stringify({ message: 'Missing required fields' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Create user in Supabase Auth
    const { data: _authData, error: authError } = await supabase.auth.admin.createUser({
      email: email_address,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth Error:', authError);
      return new Response(
        JSON.stringify({ message: 'Auth error', error: authError.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 2. Insert user metadata
    const { error: insertError } = await supabase.from('tbl_users').insert([
      {
        user_id,
        first_name,
        last_name,
        middle_name,
        email_address,
        contact_number,
        status,
        password, // Only if you need to store plaintext (not recommended). Otherwise, remove this line.
      },
    ]);

    if (insertError) {
      console.error('Insert Error:', insertError);
      return new Response(
        JSON.stringify({ message: 'Failed to insert into tbl_users', error: insertError.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Account created successfully!' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('Unexpected Error:', err);
    return new Response(
      JSON.stringify({
        message: 'Unexpected error',
        error: typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : String(err),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
