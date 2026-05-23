"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SecureUpload from "@/components/SecureUpload";
import ImageAnalysis from "@/components/ImageAnalysis";
import InvoiceTable from "@/components/InvoiceTable";
import TrustScore from "@/components/TrustScore";
import PaymentLedger from "@/components/PaymentLedger";
import {
  Upload,
  Lock,
  Cpu,
  BarChart3,
  BadgeDollarSign,
  CheckCircle2,
  Circle,
  Leaf,
  Globe,
  Shield,
  Database,
} from "lucide-react";

// ─── Pipeline Steps ───
const PIPELINE_STEPS = [
  { key: "upload",   label: "Upload",       icon: Upload,          desc: "File selected" },
  { key: "exif",     label: "EXIF Strip",   icon: Shield,          desc: "GPS removed" },
  { key: "encrypt",  label: "AES-256",      icon: Lock,            desc: "Token encrypted" },
  { key: "analyze",  label: "Dual AI",      icon: Cpu,             desc: "YOLOv8 + OCR" },
  { key: "trust",    label: "Trust Score",  icon: BarChart3,       desc: "Composite score" },
  { key: "settle",   label: "Settlement",   icon: BadgeDollarSign, desc: "Pice payout" },
];

// ─── SDG Impact Metric ───
function SDGMetric({ sdg, title, icon, color, value, desc }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${color} bg-opacity-5`}>
      <span className="text-xl">{icon}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold tracking-widest uppercase opacity-70">{sdg}</span>
          <span className="text-[10px] font-bold text-white">{title}</span>
        </div>
        <p className="text-[10px] opacity-60 truncate">{desc}</p>
      </div>
      <div className="ml-auto shrink-0 text-right">
        <p className="text-sm font-black">{value}</p>
        <p className="text-[9px] opacity-50">impact</p>
      </div>
    </div>
  );
}

// ─── Pipeline progress bar ───
function PipelineBar({ analysisResults, hasTrust, hasSettlement }) {
  const stepStatus = {
    upload:  !!analysisResults ? "done" : "active",
    exif:    !!analysisResults ? "done" : "idle",
    encrypt: !!analysisResults ? "done" : "idle",
    analyze: !!analysisResults ? "done" : "idle",
    trust:   hasTrust          ? "done" : !!analysisResults ? "active" : "idle",
    settle:  hasSettlement     ? "done" : hasTrust ? "active" : "idle",
  };

  return (
    <div className="glass-card px-5 py-4 mb-7 animate-fadeInUp">
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {PIPELINE_STEPS.map((step, i) => {
          const Icon   = step.icon;
          const status = stepStatus[step.key];
          return (
            <div key={step.key} className="flex items-center gap-1 shrink-0">
              <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    status === "done"
                      ? "pipeline-step-done shadow-[0_0_10px_rgba(52,211,153,0.25)]"
                      : status === "active"
                      ? "pipeline-step-active"
                      : "pipeline-step-idle"
                  }`}
                >
                  {status === "done" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Icon className={`w-4 h-4 transition-colors ${
                      status === "active" ? "text-cyan-400" : "text-slate-600"
                    }`} />
                  )}
                </div>
                <div className="text-center">
                  <p className={`text-[9px] font-bold uppercase tracking-wide ${
                    status === "done" ? "text-emerald-400" :
                    status === "active" ? "text-cyan-400" : "text-slate-600"
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-[8px] text-slate-600">{step.desc}</p>
                </div>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className={`w-6 h-px mb-5 transition-colors duration-500 ${
                  stepStatus[PIPELINE_STEPS[i + 1].key] !== "idle" || status === "done"
                    ? "bg-emerald-500/40"
                    : "bg-slate-700/40"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───
export default function DashboardPage() {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [sessionStats, setSessionStats]       = useState({ uploads: 0, graded: 0, settled: 0 });

  const handleAnalysisComplete = (results) => {
    setAnalysisResults(results);
    setSessionStats((s) => ({
      ...s,
      uploads: s.uploads + 1,
      graded: s.graded + (results?.crop_analysis ? 1 : 0),
    }));
  };

  const cropAnalysis  = analysisResults?.crop_analysis;
  const ocrResults    = analysisResults?.ocr_results;
  const trustScore    = analysisResults?.trust_score;

  const invoiceAmount = ocrResults?.extracted_fields?.total_amount || 0;
  const sellerId      = ocrResults?.extracted_fields?.seller_id    || "AG-DEMO";
  const invoiceDate   = ocrResults?.extracted_fields?.date         || null;

  return (
    <>
      <Navbar />

      {/* Background atmospheric effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-purple-500/4 rounded-full blur-[100px]" />
      </div>

      <main className="relative flex-1 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* ── Dashboard Header ── */}
          <div className="mb-7 animate-fadeInUp">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    AgroTrust AI · Cooperative Manager Portal
                  </span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                  Analysis{" "}
                  <span className="gradient-text">Dashboard</span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Dual-AI crop grading · Invoice OCR · Automated Pice settlement
                </p>
              </div>

              {/* Session stats */}
              <div className="flex items-center gap-3">
                {[
                  { label: "Uploads",  value: sessionStats.uploads,  color: "text-slate-300" },
                  { label: "Graded",   value: sessionStats.graded,   color: "text-emerald-400" },
                  { label: "Settled",  value: sessionStats.settled,  color: "text-amber-400" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-700/30">
                    <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SDG Alignment Banner ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7 animate-fadeInUp-delay-1">
            <SDGMetric
              sdg="SDG 1"
              title="No Poverty"
              icon="🌍"
              color="border-emerald-500/20 text-emerald-400"
              value="2.3B+"
              desc="Smallholder farmers enabled by fair pricing"
            />
            <SDGMetric
              sdg="SDG 2"
              title="Zero Hunger"
              icon="🌾"
              color="border-cyan-500/20 text-cyan-400"
              value="40%↓"
              desc="Post-harvest waste reduction via quality grading"
            />
          </div>

          {/* ── Pipeline Status Bar ── */}
          <PipelineBar
            analysisResults={analysisResults}
            hasTrust={!!trustScore}
            hasSettlement={false}
          />

          {/* ── Main Split-Screen Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ─ LEFT: Upload + Crop Analysis ─ */}
            <div className="space-y-6">
              <SecureUpload
                onAnalysisComplete={handleAnalysisComplete}
                analysisType="both"
              />
              <ImageAnalysis
                annotatedImage={cropAnalysis?.annotated_image}
                detections={cropAnalysis?.detections || []}
                qualityScore={cropAnalysis?.quality_score}
              />
            </div>

            {/* ─ RIGHT: Trust Score + Invoice + Payment ─ */}
            <div className="space-y-6">
              <TrustScore trustScore={trustScore} />
              <InvoiceTable ocrResults={ocrResults} />
              <PaymentLedger
                trustScore={trustScore?.value}
                invoiceAmount={invoiceAmount}
                sellerId={sellerId}
                invoiceDate={invoiceDate}
              />
            </div>
          </div>

          {/* ── Data Lifecycle Footer (post-analysis) ── */}
          {analysisResults && (
            <div className="mt-7 glass-card p-5 animate-ledger">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs text-slate-400">
                      File: <span className="font-mono text-slate-300">{analysisResults.filename}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-xs text-slate-400">
                      Size: <span className="font-mono text-slate-300">
                        {(analysisResults.file_size_bytes / 1024).toFixed(1)} KB
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-xs text-slate-400">
                      Mode: <span className="font-mono text-slate-300">{analysisResults.analysis_type}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-success animate-pulse-glow">
                    🧹 Memory cleaned — zero disk footprint
                  </span>
                  <span className="badge badge-info">In-Memory Only</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Zero-Trust Data Pipeline explanation ── */}
          <div className="mt-7 glass-card p-6 animate-fadeInUp-delay-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Zero-Trust Data Pipeline</h3>
              <span className="badge badge-purple ml-auto">Pillar 4 · Privacy</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { phase: "Ingestion",  tool: "Canvas API",  env: "Browser",   purpose: "Strip GPS metadata",    icon: "📥", color: "emerald" },
                { phase: "Transit",    tool: "CryptoJS",    env: "Network",    purpose: "AES-256 encryption",    icon: "🔄", color: "cyan" },
                { phase: "Inference",  tool: "BytesIO",     env: "RAM Only",   purpose: "In-memory processing",  icon: "🧠", color: "purple" },
                { phase: "Cleanup",    tool: "Python GC",   env: "Server",     purpose: "Memory destruction",    icon: "🧹", color: "amber" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/25 hover:border-slate-600/40 hover:bg-slate-800/50 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-[9px] font-mono text-slate-500">{item.env}</span>
                  </div>
                  <p className="text-xs font-bold text-white mb-0.5">{item.phase}</p>
                  <p className="text-[10px] text-slate-500">{item.purpose}</p>
                  <p className="text-[9px] font-mono text-emerald-600 mt-1">{item.tool}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-slate-800/50 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <p className="text-xs text-slate-600">
              © 2026 AgroTrust AI — Privacy-First Agricultural Verification
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-600">
            <Globe className="w-3 h-3" />
            <span>SDG 1 · SDG 2</span>
            <span>·</span>
            <span>Pice Partner Track 04</span>
            <span>·</span>
            <span>Zero-disk Architecture</span>
          </div>
        </div>
      </footer>
    </>
  );
}
