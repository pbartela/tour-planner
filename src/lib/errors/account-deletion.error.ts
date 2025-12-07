/**
 * Error thrown when account deletion is blocked due to validation failures.
 * Contains structured data about why deletion cannot proceed.
 */
export class AccountDeletionBlockedError extends Error {
  public readonly code = "ACCOUNT_DELETION_BLOCKED" as const;
  public readonly reasons: string[];

  constructor(reasons: string[]) {
    super(reasons.join(" "));
    this.name = "AccountDeletionBlockedError";
    this.reasons = reasons;

    // Maintains proper stack trace for where error was thrown (only in V8 environments)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AccountDeletionBlockedError);
    }
  }
}

/**
 * Type guard to check if an error is an AccountDeletionBlockedError
 */
export function isAccountDeletionBlockedError(error: unknown): error is AccountDeletionBlockedError {
  return error instanceof AccountDeletionBlockedError;
}
