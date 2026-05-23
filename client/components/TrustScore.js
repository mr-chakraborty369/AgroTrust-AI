"use client";

import { useEffect, useState } from "react";

export default function TrustScore({ trustScore }) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (!trustScore) return;

    // Animate from 0 to target value
    const target = trustScore.value;
    const duration = 1500;
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(eased * target);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [trustScore]);

  if (!trustScore) {
    return (
      <div className="glass-card p-6 gradient-border animate-fadeInUp-delay-2">
        <h3 className="text-lg font-semibold text-white mb-4">Trust Score</h3>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(30,41,59,0.8)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="45" fill="none" stroke="rgba(100,116,139,0.2)" strokeWidth="8"
                strokeDasharray="283" strokeDashoffset="283" strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-slate-600">—</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-4">Awaiting analysis</p>
        </div>
      </div>
    );
  }

  const {
    value,
    quality_component,
    confidence_component,
    quality_weight,
    confidence_weight,
    payment_eligible,
    threshold,
  } = trustScore;

  const getColor = (score) => {
    if (score >= 80) return { stroke: "#34d399", text: "text-emerald-400", bg: "bg-emerald-500" };
    if (score >= 50) return { stroke: "#fbbf24", text: "text-amber-400", bg: "bg-amber-500" };
    return { stroke: "#f87171", text: "text-red-400", bg: "bg-red-500" };
  };

  const color = getColor(value);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (animatedValue / 100) * circumference;

  // Component contributions
  const qualityContribution = (quality_weight * quality_component).toFixed(1);
  const confidenceContribution = (confidence_weight * (confidence_component * 100)).toFixed(1);

  return (
    <div className="glass-card p-6 gradient-border animate-fadeInUp-delay-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Trust Score</h3>
        {payment_eligible !== undefined && (
          <span className={`badge ${payment_eligible ? "badge-success" : "badge-danger"}`}>
            {payment_eligible ? "✓ Eligible" : "✗ Ineligible"}
          </span>
        )}
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center py-4">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke="rgba(30,41,59,0.8)" strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={color.stroke} strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="gauge-circle"
              style={{
                filter: `drop-shadow(0 0 6px ${color.stroke}40)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${color.text}`}>
              {animatedValue.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Score</span>
          </div>
        </div>
      </div>

      {/* Formula */}
      <div className="text-center mb-4">
        <p className="text-xs text-slate-500 font-mono">
          S = {quality_weight}×Q + {confidence_weight}×C
        </p>
      </div>

      {/* Breakdown Bars */}
      <div className="space-y-3">
        {/* Quality Component */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">
              Quality (Q = {quality_component.toFixed(1)})
            </span>
            <span className="text-xs font-medium text-emerald-400">
              +{qualityContribution}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
              style={{ width: `${quality_component}%` }}
            />
          </div>
        </div>

        {/* Confidence Component */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">
              Confidence (C = {(confidence_component * 100).toFixed(1)}%)
            </span>
            <span className="text-xs font-medium text-cyan-400">
              +{confidenceContribution}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-1000"
              style={{ width: `${confidence_component * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Threshold line */}
      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Payment Threshold</span>
          <span className="text-xs font-mono text-slate-400">≥ {threshold}</span>
        </div>
      </div>
    </div>
  );
}
