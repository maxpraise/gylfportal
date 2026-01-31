/**
 * Utility functions for working with signed URLs
 * Used after making storage bucket private
 */

import { supabase } from '@/integrations/supabase/client';

const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

/**
 * Create a signed URL for a file in the gylf-uploads bucket
 */
export const createSignedUrl = async (
  filePath: string,
  expiresIn: number = SIGNED_URL_EXPIRY
): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from('gylf-uploads')
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }

  return data.signedUrl;
};

/**
 * Create signed URLs for multiple files
 */
export const createSignedUrls = async (
  filePaths: string[],
  expiresIn: number = SIGNED_URL_EXPIRY
): Promise<string[]> => {
  if (filePaths.length === 0) return [];

  const { data, error } = await supabase.storage
    .from('gylf-uploads')
    .createSignedUrls(filePaths, expiresIn);

  if (error) {
    console.error('Error creating signed URLs:', error);
    return [];
  }

  return data
    .filter((item) => !item.error && item.signedUrl)
    .map((item) => item.signedUrl);
};

/**
 * Upload a file and return a signed URL instead of public URL
 * Returns both the storage path (for database) and signed URL (for display)
 */
export const uploadFileWithSignedUrl = async (
  file: File,
  storagePath: string
): Promise<{ path: string; signedUrl: string } | null> => {
  const { error: uploadError } = await supabase.storage
    .from('gylf-uploads')
    .upload(storagePath, file);

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return null;
  }

  const signedUrl = await createSignedUrl(storagePath);
  if (!signedUrl) {
    return null;
  }

  return { path: storagePath, signedUrl };
};

/**
 * Extract storage path from a full URL
 * Handles both public URLs and signed URLs
 */
export const extractStoragePath = (url: string): string | null => {
  try {
    // Handle signed URLs or public URLs
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/gylf-uploads\/(.+)/);
    if (pathMatch) {
      return pathMatch[1];
    }
    return null;
  } catch {
    return null;
  }
};
