"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useApp } from "@/components/providers";
import { Download, Search, Book as BookIcon } from "lucide-react";
import Image from "next/image";

export default function BooksPage() {
  const { lang } = useApp();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function fetchBooks() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('books')
          .select(`
            *,
            profiles (display_name_ar, display_name_en, is_verified)
          `)
          .order('created_at', { ascending: false });
        
        if (data) setBooks(data);
        if (error) console.error("Books error:", error);
      } catch(err) {
        console.error("Failed to load books:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <section className="bg-shubuhat-green py-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="text-[20vw] font-black absolute -top-10 -left-10 text-white">BOOKS</div>
        </div>
        <div className="max-w-6xl mx-auto text-center text-white relative z-10">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6">
                {lang === 'ar' ? 'المكتبة العلمية' : 'Scientific Library'}
            </h1>
            <p className="max-w-2xl mx-auto text-white/70 font-bold text-lg mb-10">
                {lang === 'ar' 
                    ? 'اكتشف مجموعة مختارة من الكتب العلمية والبحوث المتخصصة في الرد على المطاعن والشبهات.' 
                    : 'Discover a selection of scientific books and specialized research in refuting claims and doubts.'}
            </p>
            <div className="max-w-xl mx-auto flex items-center bg-white rounded-full p-1 shadow-2xl overflow-hidden group">
                <div className="flex-[0_0_auto] px-5 text-shubuhat-text-3">
                    <Search size={20} />
                </div>
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'ar' ? 'بحث في الكتب...' : 'Search books...'}
                    className="flex-1 bg-transparent border-none py-3 text-shubuhat-text-1 focus:outline-none font-medium placeholder:text-shubuhat-text-3"
                />
            </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-20">
        {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[1,2,3,4].map(i => <div key={i} className="aspect-[3/4] bg-shubuhat-green-ghost rounded-[40px] animate-pulse" />)}
            </div>
        ) : books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-shubuhat-green-ghost rounded-full flex items-center justify-center mb-6 text-shubuhat-green/20">
                    <BookIcon size={48} />
                </div>
                <h3 className="text-2xl font-black text-shubuhat-green/40 mb-2">
                    {lang === 'ar' ? 'المكتبة فارغة حالياً' : 'Library is empty'}
                </h3>
                <p className="text-shubuhat-text-3 font-bold">
                    {lang === 'ar' ? 'انتظرونا، سيتم إضافة كتب قيمة قريباً' : 'Valuable books will be added soon'}
                </p>
            </div>
        ) : (() => {
            const filtered = books.filter(b => (b.title_ar?.includes(searchQuery) || b.title_en?.toLowerCase().includes(searchQuery.toLowerCase())));
            if (filtered.length === 0) {
                return (
                    <div className="py-20 text-center">
                        <h3 className="text-xl font-black text-shubuhat-text-3">
                            {lang === 'ar' ? 'لم نجد كتباً تطابق بحثك' : 'No books found for your search'}
                        </h3>
                    </div>
                );
            }
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {filtered.map((book) => (
                        <div key={book.id} className="group flex flex-col">
                            <div className="relative aspect-[3/4] rounded-[40px] overflow-hidden shadow-xl border border-shubuhat-border-lite mb-6 group-hover:shadow-2xl transition-all duration-500">
                                <Image src={book.cover_url || '/logo.jpg'} fill className="object-cover group-hover:scale-110 transition-transform duration-700" alt={book.title_ar} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                                <div className="absolute inset-0 bg-gradient-to-t from-shubuhat-green via-transparent to-transparent opacity-60" />
                                <div className="absolute bottom-6 left-6 right-6">
                                    <a 
                                        href={book.download_url} 
                                        target="_blank"
                                        className="w-full bg-shubuhat-gold text-shubuhat-green py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-white transition-all shadow-lg active:scale-95"
                                    >
                                        <Download size={18} />
                                        {lang === 'ar' ? 'تحميل الكتاب' : 'Download'}
                                    </a>
                                </div>
                            </div>
                            <div className="px-2">
                                <div className="text-[10px] font-black text-shubuhat-gold uppercase tracking-[0.2em] mb-2">
                                    {lang === 'ar' ? 'بواسطة: ' : 'By: '}
                                    {lang === 'ar' ? book.book_author_ar : book.book_author_en}
                                </div>
                                <h3 className="text-xl font-black text-shubuhat-green mb-2 group-hover:text-shubuhat-gold transition-colors leading-tight">
                                    {lang === 'ar' ? book.title_ar : book.title_en}
                                </h3>
                                <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-shubuhat-text-3">
                                    <div className="w-6 h-6 rounded-full bg-shubuhat-green-ghost flex items-center justify-center text-shubuhat-green font-black text-[10px]">
                                        {book.profiles?.display_name_ar?.[0] || 'A'}
                                    </div>
                                    <span>{lang === 'ar' ? book.profiles?.display_name_ar : book.profiles?.display_name_en}</span>
                                    {book.profiles?.is_verified && <span className="text-blue-500">✔</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        })()}
      </section>

      <Footer />
    </main>
  );
}
