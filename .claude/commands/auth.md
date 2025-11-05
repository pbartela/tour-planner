---
description: Integrate Supabase authentication with Astro using magic links
---

You are an expert in integrating Supabase authentication with Astro applications using server-side rendering and magic link authentication.

## Before Starting

**CRITICAL**: Ask the user which pages or components should behave differently after introducing authentication. Adjust implementation accordingly.

## Core Requirements

1. Use `@supabase/ssr` package (NOT auth-helpers)
2. Use ONLY `getAll` and `setAll` for cookie management
3. NEVER use individual `get`, `set`, or `remove` cookie methods
4. Implement proper session management with middleware

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install @supabase/ssr @supabase/supabase-js
```

### Step 2: Environment Variables

Ensure `.env` contains:

```env
PUBLIC_SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
```

Update `.env.example`:

```env
PUBLIC_SUPABASE_URL=
SUPABASE_KEY=
```

### Step 3: Update TypeScript Environment

Update `src/env.d.ts`:

```typescript
/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user: {
        id: string;
        email: string | undefined;
      } | null;
    }
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Step 4: Create/Update Supabase Server Instance

Create or update `src/db/supabase.client.ts`:

```typescript
import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "./database.types.ts";

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
```

### Step 5: Implement/Extend Authentication Middleware

Create or update `src/middleware/index.ts`:

```typescript
import { createSupabaseServerInstance } from "../db/supabase.client.ts";
import { defineMiddleware } from "astro:middleware";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  // Server-rendered pages
  "/auth/login",
  "/auth/signup",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/callback",
  "/api/auth/logout",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // IMPORTANT: Always get user session first
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      email: user.email,
      id: user.id,
    };
    locals.supabase = supabase;
  } else if (!PUBLIC_PATHS.includes(url.pathname)) {
    // Redirect to login for protected routes
    return redirect("/auth/login");
  }

  return next();
});
```

### Step 6: Create Auth API Endpoints

#### Login Endpoint (`src/pages/api/auth/login.ts`)

```typescript
import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { z } from "zod";

export const prerender = false;

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const POST: APIRoute = async ({ request, cookies, url }) => {
  // Parse and validate request
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validationResult = LoginSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: validationResult.error.flatten(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { email } = validationResult.data;

  // Send magic link
  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // shouldCreateUser: false, // Uncomment to prevent new user creation
      emailRedirectTo: `${url.origin}/api/auth/callback`,
    },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      message: "Check your email for a login link.",
      email,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
```

#### Callback Endpoint (`src/pages/api/auth/callback.ts`)

```typescript
import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const authCode = url.searchParams.get("code");

  if (!authCode) {
    return redirect("/auth/login?error=no_code");
  }

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: new Headers(),
  });

  const { error } = await supabase.auth.exchangeCodeForSession(authCode);

  if (error) {
    console.error("Auth callback error:", error);
    return redirect("/auth/login?error=callback_failed");
  }

  // Redirect to dashboard or intended page
  return redirect("/dashboard");
};
```

#### Logout Endpoint (`src/pages/api/auth/logout.ts`)

```typescript
import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  const { error } = await supabase.auth.signOut();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

### Step 7: Create Login Page

Create `src/pages/auth/login.astro`:

```astro
---
import Layout from "@/layouts/Layout.astro";
import LoginForm from "@/components/auth/LoginForm";

const error = Astro.url.searchParams.get("error");
---

<Layout title="Login">
  <div class="min-h-screen flex items-center justify-center">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Login</h2>
        {
          error && (
            <div class="alert alert-error">
              <span>Authentication failed. Please try again.</span>
            </div>
          )
        }
        <LoginForm client:load />
      </div>
    </div>
  </div>
</Layout>
```

### Step 8: Create Login Form Component

Create `src/components/auth/LoginForm.tsx`:

```tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function LoginForm() {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className="alert alert-success">
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="form-control">
        <label className="label">
          <span className="label-text">Email</span>
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          className="input input-bordered"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
        {isLoading ? <span className="loading loading-spinner"></span> : "Send Magic Link"}
      </button>
    </form>
  );
}
```

### Step 9: Protect Routes

In protected Astro pages:

```astro
---
const { user } = Astro.locals;

if (!user) {
  return Astro.redirect("/auth/login");
}
---

<h1>Protected Page</h1>
<p>Welcome {user.email}!</p>
```

### Step 10: Verify SSR Configuration

Ensure `astro.config.mjs` has:

```javascript
export default defineConfig({
  output: "server", // or 'hybrid'
  // ... other config
});
```

## Security Best Practices

- [ ] Set appropriate cookie options (httpOnly, secure, sameSite)
- [ ] Never expose Supabase keys in client-side code
- [ ] Validate all user input server-side
- [ ] Implement proper error handling
- [ ] Use HTTPS in production
- [ ] Consider rate limiting for auth endpoints
- [ ] Log authentication attempts
- [ ] Implement CSRF protection

## Common Pitfalls

❌ **DON'T** use individual cookie methods:

```typescript
// Bad
cookies.get("key");
cookies.set("key", "value");
cookies.remove("key");
```

✅ **DO** use getAll/setAll:

```typescript
// Good
cookies: {
  getAll() { ... },
  setAll(cookiesToSet) { ... }
}
```

❌ **DON'T** skip getUser() in middleware:

```typescript
// Bad - skipping auth check
export const onRequest = defineMiddleware((context, next) => {
  return next();
});
```

✅ **DO** always check authentication:

```typescript
// Good
const {
  data: { user },
} = await supabase.auth.getUser();
```

## Testing the Integration

1. Start development server: `npm run dev`
2. Navigate to `/auth/login`
3. Enter email address
4. Check email for magic link
5. Click link to authenticate
6. Verify redirect to protected page
7. Test logout functionality

## After Implementation

Update the following:

- [ ] Update PUBLIC_PATHS in middleware for your routes
- [ ] Configure email templates in Supabase dashboard
- [ ] Set up proper redirect URLs in Supabase settings
- [ ] Add translation keys for auth messages
- [ ] Test authentication flow thoroughly
- [ ] Document auth flow for team

## Optional Enhancements

- Add password-based auth alongside magic links
- Implement OAuth providers (Google, GitHub, etc.)
- Add email verification for new accounts
- Implement session timeout
- Add "remember me" functionality
- Create user profile management
- Add role-based access control (RBAC)

## Troubleshooting

**Issue**: Redirect loop after login

- Check PUBLIC_PATHS includes auth endpoints
- Verify getUser() is called in middleware

**Issue**: Magic link doesn't work

- Check email redirect URL in Supabase settings
- Verify callback endpoint is accessible
- Check email template configuration

**Issue**: Session not persisting

- Verify cookie settings (httpOnly, secure, sameSite)
- Check getAll/setAll implementation
- Ensure HTTPS in production

## Output

Provide:

1. All necessary files and code
2. Configuration changes needed
3. Environment variables to set
4. Step-by-step verification process
5. Common issues and solutions
