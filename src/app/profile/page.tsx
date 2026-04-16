"use client";

import { useApp } from "@/components/providers";
import { User, Mail, Calendar, ShieldAlert, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, profile, loading, lang } = useApp();
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-shubuhat-green-ghost flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-shubuhat-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-shubuhat-green-ghost py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-shubuhat-border-lite">
          {/* Header Decor */}
          <div className="h-32 bg-shubuhat-green relative">
            <div className="absolute -bottom-12 left-8 w-24 h-24 bg-shubuhat-gold rounded-3xl flex items-center justify-center text-shubuhat-green shadow-xl border-4 border-white">
              <User size={48} fill="currentColor" />
            </div>
          </div>

          <div className="pt-16 pb-12 px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-shubuhat-green mb-1">
                {profile?.full_name || (lang === 'ar' ? 'أهلاً بك' : 'Welcome')}
              </h1>
              <p className="text-shubuhat-text-3 font-bold flex items-center gap-2">
                <Mail size={16} /> {user.email}
              </p>
            </div>

            {/* Notice Box */}
            {profile?.role !== 'admin' && profile?.role !== 'publisher' && (
              <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl mb-8 flex items-start gap-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-amber-900 font-black mb-1">
                    {lang === 'ar' ? 'تنبيه الحساب' : 'Account Notice'}
                  </h3>
                  <p className="text-amber-800/80 font-bold text-sm leading-relaxed">
                    {lang === 'ar' 
                      ? 'حسابك مخصص للقراءة والمشاهدة فقط حالياً. لطلب صلاحيات النشر (آدمن)، يرجى التواصل مع إدارة المنصة.' 
                      : 'Your account is restricted to viewing only. Contact administration to request publishing permissions.'}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite">
                <span className="text-shubuhat-text-3 font-bold flex items-center gap-2 text-sm">
                  <Calendar size={16} /> {lang === 'ar' ? 'تاريخ الانضمام' : 'Joined Date'}
                </span>
                <span className="text-shubuhat-green font-black text-sm">
                  {new Date(user.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-shubuhat-green-ghost rounded-2xl border border-shubuhat-border-lite">
                <span className="text-shubuhat-text-3 font-bold flex items-center gap-2 text-sm">
                  <User size={16} /> {lang === 'ar' ? 'نوع الحساب' : 'Account Type'}
                </span>
                <span className="bg-shubuhat-green/10 text-shubuhat-green px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider">
                  {profile?.role || 'user'}
                </span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-4 text-red-500 font-black border-2 border-red-50 hover:bg-red-50 rounded-2xl transition-all"
            >
              <LogOut size={20} />
              {lang === 'ar' ? 'تسجيل الخروج' : 'Log Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
