# Security Guidelines

This document outlines the security measures implemented in the Tour Planner application and best practices for maintaining security.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Rate Limiting](#rate-limiting)
- [CSRF Protection](#csrf-protection)
- [Authentication](#authentication)
- [API Security](#api-security)
- [Reporting Security Issues](#reporting-security-issues)

## Environment Variables

### Validation

All environment variables are validated at application startup using Astro's built-in environment validation:

- **Required Variables**: The application will fail to start if required variables are missing or invalid
- **Type Checking**: URLs are validated as proper URLs, secrets have minimum length requirements
- **Secret Protection**: Server-only variables are never exposed to the client

### Required Environment Variables

#### Public Variables (Client-Accessible)

- `PUBLIC_SUPABASE_URL`: Supabase project URL (must be a valid URL)
- `PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key (JWT token)
- `PUBLIC_DEFAULT_LOCALE`: Default locale for the application (format: `en-US`)

#### Server-Only Variables (Never Exposed to Client)

- `SUPABASE_URL`: Supabase project URL for server-side operations
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (JWT token, minimum 1 character)
- `SUPABASE_WEBHOOK_SECRET`: Secret for validating Supabase webhooks (minimum 32 characters for security)
- `OPENROUTER_API_KEY`: OpenRouter API key (optional)

### Best Practices

1. **Never commit `.env` files** to version control
2. Use strong, randomly generated secrets for `SUPABASE_WEBHOOK_SECRET` (at least 32 characters)
3. Rotate secrets regularly, especially after team member changes
4. Use different credentials for development, staging, and production environments

## Rate Limiting

The application implements rate limiting to prevent abuse and protect against brute-force attacks.

### Implementation

Rate limiting is implemented using an in-memory store with automatic cleanup of expired entries. See `src/lib/server/rate-limit.service.ts` for implementation details.

### Rate Limit Configurations

#### Magic Link Authentication (`/api/auth/magic-link`)

- **Limit**: 3 requests per 15 minutes
- **Identifier**: Combination of IP address and User-Agent
- **Response Headers**:
  - `X-RateLimit-Limit`: Maximum number of requests allowed
  - `X-RateLimit-Remaining`: Number of requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when the rate limit resets
  - `Retry-After`: Number of seconds to wait before retrying (on 429 response)

#### General Authentication (`/api/auth/*`)

- **Limit**: 5 requests per minute
- **Identifier**: Combination of IP address and User-Agent

#### General API Endpoints

- **Limit**: 100 requests per minute
- **Identifier**: Combination of IP address and User-Agent

### Rate Limit Response

When rate limited, the API returns a `429 Too Many Requests` status with:

```json
{
  "error": "Too many requests. Please try again in X minute(s)."
}
```

### Client Identifier

Rate limits are applied based on a combination of:

1. **IP Address**: Extracted from `X-Forwarded-For`, `X-Real-IP`, or `CF-Connecting-IP` headers
2. **User-Agent**: First 50 characters of the User-Agent header

This helps with shared IPs while preventing easy circumvention.

## CSRF Protection

Cross-Site Request Forgery (CSRF) protection is implemented for all state-changing operations.

### Implementation

The application uses token-based CSRF protection with HttpOnly cookies and custom headers. See `src/lib/server/csrf.service.ts` for implementation details.

### Protected Endpoints

CSRF protection is automatically applied to all state-changing HTTP methods:

- `POST`
- `PUT`
- `PATCH`
- `DELETE`

**Exception**: Authentication endpoints (`/api/auth/*`) are excluded as they use other security measures (magic links, rate limiting).

### Client-Side Usage

To make state-changing requests from the client:

1. **Fetch the CSRF token**:

   ```javascript
   const response = await fetch("/api/csrf-token");
   const { token } = await response.json();
   ```

2. **Include the token in request headers**:

   ```javascript
   await fetch("/api/tours", {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       "X-CSRF-Token": token,
     },
     body: JSON.stringify(data),
   });
   ```

### CSRF Token Details

- **Token Length**: 64 characters (32 bytes hex-encoded)
- **Storage**: HttpOnly cookie named `csrf-token`
- **Header Name**: `X-CSRF-Token`
- **Expiration**: 24 hours
- **Cookie Settings**:
  - `HttpOnly: true` (prevents JavaScript access)
  - `Secure: true` (production only, requires HTTPS)
  - `SameSite: lax` (provides additional protection)

### Validation Failure Response

When CSRF validation fails, the API returns a `403 Forbidden` status with:

```json
{
  "error": "Invalid or missing CSRF token. Please refresh the page and try again."
}
```

## Authentication

### Magic Link Authentication

The application uses passwordless authentication via magic links sent to user emails.

**Security Features**:

- Rate limited to prevent abuse (3 requests per 15 minutes)
- Redirect URL validation to prevent open redirects
- Uses Supabase's built-in security features
- Email verification required

**Redirect Validation**:

Only the following redirect paths are allowed:

- `/`
- `/dashboard`
- `/tours`
- `/profile`
- `/settings`

Attempts to redirect to unauthorized paths will be rejected.

### Session Management

- Sessions are managed by Supabase with automatic token refresh
- Secure session validation middleware (`src/lib/server/session-validation.service.ts`)
- HttpOnly cookies for token storage
- Automatic session cleanup on logout

## API Security

### General Principles

1. **Input Validation**: All API endpoints validate input using Zod schemas
2. **Authentication**: Protected endpoints require valid authentication
3. **Authorization**: Row-Level Security (RLS) in Supabase ensures users can only access their own data
4. **Error Handling**: Generic error messages to avoid information leakage
5. **HTTPS Only**: All production traffic should use HTTPS (enforced by deployment)

### Error Messages

To prevent information leakage:

- **Generic Messages**: Return generic error messages to clients
- **Detailed Logging**: Log detailed errors server-side for debugging
- **Status Codes**: Use appropriate HTTP status codes (401, 403, 404, 500)

**Example**:

```typescript
// Bad: Leaks information
return new Response(JSON.stringify({ error: "User with email foo@bar.com already exists" }), { status: 400 });

// Good: Generic message
return new Response(JSON.stringify({ error: "Failed to create account. Please try again." }), { status: 400 });
```

### Database Security

- **Row-Level Security (RLS)**: All database tables use RLS policies
- **Service Role Key**: Only used on the server, never exposed to clients
- **Anon Key**: Limited permissions, safe for client-side use
- **Prepared Statements**: Supabase uses parameterized queries to prevent SQL injection

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do NOT** open a public GitHub issue
2. Email the security team at: [security contact email]
3. Include detailed information about the vulnerability:
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We take security seriously and will respond to reports promptly.

## Security Checklist for Developers

Before deploying changes:

- [ ] All environment variables are validated
- [ ] Sensitive data is never logged
- [ ] Input validation is implemented using Zod schemas
- [ ] Authentication is required for protected endpoints
- [ ] CSRF tokens are included in state-changing requests
- [ ] Error messages don't leak sensitive information
- [ ] Rate limiting is appropriate for the endpoint
- [ ] HTTPS is enforced in production
- [ ] Dependencies are up to date with security patches

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/managing-user-data#security)
- [Astro Security](https://docs.astro.build/en/guides/environment-variables/#security)
