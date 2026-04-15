"use client";

import { useState } from "react";
import { signup } from '@/app/login/actions'
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { Mail, Lock, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-[#f8f9fb] flex flex-col font-sans overflow-x-hidden">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative">
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-5xl w-full bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] relative border border-gray-100"
        >
            
            {/* Left Panel: Form */}
            <div className="md:w-[55%] p-8 md:p-16 flex flex-col justify-center bg-white relative">
                <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="max-w-sm mx-auto w-full"
                >
                    <div className="mb-10">
                        <h1 className="text-4xl font-black text-shubuhat-green mb-3 tracking-tight">إنشاء حساب</h1>
                        <p className="text-shubuhat-text-3 font-bold text-sm">انضم لمنصة شبهات اليوم</p>
                    </div>

                    <form className="space-y-6">
                        <div className="group">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-5 flex items-center text-gray-400">
                                    <UserIcon size={18} />
                                </div>
                                <input 
                                    id="fullName" 
                                    name="fullName" 
                                    type="text" 
                                    placeholder="الاسم الكامل"
                                    required 
                                    className="w-full pl-14 pr-6 py-4.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-shubuhat-green/20 focus:bg-white transition-all font-bold text-shubuhat-green outline-none"
                                />
                            </div>
                        </div>

                        <div className="group">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-5 flex items-center text-gray-400">
                                    <Mail size={18} />
                                </div>
                                <input 
                                    id="email" 
                                    name="email" 
                                    type="email" 
                                    placeholder="البريد الإلكتروني"
                                    required 
                                    className="w-full pl-14 pr-6 py-4.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-shubuhat-green/20 focus:bg-white transition-all font-bold text-shubuhat-green outline-none"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="group">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-5 flex items-center text-gray-400">
                                    <Lock size={18} />
                                </div>
                                <input 
                                    id="password" 
                                    name="password" 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="كلمة المرور"
                                    required 
                                    className="w-full pl-14 pr-14 py-4.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-shubuhat-green/20 focus:bg-white transition-all font-bold text-shubuhat-green outline-none"
                                    dir="ltr"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-5 flex items-center text-gray-400 hover:text-shubuhat-green transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <motion.button 
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            formAction={signup} 
                            className="w-full bg-shubuhat-green text-white py-5 rounded-2xl font-black text-sm transition-all uppercase tracking-[0.2em] mt-4 shadow-xl hover:bg-shubuhat-green-mid"
                        >
                            إنشاء الحساب
                        </motion.button>
                    </form>
                </motion.div>
            </div>

            {/* Right Panel: Welcome (Optimized Gradient) */}
            <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="md:w-[45%] bg-gradient-to-br from-shubuhat-green to-[#004d40] text-white p-12 flex flex-col items-center justify-center text-center relative overflow-hidden"
            >
                <div className="relative z-10">
                    <h2 className="text-4xl font-black mb-4">أهلاً بك!</h2>
                    <p className="text-white/70 font-medium mb-12">لديك حساب بالفعل؟ سجل دخولك الآن وتابع ما بدأته.</p>
                    <Link href="/login" className="inline-block border-2 border-white/30 px-12 py-3.5 rounded-full font-black hover:bg-white hover:text-shubuhat-green transition-all uppercase text-xs tracking-[0.2em] shadow-lg active:scale-95">
                        تسجيل الدخول
                    </Link>
                </div>

                {/* The Organic Curve (SVG Mask) - Flipped & Optimized */}
                <div className="hidden md:block absolute top-0 bottom-0 -left-1 w-24 z-20 pointer-events-none">
                    <svg className="h-full w-full rotate-180" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M100,0 C60,0 60,100 100,100 L100,100 L100,0 Z" fill="white" />
                    </svg>
                </div>
            </motion.div>

        </motion.div>
      </div>

      <Footer />
    </main>
  )
}
