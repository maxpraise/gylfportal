-- Fix Issue 1: profiles_table_public_exposure
-- Remove the policy that allows users to view their referrals' profiles (exposes PII like email, phone)
DROP POLICY IF EXISTS "Users can view their referrals' profiles" ON public.profiles;

-- Fix Issue 2: otp_verifications_missing_rls
-- Block ALL client access to otp_verifications table - this table should only be accessed via service role
-- First, create policies that deny all access

-- Deny all SELECT access
CREATE POLICY "No direct access to otp_verifications"
  ON public.otp_verifications FOR SELECT
  USING (false);

-- Deny all INSERT access (should only be done via edge functions with service role)
CREATE POLICY "No direct insert to otp_verifications"
  ON public.otp_verifications FOR INSERT
  WITH CHECK (false);

-- Deny all UPDATE access
CREATE POLICY "No direct update to otp_verifications"
  ON public.otp_verifications FOR UPDATE
  USING (false);

-- Deny all DELETE access
CREATE POLICY "No direct delete to otp_verifications"
  ON public.otp_verifications FOR DELETE
  USING (false);