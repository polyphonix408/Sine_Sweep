import EventBus, {
  PRE_EXISTING_FILE_LOADED,
  OPTIONS_UPDATED,
  DIMENSIONS_UPDATED,
  IMAGE_CROPPED,
  MATERIAL_SELECTED,
  SWITCHING_MODE,
} from "./event-bus.js";
import ConfiguratorPreviewController from "./configurator-preview-controller.js";
import ConfiguratorCropperController from "./configurator-cropper-controller.js";
import StorageManager from "./wallpaper-configurator-storage-manager.js";
import Utils from "./utils.js";

const INIT_STATE = {
  mode: "",
  originalFile: null,
  processedFile: null,
  originalImageS3Url: null, // S3 url for the original file
  originalImageS3Key: null,
  previewImageS3Url: null, // S3 url for the processed file
  previewImageS3Key: null,
  hasPreExisting: false,
  preExistingUrl: "",
  dimensions: { widthFeet: 0, widthInches: 0, heightFeet: 0, heightInches: 0 },
  hasValidDimensions: false,
  patternSizeInches: 24,
  patternOffsetX: 0,
  patternOffsetY: 0,
  imageQuality: "No Image",
  imageDPI: 0,
  options: {
    mirror: false,
    blackAndWhite: false,
  },
  selectedMaterial: null,
  selectedVariantId: null,
  squareFootage: 0,
  totalPrice: 0,
  squareFootage: 0,
  initialized: false,
};

if (!customElements.get("wallpaper-configurator")) {
  class WallpaperConfigurator extends HTMLElement {
    constructor() {
      super();
      console.log("LOG: NEW WallpaperConfigurator constructor");

      this.config = {
        productId: document.querySelector("#wallpaper-configurator")?.dataset.productId,
        minSquareFootage: 12,
        minFileSize: 50 * 1024, // 50KB
        maxFileSize: 1 * 1024 * 1024 * 1024, // 1GB
        allowedFileTypes: ["image/jpeg", "image/jpg", "image/png", "image/tiff", "image/tif", "application/pdf"],
        enableS3: true,
      };
      this.objectUrls = [];
      this.state = { ...INIT_STATE };

      // Dependencies
      this.PreviewController = new ConfiguratorPreviewController(this);
      this.CropperController = new ConfiguratorCropperController(this);
      this.StorageManager = new StorageManager(this);
      this.S3 = null;
      if (this.config.enableS3 && window.S3Integration) {
        this.S3 = new S3Integration();
        // console.log("S3 integration initialized");
      }
    }

    connectedCallback() {
      this.selectElements();
      this.attachEventListeners();
      // Initialize only for custom-wallpaper page, mural/coastal will be initialized on click
      if (this.data.template === "product.wallpaper") this.init();

      this.intervalId = setInterval(() => {
        if (document.visibilityState === "visible") {
          this.StorageManager.saveStateToStorage();
        }
      }, 30000);
    }

    async init() {
      this.StorageManager.cleanupOldSessions();
      this.StorageManager.loadStateFromStorage();
      console.log("configurator initialized with", this.state);
      const file = await this.getPreExistingFile();
      if (file) {
        this.state.hasPreExisting = true;
        this.state.preExistingUrl = this.data.pattern_url;
        this.state.originalFile = file;
        this.elements.summaryImage.textContent = Utils.getFileNameWithoutExtension(file.name) || "Image";
      }

      this.updateUI();
      this.setDefaultMaterial();
      this.calculateDimensions();
      this.updatePatternSliderConstraints();
      this.updateUploadState();
      this.validateForm();

      if (this.data.force_pattern_mode) {
        this.setMode("pattern");
      } else if (this.data.force_mural_mode) {
        this.setMode("single");
      }

      this.state.initialized = true;
    }

    // Single (mural) mode supports cropping, pattern mode does not
    async setMode(mode = "single") {
      if (this.state.initialized && this.state.mode && (this.data.force_pattern_mode || this.data.force_mural_mode)) {
        console.error("Mode is forced, no mode switching");
        return;
      }

      this.state.mode = mode;
      console.log("set mode", this.state);
      if (!this.state.originalFile && !this.state.processedFile) return;

      switch (mode) {
        case "pattern":
          this.prepareUIForPatternMode();

          if (this.state.hasPreExisting) {
            EventBus.emit(PRE_EXISTING_FILE_LOADED, { file: this.state.originalFile, mode });
            break;
          }

          EventBus.emit(SWITCHING_MODE, { file: this.state.processedFile ?? this.state.originalFile, mode });

          break;

        case "single":
          this.prepareUIForSingleMode();

          if (this.state.hasPreExisting) {
            EventBus.emit(PRE_EXISTING_FILE_LOADED, { file: this.state.originalFile, mode });
            break;
          }

          EventBus.emit(SWITCHING_MODE, { file: this.state.processedFile ?? this.state.originalFile, mode });

          break;
      }
    }

    async getPreExistingFile() {
      const _url = this.data?.pattern_url;
      if (!_url) {
        console.log("No pre-existing pattern URL found");
        return;
      }

      let url = _url;
      if (url.startsWith("//")) url = "https:" + url;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load image: ${response.status} ${response.statusText}`);

        const blob = await response.blob();
        const { fileExtension, fileType } = Utils.getFileInfo(blob);
        const filename = this.data.product.title
          ? `${this.data.product.title.replace(/\s+/g, "_")}.${fileExtension}`
          : `pattern.${fileExtension}`;
        const file = new File([blob], filename, { type: fileType });
        console.log("LOG: FILE", file);

        return file;
      } catch (error) {
        console.error("ERROR: Failed to get pre-existing file", error);
      }
    }

    selectElements() {
      this.elements = {
        root: this.querySelector("#wallpaper-configurator"),

        bottomCardsContainer: this.querySelector(".bottom-cards-container"),

        widthFeet: this.querySelector("#width-feet") ?? this.querySelector("#input-width-feet"),
        widthInch: this.querySelector("#width-inches") ?? this.querySelector("#input-width-inch"),
        heightFeet: this.querySelector("#height-feet") ?? this.querySelector("#input-height-feet"),
        heightInch: this.querySelector("#height-inches") ?? this.querySelector("#input-height-inch"),
        // Material
        materialSelect: this.querySelector("#material-select"),
        // Upload
        imageUpload: this.querySelector("#image-upload"),
        uploadZone: this.querySelector("#upload-zone"),
        previewArea: this.querySelector("#preview-area"),
        previewImage: this.querySelector("#preview-image"),
        patternCanvas: this.querySelector("#pattern-canvas"),
        clearImageBtn: this.querySelector("#clear-image"),
        recropBtn: this.querySelector("#recrop-image"),
        // Cropping
        croppingArea: this.querySelector("#cropping-area"),
        cropImage: this.querySelector("#crop-image"),
        cancelCropBtn: this.querySelector("#cancel-crop"),
        applyCropBtn: this.querySelector("#apply-crop"),
        // Mode Toggle (single button)
        modePatternBtn: this.querySelector("#mode-pattern-btn"),
        modeToggleControls: this.querySelector(".mode-toggle-controls"),
        // Options
        mirrorBtn: this.querySelector("#mirror-btn"),
        bwBtn: this.querySelector("#bw-btn"),
        resetAllBtn: this.querySelector("#reset-all-btn"),
        mirrorInput: this.querySelector("#mirror-input"),
        bwInput: this.querySelector("#black-and-white-input"),
        // Summary
        summaryMaterial: this.querySelector("#summary-material"),
        summaryDimensions: this.querySelector("#summary-dimensions"),
        summaryArea: this.querySelector("#summary-area"),
        summaryImage: this.querySelector("#summary-image"),
        summaryPrice: this.querySelector("#summary-price"),
        // Quality
        qualityDPI: this.querySelector("#quality-dpi"),
        qualityScore: this.querySelector("#quality-score"),
        // Cart
        addToCartBtn: this.querySelector("#add-to-cart-button"),
        // Pattern
        patternSettings: this.querySelector("#pattern-settings"),
        patternSizeSlider: this.querySelector("#pattern-size-slider"),
        patternSizeValue: this.querySelector("#pattern-size-value"),
        resetPositionBtn: this.querySelector("#reset-position-btn"),
        patternDragHint: this.querySelector("#pattern-drag-hint"),
        // Hidden inputs
        squareFootageInput: this.querySelector("#input-square-footage"),
        calculatedPriceInput: this.querySelector("#input-calculated-price"),
      };

      try {
        this.data = JSON.parse(this.querySelector("#data").textContent);
        console.log("LOG: DATA", this.data);
      } catch (error) {
        this.data = {};
        console.error("ERROR: Failed to parse JSON data", error);
      }
    }

    // ==== HELPERS - START ====

    setDefaultMaterial() {
      const selectedOption = this.elements.materialSelect?.options[this.elements.materialSelect.selectedIndex];
      if (selectedOption && selectedOption.value) {
        this.state.selectedMaterial = {
          id: selectedOption.value,
          name: selectedOption.textContent,
          price: parseFloat(selectedOption.dataset.price) || 0,
        };
        this.updateMaterialDisplay();
        this.calculatePrice();
      }
    }

    updatePatternSizeDisplay() {
      if (!this.elements.patternSizeValue) return;

      const basePatternSize = 24; // Default pattern size
      const sizeInches = this.state.patternSizeInches;
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

    updateMaterialDisplay() {
      this.elements.materialSelect.value = this.state.selectedVariantId ?? "";
      if (this.elements.summaryMaterial) {
        this.elements.summaryMaterial.textContent = this.state.selectedMaterial?.name || "Select a Material";
      }
    }

    updateImageQuality() {
      // Recalculate DPI based on new dimensions if we have an image
      if (!this.state.processedFile && !this.state.originalFile) return;

      // Create a temporary image object to recalculate
      if (this.state.originalImageDimensions) {
        // Use a mock image object with the stored dimensions
        const mockImg = {
          naturalWidth: this.state.originalImageDimensions.width,
          naturalHeight: this.state.originalImageDimensions.height,
        };
        // Call the main calculation method with our mock image
        this.calculateImageQualityFromImg(mockImg);
      }
    }

    calculatePrice() {
      if (!this.state.selectedMaterial || this.state.squareFootage <= 0) {
        this.state.totalPrice = 0;
      } else {
        // Price is now actual price per sq ft (e.g., $7.00 = $7/sq ft)
        const pricePerSqFt = parseFloat(this.state.selectedMaterial.price) || 0;
        this.state.totalPrice = this.state.squareFootage * pricePerSqFt;

        // Debug logging
        // console.log("Price calculation:", {
        //   squareFootage: this.state.squareFootage,
        //   pricePerSqFt: pricePerSqFt,
        //   materialPrice: this.state.selectedMaterial.price,
        //   totalPrice: this.state.totalPrice,
        // });
      }

      // Update hidden input
      if (this.elements.calculatedPriceInput) {
        this.elements.calculatedPriceInput.value = this.state.totalPrice.toFixed(2);
      }

      // Update display
      if (this.elements.summaryPrice) {
        this.elements.summaryPrice.textContent = `$${this.state.totalPrice.toFixed(2)}`;
      }
    }

    validateForm() {
      // Allow adding to cart as long as we have all three components
      // Dimensions can be set after image upload
      const hasValidDimensions = this.state.squareFootage >= this.config.minSquareFootage;
      const hasMaterial = this.state.selectedMaterial !== null;
      const hasImage = this.state.processedFile !== null || this.state.originalFile !== null;

      // All three are still required for cart, but order doesn't matter
      const isValid = hasValidDimensions && hasMaterial && hasImage;

      if (this.elements.addToCartBtn) {
        this.elements.addToCartBtn.disabled = !isValid;
      }
    }

    calculateDimensions() {
      const widthFeet = parseFloat(this.elements.widthFeet?.value) || 0;
      const widthInches = parseFloat(this.elements.widthInch?.value) || 0;
      const heightFeet = parseFloat(this.elements.heightFeet?.value) || 0;
      const heightInches = parseFloat(this.elements.heightInch?.value) || 0;

      const totalWidthInches = widthFeet * 12 + widthInches;
      const totalHeightInches = heightFeet * 12 + heightInches;

      // Maximum dimensions check (999 ft = 11,988 inches max per side)
      const MAX_INCHES = 12000; // ~1000 feet
      if (totalWidthInches > MAX_INCHES) {
        alert("Maximum width is 1000 feet");
        this.elements.widthFeet.value = 999;
        this.elements.widthInch.value = 0;
        return;
      }
      if (totalHeightInches > MAX_INCHES) {
        alert("Maximum height is 1000 feet");
        this.elements.heightFeet.value = 999;
        this.elements.heightInch.value = 0;
        return;
      }

      // Maximum total area check to prevent browser crashes
      const squareFeet = (totalWidthInches * totalHeightInches) / 144;
      const MAX_SQUARE_FEET = 100000; // 100,000 sq ft max
      if (squareFeet > MAX_SQUARE_FEET) {
        alert(
          `Maximum total area is ${MAX_SQUARE_FEET.toLocaleString()} square feet. Current: ${Math.round(squareFeet).toLocaleString()} sq ft`,
        );
        return;
      }

      // Validate minimum width (6 inches) - guard rail per AC
      if (totalWidthInches > 0 && totalWidthInches < 6) {
        alert("Minimum width is 6 inches");
        // Reset to minimum
        this.elements.widthFeet.value = 0;
        this.elements.widthInch.value = 6;
        this.state.dimensions = { widthFeet: 0, widthInches: 6, heightFeet, heightInches };
        return;
      }

      // Validate minimum height (6 inches) - applying same guard rail
      if (totalHeightInches > 0 && totalHeightInches < 6) {
        alert("Minimum height is 6 inches");
        // Reset to minimum
        this.elements.heightFeet.value = 0;
        this.elements.heightInch.value = 6;
        this.state.dimensions = { widthFeet, widthInches, heightFeet: 0, heightInches: 6 };
        return;
      }

      this.state.dimensions = { widthFeet, widthInches, heightFeet, heightInches };
      this.state.squareFootage = (totalWidthInches * totalHeightInches) / 144;
      // Check if dimensions are valid (minimum 12 sq ft)
      this.state.hasValidDimensions = this.state.squareFootage >= this.config.minSquareFootage;

      // Update hidden input
      if (this.elements.squareFootageInput) {
        this.elements.squareFootageInput.value = this.state.squareFootage.toFixed(2);
      }

      // // Enable/disable upload based on dimensions
      // this.UIController.updateUploadState();
      //
      // this.UIController.updateDimensionDisplay();
      // this.calculatePrice();
      // this.validateForm();
      //
      // // Update pattern slider range when dimensions change
      // this.UIController.updatePatternSliderRange();
      // this.UIController.updatePatternSizeDisplay();

      //TODO: Everything above handled, the following will be handled thru events
      //TODO: pattern mode path handled
      return;
      // Update cropper aspect ratio if cropper exists
      if (this.state.cropper) {
        this.CanvasController.updateCropperAspectRatio();
      }

      // Update display based on current mode
      if (this.state.uploadedImage && this.state.squareFootage > 0) {
        if (this.state.imageMode === "pattern") {
          this.CanvasController.updatePatternPreview();
        } else if (this.state.imageMode === "single") {
          // For mural mode, update the display to show dimensions
          this.CanvasController.updateMuralDisplay();
        }
      }

      // Update pattern slider constraints based on new dimensions
      this.UIController.updatePatternSliderConstraints();

      // Update the preview if we have an image
      if (this.state.uploadedImage || this.state.originalFile) {
        if (this.state.imageMode === "pattern") {
          // Re-render pattern with new dimensions
          this.CanvasController.updatePatternPreview();
        } else {
          // For full image mode, update the aspect ratio of the display
          // The cropped image itself doesn't change, but we may want to show dimension info
          this.CanvasController.updateImageQuality();

          // Update cropper aspect ratio if we're currently cropping
          if (this.state.cropper && this.elements.croppingArea.style.display !== "none") {
            const totalWidthInches = this.state.dimensions.widthFeet * 12 + this.state.dimensions.widthInches;
            const totalHeightInches = this.state.dimensions.heightFeet * 12 + this.state.dimensions.heightInches;

            if (totalWidthInches && totalHeightInches) {
              const newAspectRatio = totalWidthInches / totalHeightInches;
              // console.log("Updating cropper aspect ratio to:", newAspectRatio);

              // Update the cropper's aspect ratio
              this.state.cropper.setAspectRatio(newAspectRatio);

              // Reset crop box to full size with new aspect ratio
              this.state.cropper.reset();
              this.state.cropper.setCropBoxData({
                left: 0,
                top: 0,
                width: this.state.cropper.getContainerData().width,
                height: this.state.cropper.getContainerData().width / newAspectRatio,
              });
            }
          }
        }
      }

      // Save state to localStorage
      this.StorageManager.saveStateToStorage();
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
        const hasImage = this.state.processedFile !== null || this.state.originalFile !== null;
        this.elements.patternBtn.disabled = !hasImage;
        this.elements.mirrorBtn.disabled = !hasImage;
        this.elements.bwBtn.disabled = !hasImage;

        // Add visual feedback
        [this.elements.patternBtn, this.elements.mirrorBtn, this.elements.bwBtn].forEach((btn) => {
          btn.classList.toggle("disabled", !hasImage);
        });
      }
    }

    updateDimensionsSummary() {
      const { widthFeet, widthInches, heightFeet, heightInches } = this.state.dimensions;

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
        this.elements.summaryArea.textContent = `${this.state.squareFootage.toFixed(2)} sq ft`;
      }
    }

    updatePatternSliderRange() {
      // Get wall width (the limiting dimension for pattern size)
      const wallWidthInches = this.state.dimensions.widthFeet * 12 + this.state.dimensions.widthInches;

      if (wallWidthInches > 0 && this.elements.patternSizeSlider) {
        // Max pattern size is either wall width or 144" (12 feet), whichever is smaller
        // This prevents patterns larger than the wall itself
        const maxPatternSize = Math.min(wallWidthInches, 144);

        // Update slider max attribute
        this.elements.patternSizeSlider.max = maxPatternSize;

        // If current value exceeds new max, adjust it
        if (this.state.patternSizeInches > maxPatternSize) {
          this.state.patternSizeInches = maxPatternSize;
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

    updatePatternSliderConstraints() {
      if (!this.elements.patternSizeSlider) return;
      const { widthFeet, widthInches, heightFeet, heightInches } = this.state.dimensions;

      // Get wall dimensions in inches
      const wallWidthInches = widthFeet * 12 + widthInches;
      const wallHeightInches = heightFeet * 12 + heightInches;

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
      if (this.state.patternSizeInches < minSize) {
        this.state.patternSizeInches = minSize;
        this.elements.patternSizeSlider.value = minSize;
        if (this.elements.patternSizeValue) {
          this.updatePatternSizeDisplay();
        }
      } else if (this.state.patternSizeInches > maxSize) {
        this.state.patternSizeInches = maxSize;
        this.elements.patternSizeSlider.value = maxSize;
        if (this.elements.patternSizeValue) {
          this.updatePatternSizeDisplay();
        }
      }
    }

    updateModeUI() {
      if (this.state.mode === "pattern") {
        this.elements.modePatternBtn?.classList.add("active");
        this.elements.modePatternBtn?.classList.add("utility-btn--active");
        this.elements.bottomCardsContainer.querySelector(".crop-helper-card").classList.add("hidden");
        this.elements.bottomCardsContainer.querySelector(".quality-card").classList.add("hidden");
      } else {
        this.elements.modePatternBtn?.classList.remove("active");
        this.elements.modePatternBtn?.classList.remove("utility-btn--active");
        this.elements.bottomCardsContainer.querySelector(".crop-helper-card").classList.remove("hidden");
        this.elements.bottomCardsContainer.querySelector(".quality-card").classList.remove("hidden");
      }

      if (this.elements.patternSettings) {
        this.elements.patternSettings.style.display = this.state.mode === "pattern" ? "block" : "none";
      }
    }

    updateDimensionDisplay() {
      const { widthFeet, widthInches, heightFeet, heightInches } = this.state.dimensions;

      this.elements.heightFeet.value = heightFeet;
      this.elements.heightInch.value = heightInches;
      this.elements.widthFeet.value = widthFeet;
      this.elements.widthInch.value = widthInches;

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
        this.elements.summaryArea.textContent = `${this.state.squareFootage.toFixed(2)} sq ft`;
      }
    }

    updateUploadStatus(message) {
      const statusEl = this.querySelector("#upload-status");
      if (statusEl) {
        statusEl.textContent = message;
      }
    }

    updateUI() {
      this.updateDimensionDisplay();
      this.updateMaterialDisplay();
      this.updateQualityDisplay();
      this.updateModeUI();
      this.calculatePrice();
      this.validateForm();

      this.elements.modeSingleBtn?.classList.toggle("active", this.state.mode === "single");
      this.elements.modePatternBtn?.classList.toggle("active", this.state.mode === "pattern");

      this.elements.mirrorBtn?.classList.toggle("active", this.state.options.mirror);
      this.elements.bwBtn?.classList.toggle("active", this.state.options.blackAndWhite);
    }

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

    calculateImageQuality(dataUrl) {
      const img = new Image();
      img.onload = () => {
        this.calculateImageQualityFromImg(img);
      };
      img.src = dataUrl;
    }

    calculateImageQualityFromImg(img) {
      // Get output dimensions based on mode
      let totalWidthInches, totalHeightInches;
      let imagePixelWidth, imagePixelHeight;

      if (this.state.mode === "pattern") {
        // For pattern mode: DPI is based on pattern tile size
        totalWidthInches = this.state.patternSizeInches;
        totalHeightInches = this.state.patternSizeInches;
        imagePixelWidth = img.naturalWidth;
        imagePixelHeight = img.naturalHeight;

        // console.log("Pattern mode DPI calc:", {
        //   patternSize: this.configurator.state.patternSizeInches,
        //   imageWidth: imagePixelWidth,
        //   imageHeight: imagePixelHeight,
        // });
      } else {
        // For mural mode: DPI is based on wall dimensions
        totalWidthInches = this.state.dimensions.widthFeet * 12 + this.state.dimensions.widthInches || 48;
        totalHeightInches = this.state.dimensions.heightFeet * 12 + this.state.dimensions.heightInches || 36;

        // Check if we have cropper data (after cropping)
        if (this.state.cropperData && this.state.cropperData.width && this.state.cropperData.height) {
          // Use cropped dimensions
          imagePixelWidth = Math.round(this.state.cropperData.width);
          imagePixelHeight = Math.round(this.state.cropperData.height);

          // console.log("Using cropped dimensions for DPI:", {
          //   cropWidth: imagePixelWidth,
          //   cropHeight: imagePixelHeight,
          //   wallWidth: totalWidthInches,
          //   wallHeight: totalHeightInches,
          // });
        } else {
          // Use original image dimensions
          imagePixelWidth = img.naturalWidth;
          imagePixelHeight = img.naturalHeight;
        }
      }

      // Calculate DPI for width and height
      const dpiWidth = imagePixelWidth / totalWidthInches;
      const dpiHeight = imagePixelHeight / totalHeightInches;

      // Use the lower DPI (worst case) for quality assessment
      const minDPI = Math.min(dpiWidth, dpiHeight);
      const avgDPI = Math.round((dpiWidth + dpiHeight) / 2);

      // Store the average but assess quality on minimum
      this.state.imageDPI = avgDPI;

      // Determine quality based on the minimum DPI (weakest dimension)
      if (minDPI >= 300) {
        this.state.imageQuality = "Excellent";
      } else if (minDPI >= 150) {
        this.state.imageQuality = "Good";
      } else if (minDPI >= 72) {
        this.state.imageQuality = "Fair";
      } else {
        this.state.imageQuality = "Poor";
      }

      console.log("DPI Calculation:", {
        mode: this.state.mode,
        imagePixels: `${imagePixelWidth} × ${imagePixelHeight}`,
        outputInches: `${totalWidthInches}" × ${totalHeightInches}"`,
        dpiWidth: Math.round(dpiWidth),
        dpiHeight: Math.round(dpiHeight),
        avgDPI: avgDPI,
        minDPI: Math.round(minDPI),
        quality: this.state.imageQuality,
      });

      this.updateQualityDisplay();
    }

    updateQualityDisplay() {
      if (this.elements.qualityDPI) {
        this.elements.qualityDPI.textContent = this.state.imageDPI || "0";
      }

      if (this.elements.qualityScore) {
        this.elements.qualityScore.textContent = this.state.imageQuality;

        // Update color based on quality
        this.elements.qualityScore.className = "quality-value";
        if (this.state.imageQuality !== "No Image") {
          this.elements.qualityScore.classList.add(this.state.imageQuality.toLowerCase());
        }
      }
    }

    validateBeforeCart() {
      if (this.state.squareFootage < this.config.minSquareFootage) {
        alert(`Minimum ${this.config.minSquareFootage} square feet required.`);
        return false;
      }

      if (!this.state.selectedMaterial) {
        alert("Please select a material.");
        return false;
      }

      if (!this.state.hasPreExisting && !this.state.originalFile) {
        alert("Please upload an image.");
        return false;
      }

      return true;
    }

    formatDimensions() {
      const { widthFeet, widthInches, heightFeet, heightInches } = this.state.dimensions;

      let widthStr = widthFeet > 0 ? `${widthFeet}'${widthInches.toFixed(1)}"` : `${widthInches.toFixed(1)}"`;
      let heightStr = heightFeet > 0 ? `${heightFeet}'${heightInches.toFixed(1)}"` : `${heightInches.toFixed(1)}"`;

      return `${widthStr} × ${heightStr}`;
    }

    prepareUIForPatternMode() {
      this.cancelCrop({ preserveUploadedImage: true });
      this.elements.uploadZone.style.display = "none";
      this.elements.previewArea.style.display = "flex";
      this.elements.previewImage.style.display = "none";
      this.elements.bottomCardsContainer.querySelector(".crop-helper-card").classList.add("hidden");
      this.elements.bottomCardsContainer.querySelector(".quality-card").classList.add("hidden");
      if (this.elements.patternCanvas) this.elements.patternCanvas.style.display = "block";
      if (this.elements.recropBtn) this.elements.recropBtn.style.display = "none";
      if (this.elements.patternSettings) this.elements.patternSettings.style.display = "block";
      // Show zoom controls for pattern mode
      const zoomControls = document.querySelector(".canvas-zoom-controls");
      if (zoomControls && this.state.originalFile) zoomControls.style.display = "block";
      // Show drag hint
      this.elements.patternDragHint &&
        (this.elements.patternDragHint.style.display = "block");
      // // Update mode toggle button to active state
      // if (this.elements.modePatternBtn) {
      //   this.elements.modePatternBtn.classList.add("active");
      //   this.elements.modePatternBtn.classList.add("utility-btn--active");
      // }
    }

    prepareUIForSingleMode() {
      this.elements.patternSettings.style.display = "none";
      this.elements.previewArea.style.display = "none";
      if (this.elements.patternCanvas) this.elements.patternCanvas.style.display = "none";
      // Hide zoom controls for single mode
      const zoomControls = document.querySelector(".canvas-zoom-controls");
      if (zoomControls) zoomControls.style.display = "none";
      // Hide drag hint
      this.elements.patternDragHint &&
        (this.elements.patternDragHint.style.display = "none");

      if (this.elements.recropBtn && !this.data.force_pattern_mode)
        this.elements.recropBtn.style.display = "inline-block";
    }

    // This should be the only method that generates the final processed file
    generateProcessedPreview() {
      console.log("LOG", this.state);
      const canvas = this.elements.patternCanvas;
      if (canvas.checkVisibility()) {
        return new Promise((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const fileName = "PREVIEW_" + (this.state.processedFile?.name ?? this.state.originalFile?.name);
                const file = new File([blob], fileName, { type: "image/png" });
                resolve(file);
              }
              reject(new Error("Failed to generate blob from canvas"));
            },
            "image/png",
            0.95,
          );
        });
      }

      return new Promise((resolve, reject) => {
        // Create canvas to apply transformations
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          // const { widthFeet, widthInches, heightFeet, heightInches } = this.state.dimensions;
          // let wallWidthInches = widthFeet * 12 + widthInches;
          // let wallHeightInches = heightFeet * 12 + heightInches;
          //
          // // Use default dimensions if not set (8x6 feet)
          // if (!wallWidthInches || wallWidthInches === 0) wallWidthInches = 96;
          // if (!wallHeightInches || wallHeightInches === 0) wallHeightInches = 72;
          // const wallAspectRatio = wallWidthInches / wallHeightInches;
          //
          // // Set canvas internal resolution (higher for clarity)
          // const baseWidth = 1200;
          // canvas.width = baseWidth;
          // canvas.height = Math.round(baseWidth / wallAspectRatio);

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
                const fileName = "PREVIEW_" + this.state.processedFile?.name;
                const file = new File([blob], fileName, { type: "image/png" });
                resolve(file);
              } else {
                reject(new Error("Failed to generate blob from canvas"));
              }
            },
            "image/png",
            0.95,
          );
        };

        img.onerror = (err) => {
          reject(new Error("Failed to load image for processing", err));
        };

        // Determine image source from state
        if (this.state.processedFile || this.state.originalFile) {
          img.src = URL.createObjectURL(this.state.processedFile ?? this.state.originalFile);
        } else if (this.elements.previewImage?.src) {
          img.src = this.elements.previewImage.src;
        } else {
          reject(new Error("No image source available"));
        }
      });
    }

    resetOptions() {
      this.state.options.mirror = false;
      this.state.options.blackAndWhite = false;

      this.elements.modePatternBtn?.classList.remove("active");
      this.elements.modePatternBtn?.classList.remove("utility-btn--active");
      this.state.mode = "";

      this.elements.mirrorBtn?.classList.remove("active");
      this.elements.bwBtn?.classList.remove("active");
      if (this.elements.mirrorInput) this.elements.mirrorInput.value = "0";
      if (this.elements.bwInput) this.elements.bwInput.value = "0";
    }

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
    // ==== HELPERS - END ====

    // ==== EVENT HANDLERS - START ====

    toggleOption(option) {
      this.state.options[option] = !this.state.options[option];

      const btn = option === "mirror" ? this.elements.mirrorBtn : this.elements.bwBtn;
      const input = option === "mirror" ? this.elements.mirrorInput : this.elements.bwInput;

      console.log(`Toggle ${option}:`, this.state.options[option]); // Debug log

      if (this.state.options[option]) {
        btn.classList.add("active");
        input.value = "1";
      } else {
        btn.classList.remove("active");
        input.value = "0";
      }

      EventBus.emit(OPTIONS_UPDATED, { options: this.state.options });
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
        this.state.selectedVariantId = "";
      }

      EventBus.emit(MATERIAL_SELECTED, {});

      this.updateMaterialDisplay();
      this.calculatePrice();
      this.validateForm();
    }

    applyCrop() {
      if (!this.state.cropper) return;

      this.state.cropperData = this.state.cropper.getData();

      const canvas = this.state.cropper.getCroppedCanvas();
      canvas.toBlob(async (blob) => {
        // Create a new file from the blob for preview only
        const croppedFile = new File([blob], this.state.originalFile.name, {
          type: this.state.originalFile.type,
        });

        // Store the cropped version separately
        // this.state.croppedImage = croppedFile;
        // this.state.uploadedImage = croppedFile; // Current displayed image
        // this.state.hasCroppedImage = true; // Mark as cropped
        this.state.processedFile = croppedFile;
        // Note: originalFile remains unchanged for pattern use

        // Reset S3 data since image changed
        this.state.originalImageS3Url = null;
        this.state.originalImageS3Key = null;
        this.state.previewImageS3Url = null;
        this.state.previewImageS3Key = null;

        // Hide cropping, show preview
        this.elements.croppingArea.style.display = "none";

        EventBus.emit(IMAGE_CROPPED, { file: croppedFile });

        // Update summary
        if (this.elements.summaryImage) {
          const nameWithoutExt = Utils.getFileNameWithoutExtension(croppedFile.name);
          let imageText = nameWithoutExt;
          if (this.state.mode === "pattern") {
            imageText += ` (Pattern ${this.state.patternSizeInches}")`;
          }
          this.elements.summaryImage.textContent = imageText;
        }

        this.state.cropper.destroy();
        this.state.cropper = null;

        this.validateForm();
        this.calculateImageQuality(this.elements.cropImage.src);
        this.updateUploadStatus("Image cropped - ready to add to cart");
      });
    }

    recropImage() {
      if (this.data.force_pattern_mode) return;

      // Use original file if available, otherwise use uploaded image
      const fileToRecrop = this.state.originalFile || this.state.processedFile;
      if (!fileToRecrop) return;

      // If in pattern mode, switch back to single mode
      // if (this.state.mode === "pattern") {
      //   this.configurator.setImageMode("single"); // Use setImageMode to properly update all UI
      // }

      // Hide preview
      this.elements.previewArea.style.display = "none";
      this.elements.uploadZone.style.display = "none";
      // Reset canvas if visible
      if (this.elements.patternCanvas) this.elements.patternCanvas.style.display = "none";

      if (fileToRecrop.type === "application/pdf") {
        this.CropperController.showCroppingInterface({ dataUrl: this.state.pdfCanvasUrl });
      } else if (fileToRecrop.type === "image/tiff") {
        this.CropperController.showCroppingInterface({ dataUrl: this.state.tiffDataUrl });
      } else {
        this.CropperController.showCroppingInterface({ file: fileToRecrop });
      }
      // This fixes issue with resizing crop box
      this.CropperController.updateCropperAspectRatio();
    }

    cancelCrop({ preserveUploadedImage = false } = {}) {
      if (this.state.cropper) {
        this.state.cropper.destroy();
        this.state.cropper = null;
      }

      this.elements.croppingArea.style.display = "none";
      this.elements.uploadZone.style.display = "flex";

      if (!preserveUploadedImage) {
        this.state.processedFile = null;
        this.state.originalFile = null;
        this.reset();
      }
    }

    handleImageUpload(e) {
      const file = e.target.files[0];
      if (this.validateFile(file)) {
        this.state.originalFile = file;
        // Pattern mode doesn't allow file upload right??
        // Handle case: image upload with pattern mode toggled
        this.setMode(this.state.mode || "single");
      }
      e.target.value = "";
    }

    async addToCart() {
      if (!this.validateBeforeCart()) return;

      // Disable button and show uploading status
      this.elements.addToCartBtn.disabled = true;
      this.elements.addToCartBtn.textContent = "Processing...";

      // Upload to S3 if enabled and not already uploaded
      if (this.S3 && !this.state.originalImageS3Key) {
        this.elements.addToCartBtn.textContent = "Uploading image...";
        if (!this.state.hasPreExisting) {
          try {
            // Upload the ORIGINAL file, not the edited/cropped version
            let file = this.state.originalFile;
            // For TIFF/PDF, we still need to upload the original file
            // The conversion is only for browser preview
            // Note: If backend can't handle TIFF/PDF, uncomment the conversion code below
            if (this.state.tiffCanvasUrl) {
              const blob = this.dataURLtoBlob(this.state.tiffCanvasUrl);
              // window.open(this.state.tiffCanvasUrl, "_blank"); // DEBUGGING
              file = new File([blob], this.state.originalFile.name, {
                type: "image/png",
              });
            } else if (this.state.pdfCanvasUrl) {
              const blob = this.dataURLtoBlob(this.state.pdfCanvasUrl);
              // window.open(this.state.pdfCanvasUrl, "_blank"); // DEBUGGING
              file = new File([blob], this.state.originalFile.name, {
                type: "image/png",
              });
            }

            const uploadResult = await this.S3.uploadFile(file, {
              productId: this.config.productId,
              dimensions: this.formatDimensions(),
              squareFootage: this.state.squareFootage,
              mirror: this.state.options.mirror,
              blackAndWhite: this.state.options.blackAndWhite,
            });
            console.log("Original image uploaded to S3:", uploadResult);
            this.state.originalImageS3Url = await this.S3.getDownloadUrl(uploadResult?.key);
            this.state.originalImageS3Key = uploadResult?.key;
          } catch (error) {
            console.error("Original image processing failed:", error);
          }
        }

        try {
          const file = (await this.generateProcessedPreview()) ?? this.state.originalFile;
          // window.open(URL.createObjectURL(file), "_blank"); // DEBUGGING
          // throw new Error("Debugging - remove this line to enable preview upload");
          const uploadResult = await this.S3.uploadFile(file, {
            productId: this.config.productId,
            dimensions: this.formatDimensions(),
            squareFootage: this.state.squareFootage,
            mirror: this.state.options.mirror,
            blackAndWhite: this.state.options.blackAndWhite,
          });
          console.log("Preview image uploaded to S3:", uploadResult);
          this.state.previewImageS3Url = await this.S3.getDownloadUrl(uploadResult?.key);
          this.state.previewImageS3Key = uploadResult?.key;
        } catch (error) {
          console.error("Preview image processing failed:", error);
        }
      }

      // Quantity is square footage rounded up
      const quantity = Math.ceil(this.state.squareFootage);

      // Debug log options state
      // console.log("Options state before cart:", {
      //   mirror: this.state.options.mirror,
      //   blackAndWhite: this.state.options.blackAndWhite,
      // });

      // Calculate pattern metadata if in pattern mode
      const totalWidthInches = this.state.dimensions.widthFeet * 12 + this.state.dimensions.widthInches;
      const totalHeightInches = this.state.dimensions.heightFeet * 12 + this.state.dimensions.heightInches;

      let patternMetadata = {};
      if (this.state.imageMode === "pattern") {
        // Pattern size is now directly in inches
        const patternSizeInches = this.state.patternSizeInches;
        const tilesHorizontal = Math.ceil(totalWidthInches / patternSizeInches);
        const tilesVertical = Math.ceil(totalHeightInches / patternSizeInches);

        patternMetadata = {
          "_Pattern Size (inches)": patternSizeInches,
          "_Tiles Horizontal": tilesHorizontal,
          "_Tiles Vertical": tilesVertical,
          "_Total Tiles": tilesHorizontal * tilesVertical,
          "_Pattern Offset X": Math.round(this.state.patternOffsetX),
          "_Pattern Offset Y": Math.round(this.state.patternOffsetY),
        };
      }

      // Prepare cropper metadata if in single mode
      let cropperMetadata = {};
      if (this.state.cropperData) {
        cropperMetadata = {
          "_Crop X": Math.round(this.state.cropperData.x),
          "_Crop Y": Math.round(this.state.cropperData.y),
          "_Crop Width": Math.round(this.state.cropperData.width),
          "_Crop Height": Math.round(this.state.cropperData.height),
          "_Crop Rotate": this.state.cropperData.rotate || 0,
          "_Crop ScaleX": this.state.cropperData.scaleX || 1,
          "_Crop ScaleY": this.state.cropperData.scaleY || 1,
        };
      }
      // Add original image dimensions
      if (this.state.originalImageDimensions) {
        cropperMetadata["_Original Image Width"] = this.state.originalImageDimensions.width;
        cropperMetadata["_Original Image Height"] = this.state.originalImageDimensions.height;
        cropperMetadata["_Original Aspect Ratio"] = (
          this.state.originalImageDimensions.width / this.state.originalImageDimensions.height
        ).toFixed(3);
      }

      // Prepare line item properties
      const properties = {
        "Image Name": this.state.originalFile ? this.state.originalFile.name : this.state.processedFile.name,
        "Image Mode": this.state.mode === "pattern" ? "Pattern/Tile" : "Single Image",
        "Black & White": this.state.options.blackAndWhite ? "Yes" : "No",
        Dimensions: this.formatDimensions(),
        Mirror: this.state.options.mirror ? "Yes" : "No",
        _Square_Footage: this.state.squareFootage.toFixed(2),
        _Original_File_Type: this.state.originalFile ? this.state.originalFile.type : "unknown",
        _Is_Pre_Existing: this.state.hasPreExisting ? "Yes" : "No",
        _Pre_Existing_URL: this.state.preExistingUrl ? `https:${this.state.preExistingUrl}` : "N/A",
        _Original_Image_URL: this.state.originalImageS3Url || "N/A",
        _Original_Image_S3_Key: this.state.originalImageS3Key || "N/A",
        _Preview_Image_S3_URL: this.state.previewImageS3Url || "N/A",
        _Preview_Image_S3_Key: this.state.previewImageS3Key || "N/A",
        // _pdf_generation_info: JSON.stringify({
        //   sourceKey: this.state.originalImageS3Key,
        //   dimensions: this.state.dimensions,
        //   mode: this.state.imageMode,
        //   patternSizeInches: this.state.patternSizeInches,
        //   cropData: this.state.cropperData ?? this.state.cropper?.getData(),
        //   options: this.state.options,
        // }),
        _Pattern_Size_Inches: this.state.patternSizeInches,
        _DPI_Assessment: this.state.imageQuality,
        _Crop_Data: this.state.cropperData ?? this.state.cropper?.getData(),
        _get_crop_box_data: this.state.cropper?.getCropBoxData(),
        _get_cropped_canvas: this.state.cropper?.getCroppedCanvas(),
        ...patternMetadata,
        ...cropperMetadata,
      };
      const guestCustomerId = sessionStorage.getItem("guest_customer_id");
      if (guestCustomerId) properties["_guest_customer_id"] = guestCustomerId;

      const cartData = {
        id: this.state.selectedMaterial.id,
        quantity: quantity,
        properties: properties,
      };

      this.elements.addToCartBtn.textContent = "Adding to cart...";

      try {
        const response = await fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cartData),
        });

        if (response.ok) {
          // Clear localStorage on successful cart add
          this.StorageManager.clearStateFromStorage();
          window.location.href = "/cart";
        } else {
          throw new Error("Failed to add to cart");
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        alert("Error adding to cart. Please try again.");

        this.elements.addToCartBtn.disabled = false;
        this.elements.addToCartBtn.innerHTML =
          '<svg class="cart-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6m0 0v2m0-2h2m-2 0h-2"/></svg><span>Add To Cart</span>';
      }
    }

    handleDragOver(e) {
      e.preventDefault();
      this.elements.uploadZone.classList.add("drag-over");
    }

    handleDrop(e) {
      e.preventDefault();
      this.elements.uploadZone.classList.remove("drag-over");

      const file = e.dataTransfer.files[0];
      if (this.validateFile(file)) {
        this.state.originalFile = file;
        this.setMode(this.state.mode || "single");
      }
    }

    handleDragLeave(e) {
      e.preventDefault();
      this.elements.uploadZone.classList.remove("drag-over");
    }

    // ==== EVENT LISTENERS - END ====

    attachEventListeners() {
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

          this.calculateDimensions();
          this.updateUploadState();
          this.updateDimensionsSummary();
          this.calculatePrice();
          this.validateForm();

          // Update pattern slider range when dimensions change
          // this.updatePatternSliderRange();
          // this.updatePatternSliderConstraints();

          EventBus.emit(DIMENSIONS_UPDATED, { dimensions: this.state.dimensions });
        });

        this.elements[field]?.addEventListener("blur", (e) => {
          const input = e.target;
          const value = parseFloat(input.value);
          if (!isNaN(value)) input.value = value;
          else input.value = 0;
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

      this.elements.clearImageBtn?.addEventListener("click", () => this.reset());

      // Re-crop image
      this.elements.recropBtn?.addEventListener("click", () => this.recropImage());

      this.elements.cancelCropBtn?.addEventListener("click", () => this.cancelCrop());

      this.elements.applyCropBtn?.addEventListener("click", () => this.applyCrop());

      // Mode Toggle - Single button that toggles between pattern and mural
      this.elements.modePatternBtn?.addEventListener("click", () => {
        const newMode = this.state.mode === "pattern" ? "single" : "pattern";
        this.elements.modePatternBtn.classList.toggle("active");
        this.elements.modePatternBtn.classList.toggle("utility-btn--active");
        this.elements.bottomCardsContainer.querySelector(".crop-helper-card").classList.toggle("hidden");
        this.elements.bottomCardsContainer.querySelector(".quality-card").classList.toggle("hidden");
        this.setMode(newMode);
      });

      // Options
      this.elements.mirrorBtn?.addEventListener("click", () => this.toggleOption("mirror"));
      this.elements.bwBtn?.addEventListener("click", () => this.toggleOption("blackAndWhite"));
      this.elements.resetAllBtn?.addEventListener("click", () => this.configurator.resetAll());

      // Pattern size slider - dynamically adjust based on wall dimensions
      this.elements.patternSizeSlider?.addEventListener("input", (e) => {
        this.state.patternSizeInches = parseInt(e.target.value);
        this.updatePatternSizeDisplay();
        if (this.state.mode === "pattern") {
          this.PreviewController.updatePatternPreview();
        }
        // Update summary displays
        this.updateDimensionDisplay();
      });

      // Canvas zoom controls - DISABLED FOR NOW
      // this.initCanvasZoomControls();

      // Add to cart
      this.elements.addToCartBtn?.addEventListener("click", () => this.addToCart());

      // ─── Pattern drag-to-reposition ───────────────────────────
      const patternCanvas = this.elements.patternCanvas;
      let isDragging = false;
      let dragStartX = 0;
      let dragStartY = 0;
      let startOffsetX = 0;
      let startOffsetY = 0;

      if (patternCanvas) {
        patternCanvas.style.cursor = "grab";

        patternCanvas.addEventListener("pointerdown", (e) => {
          if (this.state.mode !== "pattern") return;
          isDragging = true;
          patternCanvas.style.cursor = "grabbing";
          patternCanvas.setPointerCapture(e.pointerId);
          dragStartX = e.clientX;
          dragStartY = e.clientY;
          startOffsetX = this.state.patternOffsetX;
          startOffsetY = this.state.patternOffsetY;
          e.preventDefault();
        });

        patternCanvas.addEventListener("pointermove", (e) => {
          if (!isDragging) return;
          const rect = patternCanvas.getBoundingClientRect();
          const scaleX = patternCanvas.width / rect.width;
          const scaleY = patternCanvas.height / rect.height;
          const dx = (e.clientX - dragStartX) * scaleX;
          const dy = (e.clientY - dragStartY) * scaleY;

          this.state.patternOffsetX = startOffsetX - dx;
          this.state.patternOffsetY = startOffsetY - dy;

          const imgSrc = this.elements.previewImage?.src;
          if (imgSrc) {
            this.PreviewController.generatePreviewFromDataUrl(imgSrc);
          }
        });

        patternCanvas.addEventListener("pointerup", (e) => {
          if (!isDragging) return;
          isDragging = false;
          patternCanvas.style.cursor = "grab";
          patternCanvas.releasePointerCapture(e.pointerId);
        });

        patternCanvas.addEventListener("pointercancel", (e) => {
          isDragging = false;
          patternCanvas.style.cursor = "grab";
        });
      }

      // Reset position button
      this.elements.resetPositionBtn?.addEventListener("click", () => {
        this.state.patternOffsetX = 0;
        this.state.patternOffsetY = 0;
        const imgSrc = this.elements.previewImage?.src;
        if (imgSrc) {
          this.PreviewController.generatePreviewFromDataUrl(imgSrc);
        }
      });

      // // Handle window resize for responsive canvas
      // let resizeTimeout;
      // window.addEventListener("resize", () => {
      //   clearTimeout(resizeTimeout);
      //   resizeTimeout = setTimeout(() => {
      //     // Only update if we have an image and dimensions
      //     if (this.state.uploadedImage && this.state.wallArea > 0) {
      //       // console.log("Window resized - updating canvas display");
      //
      //       // Update pattern preview if in pattern mode
      //       if (this.configurator.state.imageMode === "pattern") {
      //         this.updatePatternPreview();
      //       } else {
      //         // For single image mode, just update the display
      //         this.updateSingleImageDisplay();
      //       }
      //     }
      //   }, 250); // Debounce delay of 250ms
      // });
      //
      // // Clean up when tab is closed
      // window.addEventListener("beforeunload", () => {
      //   this.clearObjectUrls();
      //   // Optionally clear session storage on tab close
      //   // this.StorageManager.clearStateFromStorage();
      // });
      //
      // // Save state periodically (every 30 seconds) while tab is active
      // setInterval(() => {
      //   if (document.visibilityState === "visible") {
      //     this.StorageManager.saveStateToStorage();
      //   }
      // }, 30000);
    }

    removeImage() {
      // this.configurator.ImageProcessor.cleanupPreviousFile();

      // this.state.originalFile = null;
      this.state.processedFile = null;

      // this.state.croppedImage = null;
      this.state.cropperData = null;
      this.state.patternOffsetX = 0;
      this.state.patternOffsetY = 0;
      // this.state.hasCroppedImage = false;
      // this.state.originalImageS3Url = null;
      // this.state.originalImageS3Key = null;
      // this.state.previewImageS3Url = null;
      // this.state.previewImageS3Key = null;
      // this.state.imageDPI = 0;
      // this.state.imageQuality = "No Image";
      this.state.tiffDataUrl = null;
      this.state.pdfDataUrl = null;

      this.resetOptions();

      // Hide zoom controls (since there's no image to zoom)
      const zoomControls = document.querySelector(".canvas-zoom-controls");
      if (zoomControls) zoomControls.style.display = "none";

      // Reset zoom state
      this.canvasZoom = 1;
      this.canvasPosition = { x: 0, y: 0 };
      // this.CanvasController.updateCanvasTransform();

      if (this.elements.croppingArea) this.elements.croppingArea.style.display = "none";

      // Show upload zone
      this.elements.previewArea.style.display = "none";
      this.elements.uploadZone.style.display = "flex";

      if (this.elements.summaryImage) this.elements.summaryImage.textContent = "No Image";

      this.updateQualityDisplay();
      this.updateUploadState();
      this.validateForm();
      this.cleanUp();
    }

    cleanUp() {
      this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
      this.objectUrls = [];

      if (this.state.cropper) {
        this.state.cropper.destroy();
        this.state.cropper = null;
      }

      if (this.elements.previewImage) this.elements.previewImage.src = "";
      if (this.elements.cropImage) this.elements.cropImage.src = "";

      if (this.elements.patternCanvas) {
        const ctx = this.elements.patternCanvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, this.elements.patternCanvas.width, this.elements.patternCanvas.height);
          this.elements.patternCanvas.width = 1;
          this.elements.patternCanvas.height = 1;
        }
      }
      // Cleanup other canvases?

      clearInterval(this.intervalId);
    }

    reset() {
      this.state = { ...INIT_STATE, initialized: true };
      this.removeImage();
      this.updateUI();
      this.StorageManager.clearStateFromStorage();
    }

    disconnectedCallback() {
      this.cleanUp();
    }
  }
  customElements.define("wallpaper-configurator", WallpaperConfigurator);
}

window.addEventListener("beforeunload", () => {});
