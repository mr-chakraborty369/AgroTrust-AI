"use client";

import { useState } from "react";
import { triggerPayout } from "@/lib/api";

export default function PaymentLedger({
  trustScore,
  invoiceAmount,
  sellerId,
  invoiceDate,
}) {
  const [processing, setProcessing] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);

  const handlePayout = async () => {
    if (!trustScore) return;

    setProcessing(true);
    setError(null);

    try {
      const result = await triggerPayout(
        trustScore,
        invoiceAmount || 1000,
        sellerId || "AG-UNKNOWN",
        invoiceDate
      );

      setLatestResult(result);
      setTransactions((prev) => [result, ...prev]);
    } catch (err) {
      setError(err.message || "Payout failed");
    } finally {
      setProcessing(false);
    }
  };

  const isEligible = trustScore && trustScore >= 70;

  return (
    <div className="glass-card p-6 gradient-border animate-fadeInUp-delay-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Payment Ledger</h3>
        <span className="badge badge-info">Pice Network</span>
      </div>

      {/* Payout Trigger */}
      <div className="mb-5 p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-slate-300 font-medium">Settlement Status</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEligible
                ? "Trust score meets threshold — ready for settlement"
                : trustScore
                ? "Trust score below threshold (≥70 required)"
                : "Complete analysis to enable payouts"}
            </p>
          </div>
          <div
            className={`w-3 h-3 rounded-full ${
              isEligible
                ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                : "bg-slate-600"
            }`}
          />
        </div>

        <button
          onClick={handlePayout}
          disabled={processing || !isEligible}
          id="payout-button"
          className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-300 cursor-pointer ${
            processing
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : isEligible
              ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
              : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
          }`}
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing Settlement...
            </span>
          ) : (
            "⚡ Process Pice Payout"
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          ⚠ {error}
        </div>
      )}

      {/* Latest Transaction Result */}
      {latestResult && (
        <div className={`mb-5 rounded-xl border p-4 ${
          latestResult.status === "SETTLED"
            ? "bg-emerald-500/5 border-emerald-500/20"
            : "bg-red-500/5 border-red-500/20"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`badge ${
              latestResult.status === "SETTLED" ? "badge-success" : "badge-danger"
            }`}>
              {latestResult.status}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {latestResult.transaction_id || "—"}
            </span>
          </div>

          {latestResult.settlement && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-slate-800/30">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Gross</p>
                  <p className="text-sm font-medium text-slate-200">
                    ₹{latestResult.settlement.gross_amount?.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/30">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Fee ({latestResult.settlement.fee_percent}%)</p>
                  <p className="text-sm font-medium text-amber-400">
                    -₹{latestResult.settlement.fee_amount?.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/30">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Net Settlement</p>
                  <p className="text-sm font-bold text-emerald-400">
                    ₹{latestResult.settlement.net_settlement?.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/30">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Method</p>
                  <p className="text-xs font-medium text-cyan-400">
                    {latestResult.settlement.method?.replace(/_/g, " ")}
                  </p>
                </div>
              </div>

              {/* Ledger Entry */}
              {latestResult.ledger_entry && (
                <div className="mt-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Ledger Entry</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-red-400 font-mono">{latestResult.ledger_entry.debit_account}</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-emerald-400 font-mono">{latestResult.ledger_entry.credit_account}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{latestResult.ledger_entry.narration}</p>
                </div>
              )}
            </div>
          )}

          {latestResult.eligibility && !latestResult.settlement && (
            <p className="text-sm text-red-300 mt-2">{latestResult.eligibility.reason}</p>
          )}
        </div>
      )}

      {/* Transaction History */}
      {transactions.length > 1 && (
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
            Transaction History ({transactions.length})
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {transactions.slice(1).map((tx, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    tx.status === "SETTLED" ? "bg-emerald-400" : "bg-red-400"
                  }`} />
                  <span className="text-xs text-slate-400 font-mono">
                    {tx.transaction_id || "REJECTED"}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {tx.settlement ? `₹${tx.settlement.net_settlement}` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
