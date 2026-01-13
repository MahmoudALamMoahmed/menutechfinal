import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

interface UseAvailabilityCheckResult {
  status: AvailabilityStatus;
  message: string;
}

// التحقق من توفر اسم المستخدم
export function useUsernameAvailability(username: string): UseAvailabilityCheckResult {
  const [status, setStatus] = useState<AvailabilityStatus>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // إعادة تعيين الحالة إذا كان الحقل فارغاً
    if (!username.trim()) {
      setStatus('idle');
      setMessage('');
      return;
    }

    // التحقق من صحة الصيغة أولاً
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setStatus('invalid');
      setMessage('يجب أن يحتوي على حروف إنجليزية وأرقام فقط');
      return;
    }

    if (username.length < 3) {
      setStatus('invalid');
      setMessage('يجب أن يكون 3 أحرف على الأقل');
      return;
    }

    // بدء التحقق
    setStatus('checking');
    setMessage('جاري التحقق...');

    const timeoutId = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id')
          .eq('username', username.toLowerCase())
          .maybeSingle();

        if (error) {
          setStatus('idle');
          setMessage('');
          return;
        }

        if (data) {
          setStatus('taken');
          setMessage('اسم المستخدم مستخدم بالفعل');
        } else {
          setStatus('available');
          setMessage('اسم المستخدم متاح');
        }
      } catch {
        setStatus('idle');
        setMessage('');
      }
    }, 500); // debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [username]);

  return { status, message };
}

// التحقق من توفر البريد الإلكتروني
export function useEmailAvailability(email: string): UseAvailabilityCheckResult {
  const [status, setStatus] = useState<AvailabilityStatus>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // إعادة تعيين الحالة إذا كان الحقل فارغاً
    if (!email.trim()) {
      setStatus('idle');
      setMessage('');
      return;
    }

    // التحقق من صحة صيغة الإيميل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('invalid');
      setMessage('صيغة البريد الإلكتروني غير صحيحة');
      return;
    }

    // بدء التحقق
    setStatus('checking');
    setMessage('جاري التحقق...');

    const timeoutId = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (error) {
          setStatus('idle');
          setMessage('');
          return;
        }

        if (data) {
          setStatus('taken');
          setMessage('البريد الإلكتروني مستخدم بالفعل');
        } else {
          setStatus('available');
          setMessage('البريد الإلكتروني متاح');
        }
      } catch {
        setStatus('idle');
        setMessage('');
      }
    }, 500); // debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [email]);

  return { status, message };
}
