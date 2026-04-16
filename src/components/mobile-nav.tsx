"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/providers";
import { translations } from "@/lib/translations";
import { Home, Book, Video, HelpCircle, Download } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const { lang } = useApp();
  const t = translations[lang].nav;
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // We check if it's already installed
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const navItems = [
    { href: "/", icon: Home, label: t.home, matchExact: true },
    { href: "/doubts", icon: HelpCircle, label: t.doubts },
    { href: "/books", icon: Book, label: t.books },
    { href: "/videos", icon: Video, label: t.videos },
  ];

  return (
    <>
      {/* Install Prompt Overlay for PWA */}
      {showInstallPrompt && (
        <div className="fixed bottom-[100px] left-4 right-4 z-[60] bg-white border border-shubuhat-border-lite p-4 rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex items-center justify-between animate-in slide-in-from-bottom-5 md:hidden">
            <div className="flex flex-col">
                <span className="text-sm font-black text-shubuhat-green">{lang === 'ar' ? 'تثبيت التطبيق 📱' : 'Install App 📱'}</span>
                <span className="text-xs text-shubuhat-text-3 font-bold">{lang === 'ar' ? 'للوصول السريع وبدون إنترنت' : 'For quick & offline access'}</span>
            </div>
            <div className="flex gap-2">
                <button 
                  onClick={() => setShowInstallPrompt(false)}
                  className="px-3 py-2 text-xs font-bold text-shubuhat-text-3 hover:text-shubuhat-text-1"
                >
                    {lang === 'ar' ? 'لاحقاً' : 'Later'}
                </button>
                <button 
                  onClick={handleInstallClick}
                  className="bg-shubuhat-gold text-shubuhat-green px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1 shadow-md active:scale-95 transition-transform"
                >
                    <Download size={14} />
                    {lang === 'ar' ? 'تثبيت' : 'Install'}
                </button>
            </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 bg-shubuhat-green-dark/80 backdrop-blur-xl border border-white/10 rounded-full flex justify-between items-center px-2 py-2 shadow-2xl shadow-shubuhat-green/20">
        {navItems.map((item) => {
          const isActive = item.matchExact 
            ? pathname === item.href 
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all relative ${
                isActive ? 'text-shubuhat-gold' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-shubuhat-gold/10 rounded-full animate-in fade-in" />
              )}
              <item.icon 
                size={isActive ? 22 : 20} 
                className={`transition-all duration-300 z-10 ${isActive ? 'translate-y-[-2px]' : ''}`} 
              />
              <span className={`text-[9px] font-black tracking-widest mt-1 z-10 transition-all ${isActive ? 'opacity-100' : 'opacity-0 translate-y-2'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
