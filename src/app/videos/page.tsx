"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/navbar";
import { useApp } from "@/components/providers";
import { Play, Search, Video as VideoIcon, CheckCircle2, User as UserIcon, Loader2, ChevronDown } from "lucide-react";
import Image from "next/image";

// ── Constants ──
const PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 400;

// ── Types ──
interface Channel {
  id: string;
  display_name_ar: string | null;
  display_name_en: string | null;
  is_verified: boolean;
}

interface VideoItem {
  id: string;
  title_ar: string;
  title_en: string | null;
  youtube_url: string;
  author_id: string;
  publish_date: string | null;
  created_at: string;
  profiles: {
    display_name_ar: string | null;
    display_name_en: string | null;
    is_verified: boolean;
  } | null;
}

// ── Helpers ──
function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/** Round-robin interleave videos from different authors within a batch */
function roundRobinMix(videos: VideoItem[]): VideoItem[] {
  if (videos.length === 0) return [];
  const grouped = new Map<string, VideoItem[]>();
  videos.forEach((v) => {
    if (!grouped.has(v.author_id)) grouped.set(v.author_id, []);
    grouped.get(v.author_id)!.push(v);
  });
  if (grouped.size <= 1) return videos;

  const result: VideoItem[] = [];
  let idx = 0;
  let added = true;
  while (added) {
    added = false;
    for (const [, vids] of grouped.entries()) {
      if (idx < vids.length) {
        result.push(vids[idx]);
        added = true;
      }
    }
    idx++;
  }
  return result;
}

export default function VideosPage() {
  const { lang } = useApp();
  const supabase = createClient();

  // ── State ──
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Refs for debounce
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Debounced search ──
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  // ── Fetch channels (publishers) from profiles table ──
  useEffect(() => {
    async function fetchChannels() {
      setChannelsLoading(true);
      try {
        // Get unique authors who have videos
        const { data: authorIds } = await supabase
          .from('videos')
          .select('author_id');
        
        if (authorIds && authorIds.length > 0) {
          const uniqueIds = [...new Set(authorIds.map((a: any) => a.author_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name_ar, display_name_en, is_verified')
            .in('id', uniqueIds);
          
          if (profiles) {
            setChannels(profiles as Channel[]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch channels:", err);
      } finally {
        setChannelsLoading(false);
      }
    }
    fetchChannels();
  }, []);

  // ── Fetch videos (paginated) ──
  const fetchVideos = useCallback(async (pageNum: number, channelId: string | null, search: string, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('videos')
        .select(`
          id, title_ar, title_en, youtube_url, author_id, publish_date, created_at,
          profiles (display_name_ar, display_name_en, is_verified)
        `)
        .order('publish_date', { ascending: false })
        .range(from, to);

      // Filter by channel
      if (channelId) {
        query = query.eq('author_id', channelId);
      }

      // Search filter (server-side)
      if (search.trim()) {
        query = query.or(`title_ar.ilike.%${search}%,title_en.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Videos fetch error:", error);
        return;
      }

      const newVideos = (data || []) as VideoItem[];
      
      // Apply round-robin only when showing "all channels" (no specific channel selected)
      const processedVideos = !channelId ? roundRobinMix(newVideos) : newVideos;

      if (append) {
        setVideos((prev) => [...prev, ...processedVideos]);
      } else {
        setVideos(processedVideos);
      }

      setHasMore(newVideos.length === PAGE_SIZE);
    } catch (err) {
      console.error("Failed to load videos:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // ── Reset and fetch when channel or search changes ──
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchVideos(0, selectedChannelId, debouncedSearch, false);
  }, [selectedChannelId, debouncedSearch, fetchVideos]);

  // ── Load more handler ──
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchVideos(nextPage, selectedChannelId, debouncedSearch, true);
  };

  // ── Handle channel selection ──
  const handleChannelSelect = (channelId: string | null) => {
    if (channelId === selectedChannelId) return;
    setSelectedChannelId(channelId);
  };

  // ── Filtered channels for search in channel selector ──
  const filteredChannels = useMemo(() => {
    if (!debouncedSearch) return channels;
    return channels.filter(
      (c) =>
        c.display_name_ar?.includes(debouncedSearch) ||
        (c.display_name_en && c.display_name_en.toLowerCase().includes(debouncedSearch.toLowerCase()))
    );
  }, [channels, debouncedSearch]);

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col">
      <Navbar />

      {/* ── Hero Section ── */}
      <section className="py-12 sm:py-16 md:py-20 px-4 border-b border-white/5 relative bg-gradient-to-b from-shubuhat-green/20 to-transparent">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-shubuhat-gold">
            {lang === 'ar' ? 'الإنتاج المرئي' : 'Visual Content'}
          </h1>
          <p className="max-w-2xl mx-auto text-white/50 font-medium text-sm sm:text-base md:text-lg mb-6 sm:mb-10 leading-relaxed px-2">
            {lang === 'ar'
              ? 'ردود علمية موثقة وسهلة الاستيعاب عبر سلسلة من الفيديوهات المتخصصة من قبل نخبة من الباحثين.'
              : 'Documented and easy-to-understand scientific refutations through a series of specialized videos by top researchers.'}
          </p>
          <div className="max-w-md w-full relative group px-2">
            <Search className="absolute left-6 sm:left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-shubuhat-gold transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث عن فيديو أو قناة...' : 'Search for a video or channel...'}
              className="w-full bg-white/5 border border-white/10 py-3 sm:py-4 px-10 sm:px-12 rounded-2xl focus:outline-none focus:border-shubuhat-gold/50 transition-all font-medium text-sm sm:text-base"
            />
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12 flex-1 w-full">
        
        {/* ── Channels Section ── */}
        {channelsLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-4 mb-6 sm:mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-[100px] sm:min-w-[120px] h-28 sm:h-32 bg-white/5 rounded-2xl sm:rounded-3xl animate-pulse shrink-0" />
            ))}
          </div>
        ) : channels.length > 0 && (
          <div className="mb-6 sm:mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-shubuhat-gold/10 flex items-center justify-center text-shubuhat-gold">
                  <VideoIcon size={16} className="sm:hidden" />
                  <VideoIcon size={20} className="hidden sm:block" />
                </div>
                {lang === 'ar' ? 'قنوات الناشرين' : 'Publishers Channels'}
              </h2>
              {debouncedSearch && filteredChannels.length > 0 && (
                <span className="text-xs font-bold text-shubuhat-gold bg-shubuhat-gold/10 px-2 sm:px-3 py-1 rounded-full">
                  {filteredChannels.length} {lang === 'ar' ? 'نتائج' : 'Results'}
                </span>
              )}
            </div>

            <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto pb-3 sm:pb-4 md:pb-6 scrollbar-hide snap-x -mx-1 px-1">
              {/* "All" button */}
              <button
                onClick={() => handleChannelSelect(null)}
                className={`flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl md:rounded-[32px] min-w-[90px] sm:min-w-[110px] md:min-w-[140px] snap-center transition-all duration-300 border shrink-0 ${
                  selectedChannelId === null
                    ? 'bg-shubuhat-gold/10 border-shubuhat-gold text-shubuhat-gold scale-105 shadow-[0_0_30px_rgba(212,175,55,0.15)]'
                    : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10 text-white'
                }`}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-colors ${
                  selectedChannelId === null ? 'bg-shubuhat-gold text-shubuhat-green' : 'bg-white/10 text-white'
                }`}>
                  <UserIcon size={20} className="sm:hidden" />
                  <UserIcon size={24} className="hidden sm:block md:hidden" />
                  <UserIcon size={28} className="hidden md:block" />
                </div>
                <span className="font-black text-xs sm:text-sm">{lang === 'ar' ? 'الكل' : 'All'}</span>
              </button>

              {filteredChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel.id)}
                  className={`flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl md:rounded-[32px] min-w-[90px] sm:min-w-[110px] md:min-w-[140px] snap-center transition-all duration-300 border shrink-0 ${
                    selectedChannelId === channel.id
                      ? 'bg-shubuhat-gold/10 border-shubuhat-gold text-shubuhat-gold scale-105 shadow-[0_0_30px_rgba(212,175,55,0.15)]'
                      : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10 text-white'
                  }`}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-black text-lg sm:text-xl md:text-2xl transition-colors ${
                    selectedChannelId === channel.id ? 'bg-shubuhat-gold text-shubuhat-green' : 'bg-white/10 text-white'
                  }`}>
                    {channel.display_name_ar?.[0] || 'A'}
                  </div>
                  <span className="font-black text-[10px] sm:text-xs md:text-sm text-center line-clamp-2 leading-tight">
                    {lang === 'ar' ? channel.display_name_ar : channel.display_name_en}
                  </span>
                  {channel.is_verified && <CheckCircle2 size={12} className="text-blue-500 fill-blue-500/10 mt-[-3px] sm:mt-[-5px]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading State ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-4 sm:mt-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-video bg-white/5 rounded-2xl sm:rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 md:py-32 text-center px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white/5 rounded-full flex items-center justify-center mb-4 sm:mb-6 text-white/20">
              <VideoIcon size={32} className="sm:hidden" />
              <VideoIcon size={40} className="hidden sm:block md:hidden" />
              <VideoIcon size={48} className="hidden md:block" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white/50 mb-2">
              {debouncedSearch || selectedChannelId
                ? (lang === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching results')
                : (lang === 'ar' ? 'لا توجد فيديوهات حالياً' : 'No videos yet')}
            </h3>
            <p className="text-white/30 font-bold text-sm sm:text-base">
              {lang === 'ar' ? 'سيتم إضافة محتوى قريباً' : 'Content will be added soon'}
            </p>
            {(debouncedSearch || selectedChannelId) && (
              <button
                onClick={() => { setSearchQuery(""); setDebouncedSearch(""); setSelectedChannelId(null); }}
                className="mt-4 text-sm font-bold text-shubuhat-gold hover:underline"
              >
                {lang === 'ar' ? 'عرض كل الفيديوهات' : 'Show all videos'}
              </button>
            )}
          </div>
        ) : (
          /* ── Videos Grid ── */
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-black text-white/80 mb-4 sm:mb-6 flex items-center gap-2">
              {selectedChannelId
                ? (lang === 'ar' ? 'فيديوهات القناة' : 'Channel Videos')
                : (lang === 'ar' ? 'أحدث الفيديوهات' : 'Latest Videos')}
              <span className="text-xs font-bold text-white/30 bg-white/10 px-2 sm:px-3 py-1 rounded-full ms-1 sm:ms-2">
                {videos.length}{hasMore ? '+' : ''}
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-x-8 md:gap-y-12">
              {videos.map((video) => (
                <div key={video.id} className="group cursor-pointer flex flex-col">
                  {/* Thumbnail */}
                  <div className="relative aspect-video rounded-xl sm:rounded-2xl md:rounded-3xl lg:rounded-[32px] overflow-hidden border border-white/10 mb-3 sm:mb-4 md:mb-5 group-hover:border-shubuhat-gold/50 transition-all duration-500 shadow-2xl">
                    {getYoutubeId(video.youtube_url) ? (
                      <Image
                        src={`https://img.youtube.com/vi/${getYoutubeId(video.youtube_url)}/mqdefault.jpg`}
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        alt={video.title_ar || ''}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-shubuhat-green/20" />
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all" />
                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 md:p-6 bg-gradient-to-t from-black via-black/40 to-transparent">
                      <a
                        href={video.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-shubuhat-gold rounded-full flex items-center justify-center text-shubuhat-green shadow-xl group-hover:scale-110 transition-transform"
                      >
                        <Play size={18} className="sm:hidden" fill="currentColor" />
                        <Play size={20} className="hidden sm:block md:hidden" fill="currentColor" />
                        <Play size={24} className="hidden md:block" fill="currentColor" />
                      </a>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="px-1 sm:px-2">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <span className="text-[9px] sm:text-[10px] font-black text-shubuhat-gold uppercase tracking-[0.15em] sm:tracking-[0.2em] px-1.5 sm:px-2 py-0.5 sm:py-1 bg-shubuhat-gold/10 rounded">YouTube</span>
                      <span className="text-[10px] sm:text-[11px] font-bold text-white/30">
                        {new Date(video.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-black text-white group-hover:text-shubuhat-gold transition-colors leading-tight mb-2 sm:mb-3 md:mb-4 line-clamp-2">
                      {lang === 'ar' ? video.title_ar : video.title_en}
                    </h3>
                    <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-3 md:pt-4 border-t border-white/5">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg sm:rounded-xl bg-shubuhat-gold/20 flex items-center justify-center text-shubuhat-gold font-black text-[10px] sm:text-xs">
                        {video.profiles?.display_name_ar?.[0] || 'A'}
                      </div>
                      <div className="text-xs sm:text-sm font-black text-white/70 flex items-center gap-1 sm:gap-1.5">
                        {lang === 'ar' ? video.profiles?.display_name_ar : video.profiles?.display_name_en}
                        {video.profiles?.is_verified && <CheckCircle2 size={14} className="text-blue-500 fill-blue-500/10" />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Load More Button ── */}
            {hasMore && (
              <div className="flex justify-center mt-8 sm:mt-10 md:mt-14 mb-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="group flex items-center gap-2 sm:gap-3 bg-white/5 hover:bg-shubuhat-gold/10 border border-white/10 hover:border-shubuhat-gold/50 text-white hover:text-shubuhat-gold px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-2xl sm:rounded-3xl font-black text-sm sm:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {loadingMore ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
                  )}
                  {loadingMore
                    ? (lang === 'ar' ? 'جاري التحميل...' : 'Loading...')
                    : (lang === 'ar' ? 'عرض المزيد' : 'Load More')}
                </button>
              </div>
            )}

            {/* ── End of results message ── */}
            {!hasMore && videos.length > 0 && (
              <div className="text-center mt-8 sm:mt-10 mb-4">
                <p className="text-xs sm:text-sm font-bold text-white/20">
                  {lang === 'ar' ? '— نهاية النتائج —' : '— End of results —'}
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
