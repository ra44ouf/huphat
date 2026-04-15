"use client";

import Link from "next/link";
import { useApp } from "@/components/providers";
import { translations } from "@/lib/translations";
import { ArrowLeft, ArrowRight, MessageCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";

export function LatestDoubts() {
  const { lang } = useApp();
  const t = translations[lang].latest;

  const doubts = [
    {
      title: lang === 'ar' ? 'هل القرآن مقتبس من الكتب السابقة؟' : 'Is the Quran quoted from previous books?',
      slug: 'quran-quoted',
      category: lang === 'ar' ? 'شبهات القرآن' : 'Quranic Doubts',
      excerpt: lang === 'ar' ? 'الرد على دعوى اقتباس القرآن من التوراة والإنجيل، وتحليل الاختلافات الجوهرية...' : 'Responding to the claim that the Quran was quoted from the Torah and the Bible...',
      date: '2024-04-12',
    },
    {
      title: lang === 'ar' ? 'شبهة زواج النبي صلى الله عليه وسلم من عائشة' : 'Doubt about the Prophet\'s marriage to Aisha',
      slug: 'biography',
      category: lang === 'ar' ? 'السيرة النبوية' : 'Prophetic Biography',
      excerpt: lang === 'ar' ? 'تحليل تاريخي وعلمي للسياق الاجتماعي في ذلك الوقت والرد على الانتقادات المعاصرة...' : 'Historical and scientific analysis of the social context at that time...',
      date: '2024-04-10',
    },
    {
      title: lang === 'ar' ? 'هل يتعارض العلم مع وجود الخالق؟' : 'Does science conflict with the existence of a Creator?',
      slug: 'science-creator',
      category: lang === 'ar' ? 'الإلحاد' : 'Atheism',
      excerpt: lang === 'ar' ? 'مناقشة الأسس الفلسفية للعلم الحديث وكيف يشير التصميم في الكون إلى الخالق...' : 'Discussing the philosophical foundations of modern science and cosmic design...',
      date: '2024-04-08',
    },
  ];

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {doubts.map((doubt, i) => (
            <div 
              key={i} 
              className="group bg-white rounded-2xl p-0 shadow-sm hover:shadow-xl transition-all border border-shubuhat-border-lite overflow-hidden flex flex-col"
            >
              <div className="p-8 flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-shubuhat-gold/10 text-shubuhat-gold text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
                    {doubt.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-black text-shubuhat-green mb-4 leading-snug group-hover:text-shubuhat-gold transition-colors">
                  {doubt.title}
                </h3>
                
                <p className="text-shubuhat-text-3 text-sm leading-relaxed mb-6">
                  {doubt.excerpt}
                </p>
              </div>

              <div className="px-8 py-5 border-t border-shubuhat-border-lite bg-shubuhat-green-ghost/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-shubuhat-text-3 text-[11px] font-bold">
                  <Clock size={14} />
                  {doubt.date}
                </div>
                <Link href={`/doubts/${doubt.slug}`} className="text-shubuhat-green font-black text-[11px] uppercase tracking-widest flex items-center gap-1 group/btn">
                  {lang === 'ar' ? 'اقرأ الرد' : 'READ ANSWER'}
                  {lang === 'ar' ? <ArrowLeft size={14} className="group-hover/btn:-translate-x-1 transition-transform" /> : <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 md:hidden text-center">
            <button className="bg-shubuhat-green text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-shubuhat-green-mid transition-all shadow-lg active:scale-95">
                {t.viewAll}
            </button>
        </div>
      </div>
    </section>
  );
}
