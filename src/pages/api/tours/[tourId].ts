import type { APIRoute } from "astro";
import { z } from "zod";

import { tourService } from "@/lib/services/tour.service";
import { updateTourCommandSchema } from "@/lib/validators/tour.validators";
import { checkCsrfProtection } from "@/lib/server/csrf.service";

export const prerender = false;

const tourIdSchema = z.string().uuid();

export const GET: APIRoute = async ({ params, locals }) => {
  const { supabase } = locals;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const validation = tourIdSchema.safeParse(params.tourId);

  if (!validation.success) {
    return new Response(JSON.stringify({ message: "Invalid tour ID format" }), { status: 400 });
  }

  const tourId = validation.data;

  try {
    const { data: tour, error } = await tourService.getTourDetails(supabase, tourId);

    if (error || !tour) {
      // RLS prevents unauthorized access, so any error or null data can be treated as "Not Found"
      // to avoid leaking information about the tour's existence.
      return new Response(JSON.stringify({ message: "Tour not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(tour), { status: 200 });
  } catch (error) {
    console.error(`Unexpected error in GET /api/tours/${tourId}:`, error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ params, request, locals, cookies }) => {
  // CSRF protection
  const csrfError = checkCsrfProtection(request, cookies);
  if (csrfError) {
    return csrfError;
  }

  const { supabase } = locals;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const tourIdValidation = tourIdSchema.safeParse(params.tourId);

  if (!tourIdValidation.success) {
    return new Response(JSON.stringify({ message: "Invalid tour ID format" }), { status: 400 });
  }

  const tourId = tourIdValidation.data;

  try {
    const body = await request.json();
    const bodyValidation = updateTourCommandSchema.safeParse(body);

    if (!bodyValidation.success) {
      return new Response(JSON.stringify(bodyValidation.error.flatten()), { status: 400 });
    }

    const updateData: Record<string, unknown> = { ...bodyValidation.data };
    if (updateData.start_date && updateData.start_date instanceof Date) {
      updateData.start_date = updateData.start_date.toISOString();
    }
    if (updateData.end_date && updateData.end_date instanceof Date) {
      updateData.end_date = updateData.end_date.toISOString();
    }

    const { data: tour, error } = await tourService.updateTour(supabase, tourId, updateData);

    if (error) {
      // RLS prevents unauthorized access or updates to non-existent tours.
      // Return 404 to avoid leaking information. A 403 could imply the tour exists.
      return new Response(JSON.stringify({ message: "Tour not found or you don't have permission to update it" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(tour), { status: 200 });
  } catch (error) {
    console.error(`Unexpected error in PATCH /api/tours/${tourId}:`, error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals, cookies, request }) => {
  // CSRF protection
  const csrfError = checkCsrfProtection(request, cookies);
  if (csrfError) {
    return csrfError;
  }

  const { supabase } = locals;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const tourIdValidation = tourIdSchema.safeParse(params.tourId);

  if (!tourIdValidation.success) {
    return new Response(JSON.stringify({ message: "Invalid tour ID format" }), { status: 400 });
  }

  const tourId = tourIdValidation.data;

  try {
    const { error } = await tourService.deleteTour(supabase, tourId);

    if (error) {
      // RLS prevents unauthorized deletion. Return 404 to avoid leaking info.
      return new Response(JSON.stringify({ message: "Tour not found or you don't have permission to delete it" }), {
        status: 404,
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(`Unexpected error in DELETE /api/tours/${tourId}:`, error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
};
