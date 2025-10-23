import type { APIRoute } from "astro";

import { profileService } from "@/lib/services/profile.service";
import { updateProfileCommandSchema } from "@/lib/validators/profile.validators";

export const prerender = false;

export const GET: APIRoute = async ({ locals, cookies }) => {
  const { supabase } = locals;

  // Get session from Supabase since middleware doesn't run for API routes
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  try {
    const { data: profile, error } = await profileService.getProfile(supabase, session.user.id);

    if (error) {
      // The service already logged the detailed error
      return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }

    if (!profile) {
      return new Response(JSON.stringify({ message: "Profile not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(profile), { status: 200 });
  } catch (error) {
    console.error("Unexpected error in GET /api/profiles/me:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request, locals, cookies }) => {
  const { supabase } = locals;

  // Get session from Supabase since middleware doesn't run for API routes
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = updateProfileCommandSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify(validation.error.flatten()), { status: 400 });
    }

    const { data: updatedProfile, error } = await profileService.updateProfile(
      supabase,
      session.user.id,
      validation.data
    );

    if (error) {
      // Check if it's a username uniqueness violation
      if (error.message.includes("duplicate key") || error.message.includes("unique")) {
        return new Response(JSON.stringify({ message: "Username is already taken" }), { status: 409 });
      }
      return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }

    return new Response(JSON.stringify(updatedProfile), { status: 200 });
  } catch (error) {
    console.error("Unexpected error in PATCH /api/profiles/me:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
};
