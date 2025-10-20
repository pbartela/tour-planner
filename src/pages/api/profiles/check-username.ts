import type { APIRoute } from "astro";
import { z } from "zod";

import { profileService } from "@/lib/services/profile.service";
import { createAdminClient } from "@/db/supabase.admin.client";

export const prerender = false;

const checkUsernameSchema = z.object({
  username: z.string().min(1),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const validation = checkUsernameSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify({ message: "Username is required." }), { status: 400 });
    }

    const { username } = validation.data;

    // Use the admin client for this check to bypass RLS if needed,
    // ensuring we can check for uniqueness across all profiles.
    const supabase = createAdminClient();
    const { data: profile, error } = await profileService.getProfileByUsername(supabase, username);

    if (error) {
      return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }

    const isAvailable = profile === null;

    return new Response(JSON.stringify({ isAvailable }), { status: 200 });
  } catch (error) {
    // TODO: Add error logging
    console.error("Unexpected error in POST /api/profiles/check-username:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
};
