import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Phone, MapPin, Calendar, DollarSign, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  notes: string;
  items: OrderItem[];
  total_price: number;
  status: string;
  is_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export default function Orders() {
  const { restaurantUsername } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);

  useEffect(() => {
    fetchRestaurantAndOrders();
  }, [restaurantUsername]);

  const fetchRestaurantAndOrders = async () => {
    try {
      // جلب بيانات المطعم أولاً
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('username', restaurantUsername)
        .maybeSingle();

      if (restaurantError) {
        throw restaurantError;
      }

      if (!restaurantData) {
        throw new Error('المطعم غير موجود');
      }

      setRestaurant(restaurantData);

      // جلب الطلبات الخاصة بالمطعم
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw ordersError;
      }

      // تحويل البيانات إلى النوع المطلوب
      const formattedOrders: Order[] = (ordersData || []).map(order => ({
        ...order,
        items: Array.isArray(order.items) ? (order.items as unknown as OrderItem[]) : [],
      }));
      setOrders(formattedOrders);
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل الطلبات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, isConfirmed?: boolean) => {
    try {
      const updateData: any = { status: newStatus, updated_at: new Date().toISOString() };
      if (isConfirmed !== undefined) {
        updateData.is_confirmed = isConfirmed;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      // تحديث الطلبات محلياً
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, ...updateData }
          : order
      ));

      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة الطلب بنجاح',
      });
    } catch (error) {
      console.error('خطأ في تحديث الطلب:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحديث الطلب',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'في الانتظار';
      case 'confirmed':
        return 'مؤكد';
      case 'preparing':
        return 'قيد التحضير';
      case 'ready':
        return 'جاهز';
      case 'delivered':
        return 'تم التسليم';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/${restaurantUsername}/dashboard`)}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              العودة للوحة التحكم
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">الطلبات</h1>
              <p className="text-gray-600">إدارة طلبات {restaurant?.name}</p>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد طلبات</h3>
                <p className="text-gray-600 text-center">لم يتم استلام أي طلبات حتى الآن</p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CardTitle className="text-lg">
                        طلب #{order.id.slice(0, 8)}
                      </CardTitle>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                      {order.is_confirmed && (
                        <Badge className="bg-green-100 text-green-800">
                          مؤكد
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* معلومات العميل */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 border-b pb-2">معلومات العميل</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">الاسم:</span>
                          <span>{order.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">الهاتف:</span>
                          <span dir="ltr">{order.customer_phone}</span>
                        </div>
                        {order.notes && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                            <span className="font-medium">العنوان:</span>
                            <span className="flex-1">{order.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* تفاصيل الطلب */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 border-b pb-2">تفاصيل الطلب</h3>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-600 mr-2">x{item.quantity}</span>
                            </div>
                            <span className="font-medium">{item.total} جنيه</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold">الإجمالي:</span>
                          </div>
                          <span className="text-lg font-bold text-primary">{order.total_price} جنيه</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* إجراءات الطلب */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => updateOrderStatus(order.id, 'confirmed', true)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            تأكيد الطلب
                          </Button>
                          <Button
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            variant="destructive"
                          >
                            إلغاء الطلب
                          </Button>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          بدء التحضير
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          الطلب جاهز
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="bg-gray-600 hover:bg-gray-700"
                        >
                          تم التسليم
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}