"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { checkHealth } from "@/lib/api";

export default function Navbar() {
  const [isConnected, setIsConnected] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Check backend health
    checkHealth().then((res) => {
      setIsConnected(res.status !== "offline");
    });

    // Scroll listener for glass effect intensity
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-900/90 backdrop-blur-xl shadow-lg shadow-emerald-900/10"
          : "bg-slate-900/50 backdrop-blur-md"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-bold text-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              🌾
            </div>
            <span className="text-xl font-bold gradient-text tracking-tight">
              AgroTrust AI
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors duration-200"
            >
              Dashboard
            </Link>

            {/* Connection Status */}
            <div className="flex items-center gap-2 ml-4 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
              <div
                className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                  isConnected
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                    : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]"
                }`}
              />
              <span className="text-xs font-medium text-slate-400">
                {isConnected ? "AI Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
