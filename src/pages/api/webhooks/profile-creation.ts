import type { APIRoute } from "astro";
import { createSupabaseAdminClient } from "@/db/supabase.admin.client";

export const prerender = false;

/**
 * Webhook endpoint for Supabase Database Webhooks
 * Triggered when a new user is created in auth.users
 * Creates a corresponding profile in the profiles table
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Verify webhook secret for security
    const webhookSecret = import.meta.env.SUPABASE_WEBHOOK_SECRET;
    const authHeader = request.headers.get("authorization");

    if (!webhookSecret) {
      console.error("SUPABASE_WEBHOOK_SECRET is not configured");
      return new Response(JSON.stringify({ message: "Server configuration error" }), { status: 500 });
    }

    // Verify the webhook is from Supabase using the secret
    const expectedAuth = `Bearer ${webhookSecret}`;
    if (authHeader !== expectedAuth) {
      console.warn("Unauthorized webhook attempt - invalid secret");
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    }

    // Parse the webhook payload
    const payload = await request.json();

    // Supabase webhooks send the payload in different formats depending on the event
    // For INSERT events, the new record is in payload.record
    const userId = payload.record?.id;

    if (!userId) {
      console.error("Invalid webhook payload - missing user ID:", payload);
      return new Response(JSON.stringify({ message: "Invalid payload" }), { status: 400 });
    }

    // Create admin client with elevated privileges
    const adminClient = createSupabaseAdminClient();

    // Create the profile
    const { data: profile, error: insertError } = await adminClient
      .from("profiles")
      .insert({ id: userId })
      .select("*")
      .single();

    if (insertError) {
      // Log the error but check if it's a duplicate key error (profile already exists)
      if (insertError.code === "23505") {
        // Duplicate key - profile already exists, this is OK
        console.log(`Profile already exists for user ${userId}, skipping creation`);
        return new Response(JSON.stringify({ message: "Profile already exists" }), { status: 200 });
      }

      console.error("Error creating profile via webhook:", insertError);
      return new Response(JSON.stringify({ message: "Failed to create profile" }), { status: 500 });
    }

    console.log(`Successfully created profile for user ${userId}`);
    return new Response(JSON.stringify({ message: "Profile created", profile }), { status: 201 });
  } catch (error) {
    console.error("Unexpected error in profile creation webhook:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), { status: 500 });
  }
};
