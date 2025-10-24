import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// Generic & Helper Types
// ============================================================================

/**
 * Represents the structure of a paginated API response.
 * @template T The type of the data items in the response.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// ============================================================================
// Authentication
// ============================================================================

/**
 * Represents the authenticated user object, combining Supabase user data
 * with the application-specific profile. This is the shape of `Astro.locals.user`.
 */
export interface User {
  id: string;
  email: string;
  profile: ProfileDto;
}

// ============================================================================
// Profiles
// ============================================================================

/**
 * DTO for a user's profile.
 * Excludes `updated_at` as it's not exposed in the API.
 * Corresponds to the response body of `GET /api/profiles/me`.
 */
export type ProfileDto = Omit<Tables<"profiles">, "updated_at">;

/**
 * Command model for updating a user's profile.
 * All fields are optional for partial updates (PATCH).
 * Corresponds to the request body of `PATCH /api/profiles/me`.
 */
export type UpdateProfileCommand = Partial<
  Pick<Tables<"profiles">, "username" | "display_name" | "language" | "theme" | "onboarding_completed">
>;

// ============================================================================
// Tours
// ============================================================================

/**
 * DTO for a summarized view of a tour.
 * Used in lists where full details are not necessary.
 * Corresponds to an item in the response of `GET /api/tours`.
 */
export type TourSummaryDto = Pick<
  Tables<"tours">,
  "id" | "title" | "destination" | "start_date" | "end_date" | "status"
> & {
  has_new_activity: boolean;
};

/**
 * DTO for a paginated list of tour summaries.
 * Corresponds to the full response of `GET /api/tours`.
 */
export type PaginatedToursDto = PaginatedResponse<TourSummaryDto>;

/**
 * View model for the `TourCard.astro` component.
 * Represents the transformed data tailored for presentation.
 */
export interface TourCardViewModel {
  id: string;
  url: string;
  title: string;
  dateRange: string;
  hasNewActivity: boolean;
}

/**
 * Command model for creating a new tour.
 * Derives from the `Insert` type for the `tours` table.
 * Corresponds to the request body of `POST /api/tours`.
 */
export type CreateTourCommand = Pick<
  TablesInsert<"tours">,
  "title" | "destination" | "description" | "start_date" | "end_date" | "participant_limit" | "like_threshold"
>;

/**
 * DTO for the full details of a single tour.
 * Excludes `updated_at` as it's not exposed in the API.
 * Corresponds to the response of `GET /api/tours/{tourId}`.
 */
export type TourDetailsDto = Omit<Tables<"tours">, "updated_at">;

/**
 * Command model for updating an existing tour.
 * All fields are optional for partial updates.
 * Corresponds to the request body of `PATCH /api/tours/{tourId}`.
 */
export type UpdateTourCommand = Partial<
  Pick<
    Tables<"tours">,
    | "title"
    | "destination"
    | "description"
    | "start_date"
    | "end_date"
    | "participant_limit"
    | "like_threshold"
    | "are_votes_hidden"
  >
>;

// ============================================================================
// Participants
// ============================================================================

/**
 * DTO for a tour participant.
 * Combines data from the `participants` and `profiles` tables.
 * Corresponds to an item in the response of `GET /api/tours/{tourId}/participants`.
 */
export type ParticipantDto = Pick<Tables<"participants">, "user_id" | "joined_at"> &
  Pick<Tables<"profiles">, "username" | "display_name">;

// ============================================================================
// Invitations
// ============================================================================

/**
 * Command model for inviting users to a tour.
 * Corresponds to the request body of `POST /api/tours/{tourId}/invitations`.
 */
export interface InviteParticipantsCommand {
  emails: string[];
}

// ============================================================================
// Comments
// ============================================================================

/**
 * DTO for a comment on a tour.
 * Includes the commenter's username from the `profiles` table.
 * Corresponds to an item in the response of `GET /api/tours/{tourId}/comments`.
 */
export type CommentDto = Tables<"comments"> & Pick<Tables<"profiles">, "username">;

/**
 * DTO for a paginated list of comments.
 * Corresponds to the full response of `GET /api/tours/{tourId}/comments`.
 */
export type PaginatedCommentsDto = PaginatedResponse<CommentDto>;

/**
 * Command model for creating a new comment.
 * Corresponds to the request body of `POST /api/tours/{tourId}/comments`.
 */
export type CreateCommentCommand = Pick<TablesInsert<"comments">, "content">;

/**
 * Command model for updating an existing comment.
 * Corresponds to the request body of `PATCH /api/tours/{tourId}/comments/{commentId}`.
 */
export type UpdateCommentCommand = Pick<TablesUpdate<"comments">, "content">;

// ============================================================================
// Votes
// ============================================================================

/**
 * DTO representing the votes for a tour.
 * Includes the total count and a list of user IDs who voted.
 * Corresponds to the response of `GET /api/tours/{tourId}/votes`.
 */
export interface TourVotesDto {
  count: number;
  users: Tables<"votes">["user_id"][];
}

/**
 * DTO for the response of toggling a vote.
 * Corresponds to the response of `POST /api/tours/{tourId}/vote`.
 */
export interface ToggleVoteResponseDto {
  message: "Vote added" | "Vote removed";
}

// ============================================================================
// Tags
// ============================================================================

/**
 * Command model for adding tags to a tour.
 * Corresponds to the request body of `POST /api/tours/{tourId}/tags`.
 */
export interface AddTagsCommand {
  tags: string[];
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Represents error information for user-facing error messages.
 * Used by the error mapping service to provide localized error details.
 */
export interface ErrorInfo {
  title: string;
  message: string;
  action: string;
  errorCode: string;
}
