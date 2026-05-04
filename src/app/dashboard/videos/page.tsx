"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Plus,
  Trash2,
  X,
  Loader2,
  Video as VideoIcon,
  PlayCircle,
  RefreshCw,

  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/providers";


// ── Inline YouTube icon (lucide-react v1 لا يحتوي على أيقونة YouTube) ──
function YoutubeIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────
interface VideoRow {
  id: string;
  title_ar: string;
  youtube_url: string;
  description_ar?: string;
  thumbnail_url?: string;
  youtube_video_id?: string;
  publish_date?: string;
  created_at: string;
}

interface ChannelRow {
  id: string;
  channel_input: string;
  channel_title?: string;
  last_synced_at?: string;
}

interface SyncResult {
  added: number;
  total: number;
  channelTitle?: string;
}

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
function extractYoutubeId(url: string): string | null {
  const match = url?.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
  return match?.[1] ?? null;
}

function getThumbnail(video: VideoRow): string | null {
  if (video.thumbnail_url) return video.thumbnail_url;
  const id = extractYoutubeId(video.youtube_url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ──────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────
export default function VideosDashboard() {
  const { user, loading: authLoading } = useApp();
  const supabase = createClient();

  // ── Videos state ──
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Manual add modal state ──
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title_ar: "",
    title_en: "",
    youtube_url: "",
    description_ar: "",
    description_en: "",
  });

  // ── YouTube channel sync state ──
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [channelInput, setChannelInput] = useState("");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [deletingChannel, setDeletingChannel] = useState<string | null>(null);

  // ──────────────────────────────────────────────────────
  // Fetch videos from Supabase
  // ──────────────────────────────────────────────────────
  const fetchVideos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("videos")
        .select("*")
        .eq("author_id", user.id)
        .order("publish_date", { ascending: false });

      if (data) setVideos(data as VideoRow[]);
    } finally {
      setLoading(false);
    }
  // user?.id (string) بدل user (object) — يمنع إعادة إنشاء الـ callback لما يتغير reference الـ user بعد كل token refresh
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ──────────────────────────────────────────────────────
  // Fetch saved channels via backend API
  // ──────────────────────────────────────────────────────
  const fetchChannels = useCallback(async () => {
    setChannelsLoading(true);
    try {
      const res = await fetch("/api/youtube/sync");
      if (res.ok) {
        const json = await res.json();
        setChannels(json.channels ?? []);
      }
    } finally {
      setChannelsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchVideos();
    else if (!authLoading) setLoading(false);
  // fetchVideos خارج الـ deps لأن user?.id يضمن استقراره — لا نريد loop لما يتغير object الـ user
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (showSyncPanel && user) fetchChannels();
  }, [showSyncPanel, user, fetchChannels]);

  // ──────────────────────────────────────────────────────
  // Manual add handler (unchanged logic)
  // ──────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert("يجب تسجيل الدخول أولاً"); return; }
    setSaving(true);

    const { error } = await supabase.from("videos").insert({
      ...formData,
      author_id: user.id,
      publish_date: new Date().toISOString(),
    });

    if (error) {
      alert(error.message);
    } else {
      setIsAdding(false);
      setFormData({ title_ar: "", title_en: "", youtube_url: "", description_ar: "", description_en: "" });
      fetchVideos();
    }
    setSaving(false);
  };

  // ──────────────────────────────────────────────────────
  // Delete video handler (unchanged logic)
  // ──────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الفيديو؟")) return;
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchVideos();
  };

  // ──────────────────────────────────────────────────────
  // YouTube sync — يُرسل للـ API route (server-side) فقط
  // ──────────────────────────────────────────────────────
  const handleSync = async (inputOverride?: string) => {
    const target = (inputOverride ?? channelInput).trim();
    if (!target) { setSyncError("يرجى إدخال رابط القناة أو معرفها"); return; }

    setSyncing(target);
    setSyncResult(null);
    setSyncError(null);

    try {
      const res = await fetch("/api/youtube/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelInput: target }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSyncError(json.error || "حدث خطأ أثناء المزامنة");
      } else {
        setSyncResult(json as SyncResult);
        setChannelInput("");
        fetchVideos();
        fetchChannels();
      }
    } catch {
      setSyncError("تعذّر الاتصال بالسيرفر");
    } finally {
      setSyncing(null);
    }
  };

  // ──────────────────────────────────────────────────────
  // Delete saved channel record
  // ──────────────────────────────────────────────────────
  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm("هل تريد إزالة هذه القناة من القائمة؟ لن تُحذف الفيديوهات.")) return;
    setDeletingChannel(channelId);
    try {
      const res = await fetch("/api/youtube/sync", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });
      if (res.ok) fetchChannels();
    } finally {
      setDeletingChannel(null);
    }
  };

  // ──────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-shubuhat-green mb-2">إدارة الفيديوهات</h1>
          <p className="text-shubuhat-text-3 font-medium">شارك مقاطع الفيديو للردود العلمية من يوتيوب.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowSyncPanel(!showSyncPanel); setSyncResult(null); setSyncError(null); }}
            className="bg-red-500 text-white px-5 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-red-600 transition-all shadow-lg active:scale-95"
          >
            <YoutubeIcon size={18} />
            مزامنة يوتيوب
            {showSyncPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-shubuhat-gold text-shubuhat-green px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-shubuhat-gold-light transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} />
            إضافة يدوية
          </button>
        </div>
      </div>

      {/* ── YouTube Sync Panel ── */}
      {showSyncPanel && (
        <div className="bg-white border border-shubuhat-border-lite rounded-[32px] p-8 mb-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
              <YoutubeIcon size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-shubuhat-green">مزامنة قناة يوتيوب</h2>
              <p className="text-xs font-bold text-shubuhat-text-3">
                أدخل رابط القناة أو معرّفها وسيتم جلب جميع الفيديوهات تلقائيًا
              </p>
            </div>
          </div>

          {/* Input + Sync button */}
          <div className="flex gap-3 mb-4">
            <input
              value={channelInput}
              onChange={(e) => { setChannelInput(e.target.value); setSyncError(null); setSyncResult(null); }}
              placeholder="مثال: https://youtube.com/@channelName  أو  UCxxxxxxxxx  أو  @handle"
              className="flex-1 p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold text-sm"
              dir="ltr"
              onKeyDown={(e) => { if (e.key === "Enter") handleSync(); }}
            />
            <button
              onClick={() => handleSync()}
              disabled={!!syncing || !channelInput.trim()}
              className="bg-shubuhat-green text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {syncing === channelInput.trim() ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <RefreshCw size={18} />
              )}
              مزامنة
            </button>
          </div>

          {/* Feedback */}
          {syncError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-2xl mb-4 font-bold text-sm">
              <AlertCircle size={18} />
              {syncError}
            </div>
          )}
          {syncResult && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-2xl mb-4 font-bold text-sm">
              <CheckCircle2 size={18} />
              {syncResult.channelTitle && <span className="font-black">{syncResult.channelTitle}:</span>}
              {" "}تمت المزامنة — تم إضافة{" "}
              <span className="text-shubuhat-green font-black">{syncResult.added}</span>
              {" "}فيديو جديد من أصل {syncResult.total} فيديو في القناة.
            </div>
          )}

          {/* Saved channels */}
          {channelsLoading ? (
            <div className="flex items-center gap-2 text-shubuhat-text-3 text-sm font-bold py-2">
              <Loader2 size={16} className="animate-spin" /> جاري تحميل القنوات...
            </div>
          ) : channels.length > 0 && (
            <div>
              <p className="text-xs font-black text-shubuhat-text-3 uppercase tracking-wider mb-3">قنواتك المحفوظة</p>
              <div className="space-y-2">
                {channels.map((ch) => (
                  <div key={ch.id} className="flex items-center justify-between bg-shubuhat-green-ghost rounded-2xl px-4 py-3 border border-shubuhat-border-lite">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center text-red-500 shrink-0">
                        <YoutubeIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-shubuhat-green text-sm truncate">{ch.channel_title || ch.channel_input}</p>
                        {ch.last_synced_at && (
                          <p className="text-xs text-shubuhat-text-3 font-medium">آخر مزامنة: {formatDate(ch.last_synced_at)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ms-3">
                      <button
                        onClick={() => handleSync(ch.channel_input)}
                        disabled={!!syncing}
                        className="flex items-center gap-1 text-xs font-black text-shubuhat-green bg-white border border-shubuhat-border-lite px-3 py-2 rounded-xl hover:border-shubuhat-gold transition-all disabled:opacity-40"
                      >
                        {syncing === ch.channel_input ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        مزامنة
                      </button>
                      <button
                        onClick={() => handleDeleteChannel(ch.id)}
                        disabled={deletingChannel === ch.id}
                        className="text-red-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-all disabled:opacity-40"
                      >
                        {deletingChannel === ch.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Videos Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-shubuhat-gold" size={40} />
        </div>
      ) : videos.length === 0 && !isAdding ? (
        <div className="bg-white border-2 border-dashed border-shubuhat-border-lite p-20 rounded-[40px] text-center">
          <div className="w-20 h-20 bg-shubuhat-green-ghost rounded-full flex items-center justify-center mx-auto mb-6 text-shubuhat-green/20">
            <VideoIcon size={40} />
          </div>
          <h3 className="text-2xl font-black text-shubuhat-green mb-2">لا توجد فيديوهات منشورة</h3>
          <p className="text-shubuhat-text-3 font-bold mb-8">أضف فيديوهات يدويًا أو زامن من قناة يوتيوب.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => setShowSyncPanel(true)}
              className="bg-red-500 text-white px-8 py-4 rounded-full font-black shadow-xl flex items-center gap-2"
            >
              <YoutubeIcon size={18} />
              مزامنة من يوتيوب
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-shubuhat-green text-white px-8 py-4 rounded-full font-black shadow-xl"
            >
              أضف أول فيديو
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            const thumb = getThumbnail(video);
            return (
              <div key={video.id} className="bg-white rounded-[32px] border border-shubuhat-border-lite overflow-hidden group hover:border-shubuhat-gold transition-all shadow-sm flex flex-col">
                {/* Thumbnail */}
                <div className="aspect-video bg-shubuhat-green-ghost relative group/vid">
                  {thumb ? (
                    <img src={thumb} className="w-full h-full object-cover" alt={video.title_ar} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-shubuhat-text-3">
                      <VideoIcon size={32} className="opacity-30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-opacity gap-3">
                    <Link href={video.youtube_url} target="_blank" className="bg-white text-shubuhat-green p-3 rounded-xl hover:bg-shubuhat-gold transition-colors">
                      <PlayCircle size={24} />
                    </Link>
                    <button onClick={() => handleDelete(video.id)} className="bg-red-500 text-white p-3 rounded-xl hover:bg-red-600 transition-colors">
                      <Trash2 size={24} />
                    </button>
                  </div>
                  {/* Badge for YouTube-synced videos */}
                  {video.youtube_video_id && (
                    <div className="absolute top-2 start-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1">
                      <YoutubeIcon size={10} />
                      يوتيوب
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-black text-shubuhat-green text-lg mb-2 line-clamp-2">{video.title_ar}</h3>
                  {video.description_ar && (
                    <p className="text-sm font-medium text-shubuhat-text-3 line-clamp-3 mb-4">{video.description_ar}</p>
                  )}
                  {video.publish_date && (
                    <p className="text-xs font-bold text-shubuhat-text-3 mt-auto">{formatDate(video.publish_date)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Manual Add Modal (unchanged logic) ── */}
      {isAdding && (
        <div className="fixed inset-0 z-[60] bg-shubuhat-green/60 backdrop-blur-sm flex items-center justify-end">
          <div className="w-full max-w-2xl h-full bg-white shadow-2xl p-8 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-shubuhat-green">مشاركة فيديو يوتيوب</h2>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-shubuhat-green-ghost rounded-full text-shubuhat-text-3">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="flex-1 overflow-y-auto pr-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-shubuhat-green uppercase">عنوان الفيديو (عربي)</label>
                  <input required value={formData.title_ar} onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-shubuhat-green uppercase">Video Title (English)</label>
                  <input required value={formData.title_en} onChange={(e) => setFormData({ ...formData, title_en: e.target.value })} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold" dir="ltr" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-shubuhat-green uppercase">رابط اليوتيوب (URL)</label>
                <input required value={formData.youtube_url} onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold" placeholder="https://youtube.com/watch?v=..." dir="ltr" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-shubuhat-green uppercase">وصف الفيديو</label>
                <textarea required value={formData.description_ar} onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold min-h-[150px]" />
              </div>

              <div className="pt-6">
                <button disabled={saving} className="w-full bg-shubuhat-green text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50">
                  {saving ? "جاري الحفظ..." : "نشر الفيديو الآن"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
