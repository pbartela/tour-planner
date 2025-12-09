import { describe, it, expect } from "vitest";
import { generateInitials, getUserDisplayName } from "./user-name.util";

describe("generateInitials", () => {
  describe("multi-word names", () => {
    it("should return first letter of first and last word", () => {
      expect(generateInitials("John Doe", null)).toBe("JD");
    });

    it("should handle names with multiple words", () => {
      expect(generateInitials("John Michael Doe", null)).toBe("JD");
    });

    it("should handle extra whitespace between words", () => {
      expect(generateInitials("John  Doe", null)).toBe("JD");
    });

    it("should handle leading and trailing whitespace", () => {
      expect(generateInitials("  John Doe  ", null)).toBe("JD");
    });
  });

  describe("single-word names", () => {
    it("should return first two characters for single word", () => {
      expect(generateInitials("john", null)).toBe("JO");
    });

    it("should handle capitalized single words", () => {
      expect(generateInitials("Alice", null)).toBe("AL");
    });

    it("should handle single word with whitespace", () => {
      expect(generateInitials("  bob  ", null)).toBe("BO");
    });
  });

  describe("single character names", () => {
    it("should return single character uppercased", () => {
      expect(generateInitials("J", null)).toBe("J");
    });

    it("should handle lowercase single character", () => {
      expect(generateInitials("j", null)).toBe("J");
    });
  });

  describe("email fallback with separators", () => {
    it("should extract initials from email with dots", () => {
      expect(generateInitials(null, "john.doe@example.com")).toBe("JD");
    });

    it("should extract initials from email with underscores", () => {
      expect(generateInitials(null, "jane_smith@example.com")).toBe("JS");
    });

    it("should extract initials from email with hyphens", () => {
      expect(generateInitials(null, "bob-jones@example.com")).toBe("BJ");
    });

    it("should handle email with multiple separators", () => {
      expect(generateInitials(null, "john.michael.doe@example.com")).toBe("JD");
    });

    it("should handle email with mixed separators", () => {
      expect(generateInitials(null, "john_doe.smith@example.com")).toBe("JS");
    });

    it("should fallback to email when name is empty string", () => {
      expect(generateInitials("", "jane.doe@example.com")).toBe("JD");
    });

    it("should fallback to email when name is whitespace only", () => {
      expect(generateInitials("   ", "john.smith@example.com")).toBe("JS");
    });
  });

  describe("email fallback without separators", () => {
    it("should return first two characters of email prefix", () => {
      expect(generateInitials(null, "johndoe@example.com")).toBe("JO");
    });

    it("should handle email with single character prefix", () => {
      expect(generateInitials(null, "j@example.com")).toBe("J");
    });
  });

  describe("edge cases", () => {
    it("should return ?? when both name and email are null", () => {
      expect(generateInitials(null, null)).toBe("??");
    });

    it("should return ?? when both name and email are empty strings", () => {
      expect(generateInitials("", "")).toBe("??");
    });

    it("should return ?? when both are whitespace only", () => {
      expect(generateInitials("   ", "   ")).toBe("??");
    });

    it("should return ?? when email has no prefix", () => {
      expect(generateInitials(null, "@example.com")).toBe("??");
    });

    it("should return ?? when email is just @", () => {
      expect(generateInitials(null, "@")).toBe("??");
    });
  });

  describe("case normalization", () => {
    it("should convert initials to uppercase", () => {
      expect(generateInitials("john doe", null)).toBe("JD");
    });

    it("should convert mixed case to uppercase", () => {
      expect(generateInitials("JoHn DoE", null)).toBe("JD");
    });

    it("should convert email initials to uppercase", () => {
      expect(generateInitials(null, "john.doe@example.com")).toBe("JD");
    });
  });
});

describe("getUserDisplayName", () => {
  describe("display name priority", () => {
    it("should return display name when all parameters are provided", () => {
      expect(getUserDisplayName("John Doe", "john@example.com", "Anonymous")).toBe("John Doe");
    });

    it("should prefer display name over email", () => {
      expect(getUserDisplayName("Alice", "alice@example.com", "Guest")).toBe("Alice");
    });

    it("should return display name when email is null", () => {
      expect(getUserDisplayName("Bob", null, "Anonymous")).toBe("Bob");
    });

    it("should return display name when email is empty", () => {
      expect(getUserDisplayName("Charlie", "", "Unknown")).toBe("Charlie");
    });
  });

  describe("whitespace handling", () => {
    it("should trim whitespace from display name", () => {
      expect(getUserDisplayName("  John Doe  ", "john@example.com", "Anonymous")).toBe("John Doe");
    });

    it("should trim whitespace from email fallback", () => {
      expect(getUserDisplayName(null, "  john@example.com  ", "Anonymous")).toBe("john@example.com");
    });

    it("should treat whitespace-only display name as empty", () => {
      expect(getUserDisplayName("   ", "bob@example.com", "Anonymous")).toBe("bob@example.com");
    });
  });

  describe("email fallback", () => {
    it("should return email when display name is null", () => {
      expect(getUserDisplayName(null, "john@example.com", "Anonymous")).toBe("john@example.com");
    });

    it("should return email when display name is empty string", () => {
      expect(getUserDisplayName("", "jane@example.com", "Guest")).toBe("jane@example.com");
    });

    it("should return email when display name is whitespace only", () => {
      expect(getUserDisplayName("   ", "alice@example.com", "Unknown")).toBe("alice@example.com");
    });
  });

  describe("fallback parameter", () => {
    it("should return fallback when both display name and email are null", () => {
      expect(getUserDisplayName(null, null, "Anonymous")).toBe("Anonymous");
    });

    it("should return fallback when both are empty strings", () => {
      expect(getUserDisplayName("", "", "Guest")).toBe("Guest");
    });

    it("should return fallback when both are whitespace only", () => {
      expect(getUserDisplayName("   ", "   ", "Unknown")).toBe("Unknown");
    });

    it("should return fallback when display name and email are null", () => {
      expect(getUserDisplayName(null, null, "User")).toBe("User");
    });
  });

  describe("empty fallback", () => {
    it("should work with empty fallback when display name is provided", () => {
      expect(getUserDisplayName("John", null, "")).toBe("John");
    });

    it("should return empty string when all are empty and fallback is empty", () => {
      expect(getUserDisplayName(null, null, "")).toBe("");
    });
  });
});
