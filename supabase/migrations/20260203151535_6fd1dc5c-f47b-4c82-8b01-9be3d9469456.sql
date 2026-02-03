-- Create a function to check if user can assign a specific role
-- Using text comparison to avoid enum timing issues
CREATE OR REPLACE FUNCTION public.can_assign_role(_assigner_id uuid, _target_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      -- Admins can assign any role
      WHEN has_role(_assigner_id, 'admin'::app_role) THEN true
      -- Regional leaders can only assign ambassador (chapter representative equivalent)
      WHEN has_role(_assigner_id, 'regional_leader'::app_role) AND _target_role = 'ambassador' THEN true
      ELSE false
    END
$$;