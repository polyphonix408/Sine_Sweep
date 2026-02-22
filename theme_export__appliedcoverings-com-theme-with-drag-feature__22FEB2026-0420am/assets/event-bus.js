export const PRE_EXISTING_FILE_LOADED = "PRE_EXISTING_FILE_LOADED";
export const OPTIONS_UPDATED = "OPTIONS_UPDATED";
export const DIMENSIONS_UPDATED = "DIMENSIONS_UPDATED";
export const IMAGE_CROPPED = "IMAGE_CROPPED";
export const FILE_UPLOADED = "FILE_UPLOADED";
export const SWITCHING_MODE = "SWITCHING_MODE";
export const MATERIAL_SELECTED = "MATERIAL_SELECTED";

class EventBus {
  constructor() {
    if (EventBus.instance) {
      return EventBus.instance;
    }
    this.events = new Map();
    EventBus.instance = this;
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  emit(event, data) {
    console.log("LOG", event, data);
    if (this.events.has(event)) {
      this.events.get(event).forEach((callback) => callback(data));
    }
  }

  off(event, callback) {
    if (this.events.has(event)) {
      this.events.get(event).splice(this.events.get(event).indexOf(callback), 1);
    }
  }
}

const eventBus = new EventBus();
export default eventBus;
