import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../db/supabase.client";
import { z } from "zod";

const sessionSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { access_token, refresh_token } = sessionSchema.parse(body);

    // Create Supabase client
    const supabase = createSupabaseServerClient(context.cookies);

    // Set the session using the tokens
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.error("Session establishment error:", error);
      return new Response(JSON.stringify({ error: "Failed to establish session" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if this is a new user (no profile exists)
    let isNewUser = false;
    if (data.user?.id) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();
      isNewUser = profileError?.code === "PGRST116"; // No rows returned
    }

    return new Response(JSON.stringify({
      success: true,
      needsRegistration: false, // We removed username logic, so no additional registration needed
      isNewUser,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Session API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
