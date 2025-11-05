# Webhook Debugging Summary

## Problem

Profile creation webhook was not working for local Supabase setup. Users were getting "Profile not found" errors after signing up.

## Root Causes Identified

### 1. **HTTPS vs HTTP Issue** ✅ FIXED

- Webhook was configured with `https://` URL
- Local dev server runs on `http://`
- Result: SSL handshake timeout (5000ms)
- **Fix**: Changed webhook URL from `https://` to `http://`

### 2. **Network Connectivity Issue** ⚠️ NEEDS FIX

- App is binding to `[::1]:3000` (localhost only)
- Docker containers cannot reach localhost-bound services
- Webhook requests from Supabase container time out
- **Fix Required**: Restart dev server with `--host` flag

### 3. **Rate Limiting During Testing** ✅ FIXED

- Magic link endpoint had strict rate limit: 3 requests per 15 minutes
- Made testing difficult
- **Fix**: Added development-mode detection with relaxed limits:
  - Magic Link: 3 → 20 requests per 15 minutes (dev)
  - Auth: 5 → 50 requests per minute (dev)
  - API: 100 → 1000 requests per minute (dev)

## Debugging Steps Performed

1. **Verified webhook endpoint works**:

   ```bash
   curl -X POST http://localhost:3000/api/webhooks/profile-creation \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer D/ju+lJsWJNa7Rl9R5Cw3uwc58Ca5L3cBFEP0TwzU5w=" \
     -d '{
       "type": "INSERT",
       "table": "users",
       "schema": "auth",
       "record": {
         "id": "abd54bda-ba7c-4f47-a220-db7677021658",
         "email": "test@example.com"
       },
       "old_record": null
     }'
   ```

   Result: ✅ Successfully created profile

2. **Checked Supabase webhook logs**:

   ```bash
   docker exec supabase_db_tour-planner psql -U postgres \
     -c "SELECT id, status_code, error_msg, created FROM net._http_response ORDER BY created DESC LIMIT 5;"
   ```

   Result: Timeout errors during SSL handshake

3. **Verified webhook trigger configuration**:

   ```bash
   docker exec supabase_db_tour-planner psql -U postgres \
     -c "SELECT pg_get_triggerdef(oid) FROM pg_trigger WHERE tgname = 'profile-creation';"
   ```

4. **Tested connectivity from Docker container**:

   ```bash
   docker exec supabase_db_tour-planner curl -v -m 2 http://host.docker.internal:3000/api/webhooks/profile-creation ...
   ```

   Result: Connection timeout

5. **Checked app binding**:
   ```bash
   ss -tlnp | grep :3000
   ```
   Result: `[::1]:3000` - listening on localhost only

## Files Modified

### `/home/turu/Repositories/tour-planner/src/lib/server/rate-limit.service.ts`

- Added development mode detection
- Increased rate limits for local development
- Production limits remain strict

## Next Steps

### To Complete the Fix:

1. **Restart dev server with host binding**:

   ```bash
   # Stop current server (Ctrl+C)
   npm run dev -- --host
   ```

   This will bind to `0.0.0.0:3000` instead of `[::1]:3000`

2. **Verify webhook works**:
   - Sign up with a new test user
   - Check application logs for: `Successfully created profile for user {userId}`
   - Verify no "Profile not found" errors

3. **Test from Docker container** (optional verification):
   ```bash
   docker exec supabase_db_tour-planner curl -X POST \
     http://192.168.50.211:3000/api/webhooks/profile-creation \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer D/ju+lJsWJNa7Rl9R5Cw3uwc58Ca5L3cBFEP0TwzU5w=" \
     -d '{"type":"INSERT","table":"users","schema":"auth","record":{"id":"test123","email":"test@test.com"},"old_record":null}'
   ```

## SQL Commands Reference

### Recreate Webhook Trigger (HTTP for local dev):

```sql
-- Drop existing webhook trigger
DROP TRIGGER IF EXISTS "profile-creation" ON auth.users;

-- Create webhook trigger with HTTP (for local development)
CREATE TRIGGER "profile-creation"
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'http://host.docker.internal:3000/api/webhooks/profile-creation',
    'POST',
    '{"Authorization":"Bearer D/ju+lJsWJNa7Rl9R5Cw3uwc58Ca5L3cBFEP0TwzU5w="}',
    '{}',
    '5000'
  );

-- Verify trigger creation
SELECT tgname, pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgname = 'profile-creation';
```

### Execute SQL in Local Supabase:

```bash
docker exec supabase_db_tour-planner psql -U postgres -d postgres -c "
DROP TRIGGER IF EXISTS \"profile-creation\" ON auth.users;

CREATE TRIGGER \"profile-creation\"
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'http://host.docker.internal:3000/api/webhooks/profile-creation',
    'POST',
    '{\"Authorization\":\"Bearer D/ju+lJsWJNa7Rl9R5Cw3uwc58Ca5L3cBFEP0TwzU5w=\"}',
    '{}',
    '5000'
  );
"
```

**Note**: Replace the webhook secret if it changes in your `.env` file.

### For Production (HTTPS):

```sql
CREATE TRIGGER "profile-creation"
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://your-production-domain.com/api/webhooks/profile-creation',
    'POST',
    '{"Authorization":"Bearer YOUR_PRODUCTION_WEBHOOK_SECRET"}',
    '{}',
    '5000'
  );
```

## Environment Details

- **Local Supabase URL**: http://127.0.0.1:54321
- **Supabase Studio**: http://localhost:54323
- **App Port**: 3000
- **Host IP**: 192.168.50.211
- **Webhook Secret**: `D/ju+lJsWJNa7Rl9R5Cw3uwc58Ca5L3cBFEP0TwzU5w=`

## Useful Debugging Commands

### Check webhook delivery logs:

```bash
docker exec supabase_db_tour-planner psql -U postgres \
  -c "SELECT id, status_code, error_msg, created FROM net._http_response ORDER BY created DESC LIMIT 10;"
```

### Check webhook trigger exists:

```bash
docker exec supabase_db_tour-planner psql -U postgres \
  -c "SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname = 'profile-creation';"
```

### Check app is listening on all interfaces:

```bash
ss -tlnp | grep :3000
# Should show 0.0.0.0:3000 or :::3000, NOT [::1]:3000
```

### Test webhook from container:

```bash
docker exec supabase_db_tour-planner curl -X POST \
  http://host.docker.internal:3000/api/webhooks/profile-creation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer D/ju+lJsWJNa7Rl9R5Cw3uwc58Ca5L3cBFEP0TwzU5w=" \
  -d '{"type":"INSERT","table":"users","schema":"auth","record":{"id":"test123","email":"test@test.com"},"old_record":null}'
```

## Alternative: Use Database Trigger Instead

If webhooks continue to be problematic in local development, you can use a database trigger instead:

```sql
-- Create function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

However, webhooks are recommended for production reliability.
