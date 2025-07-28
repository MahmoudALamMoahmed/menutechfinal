import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  username: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string, restaurantName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    }
  };

  useEffect(() => {
    // إعداد مستمع حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // جلب اسم المستخدم عند تسجيل الدخول
          setTimeout(() => {
            fetchUsername(session.user.id);
          }, 0);
        } else {
          setUsername(null);
        }
        
        setLoading(false);
      }
    );

    // التحقق من الجلسة الحالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUsername(session.user.id);
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

    // إذا تم إنشاء المستخدم بنجاح، إنشاء المطعم
    if (!error && data.user) {
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          owner_id: data.user.id,
          name: restaurantName,
          username: username,
          description: `مطعم ${restaurantName} - نقدم أفضل الأطباق الشهية`,
        });
      
      if (restaurantError) {
        console.error('خطأ في إنشاء المطعم:', restaurantError);
        return { error: restaurantError };
      }
    }
    
    return { error };
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