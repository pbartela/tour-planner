/**
 * Mailpit API Client
 *
 * Interacts with local Mailpit instance for email testing.
 * Mailpit runs at http://localhost:54324/ (Supabase local setup)
 */

export interface MailpitMessage {
  ID: string;
  From: {
    Name: string;
    Address: string;
  };
  To: Array<{
    Name: string;
    Address: string;
  }>;
  Subject: string;
  Created: string;
  Size: number;
  Snippet: string;
}

export interface MailpitMessageDetail {
  ID: string;
  From: {
    Name: string;
    Address: string;
  };
  To: Array<{
    Name: string;
    Address: string;
  }>;
  Subject: string;
  Date: string;
  Text: string;
  HTML: string;
  Size: number;
  Inline: any[];
  Attachments: any[];
}

export interface MailpitSearchResponse {
  total: number;
  unread: number;
  count: number;
  messages: MailpitMessage[];
  messages_count: number;
  start: number;
  tags: string[];
}

/**
 * Mailpit API client for email testing
 */
export class MailpitClient {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:54324/api/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all messages
   */
  async getMessages(limit = 50): Promise<MailpitSearchResponse> {
    const response = await fetch(`${this.baseUrl}/messages?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search for messages by recipient email
   */
  async searchMessages(query: string): Promise<MailpitSearchResponse> {
    const response = await fetch(`${this.baseUrl}/search?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error(`Failed to search messages: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: string): Promise<MailpitMessageDetail> {
    const response = await fetch(`${this.baseUrl}/message/${messageId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch message ${messageId}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get the latest message for a specific email address
   */
  async getLatestMessageForEmail(email: string): Promise<MailpitMessageDetail | null> {
    const searchResults = await this.searchMessages(`to:${email}`);

    if (searchResults.count === 0) {
      return null;
    }

    // Get the most recent message
    const latestMessage = searchResults.messages[0];
    return this.getMessage(latestMessage.ID);
  }

  /**
   * Wait for a new message to arrive for a specific email address
   * @param email - Email address to wait for
   * @param timeoutMs - Maximum time to wait in milliseconds
   * @param pollIntervalMs - How often to check for new messages
   */
  async waitForMessage(
    email: string,
    timeoutMs = 30000,
    pollIntervalMs = 1000
  ): Promise<MailpitMessageDetail> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const message = await this.getLatestMessageForEmail(email);

      if (message) {
        // Check if message was created after we started waiting
        const messageTime = new Date(message.Date).getTime();
        const waitStartTime = startTime - 5000; // 5 second buffer

        if (messageTime >= waitStartTime) {
          return message;
        }
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Timeout waiting for email to ${email} after ${timeoutMs}ms`);
  }

  /**
   * Delete a message by ID
   */
  async deleteMessage(messageId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/message/${messageId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete message ${messageId}: ${response.statusText}`);
    }
  }

  /**
   * Delete all messages
   */
  async deleteAllMessages(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete all messages: ${response.statusText}`);
    }
  }

  /**
   * Extract magic link from email content
   * Looks for Supabase confirmation link pattern
   */
  extractMagicLink(messageContent: string): string | null {
    // Pattern for Supabase confirmation links
    // Example: http://localhost:3000/auth/confirm?token_hash=...&type=email
    const patterns = [
      /https?:\/\/[^\s]+\/auth\/confirm\?[^\s"'<>]+/g,
      /https?:\/\/[^\s]+\/auth\/confirm[^\s"'<>]*/g,
    ];

    for (const pattern of patterns) {
      const matches = messageContent.match(pattern);
      if (matches && matches.length > 0) {
        // Return the first match, cleaned up
        let link = matches[0];

        // Remove trailing characters that might have been captured
        link = link.replace(/[,;.!?)\]}>]+$/, '');

        return link;
      }
    }

    return null;
  }

  /**
   * Get magic link from the latest email for an address
   */
  async getMagicLinkForEmail(email: string): Promise<string | null> {
    const message = await this.getLatestMessageForEmail(email);

    if (!message) {
      return null;
    }

    // Try to extract from HTML first, then text
    const content = message.HTML || message.Text;
    return this.extractMagicLink(content);
  }

  /**
   * Wait for magic link email and extract the link
   */
  async waitForMagicLink(email: string, timeoutMs = 30000): Promise<string> {
    const message = await this.waitForMessage(email, timeoutMs);

    const content = message.HTML || message.Text;
    const magicLink = this.extractMagicLink(content);

    if (!magicLink) {
      throw new Error(`Could not extract magic link from email to ${email}`);
    }

    return magicLink;
  }
}

/**
 * Default Mailpit client instance
 */
export const mailpit = new MailpitClient();
