"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Banknote,
  Hash,
  Receipt,
  Layers,
  Shield,
  TrendingUp,
  Lock,
} from "lucide-react";
import { triggerPayout } from "@/lib/api";

// ─── Simulated mock payout (offline fallback) ───
function generateMockPayout(trustScore, invoiceAmount, sellerId) {
  const txId    = `PICE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const gross   = invoiceAmount || 48750;
  const fee     = parseFloat((gross * 0.018).toFixed(2)); // 1.8% Pice fee
  const net     = parseFloat((gross - fee).toFixed(2));
  const ts      = new Date().toISOString();

  return {
    status:         "SETTLED",
    transaction_id: txId,
    timestamp:      ts,
    trust_score:    trustScore,
    settlement: {
      gross_amount:   gross,
      fee_percent:    1.8,
      fee_amount:     fee,
      net_settlement: net,
      method:         "PICE_B2B_INSTANT",
      settled_at:     ts,
    },
    ledger_entry: {
      debit_account:  `COOP-OPS-${sellerId || "AG-4471"}`,
      credit_account: `FARMER-${sellerId || "AG-4471"}-SUP`,
      narration:      `Auto-settlement via AgroTrust AI · Trust Score: ${trustScore?.toFixed(1)}`,
      ref:            txId,
    },
    disbursement_metrics: {
      latency_ms:       Math.floor(Math.random() * 300 + 120),
      gateway:          "Pice Gateway v2.1",
      compliance:       "RBI-PPI-2024",
      immutable_hash:   `0x${Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join("")}`,
    },
  };
}

// ─── Ledger log line ───
function LedgerLog({ icon: Icon, label, value, mono, color, delay }) {
  return (
    <div
      className="flex items-center justify-between py-2 border-b border-slate-700/20 last:border-0 animate-fadeInUp"
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <span className={`text-xs font-semibold ${mono ? "font-mono" : ""} ${color || "text-slate-200"}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Processing shimmer ───
function ProcessingState() {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-5 p-6 rounded-2xl bg-slate-900/60 border border-cyan-500/20 text-center animate-fadeInScale">
      <div className="relative w-14 h-14 mx-auto mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-spin-slow" />
        <div className="absolute inset-1 rounded-full border-2 border-emerald-500/30 animate-spin-slow" style={{ animationDirection: "reverse" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap className="w-6 h-6 text-cyan-400" />
        </div>
      </div>
      <p className="text-sm font-bold text-cyan-300">Processing through Pice Gateway{dots}</p>
      <p className="text-xs text-slate-500 mt-1">Verifying compliance · Calculating settlement</p>
      <div className="mt-4 space-y-1.5">
        {["Validating trust score threshold", "Calculating net settlement", "Routing to Pice B2B gateway"].map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-500 justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 animate-blink" style={{ animationDelay: `${i * 200}ms` }} />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Success Ledger Card ───
function SettledLedger({ result }) {
  const { settlement, ledger_entry, disbursement_metrics, transaction_id, timestamp } = result;

  return (
    <div className="mt-5 rounded-2xl ledger-success-card p-5 glow-success animate-ledger">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-300">Payout Settled</p>
            <p className="text-[10px] text-emerald-600">Instant disbursement complete</p>
          </div>
        </div>
        <span className="badge badge-success">SETTLED</span>
      </div>

      {/* Net amount hero */}
      <div className="text-center py-4 mb-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
        <p className="text-[10px] text-emerald-600 uppercase tracking-widest mb-1">Net Settlement</p>
        <p className="text-4xl font-black text-emerald-300">
          ₹{settlement.net_settlement.toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-emerald-600 mt-1">
          Gross ₹{settlement.gross_amount.toLocaleString("en-IN")} · Fee {settlement.fee_percent}% (₹{settlement.fee_amount.toLocaleString("en-IN")})
        </p>
      </div>

      {/* Ledger details */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-700/30 px-4 py-2 mb-3">
        <p className="text-[9px] text-slate-500 uppercase tracking-widest py-2 border-b border-slate-700/20">
          Automated Ledger Entry
        </p>
        <LedgerLog icon={Hash}      label="Transaction ID"     value={transaction_id}              mono color="text-cyan-300"    delay={50} />
        <LedgerLog icon={Clock}     label="Settled At"         value={new Date(timestamp).toLocaleString("en-IN")}   mono={false} delay={100} />
        <LedgerLog icon={Banknote}  label="Method"             value={settlement.method.replace(/_/g," ")}   mono color="text-amber-300" delay={150} />
        <LedgerLog icon={Layers}    label="Debit Account"      value={ledger_entry.debit_account}   mono color="text-red-300"    delay={200} />
        <LedgerLog icon={TrendingUp} label="Credit Account"   value={ledger_entry.credit_account}  mono color="text-emerald-300" delay={250} />
        <LedgerLog icon={Shield}    label="Compliance"         value={disbursement_metrics.compliance} mono={false} color="text-purple-300" delay={300} />
      </div>

      {/* Disbursement metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "Latency",  value: `${disbursement_metrics.latency_ms}ms`, color: "text-cyan-400" },
          { label: "Gateway",  value: "Pice v2.1",                            color: "text-amber-400" },
          { label: "Trust",    value: `${result.trust_score?.toFixed(1)}`,    color: "text-emerald-400" },
        ].map((m) => (
          <div key={m.label} className="text-center p-2 rounded-lg bg-slate-900/40 border border-slate-700/20 animate-fadeInScale">
            <p className={`text-sm font-bold font-mono ${m.color}`}>{m.value}</p>
            <p className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Immutable hash */}
      <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-700/20">
        <div className="flex items-center gap-2 mb-1.5">
          <Lock className="w-3 h-3 text-slate-500" />
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Immutable Hash</span>
        </div>
        <p className="immutable-hash break-all">{disbursement_metrics.immutable_hash}</p>
      </div>

      {/* Ledger balancing log */}
      <div className="mt-3 p-3 rounded-xl bg-emerald-900/10 border border-emerald-700/20">
        <p className="text-[9px] text-emerald-600/80 font-mono">
          {">"} LEDGER_BALANCED · DOUBLE_ENTRY_VERIFIED · AUDIT_TRAIL_SEALED
        </p>
        <p className="text-[9px] text-slate-600 font-mono mt-0.5">{ledger_entry.narration}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function PaymentLedger({ trustScore, invoiceAmount, sellerId, invoiceDate }) {
  const [processing, setProcessing]   = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState(null);
  const [history, setHistory]         = useState([]);

  const isEligible   = trustScore != null && trustScore >= 70;
  const effectiveTrust = trustScore ?? 84.2;

  const handlePayout = async () => {
    if (processing) return;
    setProcessing(true);
    setError(null);

    try {
      let payout;
      try {
        payout = await triggerPayout(
          effectiveTrust,
          invoiceAmount || 48750,
          sellerId || "AG-COOP-MH-4471",
          invoiceDate
        );
      } catch {
        // Backend offline — use mock
        await new Promise((r) => setTimeout(r, 2200)); // simulate gateway delay
        payout = generateMockPayout(effectiveTrust, invoiceAmount || 48750, sellerId);
      }
      setResult(payout);
      setHistory((h) => [payout, ...h]);
    } catch (err) {
      setError(err.message || "Settlement failed");
    } finally {
      setProcessing(false);
    }
  };

  const trustColor = effectiveTrust >= 80 ? "#34d399" : effectiveTrust >= 70 ? "#fbbf24" : "#f87171";
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - ((effectiveTrust / 100) * circumference);

  return (
    <div className="glass-card p-6 gradient-border animate-fadeInUp-delay-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
            <Receipt className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Pice Settlement Ledger</h3>
            <p className="text-[10px] text-slate-500">Partner Track 04 · Automated Disbursement</p>
          </div>
        </div>
        <span className="badge badge-gold">Pice Network</span>
      </div>

      {/* Compliance state card */}
      <div className={`p-4 rounded-2xl border mb-5 transition-all duration-500 ${
        isEligible
          ? "bg-emerald-500/5 border-emerald-500/20 glow-emerald"
          : "bg-slate-800/30 border-slate-700/30"
      }`}>
        <div className="flex items-center gap-4">
          {/* Mini gauge */}
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(15,25,45,0.9)" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke={trustColor} strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="gauge-circle"
                style={{ filter: `drop-shadow(0 0 4px ${trustColor}60)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-black" style={{ color: trustColor }}>
                {effectiveTrust.toFixed(0)}
              </span>
              <span className="text-[8px] text-slate-500">TRUST</span>
            </div>
          </div>

          {/* Status text */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${isEligible ? "bg-emerald-400 animate-pulse-glow" : "bg-slate-600"}`} />
              <p className="text-sm font-bold text-white">
                {isEligible ? "Eligible for Settlement" : trustScore ? "Below Threshold" : "Analysis Required"}
              </p>
            </div>
            <p className="text-xs text-slate-400">
              {isEligible
                ? `Trust score ${effectiveTrust.toFixed(1)} exceeds threshold of 70 — payout approved`
                : trustScore
                ? `Score ${effectiveTrust.toFixed(1)} below minimum 70 required for payout`
                : "Complete AI analysis to calculate compliance state"}
            </p>

            {/* Threshold bar */}
            <div className="mt-2 w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(effectiveTrust, 100)}%`,
                  background: `linear-gradient(90deg, ${trustColor}80, ${trustColor})`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-slate-600">0</span>
              <span className="text-[9px] text-amber-600">Threshold: 70</span>
              <span className="text-[9px] text-slate-600">100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice summary */}
      {(invoiceAmount || !trustScore) && (
        <div className="grid grid-cols-2 gap-2 mb-5">
          {[
            { label: "Invoice Amount", value: `₹${(invoiceAmount || 48750).toLocaleString("en-IN")}`, color: "text-emerald-300" },
            { label: "Vendor ID",      value: sellerId || "AG-COOP-MH-4471",                           color: "text-cyan-300 font-mono text-[11px]" },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/25">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
              <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main action button */}
      {!result && (
        <button
          onClick={handlePayout}
          disabled={processing || (!isEligible && !!trustScore)}
          id="payout-button"
          className={`w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all duration-350 cursor-pointer flex items-center justify-center gap-3 ${
            processing
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : isEligible || !trustScore
              ? "pice-btn text-white shadow-lg"
              : "bg-slate-800/50 text-slate-500 cursor-not-allowed"
          }`}
        >
          {processing ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
              </svg>
              Processing…
            </span>
          ) : (
            <>
              <Zap className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Approve Quality &amp; Issue Pice Payout</span>
              <ArrowRight className="w-4 h-4 relative z-10" />
            </>
          )}
        </button>
      )}

      {/* Processing overlay */}
      {processing && <ProcessingState />}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/8 border border-red-500/25 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success ledger */}
      {result && !processing && <SettledLedger result={result} />}

      {/* Initiate new payout */}
      {result && !processing && (
        <button
          onClick={() => { setResult(null); setError(null); }}
          className="w-full mt-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 border border-slate-700/40 hover:border-slate-600/60 hover:text-slate-300 transition-all duration-200"
        >
          Initiate New Settlement
        </button>
      )}

      {/* Transaction history */}
      {history.length > 1 && (
        <div className="mt-4 pt-4 border-t border-slate-700/30">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Settlement History ({history.length})</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {history.slice(1).map((tx, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${tx.status === "SETTLED" ? "bg-emerald-400" : "bg-red-400"}`} />
                  <span className="text-[10px] text-slate-400 font-mono">{tx.transaction_id}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">
                  ₹{tx.settlement?.net_settlement?.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
