/**
 * Unit tests for email-dev.middleware.ts
 * Tests lazy initialization and retry logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import nodemailer from "nodemailer";

// Mock nodemailer before importing the module
vi.mock("nodemailer");

// Mock logger service
vi.mock("./logger.service", () => ({
  secureError: vi.fn(),
}));

// Need to re-import after mocking
const {
  sendEmailThroughInbucket,
  verifyInbucketConnection,
  resetTransport,
} = await import("./email-dev.middleware");

describe("email-dev.middleware", () => {
  let mockTransport: any;
  let mockVerify: ReturnType<typeof vi.fn>;
  let mockSendMail: ReturnType<typeof vi.fn>;
  let mockClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Reset the transport instance before each test
    resetTransport();

    mockVerify = vi.fn();
    mockSendMail = vi.fn();
    mockClose = vi.fn();

    mockTransport = {
      verify: mockVerify,
      sendMail: mockSendMail,
      close: mockClose,
    };

    vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransport as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    resetTransport();
  });

  describe("verifyInbucketConnection", () => {
    it("should successfully verify connection on first attempt", async () => {
      mockVerify.mockResolvedValueOnce(true);

      const result = await verifyInbucketConnection();

      expect(result).toBe(true);
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
      expect(mockVerify).toHaveBeenCalledTimes(1);
    });

    it("should retry on connection failure and eventually succeed", async () => {
      mockVerify
        .mockRejectedValueOnce(new Error("Connection refused"))
        .mockRejectedValueOnce(new Error("Connection refused"))
        .mockResolvedValueOnce(true);

      const resultPromise = verifyInbucketConnection();

      // Fast-forward through retry delays
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result).toBe(true);
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(3);
      expect(mockVerify).toHaveBeenCalledTimes(3);
    });

    it("should return false after exhausting all retries", async () => {
      mockVerify.mockRejectedValue(new Error("Connection refused"));

      const resultPromise = verifyInbucketConnection();

      // Fast-forward through all retry delays
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result).toBe(false);
      // Should try: initial + 3 retries = 4 attempts
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(4);
      expect(mockVerify).toHaveBeenCalledTimes(4);
    });
  });

  describe("sendEmailThroughInbucket", () => {
    it("should successfully send email on first attempt", async () => {
      mockVerify.mockResolvedValueOnce(true);
      mockSendMail.mockResolvedValueOnce({
        messageId: "test-message-id",
      });

      const result = await sendEmailThroughInbucket(
        "test@example.com",
        "Test Subject",
        "<p>Test content</p>",
        "sender@example.com"
      );

      expect(result.success).toBe(true);
      expect(result.id).toBe("test-message-id");
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
      expect(mockVerify).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith({
        from: "sender@example.com",
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      });
    });

    it("should retry connection and then send email", async () => {
      mockVerify
        .mockRejectedValueOnce(new Error("Connection refused"))
        .mockResolvedValueOnce(true);
      mockSendMail.mockResolvedValueOnce({
        messageId: "test-message-id",
      });

      const resultPromise = sendEmailThroughInbucket(
        "test@example.com",
        "Test Subject",
        "<p>Test content</p>",
        "sender@example.com"
      );

      // Fast-forward through retry delays
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.id).toBe("test-message-id");
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(2);
      expect(mockVerify).toHaveBeenCalledTimes(2);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it("should return error when connection fails after all retries", async () => {
      mockVerify.mockRejectedValue(new Error("Connection refused"));

      const resultPromise = sendEmailThroughInbucket(
        "test@example.com",
        "Test Subject",
        "<p>Test content</p>",
        "sender@example.com"
      );

      // Fast-forward through all retry delays
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to connect to Inbucket");
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it("should reuse cached transport for subsequent calls", async () => {
      mockVerify.mockResolvedValue(true);
      mockSendMail.mockResolvedValue({
        messageId: "test-message-id-1",
      });

      // First call - should create transport
      await sendEmailThroughInbucket(
        "test1@example.com",
        "Test Subject 1",
        "<p>Test content 1</p>",
        "sender@example.com"
      );

      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);

      mockSendMail.mockResolvedValue({
        messageId: "test-message-id-2",
      });

      // Second call - should reuse cached transport
      await sendEmailThroughInbucket(
        "test2@example.com",
        "Test Subject 2",
        "<p>Test content 2</p>",
        "sender@example.com"
      );

      // Transport should still only be created once
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });
  });

  describe("resetTransport", () => {
    it("should reset transport and allow recreation", async () => {
      mockVerify.mockResolvedValue(true);
      mockSendMail.mockResolvedValue({
        messageId: "test-message-id",
      });

      // Create initial transport
      await sendEmailThroughInbucket(
        "test@example.com",
        "Test Subject",
        "<p>Test content</p>",
        "sender@example.com"
      );

      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);

      // Reset transport
      resetTransport();
      expect(mockClose).toHaveBeenCalledTimes(1);

      // Next call should create new transport
      await sendEmailThroughInbucket(
        "test@example.com",
        "Test Subject",
        "<p>Test content</p>",
        "sender@example.com"
      );

      expect(nodemailer.createTransport).toHaveBeenCalledTimes(2);
    });
  });
});
