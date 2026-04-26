"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide the splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f9f7f3]" // Match body background or #ffffff
        >
          {/* Logo Animation */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              damping: 15,
              stiffness: 100,
              delay: 0.2,
            }}
            className="flex flex-col items-center"
          >
            {/* Extremely precise circle mask for the logo to hide the white borders */}
            <motion.div 
                animate={{
                    boxShadow: [
                        "0px 0px 0px rgba(201,166,70,0)",
                        "0px 0px 50px rgba(201,166,70,0.4)",
                        "0px 0px 0px rgba(201,166,70,0)"
                    ]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden shadow-2xl bg-white border-2 border-shubuhat-gold/30 flex items-center justify-center"
            >
              <Image
                src="/logo.jpg"
                alt="Shubuhat Icon"
                fill
                priority
                sizes="(max-width: 768px) 160px, 192px"
                className="object-cover scale-[1.3] md:scale-[1.35] origin-center" // Adjust scale to crop out remaining white edges if any
              />
            </motion.div>
            
            {/* Text pulsing into view */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.8, duration: 0.5 }}
               className="mt-8 text-center"
            >
               <h1 className="text-3xl font-black text-shubuhat-green tracking-tighter uppercase mb-2">SHUBUHAT</h1>
               <div className="w-12 h-1 bg-shubuhat-gold rounded-full mx-auto" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
