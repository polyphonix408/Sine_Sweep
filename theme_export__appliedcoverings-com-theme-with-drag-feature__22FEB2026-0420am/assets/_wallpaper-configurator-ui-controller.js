/**
 * Wallpaper Configurator UI Controller
 * Handles all UI-related operations for the wallpaper configurator
 * Extracted from WallpaperConfiguratorV2 for better separation of concerns
 */

class WallpaperConfiguratorUIController {
  constructor(configurator) {
    // Reference to main configurator for accessing state, config, and elements
    this.configurator = configurator;
    this.StorageManager = configurator.StorageManager;
    this.state = configurator.state;

    this.cacheElements();
  }

  inject(name, dependency) {
    this[name] = dependency;
  }

  // ========== ELEMENT MANAGEMENT & INITIALIZATION ==========

  cacheElements() {
    // Dimension inputs - updated to match new IDs
    this.elements = {
      widthFeet: document.getElementById("width-feet") || document.getElementById("input-width-feet"),
      widthInch: document.getElementById("width-inches") || document.getElementById("input-width-inch"),
      heightFeet: document.getElementById("height-feet") || document.getElementById("input-height-feet"),
      heightInch: document.getElementById("height-inches") || document.getElementById("input-height-inch"),

      // Material
      materialSelect: document.getElementById("material-select"),

      // Upload
      imageUpload: document.getElementById("image-upload"),
      uploadZone: document.getElementById("upload-zone"),
      previewArea: document.getElementById("preview-area"),
      previewImage: document.getElementById("preview-image"),
      patternCanvas: document.getElementById("pattern-canvas"),
      clearImageBtn: document.getElementById("clear-image"),
      recropBtn: document.getElementById("recrop-image"),

      // Cropping
      croppingArea: document.getElementById("cropping-area"),
      cropImage: document.getElementById("crop-image"),
      cancelCropBtn: document.getElementById("cancel-crop"),
      applyCropBtn: document.getElementById("apply-crop"),

      // Mode Toggle (single button)
      modePatternBtn: document.getElementById("mode-pattern-btn"),

      // Options
      mirrorBtn: document.getElementById("mirror-btn"),
      bwBtn: document.getElementById("bw-btn"),
      resetAllBtn: document.getElementById("reset-all-btn"),
      mirrorInput: document.getElementById("mirror-input"),
      bwInput: document.getElementById("black-and-white-input"),

      // Summary
      summaryMaterial: document.getElementById("summary-material"),
      summaryDimensions: document.getElementById("summary-dimensions"),
      summaryArea: document.getElementById("summary-area"),
      summaryImage: document.getElementById("summary-image"),
      summaryPrice: document.getElementById("summary-price"),

      // Quality
      qualityDPI: document.getElementById("quality-dpi"),
      qualityScore: document.getElementById("quality-score"),

      // Cart
      addToCartBtn: document.getElementById("add-to-cart-button"),

      // Pattern
      patternSettings: document.getElementById("pattern-settings"),
      patternSizeSlider: document.getElementById("pattern-size-slider"),
      patternSizeValue: document.getElementById("pattern-size-value"),

      // Hidden inputs
      squareFootageInput: document.getElementById("input-square-footage"),
      calculatedPriceInput: document.getElementById("input-calculated-price"),
    };
  }

  selectMaterial(e) {
    const selectedOption = e.target.options[e.target.selectedIndex];
    if (selectedOption.value) {
      this.state.selectedMaterial = {
        id: selectedOption.value,
        name: selectedOption.textContent,
        price: parseFloat(selectedOption.dataset.price) || 0,
      };
      this.state.selectedVariantId = selectedOption.value;
    } else {
      this.state.selectedMaterial = null;
      this.state.selectedVariantId = null;
    }

    this.updateMaterialDisplay();
    this.configurator.calculatePrice();
    this.configurator.validateForm();

    // Save state to localStorage
    this.StorageManager.saveStateToStorage();
  }

  handleImageUpload(e) {
    const file = e.target.files[0];
    if (this.configurator.ImageProcessor.validateFile(file)) {
      this.configurator.ImageProcessor.processImage(file);
    }
    e.target.value = "";
  }

  handleDragOver(e) {
    e.preventDefault();
    this.elements.uploadZone.classList.add("drag-over");
  }

  handleDragLeave(e) {
    e.preventDefault();
    this.elements.uploadZone.classList.remove("drag-over");
  }

  handleDrop(e) {
    e.preventDefault();
    this.elements.uploadZone.classList.remove("drag-over");

    const file = e.dataTransfer.files[0];
    if (this.configurator.ImageProcessor.validateFile(file)) {
      this.configurator.ImageProcessor.processImage(file);
    }
  }

  clearImage() {
    this.configurator.ImageProcessor.cleanupPreviousFile();

    this.state.uploadedImage = null;
    this.state.originalFile = null;
    this.state.croppedImage = null;
    this.state.cropperData = null;
    this.state.hasCroppedImage = false;
    this.state.originalImageS3Url = null;
    this.state.originalImageS3Key = null;
    this.state.previewImageS3Url = null;
    this.state.previewImageS3Key = null;
    this.state.imageDPI = 0;
    this.state.imageQuality = "No Image";
    this.state.tiffDataUrl = null;
    this.state.pdfDataUrl = null;

    if (this.elements.previewImage) {
      this.elements.previewImage.src = "";
    }
    if (this.elements.cropImage) {
      this.elements.cropImage.src = "";
    }

    // Hide zoom controls (since there's no image to zoom)
    const zoomControls = document.querySelector(".canvas-zoom-controls");
    if (zoomControls) {
      zoomControls.style.display = "none";
    }

    // Reset zoom state
    this.configurator.canvasZoom = 1;
    this.configurator.canvasPosition = { x: 0, y: 0 };
    this.CanvasController.updateCanvasTransform();

    if (this.elements.croppingArea) {
      this.elements.croppingArea.style.display = "none";
    }

    // Show upload zone
    this.elements.previewArea.style.display = "none";
    this.elements.uploadZone.style.display = "flex";

    if (this.elements.summaryImage) {
      this.elements.summaryImage.textContent = "No Image";
    }

    this.updateQualityDisplay();
    this.updateUploadState();
    this.configurator.validateForm();
  }

  bindEvents() {
    // Dimension changes with validation
    ["widthFeet", "widthInch", "heightFeet", "heightInch"].forEach((field) => {
      this.elements[field]?.addEventListener("input", (e) => {
        // Validate and limit input values
        const input = e.target;
        let value = parseInt(input.value) || 0;

        // Apply limits based on field type
        if (field.includes("Feet")) {
          // Limit feet to max 999
          if (value > 999) {
            value = 999;
            input.value = 999;
          }
        } else if (field.includes("Inch")) {
          // Limit inches to max 11
          if (value > 11) {
            value = 11;
            input.value = 11;
          }
        }

        // Prevent negative values
        if (value < 0) {
          input.value = 0;
        }

        this.configurator.calculateDimensions();
        this.StorageManager.saveStateToStorage(); // Save on dimension change
      });
    });

    // Material selection
    this.elements.materialSelect?.addEventListener("change", (e) => this.selectMaterial(e));

    // Image upload
    this.elements.imageUpload?.addEventListener("change", (e) => this.handleImageUpload(e));
    this.elements.uploadZone?.addEventListener("click", () => this.elements.imageUpload.click());

    // Drag and drop
    this.elements.uploadZone?.addEventListener("dragover", (e) => this.handleDragOver(e));
    this.elements.uploadZone?.addEventListener("dragleave", (e) => this.handleDragLeave(e));
    this.elements.uploadZone?.addEventListener("drop", (e) => this.handleDrop(e));

    this.elements.clearImageBtn?.addEventListener("click", () => this.clearImage());

    // Re-crop image
    this.elements.recropBtn?.addEventListener("click", () => this.CanvasController.recropImage());

    this.elements.cancelCropBtn?.addEventListener("click", () => this.CanvasController.cancelCrop());

    this.elements.applyCropBtn?.addEventListener("click", () => this.CanvasController.applyCrop());

    // Mode Toggle - Single button that toggles between pattern and mural
    this.elements.modePatternBtn?.addEventListener("click", () => {
      // Toggle between modes
      const newMode = this.configurator.state.imageMode === "pattern" ? "single" : "pattern";
      this.configurator.setImageMode(newMode);
    });

    // Options
    this.elements.mirrorBtn?.addEventListener("click", () => this.configurator.toggleOption("mirror"));
    this.elements.bwBtn?.addEventListener("click", () => this.configurator.toggleOption("blackAndWhite"));
    this.elements.resetAllBtn?.addEventListener("click", () => this.configurator.resetAll());

    // Pattern size slider - dynamically adjust based on wall dimensions
    this.elements.patternSizeSlider?.addEventListener("input", (e) => {
      this.configurator.state.patternSizeInches = parseInt(e.target.value);
      this.updatePatternSizeDisplay();
      if (this.configurator.state.uploadedImage && this.configurator.state.imageMode === "pattern") {
        this.updatePatternPreview();
      }
      // Update summary displays
      this.updateDimensionDisplay();
      // Save state
      this.StorageManager.saveStateToStorage();
    });

    // Canvas zoom controls - DISABLED FOR NOW
    // this.initCanvasZoomControls();

    // Add to cart
    this.elements.addToCartBtn?.addEventListener("click", () => this.configurator.addToCart());

    // Handle window resize for responsive canvas
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Only update if we have an image and dimensions
        if (this.configurator.state.uploadedImage && this.configurator.state.wallArea > 0) {
          // console.log("Window resized - updating canvas display");

          // Update pattern preview if in pattern mode
          if (this.configurator.state.imageMode === "pattern") {
            this.updatePatternPreview();
          } else {
            // For single image mode, just update the display
            this.updateSingleImageDisplay();
          }
        }
      }, 250); // Debounce delay of 250ms
    });

    // Clean up when tab is closed
    window.addEventListener("beforeunload", () => {
      this.clearObjectUrls();
      // Optionally clear session storage on tab close
      // this.StorageManager.clearStateFromStorage();
    });

    // Save state periodically (every 30 seconds) while tab is active
    setInterval(() => {
      if (document.visibilityState === "visible") {
        this.StorageManager.saveStateToStorage();
      }
    }, 30000);
  }

  initializeModeUI() {
    // Set initial state of pattern button and settings based on current mode
    if (this.elements.modePatternBtn) {
      if (this.configurator.state.imageMode === "pattern") {
        this.elements.modePatternBtn.classList.add("active");
        this.elements.modePatternBtn.classList.add("utility-btn--active");
      } else {
        this.elements.modePatternBtn.classList.remove("active");
        this.elements.modePatternBtn.classList.remove("utility-btn--active");
      }
    }

    // Ensure pattern settings visibility matches mode
    if (this.elements.patternSettings) {
      this.elements.patternSettings.style.display = this.configurator.state.imageMode === "pattern" ? "block" : "none";
    }

    // console.log("Mode UI initialized:", {
    //   mode: this.configurator.state.imageMode,
    //   buttonActive: this.configurator.state.imageMode === "pattern",
    //   patternSettingsVisible: this.configurator.state.imageMode === "pattern",
    // });
  }

  initCanvasZoomControls() {
    const canvas = this.elements.patternCanvas;
    const previewArea = this.elements.previewArea;
    const zoomControls = document.querySelector(".canvas-zoom-controls");
    const zoomInBtn = document.getElementById("canvas-zoom-in");
    const zoomOutBtn = document.getElementById("canvas-zoom-out");
    const zoomResetBtn = document.getElementById("canvas-zoom-reset");
    const zoomLevelDisplay = document.getElementById("canvas-zoom-level");

    // Initialize zoom state
    this.configurator.canvasZoom = 1;
    this.configurator.canvasPosition = { x: 0, y: 0 };
    this.configurator.isDragging = false;
    this.configurator.dragStart = { x: 0, y: 0 };

    // Zoom button handlers
    zoomInBtn?.addEventListener("click", () => {
      this.configurator.canvasZoom = Math.min(3, this.configurator.canvasZoom + 0.25);
      this.updateCanvasTransform();
    });

    zoomOutBtn?.addEventListener("click", () => {
      this.configurator.canvasZoom = Math.max(0.5, this.configurator.canvasZoom - 0.25);
      this.updateCanvasTransform();
    });

    zoomResetBtn?.addEventListener("click", () => {
      this.configurator.canvasZoom = 1;
      this.configurator.canvasPosition = { x: 0, y: 0 };
      this.updateCanvasTransform();
    });

    // Drag to pan functionality
    if (previewArea && canvas) {
      previewArea.addEventListener("mousedown", (e) => {
        if (this.configurator.state.imageMode === "pattern" && this.configurator.canvasZoom > 1) {
          this.configurator.isDragging = true;
          this.configurator.dragStart = {
            x: e.clientX - this.configurator.canvasPosition.x,
            y: e.clientY - this.configurator.canvasPosition.y,
          };
          previewArea.style.cursor = "grabbing";
        }
      });

      document.addEventListener("mousemove", (e) => {
        if (this.configurator.isDragging) {
          e.preventDefault();
          this.configurator.canvasPosition.x = e.clientX - this.configurator.dragStart.x;
          this.configurator.canvasPosition.y = e.clientY - this.configurator.dragStart.y;
          this.updateCanvasTransform();
        }
      });

      document.addEventListener("mouseup", () => {
        if (this.configurator.isDragging) {
          this.configurator.isDragging = false;
          if (previewArea) previewArea.style.cursor = this.configurator.canvasZoom > 1 ? "grab" : "default";
        }
      });

      // Mouse wheel for zoom (when over preview area)
      previewArea.addEventListener("wheel", (e) => {
        if (this.configurator.state.imageMode === "pattern" && canvas.style.display !== "none") {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.25 : 0.25;
          this.configurator.canvasZoom = Math.max(0.5, Math.min(3, this.configurator.canvasZoom + delta));
          this.updateCanvasTransform();
        }
      });
    }
  }

  // ========== DISPLAY UPDATES ==========

  updateDimensionDisplay() {
    const { widthFeet, widthInches, heightFeet, heightInches } = this.configurator.state.dimensions;

    let widthStr = widthFeet > 0 ? `${widthFeet}'` : "";
    if (widthInches > 0 || widthFeet === 0) {
      widthStr += `${widthInches.toFixed(1)}"`;
    }
    if (!widthStr) widthStr = `0.0"`;

    let heightStr = heightFeet > 0 ? `${heightFeet}'` : "";
    if (heightInches > 0 || heightFeet === 0) {
      heightStr += `${heightInches.toFixed(1)}"`;
    }
    if (!heightStr) heightStr = `0.0"`;

    if (this.elements.summaryDimensions) {
      this.elements.summaryDimensions.textContent = `${widthStr} × ${heightStr}`;
    }

    if (this.elements.summaryArea) {
      this.elements.summaryArea.textContent = `${this.configurator.state.squareFootage.toFixed(2)} sq ft`;
    }
  }

  updateMaterialDisplay() {
    if (this.elements.summaryMaterial) {
      this.elements.summaryMaterial.textContent = this.configurator.state.selectedMaterial?.name || "Select a Material";
    }
  }

  updateQualityDisplay() {
    if (this.elements.qualityDPI) {
      this.elements.qualityDPI.textContent = this.configurator.state.imageDPI || "0";
    }

    if (this.elements.qualityScore) {
      this.elements.qualityScore.textContent = this.configurator.state.imageQuality;

      // Update color based on quality
      this.elements.qualityScore.className = "quality-value";
      if (this.configurator.state.imageQuality !== "No Image") {
        this.elements.qualityScore.classList.add(this.configurator.state.imageQuality.toLowerCase());
      }
    }
  }

  updatePatternSizeDisplay() {
    if (!this.elements.patternSizeValue) return;

    const basePatternSize = 24; // Default pattern size
    const sizeInches = this.configurator.state.patternSizeInches;
    const percentage = Math.round((sizeInches / basePatternSize) * 100);

    // Update display to show both inches and scale
    if (percentage === 100) {
      this.elements.patternSizeValue.textContent = `${sizeInches}" (Original)`;
    } else if (percentage < 100) {
      this.elements.patternSizeValue.textContent = `${sizeInches}" (${percentage}% scale)`;
    } else {
      const multiplier = (sizeInches / basePatternSize).toFixed(1);
      this.elements.patternSizeValue.textContent = `${sizeInches}" (${multiplier}x size)`;
    }
  }

  updateUploadState() {
    if (!this.elements.uploadZone) return;

    // Always enable upload - no dimension gate
    this.elements.uploadZone.classList.remove("disabled");
    if (this.elements.imageUpload) {
      this.elements.imageUpload.disabled = false;
    }

    // Keep upload text consistent
    const uploadText = this.elements.uploadZone.querySelector(".upload-text");
    if (uploadText) {
      uploadText.textContent = "Click or Drag & Drop to Upload Image";
    }

    // Also disable/enable More Options based on image
    if (this.elements.patternBtn && this.elements.mirrorBtn && this.elements.bwBtn) {
      const hasImage = this.configurator.state.uploadedImage !== null;
      this.elements.patternBtn.disabled = !hasImage;
      this.elements.mirrorBtn.disabled = !hasImage;
      this.elements.bwBtn.disabled = !hasImage;

      // Add visual feedback
      [this.elements.patternBtn, this.elements.mirrorBtn, this.elements.bwBtn].forEach((btn) => {
        btn.classList.toggle("disabled", !hasImage);
      });
    }
  }

  updateUploadStatus(message) {
    // Update any status elements if they exist
    const statusEl = document.getElementById("upload-status");
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  updatePatternSliderConstraints() {
    if (!this.elements.patternSizeSlider) return;

    // Get wall dimensions in inches
    const wallWidthInches =
      this.configurator.state.dimensions.widthFeet * 12 + this.configurator.state.dimensions.widthInches;
    const wallHeightInches =
      this.configurator.state.dimensions.heightFeet * 12 + this.configurator.state.dimensions.heightInches;

    // Find the smallest dimension
    const smallestDimension = Math.min(wallWidthInches || 96, wallHeightInches || 72);

    // Set min to 12 inches, max to the smallest wall dimension (capped at 96 inches / 8 feet)
    const minSize = 12;
    const absoluteMax = 96; // 8 feet maximum pattern size
    const maxSize = Math.min(absoluteMax, Math.max(minSize, smallestDimension));

    // Update slider attributes
    this.elements.patternSizeSlider.min = minSize;
    this.elements.patternSizeSlider.max = maxSize;

    // Ensure current value is within bounds
    if (this.configurator.state.patternSizeInches < minSize) {
      this.configurator.state.patternSizeInches = minSize;
      this.elements.patternSizeSlider.value = minSize;
      if (this.elements.patternSizeValue) {
        this.updatePatternSizeDisplay();
      }
    } else if (this.configurator.state.patternSizeInches > maxSize) {
      this.configurator.state.patternSizeInches = maxSize;
      this.elements.patternSizeSlider.value = maxSize;
      if (this.elements.patternSizeValue) {
        this.updatePatternSizeDisplay();
      }
    }
  }

  // ========== SLIDER RANGE ==========

  updatePatternSliderRange() {
    // Get wall width (the limiting dimension for pattern size)
    const wallWidthInches =
      this.configurator.state.dimensions.widthFeet * 12 + this.configurator.state.dimensions.widthInches;

    if (wallWidthInches > 0 && this.elements.patternSizeSlider) {
      // Max pattern size is either wall width or 144" (12 feet), whichever is smaller
      // This prevents patterns larger than the wall itself
      const maxPatternSize = Math.min(wallWidthInches, 144);

      // Update slider max attribute
      this.elements.patternSizeSlider.max = maxPatternSize;

      // If current value exceeds new max, adjust it
      if (this.configurator.state.patternSizeInches > maxPatternSize) {
        this.configurator.state.patternSizeInches = maxPatternSize;
        this.elements.patternSizeSlider.value = maxPatternSize;
        this.updatePatternSizeDisplay();
      }

      // console.log("Updated pattern slider range:", {
      //   wallWidth: wallWidthInches,
      //   maxPattern: maxPatternSize,
      //   currentPattern: this.configurator.state.patternSizeInches,
      // });
    }
  }

  // ========== PATTERN PREVIEW ==========
  updatePatternPreview() {
    if (this.CanvasController && this.CanvasController.updatePatternPreview) {
      this.CanvasController.updatePatternPreview();
    }
  }

  // ========== SINGLE IMAGE DISPLAY ==========
  updateSingleImageDisplay() {
    if (this.CanvasController && this.CanvasController.updateSingleImageDisplay) {
      this.CanvasController.updateSingleImageDisplay();
    }
  }

  // ========== OBJECT URL CLEANUP ==========
  clearObjectUrls() {
    // Clean up object URLs to free memory
    this.configurator.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.configurator.objectUrls = [];
  }

  // ========== CANVAS TRANSFORM ==========
  updateCanvasTransform() {
    if (this.CanvasController && this.CanvasController.updateCanvasTransform) {
      this.CanvasController.updateCanvasTransform();
    }
  }

  // ========== LOADING & SPINNER UI ==========

  showLoadingSpinner(container, message = "Loading...") {
    if (!container) {
      console.error("Container not provided to showLoadingSpinner");
      return;
    }

    // Remove any existing spinner
    this.hideLoadingSpinner(container);

    // Create spinner overlay
    const overlay = document.createElement("div");
    overlay.className = "loading-overlay";
    overlay.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;

    // Make container relative if not already
    const position = window.getComputedStyle(container).position;
    if (position === "static") {
      container.style.position = "relative";
    }

    container.appendChild(overlay);
    // console.log("Loading spinner shown:", message);
  }

  hideLoadingSpinner(container) {
    if (!container) {
      console.error("Container not provided to hideLoadingSpinner");
      return;
    }
    const overlay = container.querySelector(".loading-overlay");
    if (overlay) {
      overlay.remove();
      // console.log("Loading spinner hidden");
    }
  }
}

export { WallpaperConfiguratorUIController };
