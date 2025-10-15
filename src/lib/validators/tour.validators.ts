import { z } from "zod";

export const getToursQuerySchema = z.object({
  status: z.enum(["active", "archived"]).default("active"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});

export const createTourCommandSchema = z.object({
  title: z.string().min(1, "Title cannot be empty."),
  destination: z.string().min(1, "Destination cannot be empty."),
  description: z.string().optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  participant_limit: z.number().int().positive().optional(),
  like_threshold: z.number().int().positive().optional(),
});

export const updateTourCommandSchema = createTourCommandSchema.partial().extend({
	are_votes_hidden: z.boolean().optional(),
});
