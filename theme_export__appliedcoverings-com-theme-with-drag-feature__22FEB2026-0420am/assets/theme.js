/*
 * @license
 * Pipeline Theme (c) Groupthought Themes
 *
 * This file is included for advanced development by
 * Shopify Agencies.  Modified versions of the theme
 * code are not supported by Shopify or Groupthought.
 *
 */

(function (
  AOS,
  FlickityFade,
  scrollLock,
  Flickity,
  MicroModal,
  Rellax,
  themeCurrency,
  axios,
  FlickitySync,
  themeAddresses,
  Sqrl,
) {
  "use strict";

  function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
      Object.keys(e).forEach(function (k) {
        if (k !== "default") {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(
            n,
            k,
            d.get
              ? d
              : {
                  enumerable: true,
                  get: function () {
                    return e[k];
                  },
                },
          );
        }
      });
    }
    n.default = e;
    return Object.freeze(n);
  }

  var Sqrl__namespace = /*#__PURE__*/ _interopNamespaceDefault(Sqrl);

  (function () {
    const env = { NODE_ENV: "production" };
    try {
      if (process) {
        process.env = Object.assign({}, process.env);
        Object.assign(process.env, env);
        return;
      }
    } catch (e) {} // avoid ReferenceError: process is not defined
    globalThis.process = { env: env };
  })();

  // From https://developer.chrome.com/blog/using-requestidlecallback/#checking-for-requestidlecallback
  window.requestIdleCallback =
    window.requestIdleCallback ||
    function (cb) {
      var start = Date.now();
      return setTimeout(function () {
        cb({
          didTimeout: false,
          timeRemaining: function () {
            return Math.max(0, 50 - (Date.now() - start));
          },
        });
      }, 1);
    };
  window.cancelIdleCallback =
    window.cancelIdleCallback ||
    function (id) {
      clearTimeout(id);
    };

  function moveModals(container) {
    const modals = container.querySelectorAll("[data-modal]");
    const modalBin = document.querySelector("[data-modal-container]");
    modals.forEach((element) => {
      const alreadyAdded = modalBin.querySelector(`[id="${element.id}"]`);
      if (!alreadyAdded) {
        modalBin.appendChild(element);
      }
    });
  }

  function floatLabels(container) {
    const floats = container.querySelectorAll(".float__wrapper");
    floats.forEach((element) => {
      const label = element.querySelector("label");
      const input = element.querySelector("input, textarea");
      if (label) {
        input.addEventListener("keyup", (event) => {
          if (event.target.value !== "") {
            label.classList.add("label--float");
          } else {
            label.classList.remove("label--float");
          }
        });
      }
      if (input && input.value && input.value.length) {
        label.classList.add("label--float");
      }
    });
  }
  function errorTabIndex(container) {
    const errata = container.querySelectorAll(".errors");
    errata.forEach((element) => {
      element.setAttribute("tabindex", "0");
      element.setAttribute("aria-live", "assertive");
      element.setAttribute("role", "alert");
    });
  }

  // Remove loading class from all already loaded images
  function removeLoadingClassFromLoadedImages(container) {
    container.querySelectorAll("img").forEach((el) => {
      if (el.complete) {
        el.parentNode.classList.remove("loading-shimmer");
      }
    });
  }
  // Remove loading class from image on `load` event
  function handleImageLoaded(el) {
    if (el.tagName == "IMG" && el.parentNode.classList.contains("loading-shimmer")) {
      el.parentNode.classList.remove("loading-shimmer");
    }
  }

  function readHeights() {
    const h = {};
    h.windowHeight = window.innerHeight;
    h.announcementHeight = getHeight("[data-announcement-bar]");
    h.toolbarHeight = getHeight("[data-toolbar-height]");
    h.footerHeight = getHeight('[data-section-type*="footer"]');
    h.menuHeight = getHeight("[data-header-height]");
    h.headerHeight = h.menuHeight + h.announcementHeight;
    h.logoHeight = getFooterLogoWithPadding();
    h.stickyHeader = document.querySelector('[data-header-sticky="sticky"]') ? h.menuHeight : 0;
    h.backfillHeight = getHeight("[data-header-backfill]");
    return h;
  }
  function setVarsOnResize() {
    document.addEventListener("theme:resize", resizeVars);
    setVars();
  }
  function setVars() {
    const {
      windowHeight,
      announcementHeight,
      toolbarHeight,
      headerHeight,
      logoHeight,
      menuHeight,
      footerHeight,
      stickyHeader,
      backfillHeight,
    } = readHeights();
    document.documentElement.style.setProperty("--scrollbar-width", `${getScrollbarWidth()}px`);
    document.documentElement.style.setProperty("--footer-logo", `${logoHeight}px`);
    document.documentElement.style.setProperty("--full-screen", `${windowHeight}px`);
    document.documentElement.style.setProperty("--three-quarters", `${windowHeight * 0.75}px`);
    document.documentElement.style.setProperty("--two-thirds", `${windowHeight * 0.66}px`);
    document.documentElement.style.setProperty("--one-half", `${windowHeight * 0.5}px`);
    document.documentElement.style.setProperty("--one-third", `${windowHeight * 0.33}px`);
    document.documentElement.style.setProperty("--one-fifth", `${windowHeight * 0.2}px`);
    document.documentElement.style.setProperty("--menu-height", `${menuHeight}px`);
    document.documentElement.style.setProperty("--announcement-height", `${announcementHeight}px`);
    document.documentElement.style.setProperty("--toolbar-height", `${toolbarHeight}px`);
    document.documentElement.style.setProperty("--header-height", `${headerHeight}px`);
    document.documentElement.style.setProperty("--footer-height", `${footerHeight}px`);
    document.documentElement.style.setProperty("--content-full", `${windowHeight - headerHeight - logoHeight / 2}px`);
    document.documentElement.style.setProperty("--menu-height-sticky", `${stickyHeader}px`);
    // if backfill estimation is within 1px rounded, don't force a layout shift
    let newBackfill = Math.abs(backfillHeight - menuHeight) > 1 ? `${menuHeight}px` : "auto";
    document.documentElement.style.setProperty("--menu-backfill-height", newBackfill);
  }
  function resizeVars() {
    // restrict the heights that are changed on resize to avoid iOS jump when URL bar is shown and hidden
    const {
      windowHeight,
      announcementHeight,
      toolbarHeight,
      headerHeight,
      logoHeight,
      menuHeight,
      footerHeight,
      stickyHeader,
      backfillHeight,
    } = readHeights();
    document.documentElement.style.setProperty("--scrollbar-width", `${getScrollbarWidth()}px`);
    document.documentElement.style.setProperty("--full-screen", `${windowHeight}px`);
    document.documentElement.style.setProperty("--menu-height", `${menuHeight}px`);
    document.documentElement.style.setProperty("--announcement-height", `${announcementHeight}px`);
    document.documentElement.style.setProperty("--toolbar-height", `${toolbarHeight}px`);
    document.documentElement.style.setProperty("--header-height", `${headerHeight}px`);
    document.documentElement.style.setProperty("--footer-height", `${footerHeight}px`);
    document.documentElement.style.setProperty("--content-full", `${windowHeight - headerHeight - logoHeight / 2}px`);
    document.documentElement.style.setProperty("--menu-height-sticky", `${stickyHeader}px`);
    // if backfill estimation is within 1px rounded, don't force a layout shift
    let newBackfill = Math.abs(backfillHeight - menuHeight) > 1 ? `${menuHeight}px` : "auto";
    document.documentElement.style.setProperty("--menu-backfill-height", newBackfill);
  }
  function getHeight(selector) {
    const el = document.querySelector(selector);
    if (el) {
      return el.clientHeight;
    } else {
      return 0;
    }
  }
  function getFooterLogoWithPadding() {
    const height = getHeight("[data-footer-logo]");
    if (height > 0) {
      return height + 20;
    } else {
      return 0;
    }
  }
  function getScrollbarWidth() {
    // Creating invisible container
    const outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.overflow = "scroll"; // forcing scrollbar to appear
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps
    document.body.appendChild(outer);
    // Creating inner element and placing it in the container
    const inner = document.createElement("div");
    outer.appendChild(inner);
    // Calculating difference between container's full width and the child width
    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);
    return scrollbarWidth;
  }

  function singles(frame, wrappers) {
    // sets the height of any frame passed in with the
    // tallest js-overflow-content as well as any image in that frame
    let padding = 64;
    let tallest = 0;
    wrappers.forEach((wrap) => {
      if (wrap.offsetHeight > tallest) {
        const getMarginTop = parseInt(window.getComputedStyle(wrap).marginTop);
        const getMarginBottom = parseInt(window.getComputedStyle(wrap).marginBottom);
        const getMargin = getMarginTop + getMarginBottom;
        if (getMargin > padding) {
          padding = getMargin;
        }
        tallest = wrap.offsetHeight;
      }
    });
    const images = frame.querySelectorAll("[data-overflow-background]");
    const frames = [frame, ...images];
    frames.forEach((el) => {
      el.style.setProperty("min-height", `calc(${tallest + padding}px + var(--menu-height))`);
    });
  }
  function doubles(section) {
    let footerLogoH = document.querySelector("[data-footer-logo]")
      ? document.querySelector("[data-footer-logo]").clientHeight + 20
      : 0;
    const lastSection = document.querySelector("#MainContent .shopify-section:last-child [data-section-id]");
    const lastSectionAttrID = lastSection ? lastSection.getAttribute("data-section-id") : null;
    if ((lastSectionAttrID !== null && section.getAttribute("data-section-id") !== lastSectionAttrID) || !lastSection) {
      footerLogoH = 0;
    }
    if (window.innerWidth < window.theme.sizes.medium) {
      // if we are below the small breakpoint, the double section acts like two independent
      // single frames
      let singleFrames = section.querySelectorAll("[data-overflow-frame]");
      singleFrames.forEach((singleframe) => {
        const wrappers = singleframe.querySelectorAll("[data-overflow-content]");
        singles(singleframe, wrappers);
      });
      return;
    }
    // Javascript can't execute calc() (from `--outer` variable) - create a new div with width property instead `getPropertyValue('--outer')`
    const htmlObject = document.createElement("div");
    section.prepend(htmlObject);
    htmlObject.style.display = "none";
    htmlObject.style.width = getComputedStyle(section).getPropertyValue("--outer");
    const padding = parseInt(getComputedStyle(htmlObject).getPropertyValue("width")) * 2;
    section.firstChild.remove();
    let tallest = 0;
    const frames = section.querySelectorAll("[data-overflow-frame]");
    const contentWrappers = section.querySelectorAll("[data-overflow-content]");
    contentWrappers.forEach((content) => {
      if (content.offsetHeight > tallest) {
        tallest = content.offsetHeight;
      }
    });
    const images = section.querySelectorAll("[data-overflow-background]");
    let applySizes = [...frames, ...images];
    applySizes.forEach((el) => {
      el.style.setProperty("min-height", `${tallest + padding}px`);
    });
    section.style.setProperty("min-height", `${tallest + padding + 2 + footerLogoH}px`);
  }
  function preventOverflow(container) {
    const singleFrames = container.querySelectorAll(".js-overflow-container");
    if (singleFrames) {
      singleFrames.forEach((frame) => {
        const wrappers = frame.querySelectorAll(".js-overflow-content");
        singles(frame, wrappers);
        document.addEventListener("theme:resize", () => {
          singles(frame, wrappers);
        });
      });
      // Reload slides if container has slideshow
      const slideshows = container.querySelectorAll("[data-slideshow-wrapper]");
      if (slideshows.length) {
        slideshows.forEach((slideshow) => {
          const slideshowInstance = FlickityFade.data(slideshow);
          if (typeof slideshowInstance !== "undefined") {
            slideshowInstance.reloadCells();
          }
        });
      }
    }
    const doubleSections = container.querySelectorAll("[data-overflow-wrapper]");
    if (doubleSections) {
      doubleSections.forEach((section) => {
        doubles(section);
        document.addEventListener("theme:resize", () => {
          doubles(section);
        });
      });
    }
  }

  // Adapted from https://github.com/component/debounce/blob/master/index.js
  /**
   * Returns a function, that, as long as it continues to be invoked, will not
   * be triggered. The function will be called after it stops being called for
   * N milliseconds. If `immediate` is passed, trigger the function on the
   * leading edge, instead of the trailing. The function also has a property 'clear'
   * that is a function which will clear the timer to prevent previously scheduled executions.
   *
   * @source underscore.js
   * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
   * @param {Function} function to wrap
   * @param {Number} timeout in ms (`100`)
   * @param {Boolean} whether to execute at the beginning (`false`)
   * @api public
   */ function debounce$1(func, wait = 500, immediate = false) {
    var timeout, args, context, timestamp, result;
    if (wait == null) wait = 100;
    function later() {
      var last = Date.now() - timestamp;
      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    }
    var debounced = function () {
      context = this;
      args = arguments;
      timestamp = Date.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }
      return result;
    };
    debounced.clear = function () {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    };
    debounced.flush = function () {
      if (timeout) {
        result = func.apply(context, args);
        context = args = null;
        clearTimeout(timeout);
        timeout = null;
      }
    };
    return debounced;
  }

  let lastWindowWidth = window.innerWidth;
  let lastWindowHeight = window.innerHeight;
  function dispatch$2() {
    document.dispatchEvent(
      new CustomEvent("theme:resize", {
        bubbles: true,
      }),
    );
    if (lastWindowWidth !== window.innerWidth) {
      document.dispatchEvent(
        new CustomEvent("theme:resize:width", {
          bubbles: true,
        }),
      );
      lastWindowWidth = window.innerWidth;
    }
    if (lastWindowHeight !== window.innerHeight) {
      document.dispatchEvent(
        new CustomEvent("theme:resize:height", {
          bubbles: true,
        }),
      );
      lastWindowHeight = window.innerHeight;
    }
  }
  let raf;
  function resizeListener() {
    window.addEventListener("resize", () => {
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
      raf = window.requestAnimationFrame(debounce$1(dispatch$2, 50));
    });
  }

  let prev = window.pageYOffset;
  let up = null;
  let down = null;
  let wasUp = null;
  let wasDown = null;
  let scrollLockTimer = 0;
  function dispatch$1() {
    const position = window.pageYOffset;
    if (position > prev) {
      down = true;
      up = false;
    } else if (position < prev) {
      down = false;
      up = true;
    } else {
      up = null;
      down = null;
    }
    prev = position;
    document.dispatchEvent(
      new CustomEvent("theme:scroll", {
        detail: {
          up,
          down,
          position,
        },
        bubbles: false,
      }),
    );
    if (up && !wasUp) {
      document.dispatchEvent(
        new CustomEvent("theme:scroll:up", {
          detail: {
            position,
          },
          bubbles: false,
        }),
      );
    }
    if (down && !wasDown) {
      document.dispatchEvent(
        new CustomEvent("theme:scroll:down", {
          detail: {
            position,
          },
          bubbles: false,
        }),
      );
    }
    wasDown = down;
    wasUp = up;
  }
  function lock(e) {
    // Prevent body scroll lock race conditions
    setTimeout(() => {
      if (scrollLockTimer) {
        clearTimeout(scrollLockTimer);
      }
      scrollLock.disablePageScroll(e.detail, {
        allowTouchMove: (el) => el.tagName === "TEXTAREA",
      });
      document.documentElement.setAttribute("data-scroll-locked", "");
    });
  }
  function unlock(e) {
    const timeout = e.detail;
    if (timeout) {
      scrollLockTimer = setTimeout(removeScrollLock, timeout);
    } else {
      removeScrollLock();
    }
  }
  function removeScrollLock() {
    scrollLock.clearQueueScrollLocks();
    scrollLock.enablePageScroll();
    document.documentElement.removeAttribute("data-scroll-locked");
  }
  function scrollListener() {
    let raf;
    window.addEventListener(
      "scroll",
      function () {
        if (raf) {
          window.cancelAnimationFrame(raf);
        }
        raf = window.requestAnimationFrame(dispatch$1);
      },
      {
        passive: true,
      },
    );
    window.addEventListener("theme:scroll:lock", lock);
    window.addEventListener("theme:scroll:unlock", unlock);
  }

  const selectors$17 = {
    time: "time",
    days: "[data-days]",
    hours: "[data-hours]",
    minutes: "[data-minutes]",
    seconds: "[data-seconds]",
    shopifySection: ".shopify-section",
  };
  const attributes$2 = {
    expirationBehavior: "data-expiration-behavior",
  };
  const classes$I = {
    showMessage: "show-message",
    hideCountdown: "hidden",
  };
  const settings = {
    hideSection: "hide-section",
    showMessage: "show-message",
  };
  let CountdownTimer = class CountdownTimer extends HTMLElement {
    connectedCallback() {
      if (isNaN(this.endDate)) {
        this.onComplete();
        return;
      }
      if (this.endDate <= Date.now()) {
        this.onComplete();
        return;
      }
      // Update the countdown every second
      this.interval = setInterval(this.update, 1000);
    }
    disconnectedCallback() {
      this.stopTimer();
    }
    convertTime(timeInMs) {
      const days = this.formatDigits(parseInt(timeInMs / this.daysInMs, 10));
      timeInMs -= days * this.daysInMs;
      const hours = this.formatDigits(parseInt(timeInMs / this.hoursInMs, 10));
      timeInMs -= hours * this.hoursInMs;
      const minutes = this.formatDigits(parseInt(timeInMs / this.minutesInMs, 10));
      timeInMs -= minutes * this.minutesInMs;
      const seconds = this.formatDigits(parseInt(timeInMs / this.secondsInMs, 10));
      return {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds,
      };
    }
    // Make numbers less than 10 to appear with a leading zero like 01, 02, 03
    formatDigits(number) {
      if (number < 10) number = "0" + number;
      return number;
    }
    render(timer) {
      this.days.textContent = timer.days;
      this.hours.textContent = timer.hours;
      this.minutes.textContent = timer.minutes;
      this.seconds.textContent = timer.seconds;
    }
    stopTimer() {
      clearInterval(this.interval);
    }
    onComplete() {
      this.render({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
      if (this.shouldHideOnComplete) {
        this.shopifySection.classList.add(classes$I.hideCountdown);
      }
      if (this.shouldShowMessage) {
        this.classList.add(classes$I.showMessage);
      }
    }
    // Function to update the countdown
    update() {
      const timeNow = new Date().getTime();
      const timeDiff = this.endDate - timeNow;
      if (timeDiff <= 0) {
        this.stopTimer();
        this.onComplete();
      }
      const timeRemaining = this.convertTime(timeDiff);
      this.render(timeRemaining);
    }
    constructor() {
      super();
      this.shopifySection = this.closest(selectors$17.shopifySection);
      this.expirationBehavior = this.getAttribute(attributes$2.expirationBehavior);
      this.time = this.querySelector(selectors$17.time);
      this.days = this.querySelector(selectors$17.days);
      this.hours = this.querySelector(selectors$17.hours);
      this.minutes = this.querySelector(selectors$17.minutes);
      this.seconds = this.querySelector(selectors$17.seconds);
      // Get the current and expiration dates in Unix timestamp format (milliseconds)
      this.endDate = Date.parse(this.time.dateTime);
      this.daysInMs = 1000 * 60 * 60 * 24;
      this.hoursInMs = this.daysInMs / 24;
      this.minutesInMs = this.hoursInMs / 60;
      this.secondsInMs = this.minutesInMs / 60;
      this.shouldHideOnComplete = this.expirationBehavior === settings.hideSection;
      this.shouldShowMessage = this.expirationBehavior === settings.showMessage;
      this.update = this.update.bind(this);
    }
  };

  resizeListener();
  scrollListener();
  // Remove "loading-shimmer" class from cached and very fast images
  removeLoadingClassFromLoadedImages(document);
  // Watch for any load events that bubble up from child elements
  document.addEventListener(
    "load",
    (e) => {
      const el = e.target;
      // Capture load events from img tags and then remove their `loading-shimmer` class
      handleImageLoaded(el);
    },
    true,
  );
  // Tasks to run when the DOM elements are available
  window.addEventListener("DOMContentLoaded", () => {
    setVarsOnResize();
    floatLabels(document);
    errorTabIndex(document);
    moveModals(document);
    if (window.theme.settings.animate_scroll) {
      AOS.refresh();
    }
  });
  // Tasks to run when entire page has finished loading including images, stylesheets, async scripts, etc
  window.addEventListener("load", () => {
    // Fix any text overflow in position:absolute elements
    preventOverflow(document);
    // Catch any images that loaded before our load event listener above and remove "loading-shimmer" class
    removeLoadingClassFromLoadedImages(document);
  });
  document.addEventListener("shopify:section:load", (e) => {
    const container = e.target;
    floatLabels(container);
    errorTabIndex(container);
    moveModals(container);
    preventOverflow(container);
    if (window.theme.settings.animate_scroll) {
      AOS.refresh();
    }
  });
  document.addEventListener("shopify:section:reorder", () => {
    document.dispatchEvent(
      new CustomEvent("theme:header:check", {
        bubbles: false,
      }),
    );
  });
  if (!customElements.get("countdown-timer")) {
    customElements.define("countdown-timer", CountdownTimer);
  }

  const showElement = (elem, removeProp = false, prop = "block") => {
    if (elem) {
      if (removeProp) {
        elem.style.removeProperty("display");
      } else {
        elem.style.display = prop;
      }
    }
  };

  function FetchError(object) {
    this.status = object.status || null;
    this.headers = object.headers || null;
    this.json = object.json || null;
    this.body = object.body || null;
  }
  FetchError.prototype = Error.prototype;

  const selectors$16 = {
    scrollbar: "data-scrollbar-slider",
    scrollbarArrowPrev: "[data-scrollbar-arrow-prev]",
    scrollbarArrowNext: "[data-scrollbar-arrow-next]",
  };
  const classes$H = {
    hidden: "is-hidden",
  };
  const times$1 = {
    delay: 200,
  };
  let NativeScrollbar = class NativeScrollbar {
    init() {
      if (this.arrowNext && this.arrowPrev) {
        if (window.isRTL) {
          this.togglePrevArrow();
        } else {
          this.toggleNextArrow();
        }
        this.events();
      }
    }
    resize() {
      document.addEventListener("theme:resize", () => {
        if (window.isRTL) {
          this.togglePrevArrow();
        } else {
          this.toggleNextArrow();
        }
      });
    }
    events() {
      this.arrowNext.addEventListener("click", (event) => {
        event.preventDefault();
        this.goToNext();
      });
      this.arrowPrev.addEventListener("click", (event) => {
        event.preventDefault();
        this.goToPrev();
      });
      this.scrollbar.addEventListener("scroll", () => {
        this.togglePrevArrow();
        this.toggleNextArrow();
      });
    }
    goToNext() {
      const position = this.scrollbar.getBoundingClientRect().width / 2 + this.scrollbar.scrollLeft;
      this.move(position);
      this.arrowPrev.classList.remove(classes$H.hidden);
      this.toggleNextArrow();
    }
    goToPrev() {
      const position = this.scrollbar.scrollLeft - this.scrollbar.getBoundingClientRect().width / 2;
      this.move(position);
      this.arrowNext.classList.remove(classes$H.hidden);
      this.togglePrevArrow();
    }
    toggleNextArrow() {
      setTimeout(() => {
        if (window.isRTL) {
          this.arrowNext.classList.toggle(classes$H.hidden, this.scrollbar.scrollLeft === 0);
        } else {
          this.arrowNext.classList.toggle(
            classes$H.hidden,
            Math.round(this.scrollbar.scrollLeft + this.scrollbar.getBoundingClientRect().width + 1) >=
              this.scrollbar.scrollWidth,
          );
        }
      }, times$1.delay);
    }
    togglePrevArrow() {
      setTimeout(() => {
        if (window.isRTL) {
          this.arrowPrev.classList.toggle(
            classes$H.hidden,
            Math.abs(this.scrollbar.scrollLeft) + this.scrollbar.getBoundingClientRect().width + 1 >=
              this.scrollbar.scrollWidth,
          );
        } else {
          this.arrowPrev.classList.toggle(classes$H.hidden, this.scrollbar.scrollLeft <= 0);
        }
      }, times$1.delay);
    }
    scrollToVisibleElement() {
      [].forEach.call(this.scrollbar.children, (element) => {
        element.addEventListener("click", (event) => {
          if (
            event.target.tagName.toLowerCase() === "a" ||
            (event.currentTarget && event.currentTarget.tagName.toLowerCase() === "a") ||
            (event.currentTarget && event.currentTarget.querySelector("a"))
          ) {
            event.preventDefault();
          }
          this.move(element.offsetLeft - element.clientWidth);
        });
      });
    }
    move(offsetLeft) {
      this.scrollbar.scrollTo({
        top: 0,
        left: offsetLeft,
        behavior: "smooth",
      });
    }
    constructor(scrollbar) {
      this.scrollbar = scrollbar;
      this.arrowNext = this.scrollbar.parentNode.querySelector(selectors$16.scrollbarArrowNext);
      this.arrowPrev = this.scrollbar.parentNode.querySelector(selectors$16.scrollbarArrowPrev);
      this.init();
      this.resize();
      if (this.scrollbar.hasAttribute(selectors$16.scrollbar)) {
        this.scrollToVisibleElement();
      }
    }
  };

  const selectors$15 = {
    siblingsInnerHolder: "[data-sibling-inner]",
  };
  let Siblings = class Siblings {
    init() {
      this.siblings.forEach((sibling) => {
        new NativeScrollbar(sibling);
      });
    }
    constructor(holder) {
      this.siblings = holder.querySelectorAll(selectors$15.siblingsInnerHolder);
      this.init();
    }
  };
  const siblings = {
    onLoad() {
      new Siblings(this.container);
    },
  };

  const cookieDefaultValues = {
    expires: 7,
    path: "/",
    domain: window.location.hostname,
  };
  let Cookies = class Cookies {
    /**
     * Write cookie
     * @param value - String
     */ write(value) {
      document.cookie = `${this.options.name}=${value}; expires=${this.options.expires}; path=${this.options.path}; domain=${this.options.domain}`;
    }
    /**
     * Read cookies and returns an array of values
     * @returns Array
     */ read() {
      let cookieValuesArr = [];
      const hasCookieWithThisName = document.cookie.split("; ").find((row) => row.startsWith(this.options.name));
      if (document.cookie.indexOf("; ") !== -1 && hasCookieWithThisName) {
        const cookieValue = document.cookie
          .split("; ")
          .find((row) => row.startsWith(this.options.name))
          .split("=")[1];
        if (cookieValue !== null) {
          cookieValuesArr = cookieValue.split(",");
        }
      }
      return cookieValuesArr;
    }
    destroy() {
      document.cookie = `${this.options.name}=null; expires=${this.options.expires}; path=${this.options.path}; domain=${this.options.domain}`;
    }
    remove(removedValue) {
      const cookieValue = this.read();
      const position = cookieValue.indexOf(removedValue);
      if (position !== -1) {
        cookieValue.splice(position, 1);
        this.write(cookieValue);
      }
    }
    constructor(options = {}) {
      this.options = {
        ...cookieDefaultValues,
        ...options,
      };
    }
  };

  const config = {
    howManyToShow: 4,
    howManyToStoreInMemory: 10,
    wrapper: "[data-recently-viewed-products]",
    limit: "data-limit",
    recentTabLink: "[data-recent-link-tab]",
    recentWrapper: "[data-recent-wrapper]",
    recentViewedTab: "[data-recently-viewed-tab]",
    tabsHolderScroll: "[data-tabs-holder-scroll]",
    apiContent: "[data-api-content]",
    dataMinimum: "data-minimum",
    dataItemId: "data-item-id",
  };
  const classes$G = {
    hide: "hide",
    containerWithoutTabsNav: "section-without-title--skip",
  };
  const cookieConfig = {
    expires: 90,
    name: "shopify_recently_viewed",
  };
  const sections$p = [];
  const excludedHandles = [];
  let RecentProducts = class RecentProducts {
    renderProducts() {
      const recentlyViewedHandlesArray = this.cookie.read();
      const arrayURLs = [];
      let counter = 0;
      if (recentlyViewedHandlesArray.length > 0) {
        for (let index = 0; index < recentlyViewedHandlesArray.length; index++) {
          const handle = recentlyViewedHandlesArray[index];
          if (excludedHandles.includes(handle)) {
            continue;
          }
          const url = `${window.theme.routes.root_url}products/${handle}?section_id=api-product-grid-item`;
          arrayURLs.push(url);
          counter++;
          if (counter === this.howManyToShow || counter === recentlyViewedHandlesArray.length - 1) {
            break;
          }
        }
        if (arrayURLs.length > 0 && arrayURLs.length >= this.minimum) {
          this.container.classList.remove(classes$G.hide);
          if (this.recentViewedLink && this.recentViewedLink.previousElementSibling) {
            this.tabsHolderScroll.classList.remove(classes$G.hide);
            this.container.classList.add(classes$G.containerWithoutTabsNav);
          }
          const fecthRequests = arrayURLs.map((url) =>
            fetch(url, {
              mode: "no-cors",
            }).then(this.handleErrors),
          );
          const productMarkups = [];
          Promise.allSettled(fecthRequests)
            .then((responses) => {
              return Promise.all(
                responses.map(async (response) => {
                  if (response.status === "fulfilled") {
                    productMarkups.push(await response.value.text());
                  }
                }),
              );
            })
            .then(() => {
              productMarkups.forEach((markup) => {
                const buffer = document.createElement("div");
                const slide = document.createElement("div");
                buffer.innerHTML = markup;
                const item = buffer.querySelector(`[${config.dataItemId}]`);
                const isEmptyProduct = item.getAttribute(config.dataItemId) === "";
                if (isEmptyProduct) {
                  return;
                }
                slide.classList.add("product-grid-slide");
                slide.setAttribute("data-carousel-slide", null);
                slide.setAttribute("data-item", null);
                slide.innerHTML = buffer.querySelector(config.apiContent).innerHTML;
                this.wrapper.appendChild(slide);
              });
              new Siblings(this.container);
            })
            .then(() => {
              showElement(this.wrapper, true);
              this.container.dispatchEvent(
                new CustomEvent("theme:recent-products:added", {
                  bubbles: true,
                }),
              );
            });
        } else if (this.recentViewedTab) {
          const hasSiblingTabs =
            Array.prototype.filter.call(this.recentViewedTab.parentNode.children, (child) => {
              return child !== this.recentViewedTab;
            }).length > 1;
          if (this.recentViewedLink && this.recentViewedLink.previousElementSibling) {
            this.tabsHolderScroll.classList.add(classes$G.hide);
            this.container.classList.remove(classes$G.containerWithoutTabsNav);
          }
          if (!hasSiblingTabs) {
            this.container.classList.add(classes$G.hide);
          }
        } else {
          this.container.classList.add(classes$G.hide);
        }
      }
    }
    handleErrors(response) {
      if (!response.ok) {
        return response.text().then(function (text) {
          const e = new FetchError({
            status: response.statusText,
            headers: response.headers,
            text: text,
          });
          throw e;
        });
      }
      return response;
    }
    constructor(section) {
      this.container = section.container;
      this.cookie = new Cookies(cookieConfig);
      this.wrapper = this.container.querySelector(config.wrapper);
      if (this.wrapper === null) {
        return;
      }
      this.howManyToShow =
        parseInt(this.container.querySelector(config.recentWrapper).getAttribute(config.limit)) || config.howManyToShow;
      this.minimum = parseInt(this.container.querySelector(config.recentWrapper).getAttribute(config.dataMinimum));
      this.recentViewedTab = this.container.querySelector(config.recentViewedTab);
      this.recentViewedLink = this.container.querySelector(config.recentTabLink);
      this.tabsHolderScroll = this.container.querySelector(config.tabsHolderScroll);
      this.renderProducts();
    }
  };
  let RecordRecentlyViewed = class RecordRecentlyViewed {
    updateCookie() {
      let recentlyViewed = this.cookie.read();
      // In what position is that product in memory.
      const position = recentlyViewed.indexOf(this.handle);
      // If not in memory.
      if (position === -1) {
        // Add product at the start of the list.
        recentlyViewed.unshift(this.handle);
        // Only keep what we need.
        recentlyViewed = recentlyViewed.splice(0, config.howManyToStoreInMemory);
      } else {
        // Remove the product and place it at start of list.
        recentlyViewed.splice(position, 1);
        recentlyViewed.unshift(this.handle);
      }
      // Update cookie.
      const recentlyViewedString = recentlyViewed.join(",");
      this.cookie.write(recentlyViewedString);
    }
    constructor(handle) {
      this.handle = encodeURIComponent(handle);
      this.cookie = new Cookies(cookieConfig);
      if (typeof this.handle === "undefined") {
        return;
      }
      excludedHandles.push(this.handle);
      this.updateCookie();
    }
  };
  const recentProducts = {
    onLoad() {
      sections$p[this.id] = new RecentProducts(this);
    },
  };

  /**
   * Checks the device resolution/touch
   * -----------------------------------------------------------------------------
   *
   * Ensures that we always know if we are using a Touch, Mobile, Tablet, or Desktop device.
   *
   * if (resolution.isMobile) {}
   *
   * It refreshes dynamically. We can also check when that happens by using the onChange method:
   *
   * resolution.onChange(() => {
   *  // only triggers once when we hop between different media screen sizes
   *  // for example, from Mobile(<= 768px) to Tablet(>= 769px and <=1100px)
   *  // or from Tablet(>= 769px and <=1100px) to Desktop(>=1101px)
   *
   *  if (resolution.isMobile() || resolution.isTouch()) {}
   * });
   *
   */ function resolution() {
    const touchQuery = `(any-pointer: coarse)`;
    const mobileQuery = `(max-width: ${window.theme.sizes.medium}px)`;
    const tabletQuery = `(min-width: ${window.theme.sizes.medium + 1}px) and (max-width: ${window.theme.sizes.large}px)`;
    const desktopQuery = `(min-width: ${window.theme.sizes.large + 1}px)`;
    resolution.isTouch = () => {
      const touchMatches = window.matchMedia(touchQuery).matches;
      document.documentElement.classList.toggle("supports-touch", touchMatches);
      return touchMatches;
    };
    resolution.isMobile = () => window.matchMedia(mobileQuery).matches;
    resolution.isTablet = () => window.matchMedia(tabletQuery).matches;
    resolution.isDesktop = () => window.matchMedia(desktopQuery).matches;
    const queries = [
      [touchQuery, resolution.isTouch],
      [mobileQuery, resolution.isMobile],
      [tabletQuery, resolution.isTablet],
      [desktopQuery, resolution.isDesktop],
    ];
    resolution.onChange = (callback) => {
      queries.forEach((query) => {
        window.matchMedia(query[0]).addEventListener("change", () => {
          if (query[1]() && callback) callback();
        });
      });
    };
  }
  resolution();

  const selectors$14 = {
    holderItems: "[data-custom-scrollbar-items]",
    scrollbar: "[data-custom-scrollbar]",
    scrollbarTrack: "[data-custom-scrollbar-track]",
  };
  const classes$F = {
    hide: "hide",
  };
  const sections$o = {};
  let CustomScrollbar = class CustomScrollbar {
    events() {
      this.holderItems.addEventListener("scroll", this.calculatePosition.bind(this));
      this.holderItems.addEventListener("theme:carousel:scroll", this.calculatePosition.bind(this));
      document.addEventListener("theme:resize:width", this.calculateTrackWidth.bind(this));
      document.addEventListener("theme:resize:width", this.calculatePosition.bind(this));
    }
    calculateTrackWidth() {
      // Javascript can't execute calc() (from `--outer` variable) - create a new div with width property instead `getPropertyValue('--outer')` to can get the width of `after` on the holder
      const htmlObject = document.createElement("div");
      this.holderItems.prepend(htmlObject);
      htmlObject.style.display = "none";
      htmlObject.style.width = getComputedStyle(this.holderItems).getPropertyValue("--outer");
      const widthAfter = parseInt(getComputedStyle(htmlObject).getPropertyValue("width"));
      this.holderItems.firstChild.remove();
      this.scrollbarWidth =
        this.scrollbar.clientWidth === 0
          ? this.scrollbar.parentNode.getBoundingClientRect().width
          : this.scrollbar.clientWidth;
      setTimeout(() => {
        const childWidth = this.children[0].clientWidth;
        const childMarginRight = Number(getComputedStyle(this.children[0]).marginRight.replace("px", ""));
        const childMarginLeft = Number(getComputedStyle(this.children[0]).marginLeft.replace("px", ""));
        // Minus `childMarginRight` is added to the end with minus because the last child doesn't have margin-right
        this.scrollWidth =
          this.children.length * (childWidth + childMarginRight + childMarginLeft) + widthAfter - childMarginRight;
        this.trackWidth = ((this.scrollbarWidth + widthAfter) / this.scrollWidth) * 100;
        this.trackWidth = this.trackWidth < 5 ? 5 : this.trackWidth;
        this.scrollbar.style.setProperty("--track-width", `${this.trackWidth}%`);
        const hideScrollbar = Math.ceil(this.trackWidth) >= 100;
        this.scrollbar.classList.toggle(classes$F.hide, hideScrollbar);
      }, 100);
    }
    calculatePosition() {
      // Math.abs() to ensure this works when RTL
      let position =
        Math.abs(this.holderItems.scrollLeft) / (this.holderItems.scrollWidth - this.holderItems.clientWidth);
      position *= this.scrollbar.clientWidth - this.scrollbarTrack.clientWidth;
      position = position < 0 ? 0 : position;
      position = isNaN(position) ? 0 : position;
      this.scrollbar.style.setProperty("--position", `${Math.round(position)}px`);
      document.dispatchEvent(
        new CustomEvent("theme:scrollbar:scroll", {
          bubbles: true,
          detail: {
            holder: this.holderItems,
          },
        }),
      );
    }
    constructor(holder, children = null) {
      this.holderItems = holder.querySelector(selectors$14.holderItems);
      this.scrollbar = holder.querySelector(selectors$14.scrollbar);
      this.scrollbarTrack = holder.querySelector(selectors$14.scrollbarTrack);
      this.trackWidth = 0;
      this.scrollWidth = 0;
      if (this.scrollbar && this.holderItems) {
        this.children = children || this.holderItems.children;
        this.events();
        this.calculateTrackWidth();
      }
    }
  };
  const customScrollbar = {
    onLoad() {
      sections$o[this.id] = new CustomScrollbar(this.container);
    },
  };

  const selectors$13 = {
    carousel: "[data-carousel]",
    carouselWithProgress: "data-carousel-progress",
    carouselSlide: "[data-carousel-slide]",
    carouselFirstSlidePhoto: "[data-grid-slide]",
    pgiFirstSlidePhoto: "product-grid-item-variant:not([hidden]) [data-grid-slide]",
    wrapper: "[data-wrapper]",
    carouselTrack: "[data-carousel-track]",
    slider: ".flickity-slider",
    carouselOptions: "data-options",
    carouselCustomScrollbar: "data-custom-scrollbar-items",
    carouselPrev: ".flickity-button.previous",
    carouselNext: ".flickity-button.next",
    recentlyViewHolder: "data-recently-viewed-products",
    relatedHolder: "data-related-products",
    sectionHolder: "[data-section-id]",
  };
  const classes$E = {
    wrapper: "wrapper",
    arrowsForceTop: "flickity-force-arrows-top",
    arrowsOnSide: "not-moved-arrows",
    hide: "hide",
    flickityEnabled: "flickity-enabled",
    hiddenArrows: "hidden-arrows",
    flickityStatic: "flickity-static",
  };
  const offsets$1 = {
    additionalOffsetWrapper: 112,
  };
  let Carousel = class Carousel extends HTMLElement {
    connectedCallback() {
      this.carousel = this.container.querySelector(selectors$13.carousel);
      this.carouselTrack = this.container.querySelector(selectors$13.carouselTrack);
      this.wrapper = this.container.closest(selectors$13.wrapper);
      this.section = this.container.closest(selectors$13.sectionHolder);
      this.slidesVisible = null;
      this.carouselInstance = null;
      this.carouselPrev = null;
      this.carouselNext = null;
      this.customOptions = {};
      this.toggleWrapperModifierEvent = () => this.toggleWrapperModifier();
      if (this.carousel && this.carousel.hasAttribute(selectors$13.recentlyViewHolder)) {
        // Check carousel in recently viewed products
        this.section.addEventListener("theme:recent-products:added", () => {
          this.init();
        });
      } else if (this.carousel && this.carousel.hasAttribute(selectors$13.relatedHolder)) {
        // Check carousel in recommendation products but without overwrite option
        this.section.addEventListener("theme:related-products:added", () => {
          this.init();
        });
      } else {
        this.init();
      }
    }
    init() {
      if (!this.carousel) {
        return;
      }
      this.slidesTotal = this.carousel.querySelectorAll(selectors$13.carouselSlide).length;
      this.getGridLayout();
      this.trackVisibleSlides();
      if (this.carousel.hasAttribute(selectors$13.carouselOptions)) {
        this.customOptions = JSON.parse(decodeURIComponent(this.carousel.getAttribute(selectors$13.carouselOptions)));
      }
      this.initCarousel();
      this.calculatedArrowsTopPosition();
      this.toggleWrapperModifier();
      document.addEventListener("theme:resize:width", this.toggleWrapperModifierEvent);
      if (this.carousel.hasAttribute(selectors$13.carouselWithProgress)) {
        this.progressBarCalculate();
      }
      if (this.carousel.hasAttribute(selectors$13.carouselCustomScrollbar)) {
        new CustomScrollbar(this.container);
      }
    }
    initCarousel() {
      this.options = {
        accessibility: true,
        contain: true,
        freeScroll: true,
        prevNextButtons: true,
        wrapArround: false,
        groupCells: false,
        autoPlay: false,
        pageDots: false,
        cellAlign: window.isRTL ? "right" : "left",
        rightToLeft: window.isRTL,
        dragThreshold: 10,
        arrowShape: {
          x0: 10,
          x1: 60,
          y1: 50,
          x2: 67.5,
          y2: 42.5,
          x3: 25,
        },
        on: {
          ready: () => {
            this.removeIncorrectAria();
          },
          resize: () => {
            this.toggleArrows();
            this.calculatedArrowsTopPosition();
            setTimeout(() => {
              this.visibleSlides();
            }, 100);
          },
        },
        ...this.customOptions,
      };
      this.carouselInstance = new Flickity(this.carousel, this.options);
      this.carouselPrev = this.carousel.querySelector(selectors$13.carouselPrev);
      this.carouselNext = this.carousel.querySelector(selectors$13.carouselNext);
      this.container.addEventListener("theme:tab:change", () => {
        this.carouselInstance.resize();
        this.carouselPrev = this.carousel.querySelector(selectors$13.carouselPrev);
        this.carouselNext = this.carousel.querySelector(selectors$13.carouselNext);
      });
      this.carouselInstance.on("dragStart", () => {
        this.carouselInstance.slider.style.pointerEvents = "none";
        if (!resolution.isMobile) this.containDrag();
      });
      this.carouselInstance.on("dragEnd", () => {
        this.carouselInstance.slider.style.pointerEvents = "auto";
        if (!resolution.isMobile) this.containDrag();
      });
      this.carouselInstance.on("change", (index) => this.lockArrows(index));
      setTimeout(() => {
        this.visibleSlides();
      }, 100);
      if (Shopify.designMode) {
        setTimeout(() => {
          if (this.carouselInstance.options.watchCSS && !this.carousel.classList.contains(classes$E.flickityEnabled)) {
            this.carouselInstance.destroy();
            this.carouselInstance = new Flickity(this.carousel, this.options);
            this.carouselInstance.resize();
            this.carouselPrev = this.carousel.querySelector(selectors$13.carouselPrev);
            this.carouselNext = this.carousel.querySelector(selectors$13.carouselNext);
          } else {
            this.carouselInstance.resize();
          }
        }, 10);
      }
      this.carousel.classList.toggle(
        classes$E.flickityStatic,
        this.smallItems === this.carousel.querySelectorAll(selectors$13.carouselSlide).length,
      );
      new Siblings(this.container);
    }
    calculatedArrowsTopPosition() {
      const carouselFirstSlidePhoto = this.container.querySelector(selectors$13.carouselFirstSlidePhoto);
      const pgiFirstSlidePhoto = this.container.querySelector(selectors$13.pgiFirstSlidePhoto);
      if (pgiFirstSlidePhoto) {
        const buttonOffset = pgiFirstSlidePhoto.offsetHeight / 2;
        this.carousel.style.setProperty("--buttons-top", `${buttonOffset}px`);
      } else if (carouselFirstSlidePhoto) {
        const buttonOffset = carouselFirstSlidePhoto.offsetHeight / 2;
        this.carousel.style.setProperty("--buttons-top", `${buttonOffset}px`);
      }
    }
    toggleWrapperModifier() {
      if (!this.wrapper) {
        return;
      }
      const scrollbarWidth = Number(
        getComputedStyle(document.documentElement).getPropertyValue("--scrollbar-width").replace("px", ""),
      );
      const wrapperWidth = this.wrapper.clientWidth;
      this.wrapperWidthWithGutter = wrapperWidth + offsets$1.additionalOffsetWrapper + scrollbarWidth;
      if (window.innerWidth >= this.wrapperWidthWithGutter) {
        // the screen is wide, have the arrows beside the carousel
        this.wrapper.classList.remove(classes$E.arrowsForceTop);
        this.section.classList.add(classes$E.arrowsOnSide);
      }
      if (window.innerWidth < this.wrapperWidthWithGutter) {
        // the screen is too narrow for arrows beside the carousel
        // add the wrapper--full class to trick the layout
        this.wrapper.classList.add(classes$E.arrowsForceTop);
        this.section.classList.remove(classes$E.arrowsOnSide);
      }
    }
    progressBarCalculate() {
      if (this.carouselInstance !== null && this.carouselTrack) {
        this.carouselInstance.on("scroll", (progress) => {
          progress = Math.max(0, Math.min(1, progress)) * 100 + "%";
          this.carouselTrack.style.width = progress;
        });
      }
    }
    getGridLayout() {
      this.largeItems = Number(getComputedStyle(this.carousel).getPropertyValue("--grid-large-items")) || 3;
      this.mediumItems =
        Number(getComputedStyle(this.carousel).getPropertyValue("--grid-medium-items")) || this.largeItems;
      this.smallItems =
        Number(getComputedStyle(this.carousel).getPropertyValue("--grid-small-items")) ||
        this.mediumItems ||
        this.largeItems;
    }
    visibleSlides() {
      if (!this.carousel) {
        return;
      }
      this.getGridLayout();
      const carouselWidth = this.carousel.clientWidth || this.carouselInstance.size.width;
      const slideWidth =
        this.carouselInstance !== null && this.carouselInstance.selectedElement
          ? this.carouselInstance.selectedElement.clientWidth
          : this.carousel.querySelector(selectors$13.carouselSlide).clientWidth;
      const countSlides =
        this.carouselInstance !== null && this.carouselInstance.slides
          ? this.carouselInstance.slides.length
          : this.carousel.querySelectorAll(selectors$13.carouselSlide).length;
      const numberOfVisibleSlides = Math.floor(carouselWidth / slideWidth);
      this.section.classList.remove(classes$E.hiddenArrows);
      if (this.carouselPrev && this.carouselNext) {
        this.carouselPrev.classList.remove(classes$E.hide);
        this.carouselNext.classList.remove(classes$E.hide);
      }
      // Desktop
      if (window.innerWidth > window.theme.sizes.large && !this.options.groupCells) {
        if (
          numberOfVisibleSlides <= this.largeItems &&
          countSlides <= this.largeItems &&
          this.carouselPrev &&
          this.carouselNext
        ) {
          this.hideArrows();
        }
      }
      // Tablet
      if (
        window.innerWidth >= window.theme.sizes.medium &&
        window.innerWidth <= window.theme.sizes.large &&
        !this.options.groupCells
      ) {
        if (
          numberOfVisibleSlides <= this.mediumItems &&
          countSlides <= this.mediumItems &&
          this.carouselPrev &&
          this.carouselNext
        ) {
          this.hideArrows();
        }
      }
      // Mobile
      if (window.innerWidth < window.theme.sizes.medium && !this.options.groupCells) {
        if (
          numberOfVisibleSlides <= this.smallItems &&
          countSlides <= this.smallItems &&
          this.carouselPrev &&
          this.carouselNext
        ) {
          this.hideArrows();
        }
      }
    }
    trackVisibleSlides() {
      const isSmallDown = window.matchMedia(`(max-width: ${window.theme.sizes.medium - 1}px)`);
      const isTablet = window.matchMedia(
        `(min-width: ${window.theme.sizes.medium}px) and (max-width: ${window.theme.sizes.large - 1}px)`,
      );
      const isDesktop = window.matchMedia(`(min-width: ${window.theme.sizes.large}px)`);
      isSmallDown.addEventListener("change", (event) => {
        event.matches ? (this.slidesVisible = this.smallItems) : true;
      });
      isSmallDown.matches ? (this.slidesVisible = this.smallItems) : true;
      isTablet.addEventListener("change", (event) => {
        event.matches ? (this.slidesVisible = this.mediumItems) : true;
      });
      isTablet.matches ? (this.slidesVisible = this.mediumItems) : true;
      isDesktop.addEventListener("change", (event) => {
        event.matches ? (this.slidesVisible = this.largeItems) : true;
      });
      isDesktop.matches ? (this.slidesVisible = this.largeItems) : true;
    }
    containDrag() {
      // Dragging agressively in flickity will select the last cell in the list
      // instead of the first cell of the last slide (slide is a set of cells).
      // We detect drag events, and move the selection back to the first cell
      // of the last slide -- the lastSelectableCell.
      const lastSelectableCell = this.slidesTotal - this.slidesVisible;
      if (this.carouselInstance.selectedIndex >= lastSelectableCell) {
        this.carouselInstance.select(lastSelectableCell);
        this.lockArrows(this.carouselInstance.selectedIndex);
      }
    }
    lockArrows(index) {
      if (this.options.wrapAround || this.options.groupCells) {
        return;
      }
      const nextIndex = parseInt(index);
      const lastSelectableCell = this.slidesTotal - this.slidesVisible;
      this.carouselNext.disabled = nextIndex >= lastSelectableCell;
    }
    showArrows() {
      this.carouselPrev.classList.remove(classes$E.hide);
      this.carouselNext.classList.remove(classes$E.hide);
      this.section.classList.remove(classes$E.hiddenArrows);
    }
    hideArrows() {
      this.carouselPrev.classList.add(classes$E.hide);
      this.carouselNext.classList.add(classes$E.hide);
      this.section.classList.add(classes$E.hiddenArrows);
    }
    toggleArrows() {
      if (this.carouselPrev && this.carouselNext) {
        if (this.carouselPrev.disabled && this.carouselNext.disabled) {
          this.hideArrows();
        } else {
          this.showArrows();
        }
      }
    }
    // Flickity VERY annoyingly adds aria-hidden="true" to all slides except the current one which causes lighthouse accessibility failure
    // see https://github.com/metafizzy/flickity/issues/1228
    removeIncorrectAria() {
      const slidesHidden = this.carousel.querySelectorAll('[aria-hidden="true"]');
      slidesHidden.forEach((el) => el.removeAttribute("aria-hidden"));
    }
    constructor() {
      super();
      this.container = this;
    }
  };
  if (!customElements.get("flickity-carousel")) {
    customElements.define("flickity-carousel", Carousel);
  }

  const selectors$12 = {
    templateAddresses: "[data-address-wrapper]",
    addressNewForm: "[data-new-address-form]",
    addressNewFormInner: "[new-address-form-inner]",
    btnNew: ".address-new-toggle",
    btnEdit: ".address-edit-toggle",
    btnDelete: ".address-delete",
    classHide: "hide",
    dataFormId: "data-form-id",
    dataConfirmMessage: "data-confirm-message",
    defaultConfirmMessage: "Are you sure you wish to delete this address?",
    editAddress: "#EditAddress",
    addressCountryNew: "AddressCountryNew",
    addressProvinceNew: "AddressProvinceNew",
    addressProvinceContainerNew: "AddressProvinceContainerNew",
    addressCountryOption: ".address-country-option",
    addressCountry: "AddressCountry",
    addressProvince: "AddressProvince",
    addressProvinceContainer: "AddressProvinceContainer",
  };
  let Addresses = class Addresses {
    init() {
      if (this.addressNewForm) {
        const section = this.section;
        const newAddressFormInner = this.addressNewForm.querySelector(selectors$12.addressNewFormInner);
        this.customerAddresses();
        const newButtons = section.querySelectorAll(selectors$12.btnNew);
        if (newButtons.length) {
          newButtons.forEach((element) => {
            element.addEventListener("click", function () {
              newAddressFormInner.classList.toggle(selectors$12.classHide);
            });
          });
        }
        const editButtons = section.querySelectorAll(selectors$12.btnEdit);
        if (editButtons.length) {
          editButtons.forEach((element) => {
            element.addEventListener("click", function () {
              const formId = this.getAttribute(selectors$12.dataFormId);
              section.querySelector(`${selectors$12.editAddress}_${formId}`).classList.toggle(selectors$12.classHide);
            });
          });
        }
        const deleteButtons = section.querySelectorAll(selectors$12.btnDelete);
        if (deleteButtons.length) {
          deleteButtons.forEach((element) => {
            element.addEventListener("click", function () {
              const formId = this.getAttribute(selectors$12.dataFormId);
              const confirmMessage = this.getAttribute(selectors$12.dataConfirmMessage);
              if (confirm(confirmMessage || selectors$12.defaultConfirmMessage)) {
                Shopify.postLink(window.theme.routes.account_addresses_url + "/" + formId, {
                  parameters: {
                    _method: "delete",
                  },
                });
              }
            });
          });
        }
      }
    }
    customerAddresses() {
      // Initialize observers on address selectors, defined in shopify_common.js
      if (Shopify.CountryProvinceSelector) {
        new Shopify.CountryProvinceSelector(selectors$12.addressCountryNew, selectors$12.addressProvinceNew, {
          hideElement: selectors$12.addressProvinceContainerNew,
        });
      }
      // Initialize each edit form's country/province selector
      const countryOptions = this.section.querySelectorAll(selectors$12.addressCountryOption);
      countryOptions.forEach((element) => {
        const formId = element.getAttribute(selectors$12.dataFormId);
        const countrySelector = `${selectors$12.addressCountry}_${formId}`;
        const provinceSelector = `${selectors$12.addressProvince}_${formId}`;
        const containerSelector = `${selectors$12.addressProvinceContainer}_${formId}`;
        new Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
          hideElement: containerSelector,
        });
      });
    }
    constructor(section) {
      this.section = section;
      this.addressNewForm = this.section.querySelector(selectors$12.addressNewForm);
      this.init();
    }
  };
  const template = document.querySelector(selectors$12.templateAddresses);
  if (template) {
    new Addresses(template);
  }

  /**
   * Password Template Script
   * ------------------------------------------------------------------------------
   * A file that contains code for the Password template.
   *
   * @namespace password
   */ (function () {
    var recoverPasswordForm = document.querySelector("#RecoverPassword");
    if (recoverPasswordForm) {
      customerLogin();
    }
    function customerLogin() {
      var config = {
        recoverPasswordForm: "#RecoverPassword",
        hideRecoverPasswordLink: "#HideRecoverPasswordLink",
      };
      checkUrlHash();
      resetPasswordSuccess();
      document.querySelector(config.recoverPasswordForm).addEventListener("click", onShowHidePasswordForm);
      document.querySelector(config.hideRecoverPasswordLink).addEventListener("click", onShowHidePasswordForm);
      function onShowHidePasswordForm(evt) {
        evt.preventDefault();
        toggleRecoverPasswordForm();
      }
      function checkUrlHash() {
        var hash = window.location.hash;
        // Allow deep linking to recover password form
        if (hash === "#recover") {
          toggleRecoverPasswordForm();
        }
      }
      /**
       *  Show/Hide recover password form
       */ function toggleRecoverPasswordForm() {
        var emailValue = document.querySelector("#CustomerEmail").value;
        document.querySelector("#RecoverEmail").value = emailValue;
        document.querySelector("#RecoverPasswordForm").classList.toggle("display-none");
        document.querySelector("#CustomerLoginForm").classList.toggle("display-none");
      }
      /**
       *  Show reset password success message
       */ function resetPasswordSuccess() {
        var formSuccess = document.querySelector(".reset-password-success");
        // check if reset password form was successfully submited.
        if (formSuccess) {
          document.querySelector("#ResetSuccess").classList.remove("display-none");
        }
      }
    }
  })();

  window.Shopify = window.Shopify || {};
  window.Shopify.theme = window.Shopify.theme || {};
  window.Shopify.theme.sections = window.Shopify.theme.sections || {};
  window.Shopify.theme.sections.registered = window.Shopify.theme.sections.registered || {};
  window.Shopify.theme.sections.instances = window.Shopify.theme.sections.instances || [];
  const registered = window.Shopify.theme.sections.registered;
  const instances = window.Shopify.theme.sections.instances;
  const selectors$11 = {
    id: "data-section-id",
    type: "data-section-type",
  };
  let Registration = class Registration {
    getStack() {
      return this.callStack;
    }
    constructor(type = null, components = []) {
      this.type = type;
      this.components = validateComponentsArray(components);
      this.callStack = {
        onLoad: [],
        onUnload: [],
        onSelect: [],
        onDeselect: [],
        onBlockSelect: [],
        onBlockDeselect: [],
        onReorder: [],
      };
      components.forEach((comp) => {
        for (const [key, value] of Object.entries(comp)) {
          const arr = this.callStack[key];
          if (Array.isArray(arr) && typeof value === "function") {
            arr.push(value);
          } else {
            console.warn(`Unregisted function: '${key}' in component: '${this.type}'`);
            console.warn(value);
          }
        }
      });
    }
  };
  let Section = class Section {
    callFunctions(key, e = null) {
      this.callStack[key].forEach((func) => {
        const props = {
          id: this.id,
          type: this.type,
          container: this.container,
        };
        if (e) {
          func.call(props, e);
        } else {
          func.call(props);
        }
      });
    }
    onLoad() {
      this.callFunctions("onLoad");
    }
    onUnload() {
      this.callFunctions("onUnload");
    }
    onSelect(e) {
      this.callFunctions("onSelect", e);
    }
    onDeselect(e) {
      this.callFunctions("onDeselect", e);
    }
    onBlockSelect(e) {
      this.callFunctions("onBlockSelect", e);
    }
    onBlockDeselect(e) {
      this.callFunctions("onBlockDeselect", e);
    }
    onReorder(e) {
      this.callFunctions("onReorder", e);
    }
    constructor(container, registration) {
      this.container = validateContainerElement(container);
      this.id = container.getAttribute(selectors$11.id);
      this.type = registration.type;
      this.callStack = registration.getStack();
      try {
        this.onLoad();
      } catch (e) {
        // We catch all errors throw in sections in order to prevent minor errors in apps from breaking everything else
        console.warn(`Error in section: ${this.id}`);
        console.warn(this);
        console.error(e);
      }
    }
  };
  function validateContainerElement(container) {
    if (!(container instanceof Element)) {
      throw new TypeError(
        "Theme Sections: Attempted to load section. The section container provided is not a DOM element.",
      );
    }
    if (container.getAttribute(selectors$11.id) === null) {
      throw new Error(
        "Theme Sections: The section container provided does not have an id assigned to the " +
          selectors$11.id +
          " attribute.",
      );
    }
    return container;
  }
  function validateComponentsArray(value) {
    if ((typeof value !== "undefined" && typeof value !== "object") || value === null) {
      throw new TypeError("Theme Sections: The components object provided is not a valid");
    }
    return value;
  }
  /*
   * @shopify/theme-sections
   * -----------------------------------------------------------------------------
   *
   * A framework to provide structure to your Shopify sections and a load and unload
   * lifecycle. The lifecycle is automatically connected to theme editor events so
   * that your sections load and unload as the editor changes the content and
   * settings of your sections.
   */ function register(type, components) {
    if (typeof type !== "string") {
      throw new TypeError(
        "Theme Sections: The first argument for .register must be a string that specifies the type of the section being registered",
      );
    }
    if (typeof registered[type] !== "undefined") {
      throw new Error(
        'Theme Sections: A section of type "' +
          type +
          '" has already been registered. You cannot register the same section type twice',
      );
    }
    if (!Array.isArray(components)) {
      components = [components];
    }
    const section = new Registration(type, components);
    registered[type] = section;
    return registered;
  }
  function load(types, containers) {
    types = normalizeType(types);
    if (typeof containers === "undefined") {
      containers = document.querySelectorAll("[" + selectors$11.type + "]");
    }
    containers = normalizeContainers(containers);
    types.forEach(function (type) {
      const registration = registered[type];
      if (typeof registration === "undefined") {
        return;
      }
      containers = containers.filter(function (container) {
        // Filter from list of containers because container already has an instance loaded
        if (isInstance(container)) {
          return false;
        }
        // Filter from list of containers because container doesn't have data-section-type attribute
        if (container.getAttribute(selectors$11.type) === null) {
          return false;
        }
        // Keep in list of containers because current type doesn't match
        if (container.getAttribute(selectors$11.type) !== type) {
          return true;
        }
        instances.push(new Section(container, registration));
        // Filter from list of containers because container now has an instance loaded
        return false;
      });
    });
  }
  function unload(selector) {
    var instancesToUnload = getInstances(selector);
    instancesToUnload.forEach(function (instance) {
      var index = instances
        .map(function (e) {
          return e.id;
        })
        .indexOf(instance.id);
      instances.splice(index, 1);
      instance.onUnload();
    });
  }
  function reorder(selector) {
    var instancesToReorder = getInstances(selector);
    instancesToReorder.forEach(function (instance) {
      instance.onReorder();
    });
  }
  function getInstances(selector) {
    var filteredInstances = [];
    // Fetch first element if its an array
    if (NodeList.prototype.isPrototypeOf(selector) || Array.isArray(selector)) {
      var firstElement = selector[0];
    }
    // If selector element is DOM element
    if (selector instanceof Element || firstElement instanceof Element) {
      var containers = normalizeContainers(selector);
      containers.forEach(function (container) {
        filteredInstances = filteredInstances.concat(
          instances.filter(function (instance) {
            return instance.container === container;
          }),
        );
      });
      // If select is type string
    } else if (typeof selector === "string" || typeof firstElement === "string") {
      var types = normalizeType(selector);
      types.forEach(function (type) {
        filteredInstances = filteredInstances.concat(
          instances.filter(function (instance) {
            return instance.type === type;
          }),
        );
      });
    }
    return filteredInstances;
  }
  function getInstanceById(id) {
    var instance;
    for (var i = 0; i < instances.length; i++) {
      if (instances[i].id === id) {
        instance = instances[i];
        break;
      }
    }
    return instance;
  }
  function isInstance(selector) {
    return getInstances(selector).length > 0;
  }
  function normalizeType(types) {
    // If '*' then fetch all registered section types
    if (types === "*") {
      types = Object.keys(registered);
      // If a single section type string is passed, put it in an array
    } else if (typeof types === "string") {
      types = [types];
      // If single section constructor is passed, transform to array with section
      // type string
    } else if (types.constructor === Section) {
      types = [types.prototype.type];
      // If array of typed section constructors is passed, transform the array to
      // type strings
    } else if (Array.isArray(types) && types[0].constructor === Section) {
      types = types.map(function (Section1) {
        return Section1.type;
      });
    }
    types = types.map(function (type) {
      return type.toLowerCase();
    });
    return types;
  }
  function normalizeContainers(containers) {
    // Nodelist with entries
    if (NodeList.prototype.isPrototypeOf(containers) && containers.length > 0) {
      containers = Array.prototype.slice.call(containers);
      // Empty Nodelist
    } else if (NodeList.prototype.isPrototypeOf(containers) && containers.length === 0) {
      containers = [];
      // Handle null (document.querySelector() returns null with no match)
    } else if (containers === null) {
      containers = [];
      // Single DOM element
    } else if (!Array.isArray(containers) && containers instanceof Element) {
      containers = [containers];
    }
    return containers;
  }
  if (window.Shopify.designMode) {
    document.addEventListener("shopify:section:load", function (event) {
      var id = event.detail.sectionId;
      var container = event.target.querySelector("[" + selectors$11.id + '="' + id + '"]');
      if (container !== null) {
        load(container.getAttribute(selectors$11.type), container);
      }
    });
    document.addEventListener("shopify:section:reorder", function (event) {
      var id = event.detail.sectionId;
      var container = event.target.querySelector("[" + selectors$11.id + '="' + id + '"]');
      var instance = getInstances(container)[0];
      if (typeof instance === "object") {
        reorder(container);
      }
    });
    document.addEventListener("shopify:section:unload", function (event) {
      var id = event.detail.sectionId;
      var container = event.target.querySelector("[" + selectors$11.id + '="' + id + '"]');
      var instance = getInstances(container)[0];
      if (typeof instance === "object") {
        unload(container);
      }
    });
    document.addEventListener("shopify:section:select", function (event) {
      var instance = getInstanceById(event.detail.sectionId);
      if (typeof instance === "object") {
        instance.onSelect(event);
      }
    });
    document.addEventListener("shopify:section:deselect", function (event) {
      var instance = getInstanceById(event.detail.sectionId);
      if (typeof instance === "object") {
        instance.onDeselect(event);
      }
    });
    document.addEventListener("shopify:block:select", function (event) {
      var instance = getInstanceById(event.detail.sectionId);
      if (typeof instance === "object") {
        instance.onBlockSelect(event);
      }
    });
    document.addEventListener("shopify:block:deselect", function (event) {
      var instance = getInstanceById(event.detail.sectionId);
      if (typeof instance === "object") {
        instance.onBlockDeselect(event);
      }
    });
  }

  /**
   * A11y Helpers
   * -----------------------------------------------------------------------------
   * A collection of useful functions that help make your theme more accessible
   */ /**
   * Moves focus to an HTML element
   * eg for In-page links, after scroll, focus shifts to content area so that
   * next `tab` is where user expects. Used in bindInPageLinks()
   * eg move focus to a modal that is opened. Used in trapFocus()
   *
   * @param {Element} container - Container DOM element to trap focus inside of
   * @param {Object} options - Settings unique to your theme
   * @param {string} options.className - Class name to apply to element on focus.
   */ function forceFocus(element, options) {
    options = options || {};
    element.focus();
    if (typeof options.className !== "undefined") {
      element.classList.add(options.className);
    }
    element.addEventListener("blur", callback);
    function callback(event) {
      event.target.removeEventListener(event.type, callback);
      if (typeof options.className !== "undefined") {
        element.classList.remove(options.className);
      }
    }
  }
  /**
   * If there's a hash in the url, focus the appropriate element
   * This compensates for older browsers that do not move keyboard focus to anchor links.
   * Recommendation: To be called once the page in loaded.
   *
   * @param {Object} options - Settings unique to your theme
   * @param {string} options.className - Class name to apply to element on focus.
   * @param {string} options.ignore - Selector for elements to not include.
   */ function focusHash(options) {
    options = options || {};
    var hash = window.location.hash;
    var element = document.getElementById(hash.slice(1));
    // if we are to ignore this element, early return
    if (element && options.ignore && element.matches(options.ignore)) {
      return false;
    }
    if (hash && element) {
      forceFocus(element, options);
    }
  }
  /**
   * When an in-page (url w/hash) link is clicked, focus the appropriate element
   * This compensates for older browsers that do not move keyboard focus to anchor links.
   * Recommendation: To be called once the page in loaded.
   *
   * @param {Object} options - Settings unique to your theme
   * @param {string} options.className - Class name to apply to element on focus.
   * @param {string} options.ignore - CSS selector for elements to not include.
   */ function bindInPageLinks(options) {
    options = options || {};
    var links = Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]'));
    function queryCheck(selector) {
      return document.getElementById(selector) !== null;
    }
    return links.filter(function (link) {
      if (link.hash === "#" || link.hash === "") {
        return false;
      }
      if (options.ignore && link.matches(options.ignore)) {
        return false;
      }
      if (!queryCheck(link.hash.substr(1))) {
        return false;
      }
      var element = document.querySelector(link.hash);
      if (!element) {
        return false;
      }
      link.addEventListener("click", function () {
        forceFocus(element, options);
      });
      return true;
    });
  }
  function focusable$1(container) {
    var elements = Array.prototype.slice.call(
      container.querySelectorAll(
        "[tabindex]," +
          "[draggable]," +
          "a[href]," +
          "area," +
          "button:enabled," +
          "input:not([type=hidden]):enabled," +
          "object," +
          "select:enabled," +
          "textarea:enabled" +
          "[data-focus-element]",
      ),
    );
    // Filter out elements that are not visible.
    // Copied from jQuery https://github.com/jquery/jquery/blob/2d4f53416e5f74fa98e0c1d66b6f3c285a12f0ce/src/css/hiddenVisibleSelectors.js
    return elements.filter(function (element) {
      return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    });
  }
  /**
   * Traps the focus in a particular container
   *
   * @param {Element} container - Container DOM element to trap focus inside of
   * @param {Element} elementToFocus - Element to be focused on first
   * @param {Object} options - Settings unique to your theme
   * @param {string} options.className - Class name to apply to element on focus.
   */ var trapFocusHandlers = {};
  function trapFocus(container, options) {
    options = options || {};
    var elements = focusable$1(container);
    var elementToFocus = options.elementToFocus || container;
    var first = elements[0];
    var last = elements[elements.length - 1];
    removeTrapFocus();
    trapFocusHandlers.focusin = function (event) {
      if (container !== event.target && !container.contains(event.target) && first && first === event.target) {
        first.focus();
      }
      if (event.target !== container && event.target !== last && event.target !== first) return;
      document.addEventListener("keydown", trapFocusHandlers.keydown);
    };
    trapFocusHandlers.focusout = function () {
      document.removeEventListener("keydown", trapFocusHandlers.keydown);
    };
    trapFocusHandlers.keydown = function (event) {
      if (event.code !== "Tab") return; // If not TAB key
      // On the last focusable element and tab forward, focus the first element.
      if (event.target === last && !event.shiftKey) {
        event.preventDefault();
        first.focus();
      }
      //  On the first focusable element and tab backward, focus the last element.
      if ((event.target === container || event.target === first) && event.shiftKey) {
        event.preventDefault();
        last.focus();
      }
    };
    document.addEventListener("focusout", trapFocusHandlers.focusout);
    document.addEventListener("focusin", trapFocusHandlers.focusin);
    forceFocus(elementToFocus, options);
  }
  /**
   * Removes the trap of focus from the page
   */ function removeTrapFocus() {
    document.removeEventListener("focusin", trapFocusHandlers.focusin);
    document.removeEventListener("focusout", trapFocusHandlers.focusout);
    document.removeEventListener("keydown", trapFocusHandlers.keydown);
  }
  /**
   * Add a preventive message to external links and links that open to a new window.
   * @param {string} elements - Specific elements to be targeted
   * @param {object} options.messages - Custom messages to overwrite with keys: newWindow, external, newWindowExternal
   * @param {string} options.messages.newWindow - When the link opens in a new window (e.g. target="_blank")
   * @param {string} options.messages.external - When the link is to a different host domain.
   * @param {string} options.messages.newWindowExternal - When the link is to a different host domain and opens in a new window.
   * @param {object} options.prefix - Prefix to namespace "id" of the messages
   */ function accessibleLinks(elements, options) {
    if (typeof elements !== "string") {
      throw new TypeError(elements + " is not a String.");
    }
    elements = document.querySelectorAll(elements);
    if (elements.length === 0) {
      return;
    }
    options = options || {};
    options.messages = options.messages || {};
    var messages1 = {
      newWindow: options.messages.newWindow || "Opens in a new window.",
      external: options.messages.external || "Opens external website.",
      newWindowExternal: options.messages.newWindowExternal || "Opens external website in a new window.",
    };
    var prefix = options.prefix || "a11y";
    var messageSelectors = {
      newWindow: prefix + "-new-window-message",
      external: prefix + "-external-message",
      newWindowExternal: prefix + "-new-window-external-message",
    };
    function generateHTML(messages) {
      var container = document.createElement("ul");
      var htmlMessages = Object.keys(messages).reduce(function (html, key) {
        return (html += "<li id=" + messageSelectors[key] + ">" + messages[key] + "</li>");
      }, "");
      container.setAttribute("hidden", true);
      container.innerHTML = htmlMessages;
      document.body.appendChild(container);
    }
    function externalSite(link) {
      return link.hostname !== window.location.hostname;
    }
    elements.forEach(function (link) {
      var target = link.getAttribute("target");
      var rel = link.getAttribute("rel");
      var isExternal = externalSite(link);
      var isTargetBlank = target === "_blank";
      var missingRelNoopener = rel === null || rel.indexOf("noopener") === -1;
      if (isTargetBlank && missingRelNoopener) {
        var relValue = rel === null ? "noopener" : rel + " noopener";
        link.setAttribute("rel", relValue);
      }
      if (isExternal && isTargetBlank) {
        link.setAttribute("aria-describedby", messageSelectors.newWindowExternal);
      } else if (isExternal) {
        link.setAttribute("aria-describedby", messageSelectors.external);
      } else if (isTargetBlank) {
        link.setAttribute("aria-describedby", messageSelectors.newWindow);
      }
    });
    generateHTML(messages1);
  }

  var a11y = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    accessibleLinks: accessibleLinks,
    bindInPageLinks: bindInPageLinks,
    focusHash: focusHash,
    focusable: focusable$1,
    forceFocus: forceFocus,
    removeTrapFocus: removeTrapFocus,
    trapFocus: trapFocus,
  });

  const selectors$10 = {
    focusable: 'button, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
  };
  function modal(unique) {
    const uniqueID = `data-popup-${unique}`;
    MicroModal.init({
      openTrigger: uniqueID,
      disableScroll: true,
      onShow: (modal1, el, event) => {
        event.preventDefault();
        const firstFocus = modal1.querySelector(selectors$10.focusable);
        trapFocus(modal1, {
          elementToFocus: firstFocus,
        });
      },
      onClose: (modal, el, event) => {
        event.preventDefault();
        removeTrapFocus();
        el.focus();
      },
    });
  }

  const selectors$$ = {
    trigger: "[data-toggle-password-modal]",
    errors: ".storefront-password-form .errors",
  };
  const sections$n = {};
  let PasswordPage = class PasswordPage {
    init() {
      modal("password");
      if (this.errors) {
        this.trigger.click();
      }
    }
    constructor(section) {
      this.container = section.container;
      this.trigger = this.container.querySelector(selectors$$.trigger);
      this.errors = this.container.querySelector(selectors$$.errors);
      this.init();
    }
  };
  const passwordSection = {
    onLoad() {
      sections$n[this.id] = new PasswordPage(this);
    },
  };
  register("password", passwordSection);

  /**
   * Gift Card Template Script
   * ------------------------------------------------------------------------------
   * A file that contains scripts highly couple code to the Gift Card template.
   */ (function () {
    var config = {
      qrCode: "#QrCode",
      giftCardCode: ".giftcard__code",
    };
    // init QR code
    const qrCode = document.querySelector(config.qrCode);
    if (qrCode) {
      function loadGiftCard() {
        const qrCodeText = qrCode.getAttribute("data-identifier");
        new QRCode(qrCode, {
          text: qrCodeText,
          width: 120,
          height: 120,
        });
      }
      window.addEventListener("load", loadGiftCard);
    }
    const giftCardCode = document.querySelector(config.giftCardCode);
    if (giftCardCode) {
      // Auto-select gift card code on click, based on ID passed to the function
      function selectText() {
        var text = document.querySelector("#GiftCardDigits");
        var range = "";
        if (document.body.createTextRange) {
          range = document.body.createTextRange();
          range.moveToElementText(text);
          range.select();
        } else if (window.getSelection) {
          var selection = window.getSelection();
          range = document.createRange();
          range.selectNodeContents(text);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      giftCardCode.addEventListener("click", selectText());
    }
  })();

  const selectors$_ = {
    parallaxWrapper: "[data-parallax-wrapper]",
    parallaxImg: "[data-parallax-img]",
  };
  let sections$m = {};
  const parallaxImage = {
    onLoad() {
      sections$m[this.id] = [];
      const frames = this.container.querySelectorAll(selectors$_.parallaxWrapper);
      frames.forEach((frame) => {
        const inner = frame.querySelector(selectors$_.parallaxImg);
        sections$m[this.id].push(
          new Rellax(inner, {
            center: true,
            round: true,
            frame: frame,
          }),
        );
      });
    },
    onUnload: function () {
      sections$m[this.id].forEach((image) => {
        if (typeof image.destroy === "function") {
          image.destroy();
        }
      });
    },
  };

  register("article", parallaxImage);

  const selectors$Z = {
    frame: "[data-ticker-frame]",
    scale: "[data-ticker-scale]",
    text: "[data-ticker-text]",
  };
  const attributes$1 = {
    clone: "data-clone",
    ariaHidden: "aria-hidden",
  };
  const classes$D = {
    animationClass: "ticker--animated",
    unloadedClass: "ticker--unloaded",
    comparitorClass: "ticker__comparitor",
  };
  const sections$l = {};
  let Ticker = class Ticker {
    init() {
      this.addComparitor();
      this.resizeEvent = debounce$1(() => this.checkWidth(), 300);
      this.listen();
    }
    addComparitor() {
      this.comparitor = this.text.cloneNode(true);
      this.comparitor.classList.add(classes$D.comparitorClass);
      this.frame.appendChild(this.comparitor);
      this.scale.classList.remove(classes$D.unloadedClass);
    }
    unload() {
      document.removeEventListener("theme:resize", this.resizeEvent);
    }
    listen() {
      document.addEventListener("theme:resize", this.resizeEvent);
      this.checkWidth();
    }
    checkWidth() {
      const padding = window.getComputedStyle(this.frame).paddingLeft.replace("px", "") * 2;
      // Animate all the items - cloned too
      Array.from(this.text.parentNode.children).forEach((child) => {
        child.classList.add(classes$D.animationClass);
      });
      if (this.frame.clientWidth - padding < this.comparitor.clientWidth || this.stopClone) {
        if (this.scale.childElementCount === 1) {
          this.clone = this.text.cloneNode(true);
          this.clone.setAttribute(attributes$1.ariaHidden, true);
          this.clone.setAttribute(attributes$1.clone, "");
          this.scale.appendChild(this.clone);
          if (this.stopClone) {
            for (let index = 0; index < 10; index++) {
              const cloneSecond = this.text.cloneNode(true);
              cloneSecond.setAttribute(attributes$1.ariaHidden, true);
              cloneSecond.setAttribute(attributes$1.clone, "");
              this.scale.appendChild(cloneSecond);
            }
          }
        }
        const animationTimeFrame = (this.text.clientWidth / this.space) * this.timeIndex;
        this.scale.style.setProperty("--animation-time", `${animationTimeFrame}s`);
      } else {
        let clone = this.scale.querySelector(`[${attributes$1.clone}]`);
        if (clone) {
          this.scale.removeChild(clone);
        }
        this.text.classList.remove(classes$D.animationClass);
      }
    }
    constructor(el, stopClone = false) {
      this.frame = el;
      this.stopClone = stopClone;
      this.scale = this.frame.querySelector(selectors$Z.scale);
      this.text = this.frame.querySelector(selectors$Z.text);
      this.space = 100; // 100px
      this.timeIndex = 1.63; // 100px going to move for 1.63s
      this.init();
    }
  };
  const ticker = {
    onLoad() {
      sections$l[this.id] = [];
      const el1 = this.container.querySelectorAll(selectors$Z.frame);
      el1.forEach((el) => {
        sections$l[this.id].push(new Ticker(el));
      });
    },
    onUnload() {
      sections$l[this.id].forEach((el) => {
        if (typeof el.unload === "function") {
          el.unload();
        }
      });
    },
  };

  const selectors$Y = {
    frame: "[data-ticker-frame]",
    slideValue: "data-slide",
    tickerScale: "[data-ticker-scale]",
    tickerText: "[data-ticker-text]",
  };
  const classes$C = {
    trickerAnimated: "ticker--animated",
  };
  const sections$k = {};
  let Bar = class Bar {
    init() {
      this.initTickers(true);
    }
    /**
     * Init tickers in sliders
     */ initTickers(stopClone = false) {
      const frame = this.container.querySelector(selectors$Y.frame);
      if (frame) {
        new Ticker(frame, stopClone);
      }
    }
    toggleTicker(e, isStopped) {
      const tickerScale = this.container.querySelector(selectors$Y.tickerScale);
      const element = this.container.querySelector(`[${selectors$Y.slideValue}="${e.detail.blockId}"]`);
      if (!element || !tickerScale) return;
      if (isStopped) {
        const gutter = Number(getComputedStyle(element).getPropertyValue("--gutter").replace("px", ""));
        const leftPosition = -(element.offsetLeft - gutter);
        tickerScale.setAttribute("data-stop", "");
        tickerScale.querySelectorAll(selectors$Y.tickerText).forEach((textHolder) => {
          textHolder.classList.remove(classes$C.trickerAnimated);
          textHolder.style.transform = `translate3d(${leftPosition}px, 0, 0)`;
        });
      }
      if (!isStopped) {
        tickerScale.querySelectorAll(selectors$Y.tickerText).forEach((textHolder) => {
          textHolder.classList.add(classes$C.trickerAnimated);
          textHolder.removeAttribute("style");
        });
        tickerScale.removeAttribute("data-stop");
      }
    }
    onBlockSelect(e) {
      this.toggleTicker(e, true);
    }
    onBlockDeselect(e) {
      this.toggleTicker(e, false);
    }
    constructor(section) {
      this.container = section.container;
      this.init();
    }
  };
  const logos = {
    onLoad() {
      sections$k[this.id] = [];
      sections$k[this.id].push(new Bar(this));
    },
    onBlockSelect(e) {
      sections$k[this.id].forEach((el) => {
        if (typeof el.onBlockSelect === "function") {
          el.onBlockSelect(e);
        }
      });
    },
    onBlockDeselect(e) {
      sections$k[this.id].forEach((el) => {
        if (typeof el.onBlockSelect === "function") {
          el.onBlockDeselect(e);
        }
      });
    },
  };
  register("logos", logos);

  register("blog", parallaxImage);

  var selectors$X = {
    drawerWrappper: "[data-drawer]",
    drawerScrolls: "[data-drawer-scrolls]",
    input: "[data-predictive-search-input]",
    underlay: "[data-drawer-underlay]",
    stagger: "[data-stagger-animation]",
    drawerToggle: "data-drawer-toggle",
    firstFocus: "data-first-focus",
    children: ":scope > * > [data-animates]",
    focusable: 'button, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
  };
  var classes$B = {
    isVisible: "drawer--visible",
    displayNone: "display-none",
  };
  var sections$j = {};
  let Drawer = class Drawer {
    unload() {
      // wipe listeners
    }
    connectToggle() {
      this.buttons.forEach((btn) => {
        btn.addEventListener(
          "click",
          function (e) {
            e.preventDefault();
            this.drawer.dispatchEvent(
              new CustomEvent("theme:drawer:toggle", {
                bubbles: false,
              }),
            );
          }.bind(this),
        );
      });
    }
    connectDrawer() {
      this.drawer.addEventListener(
        "theme:drawer:toggle",
        function () {
          if (this.drawer.classList.contains(classes$B.isVisible)) {
            this.drawer.dispatchEvent(
              new CustomEvent("theme:drawer:close", {
                bubbles: false,
              }),
            );
          } else {
            this.drawer.dispatchEvent(
              new CustomEvent("theme:drawer:open", {
                bubbles: false,
              }),
            );
          }
        }.bind(this),
      );
      this.drawer.addEventListener("theme:drawer:close", this.hideDrawer.bind(this));
      this.drawer.addEventListener("theme:drawer:open", this.showDrawer.bind(this));
    }
    staggerChildAnimations() {
      this.staggers.forEach((el) => {
        const children = el.querySelectorAll(selectors$X.children);
        children.forEach((child, index) => {
          child.style.transitionDelay = `${index * 50 + 10}ms`;
        });
      });
    }
    closers() {
      this.drawer.addEventListener(
        "keyup",
        function (evt) {
          if (evt.code !== "Escape") {
            return;
          }
          this.hideDrawer();
        }.bind(this),
      );
      this.underlay.addEventListener(
        "click",
        function () {
          this.hideDrawer();
        }.bind(this),
      );
    }
    setFocus() {
      const closeButton = this.drawer.querySelector(selectors$X.firstFocus);
      trapFocus(this.drawer, {
        elementToFocus: closeButton,
      });
    }
    showDrawer() {
      this.drawer.classList.remove(classes$B.displayNone);
      // animates after display none is removed
      setTimeout(() => {
        this.buttons.forEach((el) => el.setAttribute("aria-expanded", true));
        this.drawer.classList.add(classes$B.isVisible);
        document.dispatchEvent(
          new CustomEvent("theme:scroll:lock", {
            bubbles: true,
            detail: this.drawerScrolls,
          }),
        );
        this.drawer.addEventListener("transitionend", this.setFocus.bind(this), {
          once: true,
        });
        this.drawer.addEventListener("transitioncancel", this.setFocus.bind(this), {
          once: true,
        });
      }, 1);
    }
    hideDrawer() {
      window.theme.state.cartOpen = false;
      this.buttons.forEach((el) => el.setAttribute("aria-expanded", true));
      this.drawer.classList.remove(classes$B.isVisible);
      this.drawerScrolls.dispatchEvent(
        new CustomEvent("theme:scroll:unlock", {
          bubbles: true,
        }),
      );
      document.dispatchEvent(
        new CustomEvent("theme:sliderule:close", {
          bubbles: false,
        }),
      );
      removeTrapFocus();
      this.buttons[0].focus();
      // adds display none after animations
      setTimeout(() => {
        if (!this.drawer.classList.contains(classes$B.isVisible)) {
          this.drawer.classList.add(classes$B.displayNone);
        }
      }, 800);
    }
    constructor(el) {
      this.drawer = el;
      this.drawerScrolls = this.drawer.querySelector(selectors$X.drawerScrolls);
      this.underlay = this.drawer.querySelector(selectors$X.underlay);
      this.key = this.drawer.dataset.drawer;
      const btnSelector = `[${selectors$X.drawerToggle}='${this.key}']`;
      this.buttons = document.querySelectorAll(btnSelector);
      this.staggers = this.drawer.querySelectorAll(selectors$X.stagger);
      this.connectToggle();
      this.connectDrawer();
      this.closers();
      this.staggerChildAnimations();
    }
  };
  const drawer = {
    onLoad() {
      sections$j[this.id] = [];
      const els = this.container.querySelectorAll(selectors$X.drawerWrappper);
      els.forEach((el) => {
        sections$j[this.id].push(new Drawer(el));
      });
    },
    onUnload: function () {
      sections$j[this.id].forEach((el) => {
        if (typeof el.unload === "function") {
          el.unload();
        }
      });
    },
  };

  const selectors$W = {
    announcement: "[data-announcement-bar]",
    transparent: "data-header-transparent",
    header: "[data-header-wrapper] header",
  };
  const classes$A = {
    stuck: "js__header__stuck",
    stuckAnimated: "js__header__stuck--animated",
    triggerAnimation: "js__header__stuck--trigger-animation",
    stuckBackdrop: "js__header__stuck__backdrop",
  };
  let sections$i = {};
  let Sticky = class Sticky {
    unload() {
      document.removeEventListener("theme:scroll", this.listen);
      document.removeEventListener("theme:scroll:up", this.scrollUpDirectional);
      document.removeEventListener("theme:scroll:down", this.scrollDownDirectional);
    }
    listen() {
      if (this.sticks || this.animated) {
        document.addEventListener("theme:scroll", (e) => {
          if (e.detail.down) {
            if (!this.currentlyStuck && e.detail.position > this.stickDown) {
              this.stickSimple();
            }
            if (!this.currentlyBlurred && e.detail.position > this.blur) {
              this.addBlur();
            }
          } else {
            if (e.detail.position <= this.stickUp) {
              this.unstickSimple();
            }
            if (e.detail.position <= this.blur) {
              this.removeBlur();
            }
          }
        });
      }
      if (this.animated) {
        document.addEventListener("theme:scroll:up", this.scrollUpDirectional.bind(this));
        document.addEventListener("theme:scroll:down", this.scrollDownDirectional.bind(this));
      }
    }
    stickSimple() {
      if (this.animated) {
        this.cls.add(classes$A.stuckAnimated);
      }
      this.cls.add(classes$A.stuck);
      this.wrapper.setAttribute(selectors$W.transparent, false);
      this.currentlyStuck = true;
    }
    unstickSimple() {
      this.cls.remove(classes$A.stuck);
      this.wrapper.setAttribute(selectors$W.transparent, this.transparent);
      if (this.animated) {
        this.cls.remove(classes$A.stuckAnimated);
      }
      this.currentlyStuck = false;
    }
    scrollDownInit() {
      if (window.scrollY > this.stickDown) {
        this.stickSimple();
      }
      if (window.scrollY > this.blur) {
        this.addBlur();
      }
    }
    stickDirectional() {
      this.cls.add(classes$A.triggerAnimation);
    }
    unstickDirectional() {
      this.cls.remove(classes$A.triggerAnimation);
    }
    scrollDownDirectional() {
      this.unstickDirectional();
    }
    scrollUpDirectional() {
      if (window.scrollY <= this.stickDown) {
        this.unstickDirectional();
      } else {
        this.stickDirectional();
      }
    }
    addBlur() {
      this.cls.add(classes$A.stuckBackdrop);
      this.currentlyBlurred = true;
    }
    removeBlur() {
      this.cls.remove(classes$A.stuckBackdrop);
      this.currentlyBlurred = false;
    }
    constructor(el) {
      this.wrapper = el;
      this.type = this.wrapper.dataset.headerSticky;
      this.transparent = this.wrapper.dataset.headerTransparent;
      this.sticks = this.type === "sticky";
      this.animated = this.type === "directional";
      this.currentlyStuck = false;
      this.cls = this.wrapper.classList;
      const announcementEl = document.querySelector(selectors$W.announcement);
      const announcementHeight = announcementEl ? announcementEl.clientHeight : 0;
      const headerHeight = document.querySelector(selectors$W.header).clientHeight;
      this.blur = headerHeight + announcementHeight;
      this.stickDown = headerHeight + announcementHeight;
      this.stickUp = announcementHeight;
      if (this.wrapper.getAttribute(selectors$W.transparent) !== "false") {
        this.blur = announcementHeight;
      }
      if (this.sticks) {
        this.stickDown = announcementHeight;
        this.scrollDownInit();
      }
      this.listen();
    }
  };
  const stickyHeader = {
    onLoad() {
      sections$i = new Sticky(this.container);
    },
    onUnload: function () {
      if (typeof sections$i.unload === "function") {
        sections$i.unload();
      }
    },
  };

  const selectors$V = {
    disclosureToggle: "data-hover-disclosure-toggle",
    disclosureWrappper: "[data-hover-disclosure]",
    link: "[data-top-link]",
    wrapper: "[data-header-wrapper]",
    stagger: "[data-stagger]",
    staggerPair: "[data-stagger-first]",
    staggerAfter: "[data-stagger-second]",
    staggerImage: "[data-grid-item], [data-header-image]",
  };
  const classes$z = {
    isVisible: "is-visible",
    meganavVisible: "meganav--visible",
    grandparent: "grandparent",
  };
  let sections$h = {};
  let disclosures = {};
  let HoverDisclosure = class HoverDisclosure {
    onBlockSelect(evt) {
      if (this.disclosure.contains(evt.target)) {
        this.showDisclosure();
      }
    }
    onBlockDeselect(evt) {
      if (this.disclosure.contains(evt.target)) {
        this.hideDisclosure();
      }
    }
    showDisclosure() {
      if (this.grandparent) {
        this.wrapper.classList.add(classes$z.meganavVisible);
      } else {
        this.wrapper.classList.remove(classes$z.meganavVisible);
      }
      this.trigger.setAttribute("aria-expanded", true);
      this.trigger.classList.add(classes$z.isVisible);
      this.disclosure.classList.add(classes$z.isVisible);
    }
    hideDisclosure() {
      this.disclosure.classList.remove(classes$z.isVisible);
      this.trigger.classList.remove(classes$z.isVisible);
      this.trigger.setAttribute("aria-expanded", false);
      this.wrapper.classList.remove(classes$z.meganavVisible);
    }
    staggerChildAnimations() {
      const simple = this.disclosure.querySelectorAll(selectors$V.stagger);
      simple.forEach((el, index) => {
        el.style.transitionDelay = `${index * 50 + 10}ms`;
      });
      const pairs = this.disclosure.querySelectorAll(selectors$V.staggerPair);
      pairs.forEach((child, i) => {
        const d1 = i * 150;
        child.style.transitionDelay = `${d1}ms`;
        child.parentElement.querySelectorAll(selectors$V.staggerAfter).forEach((grandchild, i2) => {
          const di1 = i2 + 1;
          const d2 = di1 * 20;
          grandchild.style.transitionDelay = `${d1 + d2}ms`;
        });
      });
      const images = this.disclosure.querySelectorAll(selectors$V.staggerImage);
      images.forEach((el, index) => {
        el.style.transitionDelay = `${(index + 1) * 80}ms`;
      });
    }
    handleTablets() {
      // first click opens the popup, second click opens the link
      this.trigger.addEventListener(
        "touchstart",
        function (e) {
          const isOpen = this.disclosure.classList.contains(classes$z.isVisible);
          if (!isOpen) {
            e.preventDefault();
            this.showDisclosure();
          }
        }.bind(this),
        {
          passive: true,
        },
      );
    }
    connectHoverToggle() {
      this.trigger.addEventListener("pointerenter", this.showDisclosure.bind(this));
      this.link.addEventListener("focus", this.showDisclosure.bind(this));
      this.trigger.addEventListener("pointerleave", this.hideDisclosure.bind(this));
      this.trigger.addEventListener(
        "focusout",
        function (e) {
          const inMenu = this.trigger.contains(e.relatedTarget);
          if (!inMenu) {
            this.hideDisclosure();
          }
        }.bind(this),
      );
      this.disclosure.addEventListener(
        "keyup",
        function (evt) {
          if (evt.code !== "Escape") {
            return;
          }
          this.hideDisclosure();
        }.bind(this),
      );
    }
    constructor(el) {
      this.disclosure = el;
      this.wrapper = el.closest(selectors$V.wrapper);
      this.key = this.disclosure.id;
      const btnSelector = `[${selectors$V.disclosureToggle}='${this.key}']`;
      this.trigger = document.querySelector(btnSelector);
      this.link = this.trigger.querySelector(selectors$V.link);
      this.grandparent = this.trigger.classList.contains(classes$z.grandparent);
      this.trigger.setAttribute("aria-haspopup", true);
      this.trigger.setAttribute("aria-expanded", false);
      this.trigger.setAttribute("aria-controls", this.key);
      this.connectHoverToggle();
      this.handleTablets();
      this.staggerChildAnimations();
    }
  };
  const hoverDisclosure = {
    onLoad() {
      sections$h[this.id] = [];
      disclosures = this.container.querySelectorAll(selectors$V.disclosureWrappper);
      disclosures.forEach((el) => {
        sections$h[this.id].push(new HoverDisclosure(el));
      });
    },
    onBlockSelect(evt) {
      sections$h[this.id].forEach((el) => {
        if (typeof el.onBlockSelect === "function") {
          el.onBlockSelect(evt);
        }
      });
    },
    onBlockDeselect(evt) {
      sections$h[this.id].forEach((el) => {
        if (typeof el.onBlockDeselect === "function") {
          el.onBlockDeselect(evt);
        }
      });
    },
    onUnload: function () {
      sections$h[this.id].forEach((el) => {
        if (typeof el.unload === "function") {
          el.unload();
        }
      });
    },
  };

  const selectors$U = {
    item: "[data-main-menu-text-item]",
    wrapper: "[data-text-items-wrapper]",
    text: ".navtext",
    isActive: "data-menu-active",
    sectionOuter: "[data-header-wrapper]",
    underlineCurrent: "data-underline-current",
    defaultItem: ".menu__item.main-menu--active .navtext, .header__desktop__button.main-menu--active .navtext",
  };
  let sections$g = {};
  let defaultPositions = null;
  let HoverLine = class HoverLine {
    init() {
      if (this.itemList.length) {
        this.listen();
        this.listenResize();
        this.textBottom = null;
        this.setHeight();
        if (defaultPositions) {
          if (this.defaultItem) {
            const startingLeft = Math.round(this.defaultItem.getBoundingClientRect().left) || 0;
            this.sectionOuter.style.setProperty("--bar-left", `${startingLeft}px`);
          }
          this.reset();
        } else {
          // initialize at left edge of first item im menu
          const startingLeft = Math.round(
            this.sectionOuter.querySelector(selectors$U.item).getBoundingClientRect().left,
          );
          this.sectionOuter.style.setProperty("--bar-left", `${startingLeft}px`);
          this.sectionOuter.style.setProperty("--bar-width", "0px");
        }
        this.sectionOuter.style.setProperty("--bar-opacity", "1");
      }
    }
    unload() {
      document.removeEventListener("theme:resize", this.reset);
      defaultPositions = null;
    }
    listenResize() {
      document.addEventListener("theme:resize", this.reset.bind(this));
    }
    setDefault() {
      if (this.defaultItem) {
        defaultPositions = {
          left: Math.round(this.defaultItem.getBoundingClientRect().left) || null,
          width: this.defaultItem.clientWidth || null,
        };
      }
    }
    setHeight() {
      const height = this.wrapper.clientHeight;
      const text = this.itemList[0].querySelector(selectors$U.text);
      const textHeight = text.clientHeight;
      const textBottom = Math.floor(height / 2 - textHeight / 2) - 4;
      if (this.textBottom !== textBottom) {
        this.sectionOuter.style.setProperty("--bar-text", `${textHeight}px`);
        this.sectionOuter.style.setProperty("--bar-bottom", `${textBottom}px`);
        this.textBottom = textBottom;
      }
    }
    listen() {
      this.itemList.forEach((element) => {
        element.addEventListener("pointerenter", (evt) => {
          const item = evt.target.querySelector(selectors$U.text);
          this.startBar(item);
        });
      });
      this.wrapper.addEventListener("pointerleave", this.clearBar.bind(this));
    }
    startBar(item) {
      this.setHeight();
      let active = this.sectionOuter.getAttribute(selectors$U.isActive) !== "false";
      let left = Math.round(item.getBoundingClientRect().left);
      let width = item.clientWidth;
      if (active) {
        this.render(width, left);
      } else {
        this.sectionOuter.setAttribute(selectors$U.isActive, true);
        this.render(0, left);
        setTimeout(() => {
          this.render(width, left);
        }, 10);
      }
    }
    render(width, left) {
      this.sectionOuter.style.setProperty("--bar-left", `${left}px`);
      this.sectionOuter.style.setProperty("--bar-width", `${width}px`);
    }
    reset() {
      this.setDefault();
      if (defaultPositions && defaultPositions.left && defaultPositions.width) {
        this.sectionOuter.style.setProperty("--bar-left", `${defaultPositions.left}px`);
        this.sectionOuter.style.setProperty("--bar-width", `${defaultPositions.width}px`);
      } else {
        this.sectionOuter.style.setProperty("--bar-width", "0px");
      }
    }
    clearBar() {
      // allow the bar to jump between text sections for cart and main menu
      this.sectionOuter.setAttribute(selectors$U.isActive, false);
      setTimeout(() => {
        let active = this.sectionOuter.getAttribute(selectors$U.isActive) !== "false";
        if (!active) {
          this.reset();
        }
      }, 150);
    }
    constructor(el) {
      this.wrapper = el;
      this.itemList = this.wrapper.querySelectorAll(selectors$U.item);
      this.sectionOuter = document.querySelector(selectors$U.sectionOuter);
      this.underlineCurrent = this.sectionOuter.getAttribute(selectors$U.underlineCurrent) === "true";
      this.defaultItem = null;
      if (this.underlineCurrent) {
        this.defaultItem = this.wrapper.querySelector(selectors$U.defaultItem);
      }
      this.setDefault();
      document.fonts.ready.then(() => {
        this.init();
      });
    }
  };
  const hoverUnderline = {
    onLoad() {
      sections$g[this.id] = [];
      const els = this.container.querySelectorAll(selectors$U.wrapper);
      els.forEach((el) => {
        sections$g[this.id].push(new HoverLine(el));
      });
    },
    onUnload: function () {
      sections$g[this.id].forEach((el) => {
        if (typeof el.unload === "function") {
          el.unload();
        }
      });
      delete sections$g[this.id];
    },
  };

  const selectors$T = {
    price: "data-header-cart-price",
    count: "data-header-cart-count",
    dot: "data-header-cart-full",
  };
  let Totals = class Totals {
    listen() {
      document.addEventListener(
        "theme:cart:change",
        function (event) {
          this.cart = event.detail.cart;
          this.update();
        }.bind(this),
      );
    }
    update() {
      if (this.cart) {
        this.prices.forEach((price) => {
          price.setAttribute(selectors$T.price, this.cart.total_price);
          const newTotal = themeCurrency.formatMoney(this.cart.total_price, theme.moneyFormat);
          price.innerHTML = newTotal;
        });
        this.counts.forEach((count) => {
          count.setAttribute(selectors$T.count, this.cart.item_count);
          count.innerHTML = `(${this.cart.item_count})`;
        });
        this.dots.forEach((dot) => {
          const full = this.cart.item_count > 0;
          dot.setAttribute(selectors$T.dot, full);
        });
      }
    }
    constructor(el) {
      this.section = el;
      this.counts = this.section.querySelectorAll(`[${selectors$T.count}]`);
      this.prices = this.section.querySelectorAll(`[${selectors$T.price}]`);
      this.dots = this.section.querySelectorAll(`[${selectors$T.dot}]`);
      this.cart = null;
      this.listen();
    }
  };
  const headerTotals = {
    onLoad() {
      new Totals(this.container);
    },
  };

  const selectors$S = {
    wrapper: "[data-search-popdown-wrap]",
    popdownTrigger: "data-popdown-toggle",
    close: "[data-close-popdown]",
    input: "[data-predictive-search-input]",
    underlay: "[data-search-underlay]",
  };
  const classes$y = {
    underlayVisible: "underlay--visible",
    isVisible: "is-visible",
  };
  let sections$f = {};
  let SearchPopdownTriggers = class SearchPopdownTriggers {
    initTriggerEvents() {
      this.trigger.setAttribute("aria-haspopup", true);
      this.trigger.setAttribute("aria-expanded", false);
      this.trigger.setAttribute("aria-controls", this.key);
      this.trigger.addEventListener(
        "click",
        function (evt) {
          evt.preventDefault();
          this.showPopdown();
        }.bind(this),
      );
      this.trigger.addEventListener(
        "keyup",
        function (evt) {
          if (evt.code !== "Space") {
            return;
          }
          this.showPopdown();
        }.bind(this),
      );
    }
    initPopdownEvents() {
      this.popdown.addEventListener(
        "keyup",
        function (evt) {
          if (evt.code !== "Escape") {
            return;
          }
          this.hidePopdown();
        }.bind(this),
      );
      this.close.addEventListener(
        "click",
        function () {
          this.hidePopdown();
        }.bind(this),
      );
      this.underlay.addEventListener(
        "click",
        function () {
          this.hidePopdown();
        }.bind(this),
      );
    }
    hidePopdown() {
      this.popdown.classList.remove(classes$y.isVisible);
      this.underlay.classList.remove(classes$y.underlayVisible);
      this.trigger.focus();
      removeTrapFocus();
      this.popdown.dispatchEvent(
        new CustomEvent("theme:scroll:unlock", {
          bubbles: true,
        }),
      );
    }
    showPopdown() {
      this.popdown.classList.add(classes$y.isVisible);
      this.underlay.classList.add(classes$y.underlayVisible);
      trapFocus(this.popdown, {
        elementToFocus: this.input,
      });
      this.popdown.dispatchEvent(
        new CustomEvent("theme:scroll:lock", {
          bubbles: true,
        }),
      );
    }
    constructor(trigger) {
      this.trigger = trigger;
      this.key = this.trigger.getAttribute(selectors$S.popdownTrigger);
      this.popdown = document.querySelector(`[id='${this.key}']`);
      this.input = this.popdown.querySelector(selectors$S.input);
      this.close = this.popdown.querySelector(selectors$S.close);
      this.wrapper = this.popdown.closest(selectors$S.wrapper);
      this.underlay = this.wrapper.querySelector(selectors$S.underlay);
      this.initTriggerEvents();
      this.initPopdownEvents();
    }
  };
  const searchPopdown = {
    onLoad() {
      sections$f[this.id] = {};
      const trigger = this.container.querySelector(`[${selectors$S.popdownTrigger}]`);
      if (trigger) {
        sections$f[this.id] = new SearchPopdownTriggers(trigger);
      }
    },
    onUnload: function () {
      if (typeof sections$f[this.id].unload === "function") {
        sections$f[this.id].unload();
      }
    },
  };

  const selectors$R = {
    wrapper: "[data-product-add-popdown-wrapper]",
    closeDrawer: "[data-close-popdown]",
    apiContent: "[data-api-content]",
    cartAjaxEnabled: '[data-ajax-disable="false"]',
    cartAjaxDisabled: '[data-ajax-disable="true"]',
    cartToggleButton: '[data-drawer-toggle="drawer-cart"]',
    cartDrawer: '[data-drawer="drawer-cart"]',
  };
  const classes$x = {
    visible: "is-visible",
    focusEnable: "focus-enabled",
  };
  let globalTimer;
  let CartPopdown = class CartPopdown {
    renderPopdown(event) {
      const variant = event.detail.variant;
      const url = `${window.theme.routes.root_url}variants/${variant.id}/?section_id=api-product-popdown`;
      const instance = this;
      axios
        .get(url)
        .then(function (response) {
          // handle success
          const fresh = document.createElement("div");
          fresh.innerHTML = response.data;
          instance.popdown.innerHTML = fresh.querySelector(selectors$R.apiContent).innerHTML;
          instance.connectCartButton();
          instance.connectCloseButton();
          // If user is navigating with keyboard, focus on the view cart button after popdown opens
          if (document.body.classList.contains(classes$x.focusEnable)) {
            const cartButton = instance.popdown.querySelector(selectors$R.cartToggleButton);
            setTimeout(() => {
              cartButton.focus();
            }, 0);
          }
        })
        .catch(function (error) {
          console.warn(error);
        });
    }
    connectCloseButton() {
      // Enable close button
      this.popdown.classList.add(classes$x.visible);
      const closer = this.popdown.querySelector(selectors$R.closeDrawer);
      closer.addEventListener(
        "click",
        function (e) {
          e.preventDefault();
          this.popdown.classList.remove(classes$x.visible);
        }.bind(this),
      );
      this.popdownTimer();
    }
    connectCartButton() {
      // Hook into cart drawer
      const cartButton = this.popdown.querySelector(selectors$R.cartToggleButton);
      const cartDrawer = document.querySelector(selectors$R.cartDrawer);
      if (cartDrawer) {
        cartButton.addEventListener(
          "click",
          function (e) {
            e.preventDefault();
            this.popdown.classList.remove(classes$x.visible);
            cartDrawer.dispatchEvent(
              new CustomEvent("theme:drawer:open", {
                bubbles: false,
              }),
            );
          }.bind(this),
        );
      }
    }
    popdownTimer() {
      clearTimeout(globalTimer);
      globalTimer = setTimeout(() => {
        if (this.popdown.contains(document.activeElement)) {
          // While the user is focused inside of the popdown keep restarting the auto-close timer
          this.popdownTimer();
        } else {
          this.popdown.classList.remove(classes$x.visible);
        }
      }, 5000);
    }
    constructor() {
      this.popdown = document.querySelector(selectors$R.wrapper);
      this.cartAjaxEnabled = document.querySelector(selectors$R.cartAjaxEnabled);
      this.cartAjaxDisabled = document.querySelector(selectors$R.cartAjaxDisabled);
      document.addEventListener("theme:cart:popdown", (e) => {
        if (this.cartAjaxEnabled) {
          // if we are on the cart page, refresh the cart without popdown
          this.cartAjaxEnabled.dispatchEvent(
            new CustomEvent("theme:cart:reload", {
              bubbles: true,
            }),
          );
        } else if (this.cartAjaxDisabled) {
          // ajax is disabled, refresh the whole page
          window.location.reload();
        } else {
          this.renderPopdown(e);
        }
      });
    }
  };
  const cartPopdown = {
    onLoad() {
      new CartPopdown(this);
    },
  };

  function getScript(url, callback, callbackError) {
    let head = document.getElementsByTagName("head")[0];
    let done = false;
    let script = document.createElement("script");
    script.src = url;
    // Attach handlers for all browsers
    script.onload = script.onreadystatechange = function () {
      if (!done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) {
        done = true;
        callback();
      } else {
        callbackError();
      }
    };
    head.appendChild(script);
  }

  const loaders = {};
  function loadScript(options = {}) {
    if (!options.type) {
      options.type = "json";
    }
    if (options.url) {
      if (loaders[options.url]) {
        return loaders[options.url];
      } else {
        return getScriptWithPromise(options.url, options.type);
      }
    } else if (options.json) {
      if (loaders[options.json]) {
        return Promise.resolve(loaders[options.json]);
      } else {
        const request = window
          .fetch(options.json)
          .then((response) => {
            return response.json();
          })
          .then((response) => {
            loaders[options.json] = response;
            return response;
          })
          .catch((error) => {
            loaders[options.json] = null;
          });
        loaders[options.json] = request;
        return request;
      }
    } else if (options.name) {
      const key = "".concat(options.name, options.version);
      if (loaders[key]) {
        return loaders[key];
      } else {
        return loadShopifyWithPromise(options);
      }
    } else {
      return Promise.reject();
    }
  }
  function getScriptWithPromise(url, type) {
    const loader = new Promise((resolve, reject) => {
      if (type === "text") {
        fetch(url)
          .then((response) => response.text())
          .then((data) => {
            resolve(data);
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        getScript(
          url,
          function () {
            resolve();
          },
          function () {
            reject();
          },
        );
      }
    });
    loaders[url] = loader;
    return loader;
  }
  function loadShopifyWithPromise(options) {
    const key = "".concat(options.name, options.version);
    const loader = new Promise((resolve, reject) => {
      try {
        window.Shopify.loadFeatures([
          {
            name: options.name,
            version: options.version,
            onLoad: (err) => {
              onLoadFromShopify(resolve, reject, err);
            },
          },
        ]);
      } catch (err) {
        reject(err);
      }
    });
    loaders[key] = loader;
    return loader;
  }
  function onLoadFromShopify(resolve, reject, err) {
    if (err) {
      return reject(err);
    } else {
      return resolve();
    }
  }

  const selectors$Q = {
    wrapper: "[data-swapper-wrapper]",
    target: "[data-swapper-target]",
    hover: "data-swapper-hover",
  };
  let sections$e = {};
  let Swapper = class Swapper {
    init() {
      this.hovers.forEach((hover) => {
        hover.addEventListener(
          "mouseenter",
          function () {
            const newContent = hover.getAttribute(selectors$Q.hover);
            this.target.innerHTML = `${newContent}`;
          }.bind(this),
        );
      });
      this.hovers.forEach((hover) => {
        hover.addEventListener(
          "mouseleave",
          function () {
            this.target.innerHTML = this.deafaultContent;
          }.bind(this),
        );
      });
      this.hovers.forEach((hover) => {
        hover.addEventListener(
          "click",
          function () {
            const clickedContent = hover.getAttribute(selectors$Q.hover);
            this.deafaultContent = `${clickedContent}`;
          }.bind(this),
        );
      });
    }
    constructor(el) {
      this.container = el;
      this.target = this.container.querySelector(selectors$Q.target);
      this.hovers = this.container.querySelectorAll(`[${selectors$Q.hover}]`);
      if (this.target && this.hovers.length) {
        this.deafaultContent = this.target.innerHTML;
        this.init();
      }
    }
  };
  function makeSwappers(container) {
    sections$e[container.id] = [];
    const els = container.querySelectorAll(selectors$Q.wrapper);
    els.forEach((el) => {
      sections$e[container.id].push(new Swapper(el));
    });
  }
  const swapperSection = {
    onLoad() {
      makeSwappers(this.container);
    },
  };

  const defaults = {
    color: "ash",
  };
  const selectors$P = {
    swatch: "data-swatch",
    outerGrid: "[data-grid-item]",
    dataGridImageDefault: "data-grid-image-default",
    dataGridImageTarget: "data-grid-image-target",
    image: "data-swatch-image",
    imageId: "data-swatch-image-id",
    variant: "data-swatch-variant",
  };
  const classes$w = {
    fade: "is-fade",
  };
  let ColorMatch = class ColorMatch {
    getColor() {
      return this.match;
    }
    init() {
      const getColors = loadScript({
        json: window.theme.assets.swatches,
      });
      return getColors
        .then((colors) => {
          return this.matchColors(colors, this.settings.color);
        })
        .catch((e) => {
          console.log("failed to load swatch colors script");
          console.log(e);
        });
    }
    matchColors(colors, name) {
      let bg = "#E5E5E5";
      let img = null;
      const path = window.theme.assets.base || "/";
      const comparisonName = name.toLowerCase().replace(/\s/g, "");
      const array = colors.colors;
      if (array) {
        const variantNameMatch = (nameObject) => {
          const indexName = Object.keys(nameObject).toString();
          const neatName = indexName.toLowerCase().replace(/\s/g, "");
          return neatName === comparisonName;
        };
        const position = array.findIndex(variantNameMatch);
        if (position > -1) {
          const value = Object.values(array[position])[0];
          const valueLowerCase = value.toLowerCase();
          if (
            valueLowerCase.includes(".jpg") ||
            valueLowerCase.includes(".jpeg") ||
            valueLowerCase.includes(".png") ||
            valueLowerCase.includes(".svg")
          ) {
            img = `${path}${encodeURIComponent(value)}`;
            bg = "#888888";
          } else {
            bg = value;
          }
        }
      }
      return {
        color: this.settings.color,
        path: img,
        hex: bg,
      };
    }
    constructor(options = {}) {
      this.settings = {
        ...defaults,
        ...options,
      };
      this.match = this.init();
    }
  };
  let RadioSwatch = class RadioSwatch extends HTMLElement {
    init() {
      // Change PGI slider image
      if (this.variant && this.outer) {
        // Get images on quickview load
        this.outer.addEventListener("theme:quickview:media", (e) => {
          if (e && e.detail && e.detail.media) {
            this.media = e.detail.media;
          }
        });
      }
    }
    setStyles() {
      if (this.colorMatch.hex) {
        this.element.style.setProperty("--swatch", `${this.colorMatch.hex}`);
      }
      if (this.colorMatch.path) {
        this.element.style.setProperty("background-image", `url(${this.colorMatch.path})`);
        this.element.style.setProperty("background-size", "cover");
      }
    }
    replaceImage() {
      // Add new loaded image in PGI slider
      if (this.imageReplace && this.imageSlide && this.imageId) {
        if (
          this.imageSlide.hasAttribute(selectors$P.dataGridImageTarget) &&
          this.imageSlide.getAttribute(selectors$P.dataGridImageTarget) !== this.imageId
        ) {
          this.imageSlide.classList.add(classes$w.fade);
          const timeoutDelay =
            parseFloat(window.getComputedStyle(this.imageSlide).getPropertyValue("animation-duration")) * 1000;
          setTimeout(() => {
            this.imageSlide.classList.remove(classes$w.fade);
          }, timeoutDelay);
        }
        this.imageSlide.setAttribute(selectors$P.dataGridImageTarget, this.imageId);
        this.imageSlide.style.setProperty("background-color", "#fff");
        if (!this.imageSlide.hasAttribute(selectors$P.dataGridImageDefault)) {
          this.imageSlide.setAttribute(
            selectors$P.dataGridImageDefault,
            window.getComputedStyle(this.imageSlide).backgroundImage,
          );
        }
        this.imageSlide.style.setProperty("background-image", this.imageReplace);
      }
    }
    constructor() {
      super();
      this.element = this.querySelector(`[${selectors$P.swatch}]`);
      this.colorString = this.element.getAttribute(selectors$P.swatch);
      this.image = this.element.getAttribute(selectors$P.image);
      this.imageId = this.element.getAttribute(selectors$P.imageId);
      this.variant = this.element.getAttribute(selectors$P.variant);
      this.outer = this.element.closest(selectors$P.outerGrid);
      this.media = null;
      this.imageSlide = null;
      this.imageDefault = null;
      this.stopSlideAnimation = false;
      // Set swatch color for the old-swatch system
      if (this.element.getAttribute(selectors$P.swatch) != "") {
        const matcher = new ColorMatch({
          color: this.colorString,
        });
        matcher.getColor().then((result) => {
          this.colorMatch = result;
          this.setStyles();
        });
      }
      this.init();
    }
  };
  const swatchGridSection = {
    onLoad() {
      makeSwappers(this.container);
    },
  };

  const selectors$O = {
    dataGridItemVariant: "data-grid-item-variant",
    dataGridImageTarget: "data-grid-image-target",
    dataSwatchGridImageIndex: "data-grid-image",
    dataGridImage: "data-grid-image",
    dataSwatchImageId: "data-swatch-image-id",
    dataSwatchIndex: "data-swatch-index",
  };
  let ProductGridItem = class ProductGridItem extends HTMLElement {
    connectedCallback() {
      if (this.gridItemVariantLinks.length) {
        this.gridItemVariantLinks.forEach((element) => {
          if (!element.hasAttribute(selectors$O.dataGridItemVariant)) return;
          this.swatchHoverEvent(element);
          this.swatchClickEvent(element);
        });
      }
    }
    swatchHoverEvent(swatchLink) {
      swatchLink.addEventListener("mouseenter", () => {
        if (swatchLink.hasAttribute(selectors$O.dataGridItemVariant)) {
          const product = swatchLink.getAttribute(selectors$O.dataGridItemVariant);
          // Ensure all images are loaded for this swatch
          this.container
            .querySelectorAll(
              `product-grid-item-variant[${selectors$O.dataGridItemVariant}="${product}"] product-grid-item-image`,
            )
            .forEach((image) => {
              image.setAttribute("loading", "eager");
            });
        }
      });
    }
    swatchClickEvent(swatchLink) {
      swatchLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.container
          .querySelectorAll(`a[${selectors$O.dataGridItemVariant}]`)
          .forEach((link) => link.removeAttribute("aria-selected"));
        swatchLink.setAttribute("aria-selected", "true");
        if (swatchLink.hasAttribute(selectors$O.dataGridItemVariant)) {
          const swatchLinkVariant = swatchLink.getAttribute(selectors$O.dataGridItemVariant);
          // Show content for swatch
          this.container
            .querySelectorAll(`product-grid-item-variant[${selectors$O.dataGridItemVariant}]`)
            .forEach((swatchElement) => {
              const swatchElementVariant = swatchElement.getAttribute(selectors$O.dataGridItemVariant);
              if (swatchElementVariant === swatchLinkVariant) {
                swatchElement.removeAttribute("hidden");
              } else {
                swatchElement.setAttribute("hidden", "");
              }
            });
        }
      });
    }
    constructor() {
      super();
      this.container = this;
      this.gridItemVariantLinks = this.container.querySelectorAll(`a[${selectors$O.dataGridItemVariant}]`);
    }
  };

  const selectors$N = {
    productGridItemLink: "[data-grid-link]",
    dataGridImages: "data-grid-images",
    dataGridImage: "data-grid-image",
    dataGridImageTarget: "data-grid-image-target",
    dataGridCurrentImage: "data-grid-current-image",
    dataGridPagination: "data-grid-pagination",
    dataGridPage: "data-grid-page",
    dataGridItemVariant: "data-grid-item-variant",
    dataSlideForFilterSelectedVariant: "data-slide-for-filter-selected-variant",
    dataSlideForVariantMedia: "data-slide-for-variant-media",
    dataSlideshowStyle: "data-slideshow-style",
    styleWidth: "--width",
  };
  const classes$v = {
    fade: "is-fade",
    active: "is-active",
    mobile: "is-mobile",
    pagination: "product-grid-item__pagination",
    productGridItemImage: "product-grid-item__image",
  };
  // Only create pagination if the style is cycle_images
  // If the style is second_immediately we show the second image immmidiately
  // without pagination or a timer. If the style is disabled we do nothing on
  // hover, only change images on swatch click
  let ProductGridItemVariant = class ProductGridItemVariant extends HTMLElement {
    static get observedAttributes() {
      return ["hidden"];
    }
    /*
      Ensure that image at index is loaded
      */ preloadImage(index) {
      // For now, we don't have a mobile slideshow so do not preload
      if (this.isMobile) return;
      const childElement = [...this.images][index];
      if (!childElement) {
        throw new Error(`No child element at index ${index}`);
      }
      childElement.setAttribute("loading", "eager");
    }
    /*
      Load all images by replacing each template with it's content
      */ preloadImages() {
      [...this.imagesHolder.children].forEach((_el, i) => this.preloadImage(i));
    }
    connectedCallback() {
      this.toggleMobile();
      document.addEventListener("theme:resize:width", () => this.toggleMobile());
      if (this.isMobile) return;
      if (this.imageCount > 1) {
        // Create slider of PGI images if the images are more than 1
        this.createPaging();
        this.container.addEventListener("theme:swatch:change", this.swatchChangeEvent);
        this.container.addEventListener("mouseenter", this.mouseEnterEvent);
        this.container.addEventListener("mouseleave", this.mouseLeaveEvent);
      }
      this.intersectionObserver.observe(this.container);
    }
    disconnectedCallback() {
      this.container.removeEventListener("theme:swatch:change", this.swatchChangeEvent);
      this.container.removeEventListener("mouseenter", this.mouseEnterEvent);
      this.container.removeEventListener("mouseleave", this.mouseLeaveEvent);
    }
    swatchChangeEvent(e) {
      // Change the image if the swatch is clicked
      const id = e.detail.id;
      const target = this.container.querySelector(`[${selectors$N.dataGridImageTarget}="${id}"]`);
      if (target) {
        const index = target.getAttribute(selectors$N.dataGridImage);
        this.pagingProgressCounter = 0;
        this.changeImage(index);
        if (e.detail.stopSlideAnimation) {
          this.stopPaging();
        }
      }
    }
    mouseEnterEvent() {
      this.preloadImages();
      switch (this.slideshowStyle) {
        case "cycle_images":
          // Start slideshow
          this.pagingProgressPause = this.isMobile;
          this.progressPaging();
          break;
        case "second_immediately":
          this.changeImage(this.getNextIndex());
          break;
        case "disabled":
          break;
        default:
          throw new Error(`Unknown option ${this.slideshowStyle}`);
      }
    }
    mouseLeaveEvent() {
      // Stop slideshow and rewind to first image
      this.pagingProgressPause = true;
      this.resetSlideshow();
      this.progressPaging();
    }
    attributeChangedCallback(name, prevValue, newValue) {
      if (name === "hidden" && prevValue == null && newValue != null) {
        // When hiding or showing a PGI, reset it's slideshow to show the image for the current variant
        this.showVariant();
      }
    }
    toggleMobile() {
      this.container.classList.toggle(classes$v.mobile, this.isMobile);
    }
    get isMobile() {
      const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      return windowWidth < window.theme.sizes.medium;
    }
    resetSlideshow() {
      const forcedDefaultSlide = this.container.querySelector(`[${selectors$N.dataSlideForFilterSelectedVariant}]`);
      // if a variant is selected by a collection filter show the variant image instead of the image at [0]
      if (forcedDefaultSlide) {
        let imageIndex = Number(forcedDefaultSlide.getAttribute(selectors$N.dataGridImage));
        this.changeImage(imageIndex);
      } else {
        this.changeImage(0);
      }
      this.pagingProgressPause = true;
    }
    showVariant() {
      const variantImage = this.container.querySelector(`[${selectors$N.dataSlideForVariantMedia}]`);
      // if a swatch is clicked, show the variant image instead of the image at [0]
      if (variantImage) {
        let imageIndex = Number(variantImage.getAttribute(selectors$N.dataGridImage));
        this.changeImage(imageIndex);
      } else {
        this.changeImage(0);
      }
      this.pagingProgressPause = true;
    }
    getNextIndex() {
      let currentImage = this.container.querySelector(
        `[${selectors$N.dataGridImage}][${selectors$N.dataGridCurrentImage}]`,
      );
      if (currentImage) {
        const currentIndex = Number(currentImage.getAttribute(selectors$N.dataGridImage));
        const nextIndex = (currentIndex + 1) % this.imageCount;
        return nextIndex;
      } else {
        return 0;
      }
    }
    changeImage(index) {
      const currentImage = this.images[index % this.imageCount];
      if (!currentImage) return;
      this.activeImages.forEach((image) => image.removeAttribute(selectors$N.dataGridCurrentImage));
      currentImage.setAttribute(selectors$N.dataGridCurrentImage, "true");
      if (this.slideshowStyle === "cycle_images") {
        this.changePaging(index);
      }
    }
    changePaging(index = 0) {
      // Change active class on slider pagination
      const activePage = this.container.querySelector(`[${selectors$N.dataGridPage}].${classes$v.active}`);
      const currentPage = this.container.querySelector(`[${selectors$N.dataGridPage}="${index}"]`);
      if (activePage) {
        activePage.style.setProperty(selectors$N.styleWidth, "100%");
        activePage.classList.remove(classes$v.active);
      }
      if (currentPage) {
        currentPage.classList.add(classes$v.active);
        this.progressPaging();
      }
    }
    progressPaging() {
      // Play/pause the PGI images slider
      const element = this.container.querySelector(`[${selectors$N.dataGridPage}].${classes$v.active}`);
      if (!element || this.isMobile) return;
      this.stopPaging();
      if (this.pagingProgressCounter === 0) {
        element.style.setProperty(selectors$N.styleWidth, "0%");
      }
      this.interval = setInterval(() => {
        if (this.pagingProgressCounter >= 100 && !this.pagingProgressPause) {
          this.stopPaging();
          this.pagingProgressCounter = 0;
          this.changeImage(this.getNextIndex());
        } else if (!this.pagingProgressPause) {
          this.pagingProgressCounter++;
          element.style.setProperty(selectors$N.styleWidth, `${this.pagingProgressCounter}%`);
        }
      }, this.timeout / 100);
    }
    stopPaging() {
      // Stop slider
      if (this.interval) {
        clearInterval(this.interval);
      }
    }
    createPaging() {
      // Create pagination of PGI images slider
      if (this.imagesHolder && this.slideshowStyle === "cycle_images") {
        let pagination = "";
        for (let index = 0; index < this.imageCount; index++) {
          let activeClass = "";
          if (index === 0) {
            activeClass = `class="${classes$v.active}"`;
          }
          pagination += `<span ${activeClass} ${selectors$N.dataGridPage}="${index}">${index + 1}</span>`;
        }
        if (pagination !== "") {
          let pagingContainer = this.container.querySelector(`[${selectors$N.dataGridPagination}]`);
          if (!pagingContainer) {
            pagingContainer = document.createElement("div");
            pagingContainer.className = classes$v.pagination;
            pagingContainer.setAttribute(selectors$N.dataGridPagination, "");
          }
          pagingContainer.innerHTML = pagination;
          this.imagesHolder.parentElement.prepend(pagingContainer);
        }
      }
    }
    removePaging() {
      // Remove the slider pagination holder
      const pagingContainer = this.container.querySelector(`[${selectors$N.dataGridPagination}]`);
      if (pagingContainer) {
        pagingContainer.remove();
      }
    }
    get imagesHolder() {
      return this.container.querySelector(`[${selectors$N.dataGridImages}]`);
    }
    get images() {
      return this.imagesHolder.querySelectorAll(`[${selectors$N.dataGridImage}]`);
    }
    get activeImages() {
      return this.imagesHolder.querySelectorAll(`[${selectors$N.dataGridImage}][${selectors$N.dataGridCurrentImage}]`);
    }
    get links() {
      return this.container.querySelectorAll(selectors$N.productGridItemLink);
    }
    get slideshowStyle() {
      return this.container.getAttribute(selectors$N.dataSlideshowStyle);
    }
    get imageCount() {
      return this.images.length;
    }
    constructor() {
      super();
      this.container = this;
      this.mobileStopSlideshow = "true";
      this.timeout = window.theme.settings.cycle_images_hover_delay * 1000 || 1500;
      this.interval = null;
      this.pagingProgressPause = false;
      this.pagingProgressCounter = 0;
      this.siblingsFetchCounter = 0;
      this.siblingLoadImageIndex = null;
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // As soon as grid item is on-screen preload second slideshow image so that it appears immediately when hovering
              if (this.imageCount > 1) {
                this.preloadImage(1);
              }
            }
          });
        },
        {
          threshold: 0.1,
        },
      );
    }
  };

  const selectors$M = {
    dataGridCurrentImage: "data-grid-current-image",
  };
  const classes$u = {
    active: "is-active",
  };
  let ProductGridItemImage = class ProductGridItemImage extends HTMLElement {
    static get observedAttributes() {
      return ["loading", selectors$M.dataGridCurrentImage];
    }
    connectedCallback() {
      if (this.getAttribute(selectors$M.dataGridCurrentImage) === null) {
        this.hide();
      } else {
        this.show();
      }
    }
    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case "loading":
          if (newValue === null || newValue === "eager") {
            this.eagerLoad();
          }
          break;
        case selectors$M.dataGridCurrentImage:
          if (newValue === null) {
            this.hide();
          } else {
            this.show();
          }
          break;
      }
    }
    show() {
      this.classList.add(classes$u.active);
    }
    hide() {
      this.classList.remove(classes$u.active);
    }
    // Ensure that child image has loaded in case the child was wrapped in `<template>` to prevent eager loading
    eagerLoad() {
      const childElement = this.firstElementChild;
      switch (childElement.nodeName) {
        case "TEMPLATE":
          // For template children, replace the template with the child img tag which will load the image
          const template = childElement;
          const templateContent = template.content;
          // Make sure template children images load immediatley
          templateContent.querySelectorAll("img").forEach((imgEl) => {
            imgEl.setAttribute("loading", "eager");
            imgEl.setAttribute("fetchpriority", "high");
          });
          template.replaceWith(templateContent);
          break;
        case "IMG":
          // For image children, make sure they load immediately if they were otherwise set to lazy load
          childElement.setAttribute("loading", "eager");
          childElement.setAttribute("fetchpriority", "high");
          break;
      }
    }
  };

  const selectors$L = {
    popoutWrapper: "[data-popout]",
    popoutList: "[data-popout-list]",
    popoutListScroll: "data-popout-list-scroll",
    popoutToggle: "data-popout-toggle",
    popoutInput: "[data-popout-input]",
    popoutOptions: "[data-popout-option]",
    popoutPrevent: "data-popout-prevent",
    popoutQuantity: "data-quantity-field",
    dataValue: "data-value",
    ariaExpanded: "aria-expanded",
    ariaCurrent: "aria-current",
  };
  const classes$t = {
    listVisible: "popout-list--visible",
    currentSuffix: "--current",
  };
  let PopoutSelect = class PopoutSelect extends HTMLElement {
    unload() {
      if (this.popoutOptions.length) {
        this.popoutOptions.forEach((element) => {
          element.removeEventListener("theme:popout:click", this.popupOptionsClick.bind(this));
          element.removeEventListener("click", this._connectOptionsDispatch.bind(this));
        });
      }
      this.popoutToggle.removeEventListener("click", this.popupToggleClick.bind(this));
      this.popoutToggle.removeEventListener("focusout", this.popupToggleFocusout.bind(this));
      this.popoutList.removeEventListener("focusout", this.popupListFocusout.bind(this));
      this.container.removeEventListener("keyup", this.containerKeyup.bind(this));
      if (this.outsidePopupToggle) {
        this.outsidePopupToggle.removeEventListener("click", this.popupToggleClick.bind(this));
        this.outsidePopupToggle.removeEventListener("focusout", this.popupToggleFocusout.bind(this));
      }
    }
    popupToggleClick(evt) {
      const ariaExpanded = evt.currentTarget.getAttribute(selectors$L.ariaExpanded) === "true";
      evt.currentTarget.setAttribute(selectors$L.ariaExpanded, !ariaExpanded);
      this.popoutList.classList.toggle(classes$t.listVisible);
      this.popupListMaxWidth();
      if (this.popoutList.hasAttribute(selectors$L.popoutListScroll)) {
        setTimeout(() => {
          this.popoutList.dispatchEvent(
            new CustomEvent("theme:scroll:lock", {
              bubbles: true,
            }),
          );
        }, 1);
      }
    }
    popupToggleFocusout(evt) {
      const popoutLostFocus = this.container.contains(evt.relatedTarget);
      if (!popoutLostFocus) {
        this._hideList();
      }
    }
    popupListFocusout(evt) {
      const childInFocus = evt.currentTarget.contains(evt.relatedTarget);
      const isVisible = this.popoutList.classList.contains(classes$t.listVisible);
      if (isVisible && !childInFocus) {
        this._hideList();
      }
    }
    popupListMaxWidth() {
      this.popoutList.style.maxWidth = `${parseInt(document.body.clientWidth - this.popoutList.getBoundingClientRect().left)}px`;
    }
    popupOptionsClick(evt) {
      const link = evt.target.closest(selectors$L.popoutOptions);
      if (link.attributes.href.value === "#") {
        evt.preventDefault();
        let attrValue = "";
        if (evt.currentTarget.getAttribute(selectors$L.dataValue)) {
          attrValue = evt.currentTarget.getAttribute(selectors$L.dataValue);
        }
        this.popoutInput.value = attrValue;
        if (this.popoutPrevent) {
          this.popoutInput.dispatchEvent(new Event("change"));
          if (!evt.detail.preventTrigger && this.popoutInput.hasAttribute(selectors$L.popoutQuantity)) {
            this.popoutInput.dispatchEvent(new Event("input"));
          }
          const currentElement = this.popoutList.querySelector(`[class*="${classes$t.currentSuffix}"]`);
          let targetClass = classes$t.currentSuffix;
          if (currentElement && currentElement.classList.length) {
            for (const currentElementClass of currentElement.classList) {
              if (currentElementClass.includes(classes$t.currentSuffix)) {
                targetClass = currentElementClass;
                break;
              }
            }
          }
          const listTargetElement = this.popoutList.querySelector(`.${targetClass}`);
          if (listTargetElement) {
            listTargetElement.classList.remove(`${targetClass}`);
            evt.currentTarget.parentElement.classList.add(`${targetClass}`);
          }
          const targetAttribute = this.popoutList.querySelector(`[${selectors$L.ariaCurrent}]`);
          if (targetAttribute && targetAttribute.hasAttribute(`${selectors$L.ariaCurrent}`)) {
            targetAttribute.removeAttribute(`${selectors$L.ariaCurrent}`);
            evt.currentTarget.setAttribute(`${selectors$L.ariaCurrent}`, "true");
          }
          if (attrValue !== "") {
            this.replaceTextContent(this.popoutToggle, attrValue);
            if (this.outsidePopupToggle) {
              this.replaceTextContent(this.outsidePopupToggle, attrValue);
            }
          }
          this.popupToggleFocusout(evt);
          this.popupListFocusout(evt);
        } else {
          this._submitForm(attrValue);
        }
      }
    }
    replaceTextContent(elem, newContent) {
      Array.from(elem.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.textContent = newContent;
        }
      });
    }
    updatePopout(evt) {
      const targetElement = this.popoutList.querySelector(`[${selectors$L.dataValue}="${this.popoutInput.value}"]`);
      if (targetElement) {
        targetElement.dispatchEvent(
          new CustomEvent("theme:popout:click", {
            cancelable: true,
            bubbles: true,
            detail: {
              preventTrigger: true,
            },
          }),
        );
      }
    }
    containerKeyup(evt) {
      if (evt.code !== "Escape") {
        return;
      }
      this._hideList();
      this.popoutToggle.focus();
    }
    bodyClick(evt) {
      const isOption = this.container.contains(evt.target);
      const isVisible = this.popoutList.classList.contains(classes$t.listVisible);
      this.outsidePopupToggle === evt.target;
      if (isVisible && !isOption) {
        this._hideList();
      }
    }
    _connectToggle() {
      this.popoutToggle.addEventListener("click", this.popupToggleClick.bind(this));
      if (this.outsidePopupToggle) {
        this.outsidePopupToggle.addEventListener("click", this.popupToggleClick.bind(this));
      }
    }
    _connectOptions() {
      if (this.popoutOptions.length) {
        this.popoutOptions.forEach((element) => {
          element.addEventListener("theme:popout:click", this.popupOptionsClick.bind(this));
          element.addEventListener("click", this._connectOptionsDispatch.bind(this));
        });
      }
    }
    _connectOptionsDispatch(evt) {
      const event = new CustomEvent("theme:popout:click", {
        cancelable: true,
        bubbles: true,
        detail: {
          preventTrigger: false,
        },
      });
      if (!evt.target.dispatchEvent(event)) {
        evt.preventDefault();
      }
    }
    _onFocusOut() {
      this.popoutToggle.addEventListener("focusout", this.popupToggleFocusout.bind(this));
      if (this.outsidePopupToggle) {
        this.outsidePopupToggle.addEventListener("focusout", this.popupToggleFocusout.bind(this));
      }
      this.popoutList.addEventListener("focusout", this.popupListFocusout.bind(this));
      this.container.addEventListener("keyup", this.containerKeyup.bind(this));
      document.body.addEventListener("click", this.bodyClick.bind(this));
    }
    _submitForm(value) {
      const form = this.container.closest("form");
      if (form) {
        form.submit();
      }
    }
    _hideList() {
      this.popoutList.classList.remove(classes$t.listVisible);
      this.popoutToggle.setAttribute(selectors$L.ariaExpanded, false);
      if (this.outsidePopupToggle) {
        this.outsidePopupToggle.setAttribute(selectors$L.ariaExpanded, false);
      }
    }
    constructor() {
      super();
      this.container = this.querySelector(selectors$L.popoutWrapper);
      this.popoutList = this.container.querySelector(selectors$L.popoutList);
      this.popoutToggle = this.container.querySelector(`[${selectors$L.popoutToggle}]`);
      this.outsidePopupToggle = document.querySelector(`[${selectors$L.popoutToggle}="${this.popoutList.id}"]`);
      this.popoutInput = this.container.querySelector(selectors$L.popoutInput);
      this.popoutOptions = this.container.querySelectorAll(selectors$L.popoutOptions);
      this.popoutPrevent = this.container.getAttribute(selectors$L.popoutPrevent) === "true";
      this._connectOptions();
      this._connectToggle();
      this._onFocusOut();
      this.popupListMaxWidth();
      if (this.popoutInput && this.popoutInput.hasAttribute(selectors$L.popoutQuantity)) {
        document.addEventListener("theme:popout:update", this.updatePopout.bind(this));
      }
      document.addEventListener("theme:resize", () => {
        this.popupListMaxWidth();
      });
    }
  };

  const slideDown = (target, duration = 500, checkHidden = true) => {
    let display = window.getComputedStyle(target).display;
    if (checkHidden && display !== "none") {
      return;
    }
    target.style.removeProperty("display");
    if (display === "none") display = "block";
    target.style.display = display;
    let height = target.offsetHeight;
    target.style.overflow = "hidden";
    target.style.height = 0;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;
    target.offsetHeight;
    target.style.boxSizing = "border-box";
    target.style.transitionTimingFunction = "cubic-bezier(0.215, 0.61, 0.355, 1)";
    target.style.transitionProperty = "height, margin, padding";
    target.style.transitionDuration = duration + "ms";
    target.style.height = height + "px";
    target.style.removeProperty("padding-top");
    target.style.removeProperty("padding-bottom");
    target.style.removeProperty("margin-top");
    target.style.removeProperty("margin-bottom");
    window.setTimeout(() => {
      target.style.removeProperty("height");
      target.style.removeProperty("overflow");
      target.style.removeProperty("transition-duration");
      target.style.removeProperty("transition-property");
      target.style.removeProperty("transition-timing-function");
    }, duration);
  };

  const slideUp = (target, duration = 500) => {
    target.style.transitionProperty = "height, margin, padding";
    target.style.transitionTimingFunction = "cubic-bezier(0.215, 0.61, 0.355, 1)";
    target.style.transitionDuration = duration + "ms";
    target.style.boxSizing = "border-box";
    target.style.height = target.offsetHeight + "px";
    target.offsetHeight;
    target.style.overflow = "hidden";
    target.style.height = 0;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;
    window.setTimeout(() => {
      target.style.display = "none";
      target.style.removeProperty("height");
      target.style.removeProperty("padding-top");
      target.style.removeProperty("padding-bottom");
      target.style.removeProperty("margin-top");
      target.style.removeProperty("margin-bottom");
      target.style.removeProperty("overflow");
      target.style.removeProperty("transition-duration");
      target.style.removeProperty("transition-property");
      target.style.removeProperty("transition-timing-function");
    }, duration);
  };

  const selectors$K = {
    accordionGroup: "[data-accordion-group]",
    accordionToggle: "data-accordion-trigger",
    accordionBody: "[data-accordion-body]",
    accordionBodyMobile: "data-accordion-body-mobile",
    rangeSlider: "data-range-holder",
    section: "[data-section-id]",
  };
  const classes$s = {
    open: "accordion-is-open",
  };
  let sections$d = {};
  let Accordion = class Accordion {
    mobileAccordions() {
      if (window.innerWidth < window.theme.sizes.medium) {
        this.init();
        this.setDefaultState();
      } else {
        this.resetMobileAccordions();
        this.body.removeAttribute("style");
      }
      document.addEventListener("theme:resize", () => {
        if (window.innerWidth < window.theme.sizes.medium) {
          this.init();
          this.setDefaultState();
        } else {
          this.resetMobileAccordions();
          this.body.removeAttribute("style");
        }
      });
    }
    init() {
      this.trigger.setAttribute("aria-haspopup", true);
      this.trigger.setAttribute("aria-expanded", false);
      this.trigger.setAttribute("aria-controls", this.key);
      this.setDefaultState();
      this.trigger.addEventListener("click", this.toggleEvent);
      this.body.addEventListener("keyup", this.keyboardEvent);
      this.body.addEventListener("theme:accordion:close", this.hideEvent);
    }
    hideEvents() {
      this.hideAccordion();
    }
    clickEvents(e) {
      e.preventDefault();
      this.toggleState();
    }
    keyboardEvents(e) {
      if (e.code !== "Escape") {
        return;
      }
      this.hideAccordion();
      this.trigger.focus();
    }
    resetMobileAccordions() {
      this.trigger.removeEventListener("click", this.toggleEvent);
      this.body.removeEventListener("keyup", this.keyboardEvent);
      this.body.removeEventListener("theme:accordion:close", this.hideEvent);
    }
    setDefaultState() {
      if (this.trigger.classList.contains(classes$s.open)) {
        showElement(this.body);
      } else {
        this.hideAccordion();
      }
    }
    getSiblings() {
      const section = this.body.closest(selectors$K.section);
      const groupsArray = [...section.querySelectorAll(selectors$K.accordionGroup)];
      const syncWrapper = groupsArray.filter((el) => el.contains(this.body)).shift();
      if (syncWrapper) {
        const allChilden = [...syncWrapper.querySelectorAll(selectors$K.accordionBody)];
        const onlySiblings = allChilden.filter((el) => !el.contains(this.body));
        return onlySiblings;
      } else return [];
    }
    closeSiblings() {
      this.syncBodies.forEach((accordionBody) => {
        accordionBody.dispatchEvent(
          new CustomEvent("theme:accordion:close", {
            bubbles: false,
          }),
        );
      });
    }
    toggleState() {
      if (this.trigger.classList.contains(classes$s.open)) {
        this.hideAccordion();
      } else {
        this.showAccordion();
        this.closeSiblings();
        // Collection filters
        // Accordion with range slider custom event to reload
        if (this.body.hasAttribute(selectors$K.rangeSlider)) {
          setTimeout(() => {
            document.dispatchEvent(
              new CustomEvent("theme:price-range:reset", {
                bubbles: false,
              }),
            );
          }, 400);
        }
      }
    }
    hideAccordion() {
      this.trigger.classList.remove(classes$s.open);
      slideUp(this.body);
    }
    showAccordion() {
      this.trigger.classList.add(classes$s.open);
      slideDown(this.body);
      setTimeout(() => {
        this.checkInViewportAndScrollTo();
      }, 600);
    }
    checkInViewportAndScrollTo() {
      const rect = this.trigger.getBoundingClientRect();
      const windowScrollY =
        (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0);
      const inViewport =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth);
      if (!inViewport) {
        window.scrollTo({
          top: windowScrollY + rect.top,
          left: 0,
          behavior: "smooth",
        });
      }
    }
    onBlockSelect(evt) {
      if (this.body.contains(evt.target)) {
        this.showAccordion();
      }
    }
    onBlockDeselect(evt) {
      if (this.body.contains(evt.target)) {
        this.hideAccordion();
      }
    }
    constructor(el) {
      this.body = el;
      this.key = this.body.id;
      const btnSelector = `[${selectors$K.accordionToggle}='${this.key}']`;
      this.trigger = document.querySelector(btnSelector);
      this.toggleEvent = (e) => this.clickEvents(e);
      this.keyboardEvent = (e) => this.keyboardEvents(e);
      this.hideEvent = () => this.hideEvents();
      this.syncBodies = this.getSiblings();
      if (this.body.hasAttribute(selectors$K.accordionBodyMobile)) {
        this.mobileAccordions();
      } else {
        this.init();
      }
    }
  };
  const accordion = {
    onLoad() {
      sections$d[this.id] = [];
      const els = this.container.querySelectorAll(selectors$K.accordionBody);
      els.forEach((el) => {
        sections$d[this.id].push(new Accordion(el));
      });
    },
    onUnload: function () {
      sections$d[this.id].forEach((el) => {
        if (typeof el.unload === "function") {
          el.unload();
        }
      });
    },
    onSelect: function () {
      if (this.type === "accordion-single") {
        this.container.querySelector(`[${selectors$K.accordionToggle}]`).click();
      }
    },
    onDeselect: function () {
      if (this.type === "accordion-single") {
        this.container.querySelector(`[${selectors$K.accordionToggle}]`).click();
      }
    },
    onBlockSelect(evt) {
      sections$d[this.id].forEach((el) => {
        if (typeof el.onBlockSelect === "function") {
          el.onBlockSelect(evt);
        }
      });
    },
    onBlockDeselect(evt) {
      sections$d[this.id].forEach((el) => {
        if (typeof el.onBlockSelect === "function") {
          el.onBlockDeselect(evt);
        }
      });
    },
  };

  const hideElement = (elem) => {
    if (elem) {
      elem.style.display = "none";
    }
  };

  const selectors$J = {
    inputSearch: 'input[type="search"]',
    focusedElements: '[aria-selected="true"] a',
    resetButton: 'button[type="reset"]',
  };
  const classes$r = {
    hidden: "is-hidden",
  };
  let HeaderSearchForm = class HeaderSearchForm extends HTMLElement {
    toggleResetButton() {
      const resetIsHidden = this.resetButton.classList.contains(classes$r.hidden);
      if (this.input.value.length > 0 && resetIsHidden) {
        this.resetButton.classList.remove(classes$r.hidden);
      } else if (this.input.value.length === 0 && !resetIsHidden) {
        this.resetButton.classList.add(classes$r.hidden);
      }
    }
    onChange() {
      this.toggleResetButton();
    }
    shouldResetForm() {
      return !document.querySelector(selectors$J.focusedElements);
    }
    onFormReset(event) {
      // Prevent default so the form reset doesn't set the value gotten from the url on page load
      event.preventDefault();
      // Don't reset if the user has selected an element on the predictive search dropdown
      if (this.shouldResetForm()) {
        this.input.value = "";
        this.toggleResetButton();
        event.target.querySelector(selectors$J.inputSearch).focus();
      }
    }
    constructor() {
      super();
      this.input = this.querySelector(selectors$J.inputSearch);
      this.resetButton = this.querySelector(selectors$J.resetButton);
      if (this.input) {
        this.input.form.addEventListener("reset", this.onFormReset.bind(this));
        this.input.addEventListener(
          "input",
          debounce$1((event) => {
            this.onChange(event);
          }, 300).bind(this),
        );
      }
    }
  };
  customElements.define("header-search-form", HeaderSearchForm);

  const selectors$I = {
    allVisibleElements: '[role="option"]',
    ariaSelected: '[aria-selected="true"]',
    predictiveSearch: "predictive-search",
    predictiveSearchResults: "[data-predictive-search-results]",
    predictiveSearchStatus: "[data-predictive-search-status]",
    searchInput: "[data-predictive-search-input]",
    searchResultsLiveRegion: "[data-predictive-search-live-region-count-value]",
    searchResultsGroupsWrapper: "data-search-results-groups-wrapper",
    searchForText: "[data-predictive-search-search-for-text]",
    sectionPredictiveSearch: "#shopify-section-predictive-search",
    selectedLink: '[aria-selected="true"] a',
    selectedOption: '[aria-selected="true"] a, button[aria-selected="true"]',
    loader: "[data-loading-indicator]",
  };
  let PredictiveSearch = class PredictiveSearch extends HeaderSearchForm {
    connectedCallback() {
      this.input.addEventListener("focus", this.onFocus.bind(this));
      this.input.form.addEventListener("submit", this.onFormSubmit.bind(this));
      this.addEventListener("focusout", this.onFocusOut.bind(this));
      this.addEventListener("keyup", this.onKeyup.bind(this));
      this.addEventListener("keydown", this.onKeydown.bind(this));
    }
    getQuery() {
      return this.input.value.trim();
    }
    onChange() {
      super.onChange();
      const newSearchTerm = this.getQuery();
      if (!this.searchTerm || !newSearchTerm.startsWith(this.searchTerm)) {
        var // Remove the results when they are no longer relevant for the new search term
          // so they don't show up when the dropdown opens again
          ref;
        (ref = this.querySelector(selectors$I.searchResultsGroupsWrapper)) === null || ref === void 0
          ? void 0
          : ref.remove();
      }
      // Update the term asap, don't wait for the predictive search query to finish loading
      this.updateSearchForTerm(this.searchTerm, newSearchTerm);
      this.searchTerm = newSearchTerm;
      if (!this.searchTerm.length) {
        this.reset();
        return;
      }
      this.getSearchResults(this.searchTerm);
    }
    onFormSubmit(event) {
      if (!this.getQuery().length || this.querySelector(selectors$I.selectedLink)) event.preventDefault();
    }
    onFormReset(event) {
      super.onFormReset(event);
      if (super.shouldResetForm()) {
        this.searchTerm = "";
        this.abortController.abort();
        this.abortController = new AbortController();
        this.closeResults(true);
      }
    }
    shouldResetForm() {
      return !document.querySelector(selectors$I.selectedLink);
    }
    onFocus() {
      const currentSearchTerm = this.getQuery();
      if (!currentSearchTerm.length) return;
      if (this.searchTerm !== currentSearchTerm) {
        // Search term was changed from other search input, treat it as a user change
        this.onChange();
      } else if (this.getAttribute("results") === "true") {
        this.open();
      } else {
        this.getSearchResults(this.searchTerm);
      }
    }
    onFocusOut() {
      setTimeout(() => {
        if (!this.contains(document.activeElement)) this.close();
      });
    }
    onKeyup(event) {
      if (!this.getQuery().length) this.close(true);
      event.preventDefault();
      switch (event.code) {
        case "ArrowUp":
          this.switchOption("up");
          break;
        case "ArrowDown":
          this.switchOption("down");
          break;
        case "Enter":
          this.selectOption();
          break;
      }
    }
    onKeydown(event) {
      // Prevent the cursor from moving in the input when using the up and down arrow keys
      if (event.code === "ArrowUp" || event.code === "ArrowDown") {
        event.preventDefault();
      }
    }
    updateSearchForTerm(previousTerm, newTerm) {
      const searchForTextElement = this.querySelector(selectors$I.searchForText);
      const currentButtonText =
        searchForTextElement === null || searchForTextElement === void 0 ? void 0 : searchForTextElement.innerText;
      if (currentButtonText) {
        var ref;
        if (((ref = currentButtonText.match(previousTerm)) === null || ref === void 0 ? void 0 : ref.length) > 1) {
          // The new term matches part of the button text and not just the search term, do not replace to avoid mistakes
          return;
        }
        const newButtonText = currentButtonText.replace(previousTerm, newTerm);
        searchForTextElement.innerText = newButtonText;
      }
    }
    switchOption(direction) {
      if (!this.getAttribute("open")) return;
      const moveUp = direction === "up";
      const selectedElement = this.querySelector(selectors$I.ariaSelected);
      // Filter out hidden elements (duplicated page and article resources) thanks
      // to this https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
      const allVisibleElements = Array.from(this.querySelectorAll(selectors$I.allVisibleElements)).filter(
        (element) => element.offsetParent !== null,
      );
      let activeElementIndex = 0;
      if (moveUp && !selectedElement) return;
      let selectedElementIndex = -1;
      let i = 0;
      while (selectedElementIndex === -1 && i <= allVisibleElements.length) {
        if (allVisibleElements[i] === selectedElement) {
          selectedElementIndex = i;
        }
        i++;
      }
      this.statusElement.textContent = "";
      if (!moveUp && selectedElement) {
        activeElementIndex = selectedElementIndex === allVisibleElements.length - 1 ? 0 : selectedElementIndex + 1;
      } else if (moveUp) {
        activeElementIndex = selectedElementIndex === 0 ? allVisibleElements.length - 1 : selectedElementIndex - 1;
      }
      if (activeElementIndex === selectedElementIndex) return;
      const activeElement = allVisibleElements[activeElementIndex];
      activeElement.setAttribute("aria-selected", true);
      if (selectedElement) selectedElement.setAttribute("aria-selected", false);
      this.input.setAttribute("aria-activedescendant", activeElement.id);
    }
    selectOption() {
      const selectedOption = this.querySelector(selectors$I.selectedOption);
      if (selectedOption) selectedOption.click();
    }
    getSearchResults(searchTerm) {
      const queryKey = searchTerm.replace(" ", "-").toLowerCase();
      this.setLiveRegionLoadingState();
      if (this.cachedResults[queryKey]) {
        this.renderSearchResults(this.cachedResults[queryKey]);
        return;
      }
      showElement(this.loader);
      fetch(`${theme.routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&section_id=predictive-search`, {
        signal: this.abortController.signal,
      })
        .then(this.handleErrors)
        .then((response) => response.text())
        .then((response) => {
          const resultsMarkup = new DOMParser()
            .parseFromString(response, "text/html")
            .querySelector(selectors$I.sectionPredictiveSearch).innerHTML;
          // Save bandwidth keeping the cache in all instances synced
          this.allPredictiveSearchInstances.forEach((predictiveSearchInstance) => {
            predictiveSearchInstance.cachedResults[queryKey] = resultsMarkup;
          });
          this.renderSearchResults(resultsMarkup);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          hideElement(this.loader);
        });
    }
    setLiveRegionLoadingState() {
      this.statusElement = this.statusElement || this.querySelector(selectors$I.predictiveSearchStatus);
      this.loadingText = this.loadingText || this.getAttribute("data-loading-text");
      this.setLiveRegionText(this.loadingText);
      this.setAttribute("loading", true);
    }
    setLiveRegionText(statusText) {
      this.statusElement.setAttribute("aria-hidden", "false");
      this.statusElement.textContent = statusText;
      setTimeout(() => {
        this.statusElement.setAttribute("aria-hidden", "true");
      }, 1000);
    }
    renderSearchResults(resultsMarkup) {
      this.predictiveSearchResults.innerHTML = resultsMarkup;
      this.setAttribute("results", true);
      this.setLiveRegionResults();
      this.open();
    }
    setLiveRegionResults() {
      this.removeAttribute("loading");
      this.setLiveRegionText(this.querySelector(selectors$I.searchResultsLiveRegion).textContent);
    }
    open() {
      this.setAttribute("open", true);
      this.input.setAttribute("aria-expanded", true);
      this.isOpen = true;
    }
    close(clearSearchTerm = false) {
      this.closeResults(clearSearchTerm);
      this.isOpen = false;
    }
    closeResults(clearSearchTerm = false) {
      var ref;
      if (clearSearchTerm) {
        this.input.value = "";
        this.removeAttribute("results");
      }
      const selected = this.querySelector(selectors$I.ariaSelected);
      if (selected) selected.setAttribute("aria-selected", false);
      this.input.setAttribute("aria-activedescendant", "");
      this.removeAttribute("loading");
      this.removeAttribute("open");
      this.input.setAttribute("aria-expanded", false);
      (ref = this.predictiveSearchResults) === null || ref === void 0 ? void 0 : ref.removeAttribute("style");
    }
    reset() {
      this.predictiveSearchResults.innerHTML = "";
      this.input.val = "";
      this.a11y.removeTrapFocus();
    }
    handleErrors(response) {
      if (!response.ok) {
        return response.json().then(function (json) {
          const e = new FetchError({
            status: response.statusText,
            headers: response.headers,
            json: json,
          });
          throw e;
        });
      }
      return response;
    }
    constructor() {
      super();
      this.wrapper = this;
      this.a11y = a11y;
      this.abortController = new AbortController();
      this.allPredictiveSearchInstances = document.querySelectorAll(selectors$I.predictiveSearch);
      this.cachedResults = {};
      this.input = this.wrapper.querySelector(selectors$I.searchInput);
      this.isOpen = false;
      this.predictiveSearchResults = this.querySelector(selectors$I.predictiveSearchResults);
      this.searchTerm = "";
      this.loader = this.wrapper.querySelector(selectors$I.loader);
    }
  };

  function getWindowWidth() {
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  }
  function isDesktop() {
    return getWindowWidth() >= window.theme.sizes.small;
  }
  function isMobile() {
    return getWindowWidth() < window.theme.sizes.small;
  }

  const selectors$H = {
    inputSearch: 'input[type="search"]',
  };
  let MainSearch = class MainSearch extends HeaderSearchForm {
    setupEventListeners() {
      let allSearchForms = [];
      this.allSearchInputs.forEach((input) => allSearchForms.push(input.form));
      this.input.addEventListener("focus", this.onInputFocus.bind(this));
      if (allSearchForms.length < 2) return;
      allSearchForms.forEach((form) => form.addEventListener("reset", this.onFormReset.bind(this)));
      this.allSearchInputs.forEach((input) => input.addEventListener("input", this.onInput.bind(this)));
    }
    onFormReset(event) {
      super.onFormReset(event);
      if (super.shouldResetForm()) {
        this.keepInSync("", this.input);
      }
    }
    onInput(event) {
      const target = event.target;
      this.keepInSync(target.value, target);
    }
    onInputFocus() {
      if (!isDesktop()) {
        this.scrollIntoView({
          behavior: "smooth",
        });
      }
    }
    keepInSync(value, target) {
      this.allSearchInputs.forEach((input) => {
        if (input !== target) {
          input.value = value;
        }
      });
    }
    constructor() {
      super();
      this.allSearchInputs = document.querySelectorAll(selectors$H.inputSearch);
      this.setupEventListeners();
    }
  };

  const selectors$G = {
    drawer: "data-drawer-scrolls",
    slideruleOpen: "data-sliderule-open",
    slideruleClose: "data-sliderule-close",
    sliderulePane: "data-sliderule-pane",
    slideruleWrappper: "[data-sliderule]",
    dataAnimates: "data-animates",
    children: `:scope > [data-animates],
             :scope > * > [data-animates],
             :scope > * > * >[data-animates],
             :scope .sliderule-grid  > *`,
  };
  const classes$q = {
    isVisible: "is-visible",
    isHiding: "is-hiding",
    isHidden: "is-hidden",
  };
  let sections$c = {};
  let HeaderMobileSliderule = class HeaderMobileSliderule {
    clickEvents() {
      this.trigger.addEventListener(
        "click",
        function () {
          this.showSliderule();
        }.bind(this),
      );
      this.exit.forEach((element) => {
        element.addEventListener(
          "click",
          function () {
            this.hideSliderule();
          }.bind(this),
        );
      });
    }
    keyboardEvents() {
      this.trigger.addEventListener(
        "keyup",
        function (evt) {
          if (evt.code !== "Space") {
            return;
          }
          this.showSliderule();
        }.bind(this),
      );
      this.sliderule.addEventListener(
        "keyup",
        function (evt) {
          if (evt.code !== "Escape") {
            return;
          }
          this.hideSliderule();
          this.buttons[0].focus();
        }.bind(this),
      );
    }
    staggerChildAnimations(reverse = false) {
      const childrenArr = reverse ? Array.prototype.slice.call(this.children).slice().reverse() : this.children;
      childrenArr.forEach((child, index) => {
        child.style.transitionDelay = index * 50 + 10 + "ms";
      });
    }
    hideSliderule(close = false) {
      const paneStyle = window.getComputedStyle(this.pane);
      const paneTransitionDuration = parseFloat(paneStyle.getPropertyValue("transition-duration")) * 1000;
      const children = close ? this.pane.querySelectorAll(`.${classes$q.isVisible}`) : this.children;
      this.pane.style.setProperty("--sliderule-height", "auto");
      this.staggerChildAnimations(true);
      this.pane.classList.add(classes$q.isHiding);
      this.sliderule.classList.add(classes$q.isHiding);
      this.sliderule.classList.remove(classes$q.isVisible);
      children.forEach((el) => {
        el.classList.remove(classes$q.isVisible);
      });
      const newPosition = parseInt(this.pane.dataset.sliderulePane, 10) - 1;
      this.pane.setAttribute(selectors$G.sliderulePane, newPosition);
      const hidedSelector = close
        ? `[${selectors$G.dataAnimates}].${classes$q.isHidden}`
        : `[${selectors$G.dataAnimates}="${newPosition}"].${classes$q.isHidden}`;
      const hidedItems = this.pane.querySelectorAll(hidedSelector);
      if (hidedItems.length) {
        hidedItems.forEach((element) => {
          element.classList.remove(classes$q.isHidden);
        });
      }
      setTimeout(() => {
        this.pane.classList.remove(classes$q.isHiding);
        this.sliderule.classList.remove(classes$q.isHiding);
        this.staggerChildAnimations();
      }, paneTransitionDuration);
    }
    showSliderule() {
      this.pane.style.setProperty("--sliderule-height", "auto");
      this.sliderule.classList.add(classes$q.isVisible);
      this.children.forEach((el) => {
        el.classList.add(classes$q.isVisible);
      });
      const oldPosition = parseInt(this.pane.dataset.sliderulePane, 10);
      const newPosition = oldPosition + 1;
      this.pane.setAttribute(selectors$G.sliderulePane, newPosition);
      const hidedItems = this.pane.querySelectorAll(`[${selectors$G.dataAnimates}="${oldPosition}"]`);
      if (hidedItems.length) {
        const hidedItemsTransition =
          parseFloat(window.getComputedStyle(hidedItems[0]).getPropertyValue("transition-duration")) * 1000;
        setTimeout(() => {
          hidedItems.forEach((element) => {
            element.classList.add(classes$q.isHidden);
          });
        }, hidedItemsTransition);
      }
      const newHeight = parseInt(this.trigger.nextElementSibling.offsetHeight);
      this.pane.style.setProperty("--sliderule-height", `${newHeight}px`);
      const drawerScrollY = this.drawer.scrollTop;
      const scrollToElement = this.pane.offsetTop;
      const enableScrollTo = scrollToElement < drawerScrollY && this.pane.offsetHeight >= this.drawer.offsetHeight;
      if (enableScrollTo) {
        this.drawer.scrollTo({
          top: scrollToElement,
          left: 0,
          behavior: "smooth",
        });
      }
    }
    closeSliderule() {
      if (
        this.pane &&
        this.pane.hasAttribute(selectors$G.sliderulePane) &&
        parseInt(this.pane.getAttribute(selectors$G.sliderulePane)) > 0
      ) {
        this.hideSliderule(true);
        if (parseInt(this.pane.getAttribute(selectors$G.sliderulePane)) > 0) {
          this.pane.setAttribute(selectors$G.sliderulePane, 0);
        }
      }
    }
    constructor(el) {
      this.sliderule = el;
      this.wrapper = el.closest(selectors$G.wrapper);
      this.key = this.sliderule.id;
      const btnSelector = `[${selectors$G.slideruleOpen}='${this.key}']`;
      const exitSelector = `[${selectors$G.slideruleClose}='${this.key}']`;
      this.trigger = document.querySelector(btnSelector);
      this.drawer = document.querySelector(`[${selectors$G.drawer}]`);
      this.exit = document.querySelectorAll(exitSelector);
      this.pane = document.querySelector(`[${selectors$G.sliderulePane}]`);
      this.children = this.sliderule.querySelectorAll(selectors$G.children);
      this.trigger.setAttribute("aria-haspopup", true);
      this.trigger.setAttribute("aria-expanded", false);
      this.trigger.setAttribute("aria-controls", this.key);
      this.clickEvents();
      this.staggerChildAnimations();
      document.addEventListener("theme:sliderule:close", this.closeSliderule.bind(this));
    }
  };
  const headerMobileSliderule = {
    onLoad() {
      sections$c[this.id] = [];
      const els = this.container.querySelectorAll(selectors$G.slideruleWrappper);
      els.forEach((el) => {
        sections$c[this.id].push(new HeaderMobileSliderule(el));
      });
    },
  };

  const selectors$F = {
    widthContent: "[data-takes-space]",
    desktop: "[data-header-desktop]",
    cloneClass: "js__header__clone",
    showMobileClass: "js__show__mobile",
    backfill: "[data-header-backfill]",
    transparent: "data-header-transparent",
    overrideBorder: "header-override-border",
    firstSectionHasImage: ".main-content > .shopify-section:first-child [data-overlay-header]",
    preventTransparentHeader: ".main-content > .shopify-section:first-child [data-prevent-transparent-header]",
    deadLink: '.navlink[href="#"]',
  };
  const classes$p = {
    hasOverlay: "has-overlay",
  };
  let sections$b = {};
  let Header = class Header {
    unload() {
      document.removeEventListener("theme:resize", this.checkWidth);
    }
    checkForImage() {
      this.overlayedImages = document.querySelectorAll(selectors$F.firstSectionHasImage);
      let preventTransparentHeader = document.querySelectorAll(selectors$F.preventTransparentHeader).length;
      if (this.overlayedImages.length && !preventTransparentHeader && this.transparent) {
        // is transparent and has image, overlay the image
        document.querySelector(selectors$F.backfill).style.display = "none";
        this.listenOverlay();
      } else {
        this.wrapper.setAttribute(selectors$F.transparent, false);
      }
      if (this.overlayedImages.length && !preventTransparentHeader && !this.transparent) {
        // Have image but not transparent, remove border bottom
        this.wrapper.classList.add(selectors$F.overrideBorder);
        this.subtractHeaderHeight();
      }
    }
    listenOverlay() {
      document.addEventListener("theme:resize", this.checkWidth.bind(this));
      this.subtractAnnouncementHeight();
    }
    listenWidth() {
      document.addEventListener("theme:resize", this.checkWidth.bind(this));
      this.checkWidth();
    }
    killDeadLinks() {
      this.deadLinks.forEach((el) => {
        el.onclick = (e) => {
          e.preventDefault();
        };
      });
    }
    subtractAnnouncementHeight() {
      const { windowHeight, announcementHeight } = readHeights();
      this.overlayedImages.forEach((el) => {
        el.style.setProperty("--full-screen", `${windowHeight - announcementHeight}px`);
        el.classList.add(classes$p.hasOverlay);
      });
    }
    subtractHeaderHeight() {
      const { windowHeight, headerHeight } = readHeights();
      this.overlayedImages.forEach((el) => {
        el.style.setProperty("--full-screen", `${windowHeight - headerHeight}px`);
      });
    }
    checkWidth() {
      if (document.body.clientWidth < this.minWidth) {
        this.wrapper.classList.add(selectors$F.showMobileClass);
      } else {
        this.wrapper.classList.remove(selectors$F.showMobileClass);
      }
    }
    getMinWidth() {
      const comparitor = this.wrapper.cloneNode(true);
      comparitor.classList.add(selectors$F.cloneClass);
      document.body.appendChild(comparitor);
      const wideElements = comparitor.querySelectorAll(selectors$F.widthContent);
      let minWidth = 0;
      if (wideElements.length === 3) {
        minWidth = _sumSplitWidths(wideElements);
      } else {
        minWidth = _sumWidths(wideElements);
      }
      document.body.removeChild(comparitor);
      return minWidth + wideElements.length * 20;
    }
    constructor(el) {
      this.wrapper = el;
      this.style = this.wrapper.dataset.style;
      this.desktop = this.wrapper.querySelector(selectors$F.desktop);
      this.transparent = this.wrapper.getAttribute(selectors$F.transparent) !== "false";
      this.overlayedImages = document.querySelectorAll(selectors$F.firstSectionHasImage);
      this.deadLinks = document.querySelectorAll(selectors$F.deadLink);
      this.killDeadLinks();
      if (this.style !== "drawer" && this.desktop) {
        this.minWidth = this.getMinWidth();
        this.listenWidth();
      }
      this.checkForImage();
      window.dispatchEvent(new Event("resize"));
      document.addEventListener("theme:header:check", this.checkForImage.bind(this));
    }
  };
  function _sumSplitWidths(nodes) {
    let arr = [];
    nodes.forEach((el) => {
      arr.push(el.clientWidth);
    });
    if (arr[0] > arr[2]) {
      arr[2] = arr[0];
    } else {
      arr[0] = arr[2];
    }
    const width = arr.reduce((a, b) => a + b);
    return width;
  }
  function _sumWidths(nodes) {
    let width = 0;
    nodes.forEach((el) => {
      width += el.clientWidth;
    });
    return width;
  }
  const header = {
    onLoad() {
      sections$b = new Header(this.container);
    },
    onUnload: function () {
      if (typeof sections$b.unload === "function") {
        sections$b.unload();
      }
    },
  };
  register("header", [
    header,
    drawer,
    headerMobileSliderule,
    stickyHeader,
    hoverDisclosure,
    hoverUnderline,
    headerTotals,
    searchPopdown,
    cartPopdown,
    swatchGridSection,
    accordion,
    ticker,
  ]);
  if (!customElements.get("popout-select")) {
    customElements.define("popout-select", PopoutSelect);
  }
  if (!customElements.get("radio-swatch")) {
    customElements.define("radio-swatch", RadioSwatch);
  }
  if (!customElements.get("product-grid-item")) {
    customElements.define("product-grid-item", ProductGridItem);
  }
  if (!customElements.get("product-grid-item-variant")) {
    customElements.define("product-grid-item-variant", ProductGridItemVariant);
  }
  if (!customElements.get("product-grid-item-image")) {
    customElements.define("product-grid-item-image", ProductGridItemImage);
  }
  if (!customElements.get("predictive-search")) {
    customElements.define("predictive-search", PredictiveSearch);
  }
  if (!customElements.get("main-search")) {
    customElements.define("main-search", MainSearch);
  }

  const selectors$E = {
    newsletterForm: "[data-newsletter-form]",
  };
  const classes$o = {
    success: "has-success",
    error: "has-error",
  };
  const sections$a = {};
  let NewsletterCheckForResult = class NewsletterCheckForResult {
    init() {
      this.newsletter.addEventListener("submit", this.newsletterSubmit);
      this.showMessage();
    }
    newsletterSubmitEvent(e) {
      if (this.stopSubmit) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.removeStorage();
        this.writeStorage();
        this.stopSubmit = false;
        this.newsletter.submit();
      }
    }
    checkForChallengePage() {
      this.isChallengePage = window.location.pathname === "/challenge";
    }
    writeStorage() {
      if (this.sessionStorage !== undefined) {
        this.sessionStorage.setItem("newsletter_form_id", this.newsletter.id);
      }
    }
    readStorage() {
      this.formID = this.sessionStorage.getItem("newsletter_form_id");
    }
    removeStorage() {
      this.sessionStorage.removeItem("newsletter_form_id");
    }
    showMessage() {
      this.readStorage();
      if (this.newsletter.id === this.formID) {
        const newsletter = document.getElementById(this.formID);
        if (window.location.search.indexOf("?customer_posted=true") !== -1) {
          newsletter.classList.remove(classes$o.error);
          newsletter.classList.add(classes$o.success);
        } else if (window.location.search.indexOf("accepts_marketing") !== -1) {
          newsletter.classList.remove(classes$o.success);
          newsletter.classList.add(classes$o.error);
        }
        // Prevents the form from scrolling subsequent pagloads
        this.removeStorage();
        this.scrollToForm(newsletter);
      }
    }
    scrollToForm(newsletter) {
      const rect = newsletter.getBoundingClientRect();
      const isVisible =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth);
      if (!isVisible) {
        setTimeout(() => {
          window.scroll({
            top: rect.top,
            left: 0,
            behavior: "smooth",
          });
        }, 400);
      }
    }
    unload() {
      this.newsletter.removeEventListener("submit", this.newsletterSubmit);
    }
    constructor(newsletter) {
      this.sessionStorage = window.sessionStorage;
      this.newsletter = newsletter;
      this.stopSubmit = true;
      this.isChallengePage = false;
      this.formID = null;
      this.checkForChallengePage();
      this.newsletterSubmit = (e) => this.newsletterSubmitEvent(e);
      if (!this.isChallengePage) {
        this.init();
      }
    }
  };
  const newsletterCheckForResultSection = {
    onLoad() {
      sections$a[this.id] = [];
      const newsletters = this.container.querySelectorAll(selectors$E.newsletterForm);
      newsletters.forEach((form) => {
        sections$a[this.id].push(new NewsletterCheckForResult(form));
      });
    },
    onUnload() {
      sections$a[this.id].forEach((form) => {
        if (typeof form.unload === "function") {
          form.unload();
        }
      });
    },
  };

  const selectors$D = {
    shopPayWrapper: "[data-shop-pay-wrapper]",
    shopLoginButton: "shop-login-button",
    shopFollowButton: "shop-follow-button",
    followOnShopButton: "follow-on-shop-button",
    heartIcon: "heart-icon",
    shopLogo: "shop-logo",
  };
  const sections$9 = {};
  let ShopPayLink = class ShopPayLink {
    init() {
      if (!this.shopLoginButton || !this.shopPayWrapper) return;
      this.mainButtonStyles = `
      :host {
        --bg-color: ${this.shopPayWrapper.dataset.bg};
        --text-color: ${this.shopPayWrapper.dataset.text};
        --hover-color: ${this.shopPayWrapper.dataset.hover};
      }

      .follow-icon-wrapper:before {
        background: var(--bg-color);
        border-color: var(--text-color);
      }

      .button:not(.button--following):focus-visible .follow-icon-wrapper:before,
      .button:not(.button--following):hover .follow-icon-wrapper:before {
        background: var(--bg-color);
        border-color: var(--hover-color);
      }

      .button {
        background: transparent;
        color: var(--text-color);
      }

      .following-text {
        color: var(--text-color);
      }

      .button--following:focus-visible,
      .button--following:hover {
        background: var(--bg-color);
      }

      .button:not(.button--following):focus-visible .follow-icon-wrapper:before,
      .button:not(.button--following):hover .follow-icon-wrapper:before {
        background: var(--bg-color);
        border-color: var(--hover-color);
      }
    `;
      this.svgIconsStyles = `
      :host {
        color: ${this.shopPayWrapper.dataset.text};
      }
    `;
      customElements.whenDefined(selectors$D.shopLoginButton).then((res) => {
        requestAnimationFrame(() => {
          const shadowRoot1 = this.shopLoginButton.shadowRoot;
          const shopFollowButton =
            shadowRoot1 === null || shadowRoot1 === void 0
              ? void 0
              : shadowRoot1.querySelector(selectors$D.shopFollowButton);
          const shadowRoot2 =
            shopFollowButton === null || shopFollowButton === void 0 ? void 0 : shopFollowButton.shadowRoot;
          const followOnShopButton =
            shadowRoot2 === null || shadowRoot2 === void 0
              ? void 0
              : shadowRoot2.querySelector(selectors$D.followOnShopButton);
          const shadowRoot3 =
            followOnShopButton === null || followOnShopButton === void 0 ? void 0 : followOnShopButton.shadowRoot;
          if (shadowRoot3) this.overwriteStyles(shadowRoot3.host.shadowRoot, this.mainButtonStyles);
          const heartIcon = shadowRoot3.querySelector(selectors$D.heartIcon);
          const shadowRoot4 = heartIcon === null || heartIcon === void 0 ? void 0 : heartIcon.shadowRoot;
          const shopLogo = shadowRoot3.querySelector(selectors$D.shopLogo);
          const shadowRoot5 = shopLogo === null || shopLogo === void 0 ? void 0 : shopLogo.shadowRoot;
          if (shadowRoot4) this.overwriteStyles(shadowRoot4.host.shadowRoot, this.svgIconsStyles);
          if (shadowRoot5) this.overwriteStyles(shadowRoot5.host.shadowRoot, this.svgIconsStyles);
        });
      });
    }
    overwriteStyles(element, styles) {
      let style = document.createElement("style");
      style.innerHTML = styles;
      element.appendChild(style);
    }
    constructor(container) {
      this.container = container;
      this.shopPayWrapper = document.querySelector(selectors$D.shopPayWrapper);
      this.shopLoginButton = document.querySelector(selectors$D.shopLoginButton);
      this.init();
    }
  };
  const shopPayLink = {
    onLoad() {
      sections$9[this.id] = new ShopPayLink(this.container);
    },
  };

  register("footer", [accordion, newsletterCheckForResultSection, shopPayLink]);
  if (!customElements.get("popout-select")) {
    customElements.define("popout-select", PopoutSelect);
  }

  const defaultOptions$1 = {
    cc_load_policy: 1,
    iv_load_policy: 3,
    modestbranding: 1,
    playsinline: 1,
    controls: 1,
    showinfo: 0,
    ecver: 2,
    fs: 1,
    rel: 0,
  };
  const selectors$C = {
    player: "iframe, [data-replace]",
    videoId: "data-video-id",
  };
  function embedYoutube(uniqueKey, options) {
    const playerOptions = {
      ...defaultOptions$1,
      ...options,
    };
    const playerWrapper = document.querySelector(`[data-player="${uniqueKey}"]`);
    const playerElement = playerWrapper.querySelector(selectors$C.player);
    const youtubeKey = playerWrapper.querySelector(`[${selectors$C.videoId}]`).getAttribute(selectors$C.videoId);
    loadScript({
      url: "https://www.youtube.com/iframe_api",
    });
    const playerPromise = window.youtubeLoaderPromise
      .then(() => {
        let player = new window.YT.Player(playerElement, {
          videoId: youtubeKey,
          playerVars: {
            ...playerOptions,
          },
          events: {
            onStateChange: (event) => {
              // We need these play/pause events because the YouTube video does not emit the regular play/pause events on Mobile
              if (event.data == 1) {
                playerWrapper.dispatchEvent(new CustomEvent("play"));
              } else if (event.data == 2) {
                playerWrapper.dispatchEvent(new CustomEvent("pause"));
              }
            },
          },
        });
        playerWrapper.addEventListener("pause", () => {
          try {
            player.pauseVideo();
          } catch (e) {
            console.warn(e);
          }
        });
        playerWrapper.addEventListener("play", () => {
          try {
            if (player.playVideo) {
              player.playVideo();
            } else {
              player.addEventListener("onReady", () => {
                player.playVideo();
              });
            }
          } catch (e) {
            console.warn(e);
          }
        });
        playerWrapper.addEventListener("destroy", () => {
          try {
            if (player.destroy) {
              player.destroy();
            }
          } catch (e) {
            console.warn(e);
          }
        });
        return player;
      })
      .catch((err) => {
        console.error(err);
      });
    return playerPromise;
  }
  window.youtubeLoaderPromise = new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = function () {
      resolve();
    };
  });

  const defaultOptions = {
    autoplay: true,
    loop: true,
    controls: true,
    muted: false,
    playsinline: true,
  };
  const selectors$B = {
    player: "iframe, [data-replace]",
    videoId: "data-video-id",
  };
  function embedVimeo(uniqueKey, options) {
    const playerOptions = {
      ...defaultOptions,
      ...options,
    };
    const playerWrapper = document.querySelector(`[data-player="${uniqueKey}"]`);
    const playerElement = playerWrapper.querySelector(selectors$B.player);
    const vimeoKey = playerWrapper.querySelector(`[${selectors$B.videoId}]`).getAttribute(selectors$B.videoId);
    const loadedPromise = loadScript({
      url: "https://player.vimeo.com/api/player.js",
    });
    const vimeoSelector = `select-${uniqueKey}`;
    playerElement.setAttribute("id", vimeoSelector);
    const returnPlayer = loadedPromise
      .then(() => {
        const player = new window.Vimeo.Player(vimeoSelector, {
          ...playerOptions,
          id: vimeoKey,
        });
        // We need these play/pause events because the Vimeo video does not emit the regular play/pause events on Mobile
        player.on("play", () => {
          playerWrapper.dispatchEvent(new CustomEvent("play"));
        });
        player.on("pause", () => {
          playerWrapper.dispatchEvent(new CustomEvent("pause"));
        });
        playerWrapper.addEventListener("pause", () => {
          try {
            if (player.pause) {
              player.pause();
            }
          } catch (e) {
            console.warn(e);
          }
        });
        playerWrapper.addEventListener("play", () => {
          if (player.play) {
            // Check if it is paused to avoid playing an already playing video which sometimes results in an error
            player.getPaused().then((paused) => {
              if (paused) {
                player.play();
              }
            });
          }
        });
        playerWrapper.addEventListener("destroy", () => {
          try {
            if (player.destroy) {
              player.destroy();
            }
          } catch (e) {
            console.log(e);
          }
        });
        return player;
      })
      .catch((err) => {
        console.error(err);
      });
    return returnPlayer;
  }

  const selectors$A = {
    videoPopup: "[data-video-popup]",
    videoAutoplay: "[data-video-autoplay]",
    attrUnique: "data-unique",
    attrVideoId: "data-video-id",
    attrVideoType: "data-video-type",
    attrPlayer: "data-player",
  };
  let PopupVideo = class PopupVideo {
    init() {
      this.triggers.forEach((trigger) => {
        const unique = trigger.getAttribute(selectors$A.attrUnique);
        const video = trigger.getAttribute(selectors$A.attrVideoId);
        const type = trigger.getAttribute(selectors$A.attrVideoType);
        // Find the modal body, which has been moved to the document root
        // and append a unique ID for youtube and vimeo to init players.
        const uniqueKey = `${video}-${unique}`;
        const player = document.querySelector(`[${selectors$A.attrPlayer}="${uniqueKey}"]`);
        // Modal Event Logic:
        // When a modal opens it creates and plays the video
        // When a modal opens it pauses background videos in this section
        // --
        // When a modal closes it destroys the player
        // When a modal closes it plays background videos anywhere on the page
        MicroModal.init({
          onShow: () => {
            if (this.backgroundVideo && typeof this.backgroundVideo.pause === "function") {
              this.backgroundVideo.pause();
            }
            let playerPromise = {};
            if (type === "youtube") {
              playerPromise = embedYoutube(uniqueKey);
            } else if (type === "vimeo") {
              playerPromise = embedVimeo(uniqueKey);
            }
            playerPromise.then(() => {
              player.dispatchEvent(new CustomEvent("play"));
            });
          },
          onClose: (modal, el, event) => {
            event.preventDefault();
            player.dispatchEvent(new CustomEvent("destroy"));
            if (this.backgroundVideo && typeof this.backgroundVideo.play === "function") {
              this.backgroundVideo.play();
            }
          },
          openTrigger: `data-trigger-${video}-${unique}`,
        });
      });
    }
    constructor(section) {
      this.container = section.container;
      this.triggers = this.container.querySelectorAll(selectors$A.videoPopup);
      this.backgroundVideo = this.container.querySelector(selectors$A.videoAutoplay);
      this.init();
    }
  };
  const popupVideoSection = {
    onLoad() {
      new PopupVideo(this);
    },
  };

  const selectors$z = {
    button: "[data-scroll-down]",
  };
  let ScrollButton = class ScrollButton {
    init() {
      const buttons = this.wrapper.querySelectorAll(selectors$z.button);
      if (buttons) {
        buttons.forEach((btn) => {
          btn.addEventListener("click", this.scroll.bind(this));
        });
      }
    }
    scroll() {
      const bottom = this.wrapper.offsetTop + this.wrapper.clientHeight;
      window.scroll({
        top: bottom,
        left: 0,
        behavior: "smooth",
      });
    }
    constructor(el) {
      this.wrapper = el;
      this.init();
    }
  };
  const scrollButton = {
    onLoad() {
      this.scrollButton = new ScrollButton(this.container);
    },
    onUnload: function () {
      delete this.scrollButton;
    },
  };

  register("video", [parallaxImage, scrollButton, popupVideoSection]);

  register("page-faq", accordion);

  register("hero", [parallaxImage, scrollButton, customScrollbar]);

  const selectors$y = {
    slider: "[data-slider]",
    photo: "[data-grid-slide]",
    wrapper: "[data-wrapper]",
    carouselCustomScrollbar: "data-custom-scrollbar-items",
  };
  const attributes = {
    showDots: "data-show-dots",
  };
  const classes$n = {
    wrapper: "wrapper",
    wrapperModifier: "wrapper--full",
    hide: "hide",
  };
  const offsets = {
    scrollbarWidth: window.innerWidth - document.documentElement.clientWidth,
    additionalOffsetWrapper: 112,
  };
  const sections$8 = {};
  let Slider = class Slider {
    init() {
      const instance = this;
      const sliderOptions = {
        initialIndex: 0,
        accessibility: true,
        autoPlay: false,
        contain: true,
        pageDots: this.pageDots,
        adaptiveHeight: false,
        wrapAround: false,
        groupCells: false,
        cellAlign: "left",
        freeScroll: true,
        prevNextButtons: true,
        draggable: true,
        rightToLeft: window.isRTL,
        watchCSS: true,
        arrowShape: {
          x0: 10,
          x1: 60,
          y1: 50,
          x2: 67.5,
          y2: 42.5,
          x3: 25,
        },
        on: {
          ready: function () {
            instance.removeIncorrectAria();
          },
        },
      };
      this.flkty = new Flickity(this.slideshow, sliderOptions);
      this.container.addEventListener("theme:tab:change", () => {
        this.flkty.resize();
      });
      this.toggleWrapperModifier();
      document.addEventListener("theme:resize:width", this.toggleWrapperModifier.bind(this));
      if (this.slideshow.hasAttribute(selectors$y.carouselCustomScrollbar)) {
        new CustomScrollbar(this.container);
      }
      new Siblings(this.container);
    }
    toggleWrapperModifier() {
      if (!this.wrapper.classList.contains(classes$n.wrapper)) {
        return;
      }
      this.wrapper.classList.toggle(classes$n.wrapperModifier, this.wrapperWidthWithGutter >= window.innerWidth);
    }
    // Flickity VERY annoyingly adds aria-hidden="true" to all slides except the current one which causes lighthouse accessibility failure
    // see https://github.com/metafizzy/flickity/issues/1228
    removeIncorrectAria() {
      const slidesHidden = this.slideshow.querySelectorAll('[aria-hidden="true"]');
      slidesHidden.forEach((el) => el.removeAttribute("aria-hidden"));
    }
    onUnload() {
      if (this.slideshow && this.flkty) {
        this.flkty.options.watchCSS = false;
        this.flkty.destroy();
      }
    }
    constructor(container, el) {
      this.container = container;
      this.slideshow = el;
      this.wrapper = this.container.querySelector(selectors$y.wrapper);
      this.wrapperWidth = Number(
        getComputedStyle(document.documentElement).getPropertyValue("--LAYOUT-WIDTH").replace("px", ""),
      );
      this.wrapperWidthWithGutter = this.wrapperWidth + offsets.additionalOffsetWrapper + offsets.scrollbarWidth;
      this.pageDots = this.slideshow.getAttribute(attributes.showDots) === "true";
      this.firstPhoto = this.container.querySelector(selectors$y.photo);
      if (this.firstPhoto) {
        const buttonOffset = this.firstPhoto.offsetHeight / 2;
        this.slideshow.style.setProperty("--buttons-top", `${buttonOffset}px`);
      }
      if (!this.slideshow) return;
      this.flkty = null;
      this.init();
    }
  };
  const productSliderSection = {
    onLoad() {
      sections$8[this.id] = [];
      const els = this.container.querySelectorAll(selectors$y.slider);
      els.forEach((el) => {
        sections$8[this.id].push(new Slider(this.container, el));
      });
    },
    onUnload(e) {
      sections$8[this.id].forEach((el) => {
        if (typeof el.onUnload === "function") {
          el.onUnload(e);
        }
      });
    },
  };

  register("custom-content", [parallaxImage, popupVideoSection, swatchGridSection, productSliderSection]);
  if (!customElements.get("radio-swatch")) {
    customElements.define("radio-swatch", RadioSwatch);
  }
  if (!customElements.get("product-grid-item")) {
    customElements.define("product-grid-item", ProductGridItem);
  }
  if (!customElements.get("product-grid-item-variant")) {
    customElements.define("product-grid-item-variant", ProductGridItemVariant);
  }
  if (!customElements.get("product-grid-item-image")) {
    customElements.define("product-grid-item-image", ProductGridItemImage);
  }

  const sections$7 = [];
  const selectors$x = {
    wrapper: "[data-slideshow-wrapper]",
    speed: "data-slideshow-speed",
    autoplay: "data-slideshow-autoplay",
    slideCount: "data-slideshow-slides",
    prevButton: "[data-slide-custom-prev]",
    nextButton: "[data-slide-custom-next]",
    slideshoIndex: "data-slideshow-index",
  };
  const classes$m = {
    isEnable: "flickity-enabled",
  };
  let Slideshow = class Slideshow {
    init() {
      const settings = {
        autoPlay: this.autoplay && this.speed ? parseInt(this.speed) : false,
        contain: false,
        pageDots: true,
        adaptiveHeight: true,
        accessibility: true,
        wrapAround: this.slideCount !== 2,
        prevNextButtons: false,
        draggable: true,
        fade: true,
        rightToLeft: window.isRTL,
      };
      this.flkty = new FlickityFade(this.wrapper, settings);
      if (this.prevButtons.length) {
        this.prevButtons.forEach((e) => {
          e.onclick = () => {
            this.flkty.previous(true, false);
          };
        });
      }
      if (this.nextButtons.length) {
        this.nextButtons.forEach((e) => {
          e.onclick = () => {
            this.flkty.next(true, false);
          };
        });
      }
      document.addEventListener("theme:scroll", this.scrollEvent);
    }
    scrollEvents() {
      if (this.flkty && this.autoplay && this.speed) {
        const slideshow = this.flkty.element;
        const slideshowBottomPosition = slideshow.getBoundingClientRect().top + window.scrollY + slideshow.offsetHeight;
        if (window.pageYOffset > slideshowBottomPosition) {
          if (this.flkty.player.state === "playing") {
            this.flkty.pausePlayer();
          }
        } else if (this.flkty.player.state === "paused") {
          this.flkty.playPlayer();
        }
      }
    }
    unload() {
      document.removeEventListener("theme:scroll", this.scrollEvent);
      if (this.flkty && this.wrapper && this.wrapper.classList.contains(classes$m.isEnable)) {
        this.flkty.destroy();
      }
    }
    onBlockSelect(evt) {
      const indexEl = evt.target.closest(`[${selectors$x.slideshoIndex}]`);
      const slideIndex = indexEl.getAttribute(selectors$x.slideshoIndex);
      const select = parseInt(slideIndex);
      this.flkty.selectCell(select);
      this.flkty.stopPlayer();
    }
    onBlockDeselect() {
      if (this.autoplay) {
        this.flkty.playPlayer();
      }
    }
    constructor(section) {
      this.container = section.container;
      this.wrapper = section.container.querySelector(selectors$x.wrapper);
      this.speed = this.wrapper.getAttribute(selectors$x.speed);
      this.autoplay = this.wrapper.getAttribute(selectors$x.autoplay) === "true";
      this.slideCount = parseInt(this.wrapper.getAttribute(selectors$x.slideCount), 10);
      this.prevButtons = this.wrapper.querySelectorAll(selectors$x.prevButton);
      this.nextButtons = this.wrapper.querySelectorAll(selectors$x.nextButton);
      this.flkty = null;
      this.scrollEvent = () => this.scrollEvents();
      this.init();
    }
  };
  const slideshowSection = {
    onLoad() {
      sections$7[this.id] = new Slideshow(this);
    },
    onUnload() {
      if (typeof sections$7[this.id].unload === "function") {
        sections$7[this.id].unload();
      }
    },
    onBlockSelect(evt) {
      if (typeof sections$7[this.id].onBlockSelect === "function") {
        sections$7[this.id].onBlockSelect(evt);
      }
    },
    onBlockDeselect(evt) {
      if (typeof sections$7[this.id].onBlockSelect === "function") {
        sections$7[this.id].onBlockDeselect(evt);
      }
    },
  };
  register("slideshow", [slideshowSection, parallaxImage, scrollButton]);

  const selectors$w = {
    rangeSlider: "[data-range-slider]",
    rangeDotLeft: "[data-range-left]",
    rangeDotRight: "[data-range-right]",
    rangeLine: "[data-range-line]",
    rangeHolder: "[data-range-holder]",
    dataMin: "data-se-min",
    dataMax: "data-se-max",
    dataMinValue: "data-se-min-value",
    dataMaxValue: "data-se-max-value",
    dataStep: "data-se-step",
    dataFilterUpdate: "data-range-filter-update",
    priceMin: "[data-field-price-min]",
    priceMax: "[data-field-price-max]",
  };
  const classes$l = {
    isInitialized: "is-initialized",
  };
  let RangeSlider = class RangeSlider {
    init() {
      this.setDefaultValues();
      // link events
      this.touchLeft.addEventListener("mousedown", this.onStartEvent);
      this.touchRight.addEventListener("mousedown", this.onStartEvent);
      this.touchLeft.addEventListener("touchstart", this.onStartEvent);
      this.touchRight.addEventListener("touchstart", this.onStartEvent);
      // initialize
      this.slider.classList.add(classes$l.isInitialized);
    }
    setDefaultValues() {
      // retrieve default values
      let defaultMinValue = this.min;
      if (this.slider.hasAttribute(selectors$w.dataMinValue)) {
        defaultMinValue = parseFloat(this.slider.getAttribute(selectors$w.dataMinValue));
      }
      let defaultMaxValue = this.max;
      if (this.slider.hasAttribute(selectors$w.dataMaxValue)) {
        defaultMaxValue = parseFloat(this.slider.getAttribute(selectors$w.dataMaxValue));
      }
      // check values are correct
      if (defaultMinValue < this.min) {
        defaultMinValue = this.min;
      }
      if (defaultMaxValue > this.max) {
        defaultMaxValue = this.max;
      }
      if (defaultMinValue > defaultMaxValue) {
        defaultMinValue = defaultMaxValue;
      }
      if (this.slider.getAttribute(selectors$w.dataStep)) {
        this.step = Math.abs(parseFloat(this.slider.getAttribute(selectors$w.dataStep)));
      }
      // initial reset
      this.reset();
      // usefull values, min, max, normalize fact is the width of both touch buttons
      this.maxX = this.slider.offsetWidth - this.touchRight.offsetWidth;
      this.selectedTouch = null;
      this.initialValue = this.lineSpan.offsetWidth - this.normalizeFact;
      // set defualt values
      this.setMinValue(defaultMinValue);
      this.setMaxValue(defaultMaxValue);
    }
    reset() {
      this.touchLeft.style.left = "0px";
      this.touchRight.style.left = this.slider.offsetWidth - this.touchLeft.offsetWidth + "px";
      this.lineSpan.style.marginLeft = "0px";
      this.lineSpan.style.width = this.slider.offsetWidth - this.touchLeft.offsetWidth + "px";
      this.startX = 0;
      this.x = 0;
    }
    setMinValue(minValue) {
      const ratio = (minValue - this.min) / (this.max - this.min);
      this.touchLeft.style.left =
        Math.ceil(ratio * (this.slider.offsetWidth - (this.touchLeft.offsetWidth + this.normalizeFact))) + "px";
      this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + "px";
      this.lineSpan.style.width = this.touchRight.offsetLeft - this.touchLeft.offsetLeft + "px";
      this.slider.setAttribute(selectors$w.dataMinValue, minValue);
    }
    setMaxValue(maxValue) {
      const ratio = (maxValue - this.min) / (this.max - this.min);
      this.touchRight.style.left =
        Math.ceil(
          ratio * (this.slider.offsetWidth - (this.touchLeft.offsetWidth + this.normalizeFact)) + this.normalizeFact,
        ) + "px";
      this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + "px";
      this.lineSpan.style.width = this.touchRight.offsetLeft - this.touchLeft.offsetLeft + "px";
      this.slider.setAttribute(selectors$w.dataMaxValue, maxValue);
    }
    onStart(event) {
      // Prevent default dragging of selected content
      event.preventDefault();
      let eventTouch = event;
      if (event.touches) {
        eventTouch = event.touches[0];
      }
      if (event.currentTarget === this.touchLeft) {
        this.x = this.touchLeft.offsetLeft;
      } else if (event.currentTarget === this.touchRight) {
        this.x = this.touchRight.offsetLeft;
      }
      this.startX = eventTouch.pageX - this.x;
      this.selectedTouch = event.currentTarget;
      document.addEventListener("mousemove", this.onMoveEvent);
      document.addEventListener("mouseup", this.onStopEvent);
      document.addEventListener("touchmove", this.onMoveEvent);
      document.addEventListener("touchend", this.onStopEvent);
    }
    onMove(event) {
      let eventTouch = event;
      if (event.touches) {
        eventTouch = event.touches[0];
      }
      this.x = eventTouch.pageX - this.startX;
      if (this.selectedTouch === this.touchLeft) {
        if (this.x > this.touchRight.offsetLeft - this.selectedTouch.offsetWidth + 10) {
          this.x = this.touchRight.offsetLeft - this.selectedTouch.offsetWidth + 10;
        } else if (this.x < 0) {
          this.x = 0;
        }
        this.selectedTouch.style.left = this.x + "px";
      } else if (this.selectedTouch === this.touchRight) {
        if (this.x < this.touchLeft.offsetLeft + this.touchLeft.offsetWidth - 10) {
          this.x = this.touchLeft.offsetLeft + this.touchLeft.offsetWidth - 10;
        } else if (this.x > this.maxX) {
          this.x = this.maxX;
        }
        this.selectedTouch.style.left = this.x + "px";
      }
      // update line span
      this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + "px";
      this.lineSpan.style.width = this.touchRight.offsetLeft - this.touchLeft.offsetLeft + "px";
      // write new value
      this.calculateValue();
      // call on change
      if (this.slider.getAttribute("on-change")) {
        const fn = new Function("min, max", this.slider.getAttribute("on-change"));
        fn(this.slider.getAttribute(selectors$w.dataMinValue), this.slider.getAttribute(selectors$w.dataMaxValue));
      }
      this.onChange(
        this.slider.getAttribute(selectors$w.dataMinValue),
        this.slider.getAttribute(selectors$w.dataMaxValue),
      );
    }
    onStop(event) {
      document.removeEventListener("mousemove", this.onMoveEvent);
      document.removeEventListener("mouseup", this.onStopEvent);
      document.removeEventListener("touchmove", this.onMoveEvent);
      document.removeEventListener("touchend", this.onStopEvent);
      this.selectedTouch = null;
      // write new value
      this.calculateValue();
      // call did changed
      this.onChanged(
        this.slider.getAttribute(selectors$w.dataMinValue),
        this.slider.getAttribute(selectors$w.dataMaxValue),
      );
    }
    onChange(min, max) {
      const rangeHolder = this.slider.closest(selectors$w.rangeHolder);
      if (rangeHolder) {
        const priceMin = rangeHolder.querySelector(selectors$w.priceMin);
        const priceMax = rangeHolder.querySelector(selectors$w.priceMax);
        if (priceMin && priceMax) {
          priceMin.value = min;
          priceMax.value = max;
        }
      }
    }
    onChanged(min, max) {
      if (this.slider.hasAttribute(selectors$w.dataFilterUpdate)) {
        this.slider.dispatchEvent(
          new CustomEvent("theme:range:update", {
            bubbles: true,
          }),
        );
      }
    }
    calculateValue() {
      const newValue = (this.lineSpan.offsetWidth - this.normalizeFact) / this.initialValue;
      let minValue = this.lineSpan.offsetLeft / this.initialValue;
      let maxValue = minValue + newValue;
      minValue = minValue * (this.max - this.min) + this.min;
      maxValue = maxValue * (this.max - this.min) + this.min;
      if (this.step !== 0.0) {
        let multi = Math.floor(minValue / this.step);
        minValue = this.step * multi;
        multi = Math.floor(maxValue / this.step);
        maxValue = this.step * multi;
      }
      if (this.selectedTouch === this.touchLeft) {
        this.slider.setAttribute(selectors$w.dataMinValue, minValue);
      }
      if (this.selectedTouch === this.touchRight) {
        this.slider.setAttribute(selectors$w.dataMaxValue, maxValue);
      }
    }
    constructor(section) {
      this.container = section.container;
      this.slider = section.querySelector(selectors$w.rangeSlider);
      if (this.slider) {
        this.onMoveEvent = (event) => this.onMove(event);
        this.onStopEvent = (event) => this.onStop(event);
        this.onStartEvent = (event) => this.onStart(event);
        this.startX = 0;
        this.x = 0;
        // retrieve touch button
        this.touchLeft = this.slider.querySelector(selectors$w.rangeDotLeft);
        this.touchRight = this.slider.querySelector(selectors$w.rangeDotRight);
        this.lineSpan = this.slider.querySelector(selectors$w.rangeLine);
        // get some properties
        this.min = parseFloat(this.slider.getAttribute(selectors$w.dataMin));
        this.max = parseFloat(this.slider.getAttribute(selectors$w.dataMax));
        this.step = 0.0;
        // normalize flag
        this.normalizeFact = 26;
        this.init();
        document.addEventListener("theme:price-range:reset", () => {
          this.setDefaultValues();
        });
      }
    }
  };

  const throttle$1 = (fn, wait) => {
    let prev, next;
    return function invokeFn(...args) {
      const now = Date.now();
      next = clearTimeout(next);
      if (!prev || now - prev >= wait) {
        // eslint-disable-next-line prefer-spread
        fn.apply(null, args);
        prev = now;
      } else {
        next = setTimeout(invokeFn.bind(null, ...args), wait - (now - prev));
      }
    };
  };

  const selectors$v = {
    filtersWrappper: "data-filters",
    underlay: "[data-filters-underlay]",
    filtersHideDesktop: "data-default-hide",
    filtersToggle: "data-filters-toggle",
    focusable: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    groupHeading: "data-group-heading",
    showMore: "data-show-more",
  };
  const classes$k = {
    show: "drawer--visible",
    defaultVisible: "filters--default-visible",
    hide: "hidden",
    expand: "is-expanded",
    hidden: "is-hidden",
    focusEnable: "focus-enabled",
  };
  const sections$6 = {};
  let Filters = class Filters {
    unload() {
      if (this.filtersToggleButtons.length) {
        this.filtersToggleButtons.forEach((element) => {
          element.removeEventListener("click", this.connectToggleMemory);
        });
      }
      if (this.showMoreButtons.length) {
        this.showMoreButtons.forEach((button) => {
          button.removeEventListener("click", this.connectShowHiddenOptions);
        });
      }
    }
    expandingEvents() {
      if (this.showMoreButtons.length) {
        this.showMoreButtons.forEach((button) => {
          button.addEventListener("click", throttle$1(this.connectShowHiddenOptions, 500));
        });
      }
    }
    showHiddenOptions(evt) {
      const element = evt.target.hasAttribute(selectors$v.showMore)
        ? evt.target
        : evt.target.closest(`[${selectors$v.showMore}]`);
      element.classList.add(classes$k.hidden);
      element.previousElementSibling.querySelectorAll(`.${classes$k.hidden}`).forEach((option) => {
        option.classList.remove(classes$k.hidden);
      });
    }
    connectToggle(refresh = false) {
      this.filtersToggleButtons.forEach((button) => {
        const isDynamic = button.closest(`[${selectors$v.filtersWrappper}]`) !== null;
        if ((isDynamic && refresh) || (isDynamic && !refresh) || (!isDynamic && !refresh)) {
          button.addEventListener("click", this.connectToggleMemory.bind(this));
        }
      });
    }
    connectToggleFunction(evt) {
      const ariaExpanded = evt.currentTarget.getAttribute("aria-expanded") === "true";
      if (ariaExpanded) {
        this.hideFilters();
      } else {
        this.showFilters();
      }
    }
    onFocusOut() {
      this.container.addEventListener(
        "focusout",
        function (evt) {
          if (window.innerWidth >= window.theme.sizes.medium) {
            return;
          }
          const childInFocus = evt.currentTarget.contains(evt.relatedTarget);
          const isVisible = this.container.classList.contains(classes$k.show);
          const isFocusEnabled = document.body.classList.contains(classes$k.focusEnable);
          if (isFocusEnabled && isVisible && !childInFocus) {
            this.hideFilters();
          }
        }.bind(this),
      );
      this.container.addEventListener(
        "keyup",
        function (evt) {
          if (evt.code !== "Escape") {
            return;
          }
          this.hideFilters();
          this.filtersToggleButtons[0].focus();
        }.bind(this),
      );
      this.underlay.addEventListener(
        "click",
        function () {
          this.hideFilters();
        }.bind(this),
      );
    }
    getShowOnLoad() {
      const selector = `[${selectors$v.filtersHideDesktop}='false']`;
      const showOnDesktop = document.querySelector(selector);
      const isDesktop = window.innerWidth >= window.theme.sizes.medium;
      if (showOnDesktop && isDesktop) {
        return true;
      } else {
        return false;
      }
    }
    showFilters() {
      this.filtersToggleButtons = document.querySelectorAll(this.selector);
      this.container.classList.remove(classes$k.hide);
      // animates after display none is removed
      setTimeout(() => {
        this.filtersToggleButtons.forEach((btn) => btn.setAttribute("aria-expanded", true));
        this.filtersToggleButtons.forEach((btn) => btn.classList.add(classes$k.show));
        this.container.classList.add(classes$k.show);
        this.container.querySelector(selectors$v.focusable).focus();
      }, 1);
    }
    hideFilters() {
      this.filtersToggleButtons = document.querySelectorAll(this.selector);
      this.filtersToggleButtons.forEach((btn) => btn.setAttribute("aria-expanded", false));
      this.container.classList.remove(classes$k.show);
      this.container.classList.remove(classes$k.defaultVisible);
      this.filtersToggleButtons.forEach((btn) => btn.classList.remove(classes$k.show));
      this.filtersToggleButtons.forEach((btn) => btn.classList.remove(classes$k.defaultVisible));
      // adds display none after animations
      setTimeout(() => {
        if (!this.container.classList.contains(classes$k.show)) {
          this.container.classList.add(classes$k.hide);
        }
      }, 800);
    }
    constructor(filters, refresh = false) {
      this.container = filters;
      this.underlay = this.container.querySelector(selectors$v.underlay);
      this.groupHeadings = this.container.querySelectorAll(`[${selectors$v.groupHeading}]`);
      this.showMoreButtons = this.container.querySelectorAll(`[${selectors$v.showMore}]`);
      this.triggerKey = this.container.getAttribute(selectors$v.filtersWrappper);
      this.selector = `[${selectors$v.filtersToggle}='${this.triggerKey}']`;
      this.filtersToggleButtons = document.querySelectorAll(this.selector);
      this.connectToggleMemory = (evt) => this.connectToggleFunction(evt);
      this.connectShowHiddenOptions = (evt) => this.showHiddenOptions(evt);
      this.connectToggle(refresh);
      this.onFocusOut();
      this.expandingEvents();
      if (this.getShowOnLoad()) {
        this.showFilters();
      } else {
        this.hideFilters();
      }
    }
  };
  const collectionFiltersSidebar = {
    onLoad() {
      sections$6[this.id] = [];
      const wrappers = this.container.querySelectorAll(`[${selectors$v.filtersWrappper}]`);
      wrappers.forEach((wrapper) => {
        sections$6[this.id].push(new Filters(wrapper));
      });
    },
    onUnload: function () {
      sections$6[this.id].forEach((filters) => {
        if (typeof filters.unload === "function") {
          filters.unload();
        }
      });
    },
  };

  const selectors$u = {
    collectionSidebar: "[data-collection-sidebar]",
    form: "[data-sidebar-filter-form]",
    inputs: "input, select, label, textarea",
    priceMin: "data-field-price-min",
    priceMax: "data-field-price-max",
    rangeMin: "data-se-min-value",
    rangeMax: "data-se-max-value",
    rangeMinDefault: "data-se-min",
    rangeMaxDefault: "data-se-max",
    productsContainer: "[data-products-grid]",
    filterUpdateUrlButton: "[data-filter-update-url]",
    activeFiltersHolder: "[data-active-filters]",
    activeFiltersCount: "[data-active-filters-count]",
    productsCount: "[data-products-count]",
    dataSort: "data-sort-enabled",
    collectionTools: "[data-collection-tools]",
    filtersWrappper: "[data-filters]",
    headerSticky: '[data-header-sticky="sticky"]',
    headerHeight: "[data-header-height]",
    gridLarge: "data-grid-large",
    gridSmall: "data-grid-small",
    accordionBody: "[data-accordion-body]",
    checkedOption: "input:checked",
    optionHolder: "[data-option-holder]",
  };
  const classes$j = {
    classHidden: "is-hidden",
    classLoading: "is-loading",
  };
  const times = {
    loadingDelay: 1000,
    scrollTime: 1000,
  };
  let FiltersForm = class FiltersForm {
    init() {
      this.showAllOptions();
      if (this.form) {
        new RangeSlider(this.form);
        this.sidebar.addEventListener(
          "input",
          debounce$1((e) => {
            const type = e.type;
            const target = e.target;
            if (!selectors$u.inputs.includes(type) || !this.form || typeof this.form.submit !== "function") {
              return;
            }
            const priceMin = this.form.querySelector(`[${selectors$u.priceMin}]`);
            const priceMax = this.form.querySelector(`[${selectors$u.priceMax}]`);
            if (target.hasAttribute(selectors$u.priceMin) || target.hasAttribute(selectors$u.priceMax)) {
              const rangeMin = this.form.querySelector(`[${selectors$u.rangeMin}]`);
              const rangeMax = this.form.querySelector(`[${selectors$u.rangeMax}]`);
              const rangeMinDefault = parseInt(rangeMin.getAttribute(selectors$u.rangeMinDefault));
              const rangeMaxDefault = parseInt(rangeMax.getAttribute(selectors$u.rangeMaxDefault));
              if (priceMin.value && !priceMax.value) {
                priceMax.value = rangeMaxDefault;
              }
              if (priceMax.value && !priceMin.value) {
                priceMin.value = rangeMinDefault;
              }
              if (priceMin.value <= rangeMinDefault && priceMax.value >= rangeMaxDefault) {
                priceMin.placeholder = rangeMinDefault;
                priceMax.placeholder = rangeMaxDefault;
                priceMin.value = "";
                priceMax.value = "";
              }
            }
            this.filtering(e);
          }, 1500),
        );
        this.form.addEventListener("theme:range:update", (e) => this.updateRange(e));
      }
      if (this.sidebar) {
        this.sidebar.addEventListener("click", (e) => this.updateFilterFromUrl(e));
      }
      if (this.activeFiltersHolder) {
        this.activeFiltersHolder.addEventListener("click", (e) => this.updateFilterFromUrl(e));
      }
      if (this.productsContainer) {
        this.productsContainer.addEventListener("click", (e) => this.updateFilterFromUrl(e));
      }
      // Color swatches tooltips
      makeSwappers(this.sidebar);
    }
    /**
     * Update range slider (price money)
     * @param {Object} e
     */ updateRange(e) {
      if (this.form && typeof this.form.submit === "function") {
        const rangeMin = this.form.querySelector(`[${selectors$u.rangeMin}]`);
        const rangeMax = this.form.querySelector(`[${selectors$u.rangeMax}]`);
        const priceMin = this.form.querySelector(`[${selectors$u.priceMin}]`);
        const priceMax = this.form.querySelector(`[${selectors$u.priceMax}]`);
        const checkElements = rangeMin && rangeMax && priceMin && priceMax;
        if (
          checkElements &&
          rangeMin.hasAttribute(selectors$u.rangeMin) &&
          rangeMax.hasAttribute(selectors$u.rangeMax)
        ) {
          const priceMinValue = parseInt(priceMin.placeholder);
          const priceMaxValue = parseInt(priceMax.placeholder);
          const rangeMinValue = parseInt(rangeMin.getAttribute(selectors$u.rangeMin));
          const rangeMaxValue = parseInt(rangeMax.getAttribute(selectors$u.rangeMax));
          if (priceMinValue !== rangeMinValue || priceMaxValue !== rangeMaxValue) {
            priceMin.value = rangeMinValue;
            priceMax.value = rangeMaxValue;
            this.filtering(e);
          }
        }
      }
    }
    /**
     * Update filter on last clicked element
     * @param {Object} e
     */ updateFilterFromUrl(e) {
      const target = e.target;
      if (
        target.matches(selectors$u.filterUpdateUrlButton) ||
        (target.closest(selectors$u.filterUpdateUrlButton) && target)
      ) {
        e.preventDefault();
        const button = target.matches(selectors$u.filterUpdateUrlButton)
          ? target
          : target.closest(selectors$u.filterUpdateUrlButton);
        this.filtering(e, button.getAttribute("href"));
      }
    }
    /**
     * Add filters to history api
     *
     * @param {Object} e
     * @param {String} replaceHref
     */ addToHistory(e, replaceHref = "") {
      const sortValue = this.sort ? this.sort.getAttribute(selectors$u.dataSort) : "";
      if (!e || (e && e.type !== "popstate")) {
        if (replaceHref === "") {
          const searchParams = new window.URL(window.location.href).searchParams;
          const filterUrlParams = Object.fromEntries(searchParams);
          const filterUrlRemoveString = searchParams.toString();
          if (
            filterUrlRemoveString.includes("filter.") ||
            filterUrlRemoveString.includes("sort_by") ||
            filterUrlRemoveString.includes("page")
          ) {
            for (const key in filterUrlParams) {
              if (key.includes("filter.") || key.includes("sort_by") || key.includes("page")) {
                searchParams.delete(key);
              }
            }
          }
          if (this.form) {
            const formParams = new URLSearchParams(new FormData(this.form));
            for (let [key, val] of formParams.entries()) {
              if (key.includes("filter.") && val) {
                searchParams.append(key, val);
              }
            }
            // if submitted price equal to price range min and max remove price parameters
            const rangeMin = this.form.querySelector(`[${selectors$u.rangeMin}]`);
            const rangeMax = this.form.querySelector(`[${selectors$u.rangeMax}]`);
            const priceMin = this.form.querySelector(`[${selectors$u.priceMin}]`);
            const priceMax = this.form.querySelector(`[${selectors$u.priceMax}]`);
            const checkElements = rangeMin && rangeMax && priceMin && priceMax;
            if (
              checkElements &&
              rangeMin.hasAttribute(selectors$u.rangeMinDefault) &&
              rangeMax.hasAttribute(selectors$u.rangeMaxDefault)
            ) {
              const rangeMinDefault = parseFloat(rangeMin.getAttribute(selectors$u.rangeMinDefault), 10);
              const rangeMaxDefault = parseFloat(rangeMax.getAttribute(selectors$u.rangeMaxDefault), 10);
              const priceMinValue =
                priceMin.value === "" ? parseFloat(priceMin.placeholder, 10) : parseFloat(priceMin.value, 10);
              const priceMaxValue =
                priceMax.value === "" ? parseFloat(priceMax.placeholder, 10) : parseFloat(priceMax.value, 10);
              if (priceMinValue <= rangeMinDefault && priceMaxValue >= rangeMaxDefault) {
                searchParams.delete("filter.v.price.gte");
                searchParams.delete("filter.v.price.lte");
              }
            }
          }
          if (sortValue || (e && e.detail && e.detail.href)) {
            const sortString = sortValue ? sortValue : e.detail.params;
            searchParams.set("sort_by", sortString);
          }
          const filterUrlString = searchParams.toString();
          const filterNewParams = filterUrlString ? `?${filterUrlString}` : location.pathname;
          window.history.pushState(null, "", filterNewParams);
          return;
        }
        window.history.pushState(null, "", replaceHref);
      }
    }
    /**
     * Get filter result and append them to their holders
     */ getFilterResult() {
      this.productsContainer.classList.add(classes$j.classLoading);
      this.getGridValues();
      // use the section_id to target the collection section and exclude other sections on the page
      const url = new window.URL(window.location.href);
      const params = url.searchParams;
      params.set("section_id", this.section.id);
      fetch(`${window.location.pathname}${url.search}`)
        .then((response) => response.text())
        .then((response) => {
          const responseHolder = document.createElement("div");
          responseHolder.innerHTML = response;
          if (this.sidebar) {
            this.sidebar.innerHTML = responseHolder.querySelector(selectors$u.collectionSidebar).innerHTML;
          }
          if (this.activeFiltersCount) {
            this.activeFiltersCount.innerHTML = responseHolder.querySelector(selectors$u.activeFiltersCount).innerHTML;
          }
          this.productsContainer.innerHTML = responseHolder.querySelector(selectors$u.productsContainer).innerHTML;
          // Show active filters holder
          this.activeFiltersHolder.innerHTML = responseHolder.querySelector(selectors$u.activeFiltersHolder).innerHTML;
          this.activeFiltersHolder.parentNode.classList.toggle(
            classes$j.classHidden,
            this.activeFiltersHolder.innerHTML === "",
          );
          if (this.productsCount) {
            this.productsCount.innerHTML = responseHolder.querySelector(selectors$u.productsCount).innerHTML;
          }
          this.setGridValues();
          this.refreshFunctionalities();
          setTimeout(() => {
            this.productsContainer.classList.remove(classes$j.classLoading);
          }, times.loadingDelay);
        });
    }
    /**
     * Refresh functionalities
     */ refreshFunctionalities() {
      // Init range slider
      this.form = this.container.querySelector(selectors$u.form);
      if (this.form) {
        new RangeSlider(this.form);
        this.form.addEventListener("theme:range:update", (e) => this.updateRange(e));
      }
      // Init filters
      const filters = this.container.querySelectorAll(selectors$u.filtersWrappper);
      filters.forEach((filter) => {
        new Filters(filter, true);
      });
      // Init accordions
      const accordions = this.container.querySelectorAll(selectors$u.accordionBody);
      accordions.forEach((accordion) => {
        new Accordion(accordion);
      });
      // Init siblings
      new Siblings(this.container);
      // Color swatches tooltips
      if (this.sidebar) {
        makeSwappers(this.sidebar);
      }
      this.showAllOptions();
    }
    // Get grid values
    getGridValues() {
      if (this.layoutLarge) {
        this.layoutLargeValue = this.layoutLarge.getAttribute(selectors$u.gridLarge);
      }
      if (this.layoutSmall) {
        this.layoutSmallValue = this.layoutSmall.getAttribute(selectors$u.gridSmall);
      }
    }
    // Set grid values on AJAX
    setGridValues() {
      if (this.layoutLarge) {
        this.layoutLarge = this.container.querySelector(`[${selectors$u.gridLarge}]`);
        this.layoutLarge.setAttribute(selectors$u.gridLarge, this.layoutLargeValue);
      }
      if (this.layoutSmall) {
        this.layoutSmall = this.container.querySelector(`[${selectors$u.gridSmall}]`);
        this.layoutSmall.setAttribute(selectors$u.gridSmall, this.layoutSmallValue);
      }
    }
    // Show all options if in the filter have selected option but it is hidden
    showAllOptions() {
      const checkedOptions = this.container.querySelectorAll(selectors$u.checkedOption);
      checkedOptions.forEach((option) => {
        if (
          option.closest(selectors$u.optionHolder) &&
          option.closest(selectors$u.optionHolder).classList.contains(classes$j.classHidden)
        ) {
          const button = option.closest(selectors$u.accordionBody).nextElementSibling;
          if (!button.classList.contains(selectors$u.classHidden)) {
            button.dispatchEvent(new Event("click"));
          }
        }
      });
    }
    /**
     * Filtering method and scroll at the top on the section
     * @param {Object} e
     * @param {String} replaceHref
     */ filtering(e, replaceHref = "") {
      if (e.state === null) return; // skip when we update the url with a button with href="#id" used for link
      // Scroll to filter tools
      const headerH = this.headerIsSticky
        ? document.querySelector(selectors$u.headerHeight).getBoundingClientRect().height
        : 0;
      const scrollToElement = this.container.offsetTop - headerH;
      let options = {
        root: null,
        rootMargin: `${headerH}px`,
        threshold: 1.0,
      };
      const handleFilterAndScroll = (entries) => {
        const [entry] = entries;
        setTimeout(
          () => {
            this.addToHistory(e, replaceHref);
            this.getFilterResult();
          },
          entry.isIntersecting ? 10 : times.scrollTime,
        );
        observer.unobserve(this.productsContainer);
        if (entry.isIntersecting) return;
        window.scrollTo({
          top: scrollToElement,
          left: 0,
          behavior: "smooth",
        });
      };
      const observer = new IntersectionObserver(handleFilterAndScroll, options);
      observer.observe(this.productsContainer);
    }
    constructor(section) {
      this.section = section;
      this.container = this.section.container;
      this.sidebar = this.container.querySelector(selectors$u.collectionSidebar);
      this.form = section.container.querySelector(selectors$u.form);
      this.sort = this.container.querySelector(`[${selectors$u.dataSort}]`);
      this.productsContainer = this.container.querySelector(selectors$u.productsContainer);
      this.activeFiltersHolder = this.container.querySelector(selectors$u.activeFiltersHolder);
      this.activeFiltersCount = this.container.querySelector(selectors$u.activeFiltersCount);
      this.productsCount = this.container.querySelector(selectors$u.productsCount);
      this.headerIsSticky = document.querySelector(selectors$u.headerSticky) !== null;
      this.layoutLarge = this.container.querySelector(`[${selectors$u.gridLarge}]`);
      this.layoutSmall = this.container.querySelector(`[${selectors$u.gridSmall}]`);
      if (this.productsContainer && this.sidebar) {
        this.init();
      }
      if (this.sort) {
        this.container.addEventListener("theme:form:filter", (e) => this.filtering(e));
      }
      if (this.sidebar || this.sort) {
        window.addEventListener("popstate", (e) => this.filtering(e));
      }
    }
  };
  const collectionFiltersForm = {
    onLoad() {
      this.filterForm = new FiltersForm(this);
    },
    onUnload() {
      if (this.filterForm && typeof this.filterForm.unload === "function") {
        this.filterForm.unload();
      }
    },
  };

  register("search-page", [collectionFiltersSidebar, collectionFiltersForm, swatchGridSection, accordion]);
  if (!customElements.get("popout-select")) {
    customElements.define("popout-select", PopoutSelect);
  }
  if (!customElements.get("radio-swatch")) {
    customElements.define("radio-swatch", RadioSwatch);
  }
  if (!customElements.get("product-grid-item")) {
    customElements.define("product-grid-item", ProductGridItem);
  }
  if (!customElements.get("product-grid-item-variant")) {
    customElements.define("product-grid-item-variant", ProductGridItemVariant);
  }
  if (!customElements.get("product-grid-item-image")) {
    customElements.define("product-grid-item-image", ProductGridItemImage);
  }

  const selectors$t = {
    zoomImage: "[data-image-zoom]",
    modalContainer: "[data-modal-container]",
    attrUnique: "data-unique",
    image: "data-src",
  };
  let GalleryZoom = class GalleryZoom {
    init() {
      this.triggers.forEach((trigger) => {
        const unique = trigger.getAttribute(selectors$t.attrUnique);
        const modalIsAdded = this.modalContainer.querySelector(`#zoom-${unique}`);
        if (modalIsAdded) {
          const newModal = this.container.querySelector(`#zoom-${unique}`);
          if (newModal) {
            modalIsAdded.parentNode.removeChild(modalIsAdded);
            this.modalContainer.appendChild(newModal);
          }
        }
        MicroModal.init({
          disableScroll: true,
          openTrigger: `data-popup-${unique}`,
          onShow: (modal) => {
            var images = modal.querySelectorAll(`[${selectors$t.image}]`, modal);
            images.forEach((image) => {
              if (image.getAttribute("src") === null) {
                const bigImage = image.getAttribute(selectors$t.image);
                image.setAttribute("src", bigImage);
              }
            });
          },
          onClose: (modal, el, event) => {
            event.preventDefault();
          },
        });
      });
    }
    constructor(container) {
      this.container = container;
      this.triggers = this.container.querySelectorAll(selectors$t.zoomImage);
      this.modalContainer = document.querySelector(selectors$t.modalContainer);
      this.init();
    }
  };
  const galleryZoomSection = {
    onLoad() {
      new GalleryZoom(this.container);
    },
  };

  register("gallery", [galleryZoomSection, popupVideoSection, customScrollbar]);

  const tokensReducer = (acc, token) => {
    const { el, elStyle, elHeight, rowsLimit, rowsWrapped, options } = acc;
    let oldBuffer = acc.buffer;
    let newBuffer = oldBuffer;
    if (rowsWrapped === rowsLimit + 1) {
      return {
        ...acc,
      };
    }
    const textBeforeWrap = oldBuffer;
    let newRowsWrapped = rowsWrapped;
    let newHeight = elHeight;
    el.innerHTML = newBuffer = oldBuffer.length
      ? `${oldBuffer}${options.delimiter}${token}${options.replaceStr}`
      : `${token}${options.replaceStr}`;
    if (parseFloat(elStyle.height) > parseFloat(elHeight)) {
      newRowsWrapped++;
      newHeight = elStyle.height;
      if (newRowsWrapped === rowsLimit + 1) {
        el.innerHTML = newBuffer =
          textBeforeWrap[textBeforeWrap.length - 1] === "." && options.replaceStr === "..."
            ? `${textBeforeWrap}..`
            : `${textBeforeWrap}${options.replaceStr}`;
        return {
          ...acc,
          elHeight: newHeight,
          rowsWrapped: newRowsWrapped,
        };
      }
    }
    el.innerHTML = newBuffer = textBeforeWrap.length ? `${textBeforeWrap}${options.delimiter}${token}` : `${token}`;
    return {
      ...acc,
      buffer: newBuffer,
      elHeight: newHeight,
      rowsWrapped: newRowsWrapped,
    };
  };
  const ellipsis = (selector = "", rows = 1, options = {}) => {
    const defaultOptions = {
      replaceStr: "...",
      debounceDelay: 250,
      delimiter: " ",
    };
    const opts = {
      ...defaultOptions,
      ...options,
    };
    const elements =
      selector &&
      (selector instanceof NodeList
        ? selector
        : selector.nodeType === 1 // if node type is Node.ELEMENT_NODE
          ? [selector] // wrap it in (NodeList) if it is a single node
          : document.querySelectorAll(selector));
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const elementHtml = el.innerHTML;
      const commentRegex = /<!--[\s\S]*?-->/g;
      const htmlWithoutComments = elementHtml.replace(commentRegex, "");
      const splittedText = htmlWithoutComments.split(opts.delimiter);
      el.innerHTML = "";
      const elStyle = window.getComputedStyle(el);
      splittedText.reduce(tokensReducer, {
        el,
        buffer: el.innerHTML,
        elStyle,
        elHeight: 0,
        rowsLimit: rows,
        rowsWrapped: 0,
        options: opts,
      });
    }
  };

  function isTouch() {
    const isTouch1 = "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    document.documentElement.classList.toggle("supports-touch", isTouch1);
    return isTouch1;
  }
  isTouch();

  let modelJsonSections = {};
  let models = {};
  let xrButtons = {};
  const selectors$s = {
    productSlideshow: "[data-product-slideshow]",
    productXr: "[data-shopify-xr]",
    dataMediaId: "data-media-id",
    dataModelId: "data-model-id",
    modelViewer: "model-viewer",
    dataModel3d: "data-shopify-model3d-id",
    modelJson: "#ModelJson-",
  };
  function initSectionModels(modelViewerContainer, sectionId) {
    modelJsonSections[sectionId] = {
      loaded: false,
    };
    const mediaId = modelViewerContainer.getAttribute(selectors$s.dataMediaId);
    const modelViewerElement = modelViewerContainer.querySelector(selectors$s.modelViewer);
    const modelId = modelViewerElement.getAttribute(selectors$s.dataModelId);
    if (modelViewerContainer.closest(selectors$s.productSlideshow) !== null) {
      const xrButton = modelViewerContainer
        .closest(selectors$s.productSlideshow)
        .parentElement.querySelector(selectors$s.productXr);
      xrButtons[sectionId] = {
        $element: xrButton,
        defaultId: modelId,
      };
    }
    models[mediaId] = {
      modelId: modelId,
      mediaId: mediaId,
      sectionId: sectionId,
      $container: modelViewerContainer,
      $element: modelViewerElement,
    };
    window.Shopify.loadFeatures([
      {
        name: "shopify-xr",
        version: "1.0",
        onLoad: setupShopifyXr,
      },
      {
        name: "model-viewer-ui",
        version: "1.0",
        onLoad: setupModelViewerUi,
      },
    ]);
  }
  function setupShopifyXr(errors) {
    if (errors) {
      console.warn(errors);
      return;
    }
    if (!window.ShopifyXR) {
      document.addEventListener("shopify_xr_initialized", function () {
        setupShopifyXr();
      });
      return;
    }
    for (const sectionId in modelJsonSections) {
      if (modelJsonSections.hasOwnProperty(sectionId)) {
        const modelSection = modelJsonSections[sectionId];
        if (modelSection.loaded) continue;
        const modelJson = document.querySelector(`${selectors$s.modelJson}${sectionId}`);
        if (modelJson) {
          window.ShopifyXR.addModels(JSON.parse(modelJson.innerHTML));
          modelSection.loaded = true;
        }
      }
    }
    window.ShopifyXR.setupXRElements();
  }
  function setupModelViewerUi(errors) {
    if (errors) {
      console.warn(errors);
      return;
    }
    for (const key in models) {
      if (models.hasOwnProperty(key)) {
        const model = models[key];
        if (!model.modelViewerUi) {
          model.modelViewerUi = new Shopify.ModelViewerUI(model.$element);
        }
        setupModelViewerListeners(model);
      }
    }
  }
  function setupModelViewerListeners(model) {
    const xrButton = xrButtons[model.sectionId];
    model.$container.addEventListener("pause", function () {
      if (model.modelViewerUi.pause) {
        model.modelViewerUi.pause();
      }
    });
    model.$container.addEventListener("play", function () {
      if (model.modelViewerUi.play) {
        model.modelViewerUi.play();
        if (xrButton && xrButton.$element && model && model.modelId && selectors$s.dataModel3d) {
          xrButton.$element.setAttribute(selectors$s.dataModel3d, model.modelId);
        }
      }
    });
    model.$element.addEventListener("shopify_model_viewer_ui_toggle_play", () => {
      model.$container.dispatchEvent(new CustomEvent("theme:media:play"));
    });
    model.$element.addEventListener("shopify_model_viewer_ui_toggle_pause", () => {
      model.$container.dispatchEvent(new CustomEvent("theme:media:pause"));
    });
  }

  async function productNativeVideo(uniqueKey) {
    const playerElement = document.querySelector(`[data-player="${uniqueKey}"]`);
    const videoElement = playerElement.querySelector("video");
    const videoLoad = {
      name: "video-ui",
      version: "1.0",
    };
    await loadScript(videoLoad);
    const player = new window.Shopify.Plyr(videoElement);
    playerElement.addEventListener("pause", () => {
      if (player.pause) {
        player.pause();
      }
    });
    playerElement.addEventListener("play", () => {
      try {
        if (player.play) {
          // Check if it is paused to avoid playing an already playing video which sometimes results in error
          if (player.paused) {
            player.play();
          }
        } else {
          player.addEventListener("onReady", () => {
            player.play();
          });
        }
      } catch (e) {
        console.warn(e);
      }
    });
    playerElement.addEventListener("destroy", () => {
      try {
        if (player.destroy) {
          player.destroy();
        }
      } catch (e) {
        console.warn(e);
      }
    });
    return player;
  }

  const selectors$r = {
    productSlideshow: "[data-product-slideshow]",
    slideshowMobileStyle: "data-slideshow-mobile-style",
    slideshowDesktopStyle: "data-slideshow-desktop-style",
    productThumbs: "[data-product-thumbs]",
    leftThumbsHolder: "[data-thumbs-holder]",
    thumbImage: "[data-slideshow-thumbnail]",
    mediaSlide: "[data-media-slide]",
    dataMediaId: "data-media-id",
    dataMediaSelect: "data-media-select",
    mediaType: "data-type",
    videoPlayerExternal: '[data-type="external_video"]',
    videoPlayerNative: '[data-type="video"]',
    modelViewer: '[data-type="model"]',
    modelViewerTag: "model-viewer",
    allPlayers: "[data-player]",
    loopVideo: "data-enable-video-looping",
    verticalAlignment: "[data-thumbnails-left]",
    arrowPrev: "[data-thumbs-arrow-prev]",
    arrowNext: "[data-thumbs-arrow-next]",
    aspectRatio: "data-aspect-ratio",
    flickitylockHeight: "flickity-lock-height",
  };
  const classes$i = {
    flickityDisableClass: "flickity-disabled-mobile",
    flickityEnabled: "flickity-enabled",
    selected: "is-selected",
    active: "is-activated",
    show: "show",
    enableVideoDraggable: "enable-video-draggable",
    hide: "hide",
  };
  let Media = class Media {
    init() {
      this.storeEvents();
      this.connectSliderMediaEvents();
      this.detectVideos();
      this.detect3d();
      this.scrollThumbs();
      document.addEventListener("theme:resize:width", () => {
        this.scrollThumbs();
      });
      resolution.onChange(() => {
        this.connectSliderMediaEvents();
      });
    }
    connectSliderMediaEvents() {
      resolution.isMobile() ? this.createMobileSlider() : this.createDesktopSlider();
    }
    createMobileSlider() {
      if (this.hasDesktopSlider && this.flkty) {
        this.destroySlider();
        this.hasDesktopSlider = false;
      }
      // defaults to "thumbs" option
      const mobileOptions = {
        autoPlay: false,
        prevNextButtons: false,
        pageDots: false,
        adaptiveHeight: true,
        accessibility: true,
        watchCSS: false,
        wrapAround: true,
        rightToLeft: window.isRTL,
        dragThreshold: 80,
        contain: true,
        fade: true,
      };
      if (this.mobileStyle == "carousel") {
        mobileOptions.contain = false;
        mobileOptions.dragThreshold = 10;
        mobileOptions.fade = false;
      }
      if (this.mobileStyle == "slideshow") {
        mobileOptions.pageDots = true;
        mobileOptions.fade = false;
        mobileOptions.dragThreshold = 10;
      }
      if (this.mobileStyle == "none") return;
      this.createSlider(mobileOptions);
      this.hasMobileSlider = true;
    }
    createDesktopSlider() {
      if (this.hasMobileSlider && this.flkty) {
        this.destroySlider();
        this.hasMobileSlider = false;
      }
      if (this.desktopStyle == "none") {
        return;
      }
      const desktopOptions = {
        autoPlay: false,
        prevNextButtons: false,
        pageDots: false,
        adaptiveHeight: true,
        accessibility: true,
        watchCSS: false,
        wrapAround: true,
        rightToLeft: window.isRTL,
        dragThreshold: 80,
        contain: true,
        fade: true,
      };
      this.createSlider(desktopOptions);
      this.hasDesktopSlider = true;
    }
    createSlider(options) {
      this.flkty = new Flickity(this.slideshow, options);
      this.flkty.resize();
      this.currentSlide = this.slideshow.querySelectorAll(selectors$r.mediaSlide)[0];
      this.setDraggable();
      this.addEventListeners();
    }
    destroySlider() {
      this.removeEventListeners();
      this.flkty.destroy();
    }
    storeEvents() {
      this.storeFlktyChange = (e) => this.doFlktyChange(e);
      this.storeFlktySettle = (e) => this.doFlktySettle(e);
      this.storeImageChange = (e) => this.doImageChange(e);
      this.storeArrowPrevClick = (e) => this.doArrowPrevClick(e);
      this.storeArrowNextClick = (e) => this.doArrowNextClick(e);
      this.storeThumbClick = (e) => this.doThumbClick(e);
      this.storeThumbContainerScroll = (e) => this.doThumbContainerScroll(e);
    }
    addEventListeners() {
      var ref, ref1, ref2;
      this.flkty.on("change", this.storeFlktyChange);
      this.flkty.on("settle", this.storeFlktySettle);
      this.slideshow.addEventListener("theme:image:change", this.storeImageChange);
      (ref = this.arrowPrev) === null || ref === void 0
        ? void 0
        : ref.addEventListener("click", this.storeArrowPrevClick);
      (ref1 = this.arrowNext) === null || ref1 === void 0
        ? void 0
        : ref1.addEventListener("click", this.storeArrowNextClick);
      (ref2 = this.thumbs) === null || ref2 === void 0
        ? void 0
        : ref2.addEventListener("scroll", this.storeThumbContainerScroll);
      this.thumbImages.forEach((thumb) => {
        thumb.addEventListener("click", this.storeThumbClick);
      });
    }
    removeEventListeners() {
      var ref, ref3, ref4;
      this.flkty.on("change", this.storeFlktyChange);
      this.flkty.on("settle", this.storeFlktySettle);
      this.slideshow.removeEventListener("theme:image:change", this.storeImageChange);
      (ref = this.arrowPrev) === null || ref === void 0
        ? void 0
        : ref.removeEventListener("click", this.storeArrowPrevClick);
      (ref3 = this.arrowNext) === null || ref3 === void 0
        ? void 0
        : ref3.removeEventListener("click", this.storeArrowNextClick);
      (ref4 = this.thumbs) === null || ref4 === void 0
        ? void 0
        : ref4.removeEventListener("scroll", this.storeThumbContainerScroll);
      this.thumbImages.forEach((thumb) => {
        thumb.removeEventListener("click", this.storeThumbClick);
      });
    }
    addMediaEventListeners(media) {
      if (!media) return;
      media.addEventListener("play", () => {
        if (resolution.isMobile() || resolution.isTouch()) {
          this.updateDraggable(false);
        }
      });
      media.addEventListener("pause", () => {
        if (resolution.isMobile() || resolution.isTouch()) {
          this.updateDraggable(true);
        }
      });
    }
    doFlktyChange(index) {
      var ref, ref5;
      // Pause previous slide media
      if (this.mediaType === "model" || this.mediaType === "video" || this.mediaType === "external_video") {
        this.currentSlide.dispatchEvent(new CustomEvent("pause"));
      }
      this.currentSlide = this.flkty.cells[index].element;
      this.slideshow.classList.remove(selectors$r.flickitylockHeight);
      const id = this.currentSlide.getAttribute(selectors$r.dataMediaId);
      const currentThumb =
        (ref = this.thumbWrapper) === null || ref === void 0
          ? void 0
          : ref.querySelector(`[${selectors$r.dataMediaSelect}="${id}"]`);
      (ref5 = this.thumbWrapper) === null || ref5 === void 0
        ? void 0
        : ref5.querySelector(`.${classes$i.active}`).classList.remove(classes$i.active);
      currentThumb === null || currentThumb === void 0 ? void 0 : currentThumb.classList.add(classes$i.active);
      this.scrollThumbs();
      // when swatch images are hidden by specific alt-text, the slider breaks on change so we select the featured variant image to "fix" it
      // Timeout is needed to slow it down a bit until the images refresh and the currentThumb variable has the right value
      setTimeout(() => {
        if (
          (currentThumb === null || currentThumb === void 0
            ? void 0
            : currentThumb.classList.contains(classes$i.hide)) ||
          this.currentSlide.classList.contains(classes$i.hide)
        ) {
          //Select the next visible media - the image may not be apart of any group and is at the end.
          let length = this.flkty.cells.length;
          //Move to index 0 if drag is to the left otherwise increase index
          const moveLeft = this.flkty.dragStartPosition < this.flkty.dragX;
          for (let n = 0; n < length; n++) {
            let position = moveLeft ? index - n : index + n;
            // When index - n is negative add length to wrap
            if (position < 0) position = position + length;
            // When index + n is >= length minus length to wrap
            if (position >= length) position = position - length;
            const mediaSelect = this.flkty.cells[position].element;
            if (!mediaSelect.classList.contains(classes$i.hide)) {
              this.lastMediaSelect = mediaSelect.getAttribute(selectors$r.dataMediaId);
              break;
            }
          }
          if (this.lastMediaSelect) {
            this.slideshow.dispatchEvent(
              new CustomEvent("theme:image:change", {
                detail: {
                  id: this.lastMediaSelect,
                },
              }),
            );
          } else window.location.reload();
        }
      });
    }
    doFlktySettle(index) {
      this.allSlides = this.flkty.cells;
      this.currentSlide = this.flkty.cells[index].element;
      this.setDraggable();
      const isFocusEnabled = document.body.classList.contains(selectors$r.focusEnabled);
      if (isFocusEnabled) this.currentSlide.dispatchEvent(new Event("focus"));
      this.scrollThumbs();
    }
    doImageChange(event) {
      var mediaId = event.detail.id;
      this.lastMediaSelect = mediaId;
      const mediaIdString = `[${selectors$r.dataMediaId}="${mediaId}"]`;
      const matchesMedia = (cell) => {
        return cell.element.matches(mediaIdString);
      };
      const index = this.flkty.cells.findIndex(matchesMedia);
      this.flkty.select(index);
      this.scrollThumbs();
    }
    doThumbContainerScroll() {
      this.scrollThumbs("scroll");
    }
    doArrowPrevClick() {
      this.scrollThumbs("clickPrev");
    }
    doArrowNextClick() {
      this.scrollThumbs("clickNext");
    }
    doThumbClick(event) {
      const id = event.currentTarget.getAttribute(selectors$r.dataMediaSelect);
      this.slideshow.dispatchEvent(
        new CustomEvent("theme:image:change", {
          detail: {
            id: id,
          },
        }),
      );
    }
    setDraggable() {
      if (this.currentSlide) {
        this.mediaType = this.currentSlide.getAttribute(selectors$r.mediaType);
        if (this.mediaType === "model" || this.mediaType === "video" || this.mediaType === "external_video") {
          if (!resolution.isMobile() || !resolution.isTouch()) {
            // Play on Desktop
            this.currentSlide.dispatchEvent(new CustomEvent("play"));
            this.updateDraggable(false);
          } else {
            this.updateDraggable(true); // Triggering this to ensure the first video also has the 'draggable' elements active on Mobile
          }
        } else {
          this.updateDraggable(true);
        }
      }
    }
    updateDraggable(state) {
      if (!this.flkty) return;
      this.flkty.options.draggable = state;
      this.flkty.updateDraggable();
      this.slideshow.classList.toggle(classes$i.enableVideoDraggable, state);
    }
    detect3d() {
      const modelViewerElements = this.container.querySelectorAll(selectors$r.modelViewer);
      if (modelViewerElements) {
        modelViewerElements.forEach((element) => {
          initSectionModels(element, this.section.id);
          element.addEventListener("theme:media:play", () => {
            this.updateDraggable(false);
          });
          element.addEventListener("theme:media:pause", () => {
            this.updateDraggable(true);
          });
        });
        document.addEventListener(
          "shopify_xr_launch",
          function () {
            this.container.querySelectorAll(selectors$r.allPlayers).forEach((player) => {
              player.dispatchEvent(new CustomEvent("pause"));
            });
          }.bind(this),
        );
      }
    }
    detectVideos() {
      const playerElements = this.section.container.querySelectorAll(
        `${selectors$r.videoPlayerExternal}, ${selectors$r.videoPlayerNative}`,
      );
      for (var player of playerElements) {
        const uniqueKey = player.dataset.player;
        const host = player.dataset.host;
        let videoPlayerPromise;
        if (host === "youtube") {
          // Youtube
          videoPlayerPromise = embedYoutube(uniqueKey);
        } else if (host === "vimeo") {
          // Vimeo
          videoPlayerPromise = embedVimeo(uniqueKey);
        } else {
          // Native video
          videoPlayerPromise = productNativeVideo(uniqueKey);
        }
        if (this.loopVideo === true) {
          videoPlayerPromise
            .then((videoPlayer) => {
              if (host) {
                // Youtube and Vimeo
                return _setToLoop(videoPlayer, host);
              } else {
                // Native video
                videoPlayer.loop = true;
                return videoPlayer;
              }
            })
            .catch((err) => {
              console.error(err);
            });
        }
        this.addMediaEventListeners(player);
      }
    }
    pauseAllMedia() {
      const all = this.container.querySelector(selectors$r.mediaSlide);
      all.dispatchEvent(new CustomEvent("pause"));
    }
    pauseOtherMedia(uniqueKey) {
      const otherMedia = this.container.querySelector(`${selectors$r.mediaSlide}:not([data-player="${uniqueKey}"])`);
      otherMedia.dispatchEvent(new CustomEvent("pause"));
    }
    destroy() {
      this.container.querySelectorAll(selectors$r.allPlayers).forEach((player) => {
        player.dispatchEvent(new CustomEvent("destroy"));
      });
    }
    scrollThumbs(event) {
      this.thumbs = this.container.querySelector(selectors$r.productThumbs);
      if (this.thumbs) {
        this.thumb = this.thumbs.querySelector(`.${classes$i.active}`);
        this.thumbItems = this.container.querySelectorAll(selectors$r.thumbImage);
        this.lastThumb = this.thumbItems[this.thumbItems.length - 1];
        if (!this.thumb) return;
        this.thumbsScrollTop = this.thumbs.scrollTop;
        this.thumbsScrollLeft = this.thumbs.scrollLeft;
        this.thumbsWidth = this.thumbs.offsetWidth;
        this.thumbsHeight = this.slideshow.offsetWidth / this.thumb.getAttribute(selectors$r.aspectRatio);
        this.thumbsPositionBottom = this.thumbsScrollTop + this.thumbsHeight;
        this.thumbsPositionRight = this.thumbsScrollLeft + this.thumbsWidth;
        this.checkThumbPositions();
        this.toggleToActiveThumb(event);
        this.toggleArrows();
      }
    }
    checkThumbPositions() {
      this.thumbWidth = this.thumb.offsetWidth;
      this.thumbHeight = this.thumb.offsetHeight;
      this.thumbPosTop = this.thumb.offsetTop;
      this.thumbPosLeft = this.thumb.offsetLeft;
      this.lastThumbRightPos = this.lastThumb.offsetLeft + this.thumbWidth;
      this.lastThumbBottomPos = this.lastThumb.offsetTop + this.thumbHeight;
      this.scrollTopPosition = this.thumbPosTop + this.thumbHeight / 2 - this.thumbsHeight / 2;
      this.scrollLeftPosition = this.thumbPosLeft + this.thumbWidth / 2 - this.thumbsWidth / 2;
      this.topCheck = this.thumbsScrollTop > 0;
      this.bottomCheck = this.thumbsPositionBottom < this.lastThumbBottomPos;
      this.leftCheck = this.thumbsScrollLeft > 0;
      this.rightCheck = this.thumbsPositionRight < this.lastThumbRightPos;
      this.verticalCheck = this.bottomCheck || this.topCheck;
      this.horizontalCheck = this.rightCheck || this.leftCheck;
    }
    toggleToActiveThumb(event) {
      if (event !== "scroll") {
        if (event == "clickPrev") {
          if (this.verticalCheck) {
            this.scrollTopPosition = this.thumbsScrollTop - this.thumbsHeight;
            this.scrollLeftPosition = 0;
          } else {
            this.scrollTopPosition = 0;
            this.scrollLeftPosition = this.thumbsScrollLeft - this.thumbsWidth;
          }
        }
        if (event == "clickNext") {
          if (this.verticalCheck) {
            this.scrollTopPosition = this.thumbsScrollTop + this.thumbsHeight;
            this.scrollLeftPosition = 0;
          } else {
            this.scrollTopPosition = 0;
            this.scrollLeftPosition = this.thumbsScrollLeft + this.thumbsWidth;
          }
        }
        this.thumbs.scrollTo({
          top: this.scrollTopPosition,
          left: this.scrollLeftPosition,
          behavior: "smooth",
        });
      }
    }
    toggleArrows() {
      if (this.verticalCheck || (this.verticalAlignment && !this.verticalCheck)) {
        this.arrowPrev.classList.toggle(classes$i.show, this.topCheck);
        this.arrowNext.classList.toggle(classes$i.show, this.bottomCheck);
      }
      if (this.horizontalCheck || (!this.verticalAlignment && !this.horizontalCheck)) {
        this.arrowPrev.classList.toggle(classes$i.show, this.leftCheck);
        this.arrowNext.classList.toggle(classes$i.show, this.rightCheck);
      }
    }
    constructor(section) {
      var ref, ref6;
      this.section = section;
      this.container = section.container;
      this.slideshow = this.container.querySelector(selectors$r.productSlideshow);
      this.mobileStyle =
        ((ref = this.slideshow) === null || ref === void 0
          ? void 0
          : ref.getAttribute(selectors$r.slideshowMobileStyle)) || "none";
      this.desktopStyle =
        ((ref6 = this.slideshow) === null || ref6 === void 0
          ? void 0
          : ref6.getAttribute(selectors$r.slideshowDesktopStyle)) || "none";
      this.arrowPrev = this.container.querySelector(selectors$r.arrowPrev);
      this.arrowNext = this.container.querySelector(selectors$r.arrowNext);
      this.leftThumbsHolder = this.container.querySelector(selectors$r.leftThumbsHolder);
      this.thumbWrapper = this.container.querySelector(selectors$r.productThumbs);
      this.thumbImages = this.container.querySelectorAll(selectors$r.thumbImage);
      this.loopVideo = this.container.getAttribute(selectors$r.loopVideo) === "true";
      this.verticalAlignment = Boolean(this.container.querySelector(selectors$r.verticalAlignment));
      this.flkty = null;
      this.lastMediaSelect = null;
      this.thumbs = this.container.querySelector(selectors$r.productThumbs);
      this.currentSlide = null;
      this.mediaType = null;
      this.hasMobileSlider = false;
      this.hasDesktopSlider = false;
      this.init();
    }
  };
  function _setToLoop(player, host) {
    if (host === "youtube") {
      player.addEventListener("onStateChange", (event) => {
        if (event.data === 0) {
          // video is over, replay
          event.target.playVideo();
        }
      });
    } else if (host === "vimeo") {
      player.on("ended", () => {
        // video is over, replay
        player.play();
      });
    }
    return player;
  }

  const selectors$q = {
    pickupContainer: "data-store-availability-container",
    shopifySection: "[data-api-content]",
    drawer: "[data-pickup-drawer]",
    drawerOpen: "[data-pickup-drawer-open]",
    drawerClose: "[data-pickup-drawer-close]",
    drawerBody: "[data-pickup-body]",
  };
  const classes$h = {
    isVisible: "drawer--visible",
    isHidden: "hide",
    isPickupVisible: "is-pickup-visible",
  };
  let sections$5 = {};
  let PickupAvailability = class PickupAvailability {
    fetchPickupAvailability(event) {
      const container = this.container.querySelector(`[${selectors$q.pickupContainer}]`);
      if (!container) return;
      const variantID =
        event && event.detail.variant ? event.detail.variant.id : container.getAttribute(selectors$q.pickupContainer);
      if (event && !event.detail.variant) {
        container.classList.add(classes$h.isHidden);
        return;
      }
      if (variantID) {
        fetch(`${window.theme.routes.root_url}variants/${variantID}/?section_id=api-pickup-availability`)
          .then(this.handleErrors)
          .then((response) => response.text())
          .then((text) => {
            const pickupAvailabilityHTML = new DOMParser()
              .parseFromString(text, "text/html")
              .querySelector(selectors$q.shopifySection).innerHTML;
            container.innerHTML = pickupAvailabilityHTML;
            container.classList.remove(classes$h.isHidden);
            this.drawer = this.container.querySelector(selectors$q.drawer);
            this.buttonDrawerOpen = this.container.querySelector(selectors$q.drawerOpen);
            this.buttonDrawerClose = this.container.querySelectorAll(selectors$q.drawerClose);
            this.drawerBody = this.container.querySelector(selectors$q.drawerBody);
            if (this.buttonDrawerOpen) {
              this.buttonDrawerOpen.addEventListener("click", () => this.openDrawer());
            }
            if (this.buttonDrawerClose.length) {
              this.buttonDrawerClose.forEach((element) => {
                element.addEventListener("click", () => this.closeDrawer());
              });
            }
          })
          .catch((e) => {
            console.error(e);
          });
      }
    }
    openDrawer() {
      if (this.drawer) {
        document.body.classList.add(classes$h.isPickupVisible);
        this.drawer.classList.add(classes$h.isVisible);
        this.drawer.dispatchEvent(
          new CustomEvent("theme:scroll:lock", {
            bubbles: true,
          }),
        );
        this.drawerBody.dispatchEvent(
          new CustomEvent("theme:scroll:lock", {
            bubbles: true,
          }),
        );
      }
    }
    closeDrawer() {
      if (this.drawer) {
        document.body.classList.remove(classes$h.isPickupVisible);
        this.drawer.classList.remove(classes$h.isVisible);
        this.drawer.dispatchEvent(
          new CustomEvent("theme:scroll:unlock", {
            bubbles: true,
          }),
        );
        this.drawerBody.dispatchEvent(
          new CustomEvent("theme:scroll:unlock", {
            bubbles: true,
          }),
        );
      }
    }
    handleErrors(response) {
      if (!response.ok) {
        return response.json().then(function (json) {
          const e = new FetchError({
            status: response.statusText,
            headers: response.headers,
            json: json,
          });
          throw e;
        });
      }
      return response;
    }
    constructor(section) {
      this.container = section.container;
      this.drawer = null;
      this.buttonDrawerOpen = null;
      this.buttonDrawerClose = null;
      this.drawerBody = null;
      this.fetchPickupAvailability();
      this.container.addEventListener("theme:variant:change", (event) => this.fetchPickupAvailability(event));
    }
  };
  const pickupAvailability = {
    onLoad() {
      sections$5[this.id] = new PickupAvailability(this);
    },
  };

  function Listeners() {
    this.entries = [];
  }
  Listeners.prototype.add = function (element, event, fn) {
    this.entries.push({
      element: element,
      event: event,
      fn: fn,
    });
    element.addEventListener(event, fn);
  };
  Listeners.prototype.removeAll = function () {
    this.entries = this.entries.filter(function (listener) {
      listener.element.removeEventListener(listener.event, listener.fn);
      return false;
    });
  };

  /**
   * Convert the Object (with 'name' and 'value' keys) into an Array of values, then find a match & return the variant (as an Object)
   * @param {Object} product Product JSON object
   * @param {Object} collection Object with 'name' and 'value' keys (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
   * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
   */ function getVariantFromSerializedArray(product, collection) {
    _validateProductStructure(product);
    // If value is an array of options
    var optionArray = _createOptionArrayFromOptionCollection(product, collection);
    return getVariantFromOptionArray(product, optionArray);
  }
  /**
   * Find a match in the project JSON (using Array with option values) and return the variant (as an Object)
   * @param {Object} product Product JSON object
   * @param {Array} options List of submitted values (e.g. ['36', 'Black'])
   * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
   */ function getVariantFromOptionArray(product, options) {
    _validateProductStructure(product);
    _validateOptionsArray(options);
    var result = product.variants.filter(function (variant) {
      return options.every(function (option, index) {
        return variant.options[index] === option;
      });
    });
    return result[0] || null;
  }
  /**
   * Creates an array of selected options from the object
   * Loops through the project.options and check if the "option name" exist (product.options.name) and matches the target
   * @param {Object} product Product JSON object
   * @param {Array} collection Array of object (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
   * @returns {Array} The result of the matched values. (e.g. ['36', 'Black'])
   */ function _createOptionArrayFromOptionCollection(product, collection) {
    _validateProductStructure(product);
    _validateSerializedArray(collection);
    var optionArray = [];
    collection.forEach(function (option) {
      for (var i = 0; i < product.options.length; i++) {
        var name = product.options[i].name || product.options[i];
        if (name.toLowerCase() === option.name.toLowerCase()) {
          optionArray[i] = option.value;
          break;
        }
      }
    });
    return optionArray;
  }
  /**
   * Check if the product data is a valid JS object
   * Error will be thrown if type is invalid
   * @param {object} product Product JSON object
   */ function _validateProductStructure(product) {
    if (typeof product !== "object") {
      throw new TypeError(product + " is not an object.");
    }
    if (Object.keys(product).length === 0 && product.constructor === Object) {
      throw new Error(product + " is empty.");
    }
  }
  /**
   * Validate the structure of the array
   * It must be formatted like jQuery's serializeArray()
   * @param {Array} collection Array of object [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }]
   */ function _validateSerializedArray(collection) {
    if (!Array.isArray(collection)) {
      throw new TypeError(collection + " is not an array.");
    }
    if (collection.length === 0) {
      throw new Error(collection + " is empty.");
    }
    if (collection[0].hasOwnProperty("name")) {
      if (typeof collection[0].name !== "string") {
        throw new TypeError(
          "Invalid value type passed for name of option " + collection[0].name + ". Value should be string.",
        );
      }
    } else {
      throw new Error(collection[0] + "does not contain name key.");
    }
  }
  /**
   * Validate the structure of the array
   * It must be formatted as list of values
   * @param {Array} collection Array of object (e.g. ['36', 'Black'])
   */ function _validateOptionsArray(options) {
    if (Array.isArray(options) && typeof options[0] === "object") {
      throw new Error(options + "is not a valid array of options.");
    }
  }

  var selectors$p = {
    idInput: '[name="id"]',
    planInput: '[name="selling_plan"]',
    optionInput: '[name^="options"]',
    quantityInput: '[name="quantity"]',
    propertyInput: '[name^="properties"]',
  };
  /**
   * Constructor class that creates a new instance of a product form controller.
   *
   * @param {Element} element - the outer wrapper containing the product form and all related input elements
   * @param {Object} form - DOM element which is equal to the <form> node to submit the product form inputs
   * @param {Object} product - A product object
   * @param {Object} options - Optional options object
   * @param {Function} options.onOptionChange - Callback for whenever an option input changes
   * @param {Function} options.onPlanChange - Callback for changes to name=selling_plan
   * @param {Function} options.onQuantityChange - Callback for whenever an quantity input changes
   * @param {Function} options.onPropertyChange - Callback for whenever a property input changes
   * @param {Function} options.onFormSubmit - Callback for whenever the product form is submitted
   */ let ProductFormReader = class ProductFormReader {
    /**
     * Cleans up all event handlers that were assigned when the Product Form was constructed.
     * Useful for use when a section needs to be reloaded in the theme editor.
     */ destroy() {
      this._listeners.removeAll();
    }
    /**
     * Getter method which returns the array of currently selected option values
     *
     * @returns {Array} An array of option values
     */ options() {
      return this._serializeInputValues(this.optionInputs, function (item) {
        var regex = /(?:^(options\[))(.*?)(?:\])/;
        item.name = regex.exec(item.name)[2]; // Use just the value between 'options[' and ']'
        return item;
      });
    }
    /**
     * Getter method which returns the currently selected variant, or `null` if variant
     * doesn't exist.
     *
     * @returns {Object|null} Variant object
     */ variant() {
      const opts = this.options();
      if (opts.length) {
        return getVariantFromSerializedArray(this.product, opts);
      } else {
        return this.product.variants[0];
      }
    }
    /**
     * Getter method which returns the current selling plan, or `null` if plan
     * doesn't exist.
     *
     * @returns {Object|null} Variant object
     */ plan(variant) {
      let plan = {
        allocation: null,
        group: null,
        detail: null,
      };
      const formData = new FormData(this.form);
      const id = formData.get("selling_plan");
      if (variant && variant.selling_plan_allocations && variant.selling_plan_allocations.length > 0) {
        const uniqueVariantSellingPlanGroupIDs = [
          ...new Set(variant.selling_plan_allocations.map((sellingPlan) => sellingPlan.selling_plan_group_id)),
        ];
        const productSubsGroup = this.element.querySelectorAll("[data-subscription-group]");
        if (!productSubsGroup.length) {
          return;
        }
        productSubsGroup.forEach((group) => (group.style.display = "none"));
        uniqueVariantSellingPlanGroupIDs.forEach((groupId) => {
          this.element.querySelector(`[data-selling-plan-group="${groupId}"]`).style.display = "block";
        });
      }
      if (id && variant) {
        plan.allocation = variant.selling_plan_allocations.find(function (item) {
          return item.selling_plan_id.toString() === id.toString();
        });
      }
      if (plan.allocation) {
        plan.group = this.product.selling_plan_groups.find(function (item) {
          return item.id.toString() === plan.allocation.selling_plan_group_id.toString();
        });
      }
      if (plan.group) {
        plan.detail = plan.group.selling_plans.find(function (item) {
          return item.id.toString() === id.toString();
        });
      }
      if (plan && plan.allocation && plan.detail && plan.allocation) {
        return plan;
      } else return null;
    }
    /**
     * Getter method which returns a collection of objects containing name and values
     * of property inputs
     *
     * @returns {Array} Collection of objects with name and value keys
     */ properties() {
      return this._serializeInputValues(this.propertyInputs, function (item) {
        var regex = /(?:^(properties\[))(.*?)(?:\])/;
        item.name = regex.exec(item.name)[2]; // Use just the value between 'properties[' and ']'
        return item;
      });
    }
    /**
     * Getter method which returns the current quantity or 1 if no quantity input is
     * included in the form
     *
     * @returns {Array} Collection of objects with name and value keys
     */ quantity() {
      return this.quantityInputs[0] ? Number.parseInt(this.quantityInputs[0].value, 10) : 1;
    }
    getFormState() {
      const variant = this.variant();
      return {
        options: this.options(),
        variant: variant,
        properties: this.properties(),
        quantity: this.quantity(),
        plan: this.plan(variant),
      };
    }
    // Private Methods
    // -----------------------------------------------------------------------------
    _setIdInputValue(variant) {
      if (variant && variant.id) {
        this.variantElement.value = variant.id.toString();
      } else {
        this.variantElement.value = "";
      }
      this.variantElement.dispatchEvent(new Event("change"));
    }
    _onSubmit(options, event) {
      event.dataset = this.getFormState();
      if (options.onFormSubmit) {
        options.onFormSubmit(event);
      }
    }
    _onOptionChange(event) {
      this._setIdInputValue(event.dataset.variant);
    }
    _onFormEvent(cb) {
      if (typeof cb === "undefined") {
        return Function.prototype;
      }
      return function (event) {
        event.dataset = this.getFormState();
        this._setIdInputValue(event.dataset.variant);
        cb(event);
      }.bind(this);
    }
    _initInputs(selector, cb) {
      var elements = Array.prototype.slice.call(this.element.querySelectorAll(selector));
      return elements.map(
        function (element) {
          this._listeners.add(element, "change", this._onFormEvent(cb));
          return element;
        }.bind(this),
      );
    }
    _serializeInputValues(inputs, transform) {
      return inputs.reduce(function (options, input) {
        if (
          input.checked ||
          (input.type !== "radio" && input.type !== "checkbox") // Or if its any other type of input
        ) {
          options.push(
            transform({
              name: input.name,
              value: input.value,
            }),
          );
        }
        return options;
      }, []);
    }
    _validateProductObject(product) {
      if (typeof product !== "object") {
        throw new TypeError(product + " is not an object.");
      }
      if (typeof product.variants[0].options === "undefined") {
        throw new TypeError(
          "Product object is invalid. Make sure you use the product object that is output from {{ product | json }} or from the http://[your-product-url].js route",
        );
      }
      return product;
    }
    constructor(element, form, product, options) {
      this.element = element;
      this.form = form.tagName == "FORM" ? form : form.querySelector("form");
      this.product = this._validateProductObject(product);
      this.variantElement = this.form.querySelector(selectors$p.idInput);
      options = options || {};
      this.clickedElement = null;
      this._listeners = new Listeners();
      this._listeners.add(this.element, "submit", this._onSubmit.bind(this, options));
      this.optionInputs = this._initInputs(selectors$p.optionInput, options.onOptionChange);
      this.planInputs = this._initInputs(selectors$p.planInput, options.onPlanChange);
      this.quantityInputs = this._initInputs(selectors$p.quantityInput, options.onQuantityChange);
      this.propertyInputs = this._initInputs(selectors$p.propertyInput, options.onPropertyChange);
    }
  };

  const selectors$o = {
    wrapper: "[data-quantity-selector]",
    increase: "[data-increase-quantity]",
    decrease: "[data-decrease-quantity]",
    input: "[data-quantity-input]",
  };
  let Quantity = class Quantity {
    initButtons() {
      this.increase.addEventListener(
        "click",
        function (e) {
          e.preventDefault();
          let v = parseInt(this.input.value, 10);
          v = isNaN(v) ? 0 : v;
          v++;
          this.input.value = v;
          this.input.dispatchEvent(new Event("change"));
        }.bind(this),
      );
      this.decrease.addEventListener(
        "click",
        function (e) {
          e.preventDefault();
          let v = parseInt(this.input.value, 10);
          v = isNaN(v) ? 0 : v;
          v--;
          v = Math.max(this.min, v);
          this.input.value = v;
          this.input.dispatchEvent(new Event("change"));
        }.bind(this),
      );
    }
    constructor(wrapper) {
      this.wrapper = wrapper;
      this.increase = this.wrapper.querySelector(selectors$o.increase);
      this.decrease = this.wrapper.querySelector(selectors$o.decrease);
      this.input = this.wrapper.querySelector(selectors$o.input);
      this.min = parseInt(this.input.getAttribute("min"), 10);
      this.initButtons();
    }
  };
  function initQtySection(container) {
    const quantityWrappers = container.querySelectorAll(selectors$o.wrapper);
    quantityWrappers.forEach((qty) => {
      new Quantity(qty);
    });
  }

  const selectors$n = {
    form: "[data-product-form]",
    optionPosition: "data-option-position",
    optionInput: '[name^="options"], [data-popout-option]',
    selectOptionValue: "data-value",
  };
  const classes$g = {
    soldOut: "sold-out",
    unavailable: "unavailable",
  };
  /**
   * Variant Sellout Precrime Click Preview
   * I think of this like the precrime machine in Minority report.  It gives a preview
   * of every possible click action, given the current form state.  The logic is:
   *
   * for each clickable name=options[] variant selection element
   * find the value of the form if the element were clicked
   * lookup the variant with those value in the product json
   * clear the classes, add .unavailable if it's not found,
   * and add .sold-out if it is out of stock
   *
   * Caveat: we rely on the option position so we don't need
   * to keep a complex map of keys and values.
   */ let SelloutVariants = class SelloutVariants {
    init() {
      this.update();
    }
    update() {
      this.getCurrentState();
      this.optionElements.forEach((el) => {
        const val = el.value || el.getAttribute(selectors$n.selectOptionValue);
        const positionString = el.closest(`[${selectors$n.optionPosition}]`).getAttribute(selectors$n.optionPosition);
        // subtract one because option.position in liquid does not count form zero, but JS arrays do
        const position = parseInt(positionString, 10) - 1;
        let newVals = [...this.selections];
        newVals[position] = val;
        const found = this.productJSON.variants.find((element) => {
          // only return true if every option matches our hypothetical selection
          let perfectMatch = true;
          for (let index = 0; index < newVals.length; index++) {
            if (element.options[index] !== newVals[index]) {
              perfectMatch = false;
            }
          }
          return perfectMatch;
        });
        el.classList.remove(classes$g.soldOut, classes$g.unavailable);
        if (typeof found === "undefined") {
          el.classList.add(classes$g.unavailable);
        } else if (found && found.available === false) {
          el.classList.add(classes$g.soldOut);
        }
      });
    }
    getCurrentState() {
      this.formData = new FormData(this.form);
      this.selections = [];
      for (var value of this.formData.entries()) {
        if (value[0].includes("options[")) {
          // push the current state of the form, dont worry about the group name
          // we will be using the array position instead of the name to match values
          this.selections.push(value[1]);
        }
      }
    }
    constructor(section, productJSON) {
      this.container = section;
      this.productJSON = productJSON;
      this.form = this.container.querySelector(selectors$n.form);
      this.formData = new FormData(this.form);
      this.optionElements = this.container.querySelectorAll(selectors$n.optionInput);
      if (this.productJSON && this.form) {
        this.init();
      }
    }
  };

  const selectors$m = {
    outerSection: "[data-section-id]",
    quickviewModal: "[data-quickview-modal]",
    productFormWrapper: "[data-product-form-wrapper]",
    productForm: "[data-product-form]",
    productSlideshow: "[data-product-slideshow]",
    productSlideshowDesktop: '[data-slideshow-desktop-style="slideshow"]',
    addToCart: "[data-add-to-cart]",
    addToCartText: "[data-add-to-cart-text]",
    comparePrice: "[data-compare-price]",
    buttonsWrapper: "[data-buttons-wrapper]",
    originalSelectorId: "[data-product-select]",
    priceWrapper: "[data-price-wrapper]",
    priceButton: "[data-button-price]",
    productJson: "[data-product-json]",
    productPrice: "[data-product-price]",
    unitPrice: "[data-product-unit-price]",
    unitBase: "[data-product-base]",
    unitWrapper: "[data-product-unit]",
    dataEnableHistoryState: "data-enable-history-state",
    optionPosition: "data-option-position",
    optionValue: "[data-option-value]",
    subPrices: "[data-subscription-watch-price]",
    subSelectors: "[data-subscription-selectors]",
    priceOffWrap: "[data-price-off]",
    priceOffType: "[data-price-off-type]",
    priceOffAmount: "[data-price-off-amount]",
    subsToggle: "[data-toggles-group]",
    subsChild: "data-group-toggle",
    subDescription: "[data-plan-description]",
    remainingCount: "[data-remaining-count]",
    remainingMax: "data-remaining-max",
    remainingWrapper: "[data-remaining-wrapper]",
    remainingJSON: "[data-product-remaining-json]",
    isPreOrder: "[data-product-preorder]",
  };
  const classes$f = {
    hide: "hide",
    variantSoldOut: "variant--soldout",
    variantUnavailable: "variant--unavailable",
    productPriceSale: "product__price--sale",
    remainingLow: "count-is-low",
    remainingIn: "count-is-in",
    remainingOut: "count-is-out",
    remainingUnavailable: "count-is-unavailable",
  };
  let ProductForm = class ProductForm extends HTMLElement {
    connectedCallback() {
      this.outerSection = this.container.closest(selectors$m.outerSection);
      this.quickview = this.container.closest(selectors$m.quickviewModal);
      this.outerWrapper = this.quickview ? this.quickview : this.outerSection;
      this.productFormWrapper = this.container.closest(selectors$m.productFormWrapper);
      this.productFormElement = this.container.querySelector(selectors$m.productForm);
      this.productForm = this.container.querySelector(selectors$m.productForm);
      this.slideshow = this.outerWrapper.querySelector(selectors$m.productSlideshow);
      this.slideshowDesktop = this.outerWrapper.querySelector(selectors$m.productSlideshowDesktop);
      this.enableHistoryState =
        this.outerSection && this.outerSection.hasAttribute(selectors$m.dataEnableHistoryState)
          ? this.outerSection.getAttribute(selectors$m.dataEnableHistoryState) === "true"
          : false;
      this.hasUnitPricing = this.outerWrapper.querySelector(selectors$m.unitWrapper);
      this.subSelectors = this.outerWrapper.querySelector(selectors$m.subSelectors);
      this.subPrices = this.outerWrapper.querySelector(selectors$m.subPrices);
      this.priceOffWrap = this.outerWrapper.querySelector(selectors$m.priceOffWrap);
      this.priceOffAmount = this.outerWrapper.querySelector(selectors$m.priceOffAmount);
      this.priceOffType = this.outerWrapper.querySelector(selectors$m.priceOffType);
      this.planDecription = this.outerWrapper.querySelector(selectors$m.subDescription);
      this.isPreOrder = this.container.querySelector(selectors$m.isPreOrder);
      this.remainingWrapper = this.outerWrapper.querySelector(selectors$m.remainingWrapper);
      const remainingMaxWrap = this.outerWrapper.querySelector(`[${selectors$m.remainingMax}]`);
      this.sellout = null;
      if (this.remainingWrapper && remainingMaxWrap) {
        this.remainingMaxInt = parseInt(remainingMaxWrap.getAttribute(selectors$m.remainingMax), 10);
        this.remainingCount = this.outerWrapper.querySelector(selectors$m.remainingCount);
        this.remainingJSONWrapper = this.outerWrapper.querySelector(selectors$m.remainingJSON);
        this.remainingJSON = null;
        if (this.remainingJSONWrapper && this.remainingJSONWrapper.innerHTML !== "") {
          this.remainingJSON = JSON.parse(this.remainingJSONWrapper.innerHTML);
        } else {
          console.warn("Missing product quantity JSON");
        }
      }
      initQtySection(this.outerWrapper);
      let productJSONText = null;
      this.productJSON = null;
      const productElemJSON = this.outerWrapper.querySelector(selectors$m.productJson);
      if (productElemJSON) {
        productJSONText = productElemJSON.innerHTML;
      }
      if (productJSONText && this.productForm) {
        this.productJSON = JSON.parse(productJSONText);
        this.sellout = new SelloutVariants(this.outerWrapper, this.productJSON);
        this.linkForm();
      } else {
        console.warn("Missing product form or product JSON");
      }
      // Add cookie for recent products
      if (this.productJSON) {
        new RecordRecentlyViewed(this.productJSON.handle);
      }
    }
    destroy() {
      this.productForm.destroy();
    }
    linkForm() {
      this.productForm = new ProductFormReader(this.outerWrapper, this.productFormElement, this.productJSON, {
        onOptionChange: this.onOptionChange.bind(this),
        onPlanChange: this.onPlanChange.bind(this),
        onQuantityChange: this.onQuantityChange.bind(this),
      });
      this.pushState(this.productForm.getFormState(), true);
      this.subsToggleListeners();
    }
    onOptionChange(evt) {
      this.pushState(evt.dataset);
      // Updates grid/stack/mosaic product-media on Desktop
      if (!this.slideshowDesktop && window.innerWidth >= window.theme.sizes.medium)
        this.updateProductImage(evt.dataset);
    }
    onPlanChange(evt) {
      if (this.subPrices) {
        this.pushState(evt.dataset);
      }
    }
    onQuantityChange(evt) {
      const formState = evt.dataset;
      this.productState = this.setProductState(formState);
      this.updateButtonPrices(formState);
    }
    pushState(formState, init = false) {
      this.productState = this.setProductState(formState);
      this.updateAddToCartState(formState);
      this.updateProductPrices(formState);
      this.updateSaleText(formState);
      this.updateSubscriptionText(formState);
      this.updateLegend(formState);
      this.updateRemaining(formState);
      this.fireHookEvent(formState);
      if (this.sellout) {
        this.sellout.update(formState);
      }
      if (this.enableHistoryState && !init) {
        this.updateHistoryState(formState);
      }
      // Updates the product media on Mobile and Desktop(if Desktop slideshow is enabled)
      const updateProductImageWhenVariantInURL = () => {
        const hasVariantInURL = new URLSearchParams(location.search).get("variant");
        if (hasVariantInURL) this.updateProductImage(formState);
      };
      this.initCallbackAfterSlideshowReady(updateProductImageWhenVariantInURL);
    }
    initCallbackAfterSlideshowReady(callback) {
      if (this.slideshow.classList.contains("flickity-enabled")) {
        callback();
      } else {
        const mutationObserver = new MutationObserver((mutationList) => {
          for (const item of mutationList) {
            if (item.attributeName === "class") {
              if (this.slideshow.classList.contains("flickity-enabled")) {
                mutationObserver.disconnect();
                callback();
                break;
              }
            }
          }
        });
        mutationObserver.observe(this.slideshow, {
          attributes: true,
        });
      }
    }
    updateAddToCartState(formState) {
      const variant = formState.variant;
      let addText = theme.strings.addToCart;
      const priceWrapper = this.outerWrapper.querySelectorAll(selectors$m.priceWrapper);
      const buttonsWrapper = this.outerWrapper.querySelector(selectors$m.buttonsWrapper);
      const addToCart =
        buttonsWrapper === null || buttonsWrapper === void 0
          ? void 0
          : buttonsWrapper.querySelectorAll(selectors$m.addToCart);
      const addToCartText =
        buttonsWrapper === null || buttonsWrapper === void 0
          ? void 0
          : buttonsWrapper.querySelectorAll(selectors$m.addToCartText);
      if (this.isPreOrder) {
        addText = theme.strings.preOrder;
      }
      if (priceWrapper.length && variant) {
        priceWrapper.forEach((element) => {
          element.classList.remove(classes$f.hide);
        });
      }
      if (addToCart === null || addToCart === void 0 ? void 0 : addToCart.length) {
        addToCart.forEach((element) => {
          if (variant) {
            if (variant.available) {
              element.disabled = false;
            } else {
              element.disabled = true;
            }
          } else {
            element.disabled = true;
          }
        });
      }
      if (addToCartText === null || addToCartText === void 0 ? void 0 : addToCartText.length) {
        addToCartText.forEach((element) => {
          if (variant) {
            if (variant.available) {
              element.innerHTML = addText;
            } else {
              element.innerHTML = theme.strings.soldOut;
            }
          } else {
            element.innerHTML = theme.strings.unavailable;
          }
        });
      }
      /*
          Critical JS: Update the hidden form input to the new variand ID
        */ if (buttonsWrapper && variant) {
        const formSelect = buttonsWrapper.querySelector(selectors$m.originalSelectorId);
        if (formSelect) {
          formSelect.value = variant.id;
        }
      }
      /*
          Add or remove the CSS classes for sold out and unavailable variant states
        */ if (buttonsWrapper && this.productFormWrapper) {
        if (variant) {
          if (variant.available) {
            this.productFormWrapper.classList.remove(classes$f.variantSoldOut, classes$f.variantUnavailable);
          } else {
            this.productFormWrapper.classList.add(classes$f.variantSoldOut);
            this.productFormWrapper.classList.remove(classes$f.variantUnavailable);
          }
        } else {
          this.productFormWrapper.classList.add(classes$f.variantUnavailable);
          this.productFormWrapper.classList.remove(classes$f.variantSoldOut);
        }
      }
    }
    updateLegend(formState) {
      const variant = formState.variant;
      if (variant) {
        const vals = this.container.parentNode.querySelectorAll(selectors$m.optionValue);
        vals.forEach((val) => {
          const wrapper = val.closest(`[${selectors$m.optionPosition}]`);
          if (wrapper) {
            const position = wrapper.getAttribute(selectors$m.optionPosition);
            const index = parseInt(position, 10) - 1;
            this.newValue = variant.options[index];
            val.innerHTML = this.newValue;
          }
        });
      }
    }
    updateHistoryState(formState) {
      const variant = formState.variant;
      const plan = formState.plan;
      const location = window.location.href;
      if (variant && location.includes("/product")) {
        const url = new window.URL(location);
        const params = url.searchParams;
        params.set("variant", variant.id);
        if (plan && plan.detail && plan.detail.id && this.productState.hasPlan) {
          params.set("selling_plan", plan.detail.id);
        } else {
          params.delete("selling_plan");
        }
        url.search = params.toString();
        const urlString = url.toString();
        window.history.replaceState(
          {
            path: urlString,
          },
          "",
          urlString,
        );
      }
    }
    updateRemaining(formState) {
      const variant = formState.variant;
      if (variant && this.remainingWrapper && this.remainingJSON && this.remainingCount) {
        const newQuantity = this.remainingJSON[variant.id];
        if (newQuantity && newQuantity <= this.remainingMaxInt && newQuantity > 0) {
          this.remainingWrapper.classList.remove(
            classes$f.remainingIn,
            classes$f.remainingOut,
            classes$f.remainingUnavailable,
          );
          this.remainingWrapper.classList.add(classes$f.remainingLow);
          this.remainingCount.innerHTML = newQuantity;
        } else if (this.productState.soldOut) {
          this.remainingWrapper.classList.remove(
            classes$f.remainingLow,
            classes$f.remainingIn,
            classes$f.remainingUnavailable,
          );
          this.remainingWrapper.classList.add(classes$f.remainingOut);
        } else if (this.productState.available) {
          this.remainingWrapper.classList.remove(
            classes$f.remainingLow,
            classes$f.remainingOut,
            classes$f.remainingUnavailable,
          );
          this.remainingWrapper.classList.add(classes$f.remainingIn);
        }
      } else if (this.remainingWrapper) {
        this.remainingWrapper.classList.remove(classes$f.remainingIn, classes$f.remainingOut, classes$f.remainingLow);
        this.remainingWrapper.classList.add(classes$f.remainingUnavailable);
      }
    }
    getBaseUnit(variant) {
      return variant.unit_price_measurement.reference_value === 1
        ? variant.unit_price_measurement.reference_unit
        : variant.unit_price_measurement.reference_value + variant.unit_price_measurement.reference_unit;
    }
    subsToggleListeners() {
      const toggles = this.outerWrapper.querySelectorAll(selectors$m.subsToggle);
      toggles.forEach((toggle) => {
        toggle.addEventListener(
          "change",
          function (e) {
            const val = e.target.value.toString();
            const selected = this.outerWrapper.querySelector(`[${selectors$m.subsChild}="${val}"]`);
            const groups = this.outerWrapper.querySelectorAll(`[${selectors$m.subsChild}]`);
            if (selected) {
              selected.classList.remove(classes$f.hide);
              const first = selected.querySelector(`[name="selling_plan"]`);
              first.checked = true;
              first.dispatchEvent(new Event("change"));
            }
            groups.forEach((group) => {
              if (group !== selected) {
                group.classList.add(classes$f.hide);
                const plans = group.querySelectorAll(`[name="selling_plan"]`);
                plans.forEach((plan) => {
                  plan.checked = false;
                  plan.dispatchEvent(new Event("change"));
                });
              }
            });
          }.bind(this),
        );
      });
    }
    updateSaleText(formState) {
      if (this.productState.planSale) {
        this.updateSaleTextSubscription(formState);
      } else if (this.productState.onSale) {
        this.updateSaleTextStandard(formState);
      } else if (this.priceOffWrap) {
        this.priceOffWrap.classList.add(classes$f.hide);
      }
    }
    updateSaleTextStandard(formState) {
      if (!this.priceOffType) return;
      this.priceOffType.innerHTML = window.theme.strings.sale || "sale";
      const variant = formState.variant;
      if (window.theme.settings.badge_sale_type && window.theme.settings.badge_sale_type === "percentage") {
        const discountFloat = (variant.compare_at_price - variant.price) / variant.compare_at_price;
        const discountInt = Math.floor(discountFloat * 100);
        this.priceOffAmount.innerHTML = `${discountInt}%`;
      } else {
        const discount = variant.compare_at_price - variant.price;
        this.priceOffAmount.innerHTML = this.formattingMoney(discount);
      }
      this.priceOffWrap.classList.remove(classes$f.hide);
    }
    updateSaleTextSubscription(formState) {
      if (!this.priceOffType) return;
      this.priceOffType.innerHTML = window.theme.strings.subscription || "subscripton";
      const variant = formState.variant;
      const adjustment = formState.plan.detail.price_adjustments[0];
      const discount = adjustment.value;
      if (adjustment && adjustment.value_type === "percentage") {
        this.priceOffAmount.innerHTML = `${discount}%`;
      } else if (adjustment && adjustment.value_type === "price") {
        this.priceOffAmount.innerHTML = this.formattingMoney(variant.price - adjustment.value);
      } else {
        this.priceOffAmount.innerHTML = this.formattingMoney(discount);
      }
      this.priceOffWrap.classList.remove(classes$f.hide);
    }
    updateSubscriptionText(formState) {
      if (formState.plan && this.planDecription && formState.plan.detail.description !== null) {
        this.planDecription.innerHTML = formState.plan.detail.description;
        this.planDecription.classList.remove(classes$f.hide);
      } else if (this.planDecription) {
        this.planDecription.classList.add(classes$f.hide);
      }
    }
    getPrices(formState) {
      const variant = formState.variant;
      const plan = formState.plan;
      let comparePrice = "";
      let price = "";
      if (this.productState.available) {
        comparePrice = variant.compare_at_price;
        price = variant.price;
      }
      if (this.productState.hasPlan) {
        price = plan.allocation.price;
      }
      if (this.productState.planSale) {
        comparePrice = plan.allocation.compare_at_price;
        price = plan.allocation.price;
      }
      return {
        price: price,
        comparePrice: comparePrice,
      };
    }
    updateButtonPrices(formState) {
      const priceButtons = this.outerWrapper.querySelectorAll(selectors$m.priceButton);
      const { price } = this.getPrices(formState);
      if (priceButtons.length) {
        priceButtons.forEach((btn) => {
          if (price !== null && price !== "") {
            const btnPrice = formState.quantity * price;
            btn.innerHTML = this.formattingMoney(btnPrice);
          } else {
            btn.innerHTML = "";
          }
        });
      }
    }
    updateProductPrices(formState) {
      const variant = formState.variant;
      const priceWrappers = this.outerWrapper.querySelectorAll(selectors$m.priceWrapper);
      const priceButtons = this.outerWrapper.querySelectorAll(selectors$m.priceButton);
      const { price, comparePrice } = this.getPrices(formState);
      priceWrappers.forEach((wrap) => {
        const productPriceEl = wrap.querySelector(selectors$m.productPrice);
        const comparePriceEl = wrap.querySelector(selectors$m.comparePrice);
        if (this.productState.onSale || this.productState.planSale) {
          productPriceEl.classList.add(classes$f.productPriceSale);
          comparePriceEl === null || comparePriceEl === void 0
            ? void 0
            : comparePriceEl.classList.remove(classes$f.hide);
        } else {
          productPriceEl.classList.remove(classes$f.productPriceSale);
          comparePriceEl === null || comparePriceEl === void 0 ? void 0 : comparePriceEl.classList.add(classes$f.hide);
        }
        if (comparePriceEl) comparePriceEl.innerHTML = this.formattingMoney(comparePrice);
        if (productPriceEl) {
          if (variant && price !== null && price !== "") {
            productPriceEl.innerHTML = this.formattingMoney(price);
          } else {
            productPriceEl.innerHTML = "&nbsp;";
          }
        }
      });
      if (priceButtons.length) {
        priceButtons.forEach((btn) => {
          if (price !== null && price !== "") {
            const btnPrice = formState.quantity * price;
            btn.innerHTML = this.formattingMoney(btnPrice);
          } else {
            btn.innerHTML = "";
          }
        });
      }
      if (this.hasUnitPricing) {
        this.updateProductUnits(formState);
      }
    }
    updateProductUnits(formState) {
      const variant = formState.variant;
      const plan = formState.plan;
      let unitPrice = null;
      if (variant && variant.unit_price) {
        unitPrice = variant.unit_price;
      }
      if (plan && plan.allocation && plan.allocation.unit_price) {
        unitPrice = plan.allocation.unit_price;
      }
      if (unitPrice) {
        const base = this.getBaseUnit(variant);
        this.outerWrapper.querySelector(selectors$m.unitPrice).innerHTML = this.formattingMoney(unitPrice);
        this.outerWrapper.querySelector(selectors$m.unitBase).innerHTML = base;
        showElement(this.outerWrapper.querySelector(selectors$m.unitWrapper));
      } else {
        hideElement(this.outerWrapper.querySelector(selectors$m.unitWrapper));
      }
    }
    fireHookEvent(formState) {
      const variant = formState.variant;
      this.container.dispatchEvent(
        new CustomEvent("theme:variant:change", {
          detail: {
            variant: variant,
          },
          bubbles: true,
        }),
      );
    }
    /**
     * Tracks aspects of the product state that are relevant to UI updates
     * @param {object} evt - variant change event
     * @return {object} productState - represents state of variant + plans
     *  productState.available - current variant and selling plan options result in valid offer
     *  productState.soldOut - variant is sold out
     *  productState.onSale - variant is on sale
     *  productState.showUnitPrice - variant has unit price
     *  productState.requiresPlan - all the product variants requires a selling plan
     *  productState.hasPlan - there is a valid selling plan
     *  productState.planSale - plan has a discount to show next to price
     *  productState.planPerDelivery - plan price does not equal per_delivery_price - a prepaid subscribtion
     */ setProductState(dataset) {
      const variant = dataset.variant;
      const plan = dataset.plan;
      const productState = {
        available: true,
        soldOut: false,
        onSale: false,
        showUnitPrice: false,
        requiresPlan: false,
        hasPlan: false,
        planPerDelivery: false,
        planSale: false,
      };
      if (!variant || (variant.requires_selling_plan && !plan)) {
        productState.available = false;
      } else {
        if (!variant.available) {
          productState.soldOut = true;
        }
        if (variant.compare_at_price > variant.price) {
          productState.onSale = true;
        }
        if (variant.unit_price) {
          productState.showUnitPrice = true;
        }
        if (this.productJSON && this.productJSON.requires_selling_plan) {
          productState.requiresPlan = true;
        }
        if (plan && this.subPrices) {
          productState.hasPlan = true;
          if (plan.allocation.per_delivery_price !== plan.allocation.price) {
            productState.planPerDelivery = true;
          }
          if (plan.allocation.compare_at_price > plan.allocation.price) {
            productState.planSale = true;
          }
        }
      }
      return productState;
    }
    updateProductImage(formState) {
      const variant = formState.variant;
      if (variant) {
        if (this.slideshow && variant.featured_media && variant.featured_media.id) {
          // Update variant image, if one is set
          this.slideshow.dispatchEvent(
            new CustomEvent("theme:image:change", {
              detail: {
                id: variant.featured_media.id,
              },
            }),
          );
          // Scroll viewport so image is in view
          this.scrollImageViewport(variant);
        }
      }
    }
    scrollImageViewport(variant) {
      // Scroll to fit variant image in window, if images are stacked and image is not in viewport
      const desktopOrTablet = resolution.isDesktop() || resolution.isTablet();
      if (desktopOrTablet && this.slideshow.hasAttribute("data-vertical-images")) {
        const selectedImage = this.slideshow.querySelector(`[data-media-id="${variant.featured_media.id}"]`);
        // Get the top and bottom position of the selected image relative to the viewport
        const imageRect = selectedImage.getBoundingClientRect();
        const selectedImageTop = imageRect.top;
        const selectedImageBottom = imageRect.bottom;
        const imageWithinViewport = imageRect.height < window.innerHeight;
        // Check if the image is not fully within the viewport
        if (selectedImageTop < 0 || (imageWithinViewport && selectedImageBottom > window.innerHeight)) {
          // Calculate scroll position based on whether the top or the bottom of the image is out of view
          let scrollPosition = selectedImageTop + window.scrollY;
          // If the top of the image is above the viewport, adjust the scroll position to the top of the image
          if (selectedImageTop < 0) {
            scrollPosition = selectedImageTop + window.scrollY;
          } else if (selectedImageBottom > window.innerHeight) {
            scrollPosition = selectedImageTop + window.scrollY - (window.innerHeight - imageRect.height);
          }
          // Scroll to the calculated position
          window.scrollTo({
            top: scrollPosition,
            left: 0,
            behavior: "smooth",
          });
        }
      }
    }
    formattingMoney(money) {
      if (theme.settings.currency_code_enable) {
        return themeCurrency.formatMoney(money, theme.moneyFormat) + ` ${theme.currencyCode}`;
      } else {
        return themeCurrency.formatMoney(money, theme.moneyFormat);
      }
    }
    constructor() {
      super();
      this.container = this;
    }
  };

  let ProductComplimentary = class ProductComplimentary extends HTMLElement {
    connectedCallback() {
      fetch(this.dataset.url)
        .then((response) => response.text())
        .then((text) => {
          const fresh = document.createElement("div");
          fresh.innerHTML = text;
          const newContent = fresh.querySelector("[data-api-content]");
          if (newContent) {
            this.innerHTML = newContent.innerHTML;
          }
          const loader = this.closest("[data-product-complimentary-loaded]");
          if (loader && newContent.innerHTML.trim() !== "") {
            // js-unloaded state hides the wrapper pre-render and
            // keeps it hidden for empty recommendations
            loader.classList.remove("js-unloaded");
          }
        })
        .catch((e) => {
          console.error(e);
        });
    }
    constructor() {
      super();
    }
  };

  const selectors$l = {
    slideshow: "[data-product-slideshow]",
    singeImage: "[data-product-image]",
    zoomButton: "[data-zoom-button]",
    zoomWrapper: "[data-zoom-wrapper]",
    mediaId: "data-media-id",
  };
  function productPhotoswipeZoom(container, json) {
    const loadedPromise = loadScript({
      url: window.theme.assets.photoswipe,
    });
    const returnZoom = loadedPromise
      .then(() => {
        const PhotoSwipe = window.themePhotoswipe.PhotoSwipe.default;
        const PhotoSwipeUI = window.themePhotoswipe.PhotoSwipeUI.default;
        const triggers = container.querySelectorAll(selectors$l.zoomButton);
        triggers.forEach((trigger) => {
          trigger.addEventListener("click", (event) => {
            const el = container.querySelector(selectors$l.zoomWrapper);
            const dataId = event.target
              .closest(`[${selectors$l.mediaId}]`)
              .getAttribute(selectors$l.mediaId)
              .toString();
            const items = [];
            for (let i = 0; i < json.media.length; i++) {
              if (json.media[i].media_type === "image") {
                items[items.length] = {
                  src: json.media[i].src,
                  w: json.media[i].width,
                  h: json.media[i].height,
                  id: json.media[i].id,
                };
              }
            }
            const findImage = (element) => element.id.toString() === dataId;
            const index = items.findIndex(findImage);
            const options = {
              index,
              showHideOpacity: true,
              showAnimationDuration: 150,
              hideAnimationDuration: 250,
              bgOpacity: 1,
              spacing: 0,
              allowPanToNext: false,
              maxSpreadZoom: 3,
              history: false,
              loop: true,
              pinchToClose: false,
              modal: false,
              closeOnScroll: false,
              closeOnVerticalDrag: true,
              getDoubleTapZoom: function getDoubleTapZoom(isMouseClick, item) {
                if (isMouseClick) {
                  return 1.67;
                } else {
                  return item.initialZoomLevel < 0.7 ? 1 : 1.3;
                }
              },
              getThumbBoundsFn: function getThumbBoundsFn() {
                let imageLocation = container.querySelector(selectors$l.slideshow);
                if (!imageLocation) {
                  imageLocation = container.querySelector(selectors$l.singeImage);
                }
                const pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
                const rect = imageLocation.getBoundingClientRect();
                return {
                  x: rect.left,
                  y: rect.top + pageYScroll,
                  w: rect.width,
                };
              },
            };
            el.dispatchEvent(
              new CustomEvent("theme:scroll:lock", {
                bubbles: true,
              }),
            );
            // Initializes and opens PhotoSwipe
            const gallery = new PhotoSwipe(el, PhotoSwipeUI, items, options);
            gallery.init();
            gallery.listen("close", function () {
              document.dispatchEvent(
                new CustomEvent("theme:scroll:unlock", {
                  bubbles: true,
                }),
              );
            });
          });
        });
      })
      .catch((e) => console.error(e));
    return returnZoom;
  }

  const selectors$k = {
    body: "body",
    dataRelatedSectionElem: "[data-related-section]",
    dataTabsHolder: "[data-tabs-holder]",
    dataTab: "data-tab",
    dataTabIndex: "data-tab-index",
    blockId: "data-block-id",
    tabsLi: ".tabs > button",
    tabLink: ".tab-link",
    tabLinkRecent: ".tab-link__recent",
    tabContent: ".tab-content",
    scrollbarHolder: "[data-scrollbar]",
    scrollbarArrowPrev: "[data-scrollbar-arrow-prev]",
    scrollbarArrowNext: "[data-scrollbar-arrow-next]",
    firstElement: "a:first-child, input:first-child",
  };
  const classes$e = {
    classCurrent: "current",
    classHide: "hide",
    classAlt: "alt",
    isFocused: "is-focused",
  };
  const sections$4 = {};
  let GlobalTabs = class GlobalTabs {
    init() {
      const ctx = this.container;
      const tabsNavList = ctx.querySelectorAll(selectors$k.tabsLi);
      const firstTabLink = ctx.querySelector(`${selectors$k.tabLink}-0`);
      const firstTabContent = ctx.querySelector(`${selectors$k.tabContent}-0`);
      if (firstTabContent) {
        firstTabContent.classList.add(classes$e.classCurrent);
      }
      if (firstTabLink) {
        firstTabLink.classList.add(classes$e.classCurrent);
      }
      this.checkVisibleTabLinks();
      this.container.addEventListener("theme:tabs:check", () => this.checkRecentTab());
      this.container.addEventListener("theme:tabs:hide", () => this.hideRelatedTab());
      if (tabsNavList.length) {
        tabsNavList.forEach((element) => {
          const tabId = parseInt(element.getAttribute(selectors$k.dataTab));
          const tab = ctx.querySelector(`${selectors$k.tabContent}-${tabId}`);
          element.addEventListener("click", () => {
            this.tabChange(element, tab);
          });
          element.addEventListener("keyup", (event) => {
            if (
              (event.code === "Space" || event.code === "Enter") &&
              this.body.classList.contains(classes$e.isFocused)
            ) {
              this.tabChange(element, tab);
              if (tab.querySelector("a, input")) {
                this.accessibility.lastFocused = element;
                this.accessibility.a11y.trapFocus(tab, {
                  elementToFocus: tab.querySelector(selectors$k.firstElement),
                });
              }
            }
          });
        });
      }
    }
    tabChange(element, tab) {
      this.container
        .querySelector(`${selectors$k.tabsLi}.${classes$e.classCurrent}`)
        .classList.remove(classes$e.classCurrent);
      this.container
        .querySelector(`${selectors$k.tabContent}.${classes$e.classCurrent}`)
        .classList.remove(classes$e.classCurrent);
      element.classList.add(classes$e.classCurrent);
      tab.classList.add(classes$e.classCurrent);
      if (element.classList.contains(classes$e.classHide)) {
        tab.classList.add(classes$e.classHide);
      }
      this.checkVisibleTabLinks();
      this.container.dispatchEvent(new CustomEvent("theme:tab:change"));
    }
    initNativeScrollbar() {
      if (this.scrollbarHolder.length) {
        this.scrollbarHolder.forEach((scrollbar) => {
          new NativeScrollbar(scrollbar);
        });
      }
    }
    checkVisibleTabLinks() {
      const tabsNavList = this.container.querySelectorAll(selectors$k.tabsLi);
      const tabsNavListHided = this.container.querySelectorAll(`${selectors$k.tabLink}.${classes$e.classHide}`);
      const difference = tabsNavList.length - tabsNavListHided.length;
      if (difference < 2) {
        this.container.classList.add(classes$e.classAlt);
      } else {
        this.container.classList.remove(classes$e.classAlt);
      }
    }
    checkRecentTab() {
      const tabLink = this.container.querySelector(selectors$k.tabLinkRecent);
      if (tabLink) {
        tabLink.classList.remove(classes$e.classHide);
        const tabLinkIdx = parseInt(tabLink.getAttribute(selectors$k.dataTab));
        const tabContent = this.container.querySelector(
          `${selectors$k.tabContent}[${selectors$k.dataTabIndex}="${tabLinkIdx}"]`,
        );
        if (tabContent) {
          tabContent.classList.remove(classes$e.classHide);
        }
        this.checkVisibleTabLinks();
        this.initNativeScrollbar();
      }
    }
    hideRelatedTab() {
      const relatedSection = this.container.querySelector(selectors$k.dataRelatedSectionElem);
      if (!relatedSection) {
        return;
      }
      const parentTabContent = relatedSection.closest(`${selectors$k.tabContent}.${classes$e.classCurrent}`);
      if (!parentTabContent) {
        return;
      }
      const parentTabContentIdx = parseInt(parentTabContent.getAttribute(selectors$k.dataTabIndex));
      const tabsNavList = this.container.querySelectorAll(selectors$k.tabsLi);
      if (tabsNavList.length > parentTabContentIdx) {
        const nextTabsNavLink = tabsNavList[parentTabContentIdx].nextElementSibling;
        if (nextTabsNavLink) {
          tabsNavList[parentTabContentIdx].classList.add(classes$e.classHide);
          nextTabsNavLink.dispatchEvent(new Event("click"));
          this.initNativeScrollbar();
        }
      }
    }
    onBlockSelect(evt) {
      const element = this.container.querySelector(
        `${selectors$k.tabLink}[${selectors$k.blockId}="${evt.detail.blockId}"]`,
      );
      if (element) {
        element.dispatchEvent(new Event("click"));
        element.parentNode.scrollTo({
          top: 0,
          left: element.offsetLeft - element.clientWidth,
          behavior: "smooth",
        });
      }
    }
    constructor(holder) {
      this.container = holder;
      this.body = document.querySelector(selectors$k.body);
      this.accessibility = window.accessibility;
      if (this.container) {
        this.scrollbarHolder = this.container.querySelectorAll(selectors$k.scrollbarHolder);
        this.init();
        // Init native scrollbar
        this.initNativeScrollbar();
      }
    }
  };
  const tabs$1 = {
    onLoad() {
      sections$4[this.id] = [];
      const tabHolders = this.container.querySelectorAll(selectors$k.dataTabsHolder);
      tabHolders.forEach((holder) => {
        sections$4[this.id].push(new GlobalTabs(holder));
      });
    },
    onBlockSelect(e) {
      sections$4[this.id].forEach((el) => {
        if (typeof el.onBlockSelect === "function") {
          el.onBlockSelect(e);
        }
      });
    },
  };

  const selectors$j = {
    urlInput: "[data-share-url]",
    section: "data-section-type",
    shareDetails: "[data-share-details]",
    shareSummary: "[data-share-summary]",
    shareCopy: "[data-share-copy]",
    shareButton: "[data-share-button]",
    closeButton: "[data-close-button]",
    successMessage: "[data-success-message]",
    shareHolder: "[data-share-holder]",
  };
  const classes$d = {
    hidden: "is-hidden",
  };
  let ShareButton = class ShareButton extends HTMLElement {
    init() {
      if (navigator.share) {
        this.mainDetailsToggle.classList.add(classes$d.hidden);
        this.shareButton.classList.remove(classes$d.hidden);
        this.shareButton.addEventListener("click", () => {
          navigator.share({
            url: this.urlToShare,
            title: document.title,
          });
        });
      } else {
        this.mainDetailsToggle.addEventListener("toggle", this.toggleDetails.bind(this));
        this.mainDetailsToggle.addEventListener("focusout", () => {
          setTimeout(() => {
            if (!this.contains(document.activeElement)) {
              this.close();
            }
          });
        });
        this.shareCopy.addEventListener("click", this.copyToClipboard.bind(this));
        this.closeButton.addEventListener("click", this.close.bind(this));
        this.container.addEventListener("keyup", this.keyboardEvents.bind(this));
      }
    }
    updateShareLink() {
      if (this.container.getAttribute(selectors$j.section) == "product") {
        this.container.addEventListener("theme:variant:change", (event) => {
          if (event.detail.variant) {
            this.urlToShare = `${this.urlToShare.split("?")[0]}?variant=${event.detail.variant.id}`;
            if (this.urlInput) {
              this.urlInput.value = `${this.urlToShare.split("?")[0]}?variant=${event.detail.variant.id}`;
            }
          }
        });
      }
    }
    toggleDetails() {
      if (!this.mainDetailsToggle.open) {
        this.successMessage.classList.add(classes$d.hidden);
        this.successMessage.textContent = "";
        this.closeButton.classList.add(classes$d.hidden);
        this.shareCopy.focus();
      }
    }
    copyToClipboard() {
      navigator.clipboard.writeText(this.urlInput.value).then(() => {
        this.successMessage.classList.remove(classes$d.hidden);
        this.successMessage.textContent = theme.strings.successMessage;
        this.closeButton.classList.remove(classes$d.hidden);
        this.closeButton.focus();
      });
    }
    close() {
      this.mainDetailsToggle.removeAttribute("open");
      this.shareSummary.setAttribute("aria-expanded", false);
    }
    keyboardEvents(e) {
      if (e.code !== "Escape") {
        return;
      }
      this.mainDetailsToggle.focus();
      this.close();
    }
    constructor() {
      super();
      this.container = this.closest(`[${selectors$j.section}]`);
      this.mainDetailsToggle = this.querySelector(selectors$j.shareDetails);
      this.shareButton = this.querySelector(selectors$j.shareButton);
      this.shareCopy = this.querySelector(selectors$j.shareCopy);
      this.shareSummary = this.querySelector(selectors$j.shareSummary);
      this.closeButton = this.querySelector(selectors$j.closeButton);
      this.successMessage = this.querySelector(selectors$j.successMessage);
      this.shareHolder = this.querySelector(selectors$j.shareHolder);
      this.urlInput = this.querySelector(selectors$j.urlInput);
      this.urlToShare = this.urlInput ? this.urlInput.value : document.location.href;
      this.init();
      this.updateShareLink();
    }
  };

  const selectors$i = {
    groupImage: "data-image-filter",
    slider: "[data-product-slideshow]",
    thumbSlider: "[data-product-thumbs]",
    thumbs: "[data-slideshow-thumbnail]",
    slides: "[data-media-slide]",
  };
  const classes$c = {
    hide: "hide",
    flickityEnable: "flickity-enabled",
  };
  let GroupVariantImages = class GroupVariantImages {
    listen() {
      this.container.addEventListener("theme:variant:change", (event) => {
        if (event.detail.variant) {
          this.variantImage = event.detail.variant.featured_image;
          this.filterImages();
        }
      });
    }
    filterImages() {
      if (this.variantImage !== null && this.variantImage.alt !== null) {
        this.variantImageAlt = this.variantImage.alt.split("#")[1];
        this.showImages();
      } else {
        this.resetImages();
      }
      this.refreshSliders();
    }
    resetImages() {
      this.thumbs.forEach((thumb) => thumb.classList.remove(classes$c.hide));
      this.slides.forEach((slide) => slide.classList.remove(classes$c.hide));
    }
    showImages() {
      this.thumbs.forEach((thumb) => {
        if (
          thumb.getAttribute(selectors$i.groupImage) === "" ||
          thumb.getAttribute(selectors$i.groupImage) === this.variantImageAlt
        ) {
          thumb.classList.remove(classes$c.hide);
        } else {
          thumb.classList.add(classes$c.hide);
        }
      });
      this.slides.forEach((slide) => {
        if (
          slide.getAttribute(selectors$i.groupImage) === "" ||
          slide.getAttribute(selectors$i.groupImage) === this.variantImageAlt
        ) {
          slide.classList.remove(classes$c.hide);
        } else {
          slide.classList.add(classes$c.hide);
        }
      });
    }
    refreshSliders() {
      if (this.slider !== null) {
        if (this.slider.classList.contains(classes$c.flickityEnable)) {
          const slider = FlickityFade.data(this.slider);
          if (typeof slider !== "undefined") {
            slider.reloadCells();
          }
        }
      }
      if (this.thumbSlider !== null) {
        if (this.thumbSlider.classList.contains(classes$c.flickityEnable)) {
          const thumbSlider = FlickitySync.data(this.thumbSlider);
          if (typeof thumbSlider !== "undefined") {
            thumbSlider.reloadCells();
          }
        }
      }
    }
    constructor(section) {
      this.section = section;
      this.container = section.container;
      this.slider = this.container.querySelector(selectors$i.slider);
      this.thumbSlider = this.container.querySelector(selectors$i.thumbSlider);
      this.thumbs = this.container.querySelectorAll(selectors$i.thumbs);
      this.slides = this.container.querySelectorAll(selectors$i.slides);
      this.variantImage = null;
      this.listen();
    }
  };

  const selectors$h = {
    sizeButton: "[data-size-button]",
    mediaHolder: "[data-media-slide]",
  };
  const classes$b = {
    classExpanded: "is-expanded",
  };
  let ImageCaption = class ImageCaption {
    init() {
      this.sizeButtons.forEach((button) => {
        button.addEventListener("click", () => {
          button.classList.toggle(classes$b.classExpanded);
          button.closest(selectors$h.mediaHolder).classList.toggle(classes$b.classExpanded);
        });
      });
    }
    constructor(container) {
      this.container = container;
      this.sizeButtons = this.container.querySelectorAll(selectors$h.sizeButton);
      if (this.sizeButtons.length > 0) {
        this.init();
      }
    }
  };

  const selectors$g = {
    productJson: "[data-product-json]",
    zoomButton: "[data-zoom-button]",
    toggleTruncateHolder: "[data-truncated-holder]",
    toggleTruncateButton: "[data-truncated-button]",
    toggleTruncateContent: "data-truncated-content",
  };
  const classes$a = {
    classExpanded: "is-expanded",
    classVisible: "is-visible",
  };
  const sections$3 = [];
  let ProductTemplate = class ProductTemplate {
    init() {
      this.zoomEnabled = this.container.querySelector(selectors$g.zoomButton) !== null;
      if (this.zoomEnabled) {
        productPhotoswipeZoom(this.container, this.product);
      }
      if (this.truncateElementHolder && this.truncateElement) {
        setTimeout(this.resizeEventTruncate, 50);
        document.addEventListener("theme:resize", this.resizeEventTruncate);
      }
      new ImageCaption(this.container);
    }
    truncateText() {
      if (this.truncateElementHolder.classList.contains(classes$a.classVisible)) return;
      const styles = this.truncateElement.querySelectorAll("style");
      if (styles.length) {
        styles.forEach((style) => {
          this.truncateElementHolder.prepend(style);
        });
      }
      const truncateElementCloned = this.truncateElement.cloneNode(true);
      const truncateElementClass = this.truncateElement.getAttribute(selectors$g.toggleTruncateContent);
      const truncateNextElement = this.truncateElement.nextElementSibling;
      if (truncateNextElement) {
        truncateNextElement.remove();
      }
      this.truncateElement.parentElement.append(truncateElementCloned);
      const truncateAppendedElement = this.truncateElement.nextElementSibling;
      truncateAppendedElement.classList.add(truncateElementClass);
      truncateAppendedElement.removeAttribute(selectors$g.toggleTruncateContent);
      showElement(truncateAppendedElement);
      ellipsis(truncateAppendedElement, 5, {
        replaceStr: "",
        delimiter: " ",
      });
      hideElement(truncateAppendedElement);
      if (this.truncateElement.innerHTML !== truncateAppendedElement.innerHTML) {
        this.truncateElementHolder.classList.add(classes$a.classExpanded);
      } else {
        truncateAppendedElement.remove();
        this.truncateElementHolder.classList.remove(classes$a.classExpanded);
      }
      this.toggleTruncatedContent(this.truncateElementHolder);
    }
    toggleTruncatedContent(holder) {
      const toggleButton = holder.querySelector(selectors$g.toggleTruncateButton);
      if (toggleButton) {
        toggleButton.addEventListener("click", (e) => {
          e.preventDefault();
          holder.classList.remove(classes$a.classExpanded);
          holder.classList.add(classes$a.classVisible);
        });
      }
    }
    onBlockSelect(event) {
      const block = this.container.querySelector(`[data-block-id="${event.detail.blockId}"]`);
      if (block) {
        block.dispatchEvent(new Event("click"));
      }
    }
    onBlockDeselect(event) {
      const block = this.container.querySelector(`[data-block-id="${event.detail.blockId}"]`);
      if (block) {
        block.dispatchEvent(new Event("click"));
      }
    }
    onUnload() {
      this.media.destroy();
      if (this.truncateElementHolder && this.truncateElement) {
        document.removeEventListener("theme:resize", this.resizeEventTruncate);
      }
    }
    constructor(section) {
      this.section = section;
      this.id = section.id;
      this.container = section.container;
      this.settings = section.settings;
      modal(this.id);
      this.media = new Media(section);
      new GroupVariantImages(section);
      const productJSON = this.container.querySelector(selectors$g.productJson);
      if (productJSON && productJSON.innerHTML !== "") {
        this.product = JSON.parse(productJSON.innerHTML);
      } else {
        console.error("Missing product JSON");
        return;
      }
      this.truncateElementHolder = this.container.querySelector(selectors$g.toggleTruncateHolder);
      this.truncateElement = this.container.querySelector(`[${selectors$g.toggleTruncateContent}]`);
      this.resizeEventTruncate = () => this.truncateText();
      this.init();
    }
  };
  const productSection = {
    onLoad() {
      sections$3[this.id] = new ProductTemplate(this);
    },
    onUnload() {
      if (typeof sections$3[this.id].unload === "function") {
        sections$3[this.id].unload();
      }
    },
    onBlockSelect(evt) {
      if (typeof sections$3[this.id].onBlockSelect === "function") {
        sections$3[this.id].onBlockSelect(evt);
      }
    },
    onBlockDeselect(evt) {
      if (typeof sections$3[this.id].onBlockDeselect === "function") {
        sections$3[this.id].onBlockDeselect(evt);
      }
    },
  };
  register("product", [productSection, pickupAvailability, accordion, tabs$1, swapperSection]);
  if (!customElements.get("product-form")) {
    customElements.define("product-form", ProductForm);
  }
  if (!customElements.get("product-complimentary")) {
    customElements.define("product-complimentary", ProductComplimentary);
  }
  if (!customElements.get("radio-swatch")) {
    customElements.define("radio-swatch", RadioSwatch);
  }
  if (!customElements.get("popout-select")) {
    customElements.define("popout-select", PopoutSelect);
  }
  if (!customElements.get("share-button")) {
    customElements.define("share-button", ShareButton);
  }

  const selectors$f = {
    toggle: "data-toggle-grid",
    large: "data-grid-large",
    small: "data-grid-small",
  };
  const classes$9 = {
    active: "is-active",
  };
  const options = {
    breakpoint: window.theme.sizes.small,
  };
  var sections$2 = {};
  let Toggle = class Toggle {
    init() {
      this.toggle.addEventListener("click", this.toggleFunction);
      document.addEventListener("theme:resize:width", this.toggleFunction);
      this.toggleEvent(false);
    }
    unload() {
      this.toggle.removeEventListener("click", this.toggleFunction);
      document.removeEventListener("theme:resize:width", this.toggleFunction);
    }
    toggleEvent(evt = true) {
      const clickEvent = evt && evt.type === "click";
      const isLarge = window.innerWidth >= options.breakpoint;
      const selector = isLarge ? selectors$f.large : selectors$f.small;
      const grid = this.container.querySelector(`[${selector}]`);
      const gridNumber = grid.getAttribute(selector);
      const activeToggle = this.toggle.parentElement.querySelector(`[${selectors$f.toggle}].${classes$9.active}`);
      let currentToggle = this.toggle.parentElement.querySelector(`[${selectors$f.toggle}="${gridNumber}"]`);
      if (clickEvent) {
        currentToggle = this.toggle;
        grid.setAttribute(selector, this.value);
      }
      if (activeToggle) {
        activeToggle.classList.remove(classes$9.active);
      }
      if (currentToggle) {
        currentToggle.classList.add(classes$9.active);
      }
    }
    constructor(toggle, container) {
      this.container = container || document;
      this.toggle = toggle;
      this.value = this.toggle.getAttribute(selectors$f.toggle);
      this.toggleFunction = (evt) => this.toggleEvent(evt);
      this.init();
    }
  };
  const toggleSection = {
    onLoad() {
      sections$2[this.id] = [];
      const buttons = this.container.querySelectorAll(`[${selectors$f.toggle}]`);
      buttons.forEach((button) => {
        sections$2[this.id].push(new Toggle(button, this.container));
      });
    },
    onUnload: function () {
      sections$2[this.id].forEach((toggle) => {
        if (typeof toggle.unload === "function") {
          toggle.unload();
        }
      });
    },
  };

  const selectors$e = {
    sort: "data-sort-enabled",
    sortLinks: "[data-sort-link]",
    sortButtonText: "[data-sort-button-text]",
    sortValue: "data-value",
  };
  const classes$8 = {
    active: "popout-list__item--current",
  };
  let Sort = class Sort {
    init() {
      this.sortLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          this.sortingResults(e);
        });
      });
    }
    sortingResults(e) {
      const link = e.currentTarget;
      const sort = link.getAttribute(selectors$e.sortValue);
      const text = link.innerText;
      this.sortButtonText.innerText = text;
      this.sortButtonText.parentNode.dispatchEvent(new Event("click"));
      this.sort.querySelector(`.${classes$8.active}`).classList.remove(classes$8.active);
      link.parentNode.classList.add(classes$8.active);
      this.sort.setAttribute(selectors$e.sort, sort);
      this.container.dispatchEvent(
        new CustomEvent("theme:form:filter", {
          bubbles: true,
          detail: {
            params: sort,
          },
        }),
      );
    }
    constructor(section) {
      this.container = section.container;
      this.sort = this.container.querySelector(`[${selectors$e.sort}]`);
      this.sortLinks = this.container.querySelectorAll(selectors$e.sortLinks);
      this.sortButtonText = this.container.querySelector(selectors$e.sortButtonText);
      if (this.sort) {
        this.init();
      }
    }
  };

  var selectors$d = {
    swatch: "data-swatch",
  };
  let Collection = class Collection {
    init() {
      new Sort(this.section);
    }
    constructor(section) {
      this.section = section;
      this.container = this.section.container;
      this.swatches = this.container.querySelectorAll(`[${selectors$d.swatch}]`);
      this.init();
    }
  };
  const collectionSection = {
    onLoad() {
      this.collection = new Collection(this);
    },
  };
  register("collection", [
    collectionSection,
    collectionFiltersSidebar,
    collectionFiltersForm,
    toggleSection,
    swatchGridSection,
    accordion,
    siblings,
  ]);
  if (!customElements.get("popout-select")) {
    customElements.define("popout-select", PopoutSelect);
  }
  if (!customElements.get("radio-swatch")) {
    customElements.define("radio-swatch", RadioSwatch);
  }
  if (!customElements.get("product-grid-item")) {
    customElements.define("product-grid-item", ProductGridItem);
  }
  if (!customElements.get("product-grid-item-variant")) {
    customElements.define("product-grid-item-variant", ProductGridItemVariant);
  }
  if (!customElements.get("product-grid-item-image")) {
    customElements.define("product-grid-item-image", ProductGridItemImage);
  }

  register("collection-row", [swatchGridSection, siblings, customScrollbar, parallaxImage]);
  if (!customElements.get("radio-swatch")) {
    customElements.define("radio-swatch", RadioSwatch);
  }
  if (!customElements.get("product-grid-item")) {
    customElements.define("product-grid-item", ProductGridItem);
  }
  if (!customElements.get("product-grid-item-variant")) {
    customElements.define("product-grid-item-variant", ProductGridItemVariant);
  }
  if (!customElements.get("product-grid-item-image")) {
    customElements.define("product-grid-item-image", ProductGridItemImage);
  }

  register("collection-tabs", [tabs$1, productSliderSection, swatchGridSection]);
  if (!customElements.get("radio-swatch")) {
    customElements.define("radio-swatch", RadioSwatch);
  }
  if (!customElements.get("product-grid-item")) {
    customElements.define("product-grid-item", ProductGridItem);
  }
  if (!customElements.get("product-grid-item-variant")) {
    customElements.define("product-grid-item-variant", ProductGridItemVariant);
  }
  if (!customElements.get("product-grid-item-image")) {
    customElements.define("product-grid-item-image", ProductGridItemImage);
  }

  var styles = {};
  styles.basic = [];
  /* eslint-disable */ styles.light = [
    {
      featureType: "administrative",
      elementType: "labels",
      stylers: [
        {
          visibility: "on",
        },
        {
          lightness: "64",
        },
        {
          hue: "#ff0000",
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#bdbdbd",
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "labels.icon",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "landscape",
      elementType: "all",
      stylers: [
        {
          color: "#f0f0f0",
        },
        {
          visibility: "simplified",
        },
      ],
    },
    {
      featureType: "landscape.natural.landcover",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "landscape.natural.terrain",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "poi",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "poi",
      elementType: "geometry.fill",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [
        {
          lightness: "100",
        },
      ],
    },
    {
      featureType: "poi.park",
      elementType: "all",
      stylers: [
        {
          visibility: "on",
        },
      ],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [
        {
          saturation: "-41",
        },
        {
          color: "#e8ede7",
        },
      ],
    },
    {
      featureType: "poi.park",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road",
      elementType: "all",
      stylers: [
        {
          saturation: "-100",
        },
      ],
    },
    {
      featureType: "road",
      elementType: "labels",
      stylers: [
        {
          lightness: "25",
        },
        {
          gamma: "1.06",
        },
        {
          saturation: "-100",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "all",
      stylers: [
        {
          visibility: "simplified",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.fill",
      stylers: [
        {
          gamma: "10.00",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [
        {
          weight: "0.01",
        },
        {
          visibility: "simplified",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.stroke",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry.fill",
      stylers: [
        {
          weight: "0.8",
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry.stroke",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "labels.icon",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "geometry.fill",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "geometry.stroke",
      stylers: [
        {
          gamma: "10.00",
        },
        {
          lightness: "100",
        },
        {
          weight: "0.4",
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "labels",
      stylers: [
        {
          visibility: "simplified",
        },
        {
          weight: "0.01",
        },
        {
          lightness: "39",
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "labels.text.stroke",
      stylers: [
        {
          weight: "0.50",
        },
        {
          gamma: "10.00",
        },
        {
          lightness: "100",
        },
      ],
    },
    {
      featureType: "transit",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "water",
      elementType: "all",
      stylers: [
        {
          color: "#cfe5ee",
        },
        {
          visibility: "on",
        },
      ],
    },
  ];
  styles.light_blank = [
    {
      featureType: "all",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
        {
          lightness: "64",
        },
        {
          hue: "#ff0000",
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#bdbdbd",
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "labels.icon",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "landscape",
      elementType: "all",
      stylers: [
        {
          color: "#f0f0f0",
        },
        {
          visibility: "simplified",
        },
      ],
    },
    {
      featureType: "landscape.natural.landcover",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "landscape.natural.terrain",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "poi",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "poi",
      elementType: "geometry.fill",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [
        {
          lightness: "100",
        },
      ],
    },
    {
      featureType: "poi.park",
      elementType: "all",
      stylers: [
        {
          visibility: "on",
        },
      ],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [
        {
          saturation: "-41",
        },
        {
          color: "#e8ede7",
        },
      ],
    },
    {
      featureType: "poi.park",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road",
      elementType: "all",
      stylers: [
        {
          saturation: "-100",
        },
      ],
    },
    {
      featureType: "road",
      elementType: "labels",
      stylers: [
        {
          lightness: "25",
        },
        {
          gamma: "1.06",
        },
        {
          saturation: "-100",
        },
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "all",
      stylers: [
        {
          visibility: "simplified",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.fill",
      stylers: [
        {
          gamma: "10.00",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [
        {
          weight: "0.01",
        },
        {
          visibility: "simplified",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.stroke",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry.fill",
      stylers: [
        {
          weight: "0.8",
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry.stroke",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "labels.icon",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "geometry.fill",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "geometry.stroke",
      stylers: [
        {
          gamma: "10.00",
        },
        {
          lightness: "100",
        },
        {
          weight: "0.4",
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
        {
          weight: "0.01",
        },
        {
          lightness: "39",
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "labels.text.stroke",
      stylers: [
        {
          weight: "0.50",
        },
        {
          gamma: "10.00",
        },
        {
          lightness: "100",
        },
      ],
    },
    {
      featureType: "transit",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "water",
      elementType: "all",
      stylers: [
        {
          color: "#cfe5ee",
        },
        {
          visibility: "on",
        },
      ],
    },
  ];
  styles.white_blank = [
    {
      featureType: "all",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#444444",
        },
      ],
    },
    {
      featureType: "landscape",
      elementType: "all",
      stylers: [
        {
          color: "#f2f2f2",
        },
      ],
    },
    {
      featureType: "poi",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road",
      elementType: "all",
      stylers: [
        {
          saturation: -100,
        },
        {
          lightness: 45,
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "all",
      stylers: [
        {
          visibility: "simplified",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.fill",
      stylers: [
        {
          weight: "0.8",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [
        {
          weight: "0.8",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [
        {
          weight: "0.8",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.stroke",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry.stroke",
      stylers: [
        {
          weight: "0",
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "labels.icon",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "geometry.stroke",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "transit",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "water",
      elementType: "all",
      stylers: [
        {
          color: "#e4e4e4",
        },
        {
          visibility: "on",
        },
      ],
    },
  ];
  styles.white_label = [
    {
      featureType: "all",
      elementType: "all",
      stylers: [
        {
          visibility: "simplified",
        },
      ],
    },
    {
      featureType: "all",
      elementType: "labels",
      stylers: [
        {
          visibility: "simplified",
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "labels",
      stylers: [
        {
          gamma: "3.86",
        },
        {
          lightness: "100",
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#cccccc",
        },
      ],
    },
    {
      featureType: "landscape",
      elementType: "all",
      stylers: [
        {
          color: "#f2f2f2",
        },
      ],
    },
    {
      featureType: "poi",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road",
      elementType: "all",
      stylers: [
        {
          saturation: -100,
        },
        {
          lightness: 45,
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "all",
      stylers: [
        {
          visibility: "simplified",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.fill",
      stylers: [
        {
          weight: "0.8",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [
        {
          weight: "0.8",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [
        {
          weight: "0.8",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.stroke",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry.stroke",
      stylers: [
        {
          weight: "0",
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "labels.icon",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "geometry.stroke",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "labels.text",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "transit",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "water",
      elementType: "all",
      stylers: [
        {
          color: "#e4e4e4",
        },
        {
          visibility: "on",
        },
      ],
    },
  ];
  styles.dark_blank = [
    {
      featureType: "all",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "all",
      elementType: "labels.text.fill",
      stylers: [
        {
          saturation: 36,
        },
        {
          color: "#000000",
        },
        {
          lightness: 40,
        },
      ],
    },
    {
      featureType: "all",
      elementType: "labels.text.stroke",
      stylers: [
        {
          visibility: "on",
        },
        {
          color: "#000000",
        },
        {
          lightness: 16,
        },
      ],
    },
    {
      featureType: "all",
      elementType: "labels.icon",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "geometry.fill",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 20,
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 17,
        },
        {
          weight: 1.2,
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 20,
        },
      ],
    },
    {
      featureType: "landscape",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "poi",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 21,
        },
      ],
    },
    {
      featureType: "road",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.fill",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 17,
        },
        {
          weight: "0.8",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 29,
        },
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 18,
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry.stroke",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 16,
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "geometry.stroke",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "transit",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 19,
        },
      ],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 17,
        },
      ],
    },
  ];
  styles.dark_label = [
    {
      featureType: "all",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "all",
      elementType: "labels.text.fill",
      stylers: [
        {
          saturation: 36,
        },
        {
          color: "#000000",
        },
        {
          lightness: 40,
        },
      ],
    },
    {
      featureType: "all",
      elementType: "labels.text.stroke",
      stylers: [
        {
          visibility: "on",
        },
        {
          color: "#000000",
        },
        {
          lightness: 16,
        },
      ],
    },
    {
      featureType: "all",
      elementType: "labels.icon",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "geometry.fill",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 20,
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 17,
        },
        {
          weight: 1.2,
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "labels",
      stylers: [
        {
          visibility: "simplified",
        },
        {
          lightness: "-82",
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "labels.text.stroke",
      stylers: [
        {
          invert_lightness: true,
        },
        {
          weight: "7.15",
        },
      ],
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 20,
        },
      ],
    },
    {
      featureType: "landscape",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "poi",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 21,
        },
      ],
    },
    {
      featureType: "road",
      elementType: "labels",
      stylers: [
        {
          visibility: "simplified",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.fill",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 17,
        },
        {
          weight: "0.8",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 29,
        },
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 18,
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry.stroke",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 16,
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "geometry.stroke",
      stylers: [
        {
          weight: "0.01",
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "transit",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 19,
        },
      ],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000",
        },
        {
          lightness: 17,
        },
      ],
    },
  ];
  /* eslint-enable */ function mapStyle(key) {
    return styles[key];
  }

  window.theme.allMaps = window.theme.allMaps || {};
  let allMaps = window.theme.allMaps;
  const selectors$c = {
    mapContainer: "[data-map-container]",
    style: "data-style",
    apiKey: "data-api-key",
    zoom: "data-zoom",
    address: "data-address",
    latLongCorrection: "data-latlong-correction",
    lat: "data-lat",
    long: "data-long",
  };
  let Map$1 = class Map {
    initMaps() {
      const urlKey = `https://maps.googleapis.com/maps/api/js?key=${this.key}`;
      loadScript({
        url: urlKey,
      })
        .then(() => {
          return this.enableCorrection === "true" && this.lat !== "" && this.long !== ""
            ? new window.google.maps.LatLng(this.lat, this.long)
            : geocodeAddressPromise(this.address);
        })
        .then((center) => {
          var zoom = parseInt(this.zoomString, 10);
          const styles = mapStyle(this.styleString);
          var mapOptions = {
            zoom,
            styles,
            center,
            draggable: true,
            clickableIcons: false,
            scrollwheel: false,
            zoomControl: false,
            disableDefaultUI: true,
          };
          const map = createMap(this.mapWrap, mapOptions);
          return map;
        })
        .then((map) => {
          this.map = map;
          allMaps[this.id] = map;
        })
        .catch((e) => {
          console.log("Failed to load Google Map");
          console.log(e);
        });
    }
    onUnload() {
      if (typeof window.google !== "undefined") {
        window.google.maps.event.clearListeners(this.map, "resize");
      }
    }
    constructor(section) {
      this.container = section.container;
      this.mapWrap = this.container.querySelector(selectors$c.mapContainer);
      this.styleString = this.container.getAttribute(selectors$c.style) || "";
      this.key = this.container.getAttribute(selectors$c.apiKey);
      this.zoomString = this.container.getAttribute(selectors$c.zoom) || 14;
      this.address = this.container.getAttribute(selectors$c.address);
      this.enableCorrection = this.container.getAttribute(selectors$c.latLongCorrection);
      this.lat = this.container.getAttribute(selectors$c.lat);
      this.long = this.container.getAttribute(selectors$c.long);
      if (this.key) {
        this.initMaps();
      }
    }
  };
  function createMap(container, options) {
    var map = new window.google.maps.Map(container, options);
    var center = map.getCenter();
    new window.google.maps.Marker({
      map: map,
      position: center,
    });
    window.google.maps.event.addDomListener(window, "resize", function () {
      window.google.maps.event.trigger(map, "resize");
      map.setCenter(center);
    });
    return map;
  }
  function geocodeAddressPromise(address) {
    return new Promise((resolve, reject) => {
      var geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        {
          address: address,
        },
        function (results, status) {
          if (status == "OK") {
            var latLong = {
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng(),
            };
            resolve(latLong);
          } else {
            reject(status);
          }
        },
      );
    });
  }
  const mapSection = {
    onLoad() {
      allMaps[this.id] = new Map$1(this);
    },
    onUnload() {
      if (typeof allMaps[this.id].unload === "function") {
        allMaps[this.id].unload();
      }
    },
  };
  register("section-map", [mapSection, parallaxImage]);

  register("section-columns", [popupVideoSection, customScrollbar]);

  const selectors$b = {
    dataRelatedSectionElem: "[data-related-section]",
    dataRelatedProduct: "[data-grid-item]",
    carousel: "[data-carousel]",
    dataLimit: "data-limit",
    dataMinimum: "data-minimum",
    dataLargeLayout: "data-layout-desktop",
    dataMediumLayout: "data-layout-tablet",
    dataSmallLayout: "data-layout-mobile",
    recentlyViewed: "[data-recent-wrapper]",
    recentlyViewedWrapper: "[data-recently-viewed-wrapper]",
    productId: "data-product-id",
  };
  let Related = class Related {
    init() {
      const relatedSection1 = this.container.querySelector(selectors$b.dataRelatedSectionElem);
      if (!relatedSection1) {
        return;
      }
      const productId = relatedSection1.getAttribute(selectors$b.productId);
      const limit = relatedSection1.getAttribute(selectors$b.dataLimit);
      const layoutLarge = relatedSection1.getAttribute(selectors$b.dataLargeLayout);
      const layoutMedium = relatedSection1.getAttribute(selectors$b.dataMediumLayout);
      const layoutSmall = relatedSection1.getAttribute(selectors$b.dataSmallLayout);
      const route = window.theme.routes.product_recommendations_url || "/recommendations/products/";
      const requestUrl = `${route}?section_id=related&limit=${limit}&product_id=${productId}`;
      axios
        .get(requestUrl)
        .then((response) => {
          const fresh = document.createElement("div");
          fresh.innerHTML = response.data;
          const inner = fresh.querySelector(selectors$b.dataRelatedSectionElem);
          if (inner.querySelector(selectors$b.dataRelatedProduct)) {
            const innerHtml = inner.innerHTML;
            relatedSection1.innerHTML = innerHtml;
            relatedSection1.querySelector(selectors$b.carousel).style.setProperty("--grid-large-items", layoutLarge);
            relatedSection1.querySelector(selectors$b.carousel).style.setProperty("--grid-medium-items", layoutMedium);
            relatedSection1.querySelector(selectors$b.carousel).style.setProperty("--grid-small-items", layoutSmall);
            relatedSection1.dispatchEvent(
              new CustomEvent("theme:related-products:added", {
                bubbles: true,
              }),
            );
          } else {
            relatedSection1.dispatchEvent(
              new CustomEvent("theme:tabs:hide", {
                bubbles: true,
              }),
            );
          }
        })
        .catch(function (error) {
          console.warn(error);
        });
    }
    recent() {
      const recentlyViewedHolder = this.container.querySelector(selectors$b.recentlyViewed);
      const recentlyViewedWrapper = this.container.querySelector(selectors$b.recentlyViewedWrapper);
      const recentProducts1 = this.container.querySelectorAll(selectors$b.dataRelatedProduct);
      const minimumNumberProducts = recentlyViewedHolder.hasAttribute(selectors$b.dataMinimum)
        ? parseInt(recentlyViewedHolder.getAttribute(selectors$b.dataMinimum))
        : 4;
      const checkRecentInRelated = !recentlyViewedWrapper && recentProducts1.length > 0;
      const checkRecentOutsideRelated = recentlyViewedWrapper && recentProducts1.length >= minimumNumberProducts;
      if (checkRecentInRelated || checkRecentOutsideRelated) {
        recentlyViewedHolder.dispatchEvent(
          new CustomEvent("theme:tabs:check", {
            bubbles: true,
          }),
        );
      }
    }
    constructor(section) {
      this.section = section;
      this.container = section.container;
      this.init();
      this.container.addEventListener("theme:recent-products:added", () => {
        this.recent();
      });
    }
  };
  const relatedSection = {
    onLoad() {
      this.section = new Related(this);
    },
  };
  register("related", [relatedSection, tabs$1, recentProducts]);
  if (!customElements.get("radio-swatch")) {
    customElements.define("radio-swatch", RadioSwatch);
  }
  if (!customElements.get("product-grid-item")) {
    customElements.define("product-grid-item", ProductGridItem);
  }
  if (!customElements.get("product-grid-item-variant")) {
    customElements.define("product-grid-item-variant", ProductGridItemVariant);
  }
  if (!customElements.get("product-grid-item-image")) {
    customElements.define("product-grid-item-image", ProductGridItemImage);
  }

  const selectors$a = {
    cartNote: "[data-cart-note]",
  };
  class CartNotes {
    initInputs() {
      this.inputs.forEach((input) => {
        input.addEventListener(
          "input",
          debounce$1(
            function (e) {
              const note = e.target.value.toString() || "";
              this.saveNotes(note);
            }.bind(this),
            300,
          ),
        );
      });
    }
    saveNotes(newNote) {
      window
        .fetch(`${window.theme.routes.cart}/update.js`, {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note: newNote,
          }),
        })
        .catch((e) => {
          console.error(e);
        });
    }
    constructor(element) {
      this.inputs = element.querySelectorAll(selectors$a.cartNote);
      this.initInputs();
    }
  }

  const getUrlString = (params, keys = [], isArray = false) => {
    const p = Object.keys(params)
      .map((key) => {
        let val = params[key];
        if (Object.prototype.toString.call(val) === "[object Object]" || Array.isArray(val)) {
          if (Array.isArray(params)) {
            keys.push("");
          } else {
            keys.push(key);
          }
          return getUrlString(val, keys, Array.isArray(val));
        } else {
          let tKey = key;
          if (keys.length > 0) {
            const tKeys = isArray ? keys : [...keys, key];
            tKey = tKeys.reduce((str, k) => {
              return str === "" ? k : `${str}[${k}]`;
            }, "");
          }
          if (isArray) {
            return `${tKey}[]=${val}`;
          } else {
            return `${tKey}=${val}`;
          }
        }
      })
      .join("&");
    keys.pop();
    return p;
  };

  const selectors$9 = {
    html: "html",
    submitButton: "[data-submit-shipping]",
    form: "[data-shipping-estimate-form]",
    template: "[data-response-template]",
    country: "#estimate_address_country",
    province: "#estimate_address_province",
    zip: "#estimate_address_zip",
    wrapper: "[data-response-wrapper]",
    defaultData: "data-default-fullname",
    lang: "lang",
    defaultData: "data-default",
  };
  const classes$7 = {
    success: "shipping--success",
    error: "errors",
    disable: "disabled",
  };
  class ShippingCalculator {
    enableButtons() {
      this.button.removeAttribute("disabled");
      this.button.classList.remove(classes$7.disable);
    }
    disableButtons() {
      this.button.setAttribute("disabled", "disabled");
      this.button.classList.add(classes$7.disable);
    }
    render(rates) {
      if (this.template && this.ratesWrapper) {
        const rendered = Sqrl__namespace.render(this.template, rates);
        this.ratesWrapper.innerHTML = rendered;
      }
      this.enableButtons();
      this.ratesWrapper.style.removeProperty("display");
    }
    estimate(shipping_address) {
      const encodedShippingAddressData = encodeURI(
        getUrlString({
          shipping_address: shipping_address,
        }),
      );
      const url = `${window.theme.routes.cart}/shipping_rates.json?${encodedShippingAddressData}`;
      const instance = this;
      axios
        .get(url)
        .then(function (response) {
          // handle success
          const items = instance.sanitize(response);
          instance.render(items);
          instance.enableButtons();
          instance.ratesWrapper.style.removeProperty("display");
        })
        .catch(function (error) {
          // handle errors
          const errors = instance.sanitizeErrors(error);
          instance.render(errors);
        });
    }
    sanitize(response) {
      const sanitized = {};
      sanitized.class = classes$7.success;
      sanitized.items = [];
      if (response.data.shipping_rates && response.data.shipping_rates.length > 0) {
        const rates = response.data.shipping_rates;
        rates.forEach((r) => {
          let item = {};
          item.title = r.presentment_name;
          item.value = themeCurrency.formatMoney(r.price, theme.moneyFormat);
          sanitized.items.push(item);
        });
      } else {
        sanitized.items[0] = {
          value: theme.strings.noShippingAvailable,
        };
      }
      return sanitized;
    }
    sanitizeErrors(response) {
      const errors = {};
      errors.class = classes$7.error;
      errors.items = [];
      if (typeof response.data === "object") {
        for (const [key, value] of Object.entries(response.data)) {
          let item = {};
          item.title = key.toString();
          item.value = value.toString();
          errors.items.push(item);
        }
      } else {
        errors.items[0] = {
          value: theme.strings.noShippingAvailable,
        };
      }
      return errors;
    }
    init() {
      const htmlEl = document.querySelector(selectors$9.html);
      let locale = "en";
      if (htmlEl.hasAttribute(selectors$9.lang) && htmlEl.getAttribute(selectors$9.lang) !== "") {
        locale = htmlEl.getAttribute(selectors$9.lang);
      }
      if (this.form) {
        themeAddresses.AddressForm(this.form, locale, {
          shippingCountriesOnly: true,
        });
      }
      if (
        this.country &&
        this.country.hasAttribute(selectors$9.defaultData) &&
        this.province &&
        this.province.hasAttribute(selectors$9.defaultData)
      ) {
        this.country.addEventListener("change", function () {
          this.country.removeAttribute(selectors$9.defaultData);
          this.province.removeAttribute(selectors$9.defaultData);
        });
      }
      if (this.button) {
        this.button.addEventListener(
          "click",
          function (e) {
            e.preventDefault();
            this.disableButtons();
            while (this.ratesWrapper.firstChild) this.ratesWrapper.removeChild(this.ratesWrapper.firstChild);
            this.ratesWrapper.style.display = "none";
            const shippingAddress = {};
            let elemCountryVal = this.country.value;
            let elemProvinceVal = this.province.value;
            const elemCountryData = this.country.getAttribute(selectors$9.defaultData);
            if (elemCountryVal === "" && elemCountryData && elemCountryData !== "") {
              elemCountryVal = elemCountryData;
            }
            const elemProvinceData = this.province.getAttribute(selectors$9.defaultData);
            if (elemProvinceVal === "" && elemProvinceData && elemProvinceData !== "") {
              elemProvinceVal = elemProvinceData;
            }
            shippingAddress.zip = this.zip.value || "";
            shippingAddress.country = elemCountryVal || "";
            shippingAddress.province = elemProvinceVal || "";
            this.estimate(shippingAddress);
          }.bind(this),
        );
      }
    }
    constructor(section) {
      this.button = section.container.querySelector(selectors$9.submitButton);
      this.template = section.container.querySelector(selectors$9.template).innerHTML;
      this.ratesWrapper = section.container.querySelector(selectors$9.wrapper);
      this.form = section.container.querySelector(selectors$9.form);
      this.country = section.container.querySelector(selectors$9.country);
      this.province = section.container.querySelector(selectors$9.province);
      this.zip = section.container.querySelector(selectors$9.zip);
      this.init();
    }
  }

  const selectors$8 = {
    cartMessage: "[data-cart-message]",
    cartMessageValue: "data-cart-message",
    leftToSpend: "[data-left-to-spend]",
    cartProgress: "[data-cart-progress]",
    limit: "data-limit",
    percent: "data-percent",
  };
  const classes$6 = {
    isHidden: "is-hidden",
    isSuccess: "is-success",
  };
  let CartShippingMessage = class CartShippingMessage {
    init() {
      this.cartFreeLimitShipping = Number(this.cartMessage[0].getAttribute(selectors$8.limit)) * 100 * this.rate;
      this.shippingAmount = 0;
      this.circumference = 28 * Math.PI; // radius - stroke * 4 * PI
      this.exchangeRateConversions(this.cartFreeLimitShipping, this.shippingAmount);
      this.cartBarProgress();
      this.listen();
    }
    listen() {
      document.addEventListener(
        "theme:cart:change",
        function (event) {
          this.cart = event.detail.cart;
          this.render();
        }.bind(this),
      );
    }
    render() {
      const totalPrice = this.cart.total_price;
      this.freeShippingMessageHandle(totalPrice);
      if (this.cart && this.cart.total_price) {
        // Build cart again if the quantity of the changed product is 0 or cart discounts are changed
        if (this.cartMessage.length > 0) {
          this.shippingAmount = totalPrice;
          this.updateProgress();
        }
      }
    }
    freeShippingMessageHandle(total) {
      if (this.cartMessage.length > 0) {
        this.container.querySelectorAll(selectors$8.cartMessage).forEach((message) => {
          const hasFreeShipping =
            message.hasAttribute(selectors$8.cartMessageValue) &&
            message.getAttribute(selectors$8.cartMessageValue) === "true" &&
            total >= this.cartFreeLimitShipping &&
            total !== 0;
          message.classList.toggle(classes$6.isSuccess, hasFreeShipping);
        });
      }
    }
    cartBarProgress(progress = null) {
      this.container.querySelectorAll(selectors$8.cartProgress).forEach((element) => {
        this.setProgress(element, progress === null ? element.getAttribute(selectors$8.percent) : progress);
      });
    }
    setProgress(holder, percent) {
      const offset = this.circumference - ((percent / 100) * this.circumference) / 2;
      holder.style.strokeDashoffset = offset;
    }
    updateProgress() {
      const newPercentValue = (this.shippingAmount / this.cartFreeLimitShipping) * 100;
      this.exchangeRateConversions(this.cartFreeLimitShipping, this.shippingAmount);
      this.cartBarProgress(newPercentValue > 100 ? 100 : newPercentValue);
    }
    exchangeRateConversions(cartFreeLimitShipping, shippingAmount) {
      const leftToSpend = theme.settings.currency_code_enable
        ? themeCurrency.formatMoney(cartFreeLimitShipping - shippingAmount, theme.moneyFormat) +
          ` ${theme.currencyCode}`
        : themeCurrency.formatMoney(cartFreeLimitShipping - shippingAmount, theme.moneyFormat);
      this.container.querySelectorAll(selectors$8.leftToSpend).forEach((element) => {
        element.innerHTML = leftToSpend.replace(".00", "");
      });
    }
    constructor(section) {
      this.container = section;
      this.cartMessage = this.container.querySelectorAll(selectors$8.cartMessage);
      this.rate = window.Shopify.currency.rate;
      if (this.cartMessage.length > 0) {
        this.init();
      }
    }
  };

  const selectors$7 = {
    drawer: '[data-drawer="drawer-cart"]',
    shipping: "[data-shipping-estimate-form]",
    loader: "[data-cart-loading]",
    form: "[data-cart-form]",
    emptystate: "[data-cart-empty]",
    progress: "[data-cart-progress]",
    items: "[data-line-items]",
    subtotal: "[data-cart-subtotal]",
    bottom: "[data-cart-bottom]",
    quantity: "[data-quantity-selector]",
    errors: "[data-form-errors]",
    item: "[data-cart-item]",
    finalPrice: "[data-cart-final]",
    key: "data-update-cart",
    remove: "data-remove-key",
    pageUpsellWrapper: "[data-cart-page-upsell-wrapper]",
    cartPage: '[data-section-type="cart"]',
    bar: "[data-cart-bar]",
    ship: "[data-cart-message]",
    itemLoadbar: "[data-item-loadbar]",
    cartMessageContainer: "[data-cart-message-container]",
    apiContent: "[data-api-content]",
  };
  const classes$5 = {
    hidden: "cart--hidden",
    loading: "cart--loading",
  };
  let CartItems = class CartItems {
    listen() {
      document.addEventListener(
        "theme:cart:change",
        function (event) {
          this.cart = event.detail.cart;
          this.stale = true;
        }.bind(this),
      );
      document.addEventListener(
        "theme:cart:init",
        function () {
          this.init();
        }.bind(this),
      );
      document.addEventListener(
        "theme:cart:reload",
        function () {
          this.stale = true;
          if (this.cart) {
            this.loadHTML();
          } else {
            this.init().then(() => this.loadHTML());
          }
        }.bind(this),
      );
      if (this.drawer) {
        this.drawer.addEventListener(
          "theme:drawer:open",
          function () {
            if (this.cart) {
              this.loadHTML();
            } else {
              this.init().then(() => this.loadHTML());
            }
            // tell the add to cart whether to open a popdown
            window.theme.state.cartOpen = true;
          }.bind(this),
        );
        this.drawer.addEventListener("theme:drawer:close", function () {
          window.theme.state.cartOpen = false;
        });
      }
      new CartNotes(this.container);
      new CartShippingMessage(this.container);
    }
    init() {
      return window
        .fetch(`${window.theme.routes.cart}.js`)
        .then(this.handleErrors)
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          this.cart = response;
          this.fireChange(response);
          return response;
        })
        .catch((e) => {
          console.error(e);
        });
    }
    loadHTML(plain = false) {
      if (this.stale) {
        if (this.cart && this.cart.item_count > 0) {
          this.loadForm(plain);
        } else {
          this.showEmpty();
          this.cartMessages.forEach((message) => {
            new CartShippingMessage(message);
          });
        }
      }
      this.stale = false;
    }
    initInputs() {
      this.inputs = this.container.querySelectorAll(`[${selectors$7.key}]`);
      this.inputs.forEach((input) => {
        const key = input.getAttribute(selectors$7.key);
        input.addEventListener(
          "change",
          function (e) {
            const quantity = parseInt(e.target.value, 10);
            this.latestClick = e.target.closest(selectors$7.item);
            this.lockState();
            this.updateCart(key, quantity);
          }.bind(this),
        );
      });
    }
    initRemove() {
      this.removers = this.container.querySelectorAll(`[${selectors$7.remove}]`);
      this.removers.forEach((remover) => {
        const key = remover.getAttribute(selectors$7.remove);
        remover.addEventListener(
          "click",
          function (e) {
            e.preventDefault();
            this.latestClick = e.target.closest(selectors$7.item);
            this.lockState();
            this.updateCart(key, 0);
          }.bind(this),
        );
      });
    }
    lockState() {
      this.latestClick.querySelector(selectors$7.itemLoadbar).style.display = "block";
      this.loader.classList.add(classes$5.loading);
    }
    updateCart(clickedKey, newQuantity) {
      window
        .fetch(`${window.theme.routes.cart}/change.js`, {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: clickedKey,
            quantity: newQuantity,
          }),
        })
        .then(this.handleErrors)
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          this.cart = response;
          slideUp(this.errors);
          this.fireChange(response);
          this.stale = true;
          this.loadHTML();
        })
        .catch((e) => {
          if (e instanceof FetchError) {
            var ref, ref1;
            let defaultMessage = window.theme.strings.stockout || "Could not update cart, please reload";
            let messageText =
              ((ref = e.json) === null || ref === void 0 ? void 0 : ref.message) || e.message || defaultMessage;
            let descriptionText = ((ref1 = e.json) === null || ref1 === void 0 ? void 0 : ref1.description) || "";
            // Low stock erros have the same text content for heading and description
            let contentToShow =
              messageText === descriptionText
                ? `<p>${messageText}</p>`
                : `<p>${messageText}</p> <p>${descriptionText}</p>`;
            this.showError(contentToShow);
            this.loadForm(); // Reset form for cases like "stockout"
          } else {
            let error = `<p>${e.message || defaultMessage}</p>`;
            this.showError(error);
            throw e;
          }
        });
    }
    fireChange(newCart) {
      document.dispatchEvent(
        new CustomEvent("theme:cart:change", {
          detail: {
            cart: newCart,
          },
          bubbles: true,
        }),
      );
    }
    updateTotal() {
      if (this.cart && this.cart.total_price != undefined) {
        const price = themeCurrency.formatMoney(this.cart.total_price, theme.moneyFormat);
        this.finalPrice.innerHTML = price + ` ${theme.currencyCode}`;
      }
      if (this.subtotal && this.cart) {
        window
          .fetch(`${window.theme.routes.root_url}?section_id=api-cart-subtotal`)
          .then(this.handleErrors)
          .then((response) => {
            return response.text();
          })
          .then((response) => {
            const fresh = document.createElement("div");
            fresh.innerHTML = response;
            this.subtotal.innerHTML = fresh.querySelector(selectors$7.apiContent).innerHTML;
          });
      }
    }
    showError(message) {
      slideUp(this.errors);
      this.errors.innerHTML = message;
      window.setTimeout(() => {
        slideDown(this.errors);
      }, 600);
    }
    loadForm(plain = false) {
      if (plain) {
        this.showForm();
        this.initQuantity();
        this.initQuickview();
        this.updateTotal();
        return;
      }
      window
        .fetch(`${window.theme.routes.root_url}?section_id=api-cart-items`)
        .then(this.handleErrors)
        .then((response) => {
          return response.text();
        })
        .then((response) => {
          const fresh = document.createElement("div");
          fresh.innerHTML = response;
          this.items.innerHTML = fresh.querySelector(selectors$7.apiContent).innerHTML;
          this.showForm();
          this.initQuantity();
          this.initQuickview();
          this.updateTotal();
        });
    }
    initQuickview() {
      const pageUpsellWrapper = this.items.querySelector(selectors$7.pageUpsellWrapper);
      const oldPageUpsellWrapper = this.bottom.querySelector(selectors$7.pageUpsellWrapper);
      if (oldPageUpsellWrapper) {
        oldPageUpsellWrapper.remove();
      }
      // Move the upsell to the bottom of the cart beside the checkout button
      if (this.cartPage && pageUpsellWrapper) {
        this.bottom.insertBefore(pageUpsellWrapper, this.bottom.firstChild);
        Alpine.initTree(this.bottom); // Neccesary since we're moving the element around and Alpine isn't able to keep track of tha
      }
    }
    initQuantity() {
      initQtySection(this.container);
      this.initInputs();
      this.initRemove();
    }
    showForm() {
      if (this.bar) {
        this.bar.classList.remove(classes$5.hidden);
      }
      if (this.ship) {
        this.ship.classList.remove(classes$5.hidden);
      }
      if (this.progress) {
        this.progress.classList.remove(classes$5.hidden);
      }
      this.form.classList.remove(classes$5.hidden);
      this.bottom.classList.remove(classes$5.hidden);
      this.loader.classList.remove(classes$5.loading);
      this.emptystate.classList.add(classes$5.hidden);
    }
    showEmpty() {
      if (this.bar) {
        this.bar.classList.add(classes$5.hidden);
      }
      if (this.ship) {
        this.ship.classList.add(classes$5.hidden);
      }
      if (this.progress) {
        this.progress.classList.add(classes$5.hidden);
      }
      this.emptystate.classList.remove(classes$5.hidden);
      this.loader.classList.remove(classes$5.loading);
      this.form.classList.add(classes$5.hidden);
      this.bottom.classList.add(classes$5.hidden);
    }
    handleErrors(response) {
      if (!response.ok) {
        return response.json().then(function (json) {
          const e = new FetchError({
            status: response.statusText,
            headers: response.headers,
            json: json,
          });
          throw e;
        });
      }
      return response;
    }
    constructor(section) {
      this.section = section;
      this.container = section.container;
      this.cartMessages = document.querySelectorAll(selectors$7.cartMessageContainer);
      this.bar = this.container.querySelector(selectors$7.bar);
      this.ship = this.container.querySelector(selectors$7.ship);
      this.drawer = this.container.querySelector(selectors$7.drawer);
      this.form = this.container.querySelector(selectors$7.form);
      this.loader = this.container.querySelector(selectors$7.loader);
      this.bottom = this.container.querySelector(selectors$7.bottom);
      this.items = this.container.querySelector(selectors$7.items);
      this.subtotal = this.container.querySelector(selectors$7.subtotal);
      this.errors = this.container.querySelector(selectors$7.errors);
      this.finalPrice = this.container.querySelector(selectors$7.finalPrice);
      this.emptystate = this.container.querySelector(selectors$7.emptystate);
      this.progress = this.container.querySelector(selectors$7.progress);
      this.latestClick = null;
      this.cart = null;
      this.stale = true;
      this.cartPage = document.querySelector(selectors$7.cartPage);
      this.listen();
    }
  };
  const cartDrawer = {
    onLoad() {
      const isDrawerCart = document.querySelector(selectors$7.drawer);
      if (isDrawerCart) {
        this.cart = new CartItems(this);
      }
      const hasShipping = this.container.querySelector(selectors$7.shipping);
      if (hasShipping) {
        new ShippingCalculator(this);
      }
    },
    onUnload: function () {
      if (this.cart && typeof this.cart.unload === "function") {
        this.cart.unload();
      }
    },
  };

  const selectors$6 = {
    ajaxDisable: "data-ajax-disable",
    shipping: "[data-shipping-estimate-form]",
    input: "[data-update-cart]",
    update: "[data-update-button]",
    bottom: "[data-cart-bottom]",
    upsellWrapper: "[data-cart-page-upsell-wrapper]",
  };
  const classes$4 = {
    dirty: "cart--dirty",
    heartBeat: "heart-beat",
  };
  const cartSection = {
    onLoad() {
      const hasShipping = this.container.querySelector(selectors$6.shipping);
      if (hasShipping) {
        new ShippingCalculator(this);
      }
      this.disabled = this.container.getAttribute(selectors$6.ajaxDisable) == "true";
      if (this.disabled) {
        this.cart = new AjaxDisabledCart(this);
        return;
      }
      this.cart = new CartItems(this);
      const initPromise = this.cart.init();
      initPromise.then(() => {
        this.cart.loadHTML(true);
      });
    },
  };
  let AjaxDisabledCart = class AjaxDisabledCart {
    initQuantity() {
      initQtySection(this.container);
    }
    moveUpsell() {
      const bottom = this.container.querySelector(selectors$6.bottom);
      bottom.insertBefore(this.upsellWrapper, bottom.firstChild);
    }
    initInputs() {
      this.inputs.forEach((input) => {
        input.addEventListener(
          "change",
          function () {
            this.updateBtn.classList.add(classes$4.dirty);
            this.updateBtn.classList.add(classes$4.heartBeat);
            setTimeout(
              function () {
                this.updateBtn.classList.remove(classes$4.heartBeat);
              }.bind(this),
              1300,
            );
          }.bind(this),
        );
      });
    }
    constructor(section) {
      window.theme.state.cartOpen = true;
      this.section = section;
      this.container = section.container;
      this.inputs = this.container.querySelectorAll(selectors$6.input);
      this.quantityWrappers = this.container.querySelectorAll(selectors$6.qty);
      this.updateBtn = this.container.querySelector(selectors$6.update);
      this.upsellWrapper = this.container.querySelector(selectors$6.upsellWrapper);
      this.initQuantity();
      this.initInputs();
      if (this.upsellWrapper) {
        this.moveUpsell();
      }
      document.addEventListener(
        "theme:cart:reload",
        function () {
          window.location.reload();
        }.bind(this),
      );
    }
  };
  register("cart", [cartSection, accordion]);

  register("cart-drawer", [drawer, cartDrawer, accordion]);

  register("accordion-single", accordion);

  const fadeIn = (el, display, callback = null) => {
    el.style.opacity = 0;
    el.style.display = "block";
    (function fade() {
      let val = parseFloat(el.style.opacity);
      if (!((val += 0.1) > 1)) {
        el.style.opacity = val;
        requestAnimationFrame(fade);
      }
      if (val === 1 && typeof callback === "function") {
        callback();
      }
    })();
  };

  const fadeOut = (el, callback = null) => {
    el.style.opacity = 1;
    (function fade() {
      if ((el.style.opacity -= 0.1) < 0) {
        el.style.display = "none";
      } else {
        requestAnimationFrame(fade);
      }
      if (parseFloat(el.style.opacity) === 0 && typeof callback === "function") {
        callback();
      }
    })();
  };

  const selectors$5 = {
    tracking: "[data-tracking-consent]",
    trackingAccept: "[data-confirm-cookies]",
    close: "[data-close-modal]",
    popupInner: "[data-popup-inner]",
    newsletterPopup: "[data-newsletter]",
    newsletterPopupHolder: "[data-newsletter-holder]",
    newsletterField: "[data-newsletter-field]",
    newsletterForm: "[data-newsletter-form]",
    promoPopup: "[data-promo-text]",
    delayAttribite: "data-popup-delay",
    cookieNameAttribute: "data-cookie-name",
    dataTargetReferrer: "data-target-referrer",
  };
  const classes$3 = {
    hide: "hide",
    hasValue: "has-value",
    success: "has-success",
    error: "has-error",
    desktop: "desktop",
    mobile: "mobile",
  };
  let sections$1 = {};
  let PopupCookie = class PopupCookie {
    write() {
      const hasCookie =
        document.cookie.indexOf("; ") !== -1 && !document.cookie.split("; ").find((row) => row.startsWith(this.name));
      if (hasCookie || document.cookie.indexOf("; ") === -1) {
        document.cookie = `${this.name}=${this.value}; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}`;
      }
    }
    read() {
      if (
        document.cookie.indexOf("; ") !== -1 &&
        document.cookie.split("; ").find((row) => row.startsWith(this.name))
      ) {
        const returnCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith(this.name))
          .split("=")[1];
        return returnCookie;
      } else return false;
    }
    destroy() {
      if (document.cookie.split("; ").find((row) => row.startsWith(this.name))) {
        document.cookie = `${this.name}=null; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}`;
      }
    }
    constructor(name, value) {
      this.configuration = {
        expires: null,
        path: "/",
        domain: window.location.hostname,
      };
      this.name = name;
      this.value = value;
    }
  };
  let DelayShow = class DelayShow {
    hide() {
      this.show = false;
    }
    always() {
      if (this.show) {
        fadeIn(this.element);
      }
    }
    delayed() {
      // Show popup after 10s
      setTimeout(() => {
        this.always();
      }, 10000);
    }
    // Scroll to the bottom of the page
    bottom() {
      let raf;
      const onScroll = () => {
        if (raf) {
          window.cancelAnimationFrame(raf);
        }
        raf = window.requestAnimationFrame(() => {
          window.requestIdleCallback(
            () => {
              if (Math.round(window.scrollY + window.innerHeight) >= Math.round(document.body.clientHeight)) {
                this.always();
                window.removeEventListener("scroll", onScroll, {
                  passive: true,
                });
              }
            },
            {
              timeout: 300,
            },
          );
        });
      };
      window.addEventListener("scroll", onScroll, {
        passive: true,
      });
    }
    onScroll() {}
    // Idle for 1 min
    idle() {
      let timer = 0;
      let idleTime = 60000;
      const documentEvents = [
        "mousemove",
        "mousedown",
        "click",
        "touchmove",
        "touchstart",
        "touchend",
        "keydown",
        "keypress",
      ];
      const windowEvents = ["load", "resize", "scroll"];
      const startTimer = () => {
        timer = setTimeout(() => {
          timer = 0;
          this.always();
        }, idleTime);
        documentEvents.forEach((eventType) => {
          document.addEventListener(eventType, resetTimer);
        });
        windowEvents.forEach((eventType) => {
          window.addEventListener(eventType, resetTimer);
        });
      };
      const resetTimer = () => {
        if (timer) {
          clearTimeout(timer);
        }
        documentEvents.forEach((eventType) => {
          document.removeEventListener(eventType, resetTimer);
        });
        windowEvents.forEach((eventType) => {
          window.removeEventListener(eventType, resetTimer);
        });
        startTimer();
      };
      startTimer();
    }
    constructor(holder, element) {
      this.show = true;
      this.element = element;
      this.delay = holder.getAttribute(selectors$5.delayAttribite);
      if (this.delay === "always") {
        this.always();
      }
      if (this.delay === "delayed") {
        this.delayed();
      }
      if (this.delay === "bottom") {
        this.bottom();
      }
      if (this.delay === "idle") {
        this.idle();
      }
    }
  };
  let TargetReferrer = class TargetReferrer {
    init() {
      if (
        this.locationPath.indexOf(this.el.getAttribute(selectors$5.dataTargetReferrer)) === -1 &&
        !window.Shopify.designMode
      ) {
        this.el.parentNode.removeChild(this.el);
      }
    }
    constructor(el) {
      this.el = el;
      this.locationPath = location.href;
      if (!this.el.hasAttribute(selectors$5.dataTargetReferrer)) {
        return;
      }
      this.init();
    }
  };
  let Tracking = class Tracking {
    init() {
      if (this.showPopup) {
        fadeIn(this.modalInner);
      }
      this.clickEvents();
    }
    clickEvents() {
      this.close.addEventListener("click", (event) => {
        event.preventDefault();
        window.Shopify.customerPrivacy.setTrackingConsent(false, () => fadeOut(this.modalInner));
      });
      this.acceptButton.addEventListener("click", (event) => {
        event.preventDefault();
        window.Shopify.customerPrivacy.setTrackingConsent(true, () => fadeOut(this.modalInner));
      });
      document.addEventListener("trackingConsentAccepted", function () {
        console.log("trackingConsentAccepted event fired");
      });
    }
    onBlockSelect(evt) {
      if (this.popup.contains(evt.target) && this.showPopup) {
        fadeIn(this.modalInner);
      }
    }
    onBlockDeselect(evt) {
      if (this.popup.contains(evt.target)) {
        fadeOut(this.modalInner);
      }
    }
    constructor(el) {
      this.popup = el;
      this.modal = document.querySelector(selectors$5.tracking);
      this.modalInner = this.popup.querySelector(selectors$5.popupInner);
      this.close = this.modal.querySelector(selectors$5.close);
      this.acceptButton = this.modal.querySelector(selectors$5.trackingAccept);
      this.enable = this.modal.getAttribute("data-enable") === "true";
      this.showPopup = false;
      window.Shopify.loadFeatures(
        [
          {
            name: "consent-tracking-api",
            version: "0.1",
          },
        ],
        (error) => {
          if (error) {
            throw error;
          }
          const userCanBeTracked = window.Shopify.customerPrivacy.userCanBeTracked();
          const userTrackingConsent = window.Shopify.customerPrivacy.getTrackingConsent();
          this.showPopup = !userCanBeTracked && userTrackingConsent === "no_interaction" && this.enable;
          if (window.Shopify.designMode) {
            this.showPopup = true;
          }
          this.init();
        },
      );
    }
  };
  let PromoText = class PromoText {
    init() {
      const cookieExists = this.cookie.read() !== false;
      if (!cookieExists || window.Shopify.designMode) {
        if (!window.Shopify.designMode) {
          new DelayShow(this.popup, this.popupInner);
        } else {
          fadeIn(this.popupInner);
        }
        this.clickEvents();
      }
    }
    clickEvents() {
      this.close.addEventListener("click", (event) => {
        event.preventDefault();
        fadeOut(this.popupInner);
        this.cookie.write();
      });
    }
    onBlockSelect(evt) {
      if (this.popup.classList.contains(classes$3.mobile)) {
        this.hasDeviceClass = classes$3.mobile;
      }
      if (this.popup.classList.contains(classes$3.desktop)) {
        this.hasDeviceClass = classes$3.desktop;
      }
      if (this.hasDeviceClass !== "") {
        this.popup.classList.remove(this.hasDeviceClass);
      }
      if (this.popup.contains(evt.target)) {
        fadeIn(this.popupInner);
      }
    }
    onBlockDeselect(evt) {
      if (this.popup.contains(evt.target)) {
        fadeOut(this.popupInner);
      }
      if (this.hasDeviceClass !== "") {
        this.popup.classList.add(this.hasDeviceClass);
      }
    }
    constructor(el) {
      this.popup = el;
      this.popupInner = this.popup.querySelector(selectors$5.popupInner);
      this.close = this.popup.querySelector(selectors$5.close);
      this.cookie = new PopupCookie(this.popup.getAttribute(selectors$5.cookieNameAttribute), "user_has_closed");
      this.isTargeted = new TargetReferrer(this.popup);
      this.hasDeviceClass = "";
      this.init();
    }
  };
  let NewsletterPopup = class NewsletterPopup {
    init() {
      const cookieExists = this.cookie.read() !== false;
      if (!cookieExists || window.Shopify.designMode) {
        this.show();
        this.checkForSuccess();
      }
    }
    show() {
      if (!window.Shopify.designMode) {
        this.delayShow = new DelayShow(this.popup, this.popupInner);
      } else {
        fadeIn(this.popupInner);
      }
      this.inputField();
      this.closePopup();
    }
    preventDelayShow() {
      //prevent delay show from showing the popup after close
      if (this.delayShow) {
        this.delayShow.hide();
      }
    }
    checkForSuccess() {
      //check for success or error message to show the form without delay
      const hasError = this.form.classList.contains(classes$3.error);
      const hasSuccess = this.form.classList.contains(classes$3.success);
      if (hasSuccess || hasError) {
        fadeIn(this.popupInner);
        this.preventDelayShow();
        //write cookie if has success
        if (hasSuccess) {
          this.cookie.write();
        }
      }
    }
    closePopup() {
      this.close.addEventListener("click", (event) => {
        event.preventDefault();
        fadeOut(this.popupInner);
        this.cookie.write();
        this.preventDelayShow();
      });
    }
    inputField() {
      this.newsletterField.addEventListener("input", () => {
        if (this.newsletterField.value !== "") {
          this.holder.classList.add(classes$3.hasValue, this.newsletterField.value !== "");
        }
      });
      this.newsletterField.addEventListener("focus", () => {
        if (this.newsletterField.value !== "") {
          this.holder.classList.add(classes$3.hasValue, this.newsletterField.value !== "");
        }
      });
      this.newsletterField.addEventListener("focusout", () => {
        setTimeout(() => {
          this.holder.classList.remove(classes$3.hasValue);
        }, 2000);
      });
    }
    onBlockSelect(evt) {
      if (this.popup.contains(evt.target)) {
        fadeIn(this.popupInner);
      }
    }
    onBlockDeselect(evt) {
      if (this.popup.contains(evt.target)) {
        fadeOut(this.popupInner);
      }
    }
    constructor(el) {
      this.popup = el;
      this.popupInner = this.popup.querySelector(selectors$5.popupInner);
      this.holder = this.popup.querySelector(selectors$5.newsletterPopupHolder);
      this.close = this.popup.querySelector(selectors$5.close);
      this.newsletterField = this.popup.querySelector(selectors$5.newsletterField);
      this.cookie = new PopupCookie(this.popup.getAttribute(selectors$5.cookieNameAttribute), "newsletter_is_closed");
      this.form = this.popup.querySelector(selectors$5.newsletterForm);
      this.isTargeted = new TargetReferrer(this.popup);
      this.delayShow = null;
      this.init();
    }
  };
  const popupSection = {
    onLoad() {
      sections$1[this.id] = [];
      const tracking = this.container.querySelectorAll(selectors$5.tracking);
      tracking.forEach((el) => {
        sections$1[this.id].push(new Tracking(el));
      });
      const newsletterPopup = this.container.querySelectorAll(selectors$5.newsletterPopup);
      newsletterPopup.forEach((el) => {
        sections$1[this.id].push(new NewsletterPopup(el));
      });
      const promoPopup = this.container.querySelectorAll(selectors$5.promoPopup);
      promoPopup.forEach((el) => {
        sections$1[this.id].push(new PromoText(el));
      });
    },
    onBlockSelect(evt) {
      sections$1[this.id].forEach((el) => {
        if (typeof el.onBlockSelect === "function") {
          el.onBlockSelect(evt);
        }
      });
    },
    onBlockDeselect(evt) {
      sections$1[this.id].forEach((el) => {
        if (typeof el.onBlockDeselect === "function") {
          el.onBlockDeselect(evt);
        }
      });
    },
  };
  register("popups", [newsletterCheckForResultSection, popupSection]);

  const selectors$4 = {
    dot: "data-look-dot",
    productsHolder: "data-products-holder",
    slider: "[data-carousel]",
    buttonClose: "[data-button-close-holder]",
    slideIndex: "data-carousel-index",
    blockId: "data-block-id",
    focusable: "button",
  };
  const classes$2 = {
    active: "is-active",
    expand: "is-expanded",
  };
  const sections = {};
  let Look = class Look {
    init() {
      this.keyEvents = (e) => this.keyboardEventShowProductHolder(e);
      this.keyCloseEvent = (e) => this.hideProductsHolder(e);
      this.clickEventsDot = (e) => this.clickEventShowProductsHolder(e);
      this.clickEventToClose = (e) => this.clickEventCloseProductsHolder(e);
      this.toggleOnResize = (e) => debounce$1(this.onResize(e), 200);
      this.initSlider();
      this.addEvents();
    }
    /**
     * Init slider and add event for select slide
     */ initSlider() {
      if (!this.slider) {
        return;
      }
      this.carousel = Flickity.data(this.slider);
      this.carousel.options.wrapAround = true;
      this.carousel.options.freeScroll = false;
      this.carousel.resize();
      this.carousel.on("change", (index) => {
        this.currentDot = this.container.querySelector(`[${selectors$4.dot}="${index}"]`);
        this.currentDot.classList.add(classes$2.active);
        this.removeClassOnSiblingDots();
      });
    }
    /**
     * Add events
     */ addEvents() {
      this.dots.forEach((dot) => {
        dot.addEventListener("click", this.clickEventsDot);
        dot.addEventListener("keyup", this.keyEvents);
      });
      document.addEventListener("keyup", this.keyCloseEvent);
      document.addEventListener("theme:resize", this.toggleOnResize);
      if (this.buttonClose) {
        this.buttonClose.addEventListener("click", this.clickEventToClose);
      }
    }
    /**
     * Show products holder
     */ showProductsHolder() {
      const selectCellAnimate = !this.productsHolder.classList.contains(classes$2.expand);
      this.currentDot.classList.toggle(classes$2.active);
      this.productsHolder.classList.toggle(classes$2.expand, this.currentDot.classList.contains(classes$2.active));
      if (isMobile()) {
        this.productsHolder.dispatchEvent(
          new CustomEvent("theme:scroll:lock", {
            bubbles: true,
          }),
        );
      }
      if (this.currentDot.classList.contains(classes$2.active)) {
        this.hasDefaultOpen = true;
        this.carousel.selectCell(Number(this.currentDot.getAttribute(selectors$4.dot)), true, selectCellAnimate);
      }
      this.removeClassOnSiblingDots();
    }
    /**
     * Hide products holder on keypress button 'escape'
     * @param {Object} e
     * @returns
     */ hideProductsHolder(e) {
      if (e.code !== "Escape") {
        return;
      }
      this.removeClasses();
      removeTrapFocus();
      this.currentDot.focus();
    }
    /**
     * Remove classes on productsHolder and currentDot
     */ removeClasses() {
      this.productsHolder.dispatchEvent(
        new CustomEvent("theme:scroll:unlock", {
          bubbles: true,
        }),
      );
      this.productsHolder.classList.remove(classes$2.expand);
      this.currentDot.classList.remove(classes$2.active);
      this.hasDefaultOpen = false;
    }
    /**
     * Click event method for show products holder
     * @param {Object} e
     */ clickEventShowProductsHolder(e) {
      this.currentDot = e.currentTarget;
      this.showProductsHolder();
    }
    /**
     * Click event method for hide products holder
     */ clickEventCloseProductsHolder() {
      this.removeClasses();
    }
    /**
     * Keyboard event method for show products holder and active trapfocus
     * @param {Object} e
     * @returns
     */ keyboardEventShowProductHolder(e) {
      if (e.code !== "Enter" && e.code !== "Space") {
        return;
      }
      setTimeout(() => {
        const firstFocus = this.productsHolder.querySelector(selectors$4.focusable);
        trapFocus(this.productsHolder, {
          elementToFocus: firstFocus,
        });
      }, 400);
    }
    /**
     * Hide default expanded for mobile devices and show if exists for larger devices
     */ onResize() {
      if (this.currentDot) {
        if (window.innerWidth < window.theme.sizes.medium) {
          this.removeClasses();
        } else if (this.hasDefaultOpen) {
          this.currentDot.classList.add(classes$2.active);
          this.productsHolder.classList.add(classes$2.expand);
        }
      }
    }
    /**
     * Remove events
     */ removeEvents() {
      this.dots.forEach((dot) => {
        dot.removeEventListener("click", this.clickEventsDot);
        dot.removeEventListener("keyup", this.keyEvents);
      });
      document.removeEventListener("keyup", this.keyCloseEvent);
      document.removeEventListener("theme:resize", this.toggleOnResize);
      if (this.buttonClose) {
        this.buttonClose.removeEventListener("click", this.clickEventToClose);
      }
    }
    /**
     * Remove active class on sibling dots
     */ removeClassOnSiblingDots() {
      for (let sibling of this.currentDot.parentNode.children) {
        if (sibling !== this.currentDot) {
          sibling.classList.remove(classes$2.active);
        }
      }
    }
    onUnload() {
      if (this.slider && this.carousel) {
        this.carousel.destroy();
      }
      this.removeEvents();
    }
    onBlockSelect(e) {
      if (this.slider && this.carousel) {
        const slide = this.container.querySelector(`[${selectors$4.blockId}="${e.detail.blockId}"]`);
        this.productsHolder.classList.add(classes$2.expand);
        this.carousel.selectCell(Number(slide.getAttribute(selectors$4.slideIndex)), true, true);
      }
    }
    onBlockDeselect() {
      if (window.innerWidth < window.theme.sizes.medium) {
        this.productsHolder.classList.remove(classes$2.expand);
        this.currentDot.classList.remove(classes$2.active);
      }
    }
    constructor(section) {
      this.section = section;
      this.container = this.section.container;
      this.dots = this.container.querySelectorAll(`[${selectors$4.dot}]`);
      this.productsHolder = this.container.querySelector(`[${selectors$4.productsHolder}]`);
      this.slider = this.container.querySelector(selectors$4.slider);
      this.buttonClose = this.container.querySelector(selectors$4.buttonClose);
      this.currentDot = this.container.querySelector(`[${selectors$4.dot}].${classes$2.active}`);
      this.hasDefaultOpen = Boolean(this.currentDot);
      this.init();
    }
  };
  const lookSection = {
    onLoad() {
      sections[this.id] = [];
      sections[this.id].push(new Look(this));
    },
    onUnload() {
      sections[this.id].forEach((el) => {
        if (typeof el.onUnload === "function") {
          el.onUnload();
        }
      });
    },
    onBlockSelect(e) {
      sections[this.id].forEach((el) => {
        if (typeof el.onBlockSelect === "function") {
          el.onBlockSelect(e);
        }
      });
    },
    onBlockDeselect(e) {
      sections[this.id].forEach((el) => {
        if (typeof el.onBlockDeselect === "function") {
          el.onBlockDeselect(e);
        }
      });
    },
  };
  register("look", [lookSection]);

  register("featured-article", parallaxImage);

  const wrap$1 = (toWrap, wrapperClass = "", wrapper) => {
    wrapper = wrapper || document.createElement("div");
    wrapper.classList.add(wrapperClass);
    toWrap.parentNode.insertBefore(wrapper, toWrap);
    return wrapper.appendChild(toWrap);
  };

  // Animate on scroll
  if (window.theme.settings.animate_scroll) {
    AOS.init({
      once: true,
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    // Detect menu height early to prevent CLS
    const menuEl = document.querySelector("[data-header-height]");
    if (menuEl) {
      const menuHeight = menuEl.clientHeight || 0;
      document.documentElement.style.setProperty("--menu-height", `${menuHeight}px`);
    }
    // Load all registered sections on the page.
    load("*");
    // Animate on hover
    if (window.theme.settings.animate_hover) {
      document.body.classList.add("theme-animate-hover");
    }
    // Target tables to make them scrollable
    const tableSelectors = ".rte table";
    const tables = document.querySelectorAll(tableSelectors);
    tables.forEach((table) => {
      wrap$1(table, "rte__table-wrapper");
    });
    // Target iframes to make them responsive
    const iframeSelectors =
      '.rte iframe[src*="youtube.com/embed"], .rte iframe[src*="player.vimeo"], .rte iframe#admin_bar_iframe';
    const frames = document.querySelectorAll(iframeSelectors);
    frames.forEach((frame) => {
      wrap$1(frame, "rte__video-wrapper");
    });
    document.addEventListener("mousedown", () => {
      document.body.classList.remove("focus-enabled");
    });
    document.addEventListener("keyup", (event) => {
      if (event.code === "Tab") {
        document.body.classList.add("focus-enabled");
      }
    });
    // Apply a specific class to the html element for browser support of cookies.
    if (window.navigator.cookieEnabled) {
      document.documentElement.className = document.documentElement.className.replace(
        "supports-no-cookies",
        "supports-cookies",
      );
    }
    // Common a11y fixes
    focusHash();
    bindInPageLinks();
    let hasNativeSmoothScroll = "scrollBehavior" in document.documentElement.style;
    if (!hasNativeSmoothScroll) {
      loadScript({
        url: window.theme.assets.smoothscroll,
      });
    }
  });

  // node_modules/tabbable/dist/index.esm.js
  var candidateSelectors = [
    "input",
    "select",
    "textarea",
    "a[href]",
    "button",
    "[tabindex]",
    "audio[controls]",
    "video[controls]",
    '[contenteditable]:not([contenteditable="false"])',
    "details>summary:first-of-type",
    "details",
  ];
  var candidateSelector = /* @__PURE__ */ candidateSelectors.join(",");
  var matches =
    typeof Element === "undefined"
      ? function () {}
      : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  var getCandidates = function getCandidates2(el, includeContainer, filter) {
    var candidates = Array.prototype.slice.apply(el.querySelectorAll(candidateSelector));
    if (includeContainer && matches.call(el, candidateSelector)) {
      candidates.unshift(el);
    }
    candidates = candidates.filter(filter);
    return candidates;
  };
  var isContentEditable = function isContentEditable2(node) {
    return node.contentEditable === "true";
  };
  var getTabindex = function getTabindex2(node) {
    var tabindexAttr = parseInt(node.getAttribute("tabindex"), 10);
    if (!isNaN(tabindexAttr)) {
      return tabindexAttr;
    }
    if (isContentEditable(node)) {
      return 0;
    }
    if (
      (node.nodeName === "AUDIO" || node.nodeName === "VIDEO" || node.nodeName === "DETAILS") &&
      node.getAttribute("tabindex") === null
    ) {
      return 0;
    }
    return node.tabIndex;
  };
  var sortOrderedTabbables = function sortOrderedTabbables2(a, b) {
    return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex;
  };
  var isInput = function isInput2(node) {
    return node.tagName === "INPUT";
  };
  var isHiddenInput = function isHiddenInput2(node) {
    return isInput(node) && node.type === "hidden";
  };
  var isDetailsWithSummary = function isDetailsWithSummary2(node) {
    var r =
      node.tagName === "DETAILS" &&
      Array.prototype.slice.apply(node.children).some(function (child) {
        return child.tagName === "SUMMARY";
      });
    return r;
  };
  var getCheckedRadio = function getCheckedRadio2(nodes, form) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].checked && nodes[i].form === form) {
        return nodes[i];
      }
    }
  };
  var isTabbableRadio = function isTabbableRadio2(node) {
    if (!node.name) {
      return true;
    }
    var radioScope = node.form || node.ownerDocument;
    var queryRadios = function queryRadios2(name) {
      return radioScope.querySelectorAll('input[type="radio"][name="' + name + '"]');
    };
    var radioSet;
    if (typeof window !== "undefined" && typeof window.CSS !== "undefined" && typeof window.CSS.escape === "function") {
      radioSet = queryRadios(window.CSS.escape(node.name));
    } else {
      try {
        radioSet = queryRadios(node.name);
      } catch (err) {
        console.error(
          "Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s",
          err.message,
        );
        return false;
      }
    }
    var checked = getCheckedRadio(radioSet, node.form);
    return !checked || checked === node;
  };
  var isRadio$1 = function isRadio2(node) {
    return isInput(node) && node.type === "radio";
  };
  var isNonTabbableRadio = function isNonTabbableRadio2(node) {
    return isRadio$1(node) && !isTabbableRadio(node);
  };
  var isHidden = function isHidden2(node, displayCheck) {
    if (getComputedStyle(node).visibility === "hidden") {
      return true;
    }
    var isDirectSummary = matches.call(node, "details>summary:first-of-type");
    var nodeUnderDetails = isDirectSummary ? node.parentElement : node;
    if (matches.call(nodeUnderDetails, "details:not([open]) *")) {
      return true;
    }
    if (!displayCheck || displayCheck === "full") {
      while (node) {
        if (getComputedStyle(node).display === "none") {
          return true;
        }
        node = node.parentElement;
      }
    } else if (displayCheck === "non-zero-area") {
      var _node$getBoundingClie = node.getBoundingClientRect(),
        width = _node$getBoundingClie.width,
        height = _node$getBoundingClie.height;
      return width === 0 && height === 0;
    }
    return false;
  };
  var isDisabledFromFieldset = function isDisabledFromFieldset2(node) {
    if (isInput(node) || node.tagName === "SELECT" || node.tagName === "TEXTAREA" || node.tagName === "BUTTON") {
      var parentNode = node.parentElement;
      while (parentNode) {
        if (parentNode.tagName === "FIELDSET" && parentNode.disabled) {
          for (var i = 0; i < parentNode.children.length; i++) {
            var child = parentNode.children.item(i);
            if (child.tagName === "LEGEND") {
              if (child.contains(node)) {
                return false;
              }
              return true;
            }
          }
          return true;
        }
        parentNode = parentNode.parentElement;
      }
    }
    return false;
  };
  var isNodeMatchingSelectorFocusable = function isNodeMatchingSelectorFocusable2(options, node) {
    if (
      node.disabled ||
      isHiddenInput(node) ||
      isHidden(node, options.displayCheck) ||
      isDetailsWithSummary(node) ||
      isDisabledFromFieldset(node)
    ) {
      return false;
    }
    return true;
  };
  var isNodeMatchingSelectorTabbable = function isNodeMatchingSelectorTabbable2(options, node) {
    if (!isNodeMatchingSelectorFocusable(options, node) || isNonTabbableRadio(node) || getTabindex(node) < 0) {
      return false;
    }
    return true;
  };
  var tabbable = function tabbable2(el, options) {
    options = options || {};
    var regularTabbables = [];
    var orderedTabbables = [];
    var candidates = getCandidates(el, options.includeContainer, isNodeMatchingSelectorTabbable.bind(null, options));
    candidates.forEach(function (candidate, i) {
      var candidateTabindex = getTabindex(candidate);
      if (candidateTabindex === 0) {
        regularTabbables.push(candidate);
      } else {
        orderedTabbables.push({
          documentOrder: i,
          tabIndex: candidateTabindex,
          node: candidate,
        });
      }
    });
    var tabbableNodes = orderedTabbables
      .sort(sortOrderedTabbables)
      .map(function (a) {
        return a.node;
      })
      .concat(regularTabbables);
    return tabbableNodes;
  };
  var focusable = function focusable2(el, options) {
    options = options || {};
    var candidates = getCandidates(el, options.includeContainer, isNodeMatchingSelectorFocusable.bind(null, options));
    return candidates;
  };
  var focusableCandidateSelector = /* @__PURE__ */ candidateSelectors.concat("iframe").join(",");
  var isFocusable = function isFocusable2(node, options) {
    options = options || {};
    if (!node) {
      throw new Error("No node provided");
    }
    if (matches.call(node, focusableCandidateSelector) === false) {
      return false;
    }
    return isNodeMatchingSelectorFocusable(options, node);
  };
  // node_modules/focus-trap/dist/focus-trap.esm.js
  function ownKeys$1(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) {
        symbols = symbols.filter(function (sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        });
      }
      keys.push.apply(keys, symbols);
    }
    return keys;
  }
  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};
      if (i % 2) {
        ownKeys$1(Object(source), true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys$1(Object(source)).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }
    return target;
  }
  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var activeFocusTraps = (function () {
    var trapQueue = [];
    return {
      activateTrap: function activateTrap(trap) {
        if (trapQueue.length > 0) {
          var activeTrap = trapQueue[trapQueue.length - 1];
          if (activeTrap !== trap) {
            activeTrap.pause();
          }
        }
        var trapIndex = trapQueue.indexOf(trap);
        if (trapIndex === -1) {
          trapQueue.push(trap);
        } else {
          trapQueue.splice(trapIndex, 1);
          trapQueue.push(trap);
        }
      },
      deactivateTrap: function deactivateTrap(trap) {
        var trapIndex = trapQueue.indexOf(trap);
        if (trapIndex !== -1) {
          trapQueue.splice(trapIndex, 1);
        }
        if (trapQueue.length > 0) {
          trapQueue[trapQueue.length - 1].unpause();
        }
      },
    };
  })();
  var isSelectableInput = function isSelectableInput2(node) {
    return node.tagName && node.tagName.toLowerCase() === "input" && typeof node.select === "function";
  };
  var isEscapeEvent = function isEscapeEvent2(e) {
    return e.key === "Escape" || e.key === "Esc" || e.keyCode === 27;
  };
  var isTabEvent = function isTabEvent2(e) {
    return e.key === "Tab" || e.keyCode === 9;
  };
  var delay = function delay2(fn) {
    return setTimeout(fn, 0);
  };
  var findIndex = function findIndex2(arr, fn) {
    var idx = -1;
    arr.every(function (value, i) {
      if (fn(value)) {
        idx = i;
        return false;
      }
      return true;
    });
    return idx;
  };
  var valueOrHandler = function valueOrHandler2(value) {
    for (var _len = arguments.length, params = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      params[_key - 1] = arguments[_key];
    }
    return typeof value === "function" ? value.apply(void 0, params) : value;
  };
  var createFocusTrap = function createFocusTrap2(elements, userOptions) {
    var doc = document;
    var config = _objectSpread2(
      {
        returnFocusOnDeactivate: true,
        escapeDeactivates: true,
        delayInitialFocus: true,
      },
      userOptions,
    );
    var state = {
      // @type {Array<HTMLElement>}
      containers: [],
      // list of objects identifying the first and last tabbable nodes in all containers/groups in
      //  the trap
      // NOTE: it's possible that a group has no tabbable nodes if nodes get removed while the trap
      //  is active, but the trap should never get to a state where there isn't at least one group
      //  with at least one tabbable node in it (that would lead to an error condition that would
      //  result in an error being thrown)
      // @type {Array<{ container: HTMLElement, firstTabbableNode: HTMLElement|null, lastTabbableNode: HTMLElement|null }>}
      tabbableGroups: [],
      nodeFocusedBeforeActivation: null,
      mostRecentlyFocusedNode: null,
      active: false,
      paused: false,
      // timer ID for when delayInitialFocus is true and initial focus in this trap
      //  has been delayed during activation
      delayInitialFocusTimer: void 0,
    };
    var trap;
    var getOption = function getOption2(configOverrideOptions, optionName, configOptionName) {
      return configOverrideOptions && configOverrideOptions[optionName] !== void 0
        ? configOverrideOptions[optionName]
        : config[configOptionName || optionName];
    };
    var containersContain = function containersContain2(element) {
      return state.containers.some(function (container) {
        return container.contains(element);
      });
    };
    var getNodeForOption = function getNodeForOption2(optionName) {
      var optionValue = config[optionName];
      if (!optionValue) {
        return null;
      }
      var node = optionValue;
      if (typeof optionValue === "string") {
        node = doc.querySelector(optionValue);
        if (!node) {
          throw new Error("`".concat(optionName, "` refers to no known node"));
        }
      }
      if (typeof optionValue === "function") {
        node = optionValue();
        if (!node) {
          throw new Error("`".concat(optionName, "` did not return a node"));
        }
      }
      return node;
    };
    var getInitialFocusNode = function getInitialFocusNode2() {
      var node;
      if (getOption({}, "initialFocus") === false) {
        return false;
      }
      if (getNodeForOption("initialFocus") !== null) {
        node = getNodeForOption("initialFocus");
      } else if (containersContain(doc.activeElement)) {
        node = doc.activeElement;
      } else {
        var firstTabbableGroup = state.tabbableGroups[0];
        var firstTabbableNode = firstTabbableGroup && firstTabbableGroup.firstTabbableNode;
        node = firstTabbableNode || getNodeForOption("fallbackFocus");
      }
      if (!node) {
        throw new Error("Your focus-trap needs to have at least one focusable element");
      }
      return node;
    };
    var updateTabbableNodes = function updateTabbableNodes2() {
      state.tabbableGroups = state.containers
        .map(function (container) {
          var tabbableNodes = tabbable(container);
          if (tabbableNodes.length > 0) {
            return {
              container,
              firstTabbableNode: tabbableNodes[0],
              lastTabbableNode: tabbableNodes[tabbableNodes.length - 1],
            };
          }
          return void 0;
        })
        .filter(function (group) {
          return !!group;
        });
      if (state.tabbableGroups.length <= 0 && !getNodeForOption("fallbackFocus")) {
        throw new Error(
          "Your focus-trap must have at least one container with at least one tabbable node in it at all times",
        );
      }
    };
    var tryFocus = function tryFocus2(node) {
      if (node === false) {
        return;
      }
      if (node === doc.activeElement) {
        return;
      }
      if (!node || !node.focus) {
        tryFocus2(getInitialFocusNode());
        return;
      }
      node.focus({
        preventScroll: !!config.preventScroll,
      });
      state.mostRecentlyFocusedNode = node;
      if (isSelectableInput(node)) {
        node.select();
      }
    };
    var getReturnFocusNode = function getReturnFocusNode2(previousActiveElement) {
      var node = getNodeForOption("setReturnFocus");
      return node ? node : previousActiveElement;
    };
    var checkPointerDown = function checkPointerDown2(e) {
      if (containersContain(e.target)) {
        return;
      }
      if (valueOrHandler(config.clickOutsideDeactivates, e)) {
        trap.deactivate({
          // if, on deactivation, we should return focus to the node originally-focused
          //  when the trap was activated (or the configured `setReturnFocus` node),
          //  then assume it's also OK to return focus to the outside node that was
          //  just clicked, causing deactivation, as long as that node is focusable;
          //  if it isn't focusable, then return focus to the original node focused
          //  on activation (or the configured `setReturnFocus` node)
          // NOTE: by setting `returnFocus: false`, deactivate() will do nothing,
          //  which will result in the outside click setting focus to the node
          //  that was clicked, whether it's focusable or not; by setting
          //  `returnFocus: true`, we'll attempt to re-focus the node originally-focused
          //  on activation (or the configured `setReturnFocus` node)
          returnFocus: config.returnFocusOnDeactivate && !isFocusable(e.target),
        });
        return;
      }
      if (valueOrHandler(config.allowOutsideClick, e)) {
        return;
      }
      e.preventDefault();
    };
    var checkFocusIn = function checkFocusIn2(e) {
      var targetContained = containersContain(e.target);
      if (targetContained || e.target instanceof Document) {
        if (targetContained) {
          state.mostRecentlyFocusedNode = e.target;
        }
      } else {
        e.stopImmediatePropagation();
        tryFocus(state.mostRecentlyFocusedNode || getInitialFocusNode());
      }
    };
    var checkTab = function checkTab2(e) {
      updateTabbableNodes();
      var destinationNode = null;
      if (state.tabbableGroups.length > 0) {
        var containerIndex = findIndex(state.tabbableGroups, function (_ref) {
          var container = _ref.container;
          return container.contains(e.target);
        });
        if (containerIndex < 0) {
          if (e.shiftKey) {
            destinationNode = state.tabbableGroups[state.tabbableGroups.length - 1].lastTabbableNode;
          } else {
            destinationNode = state.tabbableGroups[0].firstTabbableNode;
          }
        } else if (e.shiftKey) {
          var startOfGroupIndex = findIndex(state.tabbableGroups, function (_ref2) {
            var firstTabbableNode = _ref2.firstTabbableNode;
            return e.target === firstTabbableNode;
          });
          if (startOfGroupIndex < 0 && state.tabbableGroups[containerIndex].container === e.target) {
            startOfGroupIndex = containerIndex;
          }
          if (startOfGroupIndex >= 0) {
            var destinationGroupIndex =
              startOfGroupIndex === 0 ? state.tabbableGroups.length - 1 : startOfGroupIndex - 1;
            var destinationGroup = state.tabbableGroups[destinationGroupIndex];
            destinationNode = destinationGroup.lastTabbableNode;
          }
        } else {
          var lastOfGroupIndex = findIndex(state.tabbableGroups, function (_ref3) {
            var lastTabbableNode = _ref3.lastTabbableNode;
            return e.target === lastTabbableNode;
          });
          if (lastOfGroupIndex < 0 && state.tabbableGroups[containerIndex].container === e.target) {
            lastOfGroupIndex = containerIndex;
          }
          if (lastOfGroupIndex >= 0) {
            var _destinationGroupIndex =
              lastOfGroupIndex === state.tabbableGroups.length - 1 ? 0 : lastOfGroupIndex + 1;
            var _destinationGroup = state.tabbableGroups[_destinationGroupIndex];
            destinationNode = _destinationGroup.firstTabbableNode;
          }
        }
      } else {
        destinationNode = getNodeForOption("fallbackFocus");
      }
      if (destinationNode) {
        e.preventDefault();
        tryFocus(destinationNode);
      }
    };
    var checkKey = function checkKey2(e) {
      if (isEscapeEvent(e) && valueOrHandler(config.escapeDeactivates) !== false) {
        e.preventDefault();
        trap.deactivate();
        return;
      }
      if (isTabEvent(e)) {
        checkTab(e);
        return;
      }
    };
    var checkClick = function checkClick2(e) {
      if (valueOrHandler(config.clickOutsideDeactivates, e)) {
        return;
      }
      if (containersContain(e.target)) {
        return;
      }
      if (valueOrHandler(config.allowOutsideClick, e)) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    var addListeners = function addListeners2() {
      if (!state.active) {
        return;
      }
      activeFocusTraps.activateTrap(trap);
      state.delayInitialFocusTimer = config.delayInitialFocus
        ? delay(function () {
            tryFocus(getInitialFocusNode());
          })
        : tryFocus(getInitialFocusNode());
      doc.addEventListener("focusin", checkFocusIn, true);
      doc.addEventListener("mousedown", checkPointerDown, {
        capture: true,
        passive: false,
      });
      doc.addEventListener("touchstart", checkPointerDown, {
        capture: true,
        passive: false,
      });
      doc.addEventListener("click", checkClick, {
        capture: true,
        passive: false,
      });
      doc.addEventListener("keydown", checkKey, {
        capture: true,
        passive: false,
      });
      return trap;
    };
    var removeListeners = function removeListeners2() {
      if (!state.active) {
        return;
      }
      doc.removeEventListener("focusin", checkFocusIn, true);
      doc.removeEventListener("mousedown", checkPointerDown, true);
      doc.removeEventListener("touchstart", checkPointerDown, true);
      doc.removeEventListener("click", checkClick, true);
      doc.removeEventListener("keydown", checkKey, true);
      return trap;
    };
    trap = {
      activate: function activate(activateOptions) {
        if (state.active) {
          return this;
        }
        var onActivate = getOption(activateOptions, "onActivate");
        var onPostActivate = getOption(activateOptions, "onPostActivate");
        var checkCanFocusTrap = getOption(activateOptions, "checkCanFocusTrap");
        if (!checkCanFocusTrap) {
          updateTabbableNodes();
        }
        state.active = true;
        state.paused = false;
        state.nodeFocusedBeforeActivation = doc.activeElement;
        if (onActivate) {
          onActivate();
        }
        var finishActivation = function finishActivation2() {
          if (checkCanFocusTrap) {
            updateTabbableNodes();
          }
          addListeners();
          if (onPostActivate) {
            onPostActivate();
          }
        };
        if (checkCanFocusTrap) {
          checkCanFocusTrap(state.containers.concat()).then(finishActivation, finishActivation);
          return this;
        }
        finishActivation();
        return this;
      },
      deactivate: function deactivate(deactivateOptions) {
        if (!state.active) {
          return this;
        }
        clearTimeout(state.delayInitialFocusTimer);
        state.delayInitialFocusTimer = void 0;
        removeListeners();
        state.active = false;
        state.paused = false;
        activeFocusTraps.deactivateTrap(trap);
        var onDeactivate = getOption(deactivateOptions, "onDeactivate");
        var onPostDeactivate = getOption(deactivateOptions, "onPostDeactivate");
        var checkCanReturnFocus = getOption(deactivateOptions, "checkCanReturnFocus");
        if (onDeactivate) {
          onDeactivate();
        }
        var returnFocus = getOption(deactivateOptions, "returnFocus", "returnFocusOnDeactivate");
        var finishDeactivation = function finishDeactivation2() {
          delay(function () {
            if (returnFocus) {
              tryFocus(getReturnFocusNode(state.nodeFocusedBeforeActivation));
            }
            if (onPostDeactivate) {
              onPostDeactivate();
            }
          });
        };
        if (returnFocus && checkCanReturnFocus) {
          checkCanReturnFocus(getReturnFocusNode(state.nodeFocusedBeforeActivation)).then(
            finishDeactivation,
            finishDeactivation,
          );
          return this;
        }
        finishDeactivation();
        return this;
      },
      pause: function pause() {
        if (state.paused || !state.active) {
          return this;
        }
        state.paused = true;
        removeListeners();
        return this;
      },
      unpause: function unpause() {
        if (!state.paused || !state.active) {
          return this;
        }
        state.paused = false;
        updateTabbableNodes();
        addListeners();
        return this;
      },
      updateContainerElements: function updateContainerElements(containerElements) {
        var elementsAsArray = [].concat(containerElements).filter(Boolean);
        state.containers = elementsAsArray.map(function (element) {
          return typeof element === "string" ? doc.querySelector(element) : element;
        });
        if (state.active) {
          updateTabbableNodes();
        }
        return this;
      },
    };
    trap.updateContainerElements(elements);
    return trap;
  };
  // packages/focus/src/index.js
  function src_default$3(Alpine) {
    let lastFocused;
    let currentFocused;
    window.addEventListener("focusin", () => {
      lastFocused = currentFocused;
      currentFocused = document.activeElement;
    });
    Alpine.magic("focus", (el) => {
      let within = el;
      return {
        __noscroll: false,
        __wrapAround: false,
        within(el2) {
          within = el2;
          return this;
        },
        withoutScrolling() {
          this.__noscroll = true;
          return this;
        },
        noscroll() {
          this.__noscroll = true;
          return this;
        },
        withWrapAround() {
          this.__wrapAround = true;
          return this;
        },
        wrap() {
          return this.withWrapAround();
        },
        focusable(el2) {
          return isFocusable(el2);
        },
        previouslyFocused() {
          return lastFocused;
        },
        lastFocused() {
          return lastFocused;
        },
        focused() {
          return currentFocused;
        },
        focusables() {
          if (Array.isArray(within)) return within;
          return focusable(within, {
            displayCheck: "none",
          });
        },
        all() {
          return this.focusables();
        },
        isFirst(el2) {
          let els = this.all();
          return els[0] && els[0].isSameNode(el2);
        },
        isLast(el2) {
          let els = this.all();
          return els.length && els.slice(-1)[0].isSameNode(el2);
        },
        getFirst() {
          return this.all()[0];
        },
        getLast() {
          return this.all().slice(-1)[0];
        },
        getNext() {
          let list = this.all();
          let current = document.activeElement;
          if (list.indexOf(current) === -1) return;
          if (this.__wrapAround && list.indexOf(current) === list.length - 1) {
            return list[0];
          }
          return list[list.indexOf(current) + 1];
        },
        getPrevious() {
          let list = this.all();
          let current = document.activeElement;
          if (list.indexOf(current) === -1) return;
          if (this.__wrapAround && list.indexOf(current) === 0) {
            return list.slice(-1)[0];
          }
          return list[list.indexOf(current) - 1];
        },
        first() {
          this.focus(this.getFirst());
        },
        last() {
          this.focus(this.getLast());
        },
        next() {
          this.focus(this.getNext());
        },
        previous() {
          this.focus(this.getPrevious());
        },
        prev() {
          return this.previous();
        },
        focus(el2) {
          if (!el2) return;
          setTimeout(() => {
            if (!el2.hasAttribute("tabindex")) el2.setAttribute("tabindex", "0");
            el2.focus({
              preventScroll: this._noscroll,
            });
          });
        },
      };
    });
    Alpine.directive(
      "trap",
      Alpine.skipDuringClone(
        (el, { expression, modifiers }, { effect, evaluateLater, cleanup }) => {
          let evaluator = evaluateLater(expression);
          let oldValue = false;
          let trap = createFocusTrap(el, {
            escapeDeactivates: false,
            allowOutsideClick: true,
            fallbackFocus: () => el,
            initialFocus: el.querySelector("[autofocus]"),
          });
          let undoInert = () => {};
          let undoDisableScrolling = () => {};
          const releaseFocus = () => {
            undoInert();
            undoInert = () => {};
            undoDisableScrolling();
            undoDisableScrolling = () => {};
            trap.deactivate({
              returnFocus: !modifiers.includes("noreturn"),
            });
          };
          effect(() =>
            evaluator((value) => {
              if (oldValue === value) return;
              if (value && !oldValue) {
                setTimeout(() => {
                  if (modifiers.includes("inert")) undoInert = setInert(el);
                  if (modifiers.includes("noscroll")) undoDisableScrolling = disableScrolling();
                  trap.activate();
                });
              }
              if (!value && oldValue) {
                releaseFocus();
              }
              oldValue = !!value;
            }),
          );
          cleanup(releaseFocus);
        }, // When cloning, we only want to add aria-hidden attributes to the
        // DOM and not try to actually trap, as trapping can mess with the
        // live DOM and isn't just isolated to the cloned DOM.
        (el, { expression, modifiers }, { evaluate }) => {
          if (modifiers.includes("inert") && evaluate(expression)) setInert(el);
        },
      ),
    );
  }
  function setInert(el) {
    let undos = [];
    crawlSiblingsUp(el, (sibling) => {
      let cache = sibling.hasAttribute("aria-hidden");
      sibling.setAttribute("aria-hidden", "true");
      undos.push(() => cache || sibling.removeAttribute("aria-hidden"));
    });
    return () => {
      while (undos.length) undos.pop()();
    };
  }
  function crawlSiblingsUp(el, callback) {
    if (el.isSameNode(document.body) || !el.parentNode) return;
    Array.from(el.parentNode.children).forEach((sibling) => {
      if (sibling.isSameNode(el)) {
        crawlSiblingsUp(el.parentNode, callback);
      } else {
        callback(sibling);
      }
    });
  }
  function disableScrolling() {
    let overflow = document.documentElement.style.overflow;
    let paddingRight = document.documentElement.style.paddingRight;
    let scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.documentElement.style.overflow = overflow;
      document.documentElement.style.paddingRight = paddingRight;
    };
  }
  // packages/focus/builds/module.js
  var module_default$3 = src_default$3;

  // packages/intersect/src/index.js
  function src_default$2(Alpine) {
    Alpine.directive(
      "intersect",
      Alpine.skipDuringClone((el, { value, expression, modifiers }, { evaluateLater, cleanup }) => {
        let evaluate = evaluateLater(expression);
        let options = {
          rootMargin: getRootMargin(modifiers),
          threshold: getThreshold(modifiers),
        };
        let observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting === (value === "leave")) return;
            evaluate();
            modifiers.includes("once") && observer.disconnect();
          });
        }, options);
        observer.observe(el);
        cleanup(() => {
          observer.disconnect();
        });
      }),
    );
  }
  function getThreshold(modifiers) {
    if (modifiers.includes("full")) return 0.99;
    if (modifiers.includes("half")) return 0.5;
    if (!modifiers.includes("threshold")) return 0;
    let threshold = modifiers[modifiers.indexOf("threshold") + 1];
    if (threshold === "100") return 1;
    if (threshold === "0") return 0;
    return Number(`.${threshold}`);
  }
  function getLengthValue(rawValue) {
    let match = rawValue.match(/^(-?[0-9]+)(px|%)?$/);
    return match ? match[1] + (match[2] || "px") : void 0;
  }
  function getRootMargin(modifiers) {
    const key = "margin";
    const fallback = "0px 0px 0px 0px";
    const index = modifiers.indexOf(key);
    if (index === -1) return fallback;
    let values = [];
    for (let i = 1; i < 5; i++) {
      values.push(getLengthValue(modifiers[index + i] || ""));
    }
    values = values.filter((v) => v !== void 0);
    return values.length ? values.join(" ").trim() : fallback;
  }
  // packages/intersect/builds/module.js
  var module_default$2 = src_default$2;

  // packages/collapse/src/index.js
  function src_default$1(Alpine) {
    Alpine.directive("collapse", collapse);
    collapse.inline = (el, { modifiers }) => {
      if (!modifiers.includes("min")) return;
      el._x_doShow = () => {};
      el._x_doHide = () => {};
    };
    function collapse(el, { modifiers }) {
      let duration = modifierValue$1(modifiers, "duration", 250) / 1e3;
      let floor = modifierValue$1(modifiers, "min", 0);
      let fullyHide = !modifiers.includes("min");
      if (!el._x_isShown) el.style.height = `${floor}px`;
      if (!el._x_isShown && fullyHide) el.hidden = true;
      if (!el._x_isShown) el.style.overflow = "hidden";
      let setFunction = (el2, styles) => {
        let revertFunction = Alpine.setStyles(el2, styles);
        return styles.height ? () => {} : revertFunction;
      };
      let transitionStyles = {
        transitionProperty: "height",
        transitionDuration: `${duration}s`,
        transitionTimingFunction: "cubic-bezier(0.4, 0.0, 0.2, 1)",
      };
      el._x_transition = {
        in(before = () => {}, after = () => {}) {
          if (fullyHide) el.hidden = false;
          if (fullyHide) el.style.display = null;
          let current = el.getBoundingClientRect().height;
          el.style.height = "auto";
          let full = el.getBoundingClientRect().height;
          if (current === full) {
            current = floor;
          }
          Alpine.transition(
            el,
            Alpine.setStyles,
            {
              during: transitionStyles,
              start: {
                height: current + "px",
              },
              end: {
                height: full + "px",
              },
            },
            () => (el._x_isShown = true),
            () => {
              if (Math.abs(el.getBoundingClientRect().height - full) < 1) {
                el.style.overflow = null;
              }
            },
          );
        },
        out(before = () => {}, after = () => {}) {
          let full = el.getBoundingClientRect().height;
          Alpine.transition(
            el,
            setFunction,
            {
              during: transitionStyles,
              start: {
                height: full + "px",
              },
              end: {
                height: floor + "px",
              },
            },
            () => (el.style.overflow = "hidden"),
            () => {
              el._x_isShown = false;
              if (el.style.height == `${floor}px` && fullyHide) {
                el.style.display = "none";
                el.hidden = true;
              }
            },
          );
        },
      };
    }
  }
  function modifierValue$1(modifiers, key, fallback) {
    if (modifiers.indexOf(key) === -1) return fallback;
    const rawValue = modifiers[modifiers.indexOf(key) + 1];
    if (!rawValue) return fallback;
    if (key === "duration") {
      let match = rawValue.match(/([0-9]+)ms/);
      if (match) return match[1];
    }
    if (key === "min") {
      let match = rawValue.match(/([0-9]+)px/);
      if (match) return match[1];
    }
    return rawValue;
  }
  // packages/collapse/builds/module.js
  var module_default$1 = src_default$1;

  // packages/alpinejs/src/scheduler.js
  var flushPending = false;
  var flushing = false;
  var queue = [];
  var lastFlushedIndex = -1;
  function scheduler(callback) {
    queueJob(callback);
  }
  function queueJob(job) {
    if (!queue.includes(job)) queue.push(job);
    queueFlush();
  }
  function dequeueJob(job) {
    let index = queue.indexOf(job);
    if (index !== -1 && index > lastFlushedIndex) queue.splice(index, 1);
  }
  function queueFlush() {
    if (!flushing && !flushPending) {
      flushPending = true;
      queueMicrotask(flushJobs);
    }
  }
  function flushJobs() {
    flushPending = false;
    flushing = true;
    for (let i = 0; i < queue.length; i++) {
      queue[i]();
      lastFlushedIndex = i;
    }
    queue.length = 0;
    lastFlushedIndex = -1;
    flushing = false;
  }
  // packages/alpinejs/src/reactivity.js
  var reactive;
  var effect;
  var release;
  var raw;
  var shouldSchedule = true;
  function disableEffectScheduling(callback) {
    shouldSchedule = false;
    callback();
    shouldSchedule = true;
  }
  function setReactivityEngine(engine) {
    reactive = engine.reactive;
    release = engine.release;
    effect = (callback) =>
      engine.effect(callback, {
        scheduler: (task) => {
          if (shouldSchedule) {
            scheduler(task);
          } else {
            task();
          }
        },
      });
    raw = engine.raw;
  }
  function overrideEffect(override) {
    effect = override;
  }
  function elementBoundEffect(el) {
    let cleanup2 = () => {};
    let wrappedEffect = (callback) => {
      let effectReference = effect(callback);
      if (!el._x_effects) {
        el._x_effects = /* @__PURE__ */ new Set();
        el._x_runEffects = () => {
          el._x_effects.forEach((i) => i());
        };
      }
      el._x_effects.add(effectReference);
      cleanup2 = () => {
        if (effectReference === void 0) return;
        el._x_effects.delete(effectReference);
        release(effectReference);
      };
      return effectReference;
    };
    return [
      wrappedEffect,
      () => {
        cleanup2();
      },
    ];
  }
  function watch(getter, callback) {
    let firstTime = true;
    let oldValue;
    let effectReference = effect(() => {
      let value = getter();
      JSON.stringify(value);
      if (!firstTime) {
        queueMicrotask(() => {
          callback(value, oldValue);
          oldValue = value;
        });
      } else {
        oldValue = value;
      }
      firstTime = false;
    });
    return () => release(effectReference);
  }
  // packages/alpinejs/src/mutation.js
  var onAttributeAddeds = [];
  var onElRemoveds = [];
  var onElAddeds = [];
  function onElAdded(callback) {
    onElAddeds.push(callback);
  }
  function onElRemoved(el, callback) {
    if (typeof callback === "function") {
      if (!el._x_cleanups) el._x_cleanups = [];
      el._x_cleanups.push(callback);
    } else {
      callback = el;
      onElRemoveds.push(callback);
    }
  }
  function onAttributesAdded(callback) {
    onAttributeAddeds.push(callback);
  }
  function onAttributeRemoved(el, name, callback) {
    if (!el._x_attributeCleanups) el._x_attributeCleanups = {};
    if (!el._x_attributeCleanups[name]) el._x_attributeCleanups[name] = [];
    el._x_attributeCleanups[name].push(callback);
  }
  function cleanupAttributes(el, names) {
    if (!el._x_attributeCleanups) return;
    Object.entries(el._x_attributeCleanups).forEach(([name, value]) => {
      if (names === void 0 || names.includes(name)) {
        value.forEach((i) => i());
        delete el._x_attributeCleanups[name];
      }
    });
  }
  function cleanupElement(el) {
    var ref, ref1;
    (ref = el._x_effects) === null || ref === void 0 ? void 0 : ref.forEach(dequeueJob);
    while ((ref1 = el._x_cleanups) === null || ref1 === void 0 ? void 0 : ref1.length) el._x_cleanups.pop()();
  }
  var observer$1 = new MutationObserver(onMutate);
  var currentlyObserving = false;
  function startObservingMutations() {
    observer$1.observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeOldValue: true,
    });
    currentlyObserving = true;
  }
  function stopObservingMutations() {
    flushObserver();
    observer$1.disconnect();
    currentlyObserving = false;
  }
  var queuedMutations = [];
  function flushObserver() {
    let records = observer$1.takeRecords();
    queuedMutations.push(() => records.length > 0 && onMutate(records));
    let queueLengthWhenTriggered = queuedMutations.length;
    queueMicrotask(() => {
      if (queuedMutations.length === queueLengthWhenTriggered) {
        while (queuedMutations.length > 0) queuedMutations.shift()();
      }
    });
  }
  function mutateDom(callback) {
    if (!currentlyObserving) return callback();
    stopObservingMutations();
    let result = callback();
    startObservingMutations();
    return result;
  }
  var isCollecting = false;
  var deferredMutations = [];
  function deferMutations() {
    isCollecting = true;
  }
  function flushAndStopDeferringMutations() {
    isCollecting = false;
    onMutate(deferredMutations);
    deferredMutations = [];
  }
  function onMutate(mutations) {
    if (isCollecting) {
      deferredMutations = deferredMutations.concat(mutations);
      return;
    }
    let addedNodes = [];
    let removedNodes = /* @__PURE__ */ new Set();
    let addedAttributes = /* @__PURE__ */ new Map();
    let removedAttributes = /* @__PURE__ */ new Map();
    for (let i1 = 0; i1 < mutations.length; i1++) {
      if (mutations[i1].target._x_ignoreMutationObserver) continue;
      if (mutations[i1].type === "childList") {
        mutations[i1].removedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (!node._x_marker) return;
          removedNodes.add(node);
        });
        mutations[i1].addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (removedNodes.has(node)) {
            removedNodes.delete(node);
            return;
          }
          if (node._x_marker) return;
          addedNodes.push(node);
        });
      }
      if (mutations[i1].type === "attributes") {
        let el = mutations[i1].target;
        let name = mutations[i1].attributeName;
        let oldValue = mutations[i1].oldValue;
        let add2 = () => {
          if (!addedAttributes.has(el)) addedAttributes.set(el, []);
          addedAttributes.get(el).push({
            name,
            value: el.getAttribute(name),
          });
        };
        let remove = () => {
          if (!removedAttributes.has(el)) removedAttributes.set(el, []);
          removedAttributes.get(el).push(name);
        };
        if (el.hasAttribute(name) && oldValue === null) {
          add2();
        } else if (el.hasAttribute(name)) {
          remove();
          add2();
        } else {
          remove();
        }
      }
    }
    removedAttributes.forEach((attrs, el) => {
      cleanupAttributes(el, attrs);
    });
    addedAttributes.forEach((attrs, el) => {
      onAttributeAddeds.forEach((i) => i(el, attrs));
    });
    for (let node2 of removedNodes) {
      if (addedNodes.some((i) => i.contains(node2))) continue;
      onElRemoveds.forEach((i) => i(node2));
    }
    for (let node1 of addedNodes) {
      if (!node1.isConnected) continue;
      onElAddeds.forEach((i) => i(node1));
    }
    addedNodes = null;
    removedNodes = null;
    addedAttributes = null;
    removedAttributes = null;
  }
  // packages/alpinejs/src/scope.js
  function scope(node) {
    return mergeProxies(closestDataStack(node));
  }
  function addScopeToNode(node, data2, referenceNode) {
    node._x_dataStack = [data2, ...closestDataStack(referenceNode || node)];
    return () => {
      node._x_dataStack = node._x_dataStack.filter((i) => i !== data2);
    };
  }
  function closestDataStack(node) {
    if (node._x_dataStack) return node._x_dataStack;
    if (typeof ShadowRoot === "function" && node instanceof ShadowRoot) {
      return closestDataStack(node.host);
    }
    if (!node.parentNode) {
      return [];
    }
    return closestDataStack(node.parentNode);
  }
  function mergeProxies(objects) {
    return new Proxy(
      {
        objects,
      },
      mergeProxyTrap,
    );
  }
  var mergeProxyTrap = {
    ownKeys({ objects }) {
      return Array.from(new Set(objects.flatMap((i) => Object.keys(i))));
    },
    has({ objects }, name) {
      if (name == Symbol.unscopables) return false;
      return objects.some((obj) => Object.prototype.hasOwnProperty.call(obj, name) || Reflect.has(obj, name));
    },
    get({ objects }, name, thisProxy) {
      if (name == "toJSON") return collapseProxies;
      return Reflect.get(objects.find((obj) => Reflect.has(obj, name)) || {}, name, thisProxy);
    },
    set({ objects }, name, value, thisProxy) {
      const target =
        objects.find((obj) => Object.prototype.hasOwnProperty.call(obj, name)) || objects[objects.length - 1];
      const descriptor = Object.getOwnPropertyDescriptor(target, name);
      if (
        (descriptor === null || descriptor === void 0 ? void 0 : descriptor.set) &&
        (descriptor === null || descriptor === void 0 ? void 0 : descriptor.get)
      )
        return descriptor.set.call(thisProxy, value) || true;
      return Reflect.set(target, name, value);
    },
  };
  function collapseProxies() {
    let keys = Reflect.ownKeys(this);
    return keys.reduce((acc, key) => {
      acc[key] = Reflect.get(this, key);
      return acc;
    }, {});
  }
  // packages/alpinejs/src/interceptor.js
  function initInterceptors(data2) {
    let isObject2 = (val) => typeof val === "object" && !Array.isArray(val) && val !== null;
    let recurse = (obj, basePath = "") => {
      Object.entries(Object.getOwnPropertyDescriptors(obj)).forEach(([key, { value, enumerable }]) => {
        if (enumerable === false || value === void 0) return;
        if (typeof value === "object" && value !== null && value.__v_skip) return;
        let path = basePath === "" ? key : `${basePath}.${key}`;
        if (typeof value === "object" && value !== null && value._x_interceptor) {
          obj[key] = value.initialize(data2, path, key);
        } else {
          if (isObject2(value) && value !== obj && !(value instanceof Element)) {
            recurse(value, path);
          }
        }
      });
    };
    return recurse(data2);
  }
  function interceptor(callback, mutateObj = () => {}) {
    let obj = {
      initialValue: void 0,
      _x_interceptor: true,
      initialize(data2, path, key) {
        return callback(
          this.initialValue,
          () => get(data2, path),
          (value) => set(data2, path, value),
          path,
          key,
        );
      },
    };
    mutateObj(obj);
    return (initialValue) => {
      if (typeof initialValue === "object" && initialValue !== null && initialValue._x_interceptor) {
        let initialize = obj.initialize.bind(obj);
        obj.initialize = (data2, path, key) => {
          let innerValue = initialValue.initialize(data2, path, key);
          obj.initialValue = innerValue;
          return initialize(data2, path, key);
        };
      } else {
        obj.initialValue = initialValue;
      }
      return obj;
    };
  }
  function get(obj, path) {
    return path.split(".").reduce((carry, segment) => carry[segment], obj);
  }
  function set(obj, path, value) {
    if (typeof path === "string") path = path.split(".");
    if (path.length === 1) obj[path[0]] = value;
    else if (path.length === 0) throw error;
    else {
      if (obj[path[0]]) return set(obj[path[0]], path.slice(1), value);
      else {
        obj[path[0]] = {};
        return set(obj[path[0]], path.slice(1), value);
      }
    }
  }
  // packages/alpinejs/src/magics.js
  var magics = {};
  function magic(name, callback) {
    magics[name] = callback;
  }
  function injectMagics(obj, el) {
    let memoizedUtilities = getUtilities(el);
    Object.entries(magics).forEach(([name, callback]) => {
      Object.defineProperty(obj, `$${name}`, {
        get() {
          return callback(el, memoizedUtilities);
        },
        enumerable: false,
      });
    });
    return obj;
  }
  function getUtilities(el) {
    let [utilities, cleanup2] = getElementBoundUtilities(el);
    let utils = {
      interceptor,
      ...utilities,
    };
    onElRemoved(el, cleanup2);
    return utils;
  }
  // packages/alpinejs/src/utils/error.js
  function tryCatch(el, expression, callback, ...args) {
    try {
      return callback(...args);
    } catch (e) {
      handleError(e, el, expression);
    }
  }
  function handleError(error2, el, expression = void 0) {
    error2 = Object.assign(
      error2 !== null && error2 !== void 0
        ? error2
        : {
            message: "No error message given.",
          },
      {
        el,
        expression,
      },
    );
    console.warn(
      `Alpine Expression Error: ${error2.message}

${expression ? 'Expression: "' + expression + '"\n\n' : ""}`,
      el,
    );
    setTimeout(() => {
      throw error2;
    }, 0);
  }
  // packages/alpinejs/src/evaluator.js
  var shouldAutoEvaluateFunctions = true;
  function dontAutoEvaluateFunctions(callback) {
    let cache = shouldAutoEvaluateFunctions;
    shouldAutoEvaluateFunctions = false;
    let result = callback();
    shouldAutoEvaluateFunctions = cache;
    return result;
  }
  function evaluate(el, expression, extras = {}) {
    let result;
    evaluateLater(el, expression)((value) => (result = value), extras);
    return result;
  }
  function evaluateLater(...args) {
    return theEvaluatorFunction(...args);
  }
  var theEvaluatorFunction = normalEvaluator;
  function setEvaluator(newEvaluator) {
    theEvaluatorFunction = newEvaluator;
  }
  function normalEvaluator(el, expression) {
    let overriddenMagics = {};
    injectMagics(overriddenMagics, el);
    let dataStack = [overriddenMagics, ...closestDataStack(el)];
    let evaluator =
      typeof expression === "function"
        ? generateEvaluatorFromFunction(dataStack, expression)
        : generateEvaluatorFromString(dataStack, expression, el);
    return tryCatch.bind(null, el, expression, evaluator);
  }
  function generateEvaluatorFromFunction(dataStack, func) {
    return (receiver = () => {}, { scope: scope2 = {}, params = [] } = {}) => {
      let result = func.apply(mergeProxies([scope2, ...dataStack]), params);
      runIfTypeOfFunction(receiver, result);
    };
  }
  var evaluatorMemo = {};
  function generateFunctionFromString(expression, el) {
    if (evaluatorMemo[expression]) {
      return evaluatorMemo[expression];
    }
    let AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    let rightSideSafeExpression =
      /^[\n\s]*if.*\(.*\)/.test(expression.trim()) || /^(let|const)\s/.test(expression.trim())
        ? `(async()=>{ ${expression} })()`
        : expression;
    const safeAsyncFunction = () => {
      try {
        let func2 = new AsyncFunction(
          ["__self", "scope"],
          `with (scope) { __self.result = ${rightSideSafeExpression} }; __self.finished = true; return __self.result;`,
        );
        Object.defineProperty(func2, "name", {
          value: `[Alpine] ${expression}`,
        });
        return func2;
      } catch (error2) {
        handleError(error2, el, expression);
        return Promise.resolve();
      }
    };
    let func = safeAsyncFunction();
    evaluatorMemo[expression] = func;
    return func;
  }
  function generateEvaluatorFromString(dataStack, expression, el) {
    let func = generateFunctionFromString(expression, el);
    return (receiver = () => {}, { scope: scope2 = {}, params = [] } = {}) => {
      func.result = void 0;
      func.finished = false;
      let completeScope = mergeProxies([scope2, ...dataStack]);
      if (typeof func === "function") {
        let promise = func(func, completeScope).catch((error2) => handleError(error2, el, expression));
        if (func.finished) {
          runIfTypeOfFunction(receiver, func.result, completeScope, params, el);
          func.result = void 0;
        } else {
          promise
            .then((result) => {
              runIfTypeOfFunction(receiver, result, completeScope, params, el);
            })
            .catch((error2) => handleError(error2, el, expression))
            .finally(() => (func.result = void 0));
        }
      }
    };
  }
  function runIfTypeOfFunction(receiver, value, scope2, params, el) {
    if (shouldAutoEvaluateFunctions && typeof value === "function") {
      let result = value.apply(scope2, params);
      if (result instanceof Promise) {
        result
          .then((i) => runIfTypeOfFunction(receiver, i, scope2, params))
          .catch((error2) => handleError(error2, el, value));
      } else {
        receiver(result);
      }
    } else if (typeof value === "object" && value instanceof Promise) {
      value.then((i) => receiver(i));
    } else {
      receiver(value);
    }
  }
  // packages/alpinejs/src/directives.js
  var prefixAsString = "x-";
  function prefix(subject = "") {
    return prefixAsString + subject;
  }
  function setPrefix(newPrefix) {
    prefixAsString = newPrefix;
  }
  var directiveHandlers = {};
  function directive(name, callback) {
    directiveHandlers[name] = callback;
    return {
      before(directive2) {
        if (!directiveHandlers[directive2]) {
          console.warn(
            String.raw`Cannot find directive \`${directive2}\`. \`${name}\` will use the default order of execution`,
          );
          return;
        }
        const pos = directiveOrder.indexOf(directive2);
        directiveOrder.splice(pos >= 0 ? pos : directiveOrder.indexOf("DEFAULT"), 0, name);
      },
    };
  }
  function directiveExists(name) {
    return Object.keys(directiveHandlers).includes(name);
  }
  function directives(el, attributes, originalAttributeOverride) {
    attributes = Array.from(attributes);
    if (el._x_virtualDirectives) {
      let vAttributes = Object.entries(el._x_virtualDirectives).map(([name, value]) => ({
        name,
        value,
      }));
      let staticAttributes = attributesOnly(vAttributes);
      vAttributes = vAttributes.map((attribute) => {
        if (staticAttributes.find((attr) => attr.name === attribute.name)) {
          return {
            name: `x-bind:${attribute.name}`,
            value: `"${attribute.value}"`,
          };
        }
        return attribute;
      });
      attributes = attributes.concat(vAttributes);
    }
    let transformedAttributeMap = {};
    let directives2 = attributes
      .map(toTransformedAttributes((newName, oldName) => (transformedAttributeMap[newName] = oldName)))
      .filter(outNonAlpineAttributes)
      .map(toParsedDirectives(transformedAttributeMap, originalAttributeOverride))
      .sort(byPriority);
    return directives2.map((directive2) => {
      return getDirectiveHandler(el, directive2);
    });
  }
  function attributesOnly(attributes) {
    return Array.from(attributes)
      .map(toTransformedAttributes())
      .filter((attr) => !outNonAlpineAttributes(attr));
  }
  var isDeferringHandlers = false;
  var directiveHandlerStacks = /* @__PURE__ */ new Map();
  var currentHandlerStackKey = Symbol();
  function deferHandlingDirectives(callback) {
    isDeferringHandlers = true;
    let key = Symbol();
    currentHandlerStackKey = key;
    directiveHandlerStacks.set(key, []);
    let flushHandlers = () => {
      while (directiveHandlerStacks.get(key).length) directiveHandlerStacks.get(key).shift()();
      directiveHandlerStacks.delete(key);
    };
    let stopDeferring = () => {
      isDeferringHandlers = false;
      flushHandlers();
    };
    callback(flushHandlers);
    stopDeferring();
  }
  function getElementBoundUtilities(el) {
    let cleanups = [];
    let cleanup2 = (callback) => cleanups.push(callback);
    let [effect3, cleanupEffect] = elementBoundEffect(el);
    cleanups.push(cleanupEffect);
    let utilities = {
      Alpine: alpine_default,
      effect: effect3,
      cleanup: cleanup2,
      evaluateLater: evaluateLater.bind(evaluateLater, el),
      evaluate: evaluate.bind(evaluate, el),
    };
    let doCleanup = () => cleanups.forEach((i) => i());
    return [utilities, doCleanup];
  }
  function getDirectiveHandler(el, directive2) {
    let noop = () => {};
    let handler4 = directiveHandlers[directive2.type] || noop;
    let [utilities, cleanup2] = getElementBoundUtilities(el);
    onAttributeRemoved(el, directive2.original, cleanup2);
    let fullHandler = () => {
      if (el._x_ignore || el._x_ignoreSelf) return;
      handler4.inline && handler4.inline(el, directive2, utilities);
      handler4 = handler4.bind(handler4, el, directive2, utilities);
      isDeferringHandlers ? directiveHandlerStacks.get(currentHandlerStackKey).push(handler4) : handler4();
    };
    fullHandler.runCleanups = cleanup2;
    return fullHandler;
  }
  var startingWith =
    (subject, replacement) =>
    ({ name, value }) => {
      if (name.startsWith(subject)) name = name.replace(subject, replacement);
      return {
        name,
        value,
      };
    };
  var into = (i) => i;
  function toTransformedAttributes(callback = () => {}) {
    return ({ name, value }) => {
      let { name: newName, value: newValue } = attributeTransformers.reduce(
        (carry, transform) => {
          return transform(carry);
        },
        {
          name,
          value,
        },
      );
      if (newName !== name) callback(newName, name);
      return {
        name: newName,
        value: newValue,
      };
    };
  }
  var attributeTransformers = [];
  function mapAttributes(callback) {
    attributeTransformers.push(callback);
  }
  function outNonAlpineAttributes({ name }) {
    return alpineAttributeRegex().test(name);
  }
  var alpineAttributeRegex = () => new RegExp(`^${prefixAsString}([^:^.]+)\\b`);
  function toParsedDirectives(transformedAttributeMap, originalAttributeOverride) {
    return ({ name, value }) => {
      let typeMatch = name.match(alpineAttributeRegex());
      let valueMatch = name.match(/:([a-zA-Z0-9\-_:]+)/);
      let modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
      let original = originalAttributeOverride || transformedAttributeMap[name] || name;
      return {
        type: typeMatch ? typeMatch[1] : null,
        value: valueMatch ? valueMatch[1] : null,
        modifiers: modifiers.map((i) => i.replace(".", "")),
        expression: value,
        original,
      };
    };
  }
  var DEFAULT = "DEFAULT";
  var directiveOrder = [
    "ignore",
    "ref",
    "data",
    "id",
    "anchor",
    "bind",
    "init",
    "for",
    "model",
    "modelable",
    "transition",
    "show",
    "if",
    DEFAULT,
    "teleport",
  ];
  function byPriority(a, b) {
    let typeA = directiveOrder.indexOf(a.type) === -1 ? DEFAULT : a.type;
    let typeB = directiveOrder.indexOf(b.type) === -1 ? DEFAULT : b.type;
    return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB);
  }
  // packages/alpinejs/src/utils/dispatch.js
  function dispatch(el, name, detail = {}) {
    el.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        // Allows events to pass the shadow DOM barrier.
        composed: true,
        cancelable: true,
      }),
    );
  }
  // packages/alpinejs/src/utils/walk.js
  function walk(el, callback) {
    if (typeof ShadowRoot === "function" && el instanceof ShadowRoot) {
      Array.from(el.children).forEach((el2) => walk(el2, callback));
      return;
    }
    let skip = false;
    callback(el, () => (skip = true));
    if (skip) return;
    let node = el.firstElementChild;
    while (node) {
      walk(node, callback);
      node = node.nextElementSibling;
    }
  }
  // packages/alpinejs/src/utils/warn.js
  function warn(message, ...args) {
    console.warn(`Alpine Warning: ${message}`, ...args);
  }
  // packages/alpinejs/src/lifecycle.js
  var started = false;
  function start$1() {
    if (started)
      warn(
        "Alpine has already been initialized on this page. Calling Alpine.start() more than once can cause problems.",
      );
    started = true;
    if (!document.body)
      warn(
        "Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine's `<script>` tag?",
      );
    dispatch(document, "alpine:init");
    dispatch(document, "alpine:initializing");
    startObservingMutations();
    onElAdded((el) => initTree(el, walk));
    onElRemoved((el) => destroyTree(el));
    onAttributesAdded((el, attrs) => {
      directives(el, attrs).forEach((handle) => handle());
    });
    let outNestedComponents = (el) => !closestRoot(el.parentElement, true);
    Array.from(document.querySelectorAll(allSelectors().join(",")))
      .filter(outNestedComponents)
      .forEach((el) => {
        initTree(el);
      });
    dispatch(document, "alpine:initialized");
    setTimeout(() => {
      warnAboutMissingPlugins();
    });
  }
  var rootSelectorCallbacks = [];
  var initSelectorCallbacks = [];
  function rootSelectors() {
    return rootSelectorCallbacks.map((fn) => fn());
  }
  function allSelectors() {
    return rootSelectorCallbacks.concat(initSelectorCallbacks).map((fn) => fn());
  }
  function addRootSelector(selectorCallback) {
    rootSelectorCallbacks.push(selectorCallback);
  }
  function addInitSelector(selectorCallback) {
    initSelectorCallbacks.push(selectorCallback);
  }
  function closestRoot(el, includeInitSelectors = false) {
    return findClosest(el, (element) => {
      const selectors = includeInitSelectors ? allSelectors() : rootSelectors();
      if (selectors.some((selector) => element.matches(selector))) return true;
    });
  }
  function findClosest(el, callback) {
    if (!el) return;
    if (callback(el)) return el;
    if (el._x_teleportBack) el = el._x_teleportBack;
    if (!el.parentElement) return;
    return findClosest(el.parentElement, callback);
  }
  function isRoot(el) {
    return rootSelectors().some((selector) => el.matches(selector));
  }
  var initInterceptors2 = [];
  function interceptInit(callback) {
    initInterceptors2.push(callback);
  }
  var markerDispenser = 1;
  function initTree(el, walker = walk, intercept = () => {}) {
    if (findClosest(el, (i) => i._x_ignore)) return;
    deferHandlingDirectives(() => {
      walker(el, (el2, skip) => {
        if (el2._x_marker) return;
        intercept(el2, skip);
        initInterceptors2.forEach((i) => i(el2, skip));
        directives(el2, el2.attributes).forEach((handle) => handle());
        if (!el2._x_ignore) el2._x_marker = markerDispenser++;
        el2._x_ignore && skip();
      });
    });
  }
  function destroyTree(root, walker = walk) {
    walker(root, (el) => {
      cleanupElement(el);
      cleanupAttributes(el);
      delete el._x_marker;
    });
  }
  function warnAboutMissingPlugins() {
    let pluginDirectives = [
      ["ui", "dialog", ["[x-dialog], [x-popover]"]],
      ["anchor", "anchor", ["[x-anchor]"]],
      ["sort", "sort", ["[x-sort]"]],
    ];
    pluginDirectives.forEach(([plugin2, directive2, selectors]) => {
      if (directiveExists(directive2)) return;
      selectors.some((selector) => {
        if (document.querySelector(selector)) {
          warn(`found "${selector}", but missing ${plugin2} plugin`);
          return true;
        }
      });
    });
  }
  // packages/alpinejs/src/nextTick.js
  var tickStack = [];
  var isHolding = false;
  function nextTick(callback = () => {}) {
    queueMicrotask(() => {
      isHolding ||
        setTimeout(() => {
          releaseNextTicks();
        });
    });
    return new Promise((res) => {
      tickStack.push(() => {
        callback();
        res();
      });
    });
  }
  function releaseNextTicks() {
    isHolding = false;
    while (tickStack.length) tickStack.shift()();
  }
  function holdNextTicks() {
    isHolding = true;
  }
  // packages/alpinejs/src/utils/classes.js
  function setClasses(el, value) {
    if (Array.isArray(value)) {
      return setClassesFromString(el, value.join(" "));
    } else if (typeof value === "object" && value !== null) {
      return setClassesFromObject(el, value);
    } else if (typeof value === "function") {
      return setClasses(el, value());
    }
    return setClassesFromString(el, value);
  }
  function setClassesFromString(el, classString) {
    let missingClasses = (classString2) =>
      classString2
        .split(" ")
        .filter((i) => !el.classList.contains(i))
        .filter(Boolean);
    let addClassesAndReturnUndo = (classes) => {
      el.classList.add(...classes);
      return () => {
        el.classList.remove(...classes);
      };
    };
    classString = classString === true ? (classString = "") : classString || "";
    return addClassesAndReturnUndo(missingClasses(classString));
  }
  function setClassesFromObject(el, classObject) {
    let split = (classString) => classString.split(" ").filter(Boolean);
    let forAdd = Object.entries(classObject)
      .flatMap(([classString, bool]) => (bool ? split(classString) : false))
      .filter(Boolean);
    let forRemove = Object.entries(classObject)
      .flatMap(([classString, bool]) => (!bool ? split(classString) : false))
      .filter(Boolean);
    let added = [];
    let removed = [];
    forRemove.forEach((i) => {
      if (el.classList.contains(i)) {
        el.classList.remove(i);
        removed.push(i);
      }
    });
    forAdd.forEach((i) => {
      if (!el.classList.contains(i)) {
        el.classList.add(i);
        added.push(i);
      }
    });
    return () => {
      removed.forEach((i) => el.classList.add(i));
      added.forEach((i) => el.classList.remove(i));
    };
  }
  // packages/alpinejs/src/utils/styles.js
  function setStyles(el, value) {
    if (typeof value === "object" && value !== null) {
      return setStylesFromObject(el, value);
    }
    return setStylesFromString(el, value);
  }
  function setStylesFromObject(el, value) {
    let previousStyles = {};
    Object.entries(value).forEach(([key, value2]) => {
      previousStyles[key] = el.style[key];
      if (!key.startsWith("--")) {
        key = kebabCase(key);
      }
      el.style.setProperty(key, value2);
    });
    setTimeout(() => {
      if (el.style.length === 0) {
        el.removeAttribute("style");
      }
    });
    return () => {
      setStyles(el, previousStyles);
    };
  }
  function setStylesFromString(el, value) {
    let cache = el.getAttribute("style", value);
    el.setAttribute("style", value);
    return () => {
      el.setAttribute("style", cache || "");
    };
  }
  function kebabCase(subject) {
    return subject.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
  // packages/alpinejs/src/utils/once.js
  function once(callback, fallback = () => {}) {
    let called = false;
    return function () {
      if (!called) {
        called = true;
        callback.apply(this, arguments);
      } else {
        fallback.apply(this, arguments);
      }
    };
  }
  // packages/alpinejs/src/directives/x-transition.js
  directive("transition", (el, { value, modifiers, expression }, { evaluate: evaluate2 }) => {
    if (typeof expression === "function") expression = evaluate2(expression);
    if (expression === false) return;
    if (!expression || typeof expression === "boolean") {
      registerTransitionsFromHelper(el, modifiers, value);
    } else {
      registerTransitionsFromClassString(el, expression, value);
    }
  });
  function registerTransitionsFromClassString(el, classString, stage) {
    registerTransitionObject(el, setClasses, "");
    let directiveStorageMap = {
      enter: (classes) => {
        el._x_transition.enter.during = classes;
      },
      "enter-start": (classes) => {
        el._x_transition.enter.start = classes;
      },
      "enter-end": (classes) => {
        el._x_transition.enter.end = classes;
      },
      leave: (classes) => {
        el._x_transition.leave.during = classes;
      },
      "leave-start": (classes) => {
        el._x_transition.leave.start = classes;
      },
      "leave-end": (classes) => {
        el._x_transition.leave.end = classes;
      },
    };
    directiveStorageMap[stage](classString);
  }
  function registerTransitionsFromHelper(el, modifiers, stage) {
    registerTransitionObject(el, setStyles);
    let doesntSpecify = !modifiers.includes("in") && !modifiers.includes("out") && !stage;
    let transitioningIn = doesntSpecify || modifiers.includes("in") || ["enter"].includes(stage);
    let transitioningOut = doesntSpecify || modifiers.includes("out") || ["leave"].includes(stage);
    if (modifiers.includes("in") && !doesntSpecify) {
      modifiers = modifiers.filter((i, index) => index < modifiers.indexOf("out"));
    }
    if (modifiers.includes("out") && !doesntSpecify) {
      modifiers = modifiers.filter((i, index) => index > modifiers.indexOf("out"));
    }
    let wantsAll = !modifiers.includes("opacity") && !modifiers.includes("scale");
    let wantsOpacity = wantsAll || modifiers.includes("opacity");
    let wantsScale = wantsAll || modifiers.includes("scale");
    let opacityValue = wantsOpacity ? 0 : 1;
    let scaleValue = wantsScale ? modifierValue(modifiers, "scale", 95) / 100 : 1;
    let delay = modifierValue(modifiers, "delay", 0) / 1e3;
    let origin = modifierValue(modifiers, "origin", "center");
    let property = "opacity, transform";
    let durationIn = modifierValue(modifiers, "duration", 150) / 1e3;
    let durationOut = modifierValue(modifiers, "duration", 75) / 1e3;
    let easing = `cubic-bezier(0.4, 0.0, 0.2, 1)`;
    if (transitioningIn) {
      el._x_transition.enter.during = {
        transformOrigin: origin,
        transitionDelay: `${delay}s`,
        transitionProperty: property,
        transitionDuration: `${durationIn}s`,
        transitionTimingFunction: easing,
      };
      el._x_transition.enter.start = {
        opacity: opacityValue,
        transform: `scale(${scaleValue})`,
      };
      el._x_transition.enter.end = {
        opacity: 1,
        transform: `scale(1)`,
      };
    }
    if (transitioningOut) {
      el._x_transition.leave.during = {
        transformOrigin: origin,
        transitionDelay: `${delay}s`,
        transitionProperty: property,
        transitionDuration: `${durationOut}s`,
        transitionTimingFunction: easing,
      };
      el._x_transition.leave.start = {
        opacity: 1,
        transform: `scale(1)`,
      };
      el._x_transition.leave.end = {
        opacity: opacityValue,
        transform: `scale(${scaleValue})`,
      };
    }
  }
  function registerTransitionObject(el, setFunction, defaultValue = {}) {
    if (!el._x_transition)
      el._x_transition = {
        enter: {
          during: defaultValue,
          start: defaultValue,
          end: defaultValue,
        },
        leave: {
          during: defaultValue,
          start: defaultValue,
          end: defaultValue,
        },
        in(before = () => {}, after = () => {}) {
          transition(
            el,
            setFunction,
            {
              during: this.enter.during,
              start: this.enter.start,
              end: this.enter.end,
            },
            before,
            after,
          );
        },
        out(before = () => {}, after = () => {}) {
          transition(
            el,
            setFunction,
            {
              during: this.leave.during,
              start: this.leave.start,
              end: this.leave.end,
            },
            before,
            after,
          );
        },
      };
  }
  window.Element.prototype._x_toggleAndCascadeWithTransitions = function (el, value, show, hide) {
    const nextTick2 = document.visibilityState === "visible" ? requestAnimationFrame : setTimeout;
    let clickAwayCompatibleShow = () => nextTick2(show);
    if (value) {
      if (el._x_transition && (el._x_transition.enter || el._x_transition.leave)) {
        el._x_transition.enter &&
        (Object.entries(el._x_transition.enter.during).length ||
          Object.entries(el._x_transition.enter.start).length ||
          Object.entries(el._x_transition.enter.end).length)
          ? el._x_transition.in(show)
          : clickAwayCompatibleShow();
      } else {
        el._x_transition ? el._x_transition.in(show) : clickAwayCompatibleShow();
      }
      return;
    }
    el._x_hidePromise = el._x_transition
      ? new Promise((resolve, reject) => {
          el._x_transition.out(
            () => {},
            () => resolve(hide),
          );
          el._x_transitioning &&
            el._x_transitioning.beforeCancel(() =>
              reject({
                isFromCancelledTransition: true,
              }),
            );
        })
      : Promise.resolve(hide);
    queueMicrotask(() => {
      let closest = closestHide(el);
      if (closest) {
        if (!closest._x_hideChildren) closest._x_hideChildren = [];
        closest._x_hideChildren.push(el);
      } else {
        nextTick2(() => {
          let hideAfterChildren = (el2) => {
            let carry = Promise.all([el2._x_hidePromise, ...(el2._x_hideChildren || []).map(hideAfterChildren)]).then(
              ([i]) => {
                return i === null || i === void 0 ? void 0 : i();
              },
            );
            delete el2._x_hidePromise;
            delete el2._x_hideChildren;
            return carry;
          };
          hideAfterChildren(el).catch((e) => {
            if (!e.isFromCancelledTransition) throw e;
          });
        });
      }
    });
  };
  function closestHide(el) {
    let parent = el.parentNode;
    if (!parent) return;
    return parent._x_hidePromise ? parent : closestHide(parent);
  }
  function transition(el, setFunction, { during, start: start2, end } = {}, before = () => {}, after = () => {}) {
    if (el._x_transitioning) el._x_transitioning.cancel();
    if (Object.keys(during).length === 0 && Object.keys(start2).length === 0 && Object.keys(end).length === 0) {
      before();
      after();
      return;
    }
    let undoStart, undoDuring, undoEnd;
    performTransition(el, {
      start() {
        undoStart = setFunction(el, start2);
      },
      during() {
        undoDuring = setFunction(el, during);
      },
      before,
      end() {
        undoStart();
        undoEnd = setFunction(el, end);
      },
      after,
      cleanup() {
        undoDuring();
        undoEnd();
      },
    });
  }
  function performTransition(el, stages) {
    let interrupted, reachedBefore, reachedEnd;
    let finish = once(() => {
      mutateDom(() => {
        interrupted = true;
        if (!reachedBefore) stages.before();
        if (!reachedEnd) {
          stages.end();
          releaseNextTicks();
        }
        stages.after();
        if (el.isConnected) stages.cleanup();
        delete el._x_transitioning;
      });
    });
    el._x_transitioning = {
      beforeCancels: [],
      beforeCancel(callback) {
        this.beforeCancels.push(callback);
      },
      cancel: once(function () {
        while (this.beforeCancels.length) {
          this.beforeCancels.shift()();
        }
        finish();
      }),
      finish,
    };
    mutateDom(() => {
      stages.start();
      stages.during();
    });
    holdNextTicks();
    requestAnimationFrame(() => {
      if (interrupted) return;
      let duration = Number(getComputedStyle(el).transitionDuration.replace(/,.*/, "").replace("s", "")) * 1e3;
      let delay = Number(getComputedStyle(el).transitionDelay.replace(/,.*/, "").replace("s", "")) * 1e3;
      if (duration === 0) duration = Number(getComputedStyle(el).animationDuration.replace("s", "")) * 1e3;
      mutateDom(() => {
        stages.before();
      });
      reachedBefore = true;
      requestAnimationFrame(() => {
        if (interrupted) return;
        mutateDom(() => {
          stages.end();
        });
        releaseNextTicks();
        setTimeout(el._x_transitioning.finish, duration + delay);
        reachedEnd = true;
      });
    });
  }
  function modifierValue(modifiers, key, fallback) {
    if (modifiers.indexOf(key) === -1) return fallback;
    const rawValue = modifiers[modifiers.indexOf(key) + 1];
    if (!rawValue) return fallback;
    if (key === "scale") {
      if (isNaN(rawValue)) return fallback;
    }
    if (key === "duration" || key === "delay") {
      let match = rawValue.match(/([0-9]+)ms/);
      if (match) return match[1];
    }
    if (key === "origin") {
      if (["top", "right", "left", "center", "bottom"].includes(modifiers[modifiers.indexOf(key) + 2])) {
        return [rawValue, modifiers[modifiers.indexOf(key) + 2]].join(" ");
      }
    }
    return rawValue;
  }
  // packages/alpinejs/src/clone.js
  var isCloning = false;
  function skipDuringClone(callback, fallback = () => {}) {
    return (...args) => (isCloning ? fallback(...args) : callback(...args));
  }
  function onlyDuringClone(callback) {
    return (...args) => isCloning && callback(...args);
  }
  var interceptors = [];
  function interceptClone(callback) {
    interceptors.push(callback);
  }
  function cloneNode(from, to) {
    interceptors.forEach((i) => i(from, to));
    isCloning = true;
    dontRegisterReactiveSideEffects(() => {
      initTree(to, (el, callback) => {
        callback(el, () => {});
      });
    });
    isCloning = false;
  }
  var isCloningLegacy = false;
  function clone$1(oldEl, newEl) {
    if (!newEl._x_dataStack) newEl._x_dataStack = oldEl._x_dataStack;
    isCloning = true;
    isCloningLegacy = true;
    dontRegisterReactiveSideEffects(() => {
      cloneTree(newEl);
    });
    isCloning = false;
    isCloningLegacy = false;
  }
  function cloneTree(el) {
    let hasRunThroughFirstEl = false;
    let shallowWalker = (el2, callback) => {
      walk(el2, (el3, skip) => {
        if (hasRunThroughFirstEl && isRoot(el3)) return skip();
        hasRunThroughFirstEl = true;
        callback(el3, skip);
      });
    };
    initTree(el, shallowWalker);
  }
  function dontRegisterReactiveSideEffects(callback) {
    let cache = effect;
    overrideEffect((callback2, el) => {
      let storedEffect = cache(callback2);
      release(storedEffect);
      return () => {};
    });
    callback();
    overrideEffect(cache);
  }
  // packages/alpinejs/src/utils/bind.js
  function bind(el, name, value, modifiers = []) {
    if (!el._x_bindings) el._x_bindings = reactive({});
    el._x_bindings[name] = value;
    name = modifiers.includes("camel") ? camelCase(name) : name;
    switch (name) {
      case "value":
        bindInputValue(el, value);
        break;
      case "style":
        bindStyles(el, value);
        break;
      case "class":
        bindClasses(el, value);
        break;
      case "selected":
      case "checked":
        bindAttributeAndProperty(el, name, value);
        break;
      default:
        bindAttribute(el, name, value);
        break;
    }
  }
  function bindInputValue(el, value) {
    if (isRadio(el)) {
      if (el.attributes.value === void 0) {
        el.value = value;
      }
      if (window.fromModel) {
        if (typeof value === "boolean") {
          el.checked = safeParseBoolean(el.value) === value;
        } else {
          el.checked = checkedAttrLooseCompare(el.value, value);
        }
      }
    } else if (isCheckbox(el)) {
      if (Number.isInteger(value)) {
        el.value = value;
      } else if (!Array.isArray(value) && typeof value !== "boolean" && ![null, void 0].includes(value)) {
        el.value = String(value);
      } else {
        if (Array.isArray(value)) {
          el.checked = value.some((val) => checkedAttrLooseCompare(val, el.value));
        } else {
          el.checked = !!value;
        }
      }
    } else if (el.tagName === "SELECT") {
      updateSelect(el, value);
    } else {
      if (el.value === value) return;
      el.value = value === void 0 ? "" : value;
    }
  }
  function bindClasses(el, value) {
    if (el._x_undoAddedClasses) el._x_undoAddedClasses();
    el._x_undoAddedClasses = setClasses(el, value);
  }
  function bindStyles(el, value) {
    if (el._x_undoAddedStyles) el._x_undoAddedStyles();
    el._x_undoAddedStyles = setStyles(el, value);
  }
  function bindAttributeAndProperty(el, name, value) {
    bindAttribute(el, name, value);
    setPropertyIfChanged(el, name, value);
  }
  function bindAttribute(el, name, value) {
    if ([null, void 0, false].includes(value) && attributeShouldntBePreservedIfFalsy(name)) {
      el.removeAttribute(name);
    } else {
      if (isBooleanAttr(name)) value = name;
      setIfChanged(el, name, value);
    }
  }
  function setIfChanged(el, attrName, value) {
    if (el.getAttribute(attrName) != value) {
      el.setAttribute(attrName, value);
    }
  }
  function setPropertyIfChanged(el, propName, value) {
    if (el[propName] !== value) {
      el[propName] = value;
    }
  }
  function updateSelect(el, value) {
    const arrayWrappedValue = [].concat(value).map((value2) => {
      return value2 + "";
    });
    Array.from(el.options).forEach((option) => {
      option.selected = arrayWrappedValue.includes(option.value);
    });
  }
  function camelCase(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }
  function checkedAttrLooseCompare(valueA, valueB) {
    return valueA == valueB;
  }
  function safeParseBoolean(rawValue) {
    if ([1, "1", "true", "on", "yes", true].includes(rawValue)) {
      return true;
    }
    if ([0, "0", "false", "off", "no", false].includes(rawValue)) {
      return false;
    }
    return rawValue ? Boolean(rawValue) : null;
  }
  var booleanAttributes = /* @__PURE__ */ new Set([
    "allowfullscreen",
    "async",
    "autofocus",
    "autoplay",
    "checked",
    "controls",
    "default",
    "defer",
    "disabled",
    "formnovalidate",
    "inert",
    "ismap",
    "itemscope",
    "loop",
    "multiple",
    "muted",
    "nomodule",
    "novalidate",
    "open",
    "playsinline",
    "readonly",
    "required",
    "reversed",
    "selected",
    "shadowrootclonable",
    "shadowrootdelegatesfocus",
    "shadowrootserializable",
  ]);
  function isBooleanAttr(attrName) {
    return booleanAttributes.has(attrName);
  }
  function attributeShouldntBePreservedIfFalsy(name) {
    return !["aria-pressed", "aria-checked", "aria-expanded", "aria-selected"].includes(name);
  }
  function getBinding(el, name, fallback) {
    if (el._x_bindings && el._x_bindings[name] !== void 0) return el._x_bindings[name];
    return getAttributeBinding(el, name, fallback);
  }
  function extractProp(el, name, fallback, extract = true) {
    if (el._x_bindings && el._x_bindings[name] !== void 0) return el._x_bindings[name];
    if (el._x_inlineBindings && el._x_inlineBindings[name] !== void 0) {
      let binding = el._x_inlineBindings[name];
      binding.extract = extract;
      return dontAutoEvaluateFunctions(() => {
        return evaluate(el, binding.expression);
      });
    }
    return getAttributeBinding(el, name, fallback);
  }
  function getAttributeBinding(el, name, fallback) {
    let attr = el.getAttribute(name);
    if (attr === null) return typeof fallback === "function" ? fallback() : fallback;
    if (attr === "") return true;
    if (isBooleanAttr(name)) {
      return !![name, "true"].includes(attr);
    }
    return attr;
  }
  function isCheckbox(el) {
    return el.type === "checkbox" || el.localName === "ui-checkbox" || el.localName === "ui-switch";
  }
  function isRadio(el) {
    return el.type === "radio" || el.localName === "ui-radio";
  }
  // packages/alpinejs/src/utils/debounce.js
  function debounce(func, wait) {
    var timeout;
    return function () {
      var context = this,
        args = arguments;
      var later = function () {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  // packages/alpinejs/src/utils/throttle.js
  function throttle(func, limit) {
    let inThrottle;
    return function () {
      let context = this,
        args = arguments;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
  // packages/alpinejs/src/entangle.js
  function entangle({ get: outerGet, set: outerSet }, { get: innerGet, set: innerSet }) {
    let firstRun = true;
    let outerHash;
    let reference = effect(() => {
      let outer = outerGet();
      let inner = innerGet();
      if (firstRun) {
        innerSet(cloneIfObject(outer));
        firstRun = false;
      } else {
        let outerHashLatest = JSON.stringify(outer);
        let innerHashLatest = JSON.stringify(inner);
        if (outerHashLatest !== outerHash) {
          innerSet(cloneIfObject(outer));
        } else if (outerHashLatest !== innerHashLatest) {
          outerSet(cloneIfObject(inner));
        } else;
      }
      outerHash = JSON.stringify(outerGet());
      JSON.stringify(innerGet());
    });
    return () => {
      release(reference);
    };
  }
  function cloneIfObject(value) {
    return typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }
  // packages/alpinejs/src/plugin.js
  function plugin(callback) {
    let callbacks = Array.isArray(callback) ? callback : [callback];
    callbacks.forEach((i) => i(alpine_default));
  }
  // packages/alpinejs/src/store.js
  var stores = {};
  var isReactive = false;
  function store(name, value) {
    if (!isReactive) {
      stores = reactive(stores);
      isReactive = true;
    }
    if (value === void 0) {
      return stores[name];
    }
    stores[name] = value;
    initInterceptors(stores[name]);
    if (
      typeof value === "object" &&
      value !== null &&
      value.hasOwnProperty("init") &&
      typeof value.init === "function"
    ) {
      stores[name].init();
    }
  }
  function getStores() {
    return stores;
  }
  // packages/alpinejs/src/binds.js
  var binds = {};
  function bind2(name, bindings) {
    let getBindings = typeof bindings !== "function" ? () => bindings : bindings;
    if (name instanceof Element) {
      return applyBindingsObject(name, getBindings());
    } else {
      binds[name] = getBindings;
    }
    return () => {};
  }
  function injectBindingProviders(obj) {
    Object.entries(binds).forEach(([name, callback]) => {
      Object.defineProperty(obj, name, {
        get() {
          return (...args) => {
            return callback(...args);
          };
        },
      });
    });
    return obj;
  }
  function applyBindingsObject(el, obj, original) {
    let cleanupRunners = [];
    while (cleanupRunners.length) cleanupRunners.pop()();
    let attributes = Object.entries(obj).map(([name, value]) => ({
      name,
      value,
    }));
    let staticAttributes = attributesOnly(attributes);
    attributes = attributes.map((attribute) => {
      if (staticAttributes.find((attr) => attr.name === attribute.name)) {
        return {
          name: `x-bind:${attribute.name}`,
          value: `"${attribute.value}"`,
        };
      }
      return attribute;
    });
    directives(el, attributes, original).map((handle) => {
      cleanupRunners.push(handle.runCleanups);
      handle();
    });
    return () => {
      while (cleanupRunners.length) cleanupRunners.pop()();
    };
  }
  // packages/alpinejs/src/datas.js
  var datas = {};
  function data(name, callback) {
    datas[name] = callback;
  }
  function injectDataProviders(obj, context) {
    Object.entries(datas).forEach(([name, callback]) => {
      Object.defineProperty(obj, name, {
        get() {
          return (...args) => {
            return callback.bind(context)(...args);
          };
        },
        enumerable: false,
      });
    });
    return obj;
  }
  // packages/alpinejs/src/alpine.js
  var Alpine$1 = {
    get reactive() {
      return reactive;
    },
    get release() {
      return release;
    },
    get effect() {
      return effect;
    },
    get raw() {
      return raw;
    },
    version: "3.14.9",
    flushAndStopDeferringMutations,
    dontAutoEvaluateFunctions,
    disableEffectScheduling,
    startObservingMutations,
    stopObservingMutations,
    setReactivityEngine,
    onAttributeRemoved,
    onAttributesAdded,
    closestDataStack,
    skipDuringClone,
    onlyDuringClone,
    addRootSelector,
    addInitSelector,
    interceptClone,
    addScopeToNode,
    deferMutations,
    mapAttributes,
    evaluateLater,
    interceptInit,
    setEvaluator,
    mergeProxies,
    extractProp,
    findClosest,
    onElRemoved,
    closestRoot,
    destroyTree,
    interceptor,
    // INTERNAL: not public API and is subject to change without major release.
    transition,
    // INTERNAL
    setStyles,
    // INTERNAL
    mutateDom,
    directive,
    entangle,
    throttle,
    debounce,
    evaluate,
    initTree,
    nextTick,
    prefixed: prefix,
    prefix: setPrefix,
    plugin,
    magic,
    store,
    start: start$1,
    clone: clone$1,
    // INTERNAL
    cloneNode,
    // INTERNAL
    bound: getBinding,
    $data: scope,
    watch,
    walk,
    data,
    bind: bind2,
  };
  var alpine_default = Alpine$1;
  // node_modules/@vue/shared/dist/shared.esm-bundler.js
  function makeMap(str, expectsLowerCase) {
    const map = /* @__PURE__ */ Object.create(null);
    const list = str.split(",");
    for (let i = 0; i < list.length; i++) {
      map[list[i]] = true;
    }
    return (val) => !!map[val];
  }
  var EMPTY_OBJ = Object.freeze({});
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (val, key) => hasOwnProperty.call(val, key);
  var isArray = Array.isArray;
  var isMap = (val) => toTypeString(val) === "[object Map]";
  var isString = (val) => typeof val === "string";
  var isSymbol = (val) => typeof val === "symbol";
  var isObject = (val) => val !== null && typeof val === "object";
  var objectToString = Object.prototype.toString;
  var toTypeString = (value) => objectToString.call(value);
  var toRawType = (value) => {
    return toTypeString(value).slice(8, -1);
  };
  var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
  var cacheStringFunction = (fn) => {
    const cache = /* @__PURE__ */ Object.create(null);
    return (str) => {
      const hit = cache[str];
      return hit || (cache[str] = fn(str));
    };
  };
  var capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
  var hasChanged = (value, oldValue) => value !== oldValue && (value === value || oldValue === oldValue);
  // node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js
  var targetMap = /* @__PURE__ */ new WeakMap();
  var effectStack = [];
  var activeEffect;
  var ITERATE_KEY = Symbol("iterate");
  var MAP_KEY_ITERATE_KEY = Symbol("Map key iterate");
  function isEffect(fn) {
    return fn && fn._isEffect === true;
  }
  function effect2(fn, options = EMPTY_OBJ) {
    if (isEffect(fn)) {
      fn = fn.raw;
    }
    const effect3 = createReactiveEffect(fn, options);
    if (!options.lazy) {
      effect3();
    }
    return effect3;
  }
  function stop(effect3) {
    if (effect3.active) {
      cleanup(effect3);
      if (effect3.options.onStop) {
        effect3.options.onStop();
      }
      effect3.active = false;
    }
  }
  var uid = 0;
  function createReactiveEffect(fn, options) {
    const effect3 = function reactiveEffect() {
      if (!effect3.active) {
        return fn();
      }
      if (!effectStack.includes(effect3)) {
        cleanup(effect3);
        try {
          enableTracking();
          effectStack.push(effect3);
          activeEffect = effect3;
          return fn();
        } finally {
          effectStack.pop();
          resetTracking();
          activeEffect = effectStack[effectStack.length - 1];
        }
      }
    };
    effect3.id = uid++;
    effect3.allowRecurse = !!options.allowRecurse;
    effect3._isEffect = true;
    effect3.active = true;
    effect3.raw = fn;
    effect3.deps = [];
    effect3.options = options;
    return effect3;
  }
  function cleanup(effect3) {
    const { deps } = effect3;
    if (deps.length) {
      for (let i = 0; i < deps.length; i++) {
        deps[i].delete(effect3);
      }
      deps.length = 0;
    }
  }
  var shouldTrack = true;
  var trackStack = [];
  function pauseTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = false;
  }
  function enableTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = true;
  }
  function resetTracking() {
    const last = trackStack.pop();
    shouldTrack = last === void 0 ? true : last;
  }
  function track(target, type, key) {
    if (!shouldTrack || activeEffect === void 0) {
      return;
    }
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = /* @__PURE__ */ new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = /* @__PURE__ */ new Set()));
    }
    if (!dep.has(activeEffect)) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
      if (activeEffect.options.onTrack) {
        activeEffect.options.onTrack({
          effect: activeEffect,
          target,
          type,
          key,
        });
      }
    }
  }
  function trigger(target, type, key, newValue, oldValue, oldTarget) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
      return;
    }
    const effects = /* @__PURE__ */ new Set();
    const add2 = (effectsToAdd) => {
      if (effectsToAdd) {
        effectsToAdd.forEach((effect3) => {
          if (effect3 !== activeEffect || effect3.allowRecurse) {
            effects.add(effect3);
          }
        });
      }
    };
    if (type === "clear") {
      depsMap.forEach(add2);
    } else if (key === "length" && isArray(target)) {
      depsMap.forEach((dep, key2) => {
        if (key2 === "length" || key2 >= newValue) {
          add2(dep);
        }
      });
    } else {
      if (key !== void 0) {
        add2(depsMap.get(key));
      }
      switch (type) {
        case "add":
          if (!isArray(target)) {
            add2(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              add2(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          } else if (isIntegerKey(key)) {
            add2(depsMap.get("length"));
          }
          break;
        case "delete":
          if (!isArray(target)) {
            add2(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              add2(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          }
          break;
        case "set":
          if (isMap(target)) {
            add2(depsMap.get(ITERATE_KEY));
          }
          break;
      }
    }
    const run = (effect3) => {
      if (effect3.options.onTrigger) {
        effect3.options.onTrigger({
          effect: effect3,
          target,
          key,
          type,
          newValue,
          oldValue,
          oldTarget,
        });
      }
      if (effect3.options.scheduler) {
        effect3.options.scheduler(effect3);
      } else {
        effect3();
      }
    };
    effects.forEach(run);
  }
  var isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
  var builtInSymbols = new Set(
    Object.getOwnPropertyNames(Symbol)
      .map((key) => Symbol[key])
      .filter(isSymbol),
  );
  var get2 = /* @__PURE__ */ createGetter();
  var readonlyGet = /* @__PURE__ */ createGetter(true);
  var arrayInstrumentations = /* @__PURE__ */ createArrayInstrumentations();
  function createArrayInstrumentations() {
    const instrumentations = {};
    ["includes", "indexOf", "lastIndexOf"].forEach((key) => {
      instrumentations[key] = function (...args) {
        const arr = toRaw(this);
        for (let i = 0, l = this.length; i < l; i++) {
          track(arr, "get", i + "");
        }
        const res = arr[key](...args);
        if (res === -1 || res === false) {
          return arr[key](...args.map(toRaw));
        } else {
          return res;
        }
      };
    });
    ["push", "pop", "shift", "unshift", "splice"].forEach((key) => {
      instrumentations[key] = function (...args) {
        pauseTracking();
        const res = toRaw(this)[key].apply(this, args);
        resetTracking();
        return res;
      };
    });
    return instrumentations;
  }
  function createGetter(isReadonly = false, shallow = false) {
    return function get3(target, key, receiver) {
      if (key === "__v_isReactive") {
        return !isReadonly;
      } else if (key === "__v_isReadonly") {
        return isReadonly;
      } else if (
        key === "__v_raw" &&
        receiver ===
          (isReadonly ? (shallow ? shallowReadonlyMap : readonlyMap) : shallow ? shallowReactiveMap : reactiveMap).get(
            target,
          )
      ) {
        return target;
      }
      const targetIsArray = isArray(target);
      if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }
      const res = Reflect.get(target, key, receiver);
      if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
        return res;
      }
      if (!isReadonly) {
        track(target, "get", key);
      }
      if (shallow) {
        return res;
      }
      if (isRef(res)) {
        const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
        return shouldUnwrap ? res.value : res;
      }
      if (isObject(res)) {
        return isReadonly ? readonly(res) : reactive2(res);
      }
      return res;
    };
  }
  var set2 = /* @__PURE__ */ createSetter();
  function createSetter(shallow = false) {
    return function set3(target, key, value, receiver) {
      let oldValue = target[key];
      if (!shallow) {
        value = toRaw(value);
        oldValue = toRaw(oldValue);
        if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
          oldValue.value = value;
          return true;
        }
      }
      const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
      const result = Reflect.set(target, key, value, receiver);
      if (target === toRaw(receiver)) {
        if (!hadKey) {
          trigger(target, "add", key, value);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, "set", key, value, oldValue);
        }
      }
      return result;
    };
  }
  function deleteProperty(target, key) {
    const hadKey = hasOwn(target, key);
    const oldValue = target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }
  function has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, "has", key);
    }
    return result;
  }
  function ownKeys(target) {
    track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
    return Reflect.ownKeys(target);
  }
  var mutableHandlers = {
    get: get2,
    set: set2,
    deleteProperty,
    has,
    ownKeys,
  };
  var readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
      {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
      }
      return true;
    },
    deleteProperty(target, key) {
      {
        console.warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
      }
      return true;
    },
  };
  var toReactive = (value) => (isObject(value) ? reactive2(value) : value);
  var toReadonly = (value) => (isObject(value) ? readonly(value) : value);
  var toShallow = (value) => value;
  var getProto = (v) => Reflect.getPrototypeOf(v);
  function get$1(target, key, isReadonly = false, isShallow = false) {
    target = target["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (key !== rawKey) {
      !isReadonly && track(rawTarget, "get", key);
    }
    !isReadonly && track(rawTarget, "get", rawKey);
    const { has: has2 } = getProto(rawTarget);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    if (has2.call(rawTarget, key)) {
      return wrap(target.get(key));
    } else if (has2.call(rawTarget, rawKey)) {
      return wrap(target.get(rawKey));
    } else if (target !== rawTarget) {
      target.get(key);
    }
  }
  function has$1(key, isReadonly = false) {
    const target = this["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (key !== rawKey) {
      !isReadonly && track(rawTarget, "has", key);
    }
    !isReadonly && track(rawTarget, "has", rawKey);
    return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
  }
  function size(target, isReadonly = false) {
    target = target["__v_raw"];
    !isReadonly && track(toRaw(target), "iterate", ITERATE_KEY);
    return Reflect.get(target, "size", target);
  }
  function add(value) {
    value = toRaw(value);
    const target = toRaw(this);
    const proto = getProto(target);
    const hadKey = proto.has.call(target, value);
    if (!hadKey) {
      target.add(value);
      trigger(target, "add", value, value);
    }
    return this;
  }
  function set$1(key, value) {
    value = toRaw(value);
    const target = toRaw(this);
    const { has: has2, get: get3 } = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    } else {
      checkIdentityKeys(target, has2, key);
    }
    const oldValue = get3.call(target, key);
    target.set(key, value);
    if (!hadKey) {
      trigger(target, "add", key, value);
    } else if (hasChanged(value, oldValue)) {
      trigger(target, "set", key, value, oldValue);
    }
    return this;
  }
  function deleteEntry(key) {
    const target = toRaw(this);
    const { has: has2, get: get3 } = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    } else {
      checkIdentityKeys(target, has2, key);
    }
    const oldValue = get3 ? get3.call(target, key) : void 0;
    const result = target.delete(key);
    if (hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }
  function clear() {
    const target = toRaw(this);
    const hadItems = target.size !== 0;
    const oldTarget = isMap(target) ? new Map(target) : new Set(target);
    const result = target.clear();
    if (hadItems) {
      trigger(target, "clear", void 0, void 0, oldTarget);
    }
    return result;
  }
  function createForEach(isReadonly, isShallow) {
    return function forEach(callback, thisArg) {
      const observed = this;
      const target = observed["__v_raw"];
      const rawTarget = toRaw(target);
      const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
      !isReadonly && track(rawTarget, "iterate", ITERATE_KEY);
      return target.forEach((value, key) => {
        return callback.call(thisArg, wrap(value), wrap(key), observed);
      });
    };
  }
  function createIterableMethod(method, isReadonly, isShallow) {
    return function (...args) {
      const target = this["__v_raw"];
      const rawTarget = toRaw(target);
      const targetIsMap = isMap(rawTarget);
      const isPair = method === "entries" || (method === Symbol.iterator && targetIsMap);
      const isKeyOnly = method === "keys" && targetIsMap;
      const innerIterator = target[method](...args);
      const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
      !isReadonly && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
      return {
        // iterator protocol
        next() {
          const { value, done } = innerIterator.next();
          return done
            ? {
                value,
                done,
              }
            : {
                value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
                done,
              };
        },
        // iterable protocol
        [Symbol.iterator]() {
          return this;
        },
      };
    };
  }
  function createReadonlyMethod(type) {
    return function (...args) {
      {
        const key = args[0] ? `on key "${args[0]}" ` : ``;
        console.warn(`${capitalize(type)} operation ${key}failed: target is readonly.`, toRaw(this));
      }
      return type === "delete" ? false : this;
    };
  }
  function createInstrumentations() {
    const mutableInstrumentations2 = {
      get(key) {
        return get$1(this, key);
      },
      get size() {
        return size(this);
      },
      has: has$1,
      add,
      set: set$1,
      delete: deleteEntry,
      clear,
      forEach: createForEach(false, false),
    };
    const shallowInstrumentations2 = {
      get(key) {
        return get$1(this, key, false, true);
      },
      get size() {
        return size(this);
      },
      has: has$1,
      add,
      set: set$1,
      delete: deleteEntry,
      clear,
      forEach: createForEach(false, true),
    };
    const readonlyInstrumentations2 = {
      get(key) {
        return get$1(this, key, true);
      },
      get size() {
        return size(this, true);
      },
      has(key) {
        return has$1.call(this, key, true);
      },
      add: createReadonlyMethod("add"),
      set: createReadonlyMethod("set"),
      delete: createReadonlyMethod("delete"),
      clear: createReadonlyMethod("clear"),
      forEach: createForEach(true, false),
    };
    const shallowReadonlyInstrumentations2 = {
      get(key) {
        return get$1(this, key, true, true);
      },
      get size() {
        return size(this, true);
      },
      has(key) {
        return has$1.call(this, key, true);
      },
      add: createReadonlyMethod("add"),
      set: createReadonlyMethod("set"),
      delete: createReadonlyMethod("delete"),
      clear: createReadonlyMethod("clear"),
      forEach: createForEach(true, true),
    };
    const iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
    iteratorMethods.forEach((method) => {
      mutableInstrumentations2[method] = createIterableMethod(method, false, false);
      readonlyInstrumentations2[method] = createIterableMethod(method, true, false);
      shallowInstrumentations2[method] = createIterableMethod(method, false, true);
      shallowReadonlyInstrumentations2[method] = createIterableMethod(method, true, true);
    });
    return [
      mutableInstrumentations2,
      readonlyInstrumentations2,
      shallowInstrumentations2,
      shallowReadonlyInstrumentations2,
    ];
  }
  var [mutableInstrumentations, readonlyInstrumentations, shallowInstrumentations, shallowReadonlyInstrumentations] =
    /* @__PURE__ */ createInstrumentations();
  function createInstrumentationGetter(isReadonly, shallow) {
    const instrumentations = isReadonly ? readonlyInstrumentations : mutableInstrumentations;
    return (target, key, receiver) => {
      if (key === "__v_isReactive") {
        return !isReadonly;
      } else if (key === "__v_isReadonly") {
        return isReadonly;
      } else if (key === "__v_raw") {
        return target;
      }
      return Reflect.get(hasOwn(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
    };
  }
  var mutableCollectionHandlers = {
    get: /* @__PURE__ */ createInstrumentationGetter(false),
  };
  var readonlyCollectionHandlers = {
    get: /* @__PURE__ */ createInstrumentationGetter(true),
  };
  function checkIdentityKeys(target, has2, key) {
    const rawKey = toRaw(key);
    if (rawKey !== key && has2.call(target, rawKey)) {
      const type = toRawType(target);
      console.warn(
        `Reactive ${type} contains both the raw and reactive versions of the same object${type === `Map` ? ` as keys` : ``}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`,
      );
    }
  }
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  var shallowReactiveMap = /* @__PURE__ */ new WeakMap();
  var readonlyMap = /* @__PURE__ */ new WeakMap();
  var shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
  function targetTypeMap(rawType) {
    switch (rawType) {
      case "Object":
      case "Array":
        return 1;
      case "Map":
      case "Set":
      case "WeakMap":
      case "WeakSet":
        return 2;
      default:
        return 0;
    }
  }
  function getTargetType(value) {
    return value["__v_skip"] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
  }
  function reactive2(target) {
    if (target && target["__v_isReadonly"]) {
      return target;
    }
    return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
  }
  function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
  }
  function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers, proxyMap) {
    if (!isObject(target)) {
      {
        console.warn(`value cannot be made reactive: ${String(target)}`);
      }
      return target;
    }
    if (target["__v_raw"] && !(isReadonly && target["__v_isReactive"])) {
      return target;
    }
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
      return existingProxy;
    }
    const targetType = getTargetType(target);
    if (targetType === 0) {
      return target;
    }
    const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
  }
  function toRaw(observed) {
    return (observed && toRaw(observed["__v_raw"])) || observed;
  }
  function isRef(r) {
    return Boolean(r && r.__v_isRef === true);
  }
  // packages/alpinejs/src/magics/$nextTick.js
  magic("nextTick", () => nextTick);
  // packages/alpinejs/src/magics/$dispatch.js
  magic("dispatch", (el) => dispatch.bind(dispatch, el));
  // packages/alpinejs/src/magics/$watch.js
  magic("watch", (el, { evaluateLater: evaluateLater2, cleanup: cleanup2 }) => (key, callback) => {
    let evaluate2 = evaluateLater2(key);
    let getter = () => {
      let value;
      evaluate2((i) => (value = i));
      return value;
    };
    let unwatch = watch(getter, callback);
    cleanup2(unwatch);
  });
  // packages/alpinejs/src/magics/$store.js
  magic("store", getStores);
  // packages/alpinejs/src/magics/$data.js
  magic("data", (el) => scope(el));
  // packages/alpinejs/src/magics/$root.js
  magic("root", (el) => closestRoot(el));
  // packages/alpinejs/src/magics/$refs.js
  magic("refs", (el) => {
    if (el._x_refs_proxy) return el._x_refs_proxy;
    el._x_refs_proxy = mergeProxies(getArrayOfRefObject(el));
    return el._x_refs_proxy;
  });
  function getArrayOfRefObject(el) {
    let refObjects = [];
    findClosest(el, (i) => {
      if (i._x_refs) refObjects.push(i._x_refs);
    });
    return refObjects;
  }
  // packages/alpinejs/src/ids.js
  var globalIdMemo = {};
  function findAndIncrementId(name) {
    if (!globalIdMemo[name]) globalIdMemo[name] = 0;
    return ++globalIdMemo[name];
  }
  function closestIdRoot(el, name) {
    return findClosest(el, (element) => {
      if (element._x_ids && element._x_ids[name]) return true;
    });
  }
  function setIdRoot(el, name) {
    if (!el._x_ids) el._x_ids = {};
    if (!el._x_ids[name]) el._x_ids[name] = findAndIncrementId(name);
  }
  // packages/alpinejs/src/magics/$id.js
  magic("id", (el, { cleanup: cleanup2 }) => (name, key = null) => {
    let cacheKey = `${name}${key ? `-${key}` : ""}`;
    return cacheIdByNameOnElement(el, cacheKey, cleanup2, () => {
      let root = closestIdRoot(el, name);
      let id = root ? root._x_ids[name] : findAndIncrementId(name);
      return key ? `${name}-${id}-${key}` : `${name}-${id}`;
    });
  });
  interceptClone((from, to) => {
    if (from._x_id) {
      to._x_id = from._x_id;
    }
  });
  function cacheIdByNameOnElement(el, cacheKey, cleanup2, callback) {
    if (!el._x_id) el._x_id = {};
    if (el._x_id[cacheKey]) return el._x_id[cacheKey];
    let output = callback();
    el._x_id[cacheKey] = output;
    cleanup2(() => {
      delete el._x_id[cacheKey];
    });
    return output;
  }
  // packages/alpinejs/src/magics/$el.js
  magic("el", (el) => el);
  // packages/alpinejs/src/magics/index.js
  warnMissingPluginMagic("Focus", "focus", "focus");
  warnMissingPluginMagic("Persist", "persist", "persist");
  function warnMissingPluginMagic(name, magicName, slug) {
    magic(magicName, (el) =>
      warn(
        `You can't use [$${magicName}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`,
        el,
      ),
    );
  }
  // packages/alpinejs/src/directives/x-modelable.js
  directive(
    "modelable",
    (el, { expression }, { effect: effect3, evaluateLater: evaluateLater2, cleanup: cleanup2 }) => {
      let func = evaluateLater2(expression);
      let innerGet = () => {
        let result;
        func((i) => (result = i));
        return result;
      };
      let evaluateInnerSet = evaluateLater2(`${expression} = __placeholder`);
      let innerSet = (val) =>
        evaluateInnerSet(() => {}, {
          scope: {
            __placeholder: val,
          },
        });
      let initialValue = innerGet();
      innerSet(initialValue);
      queueMicrotask(() => {
        if (!el._x_model) return;
        el._x_removeModelListeners["default"]();
        let outerGet = el._x_model.get;
        let outerSet = el._x_model.set;
        let releaseEntanglement = entangle(
          {
            get() {
              return outerGet();
            },
            set(value) {
              outerSet(value);
            },
          },
          {
            get() {
              return innerGet();
            },
            set(value) {
              innerSet(value);
            },
          },
        );
        cleanup2(releaseEntanglement);
      });
    },
  );
  // packages/alpinejs/src/directives/x-teleport.js
  directive("teleport", (el, { modifiers, expression }, { cleanup: cleanup2 }) => {
    if (el.tagName.toLowerCase() !== "template") warn("x-teleport can only be used on a <template> tag", el);
    let target = getTarget(expression);
    let clone2 = el.content.cloneNode(true).firstElementChild;
    el._x_teleport = clone2;
    clone2._x_teleportBack = el;
    el.setAttribute("data-teleport-template", true);
    clone2.setAttribute("data-teleport-target", true);
    if (el._x_forwardEvents) {
      el._x_forwardEvents.forEach((eventName) => {
        clone2.addEventListener(eventName, (e) => {
          e.stopPropagation();
          el.dispatchEvent(new e.constructor(e.type, e));
        });
      });
    }
    addScopeToNode(clone2, {}, el);
    let placeInDom = (clone3, target2, modifiers2) => {
      if (modifiers2.includes("prepend")) {
        target2.parentNode.insertBefore(clone3, target2);
      } else if (modifiers2.includes("append")) {
        target2.parentNode.insertBefore(clone3, target2.nextSibling);
      } else {
        target2.appendChild(clone3);
      }
    };
    mutateDom(() => {
      placeInDom(clone2, target, modifiers);
      skipDuringClone(() => {
        initTree(clone2);
      })();
    });
    el._x_teleportPutBack = () => {
      let target2 = getTarget(expression);
      mutateDom(() => {
        placeInDom(el._x_teleport, target2, modifiers);
      });
    };
    cleanup2(() =>
      mutateDom(() => {
        clone2.remove();
        destroyTree(clone2);
      }),
    );
  });
  var teleportContainerDuringClone = document.createElement("div");
  function getTarget(expression) {
    let target = skipDuringClone(
      () => {
        return document.querySelector(expression);
      },
      () => {
        return teleportContainerDuringClone;
      },
    )();
    if (!target) warn(`Cannot find x-teleport element for selector: "${expression}"`);
    return target;
  }
  // packages/alpinejs/src/directives/x-ignore.js
  var handler = () => {};
  handler.inline = (el, { modifiers }, { cleanup: cleanup2 }) => {
    modifiers.includes("self") ? (el._x_ignoreSelf = true) : (el._x_ignore = true);
    cleanup2(() => {
      modifiers.includes("self") ? delete el._x_ignoreSelf : delete el._x_ignore;
    });
  };
  directive("ignore", handler);
  // packages/alpinejs/src/directives/x-effect.js
  directive(
    "effect",
    skipDuringClone((el, { expression }, { effect: effect3 }) => {
      effect3(evaluateLater(el, expression));
    }),
  );
  // packages/alpinejs/src/utils/on.js
  function on(el, event, modifiers, callback) {
    let listenerTarget = el;
    let handler4 = (e) => callback(e);
    let options = {};
    let wrapHandler = (callback2, wrapper) => (e) => wrapper(callback2, e);
    if (modifiers.includes("dot")) event = dotSyntax(event);
    if (modifiers.includes("camel")) event = camelCase2(event);
    if (modifiers.includes("passive")) options.passive = true;
    if (modifiers.includes("capture")) options.capture = true;
    if (modifiers.includes("window")) listenerTarget = window;
    if (modifiers.includes("document")) listenerTarget = document;
    if (modifiers.includes("debounce")) {
      let nextModifier = modifiers[modifiers.indexOf("debounce") + 1] || "invalid-wait";
      let wait = isNumeric$1(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler4 = debounce(handler4, wait);
    }
    if (modifiers.includes("throttle")) {
      let nextModifier = modifiers[modifiers.indexOf("throttle") + 1] || "invalid-wait";
      let wait = isNumeric$1(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler4 = throttle(handler4, wait);
    }
    if (modifiers.includes("prevent"))
      handler4 = wrapHandler(handler4, (next, e) => {
        e.preventDefault();
        next(e);
      });
    if (modifiers.includes("stop"))
      handler4 = wrapHandler(handler4, (next, e) => {
        e.stopPropagation();
        next(e);
      });
    if (modifiers.includes("once")) {
      handler4 = wrapHandler(handler4, (next, e) => {
        next(e);
        listenerTarget.removeEventListener(event, handler4, options);
      });
    }
    if (modifiers.includes("away") || modifiers.includes("outside")) {
      listenerTarget = document;
      handler4 = wrapHandler(handler4, (next, e) => {
        if (el.contains(e.target)) return;
        if (e.target.isConnected === false) return;
        if (el.offsetWidth < 1 && el.offsetHeight < 1) return;
        if (el._x_isShown === false) return;
        next(e);
      });
    }
    if (modifiers.includes("self"))
      handler4 = wrapHandler(handler4, (next, e) => {
        e.target === el && next(e);
      });
    if (isKeyEvent(event) || isClickEvent(event)) {
      handler4 = wrapHandler(handler4, (next, e) => {
        if (isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers)) {
          return;
        }
        next(e);
      });
    }
    listenerTarget.addEventListener(event, handler4, options);
    return () => {
      listenerTarget.removeEventListener(event, handler4, options);
    };
  }
  function dotSyntax(subject) {
    return subject.replace(/-/g, ".");
  }
  function camelCase2(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }
  function isNumeric$1(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  function kebabCase2(subject) {
    if ([" ", "_"].includes(subject)) return subject;
    return subject
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[_\s]/, "-")
      .toLowerCase();
  }
  function isKeyEvent(event) {
    return ["keydown", "keyup"].includes(event);
  }
  function isClickEvent(event) {
    return ["contextmenu", "click", "mouse"].some((i) => event.includes(i));
  }
  function isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers) {
    let keyModifiers = modifiers.filter((i) => {
      return ![
        "window",
        "document",
        "prevent",
        "stop",
        "once",
        "capture",
        "self",
        "away",
        "outside",
        "passive",
      ].includes(i);
    });
    if (keyModifiers.includes("debounce")) {
      let debounceIndex = keyModifiers.indexOf("debounce");
      keyModifiers.splice(
        debounceIndex,
        isNumeric$1((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1,
      );
    }
    if (keyModifiers.includes("throttle")) {
      let debounceIndex = keyModifiers.indexOf("throttle");
      keyModifiers.splice(
        debounceIndex,
        isNumeric$1((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1,
      );
    }
    if (keyModifiers.length === 0) return false;
    if (keyModifiers.length === 1 && keyToModifiers(e.key).includes(keyModifiers[0])) return false;
    const systemKeyModifiers = ["ctrl", "shift", "alt", "meta", "cmd", "super"];
    const selectedSystemKeyModifiers = systemKeyModifiers.filter((modifier) => keyModifiers.includes(modifier));
    keyModifiers = keyModifiers.filter((i) => !selectedSystemKeyModifiers.includes(i));
    if (selectedSystemKeyModifiers.length > 0) {
      const activelyPressedKeyModifiers = selectedSystemKeyModifiers.filter((modifier) => {
        if (modifier === "cmd" || modifier === "super") modifier = "meta";
        return e[`${modifier}Key`];
      });
      if (activelyPressedKeyModifiers.length === selectedSystemKeyModifiers.length) {
        if (isClickEvent(e.type)) return false;
        if (keyToModifiers(e.key).includes(keyModifiers[0])) return false;
      }
    }
    return true;
  }
  function keyToModifiers(key) {
    if (!key) return [];
    key = kebabCase2(key);
    let modifierToKeyMap = {
      ctrl: "control",
      slash: "/",
      space: " ",
      spacebar: " ",
      cmd: "meta",
      esc: "escape",
      up: "arrow-up",
      down: "arrow-down",
      left: "arrow-left",
      right: "arrow-right",
      period: ".",
      comma: ",",
      equal: "=",
      minus: "-",
      underscore: "_",
    };
    modifierToKeyMap[key] = key;
    return Object.keys(modifierToKeyMap)
      .map((modifier) => {
        if (modifierToKeyMap[modifier] === key) return modifier;
      })
      .filter((modifier) => modifier);
  }
  // packages/alpinejs/src/directives/x-model.js
  directive("model", (el, { modifiers, expression }, { effect: effect3, cleanup: cleanup2 }) => {
    let scopeTarget = el;
    if (modifiers.includes("parent")) {
      scopeTarget = el.parentNode;
    }
    let evaluateGet = evaluateLater(scopeTarget, expression);
    let evaluateSet;
    if (typeof expression === "string") {
      evaluateSet = evaluateLater(scopeTarget, `${expression} = __placeholder`);
    } else if (typeof expression === "function" && typeof expression() === "string") {
      evaluateSet = evaluateLater(scopeTarget, `${expression()} = __placeholder`);
    } else {
      evaluateSet = () => {};
    }
    let getValue = () => {
      let result;
      evaluateGet((value) => (result = value));
      return isGetterSetter(result) ? result.get() : result;
    };
    let setValue = (value) => {
      let result;
      evaluateGet((value2) => (result = value2));
      if (isGetterSetter(result)) {
        result.set(value);
      } else {
        evaluateSet(() => {}, {
          scope: {
            __placeholder: value,
          },
        });
      }
    };
    if (typeof expression === "string" && el.type === "radio") {
      mutateDom(() => {
        if (!el.hasAttribute("name")) el.setAttribute("name", expression);
      });
    }
    var event =
      el.tagName.toLowerCase() === "select" || ["checkbox", "radio"].includes(el.type) || modifiers.includes("lazy")
        ? "change"
        : "input";
    let removeListener = isCloning
      ? () => {}
      : on(el, event, modifiers, (e) => {
          setValue(getInputValue(el, modifiers, e, getValue()));
        });
    if (modifiers.includes("fill")) {
      if (
        [void 0, null, ""].includes(getValue()) ||
        (isCheckbox(el) && Array.isArray(getValue())) ||
        (el.tagName.toLowerCase() === "select" && el.multiple)
      ) {
        setValue(
          getInputValue(
            el,
            modifiers,
            {
              target: el,
            },
            getValue(),
          ),
        );
      }
    }
    if (!el._x_removeModelListeners) el._x_removeModelListeners = {};
    el._x_removeModelListeners["default"] = removeListener;
    cleanup2(() => el._x_removeModelListeners["default"]());
    if (el.form) {
      let removeResetListener = on(el.form, "reset", [], (e) => {
        nextTick(
          () =>
            el._x_model &&
            el._x_model.set(
              getInputValue(
                el,
                modifiers,
                {
                  target: el,
                },
                getValue(),
              ),
            ),
        );
      });
      cleanup2(() => removeResetListener());
    }
    el._x_model = {
      get() {
        return getValue();
      },
      set(value) {
        setValue(value);
      },
    };
    el._x_forceModelUpdate = (value) => {
      if (value === void 0 && typeof expression === "string" && expression.match(/\./)) value = "";
      window.fromModel = true;
      mutateDom(() => bind(el, "value", value));
      delete window.fromModel;
    };
    effect3(() => {
      let value = getValue();
      if (modifiers.includes("unintrusive") && document.activeElement.isSameNode(el)) return;
      el._x_forceModelUpdate(value);
    });
  });
  function getInputValue(el, modifiers, event, currentValue) {
    return mutateDom(() => {
      if (event instanceof CustomEvent && event.detail !== void 0)
        return event.detail !== null && event.detail !== void 0 ? event.detail : event.target.value;
      else if (isCheckbox(el)) {
        if (Array.isArray(currentValue)) {
          let newValue = null;
          if (modifiers.includes("number")) {
            newValue = safeParseNumber(event.target.value);
          } else if (modifiers.includes("boolean")) {
            newValue = safeParseBoolean(event.target.value);
          } else {
            newValue = event.target.value;
          }
          return event.target.checked
            ? currentValue.includes(newValue)
              ? currentValue
              : currentValue.concat([newValue])
            : currentValue.filter((el2) => !checkedAttrLooseCompare2(el2, newValue));
        } else {
          return event.target.checked;
        }
      } else if (el.tagName.toLowerCase() === "select" && el.multiple) {
        if (modifiers.includes("number")) {
          return Array.from(event.target.selectedOptions).map((option) => {
            let rawValue = option.value || option.text;
            return safeParseNumber(rawValue);
          });
        } else if (modifiers.includes("boolean")) {
          return Array.from(event.target.selectedOptions).map((option) => {
            let rawValue = option.value || option.text;
            return safeParseBoolean(rawValue);
          });
        }
        return Array.from(event.target.selectedOptions).map((option) => {
          return option.value || option.text;
        });
      } else {
        let newValue;
        if (isRadio(el)) {
          if (event.target.checked) {
            newValue = event.target.value;
          } else {
            newValue = currentValue;
          }
        } else {
          newValue = event.target.value;
        }
        if (modifiers.includes("number")) {
          return safeParseNumber(newValue);
        } else if (modifiers.includes("boolean")) {
          return safeParseBoolean(newValue);
        } else if (modifiers.includes("trim")) {
          return newValue.trim();
        } else {
          return newValue;
        }
      }
    });
  }
  function safeParseNumber(rawValue) {
    let number = rawValue ? parseFloat(rawValue) : null;
    return isNumeric2(number) ? number : rawValue;
  }
  function checkedAttrLooseCompare2(valueA, valueB) {
    return valueA == valueB;
  }
  function isNumeric2(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  function isGetterSetter(value) {
    return (
      value !== null && typeof value === "object" && typeof value.get === "function" && typeof value.set === "function"
    );
  }
  // packages/alpinejs/src/directives/x-cloak.js
  directive("cloak", (el) => queueMicrotask(() => mutateDom(() => el.removeAttribute(prefix("cloak")))));
  // packages/alpinejs/src/directives/x-init.js
  addInitSelector(() => `[${prefix("init")}]`);
  directive(
    "init",
    skipDuringClone((el, { expression }, { evaluate: evaluate2 }) => {
      if (typeof expression === "string") {
        return !!expression.trim() && evaluate2(expression, {}, false);
      }
      return evaluate2(expression, {}, false);
    }),
  );
  // packages/alpinejs/src/directives/x-text.js
  directive("text", (el, { expression }, { effect: effect3, evaluateLater: evaluateLater2 }) => {
    let evaluate2 = evaluateLater2(expression);
    effect3(() => {
      evaluate2((value) => {
        mutateDom(() => {
          el.textContent = value;
        });
      });
    });
  });
  // packages/alpinejs/src/directives/x-html.js
  directive("html", (el, { expression }, { effect: effect3, evaluateLater: evaluateLater2 }) => {
    let evaluate2 = evaluateLater2(expression);
    effect3(() => {
      evaluate2((value) => {
        mutateDom(() => {
          el.innerHTML = value;
          el._x_ignoreSelf = true;
          initTree(el);
          delete el._x_ignoreSelf;
        });
      });
    });
  });
  // packages/alpinejs/src/directives/x-bind.js
  mapAttributes(startingWith(":", into(prefix("bind:"))));
  var handler2 = (el, { value, modifiers, expression, original }, { effect: effect3, cleanup: cleanup2 }) => {
    if (!value) {
      let bindingProviders = {};
      injectBindingProviders(bindingProviders);
      let getBindings = evaluateLater(el, expression);
      getBindings(
        (bindings) => {
          applyBindingsObject(el, bindings, original);
        },
        {
          scope: bindingProviders,
        },
      );
      return;
    }
    if (value === "key") return storeKeyForXFor(el, expression);
    if (el._x_inlineBindings && el._x_inlineBindings[value] && el._x_inlineBindings[value].extract) {
      return;
    }
    let evaluate2 = evaluateLater(el, expression);
    effect3(() =>
      evaluate2((result) => {
        if (result === void 0 && typeof expression === "string" && expression.match(/\./)) {
          result = "";
        }
        mutateDom(() => bind(el, value, result, modifiers));
      }),
    );
    cleanup2(() => {
      el._x_undoAddedClasses && el._x_undoAddedClasses();
      el._x_undoAddedStyles && el._x_undoAddedStyles();
    });
  };
  handler2.inline = (el, { value, modifiers, expression }) => {
    if (!value) return;
    if (!el._x_inlineBindings) el._x_inlineBindings = {};
    el._x_inlineBindings[value] = {
      expression,
      extract: false,
    };
  };
  directive("bind", handler2);
  function storeKeyForXFor(el, expression) {
    el._x_keyExpression = expression;
  }
  // packages/alpinejs/src/directives/x-data.js
  addRootSelector(() => `[${prefix("data")}]`);
  directive("data", (el, { expression }, { cleanup: cleanup2 }) => {
    if (shouldSkipRegisteringDataDuringClone(el)) return;
    expression = expression === "" ? "{}" : expression;
    let magicContext = {};
    injectMagics(magicContext, el);
    let dataProviderContext = {};
    injectDataProviders(dataProviderContext, magicContext);
    let data2 = evaluate(el, expression, {
      scope: dataProviderContext,
    });
    if (data2 === void 0 || data2 === true) data2 = {};
    injectMagics(data2, el);
    let reactiveData = reactive(data2);
    initInterceptors(reactiveData);
    let undo = addScopeToNode(el, reactiveData);
    reactiveData["init"] && evaluate(el, reactiveData["init"]);
    cleanup2(() => {
      reactiveData["destroy"] && evaluate(el, reactiveData["destroy"]);
      undo();
    });
  });
  interceptClone((from, to) => {
    if (from._x_dataStack) {
      to._x_dataStack = from._x_dataStack;
      to.setAttribute("data-has-alpine-state", true);
    }
  });
  function shouldSkipRegisteringDataDuringClone(el) {
    if (!isCloning) return false;
    if (isCloningLegacy) return true;
    return el.hasAttribute("data-has-alpine-state");
  }
  // packages/alpinejs/src/directives/x-show.js
  directive("show", (el, { modifiers, expression }, { effect: effect3 }) => {
    let evaluate2 = evaluateLater(el, expression);
    if (!el._x_doHide)
      el._x_doHide = () => {
        mutateDom(() => {
          el.style.setProperty("display", "none", modifiers.includes("important") ? "important" : void 0);
        });
      };
    if (!el._x_doShow)
      el._x_doShow = () => {
        mutateDom(() => {
          if (el.style.length === 1 && el.style.display === "none") {
            el.removeAttribute("style");
          } else {
            el.style.removeProperty("display");
          }
        });
      };
    let hide = () => {
      el._x_doHide();
      el._x_isShown = false;
    };
    let show = () => {
      el._x_doShow();
      el._x_isShown = true;
    };
    let clickAwayCompatibleShow = () => setTimeout(show);
    let toggle = once(
      (value) => (value ? show() : hide()),
      (value) => {
        if (typeof el._x_toggleAndCascadeWithTransitions === "function") {
          el._x_toggleAndCascadeWithTransitions(el, value, show, hide);
        } else {
          value ? clickAwayCompatibleShow() : hide();
        }
      },
    );
    let oldValue;
    let firstTime = true;
    effect3(() =>
      evaluate2((value) => {
        if (!firstTime && value === oldValue) return;
        if (modifiers.includes("immediate")) value ? clickAwayCompatibleShow() : hide();
        toggle(value);
        oldValue = value;
        firstTime = false;
      }),
    );
  });
  // packages/alpinejs/src/directives/x-for.js
  directive("for", (el, { expression }, { effect: effect3, cleanup: cleanup2 }) => {
    let iteratorNames = parseForExpression(expression);
    let evaluateItems = evaluateLater(el, iteratorNames.items);
    let evaluateKey = evaluateLater(
      el, // the x-bind:key expression is stored for our use instead of evaluated.
      el._x_keyExpression || "index",
    );
    el._x_prevKeys = [];
    el._x_lookup = {};
    effect3(() => loop(el, iteratorNames, evaluateItems, evaluateKey));
    cleanup2(() => {
      Object.values(el._x_lookup).forEach((el2) =>
        mutateDom(() => {
          destroyTree(el2);
          el2.remove();
        }),
      );
      delete el._x_prevKeys;
      delete el._x_lookup;
    });
  });
  function loop(el, iteratorNames, evaluateItems, evaluateKey) {
    let isObject2 = (i) => typeof i === "object" && !Array.isArray(i);
    let templateEl = el;
    evaluateItems((items) => {
      if (isNumeric3(items) && items >= 0) {
        items = Array.from(Array(items).keys(), (i) => i + 1);
      }
      if (items === void 0) items = [];
      let lookup = el._x_lookup;
      let prevKeys = el._x_prevKeys;
      let scopes = [];
      let keys = [];
      if (isObject2(items)) {
        items = Object.entries(items).map(([key, value]) => {
          let scope2 = getIterationScopeVariables(iteratorNames, value, key, items);
          evaluateKey(
            (value2) => {
              if (keys.includes(value2)) warn("Duplicate key on x-for", el);
              keys.push(value2);
            },
            {
              scope: {
                index: key,
                ...scope2,
              },
            },
          );
          scopes.push(scope2);
        });
      } else {
        for (let i = 0; i < items.length; i++) {
          let scope2 = getIterationScopeVariables(iteratorNames, items[i], i, items);
          evaluateKey(
            (value) => {
              if (keys.includes(value)) warn("Duplicate key on x-for", el);
              keys.push(value);
            },
            {
              scope: {
                index: i,
                ...scope2,
              },
            },
          );
          scopes.push(scope2);
        }
      }
      let adds = [];
      let moves = [];
      let removes = [];
      let sames = [];
      for (let i7 = 0; i7 < prevKeys.length; i7++) {
        let key = prevKeys[i7];
        if (keys.indexOf(key) === -1) removes.push(key);
      }
      prevKeys = prevKeys.filter((key) => !removes.includes(key));
      let lastKey = "template";
      for (let i2 = 0; i2 < keys.length; i2++) {
        let key = keys[i2];
        let prevIndex = prevKeys.indexOf(key);
        if (prevIndex === -1) {
          prevKeys.splice(i2, 0, key);
          adds.push([lastKey, i2]);
        } else if (prevIndex !== i2) {
          let keyInSpot = prevKeys.splice(i2, 1)[0];
          let keyForSpot = prevKeys.splice(prevIndex - 1, 1)[0];
          prevKeys.splice(i2, 0, keyForSpot);
          prevKeys.splice(prevIndex, 0, keyInSpot);
          moves.push([keyInSpot, keyForSpot]);
        } else {
          sames.push(key);
        }
        lastKey = key;
      }
      for (let i3 = 0; i3 < removes.length; i3++) {
        let key = removes[i3];
        if (!(key in lookup)) continue;
        mutateDom(() => {
          destroyTree(lookup[key]);
          lookup[key].remove();
        });
        delete lookup[key];
      }
      for (let i4 = 0; i4 < moves.length; i4++) {
        let [keyInSpot, keyForSpot] = moves[i4];
        let elInSpot = lookup[keyInSpot];
        let elForSpot = lookup[keyForSpot];
        let marker = document.createElement("div");
        mutateDom(() => {
          if (!elForSpot) warn(`x-for ":key" is undefined or invalid`, templateEl, keyForSpot, lookup);
          elForSpot.after(marker);
          elInSpot.after(elForSpot);
          elForSpot._x_currentIfEl && elForSpot.after(elForSpot._x_currentIfEl);
          marker.before(elInSpot);
          elInSpot._x_currentIfEl && elInSpot.after(elInSpot._x_currentIfEl);
          marker.remove();
        });
        elForSpot._x_refreshXForScope(scopes[keys.indexOf(keyForSpot)]);
      }
      for (let i5 = 0; i5 < adds.length; i5++) {
        let [lastKey2, index] = adds[i5];
        let lastEl = lastKey2 === "template" ? templateEl : lookup[lastKey2];
        if (lastEl._x_currentIfEl) lastEl = lastEl._x_currentIfEl;
        let scope2 = scopes[index];
        let key = keys[index];
        let clone2 = document.importNode(templateEl.content, true).firstElementChild;
        let reactiveScope = reactive(scope2);
        addScopeToNode(clone2, reactiveScope, templateEl);
        clone2._x_refreshXForScope = (newScope) => {
          Object.entries(newScope).forEach(([key2, value]) => {
            reactiveScope[key2] = value;
          });
        };
        mutateDom(() => {
          lastEl.after(clone2);
          skipDuringClone(() => initTree(clone2))();
        });
        if (typeof key === "object") {
          warn("x-for key cannot be an object, it must be a string or an integer", templateEl);
        }
        lookup[key] = clone2;
      }
      for (let i6 = 0; i6 < sames.length; i6++) {
        lookup[sames[i6]]._x_refreshXForScope(scopes[keys.indexOf(sames[i6])]);
      }
      templateEl._x_prevKeys = keys;
    });
  }
  function parseForExpression(expression) {
    let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
    let stripParensRE = /^\s*\(|\)\s*$/g;
    let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
    let inMatch = expression.match(forAliasRE);
    if (!inMatch) return;
    let res = {};
    res.items = inMatch[2].trim();
    let item = inMatch[1].replace(stripParensRE, "").trim();
    let iteratorMatch = item.match(forIteratorRE);
    if (iteratorMatch) {
      res.item = item.replace(forIteratorRE, "").trim();
      res.index = iteratorMatch[1].trim();
      if (iteratorMatch[2]) {
        res.collection = iteratorMatch[2].trim();
      }
    } else {
      res.item = item;
    }
    return res;
  }
  function getIterationScopeVariables(iteratorNames, item, index, items) {
    let scopeVariables = {};
    if (/^\[.*\]$/.test(iteratorNames.item) && Array.isArray(item)) {
      let names = iteratorNames.item
        .replace("[", "")
        .replace("]", "")
        .split(",")
        .map((i) => i.trim());
      names.forEach((name, i) => {
        scopeVariables[name] = item[i];
      });
    } else if (/^\{.*\}$/.test(iteratorNames.item) && !Array.isArray(item) && typeof item === "object") {
      let names = iteratorNames.item
        .replace("{", "")
        .replace("}", "")
        .split(",")
        .map((i) => i.trim());
      names.forEach((name) => {
        scopeVariables[name] = item[name];
      });
    } else {
      scopeVariables[iteratorNames.item] = item;
    }
    if (iteratorNames.index) scopeVariables[iteratorNames.index] = index;
    if (iteratorNames.collection) scopeVariables[iteratorNames.collection] = items;
    return scopeVariables;
  }
  function isNumeric3(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  // packages/alpinejs/src/directives/x-ref.js
  function handler3() {}
  handler3.inline = (el, { expression }, { cleanup: cleanup2 }) => {
    let root = closestRoot(el);
    if (!root._x_refs) root._x_refs = {};
    root._x_refs[expression] = el;
    cleanup2(() => delete root._x_refs[expression]);
  };
  directive("ref", handler3);
  // packages/alpinejs/src/directives/x-if.js
  directive("if", (el, { expression }, { effect: effect3, cleanup: cleanup2 }) => {
    if (el.tagName.toLowerCase() !== "template") warn("x-if can only be used on a <template> tag", el);
    let evaluate2 = evaluateLater(el, expression);
    let show = () => {
      if (el._x_currentIfEl) return el._x_currentIfEl;
      let clone2 = el.content.cloneNode(true).firstElementChild;
      addScopeToNode(clone2, {}, el);
      mutateDom(() => {
        el.after(clone2);
        skipDuringClone(() => initTree(clone2))();
      });
      el._x_currentIfEl = clone2;
      el._x_undoIf = () => {
        mutateDom(() => {
          destroyTree(clone2);
          clone2.remove();
        });
        delete el._x_currentIfEl;
      };
      return clone2;
    };
    let hide = () => {
      if (!el._x_undoIf) return;
      el._x_undoIf();
      delete el._x_undoIf;
    };
    effect3(() =>
      evaluate2((value) => {
        value ? show() : hide();
      }),
    );
    cleanup2(() => el._x_undoIf && el._x_undoIf());
  });
  // packages/alpinejs/src/directives/x-id.js
  directive("id", (el, { expression }, { evaluate: evaluate2 }) => {
    let names = evaluate2(expression);
    names.forEach((name) => setIdRoot(el, name));
  });
  interceptClone((from, to) => {
    if (from._x_ids) {
      to._x_ids = from._x_ids;
    }
  });
  // packages/alpinejs/src/directives/x-on.js
  mapAttributes(startingWith("@", into(prefix("on:"))));
  directive(
    "on",
    skipDuringClone((el, { value, modifiers, expression }, { cleanup: cleanup2 }) => {
      let evaluate2 = expression ? evaluateLater(el, expression) : () => {};
      if (el.tagName.toLowerCase() === "template") {
        if (!el._x_forwardEvents) el._x_forwardEvents = [];
        if (!el._x_forwardEvents.includes(value)) el._x_forwardEvents.push(value);
      }
      let removeListener = on(el, value, modifiers, (e) => {
        evaluate2(() => {}, {
          scope: {
            $event: e,
          },
          params: [e],
        });
      });
      cleanup2(() => removeListener());
    }),
  );
  // packages/alpinejs/src/directives/index.js
  warnMissingPluginDirective("Collapse", "collapse", "collapse");
  warnMissingPluginDirective("Intersect", "intersect", "intersect");
  warnMissingPluginDirective("Focus", "trap", "focus");
  warnMissingPluginDirective("Mask", "mask", "mask");
  function warnMissingPluginDirective(name, directiveName, slug) {
    directive(directiveName, (el) =>
      warn(
        `You can't use [x-${directiveName}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`,
        el,
      ),
    );
  }
  // packages/alpinejs/src/index.js
  alpine_default.setEvaluator(normalEvaluator);
  alpine_default.setReactivityEngine({
    reactive: reactive2,
    effect: effect2,
    release: stop,
    raw: toRaw,
  });
  var src_default = alpine_default;
  // packages/alpinejs/builds/module.js
  var module_default = src_default;

  function isHtmlElement(node) {
    return node != undefined && node != null && typeof node.tagName === "string" && node.nodeType === Node.ELEMENT_NODE;
  }
  function isTemplateElement(node) {
    return isHtmlElement(node) && node.nodeName === "TEMPLATE";
  }

  function isPlainObject(x) {
    return typeof x === "object" && x !== null && !Array.isArray(x) && !(x instanceof Date);
  }
  /**
   * Copy a property on an object and deletes the old property, all while preserving the property descriptor (e.g. getters/setters)
   * @param obj - The object to copy the property from
   * @param newObj - The object to copy the property to
   * @param oldName - The name of the property to copy
   * @param optionalNewName - The new name of the property (optional, defaults to oldName)
   */ function copyProperty(obj, newObj, oldName, optionalNewName) {
    const newName = oldName;
    const descriptor = Object.getOwnPropertyDescriptor(obj, oldName);
    if (!descriptor) throw new Error(`Property ${String(oldName)} not found on object`);
    Object.defineProperty(newObj, newName, descriptor);
  }

  /**
   * Returns the modulo of n and m handling negative numbers correctly
   *
   * e.g.
   * mod(1, 5) = 1
   * mod(7, 5) = 2
   * mod(-1, 5) = 4
   * @param n
   * @param m
   * @returns
   */ function mod(n, m) {
    return ((n % m) + m) % m;
  }
  /**
   * Return whether a string is numeric
   * @param value
   * @returns
   */ function isNumeric(value) {
    if (typeof value == "number") return true;
    return !isNaN(value) && !isNaN(parseFloat(value)); // ...and ensure strings of whitespace fail
  }

  /**
   * Returns the containing section element of the current element, or the current element if it is a section
   */ function closestSectionEl($el) {
    if (!isHtmlElement($el)) {
      throw new Error(`Expected HTMLElement but got ${$el}`);
    }
    if ($el.classList.contains("shopify-section")) {
      return $el;
    }
    return $el.closest(".shopify-section");
  }

  const DEFAULT_LIST_STATE_NAME = "listState";
  function listState(Alpine) {
    Alpine.directive("list-state", ($el, { value, expression, modifiers }, { evaluate }) => {
      if (value == "item") {
        const $data = Alpine.$data($el);
        let scope = `$${DEFAULT_LIST_STATE_NAME}`;
        if (modifiers.includes("for") && modifiers.length >= 2) {
          const forIndex = modifiers.indexOf("for");
          scope = `$${modifiers[forIndex + 1]}`;
        }
        if (!(scope in $data)) {
          throw new Error(
            `x-list-state:item must be used within x-list-state directive. To register an item in a scoped list state, use $myScopeName.register($el)`,
          );
        }
        Alpine.bind($el, {
          "x-init"() {
            $data[scope].register(this.$el);
          },
          "x-destroy"() {
            $data[scope].unregister(this.$el);
          },
        });
      } else if (value == null) {
        let options = {};
        let scope = `$${DEFAULT_LIST_STATE_NAME}`;
        if (modifiers.includes("as") && modifiers.length >= 2) {
          const asIndex = modifiers.indexOf("as");
          scope = `$${modifiers[asIndex + 1]}`;
        }
        if (expression) {
          let evalutatedExpression = evaluate(expression === "" ? "{}" : expression);
          if (isPlainObject(evalutatedExpression)) {
            options = evalutatedExpression;
            if (options.scope) {
              scope = `$${options.scope}`;
            }
          }
        }
        let state;
        if (options.multiple || modifiers.includes("multiple")) {
          options = options;
          if (options === null || options === void 0 ? void 0 : options.selectedIndices) {
            if (!(options.selectedIndices instanceof Set)) {
              throw new Error("selectedIndices must be a Set");
            }
          }
          state = buildMultiSelectListState(options);
        } else {
          options = options;
          state = buildSingleSelectListState(options);
        }
        Alpine.addScopeToNode($el, {
          [scope]: Alpine.reactive(state),
        });
      } else {
        throw new Error(`Unknown directive: x-list-state:${value}`);
      }
    }).before("bind");
  }
  function buildSingleSelectListState(options) {
    let state = {
      selectedIndex: null,
      items: new Set(),
      isSelected(index) {
        return this.selectedIndex == index;
      },
      register(el) {
        this.items.add(el);
      },
      unregister(el) {
        this.items.delete(el);
      },
      indexOf(el) {
        return Array.from(this.items).indexOf(el);
      },
      toggle(index) {
        this.selectedIndex == index ? this.deselect(index) : this.select(index);
      },
      select(index) {
        this.selectedIndex = index;
      },
      deselect(index) {
        if (this.selectedIndex == index) {
          this.selectedIndex = null;
        }
      },
    };
    if ("selectedIndex" in options) {
      copyProperty(options, state, "selectedIndex");
    }
    return state;
  }
  function buildMultiSelectListState(options) {
    let state = {
      selectedIndices: new Set(),
      items: new Set(),
      isSelected(index) {
        return this.selectedIndices.has(index);
      },
      register(el) {
        this.items.add(el);
      },
      unregister(el) {
        this.items.delete(el);
      },
      indexOf(el) {
        return Array.from(this.items).indexOf(el);
      },
      toggle(index) {
        this.selectedIndices.has(index) ? this.deselect(index) : this.select(index);
      },
      select(index) {
        const selected = this.selectedIndices;
        selected.add(index);
        // Copy to a new set so that reactivity works
        this.selectedIndices = new Set(Array.from(selected));
      },
      deselect(index) {
        const selected = this.selectedIndices;
        selected.delete(index);
        // Copy to a new set so that reactivity works
        this.selectedIndices = new Set(Array.from(selected));
      },
    };
    if ("selectedIndices" in options) {
      copyProperty(options, state, "selectedIndices");
    }
    return state;
  }

  (undefined && undefined.__rest) ||
    function (s, e) {
      var t = {};
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
          if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
        }
      return t;
    };

  const DEFAULT_MAX_REPEAT_TIME_IN_MS = 1500;
  /**
   * Allow repeatedly triggering an action while the mouse is held down or while element is being touched
   *
   * e.g.
   *
   * <button x-hold.250ms="console.log('clicked')">Hold me down</button>
   */ function hold(Alpine) {
    Alpine.directive("hold", ($el, { modifiers, expression }, { evaluate }) => {
      if (!isHtmlElement($el)) {
        throw new Error(`Expected HTMLElement but got ${$el}`);
      }
      let firstModifier = modifiers[0] || "";
      let time = isNumeric(firstModifier.split("ms")[0]) ? Number(firstModifier.split("ms")[0]) : 25;
      let maxModifierIndex = modifiers.indexOf("max");
      let maxValueModifier = modifiers[maxModifierIndex + 1];
      let maxTime = isNumeric(
        maxValueModifier === null || maxValueModifier === void 0 ? void 0 : maxValueModifier.split("ms")[0],
      )
        ? Number(maxValueModifier.split("ms")[0])
        : DEFAULT_MAX_REPEAT_TIME_IN_MS;
      Alpine.bind($el, {
        ["x-data"]() {
          return {
            __intervalId: undefined,
            __onPointerDown(e) {
              var _a;
              if (isHtmlElement(e.target)) {
                if ((_a = e.target) === null || _a === void 0 ? void 0 : _a.hasPointerCapture(e.pointerId)) {
                  e.target.releasePointerCapture(e.pointerId);
                }
              }
              let repeats = 0;
              this.__intervalId = window.setInterval(() => {
                evaluate(expression);
                repeats += 1;
                if (repeats * time >= maxTime) {
                  // Automatically stop the intervals after a certain amount of time
                  // in case somehow the pointerup event is not triggered or there is some
                  // other bug that causes the interval to not be cleared
                  window.clearInterval(this.__intervalId);
                }
              }, time);
            },
            __onPointerUp(_e) {
              window.clearInterval(this.__intervalId);
            },
            __onPointerLeave(_e) {
              window.clearInterval(this.__intervalId);
            },
            destroy() {
              window.clearInterval(this.__intervalId);
            },
          };
        },
        "@pointerdown": "__onPointerDown",
        "@pointerup.window": "__onPointerUp",
        "@pointerleave": "__onPointerLeave",
      });
    }).before("bind");
  }

  const stepsOrder$1 = ["read", "resolveKeyframes", "update", "preRender", "render", "postRender"];

  const statsBuffer = {
    value: null,
    addProjectionMetrics: null,
  };

  function createRenderStep$1(runNextFrame, stepName) {
    /**
     * We create and reuse two queues, one to queue jobs for the current frame
     * and one for the next. We reuse to avoid triggering GC after x frames.
     */ let thisFrame = new Set();
    let nextFrame = new Set();
    /**
     * Track whether we're currently processing jobs in this step. This way
     * we can decide whether to schedule new jobs for this frame or next.
     */ let isProcessing = false;
    let flushNextFrame = false;
    /**
     * A set of processes which were marked keepAlive when scheduled.
     */ const toKeepAlive = new WeakSet();
    let latestFrameData = {
      delta: 0.0,
      timestamp: 0.0,
      isProcessing: false,
    };
    let numCalls = 0;
    function triggerCallback(callback) {
      if (toKeepAlive.has(callback)) {
        step.schedule(callback);
        runNextFrame();
      }
      numCalls++;
      callback(latestFrameData);
    }
    const step = {
      /**
       * Schedule a process to run on the next frame.
       */ schedule: (callback, keepAlive = false, immediate = false) => {
        const addToCurrentFrame = immediate && isProcessing;
        const queue = addToCurrentFrame ? thisFrame : nextFrame;
        if (keepAlive) toKeepAlive.add(callback);
        if (!queue.has(callback)) queue.add(callback);
        return callback;
      },
      /**
       * Cancel the provided callback from running on the next frame.
       */ cancel: (callback) => {
        nextFrame.delete(callback);
        toKeepAlive.delete(callback);
      },
      /**
       * Execute all schedule callbacks.
       */ process: (frameData) => {
        latestFrameData = frameData;
        /**
         * If we're already processing we've probably been triggered by a flushSync
         * inside an existing process. Instead of executing, mark flushNextFrame
         * as true and ensure we flush the following frame at the end of this one.
         */ if (isProcessing) {
          flushNextFrame = true;
          return;
        }
        isProcessing = true;
        [thisFrame, nextFrame] = [nextFrame, thisFrame];
        // Execute this frame
        thisFrame.forEach(triggerCallback);
        /**
         * If we're recording stats then
         */ if (stepName && statsBuffer.value) {
          statsBuffer.value.frameloop[stepName].push(numCalls);
        }
        numCalls = 0;
        // Clear the frame so no callbacks remain. This is to avoid
        // memory leaks should this render step not run for a while.
        thisFrame.clear();
        isProcessing = false;
        if (flushNextFrame) {
          flushNextFrame = false;
          step.process(frameData);
        }
      },
    };
    return step;
  }

  const MotionGlobalConfig$1 = {
    skipAnimations: false,
    useManualTiming: false,
  };

  const maxElapsed$2 = 40;
  function createRenderBatcher$1(scheduleNextBatch, allowKeepAlive) {
    let runNextFrame = false;
    let useDefaultElapsed = true;
    const state = {
      delta: 0.0,
      timestamp: 0.0,
      isProcessing: false,
    };
    const flagRunNextFrame = () => (runNextFrame = true);
    const steps = stepsOrder$1.reduce((acc, key) => {
      acc[key] = createRenderStep$1(flagRunNextFrame, key);
      return acc;
    }, {});
    const { read, resolveKeyframes, update, preRender, render, postRender } = steps;
    const processBatch = () => {
      const timestamp = performance.now();
      runNextFrame = false;
      {
        state.delta = useDefaultElapsed ? 1000 / 60 : Math.max(Math.min(timestamp - state.timestamp, maxElapsed$2), 1);
      }
      state.timestamp = timestamp;
      state.isProcessing = true;
      // Unrolled render loop for better per-frame performance
      read.process(state);
      resolveKeyframes.process(state);
      update.process(state);
      preRender.process(state);
      render.process(state);
      postRender.process(state);
      state.isProcessing = false;
      if (runNextFrame && allowKeepAlive) {
        useDefaultElapsed = false;
        scheduleNextBatch(processBatch);
      }
    };
    const wake = () => {
      runNextFrame = true;
      useDefaultElapsed = true;
      if (!state.isProcessing) {
        scheduleNextBatch(processBatch);
      }
    };
    const schedule = stepsOrder$1.reduce((acc, key) => {
      const step = steps[key];
      acc[key] = (process, keepAlive = false, immediate = false) => {
        if (!runNextFrame) wake();
        return step.schedule(process, keepAlive, immediate);
      };
      return acc;
    }, {});
    const cancel = (process) => {
      for (let i = 0; i < stepsOrder$1.length; i++) {
        steps[stepsOrder$1[i]].cancel(process);
      }
    };
    return {
      schedule,
      cancel,
      state,
      steps,
    };
  }

  /*#__NO_SIDE_EFFECTS__*/ const noop$1 = (any) => any;
  const {
    schedule: frame,
    cancel: cancelFrame,
    state: frameData,
    steps: frameSteps,
  } = /* @__PURE__ */ createRenderBatcher$1(
    typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : noop$1,
    true,
  );

  let now;
  function clearTime() {
    now = undefined;
  }
  /**
   * An eventloop-synchronous alternative to performance.now().
   *
   * Ensures that time measurements remain consistent within a synchronous context.
   * Usually calling performance.now() twice within the same synchronous context
   * will return different values which isn't useful for animations when we're usually
   * trying to sync animations to the same frame.
   */ const time = {
    now: () => {
      if (now === undefined) {
        time.set(
          frameData.isProcessing || MotionGlobalConfig$1.useManualTiming ? frameData.timestamp : performance.now(),
        );
      }
      return now;
    },
    set: (newTime) => {
      now = newTime;
      queueMicrotask(clearTime);
    },
  };

  const warned = new Set();
  function warnOnce(condition, message, element) {
    if (condition || warned.has(message)) return;
    console.warn(message);
    warned.add(message);
  }

  function addUniqueItem(arr, item) {
    if (arr.indexOf(item) === -1) arr.push(item);
  }
  function removeItem$1(arr, item) {
    const index = arr.indexOf(item);
    if (index > -1) arr.splice(index, 1);
  }

  let SubscriptionManager = class SubscriptionManager {
    add(handler) {
      addUniqueItem(this.subscriptions, handler);
      return () => removeItem$1(this.subscriptions, handler);
    }
    notify(a, b, c) {
      const numSubscriptions = this.subscriptions.length;
      if (!numSubscriptions) return;
      if (numSubscriptions === 1) {
        /**
         * If there's only a single handler we can just call it without invoking a loop.
         */ this.subscriptions[0](a, b, c);
      } else {
        for (let i = 0; i < numSubscriptions; i++) {
          /**
           * Check whether the handler exists before firing as it's possible
           * the subscriptions were modified during this loop running.
           */ const handler = this.subscriptions[i];
          handler && handler(a, b, c);
        }
      }
    }
    getSize() {
      return this.subscriptions.length;
    }
    clear() {
      this.subscriptions.length = 0;
    }
    constructor() {
      this.subscriptions = [];
    }
  };

  /*
      Convert velocity into velocity per second

      @param [number]: Unit per frame
      @param [number]: Frame duration in ms
    */ function velocityPerSecond(velocity, frameDuration) {
    return frameDuration ? velocity * (1000 / frameDuration) : 0;
  }

  /**
   * Maximum time between the value of two frames, beyond which we
   * assume the velocity has since been 0.
   */ const MAX_VELOCITY_DELTA = 30;
  const isFloat = (value) => {
    return !isNaN(parseFloat(value));
  };
  /**
   * `MotionValue` is used to track the state and velocity of motion values.
   *
   * @public
   */ let MotionValue = class MotionValue {
    setCurrent(current) {
      this.current = current;
      this.updatedAt = time.now();
      if (this.canTrackVelocity === null && current !== undefined) {
        this.canTrackVelocity = isFloat(this.current);
      }
    }
    setPrevFrameValue(prevFrameValue = this.current) {
      this.prevFrameValue = prevFrameValue;
      this.prevUpdatedAt = this.updatedAt;
    }
    /**
     * Adds a function that will be notified when the `MotionValue` is updated.
     *
     * It returns a function that, when called, will cancel the subscription.
     *
     * When calling `onChange` inside a React component, it should be wrapped with the
     * `useEffect` hook. As it returns an unsubscribe function, this should be returned
     * from the `useEffect` function to ensure you don't add duplicate subscribers..
     *
     * ```jsx
     * export const MyComponent = () => {
     *   const x = useMotionValue(0)
     *   const y = useMotionValue(0)
     *   const opacity = useMotionValue(1)
     *
     *   useEffect(() => {
     *     function updateOpacity() {
     *       const maxXY = Math.max(x.get(), y.get())
     *       const newOpacity = transform(maxXY, [0, 100], [1, 0])
     *       opacity.set(newOpacity)
     *     }
     *
     *     const unsubscribeX = x.on("change", updateOpacity)
     *     const unsubscribeY = y.on("change", updateOpacity)
     *
     *     return () => {
     *       unsubscribeX()
     *       unsubscribeY()
     *     }
     *   }, [])
     *
     *   return <motion.div style={{ x }} />
     * }
     * ```
     *
     * @param subscriber - A function that receives the latest value.
     * @returns A function that, when called, will cancel this subscription.
     *
     * @deprecated
     */ onChange(subscription) {
      if (process.env.NODE_ENV !== "production") {
        warnOnce(false, `value.onChange(callback) is deprecated. Switch to value.on("change", callback).`);
      }
      return this.on("change", subscription);
    }
    on(eventName, callback) {
      if (!this.events[eventName]) {
        this.events[eventName] = new SubscriptionManager();
      }
      const unsubscribe = this.events[eventName].add(callback);
      if (eventName === "change") {
        return () => {
          unsubscribe();
          /**
           * If we have no more change listeners by the start
           * of the next frame, stop active animations.
           */ frame.read(() => {
            if (!this.events.change.getSize()) {
              this.stop();
            }
          });
        };
      }
      return unsubscribe;
    }
    clearListeners() {
      for (const eventManagers in this.events) {
        this.events[eventManagers].clear();
      }
    }
    /**
     * Attaches a passive effect to the `MotionValue`.
     */ attach(passiveEffect, stopPassiveEffect) {
      this.passiveEffect = passiveEffect;
      this.stopPassiveEffect = stopPassiveEffect;
    }
    /**
     * Sets the state of the `MotionValue`.
     *
     * @remarks
     *
     * ```jsx
     * const x = useMotionValue(0)
     * x.set(10)
     * ```
     *
     * @param latest - Latest value to set.
     * @param render - Whether to notify render subscribers. Defaults to `true`
     *
     * @public
     */ set(v, render = true) {
      if (!render || !this.passiveEffect) {
        this.updateAndNotify(v, render);
      } else {
        this.passiveEffect(v, this.updateAndNotify);
      }
    }
    setWithVelocity(prev, current, delta) {
      this.set(current);
      this.prev = undefined;
      this.prevFrameValue = prev;
      this.prevUpdatedAt = this.updatedAt - delta;
    }
    /**
     * Set the state of the `MotionValue`, stopping any active animations,
     * effects, and resets velocity to `0`.
     */ jump(v, endAnimation = true) {
      this.updateAndNotify(v);
      this.prev = v;
      this.prevUpdatedAt = this.prevFrameValue = undefined;
      endAnimation && this.stop();
      if (this.stopPassiveEffect) this.stopPassiveEffect();
    }
    /**
     * Returns the latest state of `MotionValue`
     *
     * @returns - The latest state of `MotionValue`
     *
     * @public
     */ get() {
      return this.current;
    }
    /**
     * @public
     */ getPrevious() {
      return this.prev;
    }
    /**
     * Returns the latest velocity of `MotionValue`
     *
     * @returns - The latest velocity of `MotionValue`. Returns `0` if the state is non-numerical.
     *
     * @public
     */ getVelocity() {
      const currentTime = time.now();
      if (
        !this.canTrackVelocity ||
        this.prevFrameValue === undefined ||
        currentTime - this.updatedAt > MAX_VELOCITY_DELTA
      ) {
        return 0;
      }
      const delta = Math.min(this.updatedAt - this.prevUpdatedAt, MAX_VELOCITY_DELTA);
      // Casts because of parseFloat's poor typing
      return velocityPerSecond(parseFloat(this.current) - parseFloat(this.prevFrameValue), delta);
    }
    /**
     * Registers a new animation to control this `MotionValue`. Only one
     * animation can drive a `MotionValue` at one time.
     *
     * ```jsx
     * value.start()
     * ```
     *
     * @param animation - A function that starts the provided animation
     */ start(startAnimation) {
      this.stop();
      return new Promise((resolve) => {
        this.hasAnimated = true;
        this.animation = startAnimation(resolve);
        if (this.events.animationStart) {
          this.events.animationStart.notify();
        }
      }).then(() => {
        if (this.events.animationComplete) {
          this.events.animationComplete.notify();
        }
        this.clearAnimation();
      });
    }
    /**
     * Stop the currently active animation.
     *
     * @public
     */ stop() {
      if (this.animation) {
        this.animation.stop();
        if (this.events.animationCancel) {
          this.events.animationCancel.notify();
        }
      }
      this.clearAnimation();
    }
    /**
     * Returns `true` if this value is currently animating.
     *
     * @public
     */ isAnimating() {
      return !!this.animation;
    }
    clearAnimation() {
      delete this.animation;
    }
    /**
     * Destroy and clean up subscribers to this `MotionValue`.
     *
     * The `MotionValue` hooks like `useMotionValue` and `useTransform` automatically
     * handle the lifecycle of the returned `MotionValue`, so this method is only necessary if you've manually
     * created a `MotionValue` via the `motionValue` function.
     *
     * @public
     */ destroy() {
      this.clearListeners();
      this.stop();
      if (this.stopPassiveEffect) {
        this.stopPassiveEffect();
      }
    }
    /**
     * @param init - The initiating value
     * @param config - Optional configuration options
     *
     * -  `transformer`: A function to transform incoming values with.
     */ constructor(init, options = {}) {
      /**
       * This will be replaced by the build step with the latest version number.
       * When MotionValues are provided to motion components, warn if versions are mixed.
       */ this.version = "12.7.4";
      /**
       * Tracks whether this value can output a velocity. Currently this is only true
       * if the value is numerical, but we might be able to widen the scope here and support
       * other value types.
       *
       * @internal
       */ this.canTrackVelocity = null;
      /**
       * An object containing a SubscriptionManager for each active event.
       */ this.events = {};
      this.updateAndNotify = (v, render = true) => {
        const currentTime = time.now();
        /**
         * If we're updating the value during another frame or eventloop
         * than the previous frame, then the we set the previous frame value
         * to current.
         */ if (this.updatedAt !== currentTime) {
          this.setPrevFrameValue();
        }
        this.prev = this.current;
        this.setCurrent(v);
        // Update update subscribers
        if (this.current !== this.prev && this.events.change) {
          this.events.change.notify(this.current);
        }
        // Update render subscribers
        if (render && this.events.renderRequest) {
          this.events.renderRequest.notify(this.current);
        }
      };
      this.hasAnimated = false;
      this.setCurrent(init);
      this.owner = options.owner;
    }
  };
  function motionValue(init, options) {
    return new MotionValue(init, options);
  }

  function resolveElements(elementOrSelector, scope, selectorCache) {
    if (elementOrSelector instanceof EventTarget) {
      return [elementOrSelector];
    } else if (typeof elementOrSelector === "string") {
      let root = document;
      var ref;
      const elements =
        (ref = selectorCache === null || selectorCache === void 0 ? void 0 : selectorCache[elementOrSelector]) !==
          null && ref !== void 0
          ? ref
          : root.querySelectorAll(elementOrSelector);
      return elements ? Array.from(elements) : [];
    }
    return Array.from(elementOrSelector);
  }

  let warning = () => {};
  let invariant$1 = () => {};
  if (process.env.NODE_ENV !== "production") {
    warning = (check, message) => {
      if (!check && typeof console !== "undefined") {
        console.warn(message);
      }
    };
    invariant$1 = (check, message) => {
      if (!check) {
        throw new Error(message);
      }
    };
  }

  /*
      Progress within given range

      Given a lower limit and an upper limit, we return the progress
      (expressed as a number 0-1) represented by the given value, and
      limit that progress to within 0-1.

      @param [number]: Lower limit
      @param [number]: Upper limit
      @param [number]: Value to find progress within given range
      @return [number]: Progress of value within range as expressed 0-1
    */ /*#__NO_SIDE_EFFECTS__*/ const progress = (from, to, value) => {
    const toFromDifference = to - from;
    return toFromDifference === 0 ? 1 : (value - from) / toFromDifference;
  };

  const clamp = (min, max, v) => {
    if (v > max) return max;
    if (v < min) return min;
    return v;
  };

  const velocitySampleDuration = 5; // ms
  function calcGeneratorVelocity(resolveValue, t, current) {
    const prevT = Math.max(t - velocitySampleDuration, 0);
    return velocityPerSecond(current - resolveValue(prevT), t - prevT);
  }

  const springDefaults = {
    // Default spring physics
    stiffness: 100,
    damping: 10,
    mass: 1.0,
    velocity: 0.0,
    // Default duration/bounce-based options
    duration: 800,
    bounce: 0.3,
    visualDuration: 0.3,
    // Rest thresholds
    restSpeed: {
      granular: 0.01,
      default: 2,
    },
    restDelta: {
      granular: 0.005,
      default: 0.5,
    },
    // Limits
    minDuration: 0.01,
    maxDuration: 10.0,
    minDamping: 0.05,
    maxDamping: 1,
  };

  /**
   * Converts seconds to milliseconds
   *
   * @param seconds - Time in seconds.
   * @return milliseconds - Converted time in milliseconds.
   */ /*#__NO_SIDE_EFFECTS__*/ const secondsToMilliseconds$1 = (seconds) => seconds * 1000;
  /*#__NO_SIDE_EFFECTS__*/ const millisecondsToSeconds$1 = (milliseconds) => milliseconds / 1000;
  const safeMin = 0.001;
  function findSpring({
    duration = springDefaults.duration,
    bounce = springDefaults.bounce,
    velocity = springDefaults.velocity,
    mass = springDefaults.mass,
  }) {
    let envelope;
    let derivative;
    warning(
      duration <= secondsToMilliseconds$1(springDefaults.maxDuration),
      "Spring duration must be 10 seconds or less",
    );
    let dampingRatio = 1 - bounce;
    /**
     * Restrict dampingRatio and duration to within acceptable ranges.
     */ dampingRatio = clamp(springDefaults.minDamping, springDefaults.maxDamping, dampingRatio);
    duration = clamp(springDefaults.minDuration, springDefaults.maxDuration, millisecondsToSeconds$1(duration));
    if (dampingRatio < 1) {
      /**
       * Underdamped spring
       */ envelope = (undampedFreq) => {
        const exponentialDecay = undampedFreq * dampingRatio;
        const delta = exponentialDecay * duration;
        const a = exponentialDecay - velocity;
        const b = calcAngularFreq(undampedFreq, dampingRatio);
        const c = Math.exp(-delta);
        return safeMin - (a / b) * c;
      };
      derivative = (undampedFreq) => {
        const exponentialDecay = undampedFreq * dampingRatio;
        const delta = exponentialDecay * duration;
        const d = delta * velocity + velocity;
        const e = Math.pow(dampingRatio, 2) * Math.pow(undampedFreq, 2) * duration;
        const f = Math.exp(-delta);
        const g = calcAngularFreq(Math.pow(undampedFreq, 2), dampingRatio);
        const factor = -envelope(undampedFreq) + safeMin > 0 ? -1 : 1;
        return (factor * ((d - e) * f)) / g;
      };
    } else {
      /**
       * Critically-damped spring
       */ envelope = (undampedFreq) => {
        const a = Math.exp(-undampedFreq * duration);
        const b = (undampedFreq - velocity) * duration + 1;
        return -safeMin + a * b;
      };
      derivative = (undampedFreq) => {
        const a = Math.exp(-undampedFreq * duration);
        const b = (velocity - undampedFreq) * (duration * duration);
        return a * b;
      };
    }
    const initialGuess = 5 / duration;
    const undampedFreq1 = approximateRoot(envelope, derivative, initialGuess);
    duration = secondsToMilliseconds$1(duration);
    if (isNaN(undampedFreq1)) {
      return {
        stiffness: springDefaults.stiffness,
        damping: springDefaults.damping,
        duration,
      };
    } else {
      const stiffness = Math.pow(undampedFreq1, 2) * mass;
      return {
        stiffness,
        damping: dampingRatio * 2 * Math.sqrt(mass * stiffness),
        duration,
      };
    }
  }
  const rootIterations = 12;
  function approximateRoot(envelope, derivative, initialGuess) {
    let result = initialGuess;
    for (let i = 1; i < rootIterations; i++) {
      result = result - envelope(result) / derivative(result);
    }
    return result;
  }
  function calcAngularFreq(undampedFreq, dampingRatio) {
    return undampedFreq * Math.sqrt(1 - dampingRatio * dampingRatio);
  }

  /**
   * Implement a practical max duration for keyframe generation
   * to prevent infinite loops
   */ const maxGeneratorDuration = 20000;
  function calcGeneratorDuration(generator) {
    let duration = 0;
    const timeStep = 50;
    let state = generator.next(duration);
    while (!state.done && duration < maxGeneratorDuration) {
      duration += timeStep;
      state = generator.next(duration);
    }
    return duration >= maxGeneratorDuration ? Infinity : duration;
  }

  /**
   * Create a progress => progress easing function from a generator.
   */ function createGeneratorEasing(options, scale = 100, createGenerator) {
    const generator = createGenerator({
      ...options,
      keyframes: [0, scale],
    });
    const duration = Math.min(calcGeneratorDuration(generator), maxGeneratorDuration);
    return {
      type: "keyframes",
      ease: (progress) => {
        return generator.next(duration * progress).value / scale;
      },
      duration: millisecondsToSeconds$1(duration),
    };
  }

  /**
   * Add the ability for test suites to manually set support flags
   * to better test more environments.
   */ const supportsFlags$1 = {};

  /*#__NO_SIDE_EFFECTS__*/ function memo$1(callback) {
    let result;
    return () => {
      if (result === undefined) result = callback();
      return result;
    };
  }

  function memoSupports$1(callback, supportsFlag) {
    const memoized = memo$1(callback);
    var _supportsFlag;
    return () =>
      (_supportsFlag = supportsFlags$1[supportsFlag]) !== null && _supportsFlag !== void 0 ? _supportsFlag : memoized();
  }

  const supportsLinearEasing$1 = /*@__PURE__*/ memoSupports$1(() => {
    try {
      document.createElement("div").animate(
        {
          opacity: 0,
        },
        {
          easing: "linear(0, 1)",
        },
      );
    } catch (e) {
      return false;
    }
    return true;
  }, "linearEasing");

  const generateLinearEasing$1 = (
    easing,
    duration,
    resolution = 10, // as milliseconds
  ) => {
    let points = "";
    const numPoints = Math.max(Math.round(duration / resolution), 2);
    for (let i = 0; i < numPoints; i++) {
      points += easing(i / (numPoints - 1)) + ", ";
    }
    return `linear(${points.substring(0, points.length - 2)})`;
  };

  const durationKeys = ["duration", "bounce"];
  const physicsKeys = ["stiffness", "damping", "mass"];
  function isSpringType(options, keys) {
    return keys.some((key) => options[key] !== undefined);
  }
  function getSpringOptions(options) {
    let springOptions = {
      velocity: springDefaults.velocity,
      stiffness: springDefaults.stiffness,
      damping: springDefaults.damping,
      mass: springDefaults.mass,
      isResolvedFromDuration: false,
      ...options,
    };
    // stiffness/damping/mass overrides duration/bounce
    if (!isSpringType(options, physicsKeys) && isSpringType(options, durationKeys)) {
      if (options.visualDuration) {
        const visualDuration = options.visualDuration;
        const root = (2 * Math.PI) / (visualDuration * 1.2);
        const stiffness = root * root;
        const damping = 2 * clamp(0.05, 1, 1 - (options.bounce || 0)) * Math.sqrt(stiffness);
        springOptions = {
          ...springOptions,
          mass: springDefaults.mass,
          stiffness,
          damping,
        };
      } else {
        const derived = findSpring(options);
        springOptions = {
          ...springOptions,
          ...derived,
          mass: springDefaults.mass,
        };
        springOptions.isResolvedFromDuration = true;
      }
    }
    return springOptions;
  }
  function spring(optionsOrVisualDuration = springDefaults.visualDuration, bounce = springDefaults.bounce) {
    const options =
      typeof optionsOrVisualDuration !== "object"
        ? {
            visualDuration: optionsOrVisualDuration,
            keyframes: [0, 1],
            bounce,
          }
        : optionsOrVisualDuration;
    let { restSpeed, restDelta } = options;
    const origin = options.keyframes[0];
    const target = options.keyframes[options.keyframes.length - 1];
    /**
     * This is the Iterator-spec return value. We ensure it's mutable rather than using a generator
     * to reduce GC during animation.
     */ const state = {
      done: false,
      value: origin,
    };
    const { stiffness, damping, mass, duration, velocity, isResolvedFromDuration } = getSpringOptions({
      ...options,
      velocity: -millisecondsToSeconds$1(options.velocity || 0),
    });
    const initialVelocity = velocity || 0.0;
    const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
    const initialDelta = target - origin;
    const undampedAngularFreq = millisecondsToSeconds$1(Math.sqrt(stiffness / mass));
    /**
     * If we're working on a granular scale, use smaller defaults for determining
     * when the spring is finished.
     *
     * These defaults have been selected emprically based on what strikes a good
     * ratio between feeling good and finishing as soon as changes are imperceptible.
     */ const isGranularScale = Math.abs(initialDelta) < 5;
    restSpeed || (restSpeed = isGranularScale ? springDefaults.restSpeed.granular : springDefaults.restSpeed.default);
    restDelta || (restDelta = isGranularScale ? springDefaults.restDelta.granular : springDefaults.restDelta.default);
    let resolveSpring;
    if (dampingRatio < 1) {
      const angularFreq = calcAngularFreq(undampedAngularFreq, dampingRatio);
      // Underdamped spring
      resolveSpring = (t) => {
        const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
        return (
          target -
          envelope *
            (((initialVelocity + dampingRatio * undampedAngularFreq * initialDelta) / angularFreq) *
              Math.sin(angularFreq * t) +
              initialDelta * Math.cos(angularFreq * t))
        );
      };
    } else if (dampingRatio === 1) {
      // Critically damped spring
      resolveSpring = (t) =>
        target -
        Math.exp(-undampedAngularFreq * t) *
          (initialDelta + (initialVelocity + undampedAngularFreq * initialDelta) * t);
    } else {
      // Overdamped spring
      const dampedAngularFreq = undampedAngularFreq * Math.sqrt(dampingRatio * dampingRatio - 1);
      resolveSpring = (t) => {
        const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
        // When performing sinh or cosh values can hit Infinity so we cap them here
        const freqForT = Math.min(dampedAngularFreq * t, 300);
        return (
          target -
          (envelope *
            ((initialVelocity + dampingRatio * undampedAngularFreq * initialDelta) * Math.sinh(freqForT) +
              dampedAngularFreq * initialDelta * Math.cosh(freqForT))) /
            dampedAngularFreq
        );
      };
    }
    const generator = {
      calculatedDuration: isResolvedFromDuration ? duration || null : null,
      next: (t) => {
        const current = resolveSpring(t);
        if (!isResolvedFromDuration) {
          let currentVelocity = 0.0;
          /**
           * We only need to calculate velocity for under-damped springs
           * as over- and critically-damped springs can't overshoot, so
           * checking only for displacement is enough.
           */ if (dampingRatio < 1) {
            currentVelocity =
              t === 0 ? secondsToMilliseconds$1(initialVelocity) : calcGeneratorVelocity(resolveSpring, t, current);
          }
          const isBelowVelocityThreshold = Math.abs(currentVelocity) <= restSpeed;
          const isBelowDisplacementThreshold = Math.abs(target - current) <= restDelta;
          state.done = isBelowVelocityThreshold && isBelowDisplacementThreshold;
        } else {
          state.done = t >= duration;
        }
        state.value = state.done ? target : current;
        return state;
      },
      toString: () => {
        const calculatedDuration = Math.min(calcGeneratorDuration(generator), maxGeneratorDuration);
        const easing = generateLinearEasing$1(
          (progress) => generator.next(calculatedDuration * progress).value,
          calculatedDuration,
          30,
        );
        return calculatedDuration + "ms " + easing;
      },
      toTransition: () => {},
    };
    return generator;
  }
  spring.applyToOptions = (options) => {
    const generatorOptions = createGeneratorEasing(options, 100, spring);
    options.ease = supportsLinearEasing$1() ? generatorOptions.ease : "easeOut";
    options.duration = secondsToMilliseconds$1(generatorOptions.duration);
    options.type = "keyframes";
    return options;
  };

  const wrap = (min, max, v) => {
    const rangeSize = max - min;
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
  };

  const isEasingArray = (ease) => {
    return Array.isArray(ease) && typeof ease[0] !== "number";
  };

  function getEasingForSegment(easing, i) {
    return isEasingArray(easing) ? easing[wrap(0, easing.length, i)] : easing;
  }

  /*
      Value in range from progress

      Given a lower limit and an upper limit, we return the value within
      that range as expressed by progress (usually a number from 0 to 1)

      So progress = 0.5 would change

      from -------- to

      to

      from ---- to

      E.g. from = 10, to = 20, progress = 0.5 => 15

      @param [number]: Lower limit of range
      @param [number]: Upper limit of range
      @param [number]: The progress between lower and upper limits expressed 0-1
      @return [number]: Value as calculated from progress within range (not limited within range)
    */ const mixNumber$1 = (from, to, progress) => {
    return from + (to - from) * progress;
  };

  function fillOffset(offset, remaining) {
    const min = offset[offset.length - 1];
    for (let i = 1; i <= remaining; i++) {
      const offsetProgress = progress(0, remaining, i);
      offset.push(mixNumber$1(min, 1, offsetProgress));
    }
  }

  function defaultOffset$1(arr) {
    const offset = [0];
    fillOffset(offset, arr.length - 1);
    return offset;
  }

  const isMotionValue = (value) => Boolean(value && value.getVelocity);
  function isDOMKeyframes(keyframes) {
    return typeof keyframes === "object" && !Array.isArray(keyframes);
  }

  function resolveSubjects(subject, keyframes, scope, selectorCache) {
    if (typeof subject === "string" && isDOMKeyframes(keyframes)) {
      return resolveElements(subject, scope, selectorCache);
    } else if (subject instanceof NodeList) {
      return Array.from(subject);
    } else if (Array.isArray(subject)) {
      return subject;
    } else {
      return [subject];
    }
  }

  function calculateRepeatDuration(duration, repeat, _repeatDelay) {
    return duration * (repeat + 1);
  }

  /**
   * Given a absolute or relative time definition and current/prev time state of the sequence,
   * calculate an absolute time for the next keyframes.
   */ function calcNextTime(current, next, prev, labels) {
    if (typeof next === "number") {
      return next;
    } else if (next.startsWith("-") || next.startsWith("+")) {
      return Math.max(0, current + parseFloat(next));
    } else if (next === "<") {
      return prev;
    } else {
      var ref;
      return (ref = labels.get(next)) !== null && ref !== void 0 ? ref : current;
    }
  }

  function eraseKeyframes(sequence, startTime, endTime) {
    for (let i = 0; i < sequence.length; i++) {
      const keyframe = sequence[i];
      if (keyframe.at > startTime && keyframe.at < endTime) {
        removeItem$1(sequence, keyframe);
        // If we remove this item we have to push the pointer back one
        i--;
      }
    }
  }
  function addKeyframes(sequence, keyframes, easing, offset, startTime, endTime) {
    /**
     * Erase every existing value between currentTime and targetTime,
     * this will essentially splice this timeline into any currently
     * defined ones.
     */ eraseKeyframes(sequence, startTime, endTime);
    for (let i = 0; i < keyframes.length; i++) {
      sequence.push({
        value: keyframes[i],
        at: mixNumber$1(startTime, endTime, offset[i]),
        easing: getEasingForSegment(easing, i),
      });
    }
  }

  /**
   * Take an array of times that represent repeated keyframes. For instance
   * if we have original times of [0, 0.5, 1] then our repeated times will
   * be [0, 0.5, 1, 1, 1.5, 2]. Loop over the times and scale them back
   * down to a 0-1 scale.
   */ function normalizeTimes(times, repeat) {
    for (let i = 0; i < times.length; i++) {
      times[i] = times[i] / (repeat + 1);
    }
  }

  function compareByTime(a, b) {
    if (a.at === b.at) {
      if (a.value === null) return 1;
      if (b.value === null) return -1;
      return 0;
    } else {
      return a.at - b.at;
    }
  }

  function isGenerator$1(type) {
    return typeof type === "function" && "applyToOptions" in type;
  }

  const defaultSegmentEasing = "easeInOut";
  const MAX_REPEAT = 20;
  function createAnimationsFromSequence(
    sequence,
    { defaultTransition = {}, ...sequenceTransition } = {},
    scope,
    generators,
  ) {
    const defaultDuration = defaultTransition.duration || 0.3;
    const animationDefinitions = new Map();
    const sequences = new Map();
    const elementCache = {};
    const timeLabels = new Map();
    let prevTime = 0;
    let currentTime = 0;
    let totalDuration = 0;
    /**
     * Build the timeline by mapping over the sequence array and converting
     * the definitions into keyframes and offsets with absolute time values.
     * These will later get converted into relative offsets in a second pass.
     */ for (let i1 = 0; i1 < sequence.length; i1++) {
      const segment = sequence[i1];
      /**
       * If this is a timeline label, mark it and skip the rest of this iteration.
       */ if (typeof segment === "string") {
        timeLabels.set(segment, currentTime);
        continue;
      } else if (!Array.isArray(segment)) {
        timeLabels.set(segment.name, calcNextTime(currentTime, segment.at, prevTime, timeLabels));
        continue;
      }
      let [subject, keyframes, transition = {}] = segment;
      /**
       * If a relative or absolute time value has been specified we need to resolve
       * it in relation to the currentTime.
       */ if (transition.at !== undefined) {
        currentTime = calcNextTime(currentTime, transition.at, prevTime, timeLabels);
      }
      /**
       * Keep track of the maximum duration in this definition. This will be
       * applied to currentTime once the definition has been parsed.
       */ let maxDuration = 0;
      const resolveValueSequence = (
        valueKeyframes,
        valueTransition,
        valueSequence,
        elementIndex = 0,
        numSubjects = 0,
      ) => {
        const valueKeyframesAsList = keyframesAsList(valueKeyframes);
        const {
          delay = 0,
          times = defaultOffset$1(valueKeyframesAsList),
          type = "keyframes",
          repeat,
          repeatType,
          repeatDelay = 0,
          ...remainingTransition
        } = valueTransition;
        let { ease = defaultTransition.ease || "easeOut", duration } = valueTransition;
        /**
         * Resolve stagger() if defined.
         */ const calculatedDelay = typeof delay === "function" ? delay(elementIndex, numSubjects) : delay;
        /**
         * If this animation should and can use a spring, generate a spring easing function.
         */ const numKeyframes = valueKeyframesAsList.length;
        const createGenerator = isGenerator$1(type)
          ? type
          : generators === null || generators === void 0
            ? void 0
            : generators[type];
        if (numKeyframes <= 2 && createGenerator) {
          /**
           * As we're creating an easing function from a spring,
           * ideally we want to generate it using the real distance
           * between the two keyframes. However this isn't always
           * possible - in these situations we use 0-100.
           */ let absoluteDelta = 100;
          if (numKeyframes === 2 && isNumberKeyframesArray(valueKeyframesAsList)) {
            const delta = valueKeyframesAsList[1] - valueKeyframesAsList[0];
            absoluteDelta = Math.abs(delta);
          }
          const springTransition = {
            ...remainingTransition,
          };
          if (duration !== undefined) {
            springTransition.duration = secondsToMilliseconds$1(duration);
          }
          const springEasing = createGeneratorEasing(springTransition, absoluteDelta, createGenerator);
          ease = springEasing.ease;
          duration = springEasing.duration;
        }
        duration !== null && duration !== void 0 ? duration : (duration = defaultDuration);
        const startTime = currentTime + calculatedDelay;
        /**
         * If there's only one time offset of 0, fill in a second with length 1
         */ if (times.length === 1 && times[0] === 0) {
          times[1] = 1;
        }
        /**
         * Fill out if offset if fewer offsets than keyframes
         */ const remainder = times.length - valueKeyframesAsList.length;
        remainder > 0 && fillOffset(times, remainder);
        /**
         * If only one value has been set, ie [1], push a null to the start of
         * the keyframe array. This will let us mark a keyframe at this point
         * that will later be hydrated with the previous value.
         */ valueKeyframesAsList.length === 1 && valueKeyframesAsList.unshift(null);
        /**
         * Handle repeat options
         */ if (repeat) {
          invariant$1(repeat < MAX_REPEAT, "Repeat count too high, must be less than 20");
          duration = calculateRepeatDuration(duration, repeat);
          const originalKeyframes = [...valueKeyframesAsList];
          const originalTimes = [...times];
          ease = Array.isArray(ease) ? [...ease] : [ease];
          const originalEase = [...ease];
          for (let repeatIndex = 0; repeatIndex < repeat; repeatIndex++) {
            valueKeyframesAsList.push(...originalKeyframes);
            for (let keyframeIndex = 0; keyframeIndex < originalKeyframes.length; keyframeIndex++) {
              times.push(originalTimes[keyframeIndex] + (repeatIndex + 1));
              ease.push(keyframeIndex === 0 ? "linear" : getEasingForSegment(originalEase, keyframeIndex - 1));
            }
          }
          normalizeTimes(times, repeat);
        }
        const targetTime = startTime + duration;
        /**
         * Add keyframes, mapping offsets to absolute time.
         */ addKeyframes(valueSequence, valueKeyframesAsList, ease, times, startTime, targetTime);
        maxDuration = Math.max(calculatedDelay + duration, maxDuration);
        totalDuration = Math.max(targetTime, totalDuration);
      };
      if (isMotionValue(subject)) {
        const subjectSequence = getSubjectSequence(subject, sequences);
        resolveValueSequence(keyframes, transition, getValueSequence("default", subjectSequence));
      } else {
        const subjects = resolveSubjects(subject, keyframes, scope, elementCache);
        const numSubjects = subjects.length;
        /**
         * For every element in this segment, process the defined values.
         */ for (let subjectIndex = 0; subjectIndex < numSubjects; subjectIndex++) {
          /**
           * Cast necessary, but we know these are of this type
           */ keyframes = keyframes;
          transition = transition;
          const thisSubject = subjects[subjectIndex];
          const subjectSequence = getSubjectSequence(thisSubject, sequences);
          for (const key in keyframes) {
            resolveValueSequence(
              keyframes[key],
              getValueTransition$2(transition, key),
              getValueSequence(key, subjectSequence),
              subjectIndex,
              numSubjects,
            );
          }
        }
      }
      prevTime = currentTime;
      currentTime += maxDuration;
    }
    /**
     * For every element and value combination create a new animation.
     */ sequences.forEach((valueSequences, element) => {
      for (const key in valueSequences) {
        const valueSequence = valueSequences[key];
        /**
         * Arrange all the keyframes in ascending time order.
         */ valueSequence.sort(compareByTime);
        const keyframes = [];
        const valueOffset = [];
        const valueEasing = [];
        /**
         * For each keyframe, translate absolute times into
         * relative offsets based on the total duration of the timeline.
         */ for (let i = 0; i < valueSequence.length; i++) {
          const { at, value, easing } = valueSequence[i];
          keyframes.push(value);
          valueOffset.push(progress(0, totalDuration, at));
          valueEasing.push(easing || "easeOut");
        }
        /**
         * If the first keyframe doesn't land on offset: 0
         * provide one by duplicating the initial keyframe. This ensures
         * it snaps to the first keyframe when the animation starts.
         */ if (valueOffset[0] !== 0) {
          valueOffset.unshift(0);
          keyframes.unshift(keyframes[0]);
          valueEasing.unshift(defaultSegmentEasing);
        }
        /**
         * If the last keyframe doesn't land on offset: 1
         * provide one with a null wildcard value. This will ensure it
         * stays static until the end of the animation.
         */ if (valueOffset[valueOffset.length - 1] !== 1) {
          valueOffset.push(1);
          keyframes.push(null);
        }
        if (!animationDefinitions.has(element)) {
          animationDefinitions.set(element, {
            keyframes: {},
            transition: {},
          });
        }
        const definition = animationDefinitions.get(element);
        definition.keyframes[key] = keyframes;
        definition.transition[key] = {
          ...defaultTransition,
          duration: totalDuration,
          ease: valueEasing,
          times: valueOffset,
          ...sequenceTransition,
        };
      }
    });
    return animationDefinitions;
  }
  function getSubjectSequence(subject, sequences) {
    !sequences.has(subject) && sequences.set(subject, {});
    return sequences.get(subject);
  }
  function getValueSequence(name, sequences) {
    if (!sequences[name]) sequences[name] = [];
    return sequences[name];
  }
  function keyframesAsList(keyframes) {
    return Array.isArray(keyframes) ? keyframes : [keyframes];
  }
  function getValueTransition$2(transition, key) {
    return transition && transition[key]
      ? {
          ...transition,
          ...transition[key],
        }
      : {
          ...transition,
        };
  }
  const isNumber = (keyframe) => typeof keyframe === "number";
  const isNumberKeyframesArray = (keyframes) => keyframes.every(isNumber);
  const visualElementStore = new WeakMap();

  /**
   * Generate a list of every possible transform key.
   */ const transformPropOrder = [
    "transformPerspective",
    "x",
    "y",
    "z",
    "translateX",
    "translateY",
    "translateZ",
    "scale",
    "scaleX",
    "scaleY",
    "rotate",
    "rotateX",
    "rotateY",
    "rotateZ",
    "skew",
    "skewX",
    "skewY",
  ];
  /**
   * A quick lookup for transform props.
   */ const transformProps = new Set(transformPropOrder);

  const positionalKeys = new Set(["width", "height", "top", "left", "right", "bottom", ...transformPropOrder]);

  const isKeyframesTarget = (v) => {
    return Array.isArray(v);
  };

  const resolveFinalValueInKeyframes = (v) => {
    // TODO maybe throw if v.length - 1 is placeholder token?
    return isKeyframesTarget(v) ? v[v.length - 1] || 0 : v;
  };

  function getValueState(visualElement) {
    const state = [{}, {}];
    visualElement === null || visualElement === void 0
      ? void 0
      : visualElement.values.forEach((value, key) => {
          state[0][key] = value.get();
          state[1][key] = value.getVelocity();
        });
    return state;
  }
  function resolveVariantFromProps(props, definition, custom, visualElement) {
    /**
     * If the variant definition is a function, resolve.
     */ if (typeof definition === "function") {
      const [current, velocity] = getValueState(visualElement);
      definition = definition(custom !== undefined ? custom : props.custom, current, velocity);
    }
    /**
     * If the variant definition is a variant label, or
     * the function returned a variant label, resolve.
     */ if (typeof definition === "string") {
      definition = props.variants && props.variants[definition];
    }
    /**
     * At this point we've resolved both functions and variant labels,
     * but the resolved variant label might itself have been a function.
     * If so, resolve. This can only have returned a valid target object.
     */ if (typeof definition === "function") {
      const [current, velocity] = getValueState(visualElement);
      definition = definition(custom !== undefined ? custom : props.custom, current, velocity);
    }
    return definition;
  }

  function resolveVariant(visualElement, definition, custom) {
    const props = visualElement.getProps();
    return resolveVariantFromProps(props, definition, props.custom, visualElement);
  }

  /**
   * Set VisualElement's MotionValue, creating a new MotionValue for it if
   * it doesn't exist.
   */ function setMotionValue(visualElement, key, value) {
    if (visualElement.hasValue(key)) {
      visualElement.getValue(key).set(value);
    } else {
      visualElement.addValue(key, motionValue(value));
    }
  }
  function setTarget(visualElement, definition) {
    const resolved = resolveVariant(visualElement, definition);
    let { transitionEnd = {}, transition = {}, ...target } = resolved || {};
    target = {
      ...target,
      ...transitionEnd,
    };
    for (const key in target) {
      const value = resolveFinalValueInKeyframes(target[key]);
      setMotionValue(visualElement, key, value);
    }
  }

  function isWillChangeMotionValue(value) {
    return Boolean(isMotionValue(value) && value.add);
  }

  function addValueToWillChange(visualElement, key) {
    const willChange = visualElement.getValue("willChange");
    /**
     * It could be that a user has set willChange to a regular MotionValue,
     * in which case we can't add the value to it.
     */ if (isWillChangeMotionValue(willChange)) {
      return willChange.add(key);
    } else if (!willChange && MotionGlobalConfig$1.WillChange) {
      const newWillChange = new MotionGlobalConfig$1.WillChange("auto");
      visualElement.addValue("willChange", newWillChange);
      newWillChange.add(key);
    }
  }

  /**
   * Convert camelCase to dash-case properties.
   */ const camelToDash = (str) => str.replace(/([a-z])([A-Z])/gu, "$1-$2").toLowerCase();
  const optimizedAppearDataId = "framerAppearId";
  const optimizedAppearDataAttribute = "data-" + camelToDash(optimizedAppearDataId);

  function getOptimisedAppearId(visualElement) {
    return visualElement.props[optimizedAppearDataAttribute];
  }

  /*
      Bezier function generator
      This has been modified from Gaëtan Renaudeau's BezierEasing
      https://github.com/gre/bezier-easing/blob/master/src/index.js
      https://github.com/gre/bezier-easing/blob/master/LICENSE
      
      I've removed the newtonRaphsonIterate algo because in benchmarking it
      wasn't noticiably faster than binarySubdivision, indeed removing it
      usually improved times, depending on the curve.
      I also removed the lookup table, as for the added bundle size and loop we're
      only cutting ~4 or so subdivision iterations. I bumped the max iterations up
      to 12 to compensate and this still tended to be faster for no perceivable
      loss in accuracy.
      Usage
        const easeOut = cubicBezier(.17,.67,.83,.67);
        const x = easeOut(0.5); // returns 0.627...
    */ // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
  const calcBezier = (t, a1, a2) => (((1.0 - 3.0 * a2 + 3.0 * a1) * t + (3.0 * a2 - 6.0 * a1)) * t + 3.0 * a1) * t;
  const subdivisionPrecision = 0.0000001;
  const subdivisionMaxIterations = 12;
  function binarySubdivide(x, lowerBound, upperBound, mX1, mX2) {
    let currentX;
    let currentT;
    let i = 0;
    do {
      currentT = lowerBound + (upperBound - lowerBound) / 2.0;
      currentX = calcBezier(currentT, mX1, mX2) - x;
      if (currentX > 0.0) {
        upperBound = currentT;
      } else {
        lowerBound = currentT;
      }
    } while (Math.abs(currentX) > subdivisionPrecision && ++i < subdivisionMaxIterations);
    return currentT;
  }
  function cubicBezier(mX1, mY1, mX2, mY2) {
    // If this is a linear gradient, return linear easing
    if (mX1 === mY1 && mX2 === mY2) return noop$1;
    const getTForX = (aX) => binarySubdivide(aX, 0, 1, mX1, mX2);
    // If animation is at start/end, return t without easing
    return (t) => (t === 0 || t === 1 ? t : calcBezier(getTForX(t), mY1, mY2));
  }

  // Accepts an easing function and returns a new one that outputs mirrored values for
  // the second half of the animation. Turns easeIn into easeInOut.
  const mirrorEasing = (easing) => (p) => (p <= 0.5 ? easing(2 * p) / 2 : (2 - easing(2 * (1 - p))) / 2);
  // Accepts an easing function and returns a new one that outputs reversed values.
  // Turns easeIn into easeOut.
  const reverseEasing = (easing) => (p) => 1 - easing(1 - p);
  const backOut = /*@__PURE__*/ cubicBezier(0.33, 1.53, 0.69, 0.99);
  const backIn = /*@__PURE__*/ reverseEasing(backOut);
  const backInOut = /*@__PURE__*/ mirrorEasing(backIn);

  const anticipate = (p) => ((p *= 2) < 1 ? 0.5 * backIn(p) : 0.5 * (2 - Math.pow(2, -10 * (p - 1))));
  const circIn = (p) => 1 - Math.sin(Math.acos(p));
  const circOut = reverseEasing(circIn);
  const circInOut = mirrorEasing(circIn);

  /**
   * Check if the value is a zero value string like "0px" or "0%"
   */ const isZeroValueString = (v) => /^0[^.\s]+$/u.test(v);
  function isNone(value) {
    if (typeof value === "number") {
      return value === 0;
    } else if (value !== null) {
      return value === "none" || value === "0" || isZeroValueString(value);
    } else {
      return true;
    }
  }

  const number = {
    test: (v) => typeof v === "number",
    parse: parseFloat,
    transform: (v) => v,
  };
  const alpha = {
    ...number,
    transform: (v) => clamp(0, 1, v),
  };
  const scale = {
    ...number,
    default: 1,
  };

  // If this number is a decimal, make it just five decimal places
  // to avoid exponents
  const sanitize = (v) => Math.round(v * 100000) / 100000;
  const floatRegex = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;

  function isNullish(v) {
    return v == null;
  }

  const singleColorRegex =
    /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu;

  /**
   * Returns true if the provided string is a color, ie rgba(0,0,0,0) or #000,
   * but false if a number or multiple colors
   */ const isColorString = (type, testProp) => (v) => {
    return Boolean(
      (typeof v === "string" && singleColorRegex.test(v) && v.startsWith(type)) ||
        (testProp && !isNullish(v) && Object.prototype.hasOwnProperty.call(v, testProp)),
    );
  };
  const splitColor = (aName, bName, cName) => (v) => {
    if (typeof v !== "string") return v;
    const [a, b, c, alpha] = v.match(floatRegex);
    return {
      [aName]: parseFloat(a),
      [bName]: parseFloat(b),
      [cName]: parseFloat(c),
      alpha: alpha !== undefined ? parseFloat(alpha) : 1,
    };
  };
  const clampRgbUnit = (v) => clamp(0, 255, v);
  const rgbUnit = {
    ...number,
    transform: (v) => Math.round(clampRgbUnit(v)),
  };
  const rgba = {
    test: /*@__PURE__*/ isColorString("rgb", "red"),
    parse: /*@__PURE__*/ splitColor("red", "green", "blue"),
    transform: ({ red, green, blue, alpha: alpha$1 = 1 }) =>
      "rgba(" +
      rgbUnit.transform(red) +
      ", " +
      rgbUnit.transform(green) +
      ", " +
      rgbUnit.transform(blue) +
      ", " +
      sanitize(alpha.transform(alpha$1)) +
      ")",
  };

  function parseHex(v) {
    let r = "";
    let g = "";
    let b = "";
    let a = "";
    // If we have 6 characters, ie #FF0000
    if (v.length > 5) {
      r = v.substring(1, 3);
      g = v.substring(3, 5);
      b = v.substring(5, 7);
      a = v.substring(7, 9);
      // Or we have 3 characters, ie #F00
    } else {
      r = v.substring(1, 2);
      g = v.substring(2, 3);
      b = v.substring(3, 4);
      a = v.substring(4, 5);
      r += r;
      g += g;
      b += b;
      a += a;
    }
    return {
      red: parseInt(r, 16),
      green: parseInt(g, 16),
      blue: parseInt(b, 16),
      alpha: a ? parseInt(a, 16) / 255 : 1,
    };
  }
  const hex = {
    test: /*@__PURE__*/ isColorString("#"),
    parse: parseHex,
    transform: rgba.transform,
  };

  const createUnitType = (unit) => ({
    test: (v) => typeof v === "string" && v.endsWith(unit) && v.split(" ").length === 1,
    parse: parseFloat,
    transform: (v) => `${v}${unit}`,
  });
  const degrees = /*@__PURE__*/ createUnitType("deg");
  const percent = /*@__PURE__*/ createUnitType("%");
  const px = /*@__PURE__*/ createUnitType("px");
  const vh = /*@__PURE__*/ createUnitType("vh");
  const vw = /*@__PURE__*/ createUnitType("vw");
  const progressPercentage = {
    ...percent,
    parse: (v) => percent.parse(v) / 100,
    transform: (v) => percent.transform(v * 100),
  };

  const hsla = {
    test: /*@__PURE__*/ isColorString("hsl", "hue"),
    parse: /*@__PURE__*/ splitColor("hue", "saturation", "lightness"),
    transform: ({ hue, saturation, lightness, alpha: alpha$1 = 1 }) => {
      return (
        "hsla(" +
        Math.round(hue) +
        ", " +
        percent.transform(sanitize(saturation)) +
        ", " +
        percent.transform(sanitize(lightness)) +
        ", " +
        sanitize(alpha.transform(alpha$1)) +
        ")"
      );
    },
  };

  const color = {
    test: (v) => rgba.test(v) || hex.test(v) || hsla.test(v),
    parse: (v) => {
      if (rgba.test(v)) {
        return rgba.parse(v);
      } else if (hsla.test(v)) {
        return hsla.parse(v);
      } else {
        return hex.parse(v);
      }
    },
    transform: (v) => {
      return typeof v === "string" ? v : v.hasOwnProperty("red") ? rgba.transform(v) : hsla.transform(v);
    },
  };

  const colorRegex =
    /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;

  function test(v) {
    var ref, ref1;
    return (
      isNaN(v) &&
      typeof v === "string" &&
      (((ref = v.match(floatRegex)) === null || ref === void 0 ? void 0 : ref.length) || 0) +
        (((ref1 = v.match(colorRegex)) === null || ref1 === void 0 ? void 0 : ref1.length) || 0) >
        0
    );
  }
  const NUMBER_TOKEN = "number";
  const COLOR_TOKEN = "color";
  const VAR_TOKEN = "var";
  const VAR_FUNCTION_TOKEN = "var(";
  const SPLIT_TOKEN = "${}";
  // this regex consists of the `singleCssVariableRegex|rgbHSLValueRegex|digitRegex`
  const complexRegex =
    /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
  function analyseComplexValue(value) {
    const originalValue = value.toString();
    const values = [];
    const indexes = {
      color: [],
      number: [],
      var: [],
    };
    const types = [];
    let i = 0;
    const tokenised = originalValue.replace(complexRegex, (parsedValue) => {
      if (color.test(parsedValue)) {
        indexes.color.push(i);
        types.push(COLOR_TOKEN);
        values.push(color.parse(parsedValue));
      } else if (parsedValue.startsWith(VAR_FUNCTION_TOKEN)) {
        indexes.var.push(i);
        types.push(VAR_TOKEN);
        values.push(parsedValue);
      } else {
        indexes.number.push(i);
        types.push(NUMBER_TOKEN);
        values.push(parseFloat(parsedValue));
      }
      ++i;
      return SPLIT_TOKEN;
    });
    const split = tokenised.split(SPLIT_TOKEN);
    return {
      values,
      split,
      indexes,
      types,
    };
  }
  function parseComplexValue(v) {
    return analyseComplexValue(v).values;
  }
  function createTransformer(source) {
    const { split, types } = analyseComplexValue(source);
    const numSections = split.length;
    return (v) => {
      let output = "";
      for (let i = 0; i < numSections; i++) {
        output += split[i];
        if (v[i] !== undefined) {
          const type = types[i];
          if (type === NUMBER_TOKEN) {
            output += sanitize(v[i]);
          } else if (type === COLOR_TOKEN) {
            output += color.transform(v[i]);
          } else {
            output += v[i];
          }
        }
      }
      return output;
    };
  }
  const convertNumbersToZero = (v) => (typeof v === "number" ? 0 : v);
  function getAnimatableNone$1(v) {
    const parsed = parseComplexValue(v);
    const transformer = createTransformer(v);
    return transformer(parsed.map(convertNumbersToZero));
  }
  const complex = {
    test,
    parse: parseComplexValue,
    createTransformer,
    getAnimatableNone: getAnimatableNone$1,
  };

  /**
   * Properties that should default to 1 or 100%
   */ const maxDefaults = new Set(["brightness", "contrast", "saturate", "opacity"]);
  function applyDefaultFilter(v) {
    const [name, value] = v.slice(0, -1).split("(");
    if (name === "drop-shadow") return v;
    const [number] = value.match(floatRegex) || [];
    if (!number) return v;
    const unit = value.replace(number, "");
    let defaultValue = maxDefaults.has(name) ? 1 : 0;
    if (number !== value) defaultValue *= 100;
    return name + "(" + defaultValue + unit + ")";
  }
  const functionRegex = /\b([a-z-]*)\(.*?\)/gu;
  const filter = {
    ...complex,
    getAnimatableNone: (v) => {
      const functions = v.match(functionRegex);
      return functions ? functions.map(applyDefaultFilter).join(" ") : v;
    },
  };

  const browserNumberValueTypes = {
    // Border props
    borderWidth: px,
    borderTopWidth: px,
    borderRightWidth: px,
    borderBottomWidth: px,
    borderLeftWidth: px,
    borderRadius: px,
    radius: px,
    borderTopLeftRadius: px,
    borderTopRightRadius: px,
    borderBottomRightRadius: px,
    borderBottomLeftRadius: px,
    // Positioning props
    width: px,
    maxWidth: px,
    height: px,
    maxHeight: px,
    top: px,
    right: px,
    bottom: px,
    left: px,
    // Spacing props
    padding: px,
    paddingTop: px,
    paddingRight: px,
    paddingBottom: px,
    paddingLeft: px,
    margin: px,
    marginTop: px,
    marginRight: px,
    marginBottom: px,
    marginLeft: px,
    // Misc
    backgroundPositionX: px,
    backgroundPositionY: px,
  };

  const transformValueTypes = {
    rotate: degrees,
    rotateX: degrees,
    rotateY: degrees,
    rotateZ: degrees,
    scale,
    scaleX: scale,
    scaleY: scale,
    scaleZ: scale,
    skew: degrees,
    skewX: degrees,
    skewY: degrees,
    distance: px,
    translateX: px,
    translateY: px,
    translateZ: px,
    x: px,
    y: px,
    z: px,
    perspective: px,
    transformPerspective: px,
    opacity: alpha,
    originX: progressPercentage,
    originY: progressPercentage,
    originZ: px,
  };

  const int = {
    ...number,
    transform: Math.round,
  };

  const numberValueTypes = {
    ...browserNumberValueTypes,
    ...transformValueTypes,
    zIndex: int,
    size: px,
    // SVG
    fillOpacity: alpha,
    strokeOpacity: alpha,
    numOctaves: int,
  };

  /**
   * A map of default value types for common values
   */ const defaultValueTypes = {
    ...numberValueTypes,
    // Color props
    color,
    backgroundColor: color,
    outlineColor: color,
    fill: color,
    stroke: color,
    // Border props
    borderColor: color,
    borderTopColor: color,
    borderRightColor: color,
    borderBottomColor: color,
    borderLeftColor: color,
    filter,
    WebkitFilter: filter,
  };
  /**
   * Gets the default ValueType for the provided value key
   */ const getDefaultValueType = (key) => defaultValueTypes[key];
  function getAnimatableNone(key, value) {
    let defaultValueType = getDefaultValueType(key);
    if (defaultValueType !== filter) defaultValueType = complex;
    // If value is not recognised as animatable, ie "none", create an animatable version origin based on the target
    return defaultValueType.getAnimatableNone ? defaultValueType.getAnimatableNone(value) : undefined;
  }

  /**
   * If we encounter keyframes like "none" or "0" and we also have keyframes like
   * "#fff" or "200px 200px" we want to find a keyframe to serve as a template for
   * the "none" keyframes. In this case "#fff" or "200px 200px" - then these get turned into
   * zero equivalents, i.e. "#fff0" or "0px 0px".
   */ const invalidTemplates = new Set(["auto", "none", "0"]);
  function makeNoneKeyframesAnimatable(unresolvedKeyframes, noneKeyframeIndexes, name) {
    let i = 0;
    let animatableTemplate = undefined;
    while (i < unresolvedKeyframes.length && !animatableTemplate) {
      const keyframe = unresolvedKeyframes[i];
      if (
        typeof keyframe === "string" &&
        !invalidTemplates.has(keyframe) &&
        analyseComplexValue(keyframe).values.length
      ) {
        animatableTemplate = unresolvedKeyframes[i];
      }
      i++;
    }
    if (animatableTemplate && name) {
      for (const noneIndex of noneKeyframeIndexes) {
        unresolvedKeyframes[noneIndex] = getAnimatableNone(name, animatableTemplate);
      }
    }
  }

  const radToDeg = (rad) => (rad * 180) / Math.PI;
  const rotate = (v) => {
    const angle = radToDeg(Math.atan2(v[1], v[0]));
    return rebaseAngle(angle);
  };
  const matrix2dParsers = {
    x: 4,
    y: 5,
    translateX: 4,
    translateY: 5,
    scaleX: 0,
    scaleY: 3,
    scale: (v) => (Math.abs(v[0]) + Math.abs(v[3])) / 2,
    rotate,
    rotateZ: rotate,
    skewX: (v) => radToDeg(Math.atan(v[1])),
    skewY: (v) => radToDeg(Math.atan(v[2])),
    skew: (v) => (Math.abs(v[1]) + Math.abs(v[2])) / 2,
  };
  const rebaseAngle = (angle) => {
    angle = angle % 360;
    if (angle < 0) angle += 360;
    return angle;
  };
  const rotateZ = rotate;
  const scaleX = (v) => Math.sqrt(v[0] * v[0] + v[1] * v[1]);
  const scaleY = (v) => Math.sqrt(v[4] * v[4] + v[5] * v[5]);
  const matrix3dParsers = {
    x: 12,
    y: 13,
    z: 14,
    translateX: 12,
    translateY: 13,
    translateZ: 14,
    scaleX,
    scaleY,
    scale: (v) => (scaleX(v) + scaleY(v)) / 2,
    rotateX: (v) => rebaseAngle(radToDeg(Math.atan2(v[6], v[5]))),
    rotateY: (v) => rebaseAngle(radToDeg(Math.atan2(-v[2], v[0]))),
    rotateZ,
    rotate: rotateZ,
    skewX: (v) => radToDeg(Math.atan(v[4])),
    skewY: (v) => radToDeg(Math.atan(v[1])),
    skew: (v) => (Math.abs(v[1]) + Math.abs(v[4])) / 2,
  };
  function defaultTransformValue(name) {
    return name.includes("scale") ? 1 : 0;
  }
  function parseValueFromTransform(transform, name) {
    if (!transform || transform === "none") {
      return defaultTransformValue(name);
    }
    const matrix3dMatch = transform.match(/^matrix3d\(([-\d.e\s,]+)\)$/u);
    let parsers;
    let match;
    if (matrix3dMatch) {
      parsers = matrix3dParsers;
      match = matrix3dMatch;
    } else {
      const matrix2dMatch = transform.match(/^matrix\(([-\d.e\s,]+)\)$/u);
      parsers = matrix2dParsers;
      match = matrix2dMatch;
    }
    if (!match) {
      return defaultTransformValue(name);
    }
    const valueParser = parsers[name];
    const values = match[1].split(",").map(convertTransformToNumber);
    return typeof valueParser === "function" ? valueParser(values) : values[valueParser];
  }
  const readTransformValue = (instance, name) => {
    const { transform = "none" } = getComputedStyle(instance);
    return parseValueFromTransform(transform, name);
  };
  function convertTransformToNumber(value) {
    return parseFloat(value.trim());
  }

  const isNumOrPxType = (v) => v === number || v === px;
  const transformKeys = new Set(["x", "y", "z"]);
  const nonTranslationalTransformKeys = transformPropOrder.filter((key) => !transformKeys.has(key));
  function removeNonTranslationalTransform(visualElement) {
    const removedTransforms = [];
    nonTranslationalTransformKeys.forEach((key) => {
      const value = visualElement.getValue(key);
      if (value !== undefined) {
        removedTransforms.push([key, value.get()]);
        value.set(key.startsWith("scale") ? 1 : 0);
      }
    });
    return removedTransforms;
  }
  const positionalValues = {
    // Dimensions
    width: ({ x }, { paddingLeft = "0", paddingRight = "0" }) =>
      x.max - x.min - parseFloat(paddingLeft) - parseFloat(paddingRight),
    height: ({ y }, { paddingTop = "0", paddingBottom = "0" }) =>
      y.max - y.min - parseFloat(paddingTop) - parseFloat(paddingBottom),
    top: (_bbox, { top }) => parseFloat(top),
    left: (_bbox, { left }) => parseFloat(left),
    bottom: ({ y }, { top }) => parseFloat(top) + (y.max - y.min),
    right: ({ x }, { left }) => parseFloat(left) + (x.max - x.min),
    // Transform
    x: (_bbox, { transform }) => parseValueFromTransform(transform, "x"),
    y: (_bbox, { transform }) => parseValueFromTransform(transform, "y"),
  };
  // Alias translate longform names
  positionalValues.translateX = positionalValues.x;
  positionalValues.translateY = positionalValues.y;

  const toResolve = new Set();
  let isScheduled = false;
  let anyNeedsMeasurement = false;
  function measureAllKeyframes() {
    if (anyNeedsMeasurement) {
      const resolversToMeasure = Array.from(toResolve).filter((resolver) => resolver.needsMeasurement);
      const elementsToMeasure = new Set(resolversToMeasure.map((resolver) => resolver.element));
      const transformsToRestore = new Map();
      /**
       * Write pass
       * If we're measuring elements we want to remove bounding box-changing transforms.
       */ elementsToMeasure.forEach((element) => {
        const removedTransforms = removeNonTranslationalTransform(element);
        if (!removedTransforms.length) return;
        transformsToRestore.set(element, removedTransforms);
        element.render();
      });
      // Read
      resolversToMeasure.forEach((resolver) => resolver.measureInitialState());
      // Write
      elementsToMeasure.forEach((element) => {
        element.render();
        const restore = transformsToRestore.get(element);
        if (restore) {
          restore.forEach(([key, value]) => {
            var ref;
            (ref = element.getValue(key)) === null || ref === void 0 ? void 0 : ref.set(value);
          });
        }
      });
      // Read
      resolversToMeasure.forEach((resolver) => resolver.measureEndState());
      // Write
      resolversToMeasure.forEach((resolver) => {
        if (resolver.suspendedScrollY !== undefined) {
          window.scrollTo(0, resolver.suspendedScrollY);
        }
      });
    }
    anyNeedsMeasurement = false;
    isScheduled = false;
    toResolve.forEach((resolver) => resolver.complete());
    toResolve.clear();
  }
  function readAllKeyframes() {
    toResolve.forEach((resolver) => {
      resolver.readKeyframes();
      if (resolver.needsMeasurement) {
        anyNeedsMeasurement = true;
      }
    });
  }
  function flushKeyframeResolvers() {
    readAllKeyframes();
    measureAllKeyframes();
  }
  let KeyframeResolver = class KeyframeResolver {
    scheduleResolve() {
      this.isScheduled = true;
      if (this.isAsync) {
        toResolve.add(this);
        if (!isScheduled) {
          isScheduled = true;
          frame.read(readAllKeyframes);
          frame.resolveKeyframes(measureAllKeyframes);
        }
      } else {
        this.readKeyframes();
        this.complete();
      }
    }
    readKeyframes() {
      const { unresolvedKeyframes, name, element, motionValue } = this;
      /**
       * If a keyframe is null, we hydrate it either by reading it from
       * the instance, or propagating from previous keyframes.
       */ for (let i = 0; i < unresolvedKeyframes.length; i++) {
        if (unresolvedKeyframes[i] === null) {
          /**
           * If the first keyframe is null, we need to find its value by sampling the element
           */ if (i === 0) {
            const currentValue = motionValue === null || motionValue === void 0 ? void 0 : motionValue.get();
            const finalKeyframe = unresolvedKeyframes[unresolvedKeyframes.length - 1];
            if (currentValue !== undefined) {
              unresolvedKeyframes[0] = currentValue;
            } else if (element && name) {
              const valueAsRead = element.readValue(name, finalKeyframe);
              if (valueAsRead !== undefined && valueAsRead !== null) {
                unresolvedKeyframes[0] = valueAsRead;
              }
            }
            if (unresolvedKeyframes[0] === undefined) {
              unresolvedKeyframes[0] = finalKeyframe;
            }
            if (motionValue && currentValue === undefined) {
              motionValue.set(unresolvedKeyframes[0]);
            }
          } else {
            unresolvedKeyframes[i] = unresolvedKeyframes[i - 1];
          }
        }
      }
    }
    setFinalKeyframe() {}
    measureInitialState() {}
    renderEndStyles() {}
    measureEndState() {}
    complete() {
      this.isComplete = true;
      this.onComplete(this.unresolvedKeyframes, this.finalKeyframe);
      toResolve.delete(this);
    }
    cancel() {
      if (!this.isComplete) {
        this.isScheduled = false;
        toResolve.delete(this);
      }
    }
    resume() {
      if (!this.isComplete) this.scheduleResolve();
    }
    constructor(unresolvedKeyframes, onComplete, name, motionValue, element, isAsync = false) {
      /**
       * Track whether this resolver has completed. Once complete, it never
       * needs to attempt keyframe resolution again.
       */ this.isComplete = false;
      /**
       * Track whether this resolver is async. If it is, it'll be added to the
       * resolver queue and flushed in the next frame. Resolvers that aren't going
       * to trigger read/write thrashing don't need to be async.
       */ this.isAsync = false;
      /**
       * Track whether this resolver needs to perform a measurement
       * to resolve its keyframes.
       */ this.needsMeasurement = false;
      /**
       * Track whether this resolver is currently scheduled to resolve
       * to allow it to be cancelled and resumed externally.
       */ this.isScheduled = false;
      this.unresolvedKeyframes = [...unresolvedKeyframes];
      this.onComplete = onComplete;
      this.name = name;
      this.motionValue = motionValue;
      this.element = element;
      this.isAsync = isAsync;
    }
  };

  /**
   * Check if value is a numerical string, ie a string that is purely a number eg "100" or "-100.1"
   */ const isNumericalString = (v) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(v);
  const checkStringStartsWith = (token) => (key) => typeof key === "string" && key.startsWith(token);
  const isCSSVariableName = /*@__PURE__*/ checkStringStartsWith("--");
  const startsAsVariableToken = /*@__PURE__*/ checkStringStartsWith("var(--");
  const isCSSVariableToken = (value) => {
    const startsWithToken = startsAsVariableToken(value);
    if (!startsWithToken) return false;
    // Ensure any comments are stripped from the value as this can harm performance of the regex.
    return singleCssVariableRegex.test(value.split("/*")[0].trim());
  };
  const singleCssVariableRegex = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;

  /**
   * Parse Framer's special CSS variable format into a CSS token and a fallback.
   *
   * ```
   * `var(--foo, #fff)` => [`--foo`, '#fff']
   * ```
   *
   * @param current
   */ const splitCSSVariableRegex = // eslint-disable-next-line redos-detector/no-unsafe-regex -- false positive, as it can match a lot of words
    /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;
  function parseCSSVariable(current) {
    const match = splitCSSVariableRegex.exec(current);
    if (!match) return [,];
    const [, token1, token2, fallback] = match;
    return [`--${token1 !== null && token1 !== void 0 ? token1 : token2}`, fallback];
  }
  const maxDepth = 4;
  function getVariableValue(current, element, depth = 1) {
    invariant$1(
      depth <= maxDepth,
      `Max CSS variable fallback depth detected in property "${current}". This may indicate a circular fallback dependency.`,
    );
    const [token, fallback] = parseCSSVariable(current);
    // No CSS variable detected
    if (!token) return;
    // Attempt to read this CSS variable off the element
    const resolved = window.getComputedStyle(element).getPropertyValue(token);
    if (resolved) {
      const trimmed = resolved.trim();
      return isNumericalString(trimmed) ? parseFloat(trimmed) : trimmed;
    }
    return isCSSVariableToken(fallback) ? getVariableValue(fallback, element, depth + 1) : fallback;
  }

  /**
   * Tests a provided value against a ValueType
   */ const testValueType = (v) => (type) => type.test(v);
  /**
   * ValueType for "auto"
   */ const auto = {
    test: (v) => v === "auto",
    parse: (v) => v,
  };

  /**
   * A list of value types commonly used for dimensions
   */ const dimensionValueTypes = [number, px, percent, degrees, vw, vh, auto];
  /**
   * Tests a dimensional value against the list of dimension ValueTypes
   */ const findDimensionValueType = (v) => dimensionValueTypes.find(testValueType(v));
  let DOMKeyframesResolver = class DOMKeyframesResolver extends KeyframeResolver {
    readKeyframes() {
      const { unresolvedKeyframes, element, name } = this;
      if (!element || !element.current) return;
      super.readKeyframes();
      /**
       * If any keyframe is a CSS variable, we need to find its value by sampling the element
       */ for (let i = 0; i < unresolvedKeyframes.length; i++) {
        let keyframe = unresolvedKeyframes[i];
        if (typeof keyframe === "string") {
          keyframe = keyframe.trim();
          if (isCSSVariableToken(keyframe)) {
            const resolved = getVariableValue(keyframe, element.current);
            if (resolved !== undefined) {
              unresolvedKeyframes[i] = resolved;
            }
            if (i === unresolvedKeyframes.length - 1) {
              this.finalKeyframe = keyframe;
            }
          }
        }
      }
      /**
       * Resolve "none" values. We do this potentially twice - once before and once after measuring keyframes.
       * This could be seen as inefficient but it's a trade-off to avoid measurements in more situations, which
       * have a far bigger performance impact.
       */ this.resolveNoneKeyframes();
      /**
       * Check to see if unit type has changed. If so schedule jobs that will
       * temporarily set styles to the destination keyframes.
       * Skip if we have more than two keyframes or this isn't a positional value.
       * TODO: We can throw if there are multiple keyframes and the value type changes.
       */ if (!positionalKeys.has(name) || unresolvedKeyframes.length !== 2) {
        return;
      }
      const [origin, target] = unresolvedKeyframes;
      const originType = findDimensionValueType(origin);
      const targetType = findDimensionValueType(target);
      /**
       * Either we don't recognise these value types or we can animate between them.
       */ if (originType === targetType) return;
      /**
       * If both values are numbers or pixels, we can animate between them by
       * converting them to numbers.
       */ if (isNumOrPxType(originType) && isNumOrPxType(targetType)) {
        for (let i = 0; i < unresolvedKeyframes.length; i++) {
          const value = unresolvedKeyframes[i];
          if (typeof value === "string") {
            unresolvedKeyframes[i] = parseFloat(value);
          }
        }
      } else {
        /**
         * Else, the only way to resolve this is by measuring the element.
         */ this.needsMeasurement = true;
      }
    }
    resolveNoneKeyframes() {
      const { unresolvedKeyframes, name } = this;
      const noneKeyframeIndexes = [];
      for (let i = 0; i < unresolvedKeyframes.length; i++) {
        if (isNone(unresolvedKeyframes[i])) {
          noneKeyframeIndexes.push(i);
        }
      }
      if (noneKeyframeIndexes.length) {
        makeNoneKeyframesAnimatable(unresolvedKeyframes, noneKeyframeIndexes, name);
      }
    }
    measureInitialState() {
      const { element, unresolvedKeyframes, name } = this;
      if (!element || !element.current) return;
      if (name === "height") {
        this.suspendedScrollY = window.pageYOffset;
      }
      this.measuredOrigin = positionalValues[name](
        element.measureViewportBox(),
        window.getComputedStyle(element.current),
      );
      unresolvedKeyframes[0] = this.measuredOrigin;
      // Set final key frame to measure after next render
      const measureKeyframe = unresolvedKeyframes[unresolvedKeyframes.length - 1];
      if (measureKeyframe !== undefined) {
        element.getValue(name, measureKeyframe).jump(measureKeyframe, false);
      }
    }
    measureEndState() {
      var ref;
      const { element, name, unresolvedKeyframes } = this;
      if (!element || !element.current) return;
      const value = element.getValue(name);
      value && value.jump(this.measuredOrigin, false);
      const finalKeyframeIndex = unresolvedKeyframes.length - 1;
      const finalKeyframe = unresolvedKeyframes[finalKeyframeIndex];
      unresolvedKeyframes[finalKeyframeIndex] = positionalValues[name](
        element.measureViewportBox(),
        window.getComputedStyle(element.current),
      );
      if (finalKeyframe !== null && this.finalKeyframe === undefined) {
        this.finalKeyframe = finalKeyframe;
      }
      // If we removed transform values, reapply them before the next render
      if ((ref = this.removedTransforms) === null || ref === void 0 ? void 0 : ref.length) {
        this.removedTransforms.forEach(([unsetTransformName, unsetTransformValue]) => {
          element.getValue(unsetTransformName).set(unsetTransformValue);
        });
      }
      this.resolveNoneKeyframes();
    }
    constructor(unresolvedKeyframes, onComplete, name, motionValue, element) {
      super(unresolvedKeyframes, onComplete, name, motionValue, element, true);
    }
  };

  /**
   * Check if a value is animatable. Examples:
   *
   * ✅: 100, "100px", "#fff"
   * ❌: "block", "url(2.jpg)"
   * @param value
   *
   * @internal
   */ const isAnimatable = (value, name) => {
    // If the list of keys tat might be non-animatable grows, replace with Set
    if (name === "zIndex") return false;
    // If it's a number or a keyframes array, we can animate it. We might at some point
    // need to do a deep isAnimatable check of keyframes, or let Popmotion handle this,
    // but for now lets leave it like this for performance reasons
    if (typeof value === "number" || Array.isArray(value)) return true;
    if (
      typeof value === "string" &&
      (complex.test(value) || value === "0") &&
      !value.startsWith("url(") // Unless it starts with "url("
    ) {
      return true;
    }
    return false;
  };

  function hasKeyframesChanged(keyframes) {
    const current = keyframes[0];
    if (keyframes.length === 1) return true;
    for (let i = 0; i < keyframes.length; i++) {
      if (keyframes[i] !== current) return true;
    }
  }
  function canAnimate(keyframes, name, type, velocity) {
    /**
     * Check if we're able to animate between the start and end keyframes,
     * and throw a warning if we're attempting to animate between one that's
     * animatable and another that isn't.
     */ const originKeyframe = keyframes[0];
    if (originKeyframe === null) return false;
    /**
     * These aren't traditionally animatable but we do support them.
     * In future we could look into making this more generic or replacing
     * this function with mix() === mixImmediate
     */ if (name === "display" || name === "visibility") return true;
    const targetKeyframe = keyframes[keyframes.length - 1];
    const isOriginAnimatable = isAnimatable(originKeyframe, name);
    const isTargetAnimatable = isAnimatable(targetKeyframe, name);
    warning(
      isOriginAnimatable === isTargetAnimatable,
      `You are trying to animate ${name} from "${originKeyframe}" to "${targetKeyframe}". ${originKeyframe} is not an animatable value - to enable this animation set ${originKeyframe} to a value animatable to ${targetKeyframe} via the \`style\` property.`,
    );
    // Always skip if any of these are true
    if (!isOriginAnimatable || !isTargetAnimatable) {
      return false;
    }
    return hasKeyframesChanged(keyframes) || ((type === "spring" || isGenerator$1(type)) && velocity);
  }

  const isNotNull$1 = (value) => value !== null;
  function getFinalKeyframe$1(keyframes, { repeat, repeatType = "loop" }, finalKeyframe) {
    const resolvedKeyframes = keyframes.filter(isNotNull$1);
    const index = repeat && repeatType !== "loop" && repeat % 2 === 1 ? 0 : resolvedKeyframes.length - 1;
    return !index || finalKeyframe === undefined ? resolvedKeyframes[index] : finalKeyframe;
  }

  /**
   * Maximum time allowed between an animation being created and it being
   * resolved for us to use the latter as the start time.
   *
   * This is to ensure that while we prefer to "start" an animation as soon
   * as it's triggered, we also want to avoid a visual jump if there's a big delay
   * between these two moments.
   */ const MAX_RESOLVE_DELAY = 40;
  let BaseAnimation = class BaseAnimation {
    /**
     * This method uses the createdAt and resolvedAt to calculate the
     * animation startTime. *Ideally*, we would use the createdAt time as t=0
     * as the following frame would then be the first frame of the animation in
     * progress, which would feel snappier.
     *
     * However, if there's a delay (main thread work) between the creation of
     * the animation and the first commited frame, we prefer to use resolvedAt
     * to avoid a sudden jump into the animation.
     */ calcStartTime() {
      if (!this.resolvedAt) return this.createdAt;
      return this.resolvedAt - this.createdAt > MAX_RESOLVE_DELAY ? this.resolvedAt : this.createdAt;
    }
    /**
     * A getter for resolved data. If keyframes are not yet resolved, accessing
     * this.resolved will synchronously flush all pending keyframe resolvers.
     * This is a deoptimisation, but at its worst still batches read/writes.
     */ get resolved() {
      if (!this._resolved && !this.hasAttemptedResolve) {
        flushKeyframeResolvers();
      }
      return this._resolved;
    }
    /**
     * A method to be called when the keyframes resolver completes. This method
     * will check if its possible to run the animation and, if not, skip it.
     * Otherwise, it will call initPlayback on the implementing class.
     */ onKeyframesResolved(keyframes, finalKeyframe) {
      this.resolvedAt = time.now();
      this.hasAttemptedResolve = true;
      const { name, type, velocity, delay, onComplete, onUpdate, isGenerator } = this.options;
      /**
       * If we can't animate this value with the resolved keyframes
       * then we should complete it immediately.
       */ if (!isGenerator && !canAnimate(keyframes, name, type, velocity)) {
        // Finish immediately
        if (!delay) {
          onUpdate && onUpdate(getFinalKeyframe$1(keyframes, this.options, finalKeyframe));
          onComplete && onComplete();
          this.resolveFinishedPromise();
          return;
        } else {
          this.options.duration = 0;
        }
      }
      const resolvedAnimation = this.initPlayback(keyframes, finalKeyframe);
      if (resolvedAnimation === false) return;
      this._resolved = {
        keyframes,
        finalKeyframe,
        ...resolvedAnimation,
      };
      this.onPostResolved();
    }
    onPostResolved() {}
    /**
     * Allows the returned animation to be awaited or promise-chained. Currently
     * resolves when the animation finishes at all but in a future update could/should
     * reject if its cancels.
     */ then(resolve, reject) {
      return this.currentFinishedPromise.then(resolve, reject);
    }
    flatten() {
      if (!this.options.allowFlatten) return;
      this.options.type = "keyframes";
      this.options.ease = "linear";
    }
    updateFinishedPromise() {
      this.currentFinishedPromise = new Promise((resolve) => {
        this.resolveFinishedPromise = resolve;
      });
    }
    constructor({
      autoplay = true,
      delay = 0,
      type = "keyframes",
      repeat = 0,
      repeatDelay = 0,
      repeatType = "loop",
      ...options
    }) {
      // Track whether the animation has been stopped. Stopped animations won't restart.
      this.isStopped = false;
      this.hasAttemptedResolve = false;
      this.createdAt = time.now();
      this.options = {
        autoplay,
        delay,
        type,
        repeat,
        repeatDelay,
        repeatType,
        ...options,
      };
      this.updateFinishedPromise();
    }
  };

  // Adapted from https://gist.github.com/mjackson/5311256
  function hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  function hslaToRgba({ hue, saturation, lightness, alpha }) {
    hue /= 360;
    saturation /= 100;
    lightness /= 100;
    let red = 0;
    let green = 0;
    let blue = 0;
    if (!saturation) {
      red = green = blue = lightness;
    } else {
      const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
      const p = 2 * lightness - q;
      red = hueToRgb(p, q, hue + 1 / 3);
      green = hueToRgb(p, q, hue);
      blue = hueToRgb(p, q, hue - 1 / 3);
    }
    return {
      red: Math.round(red * 255),
      green: Math.round(green * 255),
      blue: Math.round(blue * 255),
      alpha,
    };
  }

  function mixImmediate(a, b) {
    return (p) => (p > 0 ? b : a);
  }

  // Linear color space blending
  // Explained https://www.youtube.com/watch?v=LKnqECcg6Gw
  // Demonstrated http://codepen.io/osublake/pen/xGVVaN
  const mixLinearColor = (from, to, v) => {
    const fromExpo = from * from;
    const expo = v * (to * to - fromExpo) + fromExpo;
    return expo < 0 ? 0 : Math.sqrt(expo);
  };
  const colorTypes = [hex, rgba, hsla];
  const getColorType = (v) => colorTypes.find((type) => type.test(v));
  function asRGBA(color) {
    const type = getColorType(color);
    warning(Boolean(type), `'${color}' is not an animatable color. Use the equivalent color code instead.`);
    if (!Boolean(type)) return false;
    let model = type.parse(color);
    if (type === hsla) {
      // TODO Remove this cast - needed since Motion's stricter typing
      model = hslaToRgba(model);
    }
    return model;
  }
  const mixColor = (from, to) => {
    const fromRGBA = asRGBA(from);
    const toRGBA = asRGBA(to);
    if (!fromRGBA || !toRGBA) {
      return mixImmediate(from, to);
    }
    const blended = {
      ...fromRGBA,
    };
    return (v) => {
      blended.red = mixLinearColor(fromRGBA.red, toRGBA.red, v);
      blended.green = mixLinearColor(fromRGBA.green, toRGBA.green, v);
      blended.blue = mixLinearColor(fromRGBA.blue, toRGBA.blue, v);
      blended.alpha = mixNumber$1(fromRGBA.alpha, toRGBA.alpha, v);
      return rgba.transform(blended);
    };
  };

  /**
   * Pipe
   * Compose other transformers to run linearily
   * pipe(min(20), max(40))
   * @param  {...functions} transformers
   * @return {function}
   */ const combineFunctions = (a, b) => (v) => b(a(v));
  const pipe = (...transformers) => transformers.reduce(combineFunctions);
  const invisibleValues = new Set(["none", "hidden"]);
  /**
   * Returns a function that, when provided a progress value between 0 and 1,
   * will return the "none" or "hidden" string only when the progress is that of
   * the origin or target.
   */ function mixVisibility(origin, target) {
    if (invisibleValues.has(origin)) {
      return (p) => (p <= 0 ? origin : target);
    } else {
      return (p) => (p >= 1 ? target : origin);
    }
  }

  function mixNumber(a, b) {
    return (p) => mixNumber$1(a, b, p);
  }
  function getMixer$1(a) {
    if (typeof a === "number") {
      return mixNumber;
    } else if (typeof a === "string") {
      return isCSSVariableToken(a) ? mixImmediate : color.test(a) ? mixColor : mixComplex;
    } else if (Array.isArray(a)) {
      return mixArray;
    } else if (typeof a === "object") {
      return color.test(a) ? mixColor : mixObject;
    }
    return mixImmediate;
  }
  function mixArray(a, b) {
    const output = [...a];
    const numValues = output.length;
    const blendValue = a.map((v, i) => getMixer$1(v)(v, b[i]));
    return (p) => {
      for (let i = 0; i < numValues; i++) {
        output[i] = blendValue[i](p);
      }
      return output;
    };
  }
  function mixObject(a, b) {
    const output = {
      ...a,
      ...b,
    };
    const blendValue = {};
    for (const key1 in output) {
      if (a[key1] !== undefined && b[key1] !== undefined) {
        blendValue[key1] = getMixer$1(a[key1])(a[key1], b[key1]);
      }
    }
    return (v) => {
      for (const key in blendValue) {
        output[key] = blendValue[key](v);
      }
      return output;
    };
  }
  function matchOrder(origin, target) {
    const orderedOrigin = [];
    const pointers = {
      color: 0,
      var: 0,
      number: 0,
    };
    for (let i = 0; i < target.values.length; i++) {
      const type = target.types[i];
      const originIndex = origin.indexes[type][pointers[type]];
      var _originIndex;
      const originValue =
        (_originIndex = origin.values[originIndex]) !== null && _originIndex !== void 0 ? _originIndex : 0;
      orderedOrigin[i] = originValue;
      pointers[type]++;
    }
    return orderedOrigin;
  }
  const mixComplex = (origin, target) => {
    const template = complex.createTransformer(target);
    const originStats = analyseComplexValue(origin);
    const targetStats = analyseComplexValue(target);
    const canInterpolate =
      originStats.indexes.var.length === targetStats.indexes.var.length &&
      originStats.indexes.color.length === targetStats.indexes.color.length &&
      originStats.indexes.number.length >= targetStats.indexes.number.length;
    if (canInterpolate) {
      if (
        (invisibleValues.has(origin) && !targetStats.values.length) ||
        (invisibleValues.has(target) && !originStats.values.length)
      ) {
        return mixVisibility(origin, target);
      }
      return pipe(mixArray(matchOrder(originStats, targetStats), targetStats.values), template);
    } else {
      warning(
        true,
        `Complex values '${origin}' and '${target}' too different to mix. Ensure all colors are of the same type, and that each contains the same quantity of number and color values. Falling back to instant transition.`,
      );
      return mixImmediate(origin, target);
    }
  };

  function mix(from, to, p) {
    if (typeof from === "number" && typeof to === "number" && typeof p === "number") {
      return mixNumber$1(from, to, p);
    }
    const mixer = getMixer$1(from);
    return mixer(from, to);
  }

  function inertia({
    keyframes,
    velocity = 0.0,
    power = 0.8,
    timeConstant = 325,
    bounceDamping = 10,
    bounceStiffness = 500,
    modifyTarget,
    min,
    max,
    restDelta = 0.5,
    restSpeed,
  }) {
    const origin = keyframes[0];
    const state = {
      done: false,
      value: origin,
    };
    const isOutOfBounds = (v) => (min !== undefined && v < min) || (max !== undefined && v > max);
    const nearestBoundary = (v) => {
      if (min === undefined) return max;
      if (max === undefined) return min;
      return Math.abs(min - v) < Math.abs(max - v) ? min : max;
    };
    let amplitude = power * velocity;
    const ideal = origin + amplitude;
    const target = modifyTarget === undefined ? ideal : modifyTarget(ideal);
    /**
     * If the target has changed we need to re-calculate the amplitude, otherwise
     * the animation will start from the wrong position.
     */ if (target !== ideal) amplitude = target - origin;
    const calcDelta = (t) => -amplitude * Math.exp(-t / timeConstant);
    const calcLatest = (t) => target + calcDelta(t);
    const applyFriction = (t) => {
      const delta = calcDelta(t);
      const latest = calcLatest(t);
      state.done = Math.abs(delta) <= restDelta;
      state.value = state.done ? target : latest;
    };
    /**
     * Ideally this would resolve for t in a stateless way, we could
     * do that by always precalculating the animation but as we know
     * this will be done anyway we can assume that spring will
     * be discovered during that.
     */ let timeReachedBoundary;
    let spring$1;
    const checkCatchBoundary = (t) => {
      if (!isOutOfBounds(state.value)) return;
      timeReachedBoundary = t;
      spring$1 = spring({
        keyframes: [state.value, nearestBoundary(state.value)],
        velocity: calcGeneratorVelocity(calcLatest, t, state.value),
        damping: bounceDamping,
        stiffness: bounceStiffness,
        restDelta,
        restSpeed,
      });
    };
    checkCatchBoundary(0);
    return {
      calculatedDuration: null,
      next: (t) => {
        /**
         * We need to resolve the friction to figure out if we need a
         * spring but we don't want to do this twice per frame. So here
         * we flag if we updated for this frame and later if we did
         * we can skip doing it again.
         */ let hasUpdatedFrame = false;
        if (!spring$1 && timeReachedBoundary === undefined) {
          hasUpdatedFrame = true;
          applyFriction(t);
          checkCatchBoundary(t);
        }
        /**
         * If we have a spring and the provided t is beyond the moment the friction
         * animation crossed the min/max boundary, use the spring.
         */ if (timeReachedBoundary !== undefined && t >= timeReachedBoundary) {
          return spring$1.next(t - timeReachedBoundary);
        } else {
          !hasUpdatedFrame && applyFriction(t);
          return state;
        }
      },
    };
  }

  const easeIn = /*@__PURE__*/ cubicBezier(0.42, 0, 1, 1);
  const easeOut = /*@__PURE__*/ cubicBezier(0, 0, 0.58, 1);
  const easeInOut = /*@__PURE__*/ cubicBezier(0.42, 0, 0.58, 1);

  const isBezierDefinition$1 = (easing) => Array.isArray(easing) && typeof easing[0] === "number";
  const easingLookup = {
    linear: noop$1,
    easeIn,
    easeInOut,
    easeOut,
    circIn,
    circInOut,
    circOut,
    backIn,
    backInOut,
    backOut,
    anticipate,
  };
  const easingDefinitionToFunction = (definition) => {
    if (isBezierDefinition$1(definition)) {
      // If cubic bezier definition, create bezier curve
      invariant$1(definition.length === 4, `Cubic bezier arrays must contain four numerical values.`);
      const [x1, y1, x2, y2] = definition;
      return cubicBezier(x1, y1, x2, y2);
    } else if (typeof definition === "string") {
      // Else lookup from table
      invariant$1(easingLookup[definition] !== undefined, `Invalid easing type '${definition}'`);
      return easingLookup[definition];
    }
    return definition;
  };

  function createMixers(output, ease, customMixer) {
    const mixers = [];
    const mixerFactory = customMixer || mix;
    const numMixers = output.length - 1;
    for (let i = 0; i < numMixers; i++) {
      let mixer = mixerFactory(output[i], output[i + 1]);
      if (ease) {
        const easingFunction = Array.isArray(ease) ? ease[i] || noop$1 : ease;
        mixer = pipe(easingFunction, mixer);
      }
      mixers.push(mixer);
    }
    return mixers;
  }
  /**
   * Create a function that maps from a numerical input array to a generic output array.
   *
   * Accepts:
   *   - Numbers
   *   - Colors (hex, hsl, hsla, rgb, rgba)
   *   - Complex (combinations of one or more numbers or strings)
   *
   * ```jsx
   * const mixColor = interpolate([0, 1], ['#fff', '#000'])
   *
   * mixColor(0.5) // 'rgba(128, 128, 128, 1)'
   * ```
   *
   * TODO Revist this approach once we've moved to data models for values,
   * probably not needed to pregenerate mixer functions.
   *
   * @public
   */ function interpolate(input, output, { clamp: isClamp = true, ease, mixer } = {}) {
    const inputLength = input.length;
    invariant$1(inputLength === output.length, "Both input and output ranges must be the same length");
    /**
     * If we're only provided a single input, we can just make a function
     * that returns the output.
     */ if (inputLength === 1) return () => output[0];
    if (inputLength === 2 && output[0] === output[1]) return () => output[1];
    const isZeroDeltaRange = input[0] === input[1];
    // If input runs highest -> lowest, reverse both arrays
    if (input[0] > input[inputLength - 1]) {
      input = [...input].reverse();
      output = [...output].reverse();
    }
    const mixers = createMixers(output, ease, mixer);
    const numMixers = mixers.length;
    const interpolator = (v) => {
      if (isZeroDeltaRange && v < input[0]) return output[0];
      let i = 0;
      if (numMixers > 1) {
        for (; i < input.length - 2; i++) {
          if (v < input[i + 1]) break;
        }
      }
      const progressInRange = progress(input[i], input[i + 1], v);
      return mixers[i](progressInRange);
    };
    return isClamp ? (v) => interpolator(clamp(input[0], input[inputLength - 1], v)) : interpolator;
  }

  function convertOffsetToTimes(offset, duration) {
    return offset.map((o) => o * duration);
  }

  function defaultEasing(values, easing) {
    return values.map(() => easing || easeInOut).splice(0, values.length - 1);
  }
  function keyframes({ duration = 300, keyframes: keyframeValues, times, ease = "easeInOut" }) {
    /**
     * Easing functions can be externally defined as strings. Here we convert them
     * into actual functions.
     */ const easingFunctions = isEasingArray(ease)
      ? ease.map(easingDefinitionToFunction)
      : easingDefinitionToFunction(ease);
    /**
     * This is the Iterator-spec return value. We ensure it's mutable rather than using a generator
     * to reduce GC during animation.
     */ const state = {
      done: false,
      value: keyframeValues[0],
    };
    /**
     * Create a times array based on the provided 0-1 offsets
     */ const absoluteTimes = convertOffsetToTimes(
      // Only use the provided offsets if they're the correct length
      // TODO Maybe we should warn here if there's a length mismatch
      times && times.length === keyframeValues.length ? times : defaultOffset$1(keyframeValues),
      duration,
    );
    const mapTimeToKeyframe = interpolate(absoluteTimes, keyframeValues, {
      ease: Array.isArray(easingFunctions) ? easingFunctions : defaultEasing(keyframeValues, easingFunctions),
    });
    return {
      calculatedDuration: duration,
      next: (t) => {
        state.value = mapTimeToKeyframe(t);
        state.done = t >= duration;
        return state;
      },
    };
  }

  const frameloopDriver = (update) => {
    const passTimestamp = ({ timestamp }) => update(timestamp);
    return {
      start: () => frame.update(passTimestamp, true),
      stop: () => cancelFrame(passTimestamp),
      /**
       * If we're processing this frame we can use the
       * framelocked timestamp to keep things in sync.
       */ now: () => (frameData.isProcessing ? frameData.timestamp : time.now()),
    };
  };

  const generators = {
    decay: inertia,
    inertia,
    tween: keyframes,
    keyframes: keyframes,
    spring,
  };
  const percentToProgress = (percent) => percent / 100;
  /**
   * Animation that runs on the main thread. Designed to be WAAPI-spec in the subset of
   * features we expose publically. Mostly the compatibility is to ensure visual identity
   * between both WAAPI and main thread animations.
   */ let MainThreadAnimation = class MainThreadAnimation extends BaseAnimation {
    flatten() {
      super.flatten();
      // If we've already resolved the animation, re-initialise it
      if (this._resolved) {
        Object.assign(this._resolved, this.initPlayback(this._resolved.keyframes));
      }
    }
    initPlayback(keyframes$1) {
      const { type = "keyframes", repeat = 0, repeatDelay = 0, repeatType, velocity = 0 } = this.options;
      const generatorFactory = isGenerator$1(type) ? type : generators[type] || keyframes;
      /**
       * If our generator doesn't support mixing numbers, we need to replace keyframes with
       * [0, 100] and then make a function that maps that to the actual keyframes.
       *
       * 100 is chosen instead of 1 as it works nicer with spring animations.
       */ let mapPercentToKeyframes;
      let mirroredGenerator;
      if (process.env.NODE_ENV !== "production" && generatorFactory !== keyframes) {
        invariant$1(
          keyframes$1.length <= 2,
          `Only two keyframes currently supported with spring and inertia animations. Trying to animate ${keyframes$1}`,
        );
      }
      if (generatorFactory !== keyframes && typeof keyframes$1[0] !== "number") {
        mapPercentToKeyframes = pipe(percentToProgress, mix(keyframes$1[0], keyframes$1[1]));
        keyframes$1 = [0, 100];
      }
      const generator = generatorFactory({
        ...this.options,
        keyframes: keyframes$1,
      });
      /**
       * If we have a mirror repeat type we need to create a second generator that outputs the
       * mirrored (not reversed) animation and later ping pong between the two generators.
       */ if (repeatType === "mirror") {
        mirroredGenerator = generatorFactory({
          ...this.options,
          keyframes: [...keyframes$1].reverse(),
          velocity: -velocity,
        });
      }
      /**
       * If duration is undefined and we have repeat options,
       * we need to calculate a duration from the generator.
       *
       * We set it to the generator itself to cache the duration.
       * Any timeline resolver will need to have already precalculated
       * the duration by this step.
       */ if (generator.calculatedDuration === null) {
        generator.calculatedDuration = calcGeneratorDuration(generator);
      }
      const { calculatedDuration } = generator;
      const resolvedDuration = calculatedDuration + repeatDelay;
      const totalDuration = resolvedDuration * (repeat + 1) - repeatDelay;
      return {
        generator,
        mirroredGenerator,
        mapPercentToKeyframes,
        calculatedDuration,
        resolvedDuration,
        totalDuration,
      };
    }
    onPostResolved() {
      const { autoplay = true } = this.options;
      this.play();
      if (this.pendingPlayState === "paused" || !autoplay) {
        this.pause();
      } else {
        this.state = this.pendingPlayState;
      }
    }
    tick(timestamp, sample = false) {
      const { resolved } = this;
      // If the animations has failed to resolve, return the final keyframe.
      if (!resolved) {
        const { keyframes: keyframes1 } = this.options;
        return {
          done: true,
          value: keyframes1[keyframes1.length - 1],
        };
      }
      const {
        finalKeyframe,
        generator,
        mirroredGenerator,
        mapPercentToKeyframes,
        keyframes: keyframes2,
        calculatedDuration,
        totalDuration,
        resolvedDuration,
      } = resolved;
      if (this.startTime === null) return generator.next(0);
      const { delay, repeat, repeatType, repeatDelay, onUpdate } = this.options;
      /**
       * requestAnimationFrame timestamps can come through as lower than
       * the startTime as set by performance.now(). Here we prevent this,
       * though in the future it could be possible to make setting startTime
       * a pending operation that gets resolved here.
       */ if (this.speed > 0) {
        this.startTime = Math.min(this.startTime, timestamp);
      } else if (this.speed < 0) {
        this.startTime = Math.min(timestamp - totalDuration / this.speed, this.startTime);
      }
      // Update currentTime
      if (sample) {
        this.currentTime = timestamp;
      } else if (this.holdTime !== null) {
        this.currentTime = this.holdTime;
      } else {
        // Rounding the time because floating point arithmetic is not always accurate, e.g. 3000.367 - 1000.367 =
        // 2000.0000000000002. This is a problem when we are comparing the currentTime with the duration, for
        // example.
        this.currentTime = Math.round(timestamp - this.startTime) * this.speed;
      }
      // Rebase on delay
      const timeWithoutDelay = this.currentTime - delay * (this.speed >= 0 ? 1 : -1);
      const isInDelayPhase = this.speed >= 0 ? timeWithoutDelay < 0 : timeWithoutDelay > totalDuration;
      this.currentTime = Math.max(timeWithoutDelay, 0);
      // If this animation has finished, set the current time  to the total duration.
      if (this.state === "finished" && this.holdTime === null) {
        this.currentTime = totalDuration;
      }
      let elapsed = this.currentTime;
      let frameGenerator = generator;
      if (repeat) {
        /**
         * Get the current progress (0-1) of the animation. If t is >
         * than duration we'll get values like 2.5 (midway through the
         * third iteration)
         */ const progress = Math.min(this.currentTime, totalDuration) / resolvedDuration;
        /**
         * Get the current iteration (0 indexed). For instance the floor of
         * 2.5 is 2.
         */ let currentIteration = Math.floor(progress);
        /**
         * Get the current progress of the iteration by taking the remainder
         * so 2.5 is 0.5 through iteration 2
         */ let iterationProgress = progress % 1.0;
        /**
         * If iteration progress is 1 we count that as the end
         * of the previous iteration.
         */ if (!iterationProgress && progress >= 1) {
          iterationProgress = 1;
        }
        iterationProgress === 1 && currentIteration--;
        currentIteration = Math.min(currentIteration, repeat + 1);
        /**
         * Reverse progress if we're not running in "normal" direction
         */ const isOddIteration = Boolean(currentIteration % 2);
        if (isOddIteration) {
          if (repeatType === "reverse") {
            iterationProgress = 1 - iterationProgress;
            if (repeatDelay) {
              iterationProgress -= repeatDelay / resolvedDuration;
            }
          } else if (repeatType === "mirror") {
            frameGenerator = mirroredGenerator;
          }
        }
        elapsed = clamp(0, 1, iterationProgress) * resolvedDuration;
      }
      /**
       * If we're in negative time, set state as the initial keyframe.
       * This prevents delay: x, duration: 0 animations from finishing
       * instantly.
       */ const state = isInDelayPhase
        ? {
            done: false,
            value: keyframes2[0],
          }
        : frameGenerator.next(elapsed);
      if (mapPercentToKeyframes) {
        state.value = mapPercentToKeyframes(state.value);
      }
      let { done } = state;
      if (!isInDelayPhase && calculatedDuration !== null) {
        done = this.speed >= 0 ? this.currentTime >= totalDuration : this.currentTime <= 0;
      }
      const isAnimationFinished =
        this.holdTime === null && (this.state === "finished" || (this.state === "running" && done));
      if (isAnimationFinished && finalKeyframe !== undefined) {
        state.value = getFinalKeyframe$1(keyframes2, this.options, finalKeyframe);
      }
      if (onUpdate) {
        onUpdate(state.value);
      }
      if (isAnimationFinished) {
        this.finish();
      }
      return state;
    }
    get duration() {
      const { resolved } = this;
      return resolved ? millisecondsToSeconds$1(resolved.calculatedDuration) : 0;
    }
    get time() {
      return millisecondsToSeconds$1(this.currentTime);
    }
    set time(newTime) {
      newTime = secondsToMilliseconds$1(newTime);
      this.currentTime = newTime;
      if (this.holdTime !== null || this.speed === 0) {
        this.holdTime = newTime;
      } else if (this.driver) {
        this.startTime = this.driver.now() - newTime / this.speed;
      }
    }
    get speed() {
      return this.playbackSpeed;
    }
    set speed(newSpeed) {
      const hasChanged = this.playbackSpeed !== newSpeed;
      this.playbackSpeed = newSpeed;
      if (hasChanged) {
        this.time = millisecondsToSeconds$1(this.currentTime);
      }
    }
    play() {
      if (!this.resolver.isScheduled) {
        this.resolver.resume();
      }
      if (!this._resolved) {
        this.pendingPlayState = "running";
        return;
      }
      if (this.isStopped) return;
      const { driver = frameloopDriver, onPlay, startTime } = this.options;
      if (!this.driver) {
        this.driver = driver((timestamp) => this.tick(timestamp));
      }
      onPlay && onPlay();
      const now = this.driver.now();
      if (this.holdTime !== null) {
        this.startTime = now - this.holdTime;
      } else if (!this.startTime) {
        this.startTime = startTime !== null && startTime !== void 0 ? startTime : this.calcStartTime();
      } else if (this.state === "finished") {
        this.startTime = now;
      }
      if (this.state === "finished") {
        this.updateFinishedPromise();
      }
      this.cancelTime = this.startTime;
      this.holdTime = null;
      /**
       * Set playState to running only after we've used it in
       * the previous logic.
       */ this.state = "running";
      this.driver.start();
    }
    pause() {
      if (!this._resolved) {
        this.pendingPlayState = "paused";
        return;
      }
      this.state = "paused";
      var _currentTime;
      this.holdTime = (_currentTime = this.currentTime) !== null && _currentTime !== void 0 ? _currentTime : 0;
    }
    complete() {
      if (this.state !== "running") {
        this.play();
      }
      this.pendingPlayState = this.state = "finished";
      this.holdTime = null;
    }
    finish() {
      this.teardown();
      this.state = "finished";
      const { onComplete } = this.options;
      onComplete && onComplete();
    }
    cancel() {
      if (this.cancelTime !== null) {
        this.tick(this.cancelTime);
      }
      this.teardown();
      this.updateFinishedPromise();
    }
    teardown() {
      this.state = "idle";
      this.stopDriver();
      this.resolveFinishedPromise();
      this.updateFinishedPromise();
      this.startTime = this.cancelTime = null;
      this.resolver.cancel();
    }
    stopDriver() {
      if (!this.driver) return;
      this.driver.stop();
      this.driver = undefined;
    }
    sample(time) {
      this.startTime = 0;
      return this.tick(time, true);
    }
    get finished() {
      return this.currentFinishedPromise;
    }
    constructor(options) {
      super(options);
      /**
       * The time at which the animation was paused.
       */ this.holdTime = null;
      /**
       * The time at which the animation was cancelled.
       */ this.cancelTime = null;
      /**
       * The current time of the animation.
       */ this.currentTime = 0;
      /**
       * Playback speed as a factor. 0 would be stopped, -1 reverse and 2 double speed.
       */ this.playbackSpeed = 1;
      /**
       * The state of the animation to apply when the animation is resolved. This
       * allows calls to the public API to control the animation before it is resolved,
       * without us having to resolve it first.
       */ this.pendingPlayState = "running";
      /**
       * The time at which the animation was started.
       */ this.startTime = null;
      this.state = "idle";
      /**
       * This method is bound to the instance to fix a pattern where
       * animation.stop is returned as a reference from a useEffect.
       */ this.stop = () => {
        this.resolver.cancel();
        this.isStopped = true;
        if (this.state === "idle") return;
        this.teardown();
        const { onStop } = this.options;
        onStop && onStop();
      };
      const { name, motionValue, element, keyframes: keyframes3 } = this.options;
      const KeyframeResolver$1 =
        (element === null || element === void 0 ? void 0 : element.KeyframeResolver) || KeyframeResolver;
      const onResolved = (resolvedKeyframes, finalKeyframe) =>
        this.onKeyframesResolved(resolvedKeyframes, finalKeyframe);
      this.resolver = new KeyframeResolver$1(keyframes3, onResolved, name, motionValue, element);
      this.resolver.scheduleResolve();
    }
  };

  /**
   * A list of values that can be hardware-accelerated.
   */ const acceleratedValues = new Set(["opacity", "clipPath", "filter", "transform"]);

  const supportsWaapi = /*@__PURE__*/ memo$1(() => Object.hasOwnProperty.call(Element.prototype, "animate"));

  const cubicBezierAsString$1 = ([a, b, c, d]) => `cubic-bezier(${a}, ${b}, ${c}, ${d})`;
  const supportedWaapiEasing$1 = {
    linear: "linear",
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
    circIn: /*@__PURE__*/ cubicBezierAsString$1([0, 0.65, 0.55, 1]),
    circOut: /*@__PURE__*/ cubicBezierAsString$1([0.55, 0, 1, 0.45]),
    backIn: /*@__PURE__*/ cubicBezierAsString$1([0.31, 0.01, 0.66, -0.59]),
    backOut: /*@__PURE__*/ cubicBezierAsString$1([0.33, 1.53, 0.69, 0.99]),
  };

  function mapEasingToNativeEasing$1(easing, duration) {
    if (!easing) {
      return undefined;
    } else if (typeof easing === "function" && supportsLinearEasing$1()) {
      return generateLinearEasing$1(easing, duration);
    } else if (isBezierDefinition$1(easing)) {
      return cubicBezierAsString$1(easing);
    } else if (Array.isArray(easing)) {
      return easing.map(
        (segmentEasing) => mapEasingToNativeEasing$1(segmentEasing, duration) || supportedWaapiEasing$1.easeOut,
      );
    } else {
      return supportedWaapiEasing$1[easing];
    }
  }

  function startWaapiAnimation$1(
    element,
    valueName,
    keyframes,
    { delay = 0, duration = 300, repeat = 0, repeatType = "loop", ease = "easeInOut", times } = {},
    pseudoElement = undefined,
  ) {
    const keyframeOptions = {
      [valueName]: keyframes,
    };
    if (times) keyframeOptions.offset = times;
    const easing = mapEasingToNativeEasing$1(ease, duration);
    /**
     * If this is an easing array, apply to keyframes, not animation as a whole
     */ if (Array.isArray(easing)) keyframeOptions.easing = easing;
    const animation = element.animate(keyframeOptions, {
      delay,
      duration,
      easing: !Array.isArray(easing) ? easing : "linear",
      fill: "both",
      iterations: repeat + 1,
      direction: repeatType === "reverse" ? "alternate" : "normal",
      pseudoElement,
    });
    return animation;
  }

  function attachTimeline(animation, timeline) {
    animation.timeline = timeline;
    animation.onfinish = null;
  }

  function isWaapiSupportedEasing(easing) {
    return Boolean(
      (typeof easing === "function" && supportsLinearEasing$1()) ||
        !easing ||
        (typeof easing === "string" && (easing in supportedWaapiEasing$1 || supportsLinearEasing$1())) ||
        isBezierDefinition$1(easing) ||
        (Array.isArray(easing) && easing.every(isWaapiSupportedEasing)),
    );
  }

  /**
   * 10ms is chosen here as it strikes a balance between smooth
   * results (more than one keyframe per frame at 60fps) and
   * keyframe quantity.
   */ const sampleDelta = 10; //ms
  /**
   * Implement a practical max duration for keyframe generation
   * to prevent infinite loops
   */ const maxDuration = 20000;
  /**
   * Check if an animation can run natively via WAAPI or requires pregenerated keyframes.
   * WAAPI doesn't support spring or function easings so we run these as JS animation before
   * handing off.
   */ function requiresPregeneratedKeyframes(options) {
    return isGenerator$1(options.type) || options.type === "spring" || !isWaapiSupportedEasing(options.ease);
  }
  function pregenerateKeyframes(keyframes, options) {
    /**
     * Create a main-thread animation to pregenerate keyframes.
     * We sample this at regular intervals to generate keyframes that we then
     * linearly interpolate between.
     */ const sampleAnimation = new MainThreadAnimation({
      ...options,
      keyframes,
      repeat: 0,
      delay: 0,
      isGenerator: true,
    });
    let state = {
      done: false,
      value: keyframes[0],
    };
    const pregeneratedKeyframes = [];
    /**
     * Bail after 20 seconds of pre-generated keyframes as it's likely
     * we're heading for an infinite loop.
     */ let t = 0;
    while (!state.done && t < maxDuration) {
      state = sampleAnimation.sample(t);
      pregeneratedKeyframes.push(state.value);
      t += sampleDelta;
    }
    return {
      times: undefined,
      keyframes: pregeneratedKeyframes,
      duration: t - sampleDelta,
      ease: "linear",
    };
  }
  const unsupportedEasingFunctions = {
    anticipate,
    backInOut,
    circInOut,
  };
  function isUnsupportedEase(key) {
    return key in unsupportedEasingFunctions;
  }
  let AcceleratedAnimation = class AcceleratedAnimation extends BaseAnimation {
    initPlayback(keyframes, finalKeyframe) {
      let { duration = 300, times, ease, type, motionValue, name, startTime } = this.options;
      /**
       * If element has since been unmounted, return false to indicate
       * the animation failed to initialised.
       */ if (!motionValue.owner || !motionValue.owner.current) {
        return false;
      }
      /**
       * If the user has provided an easing function name that isn't supported
       * by WAAPI (like "anticipate"), we need to provide the corressponding
       * function. This will later get converted to a linear() easing function.
       */ if (typeof ease === "string" && supportsLinearEasing$1() && isUnsupportedEase(ease)) {
        ease = unsupportedEasingFunctions[ease];
      }
      /**
       * If this animation needs pre-generated keyframes then generate.
       */ if (requiresPregeneratedKeyframes(this.options)) {
        const { onComplete, onUpdate, motionValue, element, ...options } = this.options;
        const pregeneratedAnimation = pregenerateKeyframes(keyframes, options);
        keyframes = pregeneratedAnimation.keyframes;
        // If this is a very short animation, ensure we have
        // at least two keyframes to animate between as older browsers
        // can't animate between a single keyframe.
        if (keyframes.length === 1) {
          keyframes[1] = keyframes[0];
        }
        duration = pregeneratedAnimation.duration;
        times = pregeneratedAnimation.times;
        ease = pregeneratedAnimation.ease;
        type = "keyframes";
      }
      const animation = startWaapiAnimation$1(motionValue.owner.current, name, keyframes, {
        ...this.options,
        duration,
        times,
        ease,
      });
      // Override the browser calculated startTime with one synchronised to other JS
      // and WAAPI animations starting this event loop.
      animation.startTime = startTime !== null && startTime !== void 0 ? startTime : this.calcStartTime();
      if (this.pendingTimeline) {
        attachTimeline(animation, this.pendingTimeline);
        this.pendingTimeline = undefined;
      } else {
        /**
         * Prefer the `onfinish` prop as it's more widely supported than
         * the `finished` promise.
         *
         * Here, we synchronously set the provided MotionValue to the end
         * keyframe. If we didn't, when the WAAPI animation is finished it would
         * be removed from the element which would then revert to its old styles.
         */ animation.onfinish = () => {
          const { onComplete } = this.options;
          motionValue.set(getFinalKeyframe$1(keyframes, this.options, finalKeyframe));
          onComplete && onComplete();
          this.cancel();
          this.resolveFinishedPromise();
        };
      }
      return {
        animation,
        duration,
        times,
        type,
        ease,
        keyframes: keyframes,
      };
    }
    get duration() {
      const { resolved } = this;
      if (!resolved) return 0;
      const { duration } = resolved;
      return millisecondsToSeconds$1(duration);
    }
    get time() {
      const { resolved } = this;
      if (!resolved) return 0;
      const { animation } = resolved;
      return millisecondsToSeconds$1(animation.currentTime || 0);
    }
    set time(newTime) {
      const { resolved } = this;
      if (!resolved) return;
      const { animation } = resolved;
      animation.currentTime = secondsToMilliseconds$1(newTime);
    }
    get speed() {
      const { resolved } = this;
      if (!resolved) return 1;
      const { animation } = resolved;
      return animation.playbackRate;
    }
    get finished() {
      return this.resolved.animation.finished;
    }
    set speed(newSpeed) {
      const { resolved } = this;
      if (!resolved) return;
      const { animation } = resolved;
      animation.playbackRate = newSpeed;
    }
    get state() {
      const { resolved } = this;
      if (!resolved) return "idle";
      const { animation } = resolved;
      return animation.playState;
    }
    get startTime() {
      const { resolved } = this;
      if (!resolved) return null;
      const { animation } = resolved;
      // Coerce to number as TypeScript incorrectly types this
      // as CSSNumberish
      return animation.startTime;
    }
    /**
     * Replace the default DocumentTimeline with another AnimationTimeline.
     * Currently used for scroll animations.
     */ attachTimeline(timeline) {
      if (!this._resolved) {
        this.pendingTimeline = timeline;
      } else {
        const { resolved } = this;
        if (!resolved) return noop$1;
        const { animation } = resolved;
        attachTimeline(animation, timeline);
      }
      return noop$1;
    }
    play() {
      if (this.isStopped) return;
      const { resolved } = this;
      if (!resolved) return;
      const { animation } = resolved;
      if (animation.playState === "finished") {
        this.updateFinishedPromise();
      }
      animation.play();
    }
    pause() {
      const { resolved } = this;
      if (!resolved) return;
      const { animation } = resolved;
      animation.pause();
    }
    stop() {
      this.resolver.cancel();
      this.isStopped = true;
      if (this.state === "idle") return;
      this.resolveFinishedPromise();
      this.updateFinishedPromise();
      const { resolved } = this;
      if (!resolved) return;
      const { animation, keyframes, duration, type, ease, times } = resolved;
      if (animation.playState === "idle" || animation.playState === "finished") {
        return;
      }
      /**
       * WAAPI doesn't natively have any interruption capabilities.
       *
       * Rather than read commited styles back out of the DOM, we can
       * create a renderless JS animation and sample it twice to calculate
       * its current value, "previous" value, and therefore allow
       * Motion to calculate velocity for any subsequent animation.
       */ if (this.time) {
        const { motionValue, onUpdate, onComplete, element, ...options } = this.options;
        const sampleAnimation = new MainThreadAnimation({
          ...options,
          keyframes,
          duration,
          type,
          ease,
          times,
          isGenerator: true,
        });
        const sampleTime = secondsToMilliseconds$1(this.time);
        motionValue.setWithVelocity(
          sampleAnimation.sample(sampleTime - sampleDelta).value,
          sampleAnimation.sample(sampleTime).value,
          sampleDelta,
        );
      }
      const { onStop } = this.options;
      onStop && onStop();
      this.cancel();
    }
    complete() {
      const { resolved } = this;
      if (!resolved) return;
      resolved.animation.finish();
    }
    cancel() {
      const { resolved } = this;
      if (!resolved) return;
      resolved.animation.cancel();
    }
    static supports(options) {
      const { motionValue, name, repeatDelay, repeatType, damping, type } = options;
      if (!motionValue || !motionValue.owner || !(motionValue.owner.current instanceof HTMLElement)) {
        return false;
      }
      const { onUpdate, transformTemplate } = motionValue.owner.getProps();
      return (
        supportsWaapi() &&
        name &&
        acceleratedValues.has(name) &&
        (name !== "transform" || !transformTemplate) &&
        /**
         * If we're outputting values to onUpdate then we can't use WAAPI as there's
         * no way to read the value from WAAPI every frame.
         */ !onUpdate &&
        !repeatDelay &&
        repeatType !== "mirror" &&
        damping !== 0 &&
        type !== "inertia"
      );
    }
    constructor(options) {
      super(options);
      const { name, motionValue, element, keyframes } = this.options;
      this.resolver = new DOMKeyframesResolver(
        keyframes,
        (resolvedKeyframes, finalKeyframe) => this.onKeyframesResolved(resolvedKeyframes, finalKeyframe),
        name,
        motionValue,
        element,
      );
      this.resolver.scheduleResolve();
    }
  };

  const underDampedSpring = {
    type: "spring",
    stiffness: 500,
    damping: 25,
    restSpeed: 10,
  };
  const criticallyDampedSpring = (target) => ({
    type: "spring",
    stiffness: 550,
    damping: target === 0 ? 2 * Math.sqrt(550) : 30,
    restSpeed: 10,
  });
  const keyframesTransition = {
    type: "keyframes",
    duration: 0.8,
  };
  /**
   * Default easing curve is a slightly shallower version of
   * the default browser easing curve.
   */ const ease = {
    type: "keyframes",
    ease: [0.25, 0.1, 0.35, 1],
    duration: 0.3,
  };
  const getDefaultTransition = (valueKey, { keyframes }) => {
    if (keyframes.length > 2) {
      return keyframesTransition;
    } else if (transformProps.has(valueKey)) {
      return valueKey.startsWith("scale") ? criticallyDampedSpring(keyframes[1]) : underDampedSpring;
    }
    return ease;
  };

  /**
   * Decide whether a transition is defined on a given Transition.
   * This filters out orchestration options and returns true
   * if any options are left.
   */ function isTransitionDefined({
    when,
    delay: _delay,
    delayChildren,
    staggerChildren,
    staggerDirection,
    repeat,
    repeatType,
    repeatDelay,
    from,
    elapsed,
    ...transition
  }) {
    return !!Object.keys(transition).length;
  }

  function getValueTransition$1(transition, key) {
    var ref, ref1;
    return (ref1 =
      (ref = transition === null || transition === void 0 ? void 0 : transition[key]) !== null && ref !== void 0
        ? ref
        : transition === null || transition === void 0
          ? void 0
          : transition["default"]) !== null && ref1 !== void 0
      ? ref1
      : transition;
  }

  const supportsScrollTimeline$1 = /* @__PURE__ */ memo$1(() => window.ScrollTimeline !== undefined);

  let GroupAnimation$1 = class GroupAnimation {
    get finished() {
      return Promise.all(this.animations.map((animation) => animation.finished));
    }
    /**
     * TODO: Filter out cancelled or stopped animations before returning
     */ getAll(propName) {
      return this.animations[0][propName];
    }
    setAll(propName, newValue) {
      for (let i = 0; i < this.animations.length; i++) {
        this.animations[i][propName] = newValue;
      }
    }
    attachTimeline(timeline, fallback) {
      const subscriptions = this.animations.map((animation) => {
        if (supportsScrollTimeline$1() && animation.attachTimeline) {
          return animation.attachTimeline(timeline);
        } else if (typeof fallback === "function") {
          return fallback(animation);
        }
      });
      return () => {
        subscriptions.forEach((cancel, i) => {
          cancel && cancel();
          this.animations[i].stop();
        });
      };
    }
    get time() {
      return this.getAll("time");
    }
    set time(time) {
      this.setAll("time", time);
    }
    get speed() {
      return this.getAll("speed");
    }
    set speed(speed) {
      this.setAll("speed", speed);
    }
    get startTime() {
      return this.getAll("startTime");
    }
    get duration() {
      let max = 0;
      for (let i = 0; i < this.animations.length; i++) {
        max = Math.max(max, this.animations[i].duration);
      }
      return max;
    }
    runAll(methodName) {
      this.animations.forEach((controls) => controls[methodName]());
    }
    flatten() {
      this.runAll("flatten");
    }
    play() {
      this.runAll("play");
    }
    pause() {
      this.runAll("pause");
    }
    cancel() {
      this.runAll("cancel");
    }
    complete() {
      this.runAll("complete");
    }
    constructor(animations) {
      // Bound to accomodate common `return animation.stop` pattern
      this.stop = () => this.runAll("stop");
      this.animations = animations.filter(Boolean);
    }
  };

  let GroupAnimationWithThen = class GroupAnimationWithThen extends GroupAnimation$1 {
    then(onResolve, _onReject) {
      return this.finished.finally(onResolve).then(() => {});
    }
  };

  const animateMotionValue =
    (name, value, target, transition = {}, element, isHandoff) =>
    (onComplete) => {
      const valueTransition = getValueTransition$1(transition, name) || {};
      /**
       * Most transition values are currently completely overwritten by value-specific
       * transitions. In the future it'd be nicer to blend these transitions. But for now
       * delay actually does inherit from the root transition if not value-specific.
       */ const delay = valueTransition.delay || transition.delay || 0;
      /**
       * Elapsed isn't a public transition option but can be passed through from
       * optimized appear effects in milliseconds.
       */ let { elapsed = 0 } = transition;
      elapsed = elapsed - secondsToMilliseconds$1(delay);
      let options = {
        keyframes: Array.isArray(target) ? target : [null, target],
        ease: "easeOut",
        velocity: value.getVelocity(),
        ...valueTransition,
        delay: -elapsed,
        onUpdate: (v) => {
          value.set(v);
          valueTransition.onUpdate && valueTransition.onUpdate(v);
        },
        onComplete: () => {
          onComplete();
          valueTransition.onComplete && valueTransition.onComplete();
        },
        name,
        motionValue: value,
        element: isHandoff ? undefined : element,
      };
      /**
       * If there's no transition defined for this value, we can generate
       * unique transition settings for this value.
       */ if (!isTransitionDefined(valueTransition)) {
        options = {
          ...options,
          ...getDefaultTransition(name, options),
        };
      }
      /**
       * Both WAAPI and our internal animation functions use durations
       * as defined by milliseconds, while our external API defines them
       * as seconds.
       */ if (options.duration) {
        options.duration = secondsToMilliseconds$1(options.duration);
      }
      if (options.repeatDelay) {
        options.repeatDelay = secondsToMilliseconds$1(options.repeatDelay);
      }
      if (options.from !== undefined) {
        options.keyframes[0] = options.from;
      }
      let shouldSkip = false;
      if (options.type === false || (options.duration === 0 && !options.repeatDelay)) {
        options.duration = 0;
        if (options.delay === 0) {
          shouldSkip = true;
        }
      }
      /**
       * If the transition type or easing has been explicitly set by the user
       * then we don't want to allow flattening the animation.
       */ options.allowFlatten = !valueTransition.type && !valueTransition.ease;
      /**
       * If we can or must skip creating the animation, and apply only
       * the final keyframe, do so. We also check once keyframes are resolved but
       * this early check prevents the need to create an animation at all.
       */ if (shouldSkip && !isHandoff && value.get() !== undefined) {
        const finalKeyframe = getFinalKeyframe$1(options.keyframes, valueTransition);
        if (finalKeyframe !== undefined) {
          frame.update(() => {
            options.onUpdate(finalKeyframe);
            options.onComplete();
          });
          // We still want to return some animation controls here rather
          // than returning undefined
          return new GroupAnimationWithThen([]);
        }
      }
      /**
       * Animate via WAAPI if possible. If this is a handoff animation, the optimised animation will be running via
       * WAAPI. Therefore, this animation must be JS to ensure it runs "under" the
       * optimised animation.
       */ if (!isHandoff && AcceleratedAnimation.supports(options)) {
        return new AcceleratedAnimation(options);
      } else {
        return new MainThreadAnimation(options);
      }
    };
  /**
   * Decide whether we should block this animation. Previously, we achieved this
   * just by checking whether the key was listed in protectedKeys, but this
   * posed problems if an animation was triggered by afterChildren and protectedKeys
   * had been set to true in the meantime.
   */ function shouldBlockAnimation({ protectedKeys, needsAnimating }, key) {
    const shouldBlock = protectedKeys.hasOwnProperty(key) && needsAnimating[key] !== true;
    needsAnimating[key] = false;
    return shouldBlock;
  }
  function animateTarget(visualElement, targetAndTransition, { delay = 0, transitionOverride, type } = {}) {
    let { transition = visualElement.getDefaultTransition(), transitionEnd, ...target } = targetAndTransition;
    if (transitionOverride) transition = transitionOverride;
    const animations = [];
    const animationTypeState = type && visualElement.animationState && visualElement.animationState.getState()[type];
    for (const key in target) {
      var _key;
      const value = visualElement.getValue(
        key,
        (_key = visualElement.latestValues[key]) !== null && _key !== void 0 ? _key : null,
      );
      const valueTarget = target[key];
      if (valueTarget === undefined || (animationTypeState && shouldBlockAnimation(animationTypeState, key))) {
        continue;
      }
      const valueTransition = {
        delay,
        ...getValueTransition$1(transition || {}, key),
      };
      /**
       * If this is the first time a value is being animated, check
       * to see if we're handling off from an existing animation.
       */ let isHandoff = false;
      if (window.MotionHandoffAnimation) {
        const appearId = getOptimisedAppearId(visualElement);
        if (appearId) {
          const startTime = window.MotionHandoffAnimation(appearId, key, frame);
          if (startTime !== null) {
            valueTransition.startTime = startTime;
            isHandoff = true;
          }
        }
      }
      addValueToWillChange(visualElement, key);
      value.start(
        animateMotionValue(
          key,
          value,
          valueTarget,
          visualElement.shouldReduceMotion && positionalKeys.has(key)
            ? {
                type: false,
              }
            : valueTransition,
          visualElement,
          isHandoff,
        ),
      );
      const animation = value.animation;
      if (animation) {
        animations.push(animation);
      }
    }
    if (transitionEnd) {
      Promise.all(animations).then(() => {
        frame.update(() => {
          transitionEnd && setTarget(visualElement, transitionEnd);
        });
      });
    }
    return animations;
  }

  function isSVGElement(element) {
    return element instanceof SVGElement && element.tagName !== "svg";
  }

  const createAxis = () => ({
    min: 0,
    max: 0,
  });
  const createBox = () => ({
    x: createAxis(),
    y: createAxis(),
  });
  const featureProps = {
    animation: ["animate", "variants", "whileHover", "whileTap", "exit", "whileInView", "whileFocus", "whileDrag"],
    exit: ["exit"],
    drag: ["drag", "dragControls"],
    focus: ["whileFocus"],
    hover: ["whileHover", "onHoverStart", "onHoverEnd"],
    tap: ["whileTap", "onTap", "onTapStart", "onTapCancel"],
    pan: ["onPan", "onPanStart", "onPanSessionStart", "onPanEnd"],
    inView: ["whileInView", "onViewportEnter", "onViewportLeave"],
    layout: ["layout", "layoutId"],
  };
  const featureDefinitions = {};
  for (const key in featureProps) {
    featureDefinitions[key] = {
      isEnabled: (props) => featureProps[key].some((name) => !!props[name]),
    };
  }

  const isBrowser = typeof window !== "undefined";

  // Does this device prefer reduced motion? Returns `null` server-side.
  const prefersReducedMotion = {
    current: null,
  };
  const hasReducedMotionListener = {
    current: false,
  };

  function initPrefersReducedMotion() {
    hasReducedMotionListener.current = true;
    if (!isBrowser) return;
    if (window.matchMedia) {
      const motionMediaQuery = window.matchMedia("(prefers-reduced-motion)");
      const setReducedMotionPreferences = () => (prefersReducedMotion.current = motionMediaQuery.matches);
      motionMediaQuery.addListener(setReducedMotionPreferences);
      setReducedMotionPreferences();
    } else {
      prefersReducedMotion.current = false;
    }
  }

  /**
   * A list of all ValueTypes
   */ const valueTypes = [...dimensionValueTypes, color, complex];
  /**
   * Tests a value against the list of ValueTypes
   */ const findValueType = (v) => valueTypes.find(testValueType(v));
  function isAnimationControls(v) {
    return v !== null && typeof v === "object" && typeof v.start === "function";
  }

  /**
   * Decides if the supplied variable is variant label
   */ function isVariantLabel(v) {
    return typeof v === "string" || Array.isArray(v);
  }

  const variantPriorityOrder = ["animate", "whileInView", "whileFocus", "whileHover", "whileTap", "whileDrag", "exit"];
  const variantProps = ["initial", ...variantPriorityOrder];

  function isControllingVariants(props) {
    return isAnimationControls(props.animate) || variantProps.some((name) => isVariantLabel(props[name]));
  }
  function isVariantNode(props) {
    return Boolean(isControllingVariants(props) || props.variants);
  }

  function updateMotionValuesFromProps(element, next, prev) {
    for (const key in next) {
      const nextValue = next[key];
      const prevValue = prev[key];
      if (isMotionValue(nextValue)) {
        /**
         * If this is a motion value found in props or style, we want to add it
         * to our visual element's motion value map.
         */ element.addValue(key, nextValue);
        /**
         * Check the version of the incoming motion value with this version
         * and warn against mismatches.
         */ if (process.env.NODE_ENV === "development") {
          warnOnce(
            nextValue.version === "12.7.4",
            `Attempting to mix Motion versions ${nextValue.version} with 12.7.4 may not work as expected.`,
          );
        }
      } else if (isMotionValue(prevValue)) {
        /**
         * If we're swapping from a motion value to a static value,
         * create a new motion value from that
         */ element.addValue(
          key,
          motionValue(nextValue, {
            owner: element,
          }),
        );
      } else if (prevValue !== nextValue) {
        /**
         * If this is a flat value that has changed, update the motion value
         * or create one if it doesn't exist. We only want to do this if we're
         * not handling the value with our animation state.
         */ if (element.hasValue(key)) {
          const existingValue = element.getValue(key);
          if (existingValue.liveStyle === true) {
            existingValue.jump(nextValue);
          } else if (!existingValue.hasAnimated) {
            existingValue.set(nextValue);
          }
        } else {
          const latestValue = element.getStaticValue(key);
          element.addValue(
            key,
            motionValue(latestValue !== undefined ? latestValue : nextValue, {
              owner: element,
            }),
          );
        }
      }
    }
    // Handle removed values
    for (const key1 in prev) {
      if (next[key1] === undefined) element.removeValue(key1);
    }
    return next;
  }

  const propEventHandlers = [
    "AnimationStart",
    "AnimationComplete",
    "Update",
    "BeforeLayoutMeasure",
    "LayoutMeasure",
    "LayoutAnimationStart",
    "LayoutAnimationComplete",
  ];
  /**
   * A VisualElement is an imperative abstraction around UI elements such as
   * HTMLElement, SVGElement, Three.Object3D etc.
   */ let VisualElement = class VisualElement {
    /**
     * This method takes React props and returns found MotionValues. For example, HTML
     * MotionValues will be found within the style prop, whereas for Three.js within attribute arrays.
     *
     * This isn't an abstract method as it needs calling in the constructor, but it is
     * intended to be one.
     */ scrapeMotionValuesFromProps(_props, _prevProps, _visualElement) {
      return {};
    }
    mount(instance) {
      this.current = instance;
      visualElementStore.set(instance, this);
      if (this.projection && !this.projection.instance) {
        this.projection.mount(instance);
      }
      if (this.parent && this.isVariantNode && !this.isControllingVariants) {
        this.removeFromVariantTree = this.parent.addVariantChild(this);
      }
      this.values.forEach((value, key) => this.bindToMotionValue(key, value));
      if (!hasReducedMotionListener.current) {
        initPrefersReducedMotion();
      }
      this.shouldReduceMotion =
        this.reducedMotionConfig === "never"
          ? false
          : this.reducedMotionConfig === "always"
            ? true
            : prefersReducedMotion.current;
      if (process.env.NODE_ENV !== "production") {
        warnOnce(
          this.shouldReduceMotion !== true,
          "You have Reduced Motion enabled on your device. Animations may not appear as expected.",
        );
      }
      if (this.parent) this.parent.children.add(this);
      this.update(this.props, this.presenceContext);
    }
    unmount() {
      this.projection && this.projection.unmount();
      cancelFrame(this.notifyUpdate);
      cancelFrame(this.render);
      this.valueSubscriptions.forEach((remove) => remove());
      this.valueSubscriptions.clear();
      this.removeFromVariantTree && this.removeFromVariantTree();
      this.parent && this.parent.children.delete(this);
      for (const key in this.events) {
        this.events[key].clear();
      }
      for (const key1 in this.features) {
        const feature = this.features[key1];
        if (feature) {
          feature.unmount();
          feature.isMounted = false;
        }
      }
      this.current = null;
    }
    bindToMotionValue(key, value) {
      if (this.valueSubscriptions.has(key)) {
        this.valueSubscriptions.get(key)();
      }
      const valueIsTransform = transformProps.has(key);
      if (valueIsTransform && this.onBindTransform) {
        this.onBindTransform();
      }
      const removeOnChange = value.on("change", (latestValue) => {
        this.latestValues[key] = latestValue;
        this.props.onUpdate && frame.preRender(this.notifyUpdate);
        if (valueIsTransform && this.projection) {
          this.projection.isTransformDirty = true;
        }
      });
      const removeOnRenderRequest = value.on("renderRequest", this.scheduleRender);
      let removeSyncCheck;
      if (window.MotionCheckAppearSync) {
        removeSyncCheck = window.MotionCheckAppearSync(this, key, value);
      }
      this.valueSubscriptions.set(key, () => {
        removeOnChange();
        removeOnRenderRequest();
        if (removeSyncCheck) removeSyncCheck();
        if (value.owner) value.stop();
      });
    }
    sortNodePosition(other) {
      /**
       * If these nodes aren't even of the same type we can't compare their depth.
       */ if (!this.current || !this.sortInstanceNodePosition || this.type !== other.type) {
        return 0;
      }
      return this.sortInstanceNodePosition(this.current, other.current);
    }
    updateFeatures() {
      let key = "animation";
      for (key in featureDefinitions) {
        const featureDefinition = featureDefinitions[key];
        if (!featureDefinition) continue;
        const { isEnabled, Feature: FeatureConstructor } = featureDefinition;
        /**
         * If this feature is enabled but not active, make a new instance.
         */ if (!this.features[key] && FeatureConstructor && isEnabled(this.props)) {
          this.features[key] = new FeatureConstructor(this);
        }
        /**
         * If we have a feature, mount or update it.
         */ if (this.features[key]) {
          const feature = this.features[key];
          if (feature.isMounted) {
            feature.update();
          } else {
            feature.mount();
            feature.isMounted = true;
          }
        }
      }
    }
    triggerBuild() {
      this.build(this.renderState, this.latestValues, this.props);
    }
    /**
     * Measure the current viewport box with or without transforms.
     * Only measures axis-aligned boxes, rotate and skew must be manually
     * removed with a re-render to work.
     */ measureViewportBox() {
      return this.current ? this.measureInstanceViewportBox(this.current, this.props) : createBox();
    }
    getStaticValue(key) {
      return this.latestValues[key];
    }
    setStaticValue(key, value) {
      this.latestValues[key] = value;
    }
    /**
     * Update the provided props. Ensure any newly-added motion values are
     * added to our map, old ones removed, and listeners updated.
     */ update(props, presenceContext) {
      if (props.transformTemplate || this.props.transformTemplate) {
        this.scheduleRender();
      }
      this.prevProps = this.props;
      this.props = props;
      this.prevPresenceContext = this.presenceContext;
      this.presenceContext = presenceContext;
      /**
       * Update prop event handlers ie onAnimationStart, onAnimationComplete
       */ for (let i = 0; i < propEventHandlers.length; i++) {
        const key = propEventHandlers[i];
        if (this.propEventSubscriptions[key]) {
          this.propEventSubscriptions[key]();
          delete this.propEventSubscriptions[key];
        }
        const listenerName = "on" + key;
        const listener = props[listenerName];
        if (listener) {
          this.propEventSubscriptions[key] = this.on(key, listener);
        }
      }
      this.prevMotionValues = updateMotionValuesFromProps(
        this,
        this.scrapeMotionValuesFromProps(props, this.prevProps, this),
        this.prevMotionValues,
      );
      if (this.handleChildMotionValue) {
        this.handleChildMotionValue();
      }
      this.onUpdate && this.onUpdate(this);
    }
    getProps() {
      return this.props;
    }
    /**
     * Returns the variant definition with a given name.
     */ getVariant(name) {
      return this.props.variants ? this.props.variants[name] : undefined;
    }
    /**
     * Returns the defined default transition on this component.
     */ getDefaultTransition() {
      return this.props.transition;
    }
    getTransformPagePoint() {
      return this.props.transformPagePoint;
    }
    getClosestVariantNode() {
      return this.isVariantNode ? this : this.parent ? this.parent.getClosestVariantNode() : undefined;
    }
    /**
     * Add a child visual element to our set of children.
     */ addVariantChild(child) {
      const closestVariantNode = this.getClosestVariantNode();
      if (closestVariantNode) {
        closestVariantNode.variantChildren && closestVariantNode.variantChildren.add(child);
        return () => closestVariantNode.variantChildren.delete(child);
      }
    }
    /**
     * Add a motion value and bind it to this visual element.
     */ addValue(key, value) {
      // Remove existing value if it exists
      const existingValue = this.values.get(key);
      if (value !== existingValue) {
        if (existingValue) this.removeValue(key);
        this.bindToMotionValue(key, value);
        this.values.set(key, value);
        this.latestValues[key] = value.get();
      }
    }
    /**
     * Remove a motion value and unbind any active subscriptions.
     */ removeValue(key) {
      this.values.delete(key);
      const unsubscribe = this.valueSubscriptions.get(key);
      if (unsubscribe) {
        unsubscribe();
        this.valueSubscriptions.delete(key);
      }
      delete this.latestValues[key];
      this.removeValueFromRenderState(key, this.renderState);
    }
    /**
     * Check whether we have a motion value for this key
     */ hasValue(key) {
      return this.values.has(key);
    }
    getValue(key, defaultValue) {
      if (this.props.values && this.props.values[key]) {
        return this.props.values[key];
      }
      let value = this.values.get(key);
      if (value === undefined && defaultValue !== undefined) {
        value = motionValue(defaultValue === null ? undefined : defaultValue, {
          owner: this,
        });
        this.addValue(key, value);
      }
      return value;
    }
    /**
     * If we're trying to animate to a previously unencountered value,
     * we need to check for it in our state and as a last resort read it
     * directly from the instance (which might have performance implications).
     */ readValue(key, target) {
      var ref;
      let value =
        this.latestValues[key] !== undefined || !this.current
          ? this.latestValues[key]
          : (ref = this.getBaseTargetFromProps(this.props, key)) !== null && ref !== void 0
            ? ref
            : this.readValueFromInstance(this.current, key, this.options);
      if (value !== undefined && value !== null) {
        if (typeof value === "string" && (isNumericalString(value) || isZeroValueString(value))) {
          // If this is a number read as a string, ie "0" or "200", convert it to a number
          value = parseFloat(value);
        } else if (!findValueType(value) && complex.test(target)) {
          value = getAnimatableNone(key, target);
        }
        this.setBaseTarget(key, isMotionValue(value) ? value.get() : value);
      }
      return isMotionValue(value) ? value.get() : value;
    }
    /**
     * Set the base target to later animate back to. This is currently
     * only hydrated on creation and when we first read a value.
     */ setBaseTarget(key, value) {
      this.baseTarget[key] = value;
    }
    /**
     * Find the base target for a value thats been removed from all animation
     * props.
     */ getBaseTarget(key) {
      const { initial } = this.props;
      let valueFromInitial;
      if (typeof initial === "string" || typeof initial === "object") {
        var ref;
        const variant = resolveVariantFromProps(
          this.props,
          initial,
          (ref = this.presenceContext) === null || ref === void 0 ? void 0 : ref.custom,
        );
        if (variant) {
          valueFromInitial = variant[key];
        }
      }
      /**
       * If this value still exists in the current initial variant, read that.
       */ if (initial && valueFromInitial !== undefined) {
        return valueFromInitial;
      }
      /**
       * Alternatively, if this VisualElement config has defined a getBaseTarget
       * so we can read the value from an alternative source, try that.
       */ const target = this.getBaseTargetFromProps(this.props, key);
      if (target !== undefined && !isMotionValue(target)) return target;
      /**
       * If the value was initially defined on initial, but it doesn't any more,
       * return undefined. Otherwise return the value as initially read from the DOM.
       */ return this.initialValues[key] !== undefined && valueFromInitial === undefined
        ? undefined
        : this.baseTarget[key];
    }
    on(eventName, callback) {
      if (!this.events[eventName]) {
        this.events[eventName] = new SubscriptionManager();
      }
      return this.events[eventName].add(callback);
    }
    notify(eventName, ...args) {
      if (this.events[eventName]) {
        this.events[eventName].notify(...args);
      }
    }
    constructor(
      { parent, props, presenceContext, reducedMotionConfig, blockInitialAnimation, visualState },
      options = {},
    ) {
      /**
       * A reference to the current underlying Instance, e.g. a HTMLElement
       * or Three.Mesh etc.
       */ this.current = null;
      /**
       * A set containing references to this VisualElement's children.
       */ this.children = new Set();
      /**
       * Determine what role this visual element should take in the variant tree.
       */ this.isVariantNode = false;
      this.isControllingVariants = false;
      /**
       * Decides whether this VisualElement should animate in reduced motion
       * mode.
       *
       * TODO: This is currently set on every individual VisualElement but feels
       * like it could be set globally.
       */ this.shouldReduceMotion = null;
      /**
       * A map of all motion values attached to this visual element. Motion
       * values are source of truth for any given animated value. A motion
       * value might be provided externally by the component via props.
       */ this.values = new Map();
      this.KeyframeResolver = KeyframeResolver;
      /**
       * Cleanup functions for active features (hover/tap/exit etc)
       */ this.features = {};
      /**
       * A map of every subscription that binds the provided or generated
       * motion values onChange listeners to this visual element.
       */ this.valueSubscriptions = new Map();
      /**
       * A reference to the previously-provided motion values as returned
       * from scrapeMotionValuesFromProps. We use the keys in here to determine
       * if any motion values need to be removed after props are updated.
       */ this.prevMotionValues = {};
      /**
       * An object containing a SubscriptionManager for each active event.
       */ this.events = {};
      /**
       * An object containing an unsubscribe function for each prop event subscription.
       * For example, every "Update" event can have multiple subscribers via
       * VisualElement.on(), but only one of those can be defined via the onUpdate prop.
       */ this.propEventSubscriptions = {};
      this.notifyUpdate = () => this.notify("Update", this.latestValues);
      this.render = () => {
        if (!this.current) return;
        this.triggerBuild();
        this.renderInstance(this.current, this.renderState, this.props.style, this.projection);
      };
      this.renderScheduledAt = 0.0;
      this.scheduleRender = () => {
        const now = time.now();
        if (this.renderScheduledAt < now) {
          this.renderScheduledAt = now;
          frame.render(this.render, false, true);
        }
      };
      const { latestValues, renderState, onUpdate } = visualState;
      this.onUpdate = onUpdate;
      this.latestValues = latestValues;
      this.baseTarget = {
        ...latestValues,
      };
      this.initialValues = props.initial
        ? {
            ...latestValues,
          }
        : {};
      this.renderState = renderState;
      this.parent = parent;
      this.props = props;
      this.presenceContext = presenceContext;
      this.depth = parent ? parent.depth + 1 : 0;
      this.reducedMotionConfig = reducedMotionConfig;
      this.options = options;
      this.blockInitialAnimation = Boolean(blockInitialAnimation);
      this.isControllingVariants = isControllingVariants(props);
      this.isVariantNode = isVariantNode(props);
      if (this.isVariantNode) {
        this.variantChildren = new Set();
      }
      this.manuallyAnimateOnMount = Boolean(parent && parent.current);
      /**
       * Any motion values that are provided to the element when created
       * aren't yet bound to the element, as this would technically be impure.
       * However, we iterate through the motion values and set them to the
       * initial values for this component.
       *
       * TODO: This is impure and we should look at changing this to run on mount.
       * Doing so will break some tests but this isn't necessarily a breaking change,
       * more a reflection of the test.
       */ const { willChange, ...initialMotionValues } = this.scrapeMotionValuesFromProps(props, {}, this);
      for (const key in initialMotionValues) {
        const value = initialMotionValues[key];
        if (latestValues[key] !== undefined && isMotionValue(value)) {
          value.set(latestValues[key], false);
        }
      }
    }
  };

  let DOMVisualElement = class DOMVisualElement extends VisualElement {
    sortInstanceNodePosition(a, b) {
      /**
       * compareDocumentPosition returns a bitmask, by using the bitwise &
       * we're returning true if 2 in that bitmask is set to true. 2 is set
       * to true if b preceeds a.
       */ return a.compareDocumentPosition(b) & 2 ? 1 : -1;
    }
    getBaseTargetFromProps(props, key) {
      return props.style ? props.style[key] : undefined;
    }
    removeValueFromRenderState(key, { vars, style }) {
      delete vars[key];
      delete style[key];
    }
    handleChildMotionValue() {
      if (this.childSubscription) {
        this.childSubscription();
        delete this.childSubscription;
      }
      const { children } = this.props;
      if (isMotionValue(children)) {
        this.childSubscription = children.on("change", (latest) => {
          if (this.current) {
            this.current.textContent = `${latest}`;
          }
        });
      }
    }
    constructor() {
      super(...arguments);
      this.KeyframeResolver = DOMKeyframesResolver;
    }
  };

  /**
   * Provided a value and a ValueType, returns the value as that value type.
   */ const getValueAsType = (value, type) => {
    return type && typeof value === "number" ? type.transform(value) : value;
  };

  const translateAlias = {
    x: "translateX",
    y: "translateY",
    z: "translateZ",
    transformPerspective: "perspective",
  };
  const numTransforms = transformPropOrder.length;
  /**
   * Build a CSS transform style from individual x/y/scale etc properties.
   *
   * This outputs with a default order of transforms/scales/rotations, this can be customised by
   * providing a transformTemplate function.
   */ function buildTransform(latestValues, transform, transformTemplate) {
    // The transform string we're going to build into.
    let transformString = "";
    let transformIsDefault = true;
    /**
     * Loop over all possible transforms in order, adding the ones that
     * are present to the transform string.
     */ for (let i = 0; i < numTransforms; i++) {
      const key = transformPropOrder[i];
      const value = latestValues[key];
      if (value === undefined) continue;
      let valueIsDefault = true;
      if (typeof value === "number") {
        valueIsDefault = value === (key.startsWith("scale") ? 1 : 0);
      } else {
        valueIsDefault = parseFloat(value) === 0;
      }
      if (!valueIsDefault || transformTemplate) {
        const valueAsType = getValueAsType(value, numberValueTypes[key]);
        if (!valueIsDefault) {
          transformIsDefault = false;
          const transformName = translateAlias[key] || key;
          transformString += `${transformName}(${valueAsType}) `;
        }
        if (transformTemplate) {
          transform[key] = valueAsType;
        }
      }
    }
    transformString = transformString.trim();
    // If we have a custom `transform` template, pass our transform values and
    // generated transformString to that before returning
    if (transformTemplate) {
      transformString = transformTemplate(transform, transformIsDefault ? "" : transformString);
    } else if (transformIsDefault) {
      transformString = "none";
    }
    return transformString;
  }

  function buildHTMLStyles(state, latestValues, transformTemplate) {
    const { style, vars, transformOrigin } = state;
    // Track whether we encounter any transform or transformOrigin values.
    let hasTransform = false;
    let hasTransformOrigin = false;
    /**
     * Loop over all our latest animated values and decide whether to handle them
     * as a style or CSS variable.
     *
     * Transforms and transform origins are kept separately for further processing.
     */ for (const key in latestValues) {
      const value = latestValues[key];
      if (transformProps.has(key)) {
        // If this is a transform, flag to enable further transform processing
        hasTransform = true;
        continue;
      } else if (isCSSVariableName(key)) {
        vars[key] = value;
        continue;
      } else {
        // Convert the value to its default value type, ie 0 -> "0px"
        const valueAsType = getValueAsType(value, numberValueTypes[key]);
        if (key.startsWith("origin")) {
          // If this is a transform origin, flag and enable further transform-origin processing
          hasTransformOrigin = true;
          transformOrigin[key] = valueAsType;
        } else {
          style[key] = valueAsType;
        }
      }
    }
    if (!latestValues.transform) {
      if (hasTransform || transformTemplate) {
        style.transform = buildTransform(latestValues, state.transform, transformTemplate);
      } else if (style.transform) {
        /**
         * If we have previously created a transform but currently don't have any,
         * reset transform style to none.
         */ style.transform = "none";
      }
    }
    /**
     * Build a transformOrigin style. Uses the same defaults as the browser for
     * undefined origins.
     */ if (hasTransformOrigin) {
      const { originX = "50%", originY = "50%", originZ = 0 } = transformOrigin;
      style.transformOrigin = `${originX} ${originY} ${originZ}`;
    }
  }

  const dashKeys = {
    offset: "stroke-dashoffset",
    array: "stroke-dasharray",
  };
  const camelKeys = {
    offset: "strokeDashoffset",
    array: "strokeDasharray",
  };
  /**
   * Build SVG path properties. Uses the path's measured length to convert
   * our custom pathLength, pathSpacing and pathOffset into stroke-dashoffset
   * and stroke-dasharray attributes.
   *
   * This function is mutative to reduce per-frame GC.
   */ function buildSVGPath(attrs, length, spacing = 1, offset = 0, useDashCase = true) {
    // Normalise path length by setting SVG attribute pathLength to 1
    attrs.pathLength = 1;
    // We use dash case when setting attributes directly to the DOM node and camel case
    // when defining props on a React component.
    const keys = useDashCase ? dashKeys : camelKeys;
    // Build the dash offset
    attrs[keys.offset] = px.transform(-offset);
    // Build the dash array
    const pathLength = px.transform(length);
    const pathSpacing = px.transform(spacing);
    attrs[keys.array] = `${pathLength} ${pathSpacing}`;
  }

  function calcOrigin(origin, offset, size) {
    return typeof origin === "string" ? origin : px.transform(offset + size * origin);
  }
  /**
   * The SVG transform origin defaults are different to CSS and is less intuitive,
   * so we use the measured dimensions of the SVG to reconcile these.
   */ function calcSVGTransformOrigin(dimensions, originX, originY) {
    const pxOriginX = calcOrigin(originX, dimensions.x, dimensions.width);
    const pxOriginY = calcOrigin(originY, dimensions.y, dimensions.height);
    return `${pxOriginX} ${pxOriginY}`;
  }

  /**
   * Build SVG visual attrbutes, like cx and style.transform
   */ function buildSVGAttrs(
    state,
    {
      attrX,
      attrY,
      attrScale,
      originX,
      originY,
      pathLength,
      pathSpacing = 1,
      pathOffset = 0, // This is object creation, which we try to avoid per-frame.
      ...latest
    },
    isSVGTag,
    transformTemplate,
  ) {
    buildHTMLStyles(state, latest, transformTemplate);
    /**
     * For svg tags we just want to make sure viewBox is animatable and treat all the styles
     * as normal HTML tags.
     */ if (isSVGTag) {
      if (state.style.viewBox) {
        state.attrs.viewBox = state.style.viewBox;
      }
      return;
    }
    state.attrs = state.style;
    state.style = {};
    const { attrs, style, dimensions } = state;
    /**
     * However, we apply transforms as CSS transforms. So if we detect a transform we take it from attrs
     * and copy it into style.
     */ if (attrs.transform) {
      if (dimensions) style.transform = attrs.transform;
      delete attrs.transform;
    }
    // Parse transformOrigin
    if (dimensions && (originX !== undefined || originY !== undefined || style.transform)) {
      style.transformOrigin = calcSVGTransformOrigin(
        dimensions,
        originX !== undefined ? originX : 0.5,
        originY !== undefined ? originY : 0.5,
      );
    }
    // Render attrX/attrY/attrScale as attributes
    if (attrX !== undefined) attrs.x = attrX;
    if (attrY !== undefined) attrs.y = attrY;
    if (attrScale !== undefined) attrs.scale = attrScale;
    // Build SVG path if one has been defined
    if (pathLength !== undefined) {
      buildSVGPath(attrs, pathLength, pathSpacing, pathOffset, false);
    }
  }

  /**
   * A set of attribute names that are always read/written as camel case.
   */ const camelCaseAttributes = new Set([
    "baseFrequency",
    "diffuseConstant",
    "kernelMatrix",
    "kernelUnitLength",
    "keySplines",
    "keyTimes",
    "limitingConeAngle",
    "markerHeight",
    "markerWidth",
    "numOctaves",
    "targetX",
    "targetY",
    "surfaceScale",
    "specularConstant",
    "specularExponent",
    "stdDeviation",
    "tableValues",
    "viewBox",
    "gradientTransform",
    "pathLength",
    "startOffset",
    "textLength",
    "lengthAdjust",
  ]);

  const isSVGTag = (tag) => typeof tag === "string" && tag.toLowerCase() === "svg";
  function updateSVGDimensions(instance, renderState) {
    try {
      renderState.dimensions =
        typeof instance.getBBox === "function" ? instance.getBBox() : instance.getBoundingClientRect();
    } catch (e) {
      // Most likely trying to measure an unrendered element under Firefox
      renderState.dimensions = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };
    }
  }

  function renderHTML(element, { style, vars }, styleProp, projection) {
    Object.assign(element.style, style, projection && projection.getProjectionStyles(styleProp));
    // Loop over any CSS variables and assign those.
    for (const key in vars) {
      element.style.setProperty(key, vars[key]);
    }
  }

  function renderSVG(element, renderState, _styleProp, projection) {
    renderHTML(element, renderState, undefined, projection);
    for (const key in renderState.attrs) {
      element.setAttribute(!camelCaseAttributes.has(key) ? camelToDash(key) : key, renderState.attrs[key]);
    }
  }

  const scaleCorrectors = {};

  function isForcedMotionValue(key, { layout, layoutId }) {
    return (
      transformProps.has(key) ||
      key.startsWith("origin") ||
      ((layout || layoutId !== undefined) && (!!scaleCorrectors[key] || key === "opacity"))
    );
  }

  function scrapeMotionValuesFromProps$1(props, prevProps, visualElement) {
    const { style } = props;
    const newValues = {};
    for (const key in style) {
      var ref;
      if (
        isMotionValue(style[key]) ||
        (prevProps.style && isMotionValue(prevProps.style[key])) ||
        isForcedMotionValue(key, props) ||
        ((ref = visualElement === null || visualElement === void 0 ? void 0 : visualElement.getValue(key)) === null ||
        ref === void 0
          ? void 0
          : ref.liveStyle) !== undefined
      ) {
        newValues[key] = style[key];
      }
    }
    return newValues;
  }

  function scrapeMotionValuesFromProps(props, prevProps, visualElement) {
    const newValues = scrapeMotionValuesFromProps$1(props, prevProps, visualElement);
    for (const key in props) {
      if (isMotionValue(props[key]) || isMotionValue(prevProps[key])) {
        const targetKey =
          transformPropOrder.indexOf(key) !== -1 ? "attr" + key.charAt(0).toUpperCase() + key.substring(1) : key;
        newValues[targetKey] = props[key];
      }
    }
    return newValues;
  }

  let SVGVisualElement = class SVGVisualElement extends DOMVisualElement {
    getBaseTargetFromProps(props, key) {
      return props[key];
    }
    readValueFromInstance(instance, key) {
      if (transformProps.has(key)) {
        const defaultType = getDefaultValueType(key);
        return defaultType ? defaultType.default || 0 : 0;
      }
      key = !camelCaseAttributes.has(key) ? camelToDash(key) : key;
      return instance.getAttribute(key);
    }
    scrapeMotionValuesFromProps(props, prevProps, visualElement) {
      return scrapeMotionValuesFromProps(props, prevProps, visualElement);
    }
    onBindTransform() {
      if (this.current && !this.renderState.dimensions) {
        frame.postRender(this.updateDimensions);
      }
    }
    build(renderState, latestValues, props) {
      buildSVGAttrs(renderState, latestValues, this.isSVGTag, props.transformTemplate);
    }
    renderInstance(instance, renderState, styleProp, projection) {
      renderSVG(instance, renderState, styleProp, projection);
    }
    mount(instance) {
      this.isSVGTag = isSVGTag(instance.tagName);
      super.mount(instance);
    }
    constructor() {
      super(...arguments);
      this.type = "svg";
      this.isSVGTag = false;
      this.measureInstanceViewportBox = createBox;
      this.updateDimensions = () => {
        if (this.current && !this.renderState.dimensions) {
          updateSVGDimensions(this.current, this.renderState);
        }
      };
    }
  };

  /**
   * Bounding boxes tend to be defined as top, left, right, bottom. For various operations
   * it's easier to consider each axis individually. This function returns a bounding box
   * as a map of single-axis min/max values.
   */ function convertBoundingBoxToBox({ top, left, right, bottom }) {
    return {
      x: {
        min: left,
        max: right,
      },
      y: {
        min: top,
        max: bottom,
      },
    };
  }
  /**
   * Applies a TransformPoint function to a bounding box. TransformPoint is usually a function
   * provided by Framer to allow measured points to be corrected for device scaling. This is used
   * when measuring DOM elements and DOM event points.
   */ function transformBoxPoints(point, transformPoint) {
    if (!transformPoint) return point;
    const topLeft = transformPoint({
      x: point.left,
      y: point.top,
    });
    const bottomRight = transformPoint({
      x: point.right,
      y: point.bottom,
    });
    return {
      top: topLeft.y,
      left: topLeft.x,
      bottom: bottomRight.y,
      right: bottomRight.x,
    };
  }

  function measureViewportBox(instance, transformPoint) {
    return convertBoundingBoxToBox(transformBoxPoints(instance.getBoundingClientRect(), transformPoint));
  }

  function getComputedStyle$1(element) {
    return window.getComputedStyle(element);
  }
  let HTMLVisualElement = class HTMLVisualElement extends DOMVisualElement {
    readValueFromInstance(instance, key) {
      if (transformProps.has(key)) {
        return readTransformValue(instance, key);
      } else {
        const computedStyle = getComputedStyle$1(instance);
        const value = (isCSSVariableName(key) ? computedStyle.getPropertyValue(key) : computedStyle[key]) || 0;
        return typeof value === "string" ? value.trim() : value;
      }
    }
    measureInstanceViewportBox(instance, { transformPagePoint }) {
      return measureViewportBox(instance, transformPagePoint);
    }
    build(renderState, latestValues, props) {
      buildHTMLStyles(renderState, latestValues, props.transformTemplate);
    }
    scrapeMotionValuesFromProps(props, prevProps, visualElement) {
      return scrapeMotionValuesFromProps$1(props, prevProps, visualElement);
    }
    constructor() {
      super(...arguments);
      this.type = "html";
      this.renderInstance = renderHTML;
    }
  };

  function isObjectKey(key, object) {
    return key in object;
  }
  let ObjectVisualElement = class ObjectVisualElement extends VisualElement {
    readValueFromInstance(instance, key) {
      if (isObjectKey(key, instance)) {
        const value = instance[key];
        if (typeof value === "string" || typeof value === "number") {
          return value;
        }
      }
      return undefined;
    }
    getBaseTargetFromProps() {
      return undefined;
    }
    removeValueFromRenderState(key, renderState) {
      delete renderState.output[key];
    }
    measureInstanceViewportBox() {
      return createBox();
    }
    build(renderState, latestValues) {
      Object.assign(renderState.output, latestValues);
    }
    renderInstance(instance, { output }) {
      Object.assign(instance, output);
    }
    sortInstanceNodePosition() {
      return 0;
    }
    constructor() {
      super(...arguments);
      this.type = "object";
    }
  };

  function createDOMVisualElement(element) {
    const options = {
      presenceContext: null,
      props: {},
      visualState: {
        renderState: {
          transform: {},
          transformOrigin: {},
          style: {},
          vars: {},
          attrs: {},
        },
        latestValues: {},
      },
    };
    const node = isSVGElement(element) ? new SVGVisualElement(options) : new HTMLVisualElement(options);
    node.mount(element);
    visualElementStore.set(element, node);
  }
  function createObjectVisualElement(subject) {
    const options = {
      presenceContext: null,
      props: {},
      visualState: {
        renderState: {
          output: {},
        },
        latestValues: {},
      },
    };
    const node = new ObjectVisualElement(options);
    node.mount(subject);
    visualElementStore.set(subject, node);
  }

  function animateSingleValue(value, keyframes, options) {
    const motionValue$1 = isMotionValue(value) ? value : motionValue(value);
    motionValue$1.start(animateMotionValue("", motionValue$1, keyframes, options));
    return motionValue$1.animation;
  }

  function isSingleValue(subject, keyframes) {
    return (
      isMotionValue(subject) ||
      typeof subject === "number" ||
      (typeof subject === "string" && !isDOMKeyframes(keyframes))
    );
  }
  /**
   * Implementation
   */ function animateSubject(subject, keyframes, options, scope) {
    const animations = [];
    if (isSingleValue(subject, keyframes)) {
      animations.push(
        animateSingleValue(
          subject,
          isDOMKeyframes(keyframes) ? keyframes.default || keyframes : keyframes,
          options ? options.default || options : options,
        ),
      );
    } else {
      const subjects = resolveSubjects(subject, keyframes, scope);
      const numSubjects = subjects.length;
      invariant$1(Boolean(numSubjects), "No valid elements provided.");
      for (let i = 0; i < numSubjects; i++) {
        const thisSubject = subjects[i];
        const createVisualElement = thisSubject instanceof Element ? createDOMVisualElement : createObjectVisualElement;
        if (!visualElementStore.has(thisSubject)) {
          createVisualElement(thisSubject);
        }
        const visualElement = visualElementStore.get(thisSubject);
        const transition = {
          ...options,
        };
        /**
         * Resolve stagger function if provided.
         */ if ("delay" in transition && typeof transition.delay === "function") {
          transition.delay = transition.delay(i, numSubjects);
        }
        animations.push(
          ...animateTarget(
            visualElement,
            {
              ...keyframes,
              transition,
            },
            {},
          ),
        );
      }
    }
    return animations;
  }

  function animateSequence(sequence, options, scope) {
    const animations = [];
    const animationDefinitions = createAnimationsFromSequence(sequence, options, scope, {
      spring,
    });
    animationDefinitions.forEach(({ keyframes, transition }, subject) => {
      animations.push(...animateSubject(subject, keyframes, transition));
    });
    return animations;
  }

  function isSequence(value) {
    return Array.isArray(value) && value.some(Array.isArray);
  }
  /**
   * Creates an animation function that is optionally scoped
   * to a specific element.
   */ function createScopedAnimate(scope) {
    /**
     * Implementation
     */ function scopedAnimate(subjectOrSequence, optionsOrKeyframes, options) {
      let animations = [];
      if (isSequence(subjectOrSequence)) {
        animations = animateSequence(subjectOrSequence, optionsOrKeyframes, scope);
      } else {
        animations = animateSubject(subjectOrSequence, optionsOrKeyframes, options, scope);
      }
      const animation = new GroupAnimationWithThen(animations);
      return animation;
    }
    return scopedAnimate;
  }
  const animate = createScopedAnimate();

  function observeTimeline(update, timeline) {
    let prevProgress;
    const onFrame = () => {
      const { currentTime } = timeline;
      const percentage = currentTime === null ? 0 : currentTime.value;
      const progress = percentage / 100;
      if (prevProgress !== progress) {
        update(progress);
      }
      prevProgress = progress;
    };
    frame.update(onFrame, true);
    return () => cancelFrame(onFrame);
  }

  const resizeHandlers = new WeakMap();
  let observer;
  function getElementSize(target, borderBoxSize) {
    if (borderBoxSize) {
      const { inlineSize, blockSize } = borderBoxSize[0];
      return {
        width: inlineSize,
        height: blockSize,
      };
    } else if (target instanceof SVGElement && "getBBox" in target) {
      return target.getBBox();
    } else {
      return {
        width: target.offsetWidth,
        height: target.offsetHeight,
      };
    }
  }
  function notifyTarget({ target, contentRect, borderBoxSize }) {
    var ref;
    (ref = resizeHandlers.get(target)) === null || ref === void 0
      ? void 0
      : ref.forEach((handler) => {
          handler({
            target,
            contentSize: contentRect,
            get size() {
              return getElementSize(target, borderBoxSize);
            },
          });
        });
  }
  function notifyAll(entries) {
    entries.forEach(notifyTarget);
  }
  function createResizeObserver() {
    if (typeof ResizeObserver === "undefined") return;
    observer = new ResizeObserver(notifyAll);
  }
  function resizeElement(target, handler) {
    if (!observer) createResizeObserver();
    const elements = resolveElements(target);
    elements.forEach((element) => {
      let elementHandlers = resizeHandlers.get(element);
      if (!elementHandlers) {
        elementHandlers = new Set();
        resizeHandlers.set(element, elementHandlers);
      }
      elementHandlers.add(handler);
      observer === null || observer === void 0 ? void 0 : observer.observe(element);
    });
    return () => {
      elements.forEach((element) => {
        const elementHandlers = resizeHandlers.get(element);
        elementHandlers === null || elementHandlers === void 0 ? void 0 : elementHandlers.delete(handler);
        if (!(elementHandlers === null || elementHandlers === void 0 ? void 0 : elementHandlers.size)) {
          observer === null || observer === void 0 ? void 0 : observer.unobserve(element);
        }
      });
    };
  }

  const windowCallbacks = new Set();
  let windowResizeHandler;
  function createWindowResizeHandler() {
    windowResizeHandler = () => {
      const size = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      const info = {
        target: window,
        size,
        contentSize: size,
      };
      windowCallbacks.forEach((callback) => callback(info));
    };
    window.addEventListener("resize", windowResizeHandler);
  }
  function resizeWindow(callback) {
    windowCallbacks.add(callback);
    if (!windowResizeHandler) createWindowResizeHandler();
    return () => {
      windowCallbacks.delete(callback);
      if (!windowCallbacks.size && windowResizeHandler) {
        windowResizeHandler = undefined;
      }
    };
  }

  function resize(a, b) {
    return typeof a === "function" ? resizeWindow(a) : resizeElement(a, b);
  }

  /**
   * A time in milliseconds, beyond which we consider the scroll velocity to be 0.
   */ const maxElapsed$1 = 50;
  const createAxisInfo = () => ({
    current: 0,
    offset: [],
    progress: 0,
    scrollLength: 0,
    targetOffset: 0,
    targetLength: 0,
    containerLength: 0,
    velocity: 0,
  });
  const createScrollInfo = () => ({
    time: 0,
    x: createAxisInfo(),
    y: createAxisInfo(),
  });
  const keys = {
    x: {
      length: "Width",
      position: "Left",
    },
    y: {
      length: "Height",
      position: "Top",
    },
  };
  function updateAxisInfo(element, axisName, info, time) {
    const axis = info[axisName];
    const { length, position } = keys[axisName];
    const prev = axis.current;
    const prevTime = info.time;
    axis.current = element[`scroll${position}`];
    axis.scrollLength = element[`scroll${length}`] - element[`client${length}`];
    axis.offset.length = 0;
    axis.offset[0] = 0;
    axis.offset[1] = axis.scrollLength;
    axis.progress = progress(0, axis.scrollLength, axis.current);
    const elapsed = time - prevTime;
    axis.velocity = elapsed > maxElapsed$1 ? 0 : velocityPerSecond(axis.current - prev, elapsed);
  }
  function updateScrollInfo(element, info, time) {
    updateAxisInfo(element, "x", info, time);
    updateAxisInfo(element, "y", info, time);
    info.time = time;
  }

  function calcInset(element, container) {
    const inset = {
      x: 0,
      y: 0,
    };
    let current = element;
    while (current && current !== container) {
      if (current instanceof HTMLElement) {
        inset.x += current.offsetLeft;
        inset.y += current.offsetTop;
        current = current.offsetParent;
      } else if (current.tagName === "svg") {
        /**
         * This isn't an ideal approach to measuring the offset of <svg /> tags.
         * It would be preferable, given they behave like HTMLElements in most ways
         * to use offsetLeft/Top. But these don't exist on <svg />. Likewise we
         * can't use .getBBox() like most SVG elements as these provide the offset
         * relative to the SVG itself, which for <svg /> is usually 0x0.
         */ const svgBoundingBox = current.getBoundingClientRect();
        current = current.parentElement;
        const parentBoundingBox = current.getBoundingClientRect();
        inset.x += svgBoundingBox.left - parentBoundingBox.left;
        inset.y += svgBoundingBox.top - parentBoundingBox.top;
      } else if (current instanceof SVGGraphicsElement) {
        const { x, y } = current.getBBox();
        inset.x += x;
        inset.y += y;
        let svg = null;
        let parent = current.parentNode;
        while (!svg) {
          if (parent.tagName === "svg") {
            svg = parent;
          }
          parent = current.parentNode;
        }
        current = svg;
      } else {
        break;
      }
    }
    return inset;
  }

  const namedEdges = {
    start: 0,
    center: 0.5,
    end: 1,
  };
  function resolveEdge(edge, length, inset = 0) {
    let delta = 0;
    /**
     * If we have this edge defined as a preset, replace the definition
     * with the numerical value.
     */ if (edge in namedEdges) {
      edge = namedEdges[edge];
    }
    /**
     * Handle unit values
     */ if (typeof edge === "string") {
      const asNumber = parseFloat(edge);
      if (edge.endsWith("px")) {
        delta = asNumber;
      } else if (edge.endsWith("%")) {
        edge = asNumber / 100;
      } else if (edge.endsWith("vw")) {
        delta = (asNumber / 100) * document.documentElement.clientWidth;
      } else if (edge.endsWith("vh")) {
        delta = (asNumber / 100) * document.documentElement.clientHeight;
      } else {
        edge = asNumber;
      }
    }
    /**
     * If the edge is defined as a number, handle as a progress value.
     */ if (typeof edge === "number") {
      delta = length * edge;
    }
    return inset + delta;
  }

  const defaultOffset = [0, 0];
  function resolveOffset(offset, containerLength, targetLength, targetInset) {
    let offsetDefinition = Array.isArray(offset) ? offset : defaultOffset;
    let targetPoint = 0;
    let containerPoint = 0;
    if (typeof offset === "number") {
      /**
       * If we're provided offset: [0, 0.5, 1] then each number x should become
       * [x, x], so we default to the behaviour of mapping 0 => 0 of both target
       * and container etc.
       */ offsetDefinition = [offset, offset];
    } else if (typeof offset === "string") {
      offset = offset.trim();
      if (offset.includes(" ")) {
        offsetDefinition = offset.split(" ");
      } else {
        /**
         * If we're provided a definition like "100px" then we want to apply
         * that only to the top of the target point, leaving the container at 0.
         * Whereas a named offset like "end" should be applied to both.
         */ offsetDefinition = [offset, namedEdges[offset] ? offset : `0`];
      }
    }
    targetPoint = resolveEdge(offsetDefinition[0], targetLength, targetInset);
    containerPoint = resolveEdge(offsetDefinition[1], containerLength);
    return targetPoint - containerPoint;
  }

  const ScrollOffset = {
    Enter: [
      [0, 1],
      [1, 1],
    ],
    Exit: [
      [0, 0],
      [1, 0],
    ],
    Any: [
      [1, 0],
      [0, 1],
    ],
    All: [
      [0, 0],
      [1, 1],
    ],
  };

  const point = {
    x: 0,
    y: 0,
  };
  function getTargetSize(target) {
    return "getBBox" in target && target.tagName !== "svg"
      ? target.getBBox()
      : {
          width: target.clientWidth,
          height: target.clientHeight,
        };
  }
  function resolveOffsets(container, info, options) {
    const { offset: offsetDefinition = ScrollOffset.All } = options;
    const { target = container, axis = "y" } = options;
    const lengthLabel = axis === "y" ? "height" : "width";
    const inset = target !== container ? calcInset(target, container) : point;
    /**
     * Measure the target and container. If they're the same thing then we
     * use the container's scrollWidth/Height as the target, from there
     * all other calculations can remain the same.
     */ const targetSize =
      target === container
        ? {
            width: container.scrollWidth,
            height: container.scrollHeight,
          }
        : getTargetSize(target);
    const containerSize = {
      width: container.clientWidth,
      height: container.clientHeight,
    };
    /**
     * Reset the length of the resolved offset array rather than creating a new one.
     * TODO: More reusable data structures for targetSize/containerSize would also be good.
     */ info[axis].offset.length = 0;
    /**
     * Populate the offset array by resolving the user's offset definition into
     * a list of pixel scroll offets.
     */ let hasChanged = !info[axis].interpolate;
    const numOffsets = offsetDefinition.length;
    for (let i = 0; i < numOffsets; i++) {
      const offset = resolveOffset(
        offsetDefinition[i],
        containerSize[lengthLabel],
        targetSize[lengthLabel],
        inset[axis],
      );
      if (!hasChanged && offset !== info[axis].interpolatorOffsets[i]) {
        hasChanged = true;
      }
      info[axis].offset[i] = offset;
    }
    /**
     * If the pixel scroll offsets have changed, create a new interpolator function
     * to map scroll value into a progress.
     */ if (hasChanged) {
      info[axis].interpolate = interpolate(info[axis].offset, defaultOffset$1(offsetDefinition), {
        clamp: false,
      });
      info[axis].interpolatorOffsets = [...info[axis].offset];
    }
    info[axis].progress = clamp(0, 1, info[axis].interpolate(info[axis].current));
  }

  function measure(container, target = container, info) {
    /**
     * Find inset of target within scrollable container
     */ info.x.targetOffset = 0;
    info.y.targetOffset = 0;
    if (target !== container) {
      let node = target;
      while (node && node !== container) {
        info.x.targetOffset += node.offsetLeft;
        info.y.targetOffset += node.offsetTop;
        node = node.offsetParent;
      }
    }
    info.x.targetLength = target === container ? target.scrollWidth : target.clientWidth;
    info.y.targetLength = target === container ? target.scrollHeight : target.clientHeight;
    info.x.containerLength = container.clientWidth;
    info.y.containerLength = container.clientHeight;
    /**
     * In development mode ensure scroll containers aren't position: static as this makes
     * it difficult to measure their relative positions.
     */ if (process.env.NODE_ENV !== "production") {
      if (container && target && target !== container) {
        warnOnce(
          getComputedStyle(container).position !== "static",
          "Please ensure that the container has a non-static position, like 'relative', 'fixed', or 'absolute' to ensure scroll offset is calculated correctly.",
        );
      }
    }
  }
  function createOnScrollHandler(element, onScroll, info, options = {}) {
    return {
      measure: () => measure(element, options.target, info),
      update: (time) => {
        updateScrollInfo(element, info, time);
        if (options.offset || options.target) {
          resolveOffsets(element, info, options);
        }
      },
      notify: () => onScroll(info),
    };
  }

  const scrollListeners = new WeakMap();
  const resizeListeners = new WeakMap();
  const onScrollHandlers = new WeakMap();
  const getEventTarget = (element) => (element === document.documentElement ? window : element);
  function scrollInfo(onScroll, { container = document.documentElement, ...options } = {}) {
    let containerHandlers = onScrollHandlers.get(container);
    /**
     * Get the onScroll handlers for this container.
     * If one isn't found, create a new one.
     */ if (!containerHandlers) {
      containerHandlers = new Set();
      onScrollHandlers.set(container, containerHandlers);
    }
    /**
     * Create a new onScroll handler for the provided callback.
     */ const info = createScrollInfo();
    const containerHandler = createOnScrollHandler(container, onScroll, info, options);
    containerHandlers.add(containerHandler);
    /**
     * Check if there's a scroll event listener for this container.
     * If not, create one.
     */ if (!scrollListeners.has(container)) {
      const measureAll = () => {
        for (const handler of containerHandlers) handler.measure();
      };
      const updateAll = () => {
        for (const handler of containerHandlers) {
          handler.update(frameData.timestamp);
        }
      };
      const notifyAll = () => {
        for (const handler of containerHandlers) handler.notify();
      };
      const listener = () => {
        frame.read(measureAll, false, true);
        frame.read(updateAll, false, true);
        frame.update(notifyAll, false, true);
      };
      scrollListeners.set(container, listener);
      const target = getEventTarget(container);
      window.addEventListener("resize", listener, {
        passive: true,
      });
      if (container !== document.documentElement) {
        resizeListeners.set(container, resize(container, listener));
      }
      target.addEventListener("scroll", listener, {
        passive: true,
      });
    }
    const listener = scrollListeners.get(container);
    frame.read(listener, false, true);
    return () => {
      cancelFrame(listener);
      /**
       * Check if we even have any handlers for this container.
       */ const currentHandlers = onScrollHandlers.get(container);
      if (!currentHandlers) return;
      currentHandlers.delete(containerHandler);
      if (currentHandlers.size) return;
      /**
       * If no more handlers, remove the scroll listener too.
       */ const scrollListener = scrollListeners.get(container);
      scrollListeners.delete(container);
      if (scrollListener) {
        var ref;
        getEventTarget(container).removeEventListener("scroll", scrollListener);
        (ref = resizeListeners.get(container)) === null || ref === void 0 ? void 0 : ref();
        window.removeEventListener("resize", scrollListener);
      }
    };
  }

  function scrollTimelineFallback({ source, container, axis = "y" }) {
    // Support legacy source argument. Deprecate later.
    if (source) container = source;
    // ScrollTimeline records progress as a percentage CSSUnitValue
    const currentTime = {
      value: 0,
    };
    const cancel = scrollInfo(
      (info) => {
        currentTime.value = info[axis].progress * 100;
      },
      {
        container,
        axis,
      },
    );
    return {
      currentTime,
      cancel,
    };
  }
  const timelineCache = new Map();
  function getTimeline({ source, container = document.documentElement, axis = "y" } = {}) {
    // Support legacy source argument. Deprecate later.
    if (source) container = source;
    if (!timelineCache.has(container)) {
      timelineCache.set(container, {});
    }
    const elementCache = timelineCache.get(container);
    if (!elementCache[axis]) {
      elementCache[axis] = supportsScrollTimeline$1()
        ? new ScrollTimeline({
            source: container,
            axis,
          })
        : scrollTimelineFallback({
            source: container,
            axis,
          });
    }
    return elementCache[axis];
  }
  /**
   * If the onScroll function has two arguments, it's expecting
   * more specific information about the scroll from scrollInfo.
   */ function isOnScrollWithInfo(onScroll) {
    return onScroll.length === 2;
  }
  /**
   * Currently, we only support element tracking with `scrollInfo`, though in
   * the future we can also offer ViewTimeline support.
   */ function needsElementTracking(options) {
    return options && (options.target || options.offset);
  }
  function scrollFunction(onScroll, options) {
    if (isOnScrollWithInfo(onScroll) || needsElementTracking(options)) {
      return scrollInfo((info) => {
        onScroll(info[options.axis].progress, info);
      }, options);
    } else {
      return observeTimeline(onScroll, getTimeline(options));
    }
  }
  function scrollAnimation(animation, options) {
    animation.flatten();
    if (needsElementTracking(options)) {
      animation.pause();
      return scrollInfo((info) => {
        animation.time = animation.duration * info[options.axis].progress;
      }, options);
    } else {
      const timeline = getTimeline(options);
      if (animation.attachTimeline) {
        return animation.attachTimeline(timeline, (valueAnimation) => {
          valueAnimation.pause();
          return observeTimeline((progress) => {
            valueAnimation.time = valueAnimation.duration * progress;
          }, timeline);
        });
      } else {
        return noop$1;
      }
    }
  }
  function scroll(onScroll, { axis = "y", ...options } = {}) {
    const optionsWithDefaults = {
      axis,
      ...options,
    };
    return typeof onScroll === "function"
      ? scrollFunction(onScroll, optionsWithDefaults)
      : scrollAnimation(onScroll, optionsWithDefaults);
  }

  const thresholds = {
    some: 0,
    all: 1,
  };
  function inView(elementOrSelector, onStart, { root, margin: rootMargin, amount = "some" } = {}) {
    const elements = resolveElements(elementOrSelector);
    const activeIntersections = new WeakMap();
    const onIntersectionChange = (entries) => {
      entries.forEach((entry) => {
        const onEnd = activeIntersections.get(entry.target);
        /**
         * If there's no change to the intersection, we don't need to
         * do anything here.
         */ if (entry.isIntersecting === Boolean(onEnd)) return;
        if (entry.isIntersecting) {
          const newOnEnd = onStart(entry.target, entry);
          if (typeof newOnEnd === "function") {
            activeIntersections.set(entry.target, newOnEnd);
          } else {
            observer.unobserve(entry.target);
          }
        } else if (typeof onEnd === "function") {
          onEnd(entry);
          activeIntersections.delete(entry.target);
        }
      });
    };
    const observer = new IntersectionObserver(onIntersectionChange, {
      root,
      rootMargin,
      threshold: typeof amount === "number" ? amount : thresholds[amount],
    });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }

  function getOriginIndex(from, total) {
    if (from === "first") {
      return 0;
    } else {
      const lastIndex = total - 1;
      return from === "last" ? lastIndex : lastIndex / 2;
    }
  }
  function stagger(duration = 0.1, { startDelay = 0, from = 0, ease } = {}) {
    return (i, total) => {
      const fromIndex = typeof from === "number" ? from : getOriginIndex(from, total);
      const distance = Math.abs(fromIndex - i);
      let delay = duration * distance;
      if (ease) {
        const maxDelay = total * duration;
        const easingFunction = easingDefinitionToFunction(ease);
        delay = easingFunction(delay / maxDelay) * maxDelay;
      }
      return startDelay + delay;
    };
  }

  const isCustomValueType = (v) => {
    return v && typeof v === "object" && v.mix;
  };
  const getMixer = (v) => (isCustomValueType(v) ? v.mix : undefined);
  function transform(...args) {
    const useImmediate = !Array.isArray(args[0]);
    const argOffset = useImmediate ? 0 : -1;
    const inputValue = args[0 + argOffset];
    const inputRange = args[1 + argOffset];
    const outputRange = args[2 + argOffset];
    const options = args[3 + argOffset];
    const interpolator = interpolate(inputRange, outputRange, {
      mixer: getMixer(outputRange[0]),
      ...options,
    });
    return useImmediate ? interpolator(inputValue) : interpolator;
  }

  class NoAnimationsStartedError extends Error {
    constructor(msg, el) {
      super(msg);
      this.el = el;
    }
  }
  class NoAnimationsFinishedError extends Error {
    constructor(msg, el, unfinished) {
      super(msg);
      this.el = el;
      this.unfinished = unfinished;
    }
  }
  const ANIMATION_START_TIMEOUT = 50; // ms
  const ANIMATION_COMPLETION_TIMEOUT = 2000; // ms
  function animationUtils(Alpine) {
    Alpine.magic("waitForAnimations", function ($el) {
      return async function (options) {
        var _a;
        const parentEl =
          (_a = options === null || options === void 0 ? void 0 : options.target) !== null && _a !== void 0 ? _a : $el;
        const animations = await waitForAnimationsToStart(parentEl, options);
        return waitForAnimationsToFinish(
          parentEl,
          animations,
          options === null || options === void 0 ? void 0 : options.subtree,
          options === null || options === void 0 ? void 0 : options.excludeSubtree,
        );
      };
    });
  }
  /**
   * Returns a promise that resolves when all animations on the element have started. Waits for a short period of time, and if no animations have started it will reject with an error
   *
   * @param $el Element to check for animations
   * @returns
   */ async function waitForAnimationsToStart($el, options = {}) {
    return new Promise((resolve, reject) => {
      let startTimeout = ANIMATION_START_TIMEOUT;
      if ((options === null || options === void 0 ? void 0 : options.startTimeout) !== undefined) {
        if (options.startTimeout === false) {
          startTimeout = 0;
        } else {
          startTimeout = options.startTimeout;
        }
      }
      // Wait for a short period of time, and if no animations have started output an error
      setTimeout(() => {
        let animations = $el.getAnimations(options);
        if (options.excludeSubtree) {
          animations = excludeSubtreeAnimations(animations, options.excludeSubtree);
        }
        if (animations.length === 0) {
          reject(
            buildErrorForNoAnimationsStarted($el, options === null || options === void 0 ? void 0 : options.subtree),
          );
        } else {
          resolve(animations);
        }
      }, startTimeout);
    });
  }
  /**
   * Returns a promise that resolves when all animations on the element have finished, or rejects if any animations don't finish within a timeout
   * @param $el Element animations are occuring on
   * @param animations Animations to wait for
   * @param subtree Whether to include animations in subtree
   * @param excludeSubtree Optional filter to exclude certain animations in subtree
   */ async function waitForAnimationsToFinish($el, animations, subtree = false, excludeSubtree) {
    let timedOutAnimations = [];
    if (excludeSubtree) {
      animations = excludeSubtreeAnimations(animations, excludeSubtree);
    }
    const promises = animations.map((animation) => animation.finished);
    await promiseAllSettledWithTimeout(promises, ANIMATION_COMPLETION_TIMEOUT).then((results) => {
      results.forEach((result, i) => {
        if (result.status === "rejected" && result.reason === "timeout") {
          timedOutAnimations = [...timedOutAnimations, animations[i]];
        }
      });
    });
    if (timedOutAnimations.length > 0) {
      throw buildErrorForNoAnimationsFinished($el, animations, timedOutAnimations, subtree);
    }
    return animations;
  }
  function buildErrorForNoAnimationsStarted($el, subtree = false) {
    if (subtree) {
      return new NoAnimationsStartedError(
        `Expected animations or transitions to start on element or its descendants, but none did after waiting ${ANIMATION_START_TIMEOUT}ms`,
        $el,
      );
    } else {
      return new NoAnimationsStartedError(
        `Expected animations or transitions to start on element, but none did after waiting ${ANIMATION_START_TIMEOUT}ms`,
        $el,
      );
    }
  }
  function buildErrorForNoAnimationsFinished($el, started, unfinished, subtree = false) {
    if (subtree) {
      return new NoAnimationsFinishedError(
        `Expected all animations or transitions on element and its descendants to finish within ${ANIMATION_COMPLETION_TIMEOUT}ms, but ${unfinished.length} of ${started.length} did not`,
        $el,
        unfinished,
      );
    } else {
      return new NoAnimationsFinishedError(
        `Expected all animations or transitions on element to finish within ${ANIMATION_COMPLETION_TIMEOUT}ms, but ${unfinished.length} of ${started.length} did not`,
        $el,
        unfinished,
      );
    }
  }
  function promiseAllSettledWithTimeout(promises, timeoutMs) {
    return Promise.allSettled(promises.map((promise) => withTimeout(promise, timeoutMs)));
  }
  async function withTimeout(promise, timeoutMs) {
    let timeoutHandle;
    const timeoutPromise = new Promise((_resolve, reject) => {
      timeoutHandle = setTimeout(() => {
        reject("timeout");
      }, timeoutMs);
    });
    return Promise.race([promise, timeoutPromise])
      .then((result) => {
        clearTimeout(timeoutHandle);
        return result;
      })
      .catch((error) => {
        clearTimeout(timeoutHandle);
        throw error;
      });
  }
  function isKeyframeEffect(effect) {
    return effect instanceof KeyframeEffect;
  }
  /**
   * Filters out any animations who's target element matches the filter or any of its ancestors
   * @param animations
   * @param filter
   */ function excludeSubtreeAnimations(animations, filter) {
    const hasExcludedAncestor = (element) => {
      let parent = element.parentElement;
      while (parent) {
        if (filter(parent)) return true;
        parent = parent.parentElement;
      }
      return false;
    };
    return animations.filter((animation) => {
      if (isKeyframeEffect(animation.effect)) {
        const target = animation.effect.target;
        if (!target) {
          return true;
        }
        if (filter(target)) {
          return false;
        }
        return !hasExcludedAncestor(target);
      } else {
        return true;
      }
    });
  }

  const DATA_EXCLUDE_SUBTREE_ATTRIBUTE = "data-skip-transition-wait";
  /**
   * Enables the creation of disclosure components, commonly known as accordions or collapsible sections.
   * A disclosure component typically consists of a button that controls the visibility of an
   * associated content area.
   *
   * Note: requires method-ui 'animations' plugin
   *
   * See https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/ for more information about disclosures
   *
   * Usage:
   * - x-disclosure - Applied to the root element of a disclosure component. It can optionally accept an expression that
   *   2-way binds to the internal isExpanded state of the disclosure e.g. `x-disclosure="isExpanded"`. If no expression is provided, the disclosure is closed by default
   *   If your disclosure is _not_ animated, use the .noanimate modifier to prevent the disclosure from waiting for animations to complete before transitioning to expanded and vice versa.
   * - x-disclosure:button - Marks an element as the button that toggles the visibility of the
   *   disclosure content. This element is typically a button or a similar interactive element.
   * - `data-skip-transition-wait` - Add this attribute to elements when you don't want to wait for their animations to complete before state transitions.
   *
   * @example
   *
   * <div x-disclosure>
   *   <button x-disclosure:button>Open SESAME</button>
   *   <div x-disclosure:panel>
   *     <p>Hello world</p>
   *   </div>
   * </div>
   *
   * @example Initially expanded
   *
   * <div x-disclosure="true">
   *   <button x-disclosure:button>Open SESAME</button>
   *   <div x-disclosure:panel>
   *     <p>Hello world</p>
   *   </div>
   * </div>
   *
   * or
   *
   * <div x-disclosure="{ isExpanded: true }">
   *   <button x-disclosure:button>Open SESAME</button>
   *   <div x-disclosure:panel>
   *     <p>Hello world</p>
   *   </div>
   * </div>
   *
   * @example Bound to external state
   *
   * <div x-data="{isExpandedExternal: true}">
   *   <div x-show="isExpandedExternal">Im open!</div>
   *
   *   <div x-disclosure="{
   *     get isExpanded() {
   *       return this.isExpandedExternal
   *     },
   *     set isExpanded(value) {
   *       this.isExpandedExternal = value
   *     }
   *   }">
   *     <button x-disclosure:button>Open SESAME</button>
   *     <div x-disclosure:panel>
   *       <p>Hello world</p>
   *     </div>
   *   </div>
   * </div>
   *
   * The '$disclosure' magic property provides an API for managing the state of the disclosure
   * component, including checking its open/closed status and programmatically toggling its state.
   *
   * ## Disclosure Groups
   *
   * Disclosure groups are a collection of disclosures that are managed as a single accordion.
   * This is useful for creating multi-step forms or other UI elements that require the disclosure
   * of multiple sections.
   *
   * @example
   *
   * <div x-disclosure-group>
   *   <div x-disclosure
   *     <button x-disclosure:button>Open SESAME 1</button>
   *     <div x-disclosure:panel>
   *       <p>Hello world 1</p>
   *     </div>
   *   </div>
   *  <div x-disclosure>
   *     <button x-disclosure:button>Open SESAME 2</button>
   *     <div x-disclosure:panel>
   *       <p>Hello world 2</p>
   *     </div>
   *   </div>
   * </div>
   *
   * The '$disclosureGroup' magic property provides an API for managing the state of the disclosure group,
   * including checking the expanded index and programmatically toggling the state of the disclosures.
   *
   */ function disclosure(Alpine) {
    Alpine.directive("disclosure", ($el, data, utilities) => {
      if (data.value === "panel") {
        handlePanel($el, Alpine);
      } else if (data.value === "button") {
        handleButton($el, Alpine);
      } else if (data.value === null) {
        handleRoot$2($el, Alpine, data, utilities);
      } else {
        throw new Error(`Unknown directive: x-disclosure:${data.value}`);
      }
    }).before("bind");
    Alpine.directive("disclosure-group", ($el, data, utilities) => {
      if (data.value === null) {
        handleDisclosureGroup($el, Alpine, data, utilities);
      } else {
        throw new Error(`Unknown directive: x-disclosure-group:${data.value}`);
      }
    }).before("bind");
    Alpine.magic("disclosure", handleDisclosureMagic(Alpine));
    Alpine.magic("disclosureGroup", handleDisclosureGroupMagic(Alpine));
  }
  function handleDisclosureMagic(Alpine) {
    return function ($el) {
      const $data = Alpine.$data($el);
      return {
        get isExpanded() {
          var _a;
          return (_a = $data.__disclosure_state) === null || _a === void 0 ? void 0 : _a.isExpanded;
        },
        set isExpanded(value) {
          if (!$data.__disclosure_state) return;
          $data.__disclosure_state.isExpanded = value;
        },
        get isCollapsed() {
          var _a1;
          return (_a1 = $data.__disclosure_state) === null || _a1 === void 0 ? void 0 : _a1.isCollapsed;
        },
        get groupIndex() {
          return $data.__disclosure_groupIndex;
        },
        toggle() {
          var _a;
          (_a = $data.__disclosure_state) === null || _a === void 0 ? void 0 : _a.toggle();
        },
        expand() {
          var _a;
          (_a = $data.__disclosure_state) === null || _a === void 0 ? void 0 : _a.expand();
        },
        collapse() {
          var _a;
          (_a = $data.__disclosure_state) === null || _a === void 0 ? void 0 : _a.collapse();
        },
        waitForAnimations() {
          return $data.__disclosure_waitForAnimations();
        },
      };
    };
  }
  function handleDisclosureGroupMagic(Alpine) {
    return function ($el) {
      const $data = Alpine.$data($el);
      return $data.__disclosure_group_state || {};
    };
  }
  function handlePanel($el, Alpine) {
    Alpine.bind($el, {
      ":id": `$el.id || $id('disclosure-panel')`,
      role: "group",
      "x-show": "$disclosure.isExpanded",
      "x-init"() {
        this.__disclosure_contentEl = this.$el;
        const addHidden = () => {
          // TODO add support for `hidden="until-found"`
          this.$el.setAttribute("hidden", "");
        };
        const removeHidden = () => this.$el.removeAttribute("hidden");
        if (this.__disclosure_state.isExpanded) {
          removeHidden();
        } else {
          addHidden();
        }
        this.$watch("__disclosure_state.isExpanded", async (isExpanded) => {
          if (isExpanded) {
            removeHidden();
          } else {
            await this.__disclosure_waitForAnimations();
            addHidden();
          }
        });
      },
      ":aria-labelledby": "__disclosure_buttonEl?.id",
    });
  }
  function handleButton($el, Alpine) {
    Alpine.bind($el, {
      role: "button",
      ":id": `$el.id || $id('disclosure-button')`,
      "x-init": "__disclosure_buttonEl = $el",
      "@click.stop.prevent": "$disclosure.toggle()",
      ":aria-controls": "__disclosure_contentEl?.id",
      ":aria-expanded": "$disclosure.isExpanded",
    });
  }
  function handleDisclosureGroup($el, Alpine, { expression, modifiers }, { evaluate }) {
    let options = evaluate(expression === "" ? "{}" : expression);
    if (options !== undefined && options !== null && !isPlainObject(options)) {
      throw new Error(`options must be an object, but got ${options}`);
    }
    let state;
    if (options.multiple || modifiers.includes("multiple")) {
      state = buildMultiSelectDisclosureGroupState(options);
    } else {
      state = buildSingleSelectDisclosureGroupState(options);
    }
    Alpine.bind($el, {
      ["x-data"]() {
        return {
          __disclosure_group_state: state,
          get __disclosure_isInGroup() {
            return true;
          },
        };
      },
    });
  }
  function handleRoot$2($el, Alpine, { modifiers, expression }, { evaluate }) {
    const $data = Alpine.$data($el);
    const isInDisclosureGroup = $data.__disclosure_isInGroup;
    const animated = !modifiers.includes("noanimate");
    let options = {};
    if (expression) {
      let evalutatedExpression = evaluate(expression === "" ? "{}" : expression);
      if (evalutatedExpression === true || evalutatedExpression === false) {
        options.isExpanded = evalutatedExpression;
      } else if (isPlainObject(evalutatedExpression)) {
        options = evalutatedExpression;
      }
    }
    let state = buildDisclosureState(options);
    // If disclosure is in a group, bind the internal isExpanded state to the group's expanded state
    if (isInDisclosureGroup) {
      state = buildDisclosureState({
        get isExpanded() {
          var _a, _b;
          const index =
            (_b = (_a = $data.__disclosure_group_state).indexOf) === null || _b === void 0 ? void 0 : _b.call(_a, $el);
          const isExpanded = $data.__disclosure_group_state.isExpanded(index);
          return isExpanded;
        },
        set isExpanded(value) {
          var _a2, _b1;
          const index =
            (_b1 = (_a2 = $data.__disclosure_group_state).indexOf) === null || _b1 === void 0
              ? void 0
              : _b1.call(_a2, $el);
          if (value) {
            $data.__disclosure_group_state.expand(index);
          } else {
            $data.__disclosure_group_state.collapse(index);
          }
        },
      });
    }
    Alpine.bind($el, {
      ":id": `$el.id || $id('disclosure')`,
      ["x-data"]() {
        return {
          __disclosure_buttonEl: null,
          __disclosure_contentEl: null,
          __disclosure_state: state,
          init() {
            if (isInDisclosureGroup) {
              // Register this element with the disclosure group so we can keep track of it's index
              this.$data.__disclosure_group_state.register(this.$el);
            }
            this.$watch("__disclosure_state.isExpanded", (isExpanded) => {
              this.$dispatch(isExpanded ? "expand" : "collapse");
            });
          },
          destroy() {
            if (isInDisclosureGroup) {
              this.$data.__disclosure_group_state.unregister(this.$el);
            }
          },
          async __disclosure_waitForAnimations() {
            if (!animated) {
              return Promise.resolve([]);
            }
            try {
              // Wait for animations before transitioning to expanded
              return await this.$waitForAnimations({
                subtree: true,
                target: this.__disclosure_contentEl,
                excludeSubtree: (element) => element.hasAttribute(DATA_EXCLUDE_SUBTREE_ATTRIBUTE),
              });
            } catch (e) {
              if (e instanceof NoAnimationsStartedError) {
                if (process.env.NODE_ENV === "development") {
                  console.warn(
                    `[x-disclosure] no animations started within ${ANIMATION_START_TIMEOUT}ms of transitioning to expanded. If you don't need animations add the .noanimate modifier`,
                    this.__disclosure_contentEl,
                  );
                }
                return Promise.resolve([]);
              } else if (e instanceof NoAnimationsFinishedError) {
                if (process.env.NODE_ENV === "development") {
                  console.warn(
                    `[x-disclosure] animations did not complete before timeout, it is recommended to keep your animations under a ${ANIMATION_COMPLETION_TIMEOUT}ms`,
                    this.__disclosure_contentEl,
                  );
                }
                return Promise.resolve([]);
              } else {
                throw e;
              }
            }
          },
          get __disclosure_groupIndex() {
            var _a, _b;
            return (_b = (_a = $data.__disclosure_group_state).indexOf) === null || _b === void 0
              ? void 0
              : _b.call(_a, this.$el);
          },
        };
      },
      ["x-id"]: "['disclosure', 'disclosure-panel', 'disclosure-button']",
    });
  }
  function buildDisclosureState(options) {
    var _a;
    let state = {
      isExpanded:
        (_a = options === null || options === void 0 ? void 0 : options.isExpanded) !== null && _a !== void 0
          ? _a
          : false,
      expand() {
        this.isExpanded = true;
      },
      collapse() {
        this.isExpanded = false;
      },
      toggle() {
        this.isExpanded = !this.isExpanded;
      },
      get isCollapsed() {
        return !this.isExpanded;
      },
    };
    if ((options === null || options === void 0 ? void 0 : options.isExpanded) !== undefined) {
      const isExpandedDescriptor = Object.getOwnPropertyDescriptor(options, "isExpanded");
      Object.defineProperty(state, "isExpanded", isExpandedDescriptor);
    }
    return state;
  }
  function buildSingleSelectDisclosureGroupState(options) {
    var _a;
    let state = {
      expandedIndex:
        (_a = options === null || options === void 0 ? void 0 : options.initiallyExpandedIndex) !== null &&
        _a !== void 0
          ? _a
          : null,
      items: new Set(),
      isExpanded(index) {
        return this.expandedIndex === index;
      },
      register(el) {
        this.items.add(el);
      },
      unregister(el) {
        this.items.delete(el);
      },
      indexOf(el) {
        return Array.from(this.items).indexOf(el);
      },
      toggle(index) {
        this.expandedIndex === index ? this.collapse(index) : this.expand(index);
      },
      expand(index) {
        this.expandedIndex = index;
      },
      collapse(index) {
        if (this.expandedIndex === index) {
          this.expandedIndex = null;
        }
      },
    };
    if (options && "expandedIndex" in options) {
      copyProperty(options, state, "expandedIndex");
    }
    return state;
  }
  function buildMultiSelectDisclosureGroupState(options) {
    var _a;
    let state = {
      expandedIndices:
        (_a = options === null || options === void 0 ? void 0 : options.initiallyExpandedIndices) !== null &&
        _a !== void 0
          ? _a
          : new Set(),
      items: new Set(),
      isExpanded(index) {
        return this.expandedIndices.has(index);
      },
      register(el) {
        this.items.add(el);
      },
      unregister(el) {
        this.items.delete(el);
      },
      indexOf(el) {
        return Array.from(this.items).indexOf(el);
      },
      toggle(index) {
        this.expandedIndices.has(index) ? this.collapse(index) : this.expand(index);
      },
      expand(index) {
        const expanded = this.expandedIndices;
        expanded.add(index);
        // Copy to a new set so that reactivity works
        this.expandedIndices = new Set(Array.from(expanded));
      },
      collapse(index) {
        const expanded = this.expandedIndices;
        expanded.delete(index);
        // Copy to a new set so that reactivity works
        this.expandedIndices = new Set(Array.from(expanded));
      },
    };
    if (options && "expandedIndices" in options) {
      copyProperty(options, state, "expandedIndices");
    }
    return state;
  }

  function section(Alpine) {
    Alpine.magic("sectionEl", ($el) => {
      return closestSectionEl($el);
    });
    Alpine.magic("sectionId", ($el) => {
      var _a;
      return (_a = closestSectionEl($el)) === null || _a === void 0 ? void 0 : _a.id;
    });
  }

  const DEFAULT_SLIDE_DURATION = 1000;
  /**
   * TODO document me
   */ function slideshow(Alpine) {
    Alpine.directive("slideshow", ($el, data, utilities) => {
      if (!isHtmlElement($el)) {
        throw new Error(`Expected HTMLElement but got ${$el}`);
      }
      if (data.value === "slide") {
        handleSlide($el, Alpine);
      } else if (data.value === "control") {
        handleControl($el, Alpine);
      } else if (data.value === "play") {
        handlePlayButton($el, Alpine);
      } else if (data.value === "pause") {
        handlePauseButton($el, Alpine);
      } else if (data.value === "next") {
        handleNextButton($el, Alpine);
      } else if (data.value === "prev") {
        handlePrevButton($el, Alpine);
      } else if (data.value === "toggle") {
        handleToggleButton($el, Alpine);
      } else if (data.value === "viewport") {
        handleViewport($el, Alpine);
      } else if (data.value === null) {
        handleRoot$1($el, Alpine, data, utilities);
      } else {
        throw new Error(`Unknown directive: x-slideshow:${data.value}`);
      }
    }).before("bind");
    Alpine.magic("slideshow", function ($el) {
      const $data = Alpine.$data($el);
      // Could probably just rename __slideshow_state to $slideshow and get rid of this magic
      // but I want to think through the implications of that before establishing a precedent
      return $data.__slideshow_state || {};
    });
    Alpine.magic("slide", function ($el) {
      const $data = Alpine.$data($el);
      return {
        get slideIndex() {
          return $data.__slideshowSlide_slideIndex;
        },
        get isCurrentSlide() {
          return $data.__slideshowSlide_isCurrentSlide;
        },
        get wasLastSlide() {
          return $data.__slideshowSlide_wasLastSlide;
        },
      };
    });
  }
  function handleControl($el, Alpine) {
    Alpine.bind($el, {
      ":aria-controls": '$id("slideshow")',
    });
  }
  function handlePlayButton($el, Alpine) {
    Alpine.bind($el, {
      "@click": "$slideshow.play()",
      "x-slideshow:control": "",
    });
  }
  function handlePauseButton($el, Alpine) {
    Alpine.bind($el, {
      "@click": "$slideshow.pause()",
      "x-slideshow:control": "",
    });
  }
  function handleNextButton($el, Alpine) {
    Alpine.bind($el, {
      "@click": "$slideshow.pause(); $slideshow.next()",
      "x-slideshow:control": "",
    });
  }
  function handlePrevButton($el, Alpine) {
    Alpine.bind($el, {
      "@click": "$slideshow.pause(); $slideshow.prev()",
      "x-slideshow:control": "",
    });
  }
  function handleToggleButton($el, Alpine) {
    Alpine.bind($el, {
      "@click": "$slideshow.toggle()",
      "x-slideshow:control": "",
    });
  }
  function handleSlide($el, Alpine) {
    Alpine.bind($el, {
      ["x-data"]() {
        return {
          __slideshowSlide_slideIndex: null,
          init() {
            this.__slideshowSlide_slideIndex = this.__slideshow_state.totalSlides;
            this.__slideshow_state.totalSlides = this.__slideshowSlide_slideIndex + 1;
          },
          get __slideshowSlide_isCurrentSlide() {
            return this.__slideshow_state.currentSlideIndex === this.__slideshowSlide_slideIndex;
          },
          get __slideshowSlide_wasLastSlide() {
            return this.__slideshow_state.lastSlideIndex === this.__slideshowSlide_slideIndex;
          },
          destroy() {
            this.__slideshow_state.totalSlides -= 1;
          },
        };
      },
      role: "group",
      "aria-roledescription": "slide",
    });
  }
  function handleViewport($el, Alpine) {
    Alpine.bind($el, {
      ":id": `$id('slideshow')`,
      role: "region",
      "aria-roledescription": "carousel",
      ":aria-live": '$slideshow.state == "playing" ? "off" : "polite"',
      "@keydown.left.stop.prevent": "$slideshow.prev()",
      "@keydown.right.stop.prevent": "$slideshow.next()",
      "@focus": "$slideshow.pause()",
    });
  }
  function handleRoot$1($el, Alpine, data, { evaluate }) {
    let slideDuration = DEFAULT_SLIDE_DURATION;
    const autoplay = data.modifiers.includes("autoplay");
    if (data.modifiers.includes("duration")) {
      const rawValue = data.modifiers[data.modifiers.indexOf("duration") + 1];
      // Support x-slideshow.duration.500ms which will wait 500ms before transitioning to next slide
      let match = rawValue.match(/([0-9]+)ms/);
      if (match) slideDuration = Number(match[1]);
    }
    let expression = data.expression === "" ? "{}" : data.expression;
    let options = evaluate(expression);
    options.slideDuration = slideDuration;
    options.autoplay = autoplay;
    if (options !== undefined && options !== null && !isPlainObject(options)) {
      throw new Error(`options must be an object, but got ${options}`);
    }
    let state = buildSlideshowState(options);
    Alpine.bind($el, {
      ["x-data"]() {
        return {
          __slideshow_autoplayTimeoutId: undefined,
          __slideshow_animationFrameId: undefined,
          __slideshow_state: state,
          init() {
            let lastTimestamp;
            const updateProgress = (timestamp) => {
              if (lastTimestamp === undefined) lastTimestamp = timestamp;
              const deltaTime = timestamp - lastTimestamp;
              lastTimestamp = timestamp;
              // Update the elapsed time
              this.__slideshow_state.currentSlideElapsedTime = Math.round(
                this.__slideshow_state.currentSlideElapsedTime + deltaTime,
              );
              // Request the next frame if playing
              if (this.__slideshow_state.state === "playing") {
                this.__slideshow_animationFrameId = requestAnimationFrame(updateProgress);
              }
            };
            const startProgressUpdates = () => {
              // Cancel any existing animation frame
              if (this.__slideshow_animationFrameId !== undefined) {
                cancelAnimationFrame(this.__slideshow_animationFrameId);
              }
              // Start updating progress
              lastTimestamp = undefined;
              this.__slideshow_animationFrameId = requestAnimationFrame(updateProgress);
            };
            const stopProgressUpdates = () => {
              if (this.__slideshow_animationFrameId !== undefined) {
                cancelAnimationFrame(this.__slideshow_animationFrameId);
                this.__slideshow_animationFrameId = undefined;
              }
            };
            const scheduleNextSlide = () => {
              // Clear any existing timeout
              if (this.__slideshow_autoplayTimeoutId !== undefined) {
                clearTimeout(this.__slideshow_autoplayTimeoutId);
                this.__slideshow_autoplayTimeoutId = undefined;
              }
              if (this.__slideshow_state.state === "playing") {
                // Start progress updates
                startProgressUpdates();
                // Schedule the next slide
                const remainingTime =
                  this.__slideshow_state.slideDuration - this.__slideshow_state.currentSlideElapsedTime;
                this.__slideshow_autoplayTimeoutId = window.setTimeout(() => {
                  // Move to the next slide
                  this.__slideshow_state.next();
                  // Reset elapsed time
                  this.__slideshow_state.currentSlideElapsedTime = 0;
                  // Schedule next slide
                  scheduleNextSlide();
                }, remainingTime);
              } else {
                // Slideshow is paused, stop progress updates
                stopProgressUpdates();
              }
            };
            // Watch for changes in play state
            this.$watch("__slideshow_state.state", () => {
              scheduleNextSlide();
            });
            // Watch for slide changes (e.g., manual navigation)
            this.$watch("__slideshow_state.currentSlideIndex", (_nextIndex, prevIndex) => {
              // Reset elapsed time and schedule next slide
              this.__slideshow_state.currentSlideElapsedTime = 0;
              this.__slideshow_state.lastSlideIndex = prevIndex;
              scheduleNextSlide();
            });
            // Initial scheduling
            scheduleNextSlide();
          },
          destroy() {
            if (this.__slideshow_autoplayTimeoutId !== undefined) {
              clearTimeout(this.__slideshow_autoplayTimeoutId);
            }
            if (this.__slideshow_animationFrameId !== undefined) {
              cancelAnimationFrame(this.__slideshow_animationFrameId);
            }
          },
        };
      },
      "x-id": "['slideshow']",
    });
  }
  function buildSlideshowState(options = {}) {
    const state = {
      state: options.autoplay ? "playing" : "paused",
      slideDuration: options.slideDuration || 1000,
      currentSlideIndex: options.initialSlideIndex || 0,
      lastSlideIndex: null,
      currentSlideElapsedTime: 0,
      totalSlides: 0,
      get nextSlideIndex() {
        return mod(this.currentSlideIndex + 1, this.totalSlides);
      },
      get prevSlideIndex() {
        return mod(this.currentSlideIndex - 1, this.totalSlides);
      },
      next() {
        this.currentSlideIndex = this.nextSlideIndex;
      },
      prev() {
        this.currentSlideIndex = this.prevSlideIndex;
      },
      play() {
        if (this.state === "playing") return;
        this.state = "playing";
      },
      pause() {
        if (this.state === "paused") return;
        this.state = "paused";
      },
      toggle() {
        if (this.state === "playing") {
          this.pause();
        } else {
          this.play();
        }
      },
    };
    if ((options === null || options === void 0 ? void 0 : options.state) !== undefined) {
      copyProperty(options, state, "state");
    }
    if ((options === null || options === void 0 ? void 0 : options.currentSlideIndex) !== undefined) {
      copyProperty(options, state, "currentSlideIndex");
    }
    return state;
  }

  var ThemeEditorEvent;
  (function (ThemeEditorEvent1) {
    ThemeEditorEvent1["INSPECTOR_ACTIVATED"] = "shopify:inspector:activate";
    ThemeEditorEvent1["INSPECTOR_DEACTIVATED"] = "shopify:inspector:deactivate";
    ThemeEditorEvent1["SECTION_LOAD"] = "shopify:section:load";
    ThemeEditorEvent1["SECTION_UNLOAD"] = "shopify:section:unload";
    ThemeEditorEvent1["SECTION_SELECT"] = "shopify:section:select";
    ThemeEditorEvent1["SECTION_DESELECT"] = "shopify:section:deselect";
    ThemeEditorEvent1["SECTION_REORDER"] = "shopify:section:reorder";
    ThemeEditorEvent1["BLOCK_SELECT"] = "shopify:block:select";
    ThemeEditorEvent1["BLOCK_DESELECT"] = "shopify:block:deselect";
  })(ThemeEditorEvent || (ThemeEditorEvent = {}));

  var ThemeEvent;
  (function (ThemeEvent1) {
    ThemeEvent1["CART_ITEM_ADD"] = "theme:cart-item:add";
    ThemeEvent1["CART_ITEM_UPDATE"] = "theme:cart-item:update";
    ThemeEvent1["THEME_SECTION_NAVIGATE"] = "theme:section:navigate";
    ThemeEvent1["THEME_SECTION_LOAD"] = "theme:section:load";
    ThemeEvent1["THEME_SECTION_UPDATE"] = "theme:section:update";
  })(ThemeEvent || (ThemeEvent = {}));

  /**
   * Plugin to make it easy to integrate with the theme editor
   *
   * TODO: more docs!
   *
   * @example
   *
   * <div>
   *   <div
   *     x-disclosure
   *     {% if request.design_mode %}
   *       @shopify:section:select.window="
   *         if($isSelectedSection) {
   *           $disclosure.expand()
   *         }
   *       "
   *       @shopify:section:deselect.window="
   *         if($wasSelectedSection) {
   *           $disclosure.collapse()
   *         }
   *       "
   *     {% endif %}
   *   >
   *     <button x-disclosure:button>Toggle</button>
   *     <div x-disclosure:panel>My content</div>
   *   </div>
   * </div>
   */ function themeEditor(Alpine) {
    Alpine.magic("isSelectedSection", handleIsSelectedSectionMagic(Alpine));
    Alpine.magic("isSelectedBlock", handleIsSelectedBlockMagic(Alpine));
    Alpine.magic("isInSelectedBlockTree", handleIsInSelectedBlockTreeMagic(Alpine));
    Alpine.magic("wasSelectedSection", handleWasSelectedSectionMagic(Alpine));
    Alpine.magic("wasInSelectedBlockTree", handleWasInSelectedBlockTreeMagic(Alpine));
    Alpine.magic("wasSelectedBlock", handleWasSelectedBlockMagic(Alpine));
    Alpine.magic("selectedSection", handleSelectedSectionMagic(Alpine));
    Alpine.magic("selectedBlock", handleSelectedBlockMagic(Alpine));
    Alpine.magic("prevSelectedSection", handlePrevSelectedSectionMagic(Alpine));
    Alpine.magic("prevSelectedBlock", handlePrevSelectedBlockMagic(Alpine));
    Alpine.store("themeEditor", themeEditorStore);
  }
  /**
   * Returns the  selected section in the theme editor
   */ function handleSelectedSectionMagic(Alpine) {
    return function (_$el) {
      var _a;
      if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return null;
      const selectedSection = Alpine.store("themeEditor").selectedSection;
      return selectedSection;
    };
  }
  /**
   * Returns the previously selected section in the theme editor
   */ function handlePrevSelectedSectionMagic(Alpine) {
    return function (_$el) {
      var _a;
      if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return null;
      const selectedSection = Alpine.store("themeEditor").prevSelectedSection;
      return selectedSection;
    };
  }
  /**
   * Returns the previously selected block in the theme editor
   */ function handlePrevSelectedBlockMagic(Alpine) {
    return function (_$el) {
      var _a;
      if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return null;
      const selectedBlock = Alpine.store("themeEditor").prevSelectedBlock;
      return selectedBlock;
    };
  }
  /**
   * Returns the selected block in the theme editor
   */ function handleSelectedBlockMagic(Alpine) {
    return function (_$el) {
      var _a;
      if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return null;
      const selectedBlock = Alpine.store("themeEditor").selectedBlock;
      return selectedBlock;
    };
  }
  /**
   * Returns whether the current element is the selected section in the theme editor or a descendant of it
   */ function handleIsSelectedSectionMagic(Alpine) {
    return function ($el) {
      var _a;
      if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return false;
      if (!isHtmlElement) {
        throw new Error(`Expected HTMLElement but got ${$el}`);
      }
      const el = closestSectionEl($el);
      const selectedSection = Alpine.store("themeEditor").selectedSection;
      if (!el) return false;
      if (!selectedSection) return false;
      return el.id == selectedSection.id;
    };
  }
  /**
   * Returns whether the current element is the previously selected section in the theme editor or a descendant of it
   */ function handleWasSelectedSectionMagic(Alpine) {
    return function ($el) {
      var _a;
      if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return false;
      if (!isHtmlElement) {
        throw new Error(`Expected HTMLElement but got ${$el}`);
      }
      const el = closestSectionEl($el);
      const prevSelectedSection = Alpine.store("themeEditor").prevSelectedSection;
      if (!el) return false;
      if (!prevSelectedSection) return false;
      return el.id == prevSelectedSection.id;
    };
  }
  /**
   * Returns whether the current element is the selected block in the theme editor
   */ function handleIsSelectedBlockMagic(Alpine) {
    return function ($el) {
      var _a;
      if (!isHtmlElement($el)) {
        throw new Error(`Expected HTMLElement but got ${$el}`);
      }
      if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return false;
      const el = $el.closest("[data-shopify-editor-block]");
      const selectedBlock = Alpine.store("themeEditor").selectedBlock;
      if (!el) return false;
      if (!selectedBlock) return false;
      return el === selectedBlock;
    };
  }
  /**
   * Returns whether the current element is the selected block, a descendant of it, or a parent of it
   */ function handleIsInSelectedBlockTreeMagic(Alpine) {
    return function ($el) {
      var _a;
      if (!isHtmlElement($el)) {
        throw new Error(`Expected HTMLElement but got ${$el}`);
      }
      if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return false;
      const el = $el.closest("[data-shopify-editor-block]");
      const selectedBlock = Alpine.store("themeEditor").selectedBlock;
      if (!el) return false;
      if (!selectedBlock) return false;
      return el.contains(selectedBlock) || el === selectedBlock || selectedBlock.contains(el);
    };
  }
  /**
   * Returns whether the current element is the selected block in the theme editor
   */ function handleWasSelectedBlockMagic(Alpine) {
    return function ($el) {
      var _a;
      if (!isHtmlElement($el)) {
        throw new Error(`Expected HTMLElement but got ${$el}`);
      }
      if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return false;
      const el = $el.closest("[data-shopify-editor-block]");
      const selectedBlock = Alpine.store("themeEditor").prevSelectedBlock;
      if (!el) return false;
      if (!selectedBlock) return false;
      return el == selectedBlock;
    };
  }
  /**
   * Returns whether the current element was the selected block, a descendant of it, or an ancestor of it
   */ function handleWasInSelectedBlockTreeMagic(Alpine) {
    return function ($el) {
      var _a;
      if (!isHtmlElement($el)) {
        throw new Error(`Expected HTMLElement but got ${$el}`);
      }
      if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return false;
      const el = $el.closest("[data-shopify-editor-block]");
      const selectedBlock = Alpine.store("themeEditor").prevSelectedBlock;
      if (!el) return false;
      if (!selectedBlock) return false;
      return el.contains(selectedBlock) || el === selectedBlock || selectedBlock.contains(el);
    };
  }
  const themeEditorStore = {
    isInspectorActive: false,
    selectedSectionId: null,
    prevSelectedSectionId: null,
    selectedBlock: null,
    prevSelectedBlock: null,
    get selectedSection() {
      if (!this.selectedSectionId) return null;
      return document.getElementById(`shopify-section-${this.selectedSectionId}`);
    },
    get prevSelectedSection() {
      if (!this.prevSelectedSectionId) return null;
      return document.getElementById(`shopify-section-${this.prevSelectedSectionId}`);
    },
    init() {
      window.addEventListener(ThemeEditorEvent.INSPECTOR_ACTIVATED, () => {
        var _a;
        if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return false;
        this.isInspectorActive = true;
      });
      window.addEventListener(ThemeEditorEvent.INSPECTOR_DEACTIVATED, () => {
        var _a;
        if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return false;
        this.isInspectorActive = false;
      });
      window.addEventListener(ThemeEditorEvent.SECTION_SELECT, (e) => {
        var _a;
        if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return false;
        const sectionSelectEvent = e;
        this.prevSelectedSectionId = this.selectedSectionId;
        this.selectedSectionId = sectionSelectEvent.detail.sectionId;
      });
      window.addEventListener(ThemeEditorEvent.SECTION_DESELECT, (e) => {
        var _a;
        if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return false;
        this.prevSelectedSectionId = this.selectedSectionId;
        this.selectedSectionId = null;
      });
      window.addEventListener(ThemeEditorEvent.BLOCK_SELECT, (e) => {
        var _a;
        if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return false;
        const blockSelectEvent = e;
        this.prevSelectedBlock = this.selectedBlock;
        this.selectedBlock = blockSelectEvent.target;
      });
      window.addEventListener(ThemeEditorEvent.BLOCK_DESELECT, (e) => {
        var _a;
        if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return false;
        this.prevSelectedBlock = this.selectedBlock;
        this.selectedBlock = null;
      });
      window.addEventListener(ThemeEditorEvent.SECTION_LOAD, (e) => {
        var _a;
        if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return false;
        // NOOP for now
      });
      window.addEventListener(ThemeEditorEvent.SECTION_UNLOAD, (e) => {
        var _a;
        if (!((_a = window.Shopify) === null || _a === void 0 ? void 0 : _a.designMode)) return false;
        // NOOP for now
      });
    },
  };

  (undefined && undefined.__rest) ||
    function (s, e) {
      var t = {};
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
          if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
        }
      return t;
    };

  function removeItem(arr, item) {
    const index = arr.indexOf(item);
    if (index > -1) arr.splice(index, 1);
  }

  let invariant = () => {};
  if (process.env.NODE_ENV !== "production") {
    invariant = (check, message) => {
      if (!check) {
        throw new Error(message);
      }
    };
  }

  const MotionGlobalConfig = {};

  /*#__NO_SIDE_EFFECTS__*/ function memo(callback) {
    let result;
    return () => {
      if (result === undefined) result = callback();
      return result;
    };
  }

  /*#__NO_SIDE_EFFECTS__*/ const noop = (any) => any;
  /**
   * Converts seconds to milliseconds
   *
   * @param seconds - Time in seconds.
   * @return milliseconds - Converted time in milliseconds.
   */ /*#__NO_SIDE_EFFECTS__*/ const secondsToMilliseconds = (seconds) => seconds * 1000;
  /*#__NO_SIDE_EFFECTS__*/ const millisecondsToSeconds = (milliseconds) => milliseconds / 1000;
  const supportsScrollTimeline = /* @__PURE__ */ memo(() => window.ScrollTimeline !== undefined);

  let GroupAnimation = class GroupAnimation {
    get finished() {
      return Promise.all(this.animations.map((animation) => animation.finished));
    }
    /**
     * TODO: Filter out cancelled or stopped animations before returning
     */ getAll(propName) {
      return this.animations[0][propName];
    }
    setAll(propName, newValue) {
      for (let i = 0; i < this.animations.length; i++) {
        this.animations[i][propName] = newValue;
      }
    }
    attachTimeline(timeline, fallback) {
      const subscriptions = this.animations.map((animation) => {
        if (supportsScrollTimeline() && animation.attachTimeline) {
          return animation.attachTimeline(timeline);
        } else if (typeof fallback === "function") {
          return fallback(animation);
        }
      });
      return () => {
        subscriptions.forEach((cancel, i) => {
          cancel && cancel();
          this.animations[i].stop();
        });
      };
    }
    get time() {
      return this.getAll("time");
    }
    set time(time) {
      this.setAll("time", time);
    }
    get speed() {
      return this.getAll("speed");
    }
    set speed(speed) {
      this.setAll("speed", speed);
    }
    get startTime() {
      return this.getAll("startTime");
    }
    get duration() {
      let max = 0;
      for (let i = 0; i < this.animations.length; i++) {
        max = Math.max(max, this.animations[i].duration);
      }
      return max;
    }
    runAll(methodName) {
      this.animations.forEach((controls) => controls[methodName]());
    }
    flatten() {
      this.runAll("flatten");
    }
    play() {
      this.runAll("play");
    }
    pause() {
      this.runAll("pause");
    }
    cancel() {
      this.runAll("cancel");
    }
    complete() {
      this.runAll("complete");
    }
    constructor(animations) {
      // Bound to accomodate common `return animation.stop` pattern
      this.stop = () => this.runAll("stop");
      this.animations = animations.filter(Boolean);
    }
  };

  const isCSSVar = (name) => name.startsWith("--");
  const style$1 = {
    set: (element, name, value) => {
      isCSSVar(name) ? element.style.setProperty(name, value) : (element.style[name] = value);
    },
    get: (element, name) => {
      return isCSSVar(name) ? element.style.getPropertyValue(name) : element.style[name];
    },
  };

  const isNotNull = (value) => value !== null;
  function getFinalKeyframe(keyframes, { repeat, repeatType = "loop" }, finalKeyframe) {
    const resolvedKeyframes = keyframes.filter(isNotNull);
    const index = repeat && repeatType !== "loop" && repeat % 2 === 1 ? 0 : resolvedKeyframes.length - 1;
    return !index || finalKeyframe === undefined ? resolvedKeyframes[index] : finalKeyframe;
  }

  const supportsPartialKeyframes = /*@__PURE__*/ memo(() => {
    try {
      document.createElement("div").animate({
        opacity: [1],
      });
    } catch (e) {
      return false;
    }
    return true;
  });

  const pxValues = new Set([
    // Border props
    "borderWidth",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "borderRadius",
    "radius",
    "borderTopLeftRadius",
    "borderTopRightRadius",
    "borderBottomRightRadius",
    "borderBottomLeftRadius",
    // Positioning props
    "width",
    "maxWidth",
    "height",
    "maxHeight",
    "top",
    "right",
    "bottom",
    "left",
    // Spacing props
    "padding",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "margin",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    // Misc
    "backgroundPositionX",
    "backgroundPositionY",
  ]);

  function hydrateKeyframes(element, name, keyframes, pseudoElement) {
    if (!Array.isArray(keyframes)) {
      keyframes = [keyframes];
    }
    for (let i = 0; i < keyframes.length; i++) {
      if (keyframes[i] === null) {
        keyframes[i] = i === 0 && !pseudoElement ? style$1.get(element, name) : keyframes[i - 1];
      }
      if (typeof keyframes[i] === "number" && pxValues.has(name)) {
        keyframes[i] = keyframes[i] + "px";
      }
    }
    if (!pseudoElement && !supportsPartialKeyframes() && keyframes.length < 2) {
      keyframes.unshift(style$1.get(element, name));
    }
    return keyframes;
  }

  const isBezierDefinition = (easing) => Array.isArray(easing) && typeof easing[0] === "number";
  /**
   * Add the ability for test suites to manually set support flags
   * to better test more environments.
   */ const supportsFlags = {};

  function memoSupports(callback, supportsFlag) {
    const memoized = memo(callback);
    var _supportsFlag;
    return () =>
      (_supportsFlag = supportsFlags[supportsFlag]) !== null && _supportsFlag !== void 0 ? _supportsFlag : memoized();
  }

  const supportsLinearEasing = /*@__PURE__*/ memoSupports(() => {
    try {
      document.createElement("div").animate(
        {
          opacity: 0,
        },
        {
          easing: "linear(0, 1)",
        },
      );
    } catch (e) {
      return false;
    }
    return true;
  }, "linearEasing");

  const generateLinearEasing = (
    easing,
    duration,
    resolution = 10, // as milliseconds
  ) => {
    let points = "";
    const numPoints = Math.max(Math.round(duration / resolution), 2);
    for (let i = 0; i < numPoints; i++) {
      points += easing(i / (numPoints - 1)) + ", ";
    }
    return `linear(${points.substring(0, points.length - 2)})`;
  };

  const cubicBezierAsString = ([a, b, c, d]) => `cubic-bezier(${a}, ${b}, ${c}, ${d})`;
  const supportedWaapiEasing = {
    linear: "linear",
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
    circIn: /*@__PURE__*/ cubicBezierAsString([0, 0.65, 0.55, 1]),
    circOut: /*@__PURE__*/ cubicBezierAsString([0.55, 0, 1, 0.45]),
    backIn: /*@__PURE__*/ cubicBezierAsString([0.31, 0.01, 0.66, -0.59]),
    backOut: /*@__PURE__*/ cubicBezierAsString([0.33, 1.53, 0.69, 0.99]),
  };

  function mapEasingToNativeEasing(easing, duration) {
    if (!easing) {
      return undefined;
    } else if (typeof easing === "function" && supportsLinearEasing()) {
      return generateLinearEasing(easing, duration);
    } else if (isBezierDefinition(easing)) {
      return cubicBezierAsString(easing);
    } else if (Array.isArray(easing)) {
      return easing.map(
        (segmentEasing) => mapEasingToNativeEasing(segmentEasing, duration) || supportedWaapiEasing.easeOut,
      );
    } else {
      return supportedWaapiEasing[easing];
    }
  }

  function startWaapiAnimation(
    element,
    valueName,
    keyframes,
    { delay = 0, duration = 300, repeat = 0, repeatType = "loop", ease = "easeInOut", times } = {},
    pseudoElement = undefined,
  ) {
    const keyframeOptions = {
      [valueName]: keyframes,
    };
    if (times) keyframeOptions.offset = times;
    const easing = mapEasingToNativeEasing(ease, duration);
    /**
     * If this is an easing array, apply to keyframes, not animation as a whole
     */ if (Array.isArray(easing)) keyframeOptions.easing = easing;
    const animation = element.animate(keyframeOptions, {
      delay,
      duration,
      easing: !Array.isArray(easing) ? easing : "linear",
      fill: "both",
      iterations: repeat + 1,
      direction: repeatType === "reverse" ? "alternate" : "normal",
      pseudoElement,
    });
    return animation;
  }

  function isGenerator(type) {
    return typeof type === "function" && "applyToOptions" in type;
  }

  function applyGeneratorOptions({ type, ...options }) {
    if (isGenerator(type)) {
      return type.applyToOptions(options);
    } else {
      var _duration;
      (_duration = options.duration) !== null && _duration !== void 0 ? _duration : (options.duration = 300);
      var _ease;
      (_ease = options.ease) !== null && _ease !== void 0 ? _ease : (options.ease = "easeOut");
    }
    return options;
  }

  const animationMaps = new WeakMap();
  const animationMapKey = (name, pseudoElement) => `${name}:${pseudoElement}`;
  function getAnimationMap(element) {
    const map = animationMaps.get(element) || new Map();
    animationMaps.set(element, map);
    return map;
  }
  /**
   * NativeAnimation implements AnimationPlaybackControls for the browser's Web Animations API.
   */ let NativeAnimation = class NativeAnimation {
    play() {
      this.animation.play();
    }
    pause() {
      this.animation.pause();
    }
    complete() {
      this.animation.finish();
    }
    cancel() {
      try {
        this.animation.cancel();
      } catch (e) {}
      this.removeAnimation();
    }
    stop() {
      const { state } = this;
      if (state === "idle" || state === "finished") {
        return;
      }
      this.commitStyles();
      this.cancel();
    }
    /**
     * WAAPI doesn't natively have any interruption capabilities.
     *
     * In this method, we commit styles back to the DOM before cancelling
     * the animation.
     *
     * This is designed to be overridden by NativeAnimationExtended, which
     * will create a renderless JS animation and sample it twice to calculate
     * its current value, "previous" value, and therefore allow
     * Motion to also correctly calculate velocity for any subsequent animation
     * while deferring the commit until the next animation frame.
     */ commitStyles() {
      if (!this.isPseudoElement) {
        var _animation, ref;
        (ref = (_animation = this.animation).commitStyles) === null || ref === void 0 ? void 0 : ref.call(_animation);
      }
    }
    get duration() {
      var ref;
      const duration =
        ((ref = this.animation.effect) === null || ref === void 0 ? void 0 : ref.getComputedTiming().duration) || 0;
      return millisecondsToSeconds(Number(duration));
    }
    get time() {
      return millisecondsToSeconds(Number(this.animation.currentTime) || 0);
    }
    set time(newTime) {
      this.animation.currentTime = secondsToMilliseconds(newTime);
    }
    /**
     * The playback speed of the animation.
     * 1 = normal speed, 2 = double speed, 0.5 = half speed.
     */ get speed() {
      return this.animation.playbackRate;
    }
    set speed(newSpeed) {
      this.animation.playbackRate = newSpeed;
    }
    get state() {
      return this.animation.playState;
    }
    get startTime() {
      return Number(this.animation.startTime);
    }
    get finished() {
      return this.animation.finished;
    }
    flatten() {
      if (this.allowFlatten) {
        var ref;
        (ref = this.animation.effect) === null || ref === void 0
          ? void 0
          : ref.updateTiming({
              easing: "linear",
            });
      }
    }
    /**
     * Attaches a timeline to the animation, for instance the `ScrollTimeline`.
     */ attachTimeline(timeline) {
      this.animation.timeline = timeline;
      this.animation.onfinish = null;
      return noop;
    }
    /**
     * Allows the animation to be awaited.
     *
     * @deprecated Use `finished` instead.
     */ then(onResolve, onReject) {
      return this.finished.then(onResolve).catch(onReject);
    }
    constructor(options) {
      /**
       * If we already have an animation, we don't need to instantiate one
       * and can just use this as a controls interface.
       */ if ("animation" in options) {
        this.animation = options.animation;
        return;
      }
      const { element, name, keyframes: unresolvedKeyframes, pseudoElement, allowFlatten = false } = options;
      let { transition } = options;
      this.isPseudoElement = Boolean(pseudoElement);
      this.allowFlatten = allowFlatten;
      /**
       * Stop any existing animations on the element before reading existing keyframes.
       *
       * TODO: Check for VisualElement before using animation state. This is a fallback
       * for mini animate(). Do this when implementing NativeAnimationExtended.
       */ const animationMap = getAnimationMap(element);
      const key = animationMapKey(name, pseudoElement || "");
      const currentAnimation = animationMap.get(key);
      currentAnimation && currentAnimation.stop();
      /**
       * TODO: If these keyframes aren't correctly hydrated then we want to throw
       * run an instant animation.
       */ const keyframes = hydrateKeyframes(element, name, unresolvedKeyframes, pseudoElement);
      invariant(
        typeof transition.type !== "string",
        `animateMini doesn't support "type" as a string. Did you mean to import { spring } from "motion"?`,
      );
      transition = applyGeneratorOptions(transition);
      this.animation = startWaapiAnimation(element, name, keyframes, transition, pseudoElement);
      if (transition.autoplay === false) {
        this.animation.pause();
      }
      this.removeAnimation = () => animationMap.delete(key);
      this.animation.onfinish = () => {
        if (!pseudoElement) {
          style$1.set(element, name, getFinalKeyframe(keyframes, transition));
          this.cancel();
        }
      };
      /**
       * TODO: Check for VisualElement before using animation state.
       */ animationMap.set(key, this);
    }
  };

  function getValueTransition(transition, key) {
    var ref, ref1;
    return (ref1 =
      (ref = transition === null || transition === void 0 ? void 0 : transition[key]) !== null && ref !== void 0
        ? ref
        : transition === null || transition === void 0
          ? void 0
          : transition["default"]) !== null && ref1 !== void 0
      ? ref1
      : transition;
  }

  const stepsOrder = ["read", "resolveKeyframes", "update", "preRender", "render", "postRender"];

  function createRenderStep(runNextFrame, stepName) {
    /**
     * We create and reuse two queues, one to queue jobs for the current frame
     * and one for the next. We reuse to avoid triggering GC after x frames.
     */ let thisFrame = new Set();
    let nextFrame = new Set();
    /**
     * Track whether we're currently processing jobs in this step. This way
     * we can decide whether to schedule new jobs for this frame or next.
     */ let isProcessing = false;
    let flushNextFrame = false;
    /**
     * A set of processes which were marked keepAlive when scheduled.
     */ const toKeepAlive = new WeakSet();
    let latestFrameData = {
      delta: 0.0,
      timestamp: 0.0,
      isProcessing: false,
    };
    function triggerCallback(callback) {
      if (toKeepAlive.has(callback)) {
        step.schedule(callback);
        runNextFrame();
      }
      callback(latestFrameData);
    }
    const step = {
      /**
       * Schedule a process to run on the next frame.
       */ schedule: (callback, keepAlive = false, immediate = false) => {
        const addToCurrentFrame = immediate && isProcessing;
        const queue = addToCurrentFrame ? thisFrame : nextFrame;
        if (keepAlive) toKeepAlive.add(callback);
        if (!queue.has(callback)) queue.add(callback);
        return callback;
      },
      /**
       * Cancel the provided callback from running on the next frame.
       */ cancel: (callback) => {
        nextFrame.delete(callback);
        toKeepAlive.delete(callback);
      },
      /**
       * Execute all schedule callbacks.
       */ process: (frameData) => {
        latestFrameData = frameData;
        /**
         * If we're already processing we've probably been triggered by a flushSync
         * inside an existing process. Instead of executing, mark flushNextFrame
         * as true and ensure we flush the following frame at the end of this one.
         */ if (isProcessing) {
          flushNextFrame = true;
          return;
        }
        isProcessing = true;
        [thisFrame, nextFrame] = [nextFrame, thisFrame];
        // Execute this frame
        thisFrame.forEach(triggerCallback);
        // Clear the frame so no callbacks remain. This is to avoid
        // memory leaks should this render step not run for a while.
        thisFrame.clear();
        isProcessing = false;
        if (flushNextFrame) {
          flushNextFrame = false;
          step.process(frameData);
        }
      },
    };
    return step;
  }

  const maxElapsed = 40;
  function createRenderBatcher(scheduleNextBatch, allowKeepAlive) {
    let runNextFrame = false;
    let useDefaultElapsed = true;
    const state = {
      delta: 0.0,
      timestamp: 0.0,
      isProcessing: false,
    };
    const flagRunNextFrame = () => (runNextFrame = true);
    const steps = stepsOrder.reduce((acc, key) => {
      acc[key] = createRenderStep(flagRunNextFrame);
      return acc;
    }, {});
    const { read, resolveKeyframes, update, preRender, render, postRender } = steps;
    const processBatch = () => {
      const timestamp = MotionGlobalConfig.useManualTiming ? state.timestamp : performance.now();
      runNextFrame = false;
      if (!MotionGlobalConfig.useManualTiming) {
        state.delta = useDefaultElapsed ? 1000 / 60 : Math.max(Math.min(timestamp - state.timestamp, maxElapsed), 1);
      }
      state.timestamp = timestamp;
      state.isProcessing = true;
      // Unrolled render loop for better per-frame performance
      read.process(state);
      resolveKeyframes.process(state);
      update.process(state);
      preRender.process(state);
      render.process(state);
      postRender.process(state);
      state.isProcessing = false;
      if (runNextFrame && allowKeepAlive) {
        useDefaultElapsed = false;
        scheduleNextBatch(processBatch);
      }
    };
    const wake = () => {
      runNextFrame = true;
      useDefaultElapsed = true;
      if (!state.isProcessing) {
        scheduleNextBatch(processBatch);
      }
    };
    const schedule = stepsOrder.reduce((acc, key) => {
      const step = steps[key];
      acc[key] = (process, keepAlive = false, immediate = false) => {
        if (!runNextFrame) wake();
        return step.schedule(process, keepAlive, immediate);
      };
      return acc;
    }, {});
    const cancel = (process) => {
      for (let i = 0; i < stepsOrder.length; i++) {
        steps[stepsOrder[i]].cancel(process);
      }
    };
    return {
      schedule,
      cancel,
      state,
      steps,
    };
  }

  const { schedule: microtask, cancel: cancelMicrotask } = /* @__PURE__ */ createRenderBatcher(queueMicrotask, false);

  function chooseLayerType(valueName) {
    if (valueName === "layout") return "group";
    if (valueName === "enter" || valueName === "new") return "new";
    if (valueName === "exit" || valueName === "old") return "old";
    return "group";
  }

  let pendingRules = {};
  let style = null;
  const css = {
    set: (selector, values) => {
      pendingRules[selector] = values;
    },
    commit: () => {
      if (!style) {
        style = document.createElement("style");
        style.id = "motion-view";
      }
      let cssText = "";
      for (const selector in pendingRules) {
        const rule = pendingRules[selector];
        cssText += `${selector} {\n`;
        for (const [property, value] of Object.entries(rule)) {
          cssText += `  ${property}: ${value};\n`;
        }
        cssText += "}\n";
      }
      style.textContent = cssText;
      document.head.appendChild(style);
      pendingRules = {};
    },
    remove: () => {
      if (style && style.parentElement) {
        style.parentElement.removeChild(style);
      }
    },
  };

  function getLayerName(pseudoElement) {
    const match = pseudoElement.match(/::view-transition-(old|new|group|image-pair)\((.*?)\)/);
    if (!match) return null;
    return {
      layer: match[2],
      type: match[1],
    };
  }

  function filterViewAnimations(animation) {
    var ref;
    const { effect } = animation;
    if (!effect) return false;
    return (
      effect.target === document.documentElement &&
      ((ref = effect.pseudoElement) === null || ref === void 0 ? void 0 : ref.startsWith("::view-transition"))
    );
  }
  function getViewAnimations() {
    return document.getAnimations().filter(filterViewAnimations);
  }

  function hasTarget(target, targets) {
    return targets.has(target) && Object.keys(targets.get(target)).length > 0;
  }

  const definitionNames = ["layout", "enter", "exit", "new", "old"];
  function startViewAnimation(builder) {
    const { update, targets, options: defaultOptions } = builder;
    if (!document.startViewTransition) {
      return new Promise(async (resolve) => {
        await update();
        resolve(new GroupAnimation([]));
      });
    }
    // TODO: Go over existing targets and ensure they all have ids
    /**
     * If we don't have any animations defined for the root target,
     * remove it from being captured.
     */ if (!hasTarget("root", targets)) {
      css.set(":root", {
        "view-transition-name": "none",
      });
    }
    /**
     * Set the timing curve to linear for all view transition layers.
     * This gets baked into the keyframes, which can't be changed
     * without breaking the generated animation.
     *
     * This allows us to set easing via updateTiming - which can be changed.
     */ css.set("::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*)", {
      "animation-timing-function": "linear !important",
    });
    css.commit(); // Write
    const transition = document.startViewTransition(async () => {
      await update();
      // TODO: Go over new targets and ensure they all have ids
    });
    transition.finished.finally(() => {
      css.remove(); // Write
    });
    return new Promise((resolve) => {
      transition.ready.then(() => {
        const generatedViewAnimations = getViewAnimations();
        const animations = [];
        /**
         * Create animations for each of our explicitly-defined subjects.
         */ targets.forEach((definition, target) => {
          // TODO: If target is not "root", resolve elements
          // and iterate over each
          for (const key of definitionNames) {
            if (!definition[key]) continue;
            const { keyframes, options } = definition[key];
            for (let [valueName, valueKeyframes] of Object.entries(keyframes)) {
              if (!valueKeyframes) continue;
              const valueOptions = {
                ...getValueTransition(defaultOptions, valueName),
                ...getValueTransition(options, valueName),
              };
              const type = chooseLayerType(key);
              /**
               * If this is an opacity animation, and keyframes are not an array,
               * we need to convert them into an array and set an initial value.
               */ if (valueName === "opacity" && !Array.isArray(valueKeyframes)) {
                const initialValue = type === "new" ? 0 : 1;
                valueKeyframes = [initialValue, valueKeyframes];
              }
              /**
               * Resolve stagger function if provided.
               */ if (typeof valueOptions.delay === "function") {
                valueOptions.delay = valueOptions.delay(0, 1);
              }
              valueOptions.duration && (valueOptions.duration = secondsToMilliseconds(valueOptions.duration));
              valueOptions.delay && (valueOptions.delay = secondsToMilliseconds(valueOptions.delay));
              const animation = new NativeAnimation({
                element: document.documentElement,
                name: valueName,
                pseudoElement: `::view-transition-${type}(${target})`,
                keyframes: valueKeyframes,
                transition: valueOptions,
              });
              animations.push(animation);
            }
          }
        });
        /**
         * Handle browser generated animations
         */ for (const animation1 of generatedViewAnimations) {
          if (animation1.playState === "finished") continue;
          const { effect } = animation1;
          if (!effect || !(effect instanceof KeyframeEffect)) continue;
          const { pseudoElement } = effect;
          if (!pseudoElement) continue;
          const name = getLayerName(pseudoElement);
          if (!name) continue;
          const targetDefinition = targets.get(name.layer);
          if (!targetDefinition) {
            /**
             * If transition name is group then update the timing of the animation
             * whereas if it's old or new then we could possibly replace it using
             * the above method.
             */ const transitionName = name.type === "group" ? "layout" : "";
            let animationTransition = {
              ...getValueTransition(defaultOptions, transitionName),
            };
            animationTransition.duration &&
              (animationTransition.duration = secondsToMilliseconds(animationTransition.duration));
            animationTransition = applyGeneratorOptions(animationTransition);
            const easing = mapEasingToNativeEasing(animationTransition.ease, animationTransition.duration);
            var _delay;
            effect.updateTiming({
              delay: secondsToMilliseconds(
                (_delay = animationTransition.delay) !== null && _delay !== void 0 ? _delay : 0,
              ),
              duration: animationTransition.duration,
              easing,
            });
            animations.push(
              new NativeAnimation({
                animation: animation1,
              }),
            );
          } else if (
            hasOpacity(targetDefinition, "enter") &&
            hasOpacity(targetDefinition, "exit") &&
            effect.getKeyframes().some((keyframe) => keyframe.mixBlendMode)
          ) {
            animations.push(
              new NativeAnimation({
                animation: animation1,
              }),
            );
          } else {
            animation1.cancel();
          }
        }
        resolve(new GroupAnimation(animations));
      });
    });
  }
  function hasOpacity(target, key) {
    var ref;
    return target === null || target === void 0
      ? void 0
      : (ref = target[key]) === null || ref === void 0
        ? void 0
        : ref.keyframes.opacity;
  }

  let builders = [];
  let current = null;
  function next() {
    current = null;
    const [nextBuilder] = builders;
    if (nextBuilder) start(nextBuilder);
  }
  function start(builder) {
    removeItem(builders, builder);
    current = builder;
    startViewAnimation(builder).then((animation) => {
      builder.notifyReady(animation);
      animation.finished.finally(next);
    });
  }
  function processQueue() {
    var ref;
    /**
     * Iterate backwards over the builders array. We can ignore the
     * "wait" animations. If we have an interrupting animation in the
     * queue then we need to batch all preceeding animations into it.
     * Currently this only batches the update functions but will also
     * need to batch the targets.
     */ for (let i = builders.length - 1; i >= 0; i--) {
      const builder = builders[i];
      const { interrupt } = builder.options;
      if (interrupt === "immediate") {
        const batchedUpdates = builders.slice(0, i + 1).map((b) => b.update);
        const remaining = builders.slice(i + 1);
        builder.update = () => {
          batchedUpdates.forEach((update) => update());
        };
        // Put the current builder at the front, followed by any "wait" builders
        builders = [builder, ...remaining];
        break;
      }
    }
    if (!current || ((ref = builders[0]) === null || ref === void 0 ? void 0 : ref.options.interrupt) === "immediate") {
      next();
    }
  }
  function addToQueue(builder) {
    builders.push(builder);
    microtask.render(processQueue);
  }

  let ViewTransitionBuilder = class ViewTransitionBuilder {
    get(selector) {
      this.currentTarget = selector;
      return this;
    }
    layout(keyframes, options) {
      this.updateTarget("layout", keyframes, options);
      return this;
    }
    new(keyframes, options) {
      this.updateTarget("new", keyframes, options);
      return this;
    }
    old(keyframes, options) {
      this.updateTarget("old", keyframes, options);
      return this;
    }
    enter(keyframes, options) {
      this.updateTarget("enter", keyframes, options);
      return this;
    }
    exit(keyframes, options) {
      this.updateTarget("exit", keyframes, options);
      return this;
    }
    crossfade(options) {
      this.updateTarget(
        "enter",
        {
          opacity: 1,
        },
        options,
      );
      this.updateTarget(
        "exit",
        {
          opacity: 0,
        },
        options,
      );
      return this;
    }
    updateTarget(target, keyframes, options = {}) {
      const { currentTarget, targets } = this;
      if (!targets.has(currentTarget)) {
        targets.set(currentTarget, {});
      }
      const targetData = targets.get(currentTarget);
      targetData[target] = {
        keyframes,
        options,
      };
    }
    then(resolve, reject) {
      return this.readyPromise.then(resolve, reject);
    }
    constructor(update, options = {}) {
      this.currentTarget = "root";
      this.targets = new Map();
      this.notifyReady = noop;
      this.readyPromise = new Promise((resolve) => {
        this.notifyReady = resolve;
      });
      this.update = update;
      this.options = {
        interrupt: "wait",
        ...options,
      };
      addToQueue(this);
    }
  };
  function animateView(update, defaultOptions = {}) {
    return new ViewTransitionBuilder(update, defaultOptions);
  }

  var __rest =
    (undefined && undefined.__rest) ||
    function (s, e) {
      var t = {};
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
          if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
        }
      return t;
    };
  const ANIMATE_CONTEXT_KEY = Symbol("ANIMATE_CONTEXT_KEY");
  function motion(Alpine) {
    Alpine.directive("animate", ($el, { expression, modifiers }, { evaluateLater, effect }) => {
      if (!isHtmlElement($el)) {
        throw new Error(`Expected HTMLElement but got ${$el}`);
      }
      if (!expression) {
        throw new Error(
          "Expected x-animate to be passed a motion keyframes object but was passed nothing. See https://motion.dev/dom/animate#keyframes",
        );
      }
      const keyframesFn = evaluateLater(expression);
      const context = Alpine.reactive({
        controls: null,
      });
      // Autoplay the animation unless .pause modifier is present
      const autoplay = !modifiers.includes("pause");
      effect(() => {
        keyframesFn((keyframes) => {
          if (!isPlainObject(keyframes)) {
            throw new Error(
              String.raw`Expected x-animate to be passed a motion keyframes object but got '${String(keyframes)}'. See https://motion.dev/dom/animate#keyframes`,
            );
          }
          context.controls = animate($el, keyframes, {
            autoplay,
          });
        });
        // Make controls available on node
        Alpine.addScopeToNode($el, {
          [ANIMATE_CONTEXT_KEY]: context,
        });
      });
    });
    Alpine.directive("animate-scroll", ($el, { expression }, { evaluate }) => {
      if (!isHtmlElement($el)) {
        throw new Error(`Expected HTMLElement but got ${$el}`);
      }
      if (!expression) {
        throw new Error(
          "Expected x-animate to be passed a motion keyframes object but was passed nothing. See https://motion.dev/dom/animate#keyframes",
        );
      }
      const keyframes = evaluate(expression);
      Alpine.bind($el, {
        "x-data"() {
          return {
            __animateScroll_isVisible: false,
            __animateScroll_animation: null,
            __animateScroll_cancelScrollAnimation: null,
            init() {
              this.__animateScroll_animation = animate($el, keyframes);
              this.$watch("__animateScroll_isVisible", (isVisible) => {
                var _a, _b;
                if (isVisible) {
                  (_a = this.__animateScroll_cancelScrollAnimation) === null || _a === void 0 ? void 0 : _a.call(this);
                  this.__animateScroll_cancelScrollAnimation = scroll(this.__animateScroll_animation, {
                    target: $el,
                    offset: ["0% 100%", "100% 0%"],
                  });
                } else {
                  (_b = this.__animateScroll_cancelScrollAnimation) === null || _b === void 0 ? void 0 : _b.call(this);
                }
              });
            },
            destroy() {
              var _a;
              (_a = this.__animateScroll_cancelScrollAnimation) === null || _a === void 0 ? void 0 : _a.call(this);
            },
          };
        },
        "x-intersect:enter": "__animateScroll_isVisible = true",
        "x-intersect:leave": "__animateScroll_isVisible = false",
      });
    });
    Alpine.directive("animate-scroll-stagger", ($el, { expression, value }, { evaluate }) => {
      if (value == "enter") {
        const keyframes = evaluate(expression);
        Alpine.bind($el, {
          "x-init"() {
            this.$data.__animateScrollStagger_enterKeyframes = keyframes;
          },
        });
      } else if (value == "leave") {
        const keyframes = evaluate(expression);
        Alpine.bind($el, {
          "x-init"() {
            this.$data.__animateScrollStagger_leaveKeyframes = keyframes;
          },
        });
      } else {
        const _a1 = expression ? evaluate(expression) : {},
          { selector } = _a1,
          visibleKeyframes1 = __rest(_a1, ["selector"]);
        const defaultSelector = "[data-animate-stagger-item]";
        Alpine.bind($el, {
          "x-data"() {
            return {
              __animateScrollStagger_cancelScroll: null,
              __animateScrollStagger_fitsInViewport: null,
              __animateScrollStagger_didBeginFullyVisible: false,
              __animateScrollStagger_wasFullyVisible: null,
              __animateScrollStagger_isFullyVisible: null,
              __animateScrollStagger_wasPartiallyVisible: null,
              __animateScrollStagger_isPartiallyVisible: null,
              __animateScrollStagger_enterKeyframes: {},
              __animateScrollStagger_visibleKeyframes: visibleKeyframes1,
              __animateScrollStagger_leaveKeyframes: {},
              get __animateScrollStagger_items() {
                return Array.from($el.querySelectorAll(selector || defaultSelector));
              },
              init() {
                this.$watch("__animateScrollStagger_wasFullyVisible", (isFullyVisible) => {
                  this.__animateScrollStagger_wasFullyVisible = isFullyVisible;
                });
                this.$watch("__animateScrollStagger_wasPartiallyVisible", (isPartiallyVisible) => {
                  this.__animateScrollStagger_wasPartiallyVisible = isPartiallyVisible;
                });
              },
              destroy() {
                this.__animateScrollStagger_cancelScrollAnimation();
              },
              __animateScrollStagger_startScrollAnimation() {
                if (this.__animateScrollStagger_cancelScroll !== null) return;
                // Duration of the word animation. Doesn't have any effect when using the scroll animation
                const wordDuration = 1.0;
                // The offset (in terms of % of word duration) that each word should be offset from the previous word
                const wordOffset = 0.2;
                // When each word animation should start in relation to the previous word
                const at = `-${wordDuration * (1 - wordOffset)}`;
                // Word animation sequence when element enters the viewport
                const entrySequence = this.__animateScrollStagger_items.map((staggerEl) => [
                  staggerEl,
                  this.__animateScrollStagger_enterKeyframes,
                  {
                    duration: wordDuration,
                    at: at,
                  },
                ]);
                const visibleKeyframes =
                  this.__animateScrollStagger_visibleKeyframes !== null &&
                  Object.keys(this.__animateScrollStagger_visibleKeyframes).length > 0
                    ? this.__animateScrollStagger_visibleKeyframes
                    : buildStaticKeyframes(this.__animateScrollStagger_enterKeyframes);
                // Sequence to run when the element is fully visible where no animation occurs
                const visibleSequence = this.__animateScrollStagger_items.map((staggerEl) => [
                  staggerEl,
                  visibleKeyframes,
                  {
                    duration: wordDuration,
                    at: at,
                  },
                ]);
                // Word animation sequence when element exits the viewport
                const exitSequence = this.__animateScrollStagger_items.map((staggerEl) => [
                  staggerEl,
                  this.__animateScrollStagger_leaveKeyframes,
                  {
                    duration: wordDuration,
                    at: at,
                  },
                ]);
                if (this.__animateScrollStagger_fitsInViewport == false) {
                  // If the element doesn't fit in the viewport height wise we only use the entry sequence
                  // and run it the whole time the element is in the viewport
                  this.__animateScrollStagger_cancelScroll = scroll(animate(entrySequence), {
                    target: $el,
                    offset: ["0% 100%", "100% 0%"],
                  });
                } else {
                  this.__animateScrollStagger_cancelScroll = scroll(
                    animate([...entrySequence, ...visibleSequence, ...exitSequence]),
                    {
                      target: $el,
                      offset: ["25% 100%", "0% 50%", "0% 0%", "75% 0%"],
                    },
                  );
                }
              },
              __animateScrollStagger_cancelScrollAnimation() {
                var _a;
                (_a = this.__animateScrollStagger_cancelScroll) === null || _a === void 0 ? void 0 : _a.call(this);
                this.__animateScrollStagger_cancelScroll = null;
              },
            };
          },
          "x-intersect:enter.threshold.0": "__animateScrollStagger_isPartiallyVisible = true",
          "x-intersect:leave.threshold.0": "__animateScrollStagger_isPartiallyVisible = false",
          "x-intersect:enter.full": "__animateScrollStagger_isFullyVisible = true",
          "x-intersect:leave.full": "__animateScrollStagger_isFullyVisible = false",
          async "x-effect"() {
            if (this.__animateScrollStagger_wasFullyVisible == null && this.__animateScrollStagger_isFullyVisible) {
              // Whenever the element is fully visible, play the in view animation then start the scroll animation once it's done
              this.__animateScrollStagger_startScrollAnimation();
            } else if (this.__animateScrollStagger_isFullyVisible == false) {
              if (this.__animateScrollStagger_isPartiallyVisible == true) {
                // Whenever the element is partially visible, start the scroll animation
                this.__animateScrollStagger_startScrollAnimation();
              } else if (
                this.__animateScrollStagger_wasPartiallyVisible == true &&
                this.__animateScrollStagger_isPartiallyVisible == false
              ) {
                // Stop the scroll animation when element has fully exited the viewport
                this.__animateScrollStagger_cancelScrollAnimation();
              }
            }
          },
          "x-resize"() {
            this.__animateScrollStagger_fitsInViewport = this.$resize.height <= window.innerHeight;
          },
        });
      }
    });
    Alpine.magic("m", handleMotionMagic());
    Alpine.magic("animation", ($el) => {
      const context = Alpine.$data($el)[ANIMATE_CONTEXT_KEY];
      if (!context) throw new Error("$animation needs to be used on or inside an element with x-animate directive");
      return context.controls;
    });
  } // TODO Test me
  /**
   * Creates a reactive motion value that updates Alpine state when the motion value changes.
   *
   * @param Alpine
   * @param initialMotionValue
   * @returns MotionValue<T>
   */ function reactiveMotionValue(_Alpine, initialMotionValue) {
    const value = motionValue(initialMotionValue);
    const reactiveValue = _Alpine.reactive({
      value: value.get(),
    });
    value.on("change", (newValue) => {
      reactiveValue.value = newValue;
    });
    return new Proxy(value, {
      get(target, prop, receiver) {
        if (prop === "get") {
          // Calling this here is a bit of a hack to make vue/reactivity pick up changes to the motion value
          reactiveValue.value;
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }
  function handleMotionMagic(_Alpine) {
    return function (_$el) {
      return {
        animate,
        stagger,
        spring,
        scroll,
        inView,
        motionValue,
        animateView,
        transform,
      };
    };
  }
  /**
   * Builds a keyframes object that has the last value of each keyframe
   *
   * @param enterKeyframes
   * @returns ObjectTarget<{}>
   */ function buildStaticKeyframes(enterKeyframes) {
    return Object.entries(enterKeyframes).reduce((keyframes, [key, value]) => {
      return Object.assign(Object.assign({}, keyframes), {
        [key]: Array.isArray(value) ? (value.length > 1 ? [value[1], value[1]] : value[0]) : [value, value],
      });
    }, {});
  }

  function clone(Alpine) {
    Alpine.directive("clone", ($targetEl, { expression }, { effect, evaluateLater, cleanup }) => {
      // Function which will evaluate to the source element that will be cloned into the target element
      const sourceElFn = evaluateLater(expression);
      if (!isHtmlElement($targetEl)) {
        throw new Error(`Expected HTMLElement but got ${$targetEl}`);
      }
      $targetEl._x_insertClone = (sourceEl) => {
        var _a;
        if (!isHtmlElement(sourceEl)) return;
        if (!isTemplateElement($targetEl)) {
          throw new Error(`x-clone can only be used on a <template> tag`);
        }
        if ($targetEl._x_clonedElement) {
          (_a = $targetEl._x_undoClone) === null || _a === void 0 ? void 0 : _a.call($targetEl);
        }
        let clone = isTemplateElement(sourceEl)
          ? sourceEl.content.cloneNode(true).firstElementChild
          : sourceEl.cloneNode(true);
        if (!clone) return;
        // Add new parent element's scope to cloned element
        Alpine.addScopeToNode(clone, {}, $targetEl);
        Alpine.mutateDom(() => {
          // Insert cloned node after element with x-clone attribute
          $targetEl.after(clone);
          // Re-initialize alpine on cloned node
          Alpine.skipDuringClone(() => Alpine.initTree(clone))();
        });
        $targetEl._x_clonedElement = clone;
        $targetEl._x_undoClone = () => {
          Alpine.destroyTree(clone);
          clone.remove();
          delete $targetEl._x_clonedElement;
        };
      };
      effect(() => {
        sourceElFn(($sourceEl) => {
          $targetEl._x_insertClone($sourceEl);
        });
      });
      cleanup(() => $targetEl._x_undoClone && $targetEl._x_undoClone());
    }).before("bind");
    Alpine.magic("clone", ($el) => {
      return $el._x_insertClone;
    });
  }

  const DEFAULT_SPEED = 60; // px/s
  const DEFAULT_ATTRIBUTE_BLACKLIST = ["id", "data-shopify-editor-block"];
  /**
   * This plugin provides a smoothly scrolling marquee effect by creating duplicates of items in a
   * “source” element and placing them into a matching “target” container. As the original content
   * scrolls away, the duplicated set seamlessly appears, forming an infinite loop that prevents any
   * abrupt restart.
   *
   * Inspired by: https://ryanmulligan.dev/blog/css-marquee/
   *
   * Modifiers:
   *  - speed.X: Adjusts the scrolling pace (e.g., speed.60 sets 60px per second). Negative value scrolls backwards
   *  - fill: Ensures content is repeated and appended until the visual area is completely covered.
   *  - pause: Begins the marquee in a paused state, requiring a play action to begin moving.
   *
   * General usage:
   *  1. Mark the scrolled content with x-marquee:source.
   *  2. Provide an empty container with x-marquee:target, to receive the duplicated set of items.
   *  3. Attach x-marquee to a parent element with optional modifiers like speed.X, fill, or pause.
   *
   * Programmatic control is available through $marquee, enabling methods like play, pause, or toggle
   * at any time.
   *
   * @example
   *   <div x-data x-marquee.speed.60.fill>
   *     <div x-marquee:source>
   *       <span>First Item</span>
   *       <span>Second Item</span>
   *       <span>Third Item</span>
   *     </div>
   *     <div x-marquee:target aria-hidden="true"></div>
   *   </div>
   *
   */ function marquee(Alpine) {
    Alpine.directive("marquee", ($el, { value, modifiers }) => {
      if (value == "source") {
        Alpine.bind($el, {
          "x-init": "__marquee_sourceEl = $el",
        });
      } else if (value == "target") {
        Alpine.bind($el, {
          "x-init": "__marquee_targetEl = $el",
        });
      } else if (value == null) {
        let speed = DEFAULT_SPEED;
        let fill = modifiers.includes("fill");
        let autoplay = !modifiers.includes("pause");
        if (modifiers.includes("speed")) {
          speed = Number(modifiers[modifiers.indexOf("speed") + 1]);
        }
        Alpine.bind($el, {
          "x-data"() {
            return {
              __marquee_state: buildMarqueeState({
                isPlaying: autoplay,
              }),
              __marquee_isInitialized: false,
              __marquee_isRendering: false,
              __marquee_sourceEl: null,
              __marquee_targetEl: null,
              __marquee_originalContentFragment: document.createDocumentFragment(),
              __marquee_originalContentWidth: 0,
              __marquee_sourceElWidth: 0,
              __marquee_viewportWidth: 0,
              __marquee_sourceAnimation: null,
              __marquee_targetAnimation: null,
              __marquee_sentinel: null,
              get __marquee_animationDuration() {
                return (this.__marquee_sourceElWidth / Math.abs(speed)) * 1000;
              },
              /**
               * Clones source el children until source element width is gte to viewport width
               */ __marquee_fillSource() {
                return new Promise((resolve) => {
                  // When the marquee does not have width, i.e. it was initially hidden
                  if (this.__marquee_originalContentWidth === 0) {
                    // Measure the width of the original content so we know later how many times to clone it
                    this.__marquee_originalContentWidth = this.__marquee_sourceEl.clientWidth;
                    this.__marquee_sourceElWidth = this.__marquee_originalContentWidth;
                  }
                  // If we haven't yet added our sentinel, do it now:
                  if (!this.__marquee_sentinel) {
                    Alpine.mutateDom(() => {
                      // Use a comment node or any other marker
                      this.__marquee_sentinel = document.createComment("marquee-sentinel");
                      this.__marquee_sourceEl.appendChild(this.__marquee_sentinel);
                    });
                  } else {
                    Alpine.mutateDom(() => {
                      // Remove all nodes after the sentinel, so we don't stack infinite clones when re-rendering
                      let next = this.__marquee_sentinel.nextSibling;
                      while (next) {
                        const toRemove = next;
                        next = next.nextSibling;
                        this.__marquee_sourceEl.removeChild(toRemove);
                      }
                      // Update the original content width in case screen size has changed it or something
                      this.__marquee_originalContentWidth = this.__marquee_sourceEl.clientWidth;
                      // Update the source element width to match the original content width now that we've removed clones
                      this.__marquee_sourceElWidth = this.__marquee_originalContentWidth;
                    });
                  }
                  const spaceToFill = Math.max(0, this.__marquee_viewportWidth - this.__marquee_originalContentWidth);
                  if (spaceToFill === 0) return resolve();
                  // Count how many times we need to clone the original content to fill the screen
                  const timesToClone = Math.ceil(spaceToFill / this.__marquee_originalContentWidth);
                  // Clone the original content until the animation wrapper fills the screen
                  const fragment = document.createDocumentFragment();
                  for (let i = 0; i < timesToClone; i++) {
                    const clone = this.__marquee_originalContentFragment.cloneNode(true);
                    fragment.appendChild(clone);
                  }
                  Alpine.mutateDom(() => {
                    // Insert the new clones after our sentinel:
                    this.__marquee_sentinel.after(fragment);
                    Alpine.skipDuringClone(() => Alpine.initTree(this.__marquee_sourceEl))();
                    // Wait until next paint to measure the new width of the source element so we don't cause a reflow
                    window.requestAnimationFrame(() => {
                      this.__marquee_sourceElWidth = this.__marquee_sourceEl.clientWidth;
                      resolve();
                    });
                  });
                });
              },
              __marquee_cloneSourceToTarget() {
                return new Promise((resolve) => {
                  // If the content is smaller than the viewport, don't duplicate the content because we're not
                  if (this.__marquee_sourceElWidth < this.__marquee_viewportWidth) {
                    return resolve();
                  }
                  Alpine.mutateDom(() => {
                    // Clone the nodes from the source to the target
                    const clone = this.__marquee_sourceEl.cloneNode(true);
                    this.__marquee_targetEl.replaceChildren(...clone.children);
                    // Re-initialize alpine on cloned nodes
                    Alpine.skipDuringClone(() => Alpine.initTree(this.__marquee_targetEl))();
                    resolve();
                  });
                });
              },
              __marquee_setupAnimations() {
                var _a, _b;
                const animationDirection = speed < 0 ? "reverse" : "normal";
                const animationDurationInMs = this.__marquee_animationDuration;
                const keyframes = [
                  {
                    transform: `translateX(0%)`,
                  },
                  {
                    transform: `translateX(-100%)`,
                  },
                ];
                const animationOptions = {
                  duration: animationDurationInMs,
                  iterations: Infinity,
                  direction: animationDirection,
                };
                if (this.__marquee_sourceAnimation == null) {
                  let sourceAnimation = new Animation(
                    new KeyframeEffect(this.__marquee_sourceEl, keyframes, animationOptions),
                  );
                  this.__marquee_sourceAnimation = sourceAnimation;
                } else {
                  (_a = this.__marquee_sourceAnimation.effect) === null || _a === void 0
                    ? void 0
                    : _a.updateTiming({
                        duration: animationDurationInMs,
                      });
                }
                if (this.__marquee_targetAnimation == null) {
                  let targetAnimation = new Animation(
                    new KeyframeEffect(this.__marquee_targetEl, keyframes, animationOptions),
                  );
                  targetAnimation.startTime = this.__marquee_sourceAnimation.startTime;
                  targetAnimation.currentTime = this.__marquee_sourceAnimation.currentTime;
                  this.__marquee_targetAnimation = targetAnimation;
                } else {
                  (_b = this.__marquee_targetAnimation.effect) === null || _b === void 0
                    ? void 0
                    : _b.updateTiming({
                        duration: animationDurationInMs,
                      });
                }
                if (this.__marquee_state.isPlaying && this.__marquee_sourceElWidth > this.__marquee_viewportWidth) {
                  this.__marquee_sourceAnimation.play();
                  this.__marquee_targetAnimation.play();
                }
              },
              __marquee_scrollTo(element) {
                let offset = element.offsetLeft;
                this.__marquee_sourceAnimation.effect.setKeyframes([
                  {
                    transform: `translateX(${-offset}px)`,
                  },
                  {
                    transform: "translateX(-100%)",
                  },
                ]);
                this.__marquee_targetAnimation.effect.setKeyframes([
                  {
                    transform: `translateX(${-offset}px)`,
                  },
                  {
                    transform: "translateX(-100%)",
                  },
                ]);
              },
              async __marquee_render() {
                if (this.__marquee_isRendering) return;
                try {
                  this.__marquee_isRendering = true;
                  if (fill) {
                    await this.__marquee_fillSource();
                  }
                  await this.__marquee_cloneSourceToTarget();
                  // Don't animate if in reduced motion mode
                  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                    // Setup animations after the content has been cloned in order to measure the width of the content element without causing reflow
                    this.__marquee_setupAnimations();
                  }
                  this.__marquee_isInitialized = true;
                  window.requestAnimationFrame(() => {
                    this.__marquee_isRendering = false;
                  });
                } finally {
                  this.__marquee_isRendering = false;
                }
              },
              init() {
                this.$nextTick(() => {
                  if (this.__marquee_sourceEl == null) {
                    throw new Error(
                      "Source element not found, x-marquee:source must be applied to a child element of the x-marquee directive",
                    );
                  }
                  if (this.__marquee_targetEl == null) {
                    throw new Error(
                      "Target element not found, x-marquee:target must be applied to a child element of the x-marquee directive",
                    );
                  }
                  // Clone the contents of the animation wrapper so we can clone it until the animatio wrapper fills the screen
                  Array.from(this.__marquee_sourceEl.children).forEach((element) => {
                    const clone = element.cloneNode(true);
                    for (const blacklistedAttribute of DEFAULT_ATTRIBUTE_BLACKLIST) {
                      clone.removeAttribute(blacklistedAttribute);
                    }
                    this.__marquee_originalContentFragment.append(clone);
                  });
                  window.requestAnimationFrame(() => {
                    // Measure the width of the original content so we know later how many times to clone it
                    this.__marquee_originalContentWidth = this.__marquee_sourceEl.clientWidth;
                    this.__marquee_sourceElWidth = this.__marquee_originalContentWidth;
                    this.__marquee_viewportWidth = this.$el.clientWidth;
                    this.__marquee_render();
                  });
                });
                this.$watch("__marquee_state.isPlaying", (playing) => {
                  var _a, _b, _c, _d;
                  if (playing) {
                    (_a = this.__marquee_sourceAnimation) === null || _a === void 0 ? void 0 : _a.play();
                    (_b = this.__marquee_targetAnimation) === null || _b === void 0 ? void 0 : _b.play();
                  } else {
                    (_c = this.__marquee_sourceAnimation) === null || _c === void 0 ? void 0 : _c.pause();
                    (_d = this.__marquee_targetAnimation) === null || _d === void 0 ? void 0 : _d.pause();
                  }
                });
              },
              destroy() {
                var _a, _b, _c, _d;
                (_a = this.__marquee_sourceEl) === null || _a === void 0
                  ? void 0
                  : _a.replaceChildren(this.__marquee_originalContentFragment);
                this.__marquee_originalContentFragment = document.createDocumentFragment();
                (_b = this.__marquee_sentinel) === null || _b === void 0 ? void 0 : _b.remove();
                (_c = this.__marquee_sourceAnimation) === null || _c === void 0 ? void 0 : _c.cancel();
                (_d = this.__marquee_targetAnimation) === null || _d === void 0 ? void 0 : _d.cancel();
                this.__marquee_sourceAnimation = null;
                this.__marquee_targetAnimation = null;
              },
            };
          },
          "x-resize.300ms"() {
            window.requestAnimationFrame(() => {
              this.__marquee_viewportWidth = this.$el.clientWidth;
              this.__marquee_render();
            });
          },
        });
      } else {
        throw new Error(`Unknown directive: x-marquee:${value}`);
      }
    }).before("bind");
    Alpine.magic("marquee", ($el) => {
      const $data = Alpine.$data($el);
      return {
        get isPlaying() {
          var _a;
          return (_a = $data.__marquee_state) === null || _a === void 0 ? void 0 : _a.isPlaying;
        },
        play() {
          var _a;
          (_a = $data.__marquee_state) === null || _a === void 0 ? void 0 : _a.play();
        },
        pause() {
          var _a;
          (_a = $data.__marquee_state) === null || _a === void 0 ? void 0 : _a.pause();
        },
        toggle() {
          var _a;
          (_a = $data.__marquee_state) === null || _a === void 0 ? void 0 : _a.toggle();
        },
        scrollTo(element) {
          var _a;
          (_a = $data.__marquee_scrollTo) === null || _a === void 0 ? void 0 : _a.call($data, element);
        },
        get isReady() {
          return $data.__marquee_isInitialized;
        },
      };
    });
  }
  function buildMarqueeState(options) {
    var _a;
    return {
      isPlaying:
        (_a = options === null || options === void 0 ? void 0 : options.isPlaying) !== null && _a !== void 0
          ? _a
          : false,
      play() {
        this.isPlaying = true;
      },
      pause() {
        this.isPlaying = false;
      },
      toggle() {
        this.isPlaying = !this.isPlaying;
      },
    };
  }

  // Animation helpers
  function sliderReveal(Alpine) {
    Alpine.directive("slider-reveal", ($el, data) => {
      if (data.value == "handle") {
        handleHandle($el, Alpine);
      } else if (data.value == "reveal") {
        handleReveal($el, Alpine);
      } else if (data.value == null) {
        handleRoot($el, Alpine, data);
      } else {
        throw new Error(`Unknown directive: x-slider-reveal:${data.value}`);
      }
    }).before("bind");
    Alpine.magic("sliderReveal", handleSliderRevealMagic(Alpine));
  }
  function handleHandle($el, Alpine, _data) {
    Alpine.bind($el, {
      "x-init": "__sliderReveal_handle = $el",
    });
  }
  function handleReveal($el, Alpine, _data) {
    Alpine.bind($el, {
      "x-init": "__sliderReveal_reveal = $el",
    });
  }
  function handleRoot($el, Alpine, data) {
    const orientation = data.modifiers.includes("vertical") ? "vertical" : "horizontal";
    let initialProgress = 0;
    if (data.modifiers.includes("initial")) {
      initialProgress = Number(data.modifiers[data.modifiers.indexOf("initial") + 1]);
    }
    if (data.modifiers.includes("progress")) {
      const rawValue = data.modifiers[data.modifiers.indexOf("progress") + 1];
      if (!rawValue) {
        throw new Error("x-slider-reveal.progress requires a value (e.g. x-slider-reveal.progress.50%)");
      }
      // Support x-slider-reveal.progress.50% which will set the initial progress to 50%
      let match = rawValue.match(/([0-9]+)%/);
      if (match) initialProgress = Number(match[1]);
    }
    const progressToPercent = transform([0, 100], ["0%", "100%"]);
    Alpine.bind($el, {
      "x-data"() {
        return {
          __sliderReveal_progressMotionValue: reactiveMotionValue(Alpine, initialProgress),
          __sliderReveal_handle: null,
          __sliderReveal_reveal: null,
          __sliderReveal_scrollAnimationFn: null,
          init() {
            this.$nextTick(() => {
              // Update elements with initial progress
              this.__sliderReveal_updateElements(initialProgress);
              // Update elements on progress change
              this.__sliderReveal_progressMotionValue.on("change", this.__sliderReveal_updateElements.bind(this));
            });
          },
          __enableScroll() {
            if (this.__sliderReveal_scrollAnimationFn) return;
            this.__sliderReveal_scrollAnimationFn = scroll(
              (scrollProgress) => {
                const currentProgress = this.__sliderReveal_progressMotionValue.get();
                let lowerBound = Math.max(0, currentProgress - 15);
                let upperBound = Math.min(100, currentProgress + 15);
                const scrollToProgress = transform([0.0, 1.0], [0, 100]);
                const progressToBoundedProgress = transform([0, 100], [lowerBound, upperBound]);
                const normalizedScrollProgress = scrollToProgress(scrollProgress);
                const boundedNewProgress = progressToBoundedProgress(normalizedScrollProgress);
                this.__sliderReveal_updateElements(boundedNewProgress);
              },
              {
                target: $el,
                offset: ["end start", "start end"],
              },
            );
          },
          __disableScroll() {
            var _a;
            (_a = this.__sliderReveal_scrollAnimationFn) === null || _a === void 0 ? void 0 : _a.call(this);
            this.__sliderReveal_scrollAnimationFn = null;
          },
          __sliderReveal_updateElements(progress) {
            const percentProgress = progressToPercent(progress);
            if (orientation === "vertical") {
              if (this.__sliderReveal_handle) {
                this.__sliderReveal_handle.style.transform = `translateY(${percentProgress})`;
                this.__sliderReveal_reveal.style.clipPath = `inset(${percentProgress} 0% 0% 0%)`;
              }
            } else {
              if (this.__sliderReveal_handle) {
                this.__sliderReveal_handle.style.transform = `translateX(${percentProgress})`;
                this.__sliderReveal_reveal.style.clipPath = `inset(0% 0% 0% ${percentProgress})`;
              }
            }
          },
        };
      },
    });
  }
  function handleSliderRevealMagic(Alpine) {
    return function ($el) {
      const $data = Alpine.$data($el);
      return {
        get progressMotionValue() {
          return $data.__sliderReveal_progressMotionValue;
        },
        get progress() {
          return $data.__sliderReveal_progressMotionValue.get();
        },
        set progress(value) {
          $data.__sliderReveal_progressMotionValue.set(value);
        },
        enableScroll() {
          $data.__enableScroll();
        },
        disableScroll() {
          $data.__disableScroll();
        },
      };
    };
  }

  const selectors$3 = {
    announcementBar: "[data-announcement-bar]",
    tickerFrame: "[data-ticker-frame]",
    tickerScale: "[data-ticker-scale]",
    tickerText: "[data-ticker-text]",
  };
  const classes$1 = {
    isSelected: "is-selected",
    tickerAnimated: "ticker--animated",
  };
  function announcementTicker(
    options = {
      stopClone: false,
      waitForSlider: false,
    },
  ) {
    var ref1;
    return {
      tickerFrames:
        (ref1 = this.$el.closest(selectors$3.announcementBar)) === null || ref1 === void 0
          ? void 0
          : ref1.querySelectorAll(selectors$3.tickerFrame),
      init() {
        var ref;
        if (
          (options === null || options === void 0 ? void 0 : options.waitForSlider) &&
          ((ref = this.tickerFrames) === null || ref === void 0 ? void 0 : ref.length) > 1
        ) {
          // Optionally defer ticker initialization until the announcement slider is loaded
          document.addEventListener("theme:announcement:loaded", this.initTicker.bind(this));
        } else {
          this.initTicker();
        }
      },
      initTicker() {
        new Ticker(this.$el, options === null || options === void 0 ? void 0 : options.stopClone);
      },
      toggleTicker(event, isStopped) {
        const tickerScale = this.$el.querySelector(selectors$3.tickerScale);
        const element = this.$el.querySelector(`[x-ref="${event.detail.blockId}"]`);
        if (!element || element.offsetParent === null) return; // No element or the element is hidden
        if (isStopped) {
          const itemsSpacing = Number(getComputedStyle(element).getPropertyValue("--items-spacing").replace("px", ""));
          const leftPosition = -(element.offsetLeft + itemsSpacing);
          tickerScale.setAttribute("data-stop", "");
          tickerScale.querySelectorAll(selectors$3.tickerText).forEach((textHolder) => {
            textHolder.classList.remove(classes$1.tickerAnimated);
            textHolder.style.transform = `translate3d(${leftPosition}px, 0, 0)`;
          });
        }
        if (!isStopped) {
          tickerScale.querySelectorAll(selectors$3.tickerText).forEach((textHolder) => {
            textHolder.classList.add(classes$1.tickerAnimated);
            textHolder.removeAttribute("style");
          });
          tickerScale.removeAttribute("data-stop");
        }
      },
      onBlockSelect(event) {
        this.toggleTicker(event, true);
      },
      onBlockDeselect(event) {
        this.toggleTicker(event, false);
      },
    };
  }
  function announcementSlider(speed = 4000) {
    return {
      options: {
        initialIndex: 0,
        autoPlay: speed,
        contain: true,
        pageDots: false,
        adaptiveHeight: true,
        wrapAround: true,
        groupCells: false,
        cellAlign: "left",
        freeScroll: false,
        prevNextButtons: true,
        draggable: true,
        rightToLeft: window.isRTL,
        on: {
          ready: () => {
            setTimeout(() => {
              this.$el.dispatchEvent(
                new CustomEvent("theme:announcement:loaded", {
                  bubbles: true,
                  detail: {
                    slider: this.$el,
                  },
                }),
              );
            }, 50);
          },
        },
      },
      flkty: null,
      desktopSlides: [],
      mobileSlides: [],
      isMobileSliderInitialized: false,
      init() {
        this.$nextTick(() => {
          // Slow down the initialization so the 'target referrer' slides get removed by the 'x-target-referrer' directive first
          if (this.$el.children.length < 2) return;
          this.flkty = new Flickity(this.$el, this.options);
          this.removeDeviceSpecificSlides();
          resolution.onChange(() => {
            this.updateDeviceSpecificSlides();
          });
          this.scrollEvent = () => this.scrollEvents();
          this.resizeEvent = () => this.resizeEvents();
          document.addEventListener("theme:resize", this.resizeEvent);
          document.addEventListener("theme:scroll", this.scrollEvent);
        });
      },
      removeDeviceSpecificSlides() {
        const slides = this.flkty.getCellElements();
        slides.forEach((slide, index) => {
          slide.classList.remove(classes$1.isSelected);
          if (slide.dataset.device == "desktop") {
            this.desktopSlides.push([slide, index]);
            if (resolution.isMobile()) {
              this.flkty.remove(slide);
            }
          }
          if (slide.dataset.device == "mobile") {
            this.mobileSlides.push([slide, index]);
            if (resolution.isDesktop() || resolution.isTablet()) {
              this.flkty.remove(slide);
            }
          }
        });
        // Fix slides "transform" position bug that appears after resizing the window just before the slide changes
        setTimeout(() => {
          this.flkty.resize();
        }, 1000);
        this.handleSliderAutoplay();
        this.isMobileSliderInitialized = resolution.isMobile();
      },
      updateDeviceSpecificSlides() {
        if (resolution.isDesktop() || resolution.isTablet()) {
          if (this.isMobileSliderInitialized) {
            // Insert desktop-only slides
            this.desktopSlides.forEach((slide) => {
              this.flkty.insert(slide[0], slide[1]);
            });
            // Remove mobile-only slides
            this.mobileSlides.forEach((slide) => {
              this.flkty.remove(slide[0]);
            });
          }
        }
        if (resolution.isMobile()) {
          if (!this.isMobileSliderInitialized) {
            // Insert mobile-only slides
            this.mobileSlides.forEach((slide) => {
              this.flkty.insert(slide[0], slide[1]);
            });
            // Remove desktop-only slides
            this.desktopSlides.forEach((slide) => {
              this.flkty.remove(slide[0]);
            });
          }
        }
        // Fix slides "transform" position bug that appears after resizing the window just before the slide changes
        setTimeout(() => {
          this.flkty.resize();
        }, 1000);
        this.handleSliderAutoplay();
        this.isMobileSliderInitialized = resolution.isMobile();
      },
      handleSliderAutoplay() {
        var ref;
        if (((ref = this.flkty) === null || ref === void 0 ? void 0 : ref.slides.length) > 1) {
          this.flkty.playPlayer();
        } else {
          this.flkty.pausePlayer();
        }
      },
      resizeEvents() {
        this.flkty.resize();
      },
      scrollEvents() {
        if (!this.flkty.options.autoPlay) return;
        const slider = this.flkty.element;
        const sliderBottomPosition = slider.getBoundingClientRect().top + window.scrollY + slider.offsetHeight;
        if (window.pageYOffset > sliderBottomPosition) {
          if (this.flkty.player.state === "playing") {
            this.flkty.pausePlayer();
          }
        } else if (this.flkty.player.state === "paused") {
          this.flkty.playPlayer();
        }
      },
      onBlockSelect(event) {
        const slide = this.$el.querySelector(`[x-ref="${event.detail.blockId}"]`);
        if (!slide) return;
        const slideIndex = parseInt([...slide.parentNode.children].indexOf(slide));
        // Go to selected slide, pause autoplay
        this.flkty.selectCell(slideIndex);
        this.flkty.stopPlayer();
      },
      onBlockDeselect() {
        this.flkty.playPlayer();
      },
      onUnload() {
        this.flkty.options.watchCSS = false;
        this.flkty.destroy();
      },
    };
  }
  function announcement() {
    new CartShippingMessage(this.$el);
  }

  const STATES$1 = {
    INITIAL: 0,
    LOADING: 1,
    SUCCESS: 2,
    ERROR: 3,
  };
  const selectors$2 = {
    popdown: "[data-product-add-popdown-wrapper]",
    errors: "[data-add-action-errors]",
    errorBoundary: "[data-error-boundary]",
    errorDisplay: "[data-error-display]",
    quickviewModal: "[data-quickview-modal]",
    cartPageUpsellWrapper: "[data-cart-page-upsell-wrapper]",
    sectionTypeCart: '[data-section-type="cart"]',
    ajaxDisable: '[data-ajax-disable="true"]',
  };
  const defaultTimes = {
    durationAddButtonDisable: 3500,
    hideErrorTime: 5000,
  };
  /*
    NOTE this is an initial crack at migrating existing product instant add logic
    from WebComponents / direct DOM manipulation style to using Alpine. As such, it is
    fairly rough and not at all (yet) idiomatic Alpine.
    */ function productAddButtonForm(options = {}) {
    const times = {
      ...defaultTimes,
      ...options.times,
    };
    return {
      state: STATES$1.INITIAL,
      error: "",
      isUpsell: false,
      isInCartPage: false,
      // Selectors
      get cartPageUpsellWrapper() {
        return this.$el.closest(selectors$2.cartPageUpsellWrapper);
      },
      get sectionTypeCart() {
        return this.$el.closest(selectors$2.sectionTypeCart);
      },
      get form() {
        if (this.isUpsell && this.isInCartPage) {
          // Get Cart form element to construct a proper FormData object that would contain the productAddButtonForm's fields and their values
          return this.$el.closest("form");
        }
        return this.$el.querySelector("form");
      },
      get button() {
        return this.$el.querySelector("button");
      },
      get popdown() {
        return document.querySelector(selectors$2.popdown);
      },
      get errorDisplay() {
        let errorsEl = this.$el.querySelector(selectors$2.errors);
        if (!errorsEl) {
          const ancestorErrorBoundary = this.$el.closest(selectors$2.errorBoundary);
          if (ancestorErrorBoundary) {
            errorsEl = ancestorErrorBoundary.querySelector(selectors$2.errorDisplay);
          }
        }
        if (!errorsEl) {
          errorsEl = this.$el.querySelector(selectors$2.errorDisplay);
        }
        return errorsEl;
      },
      get quickViewModal() {
        return this.$el.closest(selectors$2.quickviewModal);
      },
      // Getters
      get isInitial() {
        return this.state === STATES$1.INITIAL;
      },
      get isLoading() {
        return this.state === STATES$1.LOADING;
      },
      get isSuccess() {
        return this.state === STATES$1.SUCCESS;
      },
      get isError() {
        return this.state === STATES$1.ERROR;
      },
      get isDisabled() {
        return this.isLoading;
      },
      get isAjaxDisabled() {
        return !!this.$el.closest(selectors$2.ajaxDisable);
      },
      // Bleh, this kind of sucks but neccesary evil for now
      get isInsideQuickViewModal() {
        return Boolean(this.quickViewModal);
      },
      // Handlers
      handleClickAddButton(e) {
        e.preventDefault();
        this.state = STATES$1.LOADING;
        const formData = new FormData(this.form);
        this.addToCart(formData).then(this.handleSuccess.bind(this)).catch(this.handleError.bind(this));
      },
      handleSuccess(response) {
        const variant = response.data;
        this.state = STATES$1.SUCCESS;
        this.updateHeaderTotal();
        // Reset the state back to initial after a duration
        setTimeout(() => {
          this.state = STATES$1.INITIAL;
        }, times.durationAddButtonDisable);
        // If we're inside of a quick view, close the quick view.
        if (this.isInsideQuickViewModal) {
          this.closeQuickView();
        }
        // If cart is open, reload the cart instead of opening a popdown
        if (window.theme.state.cartOpen || this.isInCartPage || this.isOnCartPage) {
          this.reloadCart();
        } else {
          this.openPopdown(variant);
        }
      },
      handleError(error) {
        if (error === null || error === void 0 ? void 0 : error.data) {
          this.state = STATES$1.ERROR;
          if (error.data.description && typeof error.data.description === "string") {
            // Standard stockout error
            this.error = error.data.description;
          } else if (error.data.message && typeof error.data.message === "string") {
            // Standard giftcard validation error
            this.error = error.data.message;
          } else if (error.data.description && typeof error.data.description === "object") {
            // Error is custom object, print keys and values into message to avoid [Object object]
            this.error = Object.keys(error.data.description)
              .map((key) => {
                return `${key}: ${error.data.description[key]}`;
              })
              .join("<br>");
          } else {
            // Fallback
            this.error = "Network error: please try again";
          }
          if (this.errorDisplay) {
            const errorsHTML = `<div class="errors">${this.error}</div>`;
            this.errorDisplay.innerHTML = errorsHTML;
            slideDown(this.errorDisplay);
            setTimeout(() => {
              slideUp(this.errorDisplay);
            }, times.hideErrorTime);
          }
        } else {
          throw error;
        }
      },
      // Actions
      addToCart(formData) {
        const url = `${window.theme.routes.cart}/add.js`;
        const formPayload = new URLSearchParams(formData).toString();
        return axios.post(url, formPayload, {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
      },
      updateHeaderTotal() {
        return axios
          .get(`${window.theme.routes.cart}.js`)
          .then((response) => {
            document.dispatchEvent(
              new CustomEvent("theme:cart:change", {
                detail: {
                  cart: response.data,
                },
                bubbles: true,
              }),
            );
          })
          .catch((e) => {
            console.error(e);
          });
      },
      closeQuickView() {
        this.quickViewModal.dispatchEvent(new CustomEvent("theme:quickview:close"));
      },
      reloadCart() {
        document.dispatchEvent(
          new CustomEvent("theme:cart:reload", {
            bubbles: true,
          }),
        );
      },
      openPopdown(variant) {
        this.popdown.dispatchEvent(
          new CustomEvent("theme:cart:popdown", {
            detail: {
              variant: variant,
            },
            bubbles: true,
          }),
        );
      },
      get isInCartPage() {
        return Boolean(this.sectionTypeCart);
      },
      get isOnCartPage() {
        return Boolean(document.body.querySelector(selectors$2.sectionTypeCart));
      },
      get isUpsell() {
        return Boolean(this.cartPageUpsellWrapper);
      },
      // Initialization
      init() {
        this.button?.addEventListener("click", this.handleClickAddButton.bind(this));
      },
    };
  }

  const STATES = {
    INITIAL: 0,
    LOADING: 1,
  };
  const selectors$1 = {
    quickviewHolder: "data-quickview-holder",
    addButtonWrapper: "[data-add-action-wrapper]",
    modalContent: "[data-product-quickview-ajax]",
    quickviewModal: "[data-quickview-modal]",
    quickviewModalScrolls: "[data-drawer-scrolls]",
    quickviewModalTemplate: "[data-quickview-modal-template]",
    quickviewHead: "[data-quickview-head]",
    quickviewFormArea: "[data-quickview-form-area]",
    toggleButton: "[data-toggle-button]",
    media: "[data-media-slide]",
    mediaId: "[data-media-id]",
    focusable: 'button, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
  };
  const classes = {
    hide: "hide",
    active: "is-active",
    expanded: "is-expanded",
    loading: "loading",
  };
  const visibleParts = {
    minPart: 250,
    mediumPart: 400,
  };
  /*
    NOTE this is an initial crack at migrating existing product quick view modal logic
    from WebComponents / direct DOM manipulation style to using Alpine. As such, it is
    very rough and not at all (yet) idiomatic Alpine.
    */ function productQuickViewButton(_productId, handle) {
    return {
      state: STATES.INITIAL,
      // Selectors
      get quickviewHolder() {
        return this.$root.querySelector(`[${selectors$1.quickviewHolder}]`);
      },
      // Getters
      get isInitial() {
        return this.state === STATES.INITIAL;
      },
      get isLoading() {
        return this.state === STATES.LOADING;
      },
      get isDisabled() {
        return this.isLoading;
      },
      // Methods
      clickQuickviewButton(e) {
        if (this.modal && this.modalID) {
          // Reset modal ID before html content is loaded
          this.modal.id = this.modalID;
        }
        if (document.documentElement.hasAttribute("data-scroll-locked")) {
          this.scrollLockEnable = false;
        }
        this.state = STATES.LOADING;
        this.getQuickviewHTML();
      },
      getQuickviewHTML() {
        window
          .fetch(`${window.theme.routes.root_url}products/${handle}?section_id=api-product-quickview`)
          .then(this.handleErrors)
          .then((response) => {
            return response.text();
          })
          .then((response) => {
            const fresh = document.createElement("div");
            fresh.innerHTML = response;
            this.modalContent = this.modal.querySelector(selectors$1.modalContent);
            this.modalContent.innerHTML = fresh.querySelector("[data-api-content]").innerHTML;
            this.modalScroll = this.modal.querySelector(selectors$1.quickviewModalScrolls);
            const images = this.modalContent.querySelector(selectors$1.mediaId);
            if (images) {
              const imagesHolder = document.createElement("div");
              imagesHolder.innerHTML = images.parentElement.innerHTML;
              this.quickviewHolder.dispatchEvent(
                new CustomEvent("theme:quickview:media", {
                  bubbles: true,
                  detail: {
                    media: imagesHolder,
                  },
                }),
              );
            }
            const section = {
              container: this.modalContent,
            };
            this.media = new Media(section);
            this.modalCreate();
            this.state = STATES.INITIAL;
          });
      },
      modalCreate() {
        MicroModal.show(this.modalID, {
          onShow: (modal, el, event) => {
            this.quickviewHead = modal.querySelector(selectors$1.quickviewHead);
            this.quickviewFormArea = modal.querySelector(selectors$1.quickviewFormArea);
            this.toggleButton = modal.querySelector(selectors$1.toggleButton);
            this.toggleForm("loading");
            document.addEventListener(
              "theme:resize",
              throttle$1(() => {
                this.toggleForm("resize");
              }, 500),
            );
            this.clickEventToggleForm();
            const firstFocus = modal.querySelector(selectors$1.focusable);
            trapFocus(modal, {
              elementToFocus: firstFocus,
            });
            this.modal.addEventListener("theme:quickview:close", this.modalClose);
            document.dispatchEvent(
              new CustomEvent("theme:scroll:lock", {
                bubbles: true,
                detail: this.modalScroll,
              }),
            );
            new ImageCaption(this.modal);
          },
          onClose: (modal, el, event) => {
            if (event) event.preventDefault();
            this.media.destroy();
            const allMedia = modal.querySelectorAll(selectors$1.media);
            allMedia.forEach((media) => {
              media.dispatchEvent(new CustomEvent("pause"));
            });
            removeTrapFocus();
            el.focus();
            this.modal.removeEventListener("theme:quickview:close", this.modalClose);
            if (this.scrollLockEnable) {
              document.dispatchEvent(
                new CustomEvent("theme:scroll:unlock", {
                  bubbles: true,
                }),
              );
            } else {
              this.scrollLockEnable = true;
            }
          },
        });
      },
      modalClose() {
        MicroModal.close(this.modalID);
      },
      handleErrors(response) {
        if (!response.ok) {
          return response.json().then(function (json) {
            const e = new FetchError({
              status: response.statusText,
              headers: response.headers,
              json: json,
            });
            throw e;
          });
        }
        return response;
      },
      toggleForm(event) {
        if (this.windowH === window.innerHeight && event === "resize") {
          return;
        }
        if (!this.toggleButton.classList.contains(classes.hide)) {
          this.toggleButton.classList.add(classes.hide);
        }
        if (!this.quickviewFormArea.classList.contains(classes.expanded)) {
          this.quickviewFormArea.classList.add(classes.expanded);
        }
        if (event === "resize") {
          this.quickviewFormArea.classList.add(classes.expanded);
          this.toggleButton.classList.add(classes.hide);
          this.windowH = window.innerHeight;
        }
        setTimeout(() => {
          const imagesVisiblePartOfImages =
            window.innerHeight - this.quickviewHead.offsetHeight - this.quickviewFormArea.offsetHeight;
          const hasMediumVisiblePart =
            imagesVisiblePartOfImages < visibleParts.mediumPart && imagesVisiblePartOfImages > visibleParts.minPart;
          const missingVisiblePart = imagesVisiblePartOfImages < visibleParts.minPart;
          if (hasMediumVisiblePart || missingVisiblePart) {
            this.toggleButton.classList.remove(classes.hide);
            this.toggleButton.classList.add(classes.active);
          } else {
            this.toggleButton.classList.add(classes.hide);
          }
          if (missingVisiblePart) {
            if (event === "loading") {
              this.quickviewFormArea.classList.add(classes.loading);
              setTimeout(() => {
                this.quickviewFormArea.classList.remove(classes.loading);
              }, 50);
            }
            this.quickviewFormArea.classList.remove(classes.expanded);
            this.toggleButton.classList.remove(classes.active);
          } else {
            this.quickviewFormArea.classList.add(classes.expanded);
          }
        }, 200);
      },
      clickEventToggleForm() {
        if (!this.toggleButton) return;
        this.toggleButton.addEventListener("click", () => {
          this.toggleButton.classList.toggle(classes.active);
          this.quickviewFormArea.classList.toggle(classes.expanded);
        });
      },
      // Initialization
      init() {
        if (this.quickviewHolder) {
          this.modalTemplate = this.quickviewHolder.querySelector(selectors$1.quickviewModalTemplate);
          this.modal = document.querySelector(selectors$1.quickviewModal);
          this.modalID = this.quickviewHolder.getAttribute(selectors$1.quickviewHolder);
          this.modalContent = null;
          this.modalScroll = null;
          this.scrollLockEnable = true;
          this.windowH = window.innerHeight;
          if (this.modalTemplate && !this.modal) {
            const modalTemplateInner = this.modalTemplate.innerHTML;
            const htmlObject = document.createElement("div");
            htmlObject.innerHTML = modalTemplateInner;
            this.modalHtml = htmlObject.querySelector(selectors$1.quickviewModal);
            document.body.appendChild(this.modalHtml);
            this.modal = document.querySelector(selectors$1.quickviewModal);
          }
        }
      },
    };
  }

  function toggle() {
    return {
      isOpen: false,
      get isClosed() {
        return !this.isOpen;
      },
      toggle() {
        if (this.isOpen) {
          return this.close();
        }
        this.open();
      },
      open() {
        this.isOpen = true;
      },
      close() {
        if (!this.isOpen) return;
        this.isOpen = false;
      },
    };
  }

  function isFunction(x) {
    return typeof x === "function";
  }

  /**
   * Higher-order component that allows you to compose multiple components into a single component
   * while preserving reactivity, access to magics, access to the parent scope, and calling each component's `init()` method
   *
   * @example
   *
   * <div x-data="compose(componentA, componentB)">
   *  <span x-text="somePropFromComponentA"></span>
   *  <span x-text="somePropFromComponentB"></span>
   * </div>
   *
   * @param components
   * @returns
   */ function compose(...components) {
    return components.reduce(
      (composedComponent, componentOrComponentFunction) => {
        const component = isFunction(componentOrComponentFunction)
          ? componentOrComponentFunction()
          : componentOrComponentFunction;
        // Add the init method to the list of initializers to be called in order once composed component is initialized
        if (component.init) {
          composedComponent._initializers.push(component.init);
        }
        // Delete the init method so it doesn't get called twice
        delete component.init;
        // Add property descriptors from component to composed component
        const extendedComponent = Object.defineProperties(
          composedComponent,
          Object.getOwnPropertyDescriptors(component),
        );
        return extendedComponent;
      },
      {
        _initializers: [],
        init() {
          // Call each initializer in order
          this._initializers.forEach((initializer) => initializer.call(this));
        },
      },
    );
  }

  function productGridItemQuickAddMenu() {
    return compose(toggle(), {
      controller: null,
      init() {
        this.$watch("isOpen", (isOpen) => {
          if (isOpen) {
            this.listen();
          } else {
            this.unlisten();
          }
        });
      },
      // Only listen for events when the menu is open in order to reduce unnecessary event listeners
      listen() {
        this.controller = new AbortController();
        // Close on mouse leave
        this.$el.addEventListener(
          "mouseleave",
          () => {
            this.close();
          },
          {
            signal: this.controller.signal,
          },
        );
        // Close on click outside
        document.addEventListener(
          "click",
          (e) => {
            if (this.$el.contains(e.target)) return;
            // Additional check for special implementations like x-collapse
            // where the element doesn't have display: none
            if (this.$el._x_isShown === false) return;
            this.close();
          },
          {
            signal: this.controller.signal,
          },
        );
        // Close on focus outside
        document.addEventListener(
          "focusin",
          (e) => {
            if (this.$el.contains(e.target)) return;
            this.close();
          },
          {
            signal: this.controller.signal,
          },
        );
        // Close when esc pressed
        document.addEventListener(
          "keydown",
          (e) => {
            if (e.key === "Escape") {
              this.close();
            }
          },
          {
            signal: this.controller.signal,
          },
        );
      },
      unlisten() {
        // Remove all listeners
        this.controller.abort();
        this.controller = null;
      },
    });
  }

  const selectors = {
    tablist: '[role="tablist"]',
    tab: '[role="tab"]',
  };
  function tabs(initialIndex = 0) {
    return {
      selectedIndex: null,
      init() {
        // Set the first available tab on the page on page load.
        this.$nextTick(() => this.select(initialIndex));
      },
      // Selectors
      get tablist() {
        return this.$el.querySelector(selectors.tablist);
      },
      get tabs() {
        var ref;
        return (ref = this.tablist) === null || ref === void 0 ? void 0 : ref.querySelectorAll(selectors.tab);
      },
      getTab(index) {
        var ref;
        return (ref = this.tabs) === null || ref === void 0 ? void 0 : ref[index];
      },
      isSelected(index) {
        return this.selectedIndex === index;
      },
      // Actions
      select(index, scrollIntoView = true) {
        this.selectedIndex = index;
        const tab = this.getTab(index);
        if (tab && scrollIntoView) {
          this.tablist.scrollTo({
            top: 0,
            left: tab.offsetLeft - tab.clientWidth,
            behavior: "smooth",
          });
        }
      },
      // Shared directives
      bindTabs: {
        ["x-id"]: "['tab', 'tab-panel']",
      },
      bindTablist: {
        [":role"]: "'tablist'",
        ["@keydown.right.prevent.stop"]: "$focus.wrap().next()",
        ["@keydown.home.prevent.stop"]: "$focus.first()",
        ["@keydown.page-up.prevent.stop"]: "$focus.first()",
        ["@keydown.left.prevent.stop"]: "$focus.wrap().prev()",
        ["@keydown.end.prevent.stop"]: "$focus.last()",
        ["@keydown.page-down.prevent.stop"]: "$focus.last()",
      },
      bindTabpanels: {},
      bindTab(index) {
        return {
          [":id"]: `$id('tab', ${index + 1})`,
          [":role"]: "'tab'",
          ["@click"]: `select(${index})`,
          ["@mousedown.prevent"]: "",
          ["@focus"]: `select(${index})`,
          [":tabindex"]: `isSelected(${index}) ? 0 : -1`,
          [":aria-selected"]: `isSelected(${index})`,
          [":aria-controls"]: `$id('tab-panel', ${index + 1})`,
        };
      },
      bindTabpanel(index) {
        return {
          [":id"]: `$id('tab-panel', ${index + 1})`,
          [":role"]: "'tabpanel'",
          ["x-show"]: `isSelected(${index})`,
          [":aria-labelledby"]: `$id('tab', ${index + 1})`,
        };
      },
    };
  }

  function overflow(options1 = {}) {
    const inset = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      ...options1.inset,
    };
    return {
      get overflowContainer() {
        return this.$refs.overflowContainer;
      },
      isOverflowing: {
        top: false,
        bottom: false,
        left: false,
        right: false,
      },
      checkOverflow() {
        const scrollOffsetBottom =
          this.overflowContainer.scrollHeight - this.overflowContainer.scrollTop - inset.bottom;
        const scrollOffsetRight = this.overflowContainer.scrollWidth - this.overflowContainer.scrollLeft - inset.right;
        this.isOverflowing.top = this.overflowContainer.scrollTop - inset.top > 0;
        this.isOverflowing.bottom = scrollOffsetBottom > this.overflowContainer.clientHeight;
        this.isOverflowing.left = this.overflowContainer.scrollLeft - inset.left > 0;
        this.isOverflowing.right = scrollOffsetRight > this.overflowContainer.clientWidth;
      },
      scrollTo(options) {
        this.overflowContainer.scrollTo(options);
      },
    };
  }

  function flickity(Alpine) {
    Alpine.directive("flickity", ($el, { value, modifiers }) => {
      switch (value) {
        case "slider":
          Alpine.bind($el, {
            "x-init": "__flickity_sliderEl = $el",
          });
          break;
        case null:
          Alpine.bind($el, {
            "x-data"() {
              return {
                __flickity_sliderEl: null,
                __flickity_isReady: false,
                __flickity_instance: null,
                __flickity_mutationObserver: null,
                init() {
                  // This is a bit of a hack to get the flickity instance.
                  // We need to wait for the flickity-enabled class to be added to the element to
                  // know if Flickity has been initialized. Not a great solution, but it works for now.
                  this.$nextTick(() => {
                    if (this.__flickity_sliderEl.classList.contains("flickity-enabled")) {
                      this.__flickity_instance = Flickity.data(this.__flickity_sliderEl);
                      this.__flickity_isReady = true;
                    } else {
                      this.__flickity_mutationObserver = new MutationObserver((mutationList) => {
                        mutationList.forEach((mutation) => {
                          if (mutation.type === "attributes" && mutation.attributeName === "class") {
                            if (mutation.target.classList.contains("flickity-enabled")) {
                              this.__flickity_instance = Flickity.data(this.__flickity_sliderEl);
                              this.__flickity_isReady = true;
                            }
                          }
                        });
                      });
                      this.__flickity_mutationObserver.observe(this.__flickity_sliderEl, {
                        attributes: true,
                      });
                    }
                  });
                },
                destroy() {
                  this.__flickity_mutationObserver.disconnect();
                },
              };
            },
          });
          break;
        default:
          throw new Error(`Invalid flickity directive: ${value}`);
      }
    }).before("bind");
    Alpine.magic("flickity", ($el) => {
      const $data = Alpine.$data($el);
      return {
        get instance() {
          return $data.__flickity_instance;
        },
        get isReady() {
          return $data.__flickity_isReady;
        },
      };
    });
  }

  /**
   * Directive to remove an element based on the previously loaded page
   * e.g.
   * <div x-target-referrer="/collections/all"></div>
   */ var targetReferrer = (el, { expression }) => {
    if (!expression) return;
    if (document.referrer.indexOf(expression) === -1 && !window.Shopify.designMode) {
      el.parentNode.removeChild(el);
    }
  };

  /**
   * Ensemble brings together multiple elements and binds them to the same data
   *
   * e.g.
   * <div x-ensemble>
   *   <div x-ensemble:slideshow.duration.{{ section.settings.duration | times: 1000 }}ms>...</div>
   *   <div x-ensemble:accordion>...</div>
   * </div>
   */ function ensemble(Alpine) {
    Alpine.directive("ensemble", ($el, { value: value1, modifiers }) => {
      const { $ensemble } = Alpine.$data($el);
      switch (value1) {
        case "slideshow":
          Alpine.bind($el, {
            [`x-slideshow.${modifiers.join(".")}`]() {
              return {
                get currentSlideIndex() {
                  if ($ensemble.selectedIndex === null) {
                    return 0;
                  }
                  // If this is the last slide of this particular ensemble members slideshow but there are more slides in the ensemble
                  // then just show the last slide of the ensemble
                  if ($ensemble.selectedIndex >= this.totalSlides) {
                    return this.totalSlides - 1;
                  }
                  return $ensemble.selectedIndex;
                },
                set currentSlideIndex(value) {
                  $ensemble.selectedIndex = value;
                },
                get state() {
                  // If this particular ensemble member's slideshow has less slides than the ensemble itself (i.e. there are other slideshows in the ensemble)
                  // then pause _this_ slideshow and let the other slideshows take over
                  if (this.totalSlides < $ensemble.totalSlides) {
                    return "paused";
                  }
                  return $ensemble.isPlaying ? "playing" : "paused";
                },
                set state(value) {
                  $ensemble.isPlaying = value === "playing";
                },
              };
            },
            "x-effect"() {
              if (this.$slideshow.totalSlides > this.$ensemble.totalSlides) {
                this.$ensemble.totalSlides = this.$slideshow.totalSlides;
              }
            },
          });
          break;
        case "disclosure-group":
          Alpine.bind($el, {
            ["x-disclosure-group"]() {
              return {
                get expandedIndex() {
                  // If there is no selectedIndex for some reason, show the first disclosure
                  if ($ensemble.selectedIndex === null) return 0;
                  // If the selectedIndex doesn't match any disclosures, show the last disclosure
                  const lastDisclosureIndex = Array.from(this.items).length - 1;
                  if ($ensemble.selectedIndex > lastDisclosureIndex) return lastDisclosureIndex;
                  return $ensemble.selectedIndex;
                },
                set expandedIndex(value) {
                  // Only allow opening new accordion items, not closing them
                  if (value === null) return;
                  // Pause the slideshow when a disclosure is manually opened
                  $ensemble.isPlaying = false;
                  $ensemble.selectedIndex = value;
                },
              };
            },
          });
          break;
        case "slider":
          Alpine.bind($el, {
            "x-flickity": "",
            ["x-list-state"]() {
              return {
                scope: "sliderItems",
                get selectedIndex() {
                  if ($ensemble.selectedIndex === null) {
                    return null;
                  }
                  return $ensemble.selectedIndex;
                },
                set selectedIndex(value) {
                  $ensemble.selectedIndex = value;
                },
              };
            },
            "x-init"() {
              // Update the slider when clicking the hotspots
              this.$watch("$sliderItems.selectedIndex", (selectedIndex, prevSelectedIndex) => {
                // Manaully scroll to the target slide if we're on mobile
                if (window.innerWidth < 768) {
                  const targetSlide = Array.from(this.$sliderItems.items)[selectedIndex];
                  if (targetSlide) {
                    targetSlide.scrollIntoView({
                      behavior: "smooth",
                      block: "nearest",
                      inline: "center",
                    });
                  }
                } else {
                  // Use Flickity to select the target slide for desktop
                  if (selectedIndex !== this.$flickity.instance.selectedIndex) {
                    this.$flickity.instance.select(selectedIndex);
                  }
                }
              });
              this.$watch("$flickity.isReady", (isReady) => {
                this.$flickity.instance.options.fade = true;
                this.$flickity.instance.options.freeScroll = false;
                this.$flickity.instance.resize();
                if (isReady) {
                  // Update the hotposts when the slide changes
                  this.$flickity.instance.on("select", (index) => {
                    if (index !== this.$sliderItems.selectedIndex) {
                      this.$sliderItems.selectedIndex = index;
                    }
                  });
                }
              });
            },
          });
          break;
        case "hotspots":
          Alpine.bind($el, {
            ["x-list-state"]() {
              return {
                scope: "hotspots",
                get selectedIndex() {
                  if ($ensemble.selectedIndex === null) {
                    return null;
                  }
                  return $ensemble.selectedIndex;
                },
                set selectedIndex(value) {
                  $ensemble.isPlaying = false;
                  $ensemble.selectedIndex = value;
                },
              };
            },
          });
          break;
        case null:
          Alpine.bind($el, {
            "x-intersect:enter": "$ensemble.isPlaying = true",
            "x-intersect:leave": "$ensemble.isPlaying = false",
            "@focusin": "$ensemble.isPlaying = false",
            ["x-data"]() {
              return {
                $ensemble: {
                  titleEl: null,
                  selectedIndex: 0,
                  totalSlides: 0,
                  isPlaying: false,
                  members: {},
                  registerMember(id, el) {
                    this.members[id] = el;
                  },
                  getPeerIds(id) {
                    return Object.keys(this.members).filter((memberId) => memberId !== id);
                  },
                },
              };
            },
            ":aria-labelledby": "$ensemble.titleEl?.id",
          });
          break;
        default:
          throw new Error(`Invalid ensemble directive: ${value1}`);
      }
    }).before("bind");
  }

  /* Data */ module_default.data("announcement", announcement);
  module_default.data("announcementSlider", announcementSlider);
  module_default.data("announcementTicker", announcementTicker);
  module_default.data("productAddButtonForm", productAddButtonForm);
  module_default.data("productQuickViewButton", productQuickViewButton);
  module_default.data("productGridItemQuickAddMenu", productGridItemQuickAddMenu);
  module_default.data("toggle", toggle);
  module_default.data("tabs", tabs);
  module_default.data("overflow", overflow);
  /* Directives */ module_default.directive("target-referrer", targetReferrer);
  /* Plugins */ module_default.plugin(module_default$3);
  module_default.plugin(module_default$2);
  module_default.plugin(module_default$1);
  module_default.plugin(clone);
  module_default.plugin(sliderReveal);
  module_default.plugin(slideshow);
  module_default.plugin(listState);
  module_default.plugin(motion);
  module_default.plugin(animationUtils);
  module_default.plugin(disclosure);
  module_default.plugin(themeEditor);
  module_default.plugin(marquee);
  module_default.plugin(hold);
  module_default.plugin(ensemble);
  module_default.plugin(flickity);
  module_default.plugin(section);
  /* Initialization */ module_default.start();
  // Mainly for Alpine.js devtools to work
  window.Alpine = module_default;
})(
  themeVendor.AOS,
  themeVendor.FlickityFade,
  themeVendor.ScrollLock,
  themeVendor.Flickity,
  themeVendor.MicroModal,
  themeVendor.Rellax,
  themeVendor.themeCurrency,
  themeVendor.axios,
  themeVendor.FlickitySync,
  themeVendor.themeAddresses,
  themeVendor.Sqrl,
);
