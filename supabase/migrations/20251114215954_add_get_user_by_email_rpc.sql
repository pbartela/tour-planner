-- Create RPC function to get user by email from auth.users table
-- This allows server-side code to lookup users without exposing service_role key
CREATE OR REPLACE FUNCTION public.get_user_by_email(search_email TEXT)
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  raw_user_meta_data JSONB,
  raw_app_meta_data JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    u.updated_at,
    u.raw_user_meta_data,
    u.raw_app_meta_data
  FROM auth.users u
  WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(search_email))
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.get_user_by_email(TEXT) TO authenticated, service_role;

COMMENT ON FUNCTION public.get_user_by_email IS 'Securely lookup user by email from auth.users table. Returns user data without exposing service_role key.';
