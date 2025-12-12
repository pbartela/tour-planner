import { z } from "zod";
import { EMAIL_VALIDATION } from "@/lib/constants/validation";

/**
 * Schema for validating email addresses
 */
const emailSchema = z.string().email("Invalid email address format");

/**
 * Schema for validating a list of email addresses when inviting participants
 */
export const inviteParticipantsCommandSchema = z.object({
  emails: z
    .array(emailSchema, {
      required_error: "Emails array is required",
      invalid_type_error: "Emails must be an array",
    })
    .min(1, "At least one email address is required")
    .max(
      EMAIL_VALIDATION.MAX_EMAILS_PER_INVITATION,
      `Cannot invite more than ${EMAIL_VALIDATION.MAX_EMAILS_PER_INVITATION} people at once`
    )
    .refine(
      (emails) => {
        // Check for duplicates
        const unique = new Set(emails.map((e) => e.toLowerCase().trim()));
        return unique.size === emails.length;
      },
      {
        message: "Duplicate email addresses are not allowed",
      }
    ),
});

/**
 * Schema for validating invitation ID parameter
 */
export const invitationIdSchema = z.string().uuid("Invalid invitation ID format");

/**
 * Schema for validating tour ID parameter (for consistency with other validators)
 */
export const tourIdParamSchema = z.string().uuid("Invalid tour ID format");

/**
 * Schema for validating invitation token query parameter
 */
export const invitationTokenSchema = z.string().min(32).max(64);

/**
 * Schema for validating pagination query parameters
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .nullish()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int("Page must be an integer").min(1, "Page must be at least 1")),
  limit: z
    .string()
    .nullish()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(
      z.number().int("Limit must be an integer").min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100")
    ),
});
