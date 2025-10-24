import type { APIRoute } from "astro";

import { profileService } from "@/lib/services/profile.service";
import { updateProfileCommandSchema } from "@/lib/validators/profile.validators";
import { handleDatabaseError } from "@/lib/utils/error-handler";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const { supabase } = locals;

  // Get user from Supabase since middleware doesn't run for API routes
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  try {
    const { data: profile, error } = await profileService.getProfile(supabase, user.id);

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

export const PATCH: APIRoute = async ({ request, locals }) => {
  const { supabase } = locals;

  // Get user from Supabase since middleware doesn't run for API routes
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = updateProfileCommandSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify(validation.error.flatten()), { status: 400 });
    }

    const { data: updatedProfile, error } = await profileService.updateProfile(supabase, user.id, validation.data);

    if (error) {
      const { message, status } = handleDatabaseError(error);
      return new Response(JSON.stringify({ message }), { status });
    }

    return new Response(JSON.stringify(updatedProfile), { status: 200 });
  } catch (error) {
    console.error("Unexpected error in PATCH /api/profiles/me:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
};
