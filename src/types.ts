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
  Pick<Tables<"profiles">, "display_name" | "avatar_url" | "language" | "theme" | "onboarding_completed">
>;

// ============================================================================
// Tours
// ============================================================================

/**
 * Metadata extracted from tour destination URLs.
 * Includes Open Graph metadata like title, description, and images.
 */
export interface TourMetadata {
  title?: string;
  description?: string;
  image?: string;
  canonicalUrl?: string;
}

/**
 * DTO for a summarized view of a tour.
 * Used in lists where full details are not necessary.
 * Corresponds to an item in the response of `GET /api/tours`.
 */
export type TourSummaryDto = Pick<
  Tables<"tours">,
  "id" | "title" | "destination" | "start_date" | "end_date" | "status" | "updated_at"
> & {
  has_new_activity: boolean;
  metadata?: TourMetadata;
  participants?: ParticipantSummaryDto[];
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
  destination: string;
  dateRange: string;
  hasNewActivity: boolean;
  imageUrl?: string;
  participants?: ParticipantSummaryDto[];
  status?: "active" | "archived";
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
export type TourDetailsDto = Omit<Tables<"tours">, "updated_at"> & {
  metadata?: TourMetadata;
};

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
 *
 * SECURITY: Email is ALWAYS included and visible to all tour co-participants.
 * This is intentional for identity verification and transparency in group planning.
 * Protected by RLS - only tour participants can access this data.
 *
 * Email is used as fallback display when display_name is null.
 * See docs/PRIVACY.md and docs/SECURITY_ARCHITECTURE.md for rationale.
 *
 * Corresponds to an item in the response of `GET /api/tours/{tourId}/participants`.
 */
export type ParticipantDto = Pick<Tables<"participants">, "user_id" | "joined_at"> &
  Pick<Tables<"profiles">, "display_name" | "avatar_url"> & {
    email: string; // ALWAYS visible to co-participants (by design)
  };

/**
 * DTO for a summarized view of a tour participant.
 * Used in tour lists to display participant avatars with minimal data transfer.
 *
 * SECURITY: Email is ALWAYS included and visible to all tour co-participants.
 * Used for generating initials when display_name is null.
 * Protected by RLS - only tour participants can access this data.
 */
export type ParticipantSummaryDto = Pick<Tables<"profiles">, "display_name" | "avatar_url"> & {
  user_id: string;
  email: string; // ALWAYS visible to co-participants (by design)
};

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

/**
 * DTO for an invitation.
 * Includes optional tour and inviter information for display purposes.
 *
 * SECURITY: Email is the invitation recipient address.
 * Visible to tour owner (who sent invitation) and recipient (who received it).
 * Protected by RLS - only owner or recipient (email match) can access.
 *
 * Corresponds to an item in the response of `GET /api/tours/{tourId}/invitations`.
 */
export type InvitationDto = Tables<"invitations"> & {
  token?: string; // invitation token (generated by trigger)
  expires_at: string; // expiration date (added in migration)
  tour_title?: string; // for display on acceptance page
  inviter_display_name?: string; // for display
  // email: inherited from Tables<"invitations"> - visible to owner and recipient
};

/**
 * Response from sending invitations.
 * Contains lists of successfully sent, skipped, and errored invitations.
 * Corresponds to the response of `POST /api/tours/{tourId}/invitations`.
 */
export interface SendInvitationsResponse {
  sent: string[];
  skipped: string[];
  errors: { email: string; error: string }[];
}

/**
 * Response from reading an invitation by token.
 * Used on the invitation acceptance page before login.
 *
 * SECURITY: This is a PUBLIC endpoint (no authentication required).
 * Exposes both inviter_email and recipient email to anyone with the token.
 * This is intentional - user needs to see who invited them and verify their own email.
 *
 * Token is cryptographically random (32 bytes hex = 256 bits) making brute-force impractical.
 * Token expires after 7 days or when used.
 *
 * Corresponds to the response of `GET /api/invitations?token={token}`.
 */
export interface InvitationByTokenDto {
  id: string;
  tour_id: string;
  tour_title: string;
  tour_status: "planning" | "confirmed" | "archived";
  inviter_email: string; // PUBLIC: Visible to anyone with token
  inviter_display_name?: string;
  email: string; // PUBLIC: Recipient email visible to anyone with token
  status: "pending" | "accepted" | "declined";
  expires_at: string;
  is_expired: boolean;
}

/**
 * Response from accepting or declining an invitation.
 * Contains the tour ID for redirection.
 * Corresponds to the response of `POST /api/invitations/{invitationId}/accept` and `/decline`.
 */
export interface AcceptInvitationResponse {
  tour_id: string;
  message: string;
}

// ============================================================================
// Comments
// ============================================================================

/**
 * DTO for a comment on a tour.
 * Includes the commenter's display_name from the `profiles` table.
 *
 * SECURITY: user_email is populated ONLY when display_name is null (fallback).
 * Email is visible to all tour participants (protected by RLS).
 * If user sets a display_name, email is not exposed in comments.
 *
 * This design encourages users to set display names to reduce email exposure.
 *
 * Corresponds to an item in the response of `GET /api/tours/{tourId}/comments`.
 */
export type CommentDto = Tables<"comments"> & {
  display_name: string | null;
  user_email?: string | null; // Only populated if display_name is null
};

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
