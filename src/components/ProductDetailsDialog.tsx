import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  category_id: string;
}

interface Size {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  display_order: number;
}

interface ProductDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  sizes: Size[];
  onAddToCart: (item: MenuItem, selectedSize?: Size) => void;
}

export default function ProductDetailsDialog({
  open,
  onOpenChange,
  item,
  sizes,
  onAddToCart
}: ProductDetailsDialogProps) {
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);

  if (!item) return null;

  const itemSizes = sizes.filter(size => size.menu_item_id === item.id);
  const hasMultipleSizes = itemSizes.length > 0;

  const handleAddToCart = () => {
    if (hasMultipleSizes && !selectedSize) {
      return; // لا يمكن الإضافة بدون اختيار حجم
    }
    
    onAddToCart(item, selectedSize || undefined);
    onOpenChange(false);
    setSelectedSize(null);
  };

  const getCurrentPrice = () => {
    return selectedSize ? selectedSize.price : item.price;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تفاصيل المنتج</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* صورة المنتج */}
          {item.image_url && (
            <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* اسم المنتج */}
          <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
          
          {/* وصف المنتج */}
          {item.description && (
            <p className="text-gray-600 text-sm">{item.description}</p>
          )}
          
          {/* الأحجام المتاحة */}
          {hasMultipleSizes ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">اختر الحجم:</p>
              <Select onValueChange={(sizeId) => {
                const size = itemSizes.find(s => s.id === sizeId);
                setSelectedSize(size || null);
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الحجم" />
                </SelectTrigger>
                <SelectContent>
                  {itemSizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.name} - {size.price} جنيه
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          
          {/* السعر */}
          <div className="text-2xl font-bold text-primary">
            {getCurrentPrice()} جنيه
          </div>
          
          {/* زر الإضافة */}
          <Button
            onClick={handleAddToCart}
            className="w-full"
            disabled={hasMultipleSizes && !selectedSize}
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة إلى السلة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}