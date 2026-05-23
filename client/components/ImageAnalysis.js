"use client";

import { useEffect, useRef, useState } from "react";
import { ScanSearch, AlertCircle, CheckCircle, Minus } from "lucide-react";

// Mock bounding box data for demo when backend provides no annotations
const MOCK_DETECTIONS = [
  { label: "blemish",    confidence: 0.84, x: 15, y: 20, w: 25, h: 22, color: "#f87171" },
  { label: "good",       confidence: 0.91, x: 55, y: 40, w: 30, h: 35, color: "#4ade80" },
  { label: "overripe",   confidence: 0.67, x: 68, y: 12, w: 20, h: 18, color: "#fbbf24" },
  { label: "underripe",  confidence: 0.73, x: 10, y: 55, w: 18, h: 20, color: "#60a5fa" },
];

function gradeFromScore(score) {
  if (score >= 88) return { grade: "A+", color: "#34d399", bg: "rgba(52,211,153,0.12)", label: "Premium" };
  if (score >= 75) return { grade: "A",  color: "#4ade80", bg: "rgba(74,222,128,0.10)", label: "Excellent" };
  if (score >= 60) return { grade: "B",  color: "#fbbf24", bg: "rgba(251,191,36,0.10)", label: "Good" };
  if (score >= 45) return { grade: "C",  color: "#fb923c", bg: "rgba(251,146,60,0.10)", label: "Fair" };
  return               { grade: "D",  color: "#f87171", bg: "rgba(248,113,113,0.10)", label: "Poor" };
}

function DetectionBadge({ det, index }) {
  const colorMap = {
    good:       { bg: "rgba(74,222,128,0.12)",  text: "#4ade80",  border: "rgba(74,222,128,0.3)" },
    blemish:    { bg: "rgba(248,113,113,0.12)", text: "#f87171",  border: "rgba(248,113,113,0.3)" },
    overripe:   { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24",  border: "rgba(251,191,36,0.3)" },
    underripe:  { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa",  border: "rgba(96,165,250,0.3)" },
    sizing_ref: { bg: "rgba(192,132,252,0.12)", text: "#c084fc",  border: "rgba(192,132,252,0.3)" },
  };
  const c = colorMap[det.label] || colorMap.sizing_ref;
  const icon = det.label === "good" ? <CheckCircle className="w-3 h-3" /> :
               det.label === "blemish" ? <AlertCircle className="w-3 h-3" /> :
               <Minus className="w-3 h-3" />;

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold animate-fadeInUp"
      style={{
        background: c.bg,
        color: c.text,
        borderColor: c.border,
        animationDelay: `${index * 80}ms`,
        opacity: 0,
      }}
    >
      {icon}
      <span className="capitalize">{det.label.replace("_", " ")}</span>
      <span
        className="px-1.5 py-0.5 rounded-md text-[9px] font-bold"
        style={{ background: "rgba(0,0,0,0.25)" }}
      >
        {(det.confidence * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export default function ImageAnalysis({ annotatedImage, detections = [], qualityScore }) {
  const canvasRef = useRef(null);
  const imgRef    = useRef(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [imgLoaded, setImgLoaded]         = useState(false);
  const [showBoxes, setShowBoxes]         = useState(true);

  const effectiveDetections = detections.length > 0 ? detections : (annotatedImage ? [] : MOCK_DETECTIONS);
  const effectiveScore      = qualityScore ?? 84.2;
  const gradeInfo           = gradeFromScore(effectiveScore);
  const hasMockData         = !annotatedImage && detections.length === 0;

  // Animate score counter
  useEffect(() => {
    const target   = effectiveScore;
    const duration = 1800;
    const start    = performance.now();

    const tick = (now) => {
      const t       = Math.min((now - start) / duration, 1);
      const eased   = 1 - Math.pow(1 - t, 4);
      setAnimatedScore(eased * target);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [effectiveScore]);

  // Draw bounding boxes on canvas overlay
  useEffect(() => {
    if (!canvasRef.current || !imgRef.current || !imgLoaded || !showBoxes) return;

    const canvas = canvasRef.current;
    const img    = imgRef.current;
    const ctx    = canvas.getContext("2d");

    canvas.width  = img.offsetWidth;
    canvas.height = img.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const boxes = detections.length > 0
      ? detections.map((d) => ({
          ...d,
          x: (d.bbox?.[0] / 100) * canvas.width  || 0,
          y: (d.bbox?.[1] / 100) * canvas.height || 0,
          w: (d.bbox?.[2] / 100) * canvas.width  || 80,
          h: (d.bbox?.[3] / 100) * canvas.height || 60,
        }))
      : MOCK_DETECTIONS.map((d) => ({
          ...d,
          x: (d.x / 100) * canvas.width,
          y: (d.y / 100) * canvas.height,
          w: (d.w / 100) * canvas.width,
          h: (d.h / 100) * canvas.height,
        }));

    boxes.forEach((box, idx) => {
      setTimeout(() => {
        if (!ctx) return;
        const color = box.color || "#34d399";

        // Glow shadow
        ctx.shadowColor  = color;
        ctx.shadowBlur   = 8;
        ctx.strokeStyle  = color;
        ctx.lineWidth    = 2;
        ctx.strokeRect(box.x, box.y, box.w, box.h);

        // Corner accents
        ctx.shadowBlur = 0;
        const cs = 10;
        [
          [box.x, box.y], [box.x + box.w - cs, box.y],
          [box.x, box.y + box.h - cs], [box.x + box.w - cs, box.y + box.h - cs],
        ].forEach(([cx, cy]) => {
          ctx.strokeStyle = color;
          ctx.lineWidth   = 3;
          ctx.shadowColor = color;
          ctx.shadowBlur  = 12;
          ctx.strokeRect(cx, cy, cs, cs);
        });
        ctx.shadowBlur = 0;

        // Label pill
        const label     = `${box.label} ${((box.confidence || 0) * 100).toFixed(0)}%`;
        const fontSize  = 11;
        ctx.font        = `bold ${fontSize}px monospace`;
        const tw        = ctx.measureText(label).width + 10;
        const lx        = box.x;
        const ly        = box.y > 22 ? box.y - 22 : box.y + box.h + 4;

        ctx.fillStyle   = color + "cc";
        ctx.beginPath();
        ctx.roundRect(lx, ly, tw, 18, 4);
        ctx.fill();

        ctx.fillStyle   = "#0a0f1a";
        ctx.fillText(label, lx + 5, ly + 13);
      }, idx * 120);
    });
  }, [imgLoaded, detections, showBoxes, annotatedImage]);

  // Empty state
  if (!annotatedImage && detections.length === 0 && !hasMockData) {
    return (
      <div className="glass-card p-6 gradient-border animate-fadeInUp-delay-1">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <ScanSearch className="w-4.5 h-4.5 text-emerald-400" />
          Crop Grading Visualizer
        </h3>
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/40 flex items-center justify-center mb-4">
            <ScanSearch className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Upload a crop image to see AI grading</p>
          <p className="text-slate-600 text-xs mt-1">YOLOv8 detection with live bounding boxes</p>
        </div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 44;
  const dashOffset    = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="glass-card p-6 gradient-border animate-fadeInUp-delay-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ScanSearch className="w-4.5 h-4.5 text-emerald-400" strokeWidth={2} />
          <h3 className="text-base font-bold text-white">Crop Grading Visualizer</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-purple">YOLOv8</span>
          {hasMockData && (
            <span className="badge badge-warning">Demo Mode</span>
          )}
        </div>
      </div>

      {/* Main content — gauge + image */}
      <div className="flex gap-4 mb-4">
        {/* SVG Gauge — Quality Grade */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Track */}
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(15,25,45,0.9)" strokeWidth="8" />
              {/* Glow */}
              <circle
                cx="50" cy="50" r="44" fill="none"
                stroke={gradeInfo.color} strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="gauge-circle"
                style={{ filter: `drop-shadow(0 0 6px ${gradeInfo.color}60)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black" style={{ color: gradeInfo.color }}>
                {gradeInfo.grade}
              </span>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest">{gradeInfo.label}</span>
            </div>
          </div>
          <div className="mt-1 text-center">
            <p className="text-xs font-bold" style={{ color: gradeInfo.color }}>
              {animatedScore.toFixed(1)}
              <span className="text-slate-500 font-normal">/100</span>
            </p>
            <p className="text-[9px] text-slate-600 uppercase tracking-wider">Quality Score</p>
          </div>
        </div>

        {/* Annotated Image with canvas overlay */}
        <div className="flex-1 relative rounded-xl overflow-hidden bg-slate-900/60 border border-slate-700/30">
          {annotatedImage ? (
            <>
              <img
                ref={imgRef}
                src={`data:image/jpeg;base64,${annotatedImage}`}
                alt="Annotated crop"
                className="w-full h-full object-cover max-h-36"
                onLoad={() => setImgLoaded(true)}
              />
              {showBoxes && (
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              )}
            </>
          ) : (
            <div className="relative w-full h-36">
              {/* Placeholder gradient image with overlaid canvas */}
              <div
                className="w-full h-full"
                style={{
                  background: "linear-gradient(135deg, #0f2d1a 0%, #1a3d2b 30%, #0d2218 60%, #142d1c 100%)",
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <span className="text-6xl">🌾</span>
                </div>
              </div>
              <canvas
                ref={(el) => {
                  canvasRef.current = el;
                  if (el && !imgLoaded) {
                    el.width  = el.offsetWidth  || 300;
                    el.height = el.offsetHeight || 144;
                    setImgLoaded(true);
                  }
                }}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            </div>
          )}

          {/* Overlay toggle */}
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className="absolute bottom-2 right-2 px-2 py-1 rounded-md text-[9px] font-bold bg-slate-900/80 border border-slate-700/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all"
          >
            {showBoxes ? "Hide Boxes" : "Show Boxes"}
          </button>
        </div>
      </div>

      {/* Detection list */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
          Detections ({effectiveDetections.length})
          {hasMockData && <span className="ml-1 text-amber-600">[Simulated]</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          {effectiveDetections.map((det, i) => (
            <DetectionBadge key={i} det={det} index={i} />
          ))}
        </div>
      </div>

      {/* Quality bar breakdown */}
      <div className="mt-4 pt-4 border-t border-slate-700/30 space-y-2.5">
        {[
          { label: "Structural Integrity",  value: Math.min(effectiveScore + 5, 100), color: "#34d399" },
          { label: "Surface Defect Score",  value: Math.max(100 - effectiveScore * 0.4, 30), color: "#22d3ee" },
          { label: "Color Uniformity",      value: effectiveScore * 0.9, color: "#a78bfa" },
        ].map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-slate-500">{bar.label}</span>
              <span className="text-[10px] font-mono font-semibold" style={{ color: bar.color }}>
                {bar.value.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800/70 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1200"
                style={{
                  width: `${bar.value}%`,
                  background: bar.color,
                  boxShadow: `0 0 6px ${bar.color}50`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
