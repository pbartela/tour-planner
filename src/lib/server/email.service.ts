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

// Lazy-initialized Resend client
let resendClient: Resend | null = null;

/**
 * Checks if the application is running in test/CI mode where emails should route to Mailpit
 * @returns True if in test/CI mode, false otherwise
 */
function isTestMode(): boolean {
  return process.env.TEST_MODE === "true" || process.env.CI === "true";
}

/**
 * Checks if emails should be routed to local Mailpit/Inbucket instead of Resend
 * @returns True if using local email server, false otherwise
 */
function useLocalEmailServer(): boolean {
  return isDevelopment() || isTestMode();
}

/**
 * Validates that required email environment variables are present
 * In development or test mode, Resend credentials are optional (uses Mailpit/Inbucket)
 * @throws Error if RESEND_API_KEY or RESEND_FROM_EMAIL are missing in production
 */
function validateEmailConfig(): void {
  // In development or test mode, email routing goes through Mailpit/Inbucket SMTP
  // So Resend credentials are not required
  if (useLocalEmailServer()) {
    const mode = isDevelopment() ? "DEV" : "TEST";
    console.log(`📧 [${mode}] Email validation skipped - using Mailpit/Inbucket`);
    return;
  }

  // In production, require Resend credentials
  if (!ENV.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured. Please set it in your .env file to enable email functionality.");
  }
  if (!ENV.RESEND_FROM_EMAIL) {
    throw new Error(
      "RESEND_FROM_EMAIL is not configured. Please set it in your .env file to enable email functionality."
    );
  }
}

/**
 * Gets or creates the Resend client instance
 * Validates that required environment variables are present
 * @throws Error if RESEND_API_KEY or RESEND_FROM_EMAIL are missing
 */
function getResendClient(): Resend {
  if (!resendClient) {
    validateEmailConfig();
    // After validation, we know these values exist
    const apiKey = ENV.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY validation failed");
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

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
    // Validate email configuration before attempting to send
    validateEmailConfig();

    // In development mode, use a default from email if not provided
    const fromEmail = ENV.RESEND_FROM_EMAIL || "Tour Planner <noreply@localhost>";

    const { to, inviterName, tourTitle, invitationUrl, expiresAt } = options;

    // Render React Email template to HTML
    const html = await render(InvitationEmail({ inviterName, tourTitle, invitationUrl, expiresAt }));

    const subject = `You're invited to join "${tourTitle}"!`;

    // In development or test mode, send through local Inbucket/Mailpit SMTP
    if (useLocalEmailServer()) {
      const mode = isDevelopment() ? "DEV" : "TEST";
      console.log(`📧 [${mode}] Routing email to Inbucket/Mailpit:`, {
        to,
        from: fromEmail,
        subject,
        inviterName,
        tourTitle,
        expiresAt: expiresAt.toISOString(),
      });

      return await sendEmailThroughInbucket(to, subject, html, fromEmail);
    }

    // In production, send email via Resend
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: fromEmail,
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
    // Validate email configuration before attempting to send
    validateEmailConfig();

    // In development mode, use a default from email if not provided
    const fromEmail = ENV.RESEND_FROM_EMAIL || "Tour Planner <noreply@localhost>";

    const { to, loginUrl } = options;

    // Render React Email template to HTML
    const html = await render(AuthEmail({ email: to, loginUrl }));

    const subject = "Sign in to Tour Planner";

    // In development or test mode, send through local Inbucket/Mailpit SMTP
    if (useLocalEmailServer()) {
      const mode = isDevelopment() ? "DEV" : "TEST";
      console.log(`📧 [${mode}] Routing authentication email to Inbucket/Mailpit:`, {
        to,
        from: fromEmail,
        subject,
      });

      return await sendEmailThroughInbucket(to, subject, html, fromEmail);
    }

    // In production, send email via Resend
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: fromEmail,
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
    // Validate email configuration before attempting to send
    validateEmailConfig();

    // In development mode, use a default from email if not provided
    const fromEmail = ENV.RESEND_FROM_EMAIL || "Tour Planner <noreply@localhost>";

    // In development or test mode, send through local Inbucket/Mailpit SMTP
    if (useLocalEmailServer()) {
      const mode = isDevelopment() ? "DEV" : "TEST";
      console.log(`📧 [${mode}] Routing email to Inbucket/Mailpit:`, {
        to,
        from: fromEmail,
        subject,
      });

      return await sendEmailThroughInbucket(to, subject, html, fromEmail);
    }

    // In production, send email via Resend
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: fromEmail,
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
