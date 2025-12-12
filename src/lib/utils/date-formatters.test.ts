import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatDate,
  getDaysUntil,
  getDaysUntilExpiration,
  isPastDate,
  formatExpirationMessage,
} from "./date-formatters";
import * as dateFormatterService from "@/lib/services/date-formatter.service";

// Mock the date-formatter service
vi.mock("@/lib/services/date-formatter.service", () => ({
  formatDateByLocale: vi.fn(),
}));

describe("date-formatters", () => {
  const realDate = Date;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.Date = realDate;
  });

  describe("formatDate", () => {
    it("should format date using browser locale when no locale provided", () => {
      const mockFormatted = "Jan 15, 2025";
      vi.mocked(dateFormatterService.formatDateByLocale).mockReturnValue(mockFormatted);

      const result = formatDate("2025-01-15T10:00:00Z");

      expect(result).toBe(mockFormatted);
      expect(dateFormatterService.formatDateByLocale).toHaveBeenCalledWith(
        new Date("2025-01-15T10:00:00Z"),
        expect.any(String)
      );
    });

    it("should format date using provided locale", () => {
      const mockFormatted = "15 sty 2025";
      vi.mocked(dateFormatterService.formatDateByLocale).mockReturnValue(mockFormatted);

      const result = formatDate("2025-01-15T10:00:00Z", "pl-PL");

      expect(result).toBe(mockFormatted);
      expect(dateFormatterService.formatDateByLocale).toHaveBeenCalledWith(
        new Date("2025-01-15T10:00:00Z"),
        "pl-PL"
      );
    });

    it("should use en-US as fallback when navigator is undefined", () => {
      const mockFormatted = "Jan 15, 2025";
      vi.mocked(dateFormatterService.formatDateByLocale).mockReturnValue(mockFormatted);

      // Mock navigator being undefined (server-side)
      const originalNavigator = global.navigator;
      // @ts-expect-error - Intentionally setting to undefined for test
      global.navigator = undefined;

      const result = formatDate("2025-01-15T10:00:00Z");

      expect(result).toBe(mockFormatted);
      expect(dateFormatterService.formatDateByLocale).toHaveBeenCalledWith(
        new Date("2025-01-15T10:00:00Z"),
        "en-US"
      );

      global.navigator = originalNavigator;
    });

    it("should handle different date string formats", () => {
      const mockFormatted = "Jan 15, 2025";
      vi.mocked(dateFormatterService.formatDateByLocale).mockReturnValue(mockFormatted);

      // ISO date only
      formatDate("2025-01-15");
      expect(dateFormatterService.formatDateByLocale).toHaveBeenCalledWith(
        new Date("2025-01-15"),
        expect.any(String)
      );

      // ISO with timezone
      formatDate("2025-01-15T10:00:00+01:00");
      expect(dateFormatterService.formatDateByLocale).toHaveBeenCalledWith(
        new Date("2025-01-15T10:00:00+01:00"),
        expect.any(String)
      );
    });
  });

  describe("getDaysUntil", () => {
    it("should return positive days for future date", () => {
      // Mock current date: 2025-01-15
      const mockNow = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(mockNow);

      // Target date: 2025-01-20 (5 days in future)
      const result = getDaysUntil("2025-01-20T12:00:00Z");

      expect(result).toBe(5);
    });

    it("should return negative days for past date", () => {
      // Mock current date: 2025-01-15
      const mockNow = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(mockNow);

      // Target date: 2025-01-10 (5 days in past)
      const result = getDaysUntil("2025-01-10T12:00:00Z");

      expect(result).toBe(-5);
    });

    it("should return 1 for same day but later time (due to Math.ceil)", () => {
      // Mock current date: 2025-01-15 12:00
      const mockNow = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(mockNow);

      // Target date: same day but 6 hours later (0.25 days)
      const result = getDaysUntil("2025-01-15T18:00:00Z");

      expect(result).toBe(1); // Math.ceil(0.25) = 1
    });

    it("should round up fractional days", () => {
      // Mock current date: 2025-01-15 00:00
      const mockNow = new Date("2025-01-15T00:00:00Z");
      vi.setSystemTime(mockNow);

      // Target date: 1.5 days in future
      const result = getDaysUntil("2025-01-16T12:00:00Z");

      expect(result).toBe(2); // Math.ceil(1.5) = 2
    });

    it("should handle timezone differences correctly", () => {
      const mockNow = new Date("2025-01-15T23:00:00Z");
      vi.setSystemTime(mockNow);

      // Just over 1 day ahead
      const result = getDaysUntil("2025-01-17T00:00:00Z");

      expect(result).toBeGreaterThan(0);
    });

    it("should handle leap year correctly", () => {
      const mockNow = new Date("2024-02-28T12:00:00Z");
      vi.setSystemTime(mockNow);

      // 2024 is a leap year
      const result = getDaysUntil("2024-03-01T12:00:00Z");

      expect(result).toBe(2); // Feb 29 exists in 2024
    });
  });

  describe("getDaysUntilExpiration", () => {
    it("should be an alias for getDaysUntil", () => {
      const mockNow = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(mockNow);

      const dateString = "2025-01-20T12:00:00Z";
      const result1 = getDaysUntil(dateString);
      const result2 = getDaysUntilExpiration(dateString);

      expect(result1).toBe(result2);
      expect(result2).toBe(5);
    });

    it("should work with expiration dates", () => {
      const mockNow = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(mockNow);

      // Expires in 7 days
      const result = getDaysUntilExpiration("2025-01-22T12:00:00Z");

      expect(result).toBe(7);
    });
  });

  describe("isPastDate", () => {
    it("should return true for past date", () => {
      const mockNow = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(mockNow);

      const result = isPastDate("2025-01-10T12:00:00Z");

      expect(result).toBe(true);
    });

    it("should return false for future date", () => {
      const mockNow = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(mockNow);

      const result = isPastDate("2025-01-20T12:00:00Z");

      expect(result).toBe(false);
    });

    it("should return false for current moment", () => {
      const mockNow = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(mockNow);

      const result = isPastDate("2025-01-15T12:00:00Z");

      expect(result).toBe(false);
    });

    it("should return true for date 1 millisecond ago", () => {
      const mockNow = new Date("2025-01-15T12:00:00.100Z");
      vi.setSystemTime(mockNow);

      const result = isPastDate("2025-01-15T12:00:00.099Z");

      expect(result).toBe(true);
    });

    it("should return false for date 1 millisecond in future", () => {
      const mockNow = new Date("2025-01-15T12:00:00.100Z");
      vi.setSystemTime(mockNow);

      const result = isPastDate("2025-01-15T12:00:00.101Z");

      expect(result).toBe(false);
    });
  });

  describe("formatExpirationMessage", () => {
    const mockT = vi.fn((key: string, options?: Record<string, unknown>) => {
      if (key === "invitations.expiresToday") return "Expires today";
      if (key === "invitations.expiresInOneDay") return "Expires in 1 day";
      if (key === "invitations.expiresIn") return `Expires in ${options?.days} days`;
      return key;
    });

    beforeEach(() => {
      mockT.mockClear();
    });

    it("should return 'expires today' message when expires today or in past", () => {
      const mockNow = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(mockNow);

      // Expires at exactly same time (0 days)
      const result1 = formatExpirationMessage("2025-01-15T12:00:00Z", mockT);
      expect(result1).toBe("Expires today");
      expect(mockT).toHaveBeenCalledWith("invitations.expiresToday");

      mockT.mockClear();

      // Already expired
      const result2 = formatExpirationMessage("2025-01-14T12:00:00Z", mockT);
      expect(result2).toBe("Expires today");
      expect(mockT).toHaveBeenCalledWith("invitations.expiresToday");
    });

    it("should return 'expires in 1 day' message when exactly 1 day remaining", () => {
      const mockNow = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(mockNow);

      // Expires tomorrow
      const result = formatExpirationMessage("2025-01-16T12:00:00Z", mockT);

      expect(result).toBe("Expires in 1 day");
      expect(mockT).toHaveBeenCalledWith("invitations.expiresInOneDay");
    });

    it("should return 'expires in N days' for multiple days", () => {
      const mockNow = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(mockNow);

      // Expires in 5 days
      const result = formatExpirationMessage("2025-01-20T12:00:00Z", mockT);

      expect(result).toBe("Expires in 5 days");
      expect(mockT).toHaveBeenCalledWith("invitations.expiresIn", { days: 5 });
    });

    it("should return 'expires in N days' for large number of days", () => {
      const mockNow = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(mockNow);

      // Expires in 30 days
      const result = formatExpirationMessage("2025-02-14T12:00:00Z", mockT);

      expect(result).toBe("Expires in 30 days");
      expect(mockT).toHaveBeenCalledWith("invitations.expiresIn", { days: 30 });
    });

    it("should handle edge case at midnight boundary", () => {
      const mockNow = new Date("2025-01-15T23:59:59Z");
      vi.setSystemTime(mockNow);

      // Just after midnight (next day)
      const result = formatExpirationMessage("2025-01-16T00:00:01Z", mockT);

      expect(result).toBe("Expires in 1 day");
    });

    it("should round up partial days correctly", () => {
      const mockNow = new Date("2025-01-15T00:00:00Z");
      vi.setSystemTime(mockNow);

      // 2.5 days in future -> rounds to 3 days
      const result = formatExpirationMessage("2025-01-17T12:00:00Z", mockT);

      expect(result).toBe("Expires in 3 days");
      expect(mockT).toHaveBeenCalledWith("invitations.expiresIn", { days: 3 });
    });
  });
});
