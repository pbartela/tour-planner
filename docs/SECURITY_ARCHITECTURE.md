# Security Architecture

This document describes the security architecture of Tour Planner, including authentication, authorization, data access patterns, and security design decisions.

## Table of Contents

- [Security Model Overview](#security-model-overview)
- [Authentication](#authentication)
- [HTTP Security Headers](#http-security-headers)
- [Authorization](#authorization)
- [Database Trigger Security](#database-trigger-security)
- [Email Validation & DoS Protection](#email-validation--dos-protection)
- [Data Access Patterns](#data-access-patterns)
- [Email Visibility Architecture](#email-visibility-architecture)
- [Security Boundaries](#security-boundaries)
- [Threat Model](#threat-model)
- [Future Security Enhancements](#future-security-enhancements)

## Security Model Overview

Tour Planner uses a **defense-in-depth** security model with multiple layers:

1. **Authentication Layer**: Passwordless magic link authentication via Supabase Auth
2. **Authorization Layer**: Row-Level Security (RLS) policies in PostgreSQL
3. **Application Layer**: Server-side validation, rate limiting, CSRF protection
4. **Network Layer**: HTTPS-only, secure headers, CORS policies

### Trust Boundary

The primary trust boundary is the **tour**. Users within the same tour:
- Can see each other's emails and profiles
- Can communicate via comments
- Can vote on the tour
- Share access to tour details

Users outside a tour **cannot** access any tour data.

### Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Users only access data they need
3. **Secure by Default**: RLS enforced at database level
4. **Fail Secure**: Errors deny access rather than grant it
5. **Audit Trail**: Activity tracked for security monitoring

## Authentication

### Passwordless Authentication Flow

**Magic Link (Primary Method):**

1. User enters email on login page
2. Server generates magic link with Supabase Auth
3. Email sent with magic link (rate limited: 3 per 15 minutes)
4. User clicks link → Supabase validates token
5. Session created with HttpOnly cookies
6. Profile record created automatically (database trigger)

**Security Properties:**
- No passwords to steal or crack
- Email verification required
- Single-use tokens
- Time-limited (expires after use or timeout)
- Rate limited to prevent spam

### Invitation-Based Authentication

For users invited to tours:

1. Invitation sent with OTP token (64-character hex)
2. User clicks link → OTP validated
3. If user doesn't exist: Account created automatically
4. User logged in via OTP → Session created
5. Invitation marked as accepted

**Security Properties:**
- OTP expires in 1 hour
- OTP single-use (marked as `used=true`)
- OTP bound to specific invitation token
- Email must match invitation recipient
- Rate limited (5 attempts per minute)

### Session Management

- **Token Storage**: HttpOnly cookies (client cannot access via JavaScript)
- **Token Expiration**: Managed by Supabase Auth (default: 1 hour access token, 7 days refresh token)
- **Token Refresh**: Automatic via Supabase client
- **Logout**: Clears server-side session and client cookies
- **CSRF Protection**: Tokens validated on state-changing operations

**Cookie Settings:**
```typescript
{
  httpOnly: true,           // Prevents XSS access
  secure: true,             // HTTPS only (production)
  sameSite: 'lax',         // CSRF protection
  path: '/',
  maxAge: 7 * 24 * 60 * 60 // 7 days
}
```

## HTTP Security Headers

Tour Planner implements comprehensive HTTP security headers to protect against common web vulnerabilities. These headers are configured at the middleware/hosting layer to ensure they're applied to all responses.

### Recommended Security Headers Configuration

**Current Implementation Status:**
- ⚠️ Security headers are **not yet fully implemented** in Astro middleware
- Headers should be configured at the hosting/CDN layer (Vercel, Cloudflare, etc.)
- Recommended configuration below should be added to deployment platform

#### Content Security Policy (CSP)

Restricts resource loading to prevent XSS attacks and unauthorized content injection.

**Recommended Configuration:**
```http
Content-Security-Policy: default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co https://*.ingest.sentry.io;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self'
```

**Directives Explained:**
- `default-src 'self'`: Only load resources from same origin by default
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'`: Allow scripts from same origin + inline scripts (Astro/React)
- `style-src 'self' 'unsafe-inline'`: Allow styles from same origin + inline styles (Tailwind CSS)
- `font-src 'self' https://fonts.gstatic.com`: Allow fonts from same origin + Google Fonts
- `img-src 'self' data: https:`: Allow images from same origin, data URIs, and any HTTPS source
- `connect-src 'self' https://*.supabase.co`: Allow API calls to Supabase
- `frame-ancestors 'none'`: Prevent clickjacking (equivalent to X-Frame-Options: DENY)
- `base-uri 'self'`: Prevent base tag injection
- `form-action 'self'`: Only allow form submissions to same origin

**Notes:**
- `'unsafe-inline'` and `'unsafe-eval'` are needed for Astro SSR and React runtime
- For stricter CSP, use nonces for inline scripts/styles (requires build-time integration)
- Update `connect-src` to include any third-party APIs used

#### HTTP Strict Transport Security (HSTS)

Forces HTTPS connections and prevents protocol downgrade attacks.

**Recommended Configuration:**
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Directives Explained:**
- `max-age=31536000`: Browser enforces HTTPS for 1 year (365 days)
- `includeSubDomains`: Apply to all subdomains
- `preload`: Eligible for browser HSTS preload list (optional but recommended)

**Implementation Steps:**
1. Ensure HTTPS is working correctly on all pages
2. Add header with shorter `max-age` initially (e.g., `max-age=300` for 5 minutes)
3. Test thoroughly to ensure no broken HTTP resources
4. Increase `max-age` to full year
5. Submit domain to https://hstspreload.org/ (optional)

#### X-Frame-Options

Prevents clickjacking by controlling iframe embedding.

**Recommended Configuration:**
```http
X-Frame-Options: DENY
```

**Options:**
- `DENY`: Never allow iframing (most secure, recommended)
- `SAMEORIGIN`: Allow iframing only from same origin
- **Deprecated**: `ALLOW-FROM` directive is obsolete, use CSP `frame-ancestors` instead

**Note:** Redundant with CSP `frame-ancestors 'none'` but included for legacy browser support.

#### X-Content-Type-Options

Prevents MIME type sniffing vulnerabilities.

**Recommended Configuration:**
```http
X-Content-Type-Options: nosniff
```

**Purpose:**
- Prevents browsers from interpreting files as different MIME types
- Mitigates attacks where uploaded files are executed as scripts
- Particularly important for user-generated content (avatars, attachments)

#### X-XSS-Protection

Legacy XSS protection header (largely superseded by CSP).

**Recommended Configuration:**
```http
X-XSS-Protection: 0
```

**Explanation:**
- Modern browsers: Set to `0` to disable legacy XSS filter (can cause vulnerabilities)
- CSP provides better XSS protection than this header
- Kept for compatibility with older browsers, but disabled to avoid interference with CSP

#### Referrer-Policy

Controls how much referrer information is sent with requests.

**Recommended Configuration:**
```http
Referrer-Policy: strict-origin-when-cross-origin
```

**Options:**
- `strict-origin-when-cross-origin`: Send full URL for same-origin, only origin for cross-origin HTTPS, nothing for HTTP (recommended balance)
- `no-referrer`: Never send referrer (most private, may break analytics)
- `same-origin`: Only send referrer for same-origin requests
- `strict-origin`: Only send origin (not full URL) for cross-origin HTTPS

**Trade-offs:**
- `strict-origin-when-cross-origin` balances privacy and functionality
- Allows analytics and debugging while protecting user privacy
- Prevents leaking sensitive query parameters to external sites

#### Permissions-Policy

Controls browser feature access (formerly Feature-Policy).

**Recommended Configuration:**
```http
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```

**Directives Explained:**
- `camera=()`: Disable camera access (not used in Tour Planner)
- `microphone=()`: Disable microphone access (not used)
- `geolocation=()`: Disable geolocation API (not used)
- `interest-cohort=()`: Disable FLoC/Topics API (privacy protection)

**Notes:**
- Only disable features you don't use
- Add features as needed (e.g., `camera=(self)` to enable camera for your origin)
- Helps reduce browser fingerprinting and tracking

### Deployment Platform Configuration

#### Vercel

Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "0"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        }
      ]
    }
  ]
}
```

#### Cloudflare

Configure in Cloudflare Dashboard under:
- **Rules → Transform Rules → Modify Response Header**
- Or via **Workers** for dynamic header management

#### Astro Middleware (Alternative)

Add to `src/middleware/index.ts`:
```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Add security headers
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '0');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  response.headers.set('Content-Security-Policy', "default-src 'self'; ...");

  return response;
});
```

**Note:** Middleware headers may be overridden by hosting platform. Platform-level configuration is preferred.

### Security Headers Testing

**Tools:**
- [SecurityHeaders.com](https://securityheaders.com/) - Comprehensive header scanner
- [Mozilla Observatory](https://observatory.mozilla.org/) - Security and best practices audit
- Chrome DevTools Network tab - Verify headers in browser
- `curl -I https://yoursite.com` - Command-line header inspection

**Testing Checklist:**
- [ ] HSTS header present and max-age ≥ 31536000
- [ ] CSP header present and restrictive
- [ ] X-Frame-Options set to DENY or SAMEORIGIN
- [ ] X-Content-Type-Options set to nosniff
- [ ] Referrer-Policy configured appropriately
- [ ] No sensitive information in headers (X-Powered-By, Server, etc.)

### Security Headers Monitoring

**Recommended Practices:**
1. **Automated Testing**: Include header validation in CI/CD pipeline
2. **Regular Audits**: Run SecurityHeaders.com scan monthly
3. **Browser Testing**: Test in Chrome, Firefox, Safari to verify CSP compliance
4. **Error Monitoring**: Watch for CSP violations in production (via report-uri or report-to directives)

**CSP Violation Reporting:**
Add to CSP header:
```http
Content-Security-Policy: ...; report-uri https://your-csp-collector.example.com/report
```

This allows monitoring of CSP violations in production without breaking functionality.

### Future Enhancements

**Short-Term:**
- [ ] Implement security headers in Astro middleware or hosting platform
- [ ] Set up CSP violation reporting
- [ ] Add automated header testing to CI/CD

**Medium-Term:**
- [ ] Implement CSP nonces for stricter inline script/style restrictions
- [ ] Add Subresource Integrity (SRI) for external scripts
- [ ] Evaluate Cross-Origin policies (CORP, COEP, COOP)

**Long-Term:**
- [ ] Implement Certificate Transparency monitoring
- [ ] Add security.txt file (RFC 9116) for vulnerability disclosure
- [ ] Consider implementing Content-Security-Policy-Report-Only for testing

## Authorization

### Row-Level Security (RLS)

All database tables enforce RLS policies. See `/supabase/migrations/20251014100000_initial_schema.sql` for complete policy definitions.

#### Tours Table Policies

```sql
-- Users can read tours they participate in
CREATE POLICY "users can read their tours" ON tours
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.tour_id = tours.id
      AND participants.user_id = auth.uid()
    )
  );

-- Only owner can update
CREATE POLICY "owner can update tour" ON tours
  FOR UPDATE USING (owner_id = auth.uid());

-- Only owner can delete
CREATE POLICY "owner can delete tour" ON tours
  FOR DELETE USING (owner_id = auth.uid());
```

#### Participants Table Policies

```sql
-- Users can read participants of tours they're in
CREATE POLICY "users can read tour participants" ON participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM participants AS p
      WHERE p.tour_id = participants.tour_id
      AND p.user_id = auth.uid()
    )
  );
```

#### Comments Table Policies

```sql
-- Users can read comments on their tours
CREATE POLICY "users can read tour comments" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.tour_id = comments.tour_id
      AND participants.user_id = auth.uid()
    )
  );

-- Users can only update their own comments
CREATE POLICY "users can update own comments" ON comments
  FOR UPDATE USING (user_id = auth.uid());
```

#### Invitations Table Policies

```sql
-- Tour owner or invitation recipient can read
CREATE POLICY "owner and recipient can read invitations" ON invitations
  FOR SELECT USING (
    inviter_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Only owner can create invitations
CREATE POLICY "owner can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tours
      WHERE tours.id = invitations.tour_id
      AND tours.owner_id = auth.uid()
    )
  );
```

### Application-Level Authorization

Beyond RLS, the application enforces additional checks:

1. **Session Validation**: `validateSession()` on all protected endpoints
2. **Owner Verification**: Double-check tour ownership for sensitive operations
3. **Email Matching**: Verify user email matches invitation email
4. **Status Checks**: Verify invitation/tour status before operations

**Example (Invitation Resend):**
```typescript
// 1. Validate session (application layer)
const user = await validateSession(supabase);

// 2. Verify tour ownership (application layer)
const tour = await tourService.getTourDetails(supabase, tourId);
if (tour.owner_id !== user.id) {
  return 403; // Forbidden
}

// 3. RLS also enforces ownership (database layer)
// Even if app code has bug, RLS prevents unauthorized access
```

## Database Trigger Security

### SECURITY DEFINER Functions in Triggers

Several database functions use `SECURITY DEFINER` to execute with elevated privileges. This is **necessary and safe** for trigger functions that execute in system context.

#### Why SECURITY DEFINER is Required

Trigger functions execute in **system context** during Supabase Auth operations:
- When a user signs up or changes email, Supabase Auth modifies `auth.users`
- No authenticated user session exists during these operations
- `auth.uid()` returns NULL in trigger context
- RLS policies that check `auth.uid()` would block all trigger operations
- Without SECURITY DEFINER, profile creation and email synchronization would fail

**Example:**
```sql
-- RLS policy on profiles table
CREATE POLICY "users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Without SECURITY DEFINER, this trigger would fail:
-- auth.uid() is NULL, so RLS blocks the UPDATE
UPDATE profiles SET email = NEW.email WHERE id = NEW.id;
```

#### Security Constraints for SECURITY DEFINER Functions

All SECURITY DEFINER trigger functions implement multiple security constraints:

1. **SET search_path = public**: Prevents schema search-path injection attacks
2. **Input Validation**: Defensive checks for NULL or invalid data
3. **Scope Limitation**: WHERE clauses prevent cross-user updates
4. **Trusted Input Source**: Input comes from Supabase Auth, not user-supplied
5. **Execution Restriction**: TRIGGER-type functions cannot be called directly by users

#### Trigger Functions Using SECURITY DEFINER

**Profile Management Functions:**

| Function | Purpose | Security Justification | Migration |
|----------|---------|------------------------|-----------|
| `handle_new_user()` | Creates profile on user signup | System operation during auth signup (no session) | 20251014100000, 20251209120000 |
| `sync_user_email()` | Syncs email changes to profiles | System operation during auth email update (no session) | 20251209120000 |
| `handle_user_deletion()` | Cascades cleanup on account deletion | System operation during auth user deletion (no session) | 20251014100000 |

**Tour Management Functions:**

| Function | Purpose | Security Justification | Migration |
|----------|---------|------------------------|-----------|
| `create_tour()` | Creates tour and adds owner as participant | Atomic operation requires bypassing RLS to insert participant | 20251014100000 |
| `accept_invitation()` | Accepts invitation and adds participant | Validates email match before adding participant | 20251014100000 |
| `decline_invitation()` | Declines invitation | Validates email match before updating status | 20251014100000 |

**Helper Functions:**

| Function | Purpose | Security Justification | Migration |
|----------|---------|------------------------|-----------|
| `is_participant()` | Checks tour participation | Used in RLS policies to avoid N+1 queries | 20251014100000 |
| `get_user_by_email()` | Queries auth.users table | Secure RPC wrapper for auth table access | 20251014100000 |

**Maintenance Functions (Cron Jobs):**

| Function | Purpose | Security Justification | Migration |
|----------|---------|------------------------|-----------|
| `archive_finished_tours()` | Archives completed tours | Automated maintenance (no user invocation) | 20251014100000 |
| `cleanup_expired_invitations()` | Marks expired invitations | Automated maintenance (no user invocation) | 20251014100000 |
| `cleanup_expired_invitation_otps()` | Removes old OTP tokens | Automated maintenance (no user invocation) | 20251014100000 |
| `cleanup_expired_auth_otps()` | Removes old auth OTP tokens | Automated maintenance (no user invocation) | 20251014100000 |
| `cleanup_unconfirmed_users()` | Removes stale signups | Automated maintenance (no user invocation) | 20251014100000 |

#### Security Model Example: sync_user_email()

```sql
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER           -- Required: No session context in trigger
SET search_path = public   -- Prevents schema injection
AS $$
BEGIN
  -- Defensive validation
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE EXCEPTION 'Email cannot be null or empty';
  END IF;

  -- Constrained scope: Only updates matching user
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;       -- Prevents cross-user updates

  RETURN NEW;
END;
$$;
```

**Security Properties:**
- ✅ Input from trusted source (Supabase Auth, not user)
- ✅ Cannot be called by users (TRIGGER-type function)
- ✅ SET search_path prevents schema injection
- ✅ WHERE clause prevents cross-user updates
- ✅ Validation prevents malformed data propagation
- ✅ Scope limited to single table and column

#### When SECURITY DEFINER is Safe vs Risky

**Safe Usage (Current Implementation):**
- ✅ Trigger functions executing in system context
- ✅ Input from trusted system source (Supabase Auth)
- ✅ Constrained by WHERE clauses or business logic
- ✅ SET search_path configured
- ✅ Cannot be invoked directly by users
- ✅ Defensive validation in place

**Risky Usage (Avoided in This Project):**
- ❌ Functions callable via RPC without validation
- ❌ Dynamic SQL with user-supplied input
- ❌ Missing SET search_path
- ❌ No input validation
- ❌ Overly broad scope (e.g., UPDATE without WHERE)
- ❌ Exposing sensitive data in return values

#### Attack Scenarios Analyzed

**Scenario 1: User attempts to modify another user's email**
- Attack fails: TRIGGER functions cannot be called by users
- Only Supabase Auth can trigger these functions

**Scenario 2: SQL injection via email field**
- Attack fails: NEW.email is a parameter, not string concatenation
- Supabase Auth validates email format before insertion

**Scenario 3: Schema search-path injection**
- Attack prevented: All functions use `SET search_path = public`
- Would require CREATE SCHEMA privilege anyway

**Scenario 4: Privilege escalation via trigger modification**
- Attack fails: Only superuser can modify functions
- If attacker has superuser access, they don't need this attack vector

### Risk Assessment

**Risk Level**: LOW

SECURITY DEFINER is used appropriately for system-level operations with proper security constraints. The implementation follows PostgreSQL and Supabase best practices for trigger security.

## Email Validation & DoS Protection

### Email Parser Security Architecture

The email parser (`src/lib/utils/email-parser.util.ts`) is protected against Denial of Service (DoS) attacks through multiple security layers.

#### Input Validation Limits

**Character Limit:**
- Maximum input length: 10,000 characters
- Defined in: `src/lib/constants/validation.ts` as `EMAIL_VALIDATION.MAX_INPUT_LENGTH`
- Enforced before any processing begins
- Rejects with clear error message if exceeded

**Email Count Limit:**
- Maximum emails per batch: 50
- Defined in: `EMAIL_VALIDATION.MAX_EMAILS_PER_INVITATION`
- Enforced at API layer via Zod schema validation
- Prevents CPU exhaustion from excessive validation operations

#### ReDoS Analysis: Safe Regex Pattern

**Pattern:** `/[\s,;\n\t]+/`

The regex used for splitting email addresses is **NOT vulnerable to Regular Expression Denial of Service (ReDoS)**.

**Why it's safe:**
- Simple character class `[\s,;\n\t]` matches exactly one character from the set
- `+` quantifier creates linear progression (not exponential)
- No nested quantifiers (e.g., `(a+)+` which would be vulnerable)
- No alternation with overlapping patterns
- No backreferences
- JavaScript regex engine handles this efficiently

**Time Complexity:**
- Best case: O(n) where n = input length
- Worst case: O(n) where n = input length
- Average case: O(n) where n = input length

**Comparison to vulnerable patterns:**
```javascript
// ❌ VULNERABLE (exponential backtracking)
/(a+)+b/         // Can cause catastrophic backtracking
/(a*)*c/         // Nested quantifiers cause exponential complexity

// ✅ SAFE (our pattern - linear performance)
/[\s,;\n\t]+/    // Simple character class with linear complexity
```

#### Rate Limiting Configuration

**General API Rate Limit:**
- Production: 100 requests/minute per client
- Development: 1000 requests/minute per client
- Applied to all API endpoints

**Invitation-Specific Rate Limit:**
- Production: 10 invitation requests per hour per tour
- Development: 100 invitation requests per hour per tour
- Composite key: `invitations:tour:${tourId}:user:${userId}`
- Returns 429 status with Retry-After header

**Implementation Location:** `src/lib/server/rate-limit.service.ts`

**Known Limitation:**
- In-memory rate limiting only (not suitable for multi-instance production deployments)
- Each instance maintains separate counters
- Recommendation: Use Redis-based rate limiting for production scaling

#### Performance Characteristics

The `parseEmails()` function has linear time complexity:

```
Total: O(n + m*k) where:
  n = input length
  m = number of emails
  k = average email length
```

**Performance Breakdown:**
1. **Regex split**: O(n) - Linear scan of input string
2. **Normalization**: O(m) - Lowercase conversion for each email
3. **Deduplication**: O(m) - Set-based duplicate detection
4. **Validation**: O(m * k) - Validate each email with Zod and TLD checking

**Performance Monitoring:**
- Logs warning when input exceeds 10,000 characters
- Logs info when input exceeds 8,000 characters (80% of limit)
- No PII logged (only length and utilization percentage)
- Helps detect potential abuse patterns

#### Multiple Protection Layers

Tour Planner uses **defense-in-depth** for email validation:

| Layer | Protection | Implementation |
|-------|-----------|----------------|
| **1. Input Length** | 10,000 char limit | Checked before processing |
| **2. Safe Regex** | ReDoS-resistant pattern | Character class with linear complexity |
| **3. Email Count** | Max 50 emails/batch | Zod schema validation |
| **4. Rate Limiting** | 10 requests/hour/tour | Applied at API layer |
| **5. Authentication** | Session validation | Required for all API calls |
| **6. Authorization** | Tour ownership check | Only tour owners can invite |
| **7. CSRF Protection** | Token validation | Prevents cross-site attacks |
| **8. RLS Policies** | Database-level security | Enforces data isolation |

#### Email Validation Process

**Two-Stage Validation Approach:**

**Stage 1: Custom Pre-Validation**
```typescript
// Split by "@" - must have exactly 2 parts
const parts = email.split("@");
if (parts.length !== 2) return invalid;

// Domain must have 2+ segments (e.g., example.com)
const domainSegments = parts[1].split(".");
if (domainSegments.length < 2) return invalid;

// No empty domain segments (catches "user@.pl" or "user@example.")
if (domainSegments.some(segment => segment.length === 0)) return invalid;

// TLD must be in IANA official list
const tld = domainSegments[domainSegments.length - 1].toLowerCase();
if (!tlds.includes(tld)) return invalid;
```

**Stage 2: RFC 5322 Validation (Zod)**
```typescript
const emailSchema = z.string().email("Invalid email format");
const result = emailSchema.safeParse(email);
```

This two-stage approach:
- Provides specific error messages for common mistakes
- Validates TLD against official IANA list (prevents typos like ".comm")
- Uses Zod for RFC 5322 compliant validation
- Avoids ReDoS-vulnerable regex patterns

#### Attack Scenarios Analyzed

| Attack Vector | Vulnerability | Mitigation | Risk Level |
|---------------|---------------|------------|------------|
| **Large input (>10K)** | Resource exhaustion | Input length check before processing | **NONE** |
| **Many emails (>50)** | CPU exhaustion from validation | Zod schema max(50) + early rejection | **NONE** |
| **ReDoS attack** | Catastrophic backtracking | Safe character class pattern O(n) | **NONE** |
| **Rate limit bypass** | Rapid repeated requests | 10 requests/hour/tour (production) | **LOW** |
| **Distributed DoS** | Multiple instances bypass | In-memory limiter (per-instance only)* | **MEDIUM*** |

*Known limitation: In-memory rate limiting is not distributed. Use Redis for production scaling.

#### Data Flow & Security Checkpoints

```
User Input (textarea)
    ↓
[Client] Max 10K chars enforced by UI
    ↓
[Client] parseEmails() - optional pre-validation
    ↓
API Request (emails array)
    ↓
[Server] CSRF token validation
    ↓
[Server] Session validation (validateSession)
    ↓
[Server] Rate limit check (10/hour/tour)
    ↓
[Server] Zod schema validation (max 50, unique, valid format)
    ↓
[Server] Tour ownership verification
    ↓
[Service] parseEmails() with logging
    ↓
[Service] Business logic processing
    ↓
[Database] RLS policies enforce data isolation
```

#### Implementation Files

| File | Purpose | Security Features |
|------|---------|-------------------|
| `src/lib/utils/email-parser.util.ts` | Core parsing logic | Input limits, safe regex, logging |
| `src/lib/utils/email-parser.util.test.ts` | Test coverage (339 lines) | Edge cases, TLD validation, length limits |
| `src/lib/constants/validation.ts` | Security constants | MAX_INPUT_LENGTH, MAX_EMAILS_PER_INVITATION |
| `src/pages/api/tours/[tourId]/invitations.ts` | API endpoint | Rate limiting, auth, owner check |
| `src/lib/validators/tour.validators.ts` | Request validation | Zod schemas with strict rules |
| `src/lib/server/rate-limit.service.ts` | Rate limiting | Per-tour and per-user limits |
| `src/lib/server/logger.service.ts` | Secure logging | No PII, sanitized output |

#### Security Best Practices Implemented

1. **Input Validation First**: Length check before any processing
2. **Safe Regex**: Character class pattern with no backtracking
3. **Rate Limiting**: Multiple layers (API + feature-specific)
4. **Fail Secure**: Errors deny access rather than grant it
5. **Secure Logging**: No PII in logs, only metrics
6. **Defense in Depth**: Multiple independent security controls
7. **Linear Complexity**: All operations scale linearly with input
8. **Comprehensive Testing**: 339 lines of tests covering edge cases

#### Risk Assessment

**Overall Risk Level**: LOW

The email parser is well-protected against DoS attacks through:
- Multiple validation layers
- Safe regex patterns (no ReDoS risk)
- Strict input limits (10K chars, 50 emails)
- Rate limiting (10 requests/hour/tour)
- Comprehensive test coverage
- Performance monitoring via logging

**Recommendations for Production:**
- Implement Redis-based distributed rate limiting for multi-instance deployments
- Monitor logs for patterns of large inputs (>8000 chars)
- Consider additional rate limiting at infrastructure level (WAF, load balancer)

## Data Access Patterns

### Client-Side Access

**Supabase Browser Client** (`supabaseBrowserClient`):
- Uses anonymous key (limited permissions)
- Subject to RLS policies
- Cannot access `auth.users` table
- Session-based authentication (user ID in JWT)

**Example:**
```typescript
// Client-side query - RLS enforced
const { data } = await supabase
  .from('tours')
  .select('*')
  .eq('id', tourId);
// Only returns tour if user is participant
```

### Server-Side Access

**Supabase Server Client** (`context.locals.supabase`):
- Request-scoped (created per request in middleware)
- Uses anonymous key + user session
- Subject to RLS policies
- User context from session cookies

**Example:**
```typescript
// Server-side API route
export const GET: APIRoute = async ({ locals }) => {
  const { supabase } = locals; // RLS enforced
  const user = await validateSession(supabase);

  const { data } = await supabase
    .from('tours')
    .select('*');
  // Only returns tours user participates in
};
```

**Admin Server Client** (`createSupabaseAdminClient()`):
- Bypasses RLS
- Full database access
- Used only when RLS cannot express the query
- Must be carefully validated

**When Admin Client Is Used:**
- Creating OTP records during invitation flow (system operation)
- System-level operations (profile creation trigger)

**When Admin Client Is NOT Used (After Performance Fix):**
- ~~Fetching user emails~~ - Now uses `profiles.email` column
- Any user-initiated operations
- Regular data queries

## Email Visibility Architecture

### Design Decision: Intentional Email Exposure

Tour Planner **intentionally** exposes emails to co-participants for:

1. **Identity Verification**: Ensures users know who they're planning with
2. **Trust Model**: Group trip planning assumes pre-existing trust
3. **Communication**: Enables out-of-app contact if needed
4. **Accountability**: Real identities reduce spam and abuse

### Email Storage Strategy

**Before Performance Fix:**
- Emails stored only in `auth.users` (Supabase Auth table)
- Fetched via admin client API (N+1 query problem)
- Required individual API calls for each user

**After Performance Fix (Current):**
- Emails denormalized to `profiles.email` column
- Synchronized via database trigger
- Single JOIN query fetches all participant emails
- Eliminates admin client dependency for participant queries

**Synchronization Trigger:**
```sql
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_user_email();
```

### Where Emails Are Exposed

#### ParticipantDto (Tour Participants List)

**Endpoint:** `GET /api/tours/{tourId}/participants`

**Access Control:**
- RLS ensures only tour participants can call this endpoint
- Email included for all participants
- Used for display when `display_name` is null

**Data Flow:**
```typescript
// Single query with JOIN (no admin client needed)
const { data } = await supabase
  .from('participants')
  .select(`
    user_id,
    joined_at,
    profiles!inner (display_name, avatar_url, email)
  `)
  .eq('tour_id', tourId);

// Email directly available from profiles
return participants.map(p => ({
  ...p,
  email: p.profiles.email
}));
```

#### CommentDto (Comment Author Email)

**Endpoint:** `GET /api/tours/{tourId}/comments`

**Access Control:**
- RLS ensures only tour participants can read comments
- Email included only if author has no `display_name`

**Logic:**
```typescript
{
  display_name: profile?.display_name || null,
  user_email: profile?.display_name ? null : (profile?.email || null)
}
```

#### InvitationDto (Invitation Recipient Email)

**Endpoint:** `GET /api/tours/{tourId}/invitations` (owner only)

**Access Control:**
- RLS ensures only tour owner can see invitations
- Email is the invitation recipient (stored in `invitations.email`)

#### InvitationByTokenDto (Public Invitation View)

**Endpoint:** `GET /api/invitations?token={token}` (no auth required)

**Access Control:**
- Token-based access (no authentication required)
- Inviter email fetched from `profiles.email`
- Both emails included in response

**Security Trade-off:** Token is cryptographically random (32 bytes), making brute-force impractical.

### Security Boundaries for Email Exposure

| Context | Who Can See Email | RLS Protection | Admin Client Used |
|---------|------------------|----------------|-------------------|
| Tour Participants | Co-participants only | Yes | No (uses profiles.email) |
| Comments | Tour participants only | Yes | No (uses profiles.email) |
| Invitations | Tour owner + invitee | Yes | No (uses profiles.email) |
| Invitation (token) | Anyone with token | No (public by design) | No (uses profiles.email) |

## Security Boundaries

### What RLS Protects

1. **Cross-Tour Access**: Users cannot access tours they don't participate in
2. **Unauthorized Modifications**: Users cannot modify tours/comments they don't own
3. **Invitation Snooping**: Users cannot see invitations not meant for them
4. **Vote Manipulation**: Users cannot vote on tours they're not part of

### What RLS Does NOT Protect

1. **Email Visibility Within Tours**: Co-participants can see each other's emails (by design)
2. **Display Name Visibility**: All tour participants see display names
3. **Comment Content**: All tour participants can read all comments
4. **Participant List**: All tour participants see full participant list

### Application-Layer Protections

Beyond RLS, the application enforces:

1. **Rate Limiting**: Prevents brute-force and DoS attacks
2. **CSRF Tokens**: Prevents cross-site request forgery
3. **Input Validation**: Zod schemas validate all inputs
4. **Session Validation**: Server-side session checks on protected endpoints
5. **Error Sanitization**: Generic error messages prevent information leakage
6. **Secure Logging**: Sensitive data redacted from logs

## Threat Model

### Threats Mitigated

| Threat | Mitigation | Layer |
|--------|-----------|-------|
| **Unauthorized Tour Access** | RLS prevents users from accessing tours they're not in | Database |
| **Brute-Force Attacks** | Rate limiting on auth endpoints (3 magic links/15min) | Application |
| **CSRF Attacks** | Token-based CSRF protection on state-changing operations | Application |
| **SQL Injection** | Parameterized queries via Supabase client | Application |
| **Session Hijacking** | HttpOnly cookies, secure flags in production | Application |
| **Information Leakage** | Generic error messages, secure logging | Application |
| **Comment Spam** | Rate limiting, participant-only posting | Application + RLS |
| **Invitation Spam** | Rate limiting (10 send requests/hour, 3 resends/hour) | Application |
| **OTP Brute-Force** | Rate limiting (5 attempts/minute), single-use tokens | Application |

### Threats NOT Mitigated (By Design)

1. **Email Visibility to Co-Participants**: Intentional for trust/transparency
2. **Invitation Token Sharing**: If user shares link, anyone can view invitation details
3. **Display Name Spoofing**: Users can set any display name (no verification)

### Residual Risks

1. **Email Verification Bypass**: No email ownership verification beyond magic link receipt
   - Risk: Someone could use an email they don't own
   - Mitigation: Magic link sent to email, only owner can access

2. **OTP Token Interception**: If email is compromised, attacker can use OTP
   - Mitigation: 1-hour expiration, single-use tokens, email security best practices

3. **Rate Limit Evasion**: Distributed attacks or IP rotation can bypass rate limits
   - Mitigation: Multiple rate limit identifiers, future: CAPTCHA integration

4. **Display Name Conflicts**: Multiple users could use the same display name
   - Risk: Confusion about who's who in tours
   - Mitigation: Email always visible as secondary identifier

### Attack Scenarios & Defenses

#### Scenario 1: Unauthorized Tour Data Access

**Attack:** Attacker tries to access tour details without being a participant

**Defense Layers:**
1. Application validates session → 401 if not logged in
2. RLS policy checks participation → Returns empty result set
3. Even if app has bug, RLS prevents data exposure

**Result:** Attack fails at database level

#### Scenario 2: CSRF Attack on Tour Deletion

**Attack:** Malicious site tricks user into deleting their tour

**Defense Layers:**
1. CSRF token validation → 403 if token missing/invalid
2. Session validation → 401 if not logged in
3. Owner verification → 403 if not tour owner
4. RLS enforces ownership → Delete fails if not owner

**Result:** Attack fails at multiple layers

#### Scenario 3: Invitation Spam

**Attack:** Attacker repeatedly sends invitations to spam users

**Defense Layers:**
1. Rate limiting: 10 requests/hour per tour → 429 after limit
2. Email validation: Max 50 emails per request → 400 if exceeded
3. Owner verification → 403 if not tour owner
4. RLS enforces ownership → Insert fails if not owner

**Result:** Attack limited to 10 requests/hour (max 500 emails/hour)

#### Scenario 4: OTP Brute-Force

**Attack:** Attacker tries to guess OTP token

**Defense Layers:**
1. Rate limiting: 5 attempts/minute → 429 after limit
2. Token complexity: 64-character hex (256 bits) → Brute-force impractical
3. Single-use: Token marked as used → Cannot reuse
4. Expiration: 1-hour lifetime → Limited window

**Result:** Attack computationally infeasible

## Future Security Enhancements

### Short-Term (Next 3-6 Months)

1. **Redis-Based Rate Limiting**: For multi-instance production deployments
2. **CAPTCHA Integration**: On authentication and invitation endpoints
3. **Email Verification**: Confirm email ownership before account creation
4. **Audit Logging**: Comprehensive logging of sensitive operations

### Medium-Term (6-12 Months)

1. **Two-Factor Authentication**: Additional auth factor for sensitive operations
2. **Privacy Levels**: Option to hide email from non-owners
3. **Webhook Security**: HMAC signature verification for Supabase webhooks
4. **Content Security Policy**: Stricter CSP headers

### Long-Term (12+ Months)

1. **End-to-End Encryption**: Optional E2E encryption for tour details
2. **Zero-Knowledge Architecture**: Server cannot read tour contents
3. **Decentralized Identity**: Support for DIDs/SSI
4. **Advanced Threat Detection**: ML-based anomaly detection

## Security Testing Recommendations

### Automated Testing

1. **Unit Tests**: Test authorization logic, input validation
2. **Integration Tests**: Test rate limiting, CSRF protection
3. **E2E Tests**: Test authentication flows, RLS policies

### Manual Security Testing

1. **OWASP Top 10 Verification**: Test for common vulnerabilities
2. **RLS Policy Testing**: Attempt to bypass policies with crafted queries
3. **Rate Limit Testing**: Verify limits are enforced correctly
4. **Session Testing**: Test session expiration, token refresh

### External Security Audit

Recommended before production launch:
1. **Penetration Testing**: Professional security audit
2. **Code Review**: Third-party code review for security issues
3. **Dependency Audit**: Check for vulnerable dependencies

## Security Incident Response

### Reporting Security Issues

**DO NOT** open a public GitHub issue for security vulnerabilities.

**Contact:**
- Email: [security contact email]
- Include: Steps to reproduce, potential impact, suggested fix

### Incident Response Process

1. **Detection**: Monitor logs, user reports, automated alerts
2. **Assessment**: Evaluate severity, scope, affected users
3. **Containment**: Stop attack, prevent further damage
4. **Remediation**: Fix vulnerability, deploy patch
5. **Communication**: Notify affected users if necessary
6. **Post-Mortem**: Document incident, improve defenses

## References

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Supabase Security**: https://supabase.com/docs/guides/auth/managing-user-data#security
- **PostgreSQL RLS**: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **NIST Cybersecurity Framework**: https://www.nist.gov/cyberframework
