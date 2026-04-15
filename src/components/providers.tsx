"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

type Language = "ar" | "en";

interface AppContextType {
  lang: Language;
  toggleLang: () => void;
  user: User | null;
  profile: any | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("ar");
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  const fetchAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Auth fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
                setProfile(data);
            }
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
        }
        setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }
  }, [lang, mounted]);

  const toggleLang = () => setLang((prev) => (prev === "ar" ? "en" : "ar"));

  return (
    <AppContext.Provider value={{ lang, toggleLang, user, profile, loading, refreshAuth: fetchAuth }}>
      {mounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within Providers");
  return context;
}
