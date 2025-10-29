/**
 * PostgreSQL error codes
 * Reference: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const POSTGRES_ERROR_CODES = {
  /** Unique violation */
  UNIQUE_VIOLATION: "23505",
  /** Foreign key violation */
  FOREIGN_KEY_VIOLATION: "23503",
  /** Not null violation */
  NOT_NULL_VIOLATION: "23502",
  /** Check constraint violation */
  CHECK_VIOLATION: "23514",
} as const;

/**
 * Common database error messages
 */
export const DATABASE_ERROR_MESSAGES = {
  USERNAME_TAKEN: "Username is already taken",
  EMAIL_TAKEN: "Email is already taken",
  FOREIGN_KEY_CONSTRAINT: "Referenced record does not exist",
  REQUIRED_FIELD: "Required field is missing",
  INVALID_DATA: "Invalid data provided",
} as const;
