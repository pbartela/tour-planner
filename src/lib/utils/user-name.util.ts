/**
 * Utilities for generating user display names and initials.
 * Used for consistent user representation across avatars, comments, and participant lists.
 */

/**
 * Generates two-character initials from a display name or email address.
 *
 * @param name - The user's display name (e.g., "John Doe", "john")
 * @param email - The user's email address (used as fallback if name is not provided)
 * @returns Two-character initials in uppercase
 *
 * @example
 * generateInitials("John Doe", null) // "JD"
 * generateInitials("john", null) // "JO"
 * generateInitials(null, "john@example.com") // "JO"
 * generateInitials("", "jane.smith@example.com") // "JS"
 */
export function generateInitials(name: string | null, email: string | null): string {
  // Try to use the display name first
  if (name && name.trim()) {
    const trimmed = name.trim();
    const parts = trimmed.split(/\s+/);

    if (parts.length >= 2) {
      // Multi-word name: first letter of first word + first letter of last word
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    // Single word: first two characters
    return trimmed.slice(0, 2).toUpperCase();
  }

  // Fallback to email
  if (email && email.trim()) {
    const emailPrefix = email.split("@")[0].trim();

    if (emailPrefix.length === 0) {
      return "??";
    }

    // Check if email prefix contains separators (dots, underscores, hyphens)
    const parts = emailPrefix.split(/[._-]+/).filter((p) => p.length > 0);

    if (parts.length >= 2) {
      // Multiple parts: first letter of first part + first letter of last part
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    // Single part: first two characters
    return emailPrefix.slice(0, 2).toUpperCase();
  }

  // No name or email available
  return "??";
}

/**
 * Gets a display-friendly name for a user, with fallback to email or anonymous label.
 *
 * @param displayName - The user's display name from their profile
 * @param email - The user's email address
 * @param fallback - The fallback text to use if neither display name nor email is available (e.g., translation key)
 * @returns The most appropriate display name
 *
 * @example
 * getUserDisplayName("John Doe", "john@example.com", "Anonymous") // "John Doe"
 * getUserDisplayName(null, "john@example.com", "Anonymous") // "john@example.com"
 * getUserDisplayName(null, null, "Anonymous") // "Anonymous"
 */
export function getUserDisplayName(displayName: string | null, email: string | null, fallback: string): string {
  if (displayName && displayName.trim()) {
    return displayName.trim();
  }

  if (email && email.trim()) {
    return email.trim();
  }

  return fallback;
}
