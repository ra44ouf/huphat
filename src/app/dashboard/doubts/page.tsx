"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Trash2, Edit2, ExternalLink, ChevronRight, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/providers";

export default function DoubtsDashboard() {
  const { user } = useApp();
  const [doubts, setDoubts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    category_id: '',
    excerpt_ar: '',
    excerpt_en: '',
    content_ar: '',
    content_en: '',
    video_url: '',
    slug: ''
  });

  const supabase = createClient();

  async function fetchDoubts() {
    if (!user) return;
    setLoading(true);
    
    try {
        const { data } = await supabase
          .from('doubts')
          .select('*, categories(title_ar)')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });

        if (data) setDoubts(data);
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
        const { data: cats } = await supabase.from('categories').select('*');
        if (cats) setCategories(cats);
        if (user) fetchDoubts();
        else if (!authLoading) setLoading(false);
    }
    init();
  }, [user, authLoading]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const finalSlug = formData.slug || formData.title_en.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');

    const { error } = await supabase
      .from('doubts')
      .insert({
        ...formData,
        slug: finalSlug,
        author_id: user?.id
      });

    if (error) {
      alert(error.message);
    } else {
      setIsAdding(false);
      setFormData({ title_ar: '', title_en: '', category_id: '', excerpt_ar: '', excerpt_en: '', content_ar: '', content_en: '', video_url: '', slug: '' });
      fetchDoubts();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشبهة؟')) return;
    const { error } = await supabase.from('doubts').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchDoubts();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
            <h1 className="text-4xl font-black text-shubuhat-green mb-2">إدارة الشبهات</h1>
            <p className="text-shubuhat-text-3 font-medium">قم بإضافة ردود جديدة أو تعديل الردود الحالية.</p>
        </div>
        <button 
            onClick={() => setIsAdding(true)}
            className="bg-shubuhat-gold text-shubuhat-green px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-shubuhat-gold-light transition-all shadow-lg active:scale-95"
        >
            <Plus size={20} />
            إضافة شبهة جديدة
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-shubuhat-gold" size={40} />
        </div>
      ) : doubts.length === 0 && !isAdding ? (
        <div className="bg-white border-2 border-dashed border-shubuhat-border-lite p-20 rounded-[40px] text-center">
            <div className="w-20 h-20 bg-shubuhat-green-ghost rounded-full flex items-center justify-center mx-auto mb-6 text-shubuhat-green/20">
                <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-shubuhat-green mb-2">لا يوجد محتوى بعد</h3>
            <p className="text-shubuhat-text-3 font-bold mb-8">ابدأ بنشر أول رد لك على الشبهات الآن.</p>
            <button onClick={() => setIsAdding(true)} className="bg-shubuhat-green text-white px-8 py-4 rounded-full font-black shadow-xl">ابدأ النشر</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
            {doubts.map((doubt) => (
                <div key={doubt.id} className="bg-white p-6 rounded-3xl border border-shubuhat-border-lite flex items-center gap-6 group hover:border-shubuhat-gold transition-all shadow-sm">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-shubuhat-border-lite overflow-hidden shadow-sm">
                        <img src="/logo.jpg" alt="" className="w-full h-full object-cover scale-[1.3]" />
                    </div>
                    <div className="flex-1">
                        <div className="text-[10px] font-black uppercase text-shubuhat-gold tracking-widest mb-1">{doubt.categories?.title_ar}</div>
                        <h3 className="font-black text-shubuhat-green text-lg">{doubt.title_ar}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/doubts/${doubt.slug}`} target="_blank" className="p-3 text-shubuhat-text-3 hover:text-shubuhat-green bg-shubuhat-green-ghost rounded-xl transition-all">
                            <ExternalLink size={18} />
                        </Link>
                        <button onClick={() => handleDelete(doubt.id)} className="p-3 text-red-400 hover:text-red-600 bg-red-50 rounded-xl transition-all">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Adding Modal/Overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-[60] bg-shubuhat-green/60 backdrop-blur-sm flex items-center justify-end">
            <div className="w-full max-w-2xl h-full bg-white shadow-2xl p-8 flex flex-col animate-in slide-in-from-left duration-300">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-shubuhat-green">إضافة شبهة جديدة</h2>
                    <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-shubuhat-green-ghost rounded-full text-shubuhat-text-3">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleAdd} className="flex-1 overflow-y-auto pr-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-shubuhat-green uppercase">العنوان بالعربية</label>
                            <input required value={formData.title_ar} onChange={(e) => setFormData({...formData, title_ar: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-shubuhat-green uppercase">Title in English</label>
                            <input required value={formData.title_en} onChange={(e) => setFormData({...formData, title_en: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold" dir="ltr" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-shubuhat-green uppercase">التصنيف</label>
                        <select required value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold appearance-none">
                            <option value="">اختر التصنيف...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.title_ar}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-shubuhat-green uppercase">وصف مختصر للرد (Excerpt)</label>
                        <textarea required value={formData.excerpt_ar} onChange={(e) => setFormData({...formData, excerpt_ar: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold min-h-[100px]" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-shubuhat-green uppercase">الرد التفصيلي</label>
                        <textarea required value={formData.content_ar} onChange={(e) => setFormData({...formData, content_ar: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold min-h-[300px]" placeholder="اكتب الرد هنا بشكل مفصل..." />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-shubuhat-green uppercase">رابط فيديو توضيحي (YouTube)</label>
                        <input value={formData.video_url} onChange={(e) => setFormData({...formData, video_url: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold" placeholder="https://youtube.com/watch?v=..." dir="ltr" />
                    </div>

                    <div className="pt-6">
                        <button disabled={saving} className="w-full bg-shubuhat-green text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50">
                            {saving ? 'جاري الحفظ...' : 'نشر الرد الآن'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
