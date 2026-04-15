"use client";

import { useApp } from "@/components/providers";
import { translations } from "@/lib/translations";
import { Play, Send, MessageCircle, Camera, Mail, ArrowUp } from "lucide-react";

export function Footer() {
  const { lang } = useApp();
  const t = translations[lang].footer;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-shubuhat-green text-white py-20 px-4 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6 pointer-events-none">
              <div className="w-12 h-12 overflow-hidden rounded-xl bg-white shadow-lg">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover scale-[1.3]" />
              </div>
              <span className="text-2xl font-black tracking-tight">SHUBUHAT</span>
            </div>
            <p className="text-white/50 text-base max-w-sm mb-8 font-medium italic">
                {lang === 'ar' 
                    ? '"قُلْ هَاتُوا بُرْهَانَكُمْ إِن كُنتُمْ صَادِقِينَ" - صدق الله العظيم' 
                    : '"Bring your proof, if you should be truthful" - Quran'}
            </p>
            <div className="flex gap-4">
                <SocialIcon icon={<Play size={20} />} />
                <SocialIcon icon={<Send size={20} />} />
                <SocialIcon icon={<MessageCircle size={20} />} />
                <SocialIcon icon={<Camera size={20} />} />
                <SocialIcon icon={<Mail size={20} />} />
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="text-shubuhat-gold font-black uppercase tracking-widest text-[12px] mb-6">{t.about}</h4>
            <ul className="space-y-4 text-white/60 font-bold text-sm">
              <li className="hover:text-white transition-colors cursor-pointer">{t.contact}</li>
              <li className="hover:text-white transition-colors cursor-pointer">{t.privacy}</li>
              <li className="hover:text-white transition-colors cursor-pointer">{t.terms}</li>
            </ul>
          </div>

          <div className="relative">
            <h4 className="text-shubuhat-gold font-black uppercase tracking-widest text-[12px] mb-6">{lang === 'ar' ? 'تواصل معنا' : 'STAY CONNECTED'}</h4>
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10 group focus-within:border-shubuhat-gold transition-all">
                <input 
                    type="email" 
                    placeholder={lang === 'ar' ? 'بريدك الإلكتروني' : 'Email address'}
                    className="bg-transparent flex-1 px-4 py-3 text-sm focus:outline-none placeholder:text-white/30"
                />
                <button className="bg-shubuhat-gold text-shubuhat-green p-3 rounded-full hover:bg-shubuhat-gold-light transition-all shadow-lg active:scale-95">
                    {lang === 'ar' ? <ArrowUp size={20} className="-rotate-90" /> : <ArrowUp size={20} className="rotate-90" />}
                </button>
            </div>
            
            <button 
                onClick={scrollToTop}
                className="mt-8 flex items-center justify-center w-12 h-12 rounded-full border border-white/10 hover:border-shubuhat-gold text-white/40 hover:text-shubuhat-gold transition-all group mx-auto md:mx-0"
            >
                <ArrowUp size={20} className="group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 text-center text-white/30 text-[11px] font-black uppercase tracking-widest">
          {t.rights}
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute left-0 bottom-0 w-full h-1 bg-gradient-to-r from-shubuhat-gold via-shubuhat-gold-muted to-shubuhat-gold opacity-30" />
    </footer>
  );
}

function SocialIcon({ icon }: { icon: React.ReactNode }) {
    return (
        <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-shubuhat-gold hover:text-shubuhat-green transition-all hover:-translate-y-1">
            {icon}
        </button>
    )
}
