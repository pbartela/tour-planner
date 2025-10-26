import { z } from "zod";

export const getToursQuerySchema = z.object({
  status: z.enum(["active", "archived"]).default("active"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});

const baseTourSchema = z.object({
  title: z.string().min(1, "Title cannot be empty."),
  destination: z.string().min(1, "Destination cannot be empty."),
  description: z.string().optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  participant_limit: z.number().int().positive().optional(),
  like_threshold: z.number().int().positive().optional(),
});

export const createTourCommandSchema = baseTourSchema.refine((data) => data.end_date > data.start_date, {
  message: "End date must be after start date.",
  path: ["end_date"],
});

export const updateTourCommandSchema = baseTourSchema
  .partial()
  .extend({
    are_votes_hidden: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Only validate date relationship if both dates are provided
      if (data.start_date && data.end_date) {
        return data.end_date > data.start_date;
      }
      return true;
    },
    {
      message: "End date must be after start date.",
      path: ["end_date"],
    }
  );
