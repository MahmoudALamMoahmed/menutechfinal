import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChefHat, Mail, ArrowRight, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // حالات تغيير كلمة المرور
  const [isResetMode, setIsResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // التحقق من وجود توكن إعادة التعيين في URL
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');

    if (type === 'recovery' && accessToken) {
      setIsResetMode(true);
    }
  }, []);

  // عداد تنازلي لإعادة الإرسال
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      setIsLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/forgot-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      if (error.message.includes('rate limit')) {
        setError('تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً');
      } else {
        setError('حدث خطأ أثناء إرسال الرابط، يرجى المحاولة مرة أخرى');
      }
    } else {
      setEmailSent(true);
      setResendCooldown(60);
      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
      });
    }

    setIsLoading(false);
  };

  const handleResend = async () => {
    setIsLoading(true);
    const redirectUrl = `${window.location.origin}/forgot-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast({
        title: 'خطأ',
        description: 'فشل إعادة إرسال الرابط، حاول مرة أخرى لاحقاً',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال رابط إعادة التعيين مرة أخرى',
      });
      setResendCooldown(60);
    }

    setIsLoading(false);
  };

  // تحديث كلمة المرور الجديدة
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // التحقق من تطابق كلمتي المرور
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      setIsLoading(false);
      return;
    }

    // التحقق من طول كلمة المرور
    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      if (error.message.includes('same as')) {
        setError('كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة');
      } else {
        setError('حدث خطأ أثناء تحديث كلمة المرور، يرجى المحاولة مرة أخرى');
      }
    } else {
      setPasswordUpdated(true);
      toast({
        title: 'تم التحديث',
        description: 'تم تغيير كلمة المرور بنجاح',
      });
    }

    setIsLoading(false);
  };

  // شاشة نجاح تحديث كلمة المرور
  if (passwordUpdated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500 text-white rounded-full p-4">
                  <CheckCircle2 size={40} />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-800">تم تغيير كلمة المرور!</CardTitle>
              <CardDescription className="text-green-700 text-base mt-2">
                يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full"
              >
                <ArrowRight className="ml-2 h-4 w-4" />
                الذهاب لتسجيل الدخول
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // شاشة تغيير كلمة المرور (بعد النقر على الرابط)
  if (isResetMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary text-primary-foreground rounded-full p-3">
                <Lock size={32} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">تعيين كلمة مرور جديدة</h1>
            <p className="text-gray-600">أدخل كلمة المرور الجديدة لحسابك</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">كلمة المرور الجديدة</CardTitle>
              <CardDescription className="text-center">
                اختر كلمة مرور قوية لا تقل عن 6 أحرف
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  <Lock className="ml-2 h-4 w-4" />
                  تحديث كلمة المرور
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // شاشة تأكيد إرسال الرابط
  if (emailSent) {
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
              <CardTitle className="text-2xl text-green-800">تم إرسال الرابط!</CardTitle>
              <CardDescription className="text-green-700 text-base mt-2">
                تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <span className="font-medium">تم إرسال رابط إعادة التعيين إلى:</span>
                </div>
                <p className="text-primary font-bold text-lg mr-8">{email}</p>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• تحقق من صندوق الوارد أو مجلد الرسائل غير المرغوب فيها</p>
                <p>• انقر على رابط إعادة التعيين في الرسالة</p>
                <p>• سيتم توجيهك لإدخال كلمة مرور جديدة</p>
              </div>
              
              {/* زر إعادة إرسال الرابط */}
              <div className="text-center mt-4 pt-4 border-t border-green-200">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    يمكنك إعادة الإرسال بعد {resendCooldown} ثانية
                  </p>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-green-700 hover:text-green-800 hover:bg-green-100"
                  >
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    <Mail className="ml-2 h-4 w-4" />
                    إعادة إرسال الرابط
                  </Button>
                )}
              </div>
              
              <Link to="/auth">
                <Button variant="outline" className="w-full mt-4">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  العودة لتسجيل الدخول
                </Button>
              </Link>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">نسيت كلمة المرور؟</h1>
          <p className="text-gray-600">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">إعادة تعيين كلمة المرور</CardTitle>
            <CardDescription className="text-center">
              سيتم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
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
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                <Mail className="ml-2 h-4 w-4" />
                إرسال رابط إعادة التعيين
              </Button>
              
              <Link to="/auth">
                <Button variant="ghost" className="w-full" type="button">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  العودة لتسجيل الدخول
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
