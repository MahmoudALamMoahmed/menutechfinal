import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Home, 
  ShoppingCart, 
  User, 
  Plus, 
  Minus, 
  Phone,
  MapPin,
  Clock,
  Share2,
  Settings,
  LayoutGrid,
  List 
} from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cover_image_url: string;
  logo_url: string;
  phone: string;
  whatsapp_phone: string;
  address: string;
  owner_id: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  display_order: number;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function Restaurant() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showCartDialog, setShowCartDialog] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  
  const isOwner = user && restaurant && user.id === restaurant.owner_id;

  useEffect(() => {
    if (username) {
      fetchRestaurantData();
    }
  }, [username]);

  const fetchRestaurantData = async () => {
    try {
      // جلب بيانات المطعم
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('username', username)
        .single();

      if (restaurantError || !restaurantData) {
        navigate('/404');
        return;
      }

      setRestaurant(restaurantData);

      // جلب الفئات
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .order('display_order');

      setCategories(categoriesData || []);

      // جلب عناصر القائمة
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .eq('is_available', true)
        .order('display_order');

      setMenuItems(menuData || []);
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل بيانات المطعم',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    
    toast({
      title: 'تم إضافة العنصر',
      description: `تم إضافة ${item.name} إلى السلة`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prev.filter(cartItem => cartItem.id !== itemId);
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const sendOrderToWhatsApp = async () => {
    if (cart.length === 0 || !customerName || !customerAddress || !customerPhone || !restaurant) return;

    try {
      const totalPrice = getTotalPrice();

      // تحضير رسالة الواتساب
      const orderText = cart.map(item => 
        `${item.name} x${item.quantity} = ${item.price * item.quantity} جنيه`
      ).join('\n');
      
      const message = `🛒 طلب جديد من ${restaurant.name}

👤 بيانات العميل:
الاسم: ${customerName}
العنوان: ${customerAddress}
رقم الهاتف: ${customerPhone}

📋 تفاصيل الطلب:
${orderText}

💰 الإجمالي: ${totalPrice} جنيه
💳 طريقة الدفع: الدفع عند الاستلام

الرجاء تأكيد استلام الطلب.
شكراً لكم.`;
      
      // إرسال الرسالة عبر الواتساب
      const whatsappUrl = `https://wa.me/${restaurant.whatsapp_phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      // إفراغ السلة وإغلاق النافذة
      setCart([]);
      setShowCartDialog(false);
      setCustomerName('');
      setCustomerAddress('');
      setCustomerPhone('');
      
      toast({
        title: 'تم إرسال الطلب',
        description: 'تم إرسال طلبك عبر واتساب بنجاح',
      });

    } catch (error) {
      console.error('خطأ عام:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في إرسال الطلب، يرجى المحاولة مرة أخرى',
        variant: 'destructive'
      });
    }
  };

  const filteredMenuItems = activeCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category_id === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل المطعم...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">المطعم غير موجود</h1>
          <Button onClick={() => navigate('/')}>العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{restaurant.name}</h1>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <ShoppingCart className="w-4 h-4 ml-2" />
                    سلة الطلبات
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                      {cart.length}
                    </Badge>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>سلة الطلبات</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 flex-1 overflow-hidden">
                    {/* عرض عناصر السلة */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-600">
                              {item.price} جنيه × {item.quantity}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-medium">{item.quantity}</span>
                            <Button
                              size="sm"
                              onClick={() => addToCart(item)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="text-lg font-bold text-center">
                      الإجمالي: {getTotalPrice()} جنيه
                    </div>
                    
                    <div className="text-sm text-center text-gray-600">
                      طريقة الدفع: الدفع عند الاستلام
                    </div>
                    
                    <Separator />
                    
                    {/* بيانات التوصيل */}
                    <div className="space-y-3">
                      <h3 className="font-medium">بيانات التوصيل</h3>
                      
                      <div>
                        <Label htmlFor="customerName">اسم العميل</Label>
                        <Input
                          id="customerName"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="أدخل اسمك"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="customerAddress">عنوان التوصيل</Label>
                        <Textarea
                          id="customerAddress"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="أدخل عنوان التوصيل بالتفصيل"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="customerPhone">رقم العميل</Label>
                        <Input
                          id="customerPhone"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="أدخل رقم هاتفك"
                          type="tel"
                        />
                      </div>
                    </div>
                    
                    <Button
                      onClick={sendOrderToWhatsApp}
                      className="w-full"
                      disabled={!customerName || !customerAddress || !customerPhone}
                    >
                      إرسال الطلب واتساب
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/${username}/dashboard`)}
              >
                <Settings className="w-4 h-4 ml-2" />
                إدارة المطعم
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 ml-2" />
              مشاركة
            </Button>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-r from-orange-400 to-red-500">
        {restaurant.cover_image_url && (
          <img
            src={restaurant.cover_image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute bottom-4 right-4 text-white">
          <h2 className="text-2xl font-bold">{restaurant.name}</h2>
          {restaurant.description && (
            <p className="text-sm opacity-90">{restaurant.description}</p>
          )}
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {restaurant.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span>{restaurant.phone}</span>
              </div>
            )}
            {restaurant.address && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{restaurant.address}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>مفتوح الآن</span>
            </div>
          </div>
        </div>
      </div>

        {/* Categories */}
             {/* التصنيفات */}
      {categories.length > 0 && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-2 overflow-x-auto">
                <Button
                  variant={activeCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory('all')}
                >
                  الكل
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>

              {/* تبديل طريقة العرض */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewType("list")}
                  className={`p-3 border rounded-md transition ${
                    viewType === "list"
                      ? "bg-primary text-white border-black"
                      : "bg-white text-black border-black"
                  }`}
                >
                  <List className="w-5 h-5 stroke-[1.5]" />
                </button>
                <button
                  onClick={() => setViewType("grid")}
                  className={`p-3 border rounded-md transition ${
                    viewType === "grid"
                      ? "bg-primary text-white border-black"
                      : "bg-white text-black border-black"
                  }`}
                >
                  <LayoutGrid className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

     {/* Menu Items */}
      {/* عناصر المنيو */}
      <div className="container mx-auto px-4 py-6 pb-32">
        {filteredMenuItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">لا توجد عناصر في القائمة حالياً</p>
          </div>
        ) : viewType === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMenuItems.map((item) => (
              <Card key={item.id} className="overflow-hidden h-full flex flex-col">
                <CardContent className="p-4 flex-1 flex flex-col">
                  {item.image_url && (
                    <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-4">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800 mb-1">{item.name}</h3>
                    {item.description && (
                      <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                    )}
                    <span className="text-lg font-bold text-primary block mb-2">
                      {item.price} جنيه
                    </span>
                  </div>
                  <div className="mt-auto">
                    {cart.find(cartItem => cartItem.id === item.id) ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold">
                          {cart.find(cartItem => cartItem.id === item.id)?.quantity}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => addToCart(item)}
                        >
                          <Plus className="w-4 h-4 ml-1" />
                          إضافة
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => addToCart(item)}
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredMenuItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-row-reverse items-center gap-4">
                    {/* زر الإضافة أو التحكم */}
                    <div className="flex items-center gap-2">
                      {cart.find((cartItem) => cartItem.id === item.id) ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-semibold">
                            {cart.find((cartItem) => cartItem.id === item.id)?.quantity}
                          </span>
                          <Button size="sm" onClick={() => addToCart(item)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => addToCart(item)}>
                          <Plus className="w-4 h-4 ml-1" />
                          إضافة
                        </Button>
                      )}
                    </div>

                    {/* تفاصيل المنتج */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800 mb-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      )}
                      <span className="text-lg font-bold text-primary block mb-2">
                        {item.price} جنيه
                      </span>
                    </div>

                    {/* صورة المنتج */}
                    {item.image_url && (
                      <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-10">
            {/* الرئيسية */}
            <button
              onClick={() => navigate("/")}
              className={`flex flex-col items-center gap-0.5 text-xs transition ${
                location.pathname === "/" ? "text-red-600 font-bold" : "text-gray-600"
              } hover:text-red-500`}
            >
              <Home className="w-6 h-6" />
              <span>الرئيسية</span>
            </button>
            
             {/* سلة الطلبات */}
            {cart.length > 0 && (
              <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
                <DialogTrigger asChild>
                  <button
                    className={`relative flex flex-col items-center gap-0.5 text-xs transition ${
                      showCartDialog ? "text-red-600 font-bold" : "text-gray-600"
                    } hover:text-red-500`}
                  >
                    <ShoppingCart className="w-6 h-6" />
                    سلة الطلبات
                    <Badge className="absolute -top-1 -right-1 bg-primary text-white text-xs min-w-5 h-5 flex items-center justify-center rounded-full">
                      {cart.length}
                    </Badge>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md p-4 flex flex-col" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>سلة الطلبات</DialogTitle>
                  </DialogHeader>

                  {/* كل المحتوى داخل هذا الصندوق القابل للسكرول */}
                  <div className="overflow-y-auto flex-1 space-y-4 pr-2 pl-2 max-h-[calc(90vh-100px)]">
                    {/* عناصر السلة */}
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-600">
                              {item.price} جنيه × {item.quantity}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => removeFromCart(item.id)}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-medium">{item.quantity}</span>
                            <Button size="sm" onClick={() => addToCart(item)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="text-lg font-bold text-center">
                      الإجمالي: {getTotalPrice()} جنيه
                    </div>

                    <div className="text-sm text-center text-gray-600">
                      طريقة الدفع: الدفع عند الاستلام
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h3 className="font-medium">بيانات التوصيل</h3>

                      <div>
                        <Label htmlFor="customerName">اسم العميل</Label>
                        <Input
                          id="customerName"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="أدخل اسمك"
                        />
                      </div>

                      <div>
                        <Label htmlFor="customerAddress">عنوان التوصيل</Label>
                        <Textarea
                          id="customerAddress"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="أدخل عنوان التوصيل بالتفصيل"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="customerPhone">رقم العميل</Label>
                        <Input
                          id="customerPhone"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="أدخل رقم هاتفك"
                          type="tel"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={sendOrderToWhatsApp}
                      className="w-full"
                      disabled={!customerName || !customerAddress || !customerPhone}
                    >
                      إرسال الطلب واتساب
                    </Button>
                  </div>
                </DialogContent>

              </Dialog>
            )}

            {/* الملف الشخصي */}
            <button
              className={`flex flex-col items-center gap-0.5 text-xs transition ${
                location.pathname === "/profile" ? "text-red-600 font-bold" : "text-gray-600"
              } hover:text-red-500`}
            >
              <User className="w-6 h-6" />
              الملف الشخصي
            </button>
          </div>
          
          {/* Red Cart at the far left */}
          {cart.length > 0 && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Badge className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {cart.reduce((total, item) => total + item.quantity, 0)} عنصر
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}