-- Create function to increment referral count
CREATE OR REPLACE FUNCTION public.increment_referral_count(profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET total_referrals = total_referrals + 1
    WHERE id = profile_id;
END;
$$;