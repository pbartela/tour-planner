import { z } from "zod";
import tlds from "tlds";
import { EMAIL_VALIDATION } from "@/lib/constants/validation";

/**
 * Email validation error types.
 * These are used for consistent error messaging across the app.
 * IMPORTANT: Must match i18n keys in invitations.confirmDialog.errors.*
 */
export enum EmailValidationError {
  INVALID_FORMAT = "Invalid email format",
  INVALID_DOMAIN = "Invalid domain",
  INVALID_TLD = "Invalid TLD",
}

/**
 * Represents a parsed email with validation status
 */
export interface ParsedEmail {
  email: string;
  isValid: boolean;
  error?: EmailValidationError;
}

/**
 * Result of parsing and validating multiple email addresses
 */
export interface EmailParseResult {
  /** Valid email addresses ready to be sent */
  valid: string[];
  /** Invalid email addresses with error reasons */
  invalid: ParsedEmail[];
  /** Duplicate email addresses that were removed */
  duplicates: string[];
  /** All originally parsed email addresses (before deduplication) */
  original: string[];
  /** Input validation error (e.g., input too long) */
  inputError?: string;
}

/**
 * Validates email with custom domain checking before Zod validation
 * This allows us to provide specific error messages for domain issues
 */
function validateEmailWithZod(email: string): { success: boolean; error?: EmailValidationError } {
  // First check basic structure
  const parts = email.split("@");
  if (parts.length !== 2) {
    return { success: false, error: EmailValidationError.INVALID_FORMAT };
  }

  const domainPart = parts[1];
  const domainSegments = domainPart?.split(".");

  // Domain must have at least 2 segments (e.g., "example.com")
  if (!domainSegments || domainSegments.length < 2) {
    return { success: false, error: EmailValidationError.INVALID_DOMAIN };
  }

  // No segment can be empty (catches "user@.pl" or "user@example.")
  if (domainSegments.some((segment) => segment.length === 0)) {
    return { success: false, error: EmailValidationError.INVALID_DOMAIN };
  }

  // Validate TLD against official IANA TLD list
  const tld = domainSegments[domainSegments.length - 1].toLowerCase();
  if (!tlds.includes(tld)) {
    return { success: false, error: EmailValidationError.INVALID_TLD };
  }

  // Now use Zod for RFC 5322 compliant validation
  const emailSchema = z.string().email("Invalid email format");
  const result = emailSchema.safeParse(email);

  if (result.success) {
    return { success: true };
  } else {
    return { success: false, error: EmailValidationError.INVALID_FORMAT };
  }
}

/**
 * Parses and normalizes email addresses from a multi-line/multi-separator input.
 * Supports: spaces, commas, semicolons, newlines, tabs
 *
 * SECURITY & PERFORMANCE:
 * - Input limited to 10,000 characters (prevents resource exhaustion)
 * - Uses safe regex with O(n) linear performance (no ReDoS risk)
 * - Character class pattern /[\s,;\n\t]+/ has no catastrophic backtracking
 * - Protected by rate limiting at API layer (10 requests/hour/tour in production)
 * - Additional validation: max 50 emails per request (enforced by API schema)
 *
 * PERFORMANCE CHARACTERISTICS:
 * - Regex split: O(n) where n = input length
 * - Deduplication: O(m) where m = number of emails
 * - Validation: O(m * k) where k = average email length
 * - Overall: O(n + m*k), linear with input size
 *
 * @param input - Raw string containing one or more email addresses (max 10,000 chars)
 * @returns EmailParseResult with categorized emails
 *
 * @example
 * parseEmails("alice@example.com, bob@test.pl\ncharlie@demo.org")
 * // Returns:
 * // {
 * //   valid: ["alice@example.com", "bob@test.pl", "charlie@demo.org"],
 * //   invalid: [],
 * //   duplicates: [],
 * //   original: ["alice@example.com", "bob@test.pl", "charlie@demo.org"]
 * // }
 */
export function parseEmails(input: string): EmailParseResult {
  // Validate input length to prevent malicious large inputs
  if (input.length > EMAIL_VALIDATION.MAX_INPUT_LENGTH) {
    return {
      valid: [],
      invalid: [],
      duplicates: [],
      original: [],
      inputError: `Input too long. Maximum ${EMAIL_VALIDATION.MAX_INPUT_LENGTH} characters allowed.`,
    };
  }

  // Split by multiple separators: space, comma, semicolon, newline, tab
  const rawEmails = input
    .split(/[\s,;\n\t]+/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0);

  const original = rawEmails;
  const normalized = rawEmails.map((e) => e.toLowerCase());

  // Detect duplicates (case-insensitive)
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const unique: string[] = [];

  normalized.forEach((email, idx) => {
    if (seen.has(email)) {
      duplicates.push(original[idx]);
    } else {
      seen.add(email);
      unique.push(email);
    }
  });

  // Validate each unique email
  const valid: string[] = [];
  const invalid: ParsedEmail[] = [];

  unique.forEach((email) => {
    const validation = validateEmailWithZod(email);
    if (validation.success) {
      valid.push(email);
    } else {
      invalid.push({
        email,
        isValid: false,
        error: validation.error || EmailValidationError.INVALID_FORMAT,
      });
    }
  });

  return { valid, invalid, duplicates, original };
}
