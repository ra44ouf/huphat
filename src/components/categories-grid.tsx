"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { translations } from "@/lib/translations";
import { Book, Microscope, Scroll, Users, CloudRain, Languages, Scale, Brain, User, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const ICON_MAP: Record<string, React.ReactNode> = {
  'atheism-refutation': <CloudRain size={32} />,
  'quran-doubts': <Book size={32} />,
  'sunnah': <Scroll size={32} />,
  'prophetic-biography': <User size={32} />,
  'islamic-legislation': <Scale size={32} />,
  'women-in-islam': <Users size={32} />,
  'contemporary-issues': <Brain size={32} />,
};

const DEFAULT_ICON = <Languages size={32} />;

export function CategoriesGrid() {
  const { lang } = useApp();
  const t = translations[lang].categories;
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('title_ar', { ascending: true });
        
        if (error) console.error("Categories fetch error:", error);
        if (data) setCategories(data);
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-shubuhat-green mb-3">{t.title}</h2>
          <p className="text-shubuhat-text-3 font-bold">{t.sub}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-shubuhat-gold" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div 
                key={cat.id} 
                className="group bg-white border border-shubuhat-border-lite p-8 rounded-3xl hover:border-shubuhat-gold transition-all hover:translate-y-[-4px] hover:shadow-2xl shadow-sm cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-shubuhat-green/5 rounded-bl-full translate-x-12 translate-y-[-12px] group-hover:scale-150 transition-transform" />
                
                <div className="relative z-10 text-shubuhat-gold mb-6 group-hover:scale-110 transition-transform origin-left">
                  {ICON_MAP[cat.slug] || DEFAULT_ICON}
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-shubuhat-green mb-1 group-hover:text-shubuhat-gold transition-colors">
                    {lang === 'ar' ? cat.title_ar : cat.title_en}
                  </h3>
                  <p className="text-[10px] text-shubuhat-text-3 font-bold mb-2 line-clamp-1 opacity-70">
                    {lang === 'ar' ? cat.description_ar : cat.description_en}
                  </p>
                  <span className="text-xs font-bold text-shubuhat-text-3 uppercase tracking-wider">
                    {lang === 'ar' ? 'استكشف التبويب' : 'Explore Category'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
