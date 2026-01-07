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
  ArrowLeft,
  Save,
  MapPin,
  Mail,
  Clock,
  Facebook,
  Instagram
} from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  username: string;
  address: string;
  email: string;
  facebook_url: string;
  instagram_url: string;
  working_hours: string;
  owner_id: string;
}

export default function FooterManagement() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    email: '',
    facebook_url: '',
    instagram_url: '',
    working_hours: 'يومياً من 9 صباحاً إلى 11 مساءً'
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
        throw error;
      }

      setRestaurant(restaurantData);
      setFormData({
        address: restaurantData.address || '',
        email: restaurantData.email || '',
        facebook_url: restaurantData.facebook_url || '',
        instagram_url: restaurantData.instagram_url || '',
        working_hours: restaurantData.working_hours || 'يومياً من 9 صباحاً إلى 11 مساءً'
      });
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
    if (!user || !restaurant) return;
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('restaurants')
        .update(formData)
        .eq('id', restaurant.id);

      if (error) throw error;

      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم تحديث بيانات الفوتر',
      });
      
      await fetchRestaurantData();
    } catch (error) {
      console.error('Error saving footer data:', error);
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

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-600">المطعم غير موجود</p>
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
                onClick={() => navigate(`/${username}/dashboard`)}
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">إدارة الفوتر</h1>
                <p className="text-gray-600 text-sm">
                  إدارة معلومات التواصل وبيانات الفوتر لمطعم {restaurant.name}
                </p>
              </div>
            </div>
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

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Location & Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                الموقع والتواصل
              </CardTitle>
              <CardDescription>
                العنوان الرئيسي والبريد الإلكتروني
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">العنوان الرئيسي (الدولة/المدينة)</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="المملكة العربية السعودية"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="info@restaurant.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Facebook className="w-5 h-5" />
                وسائل التواصل الاجتماعي
              </CardTitle>
              <CardDescription>
                روابط وسائل التواصل ومواعيد العمل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="space-y-2">
                <Label htmlFor="facebook_url">رابط صفحة الفيسبوك</Label>
                <Input
                  id="facebook_url"
                  value={formData.facebook_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebook_url: e.target.value }))}
                  placeholder="https://facebook.com/restaurant-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_url">رابط صفحة الانستغرام</Label>
                <Input
                  id="instagram_url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                  placeholder="https://instagram.com/restaurant-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="working_hours">مواعيد العمل</Label>
                <Input
                  id="working_hours"
                  value={formData.working_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, working_hours: e.target.value }))}
                  placeholder="يومياً من 9 صباحاً إلى 11 مساءً"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>معاينة الفوتر</CardTitle>
            <CardDescription>
              هكذا سيظهر الفوتر في صفحة المطعم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-white p-8 rounded-lg">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                
                {/* Restaurant Info Preview */}
                <div className="space-y-3">
                  <h3 className="font-bold text-lg text-primary">{restaurant.name}</h3>
                  {formData.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                      <span className="text-gray-300">{formData.address}</span>
                    </div>
                  )}
                  {formData.working_hours && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                      <span className="text-gray-300">{formData.working_hours}</span>
                    </div>
                  )}
                </div>

                {/* Digital Contact Preview */}
                <div className="space-y-3">
                  <h4 className="font-bold">التواصل الرقمي</h4>
                  {formData.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="text-gray-300">{formData.email}</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    {formData.facebook_url && (
                      <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                        <Facebook className="w-4 h-4" />
                      </div>
                    )}
                    {formData.instagram_url && (
                      <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                        <Instagram className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info Preview */}
                <div className="space-y-3">
                  <h4 className="font-bold">معلومات إضافية</h4>
                  <div className="text-gray-300 text-xs space-y-1">
                    <p>نسعى لتقديم أفضل خدمة</p>
                    <p>جميع أطباقنا طازجة</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-800 mt-6 pt-4 text-center text-gray-400 text-xs">
                <p>جميع الحقوق محفوظة لـ منيو تك © 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}