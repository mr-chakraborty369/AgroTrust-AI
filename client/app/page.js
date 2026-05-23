import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/5 rounded-full blur-[150px]" />
          </div>

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(52,211,153,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.3) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            {/* SDG Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 animate-fadeInUp">
              <span className="text-emerald-400 text-sm font-medium">🌍 SDG 1 & 2 Aligned</span>
              <span className="text-slate-500 text-xs">No Poverty • Zero Hunger</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fadeInUp">
              <span className="text-white">Trust Your </span>
              <span className="gradient-text">Supply Chain</span>
              <br />
              <span className="text-white">With </span>
              <span className="gradient-text">AI Precision</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 animate-fadeInUp-delay-1">
              Privacy-first crop quality analysis and invoice verification.
              Empowering smallholder farmers with transparent AI grading and
              instant payment settlement.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp-delay-2">
              <Link
                href="/dashboard"
                className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98]"
              >
                Launch Dashboard
                <span className="inline-block ml-2 transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <a
                href="#features"
                className="px-8 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 font-semibold text-sm hover:bg-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
              >
                How It Works
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 mt-12 animate-fadeInUp-delay-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                EXIF Stripped
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
                AES-256 Encrypted
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
                In-Memory Only
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Zero-Trust <span className="gradient-text">Data Pipeline</span>
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Every byte is processed in-memory and destroyed after analysis.
                Your data never touches a disk.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: "🔒",
                  title: "EXIF Stripping",
                  desc: "GPS coordinates and device identifiers are removed in-browser before any network request.",
                  color: "from-emerald-500/20 to-emerald-500/5",
                  border: "border-emerald-500/20",
                },
                {
                  icon: "🔐",
                  title: "AES-256 Encryption",
                  desc: "Sensitive financial data is encrypted client-side using industry-standard cryptography.",
                  color: "from-cyan-500/20 to-cyan-500/5",
                  border: "border-cyan-500/20",
                },
                {
                  icon: "🧠",
                  title: "Dual AI Engines",
                  desc: "YOLOv8 for crop quality analysis and EasyOCR for invoice text extraction — all on localhost.",
                  color: "from-purple-500/20 to-purple-500/5",
                  border: "border-purple-500/20",
                },
                {
                  icon: "⚡",
                  title: "Instant Settlement",
                  desc: "Trust scores trigger automated Pice B2B payouts when quality benchmarks are met.",
                  color: "from-amber-500/20 to-amber-500/5",
                  border: "border-amber-500/20",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className={`glass-card p-6 border ${feature.border} hover:scale-[1.02] transition-all duration-300 group`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Lifecycle Section */}
        <section className="py-24 relative border-t border-slate-800/50">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">
                Data Lifecycle <span className="gradient-text">Matrix</span>
              </h2>
              <p className="text-slate-400">
                Complete transparency over how your data is handled at every stage.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  phase: "Ingestion",
                  tool: "Canvas API",
                  env: "Browser",
                  purpose: "Strip GPS metadata",
                  icon: "📥",
                  color: "emerald",
                },
                {
                  phase: "Transit",
                  tool: "CryptoJS",
                  env: "Network",
                  purpose: "AES-256 encryption",
                  icon: "🔄",
                  color: "cyan",
                },
                {
                  phase: "Inference",
                  tool: "BytesIO",
                  env: "RAM Only",
                  purpose: "In-memory processing",
                  icon: "🧠",
                  color: "purple",
                },
                {
                  phase: "Cleanup",
                  tool: "Python GC",
                  env: "Server",
                  purpose: "Memory destruction",
                  icon: "🧹",
                  color: "amber",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="glass-card p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{item.phase}</p>
                    <p className="text-xs text-slate-400">{item.purpose}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-slate-300">{item.tool}</p>
                    <p className="text-[10px] text-slate-500">{item.env}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="glass-card p-12 glow-emerald">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Verify?
              </h2>
              <p className="text-slate-400 mb-8">
                Upload a crop image or invoice to see AI-powered analysis with
                complete privacy protection.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25"
              >
                Open Dashboard →
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800/50 py-8">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
            <p className="text-xs text-slate-600">
              © 2026 AgroTrust AI — Privacy-First Agricultural Verification
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span>SDG 1</span>
              <span>•</span>
              <span>SDG 2</span>
              <span>•</span>
              <span>Pice Partner Track</span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
