"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { translations } from "@/lib/translations";
import { Search, LogIn, Menu, Globe, User, LayoutDashboard, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { lang, toggleLang, user, profile, loading } = useApp();
  const t = translations[lang].nav;
  const supabase = createClient();
  const router = useRouter();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'publisher';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 bg-shubuhat-green text-white h-[72px] px-6 flex items-center shadow-xl border-b border-white/5">
      <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity">
        <div className="relative w-12 h-12 overflow-hidden rounded-xl shadow-lg border border-white/10 bg-white">
          <img 
            src="/logo.jpg" 
            alt="Shubuhat Logo" 
            className="w-full h-full object-cover scale-[1.3] transform-gpu transition-transform group-hover:scale-[1.4]"
          />
        </div>
        <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter uppercase leading-none">SHUBUHAT</span>
            <span className="text-[9px] font-bold text-shubuhat-gold tracking-[0.2em] uppercase mt-1 opacity-80">إلى النور باليقين</span>
        </div>
      </Link>

      <div className="hidden md:flex flex-1 justify-center gap-1 mx-8 uppercase text-[12px] font-extrabold tracking-widest">
        <NavLink href="/">{t.home}</NavLink>
        <NavLink href="/doubts">{t.doubts}</NavLink>
        <NavLink href="/books">{t.books}</NavLink>
        <NavLink href="/videos">{t.videos}</NavLink>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleLang}
          className="p-2.5 hover:bg-white/10 rounded-xl transition-all flex items-center gap-1.5 text-[11px] font-black border border-white/10"
        >
          <Globe size={16} />
          {lang === 'ar' ? 'EN' : 'AR'}
        </button>
        
        {loading ? (
          <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
        ) : user ? (
          <div className="flex items-center gap-2 group relative">
              <Link 
                  href={isAdmin ? "/dashboard" : "/profile"} 
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-1.5 pr-4 rounded-full transition-all border border-white/10 group shadow-inner"
              >
                  <span className="text-[12px] font-black hidden lg:inline uppercase tracking-tight">
                      {lang === 'ar' 
                        ? (isAdmin ? 'لوحة التحكم' : 'حسابي') 
                        : (isAdmin ? 'Dashboard' : 'My Account')}
                  </span>
                  <div className="w-8 h-8 bg-shubuhat-gold rounded-full flex items-center justify-center text-shubuhat-green shadow-md group-hover:scale-105 transition-transform">
                      <User size={18} fill="currentColor" strokeWidth={3} />
                  </div>
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2.5 text-red-300 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all"
                title={lang === 'ar' ? 'خروج' : 'Logout'}
              >
                <LogOut size={18} />
              </button>
          </div>
        ) : (
          <Link href="/login" className="flex items-center gap-2 bg-shubuhat-gold text-shubuhat-green px-6 py-2.5 rounded-full text-[13px] font-black hover:bg-shubuhat-gold-light transition-all shadow-xl active:scale-95 uppercase">
            <LogIn size={16} />
            {t.signIn}
          </Link>
        )}
        
        <button className="md:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-all">
          <Menu size={24} />
        </button>
      </div>
    </nav>
  );
}

function NavLink({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link href={href} className="px-5 py-2.5 rounded-xl transition-all text-white/60 hover:text-white hover:bg-white/10 font-bold">
      {children}
    </Link>
  );
}
