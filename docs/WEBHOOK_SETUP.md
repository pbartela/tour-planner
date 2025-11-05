# Profile Creation Webhook Setup

This document explains how to configure the Supabase Database Webhook for automatic profile creation when new users sign up.

## Overview

Instead of using database triggers (which can have race conditions), we use Supabase Database Webhooks to reliably create user profiles. This approach is more robust and provides better error handling.

## Prerequisites

1. Your application must be deployed and accessible via HTTPS
2. You need access to your Supabase project dashboard
3. The migration `20251024000000_remove_profile_creation_trigger.sql` must be applied

## Setup Steps

### 1. Generate a Webhook Secret

Generate a secure random string to use as your webhook secret:

```bash
openssl rand -base64 32
```

Add this to your `.env` file:

```
SUPABASE_WEBHOOK_SECRET=your_generated_secret_here
```

### 2. Deploy Your Application

Ensure your application is deployed with the new webhook endpoint:

- Endpoint: `https://your-domain.com/api/webhooks/profile-creation`
- Method: `POST`

### 3. Configure the Database Webhook in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Webhooks**
3. Click **Create a new webhook** (or **Enable Webhooks** if it's your first one)
4. Configure the webhook with these settings:

   **Basic Settings:**
   - **Name**: `profile-creation`
   - **Table**: `auth.users`
   - **Events**: Check only `INSERT`

   **HTTP Request:**
   - **HTTP Method**: `POST`
   - **URL**: `https://your-domain.com/api/webhooks/profile-creation`

   **HTTP Headers:**
   - Add header: `Authorization` with value `Bearer YOUR_WEBHOOK_SECRET`
     (Replace `YOUR_WEBHOOK_SECRET` with the secret you generated in step 1)

   **Advanced Settings (optional but recommended):**
   - **Timeout**: 5000ms (5 seconds)
   - **HTTP Params**: Leave empty

5. Click **Create webhook**

### 4. Test the Webhook

You can test the webhook in two ways:

#### Option A: Using Supabase Dashboard

1. In the webhook configuration, click the **Send test request** button
2. Supabase will send a test payload to your endpoint
3. Check your application logs to verify the webhook was received

#### Option B: Create a Test User

1. Go to your application and sign up with a new email
2. After the magic link authentication completes, check:
   - Your application logs should show: `Successfully created profile for user {userId}`
   - The `profiles` table should contain a new record for the user

### 5. Monitor Webhook Deliveries

Supabase provides webhook delivery logs:

1. Go to **Database** → **Webhooks**
2. Click on your `profile-creation` webhook
3. View the **Deliveries** tab to see:
   - Successful deliveries (2xx status codes)
   - Failed deliveries (4xx/5xx status codes)
   - Retry attempts

## Local Development Setup

If you're running Supabase locally with Docker:

1. **Start local Supabase**:

   ```bash
   supabase start
   ```

2. **Check the Supabase Studio URL** (usually `http://localhost:54323`)

3. **Note**: Local Supabase webhooks have limitations:
   - You can configure webhooks through Studio
   - Webhooks can only reach localhost endpoints
   - Use `http://host.docker.internal:4321/api/webhooks/profile-creation` as the webhook URL (for Docker to reach your host machine)

4. **Alternative: Use the database trigger for local development**:
   - For local development, you may want to keep the trigger instead of webhooks
   - Create a local-only migration that adds back the trigger
   - Only use webhooks in staging/production environments

### Checking Local Supabase Webhook Logs

#### Via Supabase Studio:

1. Open Supabase Studio (`http://localhost:54323`)
2. Navigate to **Database** → **Webhooks**
3. Click on your webhook
4. View the **Deliveries** tab for delivery status

#### Via Docker Logs:

```bash
# View all Supabase logs
supabase status
docker logs supabase_db_[project-name]

# Follow logs in real-time
docker logs -f supabase_db_[project-name]
```

#### Via PostgreSQL Logs:

```bash
# Connect to local Supabase PostgreSQL
supabase db psql

# Check pg_net queue (Supabase uses pg_net for webhooks)
SELECT * FROM net._http_response ORDER BY created_at DESC LIMIT 10;
```

#### Via Your Application Logs:

The most reliable way is to check your application console:

- Successful webhook: `Successfully created profile for user {userId}`
- Failed webhook: Error logs with details
- Unauthorized: `Unauthorized webhook attempt - invalid secret`

### Testing Webhooks Locally

**Method 1: Create a test user**

```bash
# Use your local app to sign up with a test email
# Check your application logs for webhook processing
```

**Method 2: Manual webhook trigger**

```bash
# Send a manual POST request to test the endpoint
curl -X POST http://localhost:4321/api/webhooks/profile-creation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -d '{
    "type": "INSERT",
    "table": "users",
    "schema": "auth",
    "record": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "test@example.com"
    },
    "old_record": null
  }'
```

**Method 3: Supabase Studio test webhook**

1. In Studio, go to your webhook configuration
2. Click **Send test request**
3. Check your application logs

### Recommended Local Development Workflow

For the smoothest local development experience:

1. **Keep the database trigger for local development**:
   - Don't apply the migration that removes the trigger locally
   - This avoids the complexity of webhook setup

2. **Use webhooks only in deployed environments**:
   - Apply the migration in staging/production
   - Configure webhooks in hosted Supabase projects

## Troubleshooting

### Webhook Returns 401 Unauthorized

**Cause**: The webhook secret doesn't match

**Solution**:

1. Verify your `.env` file has the correct `SUPABASE_WEBHOOK_SECRET`
2. Verify the `Authorization` header in Supabase webhook config matches: `Bearer YOUR_SECRET`
3. Redeploy your application after updating the secret

### Webhook Returns 500 Internal Server Error

**Cause**: Error creating the profile in the database

**Solution**:

1. Check your application logs for detailed error messages
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is correctly set in your environment variables
3. Ensure the `profiles` table schema is correct (run migrations)

### Profile Not Created for New User

**Cause**: Webhook may not be firing or failing silently

**Solution**:

1. Check Supabase webhook delivery logs (Dashboard → Database → Webhooks → Deliveries)
2. Verify the webhook is enabled and configured for `INSERT` events on `auth.users`
3. Check if your application endpoint is accessible from the internet (not localhost)
4. Review application logs for any errors

### "Profile already exists" Message

**Cause**: This is normal if the webhook fires multiple times (e.g., during retries)

**Solution**: No action needed. The endpoint handles duplicate profile creation gracefully.

## Security Notes

1. **Never expose the webhook secret**: The `SUPABASE_WEBHOOK_SECRET` should only be in your server environment variables, never in client-side code
2. **Always verify the Authorization header**: The webhook endpoint verifies the secret to prevent unauthorized profile creation
3. **Use HTTPS only**: Webhooks should only be sent over HTTPS in production
4. **Service Role Key**: The endpoint uses the service role key which bypasses RLS. Ensure the webhook secret verification is working correctly.

## Migration from Trigger-Based Approach

If you're migrating from the old trigger-based approach:

1. Apply the migration to remove the old trigger:

   ```bash
   supabase db push
   ```

2. The session validation service has been updated to remove retry logic
3. Existing users are not affected - their profiles remain intact
4. New users will have profiles created via webhook

## Rollback Plan

If you need to rollback to the trigger-based approach:

1. Recreate the trigger by running the SQL from `20251014100000_initial_schema.sql:135-150`
2. Disable the webhook in Supabase dashboard
3. Revert the changes to `session-validation.service.ts` to include retry logic

However, the webhook approach is recommended for production reliability.
