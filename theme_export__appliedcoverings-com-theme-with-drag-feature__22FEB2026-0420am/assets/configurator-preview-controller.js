import EventBus, {
  PRE_EXISTING_FILE_LOADED,
  OPTIONS_UPDATED,
  DIMENSIONS_UPDATED,
  IMAGE_CROPPED,
  FILE_UPLOADED,
  SWITCHING_MODE,
} from "./event-bus.js";

class ConfiguratorPreviewController {
  constructor(configurator) {
    if (ConfiguratorPreviewController.instance) {
      return ConfiguratorPreviewController.instance;
    }
    ConfiguratorPreviewController.instance = this;

    this.configurator = configurator;

    this.init();
  }

  init() {
    EventBus.on(PRE_EXISTING_FILE_LOADED, this.processFile.bind(this));
    EventBus.on(SWITCHING_MODE, this.processFile.bind(this));
    EventBus.on(OPTIONS_UPDATED, this.updatePatternPreview.bind(this));
    EventBus.on(DIMENSIONS_UPDATED, this.onDimensionsUpdate.bind(this));
    EventBus.on(IMAGE_CROPPED, this.showImagePreview.bind(this));
    EventBus.on(IMAGE_CROPPED, this.updateMuralDisplay.bind(this));
  }

  // Create canvas for file based on mode and file type
  async processFile(data) {
    const { mode, file } = data;
    if (!file) {
      alert("Please upload an image");
      return;
    }

    this.configurator.cleanUp();
    console.log("LOG: Processing file in mode", mode, file);
    console.log(this.state);

    switch (mode) {
      case "pattern":
        switch (file.type) {
          case "application/pdf": {
            this.showLoadingSpinner(this.elements.uploadZone, "Processing PDF...");
            // Check processedFile in case it's a mode switch with existing file
            const dataUrl = this.state.processedFile ? URL.createObjectURL(file) : await this.createCanvasForPDF(file);
            this.configurator.objectUrls.push(dataUrl);
            this.elements.previewImage.src = dataUrl;
            this.generatePreviewFromDataUrl(dataUrl);
            this.configurator.calculateImageQuality(dataUrl);
            this.hideLoadingSpinner(this.elements.uploadZone);

            break;
          }

          case "image/png":
          case "image/jpeg":
            this.showLoadingSpinner(this.elements.uploadZone, "Processing image...");
            const objectUrl = URL.createObjectURL(file);
            this.configurator.objectUrls.push(objectUrl);
            this.generatePreviewFromDataUrl(objectUrl);
            this.elements.previewImage.src = objectUrl;
            this.configurator.calculateImageQuality(objectUrl);
            this.hideLoadingSpinner(this.elements.uploadZone);
            break;
          case "image/tif":
          case "image/tiff":
            this.showLoadingSpinner(this.elements.uploadZone, "Processing TIFF...");
            const dataUrl = this.state.processedFile ? URL.createObjectURL(file) : await this.createCanvasForTIFF(file);
            this.hideLoadingSpinner(this.elements.uploadZone);
            this.configurator.objectUrls.push(dataUrl);
            this.elements.previewImage.src = dataUrl;
            this.generatePreviewFromDataUrl(dataUrl);
            this.configurator.calculateImageQuality(dataUrl);

            break;
          default:
            console.error("ERROR: unsupported file type", file.type);
            break;
        }

        break;
      case "single":
        switch (file.type) {
          case "application/pdf": {
            this.showLoadingSpinner(this.elements.uploadZone, "Processing PDF...");
            const dataUrl = this.state.processedFile ? URL.createObjectURL(file) : await this.createCanvasForPDF(file);
            this.configurator.objectUrls.push(dataUrl);
            this.configurator.calculateImageQuality(dataUrl);
            if (this.state.processedFile) {
              this.showImagePreview({ dataUrl });
            } else {
              this.CropperController.showCroppingInterface({ dataUrl });
            }
            this.configurator.calculateImageQuality(dataUrl);
            this.hideLoadingSpinner(this.elements.uploadZone);

            break;
          }
          case "image/png":
          case "image/jpeg":
            this.showLoadingSpinner(this.elements.uploadZone, "Loading image...");
            await new Promise((resolve) => setTimeout(resolve, 1000));
            if (this.state.processedFile) {
              this.showImagePreview({ file });
            } else {
              await this.CropperController.showCroppingInterface({ file });
            }
            this.hideLoadingSpinner(this.elements.uploadZone);

            break;
          case "image/tif":
          case "image/tiff":
            this.showLoadingSpinner(this.elements.uploadZone, "Processing TIFF...");
            const dataUrl = this.state.processedFile ? URL.createObjectURL(file) : await this.createCanvasForTIFF(file);
            this.configurator.objectUrls.push(dataUrl);
            this.configurator.calculateImageQuality(dataUrl);
            this.CropperController.showCroppingInterface({ dataUrl });
            this.hideLoadingSpinner(this.elements.uploadZone);

            break;
          default:
            console.error("ERROR: unsupported file type", file.type);
            break;
        }
        break;
    }

    this.elements.summaryImage.textContent = Utils.getFileNameWithoutExtension(file.name) || "Image";
  }

  async createCanvasForPDF(file) {
    if (this.state.pdfCanvasUrl) return this.state.pdfCanvasUrl;
    try {
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

      canvas.width = 0;
      canvas.height = 0;

      this.state.pdfCanvasUrl = dataUrl;
      return dataUrl;
    } catch (error) {
      console.error("ERROR: processing PDF", error);
      alert("Error processing PDF. Please try again or use an image file.");
    }
  }

  async createCanvasForTIFF(file) {
    if (this.state.tiffCanvasUrl) return this.state.tiffCanvasUrl;
    console.log("Processing TIFF file:", file.name, file.type, file.size);

    try {
      // Check if UTIF library is loaded
      if (typeof UTIF === "undefined") {
        throw new Error("UTIF library not loaded. Please refresh the page.");
      }

      // Show loading indicator
      this.showLoadingSpinner(this.elements.uploadZone, "Processing TIFF...");

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
      this.hideLoadingSpinner(this.elements.uploadZone);

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

      this.state.tiffCanvasUrl = dataUrl;

      return dataUrl;

      // Calculate DPI based on the rendered image
      this.calculateImageQuality(convertedFile, dataUrl);

      // Process based on mode
      if (this.state.mode === "pattern") {
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
      this.hideLoadingSpinner(this.elements.uploadZone);
      // Clear the file input
      if (this.elements.imageUpload) {
        this.elements.imageUpload.value = "";
      }
    }
  }

  // Copied code from createPatternPreview()
  generatePreviewFromDataUrl(url) {
    const canvas = this.elements.patternCanvas;
    if (!canvas) {
      console.error("Pattern canvas element not found");
      return;
    }

    // console.log("Creating pattern preview with source:", imageSrc?.substring(0, 100));

    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Get wall dimensions from state
      const { widthFeet, widthInches, heightFeet, heightInches } = this.state.dimensions;
      let wallWidthInches = widthFeet * 12 + widthInches;
      let wallHeightInches = heightFeet * 12 + heightInches;

      // Log for debugging
      // console.log("Creating pattern preview with dimensions:", {
      //   widthFeet: this.state.dimensions.widthFeet,
      //   widthInches: this.state.dimensions.widthInches,
      //   heightFeet: this.state.dimensions.heightFeet,
      //   heightInches: this.state.dimensions.heightInches,
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
      const patternWidthInches = this.state.patternSizeInches;
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
      if (this.state.options.blackAndWhite) {
        ctx.filter = "grayscale(100%)";
      }

      // Apply mirror transformation to entire canvas if enabled
      if (this.state.options.mirror) {
        // Save the current state
        ctx.save();

        // Flip the entire canvas horizontally
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      console.log("tileWidth:", tileWidth, "tileHeight:", tileHeight);
      // Draw pattern tiles with offset support
      const offX = ((this.state.patternOffsetX % tileWidth) + tileWidth) % tileWidth;
      const offY = ((this.state.patternOffsetY % tileHeight) + tileHeight) % tileHeight;

      const tilesAcrossOffset = Math.ceil((canvas.width + offX) / tileWidth) + 1;
      const tilesDownOffset = Math.ceil((canvas.height + offY) / tileHeight) + 1;

      for (let y = -1; y < tilesDownOffset; y++) {
        for (let x = -1; x < tilesAcrossOffset; x++) {
          const xPos = x * tileWidth - offX;
          const yPos = y * tileHeight - offY;

          // Draw each tile normally - the entire canvas will be mirrored if enabled
          ctx.drawImage(img, xPos, yPos, tileWidth, tileHeight);
        }
      }

      // Restore the transformation if mirror was applied
      if (this.state.options.mirror) {
        ctx.restore();
      }

      ctx.restore();

      // Show canvas, hide regular image
      canvas.style.display = "block";

      // console.log("Pattern canvas displayed, preview complete");
    };

    // Load the image
    img.src = url;
    // console.log("Loading image for pattern:", img.src?.substring(0, 100));
  }

  // Pattern mode can't really use this...
  showImagePreview(data) {
    console.log("LOG: showImagePreview data", data);
    const { file, dataUrl } = data;

    if (dataUrl) {
      // Use provided data URL (from PDF conversion)
      this.elements.previewImage.src = dataUrl;
    } else {
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
    // this.applyImageTransformations();

    this.elements.uploadZone.style.display = "none";
    this.elements.previewArea.style.display = "flex";

    console.log(this.state);
    // Hide pattern canvas for single image mode
    if (this.elements.patternCanvas) this.elements.patternCanvas.style.display = "none";

    // Handle button visibility based on mode and pre-existing status
    if (this.configurator.data.force_mural_mode) {
      // Always hide Remove Image for forced mural mode
      if (this.elements.clearImageBtn) this.elements.clearImageBtn.style.display = "none";

      // Show recrop for murals (even pre-existing ones can be re-cropped)
      if (this.elements.recropBtn) {
        this.elements.recropBtn.style.display = "block";
      }
    } else if (this.state.isPreExisting) {
      // Pre-existing pattern products - allow clearing
      if (this.elements.clearImageBtn) this.elements.clearImageBtn.style.display = "block";

      // Hide recrop for patterns
      if (this.elements.recropBtn) this.elements.recropBtn.style.display = "none";
    } else {
      // User uploaded images - show both for single images
      if (this.state.mode === "single") {
        if (this.elements.clearImageBtn) this.elements.clearImageBtn.style.display = "block";
        if (this.elements.recropBtn) this.elements.recropBtn.style.display = "block";
      } else {
        // Pattern mode - hide recrop
        if (this.elements.recropBtn) this.elements.recropBtn.style.display = "none";
      }
    }
  }

  updatePatternPreview() {
    if (!this.state.originalFile || this.state.mode !== "pattern" || !this.elements.previewImage.src) {
      return;
    }
    this.generatePreviewFromDataUrl(this.elements.previewImage.src);
  }

  updateMuralDisplay() {
    // Update mural display to show dimensions overlay
    if (this.state.mode !== "single" || !this.state.originalFile) return;

    const widthInches = this.state.dimensions.widthFeet * 12 + this.state.dimensions.widthInches;
    const heightInches = this.state.dimensions.heightFeet * 12 + this.state.dimensions.heightInches;
    if (!widthInches || !heightInches) return;

    // Create or update dimension overlay
    // let dimensionOverlay = document.getElementById("mural-dimension-overlay");
    // if (!dimensionOverlay) {
    //   dimensionOverlay = document.createElement("div");
    //   dimensionOverlay.id = "mural-dimension-overlay";
    //   dimensionOverlay.style.cssText = `
    //     position: absolute;
    //     border: 3px dashed #FF6B35;
    //     pointer-events: none;
    //     z-index: 10;
    //     display: flex;
    //     align-items: center;
    //     justify-content: center;
    //     background: rgba(255, 107, 53, 0.1);
    //   `;
    //
    //   const dimensionLabel = document.createElement("div");
    //   dimensionLabel.style.cssText = `
    //     background: white;
    //     padding: 8px 16px;
    //     border-radius: 4px;
    //     font-weight: bold;
    //     color: #FF6B35;
    //     box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    //   `;
    //   dimensionOverlay.appendChild(dimensionLabel);
    //
    //   if (this.elements.previewArea) {
    //     this.elements.previewArea.appendChild(dimensionOverlay);
    //   }
    // }

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
      // dimensionOverlay.style.width = `${overlayWidth}px`;
      // dimensionOverlay.style.height = `${overlayHeight}px`;
      // dimensionOverlay.style.left = `${(containerWidth - overlayWidth) / 2}px`;
      // dimensionOverlay.style.top = `${(containerHeight - overlayHeight) / 2}px`;

      // Update label text
      // const label = dimensionOverlay.querySelector("div");
      // if (label) {
      //   const widthFt = Math.floor(widthInches / 12);
      //   const widthIn = widthInches % 12;
      //   const heightFt = Math.floor(heightInches / 12);
      //   const heightIn = heightInches % 12;
      //
      //   label.textContent = `${widthFt}'${widthIn}" × ${heightFt}'${heightIn}"`;
      // }

      // Also update DPI calculation for murals
      this.configurator.updateImageQuality();
    }
  }

  onDimensionsUpdate(data) {
    const { dimensions } = data;
    console.log("LOG: Dimensions updated:", dimensions);

    switch (this.state.mode) {
      case "pattern":
        this.updatePatternPreview();
        break;
      case "single":
        if (this.state.cropper) this.CropperController.updateCropperAspectRatio();
        if (this.state.originalFile) this.configurator.updateImageQuality();
        this.updateMuralDisplay();

        const isCropping = this.elements.croppingArea.style.display !== "none";
        if (this.state.cropper && isCropping) {
          const { widthFeet, widthInches, heightFeet, heightInches } = this.state.dimensions;
          const totalWidthInches = widthFeet * 12 + widthInches;
          const totalHeightInches = heightFeet * 12 + heightInches;

          if (totalWidthInches && totalHeightInches) {
            const newAspectRatio = totalWidthInches / totalHeightInches;
            // console.log("Updating cropper aspect ratio to:", newAspectRatio);

            this.state.cropper.setAspectRatio(newAspectRatio);
            this.state.cropper.reset();
            this.state.cropper.setCropBoxData({
              left: 0,
              top: 0,
              width: this.state.cropper.getContainerData().width,
              height: this.state.cropper.getContainerData().width / newAspectRatio,
            });
          }
        }

        break;
    }
  }

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

  get elements() {
    return this.configurator.elements;
  }

  get state() {
    return this.configurator.state;
  }

  get CropperController() {
    return this.configurator.CropperController;
  }
}

export default ConfiguratorPreviewController;
