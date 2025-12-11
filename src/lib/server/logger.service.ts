/**
 * Secure logging service with sensitive data sanitization.
 * Prevents leakage of sensitive information in production logs.
 */

import { isDevelopment, isProduction } from "@/lib/server/env-validation.service";

/**
 * Fields that should be redacted from logs to prevent information leakage.
 * Add additional sensitive field names as needed.
 */
const SENSITIVE_FIELDS = [
  "password",
  "token",
  "access_token",
  "refresh_token",
  "api_key",
  "apiKey",
  "secret",
  "privateKey",
  "private_key",
  "authorization",
  "cookie",
  "session",
  "csrf",
  "otp",
  "code",
  "verification_code",
  "reset_token",
  "magic_link",
] as const;

/**
 * Fields that should be partially masked (show first/last few characters).
 * Useful for correlation while maintaining privacy.
 */
const MASKABLE_FIELDS = ["email", "phone", "phoneNumber", "phone_number"] as const;

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

/**
 * Sanitizes an object by redacting sensitive fields and masking PII.
 *
 * @param obj - Object to sanitize
 * @param maxDepth - Maximum depth to traverse (prevents circular references)
 * @returns Sanitized copy of the object
 */
function sanitizeObject(obj: unknown, maxDepth = 5): unknown {
  if (maxDepth <= 0) {
    return "[Max Depth Reached]";
  }

  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives
  if (typeof obj !== "object") {
    return obj;
  }

  // Handle Error objects
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: isProduction() ? "[REDACTED]" : obj.stack,
    };
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, maxDepth - 1));
  }

  // Handle regular objects
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Redact sensitive fields
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    // Mask PII fields
    if (MASKABLE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = maskValue(String(value));
      continue;
    }

    // Recursively sanitize nested objects
    sanitized[key] = sanitizeObject(value, maxDepth - 1);
  }

  return sanitized;
}

/**
 * Masks a value by showing only first and last 2 characters.
 *
 * @param value - Value to mask
 * @returns Masked value
 */
function maskValue(value: string): string {
  if (!value || value.length <= 4) {
    return "***";
  }
  return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
}

/**
 * Formats a log message with timestamp and context.
 *
 * @param level - Log level
 * @param message - Log message
 * @param context - Additional context
 * @returns Formatted log entry
 */
function formatLogMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase().padEnd(5);

  if (!context || Object.keys(context).length === 0) {
    return `[${timestamp}] ${levelUpper} ${message}`;
  }

  const sanitizedContext = sanitizeObject(context);
  const contextStr = JSON.stringify(sanitizedContext, null, isProduction() ? 0 : 2);

  return `[${timestamp}] ${levelUpper} ${message}\nContext: ${contextStr}`;
}

/**
 * Checks if the application is running in test mode.
 *
 * @returns True if in test mode, false otherwise
 */
function isTest(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.VITEST === "true" ||
    typeof (globalThis as { describe?: unknown }).describe === "function"
  );
}

/**
 * Determines if a log level should be output based on environment.
 *
 * @param level - Log level to check
 * @returns True if should log
 */
function shouldLog(level: LogLevel): boolean {
  // In test mode, suppress all logs to keep test output clean
  if (isTest()) {
    return false;
  }

  // In development, log everything
  if (isDevelopment()) {
    return true;
  }

  // In production, skip debug logs
  if (level === "debug") {
    return false;
  }

  return true;
}

/**
 * Logs a debug message (development only).
 *
 * @param message - Log message
 * @param context - Additional context
 */
export function debug(message: string, context?: LogContext): void {
  if (shouldLog("debug")) {
    console.debug(formatLogMessage("debug", message, context));
  }
}

/**
 * Logs an informational message.
 *
 * @param message - Log message
 * @param context - Additional context
 */
export function info(message: string, context?: LogContext): void {
  if (shouldLog("info")) {
    console.info(formatLogMessage("info", message, context));
  }
}

/**
 * Logs a warning message.
 *
 * @param message - Log message
 * @param context - Additional context
 */
export function warn(message: string, context?: LogContext): void {
  if (shouldLog("warn")) {
    console.warn(formatLogMessage("warn", message, context));
  }
}

/**
 * Logs an error message with sanitized context.
 *
 * @param message - Log message
 * @param error - Error object or context
 */
export function error(message: string, error?: Error | LogContext): void {
  if (!shouldLog("error")) {
    return;
  }

  let context: LogContext = {};

  if (error instanceof Error) {
    context = {
      error: {
        name: error.name,
        message: error.message,
        stack: isProduction() ? "[REDACTED]" : error.stack,
      },
    };
  } else if (error) {
    context = error;
  }

  console.error(formatLogMessage("error", message, context));
}

/**
 * Logs a general informational message with sanitization.
 * Use this for logging application events and metrics.
 *
 * @param message - Log message
 * @param context - Optional context object
 */
export function secureLog(message: string, context?: LogContext): void {
  if (!shouldLog("info")) {
    return;
  }

  if (isDevelopment()) {
    // In development, log everything for debugging
    console.log(`[${new Date().toISOString()}] INFO ${message}`, context || "");
  } else {
    // In production, sanitize the context
    console.log(formatLogMessage("info", message, context ? sanitizeObject(context) : undefined));
  }
}

/**
 * Logs a warning with sanitization.
 * Use this for potential issues that aren't errors but need attention.
 *
 * @param message - Log message
 * @param context - Optional context object
 */
export function secureWarn(message: string, context?: LogContext): void {
  if (!shouldLog("warn")) {
    return;
  }

  if (isDevelopment()) {
    // In development, log everything for debugging
    console.warn(`[${new Date().toISOString()}] WARN ${message}`, context || "");
  } else {
    // In production, sanitize the context
    console.warn(formatLogMessage("warn", message, context ? sanitizeObject(context) : undefined));
  }
}

/**
 * Logs an error with full details in development, sanitized in production.
 * Use this for errors that might contain sensitive information.
 *
 * @param message - Log message
 * @param error - Error object or context
 */
export function secureError(message: string, error?: Error | unknown): void {
  if (!shouldLog("error")) {
    return;
  }

  if (isDevelopment()) {
    // In development, log everything for debugging
    console.error(`[${new Date().toISOString()}] ERROR ${message}`, error);
  } else {
    // In production, sanitize the error
    const context: LogContext =
      error instanceof Error
        ? {
            errorType: error.name,
            errorMessage: error.message,
            // Stack traces can leak file paths and internal structure
            stack: "[REDACTED]",
          }
        : { error: sanitizeObject(error) };

    console.error(formatLogMessage("error", message, context));
  }
}

// Export default logger object
export default {
  debug,
  info,
  warn,
  error,
  secureLog,
  secureWarn,
  secureError,
};
