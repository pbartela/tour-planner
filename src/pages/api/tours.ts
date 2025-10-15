import type { APIRoute } from "astro";

import { tourService } from "@/lib/services/tour.service";
import { getToursQuerySchema, createTourCommandSchema } from "@/lib/validators/tour.validators";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const { supabase, session } = locals;

  if (!session?.user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  try {
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validation = getToursQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return new Response(JSON.stringify(validation.error.flatten()), { status: 400 });
    }

    const { data: tours, error } = await tourService.getUserTours(supabase, session.user.id, validation.data);

    if (error) {
      return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }

    return new Response(JSON.stringify(tours), { status: 200 });
  } catch (error) {
    console.error("Unexpected error in GET /api/tours:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase, session } = locals;

  if (!session?.user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = createTourCommandSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify(validation.error.flatten()), { status: 400 });
    }

    const { data: tour, error } = await tourService.createTour(supabase, session.user.id, validation.data);

    if (error) {
      return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }

    return new Response(JSON.stringify(tour), { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/tours:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
};
