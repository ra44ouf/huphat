"use client";

import { useState } from "react";
import { login } from './actions'
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useApp } from "@/components/providers";
import { translations } from "@/lib/translations";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { lang } = useApp();
  const t = translations[lang].auth;

  return (
    <main className="min-h-screen bg-shubuhat-green flex flex-col font-sans overflow-x-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
             animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
             transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
             className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-shubuhat-gold blur-[100px]"
          />
          <motion.div 
             animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
             transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
             className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#004d40] blur-[120px]"
          />
      </div>

      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10 w-full max-w-6xl mx-auto my-6 md:my-10">
          <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] md:rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row min-h-[600px] md:min-h-[650px] mt-10 md:mt-0"
          >
              {/* Left Side: Branding / Welcome */}
              <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center relative overflow-hidden text-center md:text-start bg-black/20 md:border-l border-white/10 border-b md:border-b-0">
                 <motion.div 
                    initial={{ x: lang === 'ar' ? 30 : -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="relative z-10"
                 >
                     <div className="w-16 h-16 md:w-20 md:h-20 mb-6 md:mb-8 mx-auto md:mx-0 bg-white/10 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-white/10 shadow-inner backdrop-blur-lg flex items-center justify-center">
                         <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden bg-white">
                             <Image src="/logo.jpg" alt="Logo" fill className="object-cover scale-[1.3]" />
                         </div>
                     </div>
                     <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 text-white leading-tight">
                         {t.welcomeBack} <br className="hidden md:block"/>
                         <span className="text-shubuhat-gold">{t.welcomeBackAccent}</span>
                     </h2>
                     <p className="text-white/60 font-medium text-base md:text-lg mb-8 md:mb-10 max-w-sm mx-auto md:mx-0">
                         {t.welcomeBackDesc}
                     </p>
                     <Link href="/register" className="inline-flex items-center justify-center gap-3 w-full md:w-auto bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-2xl font-black text-white hover:text-shubuhat-gold transition-all text-sm tracking-widest active:scale-95 group">
                         {t.createAccount}
                         {lang === 'ar' ? <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> : <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                     </Link>
                 </motion.div>
              </div>

              {/* Right Side: Login Form */}
              <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white/5 relative z-10">
                 <motion.div 
                    initial={{ x: lang === 'ar' ? -30 : 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="max-w-sm mx-auto w-full"
                 >
                     <div className="mb-10 text-center md:text-start">
                         <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{t.loginTitle}</h1>
                         <p className="text-white/50 font-bold text-sm">{t.loginSub}</p>
                     </div>

                     <form className="space-y-5 md:space-y-6" onSubmit={async (e) => {
                         e.preventDefault();
                         const formData = new FormData(e.currentTarget);
                         const email = formData.get('email') as string;
                         const password = formData.get('password') as string;
                         
                         const supabase = createClient();
                         const { error } = await supabase.auth.signInWithPassword({ email, password });
                         if (error) {
                             alert(lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid login credentials');
                         } else {
                             window.location.href = '/dashboard';
                         }
                     }}>
                         <motion.div 
                             initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                             className="group"
                         >
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
                                     className={`w-full py-4 md:py-4.5 rounded-2xl bg-white/5 border border-white/10 focus:border-shubuhat-gold/50 focus:bg-white/10 transition-all font-bold text-white placeholder:text-white/30 outline-none backdrop-blur-md text-right md:text-left ${lang === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6 text-left mr-auto'}`}
                                 />
                             </div>
                         </motion.div>

                         <motion.div 
                             initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
                             className="group"
                         >
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
                                     className={`w-full py-4 md:py-4.5 rounded-2xl bg-white/5 border border-white/10 focus:border-shubuhat-gold/50 focus:bg-white/10 transition-all font-bold text-white placeholder:text-white/30 outline-none backdrop-blur-md text-right md:text-left ${lang === 'ar' ? 'pr-14 pl-14' : 'pl-14 pr-14 text-left mr-auto'}`}
                                 />
                                 <button 
                                     type="button"
                                     onClick={() => setShowPassword(!showPassword)}
                                     className={`absolute inset-y-0 ${lang === 'ar' ? 'left-5' : 'right-5'} flex items-center text-white/30 hover:text-white transition-colors`}
                                 >
                                     {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                 </button>
                             </div>
                         </motion.div>

                         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className={`flex ${lang === 'ar' ? 'justify-end' : 'justify-end'} px-2`}>
                             <Link href="#" className="text-[11px] font-black text-white/40 hover:text-white transition-colors hover:underline underline-offset-4 tracking-widest">
                                 {t.forgotPassword}
                             </Link>
                         </motion.div>

                         <motion.button 
                             initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }}
                             whileHover={{ scale: 1.02 }}
                             whileTap={{ scale: 0.98 }}
                             type="submit"
                             className="w-full bg-shubuhat-gold text-shubuhat-green py-4 md:py-5 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(201,165,108,0.2)] hover:shadow-[0_0_30px_rgba(201,165,108,0.4)] mt-2 md:mt-4 flex items-center justify-center gap-2 tracking-widest"
                         >
                             {t.loginBtn}
                             {lang === 'ar' ? <ArrowLeft size={18} className="translate-y-[1px]" /> : <ArrowRight size={18} className="translate-y-[1px]" />}
                         </motion.button>
                     </form>
                 </motion.div>
              </div>
          </motion.div>
      </div>

      <Footer />
    </main>
  )
}
