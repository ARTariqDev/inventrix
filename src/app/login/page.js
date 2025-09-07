"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/Button";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/stats');
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert('An error occurred during login');
  }

  setLoading(false);
};

  return (
    <div className="min-h-screen px-6 text-center flex flex-col">
      {/* Content Container */}
      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-mono text-xl font-extrabold mb-3 text-center bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent"
        >
          Login
        </motion.h1>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="bg-white/80 backdrop-blur-md shadow-lg rounded-xl p-3 w-full max-w-xs flex flex-col gap-2"
        >
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <Button
            text={loading ? "Logging in..." : "Login"}
            color="#ffffff"
            textColor="#a855f7"
            glowColor="#ec4899"
            rippleColor="rgba(255,255,255,0.2)"
            disabled={loading}
          />
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="mt-2 text-xs text-gray-600 text-center"
        >
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-pink-500 hover:underline">
            Signup
          </a>
        </motion.p>
      </div>

      {/* Footer - Always at bottom, never overlaps */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.5 }}
        className="py-4 mt-auto"
      >
        {/*
        <p className="text-xs text-gray-500">
          @Powered By Cybitrix Systems
        </p>
        */}
      </motion.div>
    </div>
  );
}
