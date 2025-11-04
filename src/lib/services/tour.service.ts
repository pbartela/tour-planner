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
    const { status, page, limit } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      // Combine data and count into a single query to avoid N+1 issue
      // Query participants table and join with tours using RLS-safe relationship filter
      const {
        data: tours,
        error: toursError,
        count,
      } = await supabase
        .from("participants")
        .select(
          `
          tour:tours!inner (
            id,
            title,
            destination,
            start_date,
            end_date,
            status
          )
        `,
          { count: "exact" }
        )
        .eq("user_id", userId)
        .eq("tour.status", status)
        .range(from, to)
        .returns<{ tour: TourSummaryDto }[]>();

      if (toursError) {
        secureError("Error fetching user tours from database", toursError);
        throw new Error("Failed to fetch tours from the database.");
      }

      // Extract metadata for each tour in parallel
      const toursWithMetadata = await Promise.all(
        (tours || []).map(async (p: { tour: Omit<TourSummaryDto, "has_new_activity" | "metadata"> }) => {
          const metadata = await this.extractMetadata(p.tour.destination);
          return {
            ...p.tour,
            has_new_activity: false, // TODO: Implement activity tracking
            // Implementation plan:
            // 1. Create a `tour_views` table to track when users last viewed each tour
            //    Schema: { tour_id, user_id, last_viewed_at, created_at }
            // 2. Track "view" events when user opens tour details page
            // 3. Determine "new activity" by comparing last_viewed_at with:
            //    - Latest comment created_at (from comments table)
            //    - Latest vote created_at (from votes table)
            //    - Tour updated_at timestamp
            // 4. Add index on (tour_id, user_id) for performance
            // 5. Update this query to LEFT JOIN with tour_views and check activity timestamps
            // 6. Consider caching strategy for large numbers of tours
            metadata: metadata || undefined,
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
}

export const tourService = new TourService();
