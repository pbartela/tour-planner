/**
 * Email service using Resend for custom email templates
 * Provides full control over email content and templates
 */

import { Resend } from "resend";
import { render } from "@react-email/render";
import { ENV, isDevelopment } from "./env-validation.service";
import { secureError } from "./logger.service";
import { InvitationEmail } from "@/lib/templates/invitation-email";
import { AuthEmail } from "@/lib/templates/auth-email";
import { sendEmailThroughInbucket } from "./email-dev.middleware";

// Initialize Resend client
const resend = new Resend(ENV.RESEND_API_KEY);

/**
 * Options for sending an invitation email
 */
export interface SendInvitationEmailOptions {
  to: string;
  inviterName: string;
  tourTitle: string;
  invitationUrl: string;
  expiresAt: Date;
}

/**
 * Options for sending an authentication email
 */
export interface SendAuthEmailOptions {
  to: string;
  loginUrl: string;
}

/**
 * Result from sending an email
 */
export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Sends a tour invitation email using the custom Resend template
 *
 * In development: Logs email to console and sends through Inbucket
 * In production: Sends real email via Resend
 *
 * @param options Email configuration
 * @returns Result with success status and email ID
 */
export async function sendInvitationEmail(options: SendInvitationEmailOptions): Promise<SendEmailResult> {
  try {
    const { to, inviterName, tourTitle, invitationUrl, expiresAt } = options;

    // Render React Email template to HTML
    const html = await render(InvitationEmail({ inviterName, tourTitle, invitationUrl, expiresAt }));

    const subject = `You're invited to join "${tourTitle}"!`;

    // In development, send through local Inbucket SMTP
    if (isDevelopment()) {
      console.log("📧 [DEV] Routing email to Inbucket:", {
        to,
        from: ENV.RESEND_FROM_EMAIL,
        subject,
        inviterName,
        tourTitle,
        expiresAt: expiresAt.toISOString(),
      });

      return await sendEmailThroughInbucket(to, subject, html, ENV.RESEND_FROM_EMAIL);
    }

    // In production, send email via Resend
    const { data, error } = await resend.emails.send({
      from: ENV.RESEND_FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      secureError("Failed to send invitation email via Resend", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }

    return {
      success: true,
      id: data?.id,
    };
  } catch (error) {
    secureError("Unexpected error sending invitation email", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sends an authentication email (login/registration) using the custom Resend template
 *
 * In development: Logs email to console and sends through Inbucket
 * In production: Sends real email via Resend
 *
 * @param options Email configuration
 * @returns Result with success status and email ID
 */
export async function sendAuthEmail(options: SendAuthEmailOptions): Promise<SendEmailResult> {
  try {
    const { to, loginUrl } = options;

    // Render React Email template to HTML
    const html = await render(AuthEmail({ email: to, loginUrl }));

    const subject = "Sign in to Tour Planner";

    // In development, send through local Inbucket SMTP
    if (isDevelopment()) {
      console.log("📧 [DEV] Routing authentication email to Inbucket:", {
        to,
        from: ENV.RESEND_FROM_EMAIL,
        subject,
      });

      return await sendEmailThroughInbucket(to, subject, html, ENV.RESEND_FROM_EMAIL);
    }

    // In production, send email via Resend
    const { data, error } = await resend.emails.send({
      from: ENV.RESEND_FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      secureError("Failed to send authentication email via Resend", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }

    return {
      success: true,
      id: data?.id,
    };
  } catch (error) {
    secureError("Unexpected error sending authentication email", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generic email sending function for future use
 * Can be extended to support other email types (notifications, reminders, etc.)
 *
 * @param to Recipient email address
 * @param subject Email subject
 * @param html HTML content
 * @returns Result with success status and email ID
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<SendEmailResult> {
  try {
    // In development, send through local Inbucket SMTP
    if (isDevelopment()) {
      console.log("📧 [DEV] Routing email to Inbucket:", {
        to,
        from: ENV.RESEND_FROM_EMAIL,
        subject,
      });

      return await sendEmailThroughInbucket(to, subject, html, ENV.RESEND_FROM_EMAIL);
    }

    // In production, send email via Resend
    const { data, error } = await resend.emails.send({
      from: ENV.RESEND_FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      secureError("Failed to send email via Resend", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }

    return {
      success: true,
      id: data?.id,
    };
  } catch (error) {
    secureError("Unexpected error sending email", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
