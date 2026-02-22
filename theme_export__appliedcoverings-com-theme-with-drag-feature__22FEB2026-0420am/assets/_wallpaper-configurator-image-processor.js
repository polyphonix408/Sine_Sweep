/**
 * Wallpaper Configurator Image Processor
 * Handles all image processing operations including file validation,
 * format conversion (PDF, TIFF), and pre-existing image loading
 */

class WallpaperImageProcessor {
  constructor(configurator) {
    this.configurator = configurator;
    this.config = configurator.config;
    this.state = configurator.state;
    this.UIController = configurator.UIController;
    this.CanvasController = configurator.CanvasController;

    this.elements = configurator.UIController.elements;
  }

  // ========== FILE VALIDATION ==========
  validateFile(file) {
    if (!this.config.allowedFileTypes.includes(file.type)) {
      alert("Please upload a JPG, PNG, TIFF, or PDF file.");
      return false;
    }

    if (file.size < this.config.minFileSize) {
      alert("File size must be at least 50KB.");
      return false;
    }

    if (file.size > this.config.maxFileSize) {
      alert("File size must be under 1GB. For larger files, please use our raw file upload form.");
      return false;
    }

    return true;
  }

  // ========== CLEANUP ==========
  cleanupPreviousFile() {
    if (this.configurator.objectUrls?.length) {
      this.configurator.objectUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn("Failed to revoke URL:", e);
        }
      });
      this.configurator.objectUrls = [];
    }

    this.state.pdfDataUrl = null;
    this.state.tiffDataUrl = null;

    if (this.state.cropper) {
      this.state.cropper.destroy();
      this.state.cropper = null;
    }

    if (this.elements.previewImage) {
      this.elements.previewImage.src = "";
    }
    if (this.elements.cropImage) {
      this.elements.cropImage.src = "";
    }

    if (this.elements.patternCanvas) {
      const ctx = this.elements.patternCanvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, this.elements.patternCanvas.width, this.elements.patternCanvas.height);
        this.elements.patternCanvas.width = 1;
        this.elements.patternCanvas.height = 1;
      }
    }

    this.state.croppedImage = null;
    this.state.cropperData = null;
    this.state.hasCroppedImage = false;
  }

  // ========== IMAGE PROCESSING ==========
  processImage(file) {
    this.cleanupPreviousFile();
    this.state.uploadedImage = file;
    this.state.originalFile = file; // Store original file separately

    // Update state to enable Mirror/B&W now that we have an image
    this.UIController.updateUploadState();

    // For PDFs, process differently
    if (file.type === "application/pdf") {
      this.processPDF(file);
      return;
    }

    // For TIFF files, process differently (browsers don't support TIFF natively)
    if (
      file.type === "image/tiff" ||
      file.type === "image/tif" ||
      file.name.toLowerCase().endsWith(".tiff") ||
      file.name.toLowerCase().endsWith(".tif")
    ) {
      this.processTIFF(file);
      return;
    }

    // In pattern mode or forced pattern mode, skip cropping - go straight to pattern preview
    if (this.state.imageMode === "pattern" || this.state.forcePatternMode) {
      this.CanvasController.showPatternPreview(file);
      return;
    }

    // Show cropping interface for single image mode
    this.CanvasController.showCroppingInterface(file);
  }

  // ========== UTILITY FUNCTIONS ==========
  getFileNameWithoutExtension(filename) {
    if (!filename) return "Image";
    // Remove file extension - match everything before the last dot
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    return nameWithoutExt || filename;
  }

  // ========== IMAGE QUALITY ==========
  calculateImageQuality(file, dataUrl) {
    const img = new Image();
    img.onload = () => {
      this.CanvasController.calculateImageQualityFromImg(file, img);
    };
    img.src = dataUrl;
  }

  // ========== PDF PROCESSING ==========
  async processPDF(file) {
    try {
      // Show loading indicator
      this.UIController.showLoadingSpinner(this.elements.uploadZone, "Processing PDF...");

      // Load PDF file
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Get first page (for wallpaper, typically only first page matters)
      const page = await pdf.getPage(1);

      // Set scale for high quality (adjust as needed)
      // Check viewport dimensions and adjust scale if needed
      const initialViewport = page.getViewport({ scale: 1.0 });
      console.log("📐 [PDF] Initial viewport (scale 1.0):", {
        width: initialViewport.width,
        height: initialViewport.height,
      });

      // Browser canvas limits (most browsers support up to 16384px)
      const MAX_CANVAS_DIMENSION = 16384;
      const MAX_CANVAS_AREA = 268435456; // 16384 * 16384

      // Calculate appropriate scale
      let scale = 2.0;
      let viewport = page.getViewport({ scale });

      // Check if dimensions exceed canvas limits
      if (viewport.width > MAX_CANVAS_DIMENSION || viewport.height > MAX_CANVAS_DIMENSION) {
        console.warn("⚠️ [PDF] Viewport exceeds max dimension, reducing scale");
        const scaleWidth = MAX_CANVAS_DIMENSION / initialViewport.width;
        const scaleHeight = MAX_CANVAS_DIMENSION / initialViewport.height;
        scale = Math.min(scaleWidth, scaleHeight) * 0.9; // 90% of max to be safe
        viewport = page.getViewport({ scale });
      }

      // Check if area exceeds limits
      const canvasArea = viewport.width * viewport.height;
      if (canvasArea > MAX_CANVAS_AREA) {
        console.warn("⚠️ [PDF] Canvas area exceeds limit, reducing scale");
        const areaScale = Math.sqrt(MAX_CANVAS_AREA / (initialViewport.width * initialViewport.height));
        scale = areaScale * 0.9; // 90% of max to be safe
        viewport = page.getViewport({ scale });
      }
      console.log("📐 [PDF] Final viewport:", {
        width: viewport.width,
        height: viewport.height,
        scale: scale.toFixed(2),
        area: Math.round(viewport.width * viewport.height),
        withinLimits: viewport.width <= MAX_CANVAS_DIMENSION && viewport.height <= MAX_CANVAS_DIMENSION,
      });

      // Create canvas to render PDF
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      // Set canvas dimensions (floor to avoid sub-pixel issues)
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      console.log("🖼️ [PDF] Canvas created:", {
        width: canvas.width,
        height: canvas.height,
        estimatedMemoryMB: ((canvas.width * canvas.height * 4) / (1024 * 1024)).toFixed(2),
      });

      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Convert canvas to data URL with error handling
      console.log("🔄 [PDF] Converting canvas to data URL...");
      let dataUrl;
      try {
        dataUrl = canvas.toDataURL("image/png");
        console.log("✅ [PDF] PNG data URL created:", {
          sizeMB: (dataUrl.length / (1024 * 1024)).toFixed(2),
        });
      } catch (dataUrlError) {
        console.error("❌ [PDF] Failed to create PNG data URL:", dataUrlError.message);
        console.log("🔄 [PDF] Attempting JPEG conversion as fallback (95% quality)...");
        dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        console.log("✅ [PDF] JPEG data URL created:", {
          sizeMB: (dataUrl.length / (1024 * 1024)).toFixed(2),
        });
      }

      // Hide loading spinner
      this.UIController.hideLoadingSpinner(this.elements.uploadZone);

      // Create a pseudo-file object for the converted image
      const convertedFile = {
        name: file.name.replace(".pdf", ".png"),
        type: "image/png",
        size: file.size,
        isPDFConverted: true,
      };

      // Store the converted file
      this.state.uploadedImage = convertedFile;
      this.state.pdfDataUrl = dataUrl;

      // Calculate DPI based on the rendered image
      this.calculateImageQuality(convertedFile, dataUrl);

      // Process based on mode
      if (this.state.imageMode === "pattern") {
        // For pattern mode, create pattern preview directly
        this.elements.uploadZone.style.display = "none";
        this.elements.previewArea.style.display = "flex";

        // Hide recrop button in pattern mode
        if (this.elements.recropBtn) {
          this.elements.recropBtn.style.display = "none";
        }

        // Store image data for pattern creation
        this.elements.previewImage.src = dataUrl;

        // Create pattern preview
        this.CanvasController.createPatternPreview(dataUrl);

        // Update summary
        if (this.elements.summaryImage) {
          this.elements.summaryImage.textContent = `${convertedFile.name} (Pattern ${this.state.patternSizeInches}")`;
        }
      } else {
        // For single image mode - check if already cropped
        if (this.state.hasCroppedImage) {
          // Already cropped, show preview directly, if pseudo-file this function fails
          this.CanvasController.showImagePreview(convertedFile, dataUrl);
        } else {
          // Show cropping interface for first time
          this.CanvasController.showCroppingInterfaceForPDF(dataUrl, convertedFile);
        }
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
      alert("Error processing PDF. Please try again or use an image file.");
      this.UIController.hideLoadingSpinner(this.elements.uploadZone);
    }
  }

  // ========== TIFF PROCESSING ==========
  async processTIFF(file) {
    // console.log("Processing TIFF file:", file.name, file.type, file.size);

    try {
      // Check if UTIF library is loaded
      if (typeof UTIF === "undefined") {
        throw new Error("UTIF library not loaded. Please refresh the page.");
      }

      // Show loading indicator
      this.UIController.showLoadingSpinner(this.elements.uploadZone, "Processing TIFF...");

      // Read TIFF file as ArrayBuffer
      // console.log("Reading file as ArrayBuffer...");
      const arrayBuffer = await file.arrayBuffer();
      // console.log("ArrayBuffer size:", arrayBuffer.byteLength);

      // Decode TIFF with UTIF
      // console.log("Decoding TIFF with UTIF...");
      const ifds = UTIF.decode(arrayBuffer);
      // console.log("TIFF decoded, number of images:", ifds.length);

      if (!ifds || ifds.length === 0) {
        throw new Error("No images found in TIFF file");
      }

      // Get first image
      const ifd = ifds[0];
      // console.log("First IFD:", ifd);

      // Decode the image data
      UTIF.decodeImage(arrayBuffer, ifd);
      // console.log("Image decoded:", ifd.width, "x", ifd.height);

      // Convert to RGBA
      const rgba = UTIF.toRGBA8(ifd);
      // console.log("RGBA data created, length:", rgba.length);

      // Create canvas
      const canvas = document.createElement("canvas");
      canvas.width = ifd.width;
      canvas.height = ifd.height;
      const ctx = canvas.getContext("2d");

      // Create ImageData and put the RGBA data
      const imageData = ctx.createImageData(ifd.width, ifd.height);
      imageData.data.set(rgba);
      ctx.putImageData(imageData, 0, 0);

      // console.log("Canvas created:", canvas.width, "x", canvas.height);

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL("image/png");

      // Hide loading spinner
      this.UIController.hideLoadingSpinner(this.elements.uploadZone);

      // Create a pseudo-file object for the converted image
      const convertedFile = {
        name: file.name.replace(/\.tiff?$/i, ".png"),
        type: "image/png",
        size: file.size,
        isTIFFConverted: true,
      };

      // Store the converted file
      this.state.uploadedImage = convertedFile;
      this.state.tiffDataUrl = dataUrl;

      // Calculate DPI based on the rendered image
      this.calculateImageQuality(convertedFile, dataUrl);

      // Process based on mode
      if (this.state.imageMode === "pattern") {
        // For pattern mode, create pattern preview directly
        this.elements.uploadZone.style.display = "none";
        this.elements.previewArea.style.display = "flex";

        // Hide recrop button in pattern mode
        if (this.elements.recropBtn) {
          this.elements.recropBtn.style.display = "none";
        }

        // Store image data for pattern creation
        this.elements.previewImage.src = dataUrl;

        // Get dimensions from IFD
        this.state.imageAspectRatio = ifd.width / ifd.height;

        // Create pattern preview
        this.CanvasController.createPatternPreview(dataUrl);

        // Update summary
        if (this.elements.summaryImage) {
          this.elements.summaryImage.textContent = `${file.name} (Pattern ${this.state.patternSizeInches}")`;
        }
      } else {
        // For single image mode - always show cropping interface
        this.elements.uploadZone.style.display = "none";
        this.elements.croppingArea.style.display = "block";
        this.elements.cropImage.src = dataUrl;

        // Initialize cropper
        this.CanvasController.initCropper();

        // Store that this is pre-existing (affects button visibility)
        if (this.state.isPreExisting) {
          // Will hide Remove Image button in showImagePreview
        }
      }

      this.configurator.validateForm();
      // console.log("TIFF processing complete");
    } catch (error) {
      console.error("Error processing TIFF:", error);
      console.error("Stack trace:", error.stack);
      alert(`Error processing TIFF file: ${error.message}`);
      this.UIController.hideLoadingSpinner(this.elements.uploadZone);
      // Clear the file input
      if (this.elements.imageUpload) {
        this.elements.imageUpload.value = "";
      }
    }
  }

  // ========== CONVERSION UTILITIES ==========
  dataURLtoBlob(dataURL) {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // ========== PROCESSED PREVIEW GENERATION ==========
  generateProcessedPreview() {
    return new Promise((resolve, reject) => {
      // Create canvas to apply transformations
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.save();

        if (this.state.options.blackAndWhite) {
          ctx.filter = "grayscale(100%)";
        }
        if (this.state.options.mirror) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }

        // Draw the image with transformations
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        // Convert canvas to blob and store in state
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const fileName = "PREVIEW_" + this.state.uploadedImage?.name;
              const file = new File([blob], fileName, { type: "image/png" });
              this.state.processedPreviewImageFile = file;
              resolve(file);
            } else {
              reject(new Error("Failed to generate blob from canvas"));
            }
          },
          "image/png",
          0.95,
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image for processing"));
      };

      // Determine image source from state
      if (this.state.uploadedImage instanceof File || this.state.uploadedImage instanceof Blob) {
        img.src = URL.createObjectURL(this.state.uploadedImage);
      } else if (typeof this.state.uploadedImage === "string") {
        img.src = this.state.uploadedImage;
      } else if (this.elements.previewImage?.src) {
        img.src = this.elements.previewImage.src;
      } else {
        reject(new Error("No image source available"));
      }
    });
  }

  // ========== PRE-EXISTING IMAGE LOADING ==========
  async checkForPreExistingPattern() {
    const configurator = document.getElementById("wallpaper-configurator");
    const patternUrl = configurator?.dataset.patternUrl;
    const patternName = configurator?.dataset.patternName;
    const forcePatternMode = configurator?.dataset.forcePatternMode === "true";
    const forceMuralMode = configurator?.dataset.forceMuralMode === "true";

    // console.log("Checking for pre-existing pattern:", {
    //   patternUrl,
    //   patternName,
    //   forcePatternMode,
    //   forceMuralMode,
    // });

    // If force pattern mode, set it immediately
    if (forcePatternMode) {
      this.state.imageMode = "pattern";
      this.state.forcePatternMode = true;

      // Hide pattern toggle button
      if (this.elements.patternBtn) {
        this.elements.patternBtn.style.display = "none";
      }

      // Show pattern settings
      if (this.elements.patternSettings) {
        this.elements.patternSettings.style.display = "block";
      }

      // Hide re-crop button
      if (this.elements.recropBtn) {
        this.elements.recropBtn.style.display = "none";
      }

      // Hide remove image button (no choice for pre-existing patterns)
      if (this.elements.clearImageBtn) {
        this.elements.clearImageBtn.style.display = "none";
      }

      // Hide image quality card (merchant provides the image)
      const qualityCard = document.querySelector(".quality-card");
      if (qualityCard) {
        qualityCard.style.display = "none";
      }

      // Update upload zone text for pattern products
      if (this.elements.uploadZone) {
        const uploadText = this.elements.uploadZone.querySelector(".upload-text");
        const uploadInfo = this.elements.uploadZone.querySelector(".upload-info");
        const uploadIcon = this.elements.uploadZone.querySelector(".upload-icon");

        if (uploadText) {
          uploadText.textContent = patternUrl ? "Loading pattern..." : "Enter wall dimensions to begin";
        }
        if (uploadInfo) {
          uploadInfo.style.display = "none";
        }
        if (uploadIcon) {
          uploadIcon.style.opacity = "0.3";
        }

        // Disable file upload functionality
        this.elements.uploadZone.classList.add("disabled");
        if (this.elements.imageUpload) {
          this.elements.imageUpload.disabled = true;
        }
      }
    }

    // If force mural mode, set it immediately
    if (forceMuralMode) {
      this.state.imageMode = "single";
      this.state.forceMuralMode = true;

      // Hide mode toggle completely
      const modeToggleControls = document.querySelector(".mode-toggle-controls");
      if (modeToggleControls) {
        modeToggleControls.style.display = "none";
      }

      // Hide pattern settings
      if (this.elements.patternSettings) {
        this.elements.patternSettings.style.display = "none";
      }

      // Continue to load the image for mural mode (don't return early)
    }

    if (!patternUrl) {
      // If no pattern URL but force pattern mode, keep the message
      if (forcePatternMode) {
        console.warn("Force pattern mode enabled but no pattern URL found");
        // The "Enter wall dimensions to begin" text is already set above
      }
      return;
    }

    // console.log("Pre-existing pattern/image found:", {
    //   name: patternName,
    //   url: patternUrl,
    //   mode: this.state.imageMode,
    //   forcePattern: forcePatternMode,
    //   forceMural: forceMuralMode,
    // });

    try {
      // Show loading state
      this.elements.uploadZone.style.display = "flex";
      this.UIController.showLoadingSpinner(this.elements.uploadZone, "Loading image...");

      // Fix protocol-relative URLs
      let fullUrl = patternUrl;
      if (fullUrl.startsWith("//")) {
        fullUrl = "https:" + fullUrl;
      }

      // Fetch the image from S3/CDN
      const response = await fetch(fullUrl);
      // console.log("Fetch response:", response.status, response.statusText);
      if (!response.ok) throw new Error(`Failed to load image: ${response.status} ${response.statusText}`);

      // Convert to blob and then to File
      const blob = await response.blob();
      // console.log("Blob created:", {
      //   size: blob.size,
      //   sizeMB: (blob.size / (1024 * 1024)).toFixed(2) + " MB",
      //   type: blob.type,
      // });

      // Determine file type from URL or blob type
      const urlLower = fullUrl.toLowerCase(); // Use fullUrl not patternUrl
      const isPDF = urlLower.includes(".pdf") || blob.type === "application/pdf";
      const isTIFF =
        urlLower.includes(".tiff") ||
        urlLower.includes(".tif") ||
        blob.type === "image/tiff" ||
        blob.type === "image/tif";

      // Check if it was originally SVG but converted to PNG
      const wasSVG = urlLower.includes(".svg");
      const isPNG = urlLower.includes("format=png") || blob.type === "image/png";

      // console.log("File type detection - URL:", urlLower);
      // console.log("File type detection - Blob type:", blob.type);
      // console.log("File type detection - wasSVG:", wasSVG, "isPNG:", isPNG);

      let fileExtension, fileType;

      // ALWAYS use the blob's actual type - it's the most reliable
      if (blob.type === "application/pdf") {
        fileExtension = "pdf";
        fileType = "application/pdf";
      } else if (blob.type === "image/tiff" || blob.type === "image/tif") {
        fileExtension = "tiff";
        fileType = blob.type;
      } else if (blob.type === "image/png") {
        // PNG blob - whether from SVG conversion or original PNG
        fileExtension = "png";
        fileType = "image/png";
      } else if (blob.type === "image/jpeg" || blob.type === "image/jpg") {
        fileExtension = "jpg";
        fileType = blob.type;
      } else if (blob.type === "image/svg+xml") {
        // Original SVG (not converted)
        fileExtension = "svg";
        fileType = "image/svg+xml";
      } else {
        // Fallback
        console.warn("Unknown blob type:", blob.type, "defaulting to PNG");
        fileExtension = "png";
        fileType = "image/png";
      }

      // console.log("File will be created with:", { fileExtension, fileType });

      const fileName = patternName ? `${patternName}.${fileExtension}` : `pattern.${fileExtension}`;
      const file = new File([blob], fileName, { type: fileType });

      // Process based on forced mode
      if (forceMuralMode) {
        this.state.imageMode = "single";
      } else {
        this.state.imageMode = "pattern";
      }

      this.state.originalFile = file;
      this.state.uploadedImage = file;

      // Mark as pre-existing pattern/mural
      this.state.isPreExisting = true;
      this.state.preExistingUrl = patternUrl;

      // Hide loading
      this.UIController.hideLoadingSpinner(this.elements.uploadZone);

      // Handle special file types
      if (isPDF) {
        // Process PDF and convert to image
        await this.processPDF(file);

        // Update UI based on mode
        if (this.state.imageMode === "pattern") {
          if (this.elements.patternBtn) {
            this.elements.patternBtn.classList.add("active");
          }
          if (this.elements.patternSettings) {
            this.elements.patternSettings.style.display = "block";
          }
        } else {
          if (this.elements.singleBtn) {
            this.elements.singleBtn.classList.add("active");
          }
          if (this.elements.patternSettings) {
            this.elements.patternSettings.style.display = "none";
          }
        }
      } else if (isTIFF) {
        // Process TIFF and convert to image
        await this.processTIFF(file);

        // Update UI based on mode
        if (this.state.imageMode === "pattern") {
          if (this.elements.patternBtn) {
            this.elements.patternBtn.classList.add("active");
          }
          if (this.elements.patternSettings) {
            this.elements.patternSettings.style.display = "block";
          }
        } else {
          if (this.elements.singleBtn) {
            this.elements.singleBtn.classList.add("active");
          }
          if (this.elements.patternSettings) {
            this.elements.patternSettings.style.display = "none";
          }
        }
      } else {
        // Show appropriate preview based on mode for image files
        if (this.state.imageMode === "pattern") {
          // console.log("Processing regular image for pattern mode");
          this.CanvasController.showPatternPreview(file);
          // Update UI to reflect pattern mode
          if (this.elements.patternBtn) {
            this.elements.patternBtn.classList.add("active");
          }
          if (this.elements.patternSettings) {
            this.elements.patternSettings.style.display = "block";
          }
        } else {
          // For mural mode - check if already cropped
          if (this.state.hasCroppedImage) {
            // Already cropped, show preview directly
            this.CanvasController.showImagePreview(file);
          } else {
            // Show cropping interface for first time
            this.CanvasController.showCroppingInterfaceForImage(file);
          }
          // Update UI to reflect mural mode
          if (this.elements.singleBtn) {
            this.elements.singleBtn.classList.add("active");
          }
          if (this.elements.patternSettings) {
            this.elements.patternSettings.style.display = "none";
          }
        }
      }

      // Update upload state
      this.UIController.updateUploadState();
      const statusMessage =
        this.state.imageMode === "pattern" ? "Pattern loaded successfully" : "Image loaded successfully";
      this.UIController.updateUploadStatus(statusMessage);

      // If we have dimensions from storage, trigger appropriate update
      if (this.state.squareFootage > 0) {
        setTimeout(() => {
          if (this.state.imageMode === "pattern") {
            this.CanvasController.updatePatternPreview();
          } else {
            this.CanvasController.updateSingleImageDisplay();
          }
        }, 100);
      }
    } catch (error) {
      console.error("Failed to load pre-existing image:", {
        error: error,
        message: error.message,
        stack: error.stack,
        url: patternUrl,
        mode: this.state.imageMode,
      });
      this.UIController.hideLoadingSpinner(this.elements.uploadZone);
      // Show error message to user
      if (this.elements.uploadZone) {
        this.elements.uploadZone.innerHTML = `
          <div style="color: red; padding: 20px; text-align: center;">
            <p>Failed to load pre-existing image</p>
            <p style="font-size: 12px;">${error.message}</p>
            <p style="font-size: 12px; margin-top: 10px;">Please try uploading a new image</p>
          </div>
        `;
      }
      // Continue without pre-existing image
    }
  }
}

export { WallpaperImageProcessor };
