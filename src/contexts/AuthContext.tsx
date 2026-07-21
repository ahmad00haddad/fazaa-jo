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
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileLoadRef = useRef<{ userId: string; promise: Promise<Profile | null> } | null>(null);

  const loadProfile = async (userId: string, force = false): Promise<Profile | null> => {
    if (!force && profileLoadRef.current?.userId === userId) {
      return profileLoadRef.current.promise;
    }

    const promise = (async () => {
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
        return null;
      }

      if (!profileData) {
        // Trigger/handle_new_user hasn't created a profile yet — treat as no profile
        setProfile(null);
        return null;
      }

      // 3) Fetch phone + phone_verified from user_private_data (single source of truth)
      let phone = "";
      let phoneVerified = false;
      try {
        const { data } = await supabase
          .from("user_private_data")
          .select("phone, phone_verified")
          .eq("user_id", userId)
          .maybeSingle();
        if (data) {
          phone = data.phone ?? "";
          phoneVerified = data.phone_verified ?? false;
        }
      } catch (e) {
        console.warn("[auth] user_private_data fetch failed:", e);
      }

      // Fallback to secure RPC if RLS blocks direct read
      if (!phone) {
        try {
          const { data: phoneData } = await supabase.rpc("get_my_phone");
          if (phoneData != null) phone = phoneData as string;
        } catch (e) {
          console.warn("[auth] get_my_phone RPC failed:", e);
        }
      }

      const nextProfile = buildProfile(profileData, phone, phoneVerified);
      setProfile(nextProfile);
      return nextProfile;
    })();

    profileLoadRef.current = { userId, promise };

    try {
      return await promise;
    } catch (err: any) {
      console.error("[auth] unexpected error in loadProfile:", err?.message);
      setProfile(null);
      return null;
    } finally {
      if (profileLoadRef.current?.promise === promise) {
        profileLoadRef.current = null;
      }
    }
  };

  function buildProfile(raw: any, phone: string, phoneVerified: boolean): Profile {
    return {
      id: raw.id,
      name: raw.name ?? "",
      phone: phone ?? "",
      gender: (raw.gender as "male" | "female") ?? "male",
      verified: raw.verified ?? false,
      city: raw.city ?? null,
      points: raw.points ?? 0,
      phone_verified: phoneVerified,
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

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      if (event === "INITIAL_SESSION") return; // Already handled above

      // Keep loading=true while we re-fetch profile to avoid premature redirects
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        setLoading(true);
        void loadProfile(newSession.user.id, true).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    profileLoadRef.current = null;
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      return loadProfile(user.id, true);
    }
    return null;
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
