var themeVendor = (function (exports) {
  'use strict';

  function _mergeNamespaces(n, m) {
    m.forEach(function (e) {
      e && typeof e !== 'string' && !Array.isArray(e) && Object.keys(e).forEach(function (k) {
        if (k !== 'default' && !(k in n)) {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function () { return e[k]; }
          });
        }
      });
    });
    return Object.freeze(n);
  }

  var query = "query countries($locale: SupportedLocale!) {"
    + "  countries(locale: $locale) {"
    + "    name"
    + "    code"
    + "    labels {"
    + "      address1"
    + "      address2"
    + "      city"
    + "      company"
    + "      country"
    + "      firstName"
    + "      lastName"
    + "      phone"
    + "      postalCode"
    + "      zone"
    + "    }"
    + "    formatting {"
    + "      edit"
    + "    }"
    + "    zones {"
    + "      name"
    + "      code"
    + "    }"
    + "  }"
    + "}";

  var GRAPHQL_ENDPOINT = 'https://country-service.shopifycloud.com/graphql';

  function loadCountries(locale) {
    var response = fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        query: query,
        operationName: 'countries',
        variables: {
          locale: toSupportedLocale(locale),
        },
      }),
    });

    return response
      .then(function(res) { return res.json() })
      .then(function(countries) { return countries.data.countries });
  }

  var DEFAULT_LOCALE = 'EN';
  var SUPPORTED_LOCALES = [
    'DA',
    'DE',
    'EN',
    'ES',
    'FR',
    'IT',
    'JA',
    'NL',
    'PT',
    'PT_BR',
  ];

  function toSupportedLocale(locale) {
    var supportedLocale = locale.replace(/-/, '_').toUpperCase();

    if (SUPPORTED_LOCALES.indexOf(supportedLocale) !== -1) {
      return supportedLocale;
    } else if (SUPPORTED_LOCALES.indexOf(supportedLocale.substring(0, 2)) !== -1) {
      return supportedLocale.substring(0, 2);
    } else {
      return DEFAULT_LOCALE;
    }
  }

  function mergeObjects() {
    var to = Object({});

    for (var index = 0; index < arguments.length; index++) {
      var nextSource = arguments[index];

      if (nextSource) {
        for (var nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  }

  var FIELD_REGEXP = /({\w+})/g;
  var LINE_DELIMITER = '_';
  var INPUT_SELECTORS = {
    lastName: '[name="address[last_name]"]',
    firstName: '[name="address[first_name]"]',
    company: '[name="address[company]"]',
    address1: '[name="address[address1]"]',
    address2: '[name="address[address2]"]',
    country: '[name="address[country]"]',
    zone: '[name="address[province]"]',
    postalCode: '[name="address[zip]"]',
    city: '[name="address[city]"]',
    phone: '[name="address[phone]"]',
  };

  function AddressForm(rootEl, locale, options) {
    locale = locale || 'en';
    options = options || {inputSelectors: {}};
    var formElements = loadFormElements(
      rootEl,
      mergeObjects(INPUT_SELECTORS, options.inputSelectors)
    );

    validateElements(formElements);

    return loadShippingCountries(options.shippingCountriesOnly).then(function(
      shippingCountryCodes
    ) {
      return loadCountries(locale).then(function(countries) {
        init(
          rootEl,
          formElements,
          filterCountries(countries, shippingCountryCodes)
        );
      });
    });
  }

  /**
   * Runs when countries have been loaded
   */
  function init(rootEl, formElements, countries) {
    populateCountries(formElements, countries);
    var selectedCountry = formElements.country.input
      ? formElements.country.input.value
      : null;
    setEventListeners(rootEl, formElements, countries);
    handleCountryChange(rootEl, formElements, selectedCountry, countries);
  }

  /**
   * Handles when a country change: set labels, reorder fields, populate zones
   */
  function handleCountryChange(rootEl, formElements, countryCode, countries) {
    var country = getCountry(countryCode, countries);

    setLabels(formElements, country);
    reorderFields(rootEl, formElements, country);
    populateZones(formElements, country);
  }

  /**
   * Sets up event listener for country change
   */
  function setEventListeners(rootEl, formElements, countries) {
    formElements.country.input.addEventListener('change', function(event) {
      handleCountryChange(rootEl, formElements, event.target.value, countries);
    });
  }

  /**
   * Reorder fields in the DOM and add data-attribute to fields given a country
   */
  function reorderFields(rootEl, formElements, country) {
    var formFormat = country.formatting.edit;

    var countryWrapper = formElements.country.wrapper;
    var afterCountry = false;

    getOrderedField(formFormat).forEach(function(row) {
      row.forEach(function(line) {
        formElements[line].wrapper.dataset.lineCount = row.length;
        if (!formElements[line].wrapper) {
          return;
        }
        if (line === 'country') {
          afterCountry = true;
          return;
        }

        if (afterCountry) {
          rootEl.append(formElements[line].wrapper);
        } else {
          rootEl.insertBefore(formElements[line].wrapper, countryWrapper);
        }
      });
    });
  }

  /**
   * Update labels for a given country
   */
  function setLabels(formElements, country) {
    Object.keys(formElements).forEach(function(formElementName) {
      formElements[formElementName].labels.forEach(function(label) {
        label.textContent = country.labels[formElementName];
      });
    });
  }

  /**
   * Add right countries in the dropdown for a given country
   */
  function populateCountries(formElements, countries) {
    var countrySelect = formElements.country.input;
    var duplicatedCountrySelect = countrySelect.cloneNode(true);

    countries.forEach(function(country) {
      var optionElement = document.createElement('option');
      optionElement.value = country.code;
      optionElement.textContent = country.name;
      duplicatedCountrySelect.appendChild(optionElement);
    });

    countrySelect.innerHTML = duplicatedCountrySelect.innerHTML;

    if (countrySelect.dataset.default) {
      countrySelect.value = countrySelect.dataset.default;
    }
  }

  /**
   * Add right zones in the dropdown for a given country
   */
  function populateZones(formElements, country) {
    var zoneEl = formElements.zone;
    if (!zoneEl) {
      return;
    }

    if (country.zones.length === 0) {
      zoneEl.wrapper.dataset.ariaHidden = 'true';
      zoneEl.input.innerHTML = '';
      return;
    }

    zoneEl.wrapper.dataset.ariaHidden = 'false';

    var zoneSelect = zoneEl.input;
    var duplicatedZoneSelect = zoneSelect.cloneNode(true);
    duplicatedZoneSelect.innerHTML = '';

    country.zones.forEach(function(zone) {
      var optionElement = document.createElement('option');
      optionElement.value = zone.code;
      optionElement.textContent = zone.name;
      duplicatedZoneSelect.appendChild(optionElement);
    });

    zoneSelect.innerHTML = duplicatedZoneSelect.innerHTML;

    if (zoneSelect.dataset.default) {
      zoneSelect.value = zoneSelect.dataset.default;
    }
  }

  /**
   * Will throw if an input or a label is missing from the wrapper
   */
  function validateElements(formElements) {
    Object.keys(formElements).forEach(function(elementKey) {
      var element = formElements[elementKey].input;
      var labels = formElements[elementKey].labels;

      if (!element) {
        return;
      }

      if (typeof element !== 'object') {
        throw new TypeError(
          formElements[elementKey] + ' is missing an input or select.'
        );
      } else if (typeof labels !== 'object') {
        throw new TypeError(formElements[elementKey] + ' is missing a label.');
      }
    });
  }

  /**
   * Given an countryCode (eg. 'CA'), will return the data of that country
   */
  function getCountry(countryCode, countries) {
    countryCode = countryCode || 'CA';
    return countries.filter(function(country) {
      return country.code === countryCode;
    })[0];
  }

  /**
   * Given a format (eg. "{firstName}{lastName}_{company}_{address1}_{address2}_{city}_{country}{province}{zip}_{phone}")
   * will return an array of how the form needs to be formatted, eg.:
   * =>
   * [
   *   ['firstName', 'lastName'],
   *   ['company'],
   *   ['address1'],
   *   ['address2'],
   *   ['city'],
   *   ['country', 'province', 'zip'],
   *   ['phone']
   * ]
   */
  function getOrderedField(format) {
    return format.split(LINE_DELIMITER).map(function(fields) {
      var result = fields.match(FIELD_REGEXP);
      if (!result) {
        return [];
      }

      return result.map(function(fieldName) {
        var newFieldName = fieldName.replace(/[{}]/g, '');

        switch (newFieldName) {
          case 'zip':
            return 'postalCode';
          case 'province':
            return 'zone';
          default:
            return newFieldName;
        }
      });
    });
  }

  /**
   * Given a rootEl where all `input`s, `select`s, and `labels` are nested, it
   * will returns all form elements (wrapper, input and labels) of the form.
   * See `FormElements` type for details
   */
  function loadFormElements(rootEl, inputSelectors) {
    var elements = {};
    Object.keys(INPUT_SELECTORS).forEach(function(inputKey) {
      var input = rootEl.querySelector(inputSelectors[inputKey]);
      elements[inputKey] = input
        ? {
            wrapper: input.parentElement,
            input: input,
            labels: document.querySelectorAll('[for="' + input.id + '"]'),
          }
        : {};
    });

    return elements;
  }

  /**
   * If shippingCountriesOnly is set to true, will return the list of countries the
   * shop ships to. Otherwise returns null.
   */
  function loadShippingCountries(shippingCountriesOnly) {
    if (!shippingCountriesOnly) {
      // eslint-disable-next-line no-undef
      return Promise.resolve(null);
    }

    var response = fetch(location.origin + '/meta.json');

    return response
      .then(function(res) {
        return res.json();
      })
      .then(function(meta) {
        // If ships_to_countries has * in the list, it means the shop ships to
        // all countries
        return meta.ships_to_countries.indexOf('*') !== -1
          ? null
          : meta.ships_to_countries;
      })
      .catch(function() {
        return null;
      });
  }

  /**
   * Only returns countries that are in includedCountryCodes
   * Returns all countries if no includedCountryCodes is passed
   */
  function filterCountries(countries, includedCountryCodes) {
    if (!includedCountryCodes) {
      return countries;
    }

    return countries.filter(function(country) {
      return includedCountryCodes.indexOf(country.code) !== -1;
    });
  }

  var themeAddresses = /*#__PURE__*/Object.freeze({
    __proto__: null,
    AddressForm: AddressForm
  });

  /**
   * Currency Helpers
   * -----------------------------------------------------------------------------
   * A collection of useful functions that help with currency formatting
   *
   * Current contents
   * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
   *
   */

  const moneyFormat = '${{amount}}';

  /**
   * Format money values based on your shop currency settings
   * @param  {Number|string} cents - value in cents or dollar amount e.g. 300 cents
   * or 3.00 dollars
   * @param  {String} format - shop money_format setting
   * @return {String} value - formatted value
   */
  function formatMoney(cents, format) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    let value = '';
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    const formatString = format || moneyFormat;

    function formatWithDelimiters(
      number,
      precision = 2,
      thousands = ',',
      decimal = '.'
    ) {
      if (isNaN(number) || number == null) {
        return 0;
      }

      number = (number / 100.0).toFixed(precision);

      const parts = number.split('.');
      const dollarsAmount = parts[0].replace(
        /(\d)(?=(\d\d\d)+(?!\d))/g,
        `$1${thousands}`
      );
      const centsAmount = parts[1] ? decimal + parts[1] : '';

      return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
    }

    return formatString.replace(placeholderRegex, value);
  }

  var currency = /*#__PURE__*/Object.freeze({
    __proto__: null,
    formatMoney: formatMoney
  });

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  var scrollLock$2 = {exports: {}};

  (function (module, exports) {
  (function webpackUniversalModuleDefinition(root, factory) {
  	module.exports = factory();
  })(commonjsGlobal, function() {
  return /******/ (function(modules) { // webpackBootstrap
  /******/ 	// The module cache
  /******/ 	var installedModules = {};
  /******/
  /******/ 	// The require function
  /******/ 	function __webpack_require__(moduleId) {
  /******/
  /******/ 		// Check if module is in cache
  /******/ 		if(installedModules[moduleId]) {
  /******/ 			return installedModules[moduleId].exports;
  /******/ 		}
  /******/ 		// Create a new module (and put it into the cache)
  /******/ 		var module = installedModules[moduleId] = {
  /******/ 			i: moduleId,
  /******/ 			l: false,
  /******/ 			exports: {}
  /******/ 		};
  /******/
  /******/ 		// Execute the module function
  /******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
  /******/
  /******/ 		// Flag the module as loaded
  /******/ 		module.l = true;
  /******/
  /******/ 		// Return the exports of the module
  /******/ 		return module.exports;
  /******/ 	}
  /******/
  /******/
  /******/ 	// expose the modules object (__webpack_modules__)
  /******/ 	__webpack_require__.m = modules;
  /******/
  /******/ 	// expose the module cache
  /******/ 	__webpack_require__.c = installedModules;
  /******/
  /******/ 	// define getter function for harmony exports
  /******/ 	__webpack_require__.d = function(exports, name, getter) {
  /******/ 		if(!__webpack_require__.o(exports, name)) {
  /******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
  /******/ 		}
  /******/ 	};
  /******/
  /******/ 	// define __esModule on exports
  /******/ 	__webpack_require__.r = function(exports) {
  /******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
  /******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
  /******/ 		}
  /******/ 		Object.defineProperty(exports, '__esModule', { value: true });
  /******/ 	};
  /******/
  /******/ 	// create a fake namespace object
  /******/ 	// mode & 1: value is a module id, require it
  /******/ 	// mode & 2: merge all properties of value into the ns
  /******/ 	// mode & 4: return value when already ns object
  /******/ 	// mode & 8|1: behave like require
  /******/ 	__webpack_require__.t = function(value, mode) {
  /******/ 		if(mode & 1) value = __webpack_require__(value);
  /******/ 		if(mode & 8) return value;
  /******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
  /******/ 		var ns = Object.create(null);
  /******/ 		__webpack_require__.r(ns);
  /******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
  /******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
  /******/ 		return ns;
  /******/ 	};
  /******/
  /******/ 	// getDefaultExport function for compatibility with non-harmony modules
  /******/ 	__webpack_require__.n = function(module) {
  /******/ 		var getter = module && module.__esModule ?
  /******/ 			function getDefault() { return module['default']; } :
  /******/ 			function getModuleExports() { return module; };
  /******/ 		__webpack_require__.d(getter, 'a', getter);
  /******/ 		return getter;
  /******/ 	};
  /******/
  /******/ 	// Object.prototype.hasOwnProperty.call
  /******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
  /******/
  /******/ 	// __webpack_public_path__
  /******/ 	__webpack_require__.p = "";
  /******/
  /******/
  /******/ 	// Load entry module and return exports
  /******/ 	return __webpack_require__(__webpack_require__.s = 0);
  /******/ })
  /************************************************************************/
  /******/ ([
  /* 0 */
  /***/ (function(module, __webpack_exports__, __webpack_require__) {
  __webpack_require__.r(__webpack_exports__);

  // CONCATENATED MODULE: ./src/tools.js
  var argumentAsArray = function argumentAsArray(argument) {
    return Array.isArray(argument) ? argument : [argument];
  };
  var isElement = function isElement(target) {
    return target instanceof Node;
  };
  var isElementList = function isElementList(nodeList) {
    return nodeList instanceof NodeList;
  };
  var eachNode = function eachNode(nodeList, callback) {
    if (nodeList && callback) {
      nodeList = isElementList(nodeList) ? nodeList : [nodeList];

      for (var i = 0; i < nodeList.length; i++) {
        if (callback(nodeList[i], i, nodeList.length) === true) {
          break;
        }
      }
    }
  };
  var throwError = function throwError(message) {
    return console.error("[scroll-lock] ".concat(message));
  };
  var arrayAsSelector = function arrayAsSelector(array) {
    if (Array.isArray(array)) {
      var selector = array.join(', ');
      return selector;
    }
  };
  var nodeListAsArray = function nodeListAsArray(nodeList) {
    var nodes = [];
    eachNode(nodeList, function (node) {
      return nodes.push(node);
    });
    return nodes;
  };
  var findParentBySelector = function findParentBySelector($el, selector) {
    var self = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var $root = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : document;

    if (self && nodeListAsArray($root.querySelectorAll(selector)).indexOf($el) !== -1) {
      return $el;
    }

    while (($el = $el.parentElement) && nodeListAsArray($root.querySelectorAll(selector)).indexOf($el) === -1) {
    }

    return $el;
  };
  var elementHasSelector = function elementHasSelector($el, selector) {
    var $root = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document;
    var has = nodeListAsArray($root.querySelectorAll(selector)).indexOf($el) !== -1;
    return has;
  };
  var elementHasOverflowHidden = function elementHasOverflowHidden($el) {
    if ($el) {
      var computedStyle = getComputedStyle($el);
      var overflowIsHidden = computedStyle.overflow === 'hidden';
      return overflowIsHidden;
    }
  };
  var elementScrollTopOnStart = function elementScrollTopOnStart($el) {
    if ($el) {
      if (elementHasOverflowHidden($el)) {
        return true;
      }

      var scrollTop = $el.scrollTop;
      return scrollTop <= 0;
    }
  };
  var elementScrollTopOnEnd = function elementScrollTopOnEnd($el) {
    if ($el) {
      if (elementHasOverflowHidden($el)) {
        return true;
      }

      var scrollTop = $el.scrollTop;
      var scrollHeight = $el.scrollHeight;
      var scrollTopWithHeight = scrollTop + $el.offsetHeight;
      return scrollTopWithHeight >= scrollHeight;
    }
  };
  var elementScrollLeftOnStart = function elementScrollLeftOnStart($el) {
    if ($el) {
      if (elementHasOverflowHidden($el)) {
        return true;
      }

      var scrollLeft = $el.scrollLeft;
      return scrollLeft <= 0;
    }
  };
  var elementScrollLeftOnEnd = function elementScrollLeftOnEnd($el) {
    if ($el) {
      if (elementHasOverflowHidden($el)) {
        return true;
      }

      var scrollLeft = $el.scrollLeft;
      var scrollWidth = $el.scrollWidth;
      var scrollLeftWithWidth = scrollLeft + $el.offsetWidth;
      return scrollLeftWithWidth >= scrollWidth;
    }
  };
  var elementIsScrollableField = function elementIsScrollableField($el) {
    var selector = 'textarea, [contenteditable="true"]';
    return elementHasSelector($el, selector);
  };
  var elementIsInputRange = function elementIsInputRange($el) {
    var selector = 'input[type="range"]';
    return elementHasSelector($el, selector);
  };
  // CONCATENATED MODULE: ./src/scroll-lock.js
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "disablePageScroll", function() { return disablePageScroll; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "enablePageScroll", function() { return enablePageScroll; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getScrollState", function() { return getScrollState; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clearQueueScrollLocks", function() { return clearQueueScrollLocks; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTargetScrollBarWidth", function() { return scroll_lock_getTargetScrollBarWidth; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getCurrentTargetScrollBarWidth", function() { return scroll_lock_getCurrentTargetScrollBarWidth; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getPageScrollBarWidth", function() { return getPageScrollBarWidth; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getCurrentPageScrollBarWidth", function() { return getCurrentPageScrollBarWidth; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addScrollableTarget", function() { return scroll_lock_addScrollableTarget; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeScrollableTarget", function() { return scroll_lock_removeScrollableTarget; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addScrollableSelector", function() { return scroll_lock_addScrollableSelector; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeScrollableSelector", function() { return scroll_lock_removeScrollableSelector; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addLockableTarget", function() { return scroll_lock_addLockableTarget; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addLockableSelector", function() { return scroll_lock_addLockableSelector; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setFillGapMethod", function() { return scroll_lock_setFillGapMethod; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addFillGapTarget", function() { return scroll_lock_addFillGapTarget; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeFillGapTarget", function() { return scroll_lock_removeFillGapTarget; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addFillGapSelector", function() { return scroll_lock_addFillGapSelector; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeFillGapSelector", function() { return scroll_lock_removeFillGapSelector; });
  /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "refillGaps", function() { return refillGaps; });
  function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


  var FILL_GAP_AVAILABLE_METHODS = ['padding', 'margin', 'width', 'max-width', 'none'];
  var TOUCH_DIRECTION_DETECT_OFFSET = 3;
  var state = {
    scroll: true,
    queue: 0,
    scrollableSelectors: ['[data-scroll-lock-scrollable]'],
    lockableSelectors: ['body', '[data-scroll-lock-lockable]'],
    fillGapSelectors: ['body', '[data-scroll-lock-fill-gap]', '[data-scroll-lock-lockable]'],
    fillGapMethod: FILL_GAP_AVAILABLE_METHODS[0],
    //
    startTouchY: 0,
    startTouchX: 0
  };
  var disablePageScroll = function disablePageScroll(target) {
    if (state.queue <= 0) {
      state.scroll = false;
      scroll_lock_hideLockableOverflow();
      fillGaps();
    }

    scroll_lock_addScrollableTarget(target);
    state.queue++;
  };
  var enablePageScroll = function enablePageScroll(target) {
    state.queue > 0 && state.queue--;

    if (state.queue <= 0) {
      state.scroll = true;
      scroll_lock_showLockableOverflow();
      unfillGaps();
    }

    scroll_lock_removeScrollableTarget(target);
  };
  var getScrollState = function getScrollState() {
    return state.scroll;
  };
  var clearQueueScrollLocks = function clearQueueScrollLocks() {
    state.queue = 0;
  };
  var scroll_lock_getTargetScrollBarWidth = function getTargetScrollBarWidth($target) {
    var onlyExists = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (isElement($target)) {
      var currentOverflowYProperty = $target.style.overflowY;

      if (onlyExists) {
        if (!getScrollState()) {
          $target.style.overflowY = $target.getAttribute('data-scroll-lock-saved-overflow-y-property');
        }
      } else {
        $target.style.overflowY = 'scroll';
      }

      var width = scroll_lock_getCurrentTargetScrollBarWidth($target);
      $target.style.overflowY = currentOverflowYProperty;
      return width;
    } else {
      return 0;
    }
  };
  var scroll_lock_getCurrentTargetScrollBarWidth = function getCurrentTargetScrollBarWidth($target) {
    if (isElement($target)) {
      if ($target === document.body) {
        var documentWidth = document.documentElement.clientWidth;
        var windowWidth = window.innerWidth;
        var currentWidth = windowWidth - documentWidth;
        return currentWidth;
      } else {
        var borderLeftWidthCurrentProperty = $target.style.borderLeftWidth;
        var borderRightWidthCurrentProperty = $target.style.borderRightWidth;
        $target.style.borderLeftWidth = '0px';
        $target.style.borderRightWidth = '0px';

        var _currentWidth = $target.offsetWidth - $target.clientWidth;

        $target.style.borderLeftWidth = borderLeftWidthCurrentProperty;
        $target.style.borderRightWidth = borderRightWidthCurrentProperty;
        return _currentWidth;
      }
    } else {
      return 0;
    }
  };
  var getPageScrollBarWidth = function getPageScrollBarWidth() {
    var onlyExists = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    return scroll_lock_getTargetScrollBarWidth(document.body, onlyExists);
  };
  var getCurrentPageScrollBarWidth = function getCurrentPageScrollBarWidth() {
    return scroll_lock_getCurrentTargetScrollBarWidth(document.body);
  };
  var scroll_lock_addScrollableTarget = function addScrollableTarget(target) {
    if (target) {
      var targets = argumentAsArray(target);
      targets.map(function ($targets) {
        eachNode($targets, function ($target) {
          if (isElement($target)) {
            $target.setAttribute('data-scroll-lock-scrollable', '');
          } else {
            throwError("\"".concat($target, "\" is not a Element."));
          }
        });
      });
    }
  };
  var scroll_lock_removeScrollableTarget = function removeScrollableTarget(target) {
    if (target) {
      var targets = argumentAsArray(target);
      targets.map(function ($targets) {
        eachNode($targets, function ($target) {
          if (isElement($target)) {
            $target.removeAttribute('data-scroll-lock-scrollable');
          } else {
            throwError("\"".concat($target, "\" is not a Element."));
          }
        });
      });
    }
  };
  var scroll_lock_addScrollableSelector = function addScrollableSelector(selector) {
    if (selector) {
      var selectors = argumentAsArray(selector);
      selectors.map(function (selector) {
        state.scrollableSelectors.push(selector);
      });
    }
  };
  var scroll_lock_removeScrollableSelector = function removeScrollableSelector(selector) {
    if (selector) {
      var selectors = argumentAsArray(selector);
      selectors.map(function (selector) {
        state.scrollableSelectors = state.scrollableSelectors.filter(function (sSelector) {
          return sSelector !== selector;
        });
      });
    }
  };
  var scroll_lock_addLockableTarget = function addLockableTarget(target) {
    if (target) {
      var targets = argumentAsArray(target);
      targets.map(function ($targets) {
        eachNode($targets, function ($target) {
          if (isElement($target)) {
            $target.setAttribute('data-scroll-lock-lockable', '');
          } else {
            throwError("\"".concat($target, "\" is not a Element."));
          }
        });
      });

      if (!getScrollState()) {
        scroll_lock_hideLockableOverflow();
      }
    }
  };
  var scroll_lock_addLockableSelector = function addLockableSelector(selector) {
    if (selector) {
      var selectors = argumentAsArray(selector);
      selectors.map(function (selector) {
        state.lockableSelectors.push(selector);
      });

      if (!getScrollState()) {
        scroll_lock_hideLockableOverflow();
      }

      scroll_lock_addFillGapSelector(selector);
    }
  };
  var scroll_lock_setFillGapMethod = function setFillGapMethod(method) {
    if (method) {
      if (FILL_GAP_AVAILABLE_METHODS.indexOf(method) !== -1) {
        state.fillGapMethod = method;
        refillGaps();
      } else {
        var methods = FILL_GAP_AVAILABLE_METHODS.join(', ');
        throwError("\"".concat(method, "\" method is not available!\nAvailable fill gap methods: ").concat(methods, "."));
      }
    }
  };
  var scroll_lock_addFillGapTarget = function addFillGapTarget(target) {
    if (target) {
      var targets = argumentAsArray(target);
      targets.map(function ($targets) {
        eachNode($targets, function ($target) {
          if (isElement($target)) {
            $target.setAttribute('data-scroll-lock-fill-gap', '');

            if (!state.scroll) {
              scroll_lock_fillGapTarget($target);
            }
          } else {
            throwError("\"".concat($target, "\" is not a Element."));
          }
        });
      });
    }
  };
  var scroll_lock_removeFillGapTarget = function removeFillGapTarget(target) {
    if (target) {
      var targets = argumentAsArray(target);
      targets.map(function ($targets) {
        eachNode($targets, function ($target) {
          if (isElement($target)) {
            $target.removeAttribute('data-scroll-lock-fill-gap');

            if (!state.scroll) {
              scroll_lock_unfillGapTarget($target);
            }
          } else {
            throwError("\"".concat($target, "\" is not a Element."));
          }
        });
      });
    }
  };
  var scroll_lock_addFillGapSelector = function addFillGapSelector(selector) {
    if (selector) {
      var selectors = argumentAsArray(selector);
      selectors.map(function (selector) {
        if (state.fillGapSelectors.indexOf(selector) === -1) {
          state.fillGapSelectors.push(selector);

          if (!state.scroll) {
            scroll_lock_fillGapSelector(selector);
          }
        }
      });
    }
  };
  var scroll_lock_removeFillGapSelector = function removeFillGapSelector(selector) {
    if (selector) {
      var selectors = argumentAsArray(selector);
      selectors.map(function (selector) {
        state.fillGapSelectors = state.fillGapSelectors.filter(function (fSelector) {
          return fSelector !== selector;
        });

        if (!state.scroll) {
          scroll_lock_unfillGapSelector(selector);
        }
      });
    }
  };
  var refillGaps = function refillGaps() {
    if (!state.scroll) {
      fillGaps();
    }
  };

  var scroll_lock_hideLockableOverflow = function hideLockableOverflow() {
    var selector = arrayAsSelector(state.lockableSelectors);
    scroll_lock_hideLockableOverflowSelector(selector);
  };

  var scroll_lock_showLockableOverflow = function showLockableOverflow() {
    var selector = arrayAsSelector(state.lockableSelectors);
    scroll_lock_showLockableOverflowSelector(selector);
  };

  var scroll_lock_hideLockableOverflowSelector = function hideLockableOverflowSelector(selector) {
    var $targets = document.querySelectorAll(selector);
    eachNode($targets, function ($target) {
      scroll_lock_hideLockableOverflowTarget($target);
    });
  };

  var scroll_lock_showLockableOverflowSelector = function showLockableOverflowSelector(selector) {
    var $targets = document.querySelectorAll(selector);
    eachNode($targets, function ($target) {
      scroll_lock_showLockableOverflowTarget($target);
    });
  };

  var scroll_lock_hideLockableOverflowTarget = function hideLockableOverflowTarget($target) {
    if (isElement($target) && $target.getAttribute('data-scroll-lock-locked') !== 'true') {
      var computedStyle = window.getComputedStyle($target);
      $target.setAttribute('data-scroll-lock-saved-overflow-y-property', computedStyle.overflowY);
      $target.setAttribute('data-scroll-lock-saved-inline-overflow-property', $target.style.overflow);
      $target.setAttribute('data-scroll-lock-saved-inline-overflow-y-property', $target.style.overflowY);
      $target.style.overflow = 'hidden';
      $target.setAttribute('data-scroll-lock-locked', 'true');
    }
  };

  var scroll_lock_showLockableOverflowTarget = function showLockableOverflowTarget($target) {
    if (isElement($target) && $target.getAttribute('data-scroll-lock-locked') === 'true') {
      $target.style.overflow = $target.getAttribute('data-scroll-lock-saved-inline-overflow-property');
      $target.style.overflowY = $target.getAttribute('data-scroll-lock-saved-inline-overflow-y-property');
      $target.removeAttribute('data-scroll-lock-saved-overflow-property');
      $target.removeAttribute('data-scroll-lock-saved-inline-overflow-property');
      $target.removeAttribute('data-scroll-lock-saved-inline-overflow-y-property');
      $target.removeAttribute('data-scroll-lock-locked');
    }
  };

  var fillGaps = function fillGaps() {
    state.fillGapSelectors.map(function (selector) {
      scroll_lock_fillGapSelector(selector);
    });
  };

  var unfillGaps = function unfillGaps() {
    state.fillGapSelectors.map(function (selector) {
      scroll_lock_unfillGapSelector(selector);
    });
  };

  var scroll_lock_fillGapSelector = function fillGapSelector(selector) {
    var $targets = document.querySelectorAll(selector);
    var isLockable = state.lockableSelectors.indexOf(selector) !== -1;
    eachNode($targets, function ($target) {
      scroll_lock_fillGapTarget($target, isLockable);
    });
  };

  var scroll_lock_fillGapTarget = function fillGapTarget($target) {
    var isLockable = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (isElement($target)) {
      var scrollBarWidth;

      if ($target.getAttribute('data-scroll-lock-lockable') === '' || isLockable) {
        scrollBarWidth = scroll_lock_getTargetScrollBarWidth($target, true);
      } else {
        var $lockableParent = findParentBySelector($target, arrayAsSelector(state.lockableSelectors));
        scrollBarWidth = scroll_lock_getTargetScrollBarWidth($lockableParent, true);
      }

      if ($target.getAttribute('data-scroll-lock-filled-gap') === 'true') {
        scroll_lock_unfillGapTarget($target);
      }

      var computedStyle = window.getComputedStyle($target);
      $target.setAttribute('data-scroll-lock-filled-gap', 'true');
      $target.setAttribute('data-scroll-lock-current-fill-gap-method', state.fillGapMethod);

      if (state.fillGapMethod === 'margin') {
        var currentMargin = parseFloat(computedStyle.marginRight);
        $target.style.marginRight = "".concat(currentMargin + scrollBarWidth, "px");
      } else if (state.fillGapMethod === 'width') {
        $target.style.width = "calc(100% - ".concat(scrollBarWidth, "px)");
      } else if (state.fillGapMethod === 'max-width') {
        $target.style.maxWidth = "calc(100% - ".concat(scrollBarWidth, "px)");
      } else if (state.fillGapMethod === 'padding') {
        var currentPadding = parseFloat(computedStyle.paddingRight);
        $target.style.paddingRight = "".concat(currentPadding + scrollBarWidth, "px");
      }
    }
  };

  var scroll_lock_unfillGapSelector = function unfillGapSelector(selector) {
    var $targets = document.querySelectorAll(selector);
    eachNode($targets, function ($target) {
      scroll_lock_unfillGapTarget($target);
    });
  };

  var scroll_lock_unfillGapTarget = function unfillGapTarget($target) {
    if (isElement($target)) {
      if ($target.getAttribute('data-scroll-lock-filled-gap') === 'true') {
        var currentFillGapMethod = $target.getAttribute('data-scroll-lock-current-fill-gap-method');
        $target.removeAttribute('data-scroll-lock-filled-gap');
        $target.removeAttribute('data-scroll-lock-current-fill-gap-method');

        if (currentFillGapMethod === 'margin') {
          $target.style.marginRight = "";
        } else if (currentFillGapMethod === 'width') {
          $target.style.width = "";
        } else if (currentFillGapMethod === 'max-width') {
          $target.style.maxWidth = "";
        } else if (currentFillGapMethod === 'padding') {
          $target.style.paddingRight = "";
        }
      }
    }
  };

  var onResize = function onResize(e) {
    refillGaps();
  };

  var onTouchStart = function onTouchStart(e) {
    if (!state.scroll) {
      state.startTouchY = e.touches[0].clientY;
      state.startTouchX = e.touches[0].clientX;
    }
  };

  var scroll_lock_onTouchMove = function onTouchMove(e) {
    if (!state.scroll) {
      var startTouchY = state.startTouchY,
          startTouchX = state.startTouchX;
      var currentClientY = e.touches[0].clientY;
      var currentClientX = e.touches[0].clientX;

      if (e.touches.length < 2) {
        var selector = arrayAsSelector(state.scrollableSelectors);
        var direction = {
          up: startTouchY < currentClientY,
          down: startTouchY > currentClientY,
          left: startTouchX < currentClientX,
          right: startTouchX > currentClientX
        };
        var directionWithOffset = {
          up: startTouchY + TOUCH_DIRECTION_DETECT_OFFSET < currentClientY,
          down: startTouchY - TOUCH_DIRECTION_DETECT_OFFSET > currentClientY,
          left: startTouchX + TOUCH_DIRECTION_DETECT_OFFSET < currentClientX,
          right: startTouchX - TOUCH_DIRECTION_DETECT_OFFSET > currentClientX
        };

        var handle = function handle($el) {
          var skip = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

          if ($el) {
            var parentScrollableEl = findParentBySelector($el, selector, false);

            if (elementIsInputRange($el)) {
              return false;
            }

            if (skip || elementIsScrollableField($el) && findParentBySelector($el, selector) || elementHasSelector($el, selector)) {
              var prevent = false;

              if (elementScrollLeftOnStart($el) && elementScrollLeftOnEnd($el)) {
                if (direction.up && elementScrollTopOnStart($el) || direction.down && elementScrollTopOnEnd($el)) {
                  prevent = true;
                }
              } else if (elementScrollTopOnStart($el) && elementScrollTopOnEnd($el)) {
                if (direction.left && elementScrollLeftOnStart($el) || direction.right && elementScrollLeftOnEnd($el)) {
                  prevent = true;
                }
              } else if (directionWithOffset.up && elementScrollTopOnStart($el) || directionWithOffset.down && elementScrollTopOnEnd($el) || directionWithOffset.left && elementScrollLeftOnStart($el) || directionWithOffset.right && elementScrollLeftOnEnd($el)) {
                prevent = true;
              }

              if (prevent) {
                if (parentScrollableEl) {
                  handle(parentScrollableEl, true);
                } else {
                  if (e.cancelable) {
                    e.preventDefault();
                  }
                }
              }
            } else {
              handle(parentScrollableEl);
            }
          } else {
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        };

        handle(e.target);
      }
    }
  };

  var onTouchEnd = function onTouchEnd(e) {
    if (!state.scroll) {
      state.startTouchY = 0;
      state.startTouchX = 0;
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onResize);
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchmove', scroll_lock_onTouchMove, {
      passive: false
    });
    document.addEventListener('touchend', onTouchEnd);
  }

  var deprecatedMethods = {
    hide: function hide(target) {
      throwError('"hide" is deprecated! Use "disablePageScroll" instead. \n https://github.com/FL3NKEY/scroll-lock#disablepagescrollscrollabletarget');
      disablePageScroll(target);
    },
    show: function show(target) {
      throwError('"show" is deprecated! Use "enablePageScroll" instead. \n https://github.com/FL3NKEY/scroll-lock#enablepagescrollscrollabletarget');
      enablePageScroll(target);
    },
    toggle: function toggle(target) {
      throwError('"toggle" is deprecated! Do not use it.');

      if (getScrollState()) {
        disablePageScroll();
      } else {
        enablePageScroll(target);
      }
    },
    getState: function getState() {
      throwError('"getState" is deprecated! Use "getScrollState" instead. \n https://github.com/FL3NKEY/scroll-lock#getscrollstate');
      return getScrollState();
    },
    getWidth: function getWidth() {
      throwError('"getWidth" is deprecated! Use "getPageScrollBarWidth" instead. \n https://github.com/FL3NKEY/scroll-lock#getpagescrollbarwidth');
      return getPageScrollBarWidth();
    },
    getCurrentWidth: function getCurrentWidth() {
      throwError('"getCurrentWidth" is deprecated! Use "getCurrentPageScrollBarWidth" instead. \n https://github.com/FL3NKEY/scroll-lock#getcurrentpagescrollbarwidth');
      return getCurrentPageScrollBarWidth();
    },
    setScrollableTargets: function setScrollableTargets(target) {
      throwError('"setScrollableTargets" is deprecated! Use "addScrollableTarget" instead. \n https://github.com/FL3NKEY/scroll-lock#addscrollabletargetscrollabletarget');
      scroll_lock_addScrollableTarget(target);
    },
    setFillGapSelectors: function setFillGapSelectors(selector) {
      throwError('"setFillGapSelectors" is deprecated! Use "addFillGapSelector" instead. \n https://github.com/FL3NKEY/scroll-lock#addfillgapselectorfillgapselector');
      scroll_lock_addFillGapSelector(selector);
    },
    setFillGapTargets: function setFillGapTargets(target) {
      throwError('"setFillGapTargets" is deprecated! Use "addFillGapTarget" instead. \n https://github.com/FL3NKEY/scroll-lock#addfillgaptargetfillgaptarget');
      scroll_lock_addFillGapTarget(target);
    },
    clearQueue: function clearQueue() {
      throwError('"clearQueue" is deprecated! Use "clearQueueScrollLocks" instead. \n https://github.com/FL3NKEY/scroll-lock#clearqueuescrolllocks');
      clearQueueScrollLocks();
    }
  };

  var scrollLock = _objectSpread({
    disablePageScroll: disablePageScroll,
    enablePageScroll: enablePageScroll,
    getScrollState: getScrollState,
    clearQueueScrollLocks: clearQueueScrollLocks,
    getTargetScrollBarWidth: scroll_lock_getTargetScrollBarWidth,
    getCurrentTargetScrollBarWidth: scroll_lock_getCurrentTargetScrollBarWidth,
    getPageScrollBarWidth: getPageScrollBarWidth,
    getCurrentPageScrollBarWidth: getCurrentPageScrollBarWidth,
    addScrollableSelector: scroll_lock_addScrollableSelector,
    removeScrollableSelector: scroll_lock_removeScrollableSelector,
    addScrollableTarget: scroll_lock_addScrollableTarget,
    removeScrollableTarget: scroll_lock_removeScrollableTarget,
    addLockableSelector: scroll_lock_addLockableSelector,
    addLockableTarget: scroll_lock_addLockableTarget,
    addFillGapSelector: scroll_lock_addFillGapSelector,
    removeFillGapSelector: scroll_lock_removeFillGapSelector,
    addFillGapTarget: scroll_lock_addFillGapTarget,
    removeFillGapTarget: scroll_lock_removeFillGapTarget,
    setFillGapMethod: scroll_lock_setFillGapMethod,
    refillGaps: refillGaps,
    _state: state
  }, deprecatedMethods);

  /* harmony default export */ __webpack_exports__["default"] = (scrollLock);

  /***/ })
  /******/ ])["default"];
  });
  }(scrollLock$2));

  var scrollLock = /*@__PURE__*/getDefaultExportFromCjs(scrollLock$2.exports);

  var scrollLock$1 = /*#__PURE__*/_mergeNamespaces({
    __proto__: null,
    default: scrollLock
  }, [scrollLock$2.exports]);

  var aos$1 = {exports: {}};

  (function (module, exports) {
  !function(e,t){module.exports=t();}(commonjsGlobal,function(){return function(e){function t(o){if(n[o])return n[o].exports;var i=n[o]={exports:{},id:o,loaded:!1};return e[o].call(i.exports,i,i.exports,t),i.loaded=!0,i.exports}var n={};return t.m=e,t.c=n,t.p="dist/",t(0)}([function(e,t,n){function o(e){return e&&e.__esModule?e:{default:e}}var i=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(e[o]=n[o]);}return e},r=n(1),a=(o(r),n(6)),u=o(a),c=n(7),s=o(c),f=n(8),d=o(f),l=n(9),p=o(l),m=n(10),b=o(m),v=n(11),y=o(v),g=n(14),h=o(g),w=[],k=!1,x={offset:120,delay:0,easing:"ease",duration:400,disable:!1,once:!1,startEvent:"DOMContentLoaded",throttleDelay:99,debounceDelay:50,disableMutationObserver:!1},j=function(){var e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];if(e&&(k=!0),k)return w=(0, y.default)(w,x),(0, b.default)(w,x.once),w},O=function(){w=(0, h.default)(),j();},M=function(){w.forEach(function(e,t){e.node.removeAttribute("data-aos"),e.node.removeAttribute("data-aos-easing"),e.node.removeAttribute("data-aos-duration"),e.node.removeAttribute("data-aos-delay");});},S=function(e){return e===!0||"mobile"===e&&p.default.mobile()||"phone"===e&&p.default.phone()||"tablet"===e&&p.default.tablet()||"function"==typeof e&&e()===!0},_=function(e){x=i(x,e),w=(0, h.default)();var t=document.all&&!window.atob;return S(x.disable)||t?M():(x.disableMutationObserver||d.default.isSupported()||(console.info('\n      aos: MutationObserver is not supported on this browser,\n      code mutations observing has been disabled.\n      You may have to call "refreshHard()" by yourself.\n    '),x.disableMutationObserver=!0),document.querySelector("body").setAttribute("data-aos-easing",x.easing),document.querySelector("body").setAttribute("data-aos-duration",x.duration),document.querySelector("body").setAttribute("data-aos-delay",x.delay),"DOMContentLoaded"===x.startEvent&&["complete","interactive"].indexOf(document.readyState)>-1?j(!0):"load"===x.startEvent?window.addEventListener(x.startEvent,function(){j(!0);}):document.addEventListener(x.startEvent,function(){j(!0);}),window.addEventListener("resize",(0, s.default)(j,x.debounceDelay,!0)),window.addEventListener("orientationchange",(0, s.default)(j,x.debounceDelay,!0)),window.addEventListener("scroll",(0, u.default)(function(){(0, b.default)(w,x.once);},x.throttleDelay)),x.disableMutationObserver||d.default.ready("[data-aos]",O),w)};e.exports={init:_,refresh:j,refreshHard:O};},function(e,t){},,,,,function(e,t){(function(t){function n(e,t,n){function o(t){var n=b,o=v;return b=v=void 0,k=t,g=e.apply(o,n)}function r(e){return k=e,h=setTimeout(f,t),M?o(e):g}function a(e){var n=e-w,o=e-k,i=t-n;return S?j(i,y-o):i}function c(e){var n=e-w,o=e-k;return void 0===w||n>=t||n<0||S&&o>=y}function f(){var e=O();return c(e)?d(e):void(h=setTimeout(f,a(e)))}function d(e){return h=void 0,_&&b?o(e):(b=v=void 0,g)}function l(){void 0!==h&&clearTimeout(h),k=0,b=w=v=h=void 0;}function p(){return void 0===h?g:d(O())}function m(){var e=O(),n=c(e);if(b=arguments,v=this,w=e,n){if(void 0===h)return r(w);if(S)return h=setTimeout(f,t),o(w)}return void 0===h&&(h=setTimeout(f,t)),g}var b,v,y,g,h,w,k=0,M=!1,S=!1,_=!0;if("function"!=typeof e)throw new TypeError(s);return t=u(t)||0,i(n)&&(M=!!n.leading,S="maxWait"in n,y=S?x(u(n.maxWait)||0,t):y,_="trailing"in n?!!n.trailing:_),m.cancel=l,m.flush=p,m}function o(e,t,o){var r=!0,a=!0;if("function"!=typeof e)throw new TypeError(s);return i(o)&&(r="leading"in o?!!o.leading:r,a="trailing"in o?!!o.trailing:a),n(e,t,{leading:r,maxWait:t,trailing:a})}function i(e){var t="undefined"==typeof e?"undefined":c(e);return !!e&&("object"==t||"function"==t)}function r(e){return !!e&&"object"==("undefined"==typeof e?"undefined":c(e))}function a(e){return "symbol"==("undefined"==typeof e?"undefined":c(e))||r(e)&&k.call(e)==d}function u(e){if("number"==typeof e)return e;if(a(e))return f;if(i(e)){var t="function"==typeof e.valueOf?e.valueOf():e;e=i(t)?t+"":t;}if("string"!=typeof e)return 0===e?e:+e;e=e.replace(l,"");var n=m.test(e);return n||b.test(e)?v(e.slice(2),n?2:8):p.test(e)?f:+e}var c="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},s="Expected a function",f=NaN,d="[object Symbol]",l=/^\s+|\s+$/g,p=/^[-+]0x[0-9a-f]+$/i,m=/^0b[01]+$/i,b=/^0o[0-7]+$/i,v=parseInt,y="object"==("undefined"==typeof t?"undefined":c(t))&&t&&t.Object===Object&&t,g="object"==("undefined"==typeof self?"undefined":c(self))&&self&&self.Object===Object&&self,h=y||g||Function("return this")(),w=Object.prototype,k=w.toString,x=Math.max,j=Math.min,O=function(){return h.Date.now()};e.exports=o;}).call(t,function(){return this}());},function(e,t){(function(t){function n(e,t,n){function i(t){var n=b,o=v;return b=v=void 0,O=t,g=e.apply(o,n)}function r(e){return O=e,h=setTimeout(f,t),M?i(e):g}function u(e){var n=e-w,o=e-O,i=t-n;return S?x(i,y-o):i}function s(e){var n=e-w,o=e-O;return void 0===w||n>=t||n<0||S&&o>=y}function f(){var e=j();return s(e)?d(e):void(h=setTimeout(f,u(e)))}function d(e){return h=void 0,_&&b?i(e):(b=v=void 0,g)}function l(){void 0!==h&&clearTimeout(h),O=0,b=w=v=h=void 0;}function p(){return void 0===h?g:d(j())}function m(){var e=j(),n=s(e);if(b=arguments,v=this,w=e,n){if(void 0===h)return r(w);if(S)return h=setTimeout(f,t),i(w)}return void 0===h&&(h=setTimeout(f,t)),g}var b,v,y,g,h,w,O=0,M=!1,S=!1,_=!0;if("function"!=typeof e)throw new TypeError(c);return t=a(t)||0,o(n)&&(M=!!n.leading,S="maxWait"in n,y=S?k(a(n.maxWait)||0,t):y,_="trailing"in n?!!n.trailing:_),m.cancel=l,m.flush=p,m}function o(e){var t="undefined"==typeof e?"undefined":u(e);return !!e&&("object"==t||"function"==t)}function i(e){return !!e&&"object"==("undefined"==typeof e?"undefined":u(e))}function r(e){return "symbol"==("undefined"==typeof e?"undefined":u(e))||i(e)&&w.call(e)==f}function a(e){if("number"==typeof e)return e;if(r(e))return s;if(o(e)){var t="function"==typeof e.valueOf?e.valueOf():e;e=o(t)?t+"":t;}if("string"!=typeof e)return 0===e?e:+e;e=e.replace(d,"");var n=p.test(e);return n||m.test(e)?b(e.slice(2),n?2:8):l.test(e)?s:+e}var u="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},c="Expected a function",s=NaN,f="[object Symbol]",d=/^\s+|\s+$/g,l=/^[-+]0x[0-9a-f]+$/i,p=/^0b[01]+$/i,m=/^0o[0-7]+$/i,b=parseInt,v="object"==("undefined"==typeof t?"undefined":u(t))&&t&&t.Object===Object&&t,y="object"==("undefined"==typeof self?"undefined":u(self))&&self&&self.Object===Object&&self,g=v||y||Function("return this")(),h=Object.prototype,w=h.toString,k=Math.max,x=Math.min,j=function(){return g.Date.now()};e.exports=n;}).call(t,function(){return this}());},function(e,t){function n(e){var t=void 0,o=void 0;for(t=0;t<e.length;t+=1){if(o=e[t],o.dataset&&o.dataset.aos)return !0;if(o.children&&n(o.children))return !0}return !1}function o(){return window.MutationObserver||window.WebKitMutationObserver||window.MozMutationObserver}function i(){return !!o()}function r(e,t){var n=window.document,i=o(),r=new i(a);u=t,r.observe(n.documentElement,{childList:!0,subtree:!0,removedNodes:!0});}function a(e){e&&e.forEach(function(e){var t=Array.prototype.slice.call(e.addedNodes),o=Array.prototype.slice.call(e.removedNodes),i=t.concat(o);if(n(i))return u()});}Object.defineProperty(t,"__esModule",{value:!0});var u=function(){};t.default={isSupported:i,ready:r};},function(e,t){function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(){return navigator.userAgent||navigator.vendor||window.opera||""}Object.defineProperty(t,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o);}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}(),r=/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i,a=/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i,u=/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i,c=/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i,s=function(){function e(){n(this,e);}return i(e,[{key:"phone",value:function(){var e=o();return !(!r.test(e)&&!a.test(e.substr(0,4)))}},{key:"mobile",value:function(){var e=o();return !(!u.test(e)&&!c.test(e.substr(0,4)))}},{key:"tablet",value:function(){return this.mobile()&&!this.phone()}}]),e}();t.default=new s;},function(e,t){Object.defineProperty(t,"__esModule",{value:!0});var n=function(e,t,n){var o=e.node.getAttribute("data-aos-once");t>e.position?e.node.classList.add("aos-animate"):"undefined"!=typeof o&&("false"===o||!n&&"true"!==o)&&e.node.classList.remove("aos-animate");},o=function(e,t){var o=window.pageYOffset,i=window.innerHeight;e.forEach(function(e,r){n(e,i+o,t);});};t.default=o;},function(e,t,n){function o(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0});var i=n(12),r=o(i),a=function(e,t){return e.forEach(function(e,n){e.node.classList.add("aos-init"),e.position=(0, r.default)(e.node,t.offset);}),e};t.default=a;},function(e,t,n){function o(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0});var i=n(13),r=o(i),a=function(e,t){var n=0,o=0,i=window.innerHeight,a={offset:e.getAttribute("data-aos-offset"),anchor:e.getAttribute("data-aos-anchor"),anchorPlacement:e.getAttribute("data-aos-anchor-placement")};switch(a.offset&&!isNaN(a.offset)&&(o=parseInt(a.offset)),a.anchor&&document.querySelectorAll(a.anchor)&&(e=document.querySelectorAll(a.anchor)[0]),n=(0, r.default)(e).top,a.anchorPlacement){case"top-bottom":break;case"center-bottom":n+=e.offsetHeight/2;break;case"bottom-bottom":n+=e.offsetHeight;break;case"top-center":n+=i/2;break;case"bottom-center":n+=i/2+e.offsetHeight;break;case"center-center":n+=i/2+e.offsetHeight/2;break;case"top-top":n+=i;break;case"bottom-top":n+=e.offsetHeight+i;break;case"center-top":n+=e.offsetHeight/2+i;}return a.anchorPlacement||a.offset||isNaN(t)||(o=t),n+o};t.default=a;},function(e,t){Object.defineProperty(t,"__esModule",{value:!0});var n=function(e){for(var t=0,n=0;e&&!isNaN(e.offsetLeft)&&!isNaN(e.offsetTop);)t+=e.offsetLeft-("BODY"!=e.tagName?e.scrollLeft:0),n+=e.offsetTop-("BODY"!=e.tagName?e.scrollTop:0),e=e.offsetParent;return {top:n,left:t}};t.default=n;},function(e,t){Object.defineProperty(t,"__esModule",{value:!0});var n=function(e){return e=e||document.querySelectorAll("[data-aos]"),Array.prototype.map.call(e,function(e){return {node:e}})};t.default=n;}])});
  }(aos$1));

  var aos = /*@__PURE__*/getDefaultExportFromCjs(aos$1.exports);

  var redaxios_module = (function e(t){function r(e,t,n){var a,o={};if(Array.isArray(e))return e.concat(t);for(a in e)o[n?a.toLowerCase():a]=e[a];for(a in t){var i=n?a.toLowerCase():a,u=t[a];o[i]=i in o&&"object"==typeof u?r(o[i],u,"headers"===i):u;}return o}function n(e,n,a,o){"string"!=typeof e&&(e=(n=e).url);var i={config:n},u=r(t,n),s={},c=o||u.data;(u.transformRequest||[]).map(function(e){c=e(c,u.headers)||c;}),c&&"object"==typeof c&&"function"!=typeof c.append&&(c=JSON.stringify(c),s["content-type"]="application/json");var f="undefined"!=typeof document&&document.cookie.match(RegExp("(^|; )"+u.xsrfCookieName+"=([^;]*)"));if(f&&(s[u.xsrfHeaderName]=f[2]),u.auth&&(s.authorization=u.auth),u.baseURL&&(e=e.replace(/^(?!.*\/\/)\/?(.*)$/,u.baseURL+"/$1")),u.params){var p=~e.indexOf("?")?"&":"?";e+=p+(u.paramsSerializer?u.paramsSerializer(u.params):new URLSearchParams(u.params));}return (u.fetch||fetch)(e,{method:a||u.method,body:c,headers:r(u.headers,s,!0),credentials:u.withCredentials?"include":"same-origin"}).then(function(e){for(var t in e)"function"!=typeof e[t]&&(i[t]=e[t]);var r=u.validateStatus?u.validateStatus(e.status):e.ok;return "stream"==u.responseType?(i.data=e.body,i):e[u.responseType||"text"]().then(function(e){i.data=e,i.data=JSON.parse(e);}).catch(Object).then(function(){return r?i:Promise.reject(i)})})}return t=t||{},n.request=n,n.get=function(e,t){return n(e,t,"get")},n.delete=function(e,t){return n(e,t,"delete")},n.head=function(e,t){return n(e,t,"head")},n.options=function(e,t){return n(e,t,"options")},n.post=function(e,t,r){return n(e,r,"post",t)},n.put=function(e,t,r){return n(e,r,"put",t)},n.patch=function(e,t,r){return n(e,r,"patch",t)},n.all=Promise.all.bind(Promise),n.spread=function(e){return function(t){return e.apply(this,t)}},n.CancelToken="function"==typeof AbortController?AbortController:Object,n.defaults=t,n.create=e,n}());

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    return Constructor;
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }

  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  var MicroModal = function () {

    var FOCUSABLE_ELEMENTS = ['a[href]', 'area[href]', 'input:not([disabled]):not([type="hidden"]):not([aria-hidden])', 'select:not([disabled]):not([aria-hidden])', 'textarea:not([disabled]):not([aria-hidden])', 'button:not([disabled]):not([aria-hidden])', 'iframe', 'object', 'embed', '[contenteditable]', '[tabindex]:not([tabindex^="-"])'];

    var Modal = /*#__PURE__*/function () {
      function Modal(_ref) {
        var targetModal = _ref.targetModal,
            _ref$triggers = _ref.triggers,
            triggers = _ref$triggers === void 0 ? [] : _ref$triggers,
            _ref$onShow = _ref.onShow,
            onShow = _ref$onShow === void 0 ? function () {} : _ref$onShow,
            _ref$onClose = _ref.onClose,
            onClose = _ref$onClose === void 0 ? function () {} : _ref$onClose,
            _ref$openTrigger = _ref.openTrigger,
            openTrigger = _ref$openTrigger === void 0 ? 'data-micromodal-trigger' : _ref$openTrigger,
            _ref$closeTrigger = _ref.closeTrigger,
            closeTrigger = _ref$closeTrigger === void 0 ? 'data-micromodal-close' : _ref$closeTrigger,
            _ref$openClass = _ref.openClass,
            openClass = _ref$openClass === void 0 ? 'is-open' : _ref$openClass,
            _ref$disableScroll = _ref.disableScroll,
            disableScroll = _ref$disableScroll === void 0 ? false : _ref$disableScroll,
            _ref$disableFocus = _ref.disableFocus,
            disableFocus = _ref$disableFocus === void 0 ? false : _ref$disableFocus,
            _ref$awaitCloseAnimat = _ref.awaitCloseAnimation,
            awaitCloseAnimation = _ref$awaitCloseAnimat === void 0 ? false : _ref$awaitCloseAnimat,
            _ref$awaitOpenAnimati = _ref.awaitOpenAnimation,
            awaitOpenAnimation = _ref$awaitOpenAnimati === void 0 ? false : _ref$awaitOpenAnimati,
            _ref$debugMode = _ref.debugMode,
            debugMode = _ref$debugMode === void 0 ? false : _ref$debugMode;

        _classCallCheck(this, Modal);

        // Save a reference of the modal
        this.modal = document.getElementById(targetModal); // Save a reference to the passed config

        this.config = {
          debugMode: debugMode,
          disableScroll: disableScroll,
          openTrigger: openTrigger,
          closeTrigger: closeTrigger,
          openClass: openClass,
          onShow: onShow,
          onClose: onClose,
          awaitCloseAnimation: awaitCloseAnimation,
          awaitOpenAnimation: awaitOpenAnimation,
          disableFocus: disableFocus
        }; // Register click events only if pre binding eventListeners

        if (triggers.length > 0) this.registerTriggers.apply(this, _toConsumableArray(triggers)); // pre bind functions for event listeners

        this.onClick = this.onClick.bind(this);
        this.onKeydown = this.onKeydown.bind(this);
      }
      /**
       * Loops through all openTriggers and binds click event
       * @param  {array} triggers [Array of node elements]
       * @return {void}
       */


      _createClass(Modal, [{
        key: "registerTriggers",
        value: function registerTriggers() {
          var _this = this;

          for (var _len = arguments.length, triggers = new Array(_len), _key = 0; _key < _len; _key++) {
            triggers[_key] = arguments[_key];
          }

          triggers.filter(Boolean).forEach(function (trigger) {
            trigger.addEventListener('click', function (event) {
              return _this.showModal(event);
            });
          });
        }
      }, {
        key: "showModal",
        value: function showModal() {
          var _this2 = this;

          var event = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
          this.activeElement = document.activeElement;
          this.modal.setAttribute('aria-hidden', 'false');
          this.modal.classList.add(this.config.openClass);
          this.scrollBehaviour('disable');
          this.addEventListeners();

          if (this.config.awaitOpenAnimation) {
            var handler = function handler() {
              _this2.modal.removeEventListener('animationend', handler, false);

              _this2.setFocusToFirstNode();
            };

            this.modal.addEventListener('animationend', handler, false);
          } else {
            this.setFocusToFirstNode();
          }

          this.config.onShow(this.modal, this.activeElement, event);
        }
      }, {
        key: "closeModal",
        value: function closeModal() {
          var event = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
          var modal = this.modal;
          this.modal.setAttribute('aria-hidden', 'true');
          this.removeEventListeners();
          this.scrollBehaviour('enable');

          if (this.activeElement && this.activeElement.focus) {
            this.activeElement.focus();
          }

          this.config.onClose(this.modal, this.activeElement, event);

          if (this.config.awaitCloseAnimation) {
            var openClass = this.config.openClass; // <- old school ftw

            this.modal.addEventListener('animationend', function handler() {
              modal.classList.remove(openClass);
              modal.removeEventListener('animationend', handler, false);
            }, false);
          } else {
            modal.classList.remove(this.config.openClass);
          }
        }
      }, {
        key: "closeModalById",
        value: function closeModalById(targetModal) {
          this.modal = document.getElementById(targetModal);
          if (this.modal) this.closeModal();
        }
      }, {
        key: "scrollBehaviour",
        value: function scrollBehaviour(toggle) {
          if (!this.config.disableScroll) return;
          var body = document.querySelector('body');

          switch (toggle) {
            case 'enable':
              Object.assign(body.style, {
                overflow: ''
              });
              break;

            case 'disable':
              Object.assign(body.style, {
                overflow: 'hidden'
              });
              break;
          }
        }
      }, {
        key: "addEventListeners",
        value: function addEventListeners() {
          this.modal.addEventListener('touchstart', this.onClick);
          this.modal.addEventListener('click', this.onClick);
          document.addEventListener('keydown', this.onKeydown);
        }
      }, {
        key: "removeEventListeners",
        value: function removeEventListeners() {
          this.modal.removeEventListener('touchstart', this.onClick);
          this.modal.removeEventListener('click', this.onClick);
          document.removeEventListener('keydown', this.onKeydown);
        }
      }, {
        key: "onClick",
        value: function onClick(event) {
          if (event.target.hasAttribute(this.config.closeTrigger)) {
            this.closeModal(event);
          }
        }
      }, {
        key: "onKeydown",
        value: function onKeydown(event) {
          if (event.keyCode === 27) this.closeModal(event); // esc

          if (event.keyCode === 9) this.retainFocus(event); // tab
        }
      }, {
        key: "getFocusableNodes",
        value: function getFocusableNodes() {
          var nodes = this.modal.querySelectorAll(FOCUSABLE_ELEMENTS);
          return Array.apply(void 0, _toConsumableArray(nodes));
        }
        /**
         * Tries to set focus on a node which is not a close trigger
         * if no other nodes exist then focuses on first close trigger
         */

      }, {
        key: "setFocusToFirstNode",
        value: function setFocusToFirstNode() {
          var _this3 = this;

          if (this.config.disableFocus) return;
          var focusableNodes = this.getFocusableNodes(); // no focusable nodes

          if (focusableNodes.length === 0) return; // remove nodes on whose click, the modal closes
          // could not think of a better name :(

          var nodesWhichAreNotCloseTargets = focusableNodes.filter(function (node) {
            return !node.hasAttribute(_this3.config.closeTrigger);
          });
          if (nodesWhichAreNotCloseTargets.length > 0) nodesWhichAreNotCloseTargets[0].focus();
          if (nodesWhichAreNotCloseTargets.length === 0) focusableNodes[0].focus();
        }
      }, {
        key: "retainFocus",
        value: function retainFocus(event) {
          var focusableNodes = this.getFocusableNodes(); // no focusable nodes

          if (focusableNodes.length === 0) return;
          /**
           * Filters nodes which are hidden to prevent
           * focus leak outside modal
           */

          focusableNodes = focusableNodes.filter(function (node) {
            return node.offsetParent !== null;
          }); // if disableFocus is true

          if (!this.modal.contains(document.activeElement)) {
            focusableNodes[0].focus();
          } else {
            var focusedItemIndex = focusableNodes.indexOf(document.activeElement);

            if (event.shiftKey && focusedItemIndex === 0) {
              focusableNodes[focusableNodes.length - 1].focus();
              event.preventDefault();
            }

            if (!event.shiftKey && focusableNodes.length > 0 && focusedItemIndex === focusableNodes.length - 1) {
              focusableNodes[0].focus();
              event.preventDefault();
            }
          }
        }
      }]);

      return Modal;
    }();
    /**
     * Modal prototype ends.
     * Here on code is responsible for detecting and
     * auto binding event handlers on modal triggers
     */
    // Keep a reference to the opened modal


    var activeModal = null;
    /**
     * Generates an associative array of modals and it's
     * respective triggers
     * @param  {array} triggers     An array of all triggers
     * @param  {string} triggerAttr The data-attribute which triggers the module
     * @return {array}
     */

    var generateTriggerMap = function generateTriggerMap(triggers, triggerAttr) {
      var triggerMap = [];
      triggers.forEach(function (trigger) {
        var targetModal = trigger.attributes[triggerAttr].value;
        if (triggerMap[targetModal] === undefined) triggerMap[targetModal] = [];
        triggerMap[targetModal].push(trigger);
      });
      return triggerMap;
    };
    /**
     * Validates whether a modal of the given id exists
     * in the DOM
     * @param  {number} id  The id of the modal
     * @return {boolean}
     */


    var validateModalPresence = function validateModalPresence(id) {
      if (!document.getElementById(id)) {
        console.warn("MicroModal: \u2757Seems like you have missed %c'".concat(id, "'"), 'background-color: #f8f9fa;color: #50596c;font-weight: bold;', 'ID somewhere in your code. Refer example below to resolve it.');
        console.warn("%cExample:", 'background-color: #f8f9fa;color: #50596c;font-weight: bold;', "<div class=\"modal\" id=\"".concat(id, "\"></div>"));
        return false;
      }
    };
    /**
     * Validates if there are modal triggers present
     * in the DOM
     * @param  {array} triggers An array of data-triggers
     * @return {boolean}
     */


    var validateTriggerPresence = function validateTriggerPresence(triggers) {
      if (triggers.length <= 0) {
        console.warn("MicroModal: \u2757Please specify at least one %c'micromodal-trigger'", 'background-color: #f8f9fa;color: #50596c;font-weight: bold;', 'data attribute.');
        console.warn("%cExample:", 'background-color: #f8f9fa;color: #50596c;font-weight: bold;', "<a href=\"#\" data-micromodal-trigger=\"my-modal\"></a>");
        return false;
      }
    };
    /**
     * Checks if triggers and their corresponding modals
     * are present in the DOM
     * @param  {array} triggers   Array of DOM nodes which have data-triggers
     * @param  {array} triggerMap Associative array of modals and their triggers
     * @return {boolean}
     */


    var validateArgs = function validateArgs(triggers, triggerMap) {
      validateTriggerPresence(triggers);
      if (!triggerMap) return true;

      for (var id in triggerMap) {
        validateModalPresence(id);
      }

      return true;
    };
    /**
     * Binds click handlers to all modal triggers
     * @param  {object} config [description]
     * @return void
     */


    var init = function init(config) {
      // Create an config object with default openTrigger
      var options = Object.assign({}, {
        openTrigger: 'data-micromodal-trigger'
      }, config); // Collects all the nodes with the trigger

      var triggers = _toConsumableArray(document.querySelectorAll("[".concat(options.openTrigger, "]"))); // Makes a mappings of modals with their trigger nodes


      var triggerMap = generateTriggerMap(triggers, options.openTrigger); // Checks if modals and triggers exist in dom

      if (options.debugMode === true && validateArgs(triggers, triggerMap) === false) return; // For every target modal creates a new instance

      for (var key in triggerMap) {
        var value = triggerMap[key];
        options.targetModal = key;
        options.triggers = _toConsumableArray(value);
        activeModal = new Modal(options); // eslint-disable-line no-new
      }
    };
    /**
     * Shows a particular modal
     * @param  {string} targetModal [The id of the modal to display]
     * @param  {object} config [The configuration object to pass]
     * @return {void}
     */


    var show = function show(targetModal, config) {
      var options = config || {};
      options.targetModal = targetModal; // Checks if modals and triggers exist in dom

      if (options.debugMode === true && validateModalPresence(targetModal) === false) return; // clear events in case previous modal wasn't close

      if (activeModal) activeModal.removeEventListeners(); // stores reference to active modal

      activeModal = new Modal(options); // eslint-disable-line no-new

      activeModal.showModal();
    };
    /**
     * Closes the active modal
     * @param  {string} targetModal [The id of the modal to close]
     * @return {void}
     */


    var close = function close(targetModal) {
      targetModal ? activeModal.closeModalById(targetModal) : activeModal.closeModal();
    };

    return {
      init: init,
      show: show,
      close: close
    };
  }();
  window.MicroModal = MicroModal;

  var js$1 = {exports: {}};

  var core = {exports: {}};

  var evEmitter = {exports: {}};

  /**
   * EvEmitter v2.1.1
   * Lil' event emitter
   * MIT License
   */

  (function (module) {
  ( function( global, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS - Browserify, Webpack
      module.exports = factory();
    } else {
      // Browser globals
      global.EvEmitter = factory();
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal, function() {

  function EvEmitter() {}

  let proto = EvEmitter.prototype;

  proto.on = function( eventName, listener ) {
    if ( !eventName || !listener ) return this;

    // set events hash
    let events = this._events = this._events || {};
    // set listeners array
    let listeners = events[ eventName ] = events[ eventName ] || [];
    // only add once
    if ( !listeners.includes( listener ) ) {
      listeners.push( listener );
    }

    return this;
  };

  proto.once = function( eventName, listener ) {
    if ( !eventName || !listener ) return this;

    // add event
    this.on( eventName, listener );
    // set once flag
    // set onceEvents hash
    let onceEvents = this._onceEvents = this._onceEvents || {};
    // set onceListeners object
    let onceListeners = onceEvents[ eventName ] = onceEvents[ eventName ] || {};
    // set flag
    onceListeners[ listener ] = true;

    return this;
  };

  proto.off = function( eventName, listener ) {
    let listeners = this._events && this._events[ eventName ];
    if ( !listeners || !listeners.length ) return this;

    let index = listeners.indexOf( listener );
    if ( index != -1 ) {
      listeners.splice( index, 1 );
    }

    return this;
  };

  proto.emitEvent = function( eventName, args ) {
    let listeners = this._events && this._events[ eventName ];
    if ( !listeners || !listeners.length ) return this;

    // copy over to avoid interference if .off() in listener
    listeners = listeners.slice( 0 );
    args = args || [];
    // once stuff
    let onceListeners = this._onceEvents && this._onceEvents[ eventName ];

    for ( let listener of listeners ) {
      let isOnce = onceListeners && onceListeners[ listener ];
      if ( isOnce ) {
        // remove listener
        // remove before trigger to prevent recursion
        this.off( eventName, listener );
        // unset once flag
        delete onceListeners[ listener ];
      }
      // trigger listener
      listener.apply( this, args );
    }

    return this;
  };

  proto.allOff = function() {
    delete this._events;
    delete this._onceEvents;
    return this;
  };

  return EvEmitter;

  } ) );
  }(evEmitter));

  var getSize = {exports: {}};

  /*!
   * Infinite Scroll v2.0.4
   * measure size of elements
   * MIT license
   */

  (function (module) {
  ( function( window, factory ) {
    if ( module.exports ) {
      // CommonJS
      module.exports = factory();
    } else {
      // browser global
      window.getSize = factory();
    }

  } )( window, function factory() {

  // -------------------------- helpers -------------------------- //

  // get a number from a string, not a percentage
  function getStyleSize( value ) {
    let num = parseFloat( value );
    // not a percent like '100%', and a number
    let isValid = value.indexOf('%') == -1 && !isNaN( num );
    return isValid && num;
  }

  // -------------------------- measurements -------------------------- //

  let measurements = [
    'paddingLeft',
    'paddingRight',
    'paddingTop',
    'paddingBottom',
    'marginLeft',
    'marginRight',
    'marginTop',
    'marginBottom',
    'borderLeftWidth',
    'borderRightWidth',
    'borderTopWidth',
    'borderBottomWidth',
  ];

  function getZeroSize() {
    let size = {
      width: 0,
      height: 0,
      innerWidth: 0,
      innerHeight: 0,
      outerWidth: 0,
      outerHeight: 0,
    };
    measurements.forEach( ( measurement ) => {
      size[ measurement ] = 0;
    } );
    return size;
  }

  // -------------------------- getSize -------------------------- //

  function getSize( elem ) {
    // use querySeletor if elem is string
    if ( typeof elem == 'string' ) elem = document.querySelector( elem );

    // do not proceed on non-objects
    let isElement = elem && typeof elem == 'object' && elem.nodeType;
    if ( !isElement ) return;

    let style = getComputedStyle( elem );

    // if hidden, everything is 0
    if ( style.display == 'none' ) return getZeroSize();

    let size = {};
    size.width = elem.offsetWidth;
    size.height = elem.offsetHeight;

    let isBorderBox = size.isBorderBox = style.boxSizing == 'border-box';

    // get all measurements
    measurements.forEach( ( measurement ) => {
      let value = style[ measurement ];
      let num = parseFloat( value );
      // any 'auto', 'medium' value will be 0
      size[ measurement ] = !isNaN( num ) ? num : 0;
    } );

    let paddingWidth = size.paddingLeft + size.paddingRight;
    let paddingHeight = size.paddingTop + size.paddingBottom;
    let marginWidth = size.marginLeft + size.marginRight;
    let marginHeight = size.marginTop + size.marginBottom;
    let borderWidth = size.borderLeftWidth + size.borderRightWidth;
    let borderHeight = size.borderTopWidth + size.borderBottomWidth;

    // overwrite width and height if we can get it from style
    let styleWidth = getStyleSize( style.width );
    if ( styleWidth !== false ) {
      size.width = styleWidth +
        // add padding and border unless it's already including it
        ( isBorderBox ? 0 : paddingWidth + borderWidth );
    }

    let styleHeight = getStyleSize( style.height );
    if ( styleHeight !== false ) {
      size.height = styleHeight +
        // add padding and border unless it's already including it
        ( isBorderBox ? 0 : paddingHeight + borderHeight );
    }

    size.innerWidth = size.width - ( paddingWidth + borderWidth );
    size.innerHeight = size.height - ( paddingHeight + borderHeight );

    size.outerWidth = size.width + marginWidth;
    size.outerHeight = size.height + marginHeight;

    return size;
  }

  return getSize;

  } );
  }(getSize));

  var utils = {exports: {}};

  /**
   * Fizzy UI utils v3.0.0
   * MIT license
   */

  (function (module) {
  ( function( global, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory( global );
    } else {
      // browser global
      global.fizzyUIUtils = factory( global );
    }

  }( commonjsGlobal, function factory( global ) {

  let utils = {};

  // ----- extend ----- //

  // extends objects
  utils.extend = function( a, b ) {
    return Object.assign( a, b );
  };

  // ----- modulo ----- //

  utils.modulo = function( num, div ) {
    return ( ( num % div ) + div ) % div;
  };

  // ----- makeArray ----- //

  // turn element or nodeList into an array
  utils.makeArray = function( obj ) {
    // use object if already an array
    if ( Array.isArray( obj ) ) return obj;

    // return empty array if undefined or null. #6
    if ( obj === null || obj === undefined ) return [];

    let isArrayLike = typeof obj == 'object' && typeof obj.length == 'number';
    // convert nodeList to array
    if ( isArrayLike ) return [ ...obj ];

    // array of single index
    return [ obj ];
  };

  // ----- removeFrom ----- //

  utils.removeFrom = function( ary, obj ) {
    let index = ary.indexOf( obj );
    if ( index != -1 ) {
      ary.splice( index, 1 );
    }
  };

  // ----- getParent ----- //

  utils.getParent = function( elem, selector ) {
    while ( elem.parentNode && elem != document.body ) {
      elem = elem.parentNode;
      if ( elem.matches( selector ) ) return elem;
    }
  };

  // ----- getQueryElement ----- //

  // use element as selector string
  utils.getQueryElement = function( elem ) {
    if ( typeof elem == 'string' ) {
      return document.querySelector( elem );
    }
    return elem;
  };

  // ----- handleEvent ----- //

  // enable .ontype to trigger from .addEventListener( elem, 'type' )
  utils.handleEvent = function( event ) {
    let method = 'on' + event.type;
    if ( this[ method ] ) {
      this[ method ]( event );
    }
  };

  // ----- filterFindElements ----- //

  utils.filterFindElements = function( elems, selector ) {
    // make array of elems
    elems = utils.makeArray( elems );

    return elems
      // check that elem is an actual element
      .filter( ( elem ) => elem instanceof HTMLElement )
      .reduce( ( ffElems, elem ) => {
        // add elem if no selector
        if ( !selector ) {
          ffElems.push( elem );
          return ffElems;
        }
        // filter & find items if we have a selector
        // filter
        if ( elem.matches( selector ) ) {
          ffElems.push( elem );
        }
        // find children
        let childElems = elem.querySelectorAll( selector );
        // concat childElems to filterFound array
        ffElems = ffElems.concat( ...childElems );
        return ffElems;
      }, [] );
  };

  // ----- debounceMethod ----- //

  utils.debounceMethod = function( _class, methodName, threshold ) {
    threshold = threshold || 100;
    // original method
    let method = _class.prototype[ methodName ];
    let timeoutName = methodName + 'Timeout';

    _class.prototype[ methodName ] = function() {
      clearTimeout( this[ timeoutName ] );

      let args = arguments;
      this[ timeoutName ] = setTimeout( () => {
        method.apply( this, args );
        delete this[ timeoutName ];
      }, threshold );
    };
  };

  // ----- docReady ----- //

  utils.docReady = function( onDocReady ) {
    let readyState = document.readyState;
    if ( readyState == 'complete' || readyState == 'interactive' ) {
      // do async to allow for other scripts to run. metafizzy/flickity#441
      setTimeout( onDocReady );
    } else {
      document.addEventListener( 'DOMContentLoaded', onDocReady );
    }
  };

  // ----- htmlInit ----- //

  // http://bit.ly/3oYLusc
  utils.toDashed = function( str ) {
    return str.replace( /(.)([A-Z])/g, function( match, $1, $2 ) {
      return $1 + '-' + $2;
    } ).toLowerCase();
  };

  let console = global.console;

  // allow user to initialize classes via [data-namespace] or .js-namespace class
  // htmlInit( Widget, 'widgetName' )
  // options are parsed from data-namespace-options
  utils.htmlInit = function( WidgetClass, namespace ) {
    utils.docReady( function() {
      let dashedNamespace = utils.toDashed( namespace );
      let dataAttr = 'data-' + dashedNamespace;
      let dataAttrElems = document.querySelectorAll( `[${dataAttr}]` );
      let jQuery = global.jQuery;

      [ ...dataAttrElems ].forEach( ( elem ) => {
        let attr = elem.getAttribute( dataAttr );
        let options;
        try {
          options = attr && JSON.parse( attr );
        } catch ( error ) {
          // log error, do not initialize
          if ( console ) {
            console.error( `Error parsing ${dataAttr} on ${elem.className}: ${error}` );
          }
          return;
        }
        // initialize
        let instance = new WidgetClass( elem, options );
        // make available via $().data('namespace')
        if ( jQuery ) {
          jQuery.data( elem, namespace, instance );
        }
      } );

    } );
  };

  // -----  ----- //

  return utils;

  } ) );
  }(utils));

  var cell = {exports: {}};

  (function (module) {
  // Flickity.Cell
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory( getSize.exports );
    } else {
      // browser global
      window.Flickity = window.Flickity || {};
      window.Flickity.Cell = factory( window.getSize );
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal, function factory( getSize ) {

  const cellClassName = 'flickity-cell';

  function Cell( elem ) {
    this.element = elem;
    this.element.classList.add( cellClassName );

    this.x = 0;
    this.unselect();
  }

  let proto = Cell.prototype;

  proto.destroy = function() {
    // reset style
    this.unselect();
    this.element.classList.remove( cellClassName );
    this.element.style.transform = '';
    this.element.removeAttribute('aria-hidden');
  };

  proto.getSize = function() {
    this.size = getSize( this.element );
  };

  proto.select = function() {
    this.element.classList.add('is-selected');
    this.element.removeAttribute('aria-hidden');
  };

  proto.unselect = function() {
    this.element.classList.remove('is-selected');
    this.element.setAttribute( 'aria-hidden', 'true' );
  };

  proto.remove = function() {
    this.element.remove();
  };

  return Cell;

  } ) );
  }(cell));

  var slide = {exports: {}};

  (function (module) {
  // slide
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory();
    } else {
      // browser global
      window.Flickity = window.Flickity || {};
      window.Flickity.Slide = factory();
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal, function factory() {

  function Slide( beginMargin, endMargin, cellAlign ) {
    this.beginMargin = beginMargin;
    this.endMargin = endMargin;
    this.cellAlign = cellAlign;
    this.cells = [];
    this.outerWidth = 0;
    this.height = 0;
  }

  let proto = Slide.prototype;

  proto.addCell = function( cell ) {
    this.cells.push( cell );
    this.outerWidth += cell.size.outerWidth;
    this.height = Math.max( cell.size.outerHeight, this.height );
    // first cell stuff
    if ( this.cells.length === 1 ) {
      this.x = cell.x; // x comes from first cell
      this.firstMargin = cell.size[ this.beginMargin ];
    }
  };

  proto.updateTarget = function() {
    let lastCell = this.getLastCell();
    let lastMargin = lastCell ? lastCell.size[ this.endMargin ] : 0;
    let slideWidth = this.outerWidth - ( this.firstMargin + lastMargin );
    this.target = this.x + this.firstMargin + slideWidth * this.cellAlign;
  };

  proto.getLastCell = function() {
    return this.cells[ this.cells.length - 1 ];
  };

  proto.select = function() {
    this.cells.forEach( ( cell ) => cell.select() );
  };

  proto.unselect = function() {
    this.cells.forEach( ( cell ) => cell.unselect() );
  };

  proto.getCellElements = function() {
    return this.cells.map( ( cell ) => cell.element );
  };

  return Slide;

  } ) );
  }(slide));

  var animate = {exports: {}};

  (function (module) {
  // animate
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory( utils.exports );
    } else {
      // browser global
      window.Flickity = window.Flickity || {};
      window.Flickity.animatePrototype = factory( window.fizzyUIUtils );
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal, function factory( utils ) {

  // -------------------------- animate -------------------------- //

  let proto = {};

  proto.startAnimation = function() {
    if ( this.isAnimating ) return;

    this.isAnimating = true;
    this.restingFrames = 0;
    this.animate();
  };

  proto.animate = function() {
    this.applyDragForce();
    this.applySelectedAttraction();

    let previousX = this.x;

    this.integratePhysics();
    this.positionSlider();
    this.settle( previousX );
    // animate next frame
    if ( this.isAnimating ) requestAnimationFrame( () => this.animate() );
  };

  proto.positionSlider = function() {
    let x = this.x;
    // wrap position around
    if ( this.isWrapping ) {
      x = utils.modulo( x, this.slideableWidth ) - this.slideableWidth;
      this.shiftWrapCells( x );
    }

    this.setTranslateX( x, this.isAnimating );
    this.dispatchScrollEvent();
  };

  proto.setTranslateX = function( x, is3d ) {
    x += this.cursorPosition;
    // reverse if right-to-left and using transform
    if ( this.options.rightToLeft ) x = -x;
    let translateX = this.getPositionValue( x );
    // use 3D transforms for hardware acceleration on iOS
    // but use 2D when settled, for better font-rendering
    this.slider.style.transform = is3d ?
      `translate3d(${translateX},0,0)` : `translateX(${translateX})`;
  };

  proto.dispatchScrollEvent = function() {
    let firstSlide = this.slides[0];
    if ( !firstSlide ) return;

    let positionX = -this.x - firstSlide.target;
    let progress = positionX / this.slidesWidth;
    this.dispatchEvent( 'scroll', null, [ progress, positionX ] );
  };

  proto.positionSliderAtSelected = function() {
    if ( !this.cells.length ) return;

    this.x = -this.selectedSlide.target;
    this.velocity = 0; // stop wobble
    this.positionSlider();
  };

  proto.getPositionValue = function( position ) {
    if ( this.options.percentPosition ) {
      // percent position, round to 2 digits, like 12.34%
      return ( Math.round( ( position / this.size.innerWidth ) * 10000 ) * 0.01 ) + '%';
    } else {
      // pixel positioning
      return Math.round( position ) + 'px';
    }
  };

  proto.settle = function( previousX ) {
    // keep track of frames where x hasn't moved
    let isResting = !this.isPointerDown &&
        Math.round( this.x * 100 ) === Math.round( previousX * 100 );
    if ( isResting ) this.restingFrames++;
    // stop animating if resting for 3 or more frames
    if ( this.restingFrames > 2 ) {
      this.isAnimating = false;
      delete this.isFreeScrolling;
      // render position with translateX when settled
      this.positionSlider();
      this.dispatchEvent( 'settle', null, [ this.selectedIndex ] );
    }
  };

  proto.shiftWrapCells = function( x ) {
    // shift before cells
    let beforeGap = this.cursorPosition + x;
    this._shiftCells( this.beforeShiftCells, beforeGap, -1 );
    // shift after cells
    let afterGap = this.size.innerWidth - ( x + this.slideableWidth + this.cursorPosition );
    this._shiftCells( this.afterShiftCells, afterGap, 1 );
  };

  proto._shiftCells = function( cells, gap, shift ) {
    cells.forEach( ( cell ) => {
      let cellShift = gap > 0 ? shift : 0;
      this._wrapShiftCell( cell, cellShift );
      gap -= cell.size.outerWidth;
    } );
  };

  proto._unshiftCells = function( cells ) {
    if ( !cells || !cells.length ) return;

    cells.forEach( ( cell ) => this._wrapShiftCell( cell, 0 ) );
  };

  // @param {Integer} shift - 0, 1, or -1
  proto._wrapShiftCell = function( cell, shift ) {
    this._renderCellPosition( cell, cell.x + this.slideableWidth * shift );
  };

  // -------------------------- physics -------------------------- //

  proto.integratePhysics = function() {
    this.x += this.velocity;
    this.velocity *= this.getFrictionFactor();
  };

  proto.applyForce = function( force ) {
    this.velocity += force;
  };

  proto.getFrictionFactor = function() {
    return 1 - this.options[ this.isFreeScrolling ? 'freeScrollFriction' : 'friction' ];
  };

  proto.getRestingPosition = function() {
    // my thanks to Steven Wittens, who simplified this math greatly
    return this.x + this.velocity / ( 1 - this.getFrictionFactor() );
  };

  proto.applyDragForce = function() {
    if ( !this.isDraggable || !this.isPointerDown ) return;

    // change the position to drag position by applying force
    let dragVelocity = this.dragX - this.x;
    let dragForce = dragVelocity - this.velocity;
    this.applyForce( dragForce );
  };

  proto.applySelectedAttraction = function() {
    // do not attract if pointer down or no slides
    let dragDown = this.isDraggable && this.isPointerDown;
    if ( dragDown || this.isFreeScrolling || !this.slides.length ) return;

    let distance = this.selectedSlide.target * -1 - this.x;
    let force = distance * this.options.selectedAttraction;
    this.applyForce( force );
  };

  return proto;

  } ) );
  }(animate));

  (function (module) {
  // Flickity main
  /* eslint-disable max-params */
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          evEmitter.exports,
          getSize.exports,
          utils.exports,
          cell.exports,
          slide.exports,
          animate.exports,
      );
    } else {
      // browser global
      let _Flickity = window.Flickity;

      window.Flickity = factory(
          window,
          window.EvEmitter,
          window.getSize,
          window.fizzyUIUtils,
          _Flickity.Cell,
          _Flickity.Slide,
          _Flickity.animatePrototype,
      );
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal,
      function factory( window, EvEmitter, getSize, utils, Cell, Slide, animatePrototype ) {
  /* eslint-enable max-params */

  // vars
  const { getComputedStyle, console } = window;
  let { jQuery } = window;

  // -------------------------- Flickity -------------------------- //

  // globally unique identifiers
  let GUID = 0;
  // internal store of all Flickity intances
  let instances = {};

  function Flickity( element, options ) {
    let queryElement = utils.getQueryElement( element );
    if ( !queryElement ) {
      if ( console ) console.error(`Bad element for Flickity: ${queryElement || element}`);
      return;
    }
    this.element = queryElement;
    // do not initialize twice on same element
    if ( this.element.flickityGUID ) {
      let instance = instances[ this.element.flickityGUID ];
      if ( instance ) instance.option( options );
      return instance;
    }

    // add jQuery
    if ( jQuery ) {
      this.$element = jQuery( this.element );
    }
    // options
    this.options = { ...this.constructor.defaults };
    this.option( options );

    // kick things off
    this._create();
  }

  Flickity.defaults = {
    accessibility: true,
    // adaptiveHeight: false,
    cellAlign: 'center',
    // cellSelector: undefined,
    // contain: false,
    freeScrollFriction: 0.075, // friction when free-scrolling
    friction: 0.28, // friction when selecting
    namespaceJQueryEvents: true,
    // initialIndex: 0,
    percentPosition: true,
    resize: true,
    selectedAttraction: 0.025,
    setGallerySize: true,
    // watchCSS: false,
    // wrapAround: false
  };

  // hash of methods triggered on _create()
  Flickity.create = {};

  let proto = Flickity.prototype;
  // inherit EventEmitter
  Object.assign( proto, EvEmitter.prototype );

  proto._create = function() {
    let { resize, watchCSS, rightToLeft } = this.options;
    // add id for Flickity.data
    let id = this.guid = ++GUID;
    this.element.flickityGUID = id; // expando
    instances[ id ] = this; // associate via id
    // initial properties
    this.selectedIndex = 0;
    // how many frames slider has been in same position
    this.restingFrames = 0;
    // initial physics properties
    this.x = 0;
    this.velocity = 0;
    this.beginMargin = rightToLeft ? 'marginRight' : 'marginLeft';
    this.endMargin = rightToLeft ? 'marginLeft' : 'marginRight';
    // create viewport & slider
    this.viewport = document.createElement('div');
    this.viewport.className = 'flickity-viewport';
    this._createSlider();
    // used for keyboard navigation
    this.focusableElems = [ this.element ];

    if ( resize || watchCSS ) {
      window.addEventListener( 'resize', this );
    }

    // add listeners from on option
    for ( let eventName in this.options.on ) {
      let listener = this.options.on[ eventName ];
      this.on( eventName, listener );
    }

    for ( let method in Flickity.create ) {
      Flickity.create[ method ].call( this );
    }

    if ( watchCSS ) {
      this.watchCSS();
    } else {
      this.activate();
    }
  };

  /**
   * set options
   * @param {Object} opts - options to extend
   */
  proto.option = function( opts ) {
    Object.assign( this.options, opts );
  };

  proto.activate = function() {
    if ( this.isActive ) return;

    this.isActive = true;
    this.element.classList.add('flickity-enabled');
    if ( this.options.rightToLeft ) {
      this.element.classList.add('flickity-rtl');
    }

    this.getSize();
    // move initial cell elements so they can be loaded as cells
    let cellElems = this._filterFindCellElements( this.element.children );
    this.slider.append( ...cellElems );
    this.viewport.append( this.slider );
    this.element.append( this.viewport );
    // get cells from children
    this.reloadCells();

    if ( this.options.accessibility ) {
      // allow element to focusable
      this.element.tabIndex = 0;
      // listen for key presses
      this.element.addEventListener( 'keydown', this );
    }

    this.emitEvent('activate');
    this.selectInitialIndex();
    // flag for initial activation, for using initialIndex
    this.isInitActivated = true;
    // ready event. #493
    this.dispatchEvent('ready');
  };

  // slider positions the cells
  proto._createSlider = function() {
    // slider element does all the positioning
    let slider = document.createElement('div');
    slider.className = 'flickity-slider';
    this.slider = slider;
  };

  proto._filterFindCellElements = function( elems ) {
    return utils.filterFindElements( elems, this.options.cellSelector );
  };

  // goes through all children
  proto.reloadCells = function() {
    // collection of item elements
    this.cells = this._makeCells( this.slider.children );
    this.positionCells();
    this._updateWrapShiftCells();
    this.setGallerySize();
  };

  /**
   * turn elements into Flickity.Cells
   * @param {[Array, NodeList, HTMLElement]} elems - elements to make into cells
   * @returns {Array} items - collection of new Flickity Cells
   */
  proto._makeCells = function( elems ) {
    let cellElems = this._filterFindCellElements( elems );

    // create new Cells for collection
    return cellElems.map( ( cellElem ) => new Cell( cellElem ) );
  };

  proto.getLastCell = function() {
    return this.cells[ this.cells.length - 1 ];
  };

  proto.getLastSlide = function() {
    return this.slides[ this.slides.length - 1 ];
  };

  // positions all cells
  proto.positionCells = function() {
    // size all cells
    this._sizeCells( this.cells );
    // position all cells
    this._positionCells( 0 );
  };

  /**
   * position certain cells
   * @param {Integer} index - which cell to start with
   */
  proto._positionCells = function( index ) {
    index = index || 0;
    // also measure maxCellHeight
    // start 0 if positioning all cells
    this.maxCellHeight = index ? this.maxCellHeight || 0 : 0;
    let cellX = 0;
    // get cellX
    if ( index > 0 ) {
      let startCell = this.cells[ index - 1 ];
      cellX = startCell.x + startCell.size.outerWidth;
    }

    this.cells.slice( index ).forEach( ( cell ) => {
      cell.x = cellX;
      this._renderCellPosition( cell, cellX );
      cellX += cell.size.outerWidth;
      this.maxCellHeight = Math.max( cell.size.outerHeight, this.maxCellHeight );
    } );
    // keep track of cellX for wrap-around
    this.slideableWidth = cellX;
    // slides
    this.updateSlides();
    // contain slides target
    this._containSlides();
    // update slidesWidth
    this.slidesWidth = this.cells.length ?
      this.getLastSlide().target - this.slides[0].target : 0;
  };

  proto._renderCellPosition = function( cell, x ) {
    // render position of cell with in slider
    let sideOffset = this.options.rightToLeft ? -1 : 1;
    let renderX = x * sideOffset;
    if ( this.options.percentPosition ) renderX *= this.size.innerWidth / cell.size.width;
    let positionValue = this.getPositionValue( renderX );
    cell.element.style.transform = `translateX( ${positionValue} )`;
  };

  /**
   * cell.getSize() on multiple cells
   * @param {Array} cells - cells to size
   */
  proto._sizeCells = function( cells ) {
    cells.forEach( ( cell ) => cell.getSize() );
  };

  // --------------------------  -------------------------- //

  proto.updateSlides = function() {
    this.slides = [];
    if ( !this.cells.length ) return;

    let { beginMargin, endMargin } = this;
    let slide = new Slide( beginMargin, endMargin, this.cellAlign );
    this.slides.push( slide );

    let canCellFit = this._getCanCellFit();

    this.cells.forEach( ( cell, i ) => {
      // just add cell if first cell in slide
      if ( !slide.cells.length ) {
        slide.addCell( cell );
        return;
      }

      let slideWidth = ( slide.outerWidth - slide.firstMargin ) +
        ( cell.size.outerWidth - cell.size[ endMargin ] );

      if ( canCellFit( i, slideWidth ) ) {
        slide.addCell( cell );
      } else {
        // doesn't fit, new slide
        slide.updateTarget();

        slide = new Slide( beginMargin, endMargin, this.cellAlign );
        this.slides.push( slide );
        slide.addCell( cell );
      }
    } );
    // last slide
    slide.updateTarget();
    // update .selectedSlide
    this.updateSelectedSlide();
  };

  proto._getCanCellFit = function() {
    let { groupCells } = this.options;
    if ( !groupCells ) return () => false;

    if ( typeof groupCells == 'number' ) {
      // group by number. 3 -> [0,1,2], [3,4,5], ...
      let number = parseInt( groupCells, 10 );
      return ( i ) => ( i % number ) !== 0;
    }
    // default, group by width of slide
    let percent = 1;
    // parse '75%
    let percentMatch = typeof groupCells == 'string' && groupCells.match( /^(\d+)%$/ );
    if ( percentMatch ) percent = parseInt( percentMatch[1], 10 ) / 100;
    let groupWidth = ( this.size.innerWidth + 1 ) * percent;
    return ( i, slideWidth ) => slideWidth <= groupWidth;
  };

  // alias _init for jQuery plugin .flickity()
  proto._init =
  proto.reposition = function() {
    this.positionCells();
    this.positionSliderAtSelected();
  };

  proto.getSize = function() {
    this.size = getSize( this.element );
    this.setCellAlign();
    this.cursorPosition = this.size.innerWidth * this.cellAlign;
  };

  let cellAlignShorthands = {
    left: 0,
    center: 0.5,
    right: 1,
  };

  proto.setCellAlign = function() {
    let { cellAlign, rightToLeft } = this.options;
    let shorthand = cellAlignShorthands[ cellAlign ];
    this.cellAlign = shorthand !== undefined ? shorthand : cellAlign;
    if ( rightToLeft ) this.cellAlign = 1 - this.cellAlign;
  };

  proto.setGallerySize = function() {
    if ( !this.options.setGallerySize ) return;

    let height = this.options.adaptiveHeight && this.selectedSlide ?
      this.selectedSlide.height : this.maxCellHeight;
    this.viewport.style.height = `${height}px`;
  };

  proto._updateWrapShiftCells = function() {
    // update isWrapping
    this.isWrapping = this.getIsWrapping();
    // only for wrap-around
    if ( !this.isWrapping ) return;

    // unshift previous cells
    this._unshiftCells( this.beforeShiftCells );
    this._unshiftCells( this.afterShiftCells );
    // get before cells
    // initial gap
    let beforeGapX = this.cursorPosition;
    let lastIndex = this.cells.length - 1;
    this.beforeShiftCells = this._getGapCells( beforeGapX, lastIndex, -1 );
    // get after cells
    // ending gap between last cell and end of gallery viewport
    let afterGapX = this.size.innerWidth - this.cursorPosition;
    // start cloning at first cell, working forwards
    this.afterShiftCells = this._getGapCells( afterGapX, 0, 1 );
  };

  proto.getIsWrapping = function() {
    let { wrapAround } = this.options;
    if ( !wrapAround || this.slides.length < 2 ) return false;

    if ( wrapAround !== 'fill' ) return true;
    // check that slides can fit

    let gapWidth = this.slideableWidth - this.size.innerWidth;
    if ( gapWidth > this.size.innerWidth ) return true; // gap * 2x big, all good
    // check that content width - shifting cell is bigger than viewport width
    for ( let cell of this.cells ) {
      if ( cell.size.outerWidth > gapWidth ) return false;
    }
    return true;
  };

  proto._getGapCells = function( gapX, cellIndex, increment ) {
    // keep adding cells until the cover the initial gap
    let cells = [];
    while ( gapX > 0 ) {
      let cell = this.cells[ cellIndex ];
      if ( !cell ) break;

      cells.push( cell );
      cellIndex += increment;
      gapX -= cell.size.outerWidth;
    }
    return cells;
  };

  // ----- contain & wrap ----- //

  // contain cell targets so no excess sliding
  proto._containSlides = function() {
    let isContaining = this.options.contain && !this.isWrapping &&
        this.cells.length;
    if ( !isContaining ) return;

    let contentWidth = this.slideableWidth - this.getLastCell().size[ this.endMargin ];
    // content is less than gallery size
    let isContentSmaller = contentWidth < this.size.innerWidth;
    if ( isContentSmaller ) {
      // all cells fit inside gallery
      this.slides.forEach( ( slide ) => {
        slide.target = contentWidth * this.cellAlign;
      } );
    } else {
      // contain to bounds
      let beginBound = this.cursorPosition + this.cells[0].size[ this.beginMargin ];
      let endBound = contentWidth - this.size.innerWidth * ( 1 - this.cellAlign );
      this.slides.forEach( ( slide ) => {
        slide.target = Math.max( slide.target, beginBound );
        slide.target = Math.min( slide.target, endBound );
      } );
    }
  };

  // ----- events ----- //

  /**
   * emits events via eventEmitter and jQuery events
   * @param {String} type - name of event
   * @param {Event} event - original event
   * @param {Array} args - extra arguments
   */
  proto.dispatchEvent = function( type, event, args ) {
    let emitArgs = event ? [ event ].concat( args ) : args;
    this.emitEvent( type, emitArgs );

    if ( jQuery && this.$element ) {
      // default trigger with type if no event
      type += this.options.namespaceJQueryEvents ? '.flickity' : '';
      let $event = type;
      if ( event ) {
        // create jQuery event
        let jQEvent = new jQuery.Event( event );
        jQEvent.type = type;
        $event = jQEvent;
      }
      this.$element.trigger( $event, args );
    }
  };

  const unidraggerEvents = [
    'dragStart',
    'dragMove',
    'dragEnd',
    'pointerDown',
    'pointerMove',
    'pointerEnd',
    'staticClick',
  ];

  let _emitEvent = proto.emitEvent;
  proto.emitEvent = function( eventName, args ) {
    if ( eventName === 'staticClick' ) {
      // add cellElem and cellIndex args to staticClick
      let clickedCell = this.getParentCell( args[0].target );
      let cellElem = clickedCell && clickedCell.element;
      let cellIndex = clickedCell && this.cells.indexOf( clickedCell );
      args = args.concat( cellElem, cellIndex );
    }
    // do regular thing
    _emitEvent.call( this, eventName, args );
    // duck-punch in jQuery events for Unidragger events
    let isUnidraggerEvent = unidraggerEvents.includes( eventName );
    if ( !isUnidraggerEvent || !jQuery || !this.$element ) return;

    eventName += this.options.namespaceJQueryEvents ? '.flickity' : '';
    let event = args.shift( 0 );
    let jQEvent = new jQuery.Event( event );
    jQEvent.type = eventName;
    this.$element.trigger( jQEvent, args );
  };

  // -------------------------- select -------------------------- //

  /**
   * @param {Integer} index - index of the slide
   * @param {Boolean} isWrap - will wrap-around to last/first if at the end
   * @param {Boolean} isInstant - will immediately set position at selected cell
   */
  proto.select = function( index, isWrap, isInstant ) {
    if ( !this.isActive ) return;

    index = parseInt( index, 10 );
    this._wrapSelect( index );

    if ( this.isWrapping || isWrap ) {
      index = utils.modulo( index, this.slides.length );
    }
    // bail if invalid index
    if ( !this.slides[ index ] ) return;

    let prevIndex = this.selectedIndex;
    this.selectedIndex = index;
    this.updateSelectedSlide();
    if ( isInstant ) {
      this.positionSliderAtSelected();
    } else {
      this.startAnimation();
    }
    if ( this.options.adaptiveHeight ) {
      this.setGallerySize();
    }
    // events
    this.dispatchEvent( 'select', null, [ index ] );
    // change event if new index
    if ( index !== prevIndex ) {
      this.dispatchEvent( 'change', null, [ index ] );
    }
  };

  // wraps position for wrapAround, to move to closest slide. #113
  proto._wrapSelect = function( index ) {
    if ( !this.isWrapping ) return;

    const { selectedIndex, slideableWidth, slides: { length } } = this;
    // shift index for wrap, do not wrap dragSelect
    if ( !this.isDragSelect ) {
      let wrapIndex = utils.modulo( index, length );
      // go to shortest
      let delta = Math.abs( wrapIndex - selectedIndex );
      let backWrapDelta = Math.abs( ( wrapIndex + length ) - selectedIndex );
      let forewardWrapDelta = Math.abs( ( wrapIndex - length ) - selectedIndex );
      if ( backWrapDelta < delta ) {
        index += length;
      } else if ( forewardWrapDelta < delta ) {
        index -= length;
      }
    }

    // wrap position so slider is within normal area
    if ( index < 0 ) {
      this.x -= slideableWidth;
    } else if ( index >= length ) {
      this.x += slideableWidth;
    }
  };

  proto.previous = function( isWrap, isInstant ) {
    this.select( this.selectedIndex - 1, isWrap, isInstant );
  };

  proto.next = function( isWrap, isInstant ) {
    this.select( this.selectedIndex + 1, isWrap, isInstant );
  };

  proto.updateSelectedSlide = function() {
    let slide = this.slides[ this.selectedIndex ];
    // selectedIndex could be outside of slides, if triggered before resize()
    if ( !slide ) return;

    // unselect previous selected slide
    this.unselectSelectedSlide();
    // update new selected slide
    this.selectedSlide = slide;
    slide.select();
    this.selectedCells = slide.cells;
    this.selectedElements = slide.getCellElements();
    // HACK: selectedCell & selectedElement is first cell in slide, backwards compatibility
    this.selectedCell = slide.cells[0];
    this.selectedElement = this.selectedElements[0];
  };

  proto.unselectSelectedSlide = function() {
    if ( this.selectedSlide ) this.selectedSlide.unselect();
  };

  proto.selectInitialIndex = function() {
    let initialIndex = this.options.initialIndex;
    // already activated, select previous selectedIndex
    if ( this.isInitActivated ) {
      this.select( this.selectedIndex, false, true );
      return;
    }
    // select with selector string
    if ( initialIndex && typeof initialIndex == 'string' ) {
      let cell = this.queryCell( initialIndex );
      if ( cell ) {
        this.selectCell( initialIndex, false, true );
        return;
      }
    }

    let index = 0;
    // select with number
    if ( initialIndex && this.slides[ initialIndex ] ) {
      index = initialIndex;
    }
    // select instantly
    this.select( index, false, true );
  };

  /**
   * select slide from number or cell element
   * @param {[Element, Number]} value - zero-based index or element to select
   * @param {Boolean} isWrap - enables wrapping around for extra index
   * @param {Boolean} isInstant - disables slide animation
   */
  proto.selectCell = function( value, isWrap, isInstant ) {
    // get cell
    let cell = this.queryCell( value );
    if ( !cell ) return;

    let index = this.getCellSlideIndex( cell );
    this.select( index, isWrap, isInstant );
  };

  proto.getCellSlideIndex = function( cell ) {
    // get index of slide that has cell
    let cellSlide = this.slides.find( ( slide ) => slide.cells.includes( cell ) );
    return this.slides.indexOf( cellSlide );
  };

  // -------------------------- get cells -------------------------- //

  /**
   * get Flickity.Cell, given an Element
   * @param {Element} elem - matching cell element
   * @returns {Flickity.Cell} cell - matching cell
   */
  proto.getCell = function( elem ) {
    // loop through cells to get the one that matches
    for ( let cell of this.cells ) {
      if ( cell.element === elem ) return cell;
    }
  };

  /**
   * get collection of Flickity.Cells, given Elements
   * @param {[Element, Array, NodeList]} elems - multiple elements
   * @returns {Array} cells - Flickity.Cells
   */
  proto.getCells = function( elems ) {
    elems = utils.makeArray( elems );
    return elems.map( ( elem ) => this.getCell( elem ) ).filter( Boolean );
  };

  /**
   * get cell elements
   * @returns {Array} cellElems
   */
  proto.getCellElements = function() {
    return this.cells.map( ( cell ) => cell.element );
  };

  /**
   * get parent cell from an element
   * @param {Element} elem - child element
   * @returns {Flickit.Cell} cell - parent cell
   */
  proto.getParentCell = function( elem ) {
    // first check if elem is cell
    let cell = this.getCell( elem );
    if ( cell ) return cell;

    // try to get parent cell elem
    let closest = elem.closest('.flickity-slider > *');
    return this.getCell( closest );
  };

  /**
   * get cells adjacent to a slide
   * @param {Integer} adjCount - number of adjacent slides
   * @param {Integer} index - index of slide to start
   * @returns {Array} cells - array of Flickity.Cells
   */
  proto.getAdjacentCellElements = function( adjCount, index ) {
    if ( !adjCount ) return this.selectedSlide.getCellElements();

    index = index === undefined ? this.selectedIndex : index;

    let len = this.slides.length;
    if ( 1 + ( adjCount * 2 ) >= len ) {
      return this.getCellElements(); // get all
    }

    let cellElems = [];
    for ( let i = index - adjCount; i <= index + adjCount; i++ ) {
      let slideIndex = this.isWrapping ? utils.modulo( i, len ) : i;
      let slide = this.slides[ slideIndex ];
      if ( slide ) {
        cellElems = cellElems.concat( slide.getCellElements() );
      }
    }
    return cellElems;
  };

  /**
   * select slide from number or cell element
   * @param {[Element, String, Number]} selector - element, selector string, or index
   * @returns {Flickity.Cell} - matching cell
   */
  proto.queryCell = function( selector ) {
    if ( typeof selector == 'number' ) {
      // use number as index
      return this.cells[ selector ];
    }
    // do not select invalid selectors from hash: #123, #/. #791
    let isSelectorString = typeof selector == 'string' && !selector.match( /^[#.]?[\d/]/ );
    if ( isSelectorString ) {
      // use string as selector, get element
      selector = this.element.querySelector( selector );
    }
    // get cell from element
    return this.getCell( selector );
  };

  // -------------------------- events -------------------------- //

  proto.uiChange = function() {
    this.emitEvent('uiChange');
  };

  // ----- resize ----- //

  proto.onresize = function() {
    this.watchCSS();
    this.resize();
  };

  utils.debounceMethod( Flickity, 'onresize', 150 );

  proto.resize = function() {
    // #1177 disable resize behavior when animating or dragging for iOS 15
    if ( !this.isActive || this.isAnimating || this.isDragging ) return;
    this.getSize();
    // wrap values
    if ( this.isWrapping ) {
      this.x = utils.modulo( this.x, this.slideableWidth );
    }
    this.positionCells();
    this._updateWrapShiftCells();
    this.setGallerySize();
    this.emitEvent('resize');
    // update selected index for group slides, instant
    // TODO: position can be lost between groups of various numbers
    let selectedElement = this.selectedElements && this.selectedElements[0];
    this.selectCell( selectedElement, false, true );
  };

  // watches the :after property, activates/deactivates
  proto.watchCSS = function() {
    if ( !this.options.watchCSS ) return;

    let afterContent = getComputedStyle( this.element, ':after' ).content;
    // activate if :after { content: 'flickity' }
    if ( afterContent.includes('flickity') ) {
      this.activate();
    } else {
      this.deactivate();
    }
  };

  // ----- keydown ----- //

  // go previous/next if left/right keys pressed
  proto.onkeydown = function( event ) {
    let { activeElement } = document;
    let handler = Flickity.keyboardHandlers[ event.key ];
    // only work if element is in focus
    if ( !this.options.accessibility || !activeElement || !handler ) return;

    let isFocused = this.focusableElems.some( ( elem ) => activeElement === elem );
    if ( isFocused ) handler.call( this );
  };

  Flickity.keyboardHandlers = {
    ArrowLeft: function() {
      this.uiChange();
      let leftMethod = this.options.rightToLeft ? 'next' : 'previous';
      this[ leftMethod ]();
    },
    ArrowRight: function() {
      this.uiChange();
      let rightMethod = this.options.rightToLeft ? 'previous' : 'next';
      this[ rightMethod ]();
    },
  };

  // ----- focus ----- //

  proto.focus = function() {
    this.element.focus({ preventScroll: true });
  };

  // -------------------------- destroy -------------------------- //

  // deactivate all Flickity functionality, but keep stuff available
  proto.deactivate = function() {
    if ( !this.isActive ) return;

    this.element.classList.remove('flickity-enabled');
    this.element.classList.remove('flickity-rtl');
    this.unselectSelectedSlide();
    // destroy cells
    this.cells.forEach( ( cell ) => cell.destroy() );
    this.viewport.remove();
    // move child elements back into element
    this.element.append( ...this.slider.children );
    if ( this.options.accessibility ) {
      this.element.removeAttribute('tabIndex');
      this.element.removeEventListener( 'keydown', this );
    }
    // set flags
    this.isActive = false;
    this.emitEvent('deactivate');
  };

  proto.destroy = function() {
    this.deactivate();
    window.removeEventListener( 'resize', this );
    this.allOff();
    this.emitEvent('destroy');
    if ( jQuery && this.$element ) {
      jQuery.removeData( this.element, 'flickity' );
    }
    delete this.element.flickityGUID;
    delete instances[ this.guid ];
  };

  // -------------------------- prototype -------------------------- //

  Object.assign( proto, animatePrototype );

  // -------------------------- extras -------------------------- //

  /**
   * get Flickity instance from element
   * @param {[Element, String]} elem - element or selector string
   * @returns {Flickity} - Flickity instance
   */
  Flickity.data = function( elem ) {
    elem = utils.getQueryElement( elem );
    if ( elem ) return instances[ elem.flickityGUID ];
  };

  utils.htmlInit( Flickity, 'flickity' );

  let { jQueryBridget } = window;
  if ( jQuery && jQueryBridget ) {
    jQueryBridget( 'flickity', Flickity, jQuery );
  }

  // set internal jQuery, for Webpack + jQuery v3, #478
  Flickity.setJQuery = function( jq ) {
    jQuery = jq;
  };

  Flickity.Cell = Cell;
  Flickity.Slide = Slide;

  return Flickity;

  } ) );
  }(core));

  var drag = {exports: {}};

  var unidragger = {exports: {}};

  /*!
   * Unidragger v3.0.1
   * Draggable base class
   * MIT license
   */

  (function (module) {
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          evEmitter.exports,
      );
    } else {
      // browser global
      window.Unidragger = factory(
          window,
          window.EvEmitter,
      );
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal, function factory( window, EvEmitter ) {

  function Unidragger() {}

  // inherit EvEmitter
  let proto = Unidragger.prototype = Object.create( EvEmitter.prototype );

  // ----- bind start ----- //

  // trigger handler methods for events
  proto.handleEvent = function( event ) {
    let method = 'on' + event.type;
    if ( this[ method ] ) {
      this[ method ]( event );
    }
  };

  let startEvent, activeEvents;
  if ( 'ontouchstart' in window ) {
    // HACK prefer Touch Events as you can preventDefault on touchstart to
    // disable scroll in iOS & mobile Chrome metafizzy/flickity#1177
    startEvent = 'touchstart';
    activeEvents = [ 'touchmove', 'touchend', 'touchcancel' ];
  } else if ( window.PointerEvent ) {
    // Pointer Events
    startEvent = 'pointerdown';
    activeEvents = [ 'pointermove', 'pointerup', 'pointercancel' ];
  } else {
    // mouse events
    startEvent = 'mousedown';
    activeEvents = [ 'mousemove', 'mouseup' ];
  }

  // prototype so it can be overwriteable by Flickity
  proto.touchActionValue = 'none';

  proto.bindHandles = function() {
    this._bindHandles( 'addEventListener', this.touchActionValue );
  };

  proto.unbindHandles = function() {
    this._bindHandles( 'removeEventListener', '' );
  };

  /**
   * Add or remove start event
   * @param {String} bindMethod - addEventListener or removeEventListener
   * @param {String} touchAction - value for touch-action CSS property
   */
  proto._bindHandles = function( bindMethod, touchAction ) {
    this.handles.forEach( ( handle ) => {
      handle[ bindMethod ]( startEvent, this );
      handle[ bindMethod ]( 'click', this );
      // touch-action: none to override browser touch gestures. metafizzy/flickity#540
      if ( window.PointerEvent ) handle.style.touchAction = touchAction;
    } );
  };

  proto.bindActivePointerEvents = function() {
    activeEvents.forEach( ( eventName ) => {
      window.addEventListener( eventName, this );
    } );
  };

  proto.unbindActivePointerEvents = function() {
    activeEvents.forEach( ( eventName ) => {
      window.removeEventListener( eventName, this );
    } );
  };

  // ----- event handler helpers ----- //

  // trigger method with matching pointer
  proto.withPointer = function( methodName, event ) {
    if ( event.pointerId === this.pointerIdentifier ) {
      this[ methodName ]( event, event );
    }
  };

  // trigger method with matching touch
  proto.withTouch = function( methodName, event ) {
    let touch;
    for ( let changedTouch of event.changedTouches ) {
      if ( changedTouch.identifier === this.pointerIdentifier ) {
        touch = changedTouch;
      }
    }
    if ( touch ) this[ methodName ]( event, touch );
  };

  // ----- start event ----- //

  proto.onmousedown = function( event ) {
    this.pointerDown( event, event );
  };

  proto.ontouchstart = function( event ) {
    this.pointerDown( event, event.changedTouches[0] );
  };

  proto.onpointerdown = function( event ) {
    this.pointerDown( event, event );
  };

  // nodes that have text fields
  const cursorNodes = [ 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION' ];
  // input types that do not have text fields
  const clickTypes = [ 'radio', 'checkbox', 'button', 'submit', 'image', 'file' ];

  /**
   * any time you set `event, pointer` it refers to:
   * @param {Event} event
   * @param {Event | Touch} pointer
   */
  proto.pointerDown = function( event, pointer ) {
    // dismiss multi-touch taps, right clicks, and clicks on text fields
    let isCursorNode = cursorNodes.includes( event.target.nodeName );
    let isClickType = clickTypes.includes( event.target.type );
    let isOkayElement = !isCursorNode || isClickType;
    let isOkay = !this.isPointerDown && !event.button && isOkayElement;
    if ( !isOkay ) return;

    this.isPointerDown = true;
    // save pointer identifier to match up touch events
    this.pointerIdentifier = pointer.pointerId !== undefined ?
      // pointerId for pointer events, touch.indentifier for touch events
      pointer.pointerId : pointer.identifier;
    // track position for move
    this.pointerDownPointer = {
      pageX: pointer.pageX,
      pageY: pointer.pageY,
    };

    this.bindActivePointerEvents();
    this.emitEvent( 'pointerDown', [ event, pointer ] );
  };

  // ----- move ----- //

  proto.onmousemove = function( event ) {
    this.pointerMove( event, event );
  };

  proto.onpointermove = function( event ) {
    this.withPointer( 'pointerMove', event );
  };

  proto.ontouchmove = function( event ) {
    this.withTouch( 'pointerMove', event );
  };

  proto.pointerMove = function( event, pointer ) {
    let moveVector = {
      x: pointer.pageX - this.pointerDownPointer.pageX,
      y: pointer.pageY - this.pointerDownPointer.pageY,
    };
    this.emitEvent( 'pointerMove', [ event, pointer, moveVector ] );
    // start drag if pointer has moved far enough to start drag
    let isDragStarting = !this.isDragging && this.hasDragStarted( moveVector );
    if ( isDragStarting ) this.dragStart( event, pointer );
    if ( this.isDragging ) this.dragMove( event, pointer, moveVector );
  };

  // condition if pointer has moved far enough to start drag
  proto.hasDragStarted = function( moveVector ) {
    return Math.abs( moveVector.x ) > 3 || Math.abs( moveVector.y ) > 3;
  };

  // ----- drag ----- //

  proto.dragStart = function( event, pointer ) {
    this.isDragging = true;
    this.isPreventingClicks = true; // set flag to prevent clicks
    this.emitEvent( 'dragStart', [ event, pointer ] );
  };

  proto.dragMove = function( event, pointer, moveVector ) {
    this.emitEvent( 'dragMove', [ event, pointer, moveVector ] );
  };

  // ----- end ----- //

  proto.onmouseup = function( event ) {
    this.pointerUp( event, event );
  };

  proto.onpointerup = function( event ) {
    this.withPointer( 'pointerUp', event );
  };

  proto.ontouchend = function( event ) {
    this.withTouch( 'pointerUp', event );
  };

  proto.pointerUp = function( event, pointer ) {
    this.pointerDone();
    this.emitEvent( 'pointerUp', [ event, pointer ] );

    if ( this.isDragging ) {
      this.dragEnd( event, pointer );
    } else {
      // pointer didn't move enough for drag to start
      this.staticClick( event, pointer );
    }
  };

  proto.dragEnd = function( event, pointer ) {
    this.isDragging = false; // reset flag
    // re-enable clicking async
    setTimeout( () => delete this.isPreventingClicks );

    this.emitEvent( 'dragEnd', [ event, pointer ] );
  };

  // triggered on pointer up & pointer cancel
  proto.pointerDone = function() {
    this.isPointerDown = false;
    delete this.pointerIdentifier;
    this.unbindActivePointerEvents();
    this.emitEvent('pointerDone');
  };

  // ----- cancel ----- //

  proto.onpointercancel = function( event ) {
    this.withPointer( 'pointerCancel', event );
  };

  proto.ontouchcancel = function( event ) {
    this.withTouch( 'pointerCancel', event );
  };

  proto.pointerCancel = function( event, pointer ) {
    this.pointerDone();
    this.emitEvent( 'pointerCancel', [ event, pointer ] );
  };

  // ----- click ----- //

  // handle all clicks and prevent clicks when dragging
  proto.onclick = function( event ) {
    if ( this.isPreventingClicks ) event.preventDefault();
  };

  // triggered after pointer down & up with no/tiny movement
  proto.staticClick = function( event, pointer ) {
    // ignore emulated mouse up clicks
    let isMouseup = event.type === 'mouseup';
    if ( isMouseup && this.isIgnoringMouseUp ) return;

    this.emitEvent( 'staticClick', [ event, pointer ] );

    // set flag for emulated clicks 300ms after touchend
    if ( isMouseup ) {
      this.isIgnoringMouseUp = true;
      // reset flag after 400ms
      setTimeout( () => {
        delete this.isIgnoringMouseUp;
      }, 400 );
    }
  };

  // -----  ----- //

  return Unidragger;

  } ) );
  }(unidragger));

  (function (module) {
  // drag
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          window,
          core.exports,
          unidragger.exports,
          utils.exports,
      );
    } else {
      // browser global
      window.Flickity = factory(
          window,
          window.Flickity,
          window.Unidragger,
          window.fizzyUIUtils,
      );
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal,
      function factory( window, Flickity, Unidragger, utils ) {

  // ----- defaults ----- //

  Object.assign( Flickity.defaults, {
    draggable: '>1',
    dragThreshold: 3,
  } );

  // -------------------------- drag prototype -------------------------- //

  let proto = Flickity.prototype;
  Object.assign( proto, Unidragger.prototype ); // inherit Unidragger
  proto.touchActionValue = '';

  // --------------------------  -------------------------- //

  Flickity.create.drag = function() {
    this.on( 'activate', this.onActivateDrag );
    this.on( 'uiChange', this._uiChangeDrag );
    this.on( 'deactivate', this.onDeactivateDrag );
    this.on( 'cellChange', this.updateDraggable );
    this.on( 'pointerDown', this.handlePointerDown );
    this.on( 'pointerUp', this.handlePointerUp );
    this.on( 'pointerDown', this.handlePointerDone );
    this.on( 'dragStart', this.handleDragStart );
    this.on( 'dragMove', this.handleDragMove );
    this.on( 'dragEnd', this.handleDragEnd );
    this.on( 'staticClick', this.handleStaticClick );
    // TODO updateDraggable on resize? if groupCells & slides change
  };

  proto.onActivateDrag = function() {
    this.handles = [ this.viewport ];
    this.bindHandles();
    this.updateDraggable();
  };

  proto.onDeactivateDrag = function() {
    this.unbindHandles();
    this.element.classList.remove('is-draggable');
  };

  proto.updateDraggable = function() {
    // disable dragging if less than 2 slides. #278
    if ( this.options.draggable === '>1' ) {
      this.isDraggable = this.slides.length > 1;
    } else {
      this.isDraggable = this.options.draggable;
    }
    this.element.classList.toggle( 'is-draggable', this.isDraggable );
  };

  proto._uiChangeDrag = function() {
    delete this.isFreeScrolling;
  };

  // -------------------------- pointer events -------------------------- //

  proto.handlePointerDown = function( event ) {
    if ( !this.isDraggable ) {
      // proceed for staticClick
      this.bindActivePointerEvents( event );
      return;
    }

    let isTouchStart = event.type === 'touchstart';
    let isTouchPointer = event.pointerType === 'touch';
    let isFocusNode = event.target.matches('input, textarea, select');
    if ( !isTouchStart && !isTouchPointer && !isFocusNode ) event.preventDefault();
    if ( !isFocusNode ) this.focus();
    // blur
    if ( document.activeElement !== this.element ) document.activeElement.blur();
    // stop if it was moving
    this.dragX = this.x;
    this.viewport.classList.add('is-pointer-down');
    // track scrolling
    this.pointerDownScroll = getScrollPosition();
    window.addEventListener( 'scroll', this );
    this.bindActivePointerEvents( event );
  };

  // ----- move ----- //

  proto.hasDragStarted = function( moveVector ) {
    return Math.abs( moveVector.x ) > this.options.dragThreshold;
  };

  // ----- up ----- //

  proto.handlePointerUp = function() {
    delete this.isTouchScrolling;
    this.viewport.classList.remove('is-pointer-down');
  };

  proto.handlePointerDone = function() {
    window.removeEventListener( 'scroll', this );
    delete this.pointerDownScroll;
  };

  // -------------------------- dragging -------------------------- //

  proto.handleDragStart = function() {
    if ( !this.isDraggable ) return;

    this.dragStartPosition = this.x;
    this.startAnimation();
    window.removeEventListener( 'scroll', this );
  };

  proto.handleDragMove = function( event, pointer, moveVector ) {
    if ( !this.isDraggable ) return;

    event.preventDefault();

    this.previousDragX = this.dragX;
    // reverse if right-to-left
    let direction = this.options.rightToLeft ? -1 : 1;
    // wrap around move. #589
    if ( this.isWrapping ) moveVector.x %= this.slideableWidth;
    let dragX = this.dragStartPosition + moveVector.x * direction;

    if ( !this.isWrapping ) {
      // slow drag
      let originBound = Math.max( -this.slides[0].target, this.dragStartPosition );
      dragX = dragX > originBound ? ( dragX + originBound ) * 0.5 : dragX;
      let endBound = Math.min( -this.getLastSlide().target, this.dragStartPosition );
      dragX = dragX < endBound ? ( dragX + endBound ) * 0.5 : dragX;
    }

    this.dragX = dragX;
    this.dragMoveTime = new Date();
  };

  proto.handleDragEnd = function() {
    if ( !this.isDraggable ) return;

    let { freeScroll } = this.options;
    if ( freeScroll ) this.isFreeScrolling = true;
    // set selectedIndex based on where flick will end up
    let index = this.dragEndRestingSelect();

    if ( freeScroll && !this.isWrapping ) {
      // if free-scroll & not wrap around
      // do not free-scroll if going outside of bounding slides
      // so bounding slides can attract slider, and keep it in bounds
      let restingX = this.getRestingPosition();
      this.isFreeScrolling = -restingX > this.slides[0].target &&
        -restingX < this.getLastSlide().target;
    } else if ( !freeScroll && index === this.selectedIndex ) {
      // boost selection if selected index has not changed
      index += this.dragEndBoostSelect();
    }
    delete this.previousDragX;
    // apply selection
    // HACK, set flag so dragging stays in correct direction
    this.isDragSelect = this.isWrapping;
    this.select( index );
    delete this.isDragSelect;
  };

  proto.dragEndRestingSelect = function() {
    let restingX = this.getRestingPosition();
    // how far away from selected slide
    let distance = Math.abs( this.getSlideDistance( -restingX, this.selectedIndex ) );
    // get closet resting going up and going down
    let positiveResting = this._getClosestResting( restingX, distance, 1 );
    let negativeResting = this._getClosestResting( restingX, distance, -1 );
    // use closer resting for wrap-around
    return positiveResting.distance < negativeResting.distance ?
      positiveResting.index : negativeResting.index;
  };

  /**
   * given resting X and distance to selected cell
   * get the distance and index of the closest cell
   * @param {Number} restingX - estimated post-flick resting position
   * @param {Number} distance - distance to selected cell
   * @param {Integer} increment - +1 or -1, going up or down
   * @returns {Object} - { distance: {Number}, index: {Integer} }
   */
  proto._getClosestResting = function( restingX, distance, increment ) {
    let index = this.selectedIndex;
    let minDistance = Infinity;
    let condition = this.options.contain && !this.isWrapping ?
      // if containing, keep going if distance is equal to minDistance
      ( dist, minDist ) => dist <= minDist :
      ( dist, minDist ) => dist < minDist;

    while ( condition( distance, minDistance ) ) {
      // measure distance to next cell
      index += increment;
      minDistance = distance;
      distance = this.getSlideDistance( -restingX, index );
      if ( distance === null ) break;

      distance = Math.abs( distance );
    }
    return {
      distance: minDistance,
      // selected was previous index
      index: index - increment,
    };
  };

  /**
   * measure distance between x and a slide target
   * @param {Number} x - horizontal position
   * @param {Integer} index - slide index
   * @returns {Number} - slide distance
   */
  proto.getSlideDistance = function( x, index ) {
    let len = this.slides.length;
    // wrap around if at least 2 slides
    let isWrapAround = this.options.wrapAround && len > 1;
    let slideIndex = isWrapAround ? utils.modulo( index, len ) : index;
    let slide = this.slides[ slideIndex ];
    if ( !slide ) return null;

    // add distance for wrap-around slides
    let wrap = isWrapAround ? this.slideableWidth * Math.floor( index/len ) : 0;
    return x - ( slide.target + wrap );
  };

  proto.dragEndBoostSelect = function() {
    // do not boost if no previousDragX or dragMoveTime
    if ( this.previousDragX === undefined || !this.dragMoveTime ||
      // or if drag was held for 100 ms
      new Date() - this.dragMoveTime > 100 ) {
      return 0;
    }

    let distance = this.getSlideDistance( -this.dragX, this.selectedIndex );
    let delta = this.previousDragX - this.dragX;
    if ( distance > 0 && delta > 0 ) {
      // boost to next if moving towards the right, and positive velocity
      return 1;
    } else if ( distance < 0 && delta < 0 ) {
      // boost to previous if moving towards the left, and negative velocity
      return -1;
    }
    return 0;
  };

  // ----- scroll ----- //

  proto.onscroll = function() {
    let scroll = getScrollPosition();
    let scrollMoveX = this.pointerDownScroll.x - scroll.x;
    let scrollMoveY = this.pointerDownScroll.y - scroll.y;
    // cancel click/tap if scroll is too much
    if ( Math.abs( scrollMoveX ) > 3 || Math.abs( scrollMoveY ) > 3 ) {
      this.pointerDone();
    }
  };

  // ----- utils ----- //

  function getScrollPosition() {
    return {
      x: window.pageXOffset,
      y: window.pageYOffset,
    };
  }

  // -----  ----- //

  return Flickity;

  } ) );
  }(drag));

  var prevNextButton = {exports: {}};

  (function (module) {
  // prev/next buttons
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory( core.exports );
    } else {
      // browser global
      factory( window.Flickity );
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal, function factory( Flickity ) {

  const svgURI = 'http://www.w3.org/2000/svg';

  // -------------------------- PrevNextButton -------------------------- //

  function PrevNextButton( increment, direction, arrowShape ) {
    this.increment = increment;
    this.direction = direction;
    this.isPrevious = increment === 'previous';
    this.isLeft = direction === 'left';
    this._create( arrowShape );
  }

  PrevNextButton.prototype._create = function( arrowShape ) {
    // properties
    let element = this.element = document.createElement('button');
    element.className = `flickity-button flickity-prev-next-button ${this.increment}`;
    let label = this.isPrevious ? 'Previous' : 'Next';
    // prevent button from submitting form https://stackoverflow.com/a/10836076/182183
    element.setAttribute( 'type', 'button' );
    element.setAttribute( 'aria-label', label );
    // init as disabled
    this.disable();
    // create arrow
    let svg = this.createSVG( label, arrowShape );
    element.append( svg );
  };

  PrevNextButton.prototype.createSVG = function( label, arrowShape ) {
    let svg = document.createElementNS( svgURI, 'svg' );
    svg.setAttribute( 'class', 'flickity-button-icon' );
    svg.setAttribute( 'viewBox', '0 0 100 100' );
    // add title #1189
    let title = document.createElementNS( svgURI, 'title' );
    title.append( label );
    // add path
    let path = document.createElementNS( svgURI, 'path' );
    let pathMovements = getArrowMovements( arrowShape );
    path.setAttribute( 'd', pathMovements );
    path.setAttribute( 'class', 'arrow' );
    // rotate arrow
    if ( !this.isLeft ) {
      path.setAttribute( 'transform', 'translate(100, 100) rotate(180)' );
    }
    svg.append( title, path );
    return svg;
  };

  // get SVG path movmement
  function getArrowMovements( shape ) {
    // use shape as movement if string
    if ( typeof shape == 'string' ) return shape;

    let { x0, x1, x2, x3, y1, y2 } = shape;

    // create movement string
    return `M ${x0}, 50
    L ${x1}, ${y1 + 50}
    L ${x2}, ${y2 + 50}
    L ${x3}, 50
    L ${x2}, ${50 - y2}
    L ${x1}, ${50 - y1}
    Z`;
  }

  // -----  ----- //

  PrevNextButton.prototype.enable = function() {
    this.element.removeAttribute('disabled');
  };

  PrevNextButton.prototype.disable = function() {
    this.element.setAttribute( 'disabled', true );
  };

  // -------------------------- Flickity prototype -------------------------- //

  Object.assign( Flickity.defaults, {
    prevNextButtons: true,
    arrowShape: {
      x0: 10,
      x1: 60, y1: 50,
      x2: 70, y2: 40,
      x3: 30,
    },
  } );

  Flickity.create.prevNextButtons = function() {
    if ( !this.options.prevNextButtons ) return;

    let { rightToLeft, arrowShape } = this.options;
    let prevDirection = rightToLeft ? 'right' : 'left';
    let nextDirection = rightToLeft ? 'left' : 'right';
    this.prevButton = new PrevNextButton( 'previous', prevDirection, arrowShape );
    this.nextButton = new PrevNextButton( 'next', nextDirection, arrowShape );
    this.focusableElems.push( this.prevButton.element );
    this.focusableElems.push( this.nextButton.element );

    this.handlePrevButtonClick = () => {
      this.uiChange();
      this.previous();
    };

    this.handleNextButtonClick = () => {
      this.uiChange();
      this.next();
    };

    this.on( 'activate', this.activatePrevNextButtons );
    this.on( 'select', this.updatePrevNextButtons );
  };

  let proto = Flickity.prototype;

  proto.updatePrevNextButtons = function() {
    let lastIndex = this.slides.length ? this.slides.length - 1 : 0;
    this.updatePrevNextButton( this.prevButton, 0 );
    this.updatePrevNextButton( this.nextButton, lastIndex );
  };

  proto.updatePrevNextButton = function( button, disabledIndex ) {
    // enable is wrapAround and at least 2 slides
    if ( this.isWrapping && this.slides.length > 1 ) {
      button.enable();
      return;
    }

    let isEnabled = this.selectedIndex !== disabledIndex;
    button[ isEnabled ? 'enable' : 'disable' ]();
    // if disabling button that is focused,
    // shift focus to element to maintain keyboard accessibility
    let isDisabledFocused = !isEnabled && document.activeElement === button.element;
    if ( isDisabledFocused ) this.focus();
  };

  proto.activatePrevNextButtons = function() {
    this.prevButton.element.addEventListener( 'click', this.handlePrevButtonClick );
    this.nextButton.element.addEventListener( 'click', this.handleNextButtonClick );
    this.element.append( this.prevButton.element, this.nextButton.element );
    this.on( 'deactivate', this.deactivatePrevNextButtons );
  };

  proto.deactivatePrevNextButtons = function() {
    this.prevButton.element.remove();
    this.nextButton.element.remove();
    this.prevButton.element.removeEventListener( 'click', this.handlePrevButtonClick );
    this.nextButton.element.removeEventListener( 'click', this.handleNextButtonClick );
    this.off( 'deactivate', this.deactivatePrevNextButtons );
  };

  // --------------------------  -------------------------- //

  Flickity.PrevNextButton = PrevNextButton;

  return Flickity;

  } ) );
  }(prevNextButton));

  var pageDots = {exports: {}};

  (function (module) {
  // page dots
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          core.exports,
          utils.exports,
      );
    } else {
      // browser global
      factory(
          window.Flickity,
          window.fizzyUIUtils,
      );
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal, function factory( Flickity, utils ) {

  // -------------------------- PageDots -------------------------- //

  function PageDots() {
    // create holder element
    this.holder = document.createElement('div');
    this.holder.className = 'flickity-page-dots';
    // create dots, array of elements
    this.dots = [];
  }

  PageDots.prototype.setDots = function( slidesLength ) {
    // get difference between number of slides and number of dots
    let delta = slidesLength - this.dots.length;
    if ( delta > 0 ) {
      this.addDots( delta );
    } else if ( delta < 0 ) {
      this.removeDots( -delta );
    }
  };

  PageDots.prototype.addDots = function( count ) {
    let newDots = new Array( count ).fill()
      .map( ( item, i ) => {
        let dot = document.createElement('button');
        dot.setAttribute( 'type', 'button' );
        let num = i + 1 + this.dots.length;
        dot.className = 'flickity-page-dot';
        dot.textContent = `View slide ${num}`;
        return dot;
      } );

    this.holder.append( ...newDots );
    this.dots = this.dots.concat( newDots );
  };

  PageDots.prototype.removeDots = function( count ) {
    // remove from this.dots collection
    let removeDots = this.dots.splice( this.dots.length - count, count );
    // remove from DOM
    removeDots.forEach( ( dot ) => dot.remove() );
  };

  PageDots.prototype.updateSelected = function( index ) {
    // remove selected class on previous
    if ( this.selectedDot ) {
      this.selectedDot.classList.remove('is-selected');
      this.selectedDot.removeAttribute('aria-current');
    }
    // don't proceed if no dots
    if ( !this.dots.length ) return;

    this.selectedDot = this.dots[ index ];
    this.selectedDot.classList.add('is-selected');
    this.selectedDot.setAttribute( 'aria-current', 'step' );
  };

  Flickity.PageDots = PageDots;

  // -------------------------- Flickity -------------------------- //

  Object.assign( Flickity.defaults, {
    pageDots: true,
  } );

  Flickity.create.pageDots = function() {
    if ( !this.options.pageDots ) return;

    this.pageDots = new PageDots();
    this.handlePageDotsClick = this.onPageDotsClick.bind( this );
    // events
    this.on( 'activate', this.activatePageDots );
    this.on( 'select', this.updateSelectedPageDots );
    this.on( 'cellChange', this.updatePageDots );
    this.on( 'resize', this.updatePageDots );
    this.on( 'deactivate', this.deactivatePageDots );
  };

  let proto = Flickity.prototype;

  proto.activatePageDots = function() {
    this.pageDots.setDots( this.slides.length );
    this.focusableElems.push( ...this.pageDots.dots );
    this.pageDots.holder.addEventListener( 'click', this.handlePageDotsClick );
    this.element.append( this.pageDots.holder );
  };

  proto.onPageDotsClick = function( event ) {
    let index = this.pageDots.dots.indexOf( event.target );
    if ( index === -1 ) return; // only dot clicks

    this.uiChange();
    this.select( index );
  };

  proto.updateSelectedPageDots = function() {
    this.pageDots.updateSelected( this.selectedIndex );
  };

  proto.updatePageDots = function() {
    this.pageDots.dots.forEach( ( dot ) => {
      utils.removeFrom( this.focusableElems, dot );
    } );
    this.pageDots.setDots( this.slides.length );
    this.focusableElems.push( ...this.pageDots.dots );
  };

  proto.deactivatePageDots = function() {
    this.pageDots.holder.remove();
    this.pageDots.holder.removeEventListener( 'click', this.handlePageDotsClick );
  };

  // -----  ----- //

  Flickity.PageDots = PageDots;

  return Flickity;

  } ) );
  }(pageDots));

  var player = {exports: {}};

  (function (module) {
  // player & autoPlay
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory( core.exports );
    } else {
      // browser global
      factory( window.Flickity );
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal, function factory( Flickity ) {

  // -------------------------- Player -------------------------- //

  function Player( autoPlay, onTick ) {
    this.autoPlay = autoPlay;
    this.onTick = onTick;
    this.state = 'stopped';
    // visibility change event handler
    this.onVisibilityChange = this.visibilityChange.bind( this );
    this.onVisibilityPlay = this.visibilityPlay.bind( this );
  }

  // start play
  Player.prototype.play = function() {
    if ( this.state === 'playing' ) return;

    // do not play if page is hidden, start playing when page is visible
    let isPageHidden = document.hidden;
    if ( isPageHidden ) {
      document.addEventListener( 'visibilitychange', this.onVisibilityPlay );
      return;
    }

    this.state = 'playing';
    // listen to visibility change
    document.addEventListener( 'visibilitychange', this.onVisibilityChange );
    // start ticking
    this.tick();
  };

  Player.prototype.tick = function() {
    // do not tick if not playing
    if ( this.state !== 'playing' ) return;

    // default to 3 seconds
    let time = typeof this.autoPlay == 'number' ? this.autoPlay : 3000;
    // HACK: reset ticks if stopped and started within interval
    this.clear();
    this.timeout = setTimeout( () => {
      this.onTick();
      this.tick();
    }, time );
  };

  Player.prototype.stop = function() {
    this.state = 'stopped';
    this.clear();
    // remove visibility change event
    document.removeEventListener( 'visibilitychange', this.onVisibilityChange );
  };

  Player.prototype.clear = function() {
    clearTimeout( this.timeout );
  };

  Player.prototype.pause = function() {
    if ( this.state === 'playing' ) {
      this.state = 'paused';
      this.clear();
    }
  };

  Player.prototype.unpause = function() {
    // re-start play if paused
    if ( this.state === 'paused' ) this.play();
  };

  // pause if page visibility is hidden, unpause if visible
  Player.prototype.visibilityChange = function() {
    let isPageHidden = document.hidden;
    this[ isPageHidden ? 'pause' : 'unpause' ]();
  };

  Player.prototype.visibilityPlay = function() {
    this.play();
    document.removeEventListener( 'visibilitychange', this.onVisibilityPlay );
  };

  // -------------------------- Flickity -------------------------- //

  Object.assign( Flickity.defaults, {
    pauseAutoPlayOnHover: true,
  } );

  Flickity.create.player = function() {
    this.player = new Player( this.options.autoPlay, () => {
      this.next( true );
    } );

    this.on( 'activate', this.activatePlayer );
    this.on( 'uiChange', this.stopPlayer );
    this.on( 'pointerDown', this.stopPlayer );
    this.on( 'deactivate', this.deactivatePlayer );
  };

  let proto = Flickity.prototype;

  proto.activatePlayer = function() {
    if ( !this.options.autoPlay ) return;

    this.player.play();
    this.element.addEventListener( 'mouseenter', this );
  };

  // Player API, don't hate the ... thanks I know where the door is

  proto.playPlayer = function() {
    this.player.play();
  };

  proto.stopPlayer = function() {
    this.player.stop();
  };

  proto.pausePlayer = function() {
    this.player.pause();
  };

  proto.unpausePlayer = function() {
    this.player.unpause();
  };

  proto.deactivatePlayer = function() {
    this.player.stop();
    this.element.removeEventListener( 'mouseenter', this );
  };

  // ----- mouseenter/leave ----- //

  // pause auto-play on hover
  proto.onmouseenter = function() {
    if ( !this.options.pauseAutoPlayOnHover ) return;

    this.player.pause();
    this.element.addEventListener( 'mouseleave', this );
  };

  // resume auto-play on hover off
  proto.onmouseleave = function() {
    this.player.unpause();
    this.element.removeEventListener( 'mouseleave', this );
  };

  // -----  ----- //

  Flickity.Player = Player;

  return Flickity;

  } ) );
  }(player));

  var addRemoveCell = {exports: {}};

  (function (module) {
  // add, remove cell
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          core.exports,
          utils.exports,
      );
    } else {
      // browser global
      factory(
          window.Flickity,
          window.fizzyUIUtils,
      );
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal, function factory( Flickity, utils ) {

  // append cells to a document fragment
  function getCellsFragment( cells ) {
    let fragment = document.createDocumentFragment();
    cells.forEach( ( cell ) => fragment.appendChild( cell.element ) );
    return fragment;
  }

  // -------------------------- add/remove cell prototype -------------------------- //

  let proto = Flickity.prototype;

  /**
   * Insert, prepend, or append cells
   * @param {[Element, Array, NodeList]} elems - Elements to insert
   * @param {Integer} index - Zero-based number to insert
   */
  proto.insert = function( elems, index ) {
    let cells = this._makeCells( elems );
    if ( !cells || !cells.length ) return;

    let len = this.cells.length;
    // default to append
    index = index === undefined ? len : index;
    // add cells with document fragment
    let fragment = getCellsFragment( cells );
    // append to slider
    let isAppend = index === len;
    if ( isAppend ) {
      this.slider.appendChild( fragment );
    } else {
      let insertCellElement = this.cells[ index ].element;
      this.slider.insertBefore( fragment, insertCellElement );
    }
    // add to this.cells
    if ( index === 0 ) {
      // prepend, add to start
      this.cells = cells.concat( this.cells );
    } else if ( isAppend ) {
      // append, add to end
      this.cells = this.cells.concat( cells );
    } else {
      // insert in this.cells
      let endCells = this.cells.splice( index, len - index );
      this.cells = this.cells.concat( cells ).concat( endCells );
    }

    this._sizeCells( cells );
    this.cellChange( index );
    this.positionSliderAtSelected();
  };

  proto.append = function( elems ) {
    this.insert( elems, this.cells.length );
  };

  proto.prepend = function( elems ) {
    this.insert( elems, 0 );
  };

  /**
   * Remove cells
   * @param {[Element, Array, NodeList]} elems - ELements to remove
   */
  proto.remove = function( elems ) {
    let cells = this.getCells( elems );
    if ( !cells || !cells.length ) return;

    let minCellIndex = this.cells.length - 1;
    // remove cells from collection & DOM
    cells.forEach( ( cell ) => {
      cell.remove();
      let index = this.cells.indexOf( cell );
      minCellIndex = Math.min( index, minCellIndex );
      utils.removeFrom( this.cells, cell );
    } );

    this.cellChange( minCellIndex );
    this.positionSliderAtSelected();
  };

  /**
   * logic to be run after a cell's size changes
   * @param {Element} elem - cell's element
   */
  proto.cellSizeChange = function( elem ) {
    let cell = this.getCell( elem );
    if ( !cell ) return;

    cell.getSize();

    let index = this.cells.indexOf( cell );
    this.cellChange( index );
    // do not position slider after lazy load
  };

  /**
   * logic any time a cell is changed: added, removed, or size changed
   * @param {Integer} changedCellIndex - index of the changed cell, optional
   */
  proto.cellChange = function( changedCellIndex ) {
    let prevSelectedElem = this.selectedElement;
    this._positionCells( changedCellIndex );
    this._updateWrapShiftCells();
    this.setGallerySize();
    // update selectedIndex, try to maintain position & select previous selected element
    let cell = this.getCell( prevSelectedElem );
    if ( cell ) this.selectedIndex = this.getCellSlideIndex( cell );
    this.selectedIndex = Math.min( this.slides.length - 1, this.selectedIndex );

    this.emitEvent( 'cellChange', [ changedCellIndex ] );
    // position slider
    this.select( this.selectedIndex );
  };

  // -----  ----- //

  return Flickity;

  } ) );
  }(addRemoveCell));

  var lazyload = {exports: {}};

  (function (module) {
  // lazyload
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          core.exports,
          utils.exports,
      );
    } else {
      // browser global
      factory(
          window.Flickity,
          window.fizzyUIUtils,
      );
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal, function factory( Flickity, utils ) {

  const lazyAttr = 'data-flickity-lazyload';
  const lazySrcAttr = `${lazyAttr}-src`;
  const lazySrcsetAttr = `${lazyAttr}-srcset`;
  const imgSelector = `img[${lazyAttr}], img[${lazySrcAttr}], ` +
    `img[${lazySrcsetAttr}], source[${lazySrcsetAttr}]`;

  Flickity.create.lazyLoad = function() {
    this.on( 'select', this.lazyLoad );

    this.handleLazyLoadComplete = this.onLazyLoadComplete.bind( this );
  };

  let proto = Flickity.prototype;

  proto.lazyLoad = function() {
    let { lazyLoad } = this.options;
    if ( !lazyLoad ) return;

    // get adjacent cells, use lazyLoad option for adjacent count
    let adjCount = typeof lazyLoad == 'number' ? lazyLoad : 0;
    // lazy load images
    this.getAdjacentCellElements( adjCount )
      .map( getCellLazyImages )
      .flat()
      .forEach( ( img ) => new LazyLoader( img, this.handleLazyLoadComplete ) );
  };

  function getCellLazyImages( cellElem ) {
    // check if cell element is lazy image
    if ( cellElem.matches('img') ) {
      let cellAttr = cellElem.getAttribute( lazyAttr );
      let cellSrcAttr = cellElem.getAttribute( lazySrcAttr );
      let cellSrcsetAttr = cellElem.getAttribute( lazySrcsetAttr );
      if ( cellAttr || cellSrcAttr || cellSrcsetAttr ) {
        return cellElem;
      }
    }
    // select lazy images in cell
    return [ ...cellElem.querySelectorAll( imgSelector ) ];
  }

  proto.onLazyLoadComplete = function( img, event ) {
    let cell = this.getParentCell( img );
    let cellElem = cell && cell.element;
    this.cellSizeChange( cellElem );

    this.dispatchEvent( 'lazyLoad', event, cellElem );
  };

  // -------------------------- LazyLoader -------------------------- //

  /**
   * class to handle loading images
   * @param {Image} img - Image element
   * @param {Function} onComplete - callback function
   */
  function LazyLoader( img, onComplete ) {
    this.img = img;
    this.onComplete = onComplete;
    this.load();
  }

  LazyLoader.prototype.handleEvent = utils.handleEvent;

  LazyLoader.prototype.load = function() {
    this.img.addEventListener( 'load', this );
    this.img.addEventListener( 'error', this );
    // get src & srcset
    let src = this.img.getAttribute( lazyAttr ) ||
      this.img.getAttribute( lazySrcAttr );
    let srcset = this.img.getAttribute( lazySrcsetAttr );
    // set src & serset
    this.img.src = src;
    if ( srcset ) this.img.setAttribute( 'srcset', srcset );
    // remove attr
    this.img.removeAttribute( lazyAttr );
    this.img.removeAttribute( lazySrcAttr );
    this.img.removeAttribute( lazySrcsetAttr );
  };

  LazyLoader.prototype.onload = function( event ) {
    this.complete( event, 'flickity-lazyloaded' );
  };

  LazyLoader.prototype.onerror = function( event ) {
    this.complete( event, 'flickity-lazyerror' );
  };

  LazyLoader.prototype.complete = function( event, className ) {
    // unbind events
    this.img.removeEventListener( 'load', this );
    this.img.removeEventListener( 'error', this );
    let mediaElem = this.img.parentNode.matches('picture') ? this.img.parentNode : this.img;
    mediaElem.classList.add( className );

    this.onComplete( this.img, event );
  };

  // -----  ----- //

  Flickity.LazyLoader = LazyLoader;

  return Flickity;

  } ) );
  }(lazyload));

  var imagesloaded$1 = {exports: {}};

  var imagesloaded = {exports: {}};

  /*!
   * imagesLoaded v5.0.0
   * JavaScript is all like "You images are done yet or what?"
   * MIT License
   */

  (function (module) {
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory( window, evEmitter.exports );
    } else {
      // browser global
      window.imagesLoaded = factory( window, window.EvEmitter );
    }

  } )( typeof window !== 'undefined' ? window : commonjsGlobal,
      function factory( window, EvEmitter ) {

  let $ = window.jQuery;
  let console = window.console;

  // -------------------------- helpers -------------------------- //

  // turn element or nodeList into an array
  function makeArray( obj ) {
    // use object if already an array
    if ( Array.isArray( obj ) ) return obj;

    let isArrayLike = typeof obj == 'object' && typeof obj.length == 'number';
    // convert nodeList to array
    if ( isArrayLike ) return [ ...obj ];

    // array of single index
    return [ obj ];
  }

  // -------------------------- imagesLoaded -------------------------- //

  /**
   * @param {[Array, Element, NodeList, String]} elem
   * @param {[Object, Function]} options - if function, use as callback
   * @param {Function} onAlways - callback function
   * @returns {ImagesLoaded}
   */
  function ImagesLoaded( elem, options, onAlways ) {
    // coerce ImagesLoaded() without new, to be new ImagesLoaded()
    if ( !( this instanceof ImagesLoaded ) ) {
      return new ImagesLoaded( elem, options, onAlways );
    }
    // use elem as selector string
    let queryElem = elem;
    if ( typeof elem == 'string' ) {
      queryElem = document.querySelectorAll( elem );
    }
    // bail if bad element
    if ( !queryElem ) {
      console.error(`Bad element for imagesLoaded ${queryElem || elem}`);
      return;
    }

    this.elements = makeArray( queryElem );
    this.options = {};
    // shift arguments if no options set
    if ( typeof options == 'function' ) {
      onAlways = options;
    } else {
      Object.assign( this.options, options );
    }

    if ( onAlways ) this.on( 'always', onAlways );

    this.getImages();
    // add jQuery Deferred object
    if ( $ ) this.jqDeferred = new $.Deferred();

    // HACK check async to allow time to bind listeners
    setTimeout( this.check.bind( this ) );
  }

  ImagesLoaded.prototype = Object.create( EvEmitter.prototype );

  ImagesLoaded.prototype.getImages = function() {
    this.images = [];

    // filter & find items if we have an item selector
    this.elements.forEach( this.addElementImages, this );
  };

  const elementNodeTypes = [ 1, 9, 11 ];

  /**
   * @param {Node} elem
   */
  ImagesLoaded.prototype.addElementImages = function( elem ) {
    // filter siblings
    if ( elem.nodeName === 'IMG' ) {
      this.addImage( elem );
    }
    // get background image on element
    if ( this.options.background === true ) {
      this.addElementBackgroundImages( elem );
    }

    // find children
    // no non-element nodes, #143
    let { nodeType } = elem;
    if ( !nodeType || !elementNodeTypes.includes( nodeType ) ) return;

    let childImgs = elem.querySelectorAll('img');
    // concat childElems to filterFound array
    for ( let img of childImgs ) {
      this.addImage( img );
    }

    // get child background images
    if ( typeof this.options.background == 'string' ) {
      let children = elem.querySelectorAll( this.options.background );
      for ( let child of children ) {
        this.addElementBackgroundImages( child );
      }
    }
  };

  const reURL = /url\((['"])?(.*?)\1\)/gi;

  ImagesLoaded.prototype.addElementBackgroundImages = function( elem ) {
    let style = getComputedStyle( elem );
    // Firefox returns null if in a hidden iframe https://bugzil.la/548397
    if ( !style ) return;

    // get url inside url("...")
    let matches = reURL.exec( style.backgroundImage );
    while ( matches !== null ) {
      let url = matches && matches[2];
      if ( url ) {
        this.addBackground( url, elem );
      }
      matches = reURL.exec( style.backgroundImage );
    }
  };

  /**
   * @param {Image} img
   */
  ImagesLoaded.prototype.addImage = function( img ) {
    let loadingImage = new LoadingImage( img );
    this.images.push( loadingImage );
  };

  ImagesLoaded.prototype.addBackground = function( url, elem ) {
    let background = new Background( url, elem );
    this.images.push( background );
  };

  ImagesLoaded.prototype.check = function() {
    this.progressedCount = 0;
    this.hasAnyBroken = false;
    // complete if no images
    if ( !this.images.length ) {
      this.complete();
      return;
    }

    /* eslint-disable-next-line func-style */
    let onProgress = ( image, elem, message ) => {
      // HACK - Chrome triggers event before object properties have changed. #83
      setTimeout( () => {
        this.progress( image, elem, message );
      } );
    };

    this.images.forEach( function( loadingImage ) {
      loadingImage.once( 'progress', onProgress );
      loadingImage.check();
    } );
  };

  ImagesLoaded.prototype.progress = function( image, elem, message ) {
    this.progressedCount++;
    this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
    // progress event
    this.emitEvent( 'progress', [ this, image, elem ] );
    if ( this.jqDeferred && this.jqDeferred.notify ) {
      this.jqDeferred.notify( this, image );
    }
    // check if completed
    if ( this.progressedCount === this.images.length ) {
      this.complete();
    }

    if ( this.options.debug && console ) {
      console.log( `progress: ${message}`, image, elem );
    }
  };

  ImagesLoaded.prototype.complete = function() {
    let eventName = this.hasAnyBroken ? 'fail' : 'done';
    this.isComplete = true;
    this.emitEvent( eventName, [ this ] );
    this.emitEvent( 'always', [ this ] );
    if ( this.jqDeferred ) {
      let jqMethod = this.hasAnyBroken ? 'reject' : 'resolve';
      this.jqDeferred[ jqMethod ]( this );
    }
  };

  // --------------------------  -------------------------- //

  function LoadingImage( img ) {
    this.img = img;
  }

  LoadingImage.prototype = Object.create( EvEmitter.prototype );

  LoadingImage.prototype.check = function() {
    // If complete is true and browser supports natural sizes,
    // try to check for image status manually.
    let isComplete = this.getIsImageComplete();
    if ( isComplete ) {
      // report based on naturalWidth
      this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
      return;
    }

    // If none of the checks above matched, simulate loading on detached element.
    this.proxyImage = new Image();
    // add crossOrigin attribute. #204
    if ( this.img.crossOrigin ) {
      this.proxyImage.crossOrigin = this.img.crossOrigin;
    }
    this.proxyImage.addEventListener( 'load', this );
    this.proxyImage.addEventListener( 'error', this );
    // bind to image as well for Firefox. #191
    this.img.addEventListener( 'load', this );
    this.img.addEventListener( 'error', this );
    this.proxyImage.src = this.img.currentSrc || this.img.src;
  };

  LoadingImage.prototype.getIsImageComplete = function() {
    // check for non-zero, non-undefined naturalWidth
    // fixes Safari+InfiniteScroll+Masonry bug infinite-scroll#671
    return this.img.complete && this.img.naturalWidth;
  };

  LoadingImage.prototype.confirm = function( isLoaded, message ) {
    this.isLoaded = isLoaded;
    let { parentNode } = this.img;
    // emit progress with parent <picture> or self <img>
    let elem = parentNode.nodeName === 'PICTURE' ? parentNode : this.img;
    this.emitEvent( 'progress', [ this, elem, message ] );
  };

  // ----- events ----- //

  // trigger specified handler for event type
  LoadingImage.prototype.handleEvent = function( event ) {
    let method = 'on' + event.type;
    if ( this[ method ] ) {
      this[ method ]( event );
    }
  };

  LoadingImage.prototype.onload = function() {
    this.confirm( true, 'onload' );
    this.unbindEvents();
  };

  LoadingImage.prototype.onerror = function() {
    this.confirm( false, 'onerror' );
    this.unbindEvents();
  };

  LoadingImage.prototype.unbindEvents = function() {
    this.proxyImage.removeEventListener( 'load', this );
    this.proxyImage.removeEventListener( 'error', this );
    this.img.removeEventListener( 'load', this );
    this.img.removeEventListener( 'error', this );
  };

  // -------------------------- Background -------------------------- //

  function Background( url, element ) {
    this.url = url;
    this.element = element;
    this.img = new Image();
  }

  // inherit LoadingImage prototype
  Background.prototype = Object.create( LoadingImage.prototype );

  Background.prototype.check = function() {
    this.img.addEventListener( 'load', this );
    this.img.addEventListener( 'error', this );
    this.img.src = this.url;
    // check if image is already complete
    let isComplete = this.getIsImageComplete();
    if ( isComplete ) {
      this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
      this.unbindEvents();
    }
  };

  Background.prototype.unbindEvents = function() {
    this.img.removeEventListener( 'load', this );
    this.img.removeEventListener( 'error', this );
  };

  Background.prototype.confirm = function( isLoaded, message ) {
    this.isLoaded = isLoaded;
    this.emitEvent( 'progress', [ this, this.element, message ] );
  };

  // -------------------------- jQuery -------------------------- //

  ImagesLoaded.makeJQueryPlugin = function( jQuery ) {
    jQuery = jQuery || window.jQuery;
    if ( !jQuery ) return;

    // set local variable
    $ = jQuery;
    // $().imagesLoaded()
    $.fn.imagesLoaded = function( options, onAlways ) {
      let instance = new ImagesLoaded( this, options, onAlways );
      return instance.jqDeferred.promise( $( this ) );
    };
  };
  // try making plugin
  ImagesLoaded.makeJQueryPlugin();

  // --------------------------  -------------------------- //

  return ImagesLoaded;

  } );
  }(imagesloaded));

  (function (module) {
  // imagesloaded
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          core.exports,
          imagesloaded.exports,
      );
    } else {
      // browser global
      factory(
          window.Flickity,
          window.imagesLoaded,
      );
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal,
      function factory( Flickity, imagesLoaded ) {

  Flickity.create.imagesLoaded = function() {
    this.on( 'activate', this.imagesLoaded );
  };

  Flickity.prototype.imagesLoaded = function() {
    if ( !this.options.imagesLoaded ) return;

    let onImagesLoadedProgress = ( instance, image ) => {
      let cell = this.getParentCell( image.img );
      this.cellSizeChange( cell && cell.element );
      if ( !this.options.freeScroll ) this.positionSliderAtSelected();
    };
    imagesLoaded( this.slider ).on( 'progress', onImagesLoadedProgress );
  };

  return Flickity;

  } ) );
  }(imagesloaded$1));

  /*!
   * Flickity v3.0.0
   * Touch, responsive, flickable carousels
   *
   * Licensed GPLv3 for open source use
   * or Flickity Commercial License for commercial use
   *
   * https://flickity.metafizzy.co
   * Copyright 2015-2022 Metafizzy
   */

  (function (module) {
  if ( module.exports ) {
    const Flickity = core.exports;
    
    
    
    
    
    
    

    module.exports = Flickity;
  }
  }(js$1));

  var js = js$1.exports;

  var flickityFade$1 = {exports: {}};

  /**
   * Flickity fade v2.0.0
   * Fade between Flickity slides
   */

  (function (module) {
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          js$1.exports,
          utils.exports,
      );
    } else {
      // browser global
      factory(
          window.Flickity,
          window.fizzyUIUtils,
      );
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal, function factory( Flickity, utils ) {

  // ---- Slide ---- //

  let Slide = Flickity.Slide;

  Slide.prototype.renderFadePosition = function() {
  };

  Slide.prototype.setOpacity = function( alpha ) {
    this.cells.forEach( ( cell ) => {
      cell.element.style.opacity = alpha;
    } );
  };

  // ---- Flickity ---- //

  Flickity.create.fade = function() {
    this.fadeIndex = this.selectedIndex;
    this.prevSelectedIndex = this.selectedIndex;
    this.on( 'select', this.onSelectFade );
    this.on( 'dragEnd', this.onDragEndFade );
    this.on( 'settle', this.onSettleFade );
    this.on( 'activate', this.onActivateFade );
    this.on( 'deactivate', this.onDeactivateFade );
  };

  let proto = Flickity.prototype;

  let updateSlides = proto.updateSlides;
  proto.updateSlides = function() {
    updateSlides.apply( this, arguments );
    if ( !this.options.fade ) return;

    this.slides.forEach( ( slide, i ) => {
      // position cells at selected target
      let slideTargetX = slide.target - slide.x;
      let firstCellX = slide.cells[0].x;
      slide.cells.forEach( ( cell ) => {
        let targetX = cell.x - firstCellX - slideTargetX;
        this._renderCellPosition( cell, targetX );
      } );
      // set initial opacity
      let alpha = i === this.selectedIndex ? 1 : 0;
      slide.setOpacity( alpha );
    } );
  };

  /* ---- events ---- */

  proto.onSelectFade = function() {
    // in case of resize, keep fadeIndex within current count
    this.fadeIndex = Math.min( this.prevSelectedIndex, this.slides.length - 1 );
    this.prevSelectedIndex = this.selectedIndex;
  };

  proto.onSettleFade = function() {
    delete this.didDragEnd;
    if ( !this.options.fade ) return;

    // set full and 0 opacity on selected & faded slides
    this.selectedSlide.setOpacity( 1 );
    let fadedSlide = this.slides[ this.fadeIndex ];
    if ( fadedSlide && this.fadeIndex !== this.selectedIndex ) {
      this.slides[ this.fadeIndex ].setOpacity( 0 );
    }
  };

  proto.onDragEndFade = function() {
    // set flag
    this.didDragEnd = true;
  };

  proto.onActivateFade = function() {
    if ( this.options.fade ) {
      this.element.classList.add('is-fade');
    }
  };

  proto.onDeactivateFade = function() {
    if ( !this.options.fade ) return;

    this.element.classList.remove('is-fade');
    // reset opacity
    this.slides.forEach( ( slide ) => {
      slide.setOpacity('');
    } );
  };

  /* ---- position & fading ---- */

  let positionSlider = proto.positionSlider;
  proto.positionSlider = function() {
    if ( !this.options.fade ) {
      positionSlider.apply( this, arguments );
      return;
    }

    this.fadeSlides();
    this.dispatchScrollEvent();
  };

  let positionSliderAtSelected = proto.positionSliderAtSelected;
  proto.positionSliderAtSelected = function() {
    if ( this.options.fade ) {
      // position fade slider at origin
      this.setTranslateX( 0 );
    }
    positionSliderAtSelected.apply( this, arguments );
  };

  proto.fadeSlides = function() {
    if ( this.slides.length < 2 ) return;

    // get slides to fade-in & fade-out
    let indexes = this.getFadeIndexes();
    let fadeSlideA = this.slides[ indexes.a ];
    let fadeSlideB = this.slides[ indexes.b ];
    let distance = this.wrapDifference( fadeSlideA.target, fadeSlideB.target );
    let progress = this.wrapDifference( fadeSlideA.target, -this.x );
    progress /= distance;

    fadeSlideA.setOpacity( 1 - progress );
    fadeSlideB.setOpacity( progress );

    // hide previous slide
    let fadeHideIndex = indexes.a;
    if ( this.isDragging ) {
      fadeHideIndex = progress > 0.5 ? indexes.a : indexes.b;
    }
    let isNewHideIndex = this.fadeHideIndex !== undefined &&
      this.fadeHideIndex !== fadeHideIndex &&
      this.fadeHideIndex !== indexes.a &&
      this.fadeHideIndex !== indexes.b;
    if ( isNewHideIndex ) {
      // new fadeHideSlide set, hide previous
      this.slides[ this.fadeHideIndex ].setOpacity( 0 );
    }
    this.fadeHideIndex = fadeHideIndex;
  };

  proto.getFadeIndexes = function() {
    if ( !this.isDragging && !this.didDragEnd ) {
      return {
        a: this.fadeIndex,
        b: this.selectedIndex,
      };
    }
    if ( this.options.wrapAround ) {
      return this.getFadeDragWrapIndexes();
    } else {
      return this.getFadeDragLimitIndexes();
    }
  };

  proto.getFadeDragWrapIndexes = function() {
    let distances = this.slides.map( function( slide, i ) {
      return this.getSlideDistance( -this.x, i );
    }, this );
    let absDistances = distances.map( function( distance ) {
      return Math.abs( distance );
    } );
    let minDistance = Math.min( ...absDistances );
    let closestIndex = absDistances.indexOf( minDistance );
    let distance = distances[ closestIndex ];
    let len = this.slides.length;

    let delta = distance >= 0 ? 1 : -1;
    return {
      a: closestIndex,
      b: utils.modulo( closestIndex + delta, len ),
    };
  };

  proto.getFadeDragLimitIndexes = function() {
    // calculate closest previous slide
    let dragIndex = 0;
    for ( let i = 0; i < this.slides.length - 1; i++ ) {
      let slide = this.slides[i];
      if ( -this.x < slide.target ) {
        break;
      }
      dragIndex = i;
    }
    return {
      a: dragIndex,
      b: dragIndex + 1,
    };
  };

  proto.wrapDifference = function( a, b ) {
    let diff = b - a;
    if ( !this.options.wrapAround ) return diff;

    let diffPlus = diff + this.slideableWidth;
    let diffMinus = diff - this.slideableWidth;
    if ( Math.abs( diffPlus ) < Math.abs( diff ) ) {
      diff = diffPlus;
    }
    if ( Math.abs( diffMinus ) < Math.abs( diff ) ) {
      diff = diffMinus;
    }
    return diff;
  };

  // ---- wrapAround ---- //

  let _updateWrapShiftCells = proto._updateWrapShiftCells;
  proto._updateWrapShiftCells = function() {
    if ( this.options.fade ) {
      // update isWrapping
      this.isWrapping = this.getIsWrapping();
    } else {
      _updateWrapShiftCells.apply( this, arguments );
    }
  };

  let shiftWrapCells = proto.shiftWrapCells;
  proto.shiftWrapCells = function() {
    if ( !this.options.fade ) {
      shiftWrapCells.apply( this, arguments );
    }
  };

  return Flickity;

  } ) );
  }(flickityFade$1));

  var flickityFade = flickityFade$1.exports;

  var flickitySync$1 = {exports: {}};

  /*!
   * Flickity sync v2.0.0
   * enable sync for Flickity
   */

  (function (module) {
  ( function( window, factory ) {
    // universal module definition
    if ( module.exports ) {
      // CommonJS
      module.exports = factory(
          js$1.exports,
          utils.exports,
      );
    } else {
      // browser global
      factory(
          window.Flickity,
          window.fizzyUIUtils,
      );
    }

  }( typeof window != 'undefined' ? window : commonjsGlobal, function factory( Flickity, utils ) {

  // -------------------------- sync prototype -------------------------- //

  // Flickity.defaults.sync = false;

  Flickity.create.sync = function() {
    this.syncers = {};
    let syncOption = this.options.sync;

    this.on( 'destroy', this.unsyncAll );

    if ( !syncOption ) return;
    // HACK do async, give time for other flickity to be initalized
    setTimeout( () => {
      this.sync( syncOption );
    } );
  };

  let proto = Flickity.prototype;

  /**
   * sync
   * @param {[Element, String]} elem
   */
  proto.sync = function( elem ) {
    elem = utils.getQueryElement( elem );
    let companion = Flickity.data( elem );
    if ( !companion ) return;
    // two hearts, that beat as one
    this._syncCompanion( companion );
    companion._syncCompanion( this );
  };

  /**
   * @param {Flickity} companion
   */
  proto._syncCompanion = function( companion ) {
    let _this = this;
    function syncListener() {
      let index = _this.selectedIndex;
      // do not select if already selected, prevent infinite loop
      if ( companion.selectedIndex !== index ) {
        companion.select( index );
      }
    }
    this.on( 'select', syncListener );
    // keep track of all synced flickities
    // hold on to listener to unsync
    this.syncers[ companion.guid ] = {
      flickity: companion,
      listener: syncListener,
    };
  };

  /**
   * unsync
   * @param {[Element, String]} elem
   */
  proto.unsync = function( elem ) {
    elem = utils.getQueryElement( elem );
    let companion = Flickity.data( elem );
    this._unsync( companion );
  };

  /**
   * @param {Flickity} companion
   */
  proto._unsync = function( companion ) {
    if ( !companion ) return;
    // I love you but I've chosen darkness
    this._unsyncCompanion( companion );
    companion._unsyncCompanion( this );
  };

  /**
   * @param {Flickity} companion
   */
  proto._unsyncCompanion = function( companion ) {
    let id = companion.guid;
    let syncer = this.syncers[ id ];
    this.off( 'select', syncer.listener );
    delete this.syncers[ id ];
  };

  proto.unsyncAll = function() {
    for ( let id in this.syncers ) {
      let syncer = this.syncers[ id ];
      this._unsync( syncer.flickity );
    }
  };

  // -----  ----- //

  return Flickity;

  } ) );
  }(flickitySync$1));

  var flickitySync = flickitySync$1.exports;

  var rellax$1 = {exports: {}};

  (function (module) {
  // ------------------------------------------
  // Rellax.js
  // Buttery smooth parallax library
  // Copyright (c) 2016 Moe Amaya (@moeamaya)
  // MIT license
  //
  // Thanks to Paraxify.js and Jaime Cabllero
  // for parallax concepts
  // ------------------------------------------

  (function (root, factory) {
    if (module.exports) {
      // Node. Does not work with strict CommonJS, but
      // only CommonJS-like environments that support module.exports,
      // like Node.
      module.exports = factory();
    } else {
      // Browser globals (root is window)
      root.Rellax = factory();
    }
  }(typeof window !== "undefined" ? window : commonjsGlobal, function () {
    var Rellax = function(el, options){

      var self = Object.create(Rellax.prototype);

      var posY = 0;
      var screenY = 0;
      var posX = 0;
      var screenX = 0;
      var blocks = [];
      var pause = true;

      // check what requestAnimationFrame to use, and if
      // it's not supported, use the onscroll event
      var loop = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        function(callback){ return setTimeout(callback, 1000 / 60); };

      // store the id for later use
      var loopId = null;

      // Test via a getter in the options object to see if the passive property is accessed
      var supportsPassive = false;
      try {
        var opts = Object.defineProperty({}, 'passive', {
          get: function() {
            supportsPassive = true;
          }
        });
        window.addEventListener("testPassive", null, opts);
        window.removeEventListener("testPassive", null, opts);
      } catch (e) {}

      // check what cancelAnimation method to use
      var clearLoop = window.cancelAnimationFrame || window.mozCancelAnimationFrame || clearTimeout;

      // check which transform property to use
      var transformProp = window.transformProp || (function(){
          var testEl = document.createElement('div');
          if (testEl.style.transform === null) {
            var vendors = ['Webkit', 'Moz', 'ms'];
            for (var vendor in vendors) {
              if (testEl.style[ vendors[vendor] + 'Transform' ] !== undefined) {
                return vendors[vendor] + 'Transform';
              }
            }
          }
          return 'transform';
        })();

      // Default Settings
      self.options = {
        speed: -2,
        center: false,
        wrapper: null,
        relativeToWrapper: false,
        round: true,
        vertical: true,
        frame: null,
        horizontal: false,
        callback: function() {},
      };

      // User defined options (might have more in the future)
      if (options){
        Object.keys(options).forEach(function(key){
          self.options[key] = options[key];
        });
      }

      // By default, rellax class
      if (!el) {
        el = '.rellax';
      }

      // check if el is a className or a node
      var elements = typeof el === 'string' ? document.querySelectorAll(el) : [el];

      // Now query selector
      if (elements.length > 0) {
        self.elems = elements;
      }

      // The elements don't exist
      else {
        console.warn("Rellax: The elements you're trying to select don't exist.");
        return;
      }

      // Has a wrapper and it exists
      if (self.options.wrapper) {
        if (!self.options.wrapper.nodeType) {
          var wrapper = document.querySelector(self.options.wrapper);

          if (wrapper) {
            self.options.wrapper = wrapper;
          } else {
            console.warn("Rellax: The wrapper you're trying to use doesn't exist.");
            return;
          }
        }
      }

      // Has a frame and it exists
      if (self.options.frame) {
        if (!self.options.frame.nodeType) {
          var frame = document.querySelector(self.options.frame);

          if (frame) {
            self.options.frame = frame;
          } else {
            console.warn("Rellax: The frame you're trying to use doesn't exist.");
            return;
          }
        }
      }


      // Get and cache initial position of all elements
      var cacheBlocks = function() {
        for (var i = 0; i < self.elems.length; i++){
          var block = createBlock(self.elems[i]);
          blocks.push(block);
        }
      };


      // Let's kick this script off
      // Build array for cached element values
      var init = function() {
        for (var i = 0; i < blocks.length; i++){
          self.elems[i].style.cssText = blocks[i].style;
        }

        blocks = [];

        screenY = window.innerHeight;
        screenX = window.innerWidth;
        setPosition();

        cacheBlocks();

        animate();

        // If paused, unpause and set listener for window resizing events
        if (pause) {
          window.addEventListener('resize', init);
          pause = false;
          // Start the loop
          update();
        }
      };

      // We want to cache the parallax blocks'
      // values: base, top, height, speed
      // el: is dom object, return: el cache values
      var createBlock = function(el) {
        var dataPercentage = el.getAttribute( 'data-rellax-percentage' );
        var dataSpeed = el.getAttribute( 'data-rellax-speed' );
        var dataZindex = el.getAttribute( 'data-rellax-zindex' ) || 0;
        var dataMin = el.getAttribute( 'data-rellax-min' );
        var dataMax = el.getAttribute( 'data-rellax-max' );

        // initializing at scrollY = 0 (top of browser), scrollX = 0 (left of browser)
        // ensures elements are positioned based on HTML layout.
        //
        // If the element has the percentage attribute, the posY and posX needs to be
        // the current scroll position's value, so that the elements are still positioned based on HTML layout
        var wrapperPosY = self.options.wrapper ? self.options.wrapper.scrollTop : (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);
        // If the option relativeToWrapper is true, use the wrappers offset to top, subtracted from the current page scroll.
        if (self.options.relativeToWrapper) {
          var scrollPosY = (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);
          wrapperPosY = scrollPosY - self.options.wrapper.offsetTop;
        }
        var posY = self.options.vertical ? ( dataPercentage || self.options.center ? wrapperPosY : 0 ) : 0;
        var posX = self.options.horizontal ? ( dataPercentage || self.options.center ? self.options.wrapper ? self.options.wrapper.scrollLeft : (window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft) : 0 ) : 0;

        var blockTop = posY + el.getBoundingClientRect().top;
        var blockHeight = el.clientHeight || el.offsetHeight || el.scrollHeight;

        var blockLeft = posX + el.getBoundingClientRect().left;
        var blockWidth = el.clientWidth || el.offsetWidth || el.scrollWidth;

        // apparently parallax equation everyone uses
        var percentageY = dataPercentage ? dataPercentage : (posY - blockTop + screenY) / (blockHeight + screenY);
        var percentageX = dataPercentage ? dataPercentage : (posX - blockLeft + screenX) / (blockWidth + screenX);
        if(self.options.center){ percentageX = 0.5; percentageY = 0.5; }

        // Optional individual block speed as data attr, otherwise global speed
        var speed = dataSpeed ? dataSpeed : self.options.speed;

        if (self.options.frame) {
          var frame = self.options.frame;
          var frameHeight = frame.clientHeight || frame.offsetHeight || frame.scrollHeight;
          var overlap = blockHeight - frameHeight;
          speed = (overlap)/100 * -1;
          dataMin = (overlap/2) * -1;
          dataMax = overlap/2;
        }

        var bases = updatePosition(percentageX, percentageY, speed);

        // ~~Store non-translate3d transforms~~
        // Store inline styles and extract transforms
        var style = el.style.cssText;
        var transform = '';

        // Check if there's an inline styled transform
        var searchResult = /transform\s*:/i.exec(style);
        if (searchResult) {
          // Get the index of the transform
          var index = searchResult.index;

          // Trim the style to the transform point and get the following semi-colon index
          var trimmedStyle = style.slice(index);
          var delimiter = trimmedStyle.indexOf(';');

          // Remove "transform" string and save the attribute
          if (delimiter) {
            transform = " " + trimmedStyle.slice(11, delimiter).replace(/\s/g,'');
          } else {
            transform = " " + trimmedStyle.slice(11).replace(/\s/g,'');
          }
        }

        return {
          baseX: bases.x,
          baseY: bases.y,
          top: blockTop,
          left: blockLeft,
          height: blockHeight,
          width: blockWidth,
          speed: speed,
          style: style,
          transform: transform,
          zindex: dataZindex,
          min: dataMin,
          max: dataMax
        };
      };

      // set scroll position (posY, posX)
      // side effect method is not ideal, but okay for now
      // returns true if the scroll changed, false if nothing happened
      var setPosition = function() {
        var oldY = posY;
        var oldX = posX;

        posY = self.options.wrapper ? self.options.wrapper.scrollTop : (document.documentElement || document.body.parentNode || document.body).scrollTop || window.pageYOffset;
        posX = self.options.wrapper ? self.options.wrapper.scrollLeft : (document.documentElement || document.body.parentNode || document.body).scrollLeft || window.pageXOffset;
        // If option relativeToWrapper is true, use relative wrapper value instead.
        if (self.options.relativeToWrapper) {
          var scrollPosY = (document.documentElement || document.body.parentNode || document.body).scrollTop || window.pageYOffset;
          posY = scrollPosY - self.options.wrapper.offsetTop;
        }


        if (oldY != posY && self.options.vertical) {
          // scroll changed, return true
          return true;
        }

        if (oldX != posX && self.options.horizontal) {
          // scroll changed, return true
          return true;
        }

        // scroll did not change
        return false;
      };

      // Ahh a pure function, gets new transform value
      // based on scrollPosition and speed
      // Allow for decimal pixel values
      var updatePosition = function(percentageX, percentageY, speed) {
        var result = {};
        var valueX = (speed * (100 * (1 - percentageX)));
        var valueY = (speed * (100 * (1 - percentageY)));

        result.x = self.options.round ? Math.round(valueX) : Math.round(valueX * 100) / 100;
        result.y = self.options.round ? Math.round(valueY) : Math.round(valueY * 100) / 100;

        return result;
      };

      // Remove event listeners and loop again
      var deferredUpdate = function() {
        window.removeEventListener('resize', deferredUpdate);
        window.removeEventListener('orientationchange', deferredUpdate);
        (self.options.wrapper ? self.options.wrapper : window).removeEventListener('scroll', deferredUpdate);
        (self.options.wrapper ? self.options.wrapper : document).removeEventListener('touchmove', deferredUpdate);

        // loop again
        loopId = loop(update);
      };

      // Loop
      var update = function() {
        if (setPosition() && pause === false) {
          animate();

          // loop again
          loopId = loop(update);
        } else {
          loopId = null;

          // Don't animate until we get a position updating event
          window.addEventListener('resize', deferredUpdate);
          window.addEventListener('orientationchange', deferredUpdate);
          (self.options.wrapper ? self.options.wrapper : window).addEventListener('scroll', deferredUpdate, supportsPassive ? { passive: true } : false);
          (self.options.wrapper ? self.options.wrapper : document).addEventListener('touchmove', deferredUpdate, supportsPassive ? { passive: true } : false);
        }
      };

      // Transform3d on parallax element
      var animate = function() {
        var positions;
        for (var i = 0; i < self.elems.length; i++){
          var percentageY = ((posY - blocks[i].top + screenY) / (blocks[i].height + screenY));
          var percentageX = ((posX - blocks[i].left + screenX) / (blocks[i].width + screenX));

          // Subtracting initialize value, so element stays in same spot as HTML
          positions = updatePosition(percentageX, percentageY, blocks[i].speed);// - blocks[i].baseX;
          var positionY = positions.y - blocks[i].baseY;
          var positionX = positions.x - blocks[i].baseX;

          // The next two "if" blocks go like this:
          // Check if a limit is defined (first "min", then "max");
          // Check if we need to change the Y or the X
          // (Currently working only if just one of the axes is enabled)
          // Then, check if the new position is inside the allowed limit
          // If so, use new position. If not, set position to limit.

          // Check if a min limit is defined
          if (blocks[i].min !== null) {
            if (self.options.vertical && !self.options.horizontal) {
              positionY = positionY <= blocks[i].min ? blocks[i].min : positionY;
            }
            if (self.options.horizontal && !self.options.vertical) {
              positionX = positionX <= blocks[i].min ? blocks[i].min : positionX;
            }
          }

          // Check if a max limit is defined
          if (blocks[i].max !== null) {
            if (self.options.vertical && !self.options.horizontal) {
              positionY = positionY >= blocks[i].max ? blocks[i].max : positionY;
            }
            if (self.options.horizontal && !self.options.vertical) {
              positionX = positionX >= blocks[i].max ? blocks[i].max : positionX;
            }
          }

          var zindex = blocks[i].zindex;

          // Move that element
          // (Set the new translation and append initial inline transforms.)
          var translate = 'translate3d(' + (self.options.horizontal ? positionX : '0') + 'px,' + (self.options.vertical ? positionY : '0') + 'px,' + zindex + 'px) ' + blocks[i].transform;
          self.elems[i].style[transformProp] = translate;
        }
        self.options.callback(positions);
      };

      self.destroy = function() {
        for (var i = 0; i < self.elems.length; i++){
          self.elems[i].style.cssText = blocks[i].style;
        }

        // Remove resize event listener if not pause, and pause
        if (!pause) {
          window.removeEventListener('resize', init);
          pause = true;
        }

        // Clear the animation loop to prevent possible memory leak
        clearLoop(loopId);
        loopId = null;
      };

      // Init
      init();

      // Allow to recalculate the initial values whenever we want
      self.refresh = init;

      return self;
    };
    return Rellax;
  }));
  }(rellax$1));

  var rellax = rellax$1.exports;

  var squirrelly_min$2 = {exports: {}};

  (function (module, exports) {
  !function(e,t){t(exports);}(commonjsGlobal,(function(e){function t(e){var n,r,a=new Error(e);return n=a,r=t.prototype,Object.setPrototypeOf?Object.setPrototypeOf(n,r):n.__proto__=r,a}function n(e,n,r){var a=n.slice(0,r).split(/\n/),i=a.length,s=a[i-1].length+1;throw t(e+=" at line "+i+" col "+s+":\n\n  "+n.split(/\n/)[i-1]+"\n  "+Array(s).join(" ")+"^")}t.prototype=Object.create(Error.prototype,{name:{value:"Squirrelly Error",enumerable:!1}});var r=new Function("return this")().Promise,a=!1;try{a=new Function("return (async function(){}).constructor")();}catch(e){if(!(e instanceof SyntaxError))throw e}function i(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function s(e,t,n){for(var r in t)i(t,r)&&(null==t[r]||"object"!=typeof t[r]||"storage"!==r&&"prefixes"!==r||n?e[r]=t[r]:e[r]=s({},t[r]));return e}var c=/^async +/,o=/`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})*}|(?!\${)[^\\`])*`/g,l=/'(?:\\[\s\w"'\\`]|[^\n\r'\\])*?'/g,f=/"(?:\\[\s\w"'\\`]|[^\n\r"\\])*?"/g,u=/[.*+\-?^${}()|[\]\\]/g;function p(e){return u.test(e)?e.replace(u,"\\$&"):e}function h(e,r){r.rmWhitespace&&(e=e.replace(/[\r\n]+/g,"\n").replace(/^\s+|\s+$/gm,"")),o.lastIndex=0,l.lastIndex=0,f.lastIndex=0;var a=r.prefixes,i=[a.h,a.b,a.i,a.r,a.c,a.e].reduce((function(e,t){return e&&t?e+"|"+p(t):t?p(t):e}),""),s=new RegExp("([|()]|=>)|('|\"|`|\\/\\*)|\\s*((\\/)?(-|_)?"+p(r.tags[1])+")","g"),u=new RegExp("([^]*?)"+p(r.tags[0])+"(-|_)?\\s*("+i+")?\\s*","g"),h=0,d=!1;function g(t,a){var i,p={f:[]},g=0,v="c";function m(t){var a=e.slice(h,t),i=a.trim();if("f"===v)"safe"===i?p.raw=!0:r.async&&c.test(i)?(i=i.replace(c,""),p.f.push([i,"",!0])):p.f.push([i,""]);else if("fp"===v)p.f[p.f.length-1][1]+=i;else if("err"===v){if(i){var s=a.search(/\S/);n("invalid syntax",e,h+s);}}else p[v]=i;h=t+1;}for("h"===a||"b"===a||"c"===a?v="n":"r"===a&&(p.raw=!0,a="i"),s.lastIndex=h;null!==(i=s.exec(e));){var y=i[1],x=i[2],b=i[3],w=i[4],F=i[5],S=i.index;if(y)"("===y?(0===g&&("n"===v?(m(S),v="p"):"f"===v&&(m(S),v="fp")),g++):")"===y?0===--g&&"c"!==v&&(m(S),v="err"):0===g&&"|"===y?(m(S),v="f"):"=>"===y&&(m(S),h+=1,v="res");else if(x){if("/*"===x){var I=e.indexOf("*/",s.lastIndex);-1===I&&n("unclosed comment",e,i.index),s.lastIndex=I+2;}else if("'"===x){l.lastIndex=i.index,l.exec(e)?s.lastIndex=l.lastIndex:n("unclosed string",e,i.index);}else if('"'===x){f.lastIndex=i.index,f.exec(e)?s.lastIndex=f.lastIndex:n("unclosed string",e,i.index);}else if("`"===x){o.lastIndex=i.index,o.exec(e)?s.lastIndex=o.lastIndex:n("unclosed string",e,i.index);}}else if(b)return m(S),h=S+i[0].length,u.lastIndex=h,d=F,w&&"h"===a&&(a="s"),p.t=a,p}return n("unclosed tag",e,t),p}var v=function i(s,o){s.b=[],s.d=[];var l,f=!1,p=[];function v(e,t){e&&(e=function(e,t,n,r){var a,i;return "string"==typeof t.autoTrim?a=i=t.autoTrim:Array.isArray(t.autoTrim)&&(a=t.autoTrim[1],i=t.autoTrim[0]),(n||!1===n)&&(a=n),(r||!1===r)&&(i=r),"slurp"===a&&"slurp"===i?e.trim():("_"===a||"slurp"===a?e=String.prototype.trimLeft?e.trimLeft():e.replace(/^[\s\uFEFF\xA0]+/,""):"-"!==a&&"nl"!==a||(e=e.replace(/^(?:\n|\r|\r\n)/,"")),"_"===i||"slurp"===i?e=String.prototype.trimRight?e.trimRight():e.replace(/[\s\uFEFF\xA0]+$/,""):"-"!==i&&"nl"!==i||(e=e.replace(/(?:\n|\r|\r\n)$/,"")),e)}(e,r,d,t))&&(e=e.replace(/\\|'/g,"\\$&").replace(/\r\n|\n|\r/g,"\\n"),p.push(e));}for(;null!==(l=u.exec(e));){var m,y=l[1],x=l[2],b=l[3]||"";for(var w in a)if(a[w]===b){m=w;break}v(y,x),h=l.index+l[0].length,m||n("unrecognized tag type: "+b,e,h);var F=g(l.index,m),S=F.t;if("h"===S){var I=F.n||"";r.async&&c.test(I)&&(F.a=!0,F.n=I.replace(c,"")),F=i(F),p.push(F);}else if("c"===S){if(s.n===F.n)return f?(f.d=p,s.b.push(f)):s.d=p,s;n("Helper start and end don't match",e,l.index+l[0].length);}else if("b"===S){f?(f.d=p,s.b.push(f)):s.d=p;var R=F.n||"";r.async&&c.test(R)&&(F.a=!0,F.n=R.replace(c,"")),f=F,p=[];}else if("s"===S){var T=F.n||"";r.async&&c.test(T)&&(F.a=!0,F.n=T.replace(c,"")),p.push(F);}else p.push(F);}if(!o)throw t('unclosed helper "'+s.n+'"');return v(e.slice(h,e.length),!1),s.d=p,s}({f:[]},!0);if(r.plugins)for(var m=0;m<r.plugins.length;m++){var y=r.plugins[m];y.processAST&&(v.d=y.processAST(v.d,r));}return v.d}function d(e,t){var n=h(e,t),r="var tR='';"+(t.useWith?"with("+t.varName+"||{}){":"")+x(n,t)+"if(cb){cb(null,tR)} return tR"+(t.useWith?"}":"");if(t.plugins)for(var a=0;a<t.plugins.length;a++){var i=t.plugins[a];i.processFnString&&(r=i.processFnString(r,t));}return r}function g(e,t){for(var n=0;n<t.length;n++){var r=t[n][0],a=t[n][1];e=(t[n][2]?"await ":"")+"c.l('F','"+r+"')("+e,a&&(e+=","+a),e+=")";}return e}function v(e,t,n,r,a,i){var s="{exec:"+(a?"async ":"")+y(n,t,e)+",params:["+r+"]";return i&&(s+=",name:'"+i+"'"),a&&(s+=",async:true"),s+="}"}function m(e,t){for(var n="[",r=0;r<e.length;r++){var a=e[r];n+=v(t,a.res||"",a.d,a.p||"",a.a,a.n),r<e.length&&(n+=",");}return n+="]"}function y(e,t,n){return "function("+t+"){var tR='';"+x(e,n)+"return tR}"}function x(e,t){for(var n=0,r=e.length,a="";n<r;n++){var i=e[n];if("string"==typeof i){a+="tR+='"+i+"';";}else {var s=i.t,c=i.c||"",o=i.f,l=i.n||"",f=i.p||"",u=i.res||"",p=i.b,h=!!i.a;if("i"===s){t.defaultFilter&&(c="c.l('F','"+t.defaultFilter+"')("+c+")");var d=g(c,o);!i.raw&&t.autoEscape&&(d="c.l('F','e')("+d+")"),a+="tR+="+d+";";}else if("h"===s)if(t.storage.nativeHelpers.get(l))a+=t.storage.nativeHelpers.get(l)(i,t);else {var y=(h?"await ":"")+"c.l('H','"+l+"')("+v(t,u,i.d,f,h);y+=p?","+m(p,t):",[]",a+="tR+="+g(y+=",c)",o)+";";}else "s"===s?a+="tR+="+g((h?"await ":"")+"c.l('H','"+l+"')({params:["+f+"]},[],c)",o)+";":"e"===s&&(a+=c+"\n");}}return a}var b=function(){function e(e){this.cache=e;}return e.prototype.define=function(e,t){this.cache[e]=t;},e.prototype.get=function(e){return this.cache[e]},e.prototype.remove=function(e){delete this.cache[e];},e.prototype.reset=function(){this.cache={};},e.prototype.load=function(e){s(this.cache,e,!0);},e}();function w(e,n,r,a){if(n&&n.length>0)throw t((a?"Native":"")+"Helper '"+e+"' doesn't accept blocks");if(r&&r.length>0)throw t((a?"Native":"")+"Helper '"+e+"' doesn't accept filters")}var F={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function S(e){return F[e]}var I=new b({}),R=new b({each:function(e,t){var n="",r=e.params[0];if(w("each",t,!1),e.async)return new Promise((function(t){!function e(t,n,r,a,i){r(t[n],n).then((function(s){a+=s,n===t.length-1?i(a):e(t,n+1,r,a,i);}));}(r,0,e.exec,n,t);}));for(var a=0;a<r.length;a++)n+=e.exec(r[a],a);return n},foreach:function(e,t){var n=e.params[0];if(w("foreach",t,!1),e.async)return new Promise((function(t){!function e(t,n,r,a,i,s){a(n[r],t[n[r]]).then((function(c){i+=c,r===n.length-1?s(i):e(t,n,r+1,a,i,s);}));}(n,Object.keys(n),0,e.exec,"",t);}));var r="";for(var a in n)i(n,a)&&(r+=e.exec(a,n[a]));return r},include:function(e,n,r){w("include",n,!1);var a=r.storage.templates.get(e.params[0]);if(!a)throw t('Could not fetch template "'+e.params[0]+'"');return a(e.params[1],r)},extends:function(e,n,r){var a=e.params[1]||{};a.content=e.exec();for(var i=0;i<n.length;i++){var s=n[i];a[s.name]=s.exec();}var c=r.storage.templates.get(e.params[0]);if(!c)throw t('Could not fetch template "'+e.params[0]+'"');return c(a,r)},useScope:function(e,t){return w("useScope",t,!1),e.exec(e.params[0])}}),T=new b({if:function(e,t){w("if",!1,e.f,!0);var n="if("+e.p+"){"+x(e.d,t)+"}";if(e.b)for(var r=0;r<e.b.length;r++){var a=e.b[r];"else"===a.n?n+="else{"+x(a.d,t)+"}":"elif"===a.n&&(n+="else if("+a.p+"){"+x(a.d,t)+"}");}return n},try:function(e,n){if(w("try",!1,e.f,!0),!e.b||1!==e.b.length||"catch"!==e.b[0].n)throw t("native helper 'try' only accepts 1 block, 'catch'");var r="try{"+x(e.d,n)+"}",a=e.b[0];return r+="catch"+(a.res?"("+a.res+")":"")+"{"+x(a.d,n)+"}"},block:function(e,t){return w("block",e.b,e.f,!0),"if(!"+t.varName+"["+e.p+"]){tR+=("+y(e.d,"",t)+")()}else{tR+="+t.varName+"["+e.p+"]}"}}),E=new b({e:function(e){var t=String(e);return /[&<>"']/.test(t)?t.replace(/[&<>"']/g,S):t}}),j={varName:"it",autoTrim:[!1,"nl"],autoEscape:!0,defaultFilter:!1,tags:["{{","}}"],l:function(e,n){if("H"===e){var r=this.storage.helpers.get(n);if(r)return r;throw t("Can't find helper '"+n+"'")}if("F"===e){var a=this.storage.filters.get(n);if(a)return a;throw t("Can't find filter '"+n+"'")}},async:!1,storage:{helpers:R,nativeHelpers:T,filters:E,templates:I},prefixes:{h:"@",b:"#",i:"",r:"*",c:"/",e:"!"},cache:!1,plugins:[],useWith:!1};function H(e,t){var n={};return s(n,j),t&&s(n,t),e&&s(n,e),n.l.bind(n),n}function O(e,n){var r=H(n||{}),i=Function;if(r.async){if(!a)throw t("This environment doesn't support async/await");i=a;}try{return new i(r.varName,"c","cb",d(e,r))}catch(n){throw n instanceof SyntaxError?t("Bad template syntax\n\n"+n.message+"\n"+Array(n.message.length+1).join("=")+"\n"+d(e,r)):n}}function _(e,t){var n;return t.cache&&t.name&&t.storage.templates.get(t.name)?t.storage.templates.get(t.name):(n="function"==typeof e?e:O(e,t),t.cache&&t.name&&t.storage.templates.define(t.name,n),n)}j.l.bind(j),e.compile=O,e.compileScope=x,e.compileScopeIntoFunction=y,e.compileToString=d,e.defaultConfig=j,e.filters=E,e.getConfig=H,e.helpers=R,e.nativeHelpers=T,e.parse=h,e.render=function(e,n,a,i){var s=H(a||{});if(!s.async)return _(e,s)(n,s);if(!i){if("function"==typeof r)return new r((function(t,r){try{t(_(e,s)(n,s));}catch(e){r(e);}}));throw t("Please provide a callback function, this env doesn't support Promises")}try{_(e,s)(n,s,i);}catch(e){return i(e)}},e.templates=I,Object.defineProperty(e,"__esModule",{value:!0});}));

  }(squirrelly_min$2, squirrelly_min$2.exports));

  var squirrelly_min = /*@__PURE__*/getDefaultExportFromCjs(squirrelly_min$2.exports);

  var squirrelly_min$1 = /*#__PURE__*/_mergeNamespaces({
    __proto__: null,
    default: squirrelly_min
  }, [squirrelly_min$2.exports]);

  exports.AOS = aos;
  exports.Flickity = js;
  exports.FlickityFade = flickityFade;
  exports.FlickitySync = flickitySync;
  exports.MicroModal = MicroModal;
  exports.Rellax = rellax;
  exports.ScrollLock = scrollLock$1;
  exports.Sqrl = squirrelly_min$1;
  exports.axios = redaxios_module;
  exports.themeAddresses = themeAddresses;
  exports.themeCurrency = currency;

  return exports;

})({});
