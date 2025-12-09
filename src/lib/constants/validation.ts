/**
 * Validation limits and constraints used throughout the application.
 */

/**
 * Email-related validation constants
 */
export const EMAIL_VALIDATION = {
  /**
   * Maximum input string length for email parser.
   * Protects against malicious large inputs while allowing comfortable buffer.
   * Calculation: 50 emails × 100 chars (very long emails) + buffer = ~10,000 chars
   */
  MAX_INPUT_LENGTH: 10000,
  /** Maximum number of emails that can be invited at once */
  MAX_EMAILS_PER_INVITATION: 50,
} as const;
