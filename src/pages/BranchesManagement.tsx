import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit2, 
  Save,
  MapPin,
  Phone,
  Building2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  whatsapp_phone: string;
  delivery_phone: string;
  working_hours: string;
  display_order: number;
  is_active: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  username: string;
  owner_id: string;
}

export default function BranchesManagement() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    whatsapp_phone: '',
    delivery_phone: '',
    working_hours: '',
    is_active: true
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
      // جلب بيانات المطعم
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name, username, owner_id')
        .eq('username', username)
        .eq('owner_id', user?.id)
        .single();

      if (restaurantError) {
        navigate('/');
        return;
      }

      setRestaurant(restaurantData);

      // جلب الفروع
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .order('display_order');

      if (branchesError) throw branchesError;
      setBranches(branchesData || []);
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

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      whatsapp_phone: '',
      delivery_phone: '',
      working_hours: '',
      is_active: true
    });
    setEditingBranch(null);
  };

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      whatsapp_phone: branch.whatsapp_phone || '',
      delivery_phone: branch.delivery_phone || '',
      working_hours: branch.working_hours || '',
      is_active: branch.is_active
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!restaurant || !formData.name.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم الفرع',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      if (editingBranch) {
        // تحديث فرع موجود
        const { error } = await supabase
          .from('branches')
          .update(formData)
          .eq('id', editingBranch.id);

        if (error) throw error;

        toast({
          title: 'تم التحديث',
          description: 'تم تحديث بيانات الفرع بنجاح',
        });
      } else {
        // إضافة فرع جديد
        const { error } = await supabase
          .from('branches')
          .insert([{
            ...formData,
            restaurant_id: restaurant.id,
            display_order: branches.length
          }]);

        if (error) throw error;

        toast({
          title: 'تم الإضافة',
          description: 'تم إضافة الفرع بنجاح',
        });
      }

      setShowDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving branch:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ البيانات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفرع؟')) return;

    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', branchId);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف الفرع بنجاح',
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الفرع',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (branch: Branch) => {
    try {
      const { error } = await supabase
        .from('branches')
        .update({ is_active: !branch.is_active })
        .eq('id', branch.id);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error('Error toggling branch status:', error);
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
                onClick={() => navigate(`/${username}/dashboard`)}
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">إدارة الفروع</h1>
                <p className="text-gray-600 text-sm">
                  {restaurant?.name}
                </p>
              </div>
            </div>
            <Dialog open={showDialog} onOpenChange={(open) => {
              setShowDialog(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة فرع
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>
                    {editingBranch ? 'تعديل الفرع' : 'إضافة فرع جديد'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم الفرع *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="فرع المعادي"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">العنوان</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="شارع 9، المعادي، القاهرة"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">الهاتف</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="01012345678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp_phone">واتساب</Label>
                      <Input
                        id="whatsapp_phone"
                        value={formData.whatsapp_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_phone: e.target.value }))}
                        placeholder="01012345678"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_phone">رقم الدليفري</Label>
                    <Input
                      id="delivery_phone"
                      value={formData.delivery_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, delivery_phone: e.target.value }))}
                      placeholder="01012345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="working_hours">ساعات العمل</Label>
                    <Input
                      id="working_hours"
                      value={formData.working_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, working_hours: e.target.value }))}
                      placeholder="يومياً من 9 صباحاً إلى 11 مساءً"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">فعال</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        حفظ
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {branches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">لا توجد فروع</h3>
              <p className="text-gray-500 text-sm mb-4">قم بإضافة فروع مطعمك مع عناوينها وأرقام التواصل</p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة فرع
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <Card key={branch.id} className={!branch.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{branch.name}</CardTitle>
                    <Switch
                      checked={branch.is_active}
                      onCheckedChange={() => toggleActive(branch)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {branch.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-600">{branch.address}</span>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{branch.phone}</span>
                    </div>
                  )}
                  {branch.delivery_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="text-gray-600">دليفري: {branch.delivery_phone}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEditDialog(branch)}
                    >
                      <Edit2 className="w-4 h-4 ml-1" />
                      تعديل
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDelete(branch.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
