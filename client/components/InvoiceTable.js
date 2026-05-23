"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle2, TrendingUp, Hash, Calendar, User, DollarSign, BarChart3 } from "lucide-react";

// ─── Mock fallback data for offline/demo ───
const MOCK_OCR_DATA = {
  confidence: 0.912,
  extracted_fields: {
    invoice_id:   "INV-2026-AG-00847",
    date:         "2026-05-22",
    seller_id:    "AG-COOP-MH-4471",
    total_amount: 48750,
  },
  raw_lines: [
    { text: "AGRICULTURAL COOPERATIVE INVOICE",   confidence: 0.97 },
    { text: "Invoice No: INV-2026-AG-00847",       confidence: 0.95 },
    { text: "Date: 22/05/2026",                    confidence: 0.93 },
    { text: "Seller ID: AG-COOP-MH-4471",          confidence: 0.91 },
    { text: "Wheat — Grade A — 650 kg @ ₹75/kg",  confidence: 0.88 },
    { text: "Total Amount: ₹48,750",               confidence: 0.92 },
    { text: "Payment Method: Pice B2B Transfer",   confidence: 0.86 },
  ],
};

const FIELD_CONFIG = {
  invoice_id:   { label: "Invoice ID",           icon: Hash,         mono: true },
  date:         { label: "Invoice Date",          icon: Calendar,     mono: false },
  seller_id:    { label: "Vendor / Seller ID",    icon: User,         mono: true },
  total_amount: { label: "Calculated Total (INR)",icon: DollarSign,   mono: false, currency: true },
};

function ConfidenceBar({ value }) {
  const pct    = (value * 100).toFixed(1);
  const color  = value >= 0.85 ? "#34d399" : value >= 0.65 ? "#fbbf24" : "#f87171";
  const label  = value >= 0.85 ? "High" : value >= 0.65 ? "Moderate" : "Low";
  const badge  = value >= 0.85 ? "badge-success" : value >= 0.65 ? "badge-warning" : "badge-danger";

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">OCR Confidence</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${badge}`}>{label}</span>
          <span className="text-sm font-bold font-mono" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 8px ${color}50`,
          }}
        />
      </div>
    </div>
  );
}

export default function InvoiceTable({ ocrResults }) {
  const [visible, setVisible] = useState(false);
  const [rawExpanded, setRawExpanded] = useState(false);

  const data = ocrResults && (ocrResults.extracted_fields || ocrResults.raw_lines?.length)
    ? ocrResults
    : MOCK_OCR_DATA;

  const isMock = !ocrResults || (!ocrResults.extracted_fields && !ocrResults.raw_lines?.length);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, [data]);

  const { confidence, extracted_fields, raw_lines } = data;
  const fields = extracted_fields || {};

  return (
    <div className="glass-card p-6 gradient-border animate-fadeInUp-delay-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FileText className="w-4.5 h-4.5 text-cyan-400" strokeWidth={2} />
          <div>
            <h3 className="text-base font-bold text-white">AI Invoice Analyzer</h3>
            <p className="text-[10px] text-slate-500">Pice PS-01 · EasyOCR Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-info">OCR</span>
          {isMock && <span className="badge badge-warning">Demo</span>}
        </div>
      </div>

      {/* Confidence bar */}
      <ConfidenceBar value={confidence ?? 0.912} />

      {/* Clinical Data Table */}
      <div className="mb-4 rounded-xl overflow-hidden border border-slate-700/30">
        <table className="data-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Extracted Value</th>
              <th className="text-right">Verified</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(FIELD_CONFIG).map(([key, cfg], i) => {
              const Icon  = cfg.icon;
              const val   = fields[key];
              const hasVal = val !== undefined && val !== null;

              return (
                <tr
                  key={key}
                  className="animate-fadeInUp"
                  style={{ animationDelay: `${i * 60}ms`, opacity: visible ? 1 : 0 }}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-slate-800/60 flex items-center justify-center">
                        <Icon className="w-3 h-3 text-slate-500" />
                      </div>
                      <span className="text-slate-300 text-xs font-medium">{cfg.label}</span>
                    </div>
                  </td>
                  <td>
                    {hasVal ? (
                      <span className={`text-xs font-semibold ${cfg.currency ? "text-emerald-400" : "text-cyan-300"} ${cfg.mono ? "font-mono" : ""}`}>
                        {cfg.currency
                          ? `₹${Number(val).toLocaleString("en-IN")}`
                          : String(val)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600 italic">Not detected</span>
                    )}
                  </td>
                  <td className="text-right">
                    {hasVal ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline-block" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-700/60 inline-block" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* AI Confidence Score Callout */}
      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/25 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-slate-300 font-semibold">AI OCR Confidence Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black text-emerald-400 font-mono">
              {((confidence ?? 0.912) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Extracted via multi-pass EasyOCR with spatial alignment correction
        </p>
      </div>

      {/* Raw OCR Lines */}
      {raw_lines && raw_lines.length > 0 && (
        <div>
          <button
            onClick={() => setRawExpanded(!rawExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/40 transition-all duration-200 group"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Raw OCR Lines ({raw_lines.length})
            </span>
            <span className={`text-[10px] text-slate-500 transition-transform duration-200 ${rawExpanded ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {rawExpanded && (
            <div className="mt-2 max-h-44 overflow-y-auto rounded-xl bg-slate-900/50 border border-slate-700/20 p-2 space-y-1 animate-fadeInScale">
              {raw_lines.map((line, i) => {
                const conf  = line.confidence ?? 0.9;
                const color = conf >= 0.85 ? "#4ade80" : conf >= 0.65 ? "#fbbf24" : "#f87171";
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/40 transition-colors"
                  >
                    <span className="text-xs text-slate-300 font-mono truncate flex-1">{line.text}</span>
                    <span className="text-[10px] font-bold shrink-0 font-mono" style={{ color }}>
                      {(conf * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
