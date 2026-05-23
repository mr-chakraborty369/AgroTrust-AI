import CryptoJS from "crypto-js";

/**
 * Strip EXIF/GPS metadata from an image file using Canvas redraw.
 * The HTML5 Canvas API naturally strips all metadata when re-encoding.
 * This ensures farm GPS coordinates never leave the browser.
 *
 * @param {File} file - Original image file
 * @returns {Promise<Blob>} Clean image blob with no EXIF data
 */
export function stripEXIF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas and draw — this strips ALL metadata
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Export as clean blob (JPEG for photos, PNG for transparency)
        const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], file.name, {
                  type: mimeType,
                  lastModified: Date.now(),
                })
              );
            } else {
              reject(new Error("Failed to create clean image blob"));
            }
          },
          mimeType,
          0.92
        );
      };
      img.onerror = () => reject(new Error("Failed to load image for EXIF stripping"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Encrypt sensitive data using AES-256.
 * Used to protect supplier bank details before network transit.
 *
 * @param {Object} data - Plain object to encrypt
 * @param {string} key - Encryption key
 * @returns {string} AES-256 encrypted ciphertext
 */
export function encryptData(data, key) {
  const plaintext = JSON.stringify(data);
  return CryptoJS.AES.encrypt(plaintext, key).toString();
}

/**
 * Decrypt AES-256 ciphertext.
 *
 * @param {string} ciphertext - Encrypted string
 * @param {string} key - Decryption key
 * @returns {Object} Decrypted data object
 */
export function decryptData(ciphertext, key) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  const plaintext = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(plaintext);
}

/**
 * Generate a random 256-bit encryption key.
 * @returns {string} Random key string
 */
export function generateKey() {
  return CryptoJS.lib.WordArray.random(32).toString();
}
