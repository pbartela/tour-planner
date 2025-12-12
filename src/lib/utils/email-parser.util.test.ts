import { describe, it, expect } from "vitest";
import { parseEmails } from "./email-parser.util";

describe("parseEmails", () => {
  describe("separator handling", () => {
    it("should parse space-separated emails", () => {
      const result = parseEmails("a@example.pl dzw@test.pl zf@demo.pl");

      expect(result.valid).toEqual(["a@example.pl", "dzw@test.pl", "zf@demo.pl"]);
      expect(result.invalid).toEqual([]);
      expect(result.duplicates).toEqual([]);
    });

    it("should parse comma-separated emails", () => {
      const result = parseEmails("a@example.pl, dzw@test.pl, zf@demo.pl");

      expect(result.valid).toEqual(["a@example.pl", "dzw@test.pl", "zf@demo.pl"]);
      expect(result.invalid).toEqual([]);
      expect(result.duplicates).toEqual([]);
    });

    it("should parse newline-separated emails", () => {
      const result = parseEmails("a@example.pl\ndzw@test.pl\nzf@demo.pl");

      expect(result.valid).toEqual(["a@example.pl", "dzw@test.pl", "zf@demo.pl"]);
      expect(result.invalid).toEqual([]);
      expect(result.duplicates).toEqual([]);
    });

    it("should parse semicolon-separated emails", () => {
      const result = parseEmails("a@example.pl; dzw@test.pl; zf@demo.pl");

      expect(result.valid).toEqual(["a@example.pl", "dzw@test.pl", "zf@demo.pl"]);
      expect(result.invalid).toEqual([]);
      expect(result.duplicates).toEqual([]);
    });

    it("should parse mixed separators (space, comma, newline)", () => {
      const result = parseEmails("a@example.pl, dzw@test.pl zf@demo.pl\nr@valid.com");

      expect(result.valid).toEqual(["a@example.pl", "dzw@test.pl", "zf@demo.pl", "r@valid.com"]);
      expect(result.invalid).toEqual([]);
      expect(result.duplicates).toEqual([]);
    });

    it("should handle tab-separated emails", () => {
      const result = parseEmails("a@example.pl\tdzw@test.pl\tzf@demo.pl");

      expect(result.valid).toEqual(["a@example.pl", "dzw@test.pl", "zf@demo.pl"]);
      expect(result.invalid).toEqual([]);
      expect(result.duplicates).toEqual([]);
    });
  });

  describe("normalization", () => {
    it("should trim whitespace from emails", () => {
      const result = parseEmails("  a@example.pl  ,   dzw@test.pl   ");

      expect(result.valid).toEqual(["a@example.pl", "dzw@test.pl"]);
    });

    it("should normalize emails to lowercase", () => {
      const result = parseEmails("User@Example.PL TEST@DEMO.COM");

      expect(result.valid).toEqual(["user@example.pl", "test@demo.com"]);
    });

    it("should filter out empty strings", () => {
      const result = parseEmails("a@example.pl,  ,  , dzw@test.pl");

      expect(result.valid).toEqual(["a@example.pl", "dzw@test.pl"]);
      expect(result.invalid).toEqual([]);
    });
  });

  describe("duplicate detection", () => {
    it("should detect exact duplicates", () => {
      const result = parseEmails("test@example.pl test@example.pl");

      expect(result.valid).toEqual(["test@example.pl"]);
      expect(result.duplicates).toEqual(["test@example.pl"]);
    });

    it("should detect case-insensitive duplicates", () => {
      const result = parseEmails("Test@Example.pl test@example.pl TEST@EXAMPLE.PL");

      expect(result.valid).toEqual(["test@example.pl"]);
      expect(result.duplicates).toEqual(["test@example.pl", "TEST@EXAMPLE.PL"]);
    });

    it("should detect duplicates with whitespace variations", () => {
      const result = parseEmails("test@example.pl  test@example.pl  ");

      expect(result.valid).toEqual(["test@example.pl"]);
      expect(result.duplicates).toEqual(["test@example.pl"]);
    });
  });

  describe("email validation", () => {
    it("should accept valid email addresses", () => {
      const result = parseEmails("user@example.com test.user@domain.co.uk user+tag@example.com");

      expect(result.valid).toEqual([
        "user@example.com",
        "test.user@domain.co.uk",
        "user+tag@example.com",
      ]);
      expect(result.invalid).toEqual([]);
    });

    it("should reject emails with invalid format", () => {
      const result = parseEmails("not-an-email invalid @example.com user@");

      expect(result.valid).toEqual([]);
      expect(result.invalid).toHaveLength(4); // All 4 are invalid
      expect(result.invalid[0].email).toBe("not-an-email");
      expect(result.invalid[0].error).toBe("Invalid email format");
    });

    it("should reject emails with empty domain part (r@.pl)", () => {
      const result = parseEmails("r@.pl user@.com");

      expect(result.valid).toEqual([]);
      expect(result.invalid).toHaveLength(2);
      expect(result.invalid[0].email).toBe("r@.pl");
      expect(result.invalid[0].error).toBe("Invalid domain");
      expect(result.invalid[1].email).toBe("user@.com");
      expect(result.invalid[1].error).toBe("Invalid domain");
    });

    it("should reject emails without @ symbol", () => {
      const result = parseEmails("userexample.com");

      expect(result.valid).toEqual([]);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].email).toBe("userexample.com");
      expect(result.invalid[0].error).toBe("Invalid email format");
    });

    it("should reject emails without domain extension", () => {
      const result = parseEmails("user@domain");

      expect(result.valid).toEqual([]);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].email).toBe("user@domain");
      expect(result.invalid[0].error).toBe("Invalid domain");
    });

    it("should reject emails with trailing dot in domain", () => {
      const result = parseEmails("user@example.");

      expect(result.valid).toEqual([]);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].email).toBe("user@example.");
      expect(result.invalid[0].error).toBe("Invalid domain");
    });
  });

  describe("mixed valid and invalid emails", () => {
    it("should separate valid and invalid emails correctly", () => {
      const result = parseEmails("valid@example.com r@.pl another@test.pl invalid");

      expect(result.valid).toEqual(["valid@example.com", "another@test.pl"]);
      expect(result.invalid).toHaveLength(2);
      expect(result.invalid[0].email).toBe("r@.pl");
      expect(result.invalid[0].error).toBe("Invalid domain");
      expect(result.invalid[1].email).toBe("invalid");
      expect(result.invalid[1].error).toBe("Invalid email format");
    });
  });

  describe("edge cases", () => {
    it("should handle empty input", () => {
      const result = parseEmails("");

      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
      expect(result.duplicates).toEqual([]);
      expect(result.original).toEqual([]);
    });

    it("should handle whitespace-only input", () => {
      const result = parseEmails("   \n  \t  ");

      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
      expect(result.duplicates).toEqual([]);
      expect(result.original).toEqual([]);
    });

    it("should handle trailing separators", () => {
      const result = parseEmails("user@example.com,,,   \n\n");

      expect(result.valid).toEqual(["user@example.com"]);
      expect(result.invalid).toEqual([]);
    });

    it("should handle single valid email", () => {
      const result = parseEmails("single@example.com");

      expect(result.valid).toEqual(["single@example.com"]);
      expect(result.invalid).toEqual([]);
      expect(result.duplicates).toEqual([]);
    });

    it("should preserve original case in original array", () => {
      const result = parseEmails("User@Example.COM");

      expect(result.original).toEqual(["User@Example.COM"]);
      expect(result.valid).toEqual(["user@example.com"]); // normalized
    });
  });

  describe("complex real-world scenarios", () => {
    it("should handle the user's example input", () => {
      const result = parseEmails("a@d.pl dzw@k.pl zf@d.pl r@.pl");

      expect(result.valid).toEqual(["a@d.pl", "dzw@k.pl", "zf@d.pl"]);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].email).toBe("r@.pl");
      expect(result.invalid[0].error).toBe("Invalid domain");
    });

    it("should handle mixed separators with duplicates and invalid emails", () => {
      const result = parseEmails(
        "user@example.com, invalid, user@example.com\ntest@demo.pl r@.pl Test@Demo.PL"
      );

      expect(result.valid).toEqual(["user@example.com", "test@demo.pl"]);
      expect(result.invalid).toHaveLength(2);
      expect(result.duplicates).toEqual(["user@example.com", "Test@Demo.PL"]);
    });
  });

  describe("input length validation", () => {
    it("should accept input under the length limit", () => {
      // Create input with many emails but under 10k chars
      const validInput = "a@test.com ".repeat(100); // ~1,200 chars
      const result = parseEmails(validInput);

      expect(result.inputError).toBeUndefined();
      expect(result.valid.length).toBeGreaterThan(0);
    });

    it("should reject input exceeding maximum length", () => {
      // Create input exceeding 10,000 chars
      const tooLongInput = "a".repeat(10001);
      const result = parseEmails(tooLongInput);

      expect(result.inputError).toBeDefined();
      expect(result.inputError).toContain("Input too long");
      expect(result.inputError).toContain("10000");
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
      expect(result.duplicates).toEqual([]);
      expect(result.original).toEqual([]);
    });

    it("should handle input at exactly maximum length", () => {
      // Create input at exactly 10,000 chars with valid emails
      const emailUnit = "a@b.co "; // 7 chars
      const repeatCount = Math.floor(10000 / emailUnit.length); // 1,428
      const exactLimitInput = emailUnit.repeat(repeatCount).trim(); // ~9,996 chars

      const result = parseEmails(exactLimitInput);

      expect(result.inputError).toBeUndefined();
      expect(result.valid.length).toBeGreaterThan(0);
    });
  });

  describe("TLD validation", () => {
    it("should accept emails with valid TLDs (com, org, net, pl, co.uk)", () => {
      const result = parseEmails("user@example.com test@org.pl admin@site.co.uk info@domain.net");

      expect(result.valid).toHaveLength(4);
      expect(result.valid).toEqual([
        "user@example.com",
        "test@org.pl",
        "admin@site.co.uk",
        "info@domain.net",
      ]);
      expect(result.invalid).toHaveLength(0);
    });

    it("should reject emails with invalid numeric TLD", () => {
      const result = parseEmails("user@domain.123");

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].email).toBe("user@domain.123");
      expect(result.invalid[0].error).toBe("Invalid TLD");
    });

    it("should reject emails with made-up TLD", () => {
      const result = parseEmails("user@example.fakeTLD");

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].email).toBe("user@example.faketld");
      expect(result.invalid[0].error).toBe("Invalid TLD");
    });

    it("should reject emails with alphanumeric invalid TLD", () => {
      const result = parseEmails("user@test.xyz123");

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].email).toBe("user@test.xyz123");
      expect(result.invalid[0].error).toBe("Invalid TLD");
    });

    it("should handle mixed valid and invalid TLDs", () => {
      const result = parseEmails("valid@example.com invalid@test.fake");

      expect(result.valid).toEqual(["valid@example.com"]);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].email).toBe("invalid@test.fake");
      expect(result.invalid[0].error).toBe("Invalid TLD");
    });

    it("should accept various valid TLDs including newer ones", () => {
      const result = parseEmails("user@example.io test@domain.ai admin@site.dev");

      expect(result.valid).toHaveLength(3);
      expect(result.valid).toEqual(["user@example.io", "test@domain.ai", "admin@site.dev"]);
      expect(result.invalid).toHaveLength(0);
    });

    it("should reject common typo TLDs", () => {
      const result = parseEmails("user@example.comm user@test.coom");

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(2);
      expect(result.invalid[0].error).toBe("Invalid TLD");
      expect(result.invalid[1].error).toBe("Invalid TLD");
    });
  });
});
