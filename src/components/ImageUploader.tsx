import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  currentImageUrl?: string;
  currentPublicId?: string;
  publicId: string;
  onUploadComplete: (url: string, publicId: string) => void;
  onDelete: () => void;
  aspectRatio?: 'square' | 'cover' | 'logo';
  label?: string;
  className?: string;
}

export default function ImageUploader({
  currentImageUrl,
  currentPublicId,
  publicId,
  onUploadComplete,
  onDelete,
  aspectRatio = 'square',
  label = 'رفع صورة',
  className,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: 'aspect-square',
    cover: 'aspect-[16/9]',
    logo: 'aspect-square max-w-[150px]',
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار صورة فقط');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      // Delete old image if exists
      if (currentPublicId) {
        await deleteFromCloudinary(currentPublicId);
      }

      // Upload new image
      const result = await uploadToCloudinary(file, publicId);
      onUploadComplete(result.secure_url, result.public_id);
      setPreview(null);
    } catch (error) {
      console.error('Upload error:', error);
      alert('حدث خطأ أثناء رفع الصورة');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [currentPublicId, publicId, onUploadComplete]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDelete = async () => {
    if (!currentPublicId) {
      onDelete();
      return;
    }

    setDeleting(true);
    try {
      await deleteFromCloudinary(currentPublicId);
      onDelete();
    } catch (error) {
      console.error('Delete error:', error);
      alert('حدث خطأ أثناء حذف الصورة');
    } finally {
      setDeleting(false);
    }
  };

  const displayImage = preview || currentImageUrl;

  return (
    <div className={cn('space-y-2', className)}>
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
      
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg overflow-hidden transition-colors',
          aspectClasses[aspectRatio],
          dragActive ? 'border-primary bg-primary/5' : 'border-gray-300',
          !displayImage && 'bg-gray-50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {(uploading || deleting) && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <ImageIcon className="w-12 h-12 mb-2" />
            <p className="text-sm">اسحب الصورة هنا</p>
            <p className="text-xs">أو انقر للاختيار</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={uploading || deleting}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || deleting}
          className="flex-1"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري الرفع...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 ml-2" />
              {currentImageUrl ? 'تغيير الصورة' : 'رفع صورة'}
            </>
          )}
        </Button>
        
        {currentImageUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={uploading || deleting}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
