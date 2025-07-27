import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings,
  Upload,
  Plus,
  Menu,
  BarChart3,
  Users,
  ShoppingBag,
  ArrowLeft,
  Save,
  Eye
} from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  username: string;
  description: string;
  cover_image_url: string;
  logo_url: string;
  phone: string;
  whatsapp_phone: string;
  address: string;
  owner_id: string;
}

export default function Dashboard() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    description: '',
    phone: '',
    whatsapp_phone: '',
    address: '',
    cover_image_url: '',
    logo_url: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (username && user) {
      fetchRestaurantData();
    }
  }, [username, user, authLoading]);

  const fetchRestaurantData = async () => {
    try {
      const { data: restaurantData, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('username', username)
        .eq('owner_id', user?.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // المطعم غير موجود - إنشاء مطعم جديد
          setFormData(prev => ({ ...prev, username: username || '' }));
        } else {
          throw error;
        }
      } else {
        setRestaurant(restaurantData);
        setFormData({
          name: restaurantData.name || '',
          username: restaurantData.username || '',
          description: restaurantData.description || '',
          phone: restaurantData.phone || '',
          whatsapp_phone: restaurantData.whatsapp_phone || '',
          address: restaurantData.address || '',
          cover_image_url: restaurantData.cover_image_url || '',
          logo_url: restaurantData.logo_url || ''
        });
      }
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

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      if (restaurant) {
        // تحديث المطعم الموجود
        const { error } = await supabase
          .from('restaurants')
          .update(formData)
          .eq('id', restaurant.id);

        if (error) throw error;

        toast({
          title: 'تم الحفظ بنجاح',
          description: 'تم تحديث بيانات المطعم',
        });
      } else {
        // إنشاء مطعم جديد
        const { data, error } = await supabase
          .from('restaurants')
          .insert([{ ...formData, owner_id: user.id }])
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            toast({
              title: 'خطأ',
              description: 'اسم المطعم في الرابط مُستخدم بالفعل',
              variant: 'destructive',
            });
            return;
          }
          throw error;
        }

        setRestaurant(data);
        toast({
          title: 'تم إنشاء المطعم بنجاح',
          description: 'يمكنك الآن إضافة عناصر القائمة',
        });
      }
      
      await fetchRestaurantData();
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ البيانات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {restaurant ? 'إدارة المطعم' : 'إنشاء مطعم جديد'}
                </h1>
                <p className="text-gray-600 text-sm">
                  {restaurant 
                    ? `لوحة تحكم ${restaurant.name}` 
                    : 'أنشئ مطعمك الإلكتروني الآن'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {restaurant && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/${restaurant.username}`)}
                >
                  <Eye className="w-4 h-4 ml-2" />
                  عرض المطعم
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Restaurant Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  معلومات المطعم
                </CardTitle>
                <CardDescription>
                  أدخل البيانات الأساسية لمطعمك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم المطعم *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="مطعم الأصالة"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">اسم المطعم في الرابط *</Label>
                    <div className="relative">
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                        placeholder="hany"
                        required
                        disabled={!!restaurant}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        سيكون رابط مطعمك: /{formData.username}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">وصف المطعم</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="نقدم أفضل المأكولات الشرقية والغربية..."
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="01012345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_phone">رقم الواتساب</Label>
                    <Input
                      id="whatsapp_phone"
                      value={formData.whatsapp_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_phone: e.target.value }))}
                      placeholder="01062698964"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">العنوان</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="شارع الجامعة، المعادي، القاهرة"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cover_image_url">رابط صورة الغلاف</Label>
                    <Input
                      id="cover_image_url"
                      value={formData.cover_image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                      placeholder="https://example.com/cover.jpg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">رابط شعار المطعم</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                      placeholder="https://example.com/logo.jpg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  disabled={!restaurant}
                  onClick={() => restaurant && navigate(`/${restaurant.username}/menu-management`)}
                >
                  <Menu className="w-4 h-4 ml-2" />
                  إدارة القائمة
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  disabled={!restaurant}
                  onClick={() => restaurant && navigate(`/${restaurant.username}/orders`)}
                >
                  <ShoppingBag className="w-4 h-4 ml-2" />
                  الطلبات
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  disabled={!restaurant}
                  onClick={() => restaurant && navigate(`/${restaurant.username}/analytics`)}
                >
                  <BarChart3 className="w-4 h-4 ml-2" />
                  التقارير
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  disabled={!restaurant}
                  onClick={() => {
                    toast({
                      title: 'قريباً',
                      description: 'ميزة رفع الصور ستكون متاحة قريباً',
                    });
                  }}
                >
                  <Upload className="w-4 h-4 ml-2" />
                  رفع الصور
                </Button>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>مساعدة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  هل تحتاج مساعدة في إعداد مطعمك؟
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  تواصل معنا
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}