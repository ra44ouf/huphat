"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useApp } from "@/components/providers";
import { translations } from "@/lib/translations";
import Link from "next/link";
import { Clock, ArrowLeft, ArrowRight, Search, Filter } from "lucide-react";

export default function DoubtsPage() {
  const { lang } = useApp();
  const [doubts, setDoubts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const supabase = createClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      setSearchInput(q);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch Categories
        const { data: catData, error: catError } = await supabase.from('categories').select('*');
        if (catData) setCategories(catData);
        if (catError) console.error("Categories error:", catError);

        // Fetch Doubts
        let query = supabase.from('doubts').select(`
          *,
          categories (
            title_ar,
            title_en
          ),
          profiles (
            display_name_ar,
            display_name_en,
            is_verified
          )
        `);

        if (selectedCategory) {
          query = query.eq('category_id', selectedCategory);
        }

        if (searchQuery) {
          query = query.or(`title_ar.ilike.%${searchQuery}%,title_en.ilike.%${searchQuery}%,excerpt_ar.ilike.%${searchQuery}%`);
        }

        const { data: doubtData, error: doubtError } = await query.order('created_at', { ascending: false });
        if (doubtData) setDoubts(doubtData);
        if (doubtError) console.error("Doubts error:", doubtError);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data", err);
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedCategory, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <section className="bg-shubuhat-green py-16 px-4">
        <div className="max-w-6xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-black mb-6">
                {lang === 'ar' ? 'جميع الشبهات والردود' : 'All Doubts & Refutations'}
            </h1>
            <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex items-center bg-white rounded-full p-1 shadow-2xl overflow-hidden group">
                <div className="flex-[0_0_auto] px-5 text-shubuhat-text-3">
                    <Search size={20} />
                </div>
                <input 
                    type="text" 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={translations[lang].hero.placeholder}
                    className="flex-1 bg-transparent border-none py-3 text-shubuhat-text-1 focus:outline-none font-medium placeholder:text-shubuhat-text-3"
                />
            </form>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-3xl border border-shubuhat-border-lite shadow-sm sticky top-24">
                <div className="flex items-center gap-2 mb-6 text-shubuhat-green font-black uppercase tracking-widest text-xs">
                    <Filter size={16} />
                    {lang === 'ar' ? 'التصنيفات' : 'Categories'}
                </div>
                <div className="space-y-2">
                    <button 
                        onClick={() => setSelectedCategory(null)}
                        className={`w-full text-start px-4 py-2 rounded-xl text-sm font-bold transition-all ${!selectedCategory ? 'bg-shubuhat-gold text-shubuhat-green shadow-md' : 'text-shubuhat-text-3 hover:bg-shubuhat-green-ghost'}`}
                    >
                        {lang === 'ar' ? 'كل الأقسام' : 'All Categories'}
                    </button>
                    {categories.map((cat) => (
                        <button 
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`w-full text-start px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat.id ? 'bg-shubuhat-gold text-shubuhat-green shadow-md' : 'text-shubuhat-text-3 hover:bg-shubuhat-green-ghost'}`}
                        >
                            {lang === 'ar' ? cat.title_ar : cat.title_en}
                        </button>
                    ))}
                </div>
            </div>
        </aside>

        {/* Content Grid */}
        <div className="flex-1">
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1,2,3,4].map(i => <div key={i} className="bg-white h-64 rounded-3xl animate-pulse border border-shubuhat-border-lite" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {doubts.length === 0 ? (
                        <div className="col-span-2 text-center py-20 bg-white rounded-3xl border border-shubuhat-border-lite">
                            <p className="font-bold text-shubuhat-text-3">
                                {lang === 'ar' ? 'لا توجد نتائج مطابقة للبحث' : 'No matching results found.'}
                            </p>
                        </div>
                    ) : doubts.map((doubt) => (
                        <Link 
                            href={`/doubts/${doubt.slug}`}
                            key={doubt.id} 
                            className="bg-white border border-shubuhat-border-lite p-8 rounded-3xl hover:border-shubuhat-gold transition-all hover:shadow-xl shadow-sm group flex flex-col"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-shubuhat-gold/10 text-shubuhat-gold text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
                                    {lang === 'ar' ? doubt.categories?.title_ar : doubt.categories?.title_en}
                                </span>
                                <div className="ml-auto flex items-center gap-1 text-[10px] font-bold text-shubuhat-text-3">
                                    <Clock size={12} />
                                    {new Date(doubt.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-black text-shubuhat-green mb-4 leading-tight group-hover:text-shubuhat-gold transition-colors">
                                {lang === 'ar' ? doubt.title_ar : doubt.title_en}
                            </h3>
                            
                            <p className="text-shubuhat-text-3 text-sm leading-relaxed mb-6 line-clamp-2 flex-1">
                                {lang === 'ar' ? doubt.excerpt_ar : doubt.excerpt_en}
                            </p>

                            <div className="flex items-center gap-2 pt-4 border-t border-shubuhat-border-lite mt-auto">
                                <div className="w-8 h-8 rounded-full bg-shubuhat-green-ghost flex items-center justify-center text-shubuhat-green font-black text-xs">
                                    {doubt.profiles?.display_name_ar?.[0] || 'A'}
                                </div>
                                <div className="text-[11px] font-black text-shubuhat-green flex items-center gap-1">
                                    {lang === 'ar' ? doubt.profiles?.display_name_ar : doubt.profiles?.display_name_en}
                                    {doubt.profiles?.is_verified && <span className="text-blue-500">✔</span>}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
