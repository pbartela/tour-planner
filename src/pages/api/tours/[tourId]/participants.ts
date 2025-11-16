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
      return new Response(
        JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }),
        { status: 401 }
      );
    }

    if (!tourId) {
      return new Response(
        JSON.stringify({ error: { code: "VALIDATION_ERROR", message: "Tour ID is required" } }),
        { status: 400 }
      );
    }

    // Fetch participants with their profile information
    const { data: participants, error } = await supabase
      .from("participants")
      .select(
        `
        user_id,
        joined_at,
        profiles!inner (
          display_name,
          avatar_url
        )
      `
      )
      .eq("tour_id", tourId)
      .order("joined_at", { ascending: true });

    if (error) {
      logger.error("Error fetching participants from database", error);
      return new Response(
        JSON.stringify({ error: { code: "FETCH_ERROR", message: "Failed to fetch participants" } }),
        { status: 500 }
      );
    }

    // Transform the data to match ParticipantDto shape
    const participantDtos: ParticipantDto[] = (participants || []).map((p: any) => ({
      user_id: p.user_id,
      joined_at: p.joined_at,
      display_name: p.profiles?.display_name || null,
      avatar_url: p.profiles?.avatar_url || null,
    }));

    return new Response(JSON.stringify(participantDtos), { status: 200 });
  } catch (error) {
    logger.error("Unexpected error in GET /api/tours/[tourId]/participants", error instanceof Error ? error : undefined);
    return new Response(
      JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } }),
      { status: 500 }
    );
  }
};
