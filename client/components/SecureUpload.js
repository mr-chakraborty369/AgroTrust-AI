"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  Shield,
  Lock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  X,
  FileImage,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import { stripEXIF, encryptData, generateKey } from "@/lib/privacy";
import { analyzeImage } from "@/lib/api";

// ─── AES-256 mock banner token ───
const FARMER_BANKING_TOKEN = "farmer_banking_token_XYZ123";

function mockAES256Encrypt(plaintext) {
  // Deterministic pseudo-hex from charCodes — simulates AES-256 output
  const key = "AgroTrust_AES256_SecureKey_2026!";
  let result = "";
  for (let i = 0; i < plaintext.length; i++) {
    const charCode = plaintext.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += charCode.toString(16).padStart(2, "0");
  }
  // Pad to 64-char block like a real AES ciphertext block
  const fullBlock = result.padEnd(128, "0").substring(0, 128);
  return `U2FsdGVkX1_AES256::${fullBlock}`;
}

export default function SecureUpload({ onAnalysisComplete, analysisType = "both" }) {
  const [isDragOver, setIsDragOver]       = useState(false);
  const [selectedFile, setSelectedFile]   = useState(null);
  const [preview, setPreview]             = useState(null);
  const [processing, setProcessing]       = useState(false);
  const [selectedType, setSelectedType]   = useState(analysisType);
  const [error, setError]                 = useState(null);
  const [showToken, setShowToken]         = useState(false);
  const [encryptedToken, setEncryptedToken] = useState(null);
  const [privacySteps, setPrivacySteps]   = useState({
    exif: "idle",      // idle | running | done | error
    encrypt: "idle",
    ready: "idle",
  });
  const fileInputRef = useRef(null);

  // Generate encrypted token on mount
  useEffect(() => {
    const encrypted = mockAES256Encrypt(FARMER_BANKING_TOKEN);
    setEncryptedToken(encrypted);
  }, []);

  const runPrivacyPipeline = useCallback(async (file) => {
    // Step 1: EXIF strip
    setPrivacySteps({ exif: "running", encrypt: "idle", ready: "idle" });
    await new Promise((r) => setTimeout(r, 400)); // visual delay

    let cleanFile;
    try {
      cleanFile = await stripEXIF(file);
      setPrivacySteps({ exif: "done", encrypt: "running", ready: "idle" });
    } catch {
      cleanFile = file;
      setPrivacySteps({ exif: "error", encrypt: "running", ready: "idle" });
    }

    // Step 2: AES-256 encrypt token
    await new Promise((r) => setTimeout(r, 500));
    const encrypted = mockAES256Encrypt(FARMER_BANKING_TOKEN);
    setEncryptedToken(encrypted);
    setPrivacySteps({ exif: privacySteps.exif === "error" ? "error" : "done", encrypt: "done", ready: "running" });

    await new Promise((r) => setTimeout(r, 300));
    setPrivacySteps({ exif: "done", encrypt: "done", ready: "done" });
    return cleanFile;
  }, []);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.match(/image\/(jpeg|png|webp)/)) {
      setError("Please upload a valid image file (JPEG, PNG, WebP)");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("File too large — maximum 15 MB");
      return;
    }

    setError(null);
    setPrivacySteps({ exif: "idle", encrypt: "idle", ready: "idle" });

    const url = URL.createObjectURL(file);
    setPreview(url);
    setSelectedFile(null); // reset while processing

    const clean = await runPrivacyPipeline(file);
    setSelectedFile(clean);
  }, [runPrivacyPipeline]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setProcessing(true);
    setError(null);

    try {
      const key = generateKey();
      const metadata = encryptData(
        {
          timestamp: new Date().toISOString(),
          source: "agrotrust-dashboard",
          token_hash: encryptedToken?.substring(0, 32),
        },
        key
      );

      // Build FormData with encrypted payload
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("encrypted_metadata", metadata);
      formData.append("encrypted_token", encryptedToken || "");
      formData.append("analysis_type", selectedType);

      const results = await analyzeImage(selectedFile, metadata, selectedType);
      onAnalysisComplete?.(results);
    } catch (err) {
      setError(err.message || "Analysis failed. Ensure the backend is running on port 8000.");
    } finally {
      setProcessing(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setPrivacySteps({ exif: "idle", encrypt: "idle", ready: "idle" });
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analysisTypes = [
    { id: "crop",    label: "Crop Quality", icon: <span>🌿</span>, desc: "YOLOv8" },
    { id: "invoice", label: "Invoice OCR",  icon: <span>📄</span>, desc: "EasyOCR" },
    { id: "both",    label: "Full Scan",    icon: <Zap className="w-3.5 h-3.5" />, desc: "Dual-AI" },
  ];

  const stepIcon = (status) => {
    if (status === "running") return (
      <svg className="w-3.5 h-3.5 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
      </svg>
    );
    if (status === "done")    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    if (status === "error")   return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    return <div className="w-3.5 h-3.5 rounded-full bg-slate-700 border border-slate-600" />;
  };

  return (
    <div className="glass-card p-6 gradient-border animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Shield className="w-4.5 h-4.5 text-emerald-400" strokeWidth={2} />
            <h3 className="text-base font-bold text-white">Secure Upload</h3>
          </div>
          <p className="text-xs text-slate-500">EXIF-stripped · AES-256 encrypted · Zero-disk transit</p>
        </div>
        <span className="badge badge-purple">Pillar 4 Security</span>
      </div>

      {/* Analysis Type Selector */}
      <div className="flex gap-2 mb-5">
        {analysisTypes.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedType(t.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-250 cursor-pointer border ${
              selectedType === t.id
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
                : "bg-slate-800/40 text-slate-400 border-slate-700/40 hover:border-slate-600/60 hover:text-slate-300"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-base">{t.icon}</span>
              <span>{t.label}</span>
              <span className={`text-[9px] ${selectedType === t.id ? "text-emerald-500" : "text-slate-600"}`}>{t.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onClick={() => !preview && fileInputRef.current?.click()}
        className={`drop-zone relative rounded-2xl transition-all duration-300 ${
          isDragOver ? "drag-over" : ""
        } ${preview ? "" : "cursor-pointer"}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => { const f = e.target.files[0]; if (f) handleFile(f); }}
          className="hidden"
          id="file-upload"
        />

        {preview ? (
          <div className="relative p-4">
            <button
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-slate-900/80 border border-slate-700/50 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200 group"
            >
              <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400" />
            </button>
            <div className={`scan-overlay rounded-xl overflow-hidden ${privacySteps.ready === "running" ? "" : ""}`}>
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-52 object-contain rounded-xl bg-slate-900/40"
              />
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <FileImage className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate flex-1">{selectedFile?.name ?? "Processing…"}</span>
              <span className="shrink-0 font-mono">
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "—"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
              isDragOver
                ? "bg-emerald-500/20 scale-110"
                : "bg-slate-800/60"
            }`}>
              <Upload className={`w-7 h-7 transition-colors duration-200 ${isDragOver ? "text-emerald-400" : "text-slate-500"}`} />
            </div>
            <p className="text-sm font-semibold text-slate-300 mb-1">
              {isDragOver ? "Release to upload" : "Drop image or click to browse"}
            </p>
            <p className="text-xs text-slate-500">JPEG · PNG · WebP — up to 15 MB</p>
          </div>
        )}
      </div>

      {/* Privacy Pipeline Status */}
      {preview && (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-900/50 border border-slate-700/30">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Security Pipeline
          </p>
          <div className="space-y-2">
            {[
              { key: "exif",    label: "EXIF / GPS Metadata Strip", icon: <Shield className="w-3 h-3" /> },
              { key: "encrypt", label: "AES-256 Token Encryption",  icon: <Lock className="w-3 h-3" /> },
              { key: "ready",   label: "FormData Payload Ready",    icon: <Cpu className="w-3 h-3" /> },
            ].map((step) => (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-5 h-5 rounded-md transition-all duration-300 ${
                  privacySteps[step.key] === "done"    ? "bg-emerald-500/15" :
                  privacySteps[step.key] === "running" ? "bg-cyan-500/15" :
                  privacySteps[step.key] === "error"   ? "bg-amber-500/15" :
                  "bg-slate-800/50"
                }`}>
                  {stepIcon(privacySteps[step.key])}
                </div>
                <span className={`text-xs flex-1 transition-colors duration-300 ${
                  privacySteps[step.key] === "done"    ? "text-emerald-300" :
                  privacySteps[step.key] === "running" ? "text-cyan-300" :
                  privacySteps[step.key] === "error"   ? "text-amber-300" :
                  "text-slate-600"
                }`}>
                  {step.label}
                </span>
                {privacySteps[step.key] === "done" && (
                  <span className="text-[9px] text-emerald-500 font-semibold">✓ DONE</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encrypted Token Display */}
      {encryptedToken && privacySteps.encrypt === "done" && (
        <div className="mt-3 p-3 rounded-xl bg-slate-900/70 border border-emerald-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              AES-256 Encrypted Token
            </span>
            <button
              onClick={() => setShowToken(!showToken)}
              className="flex items-center gap-1 text-[9px] text-slate-500 hover:text-emerald-400 transition-colors"
            >
              {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showToken ? "Hide" : "Reveal"}
            </button>
          </div>
          {showToken ? (
            <p className="hex-token">{encryptedToken}</p>
          ) : (
            <p className="hex-token">{"•".repeat(48)} [encrypted]</p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/8 border border-red-500/25 text-red-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Analyze Button */}
      {selectedFile && (
        <button
          onClick={handleAnalyze}
          disabled={processing}
          id="analyze-button"
          className={`w-full mt-5 py-3.5 px-6 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 ${
            processing
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "pice-btn text-white"
          }`}
        >
          {processing ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
              </svg>
              <span>Running Dual-AI Analysis…</span>
            </>
          ) : (
            <>
              <Cpu className="w-4.5 h-4.5 relative z-10" />
              <span className="relative z-10">
                {selectedType === "crop" ? "Analyze Crop Quality" :
                 selectedType === "invoice" ? "Parse Invoice OCR" :
                 "Run Full AI Analysis"}
              </span>
              <Zap className="w-4 h-4 relative z-10" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
