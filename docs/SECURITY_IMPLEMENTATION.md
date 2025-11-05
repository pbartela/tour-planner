# Security Implementation Summary

This document provides a technical overview of the security measures implemented in the Tour Planner application.

## Overview

The application implements multiple layers of security to protect against common vulnerabilities:

1. **Rate Limiting** - Prevents abuse and brute-force attacks
2. **CSRF Protection** - Prevents cross-site request forgery attacks
3. **Environment Variable Validation** - Ensures proper configuration at startup
4. **Input Validation** - Uses Zod schemas for all API inputs
5. **Authentication** - Passwordless magic link authentication via Supabase
6. **Authorization** - Row-Level Security (RLS) policies in PostgreSQL

## 1. Rate Limiting

### Implementation

Location: `src/lib/server/rate-limit.service.ts`

**Key Features**:

- In-memory rate limit store with automatic cleanup
- Configurable limits per endpoint
- Client identification using IP + User-Agent
- Standard rate limit response headers

**Usage Example**:

```typescript
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit.service";

export const POST: APIRoute = async ({ request }) => {
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.MAGIC_LINK);

  if (!rateLimitResult.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
        "X-RateLimit-Limit": String(RATE_LIMIT_CONFIGS.MAGIC_LINK.maxRequests),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.floor(rateLimitResult.resetAt / 1000)),
      },
    });
  }
  // ... rest of endpoint logic
};
```

### Current Configurations

| Endpoint Type   | Limit        | Window     |
| --------------- | ------------ | ---------- |
| Magic Link Auth | 3 requests   | 15 minutes |
| General Auth    | 5 requests   | 1 minute   |
| General API     | 100 requests | 1 minute   |

### Applied Endpoints

- `/api/auth/magic-link` (POST) - 3 requests per 15 minutes

## 2. CSRF Protection

### Implementation

Location: `src/lib/server/csrf.service.ts`

**Key Features**:

- Cryptographically secure token generation (32 bytes)
- HttpOnly cookie storage
- Timing-safe token comparison
- Automatic middleware protection

**Token Flow**:

1. **Token Generation**: Created on first request and stored in HttpOnly cookie
2. **Client Retrieval**: Client fetches token via `/api/csrf-token`
3. **Request Inclusion**: Client includes token in `X-CSRF-Token` header
4. **Server Validation**: Server validates token against stored cookie

**Usage Example**:

```typescript
import { checkCsrfProtection } from "@/lib/server/csrf.service";

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  // CSRF protection
  const csrfError = checkCsrfProtection(request, cookies);
  if (csrfError) {
    return csrfError;
  }
  // ... rest of endpoint logic
};
```

### Protected Endpoints

CSRF protection is applied to all state-changing methods (POST, PUT, PATCH, DELETE) except:

- `/api/auth/*` endpoints (use other security measures)

**Currently Protected**:

- `/api/profiles/me` (PATCH)
- `/api/tours` (POST)
- `/api/tours/:id` (PATCH, DELETE)

### Client-Side Integration

```typescript
// Fetch CSRF token
const { token } = await fetch("/api/csrf-token").then((r) => r.json());

// Include in requests
await fetch("/api/tours", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": token,
  },
  body: JSON.stringify(data),
});
```

## 3. Environment Variable Validation

### Implementation

Location: `astro.config.mjs` (Astro's built-in validation)

**Key Features**:

- Validates at build time and runtime
- Type checking (URL format, minimum length)
- Secret protection (server-only variables never exposed to client)
- Fails fast on missing or invalid variables

**Configuration**:

```javascript
env: {
  schema: {
    PUBLIC_SUPABASE_URL: envField.string({
      context: "client",
      access: "public",
      url: true,
    }),
    SUPABASE_SERVICE_ROLE_KEY: envField.string({
      context: "server",
      access: "secret",
      min: 1,
    }),
    SUPABASE_WEBHOOK_SECRET: envField.string({
      context: "server",
      access: "secret",
      min: 32, // Security requirement
    }),
    // ... other variables
  },
  validateSecrets: true,
}
```

### Validated Variables

**Public (Client-Accessible)**:

- `PUBLIC_SUPABASE_URL` (URL format)
- `PUBLIC_SUPABASE_ANON_KEY` (non-empty)
- `PUBLIC_DEFAULT_LOCALE` (default: "en-US")

**Server-Only (Never Exposed)**:

- `SUPABASE_URL` (URL format)
- `SUPABASE_SERVICE_ROLE_KEY` (non-empty)
- `SUPABASE_WEBHOOK_SECRET` (minimum 32 characters)
- `OPENROUTER_API_KEY` (optional)

## 4. Input Validation

### Implementation

All API endpoints use Zod schemas for input validation.

**Example**:

```typescript
import { z } from "zod";

const createTourSchema = z.object({
  title: z.string().min(1).max(100),
  destination: z.string().min(1).max(200),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
});

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const validation = createTourSchema.safeParse(body);

  if (!validation.success) {
    return new Response(JSON.stringify(validation.error.flatten()), { status: 400 });
  }

  // Use validated data
  const data = validation.data;
};
```

## 5. Authentication & Authorization

### Magic Link Authentication

**Security Features**:

- Passwordless (no password storage/leakage risk)
- Email verification required
- Rate limited (3 requests per 15 minutes)
- Redirect URL validation (whitelist-based)

**Allowed Redirect Paths**:

```typescript
const ALLOWED_REDIRECT_PATHS = ["/", "/dashboard", "/tours", "/profile", "/settings"];
```

### Session Management

Location: `src/lib/server/session-validation.service.ts`

**Security Features**:

- Secure session validation
- HttpOnly cookies for token storage
- Automatic token refresh
- Protected route middleware

### Authorization (RLS)

**Supabase Row-Level Security Policies**:

- Users can only access their own data
- Tour ownership is enforced at the database level
- Participant relationships are validated
- Service role key required for admin operations

## 6. Additional Security Measures

### Error Handling

**Generic Error Messages**:

```typescript
// Bad: Information leakage
"User with email john@example.com already exists";

// Good: Generic message
"Failed to create account. Please try again.";
```

**Detailed Server Logging**:

```typescript
console.error("Detailed error for debugging:", error);
return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
```

### HTTP Headers

**Production Headers** (should be configured in deployment):

- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### HTTPS Enforcement

- All production traffic must use HTTPS
- CSRF cookies use `Secure` flag in production
- Configured in deployment (reverse proxy/CDN)

## Security Testing Checklist

Before deploying:

- [ ] All environment variables are set and valid
- [ ] Rate limiting is tested for all protected endpoints
- [ ] CSRF tokens are required for state-changing operations
- [ ] Authentication is required for protected routes
- [ ] Input validation rejects invalid data
- [ ] Error messages don't leak sensitive information
- [ ] RLS policies are tested in Supabase
- [ ] Dependencies are updated and scanned for vulnerabilities
- [ ] HTTPS is enforced in production

## Future Improvements

Potential security enhancements to consider:

1. **Distributed Rate Limiting**: Move to Redis for multi-instance deployments
2. **IP Reputation**: Integrate with IP reputation services
3. **Login Attempt Monitoring**: Alert on suspicious patterns
4. **Content Security Policy**: Add CSP headers
5. **Subresource Integrity**: Use SRI for external scripts
6. **Security Headers**: Implement comprehensive security headers
7. **Audit Logging**: Track security-relevant events
8. **Automated Security Scanning**: Integrate SAST/DAST tools

## Resources

- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Supabase Security](https://supabase.com/docs/guides/auth/managing-user-data#security)
- [Astro Security](https://docs.astro.build/en/guides/environment-variables/#security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
