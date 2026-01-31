/**
 * File validation utilities for secure file uploads
 * Provides client-side validation for file type, size, and filename sanitization
 */

export const FILE_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB per file
  MAX_TOTAL_SIZE: 25 * 1024 * 1024, // 25MB total
  MAX_FILES: 5,
} as const;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const ALLOWED_CSV_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'text/plain', // Some CSVs are detected as text/plain
] as const;

export type AllowedImageType = typeof ALLOWED_IMAGE_TYPES[number];
export type AllowedCsvType = typeof ALLOWED_CSV_TYPES[number];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  files: File[];
}

/**
 * Sanitize filename by removing potentially dangerous characters
 * Preserves only alphanumeric characters, dots, hyphens, and underscores
 */
export const sanitizeFilename = (filename: string): string => {
  // Get the extension
  const lastDot = filename.lastIndexOf('.');
  const name = lastDot > 0 ? filename.slice(0, lastDot) : filename;
  const ext = lastDot > 0 ? filename.slice(lastDot) : '';
  
  // Sanitize the name part, keeping extension as-is if it's valid
  const sanitizedName = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 50);
  const sanitizedExt = ext.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 10);
  
  return `${sanitizedName}${sanitizedExt}`;
};

/**
 * Validate files for upload - checks type, size, and total size
 */
export const validateFiles = (
  files: File[],
  allowedTypes: readonly string[],
  options: {
    maxFileSize?: number;
    maxTotalSize?: number;
    maxFiles?: number;
  } = {}
): ValidationResult => {
  const {
    maxFileSize = FILE_LIMITS.MAX_FILE_SIZE,
    maxTotalSize = FILE_LIMITS.MAX_TOTAL_SIZE,
    maxFiles = FILE_LIMITS.MAX_FILES,
  } = options;

  if (files.length === 0) {
    return { valid: true, files: [] };
  }

  if (files.length > maxFiles) {
    return {
      valid: false,
      error: `Too many files. Maximum ${maxFiles} files allowed.`,
      files: [],
    };
  }

  let totalSize = 0;
  const validFiles: File[] = [];

  for (const file of files) {
    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.name}. Allowed types: ${allowedTypes.join(', ')}`,
        files: [],
      };
    }

    // Check individual file size
    if (file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
      return {
        valid: false,
        error: `File too large: ${file.name}. Maximum size is ${maxSizeMB}MB per file.`,
        files: [],
      };
    }

    // Check total size
    totalSize += file.size;
    if (totalSize > maxTotalSize) {
      const maxTotalMB = Math.round(maxTotalSize / (1024 * 1024));
      return {
        valid: false,
        error: `Total upload size exceeds ${maxTotalMB}MB limit.`,
        files: [],
      };
    }

    validFiles.push(file);
  }

  return { valid: true, files: validFiles };
};

/**
 * Validate image files specifically
 */
export const validateImageFiles = (files: File[]): ValidationResult => {
  return validateFiles(files, ALLOWED_IMAGE_TYPES);
};

/**
 * Validate CSV files specifically
 */
export const validateCsvFiles = (files: File[]): ValidationResult => {
  return validateFiles(files, ALLOWED_CSV_TYPES, {
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024, // 10MB for CSVs
  });
};

/**
 * Generate a safe upload path with sanitized filename
 */
export const generateUploadPath = (
  profileId: string,
  filename: string,
  prefix?: string
): string => {
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(filename);
  const prefixPart = prefix ? `${prefix}-` : '';
  return `${profileId}/${prefixPart}${timestamp}-${sanitized}`;
};
