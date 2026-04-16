"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useApp } from "@/components/providers";
import { Play, Search, Video as VideoIcon, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function VideosPage() {
  const { lang } = useApp();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function fetchVideos() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('videos')
          .select(`
            *,
            profiles (display_name_ar, display_name_en, is_verified)
          `)
          .order('created_at', { ascending: false });
        
        if (data) setVideos(data);
        if (error) console.error("Videos error:", error);
      } catch(err) {
        console.error("Failed to load videos:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col">
      <Navbar />

      <section className="py-20 px-4 border-b border-white/5 relative bg-gradient-to-b from-shubuhat-green/20 to-transparent">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-shubuhat-gold">
                {lang === 'ar' ? 'الإنتاج المرئي' : 'Visual Content'}
            </h1>
            <p className="max-w-2xl mx-auto text-white/50 font-medium text-lg mb-10 leading-relaxed">
                {lang === 'ar' 
                    ? 'ردود علمية موثقة وسهلة الاستيعاب عبر سلسلة من الفيديوهات المتخصصة من قبل نخبة من الباحثين.' 
                    : 'Documented and easy-to-understand scientific refutations through a series of specialized videos by top researchers.'}
            </p>
            <div className="max-w-md w-full relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-shubuhat-gold transition-colors" size={20} />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'ar' ? 'ابحث عن فيديو...' : 'Search for a video...'}
                    className="w-full bg-white/5 border border-white/10 py-4 px-12 rounded-2xl focus:outline-none focus:border-shubuhat-gold/50 transition-all font-medium"
                />
            </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20 flex-1">
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-video bg-white/5 rounded-3xl animate-pulse" />)}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {videos.filter(v => (v.title_ar?.includes(searchQuery) || v.title_en?.toLowerCase().includes(searchQuery.toLowerCase()))).map((video) => (
                    <div key={video.id} className="group cursor-pointer flex flex-col">
                        <div className="relative aspect-video rounded-[32px] overflow-hidden border border-white/10 mb-5 group-hover:border-shubuhat-gold/50 transition-all duration-500 shadow-2xl">
                             {getYoutubeId(video.youtube_url) ? (
                                <Image 
                                    src={`https://img.youtube.com/vi/${getYoutubeId(video.youtube_url)}/maxresdefault.jpg`} 
                                    className="object-cover group-hover:scale-110 transition-transform duration-700" 
                                    alt={video.title_ar} 
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                             ) : <div className="w-full h-full bg-shubuhat-green/20" />}
                             <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all" />
                             <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-black/40 to-transparent">
                                <a 
                                    href={video.youtube_url} 
                                    target="_blank"
                                    className="w-14 h-14 bg-shubuhat-gold rounded-full flex items-center justify-center text-shubuhat-green shadow-xl group-hover:scale-110 transition-transform"
                                >
                                    <Play size={24} fill="currentColor" />
                                </a>
                             </div>
                        </div>
                        <div className="px-2">
                             <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-black text-shubuhat-gold uppercase tracking-[0.2em] px-2 py-1 bg-shubuhat-gold/10 rounded">YouTube</span>
                                <span className="text-[11px] font-bold text-white/30">
                                    {new Date(video.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                                </span>
                             </div>
                             <h3 className="text-xl font-black text-white group-hover:text-shubuhat-gold transition-colors leading-tight mb-4">
                                {lang === 'ar' ? video.title_ar : video.title_en}
                             </h3>
                             <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                <div className="w-8 h-8 rounded-xl bg-shubuhat-gold/20 flex items-center justify-center text-shubuhat-gold font-black text-xs">
                                    {video.profiles?.display_name_ar?.[0] || 'A'}
                                </div>
                                <div className="text-sm font-black text-white/70 flex items-center gap-1.5">
                                    {lang === 'ar' ? video.profiles?.display_name_ar : video.profiles?.display_name_en}
                                    {video.profiles?.is_verified && <CheckCircle2 size={16} className="text-blue-500 fill-blue-500/10" />}
                                </div>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
