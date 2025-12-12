import { createClient } from "@supabase/supabase-js";
import crypto, { randomUUID } from "crypto";
import { Pool } from "pg";
import type { Database } from "../../src/db/database.types";
import type { APIRequestContext } from "@playwright/test";

/**
 * Helper functions for invitation API E2E tests
 * Provides utilities for creating test data, authentication, and cleanup
 */

// Setup Supabase admin client for test data manipulation
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseAuthUrl = process.env.SUPABASE_AUTH_URL || undefined;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Please ensure .env file is present with valid credentials.");
}

// Configure Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseOptions: any = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

if (supabaseAuthUrl) {
  supabaseOptions.auth.url = supabaseAuthUrl;
}

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, supabaseOptions);

// PostgreSQL connection for direct database access
const defaultDbUrl =
  process.env.TEST_DATABASE_URL ||
  (process.env.CI
    ? "postgres://postgres:postgres@supabase-db:5432/postgres"
    : "postgres://postgres:postgres@localhost:54322/postgres");

export const pgPool = new Pool({
  connectionString: defaultDbUrl,
});

export interface TestUser {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export interface TestTour {
  id: string;
  ownerId: string;
  title: string;
}

export interface TestInvitation {
  id: string;
  tourId: string;
  email: string;
  token: string;
  status: string;
}

/**
 * Create a test user with authentication tokens
 */
export async function createTestUser(email: string): Promise<TestUser> {
  const client = await pgPool.connect();

  try {
    // Generate test password and user data
    const testPassword = `TestPass123!${Date.now()}`;
    const hashedPassword = await hashPassword(testPassword);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Insert user directly into auth.users table
    await client.query(
      `
      INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        is_super_admin
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, false
      )
    `,
      [userId, email, hashedPassword, now, now, now, JSON.stringify({ display_name: `Test User ${email}` })]
    );

    // Generate JWT tokens for authentication
    const accessToken = generateJWT(userId, "access");
    const refreshToken = generateJWT(userId, "refresh");

    return {
      id: userId,
      email,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error(`Failed to create test user ${email}:`, error);
    throw new Error(`Failed to create test user: ${error.message}`);
  } finally {
    client.release();
  }
}

/**
 * Create a test tour owned by a user
 */
export async function createTestTour(ownerId: string, title?: string): Promise<TestTour> {
  // Use randomUUID() for guaranteed uniqueness in parallel test execution
  const tourTitle = title || `Test Tour ${randomUUID()}`;
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { rows } = await pgPool.query<{ id: string }>(
    `INSERT INTO public.tours (
       owner_id,
       title,
       destination,
       description,
       start_date,
       end_date
     ) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [ownerId, tourTitle, "Test Destination", "E2E test tour", startDate.toISOString(), endDate.toISOString()]
  );

  const tourId = rows[0]?.id;

  if (!tourId) {
    throw new Error("Failed to create test tour");
  }

  // Add owner as participant (required for RLS policies to allow viewing)
  await pgPool.query("INSERT INTO public.participants (tour_id, user_id) VALUES ($1, $2)", [tourId, ownerId]);

  return {
    id: tourId,
    ownerId,
    title: tourTitle,
  };
}

/**
 * Create a test invitation
 */
export async function createTestInvitation(tourId: string, inviterId: string, email: string): Promise<TestInvitation> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { rows } = await pgPool.query<{ id: string }>(
    `INSERT INTO public.invitations (
       tour_id,
       inviter_id,
       email,
       token,
       status,
       expires_at
     ) VALUES ($1, $2, $3, $4, 'pending', $5)
     RETURNING id`,
    [tourId, inviterId, email, token, expiresAt.toISOString()]
  );

  const invitationId = rows[0]?.id;

  if (!invitationId) {
    throw new Error("Failed to create test invitation");
  }

  return {
    id: invitationId,
    tourId,
    email,
    token,
    status: "pending",
  };
}

/**
 * Get CSRF token from the application
 */
export async function getCsrfToken(request: APIRequestContext): Promise<string> {
  // First make a request to the app to establish cookies
  await request.get("/en-US/");

  // Then get CSRF token from the dedicated API endpoint
  const response = await request.get("/api/csrf-token");
  const body = await response.json();

  if (!body.token) {
    throw new Error("CSRF token not found in API response");
  }

  return body.token;
}

/**
 * Clean up test user
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  try {
    // Delete user from auth.users (will cascade to profiles and related data)
    await supabase.auth.admin.deleteUser(userId);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to cleanup test user ${userId}:`, error);
  }
}

/**
 * Clean up test tour
 */
export async function cleanupTestTour(tourId: string): Promise<void> {
  try {
    // Delete tour (will cascade to invitations, participants, etc.)
    await pgPool.query("DELETE FROM public.tours WHERE id = $1", [tourId]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to cleanup test tour ${tourId}:`, error);
  }
}

/**
 * Clean up test invitation
 */
export async function cleanupTestInvitation(invitationId: string): Promise<void> {
  try {
    await pgPool.query("DELETE FROM public.invitations WHERE id = $1", [invitationId]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to cleanup test invitation ${invitationId}:`, error);
  }
}

/**
 * Get invitation by ID
 */
export async function getInvitationById(invitationId: string): Promise<TestInvitation | null> {
  const { rows } = await pgPool.query<{
    id: string;
    tour_id: string;
    email: string;
    token: string;
    status: string;
  }>("SELECT id, tour_id, email, token, status FROM public.invitations WHERE id = $1", [invitationId]);

  if (!rows[0]) {
    return null;
  }

  return {
    id: rows[0].id,
    tourId: rows[0].tour_id,
    email: rows[0].email,
    token: rows[0].token,
    status: rows[0].status,
  };
}

/**
 * Get invitations for a tour
 */
export async function getInvitationsForTour(tourId: string): Promise<TestInvitation[]> {
  const { rows } = await pgPool.query<{
    id: string;
    tour_id: string;
    email: string;
    token: string;
    status: string;
  }>("SELECT id, tour_id, email, token, status FROM public.invitations WHERE tour_id = $1", [tourId]);

  return rows.map((row: { id: string; tour_id: string; email: string; token: string; status: string }) => ({
    id: row.id,
    tourId: row.tour_id,
    email: row.email,
    token: row.token,
    status: row.status,
  }));
}

/**
 * Create a participant for a tour
 */
export async function createTestParticipant(tourId: string, userId: string): Promise<void> {
  await pgPool.query("INSERT INTO public.participants (tour_id, user_id) VALUES ($1, $2)", [tourId, userId]);
}

/**
 * Check if user is a participant of a tour
 */
export async function isParticipant(tourId: string, userId: string): Promise<boolean> {
  const { rows } = await pgPool.query<{ count: string }>(
    "SELECT COUNT(*) as count FROM public.participants WHERE tour_id = $1 AND user_id = $2",
    [tourId, userId]
  );

  return parseInt(rows[0]?.count || "0") > 0;
}
