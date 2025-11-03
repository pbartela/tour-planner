import { z } from "zod";

/**
 * Schema for query parameters when fetching comments
 */
export const getCommentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Schema for creating a new comment
 */
export const createCommentCommandSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty.").max(5000, "Comment is too long."),
});

/**
 * Schema for updating an existing comment
 */
export const updateCommentCommandSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty.").max(5000, "Comment is too long."),
});

/**
 * Schema for validating comment ID parameter
 */
export const commentIdSchema = z.string().uuid("Invalid comment ID format");

/**
 * Schema for validating tour ID parameter
 */
export const tourIdParamSchema = z.string().uuid("Invalid tour ID format");
