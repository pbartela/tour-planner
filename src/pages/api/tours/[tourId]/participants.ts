import type { APIRoute } from "astro";
import { validateSession } from "@/lib/server/session-validation.service";
import * as logger from "@/lib/server/logger.service";
import { createSupabaseAdminClient } from "@/db/supabase.admin.client";
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
      } | null;
    }

    // Fetch emails for all participants using admin client
    const allUserIds = (participants || []).map((p) => p.user_id);
    const userEmails = new Map<string, string>();

    if (allUserIds.length > 0) {
      try {
        const adminClient = createSupabaseAdminClient();
        await Promise.all(
          allUserIds.map(async (userId) => {
            try {
              const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
              if (authUser?.user?.email) {
                userEmails.set(userId, authUser.user.email);
              }
            } catch {
              // Skip if user not found or error
              logger.secureError(`Could not fetch email for user ${userId}`, null);
            }
          })
        );
      } catch (error) {
        logger.secureError("Could not fetch user emails for participants", error);
      }
    }

    const participantDtos: ParticipantDto[] = (participants || [])
      .map((p: ParticipantWithProfile) => {
        const email = userEmails.get(p.user_id);
        // Only include participants for which we have an email
        if (!email) {
          return null;
        }
        return {
          user_id: p.user_id,
          joined_at: p.joined_at,
          display_name: p.profiles?.display_name || null,
          avatar_url: p.profiles?.avatar_url || null,
          email: email,
        };
      })
      .filter((p): p is ParticipantDto => p !== null);

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
