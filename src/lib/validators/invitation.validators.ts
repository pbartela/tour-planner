import { z } from "zod";

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
    .max(50, "Cannot invite more than 50 people at once")
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

