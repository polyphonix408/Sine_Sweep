/**
 * Large File Upload Handler
 * Supports chunked multipart uploads for files >5MB
 * No size limit - can handle files up to 5TB
 */

import Utils from "./utils.js";
import S3Integration from "./wallpaper-s3-integration.js";

if (!customElements.get("large-file-upload-form")) {
  class LargeFileUploadForm extends HTMLElement {
    constructor() {
      super();
      this.s3Integration = new S3Integration();
      this.selectedFile = null;
      this.isUploadInProgress = false;
      this.isUploadAborted = false;

      // Chunked upload settings
      this.chunkSize = 10 * 1024 * 1024; // 10MB chunks
      this.maxConcurrentChunks = 3; // Upload 3 chunks in parallel

      this.uploadState = {
        uploadId: null,
        parts: [],
        uploadedBytes: 0,
        totalBytes: 0,
        startTime: null,
        s3Key: null,
      };

      try {
        this.init();
      } catch (error) {
        console.error("Initialization failed:", error);
      }
    }

    MAX_RETRIES = 3;

    init() {
      this.selectElements();
      this.attachEventListeners();
      this.updateSubmitButtonState();
    }

    selectElements() {
      // File upload
      this.uiFileInput = this.querySelector("#large-file-input");
      this.uiDropZone = this.querySelector("#file-drop-zone");
      this.uiRemoveBtn = this.querySelector("#remove-file-btn");
      this.uiFileInfo = this.querySelector("#file-selected-info");
      this.uiFileName = this.querySelector("#selected-file-name");
      this.uiFileSize = this.querySelector("#selected-file-size");
      // Dimension inputs
      this.uiWidthFeetInput = this.querySelector("#wall-width-feet");
      this.uiWidthInchesInput = this.querySelector("#wall-width-inches");
      this.uiHeightFeetInput = this.querySelector("#wall-height-feet");
      this.uiHeightInchesInput = this.querySelector("#wall-height-inches");
      this.uiAreaDisplay = this.querySelector("#total-area-display");
      // Form inputs
      this.uiCustomerName = this.querySelector("#customer-name");
      this.uiCustomerEmail = this.querySelector("#customer-email");
      this.uiMaterialSelect = this.querySelector("#material-select");
      this.uiSpecialRequests = this.querySelector("#special-requests");
      // Buttons
      this.uiSubmitBtn = this.querySelector("#submit-upload-btn");
      // Progress elements
      this.uiProgressContainer = this.querySelector("#upload-progress-container");
      this.uiProgressBar = this.querySelector("#upload-progress-bar");
      this.uiProgressPercentage = this.querySelector("#upload-percentage");
      this.uiUploadSpeed = this.querySelector("#upload-speed");
      this.uiUploadRemaining = this.querySelector("#upload-remaining");
      // Status elements
      this.uiUploadSuccess = this.querySelector("#upload-success");
      this.uiUploadError = this.querySelector("#upload-error");
      this.uiErrorMessageText = this.querySelector("#error-message-text");

      this.SuccessModal = this.querySelector("success-modal");
    }

    attachEventListeners() {
      this.uiFileInput?.addEventListener("change", (e) => this.handleFileSelect(e));
      this.uiDropZone?.addEventListener("click", () => this.uiFileInput?.click());
      this.uiDropZone?.addEventListener("dragover", (e) => this.handleDragOver(e));
      this.uiDropZone?.addEventListener("dragleave", (e) => this.handleDragLeave(e));
      this.uiDropZone?.addEventListener("drop", (e) => this.handleDrop(e));
      this.uiRemoveBtn?.addEventListener("click", () => this.removeFile());

      [this.uiWidthFeetInput, this.uiWidthInchesInput, this.uiHeightFeetInput, this.uiHeightInchesInput].forEach(
        (input) => {
          input?.addEventListener("input", () => this.updateAreaCalculation());
        },
      );

      [this.uiCustomerName, this.uiCustomerEmail, this.uiMaterialSelect].forEach((input) => {
        input?.addEventListener("input", () => this.updateSubmitButtonState());
      });

      this.uiSubmitBtn?.addEventListener("click", () => this.handleSubmit());

      this.addEventListener("MODAL_CLOSE", () => this.reset());
    }

    handleFileSelect(e) {
      e.stopPropagation();
      const file = e.target.files[0];
      if (file) {
        this.selectedFile = file;
        this.displayFileInfo(file);
        this.updateSubmitButtonState();
      }
    }

    handleDragOver(e) {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.add("drag-over");
    }

    handleDragLeave(e) {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.remove("drag-over");
    }

    handleDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.remove("drag-over");

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.selectedFile = files[0];
        this.displayFileInfo(files[0]);
        this.updateSubmitButtonState();
      }
    }

    displayFileInfo(file) {
      if (!this.uiDropZone || !this.uiFileInfo || !this.uiFileName || !this.uiFileSize) {
        throw new Error("Missing UI elements for file display");
      }

      this.uiDropZone.style.display = "none";
      this.uiFileInfo.style.display = "block";
      this.uiFileName.textContent = file.name;
      this.uiFileSize.textContent = Utils.formatFileSize(file.size);
    }

    removeFile() {
      this.selectedFile = null;
      this.uiDropZone.style.display = "block";
      this.uiFileInfo.style.display = "none";
      this.uiFileInput.value = "";
      this.updateSubmitButtonState();
    }

    updateAreaCalculation() {
      const totalWidthFeet = this.dimensionsWidthFeet + this.dimensionsWidthInches / 12;
      const totalHeightFeet = this.dimensionsHeightFeet + this.dimensionsHeightInches / 12;
      const areaSquareFeet = Math.ceil(totalWidthFeet * totalHeightFeet);
      this.uiAreaDisplay.textContent = `${isNaN(areaSquareFeet) ? 0 : areaSquareFeet} sq ft`;
    }

    validateForm() {
      const name = this.uiCustomerName?.value.trim();
      const email = this.uiCustomerEmail?.value.trim();
      const material = this.uiMaterialSelect?.value;

      return !!(name && email && material && this.selectedFile);
    }

    updateSubmitButtonState() {
      this.uiSubmitBtn.disabled = !this.validateForm() || this.isUploadInProgress;
    }

    async handleSubmit() {
      if (!this.validateForm()) {
        this.showError("Please fill in all required fields and select a file.");
        return;
      }
      if (this.isUploadInProgress) return;

      this.isUploadInProgress = true;
      this.isUploadAborted = false;
      this.updateSubmitButtonState();

      this.uiFileInfo?.style.setProperty("display", "none");
      this.uiUploadSuccess?.style.setProperty("display", "none");
      this.uiUploadError?.style.setProperty("display", "none");
      this.uiProgressContainer?.style.setProperty("display", "block");

      try {
        const isLargeFileUpload = this.selectedFile.size > 100 * 1024 * 1024; // >100MB

        let uploadResult;
        if (isLargeFileUpload) {
          console.log("Using multipart upload for large file");
          uploadResult = await this.uploadLargeFile();
        } else {
          console.log("Using standard upload for file");
          uploadResult = await this.uploadStandardFile();
        }

        if (this.isUploadAborted) {
          throw new Error("Upload was cancelled");
        }

        await this.sendNotificationEmail(uploadResult);

        this.uiProgressContainer?.style.setProperty("display", "none");
        this.uiUploadSuccess?.style.setProperty("display", "flex");
        setTimeout(() => {
          this.SuccessModal?.show();
        }, 500);
      } catch (error) {
        console.error("Upload error:", error);
        this.showError(error.message ?? "Upload failed. Please try again.");
      } finally {
        this.isUploadInProgress = false;
        this.updateSubmitButtonState();
      }
    }

    async uploadStandardFile() {
      const metadata = this.collectFormData();

      const result = await this.s3Integration.uploadFile(this.selectedFile, {
        ...metadata,
        uploadType: "large-file-form",
      });

      return result;
    }

    async uploadLargeFile() {
      this.uploadState.startTime = Date.now();
      this.uploadState.totalBytes = this.selectedFile.size;
      this.uploadState.uploadedBytes = 0;

      const initResult = await this.initiateMultipartUpload();
      this.uploadState.uploadId = initResult.uploadId;
      this.uploadState.s3Key = initResult.key;

      const chunks = Utils.calculateChunks(this.selectedFile, this.chunkSize);
      console.log("chunks array", chunks);
      console.log(`Uploading ${chunks.length} chunks`);

      this.uploadState.parts = await this.uploadChunksWithConcurrency(chunks);

      const completeResult = await this.completeMultipartUpload();

      return completeResult;
    }

    async initiateMultipartUpload() {
      try {
        const response = await this.s3Integration.initiateMultipartUpload({
          file: this.selectedFile,
          metadata: this.collectFormData(),
        });
        return response;
      } catch (error) {
        this.showError("Failed to initiate multipart upload: " + error.message);
      }
    }

    async uploadChunksWithConcurrency(chunks) {
      const uploadedParts = [];
      // const chunksToUpload = [...chunks];
      const chunksToUpload = chunks.map((chunk) => ({ ...chunk, retryCount: 0 }));
      const activeUploads = [];

      while (chunksToUpload.length > 0 || activeUploads.length > 0) {
        // Fill up to max concurrent uploads
        while (activeUploads.length < this.maxConcurrentChunks && chunksToUpload.length > 0) {
          const chunk = chunksToUpload.shift();
          const uploadPromise = this.uploadChunk(chunk)
            .then((part) => {
              uploadedParts.push(part);
              // Remove from active uploads
              const index = activeUploads.indexOf(uploadPromise);
              if (index > -1) activeUploads.splice(index, 1);
              return part;
            })
            .catch((error) => {
              console.error(`Failed to upload chunk ${chunk.partNumber} (attempt ${chunk.retryCount + 1}):`, error);
              const index = activeUploads.indexOf(uploadPromise);
              if (index > -1) activeUploads.splice(index, 1);

              // Put chunk back in queue for retry
              if (chunk.retryCount < this.MAX_RETRIES) {
                chunk.retryCount++;
                chunksToUpload.push(chunk);
              } else {
                throw new Error(`Chunk ${chunk.partNumber} failed after ${MAX_RETRIES} retries: ${error.message}`);
              }
            });

          activeUploads.push(uploadPromise);
        }

        // When one upload finishes, add another to queue
        if (activeUploads.length > 0) await Promise.race(activeUploads);
      }

      uploadedParts.sort((a, b) => a.partNumber - b.partNumber);
      return uploadedParts;
    }

    async uploadChunk(chunk) {
      try {
        const response = await this.s3Integration.uploadChunk({
          chunk: chunk,
          uploadId: this.uploadState.uploadId,
          key: this.uploadState.s3Key,
        });

        this.uploadState.uploadedBytes += chunk.end - chunk.start;
        this.updateProgress();

        return response;
      } catch (error) {
        this.showError(error.message);
        throw error;
      }
    }

    async completeMultipartUpload() {
      try {
        const response = await this.s3Integration.completeMultipartUpload({
          uploadId: this.uploadState.uploadId,
          key: this.uploadState.s3Key,
          parts: this.uploadState.parts,
        });
        return response;
      } catch (error) {
        this.showError("Failed to complete multipart upload: " + error.message);
      }
    }

    updateProgress() {
      const percentage = Math.round((this.uploadState.uploadedBytes / this.uploadState.totalBytes) * 100);

      // Update progress bar
      const progressBar = this.querySelector("#upload-progress-bar");
      const progressPercentage = this.querySelector("#upload-percentage");

      if (progressBar) progressBar.style.width = `${isNaN(percentage) ? 0 : percentage}%`;
      if (progressPercentage) progressPercentage.textContent = `${isNaN(percentage) ? 0 : percentage}%`;

      // Calculate and update speed
      const elapsedSeconds = (Date.now() - this.uploadState.startTime) / 1000;
      const bytesPerSecond = this.uploadState.uploadedBytes / elapsedSeconds;
      const speed = Utils.formatFileSize(bytesPerSecond) + "/s";

      const speedElement = this.querySelector("#upload-speed");
      if (speedElement) speedElement.textContent = speed;

      // Calculate remaining time
      const remainingBytes = this.uploadState.totalBytes - this.uploadState.uploadedBytes;
      const remainingSeconds = remainingBytes / bytesPerSecond;
      const remaining = Utils.formatTime(remainingSeconds);

      const remainingElement = this.querySelector("#upload-remaining");
      if (remainingElement) remainingElement.textContent = remaining;
    }

    async sendNotificationEmail(uploadResult) {
      const formData = this.collectFormData();
      const response = await this.s3Integration.sendNotificationEmail({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        wallDimensions: formData.wallDimensions,
        material: formData.material,
        specialRequests: formData.specialRequests,
        fileName: this.selectedFile.name,
        fileSize: Utils.formatFileSize(this.selectedFile.size),
        fileType: this.selectedFile.type,
        s3Key: uploadResult.key,
        s3Bucket: uploadResult.bucket,
        uploadedAt: new Date().toISOString(),
      });

      return response;
    }

    collectFormData() {
      const widthFeet = parseInt(this.querySelector("#wall-width-feet")?.value || 0);
      const widthInches = parseInt(this.querySelector("#wall-width-inches")?.value || 0);
      const heightFeet = parseInt(this.querySelector("#wall-height-feet")?.value || 0);
      const heightInches = parseInt(this.querySelector("#wall-height-inches")?.value || 0);

      return {
        customerName: this.querySelector("#customer-name")?.value.trim(),
        customerEmail: this.querySelector("#customer-email")?.value.trim(),
        wallDimensions: `${widthFeet}'${widthInches}" × ${heightFeet}'${heightInches}"`,
        wallWidthFeet: widthFeet + widthInches / 12,
        wallHeightFeet: heightFeet + heightInches / 12,
        material: this.querySelector("#material-select")?.value,
        specialRequests: this.querySelector("#special-requests")?.value.trim(),
      };
    }

    showError(message) {
      this.uiProgressContainer?.style.setProperty("display", "none");
      this.uiUploadError?.style.setProperty("display", "flex");
      this.uiErrorMessageText.textContent = message;
    }

    reset() {
      this.removeFile();

      this.uiCustomerName.value = "";
      this.uiCustomerEmail.value = "";
      this.uiWidthFeetInput.value = "0";
      this.uiWidthInchesInput.value = "0";
      this.uiHeightFeetInput.value = "0";
      this.uiHeightInchesInput.value = "0";
      this.uiMaterialSelect.value = "";
      this.uiSpecialRequests.value = "";

      this.uploadState = {
        uploadId: null,
        parts: [],
        uploadedBytes: 0,
        totalBytes: 0,
        startTime: null,
        s3Key: null,
      };

      this.updateProgress();
      this.updateAreaCalculation();
      this.updateSubmitButtonState();

      this.uiUploadSuccess.style.display = "none";
      this.uiUploadError.style.display = "none";
    }

    get dimensionsWidthFeet() {
      return parseInt(this.uiWidthFeetInput?.value || 0);
    }

    get dimensionsWidthInches() {
      return parseInt(this.uiWidthInchesInput?.value || 0);
    }

    get dimensionsHeightFeet() {
      return parseInt(this.uiHeightFeetInput?.value || 0);
    }

    get dimensionsHeightInches() {
      return parseInt(this.uiHeightInchesInput?.value || 0);
    }
  }
  customElements.define("large-file-upload-form", LargeFileUploadForm);
}
