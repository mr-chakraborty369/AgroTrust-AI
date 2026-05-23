"use client";

export default function InvoiceTable({ ocrResults }) {
  if (!ocrResults || (!ocrResults.extracted_fields && !ocrResults.raw_lines?.length)) {
    return (
      <div className="glass-card p-6 gradient-border animate-fadeInUp-delay-2">
        <h3 className="text-lg font-semibold text-white mb-4">Invoice Data</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">Upload an invoice to extract data</p>
          <p className="text-slate-500 text-xs mt-1">EasyOCR will parse text fields</p>
        </div>
      </div>
    );
  }

  const { confidence, extracted_fields, raw_lines, full_text } = ocrResults;
  const confidencePercent = (confidence * 100).toFixed(1);

  const fieldLabels = {
    total_amount: "Total Amount",
    date: "Invoice Date",
    seller_id: "Seller ID",
    invoice_id: "Invoice ID",
  };

  return (
    <div className="glass-card p-6 gradient-border animate-fadeInUp-delay-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Invoice Data</h3>
        <span className="badge badge-info">EasyOCR</span>
      </div>

      {/* Confidence Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-400 uppercase tracking-wider">OCR Confidence</span>
          <span className={`text-sm font-bold ${
            confidence >= 0.8 ? "text-emerald-400" : confidence >= 0.5 ? "text-amber-400" : "text-red-400"
          }`}>
            {confidencePercent}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              confidence >= 0.8
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                : confidence >= 0.5
                ? "bg-gradient-to-r from-amber-500 to-amber-400"
                : "bg-gradient-to-r from-red-500 to-red-400"
            }`}
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>

      {/* Extracted Fields Table */}
      {extracted_fields && Object.keys(extracted_fields).length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Extracted Fields</p>
          <div className="rounded-xl overflow-hidden border border-slate-700/50">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Field</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(extracted_fields).map(([key, value], i) => (
                  <tr
                    key={key}
                    className={`border-t border-slate-700/30 ${
                      i % 2 === 0 ? "bg-slate-800/20" : "bg-transparent"
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-slate-300 font-medium">
                      {fieldLabels[key] || key}
                    </td>
                    <td className="px-4 py-3 text-sm text-emerald-300 font-mono">
                      {typeof value === "number" ? `₹${value.toLocaleString()}` : String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw OCR Lines */}
      {raw_lines && raw_lines.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
            Raw OCR Text ({raw_lines.length} lines)
          </p>
          <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-900/50 border border-slate-700/30 p-3 space-y-1.5">
            {raw_lines.map((line, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <span className="text-sm text-slate-300 font-mono truncate flex-1">
                  {line.text}
                </span>
                <span className={`text-xs font-medium shrink-0 ${
                  line.confidence >= 0.8 ? "text-emerald-400" : line.confidence >= 0.5 ? "text-amber-400" : "text-red-400"
                }`}>
                  {(line.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
