-- Create invitation_otp table for custom OTP authentication flow
-- This table stores one-time tokens used for invitation-based authentication
-- When a user clicks an invitation link, they receive an OTP that:
-- 1. Creates their account if they're new
-- 2. Logs them in automatically
-- 3. Redirects them to the invitation acceptance page

CREATE TABLE IF NOT EXISTS public.invitation_otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_token TEXT NOT NULL UNIQUE,
  invitation_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast OTP lookup
CREATE INDEX idx_invitation_otp_token ON public.invitation_otp(otp_token);

-- Index for cleanup queries (finding expired OTPs)
CREATE INDEX idx_invitation_otp_expires_at ON public.invitation_otp(expires_at);

-- RLS policies: Only authenticated users (system) should access this table
-- This is internal system table, not for direct user access
ALTER TABLE public.invitation_otp ENABLE ROW LEVEL SECURITY;

-- No user should directly access this table
-- Only server-side code with service role can access it
CREATE POLICY "Service role only" ON public.invitation_otp
  FOR ALL
  TO authenticated
  USING (false);

-- Optional: Cleanup function to remove expired OTPs (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invitation_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.invitation_otp
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$;
