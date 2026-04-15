"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useApp } from "@/components/providers";
import { ArrowLeft, Clock, User, CheckCircle2, Share2, Printer } from "lucide-react";
import Link from "next/link";

export default function DoubtDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { lang } = useApp();
  const { slug } = use(params);
  const [doubt, setDoubt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchDoubt() {
      setLoading(true);
      const { data } = await supabase
        .from('doubts')
        .select(`
          *,
          categories (title_ar, title_en),
          profiles (display_name_ar, display_name_en, is_verified, bio, avatar_url)
        `)
        .eq('slug', slug)
        .single();

      if (data) setDoubt(data);
      setLoading(false);
    }
    fetchDoubt();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-shubuhat-gold border-t-transparent rounded-full animate-spin" />
  </div>;

  if (!doubt) return <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
    <h1 className="text-4xl font-black text-shubuhat-green mb-4">404</h1>
    <p className="text-shubuhat-text-3 font-bold mb-8">عذراً، لم نتمكن من العثور على هذا الرد.</p>
    <Link href="/doubts" className="bg-shubuhat-green text-white px-8 py-3 rounded-full font-black">العودة للشبهات</Link>
  </div>;

  return (
    <main className="min-h-screen bg-[#fcfbf9] flex flex-col">
      <Navbar />

      <article className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs & Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Link href="/doubts" className="text-xs font-black text-shubuhat-text-3 hover:text-shubuhat-green uppercase tracking-widest flex items-center gap-1 transition-colors">
              <ArrowLeft size={14} />
              {lang === 'ar' ? 'العودة' : 'Back'}
            </Link>
            <span className="w-1 h-1 rounded-full bg-shubuhat-border" />
            <span className="bg-shubuhat-gold/10 text-shubuhat-gold text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
                {lang === 'ar' ? doubt.categories?.title_ar : doubt.categories?.title_en}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-black text-shubuhat-green mb-8 leading-tight">
            {lang === 'ar' ? doubt.title_ar : doubt.title_en}
          </h1>

          {/* Author Card */}
          <div className="flex items-center justify-between pb-8 mb-12 border-b border-shubuhat-border-lite">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-shubuhat-gold flex items-center justify-center text-shubuhat-green font-black text-xl shadow-lg">
                    {doubt.profiles?.avatar_url ? <img src={doubt.profiles.avatar_url} className="w-full h-full object-cover rounded-2xl" /> : (doubt.profiles?.display_name_ar?.[0] || 'A')}
                </div>
                <div>
                    <div className="flex items-center gap-1.5 text-lg font-black text-shubuhat-green">
                        {lang === 'ar' ? doubt.profiles?.display_name_ar : doubt.profiles?.display_name_en}
                        {doubt.profiles?.is_verified && <CheckCircle2 size={18} className="text-blue-500 fill-blue-500/10" />}
                    </div>
                    <div className="text-sm font-bold text-shubuhat-text-3">
                        {new Date(doubt.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <button className="p-3 rounded-xl bg-white border border-shubuhat-border-lite text-shubuhat-text-3 hover:text-shubuhat-gold transition-all shadow-sm">
                    <Share2 size={20} />
                </button>
                <button className="p-3 rounded-xl bg-white border border-shubuhat-border-lite text-shubuhat-text-3 hover:text-shubuhat-gold transition-all shadow-sm">
                    <Printer size={20} />
                </button>
            </div>
          </div>

          {/* Video Attachment if exists */}
          {doubt.video_url && (
            <div className="mb-12 aspect-video rounded-[32px] overflow-hidden shadow-2xl border-4 border-white">
                <iframe 
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${doubt.video_url.split('v=')[1] || doubt.video_url.split('/').pop()}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none prose-headings:font-black prose-p:font-medium prose-p:text-shubuhat-text-2 prose-p:leading-relaxed">
            <div 
                dangerouslySetInnerHTML={{ __html: lang === 'ar' ? doubt.content_ar : doubt.content_en }} 
                className="whitespace-pre-wrap leading-relaxed text-lg"
            />
          </div>

          {/* Footer Info */}
          <div className="mt-20 p-8 rounded-[40px] bg-shubuhat-green text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-shubuhat-gold/10 rounded-full blur-3xl" />
             <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 rounded-3xl bg-shubuhat-gold/20 flex items-center justify-center text-shubuhat-gold">
                    <User size={40} />
                </div>
                <div className="text-center md:text-start flex-1">
                    <h4 className="text-xl font-black mb-2">{lang === 'ar' ? 'حول الباحث' : 'About the Researcher'}</h4>
                    <p className="text-white/60 font-medium italic mb-4">{doubt.profiles?.bio || (lang === 'ar' ? 'متخصص في الرد على الشبهات والبحث العلمي.' : 'Specialist in refuting doubts and scientific research.')}</p>
                </div>
                <Link href="/doubts" className="bg-shubuhat-gold text-shubuhat-green px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                    {lang === 'ar' ? 'تصفح المزيد' : 'Explore More'}
                </Link>
             </div>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  );
}
