"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import SecureUpload from "@/components/SecureUpload";
import ImageAnalysis from "@/components/ImageAnalysis";
import InvoiceTable from "@/components/InvoiceTable";
import TrustScore from "@/components/TrustScore";
import PaymentLedger from "@/components/PaymentLedger";

export default function DashboardPage() {
  const [analysisResults, setAnalysisResults] = useState(null);

  const handleAnalysisComplete = (results) => {
    setAnalysisResults(results);
  };

  // Extract data from results
  const cropAnalysis = analysisResults?.crop_analysis;
  const ocrResults = analysisResults?.ocr_results;
  const trustScore = analysisResults?.trust_score;

  // Extract invoice fields for payment ledger
  const invoiceAmount = ocrResults?.extracted_fields?.total_amount || 0;
  const sellerId = ocrResults?.extracted_fields?.seller_id || "AG-DEMO";
  const invoiceDate = ocrResults?.extracted_fields?.date || null;

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fadeInUp">
            <h1 className="text-3xl font-bold text-white mb-2">
              Analysis <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-sm text-slate-400">
              Upload crop images or invoices for AI-powered verification with zero-trust privacy
            </p>
          </div>

          {/* Pipeline Status Bar */}
          <div className="glass-card p-3 mb-8 animate-fadeInUp">
            <div className="flex items-center gap-4 overflow-x-auto">
              {[
                {
                  label: "Upload",
                  done: !!analysisResults,
                  active: !analysisResults,
                  icon: "📤",
                },
                {
                  label: "EXIF Strip",
                  done: !!analysisResults,
                  active: false,
                  icon: "🔒",
                },
                {
                  label: "AES Encrypt",
                  done: !!analysisResults,
                  active: false,
                  icon: "🔐",
                },
                {
                  label: "AI Analysis",
                  done: !!analysisResults,
                  active: false,
                  icon: "🧠",
                },
                {
                  label: "Trust Score",
                  done: !!trustScore,
                  active: false,
                  icon: "📊",
                },
                {
                  label: "Settlement",
                  done: false,
                  active: !!trustScore?.payment_eligible,
                  icon: "⚡",
                },
              ].map((step, i, arr) => (
                <div key={i} className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-500 ${
                        step.done
                          ? "bg-emerald-500/20 shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                          : step.active
                          ? "bg-cyan-500/20 animate-pulse-glow"
                          : "bg-slate-800/50"
                      }`}
                    >
                      {step.done ? (
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-[11px]">{step.icon}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        step.done
                          ? "text-emerald-400"
                          : step.active
                          ? "text-cyan-400"
                          : "text-slate-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      className={`w-8 h-px ${
                        step.done ? "bg-emerald-500/40" : "bg-slate-700/50"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Grid — Split Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Upload + Image Analysis */}
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

            {/* Right Column: OCR + Trust Score + Payment */}
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

          {/* Data Lifecycle Footer */}
          {analysisResults && (
            <div className="mt-8 glass-card p-4 animate-fadeInUp">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-slate-400">
                      File: {analysisResults.filename}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-xs text-slate-400">
                      Size: {(analysisResults.file_size_bytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-xs text-slate-400">
                      Mode: {analysisResults.analysis_type}
                    </span>
                  </div>
                </div>
                <div className="badge badge-success">
                  🧹 Memory cleaned — zero disk footprint
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
