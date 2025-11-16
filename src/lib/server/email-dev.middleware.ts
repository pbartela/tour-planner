/**
 * Development email middleware
 * Routes emails to local Inbucket SMTP server in development mode
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
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

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
};

// Lazy-initialized transport (created on first use)
let transportInstance: Transporter | null = null;
let isInitializing = false;

/**
 * Utility function to sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates and verifies the nodemailer transport with retry logic
 * Uses exponential backoff for retries
 *
 * @returns Verified nodemailer transport
 * @throws Error if connection fails after all retries
 */
async function createAndVerifyTransport(): Promise<Transporter> {
  let lastError: Error | null = null;
  let delay = RETRY_CONFIG.initialDelayMs;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`🔄 [DEV-INBUCKET] Creating transport (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})...`);

      const transport = nodemailer.createTransport(INBUCKET_CONFIG);

      // Verify the connection
      await transport.verify();

      console.log("✅ [DEV-INBUCKET] Transport created and verified successfully");
      return transport;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < RETRY_CONFIG.maxRetries) {
        console.warn(
          `⚠️ [DEV-INBUCKET] Connection failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}), retrying in ${delay}ms...`
        );
        await sleep(delay);
        delay = Math.min(delay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelayMs);
      }
    }
  }

  // All retries exhausted
  const errorMessage = `Failed to connect to Inbucket after ${RETRY_CONFIG.maxRetries + 1} attempts. Is Mailpit/Inbucket running? (${INBUCKET_CONFIG.host}:${INBUCKET_CONFIG.port})`;
  console.error(`❌ [DEV-INBUCKET] ${errorMessage}`);
  secureError(errorMessage, lastError);

  throw new Error(errorMessage);
}

/**
 * Gets or creates the nodemailer transport instance
 * Implements lazy initialization with connection retry logic
 *
 * @returns Nodemailer transport instance
 * @throws Error if transport cannot be created
 */
async function getTransport(): Promise<Transporter> {
  // Return cached instance if available
  if (transportInstance) {
    return transportInstance;
  }

  // Prevent concurrent initialization attempts
  if (isInitializing) {
    // Wait for ongoing initialization
    while (isInitializing) {
      await sleep(50);
    }
    if (transportInstance) {
      return transportInstance;
    }
  }

  // Initialize the transport
  isInitializing = true;
  try {
    transportInstance = await createAndVerifyTransport();
    return transportInstance;
  } finally {
    isInitializing = false;
  }
}

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

    // Get or create transport with retry logic
    const transport = await getTransport();

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
 *
 * @returns true if connection is successful, false otherwise
 */
export async function verifyInbucketConnection(): Promise<boolean> {
  try {
    // This will attempt to create and verify the transport with retry logic
    await getTransport();
    console.log("✅ [DEV-INBUCKET] Connection verified");
    return true;
  } catch (error) {
    console.error("❌ [DEV-INBUCKET] Connection failed:", error);
    secureError("Inbucket connection verification failed", error);
    return false;
  }
}

/**
 * Resets the transport instance
 * Useful for testing or when Inbucket restarts
 */
export function resetTransport(): void {
  if (transportInstance) {
    transportInstance.close();
    transportInstance = null;
    console.log("🔄 [DEV-INBUCKET] Transport reset");
  }
}
