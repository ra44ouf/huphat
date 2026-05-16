"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/providers";
import { translations } from "@/lib/translations";
import { Home, Book, Video, HelpCircle, Download, User, Radio } from "lucide-react";
import { motion } from "framer-motion";

export function MobileNav() {
  const pathname = usePathname();
  const { lang, user } = useApp();
  const t = translations[lang].nav;
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
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

  const getNavItems = () => [
    { href: "/", icon: Home, label: t.home, matchExact: true },
    { href: "/doubts", icon: HelpCircle, label: t.doubts },
    { href: "/books", icon: Book, label: t.books },
    { href: "/videos", icon: Video, label: t.videos },
    { href: "/live", icon: Radio, label: t.live, isLive: true },
  ];

  return (
    <>
      {/* Install Prompt Overlay for PWA */}
      {showInstallPrompt && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-[100px] left-4 right-4 z-[60] bg-white/90 backdrop-blur-xl border border-shubuhat-border-lite p-4 rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex items-center justify-between md:hidden"
        >
            <div className="flex flex-col">
                <span className="text-sm font-black text-shubuhat-green">
                  {lang === 'ar' ? 'تثبيت التطبيق 📱' : 'Install App 📱'}
                </span>
                <span className="text-xs text-shubuhat-text-3 font-bold">
                  {lang === 'ar' ? 'للوصول السريع وبدون إنترنت' : 'For quick & offline access'}
                </span>
            </div>
            <div className="flex gap-2">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowInstallPrompt(false)}
                  className="px-3 py-2 text-xs font-bold text-shubuhat-text-3 hover:text-shubuhat-text-1"
                >
                    {lang === 'ar' ? 'لاحقاً' : 'Later'}
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={handleInstallClick}
                  className="bg-shubuhat-gold text-shubuhat-green px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1 shadow-md"
                >
                    <Download size={14} />
                    {lang === 'ar' ? 'تثبيت' : 'Install'}
                </motion.button>
            </div>
        </motion.div>
      )}

      {/* Bottom Navigation Bar - iOS Style */}
      <nav className="md:hidden fixed bottom-5 left-5 right-5 z-50 bg-shubuhat-green-dark/70 backdrop-blur-2xl backdrop-saturate-200 border border-white/10 rounded-[28px] flex justify-between items-center px-2 py-2 shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
        {getNavItems().map((item) => {
          const isActive = item.matchExact 
            ? pathname === item.href 
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-16 h-14 rounded-[22px] transition-all relative"
            >
              {isActive && (
                <motion.div 
                  layoutId="mobile-nav-indicator"
                  className={`absolute inset-0 rounded-[22px] ${item.isLive ? 'bg-red-500/20' : 'bg-shubuhat-gold/15'}`}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                animate={isActive ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="z-10 relative"
              >
                {item.isLive && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2 z-20">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
                <item.icon 
                  size={isActive ? 22 : 20} 
                  className={`transition-colors duration-300 ${
                    isActive 
                      ? item.isLive ? 'text-red-400' : 'text-shubuhat-gold' 
                      : item.isLive ? 'text-red-400/60' : 'text-white/40'
                  }`}
                />
              </motion.div>
              <motion.span 
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className={`text-[9px] font-black tracking-widest mt-1 z-10 ${
                  isActive 
                    ? item.isLive ? 'text-red-400' : 'text-shubuhat-gold' 
                    : item.isLive ? 'text-red-400/60' : 'text-white/40'
                }`}
              >
                {item.label}
              </motion.span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
