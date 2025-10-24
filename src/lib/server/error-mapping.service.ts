import type { ErrorInfo } from "@/types";
import i18next from "i18next";

/**
 * Maps error codes to localized error information
 * @param errorCode - The error code from the authentication system
 * @param errorDescription - Optional error description from the system
 * @param locale - The user's locale for internationalization
 * @returns ErrorInfo object with title, message, and action text
 */
export function getErrorInfo(errorCode: string | null, errorDescription: string | null, locale = "en-US"): ErrorInfo {
  switch (errorCode) {
    case "access_denied":
      return {
        title: i18next.t("authError.accessDenied.title", { lng: locale }),
        message: i18next.t("authError.accessDenied.message", { lng: locale }),
        action: i18next.t("authError.accessDenied.action", { lng: locale }),
        errorCode: "access_denied",
      };

    case "expired_token":
    case "token_expired":
      return {
        title: i18next.t("authError.expiredLink.title", { lng: locale }),
        message: i18next.t("authError.expiredLink.message", { lng: locale }),
        action: i18next.t("authError.expiredLink.action", { lng: locale }),
        errorCode: "expired_token",
      };

    case "invalid_token":
    case "invalid_request":
      return {
        title: i18next.t("authError.invalidLink.title", { lng: locale }),
        message: i18next.t("authError.invalidLink.message", { lng: locale }),
        action: i18next.t("authError.invalidLink.action", { lng: locale }),
        errorCode: "invalid_token",
      };

    case "already_used":
    case "link_used":
      return {
        title: i18next.t("authError.alreadyUsed.title", { lng: locale }),
        message: i18next.t("authError.alreadyUsed.message", { lng: locale }),
        action: i18next.t("authError.alreadyUsed.action", { lng: locale }),
        errorCode: "already_used",
      };

    case "no_tokens":
      return {
        title: i18next.t("authError.noTokens.title", { lng: locale }),
        message: i18next.t("authError.noTokens.message", { lng: locale }),
        action: i18next.t("authError.noTokens.action", { lng: locale }),
        errorCode: "no_tokens",
      };

    case "session_failed":
      return {
        title: i18next.t("authError.sessionFailed.title", { lng: locale }),
        message: i18next.t("authError.sessionFailed.message", { lng: locale }),
        action: i18next.t("authError.sessionFailed.action", { lng: locale }),
        errorCode: "session_failed",
      };

    case "unexpected_error":
      return {
        title: i18next.t("authError.unexpectedError.title", { lng: locale }),
        message: i18next.t("authError.unexpectedError.message", { lng: locale }),
        action: i18next.t("authError.unexpectedError.action", { lng: locale }),
        errorCode: "unexpected_error",
      };

    default:
      return {
        title: i18next.t("authError.generic.title", { lng: locale }),
        message: errorDescription || i18next.t("authError.generic.message", { lng: locale }),
        action: i18next.t("authError.generic.action", { lng: locale }),
        errorCode: errorCode || "unknown_error",
      };
  }
}

/**
 * Gets a list of all supported error codes
 * @returns Array of error codes that have specific mappings
 */
export function getSupportedErrorCodes(): string[] {
  return [
    "access_denied",
    "expired_token",
    "token_expired",
    "invalid_token",
    "invalid_request",
    "already_used",
    "link_used",
    "no_tokens",
    "session_failed",
    "unexpected_error",
  ];
}

/**
 * Checks if an error code has a specific mapping
 * @param errorCode - The error code to check
 * @returns True if the error code has a specific mapping
 */
export function hasSpecificMapping(errorCode: string): boolean {
  return getSupportedErrorCodes().includes(errorCode);
}
