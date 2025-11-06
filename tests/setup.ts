import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Set up environment variables for tests
process.env.NODE_ENV = "test";
process.env.VITEST = "true";

// Mock required environment variables
import.meta.env.PUBLIC_SUPABASE_URL = "http://localhost:54321";
import.meta.env.PUBLIC_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.test";
import.meta.env.PUBLIC_DEFAULT_LOCALE = "en-US";
import.meta.env.SUPABASE_URL = "http://localhost:54321";
import.meta.env.SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.test";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  // Mock constructor - parameters are unused but required for type compatibility
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(_callback?: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    // Mock constructor
  }
  disconnect(): void {
    // Mock disconnect
  }
  observe(_target: Element, _options?: IntersectionObserverInit): void {
    // Mock observe
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve(_target: Element): void {
    // Mock unobserve
  }
} as typeof IntersectionObserver;
