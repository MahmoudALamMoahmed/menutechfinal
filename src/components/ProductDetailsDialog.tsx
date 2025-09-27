import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Plus, Minus } from 'lucide-react';

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
  const [quantity, setQuantity] = useState(1);

  if (!item) return null;

  const itemSizes = sizes.filter(size => size.menu_item_id === item.id);
  const hasMultipleSizes = itemSizes.length > 0;

  const handleAddToCart = () => {
    if (hasMultipleSizes && !selectedSize) {
      return; // لا يمكن الإضافة بدون اختيار حجم
    }
    
    // إضافة المنتج بالكمية المحددة
    for (let i = 0; i < quantity; i++) {
      onAddToCart(item, selectedSize || undefined);
    }
    
    onOpenChange(false);
    setSelectedSize(null);
    setQuantity(1);
  };

  const getCurrentPrice = () => {
    return selectedSize ? selectedSize.price : item.price;
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
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
            <div className="space-y-3">
              <p className="text-sm font-medium">اختر الحجم:</p>
              <RadioGroup
                value={selectedSize?.id || ""}
                onValueChange={(sizeId) => {
                  const size = itemSizes.find(s => s.id === sizeId);
                  setSelectedSize(size || null);
                }}
                className="grid grid-cols-3 gap-3"
              >
                {itemSizes.map((size) => (
                  <Label
                    key={size.id}
                    htmlFor={size.id}
                    className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center ${
                      selectedSize?.id === size.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                    }`}
                  >
                    <RadioGroupItem 
                      value={size.id} 
                      id={size.id} 
                      className="absolute top-2 right-2 w-5 h-5"
                    />
                    <div className="space-y-2">
                      <div className="font-semibold text-gray-800">{size.name}</div>
                      <div className="text-primary font-bold text-lg">{size.price} جنيه</div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          ) : null}
          
          {/* الكمية */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">الكمية:</p>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button
                variant="outline"
                size="icon"
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-lg font-bold min-w-[40px] text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={increaseQuantity}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* السعر الإجمالي */}
          <div className="text-center">
            <div className="text-sm text-gray-600">السعر الإجمالي:</div>
            <div className="text-2xl font-bold text-primary">
              {getCurrentPrice() * quantity} جنيه
            </div>
          </div>
          
          {/* زر الإضافة */}
          <Button
            onClick={handleAddToCart}
            className="w-full"
            disabled={hasMultipleSizes && !selectedSize}
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة إلى السلة ({quantity})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}