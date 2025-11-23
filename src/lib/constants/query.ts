import { minutes } from "./time";

/**
 * Query configuration constants for React Query
 * Defines stale times for different types of data
 */
export const QUERY_STALE_TIME = {
  /** Data that changes infrequently (tags, profiles, etc.) */
  INFREQUENT: minutes(5),
  /** Data that changes moderately (tours, participants, etc.) */
  MODERATE: minutes(2),
  /** Data that changes frequently (comments, votes, etc.) */
  FREQUENT: minutes(1),
  /** Data that should always be fresh */
  ALWAYS_FRESH: 0,
} as const;
