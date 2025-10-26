/**
 * Environment variable validation service.
 * Validates required environment variables at application startup.
 */

import { z } from "zod";

/**
 * Schema for required environment variables.
 * All required variables must be non-empty strings.
 */
const envSchema = z.object({
  // Public environment variables (available in client-side code)
  PUBLIC_SUPABASE_URL: z
    .string()
    .url("PUBLIC_SUPABASE_URL must be a valid URL")
    .min(1, "PUBLIC_SUPABASE_URL is required"),

  PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "PUBLIC_SUPABASE_ANON_KEY is required")
    .regex(/^eyJ/, "PUBLIC_SUPABASE_ANON_KEY must be a valid JWT token"),

  PUBLIC_DEFAULT_LOCALE: z
    .string()
    .min(1, "PUBLIC_DEFAULT_LOCALE is required")
    .regex(/^[a-z]{2}-[A-Z]{2}$/, "PUBLIC_DEFAULT_LOCALE must be in format 'en-US'"),

  // Server-only environment variables
  SUPABASE_URL: z
    .string()
    .url("SUPABASE_URL must be a valid URL")
    .min(1, "SUPABASE_URL is required"),

  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required")
    .regex(/^eyJ/, "SUPABASE_SERVICE_ROLE_KEY must be a valid JWT token"),

  // Optional but validated if present
  OPENROUTER_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables at application startup.
 * Throws an error with detailed validation messages if any variables are invalid or missing.
 *
 * @throws {Error} If environment validation fails
 */
export function validateEnvironment(): void {
  try {
    const env = {
      PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      PUBLIC_DEFAULT_LOCALE: import.meta.env.PUBLIC_DEFAULT_LOCALE,
      SUPABASE_URL: import.meta.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENROUTER_API_KEY: import.meta.env.OPENROUTER_API_KEY,
    };

    envSchema.parse(env);

    console.log("✅ Environment variables validated successfully");
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors
        .map((err) => {
          const path = err.path.join(".");
          return `  - ${path}: ${err.message}`;
        })
        .join("\n");

      const errorMessage = `❌ Environment validation failed:\n${formattedErrors}\n\nPlease check your .env file and ensure all required variables are set correctly.`;

      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    throw error;
  }
}

/**
 * Gets a validated environment variable.
 * This function assumes validateEnvironment() has already been called at startup.
 *
 * @param key - The environment variable key
 * @returns The environment variable value
 */
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  return import.meta.env[key] as Env[K];
}

/**
 * Checks if the application is running in production mode.
 *
 * @returns True if in production, false otherwise
 */
export function isProduction(): boolean {
  return import.meta.env.PROD === true;
}

/**
 * Checks if the application is running in development mode.
 *
 * @returns True if in development, false otherwise
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV === true;
}
