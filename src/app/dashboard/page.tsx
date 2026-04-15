import { createClient } from "@/utils/supabase/server";
import { MessageCircle, BookOpen, Video, Eye, PlusCircle } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch counts for this user
  const { count: doubtsCount } = await supabase
    .from('doubts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user?.id);

  const { count: booksCount } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user?.id);

  const { count: videosCount } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user?.id);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-shubuhat-green mb-2">مرحباً بك في الناشر</h1>
        <p className="text-shubuhat-text-3 font-medium">إليك نظرة سريعة على ما قمت بنشره حتى الآن.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard 
            title="الشبهات المنشورة" 
            count={doubtsCount || 0} 
            icon={<MessageCircle size={24} />} 
            color="bg-blue-500"
            href="/dashboard/doubts"
        />
        <StatCard 
            title="الكتب المرفوعة" 
            count={booksCount || 0} 
            icon={<BookOpen size={24} />} 
            color="bg-purple-500"
            href="/dashboard/books"
        />
        <StatCard 
            title="الفيديوهات" 
            count={videosCount || 0} 
            icon={<Video size={24} />} 
            color="bg-red-500"
            href="/dashboard/videos"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-shubuhat-border-lite shadow-sm">
            <h3 className="text-xl font-black text-shubuhat-green mb-6 flex items-center gap-2">
                <PlusCircle size={24} className="text-shubuhat-gold" />
                إضافة سريعة
            </h3>
            <div className="grid grid-cols-1 gap-3">
                <QuickLink href="/dashboard/doubts?new=true" title="رد على شبهة جديدة" icon={<MessageCircle size={18} />} />
                <QuickLink href="/dashboard/books?new=true" title="رفع كتاب جديد" icon={<BookOpen size={18} />} />
                <QuickLink href="/dashboard/videos?new=true" title="مشاركة فيديو يوتيوب" icon={<Video size={18} />} />
            </div>
        </div>

        <div className="bg-shubuhat-green p-8 rounded-[40px] text-white flex flex-col justify-center">
            <h3 className="text-xl font-black mb-4">نصيحة للنشر</h3>
            <p className="text-white/70 font-medium leading-relaxed mb-6">
                احرص دائماً على وضع روابط الفيديوهات لتوضيح الردود، فالمحتوى المرئي يصل أسرع للباحثين عن الحقيقة.
            </p>
            <Link href="/doubts" className="text-shubuhat-gold font-black flex items-center gap-2 hover:gap-3 transition-all">
                مشاهدة كيف يظهر محتواك للجمهور
                <Eye size={20} />
            </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, count, icon, color, href }: any) {
    return (
        <Link href={href} className="bg-white p-8 rounded-[40px] border border-shubuhat-border-lite shadow-sm hover:shadow-xl transition-all group">
            <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div className="text-3xl font-black text-shubuhat-green mb-1">{count}</div>
            <div className="text-sm font-bold text-shubuhat-text-3">{title}</div>
        </Link>
    );
}

function QuickLink({ href, title, icon }: any) {
    return (
        <Link href={href} className="flex items-center gap-3 p-4 rounded-2xl bg-shubuhat-green-ghost border border-shubuhat-border-lite hover:border-shubuhat-gold hover:bg-white transition-all font-black text-shubuhat-green text-sm">
            {icon}
            {title}
        </Link>
    )
}
