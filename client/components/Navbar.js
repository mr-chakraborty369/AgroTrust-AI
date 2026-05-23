"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Leaf,
  Wifi,
  WifiOff,
  Globe,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { checkHealth } from "@/lib/api";

export default function Navbar() {
  const [isConnected, setIsConnected] = useState(null); // null = checking
  const [scrolled, setScrolled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      setChecking(true);
      const res = await checkHealth();
      setIsConnected(res.status !== "offline");
      setChecking(false);
    };
    check();

    // Re-check every 30s
    const interval = setInterval(check, 30000);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);

    return () => {
      clearInterval(interval);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#060d1a]/95 backdrop-blur-2xl shadow-xl shadow-black/30 border-b border-white/5"
          : "bg-[#060d1a]/60 backdrop-blur-xl border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-emerald-500/40">
              <Leaf className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold gradient-text tracking-tight leading-none">
                AgroTrust AI
              </span>
              <span className="text-[9px] text-slate-500 font-medium tracking-widest uppercase leading-none mt-0.5">
                B2B Agri-FinTech Suite
              </span>
            </div>
          </Link>

          {/* Center Nav */}
          <div className="hidden sm:flex items-center gap-1">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all duration-200"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all duration-200"
            >
              Dashboard
            </Link>
          </div>

          {/* Right: SDG Badges + API Status */}
          <div className="flex items-center gap-2">
            {/* SDG Indicators */}
            <div className="hidden md:flex items-center gap-1.5">
              <div className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/8 border border-emerald-500/15 hover:border-emerald-500/30 transition-all duration-200 cursor-default">
                <Globe className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-400 tracking-wide">SDG 1</span>
                <span className="text-[9px] text-slate-500 hidden lg:inline">No Poverty</span>
              </div>
              <div className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/8 border border-cyan-500/15 hover:border-cyan-500/30 transition-all duration-200 cursor-default">
                <Globe className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] font-semibold text-cyan-400 tracking-wide">SDG 2</span>
                <span className="text-[9px] text-slate-500 hidden lg:inline">Zero Hunger</span>
              </div>
            </div>

            <div className="w-px h-6 bg-white/8 hidden md:block" />

            {/* API Connection Status */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${
                checking
                  ? "bg-slate-800/50 border-slate-700/40"
                  : isConnected
                  ? "bg-emerald-500/10 border-emerald-500/25"
                  : "bg-red-500/10 border-red-500/25"
              }`}
            >
              {checking ? (
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-blink" />
              ) : isConnected ? (
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                  <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
                </div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]" />
              )}
              <span className="text-xs font-medium text-slate-300">
                {checking ? "Checking…" : isConnected ? "AI Online" : "Offline"}
              </span>
              {isConnected && !checking && (
                <Wifi className="w-3 h-3 text-emerald-400" />
              )}
              {!isConnected && !checking && (
                <WifiOff className="w-3 h-3 text-red-400" />
              )}
            </div>

            {/* Dashboard CTA */}
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold hover:from-emerald-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
