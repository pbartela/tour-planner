import type { APIRoute } from "astro";
import { validateSession } from "@/lib/server/session-validation.service";
import * as logger from "@/lib/server/logger.service";
import type { ParticipantDto } from "@/types";

export const prerender = false;

/**
 * GET /api/tours/{tourId}/participants
 * Fetch all participants for a tour with their profile information
 */
export const GET: APIRoute = async ({ params, locals }) => {
  const { supabase } = locals;
  const { tourId } = params;

  try {
    // Validate session
    const user = await validateSession(supabase);
    if (!user) {
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }), {
        status: 401,
      });
    }

    if (!tourId) {
      return new Response(JSON.stringify({ error: { code: "VALIDATION_ERROR", message: "Tour ID is required" } }), {
        status: 400,
      });
    }

    // SECURITY: Fetch participants with their profile information (including email)
    // Email is intentionally exposed to all tour co-participants for identity verification.
    // Protected by RLS - only tour participants can access this endpoint.
    // Email comes from profiles.email (synced from auth.users via trigger).
    // See docs/PRIVACY.md and docs/SECURITY_ARCHITECTURE.md for rationale.
    const { data: participants, error } = await supabase
      .from("participants")
      .select(
        `
        user_id,
        joined_at,
        profiles!inner (
          display_name,
          avatar_url,
          email
        )
      `
      )
      .eq("tour_id", tourId)
      .order("joined_at", { ascending: true });

    if (error) {
      logger.error("Error fetching participants from database", error);
      return new Response(JSON.stringify({ error: { code: "FETCH_ERROR", message: "Failed to fetch participants" } }), {
        status: 500,
      });
    }

    // Transform the data to match ParticipantDto shape
    interface ParticipantWithProfile {
      user_id: string;
      joined_at: string;
      profiles: {
        display_name: string | null;
        avatar_url: string | null;
        email: string;
      } | null;
    }

    // Map participants to DTOs (email now comes from profiles table)
    const participantDtos: ParticipantDto[] = (participants || [])
      .filter((p: ParticipantWithProfile) => p.profiles !== null)
      .map((p: ParticipantWithProfile) => {
        // TypeScript doesn't narrow the type after filter, so we assert it's not null
        const profile = p.profiles as NonNullable<typeof p.profiles>;
        return {
          user_id: p.user_id,
          joined_at: p.joined_at,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          email: profile.email,
        };
      });

    return new Response(JSON.stringify(participantDtos), { status: 200 });
  } catch (error) {
    logger.error(
      "Unexpected error in GET /api/tours/[tourId]/participants",
      error instanceof Error ? error : undefined
    );
    return new Response(
      JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } }),
      { status: 500 }
    );
  }
};
