/**
 * Test OTP verification directly for t@t.pl
 * Simulates what happens when clicking the magic link
 */

const OTP_TOKEN = "5cd2d6df2bff101ce9b020c8bdec78e61c74b89d864f057bc0082f2f544d2772";
const BASE_URL = "http://localhost:3000";

async function testOtpVerification() {
  console.log("🧪 Testing OTP verification for t@t.pl");
  console.log("=".repeat(70));
  console.log(`\nOTP Token: ${OTP_TOKEN}`);
  console.log(`URL: ${BASE_URL}/auth/verify-otp?otp=${OTP_TOKEN}\n`);

  try {
    console.log("📤 Clicking magic link (following redirects)...\n");

    const response = await fetch(`${BASE_URL}/auth/verify-otp?otp=${OTP_TOKEN}`, {
      redirect: "manual", // Don't auto-follow redirects so we can see them
    });

    console.log(`Response Status: ${response.status}`);
    console.log(`Response Status Text: ${response.statusText}`);

    const location = response.headers.get("location");
    if (location) {
      console.log(`\n🔀 Redirect Location: ${location}`);

      if (location.includes("/auth/error")) {
        const url = new URL(location, BASE_URL);
        const errorCode = url.searchParams.get("error");
        console.log(`\n❌ ERROR DETECTED: ${errorCode}`);
        console.log("\nPossible error codes:");
        console.log("  - invalid_link: OTP not found or invalid format");
        console.log("  - link_expired: OTP has expired");
        console.log("  - link_used: OTP already used");
        console.log("  - unexpected_error: Something went wrong in the flow");
        console.log("  - verification_failed: Error fetching OTP");
        console.log("  - account_creation_failed: Failed to create user");
        console.log("  - session_creation_failed: Failed to create session");
      } else {
        console.log(`\n✅ SUCCESS: Redirected to ${location}`);
      }
    } else {
      console.log("\n⚠️  No redirect - unexpected response");
    }
  } catch (error) {
    console.error("\n❌ Request failed:", error.message);
  }

  console.log("\n" + "=".repeat(70));
}

testOtpVerification();
