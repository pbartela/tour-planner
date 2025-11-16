/**
 * Mock for astro:transitions/client
 * Used in unit tests to mock Astro's view transitions navigate function
 */

export const navigate = async (_href: string) => {
  // Mock implementation - does nothing in tests
  return Promise.resolve();
};
