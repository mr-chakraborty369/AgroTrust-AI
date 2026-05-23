/**
 * AgroTrust AI — API Client
 * Centralized fetch wrapper for all backend communication.
 */

const API_BASE = "http://localhost:8000";

/**
 * Analyze an image for crop quality and/or invoice OCR.
 *
 * @param {File} file - Clean image file (EXIF stripped)
 * @param {string} encryptedMetadata - AES-256 encrypted metadata string
 * @param {string} analysisType - "crop", "invoice", or "both"
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeImage(file, encryptedMetadata = "{}", analysisType = "both") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("encrypted_metadata", encryptedMetadata);
  formData.append("analysis_type", analysisType);

  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Network error" }));
    throw new Error(error.detail || `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Trigger a Pice payout based on trust score.
 *
 * @param {number} trustScore - Composite trust score (0-100)
 * @param {number} invoiceAmount - Invoice total amount
 * @param {string} sellerId - Seller identifier
 * @param {string} invoiceDate - Date from invoice
 * @returns {Promise<Object>} Payout result
 */
export async function triggerPayout(trustScore, invoiceAmount = 0, sellerId = "UNKNOWN", invoiceDate = null) {
  const formData = new FormData();
  formData.append("trust_score", trustScore.toString());
  formData.append("invoice_amount", invoiceAmount.toString());
  formData.append("seller_id", sellerId);
  if (invoiceDate) {
    formData.append("invoice_date", invoiceDate);
  }

  const response = await fetch(`${API_BASE}/api/payout`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Network error" }));
    throw new Error(error.detail || `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Check backend health status.
 * @returns {Promise<Object>} Health check response
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/`, { method: "GET" });
    if (!response.ok) throw new Error("Backend unavailable");
    return response.json();
  } catch {
    return { status: "offline" };
  }
}
