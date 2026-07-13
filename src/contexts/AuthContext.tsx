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

interface PrivateProfileData {
  phone: string;
  phone_verified: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);

  const loadProfile = async (userId: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      try {
        await supabase.rpc("ensure_user_private_data");
      } catch {
        // Silently continue
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, gender, city, points, avatar_url, verified")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("[auth] profile fetch error:", profileError.message);
        await new Promise(r => setTimeout(r, 2000));
        const retry = await supabase.from("profiles").select("id, name, gender, city, points, avatar_url, verified").eq("id", userId).maybeSingle();
        if (retry.error || !retry.data) {
          setProfile(null);
          return;
        }
        const privateData = await fetchPrivateProfileData();
        setProfile(buildProfile(retry.data, privateData));
        return;
      }

      if (profileData) {
        const privateData = await fetchPrivateProfileData();
        setProfile(buildProfile(profileData, privateData));
      } else {
        setProfile(null);
      }
    } catch (err: any) {
      console.error("[auth] unexpected error in loadProfile:", err?.message);
      setProfile(null);
    } finally {
      loadingRef.current = false;
    }
  };

  async function fetchPrivateProfileData(): Promise<PrivateProfileData> {
    try {
      const { data, error } = await (supabase as any)
        .from("user_private_data")
        .select("phone, phone_verified")
        .maybeSingle();
      if (error) throw error;
      return {
        phone: data?.phone ?? "",
        phone_verified: data?.phone_verified ?? false,
      };
    } catch (e: any) {
      console.error("[auth] private profile fetch error:", e.message);
      try {
        const { data, error } = await supabase.rpc("get_my_phone");
        if (error) throw error;
        return { phone: data ?? "", phone_verified: !!data };
      } catch (fallbackError: any) {
        console.error("[auth] get_my_phone fallback error:", fallbackError.message);
        return { phone: "", phone_verified: false };
      }
    }
  }

  function buildProfile(raw: any, privateData: PrivateProfileData): Profile {
    return {
      id: raw.id,
      name: raw.name ?? "",
      phone: privateData.phone,
      gender: (raw.gender as "male" | "female") ?? "male",
      verified: raw.verified ?? false,
      city: raw.city ?? null,
      points: raw.points ?? 0,
      phone_verified: privateData.phone_verified,
      avatar_url: raw.avatar_url ?? null,
    };
  }

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          await loadProfile(data.session.user.id);
        } else {
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      
      // لا نغير loading إلى true هنا لتجنب وميض الشاشة عند كل تجديد للتوكن
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
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
