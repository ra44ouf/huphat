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
import { motion } from "framer-motion";

export default function Home() {
  const { lang } = useApp();
  const t = translations[lang].stats;
  const [stats, setStats] = useState({ answers: 0, scholars: 0 });
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
          });
        } else {
            console.error("Error fetching stats:", doubtsError || scholarsError);
        }
      } catch (err) {
        console.error("Failed to load statistics", err);
      }
    }
    fetchStats();
  }, []);

  return (
    <main className="flex-1">
      <Navbar />
      <Hero />
      
      {/* Stats Section */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-shubuhat-border-lite grid grid-cols-2">
        <StatItem number={stats.answers > 0 ? `+${stats.answers.toLocaleString()}` : "0"} label={t.answers} delay={0} />
        <StatItem number={stats.scholars > 0 ? stats.scholars.toLocaleString() : "0"} label={t.scholars} border={false} delay={0.1} />
      </div>

      <CategoriesGrid />
      <LatestDoubts />
      <ScholarsSection />
      <Footer />
    </main>
  );
}

function StatItem({ number, label, border = true, delay = 0 }: { number: string; label: string; border?: boolean; delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={`py-8 text-center ${border ? 'border-l border-shubuhat-border-lite' : ''}`}
    >
      <span className="block text-3xl md:text-4xl font-black text-shubuhat-green leading-none mb-2">
        {number}
      </span>
      <span className="block text-[11px] md:text-sm font-bold text-shubuhat-text-3 uppercase tracking-wider">
        {label}
      </span>
    </motion.div>
  );
}
