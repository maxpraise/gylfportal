-- Drop the overly permissive OTP policies that expose active OTP codes
-- Edge functions use service role key and bypass RLS, so these policies are not needed

DROP POLICY IF EXISTS "Anyone can create OTP" ON public.otp_verifications;
DROP POLICY IF EXISTS "Anyone can read their OTP" ON public.otp_verifications;
DROP POLICY IF EXISTS "Anyone can update their OTP" ON public.otp_verifications;

-- Ensure RLS is enabled (it should already be)
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Keep the delete policy for expired OTPs cleanup (if it exists, drop and recreate properly)
DROP POLICY IF EXISTS "Delete expired OTPs" ON public.otp_verifications;

-- No client-side policies needed - all OTP operations go through edge functions with service role