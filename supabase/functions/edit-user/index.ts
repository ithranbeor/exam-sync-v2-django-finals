/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Only POST allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
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
    } = body;

    if (
      !user_id || !first_name || !last_name || !email_address || !contact_number || !status
    ) {
      return new Response(JSON.stringify({ message: "Missing required fields" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase
      .from("tbl_users")
      .update({
        first_name,
        last_name,
        middle_name,
        email_address,
        contact_number,
        status: normalizedStatus,
      })
      .eq("user_id", user_id);

    if (error) {
      console.error("DB Update Error:", error);
      return new Response(JSON.stringify({ message: "Failed to update user", error: error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new Response(JSON.stringify({ message: "User updated successfully" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({
      message: "Unexpected server error",
      error: typeof err === "object" && err !== null && "message" in err
        ? err.message
        : String(err),
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
