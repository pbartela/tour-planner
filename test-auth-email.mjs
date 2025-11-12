/**
 * Test script for authentication email flow
 * Tests the custom OTP authentication system
 */

const BASE_URL = "http://localhost:3000";
const TEST_EMAIL = "test-auth@example.com";

async function testAuthFlow() {
  console.log("🧪 Testing authentication OTP flow...\n");

  try {
    // Step 1: Request magic link
    console.log("1️⃣  Requesting magic link for:", TEST_EMAIL);
    const response = await fetch(`${BASE_URL}/api/auth/magic-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        redirectTo: "/tours",
        locale: "en-US",
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Magic link request successful:", data.message);
      console.log("\n📬 Check Mailpit for the email:");
      console.log("   http://localhost:54324");
      console.log("\n💡 The email will contain a link like:");
      console.log("   http://localhost:3000/auth/verify-otp?otp=...");
      console.log("\n   Click the link to complete authentication.");
    } else {
      console.log("❌ Magic link request failed:", data);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testAuthFlow();
