"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useApp } from "@/components/providers";
import { Radio, Tv, RefreshCw } from "lucide-react";

interface LiveStream {
  id: string;
  admin_id: string;
  channel_id: string;
  channel_name: string | null;
  video_id: string | null;
  title: string | null;
  is_active: boolean;
  updated_at: string;
}

export default function LivePage() {
  const { lang } = useApp();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [allStreams, setAllStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // ── جلب البيانات الأولية ──
  useEffect(() => {
    async function fetchStreams() {
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!error && data) {
          setAllStreams(data as LiveStream[]);
          setStreams((data as LiveStream[]).filter((s) => s.is_active));
        }
      } catch (err) {
        console.error("Failed to fetch live streams:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStreams();
  }, []);

  // ── Supabase Realtime — تحديث فوري بدون ريفريش ──
  useEffect(() => {
    const channel = supabase
      .channel('live_streams_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_streams' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newStream = payload.new as LiveStream;
            setAllStreams((prev) => [newStream, ...prev.filter(s => s.id !== newStream.id)]);
            if (newStream.is_active) {
              setStreams((prev) => [newStream, ...prev.filter(s => s.id !== newStream.id)]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as LiveStream;
            setAllStreams((prev) => prev.map(s => s.id === updated.id ? updated : s));
            setStreams((prev) => {
              const without = prev.filter(s => s.id !== updated.id);
              return updated.is_active ? [updated, ...without] : without;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            setAllStreams((prev) => prev.filter(s => s.id !== deletedId));
            setStreams((prev) => prev.filter(s => s.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeStreams = streams;
  const offlineChannels = allStreams.filter((s) => !s.is_active);

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col">
      <Navbar />

      {/* ── Hero Section ── */}
      <section className="py-12 sm:py-16 md:py-20 px-4 border-b border-white/5 relative bg-gradient-to-b from-red-900/20 to-transparent">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-6">
            {activeStreams.length > 0 && (
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
              </span>
            )}
            <span className="text-xs font-black text-red-400 uppercase tracking-[0.3em] bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
              {lang === 'ar' ? 'البث المباشر' : 'LIVE STREAM'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-red-400">
            {lang === 'ar' ? 'البث المباشر' : 'Live Broadcasts'}
          </h1>
          <p className="max-w-2xl mx-auto text-white/50 font-medium text-sm sm:text-base md:text-lg leading-relaxed px-2">
            {lang === 'ar'
              ? 'تابع البثوث المباشرة من باحثينا ومتخصصينا — التحديث تلقائي وفوري.'
              : 'Follow live broadcasts from our researchers and specialists — updates are automatic and instant.'}
          </p>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12 flex-1 w-full">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw size={32} className="animate-spin text-red-400 mb-4" />
            <p className="text-white/40 font-bold text-sm">
              {lang === 'ar' ? 'جاري التحقق من البثوث...' : 'Checking streams...'}
            </p>
          </div>
        ) : activeStreams.length === 0 ? (
          /* ── No Active Streams ── */
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 md:py-32 text-center px-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 text-white/15">
              <Tv size={40} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white/40 mb-3">
              {lang === 'ar' ? 'لا يوجد بث مباشر حالياً' : 'No live broadcasts right now'}
            </h3>
            <p className="text-white/25 font-bold text-sm max-w-md">
              {lang === 'ar'
                ? 'هذه الصفحة تتحدث تلقائياً — سيظهر البث هنا فور بدايته بدون الحاجة لتحديث الصفحة.'
                : 'This page updates automatically — a stream will appear here as soon as it starts, no need to refresh.'}
            </p>

            {/* Offline channels */}
            {offlineChannels.length > 0 && (
              <div className="mt-12 w-full max-w-lg">
                <p className="text-xs font-black text-white/20 uppercase tracking-wider mb-4">
                  {lang === 'ar' ? 'القنوات المسجلة' : 'Registered Channels'}
                </p>
                <div className="space-y-2">
                  {offlineChannels.map((ch) => (
                    <div key={ch.id} className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3 border border-white/5">
                      <div className="w-3 h-3 rounded-full bg-white/10 shrink-0" />
                      <span className="text-sm font-bold text-white/40">{ch.channel_name || ch.channel_id}</span>
                      <span className="text-xs text-white/15 ms-auto">
                        {lang === 'ar' ? 'غير متصل' : 'Offline'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Active Streams Grid ── */
          <div className="space-y-8">
            {activeStreams.map((stream, index) => (
              <div key={stream.id} className="group">
                {/* Live badge */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                  <span className="text-xs font-black text-red-400 uppercase tracking-widest">
                    {lang === 'ar' ? 'مباشر الآن' : 'LIVE NOW'}
                  </span>
                  {stream.channel_name && (
                    <span className="text-xs font-bold text-white/40">
                      — {stream.channel_name}
                    </span>
                  )}
                </div>

                {/* YouTube Embed */}
                <div className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.1)] ${index === 0 ? 'aspect-video' : 'aspect-video max-w-4xl'}`}>
                  <iframe
                    src={`https://www.youtube.com/embed/live_stream?channel=${stream.channel_id}&autoplay=1&mute=1`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={stream.title || 'Live Stream'}
                  />
                </div>

                {/* Stream info */}
                {stream.title && (
                  <div className="mt-4 px-1">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-tight">
                      {stream.title}
                    </h2>
                  </div>
                )}
              </div>
            ))}

            {/* Offline channels below active */}
            {offlineChannels.length > 0 && (
              <div className="pt-8 border-t border-white/5">
                <p className="text-xs font-black text-white/20 uppercase tracking-wider mb-4">
                  {lang === 'ar' ? 'قنوات أخرى' : 'Other Channels'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {offlineChannels.map((ch) => (
                    <div key={ch.id} className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3 border border-white/5">
                      <div className="w-3 h-3 rounded-full bg-white/10 shrink-0" />
                      <span className="text-sm font-bold text-white/40">{ch.channel_name || ch.channel_id}</span>
                      <span className="text-xs text-white/15 ms-auto">
                        {lang === 'ar' ? 'غير متصل' : 'Offline'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
