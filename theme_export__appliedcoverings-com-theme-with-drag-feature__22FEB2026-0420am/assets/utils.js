class Utils {
  /**
   * Format bytes to human-readable file size
   * @param {number} bytes - The number of bytes to format
   * @returns {string} Formatted file size (e.g., "1.5 MB")
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  /**
   * Format seconds to human-readable time duration
   * @param {number} seconds - The number of seconds to format
   * @returns {string} Formatted time (e.g., "5 minutes", "2 hours")
   */
  static formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "Calculating...";

    if (seconds < 60) {
      return Math.round(seconds) + " seconds";
    } else if (seconds < 3600) {
      return Math.round(seconds / 60) + " minutes";
    } else {
      return Math.round(seconds / 3600) + " hours";
    }
  }

  static calculateChunks(file, chunkSize) {
    const chunks = [];
    const totalChunks = Math.ceil(file.size / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);

      chunks.push({
        partNumber: i + 1,
        start: start,
        end: end,
        blob: file.slice(start, end),
      });
    }

    return chunks;
  }

  /**
   * Get file extension and type from a File or Blob
   * @param {File|Blob} file - The file or blob to analyze
   * @returns {{fileExtension: string, fileType: string}} Object with fileExtension and fileType
   */
  static getFileInfo(file) {
    if (!file || !file.type) {
      console.warn("File or blob type is missing, defaulting to PNG");
      return { fileExtension: "png", fileType: "image/png" };
    }

    // ALWAYS use the blob's actual type - it's the most reliable
    if (file.type === "application/pdf") {
      return { fileExtension: "pdf", fileType: "application/pdf" };
    } else if (file.type === "image/tiff" || file.type === "image/tif") {
      return { fileExtension: "tiff", fileType: file.type };
    } else if (file.type === "image/png") {
      // PNG blob - whether from SVG conversion or original PNG
      return { fileExtension: "png", fileType: "image/png" };
    } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
      return { fileExtension: "jpg", fileType: file.type };
    } else if (file.type === "image/svg+xml") {
      // Original SVG (not converted)
      return { fileExtension: "svg", fileType: "image/svg+xml" };
    } else {
      // Fallback
      console.warn("Unknown blob type:", file.type, "defaulting to PNG");
      return { fileExtension: "png", fileType: "image/png" };
    }
  }

  static getFileNameWithoutExtension(filename) {
    if (!filename) return "Image";
    // Remove file extension - match everything before the last dot
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    return nameWithoutExt || filename;
  }

  static getSavedView(id) {
    let _id = id ?? window.ShopifyAnalytics?.meta?.product?.id;
    if (!_id) return;
    const storageKey = `pattern_product_view_${_id}`;
    const savedView = sessionStorage.getItem(storageKey);

    return savedView;
  }
}

window.Utils = Utils;
export default Utils;
