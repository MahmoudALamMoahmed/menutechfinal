import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface PendingRestaurant {
  username: string;
  restaurantName: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  username: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string, restaurantName: string) => Promise<{ error: any; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  ensureRestaurantExists: () => Promise<{ created: boolean; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// مفتاح التخزين المحلي لبيانات المطعم المعلقة
const PENDING_RESTAURANT_KEY = 'pending_restaurant_data';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  // دالة مساعدة لجلب اسم المستخدم
  const fetchUsername = async (userId: string) => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('username')
      .eq('owner_id', userId)
      .single();
    
    if (!error && data) {
      setUsername(data.username);
    } else {
      setUsername(null);
    }
  };

  // دالة لإنشاء المطعم إذا لم يكن موجوداً (idempotent)
  const ensureRestaurantExists = async (): Promise<{ created: boolean; error: any }> => {
    if (!user) {
      return { created: false, error: { message: 'No authenticated user' } };
    }

    // تحقق من وجود مطعم مرتبط بالمستخدم
    const { data: existingRestaurant, error: checkError } = await supabase
      .from('restaurants')
      .select('id, username')
      .eq('owner_id', user.id)
      .single();

    if (existingRestaurant) {
      // المطعم موجود بالفعل
      setUsername(existingRestaurant.username);
      return { created: false, error: null };
    }

    // جلب بيانات المطعم المعلقة من التخزين المحلي
    const pendingDataStr = localStorage.getItem(PENDING_RESTAURANT_KEY);
    if (!pendingDataStr) {
      return { created: false, error: { message: 'No pending restaurant data found' } };
    }

    let pendingData: PendingRestaurant;
    try {
      pendingData = JSON.parse(pendingDataStr);
    } catch {
      localStorage.removeItem(PENDING_RESTAURANT_KEY);
      return { created: false, error: { message: 'Invalid pending restaurant data' } };
    }

    // إنشاء المطعم
    const { error: insertError } = await supabase
      .from('restaurants')
      .insert({
        owner_id: user.id,
        name: pendingData.restaurantName,
        username: pendingData.username,
        description: `مطعم ${pendingData.restaurantName} - نقدم أفضل الأطباق الشهية`,
      });

    if (insertError) {
      // إذا كان الخطأ بسبب duplicate، يعني المطعم تم إنشاؤه بالفعل
      if (insertError.code === '23505') {
        localStorage.removeItem(PENDING_RESTAURANT_KEY);
        await fetchUsername(user.id);
        return { created: false, error: null };
      }
      return { created: false, error: insertError };
    }

    // تم الإنشاء بنجاح - حذف البيانات المعلقة وتحديث اسم المستخدم
    localStorage.removeItem(PENDING_RESTAURANT_KEY);
    setUsername(pendingData.username);
    return { created: true, error: null };
  };

  useEffect(() => {
    // إعداد مستمع حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // جلب اسم المستخدم عند تسجيل الدخول
          await fetchUsername(session.user.id);
        } else {
          setUsername(null);
        }
        
        setLoading(false);
      }
    );

    // التحقق من الجلسة الحالية
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUsername(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string, restaurantName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      return { error, needsEmailConfirmation: false };
    }

    // حفظ بيانات المطعم في التخزين المحلي لإنشائها لاحقاً بعد التأكيد
    const pendingData: PendingRestaurant = { username, restaurantName };
    localStorage.setItem(PENDING_RESTAURANT_KEY, JSON.stringify(pendingData));

    // تحقق من حالة تأكيد الإيميل
    // إذا كان identities فارغاً أو user_metadata.email_confirmed = false، يعني يحتاج تأكيد
    const needsEmailConfirmation = !data.session || (data.user && data.user.identities?.length === 0);
    
    return { error: null, needsEmailConfirmation: !!needsEmailConfirmation };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    username,
    signIn,
    signUp,
    signOut,
    ensureRestaurantExists,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}