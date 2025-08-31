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
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 bg-gradient-to-br from-purple-600 via-pink-500 to-fuchsia-500 rounded-2xl sm:rounded-3xl md:rounded-[2rem] flex items-center justify-center drop-shadow-2xl hover:scale-105 transition-all duration-300 hover:shadow-purple-500/25 hover:shadow-2xl">
            <Package className="w-14 h-14 sm:w-20 sm:h-20 md:w-26 md:h-26 lg:w-32 lg:h-32 text-white" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-mono text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-extrabold 
                     bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-500 
                     bg-clip-text text-transparent animate-gradient-x"
        >
          Inventrix
        </motion.h1>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-[#a855f7]/90 leading-relaxed max-w-xs sm:max-w-md md:max-w-lg lg:max-w-3xl mb-8 sm:mb-10 md:mb-12 px-4"
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

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
      >
        <p className="text-sm text-gray-500">
          @Powered By Cybtrix Systems
        </p>
      </motion.div>
    </motion.main>
  );
}
