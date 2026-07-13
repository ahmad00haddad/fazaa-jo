import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
  const loadingRef = useRef(false);

  const loadProfile = async (userId: string) => {
    // منع تشغيل متوازي للنفس المستخدم
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      // الخطوة 1: ensure_user_private_data — اختيارية تماماً
      // فشلها لا يوقف تسجيل الدخول
      try {
        await supabase.rpc("ensure_user_private_data");
      } catch {
        console.warn("[auth] ensure_user_private_data failed silently — continuing");
      }

      // الخطوة 2: جلب البروفايل
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        // خطأ RLS أو schema — حاول مرة واحدة بعد ثانيتين بدل إظهار خطأ
        console.error("[auth] profile fetch error:", profileError.message);
        await new Promise(r => setTimeout(r, 2000));
        const retry = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
        if (retry.error || !retry.data) {
          console.error("[auth] profile retry failed:", retry.error?.message);
          return;
        }
        const phone = await fetchPhone();
        setProfile(buildProfile(retry.data, phone));
        return;
      }

      // لا بروفايل → مستخدم جديد حقاً → أكمل بياناته
      if (!profileData) {
        console.warn("[auth] no profile — redirecting to /complete-profile");
        if (!window.location.pathname.includes("complete-profile")) {
          window.location.href = "/complete-profile";
        }
        return;
      }

      // الخطوة 3: get_my_phone — اختيارية
      const phone = await fetchPhone();
      setProfile(buildProfile(profileData, phone));

    } catch (err: any) {
      // لا Toast هنا — فقط تسجيل هادئ في الـ console
      console.error("[auth] unexpected error in loadProfile:", err?.message);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  async function fetchPhone(): Promise<string> {
    try {
      const { data } = await supabase.rpc("get_my_phone");
      return data ?? "";
    } catch {
      return "";
    }
  }

  function buildProfile(raw: any, phone: string): Profile {
    return {
      id: raw.id,
      name: raw.name ?? "",
      phone,
      gender: (raw.gender as "male" | "female") ?? "male",
      verified: raw.verified ?? false,
      city: raw.city ?? null,
      points: raw.points ?? 0,
      // دعم كلا التسميتين للتوافق مع DB القديم والجديد
      phone_verified: raw.phone_verified ?? raw.verified ?? false,
      avatar_url: raw.avatar_url ?? null,
    };
  }

  useEffect(() => {
    // getSession أولاً ثم onAuthStateChange
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfile(s.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
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
