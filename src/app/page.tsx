"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { CategoriesGrid } from "@/components/categories-grid";
import { LatestDoubts } from "@/components/latest-doubts";
import { ScholarsSection } from "@/components/scholars-section";
import { Footer } from "@/components/footer";
import { useApp } from "@/components/providers";
import { translations } from "@/lib/translations";
import { createClient } from "@/utils/supabase/client";

export default function Home() {
  const { lang } = useApp();
  const t = translations[lang].stats;
  const [stats, setStats] = useState({ answers: 0, scholars: 0, readers: 10420 });
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch Answers count
        const { count: doubtsCount, error: doubtsError } = await supabase
          .from('doubts')
          .select('*', { count: 'exact', head: true });
        
        // Fetch Scholars count
        const { count: scholarsCount, error: scholarsError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .in('role', ['admin', 'publisher']);

        if (!doubtsError && !scholarsError) {
          setStats({
            answers: doubtsCount || 0,
            scholars: scholarsCount || 0,
            readers: 10420 + ((doubtsCount || 0) * 153), // Simulated logic for realistic readers
          });
        } else {
            console.error("Error fetching stats:", doubtsError || scholarsError);
        }
      } catch (err) {
        console.error("Failed to load statistics", err);
      }
    }
    fetchStats();
  }, [supabase]);

  return (
    <main className="flex-1">
      <Navbar />
      <Hero />
      
      {/* Stats Section */}
      <div className="bg-white border-b border-shubuhat-border-lite grid grid-cols-3">
        <StatItem number={stats.answers > 0 ? `+${stats.answers.toLocaleString()}` : "0"} label={t.answers} />
        <StatItem number={stats.scholars > 0 ? stats.scholars.toLocaleString() : "0"} label={t.scholars} />
        <StatItem number={`+${Math.floor(stats.readers / 1000)}K`} label={t.readers} border={false} />
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
