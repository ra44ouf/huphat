"use client";

import { useApp } from "@/components/providers";
import { translations } from "@/lib/translations";
import { Award, ShieldCheck, Microscope, UserPlus } from "lucide-react";

export function ScholarsSection() {
  const { lang } = useApp();
  const t = translations[lang].scholars;

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="bg-shubuhat-green rounded-[40px] p-8 md:p-16 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-12 shadow-[0_20px_50px_rgba(15,61,46,0.3)]">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-shubuhat-gold/10 rounded-full translate-x-32 translate-y-[-32px] blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-shubuhat-gold/10 rounded-full translate-x-[-32px] translate-y-32 blur-3xl pointer-events-none" />

          <div className="flex-1 relative z-10 text-center md:text-start">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-shubuhat-gold/20 text-shubuhat-gold mb-6">
                <ShieldCheck size={24} />
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                {t.title}
            </h2>
            <p className="text-white/60 text-lg mb-10 max-w-lg leading-relaxed font-medium">
                {t.sub}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button className="bg-shubuhat-gold hover:bg-shubuhat-gold-light text-shubuhat-green px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
                    <UserPlus size={18} />
                    {t.join}
                </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-4 relative z-10 w-full max-w-md">
            <FeatureCard color="bg-shubuhat-gold/10" text={lang === 'ar' ? 'أكاديميون متخصصون' : 'Specialized Academics'} icon={<Award size={24} />} />
            <FeatureCard color="bg-white/5" text={lang === 'ar' ? 'منهج علمي رصين' : 'Rigorous Methodology'} icon={<Microscope size={24} />} />
            <FeatureCard color="bg-white/5" text={lang === 'ar' ? 'مراجعة دورية' : 'Regular Reviews'} icon={<ShieldCheck size={24} />} />
            <FeatureCard color="bg-shubuhat-gold/10" text={lang === 'ar' ? 'تنوع في التخصصات' : 'Diverse Fields'} icon={<Award size={24} />} />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ text, icon, color }: { text: string; icon: React.ReactNode; color: string }) {
    return (
        <div className={`${color} border border-white/10 p-6 rounded-3xl flex flex-col items-center text-center gap-3 backdrop-blur-sm group hover:border-shubuhat-gold/30 transition-all`}>
            <div className="text-shubuhat-gold group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-white/80">
                {text}
            </span>
        </div>
    )
}
