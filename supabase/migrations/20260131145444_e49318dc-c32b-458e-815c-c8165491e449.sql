-- Fix STORAGE_EXPOSURE: Make gylf-uploads bucket private and require authentication for viewing
UPDATE storage.buckets 
SET public = false 
WHERE id = 'gylf-uploads';

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view uploads" ON storage.objects;

-- Create new policy requiring authentication to view uploads
CREATE POLICY "Authenticated users can view uploads" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'gylf-uploads' 
  AND auth.uid() IS NOT NULL
);

-- Fix connect_meetings_missing_update_delete: Add UPDATE and DELETE policies
CREATE POLICY "Users can update own meetings" 
ON public.connect_meetings 
FOR UPDATE 
USING (profile_id = get_current_profile_id());

CREATE POLICY "Users can delete own meetings" 
ON public.connect_meetings 
FOR DELETE 
USING (profile_id = get_current_profile_id());