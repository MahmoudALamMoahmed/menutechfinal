import { supabase } from '@/integrations/supabase/client';

const CLOUD_NAME = 'dmclexcnp';
const UPLOAD_PRESET = 'restaurant-uploads';

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  error?: {
    message: string;
  };
}

/**
 * رفع صورة مباشرة إلى Cloudinary
 * @param file - الملف المراد رفعه
 * @param publicId - المعرف المحدد للصورة (يسمح بالاستبدال)
 */
export async function uploadToCloudinary(
  file: File,
  publicId: string
): Promise<CloudinaryUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('public_id', publicId);
  formData.append('overwrite', 'true');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }

  return data;
}

/**
 * حذف صورة من Cloudinary عبر Edge Function
 * @param publicId - معرف الصورة للحذف
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!publicId) return true;
  
  const { data, error } = await supabase.functions.invoke('cloudinary-delete', {
    body: { public_id: publicId },
  });

  if (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }

  return data?.success || false;
}

/**
 * إنشاء public_id لصورة الغلاف
 */
export function getCoverPublicId(restaurantId: string): string {
  return `restaurants/${restaurantId}/cover/cover`;
}

/**
 * إنشاء public_id للشعار
 */
export function getLogoPublicId(restaurantId: string): string {
  return `restaurants/${restaurantId}/logo/logo`;
}

/**
 * إنشاء public_id لصورة صنف
 */
export function getMenuItemPublicId(restaurantId: string, itemId: string): string {
  return `restaurants/${restaurantId}/menu-items/${itemId}`;
}
