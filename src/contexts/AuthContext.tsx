import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Profile {
  id: string;
  name: string;
  phone: string;
  gender: "male" | "female";
  verified: boolean;
  city: string | null;
  points: number;
  phone_verified: boolean;
  avatar_url: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    try {
      // دفاعياً: تأكد من وجود سجل user_private_data قبل أي استدعاء آخر
      await supabase.rpc("ensure_user_private_data");

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("فشل تحميل البروفايل:", profileError.message);
        toast.error("حدث خطأ في تحميل بياناتك، حاول تسجيل الدخول مرة أخرى");
        setLoading(false);
        return;
      }

      if (!profileData) {
        console.error("لا يوجد بروفايل لهذا المستخدم");
        toast.error("لم يتم إيجاد حسابك، يرجى التواصل مع الدعم");
        setLoading(false);
        return;
      }

      const { data: phoneData, error: phoneError } = await supabase.rpc("get_my_phone");
      if (phoneError) {
        console.error("فشل تحميل رقم الهاتف:", phoneError.message);
      }

      setProfile({ ...profileData, phone: phoneData ?? "" });
    } catch (err: any) {
      console.error("خطأ غير متوقع عند تحميل البروفايل:", err?.message);
      toast.error("حدث خطأ غير متوقع، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setTimeout(() => loadProfile(newSession.user.id), 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
