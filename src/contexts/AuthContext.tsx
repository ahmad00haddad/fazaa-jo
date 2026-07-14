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
  const loadingProfileFor = useRef<string | null>(null);

  const loadProfile = async (userId: string) => {
    // Prevent duplicate concurrent loads for the same user
    if (loadingProfileFor.current === userId) return;
    loadingProfileFor.current = userId;

    try {
      // 1) Defensive: ensure private data row exists (safe RPC, no-op if already there)
      try {
        await supabase.rpc("ensure_user_private_data");
      } catch {
        // Silently continue — function may not exist on very old DBs
      }

      // 2) Fetch public profile (no bogus cache-buster filter)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, gender, city, points, avatar_url, verified")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("[auth] profile fetch error:", profileError.message);
        setProfile(null);
        return;
      }

      if (!profileData) {
        // Trigger/handle_new_user hasn't created a profile yet — treat as no profile
        setProfile(null);
        return;
      }

      // 3) Fetch phone via the dedicated secure RPC
      let phone = "";
      try {
        const { data: phoneData, error: phoneError } = await supabase.rpc("get_my_phone");
        if (!phoneError && phoneData != null) phone = phoneData;
      } catch {
        // Ignore RPC error
      }

      if (!phone) {
        try {
          const { data } = await supabase.from("user_private_data").select("phone").eq("user_id", userId).maybeSingle();
          if (data) phone = data.phone ?? "";
        } catch (e) {}
      }

      if (!phone) {
        try {
          const { data } = await supabase.from("profiles").select("phone").eq("id", userId).maybeSingle();
          if (data) phone = (data as any).phone ?? "";
        } catch (e) {}
      }

      setProfile(buildProfile(profileData, phone));
    } catch (err: any) {
      console.error("[auth] unexpected error in loadProfile:", err?.message);
      setProfile(null);
    } finally {
      // Only clear the lock if it's still ours (prevents races)
      if (loadingProfileFor.current === userId) {
        loadingProfileFor.current = null;
      }
    }
  };

  function buildProfile(raw: any, phone: string): Profile {
    return {
      id: raw.id,
      name: raw.name ?? "",
      phone: phone ?? "",
      gender: (raw.gender as "male" | "female") ?? "male",
      verified: raw.verified ?? false,
      city: raw.city ?? null,
      points: raw.points ?? 0,
      phone_verified: raw.verified ?? false,
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
      } catch (err) {
        console.error("[auth] init error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Safety fallback to kill loading state if Supabase hangs (very common in dev/HMR)
    const safetyTimeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 2000);

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      if (event === "INITIAL_SESSION") return; // Already handled above

      // Keep loading=true while we re-fetch profile to avoid premature redirects
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        setLoading(true);
        await loadProfile(newSession.user.id);
        if (mounted) setLoading(false);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        if (mounted) setLoading(false);
      }
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
    if (user) {
      await loadProfile(user.id);
    }
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
