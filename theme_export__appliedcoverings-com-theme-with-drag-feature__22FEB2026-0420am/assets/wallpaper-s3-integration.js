/**
 * S3 Integration for Wallpaper Configurator
 * Connects to AWS Lambda via Shopify App Proxy
 */

class S3Integration {
  constructor() {
    // Use Shopify App Proxy URL (HMAC validation built-in)
    this.baseUrl = "/apps/s3/api";

    // S3 Bucket name
    this.bucketName = "shopify-applied-coverings";
  }

  /**
   * Upload file to S3 via Lambda presigned URL
   * @param {File} file - The file to upload
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(file, metadata = {}) {
    try {
      // Step 1: Get presigned URL from Lambda
      const urlResponse = await this.getUploadUrl({
        fileName: file.name.replace(/\s+/g, "_"),
        contentType: file.type,
        fileSize: file.size,
        orderId: metadata.orderId || null,
        customerId: this.getCustomerId(),
      });

      if (!urlResponse.success) {
        throw new Error("Failed to get upload URL");
      }

      // Step 2: Upload file directly to S3
      const uploadResponse = await fetch(urlResponse.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to S3");
      }

      // Return success with file details
      return {
        success: true,
        key: urlResponse.key,
        bucket: urlResponse.bucket,
        url: this.constructS3Url(urlResponse.bucket, urlResponse.key),
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        },
      };
    } catch (error) {
      console.error("S3 upload failed:", error);
      throw error;
    }
  }

  /**
   * Get presigned upload URL from Lambda
   * @param {Object} params - Upload parameters
   * @returns {Promise<Object>} Presigned URL response
   */
  async getUploadUrl(params) {
    try {
      // The Lambda function validates Shopify HMAC automatically
      // when called through the app proxy
      const url = `${this.baseUrl}/upload-url`;
      console.log("Calling S3 upload URL:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-S3-Bucket": "shopify-applied-coverings",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get upload URL");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get upload URL:", error);
      throw error;
    }
  }

  /**
   * Get presigned download URL from Lambda
   * @param {string} key - S3 object key
   * @returns {Promise<string>} Download URL
   */
  async getDownloadUrl(key) {
    try {
      const response = await fetch(`${this.baseUrl}/download/${key}`, {
        method: "GET",
        headers: {
          "X-S3-Bucket": "shopify-applied-coverings",
          "x-expires-in": 604800, // 7 days
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get download URL");
      }

      const data = await response.json();
      return data.downloadUrl;
    } catch (error) {
      console.error("Failed to get download URL:", error);
      throw error;
    }
  }

  // async getObjects() {
  //   try {
  //     const id = this.getCustomerId();
  //     console.log("Fetching objects for customer ID:", id);
  //     const response = await fetch(`${this.baseUrl}/list-objects?customerId=${this.getCustomerId()}`, {
  //       method: "GET",
  //       headers: {
  //         "X-S3-Bucket": this.bucketName,
  //         "X-Temp": this.getCustomerId(),
  //       },
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to get objects");
  //     }

  //     const data = await response.json();
  //     return data;
  //   } catch (error) {
  //     console.error("Failed to get objects:", error);
  //     throw error;
  //   }
  // }

  /**
   * Check Lambda/S3 integration status
   * @returns {Promise<Object>} Status response
   */
  async checkStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        headers: {
          "X-S3-Bucket": "shopify-applied-coverings",
        },
      });

      return await response.json();
    } catch (error) {
      console.error("Status check failed:", error);
      return {
        status: "error",
        message: error.message,
      };
    }
  }

  /**
   * Get customer ID from Shopify or session
   * @returns {string} Customer ID
   */
  getCustomerId() {
    // Try to get from Shopify customer object
    if (window.ShopifyAnalytics?.meta?.page?.customerId) {
      return window.ShopifyAnalytics.meta.page.customerId;
    }

    // Try to get from __st cookie (Shopify tracking)
    const stCookie = document.cookie.split("; ").find((row) => row.startsWith("__st="));
    if (stCookie) {
      const customerId = stCookie.split("c=")[1]?.split("&")[0];
      if (customerId && customerId !== "undefined") {
        return customerId;
      }
    }

    // Try meta tag
    const customerMeta = document.querySelector('meta[name="customer-id"]');
    if (customerMeta?.content) {
      return customerMeta.content;
    }

    // Generate guest ID as fallback
    let guestId = sessionStorage.getItem("guest_customer_id");
    if (!guestId) {
      guestId = "guest_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("guest_customer_id", guestId);
    }
    return guestId;
  }

  /**
   * Construct S3 URL from bucket and key
   * @param {string} bucket - S3 bucket name
   * @param {string} key - S3 object key
   * @returns {string} S3 URL
   */
  constructS3Url(bucket, key) {
    return `https://${bucket}.s3.us-west-2.amazonaws.com/${key}`;
  }

  /**
   * Save upload reference to order notes or customer metafield
   * @param {Object} uploadData - Upload data to save
   */
  async saveUploadReference(uploadData) {
    // This would typically be saved via Shopify API
    // For now, store in localStorage
    const uploads = JSON.parse(localStorage.getItem("wallpaper_uploads") || "[]");
    uploads.push({
      ...uploadData,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("wallpaper_uploads", JSON.stringify(uploads));

    // You could also send this to your backend to save as order note
    // or customer metafield via Shopify Admin API
    return true;
  }

  async initiateMultipartUpload({ metadata, file } = {}) {
    try {
      if (!metadata || !file) {
        throw new Error("Missing required parameters to initiate multipart upload");
      }

      const response = await fetch(`${this.baseUrl}/multipart/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-S3-Bucket": this.bucketName,
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
          metadata,
          customerId: this.getCustomerId(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to initiate upload");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to initiate multipart upload:", error);
      throw error;
    }
  }

  async uploadChunk({ chunk, uploadId, key } = {}) {
    if (!chunk || !uploadId || !key) {
      throw new Error("Missing required parameters to upload chunk");
    }

    try {
      // Get presigned URL for this part
      const urlResponse = await fetch(`${this.baseUrl}/multipart/upload-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-S3-Bucket": this.bucketName,
        },
        body: JSON.stringify({
          uploadId,
          key,
          partNumber: chunk.partNumber,
        }),
      });

      if (!urlResponse.ok) {
        throw new Error(`Failed to get upload URL for part ${chunk.partNumber}`);
      }

      const { uploadUrl } = await urlResponse.json();

      // Upload the chunk
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: chunk.blob,
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload part ${chunk.partNumber}`);
      }

      // Get ETag from response
      const etag = uploadResponse.headers.get("ETag");

      // // Update progress
      // this.uploadState.uploadedBytes += chunk.end - chunk.start;
      // this.updateProgress();

      return {
        partNumber: chunk.partNumber,
        etag: etag,
      };
    } catch (error) {
      console.error(`Failed to upload chunk ${chunk.partNumber}:`, error);
      throw error;
    }
  }

  async completeMultipartUpload({ uploadId, key, parts } = {}) {
    try {
      if (!uploadId || !key || !parts || !Array.isArray(parts)) {
        throw new Error("Missing required parameters to complete multipart upload");
      }

      const response = await fetch(`${this.baseUrl}/multipart/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-S3-Bucket": this.bucketName,
        },
        body: JSON.stringify({
          uploadId,
          key,
          parts,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete upload");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to complete multipart upload:", error);
      throw error;
    }
  }

  async sendNotificationEmail({
    customerName,
    customerEmail,
    wallDimensions,
    material,
    specialRequests,
    fileName,
    fileSize,
    fileType,
    s3Key,
    s3Bucket,
    uploadedAt,
  }) {
    const response = await fetch(`${this.baseUrl}/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerName,
        customerEmail,
        wallDimensions,
        material,
        specialRequests,
        fileName,
        fileSize,
        fileType,
        s3Key,
        s3Bucket,
        uploadedAt,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send notification email");
      // Don't throw - upload succeeded even if email failed
    }

    return response.json();
  }
}

export default S3Integration;

// Export for use in configurator
window.S3Integration = S3Integration;
