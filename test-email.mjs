/**
 * Test script for email service
 * Run with: node test-email.mjs
 */

import nodemailer from "nodemailer";

const SMTP_CONFIG = {
  host: "localhost",
  port: 54325,
  secure: false,
  auth: undefined,
};

async function testEmail() {
  console.log("🧪 Testing email service...");
  console.log("📧 SMTP Config:", SMTP_CONFIG);

  try {
    // Create transport
    const transport = nodemailer.createTransport(SMTP_CONFIG);

    // Verify connection
    console.log("\n1️⃣ Verifying SMTP connection...");
    await transport.verify();
    console.log("✅ SMTP connection verified!");

    // Send test email
    console.log("\n2️⃣ Sending test email...");
    const info = await transport.sendMail({
      from: "Tour Planner <noreply@example.com>",
      to: "test@example.com",
      subject: "Test Email from Tour Planner",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #2563eb;">Email Test Successful! 🎉</h1>
            <p>This is a test email from Tour Planner email service.</p>
            <p>If you can see this in Mailpit/Inbucket, the email system is working correctly!</p>
            <hr>
            <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
          </body>
        </html>
      `,
    });

    console.log("✅ Email sent successfully!");
    console.log("📨 Message ID:", info.messageId);
    console.log("\n🌐 View email in Mailpit: http://localhost:54324");
    console.log("📬 Check mailbox for: test@example.com");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("\n🔧 Troubleshooting:");
    console.error("  1. Make sure Supabase is running: npx supabase status");
    console.error("  2. Check if SMTP port is accessible: nc -zv localhost 54325");
    console.error("  3. Check Docker containers: docker ps | grep inbucket");
    process.exit(1);
  }
}

testEmail();
