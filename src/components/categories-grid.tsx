"use client";

import { useApp } from "@/components/providers";
import { translations } from "@/lib/translations";
import { Book, Microscope, Scroll, Users, CloudRain, Languages } from "lucide-react";

export function CategoriesGrid() {
  const { lang } = useApp();
  const t = translations[lang].categories;

  const categories = [
    { title: t.islam, count: 850, icon: <Book size={32} /> },
    { title: t.science, count: 420, icon: <Microscope size={32} /> },
    { title: t.history, count: 320, icon: <Scroll size={32} /> },
    { title: t.society, count: 280, icon: <Users size={32} /> },
    { title: t.atheism, count: 390, icon: <CloudRain size={32} /> },
    { title: t.others, count: 180, icon: <Languages size={32} /> },
  ];

  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-shubuhat-green mb-3">{t.title}</h2>
          <p className="text-shubuhat-text-3 font-bold">{t.sub}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <div 
              key={i} 
              className="group bg-white border border-shubuhat-border-lite p-8 rounded-3xl hover:border-shubuhat-gold transition-all hover:translate-y-[-4px] hover:shadow-2xl shadow-sm cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-shubuhat-green/5 rounded-bl-full translate-x-12 translate-y-[-12px] group-hover:scale-150 transition-transform" />
              
              <div className="relative z-10 text-shubuhat-gold mb-6 group-hover:scale-110 transition-transform origin-left">
                {cat.icon}
              </div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-black text-shubuhat-green mb-1 group-hover:text-shubuhat-gold transition-colors">{cat.title}</h3>
                <span className="text-xs font-bold text-shubuhat-text-3 uppercase tracking-wider">{cat.count} {lang === 'ar' ? 'شبهة' : 'Doubts'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
