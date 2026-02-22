import EventBus, { PRE_EXISTING_FILE_LOADED, OPTIONS_UPDATED, DIMENSIONS_UPDATED } from "./event-bus.js";

class ConfiguratorCropperController {
  constructor(configurator) {
    if (ConfiguratorCropperController.instance) {
      return ConfiguratorCropperController.instance;
    }
    ConfiguratorCropperController.instance = this;

    this.configurator = configurator;

    this.init();
  }

  init() {
    EventBus.on(OPTIONS_UPDATED, this.applyImageTransformations.bind(this));
  }

  showCroppingInterface({ file, dataUrl }) {
    this.elements.uploadZone.style.display = "none";
    this.elements.croppingArea.style.display = "block";
    console.log("LOG showCroppingInterface", { file, dataUrl });

    let url = dataUrl;
    if (file) {
      url = URL.createObjectURL(file);
    }
    this.configurator.objectUrls.push(url);
    return new Promise((resolve) => {
      this.elements.cropImage.src = url;
      this.elements.cropImage.onload = () => {
        // Store original image dimensions for metadata
        this.configurator.state.originalImageDimensions = {
          width: this.elements.cropImage.naturalWidth,
          height: this.elements.cropImage.naturalHeight,
        };
        this.configurator.calculateImageQualityFromImg(this.elements.cropImage);
        this.initCropper();
        resolve();
      };
    });
  }

  initCropper() {
    if (this.state.cropper) {
      this.state.cropper.destroy();
    }

    const { widthFeet, widthInches, heightFeet, heightInches } = this.state.dimensions;
    // Calculate aspect ratio from dimensions
    const totalWidthInches = widthFeet * 12 + widthInches;
    const totalHeightInches = heightFeet * 12 + heightInches;

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

    this.state.cropper = new Cropper(this.elements.cropImage, {
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

  applyImageTransformations() {
    if (!this.state.originalFile) return;
    const cropperBaseImg = this.elements.cropperCanvas?.querySelector("img[src]");
    const imgInCropBox = this.elements.cropBox?.querySelector("img[src]");

    // Apply to single image
    if (this.elements.previewImage) {
      let filters = [];

      if (this.state.options.blackAndWhite) {
        filters.push("grayscale(100%)");
      }

      if (this.state.options.mirror) {
        this.elements.previewImage.style.transform = "scaleX(-1)";
        this.elements.cropImage.style.transform = "scaleX(-1)";
        this.state.cropper?.scale(-1, 1);
      } else {
        this.elements.previewImage.style.transform = "scaleX(1)";
        this.elements.cropImage.style.transform = "scaleX(1)";
        this.state.cropper?.scale(1, 1);
      }

      this.elements.previewImage.style.filter = filters.join(" ");
      if (cropperBaseImg && imgInCropBox) {
        cropperBaseImg.style.filter = filters.join(" ");
        imgInCropBox.style.filter = filters.join(" ");
      }
    }
  }

  updateCropperAspectRatio() {
    if (!this.state.cropper) return;

    const { widthFeet, widthInches, heightFeet, heightInches } = this.state.dimensions;

    // Calculate new aspect ratio from dimensions
    const totalWidthInches = widthFeet * 12 + widthInches;
    const totalHeightInches = heightFeet * 12 + heightInches;

    if (totalWidthInches > 0 && totalHeightInches > 0) {
      const newAspectRatio = totalWidthInches / totalHeightInches;
      // console.log("Updating cropper aspect ratio to:", newAspectRatio);

      // Update the cropper's aspect ratio
      this.state.cropper.setAspectRatio(newAspectRatio);

      // Reset the crop box to fit the new aspect ratio
      this.state.cropper.reset();
      this.state.cropper.crop();
    } else {
      // If dimensions are cleared, allow free cropping
      // console.log("Dimensions cleared - setting free aspect ratio");
      this.state.cropper.setAspectRatio(NaN);
    }
  }

  get elements() {
    return this.configurator.elements;
  }

  get state() {
    return this.configurator.state;
  }
}

export default ConfiguratorCropperController;
