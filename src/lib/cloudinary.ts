import { supabase } from '@/integrations/supabase/client';
import imageCompression from 'browser-image-compression';

const CLOUD_NAME = 'dmclexcnp';
const UPLOAD_PRESET = 'restaurant-uploads';

// ============ Image Compression Options ============

// إعدادات خاصة بالغلاف - جودة عالية جداً
const COVER_COMPRESSION_OPTIONS = {
  maxSizeMB: 3,
  maxWidthOrHeight: 2400,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.95,
};

// إعدادات خاصة باللوجو - جودة عالية
const LOGO_COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 800,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.9,
};

// إعدادات خاصة بصور المنتجات - جودة جيدة
const PRODUCT_COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.85,
};

// نوع الصورة
export type ImageType = 'cover' | 'logo' | 'product';

// الحصول على إعدادات الضغط حسب نوع الصورة
function getCompressionOptions(imageType: ImageType) {
  switch (imageType) {
    case 'cover':
      return COVER_COMPRESSION_OPTIONS;
    case 'logo':
      return LOGO_COMPRESSION_OPTIONS;
    case 'product':
    default:
      return PRODUCT_COMPRESSION_OPTIONS;
  }
}

// ============ Progress Callback Types ============
export interface UploadProgress {
  stage: 'compressing' | 'uploading' | 'done';
  progress: number; // 0-100
  message: string;
}

export type ProgressCallback = (progress: UploadProgress) => void;

/**
 * ضغط الصورة قبل الرفع مع تتبع التقدم
 * @param file - الملف المراد ضغطه
 * @param imageType - نوع الصورة (cover, logo, product)
 * @param onProgress - callback لتتبع التقدم
 */
async function compressImage(
  file: File, 
  imageType: ImageType = 'product',
  onProgress?: ProgressCallback
): Promise<File> {
  try {
    const options = getCompressionOptions(imageType);
    console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB, Type: ${imageType}`);
    
    onProgress?.({
      stage: 'compressing',
      progress: 0,
      message: 'جاري ضغط الصورة...'
    });
    
    const compressedFile = await imageCompression(file, {
      ...options,
      onProgress: (percent) => {
        onProgress?.({
          stage: 'compressing',
          progress: Math.round(percent),
          message: `جاري ضغط الصورة... ${Math.round(percent)}%`
        });
      }
    });
    
    console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Compression ratio: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`);
    
    return compressedFile;
  } catch (error) {
    console.error('Compression error:', error);
    // في حالة فشل الضغط، نرجع الملف الأصلي
    return file;
  }
}

// ============ Image Optimization Functions ============

interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif';
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
}

/**
 * تحويل URL عادي لـ URL محسّن مع transformations
 */
export function getOptimizedUrl(
  url: string | null | undefined,
  options: OptimizeOptions = {}
): string {
  if (!url || !url.includes('cloudinary.com')) return url || '';
  
  const { 
    width, 
    height, 
    quality = 'auto', 
    format = 'auto', 
    crop = 'fill' 
  } = options;
  
  // بناء سلسلة التحويلات
  const transformations = [
    `f_${format}`,
    `q_${quality}`,
    width && `w_${width}`,
    height && `h_${height}`,
    (width || height) && `c_${crop}`,
    'dpr_auto', // دعم شاشات Retina
  ].filter(Boolean).join(',');
  
  // إدراج التحويلات في الرابط
  return url.replace('/upload/', `/upload/${transformations}/`);
}

/**
 * الحصول على رابط محسّن لصورة الغلاف
 * الأبعاد: 800x400
 */
export function getCoverImageUrl(url: string | null | undefined): string {
  return getOptimizedUrl(url, { width: 1600, height: 800, quality: 90, crop: 'fill' });
}

/**
 * الحصول على رابط محسّن للوجو
 * الأبعاد: 200x200
 */
export function getLogoUrl(url: string | null | undefined): string {
  return getOptimizedUrl(url, { width: 400, height: 400, quality: 90, crop: 'fill' });
}

/**
 * الحصول على رابط محسّن لصورة صنف
 * الأحجام: thumbnail (100x100), medium (400x300), large (600x450)
 */
export function getMenuItemUrl(
  url: string | null | undefined, 
  size: 'thumbnail' | 'medium' | 'large' = 'medium'
): string {
  const sizes = {
    thumbnail: { width: 100, height: 100 },
    medium: { width: 400, height: 300 },
    large: { width: 600, height: 450 },
  };
  return getOptimizedUrl(url, { ...sizes[size], crop: 'fill' });
}

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
 * رفع صورة مباشرة إلى Cloudinary من المتصفح مع folders صحيحة
 * @param file - الملف المراد رفعه
 * @param publicId - المعرف المحدد للصورة (مع المسار الكامل)
 * @param imageType - نوع الصورة (cover, logo, product)
 * @param onProgress - callback لتتبع التقدم
 */
export async function uploadToCloudinary(
  file: File,
  publicId: string,
  imageType: ImageType = 'product',
  onProgress?: ProgressCallback
): Promise<CloudinaryUploadResponse> {
  try {
    // ضغط الصورة قبل الرفع حسب نوعها
    const compressedFile = await compressImage(file, imageType, onProgress);
    
    // إضافة timestamp للـ public_id لجعله فريد في كل مرة
    const uniquePublicId = `${publicId}_${Date.now()}`;
    
    // استخراج folder من publicId (كل شيء قبل آخر /)
    const lastSlashIndex = uniquePublicId.lastIndexOf('/');
    const folder = lastSlashIndex > 0 ? uniquePublicId.substring(0, lastSlashIndex) : '';
    const filename = lastSlashIndex > 0 ? uniquePublicId.substring(lastSlashIndex + 1) : uniquePublicId;
    
    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('upload_preset', UPLOAD_PRESET);
    
    // إرسال folder و public_id منفصلين
    if (folder) {
      formData.append('folder', folder);
    }
    formData.append('public_id', filename);
    
    console.log('Uploading to Cloudinary:', {
      folder,
      filename,
      fullPublicId: uniquePublicId,
      fileSize: file.size, 
      fileType: file.type 
    });

    // استخدام XMLHttpRequest لتتبع تقدم الرفع
    const data = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress?.({
            stage: 'uploading',
            progress: percent,
            message: `جاري رفع الصورة... ${percent}%`
          });
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          onProgress?.({
            stage: 'done',
            progress: 100,
            message: 'تم رفع الصورة بنجاح!'
          });
          resolve(response);
        } else {
          console.error('Cloudinary upload failed:', xhr.status, xhr.responseText);
          reject(new Error(`فشل رفع الصورة: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('فشل الاتصال بالخادم'));
      });
      
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });

    console.log('Cloudinary upload successful:', data);
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * حذف صورة من Cloudinary عبر Edge Function
 * @param publicId - معرف الصورة للحذف
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!publicId) {
    console.log('No publicId provided, skipping delete');
    return true;
  }
  
  try {
    console.log('Deleting from Cloudinary:', publicId);
    
    const { data, error } = await supabase.functions.invoke('cloudinary-delete', {
      body: { public_id: publicId },
    });

    if (error) {
      console.error('Error deleting from Cloudinary:', error);
      // لا نرمي خطأ هنا لأن الحذف ليس حرجاً
      return false;
    }

    console.log('Delete result:', data);
    return data?.success || false;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

/**
 * إنشاء public_id لصورة الغلاف
 * @param restaurantUsername - اسم المطعم في الرابط (username) - كل مطعم له فولدر خاص باسمه
 */
export function getCoverPublicId(restaurantUsername: string): string {
  return `restaurants/${restaurantUsername}/cover`;
}

/**
 * إنشاء public_id للشعار
 * @param restaurantUsername - اسم المطعم في الرابط (username) - كل مطعم له فولدر خاص باسمه
 */
export function getLogoPublicId(restaurantUsername: string): string {
  return `restaurants/${restaurantUsername}/logo`;
}

/**
 * إنشاء public_id لصورة صنف
 * @param restaurantUsername - اسم المطعم في الرابط (username) - كل مطعم له فولدر خاص باسمه
 * @param itemId - معرف الصنف
 */
export function getMenuItemPublicId(restaurantUsername: string, itemId: string): string {
  return `restaurants/${restaurantUsername}/menu-items/${itemId}`;
}