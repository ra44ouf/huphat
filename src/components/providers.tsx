"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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
  const authSubRef = useRef<{ id: string; unsubscribe: () => void } | null>(null);
  const authFetchInFlightRef = useRef(false);
  const authFetchQueuedRef = useRef(false);
  const authFetchLastAtRef = useRef(0);

  
  const supabase = createClient();

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setLoading(false);
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const fetchAuth = async (forceProfileFetch = false) => {
    if (authFetchInFlightRef.current) {
      authFetchQueuedRef.current = true;
      return;
    }

    try {
      authFetchInFlightRef.current = true;
      authFetchQueuedRef.current = false;
      authFetchLastAtRef.current = Date.now();

      const { data: { user: currentUser }, error: sessionError } = await supabase.auth.getUser();
      
      if (sessionError && sessionError.message !== 'Auth session missing!') {
        console.error("Auth getUser error:", sessionError);
      }
      setUser(currentUser);

      if (currentUser && (forceProfileFetch || !profile)) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();
          
          if (error) {
             console.error("Profile fetch error:", error);
             setProfile({ full_name: currentUser.user_metadata?.full_name || currentUser.email });
          } else {
             setProfile(data ?? { full_name: currentUser.user_metadata?.full_name || currentUser.email });
          }
        } catch (err) {
          console.error("Profile fetch catastrophic error:", err);
          setProfile({ full_name: currentUser.user_metadata?.full_name || currentUser.email });
        }
      } else if (!currentUser) {
        setProfile(null);
      }
    } catch (err) {
      console.error("Auth fetch catastrophic error:", err);
    } finally {
      setLoading(false);
      authFetchInFlightRef.current = false;
      if (authFetchQueuedRef.current) {
        fetchAuth(forceProfileFetch);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchAuth();

    if (authSubRef.current) {
      return () => {};
    }

    const subId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        console.log("Auth state change event:", event, "User ID:", session?.user?.id);
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);
        
        if (currentUser) {
            try {
              const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
              if (!error && data) {
                  setProfile(data);
              } else {
                  setProfile({ full_name: currentUser.user_metadata?.full_name || currentUser.email });
              }
            } catch (err) {
              console.error("Profile fetch error:", err);
              setProfile({ full_name: currentUser.user_metadata?.full_name || currentUser.email });
            }
        } else {
            setProfile(null);
        }
    });

    authSubRef.current = { id: subId, unsubscribe: () => subscription.unsubscribe() };

    return () => {
      authSubRef.current?.unsubscribe();
      authSubRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const onFocus = () => {
      // visibilitychange يطلق على hide وshow — نريد فقط لما يرجع التاب visible
      if (document.visibilityState === "hidden") return;
      if (Date.now() - authFetchLastAtRef.current < 1500) return;
      fetchAuth();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [mounted]);



  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }
  }, [lang, mounted]);

  const toggleLang = () => setLang((prev) => (prev === "ar" ? "en" : "ar"));

  return (
    <AppContext.Provider value={{ lang, toggleLang, user, profile, loading, refreshAuth: fetchAuth, logout }}>
      {mounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within Providers");
  return context;
}
