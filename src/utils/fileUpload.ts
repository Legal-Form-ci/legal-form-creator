import { supabase } from "@/integrations/supabase/client";

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload a file to a storage bucket
 */
export async function uploadFile(
  bucket: string,
  file: File,
  folder?: string
): Promise<UploadResult> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}_${randomId}.${fileExt}`;
    const path = folder ? `${folder}/${filename}` : filename;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL for public buckets
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return { success: true, url: publicUrl, path };
  } catch (error: any) {
    console.error('Upload failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload testimonial photo with face detection
 */
export async function uploadTestimonialPhoto(
  file: File,
  croppedDataUrl?: string
): Promise<UploadResult> {
  try {
    // If we have a cropped version, use that
    let fileToUpload = file;
    
    if (croppedDataUrl) {
      // Convert data URL to file
      const response = await fetch(croppedDataUrl);
      const blob = await response.blob();
      fileToUpload = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    }

    return await uploadFile('testimonial-photos', fileToUpload);
  } catch (error: any) {
    console.error('Photo upload failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload company logo
 */
export async function uploadCompanyLogo(file: File): Promise<UploadResult> {
  return await uploadFile('company-logos', file);
}

/**
 * Upload company document
 */
export async function uploadCompanyDocument(
  file: File,
  userId: string,
  requestId: string
): Promise<UploadResult> {
  return await uploadFile('company-documents', file, `${userId}/${requestId}`);
}

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete failed:', error);
    return false;
  }
}
