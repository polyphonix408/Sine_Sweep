import EventBus, {
  OPTIONS_UPDATED,
  DIMENSIONS_UPDATED,
  IMAGE_CROPPED,
  SWITCHING_MODE,
  MATERIAL_SELECTED,
} from "./event-bus.js";

/**
 * WallpaperStorageManager
 * Handles session management and localStorage persistence for the wallpaper configurator
 */
export default class WallpaperStorageManager {
  constructor(configurator) {
    this.configurator = configurator;
    this.sessionId = this.getOrCreateSessionId();
    this.storageKey = `wallpaper_configurator_state_${this.sessionId}`;

    EventBus.on(OPTIONS_UPDATED, () => this.saveStateToStorage());
    EventBus.on(DIMENSIONS_UPDATED, () => this.saveStateToStorage());
    EventBus.on(IMAGE_CROPPED, () => this.saveStateToStorage());
    EventBus.on(SWITCHING_MODE, () => this.saveStateToStorage());
    EventBus.on(MATERIAL_SELECTED, () => this.saveStateToStorage());
  }

  /**
   * Get or create a unique session ID for this browser tab
   * Uses sessionStorage so it persists across page reloads in the same tab
   * @returns {string} Session ID
   */
  getOrCreateSessionId() {
    // Check if we already have a session ID for this tab
    let sessionId = sessionStorage.getItem("wallpaper_session_id");

    if (!sessionId) {
      // Generate new session ID if none exists
      sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("wallpaper_session_id", sessionId);
      // console.log("Created new session ID:", sessionId);
    } else {
      // console.log("Using existing session ID:", sessionId);
    }

    return sessionId;
  }

  /**
   * Clean up localStorage entries older than 24 hours
   * Prevents localStorage from filling up with old session data
   */
  cleanupOldSessions() {
    try {
      // Clean up localStorage entries older than 24 hours
      const keys = Object.keys(localStorage);
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;

      keys.forEach((key) => {
        if (key.startsWith("wallpaper_configurator_state_")) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              if (parsed.timestamp && now - parsed.timestamp > dayInMs) {
                localStorage.removeItem(key);
                // console.log(`Cleaned up old session: ${key}`);
              }
            }
          } catch (e) {
            // If we can't parse it, remove it
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error("Error cleaning up old sessions:", error);
    }
  }

  /**
   * Save current configurator state to localStorage
   * Saves dimensions, material selection, options, and mode settings
   * Does not save image data or S3 keys (too large)
   */
  saveStateToStorage() {
    console.log("Saving state to localStorage");
    try {
      const stateToSave = {
        productId: this.configurator.config.productId,
        dimensions: this.configurator.state.dimensions,
        selectedVariantId: this.configurator.state.selectedVariantId,
        mode: this.configurator.state.mode,
        patternSizeInches: this.configurator.state.patternSizeInches,
        patternOffsetX: this.configurator.state.patternOffsetX,
        patternOffsetY: this.configurator.state.patternOffsetY,
        options: this.configurator.state.options,
        hasValidDimensions: this.configurator.state.hasValidDimensions,
        squareFootage: this.configurator.state.squareFootage,
        // Save whether image has been cropped to avoid returning to crop interface
        // hasCroppedImage: !!this.configurator.state.croppedImage,
        // Don't save actual image data or S3 keys - too large and temporary
        timestamp: Date.now(),
      };

      localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Error saving state to localStorage:", error);
    }
  }

  /**
   * Load saved state from localStorage and restore configurator state
   * Only loads state that is less than 24 hours old
   */
  loadStateFromStorage() {
    try {
      const savedState = localStorage.getItem(this.storageKey);
      if (!savedState) return;

      const parsedState = JSON.parse(savedState);
      if (parsedState.productId !== this.configurator.config.productId) return;
      console.log("Restoring state from localStorage:", parsedState);

      // Check if saved state is less than 24 hours old
      const hoursSinceeSave = (Date.now() - parsedState.timestamp) / (1000 * 60 * 60);
      if (hoursSinceeSave > 24) {
        localStorage.removeItem(this.storageKey);
        return;
      }

      delete parsedState.productId;
      this.configurator.state = {
        ...this.configurator.state,
        ...parsedState,
      };

      return;

      // Restore dimensions
      if (parsedState.dimensions) {
        this.configurator.state.dimensions = parsedState.dimensions;

        // Update dimension inputs
        if (this.configurator.elements.widthFeet)
          this.configurator.elements.widthFeet.value = parsedState.dimensions.widthFeet ?? "";
        if (this.configurator.elements.widthInch)
          this.configurator.elements.widthInch.value = parsedState.dimensions.widthInches ?? "";
        if (this.configurator.elements.heightFeet)
          this.configurator.elements.heightFeet.value = parsedState.dimensions.heightFeet ?? "";
        if (this.configurator.elements.heightInch)
          this.configurator.elements.heightInch.value = parsedState.dimensions.heightInches ?? "";
      }

      // Restore material selection
      if (parsedState.selectedMaterial && this.configurator.elements.materialSelect) {
        this.configurator.elements.materialSelect.value = parsedState.selectedMaterial;
        this.configurator.state.selectedVariantId = parsedState.selectedMaterial;

        // Get material details
        const selectedOption = this.configurator.elements.materialSelect.selectedOptions[0];
        if (selectedOption) {
          this.configurator.state.selectedMaterial = {
            id: parsedState.selectedMaterial,
            title: selectedOption.textContent,
            price: parseFloat(selectedOption.dataset.price),
          };
        }
      }

      // Restore other state
      if (parsedState.imageMode) {
        this.configurator.state.imageMode = parsedState.imageMode;
        // Update mode toggle buttons
        if (this.configurator.elements.modeSingleBtn && this.configurator.elements.modePatternBtn) {
          if (parsedState.imageMode === "single") {
            this.configurator.elements.modeSingleBtn.classList.add("active");
            this.configurator.elements.modePatternBtn.classList.remove("active");
          } else {
            this.configurator.elements.modeSingleBtn.classList.remove("active");
            this.configurator.elements.modePatternBtn.classList.add("active");
          }
        }
        // Show/hide pattern settings
        if (this.configurator.elements.patternSettings) {
          this.configurator.elements.patternSettings.style.display =
            parsedState.imageMode === "pattern" ? "block" : "none";
        }
      }

      // Load pattern size (handle both old percentage and new inches format)
      if (parsedState.patternSizeInches) {
        this.configurator.state.patternSizeInches = parsedState.patternSizeInches;
      } else if (parsedState.patternScale) {
        // Convert old percentage to inches (approximate)
        this.configurator.state.patternSizeInches = Math.round((parsedState.patternScale / 100) * 72);
      }

      // Update pattern size slider and display
      if (this.configurator.elements.patternSizeSlider) {
        this.configurator.elements.patternSizeSlider.value = this.configurator.state.patternSizeInches;
      }
      if (this.configurator.elements.patternSizeValue) {
        this.configurator.UIController.updatePatternSliderRange();
        this.configurator.UIController.updatePatternSizeDisplay();
      }

      // Restore options and update button states
      if (parsedState.options) {
        this.configurator.state.options = parsedState.options;

        // Update mirror button state
        if (this.configurator.elements.mirrorBtn) {
          if (this.configurator.state.options.mirror) {
            this.configurator.elements.mirrorBtn.classList.add("active");
          } else {
            this.configurator.elements.mirrorBtn.classList.remove("active");
          }
        }

        // Update black & white button state
        if (this.configurator.elements.bwBtn) {
          if (this.configurator.state.options.blackAndWhite) {
            this.configurator.elements.bwBtn.classList.add("active");
          } else {
            this.configurator.elements.bwBtn.classList.remove("active");
          }
        }
      }

      // Restore cropped state flag
      if (parsedState.hasCroppedImage) {
        this.configurator.state.hasCroppedImage = true;
      }
      if (parsedState.hasValidDimensions !== undefined) {
        this.configurator.state.hasValidDimensions = parsedState.hasValidDimensions;
      }
      if (parsedState.squareFootage) this.configurator.state.squareFootage = parsedState.squareFootage;

      // console.log(`State restored from localStorage (session: ${this.sessionId})`);
    } catch (error) {
      console.error("Error loading state from localStorage:", error);
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Clear saved state from localStorage
   * Called when successfully adding to cart
   */
  clearStateFromStorage() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  }
}
