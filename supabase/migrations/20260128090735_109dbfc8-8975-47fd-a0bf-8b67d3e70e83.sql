-- Create a trigger to automatically assign ambassador role when a profile is created
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert ambassador role for new user if they don't have any role yet
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'ambassador')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_created_assign_role ON public.profiles;
CREATE TRIGGER on_profile_created_assign_role
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_default_role();