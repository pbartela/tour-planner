import type { z } from "zod";

import type { SupabaseClient } from "@/db/supabase.client";
import type { getToursQuerySchema } from "@/lib/validators/tour.validators";
import { secureError } from "@/lib/server/logger.service";
import type {
  CreateTourCommand,
  PaginatedToursDto,
  TourDetailsDto,
  TourSummaryDto,
  UpdateTourCommand,
  TourMetadata,
} from "@/types";
import getTripMetaData from "@/lib/server/metadata-extract.service";
import { ensureTourNotArchived } from "@/lib/utils/tour-status.util";

class TourService {
  // Server-side metadata cache
  // Map: destination URL -> { metadata, timestamp }
  private metadataCache = new Map<
    string,
    {
      data: TourMetadata;
      timestamp: number;
    }
  >();

  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Clears expired entries from the server-side cache
   */
  private cleanupServerCache(): void {
    const now = Date.now();
    for (const [url, entry] of this.metadataCache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.metadataCache.delete(url);
      }
    }
  }

  /**
   * Extracts metadata from a destination URL.
   * Returns null if extraction fails or URL is invalid.
   * Uses server-side caching to reduce external API calls.
   */
  private async extractMetadata(destination: string): Promise<TourMetadata | null> {
    try {
      // Check if destination is a valid URL
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(destination)) {
        return null;
      }

      // Check cache first
      const cached = this.metadataCache.get(destination);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }

      // Fetch fresh metadata
      const metadata = await getTripMetaData(destination);

      // Cache the result if successful
      if (metadata) {
        this.metadataCache.set(destination, {
          data: metadata,
          timestamp: Date.now(),
        });

        // Cleanup old entries periodically (every 10th call)
        if (Math.random() < 0.1) {
          this.cleanupServerCache();
        }
      }

      return metadata;
    } catch (error) {
      secureError("Error extracting metadata from destination URL", error);
      return null;
    }
  }

  /**
   * Lists tours for a user with pagination and status filtering.
   * Uses RLS-safe queries to ensure user only sees tours they participate in.
   */
  public async listToursForUser(
    supabase: SupabaseClient,
    userId: string,
    options: z.infer<typeof getToursQuerySchema>
  ): Promise<PaginatedToursDto> {
    const { status, page, limit, tags } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      // If tags are provided, we need to filter tours that have ALL specified tags
      // This requires a different query strategy
      let tourIdsWithTags: string[] | undefined;

      if (tags && tags.length > 0) {
        // Get tours that have all the specified tags using a SQL query
        // For each tag, find tours that have it, then intersect the results
        const { data: tourTagsData, error: tourTagsError } = await supabase
          .from("tour_tags")
          .select("tour_id, tags!tour_tags_tag_id_fkey(name)")
          .in(
            "tags.name",
            tags.map((t) => t.toLowerCase())
          );

        if (tourTagsError) {
          secureError("Error fetching tour tags for filtering", tourTagsError);
          throw new Error("Failed to filter tours by tags.");
        }

        // Group by tour_id and count how many tags match
        const tourTagCounts = new Map<string, Set<string>>();
        (tourTagsData || []).forEach((tt) => {
          const tag = Array.isArray(tt.tags) ? tt.tags[0] : tt.tags;
          if (tag?.name) {
            if (!tourTagCounts.has(tt.tour_id)) {
              tourTagCounts.set(tt.tour_id, new Set());
            }
            tourTagCounts.get(tt.tour_id)!.add(tag.name.toLowerCase());
          }
        });

        // Filter to tours that have ALL requested tags (logical AND)
        tourIdsWithTags = Array.from(tourTagCounts.entries())
          .filter(([_, tagSet]) => tags.every((tag) => tagSet.has(tag.toLowerCase())))
          .map(([tourId, _]) => tourId);

        // If no tours match the tag criteria, return empty result early
        if (tourIdsWithTags.length === 0) {
          return {
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
            },
          };
        }
      }

      // Build the main query
      let query = supabase
        .from("participants")
        .select(
          `
          tour:tours!inner (
            id,
            title,
            destination,
            start_date,
            end_date,
            status,
            updated_at
          )
        `,
          { count: "exact" }
        )
        .eq("user_id", userId)
        .eq("tour.status", status);

      // Apply tag filtering if we have specific tour IDs
      if (tourIdsWithTags) {
        query = query.in("tour.id", tourIdsWithTags);
      }

      // Apply pagination
      query = query.range(from, to);

      const { data: tours, error: toursError, count } = await query.returns<{ tour: TourSummaryDto }[]>();

      if (toursError) {
        secureError("Error fetching user tours from database", toursError);
        throw new Error("Failed to fetch tours from the database.");
      }

      // Get tour IDs for activity tracking
      const tourIds = (tours || []).map((p) => p.tour.id);

      // Batch fetch participant avatars for all tours
      const { data: participantsData } = await supabase
        .from("participants")
        .select("tour_id, profiles!participants_user_id_fkey(avatar_url)")
        .in("tour_id", tourIds)
        .order("joined_at", { ascending: true });

      // Create a map of tour_id -> array of avatar URLs
      const participantAvatarsMap = new Map<string, string[]>();
      (participantsData || []).forEach((participant) => {
        const profile = Array.isArray(participant.profiles) ? participant.profiles[0] : participant.profiles;
        const avatarUrl = profile?.avatar_url;

        if (avatarUrl) {
          if (!participantAvatarsMap.has(participant.tour_id)) {
            participantAvatarsMap.set(participant.tour_id, []);
          }
          participantAvatarsMap.get(participant.tour_id)!.push(avatarUrl);
        }
      });

      // Batch fetch tour activity data for all tours
      const { data: activityData } = await supabase
        .from("tour_activity")
        .select("tour_id, last_viewed_at")
        .eq("user_id", userId)
        .in("tour_id", tourIds);

      // Create a map of tour_id -> last_viewed_at for quick lookup
      const activityMap = new Map<string, string>();
      (activityData || []).forEach((activity) => {
        activityMap.set(activity.tour_id, activity.last_viewed_at);
      });

      // Batch fetch latest comment timestamps for all tours
      const { data: commentsData } = await supabase
        .from("comments")
        .select("tour_id, created_at")
        .in("tour_id", tourIds)
        .order("created_at", { ascending: false });

      // Create a map of tour_id -> latest comment timestamp
      const latestCommentMap = new Map<string, string>();
      (commentsData || []).forEach((comment) => {
        if (!latestCommentMap.has(comment.tour_id)) {
          latestCommentMap.set(comment.tour_id, comment.created_at);
        }
      });

      // Batch fetch latest vote timestamps for all tours
      const { data: votesData } = await supabase
        .from("votes")
        .select("tour_id, created_at")
        .in("tour_id", tourIds)
        .order("created_at", { ascending: false });

      // Create a map of tour_id -> latest vote timestamp
      const latestVoteMap = new Map<string, string>();
      (votesData || []).forEach((vote) => {
        if (!latestVoteMap.has(vote.tour_id)) {
          latestVoteMap.set(vote.tour_id, vote.created_at);
        }
      });

      // Extract metadata and determine new activity for each tour in parallel
      const toursWithMetadata = await Promise.all(
        (tours || []).map(async (p: { tour: Omit<TourSummaryDto, "has_new_activity" | "metadata"> }) => {
          const metadata = await this.extractMetadata(p.tour.destination);

          // Determine if there's new activity
          const lastViewedAt = activityMap.get(p.tour.id);
          let hasNewActivity = false;

          if (!lastViewedAt) {
            // User has never viewed this tour - everything is new
            hasNewActivity = true;
          } else {
            const lastViewedTimestamp = new Date(lastViewedAt).getTime();

            // Check if tour was updated after last view
            const tourUpdatedTimestamp = new Date(p.tour.updated_at).getTime();
            if (tourUpdatedTimestamp > lastViewedTimestamp) {
              hasNewActivity = true;
            }

            // Check if there are new comments
            const latestCommentTimestamp = latestCommentMap.get(p.tour.id);
            if (latestCommentTimestamp && new Date(latestCommentTimestamp).getTime() > lastViewedTimestamp) {
              hasNewActivity = true;
            }

            // Check if there are new votes
            const latestVoteTimestamp = latestVoteMap.get(p.tour.id);
            if (latestVoteTimestamp && new Date(latestVoteTimestamp).getTime() > lastViewedTimestamp) {
              hasNewActivity = true;
            }
          }

          return {
            ...p.tour,
            has_new_activity: hasNewActivity,
            metadata: metadata || undefined,
            participant_avatars: participantAvatarsMap.get(p.tour.id) || [],
          };
        })
      );

      const paginatedData: PaginatedToursDto = {
        data: toursWithMetadata,
        pagination: {
          page,
          limit,
          total: count ?? 0,
        },
      };

      return paginatedData;
    } catch (error) {
      secureError("Unexpected error in listToursForUser", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * @deprecated Use listToursForUser instead
   * Kept for backward compatibility during migration
   */
  public async getUserTours(
    supabase: SupabaseClient,
    userId: string,
    options: z.infer<typeof getToursQuerySchema>
  ): Promise<{ data: PaginatedToursDto | null; error: Error | null }> {
    try {
      const data = await this.listToursForUser(supabase, userId, options);
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("An unexpected error occurred."),
      };
    }
  }

  public async createTour(
    supabase: SupabaseClient,
    command: CreateTourCommand
  ): Promise<{ data: TourDetailsDto | null; error: Error | null }> {
    try {
      // Extract metadata and canonical URL from the destination
      const metadataResult = await this.extractMetadata(command.destination);
      const canonicalUrl = metadataResult?.canonicalUrl || command.destination;

      // Use the database function to create the tour with the canonical URL
      // This bypasses RLS policy evaluation issues that occur with server-side Supabase clients
      // The function handles both tour creation and participant insertion in a single transaction
      // Note: The user ID is retrieved from auth.uid() within the database function for security
      const { data: tours, error: tourError } = await supabase.rpc("create_tour", {
        p_title: command.title,
        p_destination: canonicalUrl, // Use canonical URL instead of original
        p_description: command.description || null,
        p_start_date: command.start_date,
        p_end_date: command.end_date,
        p_participant_limit: command.participant_limit || null,
        p_like_threshold: command.like_threshold || null,
      });

      if (tourError) {
        console.error("Error creating tour:", tourError);
        throw new Error("Failed to create tour in the database.");
      }

      // The function returns an array, get the first (and only) result
      const tour = Array.isArray(tours) && tours.length > 0 ? tours[0] : null;

      if (!tour) {
        throw new Error("Failed to retrieve created tour.");
      }

      // Return tour with metadata included
      return {
        data: {
          ...(tour as TourDetailsDto),
          metadata: metadataResult
            ? {
                title: metadataResult.title,
                description: metadataResult.description,
                image: metadataResult.image,
              }
            : undefined,
        },
        error: null,
      };
    } catch (error) {
      console.error("Unexpected error in createTour:", error);
      return { data: null, error: error instanceof Error ? error : new Error("An unexpected error occurred.") };
    }
  }

  public async getTourDetails(
    supabase: SupabaseClient,
    tourId: string
  ): Promise<{ data: TourDetailsDto | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.from("tours").select("*").eq("id", tourId).single();

      if (error) {
        console.error("Error fetching tour details:", error);
        // RLS will cause a PostgREST error if the user doesn't have access, which is handled here.
        // This prevents leaking information about whether a tour exists.
        throw new Error("Failed to fetch tour details from the database.");
      }

      // Extract metadata from the destination URL
      const metadata = await this.extractMetadata(data.destination);

      return {
        data: {
          ...data,
          metadata: metadata || undefined,
        },
        error: null,
      };
    } catch (error) {
      console.error("Unexpected error in getTourDetails:", error);
      return { data: null, error: error instanceof Error ? error : new Error("An unexpected error occurred.") };
    }
  }

  public async updateTour(
    supabase: SupabaseClient,
    tourId: string,
    command: UpdateTourCommand
  ): Promise<{ data: TourDetailsDto | null; error: Error | null }> {
    try {
      // Prevent updating archived tours
      await ensureTourNotArchived(supabase, tourId);

      const { data, error } = await supabase.from("tours").update(command).eq("id", tourId).select().single();

      if (error) {
        console.error("Error updating tour:", error);
        // RLS will cause a PostgREST error if the user is not the owner.
        // This prevents leaking information about the tour's existence or ownership.
        throw new Error("Failed to update tour in the database. It may not exist or you may not have permission.");
      }

      return { data, error: null };
    } catch (error) {
      console.error("Unexpected error in updateTour:", error);
      return { data: null, error: error instanceof Error ? error : new Error("An unexpected error occurred.") };
    }
  }

  public async deleteTour(supabase: SupabaseClient, tourId: string): Promise<{ error: Error | null }> {
    try {
      // Prevent deleting archived tours
      await ensureTourNotArchived(supabase, tourId);

      const { error } = await supabase.from("tours").delete().eq("id", tourId);

      if (error) {
        console.error("Error deleting tour:", error);
        // RLS will prevent deletion if the user is not the owner.
        // This prevents leaking information about the tour's existence or ownership.
        throw new Error("Failed to delete tour from the database. It may not exist or you may not have permission.");
      }

      return { error: null };
    } catch (error) {
      console.error("Unexpected error in deleteTour:", error);
      return { error: error instanceof Error ? error : new Error("An unexpected error occurred.") };
    }
  }

  /**
   * Locks voting for a tour (owner only)
   * When locked, participants cannot vote or change their votes
   */
  public async lockVoting(
    supabase: SupabaseClient,
    tourId: string
  ): Promise<{ data: TourDetailsDto | null; error: Error | null }> {
    try {
      // Prevent locking voting on archived tours
      await ensureTourNotArchived(supabase, tourId);

      const { data, error } = await supabase
        .from("tours")
        .update({ voting_locked: true })
        .eq("id", tourId)
        .select()
        .single();

      if (error) {
        console.error("Error locking voting:", error);
        // RLS will prevent update if the user is not the owner
        throw new Error("Failed to lock voting. You may not have permission.");
      }

      return { data, error: null };
    } catch (error) {
      console.error("Unexpected error in lockVoting:", error);
      return { data: null, error: error instanceof Error ? error : new Error("An unexpected error occurred.") };
    }
  }

  /**
   * Unlocks voting for a tour (owner only)
   * When unlocked, participants can vote and change their votes
   */
  public async unlockVoting(
    supabase: SupabaseClient,
    tourId: string
  ): Promise<{ data: TourDetailsDto | null; error: Error | null }> {
    try {
      // Prevent unlocking voting on archived tours
      await ensureTourNotArchived(supabase, tourId);

      const { data, error } = await supabase
        .from("tours")
        .update({ voting_locked: false })
        .eq("id", tourId)
        .select()
        .single();

      if (error) {
        console.error("Error unlocking voting:", error);
        // RLS will prevent update if the user is not the owner
        throw new Error("Failed to unlock voting. You may not have permission.");
      }

      return { data, error: null };
    } catch (error) {
      console.error("Unexpected error in unlockVoting:", error);
      return { data: null, error: error instanceof Error ? error : new Error("An unexpected error occurred.") };
    }
  }
}

export const tourService = new TourService();
