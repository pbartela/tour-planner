import { describe, it, expect } from "vitest";
import { EMAIL_VALIDATION } from "./validation";

describe("EMAIL_VALIDATION", () => {
	it("should have reasonable max input length", () => {
		expect(EMAIL_VALIDATION.MAX_INPUT_LENGTH).toBe(10000);
		expect(EMAIL_VALIDATION.MAX_INPUT_LENGTH).toBeGreaterThan(5000);
	});

	it("should have max emails per invitation", () => {
		expect(EMAIL_VALIDATION.MAX_EMAILS_PER_INVITATION).toBe(50);
	});

	it("should have correct type safety with as const", () => {
		// TypeScript ensures immutability at compile time via 'as const'
		// This test verifies that the constants maintain their exact numeric values
		const maxInputLength: 10000 = EMAIL_VALIDATION.MAX_INPUT_LENGTH;
		expect(maxInputLength).toBe(10000);
	});
});
