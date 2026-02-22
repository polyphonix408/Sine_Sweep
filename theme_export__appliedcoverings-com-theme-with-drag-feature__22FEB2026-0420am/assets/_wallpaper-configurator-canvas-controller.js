/**
 * Wallpaper Configurator Canvas Controller
 * Handles all canvas/cropping operations for the wallpaper configurator
 * Extracted from WallpaperConfiguratorV2 for better separation of concerns
 */
class WallpaperConfiguratorCanvasController {
  constructor(configurator) {
    // Reference to main configurator for accessing state, config, and UI elements
    this.configurator = configurator;
    this.UIController = configurator.UIController;

    this.elements = configurator.UIController.elements;
  }

  inject(name, dependency) {
    this[name] = dependency;
  }

  // ========== CROPPING METHODS ==========

  showCroppingInterface(file) {
    // Use Object URL for memory efficiency
    const objectUrl = URL.createObjectURL(file);
    this.configurator.objectUrls.push(objectUrl);

    // Load image to get dimensions for DPI calculation
    const img = new Image();
    img.onload = () => {
      // Store original image dimensions for metadata
      this.configurator.state.originalImageDimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };

      // Hide upload zone and preview area, show cropping
      this.elements.uploadZone.style.display = "none";
      this.elements.previewArea.style.display = "none";
      this.elements.croppingArea.style.display = "block";
      this.elements.cropImage.src = objectUrl;

      // Calculate DPI with image dimensions
      this.calculateImageQualityFromImg(file, img);

      // Initialize cropper
      this.initCropper();
    };
    img.onerror = (e) => {
      console.error("Image failed to load for cropping:", e, "URL:", objectUrl);
    };
    img.src = objectUrl;
  }

  initCropper() {
    if (this.configurator.state.cropper) {
      this.configurator.state.cropper.destroy();
    }

    // Calculate aspect ratio from dimensions
    const totalWidthInches =
      this.configurator.state.dimensions.widthFeet * 12 + this.configurator.state.dimensions.widthInches;
    const totalHeightInches =
      this.configurator.state.dimensions.heightFeet * 12 + this.configurator.state.dimensions.heightInches;

    // Use dimensions aspect ratio if available, otherwise use image aspect ratio
    let aspectRatio;
    if (totalWidthInches && totalHeightInches) {
      aspectRatio = totalWidthInches / totalHeightInches;
    } else {
      // Get image natural dimensions for aspect ratio
      const img = this.elements.cropImage;
      if (img && img.naturalWidth && img.naturalHeight) {
        aspectRatio = img.naturalWidth / img.naturalHeight;
      } else {
        aspectRatio = NaN; // Free aspect ratio as fallback
      }
    }

    this.configurator.state.cropper = new Cropper(this.elements.cropImage, {
      aspectRatio: aspectRatio,
      viewMode: 1, // Restrict crop box to not exceed the size of the canvas
      dragMode: "crop", // Default to crop mode (resize crop box)
      autoCropArea: 1.0, // Start with 100% coverage as requested
      responsive: true,
      restore: false,
      modal: true, // Enable shade/overlay outside crop box
      guides: true, // Show guide lines
      center: true,
      highlight: true, // Show highlight overlay in crop box
      background: false, // Show grid background
      cropBoxMovable: true, // Allow moving crop box
      cropBoxResizable: true, // Enable resizing crop box
      toggleDragModeOnDblclick: false, // Disable double-click toggle
      zoomable: false, // Disable zooming to prevent rendering issues
      zoomOnWheel: false, // Disable zoom with mouse wheel
      zoomOnTouch: false, // Disable zoom with touch
      wheelZoomRatio: 0,
      scalable: true, // Image not scalable
      rotatable: false, // Image not rotatable
      minContainerWidth: 200,
      minContainerHeight: 200,
      minCropBoxWidth: 100,
      minCropBoxHeight: 100,
      minCanvasWidth: 0,
      minCanvasHeight: 0,
      // Initialize handler
      ready: (e) => {
        this.elements.cropperCanvas = document.querySelector(".cropper-canvas");
        this.elements.cropBox = document.querySelector(".cropper-crop-box");
        // Apply any active transformations to the cropper
        this.applyImageTransformations();
      },
    });
  }

  updateCropperAspectRatio() {
    if (!this.configurator.state.cropper) return;

    // Calculate new aspect ratio from dimensions
    const totalWidthInches =
      this.configurator.state.dimensions.widthFeet * 12 + this.configurator.state.dimensions.widthInches;
    const totalHeightInches =
      this.configurator.state.dimensions.heightFeet * 12 + this.configurator.state.dimensions.heightInches;

    if (totalWidthInches > 0 && totalHeightInches > 0) {
      const newAspectRatio = totalWidthInches / totalHeightInches;
      // console.log("Updating cropper aspect ratio to:", newAspectRatio);

      // Update the cropper's aspect ratio
      this.configurator.state.cropper.setAspectRatio(newAspectRatio);

      // Reset the crop box to fit the new aspect ratio
      this.configurator.state.cropper.reset();
      this.configurator.state.cropper.crop();
    } else {
      // If dimensions are cleared, allow free cropping
      // console.log("Dimensions cleared - setting free aspect ratio");
      this.configurator.state.cropper.setAspectRatio(NaN);
    }
  }

  applyCrop() {
    if (!this.configurator.state.cropper) return;

    // Store cropper data for metadata
    this.configurator.state.cropperData = this.configurator.state.cropper.getData();

    // Get cropped canvas
    const canvas = this.configurator.state.cropper.getCroppedCanvas();

    // Convert to blob
    canvas.toBlob(async (blob) => {
      // Create a new file from the blob for preview only
      const croppedFile = new File([blob], this.configurator.state.uploadedImage.name, {
        type: this.configurator.state.uploadedImage.type,
      });

      // Store the cropped version separately
      this.configurator.state.croppedImage = croppedFile;
      this.configurator.state.uploadedImage = croppedFile; // Current displayed image
      this.configurator.state.hasCroppedImage = true; // Mark as cropped
      // Note: originalFile remains unchanged for pattern use

      // Reset S3 data since image changed
      this.configurator.state.originalImageS3Url = null;
      this.configurator.state.originalImageS3Key = null;
      this.configurator.state.previewImageS3Url = null;
      this.configurator.state.previewImageS3Key = null;

      // Hide cropping, show preview
      this.elements.croppingArea.style.display = "none";
      this.showImagePreview(croppedFile);

      // Clean up cropper
      this.configurator.state.cropper.destroy();
      this.configurator.state.cropper = null;

      this.configurator.UIController.updateUploadStatus("Image cropped - ready to add to cart");
    });
  }

  cancelCrop({ preserveUploadedImage = false } = {}) {
    if (this.configurator.state.cropper) {
      this.configurator.state.cropper.destroy();
      this.configurator.state.cropper = null;
    }

    this.elements.croppingArea.style.display = "none";
    this.elements.uploadZone.style.display = "flex";

    if (!preserveUploadedImage) {
      this.configurator.state.uploadedImage = null;
      this.configurator.state.originalFile = null;
    }
  }

  recropImage() {
    // Don't allow re-crop in forced pattern mode
    if (this.configurator.state.forcePatternMode) return;

    // Use original file if available, otherwise use uploaded image
    const fileToRecrop = this.configurator.state.originalFile || this.configurator.state.uploadedImage;
    if (!fileToRecrop) return;

    // If in pattern mode, switch back to single mode
    if (this.configurator.state.imageMode === "pattern") {
      this.configurator.setImageMode("single"); // Use setImageMode to properly update all UI
    }

    // Hide preview
    this.elements.previewArea.style.display = "none";
    this.elements.uploadZone.style.display = "none";

    // Reset canvas if visible
    if (this.elements.patternCanvas) {
      this.elements.patternCanvas.style.display = "none";
    }

    if (fileToRecrop.type === "application/pdf") {
      this.showCroppingInterfaceForPDF(this.configurator.state.pdfDataUrl);
    } else {
      // Show cropping interface with original file
      this.showCroppingInterface(fileToRecrop);
    }
    // This fixes issue with resizing crop box
    this.updateCropperAspectRatio();
  }

  showCroppingInterfaceForPDF(dataUrl, fileInfo) {
    // Hide upload zone, show cropping
    this.elements.uploadZone.style.display = "none";
    this.elements.previewArea.style.display = "none";
    this.elements.croppingArea.style.display = "block";
    this.elements.cropImage.src = dataUrl;

    this.elements.cropImage.onload = () => {
      this.initCropper();
    };
  }

  showCroppingInterfaceForImage(file) {
    // Hide upload zone, show cropping for regular images
    this.elements.uploadZone.style.display = "none";
    this.elements.croppingArea.style.display = "block";

    // Create object URL for the image
    const objectUrl = URL.createObjectURL(file);
    this.configurator.objectUrls.push(objectUrl);
    this.elements.cropImage.src = objectUrl;

    // Wait for image to load then initialize cropper
    this.elements.cropImage.onload = () => {
      this.initCropper();
    };
  }

  // ========== PREVIEW METHODS ==========

  showImagePreview(file, imageDataUrl = null) {
    if (imageDataUrl) {
      // Use provided data URL (from PDF conversion)
      this.elements.previewImage.src = imageDataUrl;
    } else if (file.type === "application/pdf") {
      // This shouldn't happen anymore, but keep as fallback
      this.elements.previewImage.src = "/assets/pdf-icon.svg";
      this.elements.previewImage.alt = "PDF File";
    } else {
      // Use Object URL for memory efficiency
      const objectUrl = URL.createObjectURL(file);
      this.configurator.objectUrls.push(objectUrl);
      this.elements.previewImage.src = objectUrl;
    }

    // Clear any inline styles and set proper display styles
    this.elements.previewImage.style.width = "100%";
    this.elements.previewImage.style.height = "auto";
    this.elements.previewImage.style.maxWidth = "100%";
    this.elements.previewImage.style.maxHeight = "100%";
    this.elements.previewImage.style.objectFit = "contain";
    this.elements.previewImage.style.display = "block";

    // Apply transformations if needed
    this.applyImageTransformations();

    this.elements.uploadZone.style.display = "none";
    this.elements.previewArea.style.display = "flex";

    // Hide pattern canvas for single image mode
    if (this.elements.patternCanvas) {
      this.elements.patternCanvas.style.display = "none";
    }

    // Handle button visibility based on mode and pre-existing status
    if (this.configurator.state.forceMuralMode) {
      // Always hide Remove Image for forced mural mode
      if (this.elements.clearImageBtn) {
        this.elements.clearImageBtn.style.display = "none";
      }
      // Show recrop for murals (even pre-existing ones can be re-cropped)
      if (this.elements.recropBtn) {
        this.elements.recropBtn.style.display = "block";
      }
    } else if (this.configurator.state.isPreExisting) {
      // Pre-existing pattern products - allow clearing
      if (this.elements.clearImageBtn) {
        this.elements.clearImageBtn.style.display = "block";
      }
      // Hide recrop for patterns
      if (this.elements.recropBtn) {
        this.elements.recropBtn.style.display = "none";
      }
    } else {
      // User uploaded images - show both for single images
      if (this.configurator.state.imageMode === "single") {
        if (this.elements.clearImageBtn) {
          this.elements.clearImageBtn.style.display = "block";
        }
        if (this.elements.recropBtn) {
          this.elements.recropBtn.style.display = "block";
        }
      } else {
        // Pattern mode - hide recrop
        if (this.elements.recropBtn) {
          this.elements.recropBtn.style.display = "none";
        }
      }
    }

    // Update summary
    if (this.elements.summaryImage) {
      const nameWithoutExt = this.ImageProcessor.getFileNameWithoutExtension(file.name);
      let imageText = nameWithoutExt;
      if (this.configurator.state.imageMode === "pattern") {
        imageText += ` (Pattern ${this.configurator.state.patternSizeInches}")`;
      }
      this.elements.summaryImage.textContent = imageText;
    }

    this.configurator.validateForm();
  }

  // ========== PATTERN METHODS ==========

  showPatternPreview(file) {
    // console.log("showPatternPreview called with file:", {
    //   name: file.name,
    //   size: file.size,
    //   type: file.type,
    //   isFile: file instanceof File,
    //   isBlob: file instanceof Blob,
    // });

    // Use Object URL for memory efficiency
    const objectUrl = file.type.includes("pdf") ? this.configurator.state.pdfDataUrl : URL.createObjectURL(file);
    // console.log("Created object URL:", objectUrl);
    this.configurator.objectUrls.push(objectUrl);

    // Store image for pattern creation
    const img = new Image();
    img.onload = () => {
      // console.log("Pattern preview image loaded:", {
      //   width: img.naturalWidth,
      //   height: img.naturalHeight,
      //   aspectRatio: img.naturalWidth / img.naturalHeight,
      //   objectUrl: objectUrl,
      // });

      this.configurator.state.imageAspectRatio = img.naturalWidth / img.naturalHeight;

      // Calculate DPI for quality display
      this.calculateImageQualityFromImg(file, img);

      // Store the image data (hidden, but needed for switching modes)
      this.elements.previewImage.src = objectUrl;

      // Create pattern preview with the image source
      // console.log("Calling createPatternPreview with objectUrl:", objectUrl);
      this.createPatternPreview(objectUrl);
    };
    img.onerror = (e) => {
      console.error("Pattern preview image failed to load:", e, "URL:", objectUrl);
    };
    img.src = objectUrl;

    // Show preview area
    this.elements.uploadZone.style.display = "none";
    this.elements.previewArea.style.display = "flex";

    // Show zoom controls in pattern mode
    const zoomControls = document.querySelector(".canvas-zoom-controls");
    if (zoomControls) {
      zoomControls.style.display = "block";
    }

    // Hide recrop button in pattern mode
    if (this.elements.recropBtn) {
      this.elements.recropBtn.style.display = "none";
    }

    // Update summary
    if (this.elements.summaryImage) {
      const displayName = this.ImageProcessor.getFileNameWithoutExtension(file.name);
      this.elements.summaryImage.textContent = `${displayName} (Pattern ${this.configurator.state.patternSizeInches}")`;
    }

    // For force pattern mode, hide the clear image button
    if (this.configurator.state.forcePatternMode && this.elements.clearImageBtn) {
      this.elements.clearImageBtn.style.display = "none";
    }

    this.configurator.validateForm();
  }

  updatePatternPreview() {
    if (!this.configurator.state.uploadedImage || this.configurator.state.imageMode !== "pattern") return;

    // Update the pattern preview with new scale using stored image
    if (this.elements.previewImage && this.elements.previewImage.src) {
      this.createPatternPreview(this.elements.previewImage.src);
    }

    // Update summary
    if (this.elements.summaryImage) {
      const displayName = this.ImageProcessor.getFileNameWithoutExtension(this.configurator.state.uploadedImage.name);
      this.elements.summaryImage.textContent = `${displayName} (Pattern ${this.configurator.state.patternSizeInches}")`;
    }
  }

  createPatternPreview(imageSrc) {
    const canvas = this.elements.patternCanvas;
    if (!canvas) {
      console.error("Pattern canvas element not found");
      return;
    }

    // console.log("Creating pattern preview with source:", imageSrc?.substring(0, 100));

    const ctx = canvas.getContext("2d");
        
        // Fix: Disable image smoothing to prevent white lines between pattern repeats
            ctx.imageSmoothingEnabled = false;
                ctx.webkitImageSmoothingEnabled = false;
                    ctx.mozImageSmoothingEnabled = false;
                        ctx.msImageSmoothingEnabled = false;
    const img = new Image();

    img.onload = () => {
      // Get wall dimensions from state
      let wallWidthInches =
        this.configurator.state.dimensions.widthFeet * 12 + this.configurator.state.dimensions.widthInches;
      let wallHeightInches =
        this.configurator.state.dimensions.heightFeet * 12 + this.configurator.state.dimensions.heightInches;

      // Log for debugging
      // console.log("Creating pattern preview with dimensions:", {
      //   widthFeet: this.configurator.state.dimensions.widthFeet,
      //   widthInches: this.configurator.state.dimensions.widthInches,
      //   heightFeet: this.configurator.state.dimensions.heightFeet,
      //   heightInches: this.configurator.state.dimensions.heightInches,
      //   totalWidthInches: wallWidthInches,
      //   totalHeightInches: wallHeightInches,
      // });

      // Use default dimensions if not set (8x6 feet)
      if (!wallWidthInches || wallWidthInches === 0) wallWidthInches = 96;
      if (!wallHeightInches || wallHeightInches === 0) wallHeightInches = 72;
      const wallAspectRatio = wallWidthInches / wallHeightInches;

      // Set canvas internal resolution (higher for clarity)
      const baseWidth = 1200;
      canvas.width = baseWidth;
      canvas.height = Math.round(baseWidth / wallAspectRatio);

      // Set canvas display size to match wall aspect ratio
      // Use the upload-canvas container for sizing, not just preview area
      const uploadCanvas = document.querySelector(".upload-canvas");
      const container = uploadCanvas || this.elements.previewArea;

      if (container) {
        // Force recalculation of container dimensions on resize
        // For upload-canvas, use most of the available space
        const containerWidth = container.clientWidth || container.offsetWidth || 800;
        const containerHeight = Math.min(container.clientHeight || 740, 740); // Cap height at 740px for better UX

        // Calculate the best fit for the wall dimensions within the container
        const containerAspectRatio = containerWidth / containerHeight;

        let displayWidth, displayHeight;

        if (wallAspectRatio > containerAspectRatio) {
          // Wall is wider than container ratio - fit to width
          displayWidth = Math.min(containerWidth * 0.98, containerWidth - 40); // 98% or leave 20px padding each side
          displayHeight = displayWidth / wallAspectRatio;
        } else {
          // Wall is taller than container ratio - fit to height
          displayHeight = Math.min(containerHeight * 0.98, containerHeight - 40);
          displayWidth = displayHeight * wallAspectRatio;
        }

        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        canvas.style.display = "block";
        canvas.style.margin = "0 auto";
        canvas.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
        canvas.style.border = "1px solid #ddd";

        // console.log("Canvas responsive sizing:", {
        //   container: `${containerWidth}x${containerHeight}`,
        //   wallAspectRatio: wallAspectRatio.toFixed(2),
        //   containerAspectRatio: containerAspectRatio.toFixed(2),
        //   displaySize: `${Math.round(displayWidth)}x${Math.round(displayHeight)}`,
        //   fitMode: wallAspectRatio > containerAspectRatio ? "fit-to-width" : "fit-to-height",
        // });
      } else {
        // Fallback to percentage-based sizing
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        canvas.style.display = "block";
        canvas.style.margin = "0 auto";
      }

      // Clear canvas - white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate tile size in pixels based on inches
      // Convert pattern size from inches to canvas pixels
      const pixelsPerInch = baseWidth / wallWidthInches;

      // Pattern size in canvas pixels
      let tileWidth, tileHeight;

      // Get the actual image aspect ratio from the loaded image
      const imageAspectRatio = img.naturalWidth / img.naturalHeight;

      // The pattern slider represents the WIDTH of the pattern tile in inches
      // Height is calculated to maintain the original image aspect ratio
      const patternWidthInches = this.configurator.state.patternSizeInches;
      const patternHeightInches = patternWidthInches / imageAspectRatio;

      // Convert to canvas pixels
      tileWidth = patternWidthInches * pixelsPerInch;
      tileHeight = patternHeightInches * pixelsPerInch;

      // Calculate tiles needed
      const tilesAcross = Math.ceil(canvas.width / tileWidth);
      const tilesDown = Math.ceil(canvas.height / tileHeight);

      // Log the calculations for verification
      console.log("Pattern Rendering Calculations:", {
        wallDimensions: `${(wallWidthInches / 12).toFixed(1)}' x ${(wallHeightInches / 12).toFixed(1)}'`,
        wallInches: `${wallWidthInches}" x ${wallHeightInches}"`,
        canvasPixels: `${canvas.width}px x ${canvas.height}px`,
        patternSize: `${patternWidthInches.toFixed(1)}" W x ${patternHeightInches.toFixed(1)}" H`,
        pixelsPerInch: pixelsPerInch.toFixed(2),
        tilePixels: `${tileWidth.toFixed(0)}px x ${tileHeight.toFixed(0)}px`,
        tilesNeeded: `${tilesAcross} x ${tilesDown} = ${tilesAcross * tilesDown} total`,
        imageAspectRatio: imageAspectRatio.toFixed(2),
        imageDimensions: `${img.naturalWidth}px x ${img.naturalHeight}px`,
      });

      // Apply filters
      ctx.save();
      if (this.configurator.state.options.blackAndWhite) {
        ctx.filter = "grayscale(100%)";
      }

      // Apply mirror transformation to entire canvas if enabled
      if (this.configurator.state.options.mirror) {
        // Save the current state
        ctx.save();

        // Flip the entire canvas horizontally
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      console.log("tileWidth:", tileWidth, "tileHeight:", tileHeight);
      // Draw pattern tiles
      for (let y = 0; y < tilesDown; y++) {
        for (let x = 0; x < tilesAcross; x++) {
          const xPos = x * tileWidth;
          const yPos = y * tileHeight;

          // Draw each tile normally - the entire canvas will be mirrored if enabled
          ctx.drawImage(img, xPos, yPos, tileWidth, tileHeight);
        }
      }

      // Restore the transformation if mirror was applied
      if (this.configurator.state.options.mirror) {
        ctx.restore();
      }

      ctx.restore();

      // Show canvas, hide regular image
      canvas.style.display = "block";
      this.elements.previewImage.style.display = "none";

      // Store canvas result as blob in state for S3 upload
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const fileName =
              "PREVIEW_" + (this.configurator.state.uploadedImage?.name ?? this.configurator.state.originalFile?.name);
            this.configurator.state.processedPreviewImageFile = new File([blob], fileName, { type: "image/png" });
          }
        },
        "image/png",
        0.95,
      );

      // console.log("Pattern canvas displayed, preview complete");
    };

    // Load the image
    img.src = imageSrc || this.elements.previewImage.src;
    // console.log("Loading image for pattern:", img.src?.substring(0, 100));
  }

  // ========== DISPLAY METHODS ==========

  updateMuralDisplay() {
    // Update mural display to show dimensions overlay
    if (this.configurator.state.imageMode !== "single" || !this.configurator.state.uploadedImage) return;

    const widthInches =
      this.configurator.state.dimensions.widthFeet * 12 + this.configurator.state.dimensions.widthInches;
    const heightInches =
      this.configurator.state.dimensions.heightFeet * 12 + this.configurator.state.dimensions.heightInches;

    if (!widthInches || !heightInches) return;

    // Create or update dimension overlay
    let dimensionOverlay = document.getElementById("mural-dimension-overlay");
    if (!dimensionOverlay) {
      dimensionOverlay = document.createElement("div");
      dimensionOverlay.id = "mural-dimension-overlay";
      dimensionOverlay.style.cssText = `
        position: absolute;
        border: 3px dashed #FF6B35;
        pointer-events: none;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 107, 53, 0.1);
      `;

      const dimensionLabel = document.createElement("div");
      dimensionLabel.style.cssText = `
        background: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: bold;
        color: #FF6B35;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      `;
      dimensionOverlay.appendChild(dimensionLabel);

      if (this.elements.previewArea) {
        this.elements.previewArea.appendChild(dimensionOverlay);
      }
    }

    // Calculate display dimensions based on wall aspect ratio
    const wallAspectRatio = widthInches / heightInches;
    const container = this.elements.previewArea;

    if (container) {
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight || 600;

      let overlayWidth, overlayHeight;

      // Fit the overlay to container maintaining wall aspect ratio
      if (wallAspectRatio > containerWidth / containerHeight) {
        overlayWidth = containerWidth * 0.9;
        overlayHeight = overlayWidth / wallAspectRatio;
      } else {
        overlayHeight = containerHeight * 0.9;
        overlayWidth = overlayHeight * wallAspectRatio;
      }

      // Update overlay size and position
      dimensionOverlay.style.width = `${overlayWidth}px`;
      dimensionOverlay.style.height = `${overlayHeight}px`;
      dimensionOverlay.style.left = `${(containerWidth - overlayWidth) / 2}px`;
      dimensionOverlay.style.top = `${(containerHeight - overlayHeight) / 2}px`;

      // Update label text
      const label = dimensionOverlay.querySelector("div");
      if (label) {
        const widthFt = Math.floor(widthInches / 12);
        const widthIn = widthInches % 12;
        const heightFt = Math.floor(heightInches / 12);
        const heightIn = heightInches % 12;

        label.textContent = `${widthFt}'${widthIn}" × ${heightFt}'${heightIn}"`;
      }

      // Also update DPI calculation for murals
      this.updateImageQuality();
    }
  }

  updateSingleImageDisplay() {
    // Update single image display when window resizes
    if (this.configurator.state.imageMode === "single" && this.configurator.state.uploadedImage) {
      const previewArea = this.elements.previewArea;
      const previewImage = this.elements.previewImage;

      if (previewArea && previewImage) {
        // Recalculate display size based on container
        const containerWidth = previewArea.offsetWidth;
        const containerHeight = previewArea.offsetHeight || 400;

        // Maintain aspect ratio
        const imageAspectRatio = this.configurator.state.imageAspectRatio || 1;
        let displayWidth = containerWidth;
        let displayHeight = displayWidth / imageAspectRatio;

        if (displayHeight > containerHeight) {
          displayHeight = containerHeight;
          displayWidth = displayHeight * imageAspectRatio;
        }

        // Update image display to fill container properly
        previewImage.style.width = "100%";
        previewImage.style.height = "auto";
        previewImage.style.maxWidth = "100%";
        previewImage.style.maxHeight = "100%";
        previewImage.style.objectFit = "contain";

        // console.log("Single image display updated for resize:", {
        //   containerWidth,
        //   containerHeight,
        //   displayWidth: Math.round(displayWidth),
        //   displayHeight: Math.round(displayHeight),
        // });
      }
    }
  }

  reinitDisplay() {
    // console.log("Reinitializing configurator display");

    // If we have an image and dimensions, re-render everything
    if (this.configurator.state.uploadedImage && this.configurator.state.wallArea > 0) {
      // Update the canvas based on current mode
      if (this.configurator.state.imageMode === "pattern") {
        this.updatePatternPreview();
      } else {
        this.updateSingleImageDisplay();
      }

      // Recalculate DPI for current dimensions
      this.updateImageQuality();
    }

    // Update summary displays in case dimensions changed
    this.configurator.UIController.updateDimensionDisplay();
    this.configurator.UIController.updateMaterialDisplay();
    this.configurator.calculatePrice();
  }

  // ========== TRANSFORMATION METHODS ==========

  applyImageTransformations() {
    if (!this.configurator.state.uploadedImage) return;
    const cropperBaseImg = this.elements.cropperCanvas?.querySelector("img[src]");
    const imgInCropBox = this.elements.cropBox?.querySelector("img[src]");

    // Apply to single image
    if (this.elements.previewImage) {
      let filters = [];

      if (this.configurator.state.options.blackAndWhite) {
        filters.push("grayscale(100%)");
      }

      if (this.configurator.state.options.mirror) {
        this.elements.previewImage.style.transform = "scaleX(-1)";
        this.elements.cropImage.style.transform = "scaleX(-1)";
        this.configurator.state.cropper?.scale(-1, 1);
      } else {
        this.elements.previewImage.style.transform = "scaleX(1)";
        this.elements.cropImage.style.transform = "scaleX(1)";
        this.configurator.state.cropper?.scale(1, 1);
      }

      this.elements.previewImage.style.filter = filters.join(" ");
      if (cropperBaseImg && imgInCropBox) {
        cropperBaseImg.style.filter = filters.join(" ");
        imgInCropBox.style.filter = filters.join(" ");
      }
    }

    // If in pattern mode, update pattern preview
    if (this.configurator.state.imageMode === "pattern" && this.elements.patternCanvas) {
      this.updatePatternPreview();
    }
  }

  // ========== IMAGE QUALITY METHODS ==========

  calculateImageQualityFromImg(file, img) {
    // Get output dimensions based on mode
    let totalWidthInches, totalHeightInches;
    let imagePixelWidth, imagePixelHeight;

    if (this.configurator.state.imageMode === "pattern") {
      // For pattern mode: DPI is based on pattern tile size
      totalWidthInches = this.configurator.state.patternSizeInches;
      totalHeightInches = this.configurator.state.patternSizeInches;
      imagePixelWidth = img.naturalWidth;
      imagePixelHeight = img.naturalHeight;

      // console.log("Pattern mode DPI calc:", {
      //   patternSize: this.configurator.state.patternSizeInches,
      //   imageWidth: imagePixelWidth,
      //   imageHeight: imagePixelHeight,
      // });
    } else {
      // For mural mode: DPI is based on wall dimensions
      totalWidthInches =
        this.configurator.state.dimensions.widthFeet * 12 + this.configurator.state.dimensions.widthInches || 48;
      totalHeightInches =
        this.configurator.state.dimensions.heightFeet * 12 + this.configurator.state.dimensions.heightInches || 36;

      // Check if we have cropper data (after cropping)
      if (
        this.configurator.state.cropperData &&
        this.configurator.state.cropperData.width &&
        this.configurator.state.cropperData.height
      ) {
        // Use cropped dimensions
        imagePixelWidth = Math.round(this.configurator.state.cropperData.width);
        imagePixelHeight = Math.round(this.configurator.state.cropperData.height);

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
    this.configurator.state.imageDPI = avgDPI;

    // Determine quality based on the minimum DPI (weakest dimension)
    if (minDPI >= 300) {
      this.configurator.state.imageQuality = "Excellent";
    } else if (minDPI >= 150) {
      this.configurator.state.imageQuality = "Good";
    } else if (minDPI >= 72) {
      this.configurator.state.imageQuality = "Fair";
    } else {
      this.configurator.state.imageQuality = "Poor";
    }

    // console.log("DPI Calculation:", {
    //   mode: this.configurator.state.imageMode,
    //   imagePixels: `${imagePixelWidth} × ${imagePixelHeight}`,
    //   outputInches: `${totalWidthInches}" × ${totalHeightInches}"`,
    //   dpiWidth: Math.round(dpiWidth),
    //   dpiHeight: Math.round(dpiHeight),
    //   avgDPI: avgDPI,
    //   minDPI: Math.round(minDPI),
    //   quality: this.configurator.state.imageQuality,
    // });

    this.configurator.UIController.updateQualityDisplay();
  }

  updateImageQuality() {
    // Recalculate DPI based on new dimensions if we have an image
    if (!this.configurator.state.uploadedImage && !this.configurator.state.originalFile) return;

    // Create a temporary image object to recalculate
    if (this.configurator.state.originalImageDimensions) {
      // Use a mock image object with the stored dimensions
      const mockImg = {
        naturalWidth: this.configurator.state.originalImageDimensions.width,
        naturalHeight: this.configurator.state.originalImageDimensions.height,
      };

      // If we have a cropped image, pass the cropped file, otherwise pass the original
      const fileToUse =
        this.configurator.state.croppedImage ||
        this.configurator.state.originalFile ||
        this.configurator.state.uploadedImage;

      // Call the main calculation method with our mock image
      this.calculateImageQualityFromImg(fileToUse, mockImg);
    }
  }

  // ========== CANVAS ZOOM METHODS ==========

  updateCanvasTransform() {
    const canvas = this.elements.patternCanvas;
    const zoomLevelDisplay = document.getElementById("canvas-zoom-level");
    const previewArea = this.elements.previewArea;

    if (canvas) {
      // Apply transform
      canvas.style.transform = `scale(${this.canvasZoom}) translate(${this.configurator.canvasPosition.x / this.configurator.canvasZoom}px, ${this.configurator.canvasPosition.y / this.configurator.canvasZoom}px)`;

      // Update zoom level display
      if (zoomLevelDisplay) {
        zoomLevelDisplay.textContent = Math.round(this.canvasZoom * 100) + "%";
      }

      // Update cursor based on zoom
      if (previewArea) {
        previewArea.style.cursor = this.canvasZoom > 1 ? "grab" : "default";
      }
    }
  }
}

export { WallpaperConfiguratorCanvasController };
