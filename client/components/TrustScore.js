"use client";

import { useEffect, useState } from "react";
import { Activity, Info } from "lucide-react";

const MOCK_TRUST = {
  value: 84.2,
  quality_component: 82.5,
  confidence_component: 0.912,
  quality_weight: 0.7,
  confidence_weight: 0.3,
  payment_eligible: true,
  threshold: 70,
};

function getGradeColor(score) {
  if (score >= 85) return { stroke: "#34d399", text: "text-emerald-400", label: "Excellent", ring: "#34d39940" };
  if (score >= 70) return { stroke: "#fbbf24", text: "text-amber-400",   label: "Eligible",  ring: "#fbbf2440" };
  return              { stroke: "#f87171", text: "text-red-400",     label: "At Risk",   ring: "#f8717140" };
}

export default function TrustScore({ trustScore }) {
  const data          = trustScore || MOCK_TRUST;
  const isMock        = !trustScore;
  const [anim, setAnim] = useState(0);

  const {
    value, quality_component, confidence_component,
    quality_weight, confidence_weight,
    payment_eligible, threshold,
  } = data;

  useEffect(() => {
    const target   = value;
    const duration = 1800;
    const start    = performance.now();
    const tick = (now) => {
      const t     = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setAnim(eased * target);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  const color        = getGradeColor(value);
  const circumference = 2 * Math.PI * 44;
  const offset       = circumference - (anim / 100) * circumference;
  const qContrib     = (quality_weight * quality_component).toFixed(1);
  const cContrib     = (confidence_weight * (confidence_component * 100)).toFixed(1);

  return (
    <div className="glass-card p-6 gradient-border animate-fadeInUp-delay-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4.5 h-4.5 text-emerald-400" strokeWidth={2} />
          <h3 className="text-base font-bold text-white">Trust Score</h3>
        </div>
        <div className="flex items-center gap-2">
          {isMock && <span className="badge badge-warning">Demo</span>}
          <span className={`badge ${payment_eligible ? "badge-success" : "badge-danger"}`}>
            {payment_eligible ? "✓ Eligible" : "✗ Ineligible"}
          </span>
        </div>
      </div>

      {/* Gauge */}
      <div className="flex items-center gap-6 mb-5">
        <div className="relative w-32 h-32 shrink-0">
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 rounded-full opacity-20 blur-md"
            style={{ background: color.ring }}
          />
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Track */}
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(10,20,40,0.9)" strokeWidth="9" />
            {/* Threshold marker at 70% */}
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="rgba(245,158,11,0.25)" strokeWidth="2"
              strokeDasharray={`2 ${circumference - 2}`}
              strokeDashoffset={circumference - (70 / 100) * circumference}
              strokeLinecap="round"
            />
            {/* Progress */}
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke={color.stroke} strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="gauge-circle"
              style={{ filter: `drop-shadow(0 0 8px ${color.stroke}60)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${color.text}`}>{anim.toFixed(1)}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Trust</span>
            <span className={`text-[10px] font-semibold ${color.text} mt-0.5`}>{color.label}</span>
          </div>
        </div>

        {/* Formula + scores */}
        <div className="flex-1 space-y-3">
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/25">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Composite Formula</p>
            <p className="text-xs font-mono text-slate-300">
              S = <span className="text-emerald-400">{quality_weight}</span>×Q +{" "}
              <span className="text-cyan-400">{confidence_weight}</span>×C
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/8 border border-emerald-500/15 text-center">
              <p className="text-[9px] text-emerald-600 uppercase tracking-wider">Quality (Q)</p>
              <p className="text-sm font-black text-emerald-400">{quality_component.toFixed(1)}</p>
              <p className="text-[9px] text-emerald-700">+{qContrib} pts</p>
            </div>
            <div className="p-2 rounded-lg bg-cyan-500/8 border border-cyan-500/15 text-center">
              <p className="text-[9px] text-cyan-600 uppercase tracking-wider">Confidence (C)</p>
              <p className="text-sm font-black text-cyan-400">{(confidence_component * 100).toFixed(1)}%</p>
              <p className="text-[9px] text-cyan-700">+{cContrib} pts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Component bars */}
      <div className="space-y-3 mb-4">
        {[
          {
            label: `Quality Component (Q = ${quality_component.toFixed(1)})`,
            value: quality_component,
            color: "#34d399",
            contrib: qContrib,
          },
          {
            label: `Confidence Component (C = ${(confidence_component * 100).toFixed(1)}%)`,
            value: confidence_component * 100,
            color: "#22d3ee",
            contrib: cContrib,
          },
        ].map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between mb-1.5">
              <span className="text-[10px] text-slate-400">{bar.label}</span>
              <span className="text-[10px] font-bold font-mono" style={{ color: bar.color }}>+{bar.contrib}</span>
            </div>
            <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1200 ease-out"
                style={{
                  width: `${bar.value}%`,
                  background: `linear-gradient(90deg, ${bar.color}80, ${bar.color})`,
                  boxShadow: `0 0 6px ${bar.color}40`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Threshold */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Info className="w-3 h-3" />
          <span>Payment threshold</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-amber-500/60" />
          <span className="text-xs font-mono text-amber-500">≥ {threshold}</span>
          {value >= threshold ? (
            <span className="text-[10px] text-emerald-400 font-semibold">✓ Met</span>
          ) : (
            <span className="text-[10px] text-red-400 font-semibold">✗ Not Met</span>
          )}
        </div>
      </div>
    </div>
  );
}
