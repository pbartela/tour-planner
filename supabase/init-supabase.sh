#!/bin/bash
# Initialize Supabase roles and extensions
# This script is run when PostgreSQL starts for the first time
# Note: GoTrue will create the auth schema and auth.users table

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'EOSQL'
    -- Create extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    
    -- Create auth schema if it doesn't exist (GoTrue will create auth.users table)
    CREATE SCHEMA IF NOT EXISTS auth;
    
    -- Create basic auth.users table structure for migrations (GoTrue will enhance it)
    -- This allows migrations to create triggers on auth.users before GoTrue starts
    CREATE TABLE IF NOT EXISTS auth.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        instance_id uuid,
        email text,
        encrypted_password text,
        email_confirmed_at timestamptz,
        invited_at timestamptz,
        confirmation_token text,
        confirmation_sent_at timestamptz,
        recovery_token text,
        recovery_sent_at timestamptz,
        email_change_token_new text,
        email_change text,
        email_change_sent_at timestamptz,
        last_sign_in_at timestamptz,
        raw_app_meta_data jsonb,
        raw_user_meta_data jsonb,
        is_super_admin boolean,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        phone text,
        phone_confirmed_at timestamptz,
        phone_change text,
        phone_change_token text,
        phone_change_sent_at timestamptz,
        confirmed_at timestamptz GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
        email_change_token_current text,
        email_change_confirm_status smallint DEFAULT 0,
        banned_until timestamptz,
        reauthentication_token text,
        reauthentication_sent_at timestamptz,
        is_sso_user boolean NOT NULL DEFAULT false,
        deleted_at timestamptz
    );
    
    -- Create auth.uid() function for RLS policies (GoTrue will replace this)
    CREATE OR REPLACE FUNCTION auth.uid()
    RETURNS uuid
    LANGUAGE sql
    STABLE
    AS $func$
        SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $func$;
    
    -- Create auth.role() function for RLS policies (GoTrue will replace this)
    CREATE OR REPLACE FUNCTION auth.role()
    RETURNS text
    LANGUAGE sql
    STABLE
    AS $func$
        SELECT nullif(current_setting('request.jwt.claim.role', true), '');
    $func$;
    
    -- Create auth.email() function for RLS policies (GoTrue will replace this)
    CREATE OR REPLACE FUNCTION auth.email()
    RETURNS text
    LANGUAGE sql
    STABLE
    AS $func$
        SELECT nullif(current_setting('request.jwt.claim.email', true), '');
    $func$;
    
    -- Create roles if they don't exist
    DO $do$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
            CREATE ROLE anon NOLOGIN NOINHERIT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
            CREATE ROLE authenticated NOLOGIN NOINHERIT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
            CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
        END IF;
    END
    $do$;
    
    -- Grant usage on schemas
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
    
    -- Grant execute on functions
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
    
    -- Set default privileges
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
EOSQL

echo "Supabase roles initialized successfully"
