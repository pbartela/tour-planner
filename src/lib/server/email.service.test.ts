import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SendInvitationEmailOptions, SendAuthEmailOptions } from "./email.service";

// Mock send function - will be set up in tests
const mockSend = vi.fn();

// Mock Resend before importing the service
vi.mock("resend", () => {
  const mockSendFn = vi.fn();
  class MockResend {
    emails = {
      send: mockSendFn,
    };
  }
  return {
    Resend: MockResend,
    // Export the mock function so we can access it in tests
    getMockSend: () => mockSendFn,
  };
});

vi.mock("@react-email/render");
vi.mock("./env-validation.service", () => ({
  ENV: {
    RESEND_API_KEY: "test-api-key",
    RESEND_FROM_EMAIL: "noreply@example.com",
  },
  isDevelopment: vi.fn(),
}));
vi.mock("./logger.service");
vi.mock("./email-dev.middleware");
vi.mock("@/lib/templates/invitation-email", () => ({
  InvitationEmail: vi.fn((props) => props),
}));
vi.mock("@/lib/templates/auth-email", () => ({
  AuthEmail: vi.fn((props) => props),
}));

// Import mocked modules
import { render } from "@react-email/render";
import { isDevelopment } from "./env-validation.service";
import { secureError } from "./logger.service";
import { sendEmailThroughInbucket } from "./email-dev.middleware";
import { getMockSend } from "resend";

// Import service under test after mocks
import { sendInvitationEmail, sendAuthEmail, sendEmail } from "./email.service";

describe("email.service", () => {
  // Mock console.log to avoid cluttering test output
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  // Get the mock send function
  const mockSend = getMockSend();

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Default: not in development mode
    vi.mocked(isDevelopment).mockReturnValue(false);

    // Default render mock returns HTML string
    vi.mocked(render).mockResolvedValue("<html>Email content</html>");

    // Default Inbucket mock returns success
    vi.mocked(sendEmailThroughInbucket).mockResolvedValue({
      success: true,
      id: "inbucket-123",
    });

    // Default secureError mock (no-op)
    vi.mocked(secureError).mockImplementation(() => {});
  });

  describe("sendInvitationEmail", () => {
    const mockOptions: SendInvitationEmailOptions = {
      to: "invitee@example.com",
      inviterName: "John Doe",
      tourTitle: "Summer Vacation 2025",
      invitationUrl: "https://example.com/accept/xyz",
      expiresAt: new Date("2025-01-20T12:00:00Z"),
    };

    describe("production mode", () => {
      beforeEach(() => {
        vi.mocked(isDevelopment).mockReturnValue(false);
      });

      it("should send email successfully via Resend", async () => {
        // Mock successful Resend API response
        mockSend.mockResolvedValue({
          data: { id: "resend-email-123" },
          error: null,
        });

        const result = await sendInvitationEmail(mockOptions);

        // Verify render was called with correct template props
        expect(render).toHaveBeenCalledWith(
          expect.objectContaining({
            inviterName: mockOptions.inviterName,
            tourTitle: mockOptions.tourTitle,
            invitationUrl: mockOptions.invitationUrl,
            expiresAt: mockOptions.expiresAt,
          })
        );

        // Verify Resend was called with correct parameters
        expect(mockSend).toHaveBeenCalledWith({
          from: "noreply@example.com",
          to: mockOptions.to,
          subject: `You're invited to join "${mockOptions.tourTitle}"!`,
          html: "<html>Email content</html>",
        });

        // Verify result
        expect(result).toEqual({
          success: true,
          id: "resend-email-123",
        });

        // Verify Inbucket was NOT called in production
        expect(sendEmailThroughInbucket).not.toHaveBeenCalled();
      });

      it("should handle Resend API error", async () => {
        // Mock Resend API error
        const apiError = { message: "Invalid API key" };
        mockSend.mockResolvedValue({
          data: null,
          error: apiError,
        });

        const result = await sendInvitationEmail(mockOptions);

        // Verify error was logged
        expect(secureError).toHaveBeenCalledWith("Failed to send invitation email via Resend", apiError);

        // Verify error result
        expect(result).toEqual({
          success: false,
          error: "Invalid API key",
        });
      });

      it("should handle Resend API error without message", async () => {
        // Mock Resend API error without message property
        mockSend.mockResolvedValue({
          data: null,
          error: {},
        });

        const result = await sendInvitationEmail(mockOptions);

        expect(result).toEqual({
          success: false,
          error: "Failed to send email",
        });
      });

      it("should handle unexpected errors", async () => {
        // Mock render throwing an error
        const unexpectedError = new Error("Template rendering failed");
        vi.mocked(render).mockRejectedValue(unexpectedError);

        const result = await sendInvitationEmail(mockOptions);

        // Verify error was logged
        expect(secureError).toHaveBeenCalledWith("Unexpected error sending invitation email", unexpectedError);

        // Verify error result
        expect(result).toEqual({
          success: false,
          error: "Template rendering failed",
        });
      });

      it("should handle non-Error exceptions", async () => {
        // Mock render throwing a non-Error object
        vi.mocked(render).mockRejectedValue("String error");

        const result = await sendInvitationEmail(mockOptions);

        expect(result).toEqual({
          success: false,
          error: "Unknown error",
        });
      });
    });

    describe("development mode", () => {
      beforeEach(() => {
        vi.mocked(isDevelopment).mockReturnValue(true);
      });

      it("should route email to Inbucket", async () => {
        const result = await sendInvitationEmail(mockOptions);

        // Verify console log was called
        expect(consoleLogSpy).toHaveBeenCalledWith("📧 [DEV] Routing email to Inbucket:", {
          to: mockOptions.to,
          from: "noreply@example.com",
          subject: `You're invited to join "${mockOptions.tourTitle}"!`,
          inviterName: mockOptions.inviterName,
          tourTitle: mockOptions.tourTitle,
          expiresAt: mockOptions.expiresAt.toISOString(),
        });

        // Verify Inbucket was called
        expect(sendEmailThroughInbucket).toHaveBeenCalledWith(
          mockOptions.to,
          `You're invited to join "${mockOptions.tourTitle}"!`,
          "<html>Email content</html>",
          "noreply@example.com"
        );

        // Verify result from Inbucket
        expect(result).toEqual({
          success: true,
          id: "inbucket-123",
        });

        // Verify Resend was NOT called in development
        expect(mockSend).not.toHaveBeenCalled();
      });

      it("should handle Inbucket errors", async () => {
        // Mock Inbucket error
        vi.mocked(sendEmailThroughInbucket).mockResolvedValue({
          success: false,
          error: "SMTP connection failed",
        });

        const result = await sendInvitationEmail(mockOptions);

        expect(result).toEqual({
          success: false,
          error: "SMTP connection failed",
        });
      });
    });
  });

  describe("sendAuthEmail", () => {
    const mockOptions: SendAuthEmailOptions = {
      to: "user@example.com",
      loginUrl: "https://example.com/auth/confirm?token=abc123",
    };

    describe("production mode", () => {
      beforeEach(() => {
        vi.mocked(isDevelopment).mockReturnValue(false);
      });

      it("should send authentication email successfully via Resend", async () => {
        mockSend.mockResolvedValue({
          data: { id: "auth-email-456" },
          error: null,
        });

        const result = await sendAuthEmail(mockOptions);

        // Verify render was called with correct template props
        expect(render).toHaveBeenCalledWith(
          expect.objectContaining({
            email: mockOptions.to,
            loginUrl: mockOptions.loginUrl,
          })
        );

        // Verify Resend was called
        expect(mockSend).toHaveBeenCalledWith({
          from: "noreply@example.com",
          to: mockOptions.to,
          subject: "Sign in to Tour Planner",
          html: "<html>Email content</html>",
        });

        expect(result).toEqual({
          success: true,
          id: "auth-email-456",
        });
      });

      it("should handle Resend API error", async () => {
        const apiError = { message: "Rate limit exceeded" };
        mockSend.mockResolvedValue({
          data: null,
          error: apiError,
        });

        const result = await sendAuthEmail(mockOptions);

        expect(secureError).toHaveBeenCalledWith("Failed to send authentication email via Resend", apiError);

        expect(result).toEqual({
          success: false,
          error: "Rate limit exceeded",
        });
      });

      it("should handle unexpected errors", async () => {
        const unexpectedError = new Error("Network error");
        vi.mocked(render).mockRejectedValue(unexpectedError);

        const result = await sendAuthEmail(mockOptions);

        expect(secureError).toHaveBeenCalledWith("Unexpected error sending authentication email", unexpectedError);

        expect(result).toEqual({
          success: false,
          error: "Network error",
        });
      });
    });

    describe("development mode", () => {
      beforeEach(() => {
        vi.mocked(isDevelopment).mockReturnValue(true);
      });

      it("should route authentication email to Inbucket", async () => {
        const result = await sendAuthEmail(mockOptions);

        expect(consoleLogSpy).toHaveBeenCalledWith("📧 [DEV] Routing authentication email to Inbucket:", {
          to: mockOptions.to,
          from: "noreply@example.com",
          subject: "Sign in to Tour Planner",
        });

        expect(sendEmailThroughInbucket).toHaveBeenCalledWith(
          mockOptions.to,
          "Sign in to Tour Planner",
          "<html>Email content</html>",
          "noreply@example.com"
        );

        expect(result).toEqual({
          success: true,
          id: "inbucket-123",
        });

        expect(mockSend).not.toHaveBeenCalled();
      });
    });
  });

  describe("sendEmail", () => {
    const mockTo = "recipient@example.com";
    const mockSubject = "Test Email";
    const mockHtml = "<html><body>Test content</body></html>";

    describe("production mode", () => {
      beforeEach(() => {
        vi.mocked(isDevelopment).mockReturnValue(false);
      });

      it("should send generic email successfully via Resend", async () => {
        mockSend.mockResolvedValue({
          data: { id: "generic-email-789" },
          error: null,
        });

        const result = await sendEmail(mockTo, mockSubject, mockHtml);

        // Verify Resend was called with correct parameters
        expect(mockSend).toHaveBeenCalledWith({
          from: "noreply@example.com",
          to: mockTo,
          subject: mockSubject,
          html: mockHtml,
        });

        expect(result).toEqual({
          success: true,
          id: "generic-email-789",
        });

        // sendEmail doesn't call render, so verify it wasn't called
        expect(render).not.toHaveBeenCalled();
      });

      it("should handle Resend API error", async () => {
        const apiError = { message: "Invalid recipient" };
        mockSend.mockResolvedValue({
          data: null,
          error: apiError,
        });

        const result = await sendEmail(mockTo, mockSubject, mockHtml);

        expect(secureError).toHaveBeenCalledWith("Failed to send email via Resend", apiError);

        expect(result).toEqual({
          success: false,
          error: "Invalid recipient",
        });
      });

      it("should handle unexpected errors", async () => {
        const unexpectedError = new Error("Connection timeout");
        mockSend.mockRejectedValue(unexpectedError);

        const result = await sendEmail(mockTo, mockSubject, mockHtml);

        expect(secureError).toHaveBeenCalledWith("Unexpected error sending email", unexpectedError);

        expect(result).toEqual({
          success: false,
          error: "Connection timeout",
        });
      });
    });

    describe("development mode", () => {
      beforeEach(() => {
        vi.mocked(isDevelopment).mockReturnValue(true);
      });

      it("should route generic email to Inbucket", async () => {
        const result = await sendEmail(mockTo, mockSubject, mockHtml);

        expect(consoleLogSpy).toHaveBeenCalledWith("📧 [DEV] Routing email to Inbucket:", {
          to: mockTo,
          from: "noreply@example.com",
          subject: mockSubject,
        });

        expect(sendEmailThroughInbucket).toHaveBeenCalledWith(
          mockTo,
          mockSubject,
          mockHtml,
          "noreply@example.com"
        );

        expect(result).toEqual({
          success: true,
          id: "inbucket-123",
        });

        expect(mockSend).not.toHaveBeenCalled();
      });
    });
  });
});
