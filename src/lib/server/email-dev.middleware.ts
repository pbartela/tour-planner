/**
 * Development email middleware
 * Routes emails to local Inbucket SMTP server in development mode
 */

import nodemailer from "nodemailer";
import type { SendEmailResult } from "./email.service";
import { secureError } from "./logger.service";

// Local Inbucket/Mailpit SMTP configuration
// Matches the configuration in supabase/config.toml (smtp_port = 54325)
const INBUCKET_CONFIG = {
  host: "localhost",
  port: 54325, // Inbucket/Mailpit SMTP port (configured in supabase/config.toml)
  secure: false, // No TLS for local development
  auth: undefined, // Inbucket/Mailpit doesn't require auth
};

// Create nodemailer transport for local Inbucket
const transport = nodemailer.createTransport(INBUCKET_CONFIG);

/**
 * Sends an email through local Inbucket SMTP server
 * Used in development mode to capture emails locally
 *
 * @param to Recipient email address
 * @param subject Email subject
 * @param html HTML content
 * @param from Sender email address
 * @returns Result with success status
 */
export async function sendEmailThroughInbucket(
  to: string,
  subject: string,
  html: string,
  from: string
): Promise<SendEmailResult> {
  try {
    console.log("📧 [DEV-INBUCKET] Sending email through local Inbucket:", {
      to,
      from,
      subject,
      host: INBUCKET_CONFIG.host,
      port: INBUCKET_CONFIG.port,
    });

    const info = await transport.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log("✅ [DEV-INBUCKET] Email sent successfully:", {
      messageId: info.messageId,
      inbucketUrl: `http://localhost:54324`,
      mailbox: to,
    });

    return {
      success: true,
      id: info.messageId,
    };
  } catch (error) {
    secureError("Failed to send email through Inbucket", error);
    console.error("❌ [DEV-INBUCKET] Failed to send email:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Verifies that Inbucket SMTP server is available
 * Useful for debugging connection issues
 */
export async function verifyInbucketConnection(): Promise<boolean> {
  try {
    await transport.verify();
    console.log("✅ [DEV-INBUCKET] Connection verified");
    return true;
  } catch (error) {
    console.error("❌ [DEV-INBUCKET] Connection failed:", error);
    secureError("Inbucket connection verification failed", error);
    return false;
  }
}
