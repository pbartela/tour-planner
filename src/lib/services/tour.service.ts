import type { z } from "zod";

import type { SupabaseClient } from "@/db/supabase.client";
import type { getToursQuerySchema, createTourCommandSchema } from "@/lib/validators/tour.validators";
import type { CreateTourCommand, PaginatedToursDto, TourDetailsDto, TourSummaryDto, UpdateTourCommand } from "@/types";

class TourService {
  public async getUserTours(
    supabase: SupabaseClient,
    userId: string,
    options: z.infer<typeof getToursQuerySchema>
  ): Promise<{ data: PaginatedToursDto | null; error: Error | null }> {
    const { status, page, limit } = options;
    const offset = (page - 1) * limit;

    try {
      const { data: tours, error: toursError } = await supabase
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
                `
        )
        .eq("user_id", userId)
        .eq("tour.status", status)
        .range(offset, offset + limit - 1)
        .returns<{ tour: TourSummaryDto }[]>();

      if (toursError) {
        console.error("Error fetching user tours:", toursError);
        throw new Error("Failed to fetch tours from the database.");
      }

      const { count, error: countError } = await supabase
        .from("participants")
        .select("tour_id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("tours.status", status);

      if (countError) {
        console.error("Error counting user tours:", countError);
        throw new Error("Failed to count tours in the database.");
      }

      const paginatedData: PaginatedToursDto = {
        data: tours.map((p) => p.tour),
        pagination: {
          page,
          limit,
          total: count ?? 0,
        },
      };

      return { data: paginatedData, error: null };
    } catch (error) {
      console.error("Unexpected error in getUserTours:", error);
      return { data: null, error: error instanceof Error ? error : new Error("An unexpected error occurred.") };
    }
  }

  public async createTour(
    supabase: SupabaseClient,
    userId: string,
    command: CreateTourCommand
  ): Promise<{ data: TourDetailsDto | null; error: Error | null }> {
    try {
      const { data: tour, error: tourError } = await supabase
        .from("tours")
        .insert({ ...command, owner_id: userId })
        .select()
        .single();

      if (tourError) {
        console.error("Error creating tour:", tourError);
        throw new Error("Failed to create tour in the database.");
      }

      const { error: participantError } = await supabase
        .from("participants")
        .insert({ tour_id: tour.id, user_id: userId });

      if (participantError) {
        console.error("Error adding participant:", participantError);
        // TODO: Implement transaction rollback or cleanup
        throw new Error("Failed to add participant to the new tour.");
      }

      return { data: tour, error: null };
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
