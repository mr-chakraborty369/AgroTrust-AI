"use client";

export default function ImageAnalysis({ annotatedImage, detections = [], qualityScore }) {
  if (!annotatedImage && detections.length === 0) {
    return (
      <div className="glass-card p-6 gradient-border animate-fadeInUp-delay-1">
        <h3 className="text-lg font-semibold text-white mb-4">Crop Analysis</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">Upload an image to see crop quality analysis</p>
          <p className="text-slate-500 text-xs mt-1">YOLOv8 detections will appear here</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const getDetectionColor = (label) => {
    const colors = {
      good: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      blemish: "bg-red-500/20 text-red-300 border-red-500/30",
      overripe: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      underripe: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      sizing_ref: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    };
    return colors[label] || "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  return (
    <div className="glass-card p-6 gradient-border animate-fadeInUp-delay-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Crop Analysis</h3>
        {qualityScore !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Quality</span>
            <span className={`text-2xl font-bold ${getScoreColor(qualityScore)}`}>
              {qualityScore.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Annotated Image */}
      {annotatedImage && (
        <div className="relative rounded-xl overflow-hidden mb-4 bg-slate-900/50">
          <img
            src={`data:image/jpeg;base64,${annotatedImage}`}
            alt="Crop analysis with detections"
            className="w-full h-auto max-h-[400px] object-contain"
          />
          {/* Quality overlay badge */}
          {qualityScore !== undefined && (
            <div className="absolute top-3 right-3 glass-card px-3 py-1.5">
              <span className={`text-sm font-bold ${getScoreColor(qualityScore)}`}>
                Q: {qualityScore.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Detection List */}
      {detections.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
            Detections ({detections.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {detections.map((det, i) => (
              <div
                key={i}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${getDetectionColor(det.label)}`}
              >
                <span>{det.label}</span>
                <span className="opacity-60">{(det.confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {detections.length === 0 && annotatedImage && (
        <p className="text-sm text-slate-400 text-center py-2">
          No specific crop defects detected — baseline quality applied
        </p>
      )}
    </div>
  );
}
