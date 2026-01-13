import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChefHat, Mail, CheckCircle2 } from 'lucide-react';
import { useUsernameAvailability, useEmailAvailability } from '@/hooks/useAvailabilityCheck';
import { AvailabilityIndicator } from '@/components/AvailabilityIndicator';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  
  const { signIn, signUp, user, ensureRestaurantExists } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // التحقق من توفر اسم المستخدم والإيميل
  const usernameCheck = useUsernameAvailability(username);
  const emailCheck = useEmailAvailability(email);

  // عند تسجيل الدخول، تأكد من وجود المطعم ثم وجه للصفحة المناسبة
  useEffect(() => {
    const handleUserSession = async () => {
      if (user) {
        // محاولة إنشاء المطعم إذا لم يكن موجوداً
        const { created, error } = await ensureRestaurantExists();
        
        if (created) {
          toast({
            title: 'تم إعداد مطعمك بنجاح',
            description: 'مرحباً بك في منصة المطاعم',
          });
        }
        
        if (!error || error.message === 'No pending restaurant data found') {
          navigate('/');
        }
      }
    };
    
    handleUserSession();
  }, [user, navigate, ensureRestaurantExists, toast]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message === 'Email not confirmed') {
        setError('يرجى تأكيد بريدك الإلكتروني أولاً');
      } else if (error.message === 'Invalid login credentials') {
        setError('بيانات تسجيل الدخول غير صحيحة');
      } else {
        setError('حدث خطأ أثناء تسجيل الدخول');
      }
    } else {
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'مرحباً بك في منصة المطاعم',
      });
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowEmailConfirmation(false);

    if (!username.trim()) {
      setError('اسم المستخدم مطلوب');
      setIsLoading(false);
      return;
    }

    // التحقق من صيغة اسم المستخدم (حروف إنجليزية وأرقام فقط)
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('اسم المستخدم يجب أن يحتوي على حروف إنجليزية وأرقام فقط');
      setIsLoading(false);
      return;
    }

    // التحقق من توفر اسم المستخدم
    if (usernameCheck.status === 'taken') {
      setError('اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر');
      setIsLoading(false);
      return;
    }

    // التحقق من توفر الإيميل
    if (emailCheck.status === 'taken') {
      setError('البريد الإلكتروني مستخدم بالفعل');
      setIsLoading(false);
      return;
    }

    if (!restaurantName.trim()) {
      setError('اسم المطعم مطلوب');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setIsLoading(false);
      return;
    }

    const { error, needsEmailConfirmation } = await signUp(email, password, username, restaurantName);
    
    if (error) {
      if (error.message.includes('already registered')) {
        setError('هذا البريد الإلكتروني مسجل بالفعل');
      } else {
        setError('حدث خطأ أثناء إنشاء الحساب');
      }
    } else if (needsEmailConfirmation) {
      // عرض رسالة تأكيد الإيميل
      setShowEmailConfirmation(true);
    } else {
      // تسجيل تلقائي بدون تأكيد إيميل
      toast({
        title: 'تم إنشاء الحساب بنجاح',
        description: 'مرحباً بك في منصة المطاعم',
      });
    }
    
    setIsLoading(false);
  };

  // شاشة تأكيد الإيميل
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500 text-white rounded-full p-4">
                  <Mail size={40} />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-800">تم إنشاء الحساب بنجاح!</CardTitle>
              <CardDescription className="text-green-700 text-base mt-2">
                يرجى التوجه إلى بريدك الإلكتروني لتأكيد الحساب
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <span className="font-medium">تم إرسال رابط التأكيد إلى:</span>
                </div>
                <p className="text-primary font-bold text-lg mr-8">{email}</p>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• تحقق من صندوق الوارد أو مجلد الرسائل غير المرغوب فيها</p>
                <p>• انقر على رابط التأكيد في الرسالة</p>
                <p>• سيتم توجيهك تلقائياً لإكمال إعداد مطعمك</p>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => {
                  setShowEmailConfirmation(false);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                  setUsername('');
                  setRestaurantName('');
                }}
              >
                العودة لتسجيل الدخول
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary text-primary-foreground rounded-full p-3">
              <ChefHat size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">منصة المطاعم</h1>
          <p className="text-gray-600">منيو إلكتروني احترافي لمطعمك</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">تسجيل الدخول لأصحاب المطاعم</CardTitle>
            <CardDescription className="text-center">
              أدخل بياناتك للوصول إلى لوحة تحكم مطعمك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="signup">إنشاء حساب جديد</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="example@restaurant.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    تسجيل الدخول
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-name">اسم المطعم</Label>
                    <Input
                      id="restaurant-name"
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      required
                      placeholder="اسم مطعمك"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">اسم المستخدم (رابط المطعم)</Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      required
                      placeholder="my-restaurant"
                      className="text-left"
                      dir="ltr"
                    />
                    <AvailabilityIndicator status={usernameCheck.status} message={usernameCheck.message} />
                    <p className="text-xs text-muted-foreground">
                      سيكون رابط مطعمك: /{username || 'اسم-المستخدم'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="example@restaurant.com"
                    />
                    <AvailabilityIndicator status={emailCheck.status} message={emailCheck.message} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">كلمة المرور</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    إنشاء حساب جديد
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}