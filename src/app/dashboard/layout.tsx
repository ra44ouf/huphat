import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { LayoutDashboard, BookOpen, Video, MessageCircle, LogOut, ShieldCheck, Radio } from "lucide-react";
import { logout } from "@/app/login/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError && profileError.message !== 'JSON object requested, multiple (or no) rows returned') {
    console.error("Profile fetch error:", profileError);
  }

  if (!profile || (profile?.role !== 'admin' && profile?.role !== 'publisher')) {
    return (
        <main className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-md text-center bg-white p-10 rounded-[40px] shadow-2xl border border-shubuhat-border-lite">
                    <div className="w-20 h-20 bg-shubuhat-gold/20 text-shubuhat-gold rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-shubuhat-green mb-4">في انتظار التوثيق</h1>
                    <p className="text-shubuhat-text-3 font-bold leading-relaxed mb-8">
                        شكراً لتسجيلك! حسابك حالياً بانتظار موافقة الإدارة لتمكين خاصية النشر. يرجى مراجعة المسؤول لتحويل حسابك إلى "ناشر".
                    </p>
                    <Link href="/" className="inline-block bg-shubuhat-green text-white px-8 py-3 rounded-full font-black text-sm">
                        العودة للرئيسية
                    </Link>
                </div>
            </div>
            <Footer />
        </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Dashboard Sidebar */}
        <aside className="w-full md:w-72 bg-white border-e border-shubuhat-border-lite p-6 flex flex-col">
            <div className="mb-10 px-4">
                <h2 className="text-[10px] font-black text-shubuhat-text-3 uppercase tracking-[0.2em] mb-4">لوحة التحكم</h2>
                <div className="text-shubuhat-green font-black text-xl flex items-center gap-2">
                    <LayoutDashboard size={24} className="text-shubuhat-gold" />
                    المركز العلمي
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                <DashboardNavLink href="/dashboard" icon={<LayoutDashboard size={20} />}>نظرة عامة</DashboardNavLink>
                <DashboardNavLink href="/dashboard/doubts" icon={<MessageCircle size={20} />}>إدارة الشبهات</DashboardNavLink>
                <DashboardNavLink href="/dashboard/books" icon={<BookOpen size={20} />}>إدارة الكتب</DashboardNavLink>
                <DashboardNavLink href="/dashboard/videos" icon={<Video size={20} />}>إدارة الفيديوهات</DashboardNavLink>
                <DashboardNavLink href="/dashboard/live" icon={<Radio size={20} />}>البث المباشر</DashboardNavLink>
            </nav>

            <div className="mt-8 pt-8 border-t border-shubuhat-border-lite">
                <form action={logout}>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all">
                        <LogOut size={20} />
                        تسجيل الخروج
                    </button>
                </form>
            </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-12 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function DashboardNavLink({ children, href, icon }: { children: React.ReactNode; href: string; icon: React.ReactNode }) {
    return (
        <Link href={href} className="flex items-center gap-3 px-4 py-3.5 text-shubuhat-green font-black text-sm rounded-2xl border border-transparent hover:bg-shubuhat-green-ghost hover:border-shubuhat-border-lite transition-all">
            <span className="text-shubuhat-text-3">{icon}</span>
            {children}
        </Link>
    );
}
