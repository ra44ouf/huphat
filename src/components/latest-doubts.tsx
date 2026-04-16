"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { translations } from "@/lib/translations";
import { ArrowLeft, ArrowRight, Clock, ChevronLeft, ChevronRight, Loader2, MessageSquareOff } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export function LatestDoubts() {
  const { lang } = useApp();
  const t = translations[lang].latest;
  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLatest() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('doubts')
          .select('*, categories(title_ar, title_en)')
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (error) console.error("Latest doubts error:", error);
        if (data) setDoubts(data);
      } catch (err) {
        console.error("Failed to fetch latest doubts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLatest();
  }, []);

  return (
    <section className="py-24 px-4 bg-shubuhat-green-ghost border-t border-shubuhat-border-lite relative overflow-hidden">
        {/* Subtle Background Mark */}
        <div className="absolute left-[-10%] top-[20%] text-shubuhat-green/3 font-black text-[20vw] pointer-events-none select-none uppercase">
            ANSWERS
        </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-black text-shubuhat-green mb-2">{t.title}</h2>
            <div className="w-12 h-1 bg-shubuhat-gold rounded-full" />
          </div>
          <Link href="/doubts" className="hidden md:flex items-center gap-2 text-shubuhat-green hover:text-shubuhat-gold font-black transition-colors group">
            {t.viewAll}
            {lang === 'ar' ? <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> : <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-shubuhat-gold" size={40} />
          </div>
        ) : doubts.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-shubuhat-border-lite p-16 rounded-[40px] text-center">
            <div className="w-16 h-16 bg-shubuhat-green/5 rounded-full flex items-center justify-center mx-auto mb-4 text-shubuhat-green/20">
              <MessageSquareOff size={32} />
            </div>
            <h3 className="text-xl font-black text-shubuhat-green mb-1">
              {lang === 'ar' ? 'انتظروا أولى الردود قريباً' : 'Official responses coming soon'}
            </h3>
            <p className="text-shubuhat-text-3 font-bold text-sm">
              {lang === 'ar' ? 'نحن نعمل حالياً على تجهيز ردود علمية موثقة.' : 'We are currently preparing documented scientific responses.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {doubts.map((doubt, i) => (
              <div 
                key={doubt.id} 
                className="group bg-white rounded-2xl p-0 shadow-sm hover:shadow-xl transition-all border border-shubuhat-border-lite overflow-hidden flex flex-col"
              >
                <div className="p-8 flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-shubuhat-gold/10 text-shubuhat-gold text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
                      {lang === 'ar' ? doubt.categories?.title_ar : doubt.categories?.title_en}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-black text-shubuhat-green mb-4 leading-snug group-hover:text-shubuhat-gold transition-colors">
                    {lang === 'ar' ? doubt.title_ar : doubt.title_en}
                  </h3>
                  
                  <p className="text-shubuhat-text-3 text-sm leading-relaxed mb-6 line-clamp-3">
                    {lang === 'ar' ? doubt.excerpt_ar : doubt.excerpt_en}
                  </p>
                </div>

                <div className="px-8 py-5 border-t border-shubuhat-border-lite bg-shubuhat-green-ghost/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-shubuhat-text-3 text-[11px] font-bold">
                    <Clock size={14} />
                    {new Date(doubt.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                  </div>
                  <Link href={`/doubts/${doubt.slug}`} className="text-shubuhat-green font-black text-[11px] uppercase tracking-widest flex items-center gap-1 group/btn">
                    {lang === 'ar' ? 'اقرأ الرد' : 'READ ANSWER'}
                    {lang === 'ar' ? <ArrowLeft size={14} className="group-hover/btn:-translate-x-1 transition-transform" /> : <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {doubts.length > 0 && (
          <div className="mt-12 md:hidden text-center">
              <Link href="/doubts" className="inline-block bg-shubuhat-green text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-shubuhat-green-mid transition-all shadow-lg active:scale-95">
                  {t.viewAll}
              </Link>
          </div>
        )}
      </div>
    </section>
  );
}
