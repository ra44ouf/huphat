"use client";

import { useState } from "react";
import { useApp } from "@/components/providers";
import { translations } from "@/lib/translations";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function Hero() {
  const { lang } = useApp();
  const t = translations[lang].hero;
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/doubts?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="relative bg-shubuhat-green text-white pt-20 pb-24 px-4 overflow-hidden text-center">
      {/* Background Pattern Placeholder */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg fill="currentColor" viewBox="0 0 100 100" className="w-full h-full">
           <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
             <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
           </pattern>
           <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-shubuhat-gold/10 border border-shubuhat-gold/20 text-shubuhat-gold text-[11px] font-bold uppercase tracking-[2px] mb-6 shadow-glow">
          <div className="relative w-4 h-4 rounded-full overflow-hidden">
             <Image src="/logo.jpg" alt="Logo" fill className="object-cover scale-[1.6]" />
          </div>
          {t.tag}
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
          {t.title} <br />
          <span className="text-shubuhat-gold">{t.titleAccent}</span>
        </h1>
        
        <p className="text-white/60 text-base md:text-lg mb-10 max-w-xl mx-auto font-medium">
          {t.sub}
        </p>

        <form onSubmit={handleSearch} className="max-w-xl mx-auto flex items-center bg-white rounded-full p-1 shadow-2xl overflow-hidden group">
          <div className="flex-[0_0_auto] px-5 text-shubuhat-text-3">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 bg-transparent border-none py-4 text-shubuhat-text-1 focus:outline-none font-medium placeholder:text-shubuhat-text-3"
          />
          <button type="submit" className="bg-shubuhat-green hover:bg-shubuhat-green-mid text-white px-8 py-3.5 rounded-full text-sm font-bold transition-all shadow-lg active:scale-95">
            {t.search}
          </button>
        </form>
      </div>
    </section>
  );
}
