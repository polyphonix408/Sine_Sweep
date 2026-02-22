import Utils from "./utils.js";

if (!customElements.get("fullscreen-loading")) {
  class FullscreenLoading extends HTMLElement {
    constructor() {
      super();
      const loading = document.getElementById("loading-configurator");
      const productId = "{{ product.id }}";
      const savedView = Utils.getSavedView(productId);
      console.log("Saved view:", savedView);
      console.log("Template suffix:", "{{ template.suffix }}");

      if (savedView !== "configurator" || "{{ template.suffix }}" !== "wallpaper") {
        setTimeout(() => {
          loading?.hide();
        }, 500);
      }
    }

    connectedCallback() {
      this.overlay = this.querySelector(".fullscreen-loading-overlay");
    }

    show(message) {
      this.querySelector(".fullscreen-loading-message").textContent = message;
      this.overlay?.classList.add("active");
    }

    hide() {
      this.overlay?.classList.remove("active");
    }
  }

  customElements.define("fullscreen-loading", FullscreenLoading);
}
