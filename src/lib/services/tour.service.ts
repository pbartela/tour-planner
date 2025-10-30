import type { z } from "zod";

import type { SupabaseClient } from "@/db/supabase.client";
import type { getToursQuerySchema } from "@/lib/validators/tour.validators";
import { secureError } from "@/lib/server/logger.service";
import type { CreateTourCommand, PaginatedToursDto, TourDetailsDto, TourSummaryDto, UpdateTourCommand } from "@/types";

class TourService {
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

      const paginatedData: PaginatedToursDto = {
        data: (tours || []).map((p: { tour: Omit<TourSummaryDto, "has_new_activity"> }) => ({
          ...p.tour,
          has_new_activity: false, // TODO: Implement activity tracking logic
        })),
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
      // Use the database function to create the tour
      // This bypasses RLS policy evaluation issues that occur with server-side Supabase clients
      // The function handles both tour creation and participant insertion in a single transaction
      // Note: The user ID is retrieved from auth.uid() within the database function for security
      const { data: tours, error: tourError } = await supabase.rpc("create_tour", {
        p_title: command.title,
        p_destination: command.destination,
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

      return { data: tour as TourDetailsDto, error: null };
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

      return { data, error: null };
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
