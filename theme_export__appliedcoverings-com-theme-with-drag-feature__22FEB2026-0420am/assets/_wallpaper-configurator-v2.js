/**
 * Wallpaper Configurator V2 - Clean Implementation
 * Simplified version based on wireframe design
 */
import { WallpaperConfiguratorUIController } from "./wallpaper-configurator-ui-controller.js";
import { WallpaperConfiguratorCanvasController } from "./wallpaper-configurator-canvas-controller.js";
import { WallpaperImageProcessor } from "./wallpaper-configurator-image-processor.js";
import { WallpaperStorageManager } from "./wallpaper-configurator-storage-manager.js";

class WallpaperConfiguratorV2 {
  constructor() {
    this.config = {
      productId: document.querySelector("#wallpaper-configurator")?.dataset.productId,
      minSquareFootage: 12,
      minFileSize: 50 * 1024, // 50KB
      maxFileSize: 1 * 1024 * 1024 * 1024, // 1GB
      allowedFileTypes: ["image/jpeg", "image/jpg", "image/png", "image/tiff", "image/tif", "application/pdf"],
      enableS3: true, // Enable S3 uploads
    };

    // Track object URLs for cleanup
    this.objectUrls = [];

    this.state = {
      initialized: false,
      dimensions: { widthFeet: 0, widthInches: 0, heightFeet: 0, heightInches: 0 },
      squareFootage: 0,
      selectedMaterial: null,
      uploadedImage: null,
      originalFile: null, // Store the original file for S3 upload
      processedPreviewImageFile: null, // Processed image with crop + mirror + B&W applied
      cropperData: null, // Store cropper data for metadata
      originalImageS3Url: null, // S3 URL for final image
      originalImageS3Key: null,
      previewImageS3Url: null, // S3 URL for preview image
      previewImageS3Key: null,
      totalPrice: 0,
      cropper: null,
      imageDPI: 0,
      imageQuality: "No Image",
      options: {
        mirror: false,
        blackAndWhite: false,
      },
      imageMode: "single", // 'single' or 'pattern'
      patternSizeInches: 24, // Pattern size in inches (default 24x24)
      imageAspectRatio: 1, // Actual aspect ratio of uploaded image
      isUploading: false,
      hasValidDimensions: false, // Track if dimensions are valid
    };

    // Dependencies
    this.s3 = null;
    if (this.config.enableS3 && window.S3Integration) {
      this.s3 = new S3Integration();
      // console.log("S3 integration initialized");
    }
    this.StorageManager = new WallpaperStorageManager(this);
    this.UIController = new WallpaperConfiguratorUIController(this);
    this.CanvasController = new WallpaperConfiguratorCanvasController(this);
    this.ImageProcessor = new WallpaperImageProcessor(this);

    this.UIController.inject("CanvasController", this.CanvasController);
    this.CanvasController.inject("ImageProcessor", this.ImageProcessor);

    this.elements = this.UIController.elements;

    // this.init();
  }

  async init() {
    console.log("INIT WALLPAPER CONFIGURATOR V2");
    this.UIController.bindEvents();
    this.StorageManager.cleanupOldSessions();
    this.StorageManager.loadStateFromStorage();
    this.setDefaultMaterial();

    // If we loaded dimensions from storage, recalculate to ensure everything is in sync
    if (this.state.squareFootage > 0) {
      this.calculateDimensions(); // This one is IMPORTANT
    }

    await this.ImageProcessor.checkForPreExistingPattern(); // Check for pre-existing pattern from product
    this.updateUI();
    this.UIController.updatePatternSliderConstraints(); // Set initial slider constraints
    this.UIController.updateUploadState(); // Set initial upload state
    this.validateForm(); // Ensure form validation on load

    // Initialize mode UI to match current state (default is 'single')
    this.UIController.initializeModeUI();

    this.state.initialized = true;
  }

  // ========== DIMENSIONS ==========
  /**
   * Update pattern size display showing scale information
   */

  /**
   * Update pattern slider max value based on wall dimensions
   */

  calculateDimensions() {
    console.log("CALCULATE DIMENSIONS");
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

    // Enable/disable upload based on dimensions
    this.UIController.updateUploadState();

    this.UIController.updateDimensionDisplay();
    this.calculatePrice();
    this.validateForm();

    // Update pattern slider range when dimensions change
    this.UIController.updatePatternSliderRange();
    this.UIController.updatePatternSizeDisplay();

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

  // ========== MATERIAL ==========
  setDefaultMaterial() {
    const selectedOption = this.elements.materialSelect?.options[this.elements.materialSelect.selectedIndex];
    if (selectedOption && selectedOption.value) {
      this.state.selectedMaterial = {
        id: selectedOption.value,
        name: selectedOption.textContent,
        price: parseFloat(selectedOption.dataset.price) || 0,
      };
      this.UIController.updateMaterialDisplay();
      this.calculatePrice();
    }
  }

  // ========== PRICING ==========
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

  // ========== STATE MANAGEMENT ==========
  resetAll() {
    console.log("REST ALL");
    localStorage.removeItem("wallpaper_configurator_state"); // This key doesn't seem to exist in the code

    this.UIController.clearImage();

    // Reset dimensions
    this.state.dimensions = {
      widthFeet: 0,
      widthInches: 0,
      heightFeet: 0,
      heightInches: 0,
    };
    this.state.squareFootage = 0;

    // Reset dimension inputs
    if (this.elements.widthFeet) this.elements.widthFeet.value = "";
    if (this.elements.widthInches) this.elements.widthInches.value = "";
    if (this.elements.heightFeet) this.elements.heightFeet.value = "";
    if (this.elements.heightInches) this.elements.heightInches.value = "";

    // Reset material to first option
    if (this.elements.materialSelect) {
      this.elements.materialSelect.selectedIndex = 1; // First actual option after "SELECT A MATERIAL"
      // Trigger material change event
      const event = new Event("change");
      this.elements.materialSelect.dispatchEvent(event);
    }

    // Reset pattern size to default (24 inches)
    this.state.patternSizeInches = 24;
    if (this.elements.patternSizeSlider) {
      this.elements.patternSizeSlider.value = 24;
    }
    if (this.elements.patternSizeValue) {
      this.UIController.updatePatternSizeDisplay();
    }

    // Update slider constraints for the reset dimensions
    this.UIController.updatePatternSliderConstraints();

    // Reset options (mirror & B&W)
    this.state.options.mirror = false;
    this.state.options.blackAndWhite = false;

    if (this.elements.mirrorBtn) {
      this.elements.mirrorBtn.classList.remove("active");
    }
    if (this.elements.bwBtn) {
      this.elements.bwBtn.classList.remove("active");
    }
    if (this.elements.mirrorInput) {
      this.elements.mirrorInput.value = "0";
    }
    if (this.elements.bwInput) {
      this.elements.bwInput.value = "0";
    }

    // Reset image mode to single
    this.state.imageMode = "single";
    if (this.elements.modeSingleBtn && this.elements.modePatternBtn) {
      this.elements.modeSingleBtn.classList.add("active");
      this.elements.modePatternBtn.classList.remove("active");
    }
    if (this.elements.patternSettings) {
      this.elements.patternSettings.style.display = "none";
    }

    // Reset zoom
    this.canvasZoom = 1;
    this.canvasPosition = { x: 0, y: 0 };
    this.CanvasController.updateCanvasTransform();

    // Hide zoom controls
    const zoomControls = document.querySelector(".canvas-zoom-controls");
    if (zoomControls) {
      zoomControls.style.display = "none";
    }

    // Update UI
    this.updateUI();
    this.validateForm();
  }

  // ========== OPTIONS ==========
  toggleOption(option) {
    this.state.options[option] = !this.state.options[option];

    const btn = option === "mirror" ? this.elements.mirrorBtn : this.elements.bwBtn;
    const input = option === "mirror" ? this.elements.mirrorInput : this.elements.bwInput;

    // console.log(`Toggle ${option}:`, this.state.options[option]); // Debug log

    if (this.state.options[option]) {
      btn.classList.add("active");
      input.value = "1";
    } else {
      btn.classList.remove("active");
      input.value = "0";
    }

    // Apply transformations to preview
    this.CanvasController.applyImageTransformations();

    // Update summary display
    this.updateUI();

    // Save state
    this.StorageManager.saveStateToStorage();
  }

  // ========== PATTERN MODE ==========
  setImageMode(mode) {
    // Don't allow mode change if in forced pattern mode
    if (this.state.forcePatternMode) return;

    // If switching to pattern mode and currently in crop mode, cancel the crop
    if (mode === "pattern" && this.state.cropper) {
      this.CanvasController.cancelCrop({ preserveUploadedImage: true });
    }

    // Update state
    this.state.imageMode = mode;

    // Update pattern toggle button - single button toggle
    if (this.elements.modePatternBtn) {
      if (mode === "pattern") {
        this.elements.modePatternBtn.classList.add("active");
        this.elements.modePatternBtn.classList.add("utility-btn--active");
      } else {
        this.elements.modePatternBtn.classList.remove("active");
        this.elements.modePatternBtn.classList.remove("utility-btn--active");
      }
    }

    // Show/hide pattern settings based on mode
    if (this.elements.patternSettings) {
      this.elements.patternSettings.style.display = mode === "pattern" ? "block" : "none";
    }

    // Show/hide zoom controls
    const zoomControls = document.querySelector(".canvas-zoom-controls");
    if (zoomControls && this.state.uploadedImage) {
      zoomControls.style.display = mode === "pattern" ? "block" : "none";
    }

    // If we have an image, update the preview based on the new mode
    if (this.state.uploadedImage || this.state.originalFile) {
      const imageToUse = this.state.croppedImage ?? this.state.originalFile ?? this.state.uploadedImage;

      if (mode === "pattern") {
        this.CanvasController.showPatternPreview(imageToUse);
        // Hide recrop button in pattern mode
        if (this.elements.recropBtn) {
          this.elements.recropBtn.style.display = "none";
        }
      } else {
        // Switch back to single image preview
        if (this.elements.patternCanvas) {
          this.elements.patternCanvas.style.display = "none";
        }

        // If there's no cropped image yet, re-open the cropper interface
        // Otherwise show the preview of the cropped/uploaded image
        if (!this.state.croppedImage && this.state.originalFile) {
          if (this.state.originalFile.type.includes("pdf")) {
            this.CanvasController.showCroppingInterfaceForPDF(this.state.pdfDataUrl);
          } else {
            this.CanvasController.showCroppingInterface(this.state.originalFile);
          }
        } else {
          const imageToUse = this.state.croppedImage || this.state.uploadedImage;

          if (this.elements.previewImage) {
            // Update preview to show the correct image
            if (imageToUse !== this.state.uploadedImage) {
              this.CanvasController.showImagePreview(imageToUse);
            } else {
              this.elements.previewImage.style.display = "block";
            }
          }
          // Show recrop button in single mode when showing preview
          if (this.elements.recropBtn) {
            this.elements.recropBtn.style.display = "block";
          }
        }

        // Reset zoom when switching to single mode
        this.canvasZoom = 1;
        this.canvasPosition = { x: 0, y: 0 };
        this.CanvasController.updateCanvasTransform();

        // Update summary
        if (this.elements.summaryImage) {
          this.elements.summaryImage.textContent = imageToUse.name || "Image";
        }
      }
    }

    // Save state
    this.StorageManager.saveStateToStorage();
  }

  // ========== FORM VALIDATION ==========
  validateForm() {
    // Allow adding to cart as long as we have all three components
    // Dimensions can be set after image upload
    const hasValidDimensions = this.state.squareFootage >= this.config.minSquareFootage;
    const hasMaterial = this.state.selectedMaterial !== null;
    const hasImage = this.state.uploadedImage !== null;

    // All three are still required for cart, but order doesn't matter
    const isValid = hasValidDimensions && hasMaterial && hasImage;

    if (this.elements.addToCartBtn) {
      this.elements.addToCartBtn.disabled = !isValid;
    }
  }

  // ========== CART ==========
  async addToCart() {
    if (!this.validateBeforeCart()) return;

    // Disable button and show uploading status
    this.elements.addToCartBtn.disabled = true;
    this.elements.addToCartBtn.textContent = "Processing...";

    // Upload to S3 if enabled and not already uploaded
    if (this.s3 && !this.state.originalImageS3Key) {
      this.elements.addToCartBtn.textContent = "Uploading image...";
      if (!this.state.isPreExisting) {
        try {
          // Upload the ORIGINAL file, not the edited/cropped version
          let file = this.state.originalFile;
          // For TIFF/PDF, we still need to upload the original file
          // The conversion is only for browser preview
          // Note: If backend can't handle TIFF/PDF, uncomment the conversion code below
          if (this.state.tiffDataUrl) {
            const blob = this.ImageProcessor.dataURLtoBlob(this.state.tiffDataUrl);
            file = new File([blob], this.state.originalFile.name, {
              type: "image/png",
            });
          } else if (this.state.pdfDataUrl) {
            const blob = this.ImageProcessor.dataURLtoBlob(this.state.pdfDataUrl);
            file = new File([blob], this.state.originalFile.name, {
              type: "image/png",
            });
          }

          const uploadResult = await this.s3.uploadFile(file, {
            productId: this.config.productId,
            dimensions: this.formatDimensions(),
            squareFootage: this.state.squareFootage,
            mirror: this.state.options.mirror,
            blackAndWhite: this.state.options.blackAndWhite,
          });
          console.log("Original image uploaded to S3:", uploadResult);
          this.state.originalImageS3Url = await this.s3.getDownloadUrl(uploadResult?.key);
          this.state.originalImageS3Key = uploadResult?.key;
        } catch (error) {
          console.error("Original image processing failed:", error);
        }
      }

      try {
        const file =
          this.state.processedPreviewImageFile ??
          (await this.ImageProcessor.generateProcessedPreview()) ??
          this.state.uploadedImage;
        const uploadResult = await this.s3.uploadFile(file, {
          productId: this.config.productId,
          dimensions: this.formatDimensions(),
          squareFootage: this.state.squareFootage,
          mirror: this.state.options.mirror,
          blackAndWhite: this.state.options.blackAndWhite,
        });
        console.log("Preview image uploaded to S3:", uploadResult);
        this.state.previewImageS3Url = await this.s3.getDownloadUrl(uploadResult?.key);
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
      Dimensions: this.formatDimensions(),
      _Square_Footage: this.state.squareFootage.toFixed(2),
      "Image Name": this.state.originalFile ? this.state.originalFile.name : this.state.uploadedImage.name,
      _Original_File_Type: this.state.originalFile ? this.state.originalFile.type : "unknown",
      _Is_Pre_Existing: this.state.isPreExisting ? "Yes" : "No",
      _Pre_Existing_URL: this.state.preExistingUrl ? `https:${this.state.preExistingUrl}` : "N/A",
      _Original_Image_URL: this.state.originalImageS3Url || "Local file",
      _Original_Image_S3_Key: this.state.originalImageS3Key || "N/A",
      _Preview_Image_S3_URL: this.state.previewImageS3Url || "N/A",
      _Preview_Image_S3_Key: this.state.previewImageS3Key || "N/A",
      "Image Mode": this.state.imageMode === "pattern" ? "Pattern/Tile" : "Single Image",
      Mirror: this.state.options.mirror ? "Yes" : "No",
      "Black & White": this.state.options.blackAndWhite ? "Yes" : "No",
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

  // ========== HELPER METHODS ==========
  validateBeforeCart() {
    if (this.state.squareFootage < this.config.minSquareFootage) {
      alert(`Minimum ${this.config.minSquareFootage} square feet required.`);
      return false;
    }

    if (!this.state.selectedMaterial) {
      alert("Please select a material.");
      return false;
    }

    if (!this.state.uploadedImage) {
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

  // ========== UI UPDATE ==========
  updateUI() {
    this.UIController.updateDimensionDisplay();
    this.UIController.updateMaterialDisplay();
    this.UIController.updateQualityDisplay();
    this.calculatePrice();
    this.validateForm();
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("wallpaper-configurator")) {
    window.wallpaperConfigurator = new WallpaperConfiguratorV2();

    // Expose reinit method globally for launch button
    window.reinitWallpaperConfigurator = function () {
      if (window.wallpaperConfigurator && window.wallpaperConfigurator.reinitDisplay) {
        window.wallpaperConfigurator.reinitDisplay();
      }
    };
  }
});

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  if (window.wallpaperConfigurator && window.wallpaperConfigurator.objectUrls) {
    window.wallpaperConfigurator.objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }
});
