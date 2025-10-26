import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../db/supabase.client";
import { validateSession } from "@/lib/server/session-validation.service";
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
    const supabase = createSupabaseServerClient(context.request, context.cookies);

    // Set the session using the tokens
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      return new Response(JSON.stringify({ error: "Failed to establish session" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // SECURITY: Validate the session server-side after setting it
    const validatedUser = await validateSession(supabase);
    if (!validatedUser) {
      return new Response(JSON.stringify({ error: "Session validation failed" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        needsRegistration: false, // We removed username logic, so no additional registration needed
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
