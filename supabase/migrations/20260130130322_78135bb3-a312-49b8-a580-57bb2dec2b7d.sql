-- Drop ALL remaining permissive OTP policies that still expose OTP codes
-- Edge functions use service role key and bypass RLS completely

DROP POLICY IF EXISTS "OTP insert allowed for registration" ON public.otp_verifications;
DROP POLICY IF EXISTS "OTP select by email" ON public.otp_verifications;
DROP POLICY IF EXISTS "OTP update by email" ON public.otp_verifications;
DROP POLICY IF EXISTS "Delete expired OTPs" ON public.otp_verifications;

-- RLS is already enabled, with no policies now = no client access
-- Edge functions with service role still work perfectly