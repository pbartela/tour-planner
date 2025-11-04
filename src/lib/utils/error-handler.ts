import { POSTGRES_ERROR_CODES, DATABASE_ERROR_MESSAGES } from "@/lib/constants/database";

/**
 * Handles database errors and returns appropriate HTTP responses
 */
export function handleDatabaseError(error: unknown): { message: string; status: number } {
  // Check if it's a Supabase/PostgreSQL error with a code
  if (error && typeof error === "object" && "code" in error) {
    const errorCode = error.code as string;

    switch (errorCode) {
      case POSTGRES_ERROR_CODES.UNIQUE_VIOLATION:
        return {
          message: DATABASE_ERROR_MESSAGES.EMAIL_TAKEN,
          status: 409,
        };
      case POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION:
        return {
          message: DATABASE_ERROR_MESSAGES.FOREIGN_KEY_CONSTRAINT,
          status: 400,
        };
      case POSTGRES_ERROR_CODES.NOT_NULL_VIOLATION:
        return {
          message: DATABASE_ERROR_MESSAGES.REQUIRED_FIELD,
          status: 400,
        };
      case POSTGRES_ERROR_CODES.CHECK_VIOLATION:
        return {
          message: DATABASE_ERROR_MESSAGES.INVALID_DATA,
          status: 400,
        };
      default:
        return {
          message: "Internal Server Error",
          status: 500,
        };
    }
  }

  // Fallback for unknown errors
  return {
    message: "Internal Server Error",
    status: 500,
  };
}
