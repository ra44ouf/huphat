"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

type Language = "ar" | "en";

interface AppContextType {
  lang: Language;
  toggleLang: () => void;
  user: User | null;
  profile: any | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("ar");
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Refs (لا تسبب re-render) ──────────────────────────────
  const authSubRef       = useRef<{ unsubscribe: () => void } | null>(null);
  const inFlightRef      = useRef(false);
  const queuedRef        = useRef(false);
  const lastFetchRef     = useRef(0);
  // 🔑 المفتاح: نحفظ الـ ID الحالي بدل مقارنة الـ object كاملاً
  const currentUserIdRef = useRef<string | null>(null);

  const supabase = createClient();

  // ── Logout ───────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch (e) { console.error(e); }
    currentUserIdRef.current = null;
    setUser(null);
    setProfile(null);
    setLoading(false);
  }, []);

  // ── Core auth fetch ──────────────────────────────────────
  const fetchAuth = useCallback(async (forceProfile = false) => {
    if (inFlightRef.current) { queuedRef.current = true; return; }

    inFlightRef.current = true;
    queuedRef.current   = false;
    lastFetchRef.current = Date.now();

    try {
      const { data: { user: freshUser }, error } = await supabase.auth.getUser();

      if (error && error.message !== "Auth session missing!") {
        console.error("Auth error:", error);
      }

      const newId = freshUser?.id ?? null;

      // ✅ الإصلاح الجوهري: لا تحدّث state إذا نفس المستخدم
      if (newId !== currentUserIdRef.current) {
        currentUserIdRef.current = newId;
        setUser(freshUser);

        if (!freshUser) {
          setProfile(null);
        } else {
          // مستخدم جديد → جلب profile
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", freshUser.id)
            .maybeSingle();
          setProfile(data ?? { full_name: freshUser.user_metadata?.full_name || freshUser.email });
        }
      } else if (freshUser && forceProfile) {
        // نفس المستخدم لكن طُلب تحديث profile صراحةً
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", freshUser.id)
          .maybeSingle();
        if (data) setProfile(data);
      }
    } catch (err) {
      console.error("fetchAuth error:", err);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
      if (queuedRef.current) fetchAuth(forceProfile);
    }
  }, []);

  // ── التهيئة الأولى + Auth subscription ──────────────────
  useEffect(() => {
    setMounted(true);
    fetchAuth();

    if (authSubRef.current) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {

        // ✅ تجاهل TOKEN_REFRESHED تماماً — هو فقط تجديد token، لا يعني تغيير مستخدم
        // الـ supabase client يحدّث الـ token داخلياً بدون تدخلنا
        if (event === "TOKEN_REFRESHED") return;

        const freshUser = session?.user ?? null;
        const newId     = freshUser?.id ?? null;

        // ✅ نفس المستخدم = لا تغيير في state = لا re-render في الصفحات
        if (newId === currentUserIdRef.current) return;

        currentUserIdRef.current = newId;
        setUser(freshUser);
        setLoading(false);

        if (freshUser) {
          try {
            const { data } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", freshUser.id)
              .maybeSingle();
            setProfile(data ?? { full_name: freshUser.user_metadata?.full_name || freshUser.email });
          } catch { /* silent */ }
        } else {
          setProfile(null);
        }
      }
    );

    authSubRef.current = { unsubscribe: () => subscription.unsubscribe() };
    return () => {
      authSubRef.current?.unsubscribe();
      authSubRef.current = null;
    };
  }, []);

  // ── Focus / Visibility refresh ───────────────────────────
  useEffect(() => {
    if (!mounted) return;

    const onVisible = () => {
      if (document.visibilityState === "hidden") return;
      if (Date.now() - lastFetchRef.current < 5 * 60 * 1000) return; // throttle: 5 دقائق
      fetchAuth();
    };

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [mounted]);

  // ── Lang direction ───────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = lang;
    document.documentElement.dir  = lang === "ar" ? "rtl" : "ltr";
  }, [lang, mounted]);

  const toggleLang = () => setLang((p) => (p === "ar" ? "en" : "ar"));

  return (
    <AppContext.Provider value={{ lang, toggleLang, user, profile, loading, refreshAuth: fetchAuth, logout }}>
      {mounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within Providers");
  return ctx;
}
