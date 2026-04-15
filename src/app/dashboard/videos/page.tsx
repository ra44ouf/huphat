"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Trash2, ExternalLink, X, Loader2, Video as VideoIcon, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/providers";

export default function VideosDashboard() {
  const { user } = useApp();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    youtube_url: '',
    description_ar: '',
    description_en: ''
  });

  const supabase = createClient();

  async function fetchVideos() {
    if (!user) return;
    setLoading(true);
    try {
        const { data } = await supabase
          .from('videos')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });

        if (data) setVideos(data);
    } finally {
        setLoading(false);
    }
  }

  const { loading: authLoading } = useApp();

  useEffect(() => {
    if (user) fetchVideos();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('videos')
      .insert({
        ...formData,
        author_id: user?.id
      });

    if (error) {
      alert(error.message);
    } else {
      setIsAdding(false);
      setFormData({ title_ar: '', title_en: '', youtube_url: '', description_ar: '', description_en: '' });
      fetchVideos();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchVideos();
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
            <h1 className="text-4xl font-black text-shubuhat-green mb-2">إدارة الفيديوهات</h1>
            <p className="text-shubuhat-text-3 font-medium">شارك مقاطع الفيديو للردود العلمية من يوتيوب.</p>
        </div>
        <button 
            onClick={() => setIsAdding(true)}
            className="bg-shubuhat-gold text-shubuhat-green px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-shubuhat-gold-light transition-all shadow-lg active:scale-95"
        >
            <Plus size={20} />
            إضافة فيديو جديد
        </button>
      </div>

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
            <p className="text-shubuhat-text-3 font-bold mb-8">قم بإدراج روابط يوتيوب لتظهر في الموقع.</p>
            <button onClick={() => setIsAdding(true)} className="bg-shubuhat-green text-white px-8 py-4 rounded-full font-black shadow-xl">أضف أول فيديو</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
                <div key={video.id} className="bg-white rounded-[32px] border border-shubuhat-border-lite overflow-hidden group hover:border-shubuhat-gold transition-all shadow-sm flex flex-col">
                    <div className="aspect-video bg-shubuhat-green-ghost relative group/vid">
                        {getYoutubeId(video.youtube_url) ? (
                            <img 
                                src={`https://img.youtube.com/vi/${getYoutubeId(video.youtube_url)}/maxresdefault.jpg`} 
                                className="w-full h-full object-cover"
                                alt={video.title_ar}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-shubuhat-text-3">رابط غير صالح</div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-opacity gap-3">
                             <Link href={video.youtube_url} target="_blank" className="bg-white text-shubuhat-green p-3 rounded-xl hover:bg-shubuhat-gold transition-colors">
                                <PlayCircle size={24} />
                             </Link>
                             <button onClick={() => handleDelete(video.id)} className="bg-red-500 text-white p-3 rounded-xl hover:bg-red-600 transition-colors">
                                <Trash2 size={24} />
                             </button>
                        </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                        <h3 className="font-black text-shubuhat-green text-lg mb-2 line-clamp-2">{video.title_ar}</h3>
                        <p className="text-sm font-medium text-shubuhat-text-3 line-clamp-3 mb-4">{video.description_ar}</p>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Adding Modal */}
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
                            <input required value={formData.title_ar} onChange={(e) => setFormData({...formData, title_ar: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-shubuhat-green uppercase">Video Title (English)</label>
                            <input required value={formData.title_en} onChange={(e) => setFormData({...formData, title_en: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold" dir="ltr" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-shubuhat-green uppercase">رابط اليوتيوب (URL)</label>
                        <input required value={formData.youtube_url} onChange={(e) => setFormData({...formData, youtube_url: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold" placeholder="https://youtube.com/watch?v=..." dir="ltr" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-shubuhat-green uppercase">وصف الفيديو</label>
                        <textarea required value={formData.description_ar} onChange={(e) => setFormData({...formData, description_ar: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold min-h-[150px]" />
                    </div>

                    <div className="pt-6">
                        <button disabled={saving} className="w-full bg-shubuhat-green text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50">
                            {saving ? 'جاري الحفظ...' : 'نشر الفيديو الآن'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
