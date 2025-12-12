import { describe, it, expect } from "vitest";
import { STORAGE_KEYS } from "./storage";

describe("STORAGE_KEYS", () => {
	it("should have theme key", () => {
		expect(STORAGE_KEYS.THEME).toBe("theme");
	});

	it("should have invitation skip confirmation key", () => {
		expect(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION).toBe("invitation-skip-confirmation");
	});

	it("should have tour metadata key", () => {
		expect(STORAGE_KEYS.TOUR_METADATA_V1).toBe("tour_metadata_v1");
	});

	it("should have correct type safety with as const", () => {
		// TypeScript ensures immutability at compile time via 'as const'
		// This test verifies that the keys maintain their exact string values
		const themeKey: "theme" = STORAGE_KEYS.THEME;
		expect(themeKey).toBe("theme");
	});
});
