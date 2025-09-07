"use client";
import { motion } from "framer-motion";
import Button from "./components/Button";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="min-h-screen px-6 text-center flex flex-col"
    >
      {/* Content Container */}
      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 bg-gradient-to-br from-purple-600 via-pink-500 to-fuchsia-500 rounded-2xl sm:rounded-3xl md:rounded-[2rem] flex items-center justify-center drop-shadow-2xl hover:scale-105 transition-all duration-300 hover:shadow-purple-500/25 hover:shadow-2xl">
              <Package className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-white" />
            </div>
          </motion.div>
          {/*
          <motion.h1
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-mono text-3xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold 
                       bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-500 
                       bg-clip-text text-transparent animate-gradient-x"
          >
            IMS
          </motion.h1>
          */}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="text-sm sm:text-base md:text-lg lg:text-xl text-[#a855f7]/90 leading-relaxed max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mb-6 sm:mb-8 px-4"
        >
          Your all-in-one inventory management system to keep everything
          organized, simple, and scalable.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-xs sm:max-w-sm md:max-w-md"
        >
          <Button 
            text="Login" 
            color="#ffffff" 
            textColor="#ec4899" 
            glowColor="#a855f7" 
            rippleColor="rgba(255,255,255,0.3)" 
            onClick={() => router.push("/login")}
          />

          <Button 
            text="Signup" 
            color="#ffffff" 
            textColor="#a855f7" 
            glowColor="#ec4899" 
            rippleColor="rgba(0,0,0,0.2)" 
            onClick={() => router.push('/signup')}
          />
        </motion.div>
      </div>

      {/* Footer - Always at bottom, never overlaps */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="py-4 mt-auto"
      >
        {/*
        <p className="text-sm text-gray-500">
          @Powered By Cybitrix Systems
        </p>*/}
      </motion.div>
    </motion.main>
  );
}
