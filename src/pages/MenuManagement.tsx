import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ImageUploader from '@/components/ImageUploader';
import { getMenuItemPublicId, deleteFromCloudinary } from '@/lib/cloudinary';
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  Ruler,
  Cookie,
  Search
} from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  username: string;
  owner_id: string;
}

interface Category {
  id: string;
  name: string;
  display_order: number;
  restaurant_id: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  restaurant_id: string;
  image_url: string | null;
  image_public_id: string | null;
  is_available: boolean;
  display_order: number;
}

interface Size {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  display_order: number;
}

interface Extra {
  id: string;
  restaurant_id: string;
  name: string;
  price: number;
  is_available: boolean;
  display_order: number;
}

export default function MenuManagement() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showSizesDialog, setShowSizesDialog] = useState(false);
  const [showExtrasDialog, setShowExtrasDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    display_order: 0
  });
  
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    image_public_id: '',
    is_available: true,
    display_order: 0
  });
  
  // Temporary item ID for new items (for image upload)
  const [tempItemId, setTempItemId] = useState<string | null>(null);
  
  const [sizeForm, setSizeForm] = useState({
    name: '',
    price: '',
    display_order: 0
  });
  
  const [extraForm, setExtraForm] = useState({
    name: '',
    price: '',
    display_order: 0
  });
  
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (username && user) {
      fetchData();
    }
  }, [username, user, authLoading]);

  const fetchData = async () => {
    try {
      // Fetch restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('username', username)
        .eq('owner_id', user?.id)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .order('display_order');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .order('display_order');

      if (itemsError) throw itemsError;
      setMenuItems(itemsData || []);

      // Fetch sizes
      const { data: sizesData, error: sizesError } = await supabase
        .from('sizes')
        .select('*')
        .order('display_order');

      if (sizesError) throw sizesError;
      setSizes(sizesData || []);

      // Fetch extras
      const { data: extrasData, error: extrasError } = await supabase
        .from('extras')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .order('display_order');

      if (extrasError) throw extrasError;
      setExtras(extrasData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!restaurant || !categoryForm.name.trim()) return;
    
    setSaving(true);
    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: categoryForm.name,
            display_order: categoryForm.display_order
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث القسم بنجاح',
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert([{
            name: categoryForm.name,
            display_order: categoryForm.display_order,
            restaurant_id: restaurant.id
          }]);

        if (error) throw error;
        
        toast({
          title: 'تم الحفظ',
          description: 'تم إضافة القسم بنجاح',
        });
      }
      
      // Reset form and refresh data
      setCategoryForm({ name: '', display_order: 0 });
      setShowCategoryForm(false);
      setEditingCategory(null);
      await fetchData();
      
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ القسم',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveItem = async () => {
    if (!restaurant || !itemForm.name.trim() || !itemForm.price) return;
    
    setSaving(true);
    try {
      const itemData = {
        name: itemForm.name,
        description: itemForm.description || null,
        price: parseFloat(itemForm.price),
        category_id: itemForm.category_id || null,
        image_url: itemForm.image_url || null,
        image_public_id: itemForm.image_public_id || null,
        is_available: itemForm.is_available,
        display_order: itemForm.display_order,
        restaurant_id: restaurant.id
      };

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
        
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث الصنف بنجاح',
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from('menu_items')
          .insert([itemData]);

        if (error) throw error;
        
        toast({
          title: 'تم الحفظ',
          description: 'تم إضافة الصنف بنجاح',
        });
      }
      
      // Reset form and refresh data
      setItemForm({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        image_public_id: '',
        is_available: true,
        display_order: 0
      });
      setTempItemId(null);
      setShowItemForm(false);
      setEditingItem(null);
      await fetchData();
      
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الصنف',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      
      toast({
        title: 'تم الحذف',
        description: 'تم حذف القسم بنجاح',
      });
      
      await fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف القسم',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصنف؟')) return;
    
    try {
      // Find the item to get its image public_id
      const item = menuItems.find(i => i.id === itemId);
      
      // Delete image from Cloudinary if exists
      if (item?.image_public_id) {
        try {
          await deleteFromCloudinary(item.image_public_id);
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
          // Continue with item deletion even if image deletion fails
        }
      }
      
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الصنف بنجاح',
      });
      
      await fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الصنف',
        variant: 'destructive',
      });
    }
  };

  // Size management functions
  const handleSaveSize = async () => {
    if (!selectedItemId || !sizeForm.name.trim() || !sizeForm.price) return;
    
    setSaving(true);
    try {
      const sizeData = {
        menu_item_id: selectedItemId,
        name: sizeForm.name,
        price: parseFloat(sizeForm.price),
        display_order: sizeForm.display_order
      };

      if (editingSize) {
        // Update existing size
        const { error } = await supabase
          .from('sizes')
          .update(sizeData)
          .eq('id', editingSize.id);

        if (error) throw error;
        
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث الحجم بنجاح',
        });
      } else {
        // Create new size
        const { error } = await supabase
          .from('sizes')
          .insert([sizeData]);

        if (error) throw error;
        
        toast({
          title: 'تم الحفظ',
          description: 'تم إضافة الحجم بنجاح',
        });
      }
      
      // Reset form and refresh data
      setSizeForm({ name: '', price: '', display_order: 0 });
      setEditingSize(null);
      await fetchData();
      
    } catch (error) {
      console.error('Error saving size:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الحجم',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSize = async (sizeId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحجم؟')) return;
    
    try {
      const { error } = await supabase
        .from('sizes')
        .delete()
        .eq('id', sizeId);

      if (error) throw error;
      
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الحجم بنجاح',
      });
      
      await fetchData();
    } catch (error) {
      console.error('Error deleting size:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الحجم',
        variant: 'destructive',
      });
    }
  };

  const openSizesDialog = (itemId: string) => {
    setSelectedItemId(itemId);
    setShowSizesDialog(true);
    setSizeForm({ name: '', price: '', display_order: 0 });
    setEditingSize(null);
  };

  const getSizesForItem = (itemId: string) => {
    return sizes.filter(size => size.menu_item_id === itemId);
  };

  // Extras management functions
  const handleSaveExtra = async () => {
    if (!restaurant || !extraForm.name.trim() || !extraForm.price) return;
    
    setSaving(true);
    try {
      const extraData = {
        restaurant_id: restaurant.id,
        name: extraForm.name,
        price: parseFloat(extraForm.price),
        display_order: extraForm.display_order,
        is_available: true
      };

      if (editingExtra) {
        const { error } = await supabase
          .from('extras')
          .update(extraData)
          .eq('id', editingExtra.id);

        if (error) throw error;
        
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث الإضافة بنجاح',
        });
      } else {
        const { error } = await supabase
          .from('extras')
          .insert([extraData]);

        if (error) throw error;
        
        toast({
          title: 'تم الحفظ',
          description: 'تم إضافة الإضافة بنجاح',
        });
      }
      
      setExtraForm({ name: '', price: '', display_order: 0 });
      setEditingExtra(null);
      await fetchData();
      
    } catch (error) {
      console.error('Error saving extra:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الإضافة',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExtra = async (extraId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الإضافة؟')) return;
    
    try {
      const { error } = await supabase
        .from('extras')
        .delete()
        .eq('id', extraId);

      if (error) throw error;
      
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الإضافة بنجاح',
      });
      
      await fetchData();
    } catch (error) {
      console.error('Error deleting extra:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الإضافة',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-600">المطعم غير موجود أو ليس لديك صلاحية للوصول إليه</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/${restaurant.username}/dashboard`)}
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة لوحة التحكم
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">إدارة القائمة</h1>
                <p className="text-gray-600 text-sm">إدارة فئات وأصناف {restaurant.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Categories Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>إدارة الفئات</CardTitle>
                  <CardDescription>أضف وعدل فئات القائمة</CardDescription>
                </div>
                <Button onClick={() => setShowCategoryForm(!showCategoryForm)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة فئة
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showCategoryForm && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div>
                    <Label htmlFor="categoryName">اسم الفئة</Label>
                    <Input
                      id="categoryName"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="مثال: المقبلات"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryOrder">ترتيب العرض</Label>
                    <Input
                      id="categoryOrder"
                      type="number"
                      value={categoryForm.display_order}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveCategory} disabled={saving}>
                      <Save className="w-4 h-4 ml-2" />
                      {editingCategory ? 'تحديث' : 'حفظ'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowCategoryForm(false);
                        setEditingCategory(null);
                        setCategoryForm({ name: '', display_order: 0 });
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-gray-500">ترتيب: {category.display_order}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCategory(category);
                          setCategoryForm({
                            name: category.name,
                            display_order: category.display_order
                          });
                          setShowCategoryForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Menu Items Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>إدارة الأصناف</CardTitle>
                  <CardDescription>أضف وعدل أصناف القائمة</CardDescription>
                </div>
                <Button onClick={() => {
                  setShowItemForm(!showItemForm);
                  if (!showItemForm) {
                    // Generate temp ID for new item
                    setTempItemId(crypto.randomUUID());
                  }
                }}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة صنف
                </Button>
              </div>
              
              {/* Search Box */}
              <div className="relative mt-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن صنف..."
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  className="pr-9 h-9 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showItemForm && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div>
                    <Label htmlFor="itemName">اسم الصنف</Label>
                    <Input
                      id="itemName"
                      value={itemForm.name}
                      onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="مثال: شاورما لحم"
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemDescription">الوصف</Label>
                    <Textarea
                      id="itemDescription"
                      value={itemForm.description}
                      onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="وصف الصنف..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="itemPrice">السعر</Label>
                      <Input
                        id="itemPrice"
                        type="number"
                        step="0.01"
                        value={itemForm.price}
                        onChange={(e) => setItemForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="itemCategory">الفئة</Label>
                      <Select 
                        value={itemForm.category_id} 
                        onValueChange={(value) => setItemForm(prev => ({ ...prev, category_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر فئة" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {restaurant && (editingItem || tempItemId) && (
                    <ImageUploader
                      label="صورة الصنف"
                      currentImageUrl={itemForm.image_url}
                      currentPublicId={itemForm.image_public_id}
                      publicId={getMenuItemPublicId(restaurant.username, editingItem?.id || tempItemId!)}
                      aspectRatio="square"
                      onUploadComplete={(url, publicId) => {
                        setItemForm(prev => ({
                          ...prev,
                          image_url: url,
                          image_public_id: publicId
                        }));
                      }}
                      onDelete={() => {
                        setItemForm(prev => ({
                          ...prev,
                          image_url: '',
                          image_public_id: ''
                        }));
                      }}
                    />
                  )}
                  <div className="flex gap-2">
                    <Button onClick={handleSaveItem} disabled={saving}>
                      <Save className="w-4 h-4 ml-2" />
                      {editingItem ? 'تحديث' : 'حفظ'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowItemForm(false);
                        setEditingItem(null);
                        setTempItemId(null);
                        setItemForm({
                          name: '',
                          description: '',
                          price: '',
                          category_id: '',
                          image_url: '',
                          image_public_id: '',
                          is_available: true,
                          display_order: 0
                        });
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {menuItems
                  .filter(item => 
                    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                    item.description?.toLowerCase().includes(itemSearchQuery.toLowerCase())
                  )
                  .map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                      <p className="text-sm font-bold text-green-600">{item.price} ج.م</p>
                      <p className="text-xs text-gray-400">
                        {item.category_id ? categories.find(c => c.id === item.category_id)?.name : 'بدون فئة'}
                      </p>
                    </div>
                     <div className="flex gap-2">
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => openSizesDialog(item.id)}
                         title="إدارة الأحجام"
                       >
                         <Ruler className="w-4 h-4" />
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                        onClick={() => {
                          setEditingItem(item);
                          setTempItemId(null);
                          setItemForm({
                            name: item.name,
                            description: item.description || '',
                            price: item.price.toString(),
                            category_id: item.category_id || '',
                            image_url: item.image_url || '',
                            image_public_id: item.image_public_id || '',
                            is_available: item.is_available,
                            display_order: item.display_order
                          });
                          setShowItemForm(true);
                        }}
                       >
                         <Edit className="w-4 h-4" />
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => handleDeleteItem(item.id)}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Extras Management */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>إدارة الإضافات</CardTitle>
                  <CardDescription>أضف إضافات اختيارية للوجبات (جبنة إضافية، صوص، إلخ)</CardDescription>
                </div>
                <Button onClick={() => setShowExtrasDialog(true)}>
                  <Cookie className="w-4 h-4 ml-2" />
                  إدارة الإضافات
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {extras.map((extra) => (
                  <div key={extra.id} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                    <span className="font-medium">{extra.name}</span>
                    <span className="text-sm text-green-600">+{extra.price} ج.م</span>
                  </div>
                ))}
                {extras.length === 0 && (
                  <p className="text-gray-500">لا توجد إضافات بعد</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sizes Management Dialog */}
      <Dialog open={showSizesDialog} onOpenChange={setShowSizesDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إدارة الأحجام</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add Size Form */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div>
                <Label htmlFor="sizeName">اسم الحجم</Label>
                <Input
                  id="sizeName"
                  value={sizeForm.name}
                  onChange={(e) => setSizeForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: صغير، وسط، كبير"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sizePrice">السعر</Label>
                  <Input
                    id="sizePrice"
                    type="number"
                    step="0.01"
                    value={sizeForm.price}
                    onChange={(e) => setSizeForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="sizeOrder">ترتيب العرض</Label>
                  <Input
                    id="sizeOrder"
                    type="number"
                    value={sizeForm.display_order}
                    onChange={(e) => setSizeForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveSize} disabled={saving}>
                  <Save className="w-4 h-4 ml-2" />
                  {editingSize ? 'تحديث' : 'حفظ'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSizeForm({ name: '', price: '', display_order: 0 });
                    setEditingSize(null);
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </div>
            
            {/* Existing Sizes */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedItemId && getSizesForItem(selectedItemId).map((size) => (
                <div key={size.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div>
                    <p className="font-medium">{size.name}</p>
                    <p className="text-sm text-gray-500">{size.price} ج.م</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingSize(size);
                        setSizeForm({
                          name: size.name,
                          price: size.price.toString(),
                          display_order: size.display_order
                        });
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSize(size.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {selectedItemId && getSizesForItem(selectedItemId).length === 0 && (
                <p className="text-gray-500 text-center py-4">لا توجد أحجام مضافة بعد</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extras Management Dialog */}
      <Dialog open={showExtrasDialog} onOpenChange={setShowExtrasDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إدارة الإضافات</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add Extra Form */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div>
                <Label htmlFor="extraName">اسم الإضافة</Label>
                <Input
                  id="extraName"
                  value={extraForm.name}
                  onChange={(e) => setExtraForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: جبنة موتزاريلا، صوص حار"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="extraPrice">السعر الإضافي</Label>
                  <Input
                    id="extraPrice"
                    type="number"
                    step="0.01"
                    value={extraForm.price}
                    onChange={(e) => setExtraForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="extraOrder">ترتيب العرض</Label>
                  <Input
                    id="extraOrder"
                    type="number"
                    value={extraForm.display_order}
                    onChange={(e) => setExtraForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveExtra} disabled={saving}>
                  <Save className="w-4 h-4 ml-2" />
                  {editingExtra ? 'تحديث' : 'حفظ'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setExtraForm({ name: '', price: '', display_order: 0 });
                    setEditingExtra(null);
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </div>
            
            {/* Existing Extras */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {extras.map((extra) => (
                <div key={extra.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div>
                    <p className="font-medium">{extra.name}</p>
                    <p className="text-sm text-green-600">+{extra.price} ج.م</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingExtra(extra);
                        setExtraForm({
                          name: extra.name,
                          price: extra.price.toString(),
                          display_order: extra.display_order
                        });
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteExtra(extra.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {extras.length === 0 && (
                <p className="text-gray-500 text-center py-4">لا توجد إضافات بعد</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}