import { z } from "zod";

/**
 * Validator for adding a tag to a tour
 */
export const addTagCommandSchema = z.object({
  tag_name: z.string().trim().min(1, "Tag name cannot be empty").max(50, "Tag name cannot exceed 50 characters"),
});

export type AddTagCommand = z.infer<typeof addTagCommandSchema>;

/**
 * Validator for tag ID parameter
 */
export const tagIdSchema = z.coerce.number().int().positive("Tag ID must be a positive integer");

/**
 * Validator for tag search query
 */
export const tagSearchQuerySchema = z.object({
  q: z.string().trim().min(1, "Search query cannot be empty").optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type TagSearchQuery = z.infer<typeof tagSearchQuerySchema>;
