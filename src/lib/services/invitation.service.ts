import type { SupabaseClient } from "@/db/supabase.client";
import { secureError } from "@/lib/server/logger.service";
import { createSupabaseAdminClient } from "@/db/supabase.admin.client";
import type {
  InvitationDto,
  SendInvitationsResponse,
  InvitationByTokenDto,
  AcceptInvitationResponse,
  PaginatedInvitationsDto,
} from "@/types";
import { ensureTourNotArchived } from "@/lib/utils/tour-status.util";
import { randomBytes } from "crypto";
import { isPastDate } from "@/lib/utils/date-formatters";
import { ENV } from "../server/env-validation.service";

class InvitationService {
  /**
   * Lists all invitations for a tour with pagination support.
   * Only accessible by tour owner (enforced by RLS).
   *
   * @param supabase - Supabase client
   * @param tourId - Tour ID
   * @param page - Page number (1-indexed, default: 1)
   * @param limit - Items per page (default: 20, max: 100)
   * @returns Paginated invitations with metadata
   */
  public async listTourInvitations(
    supabase: SupabaseClient,
    tourId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedInvitationsDto> {
    try {
      // Calculate offset for pagination (convert 1-indexed page to 0-indexed offset)
      const offset = (page - 1) * limit;

      // Get total count for pagination metadata
      const { count, error: countError } = await supabase
        .from("invitations")
        .select("id", { count: "exact", head: true })
        .eq("tour_id", tourId);

      if (countError) {
        secureError("Error counting invitations", countError);
        throw new Error("Failed to count invitations.");
      }

      // Fetch paginated invitations
      const { data: invitations, error } = await supabase
        .from("invitations")
        .select(
          `
          id,
          tour_id,
          inviter_id,
          email,
          status,
          token,
          expires_at,
          created_at,
          tours!tour_id (
            title
          ),
          profiles!inviter_id (
            display_name
          )
        `
        )
        .eq("tour_id", tourId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        secureError("Error fetching invitations from database", error);
        throw new Error("Failed to fetch invitations from the database.");
      }

      // Transform to InvitationDto
      const transformedInvitations = (invitations || []).map((inv): InvitationDto => {
        const tours = Array.isArray(inv.tours) ? inv.tours : inv.tours ? [inv.tours] : null;
        const profiles = Array.isArray(inv.profiles) ? inv.profiles : inv.profiles ? [inv.profiles] : null;
        const { tours: _tours, profiles: _profiles, ...invitationData } = inv;
        return {
          ...invitationData,
          token: inv.token || undefined,
          tour_title: tours && tours.length > 0 ? (tours[0] as { title: string }).title : undefined,
          inviter_display_name:
            profiles && profiles.length > 0
              ? (profiles[0] as { display_name: string | null }).display_name || undefined
              : undefined,
        } as InvitationDto;
      });

      return {
        data: transformedInvitations,
        pagination: {
          page,
          limit,
          total: count || 0,
        },
      };
    } catch (error) {
      secureError("Unexpected error in listTourInvitations", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * Gets all pending (non-expired) invitations for a user by their email.
   * Used to display pending invitations indicator in the navigation.
   */
  public async getUserPendingInvitations(supabase: SupabaseClient, userEmail: string): Promise<InvitationDto[]> {
    try {
      const now = new Date().toISOString();

      const { data: invitations, error } = await supabase
        .from("invitations")
        .select(
          `
          id,
          tour_id,
          inviter_id,
          email,
          status,
          token,
          expires_at,
          created_at,
          tours!tour_id (
            title
          ),
          profiles!inviter_id (
            display_name
          )
        `
        )
        .eq("email", userEmail.toLowerCase())
        .eq("status", "pending")
        .gt("expires_at", now)
        .order("created_at", { ascending: false });

      if (error) {
        secureError("Error fetching user pending invitations from database", error);
        throw new Error("Failed to fetch pending invitations from the database.");
      }

      // Transform to InvitationDto
      return (invitations || []).map((inv): InvitationDto => {
        const tours = Array.isArray(inv.tours) ? inv.tours : inv.tours ? [inv.tours] : null;
        const profiles = Array.isArray(inv.profiles) ? inv.profiles : inv.profiles ? [inv.profiles] : null;
        const { tours: _tours, profiles: _profiles, ...invitationData } = inv;
        return {
          ...invitationData,
          token: inv.token || undefined,
          tour_title: tours && tours.length > 0 ? (tours[0] as { title: string }).title : undefined,
          inviter_display_name:
            profiles && profiles.length > 0
              ? (profiles[0] as { display_name: string | null }).display_name || undefined
              : undefined,
        } as InvitationDto;
      });
    } catch (error) {
      secureError("Unexpected error in getUserPendingInvitations", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * Gets an invitation by token.
   * Public endpoint - no authentication required.
   */
  public async getInvitationByToken(supabase: SupabaseClient, token: string): Promise<InvitationByTokenDto | null> {
    try {
      const { data: invitation, error } = await supabase
        .from("invitations")
        .select(
          `
          id,
          tour_id,
          inviter_id,
          email,
          status,
          expires_at,
          created_at,
          tours!tour_id (
            title,
            status
          )
        `
        )
        .eq("token", token)
        .eq("status", "pending")
        .maybeSingle();

      if (error) {
        secureError("Error fetching invitation by token", error);
        throw new Error("Failed to fetch invitation.");
      }

      if (!invitation) {
        return null;
      }

      // Check if expired
      const isExpired = isPastDate(invitation.expires_at);

      // SECURITY: Get inviter email and display name from profiles
      // Inviter email is shown to invitation recipient ("Invited by: email@example.com").
      // Email comes from profiles.email (synced from auth.users via trigger).
      // Previous implementation used admin client, now uses profiles table.
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", invitation.inviter_id)
        .maybeSingle();

      const tours = invitation.tours as
        | { title: string; status: "planning" | "confirmed" | "archived" }[]
        | null
        | undefined;
      return {
        id: invitation.id,
        tour_id: invitation.tour_id,
        tour_title: tours && tours.length > 0 ? tours[0].title : "",
        tour_status: tours && tours.length > 0 ? tours[0].status : "planning",
        inviter_email: profile?.email || "",
        inviter_display_name: profile?.display_name || undefined,
        email: invitation.email,
        status: invitation.status,
        expires_at: invitation.expires_at,
        is_expired: isExpired,
      };
    } catch (error) {
      secureError("Unexpected error in getInvitationByToken", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * Sends invitations to a list of email addresses.
   * Filters out emails that are already participants or have pending invitations.
   * Creates invitation records (token generated by trigger).
   * Generates custom OTP tokens and sends custom emails.
   *
   * Custom OTP Flow (100% server-side, passwordless):
   * 1. Generate cryptographically secure OTP token (32 bytes)
   * 2. Store OTP in database with link to invitation token
   * 3. Send custom email with link: /{locale}/auth/verify-invitation?otp=XXX
   * 4. When user clicks: server creates account (if new) + logs in + redirects to /invite
   *
   * This is 100% passwordless - no passwords involved anywhere.
   */
  public async sendInvitations(
    supabase: SupabaseClient,
    tourId: string,
    inviterId: string,
    emails: string[],
    siteUrl: string // Base URL of the application (e.g., http://localhost:3000)
  ): Promise<SendInvitationsResponse> {
    const sent: string[] = [];
    const skipped: string[] = [];
    const errors: { email: string; error: string }[] = [];

    try {
      // Prevent sending invitations to archived tours
      await ensureTourNotArchived(supabase, tourId);

      // Normalize emails (lowercase, trim)
      const normalizedEmails = emails.map((email) => email.toLowerCase().trim());

      // Get tour details for email template
      const { data: tour, error: tourError } = await supabase
        .from("tours")
        .select("title")
        .eq("id", tourId)
        .maybeSingle();

      if (tourError || !tour) {
        secureError("Error fetching tour details", tourError);
        throw new Error("Failed to fetch tour details.");
      }

      // Get inviter profile for email template
      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", inviterId)
        .maybeSingle();

      const inviterName = inviterProfile?.display_name || "A tour organizer";

      // Get existing participants for this tour
      const { data: participants, error: participantsError } = await supabase
        .from("participants")
        .select("user_id, profiles!participants_user_id_fkey(id, email)")
        .eq("tour_id", tourId);

      if (participantsError) {
        secureError("Error fetching participants", participantsError);
        throw new Error("Failed to check existing participants.");
      }

      // SECURITY: Get user emails for participants (from profiles table)
      // This prevents duplicate invitations to users already in the tour.
      // Email comes from profiles.email (synced from auth.users via trigger).
      // Previous implementation used admin client (N+1 queries), now uses single JOIN.
      const participantEmails = new Set<string>();
      (participants || []).forEach((p) => {
        const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
        if (profile && profile.email) {
          participantEmails.add(profile.email.toLowerCase());
        }
      });

      // Get existing pending and declined invitations for this tour
      const { data: existingInvitations, error: invitationsError } = await supabase
        .from("invitations")
        .select("email")
        .eq("tour_id", tourId)
        .in("status", ["pending", "declined"]);

      if (invitationsError) {
        secureError("Error fetching existing invitations", invitationsError);
        throw new Error("Failed to check existing invitations.");
      }

      const blockedEmails = new Set((existingInvitations || []).map((inv) => inv.email.toLowerCase()));

      // Dynamic import of email service (avoid loading in server context where it's not needed)
      const { sendInvitationEmail } = await import("@/lib/server/email.service");

      // Process each email
      for (const email of normalizedEmails) {
        try {
          // Skip if already a participant
          if (participantEmails.has(email)) {
            skipped.push(email);
            continue;
          }

          // Skip if already has pending or declined invitation
          if (blockedEmails.has(email)) {
            skipped.push(email);
            continue;
          }

          // Create invitation (token generated by trigger)
          const { data: invitation, error: insertError } = await supabase
            .from("invitations")
            .insert({
              tour_id: tourId,
              inviter_id: inviterId,
              email: email,
            })
            .select("id, token, expires_at")
            .single();

          if (insertError) {
            secureError(`Error creating invitation for ${email}`, insertError);
            errors.push({ email, error: "Failed to create invitation" });
            continue;
          }

          if (!invitation || !invitation.token) {
            errors.push({ email, error: "Failed to generate invitation token" });
            continue;
          }

          // Generate cryptographically secure OTP token (32 bytes = 64 hex chars)
          const otpToken = randomBytes(32).toString("hex");

          // OTP expires in 1 hour
          const otpExpiresAt = new Date();
          otpExpiresAt.setHours(otpExpiresAt.getHours() + 1);

          const adminClient = createSupabaseAdminClient();

          // Store OTP in database
          const { error: otpError } = await adminClient.from("invitation_otp").insert({
            email: email,
            otp_token: otpToken,
            invitation_token: invitation.token,
            expires_at: otpExpiresAt.toISOString(),
          });

          if (otpError) {
            secureError("Error creating OTP token", otpError);
            errors.push({ email, error: "Failed to create authentication token" });
            continue;
          }

          // Build invitation URL with OTP (use default locale for new users)
          const baseUrl = siteUrl.replace(/\/$/, ""); // Remove trailing slash
          const locale = ENV.PUBLIC_DEFAULT_LOCALE;
          const invitationUrl = `${baseUrl}/${locale}/auth/verify-invitation?otp=${otpToken}`;

          // Send invitation email via custom email service
          try {
            const emailResult = await sendInvitationEmail({
              to: email,
              inviterName,
              tourTitle: tour.title,
              invitationUrl,
              expiresAt: new Date(invitation.expires_at),
            });

            if (!emailResult.success) {
              secureError("Failed to send invitation email", { error: emailResult.error });
              errors.push({ email, error: emailResult.error || "Failed to send invitation email" });
              continue;
            }

            sent.push(email);
          } catch (err) {
            secureError("Error sending invitation email", err);
            errors.push({ email, error: "Failed to send invitation" });
            continue;
          }
        } catch (error) {
          secureError(`Unexpected error processing invitation for ${email}`, error);
          errors.push({
            email,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return { sent, skipped, errors };
    } catch (error) {
      secureError("Unexpected error in sendInvitations", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * Cancels (deletes) an invitation.
   * Only tour owner can cancel (enforced by RLS).
   */
  public async cancelInvitation(supabase: SupabaseClient, invitationId: string): Promise<void> {
    try {
      const { error } = await supabase.from("invitations").delete().eq("id", invitationId);

      if (error) {
        secureError("Error canceling invitation", error);
        throw new Error("Failed to cancel invitation. It may not exist or you may not have permission.");
      }
    } catch (error) {
      secureError("Unexpected error in cancelInvitation", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * Accepts an invitation using the database function.
   * Verifies email match and adds user as participant.
   */
  public async acceptInvitation(
    supabase: SupabaseClient,
    token: string,
    userId: string
  ): Promise<AcceptInvitationResponse> {
    try {
      // First, get the invitation to check the tour status
      const invitation = await this.getInvitationByToken(supabase, token);
      if (!invitation) {
        throw new Error("This invitation is invalid or has expired.");
      }

      // Prevent accepting invitations to archived tours
      if (invitation.tour_status === "archived") {
        throw new Error("Cannot accept invitation to an archived tour. Archived tours are read-only.");
      }

      // Call the database function
      const { data, error } = await supabase.rpc("accept_invitation", {
        invitation_token: token,
        accepting_user_id: userId,
      });

      if (error) {
        secureError("Error accepting invitation", error);
        // Parse error message to provide user-friendly feedback
        if (error.message.includes("Invalid or expired")) {
          throw new Error("This invitation is invalid or has expired.");
        }
        if (error.message.includes("email does not match")) {
          throw new Error("This invitation was sent to a different email address.");
        }
        if (error.message.includes("already a participant")) {
          throw new Error("You are already a participant in this tour.");
        }
        throw new Error("Failed to accept invitation.");
      }

      if (!data) {
        throw new Error("Failed to retrieve tour ID after accepting invitation.");
      }

      return {
        tour_id: data,
        message: "Invitation accepted successfully",
      };
    } catch (error) {
      secureError("Unexpected error in acceptInvitation", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * Declines an invitation using the database function.
   * Verifies email match and changes status to declined.
   */
  public async declineInvitation(
    supabase: SupabaseClient,
    token: string,
    userId: string
  ): Promise<AcceptInvitationResponse> {
    try {
      // Call the database function
      const { data, error } = await supabase.rpc("decline_invitation", {
        invitation_token: token,
        declining_user_id: userId,
      });

      if (error) {
        secureError("Error declining invitation", error);
        // Parse error message to provide user-friendly feedback
        if (error.message.includes("Invalid or expired")) {
          throw new Error("This invitation is invalid or has expired.");
        }
        if (error.message.includes("email does not match")) {
          throw new Error("This invitation was sent to a different email address.");
        }
        throw new Error("Failed to decline invitation.");
      }

      if (!data) {
        throw new Error("Failed to retrieve tour ID after declining invitation.");
      }

      return {
        tour_id: data,
        message: "Invitation declined successfully",
      };
    } catch (error) {
      secureError("Unexpected error in declineInvitation", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * Resends an invitation for declined or expired invitations.
   * Resets status to pending, generates new token, and sends email.
   * Only tour owner can resend (enforced by RLS).
   */
  public async resendInvitation(
    supabase: SupabaseClient,
    invitationId: string,
    inviterId: string,
    siteUrl: string
  ): Promise<void> {
    try {
      // Get the invitation to verify it exists and get email/tour_id
      const { data: invitation, error: fetchError } = await supabase
        .from("invitations")
        .select("id, tour_id, email, status, expires_at")
        .eq("id", invitationId)
        .maybeSingle();

      if (fetchError) {
        secureError("Error fetching invitation for resend", fetchError);
        throw new Error("Failed to fetch invitation.");
      }

      if (!invitation) {
        throw new Error("Invitation not found.");
      }

      // Prevent resending invitations to archived tours
      await ensureTourNotArchived(supabase, invitation.tour_id);

      // Only allow resending declined or expired invitations
      if (invitation.status === "accepted") {
        throw new Error("Cannot resend an accepted invitation.");
      }

      // Get tour details for email template
      const { data: tour, error: tourError } = await supabase
        .from("tours")
        .select("title")
        .eq("id", invitation.tour_id)
        .maybeSingle();

      if (tourError || !tour) {
        secureError("Error fetching tour details", tourError);
        throw new Error("Failed to fetch tour details.");
      }

      // Get inviter profile for email template
      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", inviterId)
        .maybeSingle();

      const inviterName = inviterProfile?.display_name || "A tour organizer";

      // Calculate new expiration date (default 7 days from now)
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      // Generate new unique token (32 hex characters = 128 bits)
      const generateToken = (): string => {
        return randomBytes(16).toString("hex");
      };

      // Generate unique token (try up to 10 times to ensure uniqueness)
      let newToken = generateToken();
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const { data: existing } = await supabase.from("invitations").select("id").eq("token", newToken).maybeSingle();

        if (!existing) {
          break; // Token is unique
        }

        newToken = generateToken();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error("Failed to generate unique invitation token");
      }

      // Update invitation: reset status to pending, set new token, update expires_at
      const { data: updatedInvitation, error: updateError } = await supabase
        .from("invitations")
        .update({
          status: "pending",
          token: newToken,
          expires_at: newExpiresAt.toISOString(),
        })
        .eq("id", invitationId)
        .select("token")
        .single();

      if (updateError) {
        secureError("Error updating invitation for resend", updateError);
        throw new Error("Failed to update invitation.");
      }

      if (!updatedInvitation || !updatedInvitation.token) {
        throw new Error("Failed to generate new invitation token.");
      }

      // Generate cryptographically secure OTP token (32 bytes = 64 hex chars)
      const otpToken = randomBytes(32).toString("hex");

      // OTP expires in 1 hour
      const otpExpiresAt = new Date();
      otpExpiresAt.setHours(otpExpiresAt.getHours() + 1);

      const adminClient = createSupabaseAdminClient();

      // Store OTP in database
      const { error: otpError } = await adminClient.from("invitation_otp").insert({
        email: invitation.email,
        otp_token: otpToken,
        invitation_token: updatedInvitation.token,
        expires_at: otpExpiresAt.toISOString(),
      });

      if (otpError) {
        secureError("Error creating OTP token for resend", otpError);
        throw new Error("Failed to create authentication token.");
      }

      // Build invitation URL with OTP (use default locale for new users)
      const baseUrl = siteUrl.replace(/\/$/, ""); // Remove trailing slash
      const locale = ENV.PUBLIC_DEFAULT_LOCALE;
      const invitationUrl = `${baseUrl}/${locale}/auth/verify-invitation?otp=${otpToken}`;

      // Dynamic import of email service
      const { sendInvitationEmail } = await import("@/lib/server/email.service");

      // Send invitation email via custom email service
      try {
        const emailResult = await sendInvitationEmail({
          to: invitation.email,
          inviterName,
          tourTitle: tour.title,
          invitationUrl,
          expiresAt: newExpiresAt,
        });

        if (!emailResult.success) {
          secureError("Failed to send resend invitation email", { error: emailResult.error });
          throw new Error(emailResult.error || "Failed to send invitation email.");
        }
      } catch (err) {
        secureError("Error sending resend invitation email", err);
        throw err instanceof Error ? err : new Error("An unexpected error occurred.");
      }
    } catch (error) {
      secureError("Unexpected error in resendInvitation", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }
}

export const invitationService = new InvitationService();
