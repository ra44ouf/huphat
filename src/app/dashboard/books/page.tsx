"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Trash2, ExternalLink, X, Loader2, Book as BookIcon } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/providers";

export default function BooksDashboard() {
  const { user, loading: authLoading } = useApp();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    book_author_ar: '',
    book_author_en: '',
    description_ar: '',
    description_en: '',
    cover_url: '',
    download_url: '',
    pages_count: ''
  });

  const supabase = createClient();

  async function fetchBooks() {
    if (!user) return;
    setLoading(true);
    try {
        const { data } = await supabase
          .from('books')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });

        if (data) setBooks(data);
    } finally {
        setLoading(false);
    }
  }



  useEffect(() => {
    if (user) fetchBooks();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert('يجب تسجيل الدخول أولاً'); return; }
    setSaving(true);

    const { error } = await supabase
      .from('books')
      .insert({
        ...formData,
        pages_count: formData.pages_count ? parseInt(formData.pages_count) : null,
        author_id: user.id
      });

    if (error) {
      alert(error.message);
    } else {
      setIsAdding(false);
      setFormData({ title_ar: '', title_en: '', book_author_ar: '', book_author_en: '', description_ar: '', description_en: '', cover_url: '', download_url: '', pages_count: '' });
      fetchBooks();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكتاب؟')) return;
    const { error } = await supabase.from('books').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchBooks();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
            <h1 className="text-4xl font-black text-shubuhat-green mb-2">إدارة الكتب</h1>
            <p className="text-shubuhat-text-3 font-medium">قم بإضافة مكتبة الكتب الرقمية للرد على الشبهات.</p>
        </div>
        <button 
            onClick={() => setIsAdding(true)}
            className="bg-shubuhat-gold text-shubuhat-green px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-shubuhat-gold-light transition-all shadow-lg active:scale-95"
        >
            <Plus size={20} />
            إضافة كتاب جديد
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-shubuhat-gold" size={40} />
        </div>
      ) : books.length === 0 && !isAdding ? (
        <div className="bg-white border-2 border-dashed border-shubuhat-border-lite p-20 rounded-[40px] text-center">
            <div className="w-20 h-20 bg-shubuhat-green-ghost rounded-full flex items-center justify-center mx-auto mb-6 text-shubuhat-green/20">
                <BookIcon size={40} />
            </div>
            <h3 className="text-2xl font-black text-shubuhat-green mb-2">لا توجد كتب حالياً</h3>
            <p className="text-shubuhat-text-3 font-bold mb-8">ابدأ في بناء مكتبتك العلمية الآن.</p>
            <button onClick={() => setIsAdding(true)} className="bg-shubuhat-green text-white px-8 py-4 rounded-full font-black shadow-xl">أضف أول كتاب</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
                <div key={book.id} className="bg-white rounded-[32px] border border-shubuhat-border-lite overflow-hidden group hover:border-shubuhat-gold transition-all shadow-sm">
                    <div className="aspect-[3/4] bg-shubuhat-green-ghost relative group/cover">
                        <img src={book.cover_url} alt={book.title_ar} className="w-full h-full object-cover transition-transform group-hover/cover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <Link href={book.download_url} target="_blank" className="bg-white text-shubuhat-green p-3 rounded-xl hover:bg-shubuhat-gold transition-colors">
                                <ExternalLink size={20} />
                             </Link>
                             <button onClick={() => handleDelete(book.id)} className="bg-red-500 text-white p-3 rounded-xl hover:bg-red-600 transition-colors">
                                <Trash2 size={20} />
                             </button>
                        </div>
                    </div>
                    <div className="p-6">
                        <h3 className="font-black text-shubuhat-green text-lg mb-1">{book.title_ar}</h3>
                        <p className="text-sm font-bold text-shubuhat-text-3 mb-4">{book.book_author_ar}</p>
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
                    <h2 className="text-2xl font-black text-shubuhat-green">إضافة كتاب جديد</h2>
                    <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-shubuhat-green-ghost rounded-full text-shubuhat-text-3">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleAdd} className="flex-1 overflow-y-auto pr-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-shubuhat-green uppercase">عنوان الكتاب (عربي)</label>
                            <input required value={formData.title_ar} onChange={(e) => setFormData({...formData, title_ar: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-shubuhat-green uppercase">Book Title (English)</label>
                            <input required value={formData.title_en} onChange={(e) => setFormData({...formData, title_en: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold" dir="ltr" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-shubuhat-green uppercase">المؤلف (عربي)</label>
                            <input required value={formData.book_author_ar} onChange={(e) => setFormData({...formData, book_author_ar: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-shubuhat-green uppercase">Author (English)</label>
                            <input required value={formData.book_author_en} onChange={(e) => setFormData({...formData, book_author_en: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold" dir="ltr" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-shubuhat-green uppercase">رابط صورة الغلاف</label>
                        <input required value={formData.cover_url} onChange={(e) => setFormData({...formData, cover_url: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold" placeholder="https://..." dir="ltr" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-shubuhat-green uppercase">رابط تحميل الكتاب (PDF)</label>
                        <input required value={formData.download_url} onChange={(e) => setFormData({...formData, download_url: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold" placeholder="https://..." dir="ltr" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-shubuhat-green uppercase">وصف الكتاب</label>
                        <textarea required value={formData.description_ar} onChange={(e) => setFormData({...formData, description_ar: e.target.value})} className="w-full p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite focus:border-shubuhat-gold outline-none font-bold min-h-[100px]" />
                    </div>

                    <div className="pt-6">
                        <button disabled={saving} className="w-full bg-shubuhat-green text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50">
                            {saving ? 'جاري الرفع...' : 'إضافة الكتاب للمكتبة'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
