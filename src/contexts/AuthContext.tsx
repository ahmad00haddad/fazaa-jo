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
        .neq("avatar_url", `cache_buster_${Date.now()}`) // Cache-buster
        .maybeSingle();

      if (profileError) {
        console.error("[auth] profile fetch error:", profileError.message);
        await new Promise(r => setTimeout(r, 2000));
        const retry = await supabase
          .from("profiles")
          .select("id, name, gender, city, points, avatar_url, verified")
          .eq("id", userId)
          .neq("avatar_url", `cache_buster_${Date.now()}`)
          .maybeSingle();
        if (retry.error || !retry.data) {
          setProfile(null);
          return;
        }
        const phone = await fetchPhone(userId);
        setProfile(buildProfile(retry.data, phone));
        return;
      }

      if (profileData) {
        const phone = await fetchPhone(userId);
        setProfile(buildProfile(profileData, phone));
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

  async function fetchPhone(userId: string): Promise<string> {
    // 1. Try the new RPC (works for updated DBs)
    try {
      const { data, error } = await supabase.rpc("get_my_phone");
      if (!error && data != null) return data;
    } catch (e) {
      // Ignore RPC error
    }

    // 2. Try querying user_private_data directly (works if RPC is missing but table exists)
    try {
      const { data, error } = await supabase.from("user_private_data").select("phone").eq("user_id", userId).maybeSingle();
      if (!error && data) return data.phone ?? "";
    } catch (e) {}

    // 3. Try querying profiles table (works for very old DBs where phone was a column)
    try {
      const { data, error } = await (supabase.from("profiles") as any).select("phone").eq("id", userId).maybeSingle();
      if (!error && data) return (data as any).phone ?? "";
    } catch (e) {}

    return "";
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
      phone_verified: raw.phone_verified ?? raw.verified ?? false,
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

    // Safety fallback to kill loading state if Supabase hangs
    const safetyTimeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 2000);

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return;
      
      // لا نغير loading إلى true هنا لتجنب وميض الشاشة عند كل تجديد للتوكن
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
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
