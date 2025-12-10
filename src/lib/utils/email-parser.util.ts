import { z } from "zod";
import tlds from "tlds";
import { EMAIL_VALIDATION } from "@/lib/constants/validation";

/**
 * Represents a parsed email with validation status
 */
export interface ParsedEmail {
  email: string;
  isValid: boolean;
  error?: string;
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
function validateEmailWithZod(email: string): { success: boolean; error?: string } {
  // First check basic structure
  const parts = email.split("@");
  if (parts.length !== 2) {
    return { success: false, error: "Invalid email format" };
  }

  const domainPart = parts[1];
  const domainSegments = domainPart?.split(".");

  // Domain must have at least 2 segments (e.g., "example.com")
  if (!domainSegments || domainSegments.length < 2) {
    return { success: false, error: "Invalid domain" };
  }

  // No segment can be empty (catches "user@.pl" or "user@example.")
  if (domainSegments.some((segment) => segment.length === 0)) {
    return { success: false, error: "Invalid domain" };
  }

  // Validate TLD against official IANA TLD list
  const tld = domainSegments[domainSegments.length - 1].toLowerCase();
  if (!tlds.includes(tld)) {
    return { success: false, error: "Invalid TLD" };
  }

  // Now use Zod for RFC 5322 compliant validation
  const emailSchema = z.string().email("Invalid email format");
  const result = emailSchema.safeParse(email);

  if (result.success) {
    return { success: true };
  } else {
    return { success: false, error: "Invalid email format" };
  }
}

/**
 * Parses and normalizes email addresses from a multi-line/multi-separator input.
 * Supports: spaces, commas, semicolons, newlines
 *
 * @param input - Raw string containing one or more email addresses
 * @returns EmailParseResult with categorized emails
 *
 * @example
 * parseEmails("a@d.pl dzw@k.pl, zf@d.pl\nr@.pl")
 * // Returns:
 * // {
 * //   valid: ["a@d.pl", "dzw@k.pl", "zf@d.pl"],
 * //   invalid: [{ email: "r@.pl", isValid: false, error: "Invalid domain" }],
 * //   duplicates: [],
 * //   original: ["a@d.pl", "dzw@k.pl", "zf@d.pl", "r@.pl"]
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
        error: validation.error || "Invalid email format",
      });
    }
  });

  return { valid, invalid, duplicates, original };
}
