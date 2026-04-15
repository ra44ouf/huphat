"use client";

import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { CategoriesGrid } from "@/components/categories-grid";
import { LatestDoubts } from "@/components/latest-doubts";
import { ScholarsSection } from "@/components/scholars-section";
import { Footer } from "@/components/footer";
import { useApp } from "@/components/providers";
import { translations } from "@/lib/translations";

export default function Home() {
  const { lang } = useApp();
  const t = translations[lang].stats;

  return (
    <main className="flex-1">
      <Navbar />
      <Hero />
      
      {/* Stats Section */}
      <div className="bg-white border-b border-shubuhat-border-lite grid grid-cols-3">
        <StatItem number="2,400+" label={t.answers} />
        <StatItem number="18" label={t.scholars} />
        <StatItem number="340K" label={t.readers} border={false} />
      </div>

      <CategoriesGrid />
      <LatestDoubts />
      <ScholarsSection />
      <Footer />
    </main>
  );
}

function StatItem({ number, label, border = true }: { number: string; label: string; border?: boolean }) {
  return (
    <div className={`py-6 text-center ${border ? 'border-l border-shubuhat-border-lite' : ''}`}>
      <span className="block text-2xl md:text-3xl font-black text-shubuhat-green leading-none mb-1">
        {number}
      </span>
      <span className="block text-[10px] md:text-sm font-bold text-shubuhat-text-3 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
