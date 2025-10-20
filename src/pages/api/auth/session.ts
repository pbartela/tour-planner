import type { APIRoute } from "astro";
import { createClient, type AuthChangeEvent, type Session } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { profileService } from "@/lib/services/profile.service";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const { event, session } = (await request.json()) as {
      event: AuthChangeEvent;
      session: Session | null;
    };

    if (event === "SIGNED_OUT" || !session) {
      // TODO: Handle signed out state, e.g., by clearing cookies
      return new Response(JSON.stringify({ success: true, needsRegistration: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { access_token, refresh_token } = session;

    if (!access_token || !refresh_token) {
      return new Response(JSON.stringify({ error: "Missing tokens" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create a Supabase client with the anon key to set the user's session
    const supabase = createClient<Database>(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    );

    // Set session from tokens
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

    if (!data.user) {
      return new Response(JSON.stringify({ error: "No user data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Now query with the authenticated client
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", data.user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Profile lookup error:", profileError);
      return new Response(JSON.stringify({ error: "Profile lookup failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If profile doesn't exist or username is null, user needs to complete registration
    const needsRegistration = !profile || !profile.username;

    return new Response(
      JSON.stringify({
        success: true,
        needsRegistration,
        user: { id: data.user.id, email: data.user.email },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected session error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
