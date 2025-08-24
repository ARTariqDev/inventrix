"use client";
import { motion } from "framer-motion";
import Button from "./components/Button";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
    >
      {/* Title with animated gradient */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="font-mono text-[12rem] font-extrabold mb-[-2rem] 
                   bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-500 
                   bg-clip-text text-transparent animate-gradient-x"
      >
        Inventrix
      </motion.h1>

      {/* Subtitle */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="text-xl sm:text-2xl text-[#a855f7]/90 leading-relaxed max-w-2xl mb-12"
      >
        Your all-in-one inventory management system to keep everything
        organized, simple, and scalable.
      </motion.h2>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-sm"
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
    </motion.main>
  );
}
