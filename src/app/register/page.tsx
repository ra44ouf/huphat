"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useApp } from "@/components/providers";
import { translations } from "@/lib/translations";
import { createClient } from "@/utils/supabase/client";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { lang } = useApp();
  const t = translations[lang].auth;

  return (
    <main className="min-h-screen bg-shubuhat-green flex flex-col font-sans overflow-x-hidden relative">
      {/* Lightweight gradient background — no blur, no animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-shubuhat-gold/15" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#004d40]/20" />
      </div>

      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10 w-full max-w-6xl mx-auto my-6 md:my-10">
          <div className="w-full bg-white/5 border border-white/10 rounded-[32px] md:rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row min-h-[550px] md:min-h-[600px] mt-10 md:mt-0">
              {/* Left Side: Form */}
               <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white/5 relative z-10 order-2 md:order-1">
                 <div className="max-w-sm mx-auto w-full">
                     <div className="mb-8 text-center md:text-start">
                         <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{t.registerTitle}</h1>
                         <p className="text-white/50 font-bold text-sm">{t.registerSub}</p>
                     </div>

                     <form className="space-y-4 md:space-y-5" onSubmit={async (e) => {
                         e.preventDefault();
                         setError(null);
                         setLoading(true);
                         
                         const formData = new FormData(e.currentTarget);
                         const fullName = formData.get('fullName') as string;
                         const username = (formData.get('username') as string) || '';
                         const email = formData.get('email') as string;
                         const password = formData.get('password') as string;

                         if (!fullName || !email || !password) {
                             setError(lang === 'ar' ? 'جميع الحقول مطلوبة' : 'All fields are required');
                             setLoading(false);
                             return;
                         }
                         
                         try {
                             const supabase = createClient();
                             const { data, error: signUpError } = await supabase.auth.signUp({ 
                                 email, 
                                 password, 
                                 options: { data: { full_name: fullName, username } } 
                             });
                             if (signUpError) {
                                 setError(lang === 'ar' ? 'حدث خطأ أثناء التسجيل: ' + signUpError.message : 'Registration error: ' + signUpError.message);
                                 setLoading(false);
                             } else {
                                 window.location.href = data.session ? '/profile' : '/login';
                             }
                         } catch {
                             setError(lang === 'ar' ? 'حدث خطأ غير متوقع' : 'Unexpected error');
                             setLoading(false);
                         }
                     }}>
                        <div className="group">
                            <div className="relative">
                                <div className={`absolute inset-y-0 ${lang === 'ar' ? 'right-5' : 'left-5'} flex items-center text-white/30 group-focus-within:text-shubuhat-gold transition-colors`}>
                                    <UserIcon size={20} />
                                </div>
                                <input 
                                    id="username" 
                                    name="username" 
                                    type="text" 
                                    placeholder={lang === 'ar' ? 'اسم المستخدم' : 'Username'}
                                    required
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    className={`w-full py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-shubuhat-gold/50 focus:bg-white/10 transition-all font-bold text-white placeholder:text-white/30 outline-none text-right md:text-left ${lang === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6 text-left'}`}
                                />
                            </div>
                        </div>

                         <div className="group">
                             <div className="relative">
                                 <div className={`absolute inset-y-0 ${lang === 'ar' ? 'right-5' : 'left-5'} flex items-center text-white/30 group-focus-within:text-shubuhat-gold transition-colors`}>
                                     <UserIcon size={20} />
                                 </div>
                                 <input 
                                     id="fullName" 
                                     name="fullName" 
                                     type="text" 
                                     placeholder={t.fullName}
                                     required 
                                     className={`w-full py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-shubuhat-gold/50 focus:bg-white/10 transition-all font-bold text-white placeholder:text-white/30 outline-none text-right md:text-left ${lang === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6 text-left'}`}
                                 />
                             </div>
                         </div>

                         <div className="group">
                             <div className="relative">
                                 <div className={`absolute inset-y-0 ${lang === 'ar' ? 'right-5' : 'left-5'} flex items-center text-white/30 group-focus-within:text-shubuhat-gold transition-colors`}>
                                     <Mail size={20} />
                                 </div>
                                 <input 
                                     id="email" 
                                     name="email" 
                                     type="email" 
                                     placeholder={t.email}
                                     required 
                                     dir="ltr"
                                     className={`w-full py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-shubuhat-gold/50 focus:bg-white/10 transition-all font-bold text-white placeholder:text-white/30 outline-none text-right md:text-left ${lang === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6 text-left mr-auto'}`}
                                 />
                             </div>
                         </div>

                         <div className="group">
                             <div className="relative">
                                 <div className={`absolute inset-y-0 ${lang === 'ar' ? 'right-5' : 'left-5'} flex items-center text-white/30 group-focus-within:text-shubuhat-gold transition-colors`}>
                                     <Lock size={20} />
                                 </div>
                                 <input 
                                     id="password" 
                                     name="password" 
                                     type={showPassword ? "text" : "password"} 
                                     placeholder={t.password}
                                     required 
                                     dir="ltr"
                                     className={`w-full py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-shubuhat-gold/50 focus:bg-white/10 transition-all font-bold text-white placeholder:text-white/30 outline-none text-right md:text-left ${lang === 'ar' ? 'pr-14 pl-14' : 'pl-14 pr-14 text-left mr-auto'}`}
                                 />
                                 <button 
                                     type="button"
                                     onClick={() => setShowPassword(!showPassword)}
                                     className={`absolute inset-y-0 ${lang === 'ar' ? 'left-5' : 'right-5'} flex items-center text-white/30 hover:text-white transition-colors`}
                                 >
                                     {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                 </button>
                             </div>
                         </div>

                         {error && (
                             <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold text-center animate-[fadeIn_0.2s_ease-out]">
                                 {error}
                             </div>
                         )}

                         <button 
                             type="submit"
                             disabled={loading}
                             className="w-full bg-shubuhat-gold text-shubuhat-green py-4 md:py-5 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(201,165,108,0.2)] hover:shadow-[0_0_30px_rgba(201,165,108,0.4)] mt-4 md:mt-6 flex items-center justify-center gap-2 tracking-widest disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                         >
                             {loading ? (
                                 <>
                                     <div className="w-4 h-4 border-2 border-shubuhat-green border-t-transparent rounded-full animate-spin" />
                                     {lang === 'ar' ? 'جاري التسجيل...' : 'Registering...'}
                                 </>
                             ) : (
                                 <>
                                     {t.registerBtn}
                                     {lang === 'ar' ? <ArrowLeft size={18} className="translate-y-[1px]" /> : <ArrowRight size={18} className="translate-y-[1px]" />}
                                 </>
                             )}
                         </button>
                     </form>
                 </div>
              </div>

              {/* Right Side: Welcome for Register */}
              <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center relative overflow-hidden text-center md:text-start bg-black/20 md:border-r border-white/10 border-b md:border-b-0 order-1 md:order-2">
                 <div className="relative z-10">
                     <div className="w-16 h-16 md:w-20 md:h-20 mb-6 md:mb-8 mx-auto md:mx-0 bg-white/10 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-white/10 shadow-inner flex items-center justify-center">
                         <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden bg-white">
                             <Image src="/logo.jpg" alt="Logo" fill className="object-cover scale-[1.3]" />
                         </div>
                     </div>
                     <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 text-white leading-tight">
                         {t.welcomeNew} <br className="hidden md:block"/>
                         <span className="text-shubuhat-gold">{t.welcomeNewAccent}</span>
                     </h2>
                     <p className="text-white/60 font-medium text-base md:text-lg mb-8 md:mb-10 max-w-sm mx-auto md:mx-0">
                         {t.welcomeNewDesc}
                     </p>
                     
                     <div className="flex flex-col gap-3 max-w-xs mx-auto md:mx-0">
                         <p className="text-sm font-bold text-white/40">{t.haveAccount}</p>
                         <Link href="/login" className="inline-flex items-center justify-center gap-3 w-full bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-2xl font-black text-white hover:text-shubuhat-gold transition-all text-sm tracking-widest active:scale-95 group">
                             {t.loginNow}
                             {lang === 'ar' ? <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> : <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                         </Link>
                     </div>
                 </div>
              </div>

          </div>
      </div>

      <Footer />
    </main>
  )
}
