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
      // Login successful
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/products');
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert('An error occurred during login');
  }

  setLoading(false);
};

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
    >
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="font-mono text-[7rem] font-extrabold mb-6 bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent"
      >
        Login
      </motion.h1>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="bg-white/80 backdrop-blur-md shadow-lg rounded-2xl p-8 w-full max-w-md flex flex-col gap-6"
      >
        <div className="text-left">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="text-left">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
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

      <p className="mt-6 text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="text-pink-500 hover:underline">
          Signup
        </a>
      </p>
    </motion.main>
  );
}
