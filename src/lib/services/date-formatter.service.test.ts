import { describe, it, expect } from "vitest";
import { DateFormatterService, formatDateByLocale, getDateFormatHint } from "./date-formatter.service";

describe("DateFormatterService", () => {
  describe("format", () => {
    describe("US locale (en-US)", () => {
      it("should format date as MM/DD/YYYY", () => {
        const formatter = new DateFormatterService("en-US");
        const date = new Date(2025, 6, 4); // July 4, 2025 (month is 0-indexed)

        expect(formatter.format(date)).toBe("07/04/2025");
      });

      it("should zero-pad single-digit month and day", () => {
        const formatter = new DateFormatterService("en-US");
        const date = new Date(2025, 0, 5); // January 5, 2025

        expect(formatter.format(date)).toBe("01/05/2025");
      });

      it("should handle year boundaries correctly", () => {
        const formatter = new DateFormatterService("en-US");
        const date = new Date(2025, 11, 31); // December 31, 2025

        expect(formatter.format(date)).toBe("12/31/2025");
      });

      it("should handle leap year dates", () => {
        const formatter = new DateFormatterService("en-US");
        const date = new Date(2024, 1, 29); // Leap day 2024

        expect(formatter.format(date)).toBe("02/29/2024");
      });
    });

    describe("US locale (en)", () => {
      it("should format date as MM/DD/YYYY", () => {
        const formatter = new DateFormatterService("en");
        const date = new Date(2025, 6, 4);

        expect(formatter.format(date)).toBe("07/04/2025");
      });
    });

    describe("Polish locale (pl-PL)", () => {
      it("should format date as DD/MM/YYYY", () => {
        const formatter = new DateFormatterService("pl-PL");
        const date = new Date(2025, 6, 4); // July 4, 2025

        expect(formatter.format(date)).toBe("04/07/2025");
      });

      it("should zero-pad single-digit month and day", () => {
        const formatter = new DateFormatterService("pl-PL");
        const date = new Date(2025, 0, 5); // January 5, 2025

        expect(formatter.format(date)).toBe("05/01/2025");
      });

      it("should handle year boundaries correctly", () => {
        const formatter = new DateFormatterService("pl-PL");
        const date = new Date(2025, 11, 31); // December 31, 2025

        expect(formatter.format(date)).toBe("31/12/2025");
      });
    });

    describe("German locale (de-DE)", () => {
      it("should format date as DD/MM/YYYY", () => {
        const formatter = new DateFormatterService("de-DE");
        const date = new Date(2025, 2, 15); // March 15, 2025

        expect(formatter.format(date)).toBe("15/03/2025");
      });
    });

    describe("French locale (fr-FR)", () => {
      it("should format date as DD/MM/YYYY", () => {
        const formatter = new DateFormatterService("fr-FR");
        const date = new Date(2025, 10, 20); // November 20, 2025

        expect(formatter.format(date)).toBe("20/11/2025");
      });
    });

    describe("undefined date", () => {
      it("should return empty string for undefined date", () => {
        const formatter = new DateFormatterService("en-US");

        expect(formatter.format(undefined)).toBe("");
      });

      it("should return empty string for undefined date in non-US locale", () => {
        const formatter = new DateFormatterService("pl-PL");

        expect(formatter.format(undefined)).toBe("");
      });
    });

    describe("edge cases", () => {
      it("should handle January 1st correctly", () => {
        const formatter = new DateFormatterService("en-US");
        const date = new Date(2025, 0, 1);

        expect(formatter.format(date)).toBe("01/01/2025");
      });

      it("should handle December 31st correctly", () => {
        const formatter = new DateFormatterService("en-US");
        const date = new Date(2025, 11, 31);

        expect(formatter.format(date)).toBe("12/31/2025");
      });

      it("should handle dates with different times correctly", () => {
        const formatter = new DateFormatterService("en-US");
        const date1 = new Date(2025, 6, 4, 0, 0, 0);
        const date2 = new Date(2025, 6, 4, 23, 59, 59);

        // Both should format to the same date string
        expect(formatter.format(date1)).toBe("07/04/2025");
        expect(formatter.format(date2)).toBe("07/04/2025");
      });

      it("should handle dates from different centuries", () => {
        const formatterUS = new DateFormatterService("en-US");
        const formatterPL = new DateFormatterService("pl-PL");
        const date = new Date(1999, 11, 31);

        expect(formatterUS.format(date)).toBe("12/31/1999");
        expect(formatterPL.format(date)).toBe("31/12/1999");
      });

      it("should handle future dates", () => {
        const formatter = new DateFormatterService("en-US");
        const date = new Date(2099, 11, 25);

        expect(formatter.format(date)).toBe("12/25/2099");
      });
    });
  });

  describe("getFormatHint", () => {
    it("should return MM/DD/YYYY for en-US locale", () => {
      const formatter = new DateFormatterService("en-US");

      expect(formatter.getFormatHint()).toBe("MM/DD/YYYY");
    });

    it("should return MM/DD/YYYY for en locale", () => {
      const formatter = new DateFormatterService("en");

      expect(formatter.getFormatHint()).toBe("MM/DD/YYYY");
    });

    it("should return DD/MM/YYYY for pl-PL locale", () => {
      const formatter = new DateFormatterService("pl-PL");

      expect(formatter.getFormatHint()).toBe("DD/MM/YYYY");
    });

    it("should return DD/MM/YYYY for de-DE locale", () => {
      const formatter = new DateFormatterService("de-DE");

      expect(formatter.getFormatHint()).toBe("DD/MM/YYYY");
    });

    it("should return DD/MM/YYYY for fr-FR locale", () => {
      const formatter = new DateFormatterService("fr-FR");

      expect(formatter.getFormatHint()).toBe("DD/MM/YYYY");
    });

    it("should return DD/MM/YYYY for unknown locale", () => {
      const formatter = new DateFormatterService("xx-XX");

      expect(formatter.getFormatHint()).toBe("DD/MM/YYYY");
    });
  });

  describe("isUSLocale (private method behavior)", () => {
    it("should treat en-US as US locale", () => {
      const formatter = new DateFormatterService("en-US");
      const date = new Date(2025, 6, 4);

      // Verify US format is used
      expect(formatter.format(date)).toBe("07/04/2025");
      expect(formatter.getFormatHint()).toBe("MM/DD/YYYY");
    });

    it("should treat en as US locale", () => {
      const formatter = new DateFormatterService("en");
      const date = new Date(2025, 6, 4);

      // Verify US format is used
      expect(formatter.format(date)).toBe("07/04/2025");
      expect(formatter.getFormatHint()).toBe("MM/DD/YYYY");
    });

    it("should NOT treat en-GB as US locale", () => {
      const formatter = new DateFormatterService("en-GB");
      const date = new Date(2025, 6, 4);

      // Verify non-US format is used
      expect(formatter.format(date)).toBe("04/07/2025");
      expect(formatter.getFormatHint()).toBe("DD/MM/YYYY");
    });

    it("should NOT treat en-AU as US locale", () => {
      const formatter = new DateFormatterService("en-AU");
      const date = new Date(2025, 6, 4);

      // Verify non-US format is used
      expect(formatter.format(date)).toBe("04/07/2025");
      expect(formatter.getFormatHint()).toBe("DD/MM/YYYY");
    });
  });
});

describe("Standalone functions (backward compatibility)", () => {
  describe("getDateFormatHint", () => {
    it("should return MM/DD/YYYY for en-US locale", () => {
      expect(getDateFormatHint("en-US")).toBe("MM/DD/YYYY");
    });

    it("should return MM/DD/YYYY for en locale", () => {
      expect(getDateFormatHint("en")).toBe("MM/DD/YYYY");
    });

    it("should return DD/MM/YYYY for pl-PL locale", () => {
      expect(getDateFormatHint("pl-PL")).toBe("DD/MM/YYYY");
    });

    it("should return DD/MM/YYYY for de-DE locale", () => {
      expect(getDateFormatHint("de-DE")).toBe("DD/MM/YYYY");
    });

    it("should delegate to DateFormatterService class", () => {
      // Verify behavior matches class method
      const locale = "fr-FR";
      const formatter = new DateFormatterService(locale);

      expect(getDateFormatHint(locale)).toBe(formatter.getFormatHint());
    });
  });

  describe("formatDateByLocale", () => {
    it("should format date as MM/DD/YYYY for en-US locale", () => {
      const date = new Date(2025, 6, 4);

      expect(formatDateByLocale(date, "en-US")).toBe("07/04/2025");
    });

    it("should format date as DD/MM/YYYY for pl-PL locale", () => {
      const date = new Date(2025, 6, 4);

      expect(formatDateByLocale(date, "pl-PL")).toBe("04/07/2025");
    });

    it("should return empty string for undefined date", () => {
      expect(formatDateByLocale(undefined, "en-US")).toBe("");
    });

    it("should delegate to DateFormatterService class", () => {
      // Verify behavior matches class method
      const date = new Date(2025, 10, 15);
      const locale = "de-DE";
      const formatter = new DateFormatterService(locale);

      expect(formatDateByLocale(date, locale)).toBe(formatter.format(date));
    });

    it("should handle multiple locales consistently", () => {
      const date = new Date(2025, 2, 25);

      expect(formatDateByLocale(date, "en-US")).toBe("03/25/2025");
      expect(formatDateByLocale(date, "pl-PL")).toBe("25/03/2025");
      expect(formatDateByLocale(date, "fr-FR")).toBe("25/03/2025");
    });
  });
});
