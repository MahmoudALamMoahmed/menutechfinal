import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
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
    is_available: true,
    display_order: 0
  });

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
        is_available: true,
        display_order: 0
      });
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
                <Button onClick={() => setShowItemForm(!showItemForm)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة صنف
                </Button>
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
                  <div>
                    <Label htmlFor="itemImage">رابط الصورة</Label>
                    <Input
                      id="itemImage"
                      value={itemForm.image_url}
                      onChange={(e) => setItemForm(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
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
                        setItemForm({
                          name: '',
                          description: '',
                          price: '',
                          category_id: '',
                          image_url: '',
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
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {menuItems.map((item) => (
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
                        onClick={() => {
                          setEditingItem(item);
                          setItemForm({
                            name: item.name,
                            description: item.description || '',
                            price: item.price.toString(),
                            category_id: item.category_id || '',
                            image_url: item.image_url || '',
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
        </div>
      </div>
    </div>
  );
}