(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // ../erpnext/node_modules/onscan.js/onscan.js
  var require_onscan = __commonJS({
    "../erpnext/node_modules/onscan.js/onscan.js"(exports, module) {
      (function(global, factory) {
        typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory()) : global.onScan = factory();
      })(exports, function() {
        var onScan2 = {
          attachTo: function(oDomElement, oOptions) {
            if (oDomElement.scannerDetectionData !== void 0) {
              throw new Error("onScan.js is already initialized for DOM element " + oDomElement);
            }
            var oDefaults = {
              onScan: function(sScanned, iQty) {
              },
              onScanError: function(oDebug) {
              },
              onKeyProcess: function(sChar, oEvent) {
              },
              onKeyDetect: function(iKeyCode, oEvent) {
              },
              onPaste: function(sPasted, oEvent) {
              },
              keyCodeMapper: function(oEvent) {
                return onScan2.decodeKeyEvent(oEvent);
              },
              onScanButtonLongPress: function() {
              },
              scanButtonKeyCode: false,
              scanButtonLongPressTime: 500,
              timeBeforeScanTest: 100,
              avgTimeByChar: 30,
              minLength: 6,
              suffixKeyCodes: [9, 13],
              prefixKeyCodes: [],
              ignoreIfFocusOn: false,
              stopPropagation: false,
              preventDefault: false,
              captureEvents: false,
              reactToKeydown: true,
              reactToPaste: false,
              singleScanQty: 1
            };
            oOptions = this._mergeOptions(oDefaults, oOptions);
            oDomElement.scannerDetectionData = {
              options: oOptions,
              vars: {
                firstCharTime: 0,
                lastCharTime: 0,
                accumulatedString: "",
                testTimer: false,
                longPressTimeStart: 0,
                longPressed: false
              }
            };
            if (oOptions.reactToPaste === true) {
              oDomElement.addEventListener("paste", this._handlePaste, oOptions.captureEvents);
            }
            if (oOptions.scanButtonKeyCode !== false) {
              oDomElement.addEventListener("keyup", this._handleKeyUp, oOptions.captureEvents);
            }
            if (oOptions.reactToKeydown === true || oOptions.scanButtonKeyCode !== false) {
              oDomElement.addEventListener("keydown", this._handleKeyDown, oOptions.captureEvents);
            }
            return this;
          },
          detachFrom: function(oDomElement) {
            if (oDomElement.scannerDetectionData.options.reactToPaste) {
              oDomElement.removeEventListener("paste", this._handlePaste);
            }
            if (oDomElement.scannerDetectionData.options.scanButtonKeyCode !== false) {
              oDomElement.removeEventListener("keyup", this._handleKeyUp);
            }
            oDomElement.removeEventListener("keydown", this._handleKeyDown);
            oDomElement.scannerDetectionData = void 0;
            return;
          },
          getOptions: function(oDomElement) {
            return oDomElement.scannerDetectionData.options;
          },
          setOptions: function(oDomElement, oOptions) {
            switch (oDomElement.scannerDetectionData.options.reactToPaste) {
              case true:
                if (oOptions.reactToPaste === false) {
                  oDomElement.removeEventListener("paste", this._handlePaste);
                }
                break;
              case false:
                if (oOptions.reactToPaste === true) {
                  oDomElement.addEventListener("paste", this._handlePaste);
                }
                break;
            }
            switch (oDomElement.scannerDetectionData.options.scanButtonKeyCode) {
              case false:
                if (oOptions.scanButtonKeyCode !== false) {
                  oDomElement.addEventListener("keyup", this._handleKeyUp);
                }
                break;
              default:
                if (oOptions.scanButtonKeyCode === false) {
                  oDomElement.removeEventListener("keyup", this._handleKeyUp);
                }
                break;
            }
            oDomElement.scannerDetectionData.options = this._mergeOptions(oDomElement.scannerDetectionData.options, oOptions);
            this._reinitialize(oDomElement);
            return this;
          },
          decodeKeyEvent: function(oEvent) {
            var iCode = this._getNormalizedKeyNum(oEvent);
            switch (true) {
              case (iCode >= 48 && iCode <= 90):
              case (iCode >= 106 && iCode <= 111):
                if (oEvent.key !== void 0 && oEvent.key !== "") {
                  return oEvent.key;
                }
                var sDecoded = String.fromCharCode(iCode);
                switch (oEvent.shiftKey) {
                  case false:
                    sDecoded = sDecoded.toLowerCase();
                    break;
                  case true:
                    sDecoded = sDecoded.toUpperCase();
                    break;
                }
                return sDecoded;
              case (iCode >= 96 && iCode <= 105):
                return 0 + (iCode - 96);
            }
            return "";
          },
          simulate: function(oDomElement, mStringOrArray) {
            this._reinitialize(oDomElement);
            if (Array.isArray(mStringOrArray)) {
              mStringOrArray.forEach(function(mKey) {
                var oEventProps = {};
                if ((typeof mKey === "object" || typeof mKey === "function") && mKey !== null) {
                  oEventProps = mKey;
                } else {
                  oEventProps.keyCode = parseInt(mKey);
                }
                var oEvent = new KeyboardEvent("keydown", oEventProps);
                document.dispatchEvent(oEvent);
              });
            } else {
              this._validateScanCode(oDomElement, mStringOrArray);
            }
            return this;
          },
          _reinitialize: function(oDomElement) {
            var oVars = oDomElement.scannerDetectionData.vars;
            oVars.firstCharTime = 0;
            oVars.lastCharTime = 0;
            oVars.accumulatedString = "";
            return;
          },
          _isFocusOnIgnoredElement: function(oDomElement) {
            var ignoreSelectors = oDomElement.scannerDetectionData.options.ignoreIfFocusOn;
            if (!ignoreSelectors) {
              return false;
            }
            var oFocused = document.activeElement;
            if (Array.isArray(ignoreSelectors)) {
              for (var i = 0; i < ignoreSelectors.length; i++) {
                if (oFocused.matches(ignoreSelectors[i]) === true) {
                  return true;
                }
              }
            } else if (oFocused.matches(ignoreSelectors)) {
              return true;
            }
            return false;
          },
          _validateScanCode: function(oDomElement, sScanCode) {
            var oScannerData = oDomElement.scannerDetectionData;
            var oOptions = oScannerData.options;
            var iSingleScanQty = oScannerData.options.singleScanQty;
            var iFirstCharTime = oScannerData.vars.firstCharTime;
            var iLastCharTime = oScannerData.vars.lastCharTime;
            var oScanError = {};
            var oEvent;
            switch (true) {
              case sScanCode.length < oOptions.minLength:
                oScanError = {
                  message: "Receieved code is shorter then minimal length"
                };
                break;
              case iLastCharTime - iFirstCharTime > sScanCode.length * oOptions.avgTimeByChar:
                oScanError = {
                  message: "Receieved code was not entered in time"
                };
                break;
              default:
                oOptions.onScan.call(oDomElement, sScanCode, iSingleScanQty);
                oEvent = new CustomEvent(
                  "scan",
                  {
                    detail: {
                      scanCode: sScanCode,
                      qty: iSingleScanQty
                    }
                  }
                );
                oDomElement.dispatchEvent(oEvent);
                onScan2._reinitialize(oDomElement);
                return true;
            }
            oScanError.scanCode = sScanCode;
            oScanError.scanDuration = iLastCharTime - iFirstCharTime;
            oScanError.avgTimeByChar = oOptions.avgTimeByChar;
            oScanError.minLength = oOptions.minLength;
            oOptions.onScanError.call(oDomElement, oScanError);
            oEvent = new CustomEvent(
              "scanError",
              { detail: oScanError }
            );
            oDomElement.dispatchEvent(oEvent);
            onScan2._reinitialize(oDomElement);
            return false;
          },
          _mergeOptions: function(oDefaults, oOptions) {
            var oExtended = {};
            var prop;
            for (prop in oDefaults) {
              if (Object.prototype.hasOwnProperty.call(oDefaults, prop)) {
                oExtended[prop] = oDefaults[prop];
              }
            }
            for (prop in oOptions) {
              if (Object.prototype.hasOwnProperty.call(oOptions, prop)) {
                oExtended[prop] = oOptions[prop];
              }
            }
            return oExtended;
          },
          _getNormalizedKeyNum: function(e) {
            return e.which || e.keyCode;
          },
          _handleKeyDown: function(e) {
            var iKeyCode = onScan2._getNormalizedKeyNum(e);
            var oOptions = this.scannerDetectionData.options;
            var oVars = this.scannerDetectionData.vars;
            var bScanFinished = false;
            if (oOptions.onKeyDetect.call(this, iKeyCode, e) === false) {
              return;
            }
            if (onScan2._isFocusOnIgnoredElement(this)) {
              return;
            }
            if (oOptions.scanButtonKeyCode !== false && iKeyCode == oOptions.scanButtonKeyCode) {
              if (!oVars.longPressed) {
                oVars.longPressTimer = setTimeout(oOptions.onScanButtonLongPress, oOptions.scanButtonLongPressTime, this);
                oVars.longPressed = true;
              }
              return;
            }
            switch (true) {
              case (oVars.firstCharTime && oOptions.suffixKeyCodes.indexOf(iKeyCode) !== -1):
                e.preventDefault();
                e.stopImmediatePropagation();
                bScanFinished = true;
                break;
              case (!oVars.firstCharTime && oOptions.prefixKeyCodes.indexOf(iKeyCode) !== -1):
                e.preventDefault();
                e.stopImmediatePropagation();
                bScanFinished = false;
                break;
              default:
                var character = oOptions.keyCodeMapper.call(this, e);
                if (character === null) {
                  return;
                }
                oVars.accumulatedString += character;
                if (oOptions.preventDefault) {
                  e.preventDefault();
                }
                if (oOptions.stopPropagation) {
                  e.stopImmediatePropagation();
                }
                bScanFinished = false;
                break;
            }
            if (!oVars.firstCharTime) {
              oVars.firstCharTime = Date.now();
            }
            oVars.lastCharTime = Date.now();
            if (oVars.testTimer) {
              clearTimeout(oVars.testTimer);
            }
            if (bScanFinished) {
              onScan2._validateScanCode(this, oVars.accumulatedString);
              oVars.testTimer = false;
            } else {
              oVars.testTimer = setTimeout(onScan2._validateScanCode, oOptions.timeBeforeScanTest, this, oVars.accumulatedString);
            }
            oOptions.onKeyProcess.call(this, character, e);
            return;
          },
          _handlePaste: function(e) {
            var oOptions = this.scannerDetectionData.options;
            var oVars = this.scannerDetectionData.vars;
            var sPasteString = (event.clipboardData || window.clipboardData).getData("text");
            if (onScan2._isFocusOnIgnoredElement(this)) {
              return;
            }
            e.preventDefault();
            if (oOptions.stopPropagation) {
              e.stopImmediatePropagation();
            }
            oOptions.onPaste.call(this, sPasteString, event);
            oVars.firstCharTime = 0;
            oVars.lastCharTime = 0;
            onScan2._validateScanCode(this, sPasteString);
            return;
          },
          _handleKeyUp: function(e) {
            if (onScan2._isFocusOnIgnoredElement(this)) {
              return;
            }
            var iKeyCode = onScan2._getNormalizedKeyNum(e);
            if (iKeyCode == this.scannerDetectionData.options.scanButtonKeyCode) {
              clearTimeout(this.scannerDetectionData.vars.longPressTimer);
              this.scannerDetectionData.vars.longPressed = false;
            }
            return;
          },
          isScanInProgressFor: function(oDomElement) {
            return oDomElement.scannerDetectionData.vars.firstCharTime > 0;
          },
          isAttachedTo: function(oDomElement) {
            return oDomElement.scannerDetectionData !== void 0;
          }
        };
        return onScan2;
      });
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/Barcode.js
  var require_Barcode = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/Barcode.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      var Barcode = function Barcode2(data, options) {
        _classCallCheck(this, Barcode2);
        this.data = data;
        this.text = options.text || data;
        this.options = options;
      };
      exports.default = Barcode;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/CODE39/index.js
  var require_CODE39 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/CODE39/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.CODE39 = void 0;
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _Barcode2 = require_Barcode();
      var _Barcode3 = _interopRequireDefault(_Barcode2);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var CODE39 = function(_Barcode) {
        _inherits(CODE392, _Barcode);
        function CODE392(data, options) {
          _classCallCheck(this, CODE392);
          data = data.toUpperCase();
          if (options.mod43) {
            data += getCharacter(mod43checksum(data));
          }
          return _possibleConstructorReturn(this, (CODE392.__proto__ || Object.getPrototypeOf(CODE392)).call(this, data, options));
        }
        _createClass(CODE392, [{
          key: "encode",
          value: function encode() {
            var result = getEncoding("*");
            for (var i = 0; i < this.data.length; i++) {
              result += getEncoding(this.data[i]) + "0";
            }
            result += getEncoding("*");
            return {
              data: result,
              text: this.text
            };
          }
        }, {
          key: "valid",
          value: function valid() {
            return this.data.search(/^[0-9A-Z\-\.\ \$\/\+\%]+$/) !== -1;
          }
        }]);
        return CODE392;
      }(_Barcode3.default);
      var characters = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "-", ".", " ", "$", "/", "+", "%", "*"];
      var encodings = [20957, 29783, 23639, 30485, 20951, 29813, 23669, 20855, 29789, 23645, 29975, 23831, 30533, 22295, 30149, 24005, 21623, 29981, 23837, 22301, 30023, 23879, 30545, 22343, 30161, 24017, 21959, 30065, 23921, 22385, 29015, 18263, 29141, 17879, 29045, 18293, 17783, 29021, 18269, 17477, 17489, 17681, 20753, 35770];
      function getEncoding(character) {
        return getBinary(characterValue(character));
      }
      function getBinary(characterValue2) {
        return encodings[characterValue2].toString(2);
      }
      function getCharacter(characterValue2) {
        return characters[characterValue2];
      }
      function characterValue(character) {
        return characters.indexOf(character);
      }
      function mod43checksum(data) {
        var checksum = 0;
        for (var i = 0; i < data.length; i++) {
          checksum += characterValue(data[i]);
        }
        checksum = checksum % 43;
        return checksum;
      }
      exports.CODE39 = CODE39;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/CODE128/constants.js
  var require_constants = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/CODE128/constants.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _SET_BY_CODE;
      function _defineProperty(obj, key, value) {
        if (key in obj) {
          Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
        } else {
          obj[key] = value;
        }
        return obj;
      }
      var SET_A = exports.SET_A = 0;
      var SET_B = exports.SET_B = 1;
      var SET_C = exports.SET_C = 2;
      var SHIFT = exports.SHIFT = 98;
      var START_A = exports.START_A = 103;
      var START_B = exports.START_B = 104;
      var START_C = exports.START_C = 105;
      var MODULO = exports.MODULO = 103;
      var STOP = exports.STOP = 106;
      var FNC1 = exports.FNC1 = 207;
      var SET_BY_CODE = exports.SET_BY_CODE = (_SET_BY_CODE = {}, _defineProperty(_SET_BY_CODE, START_A, SET_A), _defineProperty(_SET_BY_CODE, START_B, SET_B), _defineProperty(_SET_BY_CODE, START_C, SET_C), _SET_BY_CODE);
      var SWAP = exports.SWAP = {
        101: SET_A,
        100: SET_B,
        99: SET_C
      };
      var A_START_CHAR = exports.A_START_CHAR = String.fromCharCode(208);
      var B_START_CHAR = exports.B_START_CHAR = String.fromCharCode(209);
      var C_START_CHAR = exports.C_START_CHAR = String.fromCharCode(210);
      var A_CHARS = exports.A_CHARS = "[\0-_\xC8-\xCF]";
      var B_CHARS = exports.B_CHARS = "[ -\x7F\xC8-\xCF]";
      var C_CHARS = exports.C_CHARS = "(\xCF*[0-9]{2}\xCF*)";
      var BARS = exports.BARS = [11011001100, 11001101100, 11001100110, 10010011e3, 10010001100, 10001001100, 10011001e3, 10011000100, 10001100100, 11001001e3, 11001000100, 11000100100, 10110011100, 10011011100, 10011001110, 10111001100, 10011101100, 10011100110, 11001110010, 11001011100, 11001001110, 11011100100, 11001110100, 11101101110, 11101001100, 11100101100, 11100100110, 11101100100, 11100110100, 11100110010, 11011011e3, 11011000110, 11000110110, 10100011e3, 10001011e3, 10001000110, 10110001e3, 10001101e3, 10001100010, 11010001e3, 11000101e3, 11000100010, 10110111e3, 10110001110, 10001101110, 10111011e3, 10111000110, 10001110110, 11101110110, 11010001110, 11000101110, 11011101e3, 11011100010, 11011101110, 11101011e3, 11101000110, 11100010110, 11101101e3, 11101100010, 11100011010, 11101111010, 11001000010, 11110001010, 1010011e4, 10100001100, 1001011e4, 10010000110, 10000101100, 10000100110, 1011001e4, 10110000100, 1001101e4, 10011000010, 10000110100, 10000110010, 11000010010, 1100101e4, 11110111010, 11000010100, 10001111010, 10100111100, 10010111100, 10010011110, 10111100100, 10011110100, 10011110010, 11110100100, 11110010100, 11110010010, 11011011110, 11011110110, 11110110110, 10101111e3, 10100011110, 10001011110, 10111101e3, 10111100010, 11110101e3, 11110100010, 10111011110, 10111101110, 11101011110, 11110101110, 11010000100, 1101001e4, 11010011100, 1100011101011];
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/CODE128/CODE128.js
  var require_CODE128 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/CODE128/CODE128.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _Barcode2 = require_Barcode();
      var _Barcode3 = _interopRequireDefault(_Barcode2);
      var _constants = require_constants();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var CODE128 = function(_Barcode) {
        _inherits(CODE1282, _Barcode);
        function CODE1282(data, options) {
          _classCallCheck(this, CODE1282);
          var _this = _possibleConstructorReturn(this, (CODE1282.__proto__ || Object.getPrototypeOf(CODE1282)).call(this, data.substring(1), options));
          _this.bytes = data.split("").map(function(char) {
            return char.charCodeAt(0);
          });
          return _this;
        }
        _createClass(CODE1282, [{
          key: "valid",
          value: function valid() {
            return /^[\x00-\x7F\xC8-\xD3]+$/.test(this.data);
          }
        }, {
          key: "encode",
          value: function encode() {
            var bytes = this.bytes;
            var startIndex = bytes.shift() - 105;
            var startSet = _constants.SET_BY_CODE[startIndex];
            if (startSet === void 0) {
              throw new RangeError("The encoding does not start with a start character.");
            }
            if (this.shouldEncodeAsEan128() === true) {
              bytes.unshift(_constants.FNC1);
            }
            var encodingResult = CODE1282.next(bytes, 1, startSet);
            return {
              text: this.text === this.data ? this.text.replace(/[^\x20-\x7E]/g, "") : this.text,
              data: CODE1282.getBar(startIndex) + encodingResult.result + CODE1282.getBar((encodingResult.checksum + startIndex) % _constants.MODULO) + CODE1282.getBar(_constants.STOP)
            };
          }
        }, {
          key: "shouldEncodeAsEan128",
          value: function shouldEncodeAsEan128() {
            var isEAN128 = this.options.ean128 || false;
            if (typeof isEAN128 === "string") {
              isEAN128 = isEAN128.toLowerCase() === "true";
            }
            return isEAN128;
          }
        }], [{
          key: "getBar",
          value: function getBar(index) {
            return _constants.BARS[index] ? _constants.BARS[index].toString() : "";
          }
        }, {
          key: "correctIndex",
          value: function correctIndex(bytes, set) {
            if (set === _constants.SET_A) {
              var charCode = bytes.shift();
              return charCode < 32 ? charCode + 64 : charCode - 32;
            } else if (set === _constants.SET_B) {
              return bytes.shift() - 32;
            } else {
              return (bytes.shift() - 48) * 10 + bytes.shift() - 48;
            }
          }
        }, {
          key: "next",
          value: function next(bytes, pos, set) {
            if (!bytes.length) {
              return { result: "", checksum: 0 };
            }
            var nextCode = void 0, index = void 0;
            if (bytes[0] >= 200) {
              index = bytes.shift() - 105;
              var nextSet = _constants.SWAP[index];
              if (nextSet !== void 0) {
                nextCode = CODE1282.next(bytes, pos + 1, nextSet);
              } else {
                if ((set === _constants.SET_A || set === _constants.SET_B) && index === _constants.SHIFT) {
                  bytes[0] = set === _constants.SET_A ? bytes[0] > 95 ? bytes[0] - 96 : bytes[0] : bytes[0] < 32 ? bytes[0] + 96 : bytes[0];
                }
                nextCode = CODE1282.next(bytes, pos + 1, set);
              }
            } else {
              index = CODE1282.correctIndex(bytes, set);
              nextCode = CODE1282.next(bytes, pos + 1, set);
            }
            var enc = CODE1282.getBar(index);
            var weight = index * pos;
            return {
              result: enc + nextCode.result,
              checksum: weight + nextCode.checksum
            };
          }
        }]);
        return CODE1282;
      }(_Barcode3.default);
      exports.default = CODE128;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/CODE128/auto.js
  var require_auto = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/CODE128/auto.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _constants = require_constants();
      var matchSetALength = function matchSetALength2(string) {
        return string.match(new RegExp("^" + _constants.A_CHARS + "*"))[0].length;
      };
      var matchSetBLength = function matchSetBLength2(string) {
        return string.match(new RegExp("^" + _constants.B_CHARS + "*"))[0].length;
      };
      var matchSetC = function matchSetC2(string) {
        return string.match(new RegExp("^" + _constants.C_CHARS + "*"))[0];
      };
      function autoSelectFromAB(string, isA) {
        var ranges = isA ? _constants.A_CHARS : _constants.B_CHARS;
        var untilC = string.match(new RegExp("^(" + ranges + "+?)(([0-9]{2}){2,})([^0-9]|$)"));
        if (untilC) {
          return untilC[1] + String.fromCharCode(204) + autoSelectFromC(string.substring(untilC[1].length));
        }
        var chars = string.match(new RegExp("^" + ranges + "+"))[0];
        if (chars.length === string.length) {
          return string;
        }
        return chars + String.fromCharCode(isA ? 205 : 206) + autoSelectFromAB(string.substring(chars.length), !isA);
      }
      function autoSelectFromC(string) {
        var cMatch = matchSetC(string);
        var length = cMatch.length;
        if (length === string.length) {
          return string;
        }
        string = string.substring(length);
        var isA = matchSetALength(string) >= matchSetBLength(string);
        return cMatch + String.fromCharCode(isA ? 206 : 205) + autoSelectFromAB(string, isA);
      }
      exports.default = function(string) {
        var newString = void 0;
        var cLength = matchSetC(string).length;
        if (cLength >= 2) {
          newString = _constants.C_START_CHAR + autoSelectFromC(string);
        } else {
          var isA = matchSetALength(string) > matchSetBLength(string);
          newString = (isA ? _constants.A_START_CHAR : _constants.B_START_CHAR) + autoSelectFromAB(string, isA);
        }
        return newString.replace(
          /[\xCD\xCE]([^])[\xCD\xCE]/,
          function(match, char) {
            return String.fromCharCode(203) + char;
          }
        );
      };
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/CODE128/CODE128_AUTO.js
  var require_CODE128_AUTO = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/CODE128/CODE128_AUTO.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _CODE2 = require_CODE128();
      var _CODE3 = _interopRequireDefault(_CODE2);
      var _auto = require_auto();
      var _auto2 = _interopRequireDefault(_auto);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var CODE128AUTO = function(_CODE) {
        _inherits(CODE128AUTO2, _CODE);
        function CODE128AUTO2(data, options) {
          _classCallCheck(this, CODE128AUTO2);
          if (/^[\x00-\x7F\xC8-\xD3]+$/.test(data)) {
            var _this = _possibleConstructorReturn(this, (CODE128AUTO2.__proto__ || Object.getPrototypeOf(CODE128AUTO2)).call(this, (0, _auto2.default)(data), options));
          } else {
            var _this = _possibleConstructorReturn(this, (CODE128AUTO2.__proto__ || Object.getPrototypeOf(CODE128AUTO2)).call(this, data, options));
          }
          return _possibleConstructorReturn(_this);
        }
        return CODE128AUTO2;
      }(_CODE3.default);
      exports.default = CODE128AUTO;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/CODE128/CODE128A.js
  var require_CODE128A = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/CODE128/CODE128A.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _CODE2 = require_CODE128();
      var _CODE3 = _interopRequireDefault(_CODE2);
      var _constants = require_constants();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var CODE128A = function(_CODE) {
        _inherits(CODE128A2, _CODE);
        function CODE128A2(string, options) {
          _classCallCheck(this, CODE128A2);
          return _possibleConstructorReturn(this, (CODE128A2.__proto__ || Object.getPrototypeOf(CODE128A2)).call(this, _constants.A_START_CHAR + string, options));
        }
        _createClass(CODE128A2, [{
          key: "valid",
          value: function valid() {
            return new RegExp("^" + _constants.A_CHARS + "+$").test(this.data);
          }
        }]);
        return CODE128A2;
      }(_CODE3.default);
      exports.default = CODE128A;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/CODE128/CODE128B.js
  var require_CODE128B = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/CODE128/CODE128B.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _CODE2 = require_CODE128();
      var _CODE3 = _interopRequireDefault(_CODE2);
      var _constants = require_constants();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var CODE128B = function(_CODE) {
        _inherits(CODE128B2, _CODE);
        function CODE128B2(string, options) {
          _classCallCheck(this, CODE128B2);
          return _possibleConstructorReturn(this, (CODE128B2.__proto__ || Object.getPrototypeOf(CODE128B2)).call(this, _constants.B_START_CHAR + string, options));
        }
        _createClass(CODE128B2, [{
          key: "valid",
          value: function valid() {
            return new RegExp("^" + _constants.B_CHARS + "+$").test(this.data);
          }
        }]);
        return CODE128B2;
      }(_CODE3.default);
      exports.default = CODE128B;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/CODE128/CODE128C.js
  var require_CODE128C = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/CODE128/CODE128C.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _CODE2 = require_CODE128();
      var _CODE3 = _interopRequireDefault(_CODE2);
      var _constants = require_constants();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var CODE128C = function(_CODE) {
        _inherits(CODE128C2, _CODE);
        function CODE128C2(string, options) {
          _classCallCheck(this, CODE128C2);
          return _possibleConstructorReturn(this, (CODE128C2.__proto__ || Object.getPrototypeOf(CODE128C2)).call(this, _constants.C_START_CHAR + string, options));
        }
        _createClass(CODE128C2, [{
          key: "valid",
          value: function valid() {
            return new RegExp("^" + _constants.C_CHARS + "+$").test(this.data);
          }
        }]);
        return CODE128C2;
      }(_CODE3.default);
      exports.default = CODE128C;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/CODE128/index.js
  var require_CODE1282 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/CODE128/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.CODE128C = exports.CODE128B = exports.CODE128A = exports.CODE128 = void 0;
      var _CODE128_AUTO = require_CODE128_AUTO();
      var _CODE128_AUTO2 = _interopRequireDefault(_CODE128_AUTO);
      var _CODE128A = require_CODE128A();
      var _CODE128A2 = _interopRequireDefault(_CODE128A);
      var _CODE128B = require_CODE128B();
      var _CODE128B2 = _interopRequireDefault(_CODE128B);
      var _CODE128C = require_CODE128C();
      var _CODE128C2 = _interopRequireDefault(_CODE128C);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      exports.CODE128 = _CODE128_AUTO2.default;
      exports.CODE128A = _CODE128A2.default;
      exports.CODE128B = _CODE128B2.default;
      exports.CODE128C = _CODE128C2.default;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/constants.js
  var require_constants2 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/constants.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var SIDE_BIN = exports.SIDE_BIN = "101";
      var MIDDLE_BIN = exports.MIDDLE_BIN = "01010";
      var BINARIES = exports.BINARIES = {
        "L": [
          "0001101",
          "0011001",
          "0010011",
          "0111101",
          "0100011",
          "0110001",
          "0101111",
          "0111011",
          "0110111",
          "0001011"
        ],
        "G": [
          "0100111",
          "0110011",
          "0011011",
          "0100001",
          "0011101",
          "0111001",
          "0000101",
          "0010001",
          "0001001",
          "0010111"
        ],
        "R": [
          "1110010",
          "1100110",
          "1101100",
          "1000010",
          "1011100",
          "1001110",
          "1010000",
          "1000100",
          "1001000",
          "1110100"
        ],
        "O": [
          "0001101",
          "0011001",
          "0010011",
          "0111101",
          "0100011",
          "0110001",
          "0101111",
          "0111011",
          "0110111",
          "0001011"
        ],
        "E": [
          "0100111",
          "0110011",
          "0011011",
          "0100001",
          "0011101",
          "0111001",
          "0000101",
          "0010001",
          "0001001",
          "0010111"
        ]
      };
      var EAN2_STRUCTURE = exports.EAN2_STRUCTURE = ["LL", "LG", "GL", "GG"];
      var EAN5_STRUCTURE = exports.EAN5_STRUCTURE = ["GGLLL", "GLGLL", "GLLGL", "GLLLG", "LGGLL", "LLGGL", "LLLGG", "LGLGL", "LGLLG", "LLGLG"];
      var EAN13_STRUCTURE = exports.EAN13_STRUCTURE = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/encoder.js
  var require_encoder = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/encoder.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _constants = require_constants2();
      var encode = function encode2(data, structure, separator) {
        var encoded = data.split("").map(function(val, idx) {
          return _constants.BINARIES[structure[idx]];
        }).map(function(val, idx) {
          return val ? val[data[idx]] : "";
        });
        if (separator) {
          var last = data.length - 1;
          encoded = encoded.map(function(val, idx) {
            return idx < last ? val + separator : val;
          });
        }
        return encoded.join("");
      };
      exports.default = encode;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/EAN.js
  var require_EAN = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/EAN.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _constants = require_constants2();
      var _encoder = require_encoder();
      var _encoder2 = _interopRequireDefault(_encoder);
      var _Barcode2 = require_Barcode();
      var _Barcode3 = _interopRequireDefault(_Barcode2);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var EAN = function(_Barcode) {
        _inherits(EAN2, _Barcode);
        function EAN2(data, options) {
          _classCallCheck(this, EAN2);
          var _this = _possibleConstructorReturn(this, (EAN2.__proto__ || Object.getPrototypeOf(EAN2)).call(this, data, options));
          _this.fontSize = !options.flat && options.fontSize > options.width * 10 ? options.width * 10 : options.fontSize;
          _this.guardHeight = options.height + _this.fontSize / 2 + options.textMargin;
          return _this;
        }
        _createClass(EAN2, [{
          key: "encode",
          value: function encode() {
            return this.options.flat ? this.encodeFlat() : this.encodeGuarded();
          }
        }, {
          key: "leftText",
          value: function leftText(from, to) {
            return this.text.substr(from, to);
          }
        }, {
          key: "leftEncode",
          value: function leftEncode(data, structure) {
            return (0, _encoder2.default)(data, structure);
          }
        }, {
          key: "rightText",
          value: function rightText(from, to) {
            return this.text.substr(from, to);
          }
        }, {
          key: "rightEncode",
          value: function rightEncode(data, structure) {
            return (0, _encoder2.default)(data, structure);
          }
        }, {
          key: "encodeGuarded",
          value: function encodeGuarded() {
            var textOptions = { fontSize: this.fontSize };
            var guardOptions = { height: this.guardHeight };
            return [{ data: _constants.SIDE_BIN, options: guardOptions }, { data: this.leftEncode(), text: this.leftText(), options: textOptions }, { data: _constants.MIDDLE_BIN, options: guardOptions }, { data: this.rightEncode(), text: this.rightText(), options: textOptions }, { data: _constants.SIDE_BIN, options: guardOptions }];
          }
        }, {
          key: "encodeFlat",
          value: function encodeFlat() {
            var data = [_constants.SIDE_BIN, this.leftEncode(), _constants.MIDDLE_BIN, this.rightEncode(), _constants.SIDE_BIN];
            return {
              data: data.join(""),
              text: this.text
            };
          }
        }]);
        return EAN2;
      }(_Barcode3.default);
      exports.default = EAN;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/EAN13.js
  var require_EAN13 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/EAN13.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _get = function get(object, property, receiver) {
        if (object === null)
          object = Function.prototype;
        var desc = Object.getOwnPropertyDescriptor(object, property);
        if (desc === void 0) {
          var parent = Object.getPrototypeOf(object);
          if (parent === null) {
            return void 0;
          } else {
            return get(parent, property, receiver);
          }
        } else if ("value" in desc) {
          return desc.value;
        } else {
          var getter = desc.get;
          if (getter === void 0) {
            return void 0;
          }
          return getter.call(receiver);
        }
      };
      var _constants = require_constants2();
      var _EAN2 = require_EAN();
      var _EAN3 = _interopRequireDefault(_EAN2);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var checksum = function checksum2(number) {
        var res = number.substr(0, 12).split("").map(function(n) {
          return +n;
        }).reduce(function(sum, a, idx) {
          return idx % 2 ? sum + a * 3 : sum + a;
        }, 0);
        return (10 - res % 10) % 10;
      };
      var EAN13 = function(_EAN) {
        _inherits(EAN132, _EAN);
        function EAN132(data, options) {
          _classCallCheck(this, EAN132);
          if (data.search(/^[0-9]{12}$/) !== -1) {
            data += checksum(data);
          }
          var _this = _possibleConstructorReturn(this, (EAN132.__proto__ || Object.getPrototypeOf(EAN132)).call(this, data, options));
          _this.lastChar = options.lastChar;
          return _this;
        }
        _createClass(EAN132, [{
          key: "valid",
          value: function valid() {
            return this.data.search(/^[0-9]{13}$/) !== -1 && +this.data[12] === checksum(this.data);
          }
        }, {
          key: "leftText",
          value: function leftText() {
            return _get(EAN132.prototype.__proto__ || Object.getPrototypeOf(EAN132.prototype), "leftText", this).call(this, 1, 6);
          }
        }, {
          key: "leftEncode",
          value: function leftEncode() {
            var data = this.data.substr(1, 6);
            var structure = _constants.EAN13_STRUCTURE[this.data[0]];
            return _get(EAN132.prototype.__proto__ || Object.getPrototypeOf(EAN132.prototype), "leftEncode", this).call(this, data, structure);
          }
        }, {
          key: "rightText",
          value: function rightText() {
            return _get(EAN132.prototype.__proto__ || Object.getPrototypeOf(EAN132.prototype), "rightText", this).call(this, 7, 6);
          }
        }, {
          key: "rightEncode",
          value: function rightEncode() {
            var data = this.data.substr(7, 6);
            return _get(EAN132.prototype.__proto__ || Object.getPrototypeOf(EAN132.prototype), "rightEncode", this).call(this, data, "RRRRRR");
          }
        }, {
          key: "encodeGuarded",
          value: function encodeGuarded() {
            var data = _get(EAN132.prototype.__proto__ || Object.getPrototypeOf(EAN132.prototype), "encodeGuarded", this).call(this);
            if (this.options.displayValue) {
              data.unshift({
                data: "000000000000",
                text: this.text.substr(0, 1),
                options: { textAlign: "left", fontSize: this.fontSize }
              });
              if (this.options.lastChar) {
                data.push({
                  data: "00"
                });
                data.push({
                  data: "00000",
                  text: this.options.lastChar,
                  options: { fontSize: this.fontSize }
                });
              }
            }
            return data;
          }
        }]);
        return EAN132;
      }(_EAN3.default);
      exports.default = EAN13;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/EAN8.js
  var require_EAN8 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/EAN8.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _get = function get(object, property, receiver) {
        if (object === null)
          object = Function.prototype;
        var desc = Object.getOwnPropertyDescriptor(object, property);
        if (desc === void 0) {
          var parent = Object.getPrototypeOf(object);
          if (parent === null) {
            return void 0;
          } else {
            return get(parent, property, receiver);
          }
        } else if ("value" in desc) {
          return desc.value;
        } else {
          var getter = desc.get;
          if (getter === void 0) {
            return void 0;
          }
          return getter.call(receiver);
        }
      };
      var _EAN2 = require_EAN();
      var _EAN3 = _interopRequireDefault(_EAN2);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var checksum = function checksum2(number) {
        var res = number.substr(0, 7).split("").map(function(n) {
          return +n;
        }).reduce(function(sum, a, idx) {
          return idx % 2 ? sum + a : sum + a * 3;
        }, 0);
        return (10 - res % 10) % 10;
      };
      var EAN8 = function(_EAN) {
        _inherits(EAN82, _EAN);
        function EAN82(data, options) {
          _classCallCheck(this, EAN82);
          if (data.search(/^[0-9]{7}$/) !== -1) {
            data += checksum(data);
          }
          return _possibleConstructorReturn(this, (EAN82.__proto__ || Object.getPrototypeOf(EAN82)).call(this, data, options));
        }
        _createClass(EAN82, [{
          key: "valid",
          value: function valid() {
            return this.data.search(/^[0-9]{8}$/) !== -1 && +this.data[7] === checksum(this.data);
          }
        }, {
          key: "leftText",
          value: function leftText() {
            return _get(EAN82.prototype.__proto__ || Object.getPrototypeOf(EAN82.prototype), "leftText", this).call(this, 0, 4);
          }
        }, {
          key: "leftEncode",
          value: function leftEncode() {
            var data = this.data.substr(0, 4);
            return _get(EAN82.prototype.__proto__ || Object.getPrototypeOf(EAN82.prototype), "leftEncode", this).call(this, data, "LLLL");
          }
        }, {
          key: "rightText",
          value: function rightText() {
            return _get(EAN82.prototype.__proto__ || Object.getPrototypeOf(EAN82.prototype), "rightText", this).call(this, 4, 4);
          }
        }, {
          key: "rightEncode",
          value: function rightEncode() {
            var data = this.data.substr(4, 4);
            return _get(EAN82.prototype.__proto__ || Object.getPrototypeOf(EAN82.prototype), "rightEncode", this).call(this, data, "RRRR");
          }
        }]);
        return EAN82;
      }(_EAN3.default);
      exports.default = EAN8;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/EAN5.js
  var require_EAN5 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/EAN5.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _constants = require_constants2();
      var _encoder = require_encoder();
      var _encoder2 = _interopRequireDefault(_encoder);
      var _Barcode2 = require_Barcode();
      var _Barcode3 = _interopRequireDefault(_Barcode2);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var checksum = function checksum2(data) {
        var result = data.split("").map(function(n) {
          return +n;
        }).reduce(function(sum, a, idx) {
          return idx % 2 ? sum + a * 9 : sum + a * 3;
        }, 0);
        return result % 10;
      };
      var EAN5 = function(_Barcode) {
        _inherits(EAN52, _Barcode);
        function EAN52(data, options) {
          _classCallCheck(this, EAN52);
          return _possibleConstructorReturn(this, (EAN52.__proto__ || Object.getPrototypeOf(EAN52)).call(this, data, options));
        }
        _createClass(EAN52, [{
          key: "valid",
          value: function valid() {
            return this.data.search(/^[0-9]{5}$/) !== -1;
          }
        }, {
          key: "encode",
          value: function encode() {
            var structure = _constants.EAN5_STRUCTURE[checksum(this.data)];
            return {
              data: "1011" + (0, _encoder2.default)(this.data, structure, "01"),
              text: this.text
            };
          }
        }]);
        return EAN52;
      }(_Barcode3.default);
      exports.default = EAN5;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/EAN2.js
  var require_EAN2 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/EAN2.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _constants = require_constants2();
      var _encoder = require_encoder();
      var _encoder2 = _interopRequireDefault(_encoder);
      var _Barcode2 = require_Barcode();
      var _Barcode3 = _interopRequireDefault(_Barcode2);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var EAN2 = function(_Barcode) {
        _inherits(EAN22, _Barcode);
        function EAN22(data, options) {
          _classCallCheck(this, EAN22);
          return _possibleConstructorReturn(this, (EAN22.__proto__ || Object.getPrototypeOf(EAN22)).call(this, data, options));
        }
        _createClass(EAN22, [{
          key: "valid",
          value: function valid() {
            return this.data.search(/^[0-9]{2}$/) !== -1;
          }
        }, {
          key: "encode",
          value: function encode() {
            var structure = _constants.EAN2_STRUCTURE[parseInt(this.data) % 4];
            return {
              data: "1011" + (0, _encoder2.default)(this.data, structure, "01"),
              text: this.text
            };
          }
        }]);
        return EAN22;
      }(_Barcode3.default);
      exports.default = EAN2;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/UPC.js
  var require_UPC = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/UPC.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      exports.checksum = checksum;
      var _encoder = require_encoder();
      var _encoder2 = _interopRequireDefault(_encoder);
      var _Barcode2 = require_Barcode();
      var _Barcode3 = _interopRequireDefault(_Barcode2);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var UPC = function(_Barcode) {
        _inherits(UPC2, _Barcode);
        function UPC2(data, options) {
          _classCallCheck(this, UPC2);
          if (data.search(/^[0-9]{11}$/) !== -1) {
            data += checksum(data);
          }
          var _this = _possibleConstructorReturn(this, (UPC2.__proto__ || Object.getPrototypeOf(UPC2)).call(this, data, options));
          _this.displayValue = options.displayValue;
          if (options.fontSize > options.width * 10) {
            _this.fontSize = options.width * 10;
          } else {
            _this.fontSize = options.fontSize;
          }
          _this.guardHeight = options.height + _this.fontSize / 2 + options.textMargin;
          return _this;
        }
        _createClass(UPC2, [{
          key: "valid",
          value: function valid() {
            return this.data.search(/^[0-9]{12}$/) !== -1 && this.data[11] == checksum(this.data);
          }
        }, {
          key: "encode",
          value: function encode() {
            if (this.options.flat) {
              return this.flatEncoding();
            } else {
              return this.guardedEncoding();
            }
          }
        }, {
          key: "flatEncoding",
          value: function flatEncoding() {
            var result = "";
            result += "101";
            result += (0, _encoder2.default)(this.data.substr(0, 6), "LLLLLL");
            result += "01010";
            result += (0, _encoder2.default)(this.data.substr(6, 6), "RRRRRR");
            result += "101";
            return {
              data: result,
              text: this.text
            };
          }
        }, {
          key: "guardedEncoding",
          value: function guardedEncoding() {
            var result = [];
            if (this.displayValue) {
              result.push({
                data: "00000000",
                text: this.text.substr(0, 1),
                options: { textAlign: "left", fontSize: this.fontSize }
              });
            }
            result.push({
              data: "101" + (0, _encoder2.default)(this.data[0], "L"),
              options: { height: this.guardHeight }
            });
            result.push({
              data: (0, _encoder2.default)(this.data.substr(1, 5), "LLLLL"),
              text: this.text.substr(1, 5),
              options: { fontSize: this.fontSize }
            });
            result.push({
              data: "01010",
              options: { height: this.guardHeight }
            });
            result.push({
              data: (0, _encoder2.default)(this.data.substr(6, 5), "RRRRR"),
              text: this.text.substr(6, 5),
              options: { fontSize: this.fontSize }
            });
            result.push({
              data: (0, _encoder2.default)(this.data[11], "R") + "101",
              options: { height: this.guardHeight }
            });
            if (this.displayValue) {
              result.push({
                data: "00000000",
                text: this.text.substr(11, 1),
                options: { textAlign: "right", fontSize: this.fontSize }
              });
            }
            return result;
          }
        }]);
        return UPC2;
      }(_Barcode3.default);
      function checksum(number) {
        var result = 0;
        var i;
        for (i = 1; i < 11; i += 2) {
          result += parseInt(number[i]);
        }
        for (i = 0; i < 11; i += 2) {
          result += parseInt(number[i]) * 3;
        }
        return (10 - result % 10) % 10;
      }
      exports.default = UPC;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/UPCE.js
  var require_UPCE = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/UPCE.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _encoder = require_encoder();
      var _encoder2 = _interopRequireDefault(_encoder);
      var _Barcode2 = require_Barcode();
      var _Barcode3 = _interopRequireDefault(_Barcode2);
      var _UPC = require_UPC();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var EXPANSIONS = ["XX00000XXX", "XX10000XXX", "XX20000XXX", "XXX00000XX", "XXXX00000X", "XXXXX00005", "XXXXX00006", "XXXXX00007", "XXXXX00008", "XXXXX00009"];
      var PARITIES = [["EEEOOO", "OOOEEE"], ["EEOEOO", "OOEOEE"], ["EEOOEO", "OOEEOE"], ["EEOOOE", "OOEEEO"], ["EOEEOO", "OEOOEE"], ["EOOEEO", "OEEOOE"], ["EOOOEE", "OEEEOO"], ["EOEOEO", "OEOEOE"], ["EOEOOE", "OEOEEO"], ["EOOEOE", "OEEOEO"]];
      var UPCE = function(_Barcode) {
        _inherits(UPCE2, _Barcode);
        function UPCE2(data, options) {
          _classCallCheck(this, UPCE2);
          var _this = _possibleConstructorReturn(this, (UPCE2.__proto__ || Object.getPrototypeOf(UPCE2)).call(this, data, options));
          _this.isValid = false;
          if (data.search(/^[0-9]{6}$/) !== -1) {
            _this.middleDigits = data;
            _this.upcA = expandToUPCA(data, "0");
            _this.text = options.text || "" + _this.upcA[0] + data + _this.upcA[_this.upcA.length - 1];
            _this.isValid = true;
          } else if (data.search(/^[01][0-9]{7}$/) !== -1) {
            _this.middleDigits = data.substring(1, data.length - 1);
            _this.upcA = expandToUPCA(_this.middleDigits, data[0]);
            if (_this.upcA[_this.upcA.length - 1] === data[data.length - 1]) {
              _this.isValid = true;
            } else {
              return _possibleConstructorReturn(_this);
            }
          } else {
            return _possibleConstructorReturn(_this);
          }
          _this.displayValue = options.displayValue;
          if (options.fontSize > options.width * 10) {
            _this.fontSize = options.width * 10;
          } else {
            _this.fontSize = options.fontSize;
          }
          _this.guardHeight = options.height + _this.fontSize / 2 + options.textMargin;
          return _this;
        }
        _createClass(UPCE2, [{
          key: "valid",
          value: function valid() {
            return this.isValid;
          }
        }, {
          key: "encode",
          value: function encode() {
            if (this.options.flat) {
              return this.flatEncoding();
            } else {
              return this.guardedEncoding();
            }
          }
        }, {
          key: "flatEncoding",
          value: function flatEncoding() {
            var result = "";
            result += "101";
            result += this.encodeMiddleDigits();
            result += "010101";
            return {
              data: result,
              text: this.text
            };
          }
        }, {
          key: "guardedEncoding",
          value: function guardedEncoding() {
            var result = [];
            if (this.displayValue) {
              result.push({
                data: "00000000",
                text: this.text[0],
                options: { textAlign: "left", fontSize: this.fontSize }
              });
            }
            result.push({
              data: "101",
              options: { height: this.guardHeight }
            });
            result.push({
              data: this.encodeMiddleDigits(),
              text: this.text.substring(1, 7),
              options: { fontSize: this.fontSize }
            });
            result.push({
              data: "010101",
              options: { height: this.guardHeight }
            });
            if (this.displayValue) {
              result.push({
                data: "00000000",
                text: this.text[7],
                options: { textAlign: "right", fontSize: this.fontSize }
              });
            }
            return result;
          }
        }, {
          key: "encodeMiddleDigits",
          value: function encodeMiddleDigits() {
            var numberSystem = this.upcA[0];
            var checkDigit = this.upcA[this.upcA.length - 1];
            var parity = PARITIES[parseInt(checkDigit)][parseInt(numberSystem)];
            return (0, _encoder2.default)(this.middleDigits, parity);
          }
        }]);
        return UPCE2;
      }(_Barcode3.default);
      function expandToUPCA(middleDigits, numberSystem) {
        var lastUpcE = parseInt(middleDigits[middleDigits.length - 1]);
        var expansion = EXPANSIONS[lastUpcE];
        var result = "";
        var digitIndex = 0;
        for (var i = 0; i < expansion.length; i++) {
          var c = expansion[i];
          if (c === "X") {
            result += middleDigits[digitIndex++];
          } else {
            result += c;
          }
        }
        result = "" + numberSystem + result;
        return "" + result + (0, _UPC.checksum)(result);
      }
      exports.default = UPCE;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/index.js
  var require_EAN_UPC = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/EAN_UPC/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.UPCE = exports.UPC = exports.EAN2 = exports.EAN5 = exports.EAN8 = exports.EAN13 = void 0;
      var _EAN = require_EAN13();
      var _EAN2 = _interopRequireDefault(_EAN);
      var _EAN3 = require_EAN8();
      var _EAN4 = _interopRequireDefault(_EAN3);
      var _EAN5 = require_EAN5();
      var _EAN6 = _interopRequireDefault(_EAN5);
      var _EAN7 = require_EAN2();
      var _EAN8 = _interopRequireDefault(_EAN7);
      var _UPC = require_UPC();
      var _UPC2 = _interopRequireDefault(_UPC);
      var _UPCE = require_UPCE();
      var _UPCE2 = _interopRequireDefault(_UPCE);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      exports.EAN13 = _EAN2.default;
      exports.EAN8 = _EAN4.default;
      exports.EAN5 = _EAN6.default;
      exports.EAN2 = _EAN8.default;
      exports.UPC = _UPC2.default;
      exports.UPCE = _UPCE2.default;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/ITF/constants.js
  var require_constants3 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/ITF/constants.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var START_BIN = exports.START_BIN = "1010";
      var END_BIN = exports.END_BIN = "11101";
      var BINARIES = exports.BINARIES = ["00110", "10001", "01001", "11000", "00101", "10100", "01100", "00011", "10010", "01010"];
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/ITF/ITF.js
  var require_ITF = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/ITF/ITF.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _constants = require_constants3();
      var _Barcode2 = require_Barcode();
      var _Barcode3 = _interopRequireDefault(_Barcode2);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var ITF = function(_Barcode) {
        _inherits(ITF2, _Barcode);
        function ITF2() {
          _classCallCheck(this, ITF2);
          return _possibleConstructorReturn(this, (ITF2.__proto__ || Object.getPrototypeOf(ITF2)).apply(this, arguments));
        }
        _createClass(ITF2, [{
          key: "valid",
          value: function valid() {
            return this.data.search(/^([0-9]{2})+$/) !== -1;
          }
        }, {
          key: "encode",
          value: function encode() {
            var _this2 = this;
            var encoded = this.data.match(/.{2}/g).map(function(pair) {
              return _this2.encodePair(pair);
            }).join("");
            return {
              data: _constants.START_BIN + encoded + _constants.END_BIN,
              text: this.text
            };
          }
        }, {
          key: "encodePair",
          value: function encodePair(pair) {
            var second = _constants.BINARIES[pair[1]];
            return _constants.BINARIES[pair[0]].split("").map(function(first, idx) {
              return (first === "1" ? "111" : "1") + (second[idx] === "1" ? "000" : "0");
            }).join("");
          }
        }]);
        return ITF2;
      }(_Barcode3.default);
      exports.default = ITF;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/ITF/ITF14.js
  var require_ITF14 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/ITF/ITF14.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _ITF2 = require_ITF();
      var _ITF3 = _interopRequireDefault(_ITF2);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var checksum = function checksum2(data) {
        var res = data.substr(0, 13).split("").map(function(num) {
          return parseInt(num, 10);
        }).reduce(function(sum, n, idx) {
          return sum + n * (3 - idx % 2 * 2);
        }, 0);
        return Math.ceil(res / 10) * 10 - res;
      };
      var ITF14 = function(_ITF) {
        _inherits(ITF142, _ITF);
        function ITF142(data, options) {
          _classCallCheck(this, ITF142);
          if (data.search(/^[0-9]{13}$/) !== -1) {
            data += checksum(data);
          }
          return _possibleConstructorReturn(this, (ITF142.__proto__ || Object.getPrototypeOf(ITF142)).call(this, data, options));
        }
        _createClass(ITF142, [{
          key: "valid",
          value: function valid() {
            return this.data.search(/^[0-9]{14}$/) !== -1 && +this.data[13] === checksum(this.data);
          }
        }]);
        return ITF142;
      }(_ITF3.default);
      exports.default = ITF14;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/ITF/index.js
  var require_ITF2 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/ITF/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.ITF14 = exports.ITF = void 0;
      var _ITF = require_ITF();
      var _ITF2 = _interopRequireDefault(_ITF);
      var _ITF3 = require_ITF14();
      var _ITF4 = _interopRequireDefault(_ITF3);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      exports.ITF = _ITF2.default;
      exports.ITF14 = _ITF4.default;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/MSI/MSI.js
  var require_MSI = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/MSI/MSI.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _Barcode2 = require_Barcode();
      var _Barcode3 = _interopRequireDefault(_Barcode2);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var MSI = function(_Barcode) {
        _inherits(MSI2, _Barcode);
        function MSI2(data, options) {
          _classCallCheck(this, MSI2);
          return _possibleConstructorReturn(this, (MSI2.__proto__ || Object.getPrototypeOf(MSI2)).call(this, data, options));
        }
        _createClass(MSI2, [{
          key: "encode",
          value: function encode() {
            var ret = "110";
            for (var i = 0; i < this.data.length; i++) {
              var digit = parseInt(this.data[i]);
              var bin = digit.toString(2);
              bin = addZeroes(bin, 4 - bin.length);
              for (var b = 0; b < bin.length; b++) {
                ret += bin[b] == "0" ? "100" : "110";
              }
            }
            ret += "1001";
            return {
              data: ret,
              text: this.text
            };
          }
        }, {
          key: "valid",
          value: function valid() {
            return this.data.search(/^[0-9]+$/) !== -1;
          }
        }]);
        return MSI2;
      }(_Barcode3.default);
      function addZeroes(number, n) {
        for (var i = 0; i < n; i++) {
          number = "0" + number;
        }
        return number;
      }
      exports.default = MSI;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/MSI/checksums.js
  var require_checksums = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/MSI/checksums.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.mod10 = mod10;
      exports.mod11 = mod11;
      function mod10(number) {
        var sum = 0;
        for (var i = 0; i < number.length; i++) {
          var n = parseInt(number[i]);
          if ((i + number.length) % 2 === 0) {
            sum += n;
          } else {
            sum += n * 2 % 10 + Math.floor(n * 2 / 10);
          }
        }
        return (10 - sum % 10) % 10;
      }
      function mod11(number) {
        var sum = 0;
        var weights = [2, 3, 4, 5, 6, 7];
        for (var i = 0; i < number.length; i++) {
          var n = parseInt(number[number.length - 1 - i]);
          sum += weights[i % weights.length] * n;
        }
        return (11 - sum % 11) % 11;
      }
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/MSI/MSI10.js
  var require_MSI10 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/MSI/MSI10.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _MSI2 = require_MSI();
      var _MSI3 = _interopRequireDefault(_MSI2);
      var _checksums = require_checksums();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var MSI10 = function(_MSI) {
        _inherits(MSI102, _MSI);
        function MSI102(data, options) {
          _classCallCheck(this, MSI102);
          return _possibleConstructorReturn(this, (MSI102.__proto__ || Object.getPrototypeOf(MSI102)).call(this, data + (0, _checksums.mod10)(data), options));
        }
        return MSI102;
      }(_MSI3.default);
      exports.default = MSI10;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/MSI/MSI11.js
  var require_MSI11 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/MSI/MSI11.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _MSI2 = require_MSI();
      var _MSI3 = _interopRequireDefault(_MSI2);
      var _checksums = require_checksums();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var MSI11 = function(_MSI) {
        _inherits(MSI112, _MSI);
        function MSI112(data, options) {
          _classCallCheck(this, MSI112);
          return _possibleConstructorReturn(this, (MSI112.__proto__ || Object.getPrototypeOf(MSI112)).call(this, data + (0, _checksums.mod11)(data), options));
        }
        return MSI112;
      }(_MSI3.default);
      exports.default = MSI11;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/MSI/MSI1010.js
  var require_MSI1010 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/MSI/MSI1010.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _MSI2 = require_MSI();
      var _MSI3 = _interopRequireDefault(_MSI2);
      var _checksums = require_checksums();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var MSI1010 = function(_MSI) {
        _inherits(MSI10102, _MSI);
        function MSI10102(data, options) {
          _classCallCheck(this, MSI10102);
          data += (0, _checksums.mod10)(data);
          data += (0, _checksums.mod10)(data);
          return _possibleConstructorReturn(this, (MSI10102.__proto__ || Object.getPrototypeOf(MSI10102)).call(this, data, options));
        }
        return MSI10102;
      }(_MSI3.default);
      exports.default = MSI1010;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/MSI/MSI1110.js
  var require_MSI1110 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/MSI/MSI1110.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _MSI2 = require_MSI();
      var _MSI3 = _interopRequireDefault(_MSI2);
      var _checksums = require_checksums();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var MSI1110 = function(_MSI) {
        _inherits(MSI11102, _MSI);
        function MSI11102(data, options) {
          _classCallCheck(this, MSI11102);
          data += (0, _checksums.mod11)(data);
          data += (0, _checksums.mod10)(data);
          return _possibleConstructorReturn(this, (MSI11102.__proto__ || Object.getPrototypeOf(MSI11102)).call(this, data, options));
        }
        return MSI11102;
      }(_MSI3.default);
      exports.default = MSI1110;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/MSI/index.js
  var require_MSI2 = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/MSI/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.MSI1110 = exports.MSI1010 = exports.MSI11 = exports.MSI10 = exports.MSI = void 0;
      var _MSI = require_MSI();
      var _MSI2 = _interopRequireDefault(_MSI);
      var _MSI3 = require_MSI10();
      var _MSI4 = _interopRequireDefault(_MSI3);
      var _MSI5 = require_MSI11();
      var _MSI6 = _interopRequireDefault(_MSI5);
      var _MSI7 = require_MSI1010();
      var _MSI8 = _interopRequireDefault(_MSI7);
      var _MSI9 = require_MSI1110();
      var _MSI10 = _interopRequireDefault(_MSI9);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      exports.MSI = _MSI2.default;
      exports.MSI10 = _MSI4.default;
      exports.MSI11 = _MSI6.default;
      exports.MSI1010 = _MSI8.default;
      exports.MSI1110 = _MSI10.default;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/pharmacode/index.js
  var require_pharmacode = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/pharmacode/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.pharmacode = void 0;
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _Barcode2 = require_Barcode();
      var _Barcode3 = _interopRequireDefault(_Barcode2);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var pharmacode = function(_Barcode) {
        _inherits(pharmacode2, _Barcode);
        function pharmacode2(data, options) {
          _classCallCheck(this, pharmacode2);
          var _this = _possibleConstructorReturn(this, (pharmacode2.__proto__ || Object.getPrototypeOf(pharmacode2)).call(this, data, options));
          _this.number = parseInt(data, 10);
          return _this;
        }
        _createClass(pharmacode2, [{
          key: "encode",
          value: function encode() {
            var z = this.number;
            var result = "";
            while (!isNaN(z) && z != 0) {
              if (z % 2 === 0) {
                result = "11100" + result;
                z = (z - 2) / 2;
              } else {
                result = "100" + result;
                z = (z - 1) / 2;
              }
            }
            result = result.slice(0, -2);
            return {
              data: result,
              text: this.text
            };
          }
        }, {
          key: "valid",
          value: function valid() {
            return this.number >= 3 && this.number <= 131070;
          }
        }]);
        return pharmacode2;
      }(_Barcode3.default);
      exports.pharmacode = pharmacode;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/codabar/index.js
  var require_codabar = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/codabar/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.codabar = void 0;
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _Barcode2 = require_Barcode();
      var _Barcode3 = _interopRequireDefault(_Barcode2);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var codabar = function(_Barcode) {
        _inherits(codabar2, _Barcode);
        function codabar2(data, options) {
          _classCallCheck(this, codabar2);
          if (data.search(/^[0-9\-\$\:\.\+\/]+$/) === 0) {
            data = "A" + data + "A";
          }
          var _this = _possibleConstructorReturn(this, (codabar2.__proto__ || Object.getPrototypeOf(codabar2)).call(this, data.toUpperCase(), options));
          _this.text = _this.options.text || _this.text.replace(/[A-D]/g, "");
          return _this;
        }
        _createClass(codabar2, [{
          key: "valid",
          value: function valid() {
            return this.data.search(/^[A-D][0-9\-\$\:\.\+\/]+[A-D]$/) !== -1;
          }
        }, {
          key: "encode",
          value: function encode() {
            var result = [];
            var encodings = this.getEncodings();
            for (var i = 0; i < this.data.length; i++) {
              result.push(encodings[this.data.charAt(i)]);
              if (i !== this.data.length - 1) {
                result.push("0");
              }
            }
            return {
              text: this.text,
              data: result.join("")
            };
          }
        }, {
          key: "getEncodings",
          value: function getEncodings() {
            return {
              "0": "101010011",
              "1": "101011001",
              "2": "101001011",
              "3": "110010101",
              "4": "101101001",
              "5": "110101001",
              "6": "100101011",
              "7": "100101101",
              "8": "100110101",
              "9": "110100101",
              "-": "101001101",
              "$": "101100101",
              ":": "1101011011",
              "/": "1101101011",
              ".": "1101101101",
              "+": "1011011011",
              "A": "1011001001",
              "B": "1001001011",
              "C": "1010010011",
              "D": "1010011001"
            };
          }
        }]);
        return codabar2;
      }(_Barcode3.default);
      exports.codabar = codabar;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/GenericBarcode/index.js
  var require_GenericBarcode = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/GenericBarcode/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.GenericBarcode = void 0;
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _Barcode2 = require_Barcode();
      var _Barcode3 = _interopRequireDefault(_Barcode2);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var GenericBarcode = function(_Barcode) {
        _inherits(GenericBarcode2, _Barcode);
        function GenericBarcode2(data, options) {
          _classCallCheck(this, GenericBarcode2);
          return _possibleConstructorReturn(this, (GenericBarcode2.__proto__ || Object.getPrototypeOf(GenericBarcode2)).call(this, data, options));
        }
        _createClass(GenericBarcode2, [{
          key: "encode",
          value: function encode() {
            return {
              data: "10101010101010101010101010101010101010101",
              text: this.text
            };
          }
        }, {
          key: "valid",
          value: function valid() {
            return true;
          }
        }]);
        return GenericBarcode2;
      }(_Barcode3.default);
      exports.GenericBarcode = GenericBarcode;
    }
  });

  // ../../node_modules/jsbarcode/bin/barcodes/index.js
  var require_barcodes = __commonJS({
    "../../node_modules/jsbarcode/bin/barcodes/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _CODE = require_CODE39();
      var _CODE2 = require_CODE1282();
      var _EAN_UPC = require_EAN_UPC();
      var _ITF = require_ITF2();
      var _MSI = require_MSI2();
      var _pharmacode = require_pharmacode();
      var _codabar = require_codabar();
      var _GenericBarcode = require_GenericBarcode();
      exports.default = {
        CODE39: _CODE.CODE39,
        CODE128: _CODE2.CODE128,
        CODE128A: _CODE2.CODE128A,
        CODE128B: _CODE2.CODE128B,
        CODE128C: _CODE2.CODE128C,
        EAN13: _EAN_UPC.EAN13,
        EAN8: _EAN_UPC.EAN8,
        EAN5: _EAN_UPC.EAN5,
        EAN2: _EAN_UPC.EAN2,
        UPC: _EAN_UPC.UPC,
        UPCE: _EAN_UPC.UPCE,
        ITF14: _ITF.ITF14,
        ITF: _ITF.ITF,
        MSI: _MSI.MSI,
        MSI10: _MSI.MSI10,
        MSI11: _MSI.MSI11,
        MSI1010: _MSI.MSI1010,
        MSI1110: _MSI.MSI1110,
        pharmacode: _pharmacode.pharmacode,
        codabar: _codabar.codabar,
        GenericBarcode: _GenericBarcode.GenericBarcode
      };
    }
  });

  // ../../node_modules/jsbarcode/bin/help/merge.js
  var require_merge = __commonJS({
    "../../node_modules/jsbarcode/bin/help/merge.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _extends = Object.assign || function(target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i];
          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key];
            }
          }
        }
        return target;
      };
      exports.default = function(old, replaceObj) {
        return _extends({}, old, replaceObj);
      };
    }
  });

  // ../../node_modules/jsbarcode/bin/help/linearizeEncodings.js
  var require_linearizeEncodings = __commonJS({
    "../../node_modules/jsbarcode/bin/help/linearizeEncodings.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = linearizeEncodings;
      function linearizeEncodings(encodings) {
        var linearEncodings = [];
        function nextLevel(encoded) {
          if (Array.isArray(encoded)) {
            for (var i = 0; i < encoded.length; i++) {
              nextLevel(encoded[i]);
            }
          } else {
            encoded.text = encoded.text || "";
            encoded.data = encoded.data || "";
            linearEncodings.push(encoded);
          }
        }
        nextLevel(encodings);
        return linearEncodings;
      }
    }
  });

  // ../../node_modules/jsbarcode/bin/help/fixOptions.js
  var require_fixOptions = __commonJS({
    "../../node_modules/jsbarcode/bin/help/fixOptions.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = fixOptions;
      function fixOptions(options) {
        options.marginTop = options.marginTop || options.margin;
        options.marginBottom = options.marginBottom || options.margin;
        options.marginRight = options.marginRight || options.margin;
        options.marginLeft = options.marginLeft || options.margin;
        return options;
      }
    }
  });

  // ../../node_modules/jsbarcode/bin/help/optionsFromStrings.js
  var require_optionsFromStrings = __commonJS({
    "../../node_modules/jsbarcode/bin/help/optionsFromStrings.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = optionsFromStrings;
      function optionsFromStrings(options) {
        var intOptions = ["width", "height", "textMargin", "fontSize", "margin", "marginTop", "marginBottom", "marginLeft", "marginRight"];
        for (var intOption in intOptions) {
          if (intOptions.hasOwnProperty(intOption)) {
            intOption = intOptions[intOption];
            if (typeof options[intOption] === "string") {
              options[intOption] = parseInt(options[intOption], 10);
            }
          }
        }
        if (typeof options["displayValue"] === "string") {
          options["displayValue"] = options["displayValue"] != "false";
        }
        return options;
      }
    }
  });

  // ../../node_modules/jsbarcode/bin/options/defaults.js
  var require_defaults = __commonJS({
    "../../node_modules/jsbarcode/bin/options/defaults.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var defaults = {
        width: 2,
        height: 100,
        format: "auto",
        displayValue: true,
        fontOptions: "",
        font: "monospace",
        text: void 0,
        textAlign: "center",
        textPosition: "bottom",
        textMargin: 2,
        fontSize: 20,
        background: "#ffffff",
        lineColor: "#000000",
        margin: 10,
        marginTop: void 0,
        marginBottom: void 0,
        marginLeft: void 0,
        marginRight: void 0,
        valid: function valid() {
        }
      };
      exports.default = defaults;
    }
  });

  // ../../node_modules/jsbarcode/bin/help/getOptionsFromElement.js
  var require_getOptionsFromElement = __commonJS({
    "../../node_modules/jsbarcode/bin/help/getOptionsFromElement.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _optionsFromStrings = require_optionsFromStrings();
      var _optionsFromStrings2 = _interopRequireDefault(_optionsFromStrings);
      var _defaults = require_defaults();
      var _defaults2 = _interopRequireDefault(_defaults);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function getOptionsFromElement(element) {
        var options = {};
        for (var property in _defaults2.default) {
          if (_defaults2.default.hasOwnProperty(property)) {
            if (element.hasAttribute("jsbarcode-" + property.toLowerCase())) {
              options[property] = element.getAttribute("jsbarcode-" + property.toLowerCase());
            }
            if (element.hasAttribute("data-" + property.toLowerCase())) {
              options[property] = element.getAttribute("data-" + property.toLowerCase());
            }
          }
        }
        options["value"] = element.getAttribute("jsbarcode-value") || element.getAttribute("data-value");
        options = (0, _optionsFromStrings2.default)(options);
        return options;
      }
      exports.default = getOptionsFromElement;
    }
  });

  // ../../node_modules/jsbarcode/bin/renderers/shared.js
  var require_shared = __commonJS({
    "../../node_modules/jsbarcode/bin/renderers/shared.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.getTotalWidthOfEncodings = exports.calculateEncodingAttributes = exports.getBarcodePadding = exports.getEncodingHeight = exports.getMaximumHeightOfEncodings = void 0;
      var _merge = require_merge();
      var _merge2 = _interopRequireDefault(_merge);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function getEncodingHeight(encoding, options) {
        return options.height + (options.displayValue && encoding.text.length > 0 ? options.fontSize + options.textMargin : 0) + options.marginTop + options.marginBottom;
      }
      function getBarcodePadding(textWidth, barcodeWidth, options) {
        if (options.displayValue && barcodeWidth < textWidth) {
          if (options.textAlign == "center") {
            return Math.floor((textWidth - barcodeWidth) / 2);
          } else if (options.textAlign == "left") {
            return 0;
          } else if (options.textAlign == "right") {
            return Math.floor(textWidth - barcodeWidth);
          }
        }
        return 0;
      }
      function calculateEncodingAttributes(encodings, barcodeOptions, context) {
        for (var i = 0; i < encodings.length; i++) {
          var encoding = encodings[i];
          var options = (0, _merge2.default)(barcodeOptions, encoding.options);
          var textWidth;
          if (options.displayValue) {
            textWidth = messureText(encoding.text, options, context);
          } else {
            textWidth = 0;
          }
          var barcodeWidth = encoding.data.length * options.width;
          encoding.width = Math.ceil(Math.max(textWidth, barcodeWidth));
          encoding.height = getEncodingHeight(encoding, options);
          encoding.barcodePadding = getBarcodePadding(textWidth, barcodeWidth, options);
        }
      }
      function getTotalWidthOfEncodings(encodings) {
        var totalWidth = 0;
        for (var i = 0; i < encodings.length; i++) {
          totalWidth += encodings[i].width;
        }
        return totalWidth;
      }
      function getMaximumHeightOfEncodings(encodings) {
        var maxHeight = 0;
        for (var i = 0; i < encodings.length; i++) {
          if (encodings[i].height > maxHeight) {
            maxHeight = encodings[i].height;
          }
        }
        return maxHeight;
      }
      function messureText(string, options, context) {
        var ctx;
        if (context) {
          ctx = context;
        } else if (typeof document !== "undefined") {
          ctx = document.createElement("canvas").getContext("2d");
        } else {
          return 0;
        }
        ctx.font = options.fontOptions + " " + options.fontSize + "px " + options.font;
        var measureTextResult = ctx.measureText(string);
        if (!measureTextResult) {
          return 0;
        }
        var size = measureTextResult.width;
        return size;
      }
      exports.getMaximumHeightOfEncodings = getMaximumHeightOfEncodings;
      exports.getEncodingHeight = getEncodingHeight;
      exports.getBarcodePadding = getBarcodePadding;
      exports.calculateEncodingAttributes = calculateEncodingAttributes;
      exports.getTotalWidthOfEncodings = getTotalWidthOfEncodings;
    }
  });

  // ../../node_modules/jsbarcode/bin/renderers/canvas.js
  var require_canvas = __commonJS({
    "../../node_modules/jsbarcode/bin/renderers/canvas.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _merge = require_merge();
      var _merge2 = _interopRequireDefault(_merge);
      var _shared = require_shared();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      var CanvasRenderer = function() {
        function CanvasRenderer2(canvas, encodings, options) {
          _classCallCheck(this, CanvasRenderer2);
          this.canvas = canvas;
          this.encodings = encodings;
          this.options = options;
        }
        _createClass(CanvasRenderer2, [{
          key: "render",
          value: function render() {
            if (!this.canvas.getContext) {
              throw new Error("The browser does not support canvas.");
            }
            this.prepareCanvas();
            for (var i = 0; i < this.encodings.length; i++) {
              var encodingOptions = (0, _merge2.default)(this.options, this.encodings[i].options);
              this.drawCanvasBarcode(encodingOptions, this.encodings[i]);
              this.drawCanvasText(encodingOptions, this.encodings[i]);
              this.moveCanvasDrawing(this.encodings[i]);
            }
            this.restoreCanvas();
          }
        }, {
          key: "prepareCanvas",
          value: function prepareCanvas() {
            var ctx = this.canvas.getContext("2d");
            ctx.save();
            (0, _shared.calculateEncodingAttributes)(this.encodings, this.options, ctx);
            var totalWidth = (0, _shared.getTotalWidthOfEncodings)(this.encodings);
            var maxHeight = (0, _shared.getMaximumHeightOfEncodings)(this.encodings);
            this.canvas.width = totalWidth + this.options.marginLeft + this.options.marginRight;
            this.canvas.height = maxHeight;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.options.background) {
              ctx.fillStyle = this.options.background;
              ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
            ctx.translate(this.options.marginLeft, 0);
          }
        }, {
          key: "drawCanvasBarcode",
          value: function drawCanvasBarcode(options, encoding) {
            var ctx = this.canvas.getContext("2d");
            var binary = encoding.data;
            var yFrom;
            if (options.textPosition == "top") {
              yFrom = options.marginTop + options.fontSize + options.textMargin;
            } else {
              yFrom = options.marginTop;
            }
            ctx.fillStyle = options.lineColor;
            for (var b = 0; b < binary.length; b++) {
              var x = b * options.width + encoding.barcodePadding;
              if (binary[b] === "1") {
                ctx.fillRect(x, yFrom, options.width, options.height);
              } else if (binary[b]) {
                ctx.fillRect(x, yFrom, options.width, options.height * binary[b]);
              }
            }
          }
        }, {
          key: "drawCanvasText",
          value: function drawCanvasText(options, encoding) {
            var ctx = this.canvas.getContext("2d");
            var font = options.fontOptions + " " + options.fontSize + "px " + options.font;
            if (options.displayValue) {
              var x, y;
              if (options.textPosition == "top") {
                y = options.marginTop + options.fontSize - options.textMargin;
              } else {
                y = options.height + options.textMargin + options.marginTop + options.fontSize;
              }
              ctx.font = font;
              if (options.textAlign == "left" || encoding.barcodePadding > 0) {
                x = 0;
                ctx.textAlign = "left";
              } else if (options.textAlign == "right") {
                x = encoding.width - 1;
                ctx.textAlign = "right";
              } else {
                x = encoding.width / 2;
                ctx.textAlign = "center";
              }
              ctx.fillText(encoding.text, x, y);
            }
          }
        }, {
          key: "moveCanvasDrawing",
          value: function moveCanvasDrawing(encoding) {
            var ctx = this.canvas.getContext("2d");
            ctx.translate(encoding.width, 0);
          }
        }, {
          key: "restoreCanvas",
          value: function restoreCanvas() {
            var ctx = this.canvas.getContext("2d");
            ctx.restore();
          }
        }]);
        return CanvasRenderer2;
      }();
      exports.default = CanvasRenderer;
    }
  });

  // ../../node_modules/jsbarcode/bin/renderers/svg.js
  var require_svg = __commonJS({
    "../../node_modules/jsbarcode/bin/renderers/svg.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      var _merge = require_merge();
      var _merge2 = _interopRequireDefault(_merge);
      var _shared = require_shared();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      var svgns = "http://www.w3.org/2000/svg";
      var SVGRenderer = function() {
        function SVGRenderer2(svg, encodings, options) {
          _classCallCheck(this, SVGRenderer2);
          this.svg = svg;
          this.encodings = encodings;
          this.options = options;
          this.document = options.xmlDocument || document;
        }
        _createClass(SVGRenderer2, [{
          key: "render",
          value: function render() {
            var currentX = this.options.marginLeft;
            this.prepareSVG();
            for (var i = 0; i < this.encodings.length; i++) {
              var encoding = this.encodings[i];
              var encodingOptions = (0, _merge2.default)(this.options, encoding.options);
              var group = this.createGroup(currentX, encodingOptions.marginTop, this.svg);
              this.setGroupOptions(group, encodingOptions);
              this.drawSvgBarcode(group, encodingOptions, encoding);
              this.drawSVGText(group, encodingOptions, encoding);
              currentX += encoding.width;
            }
          }
        }, {
          key: "prepareSVG",
          value: function prepareSVG() {
            while (this.svg.firstChild) {
              this.svg.removeChild(this.svg.firstChild);
            }
            (0, _shared.calculateEncodingAttributes)(this.encodings, this.options);
            var totalWidth = (0, _shared.getTotalWidthOfEncodings)(this.encodings);
            var maxHeight = (0, _shared.getMaximumHeightOfEncodings)(this.encodings);
            var width = totalWidth + this.options.marginLeft + this.options.marginRight;
            this.setSvgAttributes(width, maxHeight);
            if (this.options.background) {
              this.drawRect(0, 0, width, maxHeight, this.svg).setAttribute("style", "fill:" + this.options.background + ";");
            }
          }
        }, {
          key: "drawSvgBarcode",
          value: function drawSvgBarcode(parent, options, encoding) {
            var binary = encoding.data;
            var yFrom;
            if (options.textPosition == "top") {
              yFrom = options.fontSize + options.textMargin;
            } else {
              yFrom = 0;
            }
            var barWidth = 0;
            var x = 0;
            for (var b = 0; b < binary.length; b++) {
              x = b * options.width + encoding.barcodePadding;
              if (binary[b] === "1") {
                barWidth++;
              } else if (barWidth > 0) {
                this.drawRect(x - options.width * barWidth, yFrom, options.width * barWidth, options.height, parent);
                barWidth = 0;
              }
            }
            if (barWidth > 0) {
              this.drawRect(x - options.width * (barWidth - 1), yFrom, options.width * barWidth, options.height, parent);
            }
          }
        }, {
          key: "drawSVGText",
          value: function drawSVGText(parent, options, encoding) {
            var textElem = this.document.createElementNS(svgns, "text");
            if (options.displayValue) {
              var x, y;
              textElem.setAttribute("style", "font:" + options.fontOptions + " " + options.fontSize + "px " + options.font);
              if (options.textPosition == "top") {
                y = options.fontSize - options.textMargin;
              } else {
                y = options.height + options.textMargin + options.fontSize;
              }
              if (options.textAlign == "left" || encoding.barcodePadding > 0) {
                x = 0;
                textElem.setAttribute("text-anchor", "start");
              } else if (options.textAlign == "right") {
                x = encoding.width - 1;
                textElem.setAttribute("text-anchor", "end");
              } else {
                x = encoding.width / 2;
                textElem.setAttribute("text-anchor", "middle");
              }
              textElem.setAttribute("x", x);
              textElem.setAttribute("y", y);
              textElem.appendChild(this.document.createTextNode(encoding.text));
              parent.appendChild(textElem);
            }
          }
        }, {
          key: "setSvgAttributes",
          value: function setSvgAttributes(width, height) {
            var svg = this.svg;
            svg.setAttribute("width", width + "px");
            svg.setAttribute("height", height + "px");
            svg.setAttribute("x", "0px");
            svg.setAttribute("y", "0px");
            svg.setAttribute("viewBox", "0 0 " + width + " " + height);
            svg.setAttribute("xmlns", svgns);
            svg.setAttribute("version", "1.1");
            svg.setAttribute("style", "transform: translate(0,0)");
          }
        }, {
          key: "createGroup",
          value: function createGroup(x, y, parent) {
            var group = this.document.createElementNS(svgns, "g");
            group.setAttribute("transform", "translate(" + x + ", " + y + ")");
            parent.appendChild(group);
            return group;
          }
        }, {
          key: "setGroupOptions",
          value: function setGroupOptions(group, options) {
            group.setAttribute("style", "fill:" + options.lineColor + ";");
          }
        }, {
          key: "drawRect",
          value: function drawRect(x, y, width, height, parent) {
            var rect = this.document.createElementNS(svgns, "rect");
            rect.setAttribute("x", x);
            rect.setAttribute("y", y);
            rect.setAttribute("width", width);
            rect.setAttribute("height", height);
            parent.appendChild(rect);
            return rect;
          }
        }]);
        return SVGRenderer2;
      }();
      exports.default = SVGRenderer;
    }
  });

  // ../../node_modules/jsbarcode/bin/renderers/object.js
  var require_object = __commonJS({
    "../../node_modules/jsbarcode/bin/renderers/object.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      var ObjectRenderer = function() {
        function ObjectRenderer2(object, encodings, options) {
          _classCallCheck(this, ObjectRenderer2);
          this.object = object;
          this.encodings = encodings;
          this.options = options;
        }
        _createClass(ObjectRenderer2, [{
          key: "render",
          value: function render() {
            this.object.encodings = this.encodings;
          }
        }]);
        return ObjectRenderer2;
      }();
      exports.default = ObjectRenderer;
    }
  });

  // ../../node_modules/jsbarcode/bin/renderers/index.js
  var require_renderers = __commonJS({
    "../../node_modules/jsbarcode/bin/renderers/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _canvas = require_canvas();
      var _canvas2 = _interopRequireDefault(_canvas);
      var _svg = require_svg();
      var _svg2 = _interopRequireDefault(_svg);
      var _object = require_object();
      var _object2 = _interopRequireDefault(_object);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      exports.default = { CanvasRenderer: _canvas2.default, SVGRenderer: _svg2.default, ObjectRenderer: _object2.default };
    }
  });

  // ../../node_modules/jsbarcode/bin/exceptions/exceptions.js
  var require_exceptions = __commonJS({
    "../../node_modules/jsbarcode/bin/exceptions/exceptions.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _possibleConstructorReturn(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      }
      function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
        if (superClass)
          Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      }
      var InvalidInputException = function(_Error) {
        _inherits(InvalidInputException2, _Error);
        function InvalidInputException2(symbology, input) {
          _classCallCheck(this, InvalidInputException2);
          var _this = _possibleConstructorReturn(this, (InvalidInputException2.__proto__ || Object.getPrototypeOf(InvalidInputException2)).call(this));
          _this.name = "InvalidInputException";
          _this.symbology = symbology;
          _this.input = input;
          _this.message = '"' + _this.input + '" is not a valid input for ' + _this.symbology;
          return _this;
        }
        return InvalidInputException2;
      }(Error);
      var InvalidElementException = function(_Error2) {
        _inherits(InvalidElementException2, _Error2);
        function InvalidElementException2() {
          _classCallCheck(this, InvalidElementException2);
          var _this2 = _possibleConstructorReturn(this, (InvalidElementException2.__proto__ || Object.getPrototypeOf(InvalidElementException2)).call(this));
          _this2.name = "InvalidElementException";
          _this2.message = "Not supported type to render on";
          return _this2;
        }
        return InvalidElementException2;
      }(Error);
      var NoElementException = function(_Error3) {
        _inherits(NoElementException2, _Error3);
        function NoElementException2() {
          _classCallCheck(this, NoElementException2);
          var _this3 = _possibleConstructorReturn(this, (NoElementException2.__proto__ || Object.getPrototypeOf(NoElementException2)).call(this));
          _this3.name = "NoElementException";
          _this3.message = "No element to render on.";
          return _this3;
        }
        return NoElementException2;
      }(Error);
      exports.InvalidInputException = InvalidInputException;
      exports.InvalidElementException = InvalidElementException;
      exports.NoElementException = NoElementException;
    }
  });

  // ../../node_modules/jsbarcode/bin/help/getRenderProperties.js
  var require_getRenderProperties = __commonJS({
    "../../node_modules/jsbarcode/bin/help/getRenderProperties.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
        return typeof obj;
      } : function(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
      var _getOptionsFromElement = require_getOptionsFromElement();
      var _getOptionsFromElement2 = _interopRequireDefault(_getOptionsFromElement);
      var _renderers = require_renderers();
      var _renderers2 = _interopRequireDefault(_renderers);
      var _exceptions = require_exceptions();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      function getRenderProperties(element) {
        if (typeof element === "string") {
          return querySelectedRenderProperties(element);
        } else if (Array.isArray(element)) {
          var returnArray = [];
          for (var i = 0; i < element.length; i++) {
            returnArray.push(getRenderProperties(element[i]));
          }
          return returnArray;
        } else if (typeof HTMLCanvasElement !== "undefined" && element instanceof HTMLImageElement) {
          return newCanvasRenderProperties(element);
        } else if (element && element.nodeName && element.nodeName.toLowerCase() === "svg" || typeof SVGElement !== "undefined" && element instanceof SVGElement) {
          return {
            element,
            options: (0, _getOptionsFromElement2.default)(element),
            renderer: _renderers2.default.SVGRenderer
          };
        } else if (typeof HTMLCanvasElement !== "undefined" && element instanceof HTMLCanvasElement) {
          return {
            element,
            options: (0, _getOptionsFromElement2.default)(element),
            renderer: _renderers2.default.CanvasRenderer
          };
        } else if (element && element.getContext) {
          return {
            element,
            renderer: _renderers2.default.CanvasRenderer
          };
        } else if (element && (typeof element === "undefined" ? "undefined" : _typeof(element)) === "object" && !element.nodeName) {
          return {
            element,
            renderer: _renderers2.default.ObjectRenderer
          };
        } else {
          throw new _exceptions.InvalidElementException();
        }
      }
      function querySelectedRenderProperties(string) {
        var selector = document.querySelectorAll(string);
        if (selector.length === 0) {
          return void 0;
        } else {
          var returnArray = [];
          for (var i = 0; i < selector.length; i++) {
            returnArray.push(getRenderProperties(selector[i]));
          }
          return returnArray;
        }
      }
      function newCanvasRenderProperties(imgElement) {
        var canvas = document.createElement("canvas");
        return {
          element: canvas,
          options: (0, _getOptionsFromElement2.default)(imgElement),
          renderer: _renderers2.default.CanvasRenderer,
          afterRender: function afterRender() {
            imgElement.setAttribute("src", canvas.toDataURL());
          }
        };
      }
      exports.default = getRenderProperties;
    }
  });

  // ../../node_modules/jsbarcode/bin/exceptions/ErrorHandler.js
  var require_ErrorHandler = __commonJS({
    "../../node_modules/jsbarcode/bin/exceptions/ErrorHandler.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor)
              descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps)
            defineProperties(Constructor.prototype, protoProps);
          if (staticProps)
            defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      var ErrorHandler = function() {
        function ErrorHandler2(api) {
          _classCallCheck(this, ErrorHandler2);
          this.api = api;
        }
        _createClass(ErrorHandler2, [{
          key: "handleCatch",
          value: function handleCatch(e) {
            if (e.name === "InvalidInputException") {
              if (this.api._options.valid !== this.api._defaults.valid) {
                this.api._options.valid(false);
              } else {
                throw e.message;
              }
            } else {
              throw e;
            }
            this.api.render = function() {
            };
          }
        }, {
          key: "wrapBarcodeCall",
          value: function wrapBarcodeCall(func) {
            try {
              var result = func.apply(void 0, arguments);
              this.api._options.valid(true);
              return result;
            } catch (e) {
              this.handleCatch(e);
              return this.api;
            }
          }
        }]);
        return ErrorHandler2;
      }();
      exports.default = ErrorHandler;
    }
  });

  // ../../node_modules/jsbarcode/bin/JsBarcode.js
  var require_JsBarcode = __commonJS({
    "../../node_modules/jsbarcode/bin/JsBarcode.js"(exports, module) {
      "use strict";
      var _barcodes = require_barcodes();
      var _barcodes2 = _interopRequireDefault(_barcodes);
      var _merge = require_merge();
      var _merge2 = _interopRequireDefault(_merge);
      var _linearizeEncodings = require_linearizeEncodings();
      var _linearizeEncodings2 = _interopRequireDefault(_linearizeEncodings);
      var _fixOptions = require_fixOptions();
      var _fixOptions2 = _interopRequireDefault(_fixOptions);
      var _getRenderProperties = require_getRenderProperties();
      var _getRenderProperties2 = _interopRequireDefault(_getRenderProperties);
      var _optionsFromStrings = require_optionsFromStrings();
      var _optionsFromStrings2 = _interopRequireDefault(_optionsFromStrings);
      var _ErrorHandler = require_ErrorHandler();
      var _ErrorHandler2 = _interopRequireDefault(_ErrorHandler);
      var _exceptions = require_exceptions();
      var _defaults = require_defaults();
      var _defaults2 = _interopRequireDefault(_defaults);
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }
      var API = function API2() {
      };
      var JsBarcode = function JsBarcode2(element, text, options) {
        var api = new API();
        if (typeof element === "undefined") {
          throw Error("No element to render on was provided.");
        }
        api._renderProperties = (0, _getRenderProperties2.default)(element);
        api._encodings = [];
        api._options = _defaults2.default;
        api._errorHandler = new _ErrorHandler2.default(api);
        if (typeof text !== "undefined") {
          options = options || {};
          if (!options.format) {
            options.format = autoSelectBarcode();
          }
          api.options(options)[options.format](text, options).render();
        }
        return api;
      };
      JsBarcode.getModule = function(name2) {
        return _barcodes2.default[name2];
      };
      for (name in _barcodes2.default) {
        if (_barcodes2.default.hasOwnProperty(name)) {
          registerBarcode(_barcodes2.default, name);
        }
      }
      var name;
      function registerBarcode(barcodes, name2) {
        API.prototype[name2] = API.prototype[name2.toUpperCase()] = API.prototype[name2.toLowerCase()] = function(text, options) {
          var api = this;
          return api._errorHandler.wrapBarcodeCall(function() {
            options.text = typeof options.text === "undefined" ? void 0 : "" + options.text;
            var newOptions = (0, _merge2.default)(api._options, options);
            newOptions = (0, _optionsFromStrings2.default)(newOptions);
            var Encoder = barcodes[name2];
            var encoded = encode(text, Encoder, newOptions);
            api._encodings.push(encoded);
            return api;
          });
        };
      }
      function encode(text, Encoder, options) {
        text = "" + text;
        var encoder = new Encoder(text, options);
        if (!encoder.valid()) {
          throw new _exceptions.InvalidInputException(encoder.constructor.name, text);
        }
        var encoded = encoder.encode();
        encoded = (0, _linearizeEncodings2.default)(encoded);
        for (var i = 0; i < encoded.length; i++) {
          encoded[i].options = (0, _merge2.default)(options, encoded[i].options);
        }
        return encoded;
      }
      function autoSelectBarcode() {
        if (_barcodes2.default["CODE128"]) {
          return "CODE128";
        }
        return Object.keys(_barcodes2.default)[0];
      }
      API.prototype.options = function(options) {
        this._options = (0, _merge2.default)(this._options, options);
        return this;
      };
      API.prototype.blank = function(size) {
        var zeroes = new Array(size + 1).join("0");
        this._encodings.push({ data: zeroes });
        return this;
      };
      API.prototype.init = function() {
        if (!this._renderProperties) {
          return;
        }
        if (!Array.isArray(this._renderProperties)) {
          this._renderProperties = [this._renderProperties];
        }
        var renderProperty;
        for (var i in this._renderProperties) {
          renderProperty = this._renderProperties[i];
          var options = (0, _merge2.default)(this._options, renderProperty.options);
          if (options.format == "auto") {
            options.format = autoSelectBarcode();
          }
          this._errorHandler.wrapBarcodeCall(function() {
            var text = options.value;
            var Encoder = _barcodes2.default[options.format.toUpperCase()];
            var encoded = encode(text, Encoder, options);
            render(renderProperty, encoded, options);
          });
        }
      };
      API.prototype.render = function() {
        if (!this._renderProperties) {
          throw new _exceptions.NoElementException();
        }
        if (Array.isArray(this._renderProperties)) {
          for (var i = 0; i < this._renderProperties.length; i++) {
            render(this._renderProperties[i], this._encodings, this._options);
          }
        } else {
          render(this._renderProperties, this._encodings, this._options);
        }
        return this;
      };
      API.prototype._defaults = _defaults2.default;
      function render(renderProperties, encodings, options) {
        encodings = (0, _linearizeEncodings2.default)(encodings);
        for (var i = 0; i < encodings.length; i++) {
          encodings[i].options = (0, _merge2.default)(options, encodings[i].options);
          (0, _fixOptions2.default)(encodings[i].options);
        }
        (0, _fixOptions2.default)(options);
        var Renderer = renderProperties.renderer;
        var renderer = new Renderer(renderProperties.element, encodings, options);
        renderer.render();
        if (renderProperties.afterRender) {
          renderProperties.afterRender();
        }
      }
      if (typeof window !== "undefined") {
        window.JsBarcode = JsBarcode;
      }
      if (typeof jQuery !== "undefined") {
        jQuery.fn.JsBarcode = function(content, options) {
          var elementArray = [];
          jQuery(this).each(function() {
            elementArray.push(this);
          });
          return JsBarcode(elementArray, content, options);
        };
      }
      module.exports = JsBarcode;
    }
  });

  // ../custom_app/custom_app/customapp/page/packing_list/packing_list_item_selector.js
  var import_onscan = __toESM(require_onscan());
  custom_app.PointOfSale.ItemSelector = class {
    constructor({ frm, wrapper, events, pos_profile, settings }) {
      this.wrapper = wrapper;
      this.events = events;
      this.pos_profile = pos_profile;
      this.hide_images = settings.hide_images;
      this.auto_add_item = settings.auto_add_item_to_cart;
      this.init_component();
    }
    init_component() {
      this.prepare_dom();
      this.make_search_bar();
      this.load_items_data();
      this.bind_events();
      this.attach_shortcuts();
      this.inject_css();
    }
    inject_css() {
      const css = `
			.highlight {
				background-color: #f2f2f2;
			}
            .text{
                font-size: 1em;
                font-weight: semi-bold;
            }
            .text-description{
                font-size: 1em;
                font-weight: semi-bold;
            }
            .quantity-field{
                width: 1rem;
                height: 10rem;
            }
            .custom-quantity-field {
                width: 200px; /* Adjust the width as needed */
            }
		`;
      const style = document.createElement("style");
      style.type = "text/css";
      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
      document.head.appendChild(style);
    }
    prepare_dom() {
      const selectedWarehouse = localStorage.getItem("selected_warehouse");
      this.wrapper.append(
        `<section class="items-selector" style="margin-top:1.3rem;">
				<div class="filter-section">
				<div class="label">
				${__("All Items")} ${selectedWarehouse ? selectedWarehouse : ""}
			</div>
                    <div class="search-field"></div>
					<div class="item-group-field"></div>
				</div>
				<div class="table-responsive">
					<table class="table items-table">
					    <thead style="position: sticky; top: 0; background-color: #fff; z-index: 1;">
							<tr>
								<th>Item Code</th>
								<th>Name</th>
								<th>Vat</th>
								<th>Price</th>
								<th>UOM</th>
								<th>QTY</th>
							</tr>
						</thead>

						<tbody class="items-container"></tbody>
					</table>
				</div>
			</section>`
      );
      this.$component = this.wrapper.find(".items-selector");
      this.$items_container = this.$component.find(".items-container");
    }
    async load_items_data() {
      if (!this.item_group) {
        const res = await frappe.db.get_value("Item Group", { lft: 1, is_group: 1 }, "name");
        this.parent_item_group = res.message.name;
      }
      if (!this.price_list) {
        const res = await frappe.db.get_value("POS Profile", this.pos_profile, "selling_price_list");
        this.price_list = res.message.selling_price_list;
      }
      this.get_items({}).then(({ message }) => {
        this.render_item_list(message.items);
      });
    }
    get_items({ start = 0, page_length = 40, search_term = "" }) {
      const doc = this.events.get_frm().doc;
      const price_list = doc && doc.selling_price_list || this.price_list;
      let { item_group, pos_profile } = this;
      !item_group && (item_group = this.parent_item_group);
      const selected_warehouse = localStorage.getItem("selected_warehouse");
      return frappe.call({
        method: "custom_app.customapp.page.packing_list.packing_list.get_items",
        freeze: true,
        args: {
          start,
          page_length,
          price_list,
          item_group,
          search_term,
          pos_profile,
          selected_warehouse
        }
      });
    }
    render_item_list(items) {
      this.$items_container.html("");
      this.items = items;
      items.forEach((item) => {
        const item_html = this.get_item_html(item);
        this.$items_container.append(item_html);
      });
      this.highlighted_row_index = 0;
      this.highlight_row(this.highlighted_row_index);
    }
    get_item_html(item) {
      const me = this;
      const { item_code, item_image, serial_no, batch_no, barcode, actual_qty, uom, price_list_rate, description, latest_expiry_date, batch_number, custom_is_vatable } = item;
      const precision2 = flt(price_list_rate, 2) % 1 != 0 ? 2 : 0;
      let indicator_color;
      let qty_to_display = actual_qty;
      if (item.is_stock_item) {
        indicator_color = actual_qty > 10 ? "green" : actual_qty <= 0 ? "red" : "orange";
        if (Math.round(qty_to_display) > 999) {
          qty_to_display = Math.round(qty_to_display) / 1e3;
          qty_to_display = qty_to_display.toFixed(1) + "K";
        }
      } else {
        indicator_color = "";
        qty_to_display = "";
      }
      const item_description = description ? description : "Description not available";
      return `<tr class="item-wrapper" style="border-bottom: 1px solid #ddd;" onmouseover="this.style.backgroundColor='#f2f2f2';" onmouseout="this.style.backgroundColor='';"
            data-item-code="${escape(item_code)}" data-serial-no="${escape(serial_no)}"
            data-batch-no="${escape(batch_no)}" data-uom="${escape(uom)}"
            data-rate="${escape(price_list_rate || 0)}" data-description="${escape(item_description)}">
            <td class="item-code">${item_code}</td> 
            <td class="item-name text-break">${frappe.ellipsis(item.item_name, 18)}</td>
            <td class="item-vat">${custom_is_vatable == 0 ? "VAT-Exempt" : "VATable"}</td>
            <td class="item-rate text-break">${format_currency(price_list_rate, item.currency, precision2) || 0}</td>
            <td class="item-uom">${uom}</td>
            <td class="item-qty"><span class="indicator-pill whitespace-nowrap ${indicator_color}">${qty_to_display}</span></td>
        </tr>`;
    }
    handle_broken_image($img) {
      const item_abbr = $($img).attr("alt");
      $($img).parent().replaceWith(`<div class="item-display abbr">${item_abbr}</div>`);
    }
    make_search_bar() {
      const me = this;
      const doc = me.events.get_frm().doc;
      this.$component.find(".search-field").html("");
      this.$component.find(".item-group-field").html("");
      this.search_field = frappe.ui.form.make_control({
        df: {
          label: __("Search"),
          fieldtype: "Data",
          placeholder: __("Search by item code, serial number or barcode")
        },
        parent: this.$component.find(".search-field"),
        render_input: true
      });
      this.item_group_field = frappe.ui.form.make_control({
        df: {
          label: __("Item Group"),
          fieldtype: "Link",
          options: "Item Group",
          placeholder: __("Select item group"),
          onchange: function() {
            me.item_group = this.value;
            !me.item_group && (me.item_group = me.parent_item_group);
            me.filter_items();
          },
          get_query: function() {
            return {
              query: "custom_app.customapp.page.packing_list.packing_list.item_group_query",
              filters: {
                pos_profile: doc ? doc.pos_profile : ""
              }
            };
          }
        },
        parent: this.$component.find(".item-group-field"),
        render_input: true
      });
      this.search_field.toggle_label(false);
      this.item_group_field.toggle_label(false);
      this.attach_clear_btn();
    }
    attach_clear_btn() {
      this.search_field.$wrapper.find(".control-input").append(
        `<span class="link-btn" style="top: 2px;">
				<a class="btn-open no-decoration" title="${__("Clear")}">
					${frappe.utils.icon("close", "sm")}
				</a>
			</span>`
      );
      this.$clear_search_btn = this.search_field.$wrapper.find(".link-btn");
      this.$clear_search_btn.on("click", "a", () => {
        this.set_search_value("");
        this.search_field.set_focus();
      });
    }
    set_search_value(value) {
      $(this.search_field.$input[0]).val(value).trigger("input");
    }
    bind_events() {
      const me = this;
      window.onScan = import_onscan.default;
      import_onscan.default.decodeKeyEvent = function(oEvent) {
        var iCode = this._getNormalizedKeyNum(oEvent);
        switch (true) {
          case (iCode >= 48 && iCode <= 90):
          case (iCode >= 106 && iCode <= 111):
          case (iCode >= 160 && iCode <= 164 || iCode == 170):
          case (iCode >= 186 && iCode <= 194):
          case (iCode >= 219 && iCode <= 222):
          case iCode == 32:
            if (oEvent.key !== void 0 && oEvent.key !== "") {
              return oEvent.key;
            }
            var sDecoded = String.fromCharCode(iCode);
            switch (oEvent.shiftKey) {
              case false:
                sDecoded = sDecoded.toLowerCase();
                break;
              case true:
                sDecoded = sDecoded.toUpperCase();
                break;
            }
            return sDecoded;
          case (iCode >= 96 && iCode <= 105):
            return 0 + (iCode - 96);
        }
        return "";
      };
      import_onscan.default.attachTo(document, {
        onScan: (sScancode) => {
          if (this.search_field && this.$component.is(":visible")) {
            this.search_field.set_focus();
            this.set_search_value(sScancode);
            this.barcode_scanned = true;
          }
        }
      });
      let selectedUOM2;
      this.$component.on("click", ".item-wrapper", async function() {
        const $item = $(this);
        me.selectedItem = $item;
        const item_code = unescape($item.attr("data-item-code"));
        const uom = unescape($item.attr("data-uom"));
        const rate2 = parseFloat(unescape($item.attr("data-rate")));
        const description = unescape($item.attr("data-description"));
        frappe.call({
          method: "custom_app.customapp.page.packing_list.packing_list.get_item_uoms",
          args: {
            item_code
          },
          callback: function(response) {
            if (response.message) {
              const uomOptions = response.message.uoms.map((uom2) => ({
                label: uom2.uom,
                value: uom2.uom
              }));
              const dialog2 = new frappe.ui.Dialog({
                title: __("Item Details"),
                fields: [
                  {
                    fieldtype: "HTML",
                    label: __("Item Code and Description"),
                    options: `
                                        <div class="row mb-4">
                                            <div class="col-lg-6">
                                                <div class="card w-80 h-80">
                                                    <div class="card-body">
                                                        <p class="text-description">${item_code}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-lg-6">
                                                <div class="card w-80 h-80">
                                                    <div class="card-body">
                                                        <div class="row">
                                                            <div class="col">
                                                                <p class="text-description">${description}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `
                  },
                  {
                    fieldtype: "HTML",
                    label: __("Quantity"),
                    options: `
                                    <div class="row">
                                        <div class="col-lg">
                                            <div class="form-group">
                                                <label class="control-label">${__("Quantity")}</label>
                                                <input class="form-control" type="number" data-fieldname="quantity" required value="1" />
                                            </div>
                                        </div>
                                    </div>
                                    `
                  },
                  {
                    fieldtype: "Select",
                    label: __("UOM"),
                    fieldname: "uom",
                    options: uomOptions,
                    default: "PC"
                  },
                  {
                    fieldtype: "HTML",
                    label: __("Amount"),
                    options: `
                                        <div class="row">
                                            <div class="col-lg">
                                                <div class="form-group">
                                                    <label class="control-label">Amount</label>
                                                    <input class="form-control" data-fieldname="total_amount" value="${rate2.toFixed(2)}" readonly />
                                                </div>
                                            </div>
                                        </div>
                                    `
                  }
                ],
                primary_action_label: __("Ok"),
                primary_action: function() {
                  const quantity2 = parseFloat(dialog2.wrapper.find('input[data-fieldname="quantity"]').val());
                  const selectedUOM3 = dialog2.wrapper.find('select[data-fieldname="uom"]').val();
                  const totalAmount = parseFloat(dialog2.wrapper.find('input[data-fieldname="total_amount"]').val());
                  if (!quantity2 || quantity2 <= 0) {
                    frappe.msgprint(__("Please enter a valid quantity."));
                    return;
                  }
                  dialog2.hide();
                  if (!me.selectedItem) {
                    frappe.msgprint(__("No item selected."));
                    return;
                  }
                  me.selectedItem.find(".item-uom").text(selectedUOM3);
                  const itemCode = unescape(me.selectedItem.attr("data-item-code"));
                  const batchNo = unescape(me.selectedItem.attr("data-batch-no"));
                  const serialNo = unescape(me.selectedItem.attr("data-serial-no"));
                  me.events.item_selected({
                    field: "qty",
                    value: "+" + quantity2,
                    item: { item_code: itemCode, batch_no: batchNo, serial_no: serialNo, uom: selectedUOM3, quantity: quantity2, rate: totalAmount }
                  });
                  me.search_field.set_focus();
                }
              });
              dialog2.show();
              dialog2.wrapper.find('input[data-fieldname="quantity"]').on("input", function() {
                const quantity2 = parseFloat($(this).val());
                if (!isNaN(quantity2)) {
                  const totalAmount = (quantity2 * rate2).toFixed(2);
                  dialog2.wrapper.find('input[data-fieldname="total_amount"]').val(totalAmount);
                } else {
                  dialog2.wrapper.find('input[data-fieldname="total_amount"]').val(rate2.toFixed(2));
                }
              });
            }
          }
        });
      });
      this.search_field.$input.on("input", (e) => {
        clearTimeout(this.last_search);
        this.last_search = setTimeout(() => {
          const search_term = e.target.value;
          this.filter_items({ search_term });
        }, 300);
        this.$clear_search_btn.toggle(Boolean(this.search_field.$input.val()));
      });
      this.search_field.$input.on("focus", () => {
        this.$clear_search_btn.toggle(Boolean(this.search_field.$input.val()));
      });
      this.$component.on("keydown", (e) => {
        const key = e.which || e.keyCode;
        switch (key) {
          case 38:
            e.preventDefault();
            this.navigate_up();
            break;
          case 40:
            e.preventDefault();
            this.navigate_down();
            break;
          case 9:
            e.preventDefault();
            this.navigate_down();
            this.focus_next_field();
            break;
          case 13:
            e.preventDefault();
            this.select_highlighted_item();
            break;
        }
      });
    }
    attach_shortcuts() {
      const ctrl_label = frappe.utils.is_mac() ? "\u2318" : "Ctrl";
      this.search_field.parent.attr("title", `${ctrl_label}+S`);
      frappe.ui.keys.add_shortcut({
        shortcut: "ctrl+s",
        action: () => this.search_field.set_focus(),
        condition: () => this.$component.is(":visible"),
        description: __("Focus on search input"),
        ignore_inputs: true,
        page: cur_page.page.page
      });
      this.item_group_field.parent.attr("title", `${ctrl_label}+G`);
      frappe.ui.keys.add_shortcut({
        shortcut: "ctrl+g",
        action: () => this.item_group_field.set_focus(),
        condition: () => this.$component.is(":visible"),
        description: __("Focus on Item Group filter"),
        ignore_inputs: true,
        page: cur_page.page.page
      });
      frappe.ui.keys.on("enter", () => {
        const selector_is_visible = this.$component.is(":visible");
        const dialog_is_open = document.querySelector(".modal.show");
        if (!selector_is_visible || this.search_field.get_value() === "")
          return;
        if (this.items.length == 1) {
          this.$items_container.find(".item-wrapper").click();
          frappe.utils.play_sound("submit");
          this.set_search_value("");
        } else if (this.items.length == 0 && this.barcode_scanned) {
          frappe.show_alert({
            message: __("No items found. Scan barcode again."),
            indicator: "orange"
          });
          frappe.utils.play_sound("error");
          this.barcode_scanned = false;
          this.set_search_value("");
        }
        if (dialog_is_open && document.activeElement.tagName === "SELECT") {
          this.selectedItem.find(".item-uom").text(dialog.wrapper.find('select[data-fieldname="uom"]').val());
          const itemCode = unescape(this.selectedItem.attr("data-item-code"));
          const batchNo = unescape(this.selectedItem.attr("data-batch-no"));
          const serialNo = unescape(this.selectedItem.attr("data-serial-no"));
          this.events.item_selected({
            field: "qty",
            value: quantity,
            item: { item_code: itemCode, batch_no: batchNo, serial_no: serialNo, uom: selectedUOM, quantity, rate }
          });
          this.search_field.set_focus();
        }
      });
    }
    focus_next_field() {
      const customerField = document.querySelector("_init_customer_selector");
      const doctorField = document.querySelector("init_doctor_selector");
      if (document.activeElement === this.search_field.$input[0]) {
        customerField.focus();
      } else if (document.activeElement === customerField) {
        doctorField.focus();
      }
    }
    navigate_up() {
      if (this.highlighted_row_index > 0) {
        this.highlighted_row_index--;
        this.highlight_row(this.highlighted_row_index);
      }
    }
    navigate_down() {
      if (this.highlighted_row_index < this.items.length - 1) {
        this.highlighted_row_index++;
        this.highlight_row(this.highlighted_row_index);
      }
    }
    highlight_row(index) {
      this.$items_container.find(".item-wrapper").removeClass("highlight");
      this.$items_container.find(".item-wrapper").eq(index).addClass("highlight");
    }
    select_highlighted_item() {
      this.$items_container.find(".item-wrapper").eq(this.highlighted_row_index).click();
    }
    filter_items({ search_term = "" } = {}) {
      if (search_term) {
        search_term = search_term.toLowerCase();
        this.search_index = this.search_index || {};
        if (this.search_index[search_term]) {
          const items = this.search_index[search_term];
          this.items = items;
          this.render_item_list(items);
          this.auto_add_item && this.items.length == 1 && this.add_filtered_item_to_cart();
          return;
        }
      }
      this.get_items({ search_term }).then(({ message }) => {
        const { items, serial_no, batch_no, barcode } = message;
        if (search_term && !barcode) {
          this.search_index[search_term] = items;
        }
        this.items = items;
        this.render_item_list(items);
        this.auto_add_item && this.items.length == 1 && this.add_filtered_item_to_cart();
      });
    }
    add_filtered_item_to_cart() {
      this.$items_container.find(".item-wrapper").click();
      this.set_search_value("");
    }
    resize_selector(minimize) {
      if (minimize) {
        this.$component.css({
          "opacity": "0",
          "pointer-events": "none",
          "grid-column": "span 1 / span 1",
          "grid-template-columns": "repeat(13, minmax(0, 1fr))"
        });
      } else {
        this.$component.css({
          "opacity": "1",
          "pointer-events": "auto",
          "grid-column": "span 6 / span 6"
        });
        this.$component.find(".filter-section").css("grid-template-columns", "repeat(12, minmax(0, 1fr))");
        this.$component.find(".search-field").css("margin", "0px var(--margin-sm)");
        this.$items_container.css("grid-template-columns", "repeat(4, minmax(0, 1fr))");
      }
    }
    toggle_component(show) {
      this.set_search_value("");
      this.$component.css("display", show ? "flex" : "none");
    }
  };

  // ../custom_app/custom_app/customapp/page/packing_list/packing_list_item_cart.js
  custom_app.PointOfSale.ItemCart = class {
    constructor({ wrapper, events, settings }) {
      this.wrapper = wrapper;
      this.events = events;
      this.customer_info = void 0;
      this.hide_images = settings.hide_images;
      this.allowed_customer_groups = settings.customer_groups;
      this.allowed_doctor_groups = settings.doctor_groups;
      this.allow_rate_change = settings.allow_rate_change;
      this.allow_discount_change = settings.allow_discount_change;
      this.init_component();
    }
    init_component() {
      this.prepare_dom();
      this.init_child_components();
      this.bind_events();
      this.attach_shortcuts();
    }
    prepare_dom() {
      this.wrapper.append(`<section class="customer-cart-container"></section>`);
      this.$component = this.wrapper.find(".customer-cart-container");
    }
    init_child_components() {
      this.init_customer_selector();
      this.init_doctor_selector();
      this.init_cart_components();
    }
    init_customer_selector() {
      this.$component.append(`<div class="customer-section mb-2 mt-4"></div>`);
      this.$customer_section = this.$component.find(".customer-section");
      this.make_customer_selector();
    }
    init_doctor_selector() {
      this.$component.append(`<div class="doctor-section" style="display: flex;
		flex-direction: column;
		padding: var(--padding-md) var(--padding-lg);
		overflow: visible; background-color: var(--fg-color);
		box-shadow: var(--shadow-base);
		border-radius: var(--border-radius-md);
	  }; margin-top: 1em;"></div>`);
      this.$doctor_section = this.$component.find(".doctor-section");
      this.make_doctor_selector();
    }
    reset_customer_selector() {
      const frm = this.events.get_frm();
      frm.set_value("customer", "");
      this.make_customer_selector();
      this.customer_field.set_focus();
    }
    reset_doctor_selector() {
      const frm = this.events.get_frm();
      frm.set_value("doctor", "");
      this.make_doctor_selector();
      this.doctor_field.set_focus();
    }
    init_cart_components() {
      this.$component.append(
        `<div class="cart-container">
				<div class="abs-cart-container">
					<div class="cart-label" >${__("Item Cart")}</div>
					<div class="cart-header">
						<div class="name-header">${__("Item")}</div>
						<div class="qty-header">${__("Vat")}</div>
						<div class="qty-header" >${__("Disc %")}</div>
						<div class="qty-header">${__("Quantity")}</div>
						<div class="rate-amount-header">${__("Amount")}</div>
					</div>
					<div class="cart-items-section"></div>
					<div class="cart-totals-section"></div>
					<div class="numpad-section"></div>
				</div>
			</div>`
      );
      this.$cart_container = this.$component.find(".cart-container");
      this.make_cart_totals_section();
      this.make_cart_items_section();
      this.make_cart_numpad();
    }
    make_cart_items_section() {
      this.$cart_header = this.$component.find(".cart-header");
      this.$cart_items_wrapper = this.$component.find(".cart-items-section");
      this.make_no_items_placeholder();
    }
    make_no_items_placeholder() {
      this.$cart_header.css("display", "none");
      this.$cart_items_wrapper.html(`<div class="no-item-wrapper">${__("No items in cart")}</div>`);
    }
    add_keyboard_navigation() {
      this.$component.on("keydown", '[tabindex="0"]', (e) => {
        if (e.key === "Enter") {
          $(e.target).trigger("click");
        }
        switch (e.key) {
          case "ArrowUp":
            e.preventDefault();
            this.focusPreviousElement(e.target);
            break;
          case "ArrowDown":
            e.preventDefault();
            this.focusNextElement(e.target);
            break;
        }
      });
    }
    focusNextElement(current) {
      let $next = $(current).nextAll('[tabindex="0"]').first();
      if (!$next.length) {
        $next = this.$component.find('[tabindex="0"]').first();
      }
      $next.focus();
    }
    focusPreviousElement(current) {
      let $prev = $(current).prevAll('[tabindex="0"]').first();
      if (!$prev.length) {
        $prev = this.$component.find('[tabindex="0"]').last();
      }
      $prev.focus();
    }
    get_cart_item(item_data) {
      return this.$cart_items_wrapper.find(`[data-row-name="${escape(item_data.name)}"]`);
    }
    get_discount_icon() {
      return `<svg class="discount-icon" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M19 15.6213C19 15.2235 19.158 14.842 19.4393 14.5607L20.9393 13.0607C21.5251 12.4749 21.5251 11.5251 20.9393 10.9393L19.4393 9.43934C19.158 9.15804 19 8.7765 19 8.37868V6.5C19 5.67157 18.3284 5 17.5 5H15.6213C15.2235 5 14.842 4.84196 14.5607 4.56066L13.0607 3.06066C12.4749 2.47487 11.5251 2.47487 10.9393 3.06066L9.43934 4.56066C9.15804 4.84196 8.7765 5 8.37868 5H6.5C5.67157 5 5 5.67157 5 6.5V8.37868C5 8.7765 4.84196 9.15804 4.56066 9.43934L3.06066 10.9393C2.47487 11.5251 2.47487 12.4749 3.06066 13.0607L4.56066 14.5607C4.84196 14.842 5 15.2235 5 15.6213V17.5C5 18.3284 5.67157 19 6.5 19H8.37868C8.7765 19 9.15804 19.158 9.43934 19.4393L10.9393 20.9393C11.5251 21.5251 12.4749 21.5251 13.0607 20.9393L14.5607 19.4393C14.842 19.158 15.2235 19 15.6213 19H17.5C18.3284 19 19 18.3284 19 17.5V15.6213Z" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M15 9L9 15" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M10.5 9.5C10.5 10.0523 10.0523 10.5 9.5 10.5C8.94772 10.5 8.5 10.0523 8.5 9.5C8.5 8.94772 8.94772 8.5 9.5 8.5C10.0523 8.5 10.5 8.94772 10.5 9.5Z" fill="white" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M15.5 14.5C15.5 15.0523 15.0523 15.5 14.5 15.5C13.9477 15.5 13.5 15.0523 13.5 14.5C13.5 13.9477 13.9477 13.5 14.5 13.5C15.0523 13.5 15.5 13.9477 15.5 14.5Z" fill="white" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>`;
    }
    make_cart_totals_section() {
      this.$totals_section = this.$component.find(".cart-totals-section");
      this.$totals_section.append(
        `
			<div class="item-qty-total-container">
				<div class="item-qty-total-label">${__("Total Items")}</div>
				<div class="item-qty-total-value">0.00</div>
			</div>
			<div class="vatable-sales-container mt-2"></div>
			<div class="vat-exempt-container"></div>
			<div class="zero-rated-container"></div>
			<div class="vat-container"></div>
			
			<div class="ex-total-container"></div>
				<div class="net-total-container">
				<div class="net-total-label">${__("Sub Total")}</div>
				<div class="net-total-value">0.00</div>
			</div>

		 <div class="taxes-container"></div>
			<div class="grand-total-container">
				<div>${__("Total")}</div>
				<div>0.00</div>
			</div> 

			<div class="checkout-btn">${__("Order")}</div>
			<div class="edit-cart-btn">${__("Edit Cart")}</div>`
      );
      this.$add_discount_elem = this.$component.find(".add-discount-wrapper");
    }
    make_cart_numpad() {
      this.$numpad_section = this.$component.find(".numpad-section");
      this.number_pad = new custom_app.PointOfSale.NumberPad({
        wrapper: this.$numpad_section,
        events: {
          numpad_event: this.on_numpad_event.bind(this)
        },
        cols: 5,
        keys: [
          ["Discount", "Quantity", "Rate", "Remove"]
        ],
        css_classes: [
          ["", "", "", "col-span-2 remove-btn"],
          ["", "", "", "col-span-2"],
          ["", "", "", "col-span-2"]
        ],
        fieldnames_map: { Quantity: "qty", Discount: "discount_percentage" }
      });
      this.$numpad_section.prepend(
        `<div class="numpad-totals">
			<span class="numpad-item-qty-total"></span>
				<span class="numpad-net-total"></span>
				<span class="numpad-grand-total"></span>
			</div>`
      );
      this.$numpad_section.append(
        `<div class="numpad-btn checkout-btn" data-button-value="checkout">${__("Checkout")}</div>`
      );
    }
    bind_events() {
      const me = this;
      this.$customer_section.on("click", ".reset-customer-btn", function() {
        me.reset_customer_selector();
      });
      this.$customer_section.on("click", ".close-details-btn", function() {
        me.toggle_customer_info(false);
      });
      this.$customer_section.on("click", ".customer-display", function(e) {
        if ($(e.target).closest(".reset-customer-btn").length)
          return;
        const show = me.$cart_container.is(":visible");
        me.toggle_customer_info(show);
      });
      this.$doctor_section.on("click", ".reset-doctor-btn", function() {
        me.reset_doctor_selector();
      });
      this.$doctor_section.on("click", ".close-details-btn", function() {
        me.toggle_doctor_info(false);
      });
      this.$doctor_section.on("click", ".doctor-display", function(e) {
        if ($(e.target).closest(".reset-doctor-btn").length)
          return;
        const show = me.$cart_container.is(":visible");
        me.toggle_doctor_info(show);
      });
      this.$cart_items_wrapper.on("click", ".cart-item-wrapper", function() {
        const $cart_item = $(this);
        me.toggle_item_highlight(this);
        const payment_section_hidden = !me.$totals_section.find(".edit-cart-btn").is(":visible");
        if (!payment_section_hidden) {
          me.$totals_section.find(".edit-cart-btn").click();
          return;
        }
        const item_row_name = unescape($cart_item.attr("data-row-name"));
        me.events.cart_item_clicked({ name: item_row_name });
        this.numpad_value = "";
      });
      this.$component.on("click", ".checkout-btn", async function() {
        if ($(this).attr("style").indexOf("--blue-500") == -1)
          return;
        await me.events.checkout();
        me.toggle_checkout_btn(false);
        me.allow_discount_change && me.$add_discount_elem.removeClass("d-none");
      });
      this.$totals_section.on("click", ".edit-cart-btn", () => {
        const passwordDialog = new frappe.ui.Dialog({
          title: __("Enter OIC Password"),
          fields: [
            {
              fieldname: "password",
              fieldtype: "Password",
              label: __("Password"),
              reqd: 1
            }
          ],
          primary_action_label: __("Edit Order"),
          primary_action: (values) => {
            let password = values.password;
            let role = "oic";
            frappe.call({
              method: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.confirm_user_password",
              args: { password, role },
              callback: (r) => {
                if (r.message) {
                  this.events.edit_cart();
                  this.toggle_checkout_btn(true);
                  passwordDialog.hide();
                } else {
                  frappe.show_alert({
                    message: __("Incorrect password or user is not an OIC"),
                    indicator: "red"
                  });
                }
              }
            });
          }
        });
        passwordDialog.show();
      });
      this.$component.on("click", ".add-discount-wrapper", () => {
        if (!this.is_oic_authenticated) {
          const passwordDialog = new frappe.ui.Dialog({
            title: __("Enter OIC Password"),
            fields: [
              {
                fieldname: "password",
                fieldtype: "Password",
                label: __("Password"),
                reqd: 1
              }
            ],
            primary_action_label: __("Add Discount"),
            primary_action: (values) => {
              let password = values.password;
              let role = "oic";
              frappe.call({
                method: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.confirm_user_password",
                args: { password, role },
                callback: (r) => {
                  if (r.message) {
                    this.is_oic_authenticated = true;
                    this.show_discount_control();
                    passwordDialog.hide();
                  } else {
                    frappe.show_alert({
                      message: __("Incorrect password or user is not an OIC"),
                      indicator: "red"
                    });
                  }
                }
              });
            }
          });
          passwordDialog.show();
        } else {
          const can_edit_discount = this.$add_discount_elem.find(".edit-discount-btn").length;
          if (!this.discount_field || can_edit_discount)
            this.show_discount_control();
        }
      });
      this.$add_discount_elem.find(".edit-discount-btn").on("click", () => {
        this.is_oic_authenticated = false;
        this.$component.trigger("click", ".add-discount-wrapper");
      });
      frappe.ui.form.on("POS Invoice", "paid_amount", (frm) => {
        this.update_totals_section(frm);
      });
    }
    attach_shortcuts() {
      document.addEventListener("keydown", function(event2) {
        const keysToPrevent = {
          116: true,
          "Ctrl+82": true,
          "Ctrl+16+82": true,
          "Ctrl+83": true,
          "Ctrl+80": true,
          "Ctrl+87": true,
          "Ctrl+Shift+73": true,
          "Ctrl+74": true,
          "Ctrl+69": true
        };
        const key = (event2.ctrlKey ? "Ctrl+" : "") + (event2.shiftKey ? "Shift+" : "") + (event2.altKey ? "Alt+" : "") + event2.keyCode;
        if (keysToPrevent[key] || keysToPrevent[event2.keyCode]) {
          event2.preventDefault();
        }
      });
      for (let row of this.number_pad.keys) {
        for (let btn of row) {
          if (typeof btn !== "string")
            continue;
          let shortcut_key = `ctrl+${frappe.scrub(String(btn))[0]}`;
          if (btn === "Delete")
            shortcut_key = "ctrl+backspace";
          if (btn === "Remove")
            shortcut_key = "ctrl+x";
          if (btn === "Quantity")
            shortcut_key = "ctrl+q";
          if (btn === "Rate")
            shortcut_key = "ctrl+a";
          if (btn === "Discount")
            shortcut_key = "ctrl+shift+d";
          if (btn === ".")
            shortcut_key = "ctrl+>";
          const fieldname = this.number_pad.fieldnames[btn] ? this.number_pad.fieldnames[btn] : typeof btn === "string" ? frappe.scrub(btn) : btn;
          let shortcut_label = shortcut_key.split("+").map(frappe.utils.to_title_case).join("+");
          shortcut_label = frappe.utils.is_mac() ? shortcut_label.replace("Ctrl", "\u2318") : shortcut_label;
          this.$numpad_section.find(`.numpad-btn[data-button-value="${fieldname}"]`).attr("title", shortcut_label);
          frappe.ui.keys.on(`${shortcut_key}`, () => {
            const cart_is_visible = this.$component.is(":visible");
            if (cart_is_visible && this.item_is_selected && this.$numpad_section.is(":visible")) {
              this.$numpad_section.find(`.numpad-btn[data-button-value="${fieldname}"]`).click();
            }
          });
        }
      }
      const ctrl_label = frappe.utils.is_mac() ? "\u2318" : "Ctrl";
      this.$component.find(".checkout-btn").attr("title", `${ctrl_label}+Enter`);
      frappe.ui.keys.add_shortcut({
        shortcut: "ctrl+enter",
        action: () => this.$component.find(".checkout-btn").click(),
        condition: () => this.$component.is(":visible") && !this.$totals_section.find(".edit-cart-btn").is(":visible"),
        description: __("Checkout Order / Submit Order / New Order"),
        ignore_inputs: true,
        page: cur_page.page.page
      });
      this.$component.find(".edit-cart-btn").attr("title", `${ctrl_label}+E`);
      frappe.ui.keys.on("ctrl+e", () => {
        const item_cart_visible = this.$component.is(":visible");
        const checkout_btn_invisible = !this.$totals_section.find(".checkout-btn").is("visible");
        if (item_cart_visible && checkout_btn_invisible) {
          this.$component.find(".edit-cart-btn").click();
        }
      });
      this.$component.find(".add-discount-wrapper").attr("title", `${ctrl_label}+D`);
      frappe.ui.keys.add_shortcut({
        shortcut: "ctrl+d",
        action: () => this.$component.find(".add-discount-wrapper").click(),
        condition: () => this.$add_discount_elem.is(":visible"),
        description: __("Add Order Discount"),
        ignore_inputs: true,
        page: cur_page.page.page
      });
      frappe.ui.keys.on("escape", () => {
        const item_cart_visible = this.$component.is(":visible");
        if (item_cart_visible && this.discount_field && this.discount_field.parent.is(":visible")) {
          this.discount_field.set_value(0);
        }
      });
      this.doctor_field.parent.attr("title", `${ctrl_label}+R`);
      frappe.ui.keys.add_shortcut({
        shortcut: "ctrl+r",
        action: () => this.doctor_field.set_focus(),
        condition: () => this.$component.is(":visible"),
        description: __("Doctor"),
        ignore_inputs: true,
        page: cur_page.page.page
      });
      this.customer_field.parent.attr("title", `${ctrl_label}+M`);
      frappe.ui.keys.add_shortcut({
        shortcut: "ctrl+m",
        action: () => this.customer_field.set_focus(),
        condition: () => this.$component.is(":visible"),
        description: __("Customer"),
        ignore_inputs: true,
        page: cur_page.page.page
      });
      frappe.ui.keys.add_shortcut({
        shortcut: "ctrl+<",
        action: () => {
          this.reset_customer_selector();
        },
        condition: () => true,
        description: __("Reset Customer Selector"),
        ignore_inputs: true,
        page: cur_page.page.page
      });
    }
    toggle_item_highlight(item) {
      const $cart_item = $(item);
      const item_is_highlighted = $cart_item.attr("style") == "background-color:var(--gray-50);";
      if (!item || item_is_highlighted) {
        this.item_is_selected = false;
        this.$cart_container.find(".cart-item-wrapper").css("background-color", "");
      } else {
        $cart_item.css("background-color", "var(--control-bg)");
        this.item_is_selected = true;
        this.$cart_container.find(".cart-item-wrapper").not(item).css("background-color", "");
      }
    }
    make_customer_selector() {
      this.$customer_section.html(`
			<div class="customer-field" tabindex="0"></div>
		`);
      const me = this;
      const allowed_customer_group = this.allowed_customer_groups || [];
      let filters = {};
      if (allowed_customer_group.length) {
        filters = {
          customer_group: ["in", allowed_customer_group]
        };
      }
      this.customer_field = frappe.ui.form.make_control({
        df: {
          label: __("Customer"),
          fieldtype: "Link",
          options: "Customer",
          placeholder: __("Search by customer name, phone, email."),
          get_query: function() {
            return {
              filters
            };
          },
          onchange: function() {
            if (this.value) {
              const frm = me.events.get_frm();
              frappe.dom.freeze();
              frappe.model.set_value(frm.doc.doctype, frm.doc.name, "customer", this.value);
              frm.script_manager.trigger("customer", frm.doc.doctype, frm.doc.name).then(() => {
                frappe.run_serially([
                  () => me.fetch_customer_details(this.value),
                  () => me.events.customer_details_updated(me.customer_info),
                  () => me.update_customer_section(),
                  () => frappe.dom.unfreeze()
                ]);
              });
            }
          }
        },
        parent: this.$customer_section.find(".customer-field"),
        render_input: true
      });
      this.customer_field.toggle_label(false);
    }
    make_doctor_selector() {
      this.$doctor_section.html(`
        <div class="doctor-field"></div>
    `);
      const me = this;
      const allowed_doctor_group = this.allowed_doctor_groups || [];
      let filters = {};
      if (allowed_doctor_group.length) {
        filters = {
          doctor_group: ["in", allowed_doctor_group]
        };
      }
      this.doctor_field = frappe.ui.form.make_control({
        df: {
          label: __("Doctor"),
          fieldtype: "Link",
          options: "Doctor",
          placeholder: __("Doctor"),
          onchange: function() {
            if (this.value) {
              const frm = me.events.get_frm();
              frappe.dom.freeze();
              frappe.model.set_value(frm.doc.doctype, frm.doc.name, "custom_doctors_information", this.value);
              frm.script_manager.trigger("custom_doctors_information", frm.doc.doctype, frm.doc.name).then(() => {
                frappe.run_serially([
                  () => frappe.dom.unfreeze()
                ]);
              });
            }
          }
        },
        parent: this.$doctor_section.find(".doctor-field"),
        render_input: true
      });
      this.doctor_field.toggle_label(false);
      $(document).on("keydown", function(event2) {
        if (event2.altKey && event2.key === "d") {
          me.doctor_field.$input.focus();
        }
      });
    }
    fetch_customer_details(customer) {
      if (customer) {
        return new Promise((resolve) => {
          frappe.db.get_value("Customer", customer, [
            "email_id",
            "mobile_no",
            "custom_oscapwdid",
            "custom_transaction_type",
            "image",
            "loyalty_program",
            "custom_osca_id",
            "custom_pwd_id"
          ]).then(({ message }) => {
            const { loyalty_program } = message;
            if (loyalty_program) {
              frappe.call({
                method: "erpnext.accounts.doctype.loyalty_program.loyalty_program.get_loyalty_program_details_with_points",
                args: { customer, loyalty_program, silent: true },
                callback: (r) => {
                  const { loyalty_points, conversion_factor } = r.message;
                  if (!r.exc) {
                    this.customer_info = __spreadProps(__spreadValues({}, message), {
                      customer,
                      loyalty_points,
                      conversion_factor
                    });
                    resolve();
                  }
                }
              });
            } else {
              this.customer_info = __spreadProps(__spreadValues({}, message), { customer });
              resolve();
            }
          });
        });
      } else {
        return new Promise((resolve) => {
          this.customer_info = {};
          resolve();
        });
      }
    }
    fetch_doctor_details(doctor) {
      if (doctor) {
        return new Promise((resolve) => {
          frappe.db.get_value("Doctor", doctor, ["first_name", "last_name", "prc_number", "image"]).then(({ message }) => {
            this.doctor_info = __spreadProps(__spreadValues({}, message), { doctor });
            console.log(this.doctor_info);
            resolve();
          });
        });
      } else {
        return new Promise((resolve) => {
          this.doctor_info = {};
          resolve();
        });
      }
    }
    show_discount_control() {
      this.$add_discount_elem.css({ padding: "0px", border: "none" });
      this.$add_discount_elem.html(`<div class="add-discount-field"></div>`);
      const me = this;
      const frm = me.events.get_frm();
      let discount = frm.doc.additional_discount_percentage;
      this.discount_field = frappe.ui.form.make_control({
        df: {
          label: __("Discount"),
          fieldtype: "Data",
          placeholder: discount ? discount + "%" : __("Enter discount percentage."),
          input_class: "input-xs",
          onchange: function() {
            if (flt(this.value) != 0) {
              frappe.model.set_value(
                frm.doc.doctype,
                frm.doc.name,
                "additional_discount_percentage",
                flt(this.value)
              );
              me.hide_discount_control(this.value);
            } else {
              frappe.model.set_value(
                frm.doc.doctype,
                frm.doc.name,
                "additional_discount_percentage",
                0
              );
              me.$add_discount_elem.css({
                border: "1px dashed var(--gray-500)",
                padding: "var(--padding-sm) var(--padding-md)"
              });
              me.$add_discount_elem.html(`${me.get_discount_icon()} ${__("Add Discount")}`);
              me.discount_field = void 0;
            }
          }
        },
        parent: this.$add_discount_elem.find(".add-discount-field"),
        render_input: true
      });
      this.discount_field.toggle_label(false);
      this.discount_field.set_focus();
    }
    hide_discount_control(discount) {
      if (!discount) {
        this.$add_discount_elem.css({ padding: "0px", border: "none" });
        this.$add_discount_elem.html(`<div class="add-discount-field"></div>`);
      } else {
        this.$add_discount_elem.css({
          border: "1px dashed var(--dark-green-500)",
          padding: "var(--padding-sm) var(--padding-md)"
        });
        this.$add_discount_elem.html(
          `<div class="edit-discount-btn">
					${this.get_discount_icon()} ${__("Additional")}&nbsp;${String(discount).bold()}% ${__("discount applied")}
				</div>`
        );
      }
    }
    update_customer_section() {
      const me = this;
      const { customer, email_id: email_id2 = "", mobile_no: mobile_no2 = "", image } = this.customer_info || {};
      if (customer) {
        this.$customer_section.html(
          `<div class="customer-details">
					<div class="customer-display">
						${this.get_customer_image()}
						<div class="customer-name-desc">
							<div class="customer-name">${customer}</div>
							${get_customer_description()}
						</div>
						<div class="reset-customer-btn" tabindex="0" data-customer="${escape(customer)}">
							<svg width="32" height="32" viewBox="0 0 14 14" fill="none">
								<path d="M4.93764 4.93759L7.00003 6.99998M9.06243 9.06238L7.00003 6.99998M7.00003 6.99998L4.93764 9.06238L9.06243 4.93759" stroke="#8D99A6"/>
							</svg>
						</div>
					</div>
				</div>`
        );
      } else {
        this.reset_customer_selector();
      }
      function get_customer_description() {
        if (!email_id2 && !mobile_no2) {
          return `<div class="customer-desc">${__("Click to add email / phone")}</div>`;
        } else if (email_id2 && !mobile_no2) {
          return `<div class="customer-desc">${email_id2}</div>`;
        } else if (mobile_no2 && !email_id2) {
          return `<div class="customer-desc">${mobile_no2}</div>`;
        } else {
          return `<div class="customer-desc">${email_id2} - ${mobile_no2}</div>`;
        }
      }
    }
    update_doctor_section() {
      const me = this;
      const { doctor, first_name = "", last_name = "", prc_number = "", image } = this.doctor_info || {};
      if (doctor) {
        this.$doctor_section.html(
          `<div class="doctor-details">
					<div class="doctor-display">
						${this.get_doctor_image()}
						<div class="doctor-name-desc">
							<div class="doctor-name">${doctor}</div>
							${get_doctor_description()}
						</div>
						<div class="reset-doctors-btn" data-doctors="${escape(doctors)}">
							<svg width="32" height="32" viewBox="0 0 14 14" fill="none">
								<path d="M4.93764 4.93759L7.00003 6.99998M9.06243 9.06238L7.00003 6.99998M7.00003 6.99998L4.93764 9.06238L9.06243 4.93759" stroke="#8D99A6"/>
							</svg>
						</div>
					</div>
				</div>`
        );
      } else {
        this.reset_doctor_selector();
      }
      function get_doctor_description() {
        if (!email_id && !mobile_no) {
          return `<div class="doctor-desc">${__("Click to add email / phone")}</div>`;
        } else if (email_id && !mobile_no) {
          return `<div class="doctor-desc">${email_id}</div>`;
        } else if (mobile_no && !email_id) {
          return `<div class="doctor-desc">${mobile_no}</div>`;
        } else {
          return `<div class="doctorvv-desc">${email_id} - ${mobile_no}</div>`;
        }
      }
    }
    get_customer_image() {
      const { customer, image } = this.customer_info || {};
      if (image) {
        return `<div class="customer-image"><img src="${image}" alt="${image}""></div>`;
      } else {
        return `<div class="customer-image customer-abbr">${frappe.get_abbr(customer)}</div>`;
      }
    }
    get_doctor_image() {
      const { doctor, image } = this.doctor_info || {};
      if (image) {
        return `<div class="doctor-image"><img src="${image}" alt="${image}""></div>`;
      } else {
        return `<div class="doctor-image doctor-abbr">${frappe.get_abbr(doctor)}</div>`;
      }
    }
    update_totals_section(frm) {
      if (!frm)
        frm = this.events.get_frm();
      this.render_vatable_sales(frm.doc.custom_vatable_sales);
      this.render_vat_exempt_sales(frm.doc.custom_vat_exempt_sales);
      this.render_zero_rated_sales(frm.doc.custom_zero_rated_sales);
      this.render_vat(frm.doc.custom_vat_amount);
      this.render_net_total(frm.doc.net_total);
      this.render_total_item_qty(frm.doc.items);
      const grand_total = cint(frappe.sys_defaults.disable_rounded_total) ? frm.doc.grand_total : frm.doc.rounded_total;
      this.render_grand_total(grand_total);
    }
    render_net_total(value) {
      const currency = this.events.get_frm().doc.currency;
      this.$totals_section.find(".net-total-container").html(`<div>${__("Sub Total")}</div><div>${format_currency(value, currency)}</div>`);
      this.$numpad_section.find(".numpad-net-total").html(`<div>${__("Sub Total")}: <span>${format_currency(value, currency)}</span></div>`);
    }
    render_vatable_sales(value) {
      const currency = this.events.get_frm().doc.currency;
      this.$totals_section.find(".vatable-sales-container").html(`
				<div style="display: flex; justify-content: space-between;">
					<span style="flex: 1;">${__("VATable Sales")}: </span>
					<span style="flex-shrink: 0;">${format_currency(value, currency)}</span>
				</div>
			`);
    }
    render_vat_exempt_sales(value) {
      const currency = this.events.get_frm().doc.currency;
      this.$totals_section.find(".vat-exempt-container").html(`
				<div style="display: flex; justify-content: space-between;">
					<span style="flex: 1;">${__("VAT-Exempt Sales")}: </span>
					<span style="flex-shrink: 0;">${format_currency(value, currency)}</span>
				</div>
			`);
    }
    render_zero_rated_sales(value) {
      const currency = this.events.get_frm().doc.currency;
      this.$totals_section.find(".zero-rated-container").html(`
				<div style="display: flex; justify-content: space-between;">
					<span style="flex: 1;">${__("Zero Rated Sales")}: </span>
					<span style="flex-shrink: 0;">${format_currency(value, currency)}</span>
				</div>
			`);
    }
    render_vat(value) {
      const currency = this.events.get_frm().doc.currency;
      this.$totals_section.find(".vat-container").html(`
				<div style="display: flex; justify-content: space-between;">
					<span style="flex: 1;">${__("VAT 12%")}: </span>
					<span style="flex-shrink: 0;">${format_currency(value, currency)}</span>
				</div>
			`);
    }
    render_ex_total(value) {
      const currency = this.events.get_frm().doc.currency;
      this.$totals_section.find(".ex-total-container").html(`
				<div style="display: flex; justify-content: space-between;">
					<span style="flex: 1;">${__("Ex Total")}: </span>
					<span style="flex-shrink: 0;">${format_currency(value, currency)}</span>
				</div>
			`);
    }
    render_total_item_qty(items) {
      var total_item_qty = 0;
      items.map((item) => {
        total_item_qty = total_item_qty + item.qty;
      });
      this.$totals_section.find(".item-qty-total-container").html(`<div>${__("Total Quantity")}</div><div>${total_item_qty}</div>`);
      this.$numpad_section.find(".numpad-item-qty-total").html(`<div>${__("Total Quantity")}: <span>${total_item_qty}</span></div>`);
    }
    render_grand_total(value) {
      const currency = this.events.get_frm().doc.currency;
      this.$totals_section.find(".grand-total-container").html(`<div>${__("Total")}</div><div>${format_currency(value, currency)}</div>`);
      this.$numpad_section.find(".numpad-grand-total").html(`<div>${__("Total")}: <span>${format_currency(value, currency)}</span></div>`);
    }
    get_cart_item({ name }) {
      const item_selector = `.cart-item-wrapper[data-row-name="${escape(name)}"]`;
      return this.$cart_items_wrapper.find(item_selector);
    }
    get_item_from_frm(item) {
      const doc = this.events.get_frm().doc;
      return doc.items.find((i) => i.name == item.name);
    }
    update_item_html(item, remove_item) {
      const $item = this.get_cart_item(item);
      let cartItems = JSON.parse(localStorage.getItem("posCartItems")) || [];
      if (remove_item) {
        if ($item) {
          $item.next().remove();
          $item.remove();
          cartItems = cartItems.filter((cartItem) => cartItem.item_code !== item.item_code);
          localStorage.setItem("posCartItems", JSON.stringify(cartItems));
          this.remove_customer();
          this.set_cash_customer();
          frappe.run_serially([
            () => frappe.dom.unfreeze()
          ]);
        }
      } else {
        const item_row = this.get_item_from_frm(item);
        this.render_cart_item(item_row, $item);
        const existingItemIndex = cartItems.findIndex((cartItem) => cartItem.item_code === item.item_code);
        if (existingItemIndex > -1) {
          cartItems[existingItemIndex] = item;
        } else {
          cartItems.push(item);
        }
        localStorage.setItem("posCartItems", JSON.stringify(cartItems));
      }
      const no_of_cart_items = this.$cart_items_wrapper.find(".cart-item-wrapper").length;
      this.highlight_checkout_btn(no_of_cart_items > 0);
      this.update_empty_cart_section(no_of_cart_items);
    }
    remove_customer() {
      const frm = this.events.get_frm();
      const currentCustomer = frm.doc.customer;
      frappe.model.set_value(frm.doc.doctype, frm.doc.name, "custom_customer_2", currentCustomer);
      frappe.model.set_value(frm.doc.doctype, frm.doc.name, "customer", "");
      this.update_customer_section();
    }
    set_cash_customer() {
      const frm = this.events.get_frm();
      const customCustomer2Value = frm.doc.custom_customer_2;
      frappe.model.set_value(frm.doc.doctype, frm.doc.name, "customer", customCustomer2Value);
      this.update_customer_section();
    }
    render_cart_item(item_data, $item_to_update) {
      const currency = this.events.get_frm().doc.currency;
      const me = this;
      if (!$item_to_update.length) {
        this.$cart_items_wrapper.append(
          `<div class="cart-item-wrapper" tabindex="0" data-row-name="${escape(item_data.name)}"></div>
				<div class="separator"></div>`
        );
        $item_to_update = this.get_cart_item(item_data);
      }
      $item_to_update.html(
        `${get_item_image_html()}
			<div class="item-name-desc">
				<div class="item-name">
					${item_data.item_name}
				</div>
				${get_description_html()}
			</div>
			<div class="item-vat mx-3">
				<strong>${item_data.custom_is_item_vatable === 0 ? "VAT-Exempt" : "VATable"}</strong>
			</div>
			<div class="item-discount mx-3">
				<strong>${Math.round(item_data.discount_percentage)}%</strong>
			</div>
			${get_rate_discount_html()}`
      );
      set_dynamic_rate_header_width();
      function set_dynamic_rate_header_width() {
        const rate_cols = Array.from(me.$cart_items_wrapper.find(".item-rate-amount"));
        me.$cart_header.find(".rate-amount-header").css("width", "");
        me.$cart_items_wrapper.find(".item-rate-amount").css("width", "");
        let max_width = rate_cols.reduce((max_width2, elm) => {
          if ($(elm).width() > max_width2)
            max_width2 = $(elm).width();
          return max_width2;
        }, 0);
        max_width += 1;
        if (max_width === 1)
          max_width = "";
        me.$cart_header.find(".rate-amount-header").css("width", max_width);
        me.$cart_items_wrapper.find(".item-rate-amount").css("width", max_width);
      }
      function get_rate_discount_html() {
        if (item_data.rate && item_data.amount && item_data.rate !== item_data.amount) {
          return `
					<div class="item-qty-rate">
						<div class="item-qty"><span>${item_data.qty || 0} ${item_data.uom}</span></div>
						<div class="item-rate-amount">
							<div class="item-rate">${format_currency(item_data.amount, currency)}</div>
							<div class="item-amount">${format_currency(item_data.rate, currency)}</div>
						</div>
					</div>`;
        } else {
          return `
					<div class="item-qty-rate">
						<div class="item-qty"><span>${item_data.qty || 0} ${item_data.uom}</span></div>
						<div class="item-rate-amount">
							<div class="item-rate">${format_currency(item_data.rate, currency)}</div>
						</div>
					</div>`;
        }
      }
      function get_description_html() {
        if (item_data.description) {
          if (item_data.description.indexOf("<div>") !== -1) {
            try {
              item_data.description = $(item_data.description).text();
            } catch (error) {
              item_data.description = item_data.description.replace(/<div>/g, " ").replace(/<\/div>/g, " ").replace(/ +/g, " ");
            }
          }
          item_data.description = frappe.ellipsis(item_data.description, 45);
          return `<div class="item-desc">${item_data.description}</div>`;
        }
        return ``;
      }
      function get_item_image_html() {
        const { image, item_name } = item_data;
        if (!me.hide_images && image) {
          return `
					<div class="item-image">
						<img
							onerror="cur_pos.cart.handle_broken_image(this)"
							src="${image}" alt="${frappe.get_abbr(item_name)}">
					</div>`;
        } else {
          return `<div class="item-image item-abbr">${frappe.get_abbr(item_name)}</div>`;
        }
      }
      this.$cart_items_wrapper.off("keydown", ".cart-item-wrapper").on("keydown", ".cart-item-wrapper", function(event2) {
        const $items = me.$cart_items_wrapper.find(".cart-item-wrapper");
        const currentIndex = $items.index($(this));
        let nextIndex = currentIndex;
        switch (event2.which) {
          case 13:
            $(this).click();
            break;
          case 38:
            nextIndex = currentIndex > 0 ? currentIndex - 1 : $items.length - 1;
            break;
          case 40:
            nextIndex = currentIndex < $items.length - 1 ? currentIndex + 1 : 0;
            break;
          default:
            return;
        }
        $items.eq(nextIndex).focus();
      });
      frappe.ui.keys.add_shortcut({
        shortcut: "ctrl+c",
        action: () => {
          const $items = me.$cart_items_wrapper.find(".cart-item-wrapper");
          if ($items.length) {
            $items.first().focus();
          }
        },
        condition: () => me.$cart_items_wrapper.is(":visible"),
        description: __("Activate Cart Item Focus"),
        ignore_inputs: true,
        page: cur_page.page.page
      });
    }
    handle_broken_image($img) {
      const item_abbr = $($img).attr("alt");
      $($img).parent().replaceWith(`<div class="item-image item-abbr">${item_abbr}</div>`);
    }
    update_selector_value_in_cart_item(selector, value, item) {
      const $item_to_update = this.get_cart_item(item);
      $item_to_update.attr(`data-${selector}`, escape(value));
    }
    toggle_checkout_btn(show_checkout) {
      if (show_checkout) {
        this.$totals_section.find(".checkout-btn").css("display", "flex");
        this.$totals_section.find(".edit-cart-btn").css("display", "none");
      } else {
        this.$totals_section.find(".checkout-btn").css("display", "none");
        this.$totals_section.find(".edit-cart-btn").css("display", "flex");
      }
    }
    highlight_checkout_btn(toggle) {
      if (toggle) {
        this.$add_discount_elem.css("display", "flex");
        this.$cart_container.find(".checkout-btn").css({
          "background-color": "var(--blue-500)"
        });
      } else {
        this.$add_discount_elem.css("display", "none");
        this.$cart_container.find(".checkout-btn").css({
          "background-color": "var(--blue-200)"
        });
      }
    }
    update_empty_cart_section(no_of_cart_items) {
      const $no_item_element = this.$cart_items_wrapper.find(".no-item-wrapper");
      no_of_cart_items > 0 && $no_item_element && $no_item_element.remove() && this.$cart_header.css("display", "flex");
      no_of_cart_items === 0 && !$no_item_element.length && this.make_no_items_placeholder();
    }
    on_numpad_event($btn) {
      const current_action = $btn.attr("data-button-value");
      const action_is_field_edit = ["qty", "discount_percentage", "rate"].includes(current_action);
      const action_is_allowed = action_is_field_edit ? current_action == "rate" && this.allow_rate_change || current_action == "discount_percentage" && this.allow_discount_change || current_action == "qty" : true;
      const action_is_pressed_twice = this.prev_action === current_action;
      const first_click_event = !this.prev_action;
      const field_to_edit_changed = this.prev_action && this.prev_action != current_action;
      if (action_is_field_edit) {
        if (!action_is_allowed) {
          const label = current_action == "rate" ? "Rate".bold() : "Discount".bold();
          const message = __("Editing {0} is not allowed as per POS Profile settings", [label]);
          frappe.show_alert({
            indicator: "red",
            message
          });
          frappe.utils.play_sound("error");
          return;
        }
        if (first_click_event || field_to_edit_changed) {
          this.prev_action = current_action;
        } else if (action_is_pressed_twice) {
          this.prev_action = void 0;
        }
        this.numpad_value = "";
      } else if (current_action === "checkout") {
        this.prev_action = void 0;
        this.toggle_item_highlight();
        this.events.numpad_event(void 0, current_action);
        return;
      } else if (current_action === "remove") {
        this.prev_action = void 0;
        this.toggle_item_highlight();
        this.events.numpad_event(void 0, current_action);
        return;
      } else {
        this.numpad_value = current_action === "delete" ? this.numpad_value.slice(0, -1) : this.numpad_value + current_action;
        this.numpad_value = this.numpad_value || 0;
      }
      const first_click_event_is_not_field_edit = !action_is_field_edit && first_click_event;
      if (first_click_event_is_not_field_edit) {
        frappe.show_alert({
          indicator: "red",
          message: __("Please select a field to edit from numpad")
        });
        frappe.utils.play_sound("error");
        return;
      }
      if (flt(this.numpad_value) > 100 && this.prev_action === "discount_percentage") {
        frappe.show_alert({
          message: __("Discount cannot be greater than 100%"),
          indicator: "orange"
        });
        frappe.utils.play_sound("error");
        this.numpad_value = current_action;
      }
      this.highlight_numpad_btn($btn, current_action);
      this.events.numpad_event(this.numpad_value, this.prev_action);
    }
    highlight_numpad_btn($btn, curr_action) {
      const curr_action_is_highlighted = $btn.hasClass("highlighted-numpad-btn");
      const curr_action_is_action = ["qty", "discount_percentage", "rate", "done"].includes(curr_action);
      if (!curr_action_is_highlighted) {
        $btn.addClass("highlighted-numpad-btn");
      }
      if (this.prev_action === curr_action && curr_action_is_highlighted) {
        $btn.removeClass("highlighted-numpad-btn");
      }
      if (this.prev_action && this.prev_action !== curr_action && curr_action_is_action) {
        const prev_btn = $(`[data-button-value='${this.prev_action}']`);
        prev_btn.removeClass("highlighted-numpad-btn");
      }
      if (!curr_action_is_action || curr_action === "done") {
        setTimeout(() => {
          $btn.removeClass("highlighted-numpad-btn");
        }, 200);
      }
    }
    toggle_numpad(show) {
      if (show) {
        this.$totals_section.css("display", "none");
        this.$numpad_section.css("display", "flex");
      } else {
        this.$totals_section.css("display", "flex");
        this.$numpad_section.css("display", "none");
      }
      this.reset_numpad();
    }
    reset_numpad() {
      this.numpad_value = "";
      this.prev_action = void 0;
      this.$numpad_section.find(".highlighted-numpad-btn").removeClass("highlighted-numpad-btn");
    }
    toggle_numpad_field_edit(fieldname) {
      if (["qty", "discount_percentage", "rate"].includes(fieldname)) {
        this.$numpad_section.find(`[data-button-value="${fieldname}"]`).click();
      }
    }
    toggle_customer_info(show) {
      if (show) {
        const { customer } = this.customer_info || {};
        this.$cart_container.css("display", "none");
        this.$customer_section.css({
          height: "100%",
          "padding-top": "0px"
        });
        this.$customer_section.find(".customer-details").html(
          `<div class="header">
					<div class="label">Contact Details</div>
					<div class="close-details-btn">
						<svg width="32" height="32" viewBox="0 0 14 14" fill="none">
							<path d="M4.93764 4.93759L7.00003 6.99998M9.06243 9.06238L7.00003 6.99998M7.00003 6.99998L4.93764 9.06238L9.06243 4.93759" stroke="#8D99A6"/>
						</svg>
					</div>
				</div>
				<div class="customer-display">
					${this.get_customer_image()}
					<div class="customer-name-desc">
						<div class="customer-name">${customer}</div>
						<div class="customer-desc"></div>
					</div>
				</div>
				<div class="customer-fields-container">
					<div class="email_id-field"></div>
					<div class="mobile_no-field"></div>
					<div class="custom_transaction_type-field"></div>
					<div class="custom_oscapwdid-field"></div>
					<div class="custom_osca_id-field"></div>
					<div class="custom_pwd_id-field"></div>
					<div class="loyalty_program-field"></div>
					<div class="loyalty_points-field"></div>
				
				</div>
				<div class="transactions-label">Recent Transactions</div>`
        );
        this.$customer_section.append(`<div class="customer-transactions"></div>`);
        this.render_customer_fields();
        this.fetch_customer_transactions();
      } else {
        this.$cart_container.css("display", "flex");
        this.$customer_section.css({
          height: "",
          "padding-top": ""
        });
        this.update_customer_section();
      }
    }
    render_customer_fields() {
      const $customer_form = this.$customer_section.find(".customer-fields-container");
      const dfs = [
        {
          fieldname: "email_id",
          label: __("Email"),
          fieldtype: "Data",
          options: "email",
          placeholder: __("Enter customer's email")
        },
        {
          fieldname: "mobile_no",
          label: __("Phone Number"),
          fieldtype: "Data",
          placeholder: __("Enter customer's phone number")
        },
        {
          fieldname: "loyalty_program",
          label: __("Loyalty Program"),
          fieldtype: "Link",
          options: "Loyalty Program",
          placeholder: __("Select Loyalty Program")
        },
        {
          fieldname: "loyalty_points",
          label: __("Loyalty Points"),
          fieldtype: "Data",
          read_only: 1
        },
        {
          fieldname: "custom_osca_id",
          label: __("OSCA ID"),
          fieldtype: "Data",
          read_only: 1
        },
        {
          fieldname: "custom_pwd_id",
          label: __("PWD ID"),
          fieldtype: "Data",
          read_only: 1
        }
      ];
      const me = this;
      dfs.forEach((df) => {
        this[`customer_${df.fieldname}_field`] = frappe.ui.form.make_control({
          df: __spreadProps(__spreadValues({}, df), { onchange: handle_customer_field_change }),
          parent: $customer_form.find(`.${df.fieldname}-field`),
          render_input: true
        });
        this[`customer_${df.fieldname}_field`].set_value(this.customer_info[df.fieldname]);
      });
      function handle_customer_field_change() {
        const current_value = me.customer_info[this.df.fieldname];
        const current_customer = me.customer_info.customer;
        if (this.value && current_value != this.value && this.df.fieldname != "loyalty_points") {
          frappe.call({
            method: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.set_customer_info",
            args: {
              fieldname: this.df.fieldname,
              customer: current_customer,
              value: this.value
            },
            callback: (r) => {
              if (!r.exc) {
                me.customer_info[this.df.fieldname] = this.value;
                frappe.show_alert({
                  message: __("Customer contact updated successfully."),
                  indicator: "green"
                });
                frappe.utils.play_sound("submit");
              }
            }
          });
        }
      }
    }
    fetch_customer_transactions() {
      frappe.db.get_list("POS Invoice", {
        filters: { customer: this.customer_info.customer, docstatus: 1 },
        fields: ["name", "grand_total", "status", "posting_date", "posting_time", "currency", "custom_invoice_series"],
        limit: 20
      }).then((res) => {
        const transaction_container = this.$customer_section.find(".customer-transactions");
        if (!res.length) {
          transaction_container.html(
            `<div class="no-transactions-placeholder">No recent transactions found</div>`
          );
          return;
        }
        const elapsed_time = moment(res[0].posting_date + " " + res[0].posting_time).fromNow();
        this.$customer_section.find(".customer-desc").html(`Last transacted ${elapsed_time}`);
        res.forEach((invoice) => {
          const posting_datetime = moment(invoice.posting_date + " " + invoice.posting_time).format(
            "Do MMMM, h:mma"
          );
          let indicator_color = {
            Paid: "green",
            Draft: "red",
            Return: "gray",
            Consolidated: "blue"
          };
          transaction_container.append(
            `<div class="invoice-wrapper" data-invoice-name="${escape(invoice.name)}">
						<div class="invoice-name-date">
							<div class="invoice-name">${invoice.custom_invoice_series}</div>
							<div class="invoice-date">${posting_datetime}</div>
						</div>
						<div class="invoice-total-status">
							<div class="invoice-total">
								${format_currency(invoice.grand_total, invoice.currency, 0) || 0}
							</div>
							<div class="invoice-status">
								<span class="indicator-pill whitespace-nowrap ${indicator_color[invoice.status]}">
									<span>${invoice.status}</span>
								</span>
							</div>
						</div>
					</div>
					<div class="seperator"></div>`
          );
        });
      });
    }
    attach_refresh_field_event(frm) {
      $(frm.wrapper).off("refresh-fields");
      $(frm.wrapper).on("refresh-fields", () => {
        if (frm.doc.items.length) {
          this.$cart_items_wrapper.html("");
          frm.doc.items.forEach((item) => {
            this.update_item_html(item);
          });
        }
        this.update_totals_section(frm);
      });
    }
    load_invoice() {
      const frm = this.events.get_frm();
      this.attach_refresh_field_event(frm);
      this.fetch_customer_details(frm.doc.customer).then(() => {
        this.events.customer_details_updated(this.customer_info);
        this.update_customer_section();
      });
      this.$cart_items_wrapper.html("");
      if (frm.doc.items.length) {
        frm.doc.items.forEach((item) => {
          this.update_item_html(item);
        });
      } else {
        this.make_no_items_placeholder();
        this.highlight_checkout_btn(false);
      }
      this.update_totals_section(frm);
      if (frm.doc.docstatus === 1) {
        this.$totals_section.find(".checkout-btn").css("display", "none");
        this.$totals_section.find(".edit-cart-btn").css("display", "none");
      } else {
        this.$totals_section.find(".checkout-btn").css("display", "flex");
        this.$totals_section.find(".edit-cart-btn").css("display", "none");
      }
      this.toggle_component(true);
    }
    toggle_component(show) {
      show ? this.$component.css("display", "flex") : this.$component.css("display", "none");
    }
  };

  // ../custom_app/custom_app/customapp/page/packing_list/packing_list_item_details.js
  custom_app.PointOfSale.ItemDetails = class {
    constructor({ wrapper, events, settings }) {
      this.wrapper = wrapper;
      this.events = events;
      this.hide_images = settings.hide_images;
      this.allow_rate_change = settings.allow_rate_change;
      this.allow_discount_change = settings.allow_discount_change;
      this.current_item = {};
      this.init_component();
    }
    init_component() {
      this.prepare_dom();
      this.init_child_components();
      this.bind_events();
      this.attach_shortcuts();
    }
    prepare_dom() {
      this.wrapper.append(`<section class="item-details-container"></section>`);
      this.$component = this.wrapper.find(".item-details-container");
    }
    init_child_components() {
      this.$component.html(
        `<div class="item-details-header">
				<div class="label">${__("Item Details")}</div>
				<div class="close-btn">
					<svg width="32" height="32" viewBox="0 0 14 14" fill="none">
						<path d="M4.93764 4.93759L7.00003 6.99998M9.06243 9.06238L7.00003 6.99998M7.00003 6.99998L4.93764 9.06238L9.06243 4.93759" stroke="#8D99A6"/>
					</svg>
				</div>
			</div>
			<div class="item-display">
				<div class="item-name-desc-price">
					<div class="item-name"></div>
					<div class="item-desc"></div>
					<div class="item-price"></div>
				</div>
				<div class="item-image"></div>
			</div>
			<div class="discount-section"></div>
			<div class="form-container"></div>
			<div class="serial-batch-container"></div>`
      );
      this.$item_name = this.$component.find(".item-name");
      this.$item_description = this.$component.find(".item-desc");
      this.$item_price = this.$component.find(".item-price");
      this.$item_image = this.$component.find(".item-image");
      this.$form_container = this.$component.find(".form-container");
      this.$dicount_section = this.$component.find(".discount-section");
      this.$serial_batch_container = this.$component.find(".serial-batch-container");
    }
    compare_with_current_item(item) {
      return item && item.name == this.current_item.name;
    }
    async toggle_item_details_section(item) {
      const current_item_changed = !this.compare_with_current_item(item);
      const hide_item_details = !Boolean(item) || !current_item_changed;
      if (!hide_item_details && current_item_changed || hide_item_details) {
        await this.validate_serial_batch_item();
      }
      this.events.toggle_item_selector(!hide_item_details);
      this.toggle_component(!hide_item_details);
      if (item && current_item_changed) {
        this.doctype = item.doctype;
        this.item_meta = frappe.get_meta(this.doctype);
        this.name = item.name;
        this.item_row = item;
        this.currency = this.events.get_frm().doc.currency;
        this.current_item = item;
        this.render_dom(item);
        this.render_discount_dom(item);
        this.render_form(item);
        this.events.highlight_cart_item(item);
      } else {
        this.current_item = {};
      }
    }
    validate_serial_batch_item() {
      const doc = this.events.get_frm().doc;
      const item_row = doc.items.find((item) => item.name === this.name);
      if (!item_row)
        return;
      const serialized = item_row.has_serial_no;
      const batched = item_row.has_batch_no;
      const no_bundle_selected = !item_row.serial_and_batch_bundle;
      if (serialized && no_bundle_selected || batched && no_bundle_selected) {
        frappe.show_alert({
          message: __("Item is removed since no serial / batch no selected."),
          indicator: "orange"
        });
        frappe.utils.play_sound("cancel");
        return this.events.remove_item_from_cart();
      }
    }
    render_dom(item) {
      let { item_name, description, image, price_list_rate, custom_remarks, custom_vat } = item;
      function get_description_html() {
        if (description) {
          description = description.indexOf("...") === -1 && description.length > 140 ? description.substr(0, 139) + "..." : description;
          return description;
        }
        return ``;
      }
      this.$item_name.html(item_name);
      this.$item_description.html(get_description_html());
      this.$item_price.html(format_currency(price_list_rate, this.currency));
      if (!this.hide_images && image) {
        this.$item_image.html(
          `<img
					onerror="cur_pos.item_details.handle_broken_image(this)"
					class="h-full" src="${image}"
					alt="${frappe.get_abbr(item_name)}"
					style="object-fit: cover;">`
        );
      } else {
        this.$item_image.html(`<div class="item-abbr">${frappe.get_abbr(item_name)}</div>`);
      }
    }
    handle_broken_image($img) {
      const item_abbr = $($img).attr("alt");
      $($img).replaceWith(`<div class="item-abbr">${item_abbr}</div>`);
    }
    render_discount_dom(item) {
      if (item.discount_percentage) {
        this.$dicount_section.html(
          `<div class="item-rate">${format_currency(item.price_list_rate, this.currency)}</div>
				<div class="item-discount">${item.discount_percentage}% off</div>`
        );
        this.$item_price.html(format_currency(item.rate, this.currency));
      } else {
        this.$dicount_section.html(``);
      }
    }
    render_form(item) {
      const fields_to_display = this.get_form_fields(item);
      this.$form_container.html("");
      this.original_rate = item.rate;
      fields_to_display.forEach((fieldname, idx) => {
        this.$form_container.append(
          `<div class="${fieldname}-control" data-fieldname="${fieldname}"></div>`
        );
        const field_meta = this.item_meta.fields.find((df) => df.fieldname === fieldname);
        if (fieldname === "discount_percentage") {
          field_meta.label = __("Discount (%)");
        }
        const me = this;
        this[`${fieldname}_control`] = frappe.ui.form.make_control({
          df: __spreadProps(__spreadValues({}, field_meta), {
            onchange: function() {
              me.events.form_updated(me.current_item, fieldname, this.value);
              me.is_oic_authenticated = false;
            }
          }),
          parent: this.$form_container.find(`.${fieldname}-control`),
          render_input: true
        });
        this[`${fieldname}_control`].set_value(item[fieldname]);
        if (fieldname === "discount_percentage" || fieldname === "discount_amount" || fieldname === "rate") {
          this.$form_container.find(`.${fieldname}-control input`).on("focus", function() {
            if (!me.is_oic_authenticated) {
              me.oic_authentication(fieldname);
            }
          });
        }
      });
      this.make_auto_serial_selection_btn(item);
      this.bind_custom_control_change_event();
    }
    oic_authentication(fieldname) {
      const me = this;
      const passwordDialog = new frappe.ui.Dialog({
        title: __("Authorization Required OIC"),
        fields: [
          {
            fieldname: "password",
            fieldtype: "Password",
            label: __("Password"),
            reqd: 1
          }
        ],
        primary_action_label: __("Authorize"),
        primary_action: (values) => {
          let password = values.password;
          let role = "oic";
          frappe.call({
            method: "custom_app.customapp.page.packing_list.packing_list.confirm_user_password",
            args: { password, role },
            callback: (r) => {
              if (r.message) {
                frappe.show_alert({
                  message: __("Verified"),
                  indicator: "green"
                });
                passwordDialog.hide();
                me.enable_discount_input(fieldname);
                me.is_oic_authenticated = true;
              } else {
                frappe.show_alert({
                  message: __("Incorrect password or user is not an OIC"),
                  indicator: "red"
                });
              }
            }
          });
        }
      });
      passwordDialog.show();
    }
    enable_discount_input(fieldname) {
      this.$form_container.find(`.${fieldname}-control input`).prop("disabled", false);
    }
    get_form_fields(item) {
      const fields = [
        "custom_free",
        "qty",
        "price_list_rate",
        "rate",
        "uom",
        "custom_expiry_date",
        "discount_percentage",
        "discount_amount",
        "custom_vat_amount",
        "custom_vatable_amount",
        "custom_vat_exempt_amount",
        "custom_zero_rated_amount",
        "custom_remarks"
      ];
      if (item.has_serial_no)
        fields.push("serial_no");
      if (item.has_batch_no)
        fields.push("batch_no");
      return fields;
    }
    make_auto_serial_selection_btn(item) {
      if (item.has_serial_no || item.has_batch_no) {
        const label = item.has_serial_no ? __("Select Serial No") : __("Select Batch No");
        this.$form_container.append(
          `<div class="btn btn-sm btn-secondary auto-fetch-btn">${label}</div>`
        );
        this.$form_container.find(".serial_no-control").find("textarea").css("height", "6rem");
      }
    }
    bind_custom_control_change_event() {
      const me = this;
      if (this.rate_control) {
        const frm = me.events.get_frm();
        this.rate_control.df.onchange = null;
        this.rate_control.df.onchange = function() {
          if (this.value || flt(this.value) === 0) {
            if (this._debounce) {
              clearTimeout(this._debounce);
            }
            this._debounce = setTimeout(() => {
              me.events.form_updated(me.current_item, "rate", this.value).then(() => {
                const item_row = frappe.get_doc(me.doctype, me.name);
                const doc = me.events.get_frm().doc;
                me.$item_price.html(format_currency(item_row.rate, doc.currency));
                me.render_discount_dom(item_row);
              });
            }, 200);
          }
        };
        if (frm.doc.customer_group === "Senior Citizen") {
          return;
        } else {
          this.rate_control.df.read_only = !this.allow_rate_change;
          this.rate_control.refresh();
        }
      }
      if (me.events && me.events.get_frm() && me.events.get_frm().doc) {
        const frm = me.events.get_frm();
        if (frm.doc.customer_group === "Senior Citizen") {
          if (me.discount_percentage_control && !me.allow_discount_change) {
            me.discount_percentage_control.df.read_only = 1;
          }
        } else {
          if (me.discount_percentage_control && !me.allow_discount_change) {
            me.discount_percentage_control.df.read_only = 1;
            me.discount_percentage_control.refresh();
          }
        }
      }
      if (this.discount_percentage_control && !this.allow_discount_change) {
        this.discount_percentage_control.df.read_only = 1;
        this.discount_percentage_control.refresh();
      }
      if (this.warehouse_control) {
        this.warehouse_control.df.reqd = 1;
        this.warehouse_control.df.onchange = function() {
          if (this.value) {
            me.events.form_updated(me.current_item, "warehouse", this.value).then(() => {
              me.item_stock_map = me.events.get_item_stock_map();
              const available_qty = me.item_stock_map[me.item_row.item_code][this.value][0];
              const is_stock_item = Boolean(
                me.item_stock_map[me.item_row.item_code][this.value][1]
              );
              if (available_qty === void 0) {
                me.events.get_available_stock(me.item_row.item_code, this.value).then(() => {
                  me.warehouse_control.set_value(this.value);
                });
              } else if (available_qty === 0 && is_stock_item) {
                me.warehouse_control.set_value("");
                const bold_item_code = me.item_row.item_code.bold();
                const bold_warehouse = this.value.bold();
                frappe.throw(
                  __("Item Code: {0} is not available under warehouse {1}.", [
                    bold_item_code,
                    bold_warehouse
                  ])
                );
              }
              me.actual_qty_control.set_value(available_qty);
            });
          }
        };
        this.warehouse_control.df.get_query = () => {
          return {
            filters: { company: this.events.get_frm().doc.company }
          };
        };
        this.warehouse_control.refresh();
      }
      if (this.serial_no_control) {
        this.serial_no_control.df.reqd = 1;
        this.serial_no_control.df.onchange = async function() {
          !me.current_item.batch_no && await me.auto_update_batch_no();
          me.events.form_updated(me.current_item, "serial_no", this.value);
        };
        this.serial_no_control.refresh();
      }
      if (this.batch_no_control) {
        this.batch_no_control.df.reqd = 1;
        this.batch_no_control.df.get_query = () => {
          return {
            query: "erpnext.controllers.queries.get_batch_no",
            filters: {
              item_code: me.item_row.item_code,
              warehouse: me.item_row.warehouse,
              posting_date: me.events.get_frm().doc.posting_date
            }
          };
        };
        this.batch_no_control.refresh();
      }
      if (this.uom_control) {
        this.uom_control.df.onchange = function() {
          me.events.form_updated(me.current_item, "uom", this.value);
          const item_row = frappe.get_doc(me.doctype, me.name);
          me.conversion_factor_control.df.read_only = item_row.stock_uom == this.value;
          me.conversion_factor_control.refresh();
        };
      }
      frappe.model.on("POS Invoice Item", "*", (fieldname, value, item_row) => {
        const field_control = this[`${fieldname}_control`];
        const item_row_is_being_edited = this.compare_with_current_item(item_row);
        if (item_row_is_being_edited && field_control && field_control.get_value() !== value) {
          field_control.set_value(value);
          cur_pos.update_cart_html(item_row);
        }
      });
    }
    async auto_update_batch_no() {
      if (this.serial_no_control && this.batch_no_control) {
        const selected_serial_nos = this.serial_no_control.get_value().split(`
`).filter((s) => s);
        if (!selected_serial_nos.length)
          return;
        const serials_with_batch_no = await frappe.db.get_list("Serial No", {
          filters: { name: ["in", selected_serial_nos] },
          fields: ["batch_no", "name"]
        });
        const batch_serial_map = serials_with_batch_no.reduce((acc, r) => {
          if (!acc[r.batch_no]) {
            acc[r.batch_no] = [];
          }
          acc[r.batch_no] = [...acc[r.batch_no], r.name];
          return acc;
        }, {});
        const batch_no = Object.keys(batch_serial_map)[0];
        const batch_serial_nos = batch_serial_map[batch_no].join(`
`);
        const serial_nos_belongs_to_other_batch = selected_serial_nos.length !== batch_serial_map[batch_no].length;
        const current_batch_no = this.batch_no_control.get_value();
        current_batch_no != batch_no && await this.batch_no_control.set_value(batch_no);
        if (serial_nos_belongs_to_other_batch) {
          this.serial_no_control.set_value(batch_serial_nos);
          this.qty_control.set_value(batch_serial_map[batch_no].length);
          delete batch_serial_map[batch_no];
          this.events.clone_new_batch_item_in_frm(batch_serial_map, this.current_item);
        }
      }
    }
    bind_events() {
      this.bind_auto_serial_fetch_event();
      this.bind_fields_to_numpad_fields();
      this.$component.on("click", ".close-btn", () => {
        this.events.close_item_details();
      });
    }
    attach_shortcuts() {
      this.wrapper.find(".close-btn").attr("title", "Esc");
      frappe.ui.keys.on("escape", () => {
        const item_details_visible = this.$component.is(":visible");
        if (item_details_visible) {
          this.events.close_item_details();
        }
      });
    }
    bind_fields_to_numpad_fields() {
      const me = this;
      this.$form_container.on("click", ".input-with-feedback", function() {
        const fieldname = $(this).attr("data-fieldname");
        if (this.last_field_focused != fieldname) {
          me.events.item_field_focused(fieldname);
          this.last_field_focused = fieldname;
        }
      });
    }
    bind_auto_serial_fetch_event() {
      this.$form_container.on("click", ".auto-fetch-btn", () => {
        let frm = this.events.get_frm();
        let item_row = this.item_row;
        item_row.type_of_transaction = "Outward";
        new erpnext.SerialBatchPackageSelector(frm, item_row, (r) => {
          if (r) {
            frappe.model.set_value(item_row.doctype, item_row.name, {
              serial_and_batch_bundle: r.name,
              qty: Math.abs(r.total_qty)
            });
          }
        });
      });
    }
    toggle_component(show) {
      show ? this.$component.css("display", "flex") : this.$component.css("display", "none");
    }
  };

  // ../custom_app/custom_app/customapp/page/packing_list/packing_list_number_pad.js
  custom_app.PointOfSale.NumberPad = class {
    constructor({ wrapper, events, cols, keys, css_classes, fieldnames_map }) {
      this.wrapper = wrapper;
      this.events = events;
      this.cols = cols;
      this.keys = keys;
      this.css_classes = css_classes || [];
      this.fieldnames = fieldnames_map || {};
      this.init_component();
    }
    init_component() {
      this.prepare_dom();
      this.bind_events();
    }
    prepare_dom() {
      const { cols, keys, css_classes, fieldnames } = this;
      function get_keys() {
        return keys.reduce((a, row, i) => {
          return a + row.reduce((a2, number, j) => {
            const class_to_append = css_classes && css_classes[i] ? css_classes[i][j] : "";
            const fieldname = fieldnames && fieldnames[number] ? fieldnames[number] : typeof number === "string" ? frappe.scrub(number) : number;
            return a2 + `<div class="numpad-btn ${class_to_append}" data-button-value="${fieldname}">${__(
              number
            )}</div>`;
          }, "");
        }, "");
      }
      this.wrapper.html(
        `<div class="numpad-container">
				${get_keys()}
			</div>`
      );
    }
    bind_events() {
      const me = this;
      this.wrapper.on("click", ".numpad-btn", function() {
        const $btn = $(this);
        me.events.numpad_event($btn);
      });
    }
  };

  // ../custom_app/custom_app/customapp/page/packing_list/packing_list_payment.js
  custom_app.PointOfSale.Payment = class {
    constructor({ events, wrapper }) {
      this.wrapper = wrapper;
      this.events = events;
      this.init_component();
    }
    init_component() {
      this.prepare_dom();
      this.bind_events();
      this.attach_shortcuts();
    }
    prepare_dom() {
      this.wrapper.append(
        `<section class="payment-container">
				<div class="section-label payment-section">${__("Payment Method")}</div>
				<div class="payment-modes"></div>
				<div class="fields-numpad-container">
					<div class="fields-section">
						<div class="section-label">${__("Additional Information")}</div>
						<div class="invoice-fields"></div>
					</div>
					<div class="number-pad"></div>
				</div>
				<div class="totals-section">
					<div class="totals"></div>
				</div>
				<div class="submit-order-btn">${__("Print Order List")}</div>
			</section>`
      );
      this.$component = this.wrapper.find(".payment-container");
      this.$payment_modes = this.$component.find(".payment-modes");
      this.$totals_section = this.$component.find(".totals-section");
      this.$totals = this.$component.find(".totals");
      this.$numpad = this.$component.find(".number-pad");
      this.$invoice_fields_section = this.$component.find(".fields-section");
    }
    make_invoice_fields_control() {
      frappe.db.get_doc("POS Settings", void 0).then((doc) => {
        const fields = doc.invoice_fields;
        if (!fields.length)
          return;
        this.$invoice_fields = this.$invoice_fields_section.find(".invoice-fields");
        this.$invoice_fields.html("");
        const frm = this.events.get_frm();
        fields.forEach((df) => {
          this.$invoice_fields.append(
            `<div class="invoice_detail_field ${df.fieldname}-field" data-fieldname="${df.fieldname}"></div>`
          );
          let df_events = {
            onchange: function() {
              frm.set_value(this.df.fieldname, this.get_value());
            }
          };
          if (df.fieldtype == "Button") {
            df_events = {
              click: function() {
                if (frm.script_manager.has_handlers(df.fieldname, frm.doc.doctype)) {
                  frm.script_manager.trigger(df.fieldname, frm.doc.doctype, frm.doc.docname);
                }
              }
            };
          }
          this[`${df.fieldname}_field`] = frappe.ui.form.make_control({
            df: __spreadValues(__spreadValues({}, df), df_events),
            parent: this.$invoice_fields.find(`.${df.fieldname}-field`),
            render_input: true
          });
          this[`${df.fieldname}_field`].set_value(frm.doc[df.fieldname]);
        });
      });
    }
    initialize_numpad() {
      const me = this;
      this.number_pad = new custom_app.PointOfSale.NumberPad({
        wrapper: this.$numpad,
        events: {
          numpad_event: function($btn) {
            me.on_numpad_clicked($btn);
          }
        },
        cols: 3,
        keys: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
          [".", 0, "Delete"]
        ]
      });
      this.numpad_value = "";
    }
    on_numpad_clicked($btn) {
      const button_value = $btn.attr("data-button-value");
      highlight_numpad_btn($btn);
      this.numpad_value = button_value === "delete" ? this.numpad_value.slice(0, -1) : this.numpad_value + button_value;
      this.selected_mode.$input.get(0).focus();
      this.selected_mode.set_value(this.numpad_value);
      function highlight_numpad_btn($btn2) {
        $btn2.addClass("shadow-base-inner bg-selected");
        setTimeout(() => {
          $btn2.removeClass("shadow-base-inner bg-selected");
        }, 100);
      }
    }
    bind_events() {
      const me = this;
      function hideAllFields() {
        $(`.mode-of-payment-control`).css("display", "none");
        $(`.mobile-number`).css("display", "none");
        $(`.approval-code`).css("display", "none");
        $(`.reference-number`).css("display", "none");
        $(`.bank-name`).css("display", "none");
        $(`.holder-name`).css("display", "none");
        $(`.card_type_control`).css("display", "none");
        $(`.card-number`).css("display", "none");
        $(`.expiry-date`).css("display", "none");
        $(`.confirmation-code`).css("display", "none");
        $(`.cash-shortcuts`).css("display", "none");
        $(`.check-name`).css("display", "none");
        $(`.check-number`).css("display", "none");
        $(`.check-date`).css("display", "none");
        $(`.actual-gov-one`).css("display", "none");
        $(`.actual-gov-two`).css("display", "none");
        $(`.payment-type`).css("display", "none");
        $(`.bank-type`).css("display", "none");
        $(`.qr-reference-number`).css("display", "none");
        me.$payment_modes.find(`.pay-amount`).css("display", "inline");
        me.$payment_modes.find(`.loyalty-amount-name`).css("display", "none");
      }
      this.$payment_modes.on("click", ".mode-of-payment", function(e) {
        const mode_clicked = $(this);
        if (!$(e.target).is(mode_clicked))
          return;
        const scrollLeft = mode_clicked.offset().left - me.$payment_modes.offset().left + me.$payment_modes.scrollLeft();
        me.$payment_modes.animate({ scrollLeft });
        const mode = mode_clicked.attr("data-mode");
        hideAllFields();
        $(".mode-of-payment").removeClass("border-primary");
        if (mode_clicked.hasClass("border-primary")) {
          mode_clicked.removeClass("border-primary");
          me.selected_mode = "";
        } else {
          mode_clicked.addClass("border-primary");
          mode_clicked.find(".mode-of-payment-control").css("display", "flex");
          mode_clicked.find(".mobile-number").css("display", "flex");
          mode_clicked.find(".reference-number").css("display", "flex");
          mode_clicked.find(".approval-code").css("display", "flex");
          mode_clicked.find(".bank-name").css("display", "flex");
          mode_clicked.find(".holder-name").css("display", "flex");
          mode_clicked.find(".card_type_control").css("display", "flex");
          mode_clicked.find(".card-number").css("display", "flex");
          mode_clicked.find(".expiry-date").css("display", "flex");
          mode_clicked.find(".confirmation-code").css("display", "flex");
          mode_clicked.find(".check-name").css("display", "flex");
          mode_clicked.find(".check-number").css("display", "flex");
          mode_clicked.find(".check-date").css("display", "flex");
          mode_clicked.find(".actual-gov-one").css("display", "flex");
          mode_clicked.find(".actual-gov-two").css("display", "flex");
          mode_clicked.find(".payment-type").css("display", "flex");
          mode_clicked.find(".bank-type").css("display", "flex");
          mode_clicked.find(".qr-reference-number").css("display", "flex");
          mode_clicked.find(".cash-shortcuts").css("display", "grid");
          me.$payment_modes.find(`.${mode}-amount`).css("display", "none");
          me.$payment_modes.find(`.${mode}-name`).css("display", "inline");
          me.selected_mode = me[`${mode}_control`];
          me.selected_mode && me.selected_mode.$input.get().focus();
          me.auto_set_remaining_amount();
        }
      });
      $(document).on("click", function(e) {
        const target = $(e.target);
        if (!target.closest(".mode-of-payment").length) {
          hideAllFields();
          $(".mode-of-payment").removeClass("border-primary");
        }
      });
      frappe.ui.form.on("POS Invoice", "contact_mobile", (frm) => {
        var _a;
        const contact = frm.doc.contact_mobile;
        const request_button = $((_a = this.request_for_payment_field) == null ? void 0 : _a.$input[0]);
        if (contact) {
          request_button.removeClass("btn-default").addClass("btn-primary");
        } else {
          request_button.removeClass("btn-primary").addClass("btn-default");
        }
      });
      frappe.ui.form.on("POS Invoice", "coupon_code", (frm) => {
        if (frm.doc.coupon_code && !frm.applying_pos_coupon_code) {
          if (!frm.doc.ignore_pricing_rule) {
            frm.applying_pos_coupon_code = true;
            frappe.run_serially([
              () => frm.doc.ignore_pricing_rule = 1,
              () => frm.trigger("ignore_pricing_rule"),
              () => frm.doc.ignore_pricing_rule = 0,
              () => frm.trigger("apply_pricing_rule"),
              () => frm.save(),
              () => this.update_totals_section(frm.doc),
              () => frm.applying_pos_coupon_code = false
            ]);
          } else if (frm.doc.ignore_pricing_rule) {
            frappe.show_alert({
              message: __("Ignore Pricing Rule is enabled. Cannot apply coupon code."),
              indicator: "orange"
            });
          }
        }
      });
      this.setup_listener_for_payments();
      this.$payment_modes.on("click", ".shortcut", function() {
        const value = $(this).attr("data-value");
        me.selected_mode.set_value(value);
      });
      this.$component.on("click", ".submit-order-btn", () => {
        const doc = this.events.get_frm().doc;
        const paid_amount = doc.paid_amount;
        const items = doc.items;
        if (paid_amount == 0 || !items.length) {
          const message = items.length ? __("You cannot submit the order without payment.") : __("You cannot submit empty order.");
          frappe.show_alert({ message, indicator: "orange" });
          frappe.utils.play_sound("error");
          return;
        }
        this.events.save_as_draft();
      });
      frappe.ui.form.on("POS Invoice", "paid_amount", (frm) => {
        this.update_totals_section(frm.doc);
        const is_cash_shortcuts_invisible = !this.$payment_modes.find(".cash-shortcuts").is(":visible");
        this.attach_cash_shortcuts(frm.doc);
        !is_cash_shortcuts_invisible && this.$payment_modes.find(".cash-shortcuts").css("display", "grid");
        this.render_payment_mode_dom();
      });
      frappe.ui.form.on("POS Invoice", "loyalty_amount", (frm) => {
        const formatted_currency = format_currency(frm.doc.loyalty_amount, frm.doc.currency);
        this.$payment_modes.find(`.loyalty-amount-amount`).html(formatted_currency);
      });
      frappe.ui.form.on("Sales Invoice Payment", "amount", (frm, cdt, cdn) => {
        const default_mop = locals[cdt][cdn];
        const mode = default_mop.mode_of_payment.replace(/ +/g, "_").toLowerCase();
        if (this[`${mode}_control`] && this[`${mode}_control`].get_value() != default_mop.amount) {
          this[`${mode}_control`].set_value(default_mop.amount);
        }
      });
    }
    setup_listener_for_payments() {
      frappe.realtime.on("process_phone_payment", (data) => {
        const doc = this.events.get_frm().doc;
        const { response, amount, success, failure_message } = data;
        let message, title;
        if (success) {
          title = __("Payment Received");
          const grand_total = cint(frappe.sys_defaults.disable_rounded_total) ? doc.grand_total : doc.rounded_total;
          if (amount >= grand_total) {
            frappe.dom.unfreeze();
            message = __("Payment of {0} received successfully.", [
              format_currency(amount, doc.currency, 0)
            ]);
            this.events.submit_invoice();
            cur_frm.reload_doc();
          } else {
            message = __(
              "Payment of {0} received successfully. Waiting for other requests to complete...",
              [format_currency(amount, doc.currency, 0)]
            );
          }
        } else if (failure_message) {
          message = failure_message;
          title = __("Payment Failed");
        }
        frappe.msgprint({ message, title });
      });
    }
    auto_set_remaining_amount() {
      const doc = this.events.get_frm().doc;
      const grand_total = cint(frappe.sys_defaults.disable_rounded_total) ? doc.grand_total : doc.rounded_total;
      const remaining_amount = grand_total - doc.paid_amount;
      const current_value = this.selected_mode ? this.selected_mode.get_value() : void 0;
      if (!current_value && remaining_amount > 0 && this.selected_mode) {
        this.selected_mode.set_value(remaining_amount);
      }
    }
    attach_shortcuts() {
      const ctrl_label = frappe.utils.is_mac() ? "\u2318" : "Ctrl";
      this.$component.find(".submit-order-btn").attr("title", `${ctrl_label}+Enter`);
      frappe.ui.keys.on("ctrl+enter", () => {
        const payment_is_visible = this.$component.is(":visible");
        const active_mode = this.$payment_modes.find(".border-primary");
        if (payment_is_visible && active_mode.length) {
          this.$component.find(".submit-order-btn").click();
        }
      });
      frappe.ui.keys.add_shortcut({
        shortcut: "tab",
        action: () => {
          const payment_is_visible = this.$component.is(":visible");
          let active_mode = this.$payment_modes.find(".border-primary");
          active_mode = active_mode.length ? active_mode.attr("data-mode") : void 0;
          if (!active_mode)
            return;
          const mode_of_payments = Array.from(this.$payment_modes.find(".mode-of-payment")).map(
            (m) => $(m).attr("data-mode")
          );
          const mode_index = mode_of_payments.indexOf(active_mode);
          const next_mode_index = (mode_index + 1) % mode_of_payments.length;
          const next_mode_to_be_clicked = this.$payment_modes.find(
            `.mode-of-payment[data-mode="${mode_of_payments[next_mode_index]}"]`
          );
          if (payment_is_visible && mode_index != next_mode_index) {
            next_mode_to_be_clicked.click();
          }
        },
        condition: () => this.$component.is(":visible") && this.$payment_modes.find(".border-primary").length,
        description: __("Switch Between Payment Modes"),
        ignore_inputs: true,
        page: cur_page.page.page
      });
    }
    toggle_numpad() {
    }
    render_payment_section() {
      this.render_payment_mode_dom();
      this.make_invoice_fields_control();
      this.update_totals_section();
      this.focus_on_default_mop();
    }
    after_render() {
      const frm = this.events.get_frm();
      frm.script_manager.trigger("after_payment_render", frm.doc.doctype, frm.doc.docname);
    }
    edit_cart() {
      this.events.toggle_other_sections(false);
      this.toggle_component(false);
    }
    checkout() {
      this.events.toggle_other_sections(true);
      this.toggle_component(true);
      this.render_payment_section();
      this.after_render();
    }
    toggle_remarks_control() {
      if (this.$remarks.find(".frappe-control").length) {
        this.$remarks.html("+ Add Remark");
      } else {
        this.$remarks.html("");
        this[`remark_control`] = frappe.ui.form.make_control({
          df: {
            label: __("Remark"),
            fieldtype: "Data",
            onchange: function() {
            }
          },
          parent: this.$totals_section.find(`.remarks`),
          render_input: true
        });
        this[`remark_control`].set_value("");
      }
    }
    render_payment_mode_dom() {
      const doc = this.events.get_frm().doc;
      const payments = doc.payments;
      const currency = doc.currency;
      const customer_group = doc.customer_group;
      const allowed_payment_modes = ["2306", "2307"];
      this.$payment_modes.html(
        `${payments.map((p, i) => {
          const mode = p.mode_of_payment.replace(/ +/g, "_").toLowerCase();
          const payment_type = p.type;
          const margin = i % 2 === 0 ? "pr-2" : "pl-2";
          const amount = p.amount > 0 ? format_currency(p.amount, currency) : "";
          let paymentModeHtml = `
					<div class="payment-mode-wrapper ${margin}">
						<div class="mode-of-payment" data-mode="${mode}" data-payment-type="${payment_type}">
							${p.mode_of_payment}
							<div class="${mode}-amount pay-amount">${amount}</div>
							<div class="${mode} mode-of-payment-control"></div>
				`;
          switch (p.mode_of_payment) {
            case "GCash":
              paymentModeHtml += `
							<div class="${mode} mobile-number" style="margin-top:10px;"></div>
							<div class="${mode} reference-number" style="margin-top:10px;"></div>
						`;
              break;
            case "Cards":
              paymentModeHtml += `
							<div class="${mode} bank-name"></div>
							<div class="${mode} holder-name"></div>
							<div class="${mode} card_type_control"></div>
							<div class="${mode} card-number"></div>
							<div class="${mode} expiry-date"></div>
							<div class="${mode} approval-code"></div>
							<div class="${mode} reference-number"></div>
						`;
              break;
            case "Debit Card":
              paymentModeHtml += `
							<div class="${mode} bank-name"></div>
							<div class="${mode} holder-name"></div>
							<div class="${mode} card-number"></div>
							<div class="${mode} expiry-date"></div>
							<div class="${mode} approval-code"></div>
							<div class="${mode} reference-number"></div>
							`;
              break;
            case "Credit Card":
              paymentModeHtml += `
							<div class="${mode} bank-name"></div>
							<div class="${mode} holder-name"></div>
							<div class="${mode} card-number"></div>
							<div class="${mode} expiry-date"></div>
							<div class="${mode} approval-code"></div>
							<div class="${mode} reference-number"></div>
							`;
              break;
            case "PayMaya":
              paymentModeHtml += `
							<div class="${mode} mobile-number" style="margin-top:10px;"></div>
							<div class="${mode} reference-number" style="margin-top:10px;"></div>
						`;
              break;
            case "Cheque":
              paymentModeHtml += `
							<div class="${mode} bank-name"></div>
							<div class="${mode} check-name"></div>
							<div class="${mode} check-number"></div>
							<div class="${mode} check-date"></div>
						`;
              break;
            case "2306":
              paymentModeHtml += `
							<div class="${mode} actual-gov-one"></div>
						`;
              break;
            case "2307":
              paymentModeHtml += `
							<div class="${mode} actual-gov-two"></div>
						`;
              break;
            case "QR Payment":
              paymentModeHtml += `
							<div class="${mode} payment-type"></div>
							<div class="${mode} bank-type"></div>
							<div class="${mode} qr-reference-number"></div>

						`;
              break;
          }
          paymentModeHtml += `
						</div>
					</div>
				`;
          return paymentModeHtml;
        }).join("")}`
      );
      payments.forEach((p) => {
        const mode = p.mode_of_payment.replace(/ +/g, "_").toLowerCase();
        const me = this;
        const allowed_payment_modes2 = ["2306", "2307"];
        this[`${mode}_control`] = frappe.ui.form.make_control({
          df: {
            label: p.mode_of_payment,
            fieldtype: "Currency",
            placeholder: __("Enter {0} amount.", [p.mode_of_payment]),
            onchange: function() {
              const current_value = frappe.model.get_value(p.doctype, p.name, "amount");
              if (current_value != this.value) {
                frappe.model.set_value(p.doctype, p.name, "amount", flt(this.value)).then(() => me.update_totals_section());
                const formatted_currency = format_currency(this.value, currency);
                me.$payment_modes.find(`.${mode}-amount`).html(formatted_currency);
              }
            }
          },
          parent: this.$payment_modes.find(`.${mode}.mode-of-payment-control`),
          render_input: true
        });
        if (p.mode_of_payment === "Cards") {
          let validateLastFourDigits2 = function(value) {
            const regex = /^\d{4}$/;
            return regex.test(value);
          };
          var validateLastFourDigits = validateLastFourDigits2;
          let existing_custom_bank_name = frappe.model.get_value(p.doctype, p.name, "custom_bank_name");
          let bank_name_control = frappe.ui.form.make_control({
            df: {
              label: "Bank",
              fieldtype: "Data",
              placeholder: "Bank Name",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_bank_name", flt(this.value));
              }
            },
            parent: this.$payment_modes.find(`.${mode}.bank-name`),
            render_input: true
          });
          bank_name_control.set_value(existing_custom_bank_name || "");
          bank_name_control.refresh();
          let existing_custom_card_name = frappe.model.get_value(p.doctype, p.name, "custom_card_name");
          let name_on_card_control = frappe.ui.form.make_control({
            df: {
              label: "Name on Card",
              fieldtype: "Data",
              placeholder: "Card name holder",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_card_name", this.value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.holder-name`),
            render_input: true
          });
          name_on_card_control.set_value(existing_custom_card_name || "");
          name_on_card_control.refresh();
          let existing_custom_card_type = frappe.model.get_value(p.doctype, p.name, "custom_card_type");
          let card_type_control = frappe.ui.form.make_control({
            df: {
              label: "Card Type",
              fieldtype: "Select",
              options: [
                { label: "Select Card Type", value: "" },
                { label: "Visa", value: "Visa" },
                { label: "Visa Debit", value: "Visa Debit" },
                { label: "Visa Electron", value: "Visa Electron" },
                { label: "Credit Card", value: "Credit Card" },
                { label: "Mastercard", value: "Mastercard" },
                { label: "Mastercard Debit", value: "Mastercard Debit" },
                { label: "Maestro", value: "Maestro" },
                { label: "American Express (Amex)", value: "American Express (Amex)" },
                { label: "Discover", value: "Discover" },
                { label: "Diners Club", value: "Diners Club" },
                { label: "JCB", value: "JCB" },
                { label: "UnionPay", value: "UnionPay" },
                { label: "RuPay", value: "RuPay" },
                { label: "Interac", value: "Interac" },
                { label: "Carte Bancaire (CB)", value: "Carte Bancaire (CB)" },
                { label: "Elo", value: "Elo" },
                { label: "Mir", value: "Mir" },
                { label: "Others", value: "Others" }
              ],
              onchange: function() {
                const value = this.value;
                frappe.model.set_value(p.doctype, p.name, "custom_card_type", value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.card_type_control`),
            render_input: true
          });
          card_type_control.set_value(existing_custom_card_type || "");
          card_type_control.refresh();
          let existing_custom_card_number = frappe.model.get_value(p.doctype, p.name, "custom_card_number");
          let card_number_control = frappe.ui.form.make_control({
            df: {
              label: "Card Number",
              fieldtype: "Data",
              placeholder: "Last 4 digits",
              onchange: function() {
                const value = this.value;
                if (value === "") {
                  frappe.model.set_value(p.doctype, p.name, "custom_card_number", "");
                } else if (validateLastFourDigits2(value)) {
                  frappe.model.set_value(p.doctype, p.name, "custom_card_number", value);
                } else {
                  frappe.msgprint(__("Card number must be exactly 4 digits."));
                  this.set_value("");
                }
              },
              maxlength: 4
            },
            parent: this.$payment_modes.find(`.${mode}.card-number`),
            render_input: true,
            default: existing_custom_card_number || ""
          });
          card_number_control.set_value(existing_custom_card_number || "");
          card_number_control.refresh();
          let existing_custom_card_expiration_date = frappe.model.get_value(p.doctype, p.name, "custom_card_expiration_date");
          let expiry_date_control = frappe.ui.form.make_control({
            df: {
              label: "Card Expiration Date",
              fieldtype: "Data",
              placeholder: "MM/YY",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_card_expiration_date", this.value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.expiry-date`),
            render_input: true,
            default: p.custom_card_expiration_date || ""
          });
          expiry_date_control.set_value(existing_custom_card_expiration_date || "");
          expiry_date_control.refresh();
          let existing_custom_approval_code = frappe.model.get_value(p.doctype, p.name, "custom_approval_code");
          let custom_approval_code_control = frappe.ui.form.make_control({
            df: {
              label: "Approval Code",
              fieldtype: "Data",
              placeholder: "Approval Code",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_approval_code", this.value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.approval-code`),
            render_input: true
          });
          custom_approval_code_control.set_value(existing_custom_approval_code || "");
          custom_approval_code_control.refresh();
          let existing_reference_no = frappe.model.get_value(p.doctype, p.name, "reference_no");
          let reference_no_control = frappe.ui.form.make_control({
            df: {
              label: "Reference No",
              fieldtype: "Data",
              placeholder: "Reference No.",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "reference_no", this.value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.reference-number`),
            render_input: true
          });
          reference_no_control.set_value(existing_reference_no || "");
          reference_no_control.refresh();
        }
        if (p.mode_of_payment === "GCash" || p.mode_of_payment === "PayMaya") {
          let existing_custom_phone_number = frappe.model.get_value(p.doctype, p.name, "custom_phone_number");
          let phone_number_control = frappe.ui.form.make_control({
            df: {
              label: "Number",
              fieldtype: "Data",
              placeholder: "09876543212",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_phone_number", this.value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.mobile-number`),
            render_input: true
          });
          phone_number_control.set_value(existing_custom_phone_number || "");
          phone_number_control.refresh();
          let existing_custom_epayment_reference_number = frappe.model.get_value(p.doctype, p.name, "reference_no");
          let epayment_reference_number_controller = frappe.ui.form.make_control({
            df: {
              label: "Reference No",
              fieldtype: "Data",
              placeholder: "Reference No.",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "reference_no", this.value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.reference-number`),
            render_input: true,
            default: p.reference_no || ""
          });
          epayment_reference_number_controller.set_value(existing_custom_epayment_reference_number || "");
          epayment_reference_number_controller.refresh();
        }
        if (p.mode_of_payment === "Debit Card" || p.mode_of_payment === "Credit Card") {
          let validateLastFourDigits2 = function(value) {
            const regex = /^\d{4}$/;
            return regex.test(value);
          };
          var validateLastFourDigits = validateLastFourDigits2;
          let existing_custom_bank_name = frappe.model.get_value(p.doctype, p.name, "custom_bank_name");
          let bank_name_control = frappe.ui.form.make_control({
            df: {
              label: "Bank",
              fieldtype: "Data",
              placeholder: "Bank Name",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_bank_name", this.value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.bank-name`),
            render_input: true
          });
          bank_name_control.set_value(existing_custom_bank_name || "");
          bank_name_control.refresh();
          let existing_custom_card_name = frappe.model.get_value(p.doctype, p.name, "custom_card_name");
          let name_on_card_control = frappe.ui.form.make_control({
            df: {
              label: "Name on Card",
              fieldtype: "Data",
              placeholder: "Card name holder",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_card_name", this.value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.holder-name`),
            render_input: true
          });
          name_on_card_control.set_value(existing_custom_card_name || "");
          name_on_card_control.refresh();
          let existing_custom_card_number = frappe.model.get_value(p.doctype, p.name, "custom_card_number");
          let card_number_control = frappe.ui.form.make_control({
            df: {
              label: "Card Number",
              fieldtype: "Data",
              placeholder: "Last 4 digits",
              onchange: function() {
                const value = this.value;
                if (value === "") {
                  frappe.model.set_value(p.doctype, p.name, "custom_card_number", "");
                } else if (validateLastFourDigits2(value)) {
                  frappe.model.set_value(p.doctype, p.name, "custom_card_number", value);
                } else {
                  frappe.msgprint(__("Card number must be exactly 4 digits."));
                  this.set_value("");
                }
              },
              maxlength: 4
            },
            parent: this.$payment_modes.find(`.${mode}.card-number`),
            render_input: true,
            default: existing_custom_card_number || ""
          });
          card_number_control.set_value(existing_custom_card_number || "");
          card_number_control.refresh();
          let existing_custom_card_expiration_date = frappe.model.get_value(p.doctype, p.name, "custom_card_expiration_date");
          let expiry_date_control = frappe.ui.form.make_control({
            df: {
              label: "Card Expiration Date",
              fieldtype: "Data",
              placeholder: "MM/YY",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_card_expiration_date", this.value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.expiry-date`),
            render_input: true,
            default: p.custom_card_expiration_date || ""
          });
          expiry_date_control.set_value(existing_custom_card_expiration_date || "");
          expiry_date_control.refresh();
          let existing_custom_approval_code = frappe.model.get_value(p.doctype, p.name, "custom_approval_code");
          let custom_approval_code_control = frappe.ui.form.make_control({
            df: {
              label: "Approval Code",
              fieldtype: "Data",
              placeholder: "Approval Code",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_approval_code", this.value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.approval-code`),
            render_input: true
          });
          custom_approval_code_control.set_value(existing_custom_approval_code || "");
          custom_approval_code_control.refresh();
          let existing_reference_no = frappe.model.get_value(p.doctype, p.name, "reference_no");
          let reference_no_control = frappe.ui.form.make_control({
            df: {
              label: "Reference No",
              fieldtype: "Data",
              placeholder: "Reference No.",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "reference_no", this.value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.reference-number`),
            render_input: true
          });
          reference_no_control.set_value(existing_reference_no || "");
          reference_no_control.refresh();
        }
        if (p.mode_of_payment === "Cheque" || p.mode_of_payment === "Government") {
          let existing_custom_bank_name = frappe.model.get_value(p.doctype, p.name, "custom_check_bank_name");
          let bank_name_control = frappe.ui.form.make_control({
            df: {
              label: "Check Bank Name",
              fieldtype: "Data",
              placeholder: "Check Bank Name",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_check_bank_name", this.value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.bank-name`),
            render_input: true
          });
          bank_name_control.set_value(existing_custom_bank_name || "");
          bank_name_control.refresh();
          let existing_custom_check_name = frappe.model.get_value(p.doctype, p.name, "custom_name_on_check");
          let check_name_control = frappe.ui.form.make_control({
            df: {
              label: "Name On Check",
              fieldtype: "Data",
              placeholder: "Check Name",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_name_on_check", this.value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.check-name`),
            render_input: true
          });
          check_name_control.set_value(existing_custom_check_name || "");
          check_name_control.refresh();
          let existing_custom_check_number = frappe.model.get_value(p.doctype, p.name, "custom_check_number");
          let check_number_control = frappe.ui.form.make_control({
            df: {
              label: "Check Number",
              fieldtype: "Data",
              placeholder: "Check Number",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_check_number", this.value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.check-number`),
            render_input: true
          });
          check_number_control.set_value(existing_custom_check_number || "");
          check_number_control.refresh();
          let existing_custom_check_date = frappe.model.get_value(p.doctype, p.name, "custom_check_date");
          let check_date_control = frappe.ui.form.make_control({
            df: {
              fieldname: "custom_check_date",
              label: "Check Date",
              fieldtype: "Date",
              placeholder: "Check Date",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_check_date", this.get_value());
              }
            },
            parent: this.$payment_modes.find(`.${mode}.check-date`),
            render_input: true
          });
          check_date_control.set_value(existing_custom_check_date || frappe.datetime.nowdate());
          check_date_control.refresh();
        }
        if (p.mode_of_payment === "2306") {
          let existing_custom_form_2306 = frappe.model.get_value(p.doctype, p.name, "custom_form_2306");
          let check_form_2306 = frappe.ui.form.make_control({
            df: {
              label: `Expected 2306 Amount`,
              fieldtype: "Currency",
              placeholder: "Actual 2306",
              read_only: 1,
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_form_2306", doc.custom_2306);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.actual-gov-one`),
            render_input: true
          });
          check_form_2306.set_value(existing_custom_form_2306 || "");
          check_form_2306.refresh();
        }
        if (p.mode_of_payment === "2307") {
          let existing_custom_form_2307 = frappe.model.get_value(p.doctype, p.name, "custom_form_2307");
          let check_form_2307 = frappe.ui.form.make_control({
            df: {
              label: `Expected 2307 Amount`,
              fieldtype: "Currency",
              placeholder: "Actual 2307",
              read_only: 1,
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_form_2307", doc.custom_2307);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.actual-gov-two`),
            render_input: true
          });
          check_form_2307.set_value(existing_custom_form_2307 || "");
          check_form_2307.refresh();
        }
        if (p.mode_of_payment === "QR Payment") {
          let existing_custom_payment_type = frappe.model.get_value(p.doctype, p.name, "custom_payment_type");
          let custom_payment_type = frappe.ui.form.make_control({
            df: {
              label: "Payment Type",
              fieldtype: "Select",
              options: [
                { label: "Select Payment Type", value: "" },
                { label: "Standee", value: "Standee" },
                { label: "Terminal", value: "Terminnal" }
              ],
              onchange: function() {
                const value = this.value;
                frappe.model.set_value(p.doctype, p.name, "custom_payment_type", value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.payment-type`),
            render_input: true
          });
          custom_payment_type.set_value(existing_custom_payment_type || "");
          custom_payment_type.refresh();
          let existing_custom_bank_type = frappe.model.get_value(p.doctype, p.name, "custom_bank_type");
          let custom_bank_type = frappe.ui.form.make_control({
            df: {
              label: "Bank",
              fieldtype: "Select",
              options: [
                { label: "Select Bank Type", value: "" },
                { label: "SBC", value: "SBC" },
                { label: "MBTC", value: "MBTC" },
                { label: "MAYA", value: "MAYA" },
                { label: "BDO", value: "BDO" }
              ],
              onchange: function() {
                const value = this.value;
                frappe.model.set_value(p.doctype, p.name, "custom_bank_type", value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.bank-type`),
            render_input: true
          });
          custom_bank_type.set_value(existing_custom_bank_type || "");
          custom_bank_type.refresh();
          let existing_custom_qr_reference_number = frappe.model.get_value(p.doctype, p.name, "custom_qr_reference_number");
          let custom_qr_reference_number = frappe.ui.form.make_control({
            df: {
              label: `QR Reference No.`,
              fieldtype: "Data",
              placeholder: "QR Reference No.",
              onchange: function() {
                frappe.model.set_value(p.doctype, p.name, "custom_qr_reference_number", this.value);
              }
            },
            parent: this.$payment_modes.find(`.${mode}.qr-reference-number`),
            render_input: true
          });
          custom_qr_reference_number.set_value(existing_custom_qr_reference_number || "");
          custom_qr_reference_number.refresh();
        }
        this[`${mode}_control`].toggle_label(false);
        this[`${mode}_control`].set_value(p.amount);
      });
      this.render_loyalty_points_payment_mode();
      this.attach_cash_shortcuts(doc);
    }
    focus_on_default_mop() {
      const doc = this.events.get_frm().doc;
      const payments = doc.payments;
      payments.forEach((p) => {
        const mode = p.mode_of_payment.replace(/ +/g, "_").toLowerCase();
        if (p.default) {
          setTimeout(() => {
            this.$payment_modes.find(`.${mode}.mode-of-payment-control`).parent().click();
          }, 500);
        }
      });
    }
    attach_cash_shortcuts(doc) {
      const grand_total = cint(frappe.sys_defaults.disable_rounded_total) ? doc.grand_total : doc.rounded_total;
      const currency = doc.currency;
      const shortcuts = this.get_cash_shortcuts(flt(grand_total));
      this.$payment_modes.find(".cash-shortcuts").remove();
      let shortcuts_html = shortcuts.map((s) => {
        return `<div class="shortcut" data-value="${s}">${format_currency(s, currency, 0)}</div>`;
      }).join("");
      this.$payment_modes.find('[data-payment-type="Cash"]').find(".mode-of-payment-control").after(`<div class="cash-shortcuts">${shortcuts_html}</div>`);
    }
    get_cash_shortcuts(grand_total) {
      let steps = [1, 5, 10];
      const digits = String(Math.round(grand_total)).length;
      steps = steps.map((x) => x * 10 ** (digits - 2));
      const get_nearest = (amount, x) => {
        let nearest_x = Math.ceil(amount / x) * x;
        return nearest_x === amount ? nearest_x + x : nearest_x;
      };
      let shortcuts = steps.reduce((finalArr, x) => {
        let nearest_x = get_nearest(grand_total, x);
        nearest_x = finalArr.indexOf(nearest_x) != -1 ? nearest_x + x : nearest_x;
        return [...finalArr, nearest_x];
      }, []);
      if (grand_total > 100) {
        if (!shortcuts.includes(500)) {
          shortcuts.push(500);
        }
        if (!shortcuts.includes(1e3)) {
          shortcuts.push(1e3);
        }
      }
      shortcuts.sort((a, b) => a - b);
      return shortcuts;
    }
    render_loyalty_points_payment_mode() {
      const me = this;
      const doc = this.events.get_frm().doc;
      const { loyalty_program, loyalty_points, conversion_factor } = this.events.get_customer_details();
      this.$payment_modes.find(`.mode-of-payment[data-mode="loyalty-amount"]`).parent().remove();
      if (!loyalty_program)
        return;
      let description, read_only, max_redeemable_amount;
      if (!loyalty_points) {
        description = __("You don't have enough points to redeem.");
        read_only = true;
      } else {
        max_redeemable_amount = flt(
          flt(loyalty_points) * flt(conversion_factor),
          precision("loyalty_amount", doc)
        );
        description = __("You can redeem upto {0}.", [format_currency(max_redeemable_amount)]);
        read_only = false;
      }
      const margin = this.$payment_modes.children().length % 2 === 0 ? "pr-2" : "pl-2";
      const amount = doc.loyalty_amount > 0 ? format_currency(doc.loyalty_amount, doc.currency) : "";
      this.$payment_modes.append(
        `<div class="payment-mode-wrapper">
				<div class="mode-of-payment loyalty-card" data-mode="loyalty-amount" data-payment-type="loyalty-amount">
					Redeem Loyalty Points
					<div class="loyalty-amount-amount pay-amount">${amount}</div>
					<div class="loyalty-amount-name">${loyalty_program}</div>
					<div class="loyalty-amount mode-of-payment-control"></div>
				</div>
			</div>`
      );
      this["loyalty-amount_control"] = frappe.ui.form.make_control({
        df: {
          label: __("Redeem Loyalty Points"),
          fieldtype: "Currency",
          placeholder: __("Enter amount to be redeemed."),
          options: "company:currency",
          read_only,
          onchange: async function() {
            if (!loyalty_points)
              return;
            if (this.value > max_redeemable_amount) {
              frappe.show_alert({
                message: __("You cannot redeem more than {0}.", [
                  format_currency(max_redeemable_amount)
                ]),
                indicator: "red"
              });
              frappe.utils.play_sound("submit");
              me["loyalty-amount_control"].set_value(0);
              return;
            }
            const redeem_loyalty_points = this.value > 0 ? 1 : 0;
            await frappe.model.set_value(
              doc.doctype,
              doc.name,
              "redeem_loyalty_points",
              redeem_loyalty_points
            );
            frappe.model.set_value(
              doc.doctype,
              doc.name,
              "loyalty_points",
              parseInt(this.value / conversion_factor)
            );
          },
          description
        },
        parent: this.$payment_modes.find(`.loyalty-amount.mode-of-payment-control`),
        render_input: true
      });
      this["loyalty-amount_control"].toggle_label(false);
    }
    render_add_payment_method_dom() {
      const docstatus = this.events.get_frm().doc.docstatus;
      if (docstatus === 0)
        this.$payment_modes.append(
          `<div class="w-full pr-2">
					<div class="add-mode-of-payment w-half text-grey mb-4 no-select pointer">+ Add Payment Method</div>
				</div>`
        );
    }
    update_totals_section(doc) {
      if (!doc)
        doc = this.events.get_frm().doc;
      const paid_amount = doc.paid_amount;
      const grand_total = cint(frappe.sys_defaults.disable_rounded_total) ? doc.grand_total : doc.rounded_total;
      const remaining = grand_total - doc.paid_amount;
      const change = doc.change_amount || remaining <= 0 ? -1 * remaining : void 0;
      const currency = doc.currency;
      const label = change ? __("Change") : __("To Be Paid");
      this.$totals.html(
        `<div class="col">
				<div class="total-label">${__("Grand Total")}</div>
				<div class="value">${format_currency(grand_total, currency)}</div>
			</div>
			<div class="seperator-y"></div>
			<div class="col">
				<div class="total-label">${__("Paid Amount")}</div>
				<div class="value">${format_currency(paid_amount, currency)}</div>
			</div>
			<div class="seperator-y"></div>
			<div class="col">
				<div class="total-label">${label}</div>
				<div class="value">${format_currency(change || remaining, currency)}</div>
			</div>`
      );
    }
    toggle_component(show) {
      show ? this.$component.css("display", "flex") : this.$component.css("display", "none");
    }
  };

  // ../custom_app/custom_app/customapp/page/packing_list/packing_list_past_oder_list.js
  custom_app.PointOfSale.PastOrderList = class {
    constructor({ wrapper, events }) {
      this.wrapper = wrapper;
      this.events = events;
      this.init_component();
    }
    init_component() {
      this.prepare_dom();
      this.make_filter_section();
      this.bind_events();
    }
    prepare_dom() {
      this.wrapper.append(
        `<section class="past-order-list">
				<div class="filter-section">
					<div class="label">${__("Recent Orders")}</div>
					<div class="search-field"></div>
					<div class="status-field"></div>
				</div>
				<div class="invoices-container"></div>
			</section>`
      );
      this.$component = this.wrapper.find(".past-order-list");
      this.$invoices_container = this.$component.find(".invoices-container");
    }
    bind_events() {
      this.search_field.$input.on("input", (e) => {
        clearTimeout(this.last_search);
        this.last_search = setTimeout(() => {
          const search_term = e.target.value;
          this.refresh_list(search_term, this.status_field.get_value());
        }, 300);
      });
      const me = this;
      this.$invoices_container.on("click", ".invoice-wrapper", function() {
        const invoice_name = unescape($(this).attr("data-invoice-name"));
        me.events.open_invoice_data(invoice_name);
      });
      this.$invoices_container.off("keydown", ".invoice-wrapper").on("keydown", ".invoice-wrapper", function(event2) {
        const $items = me.$invoices_container.find(".invoice-wrapper");
        const currentIndex = $items.index($(this));
        let nextIndex = currentIndex;
        switch (event2.which) {
          case 13:
            $(this).click();
            break;
          case 38:
            nextIndex = currentIndex > 0 ? currentIndex - 1 : $items.length - 1;
            break;
          case 40:
            nextIndex = currentIndex < $items.length - 1 ? currentIndex + 1 : 0;
            break;
          default:
            return;
        }
        $items.eq(nextIndex).focus();
      });
      frappe.ui.keys.add_shortcut({
        shortcut: "ctrl+i",
        action: () => {
          const $items = me.$invoices_container.find(".invoice-wrapper");
          if ($items.length) {
            $items.first().focus();
          }
        },
        condition: () => me.$invoices_container.is(":visible"),
        description: __("Activate Cart Item Focus"),
        ignore_inputs: true,
        page: cur_page.page.page
      });
    }
    make_filter_section() {
      const me = this;
      this.search_field = frappe.ui.form.make_control({
        df: {
          label: __("Search"),
          fieldtype: "Data",
          placeholder: __("Search by invoice id or customer name")
        },
        parent: this.$component.find(".search-field"),
        render_input: true
      });
      this.status_field = frappe.ui.form.make_control({
        df: {
          label: __("Invoice Status"),
          fieldtype: "Select",
          options: `Draft`,
          placeholder: __("Filter by invoice status"),
          onchange: function() {
            if (me.$component.is(":visible"))
              me.refresh_list();
          }
        },
        parent: this.$component.find(".status-field"),
        render_input: true
      });
      this.search_field.toggle_label(false);
      this.status_field.toggle_label(false);
      this.status_field.set_value("Draft");
    }
    refresh_list() {
      frappe.dom.freeze();
      this.events.reset_summary();
      const search_term = this.search_field.get_value();
      const status = this.status_field.get_value();
      const pos_profile = this.events.pos_profile();
      this.$invoices_container.html("");
      return frappe.call({
        method: "custom_app.customapp.page.packing_list.packing_list.get_past_order_list",
        freeze: true,
        args: { search_term, status, pos_profile },
        callback: (response) => {
          frappe.dom.unfreeze();
          response.message.forEach((invoice) => {
            const invoice_html = this.get_invoice_html(invoice);
            this.$invoices_container.append(invoice_html);
          });
        }
      });
    }
    get_invoice_html(invoice) {
      const posting_datetime = moment(invoice.posting_date + " " + invoice.posting_time).format(
        "Do MMMM, h:mma"
      );
      return `<div class="invoice-wrapper" tabindex="0" data-invoice-name="${escape(invoice.name)}">
				<div class="invoice-name-date">
					<div class="invoice-name">${invoice.name}</div>
					<div class="invoice-date">
						<svg class="mr-2" width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
						</svg>
						${frappe.ellipsis(invoice.customer, 20)}
					</div>
				</div>
				<div class="invoice-total-status">
					<div class="invoice-total">${format_currency(invoice.grand_total, invoice.currency) || 0}</div>
					<div class="invoice-date">${posting_datetime}</div>
				</div>
			</div>
			<div class="seperator"></div>`;
    }
    toggle_component(show) {
      show ? this.$component.css("display", "flex") && this.refresh_list() : this.$component.css("display", "none");
    }
  };

  // ../custom_app/custom_app/customapp/page/packing_list/packing_list_past_order_summary.js
  var import_jsbarcode = __toESM(require_JsBarcode());
  custom_app.PointOfSale.PastOrderSummary = class {
    constructor({ wrapper, events }) {
      this.wrapper = wrapper;
      this.events = events;
      this.init_component();
    }
    init_component() {
      this.prepare_dom();
      this.init_email_print_dialog();
      this.bind_events();
      this.attach_shortcuts();
    }
    prepare_dom() {
      this.wrapper.append(
        `
			<section class="past-order-summary">
				<div class="no-summary-placeholder">
					${__("Select an invoice to load summary data")}
				</div>
				<div class="invoice-summary-wrapper">
					<div class="abs-container">
						<div class="upper-section"></div>
						<div class="label">${__("Items")}</div>
						<div class="items-container summary-container"></div>
						<div class="label">${__("Totals")}</div>
						<div class="totals-container summary-container"></div>
						<div class="label">${__("Payments")}</div>
						<div class="payments-container summary-container"></div>
						<div class="change-container summary-container"></div>
						<div class="summary-btns"></div>
						<svg id="barcode" class="mt-3 mx-auto" style="max-width: 100%;" jsbarcode-format="code128"></svg>
					</div>
				</div>
			</section>`
      );
      this.$component = this.wrapper.find(".past-order-summary");
      this.$summary_wrapper = this.$component.find(".invoice-summary-wrapper");
      this.$summary_container = this.$component.find(".abs-container");
      this.$upper_section = this.$summary_container.find(".upper-section");
      this.$items_container = this.$summary_container.find(".items-container");
      this.$totals_container = this.$summary_container.find(".totals-container");
      this.$payment_container = this.$summary_container.find(".payments-container");
      this.$change_container = this.$summary_container.find(".change-container");
      this.$summary_btns = this.$summary_container.find(".summary-btns");
    }
    init_email_print_dialog() {
      const email_dialog = new frappe.ui.Dialog({
        title: "Email Receipt",
        fields: [
          { fieldname: "email_id", fieldtype: "Data", options: "Email", label: "Email ID", reqd: 1 },
          { fieldname: "content", fieldtype: "Small Text", label: "Message (if any)" }
        ],
        primary_action: () => {
          this.send_email();
        },
        primary_action_label: __("Send")
      });
      this.email_dialog = email_dialog;
      const print_dialog = new frappe.ui.Dialog({
        title: "Print Receipt",
        fields: [{ fieldname: "print", fieldtype: "Data", label: "Print Preview" }],
        primary_action: () => {
          this.print_receipt();
        },
        primary_action_label: __("Print")
      });
      this.print_dialog = print_dialog;
    }
    get_upper_section_html(doc) {
      const { status } = doc;
      let indicator_color = "";
      const sold_by = status === "Draft" ? "Amesco Drug Corporation" : doc.owner;
      ["Paid", "Consolidated"].includes(status) && (indicator_color = "green");
      status === "Draft" && (indicator_color = "red");
      status === "Return" && (indicator_color = "grey");
      return `<div class="left-section">
					<div class="customer-name">${doc.customer}</div>
					<div class="customer-email">${this.customer_email}</div>
					<div class="cashier">${__("Amesco Drug Corporation")}</div>
				</div>
				<div class="right-section">
					<div class="paid-amount">${format_currency(doc.grand_total, doc.currency)}</div>
					<div class="invoice-name">${doc.name}</div>
					<span class="indicator-pill whitespace-nowrap ${indicator_color}"><span>${doc.status}</span></span>
				</div>`;
    }
    get_item_html(doc, item_data) {
      return `<div class="item-row-wrapper">
					<div class="item-name">${item_data.item_name}</div>
					<div class="item-qty">${item_data.qty || 0} ${item_data.uom}</div>
					<div class="item-rate-disc">${get_rate_discount_html()}</div>
				</div>`;
      function get_rate_discount_html() {
        if (item_data.rate && item_data.price_list_rate && item_data.rate !== item_data.price_list_rate) {
          return `<span class="item-disc">(${item_data.discount_percentage}% off)</span>
						<div class="item-rate">${format_currency(item_data.rate, doc.currency)}</div>`;
        } else {
          return `<div class="item-rate">${format_currency(
            item_data.price_list_rate || item_data.rate,
            doc.currency
          )}</div>`;
        }
      }
    }
    get_discount_html(doc) {
      if (doc.discount_amount) {
        return `<div class="summary-row-wrapper">
						<div>Discount (${doc.additional_discount_percentage} %)</div>
						<div>${format_currency(doc.discount_amount, doc.currency)}</div>
					</div>`;
      } else {
        return ``;
      }
    }
    get_vatable_sales_html(doc) {
      return `<div class="summary-row-wrapper">
					<div>${__("VATable Sales")}</div>
					<div>${format_currency(doc.custom_vatable_sales, doc.currency)}</div>
				</div>`;
    }
    get_vatable_exempt_html(doc) {
      return `<div class="summary-row-wrapper">
					<div>${__("VAT-Exempt Sales")}</div>
					<div>${format_currency(doc.custom_vat_exempt_sales, doc.currency)}</div>
				</div>`;
    }
    get_zero_rated_html(doc) {
      return `<div class="summary-row-wrapper">
					<div>${__("Zero-Rated")}</div>
					<div>${format_currency(doc.custom_zero_rated_sales, doc.currency)}</div>
				</div>`;
    }
    get_vat_amount_html(doc) {
      return `<div class="summary-row-wrapper">
					<div>${__("VAT 12%")}</div>
					<div>${format_currency(doc.custom_vat_amount, doc.currency)}</div>
				</div>`;
    }
    get_net_total_html(doc) {
      return `<div class="summary-row-wrapper">
					<div>${__("Net Total")}</div>
					<div>${format_currency(doc.net_total, doc.currency)}</div>
				</div>`;
    }
    get_taxes_html(doc) {
      if (!doc.taxes.length)
        return "";
      let taxes_html = doc.taxes.map((t) => {
        const description = /[0-9]+/.test(t.description) ? t.description : t.rate != 0 ? `${t.description} @ ${t.rate}%` : t.description;
        return `
				<div class="tax-row">
					<div class="tax-label">${description}</div>
					<div class="tax-value">${format_currency(t.tax_amount_after_discount_amount, doc.currency)}</div>
				</div>
			`;
      }).join("");
      return `<div class="taxes-wrapper">${taxes_html}</div>`;
    }
    get_grand_total_html(doc) {
      return `<div class="summary-row-wrapper grand-total">
					<div>${__("Grand Total")}</div>
					<div>${format_currency(doc.grand_total, doc.currency)}</div>
				</div>`;
    }
    get_payment_html(doc, payment) {
      return `<div class="summary-row-wrapper payments">
					<div>${__(payment.mode_of_payment)}</div>
					<div>${format_currency(payment.amount, doc.currency)}</div>
				</div>
				<div class="summary-row-wrapper change">
					<div>${__("Change")}</div>
					<div>${format_currency(doc.change_amount, doc.currency)}</div>
				</div>
				`;
    }
    bind_events() {
      this.$summary_container.on("click", ".return-btn", () => {
        this.events.process_return(this.doc.name);
        this.toggle_component(false);
        this.$component.find(".no-summary-placeholder").css("display", "flex");
        this.$summary_wrapper.css("display", "none");
      });
      this.$summary_container.on("click", ".edit-btn", () => {
        this.events.edit_order(this.doc.name);
        this.toggle_component(false);
        this.$component.find(".no-summary-placeholder").css("display", "flex");
        this.$summary_wrapper.css("display", "none");
      });
      this.$summary_container.on("click", ".delete-btn", () => {
        this.events.delete_order(this.doc.name);
        this.show_summary_placeholder();
      });
      this.$summary_container.on("click", ".delete-btn", () => {
        this.events.delete_order(this.doc.name);
        this.show_summary_placeholder();
      });
      this.$summary_container.on("click", ".new-btn", () => {
        this.events.new_order();
        this.toggle_component(false);
        this.$component.find(".no-summary-placeholder").css("display", "flex");
        this.$summary_wrapper.css("display", "none");
      });
      this.$summary_container.on("click", ".email-btn", () => {
        this.email_dialog.fields_dict.email_id.set_value(this.customer_email);
        this.email_dialog.show();
      });
      this.$summary_container.on("click", ".print-btn", () => {
        this.print_receipt();
      });
    }
    pos_new_order() {
      this.events.new_order();
    }
    print_receipt() {
      const frm = this.events.get_frm();
      frappe.utils.print(
        this.doc.doctype,
        this.doc.name,
        frm.pos_print_format,
        this.doc.letter_head,
        this.doc.language || frappe.boot.lang
      );
    }
    attach_shortcuts() {
      const ctrl_label = frappe.utils.is_mac() ? "\u2318" : "Ctrl";
      this.$summary_container.find(".print-btn").attr("title", `${ctrl_label}+P`);
      frappe.ui.keys.add_shortcut({
        shortcut: "ctrl+p",
        action: () => this.$summary_container.find(".print-btn").click(),
        condition: () => this.$component.is(":visible") && this.$summary_container.find(".print-btn").is(":visible"),
        description: __("Print Receipt"),
        page: cur_page.page.page
      });
      this.$summary_container.find(".new-btn").attr("title", `${ctrl_label}+Enter`);
      frappe.ui.keys.on("ctrl+enter", () => {
        const summary_is_visible = this.$component.is(":visible");
        if (summary_is_visible && this.$summary_container.find(".new-btn").is(":visible")) {
          this.$summary_container.find(".new-btn").click();
        }
      });
      this.$summary_container.find(".edit-btn").attr("title", `${ctrl_label}+E`);
      frappe.ui.keys.add_shortcut({
        shortcut: "ctrl+e",
        action: () => this.$summary_container.find(".edit-btn").click(),
        condition: () => this.$component.is(":visible") && this.$summary_container.find(".edit-btn").is(":visible"),
        description: __("Edit Receipt"),
        page: cur_page.page.page
      });
      this.$summary_container.find(".edit-btn").attr("title", `${ctrl_label}+E`);
      frappe.ui.keys.add_shortcut({
        shortcut: "ctrl+e",
        action: () => this.$summary_container.find(".edit-btn").click(),
        condition: () => this.$component.is(":visible") && this.$summary_container.find(".edit-btn").is(":visible"),
        description: __("Edit Receipt"),
        page: cur_page.page.page
      });
    }
    send_email() {
      const frm = this.events.get_frm();
      const recipients = this.email_dialog.get_values().email_id;
      const content = this.email_dialog.get_values().content;
      const doc = this.doc || frm.doc;
      const print_format = frm.pos_print_format;
      frappe.call({
        method: "frappe.core.doctype.communication.email.make",
        args: {
          recipients,
          subject: __(frm.meta.name) + ": " + doc.name,
          content: content ? content : __(frm.meta.name) + ": " + doc.name,
          doctype: doc.doctype,
          name: doc.name,
          send_email: 1,
          print_format,
          sender_full_name: frappe.user.full_name(),
          _lang: doc.language
        },
        callback: (r) => {
          if (!r.exc) {
            frappe.utils.play_sound("email");
            if (r.message["emails_not_sent_to"]) {
              frappe.msgprint(
                __("Email not sent to {0} (unsubscribed / disabled)", [
                  frappe.utils.escape_html(r.message["emails_not_sent_to"])
                ])
              );
            } else {
              frappe.show_alert({
                message: __("Email sent successfully."),
                indicator: "green"
              });
            }
            this.email_dialog.hide();
          } else {
            frappe.msgprint(__("There were errors while sending email. Please try again."));
          }
        }
      });
    }
    add_summary_btns(map) {
      this.$summary_btns.html("");
      map.forEach((m) => {
        if (m.condition) {
          m.visible_btns.forEach((b) => {
            const class_name = b.split(" ")[0].toLowerCase();
            const btn = __(b);
            this.$summary_btns.append(
              `<div class="summary-btn btn btn-default ${class_name}-btn">${btn}</div>`
            );
          });
        }
      });
      this.$summary_btns.children().last().removeClass("mr-4");
    }
    toggle_summary_placeholder(show) {
      if (show) {
        this.$summary_wrapper.css("display", "none");
        this.$component.find(".no-summary-placeholder").css("display", "flex");
      } else {
        this.$summary_wrapper.css("display", "flex");
        this.$component.find(".no-summary-placeholder").css("display", "none");
      }
    }
    get_condition_btn_map(after_submission) {
      if (after_submission)
        return [{ condition: true, visible_btns: ["Print Receipt", "Email Receipt", "New Order"] }];
      return [
        { condition: this.doc.docstatus === 0, visible_btns: ["Print Receipt", "Edit Order", "Delete Order"] },
        {
          condition: !this.doc.is_return && this.doc.docstatus === 1,
          visible_btns: ["Print Receipt", "Email Receipt", "Return"]
        },
        {
          condition: this.doc.is_return && this.doc.docstatus === 1,
          visible_btns: ["Print Receipt", "Email Receipt"]
        }
      ];
    }
    load_summary_of(doc, after_submission = false) {
      after_submission ? this.$component.css("grid-column", "span 10 / span 10") : this.$component.css("grid-column", "span 6 / span 6");
      this.toggle_summary_placeholder(false);
      this.doc = doc;
      this.attach_document_info(doc);
      this.attach_items_info(doc);
      this.attach_totals_info(doc);
      this.attach_payments_info(doc);
      const condition_btns_map = this.get_condition_btn_map(after_submission);
      this.add_summary_btns(condition_btns_map);
    }
    attach_document_info(doc) {
      frappe.db.get_value("Customer", this.doc.customer, "email_id").then(({ message }) => {
        this.customer_email = message.email_id || "";
        const upper_section_dom = this.get_upper_section_html(doc);
        (0, import_jsbarcode.default)(
          "#barcode",
          doc.name,
          {
            width: 1
          }
        );
        this.$upper_section.html(upper_section_dom);
        SS;
      });
    }
    attach_items_info(doc) {
      this.$items_container.html("");
      doc.items.forEach((item) => {
        const item_dom = this.get_item_html(doc, item);
        this.$items_container.append(item_dom);
        this.set_dynamic_rate_header_width();
      });
    }
    set_dynamic_rate_header_width() {
      const rate_cols = Array.from(this.$items_container.find(".item-rate-disc"));
      this.$items_container.find(".item-rate-disc").css("width", "");
      let max_width = rate_cols.reduce((max_width2, elm) => {
        if ($(elm).width() > max_width2)
          max_width2 = $(elm).width();
        return max_width2;
      }, 0);
      max_width += 1;
      if (max_width == 1)
        max_width = "";
      this.$items_container.find(".item-rate-disc").css("width", max_width);
    }
    attach_payments_info(doc) {
      this.$payment_container.html("");
      doc.payments.forEach((p) => {
        if (p.amount) {
          const payment_dom = this.get_payment_html(doc, p);
          this.$payment_container.append(payment_dom);
        }
      });
      if (doc.redeem_loyalty_points && doc.loyalty_amount) {
        const payment_dom = this.get_payment_html(doc, {
          mode_of_payment: "Loyalty Points",
          amount: doc.loyalty_amount
        });
        this.$payment_container.append(payment_dom);
      }
    }
    attach_totals_info(doc) {
      this.$totals_container.html("");
      const net_total_dom = this.get_net_total_html(doc);
      const vatable_sale_dom = this.get_vatable_sales_html(doc);
      const vat_exempt_dom = this.get_vatable_exempt_html(doc);
      const zero_rated_dom = this.get_zero_rated_html(doc);
      const vat_amount_dom = this.get_vat_amount_html(doc);
      const taxes_dom = this.get_taxes_html(doc);
      const discount_dom = this.get_discount_html(doc);
      const grand_total_dom = this.get_grand_total_html(doc);
      this.$totals_container.append(net_total_dom);
      this.$totals_container.append(vatable_sale_dom);
      this.$totals_container.append(vat_exempt_dom);
      this.$totals_container.append(zero_rated_dom);
      this.$totals_container.append(vat_amount_dom);
      this.$totals_container.append(taxes_dom);
      this.$totals_container.append(discount_dom);
      this.$totals_container.append(grand_total_dom);
    }
    toggle_component(show) {
      show ? this.$component.css("display", "flex") : this.$component.css("display", "none");
    }
  };

  // ../custom_app/custom_app/customapp/page/packing_list/packing_list_controller.js
  custom_app.PointOfSale.Controller = class {
    constructor(wrapper) {
      this.wrapper = $(wrapper).find(".layout-main-section");
      this.page = wrapper.page;
      this.init_pos_profile();
      this.add_event_listeners();
      console.log("Controller is loaded");
    }
    init_pos_profile() {
      const savedPosProfile = localStorage.getItem("pos_profile");
      const selectedWarehouse = localStorage.getItem("selected_warehouse");
      if (savedPosProfile) {
        this.prepare_app_defaults({ pos_profile: savedPosProfile, warehouse: selectedWarehouse });
      } else {
        this.select_pos_profile();
      }
    }
    select_pos_profile() {
      const me = this;
      const dialog2 = new frappe.ui.Dialog({
        title: __("Select POS Profile"),
        fields: [
          {
            fieldtype: "Link",
            label: __("POS Profile"),
            options: "POS Profile",
            fieldname: "pos_profile",
            reqd: 1,
            get_query: () => ({
              query: "erpnext.accounts.doctype.pos_profile.pos_profile.pos_profile_query",
              filters: { company: frappe.defaults.get_default("company") }
            })
          }
        ],
        primary_action: function({ pos_profile }) {
          localStorage.setItem("pos_profile", pos_profile);
          me.prepare_app_defaults({ pos_profile });
          dialog2.hide();
          location.reload();
        },
        primary_action_label: __("Select")
      });
      dialog2.show();
    }
    async prepare_app_defaults(data) {
      this.company = frappe.defaults.get_default("company");
      this.pos_profile = data.pos_profile;
      this.warehouse = data.warehouse || null;
      this.item_stock_map = {};
      this.settings = {};
      frappe.db.get_value("Stock Settings", void 0, "allow_negative_stock").then(({ message }) => {
        this.allow_negative_stock = flt(message.allow_negative_stock) || false;
      });
      frappe.call({
        method: "custom_app.customapp.page.packing_list.packing_list.get_pos_profile_data",
        args: { pos_profile: this.pos_profile },
        callback: (res) => {
          const profile = res.message;
          Object.assign(this.settings, profile);
          this.settings.customer_groups = profile.customer_groups.map((group) => group.name);
          this.make_app();
        }
      });
    }
    set_opening_entry_status() {
      this.page.set_title_sub(
        `<span class="indicator orange">
				<a class="text-muted" href="#Form/POS%20Opening%20Entry/${this.pos_opening}">
					Opened at ${moment(this.pos_opening_time).format("Do MMMM, h:mma")}
				</a>
			</span>`
      );
    }
    make_app() {
      this.prepare_dom();
      this.prepare_components();
      this.prepare_menu();
      this.add_buttons_to_toolbar();
      this.make_new_invoice();
    }
    prepare_dom() {
      this.wrapper.append(`<div class="point-of-sale-app"></div>`);
      this.$components_wrapper = this.wrapper.find(".point-of-sale-app");
    }
    prepare_components() {
      this.init_item_selector();
      this.init_item_details();
      this.init_item_cart();
      this.init_payments();
      this.init_recent_order_list();
      this.init_order_summary();
    }
    prepare_dom() {
      this.wrapper.append(`<div class="point-of-sale-app"></div>`);
      this.$components_wrapper = this.wrapper.find(".point-of-sale-app");
    }
    prepare_menu() {
      this.page.clear_menu();
      this.page.add_menu_item(__("Open Form View"), this.open_form_view.bind(this), false, "Ctrl+F");
      this.page.add_menu_item(__("Item Selector (F1)"), this.add_new_order.bind(this), false, "f1");
      this.page.add_menu_item(
        __("Pending Transaction (F2)"),
        this.order_list.bind(this),
        false,
        "f2"
      );
      this.page.add_menu_item(__("Branch Item Lookup (F4)"), this.show_branch_selection_dialog.bind(this), false, "f4");
      this.page.add_menu_item(__("Change POS Profile (F5)"), this.select_pos_profile.bind(this), false, "f5");
      this.page.add_menu_item(__("Save as Draft"), this.save_draft_invoice.bind(this), false, "f3");
    }
    add_buttons_to_toolbar() {
      const buttons = [
        { label: __("Item Selector (F1)"), action: this.add_new_order.bind(this), shortcut: "f1" },
        { label: __("Pending Transaction (F2"), action: this.order_list.bind(this), shortcut: "f2" },
        { label: __("Save as Draft (F3)"), action: this.save_draft_invoice.bind(this), shortcut: "f3" },
        { label: __("Branch Item Lookup (F4)"), action: this.show_branch_selection_dialog.bind(this), shortcut: "f4" },
        { label: __("Change POS Profile (F5)"), action: this.select_pos_profile.bind(this), shortcut: "f5" }
      ];
      $(".page-actions .btn-custom").remove();
      buttons.forEach((btn) => {
        this.page.add_button(btn.label, btn.action, { shortcut: btn.shortcut }).addClass("btn-custom");
      });
    }
    add_new_order() {
      frappe.run_serially([
        () => frappe.dom.freeze(),
        () => this.frm.call("reset_mode_of_payments"),
        () => this.cart.load_invoice(),
        () => this.make_new_invoice(),
        () => this.item_selector.toggle_component(true),
        () => this.item_details.toggle_item_details_section(),
        () => this.toggle_recent_order_list(false),
        () => window.location.reload(),
        () => frappe.dom.unfreeze()
      ]);
    }
    order_list() {
      frappe.run_serially([
        () => frappe.dom.freeze(),
        () => this.toggle_recent_order_list(true),
        () => frappe.dom.unfreeze()
      ]);
    }
    show_branch_selection_dialog() {
      const selectedWarehouse = localStorage.getItem("selected_warehouse") || "";
      const dialog2 = new frappe.ui.Dialog({
        title: __("Select Branch"),
        fields: [
          {
            fieldtype: "Link",
            label: __("Warehouse"),
            options: "Warehouse",
            fieldname: "warehouse",
            default: selectedWarehouse,
            reqd: 1,
            get_query: () => ({
              query: "custom_app.customapp.page.packing_list.packing_list.warehouse_query",
              filters: { company: frappe.defaults.get_default("company") }
            })
          }
        ],
        primary_action: function(data) {
          localStorage.setItem("selected_warehouse", data.warehouse);
          location.reload();
          dialog2.hide();
        },
        primary_action_label: __("View"),
        secondary_action_label: __("Clear"),
        secondary_action: function() {
          localStorage.removeItem("selected_warehouse");
          location.reload();
          dialog2.hide();
        }
      });
      dialog2.show();
    }
    prepare_profile_selection() {
      const me = this;
      const warehouseField = this.page.add_field({
        label: "Branch",
        fieldtype: "Select",
        fieldname: "warehouse",
        options: [],
        change() {
          const selectedWarehouse = warehouseField.get_value();
          if (selectedWarehouse) {
            me.set_warehouse(selectedWarehouse);
          }
        }
      });
      frappe.call({
        method: "custom_app.customapp.page.packing_list.packing_list.warehouse_query",
        args: {
          doctype: "Warehouse",
          txt: "",
          searchfield: "name",
          start: 0,
          page_len: 100,
          filters: {}
        },
        callback: function(r) {
          if (r.message) {
            const warehouses = r.message.map((warehouse) => warehouse[0]);
            warehouseField.df.options = [...warehouses];
            warehouseField.refresh();
          }
        }
      });
    }
    add_event_listeners() {
      frappe.logout = function(originalLogout) {
        return function() {
          localStorage.removeItem("pos_profile");
          return originalLogout.apply(this, arguments);
        };
      }(frappe.logout);
    }
    open_form_view() {
      frappe.model.sync(this.frm.doc);
      frappe.set_route("Form", this.frm.doc.doctype, this.frm.doc.name);
    }
    toggle_recent_order() {
      const show = this.recent_order_list.$component.is(":hidden");
      this.toggle_recent_order_list(show);
    }
    save_draft_invoice() {
      if (!this.$components_wrapper.is(":visible"))
        return;
      if (this.frm.doc.items.length == 0) {
        frappe.show_alert({
          message: __("You must add atleast one item to complete the order."),
          indicator: "red"
        });
        frappe.utils.play_sound("error");
        return;
      }
      const passwordDialog = new frappe.ui.Dialog({
        title: __("Enter Your Password"),
        fields: [
          {
            fieldname: "password",
            fieldtype: "Password",
            label: __("Password"),
            reqd: 1
          }
        ],
        primary_action_label: __("Ok"),
        primary_action: (values) => {
          let password = values.password;
          frappe.call({
            method: "custom_app.customapp.page.packing_list.packing_list.confirm_user_acc_password",
            args: { password },
            callback: (r) => {
              if (r.message) {
                this.set_pharmacist_assist(this.frm);
                this.frm.save(void 0, void 0, void 0, () => {
                  frappe.show_alert({
                    message: __("There was an error saving the document."),
                    indicator: "red"
                  });
                  frappe.utils.play_sound("error");
                }).then(() => {
                  frappe.run_serially([
                    () => frappe.dom.freeze(),
                    () => this.make_new_invoice(),
                    () => frappe.dom.unfreeze()
                  ]);
                  passwordDialog.hide();
                  this.order_summary.load_summary_of(this.frm.doc, true);
                  this.order_summary.print_receipt();
                  window.location.reload();
                  localStorage.removeItem("posCartItems");
                  frappe.show_alert({
                    message: __("Invoice Printed"),
                    indicator: "blue"
                  });
                });
              } else {
                frappe.show_alert({
                  message: __("Incorrect password"),
                  indicator: "red"
                });
              }
            }
          });
        }
      });
      passwordDialog.show();
    }
    set_pharmacist_assist(frm) {
      frappe.call({
        method: "custom_app.customapp.page.packing_list.packing_list.get_pharmacist_user",
        callback: (response) => {
          if (response.message) {
            const pharmacistUser = response.message;
            frappe.model.set_value(frm.doc.doctype, frm.doc.name, "custom_pharmacist_assistant", pharmacistUser);
          } else {
            frappe.throw(__("Error fetching pharmacist user"));
          }
        }
      });
    }
    close_pos() {
      if (!this.$components_wrapper.is(":visible"))
        return;
      let voucher = frappe.model.get_new_doc("POS Closing Entry");
      voucher.pos_profile = this.frm.doc.pos_profile;
      voucher.user = frappe.session.user;
      voucher.company = this.frm.doc.company;
      voucher.pos_opening_entry = this.pos_opening;
      voucher.period_end_date = frappe.datetime.now_datetime();
      voucher.posting_date = frappe.datetime.now_date();
      voucher.posting_time = frappe.datetime.now_time();
      frappe.set_route("Form", "POS Closing Entry", voucher.name);
    }
    init_item_selector() {
      this.item_selector = new custom_app.PointOfSale.ItemSelector({
        wrapper: this.$components_wrapper,
        pos_profile: this.pos_profile,
        settings: this.settings,
        events: {
          item_selected: (args) => {
            frappe.call({
              method: "custom_app.customapp.page.packing_list.packing_list.get_pos_warehouse",
              args: {
                pos_profile: this.pos_profile
              },
              callback: (r) => {
                if (r.message) {
                  const posWarehouse = r.message;
                  const selectedWarehouse = localStorage.getItem("selected_warehouse");
                  if (posWarehouse === selectedWarehouse || selectedWarehouse === null) {
                    this.on_cart_update(args);
                  } else {
                    frappe.show_alert({
                      message: __("You cannot add items from a different branch."),
                      indicator: "red"
                    });
                    frappe.utils.play_sound("error");
                    return;
                  }
                } else {
                  frappe.show_alert({
                    message: __("Could not retrieve the warehouse for the POS Profile."),
                    indicator: "red"
                  });
                  frappe.utils.play_sound("error");
                  return;
                }
              }
            });
          },
          get_frm: () => this.frm || {}
        }
      });
    }
    init_item_cart() {
      this.cart = new custom_app.PointOfSale.ItemCart({
        wrapper: this.$components_wrapper,
        settings: this.settings,
        events: {
          get_frm: () => this.frm,
          cart_item_clicked: (item, frm) => {
            const item_row = this.get_item_from_frm(item);
            this.item_details.toggle_item_details_section(item_row);
          },
          numpad_event: (value, action) => this.update_item_field(value, action),
          checkout: () => this.save_and_checkout(),
          edit_cart: () => this.payment.edit_cart(),
          customer_details_updated: (details) => {
            this.customer_details = details;
            this.payment.render_loyalty_points_payment_mode();
          }
        }
      });
    }
    init_item_details() {
      this.item_details = new custom_app.PointOfSale.ItemDetails({
        wrapper: this.$components_wrapper,
        settings: this.settings,
        events: {
          get_frm: () => this.frm,
          toggle_item_selector: (minimize) => {
            this.item_selector.resize_selector(minimize);
            this.cart.toggle_numpad(minimize);
          },
          form_updated: (item, field, value) => {
            const item_row = frappe.model.get_doc(item.doctype, item.name);
            if (item_row && item_row[field] != value) {
              const args = {
                field,
                value,
                item: this.item_details.current_item
              };
              return this.on_cart_update(args);
            }
            return Promise.resolve();
          },
          highlight_cart_item: (item) => {
            const cart_item = this.cart.get_cart_item(item);
            this.cart.toggle_item_highlight(cart_item);
          },
          item_field_focused: (fieldname) => {
            this.cart.toggle_numpad_field_edit(fieldname);
          },
          set_value_in_current_cart_item: (selector, value) => {
            this.cart.update_selector_value_in_cart_item(
              selector,
              value,
              this.item_details.current_item
            );
          },
          clone_new_batch_item_in_frm: (batch_serial_map, item) => {
            Object.keys(batch_serial_map).forEach((batch) => {
              const item_to_clone = this.frm.doc.items.find((i) => i.name == item.name);
              const new_row = this.frm.add_child("items", __spreadValues({}, item_to_clone));
              new_row.batch_no = batch;
              new_row.serial_no = batch_serial_map[batch].join(`
`);
              new_row.qty = batch_serial_map[batch].length;
              this.frm.doc.items.forEach((row) => {
                if (item.item_code === row.item_code) {
                  this.update_cart_html(row);
                }
              });
            });
          },
          remove_item_from_cart: () => this.remove_item_from_cart(),
          get_item_stock_map: () => this.item_stock_map,
          close_item_details: () => {
            this.item_details.toggle_item_details_section(null);
            this.cart.prev_action = null;
            this.cart.toggle_item_highlight();
          },
          get_available_stock: (item_code, warehouse) => this.get_available_stock(item_code, warehouse)
        }
      });
    }
    init_payments() {
      this.payment = new custom_app.PointOfSale.Payment({
        wrapper: this.$components_wrapper,
        events: {
          get_frm: () => this.frm || {},
          get_customer_details: () => this.customer_details || {},
          toggle_other_sections: (show) => {
            if (show) {
              this.item_details.$component.is(":visible") ? this.item_details.$component.css("display", "none") : "";
              this.item_selector.toggle_component(false);
            } else {
              this.item_selector.toggle_component(true);
            }
          },
          submit_invoice: () => {
            this.frm.savesubmit().then((r) => {
              this.toggle_components(false);
              this.order_summary.toggle_component(true);
              this.order_summary.load_summary_of(this.frm.doc, true);
              frappe.show_alert({
                indicator: "green",
                message: __("POS invoice {0} created succesfully", [r.doc.name])
              });
            });
          },
          save_as_draft: () => {
            this.save_draft_invoice();
          }
        }
      });
    }
    init_recent_order_list() {
      this.recent_order_list = new custom_app.PointOfSale.PastOrderList({
        wrapper: this.$components_wrapper,
        events: {
          open_invoice_data: (name) => {
            frappe.db.get_doc("POS Invoice", name).then((doc) => {
              this.order_summary.load_summary_of(doc);
            });
          },
          pos_profile: () => {
            return this.pos_profile;
          },
          reset_summary: () => this.order_summary.toggle_summary_placeholder(true)
        }
      });
    }
    init_order_summary() {
      this.order_summary = new custom_app.PointOfSale.PastOrderSummary({
        wrapper: this.$components_wrapper,
        events: {
          get_frm: () => this.frm,
          process_return: (name) => {
            this.recent_order_list.toggle_component(false);
            frappe.db.get_doc("POS Invoice", name).then((doc) => {
              frappe.run_serially([
                () => this.make_return_invoice(doc),
                () => this.cart.load_invoice(),
                () => this.item_selector.toggle_component(true)
              ]);
            });
          },
          edit_order: (name) => {
            this.oic_edit_confirm(name);
          },
          delete_order: (name) => {
            frappe.model.delete_doc(this.frm.doc.doctype, name, () => {
              this.recent_order_list.refresh_list();
            });
          },
          new_order: () => {
            frappe.run_serially([
              () => frappe.dom.freeze(),
              () => this.make_new_invoice(),
              () => this.item_selector.toggle_component(true),
              () => frappe.dom.unfreeze()
            ]);
          }
        }
      });
    }
    oic_edit_confirm(name) {
      const passwordDialog = new frappe.ui.Dialog({
        title: __("Enter OIC Password"),
        fields: [
          {
            fieldname: "password",
            fieldtype: "Password",
            label: __("Password"),
            reqd: 1
          }
        ],
        primary_action_label: __("Edit Order"),
        primary_action: (values) => {
          let password = values.password;
          let role = "oic";
          frappe.call({
            method: "custom_app.customapp.page.packing_list.packing_list.confirm_user_password",
            args: { password, role },
            callback: (r) => {
              if (r.message) {
                this.recent_order_list.toggle_component(false);
                frappe.run_serially([
                  () => this.frm.refresh(name),
                  () => this.cart.load_invoice(),
                  () => this.item_selector.toggle_component(true),
                  () => this.toggle_recent_order_list(false)
                ]);
                passwordDialog.hide();
              } else {
                frappe.show_alert({
                  message: __("Incorrect password or user is not an OIC"),
                  indicator: "red"
                });
              }
            }
          });
        }
      });
      passwordDialog.show();
      this.toggle_component(true);
    }
    toggle_recent_order_list(show) {
      this.toggle_components(!show);
      this.recent_order_list.toggle_component(show);
      this.order_summary.toggle_component(show);
    }
    toggle_components(show) {
      this.cart.toggle_component(show);
      this.item_selector.toggle_component(show);
      !show ? this.item_details.toggle_component(false) || this.payment.toggle_component(false) : "";
    }
    make_new_invoice() {
      return frappe.run_serially([
        () => frappe.dom.freeze(),
        () => this.make_sales_invoice_frm(),
        () => this.set_pos_profile_data(),
        () => this.set_pos_profile_status(),
        () => this.cart.load_invoice(),
        () => frappe.dom.unfreeze()
      ]);
    }
    make_sales_invoice_frm() {
      const doctype = "POS Invoice";
      return new Promise((resolve) => {
        if (this.frm) {
          this.frm = this.get_new_frm(this.frm);
          this.frm.doc.items = [];
          this.frm.doc.is_pos = 1;
          resolve();
        } else {
          frappe.model.with_doctype(doctype, () => {
            this.frm = this.get_new_frm();
            this.frm.doc.items = [];
            this.frm.doc.is_pos = 1;
            resolve();
          });
        }
      });
    }
    get_new_frm(_frm) {
      const doctype = "POS Invoice";
      const page = $("<div>");
      const frm = _frm || new frappe.ui.form.Form(doctype, page, false);
      const name = frappe.model.make_new_doc_and_get_name(doctype, true);
      frm.refresh(name);
      return frm;
    }
    async make_return_invoice(doc) {
      frappe.dom.freeze();
      this.frm = this.get_new_frm(this.frm);
      this.frm.doc.items = [];
      return frappe.call({
        method: "erpnext.accounts.doctype.order_list.order_list.make_sales_return",
        args: {
          source_name: doc.name,
          target_doc: this.frm.doc
        },
        callback: (r) => {
          frappe.model.sync(r.message);
          frappe.get_doc(r.message.doctype, r.message.name).__run_link_triggers = false;
          this.set_pos_profile_data().then(() => {
            frappe.dom.unfreeze();
          });
        }
      });
    }
    set_pos_profile_data() {
      if (this.company && !this.frm.doc.company)
        this.frm.doc.company = this.company;
      if ((this.pos_profile && !this.frm.doc.pos_profile) | (this.frm.doc.is_return && this.pos_profile != this.frm.doc.pos_profile)) {
        this.frm.doc.pos_profile = this.pos_profile;
      }
      if (!this.frm.doc.company)
        return;
      return this.frm.trigger("set_pos_data");
    }
    set_pos_profile_status() {
      this.page.set_indicator(this.pos_profile, "blue");
    }
    async on_cart_update(args) {
      frappe.dom.freeze();
      let item_row = void 0;
      try {
        let { field, value, item } = args;
        item_row = this.get_item_from_frm(item);
        const item_row_exists = !$.isEmptyObject(item_row);
        const from_selector = field === "qty" && value === "+1";
        if (from_selector)
          value = flt(item_row.stock_qty) + flt(value);
        if (item_row_exists) {
          if (field === "qty")
            value = flt(value);
          if (["qty", "conversion_factor"].includes(field) && value > 0 && !this.allow_negative_stock) {
            const qty_needed = field === "qty" ? value * item_row.conversion_factor : item_row.qty * value;
            await this.check_stock_availability(item_row, qty_needed, this.frm.doc.set_warehouse);
          }
          if (this.is_current_item_being_edited(item_row) || from_selector) {
            await frappe.model.set_value(item_row.doctype, item_row.name, field, value);
            this.update_cart_html(item_row);
          }
        } else {
          if (!this.frm.doc.customer)
            return this.raise_customer_selection_alert();
          const { item_code, batch_no, serial_no, rate: rate2, uom } = item;
          if (!item_code)
            return;
          const new_item = { item_code, batch_no, rate: rate2, uom, [field]: value };
          if (serial_no && serial_no !== "undefined") {
            await this.check_serial_no_availablilty(item_code, this.frm.doc.set_warehouse, serial_no);
            new_item["serial_no"] = serial_no;
          }
          if (field === "serial_no")
            new_item["qty"] = value.split(`
`).length || 0;
          item_row = this.frm.add_child("items", new_item);
          if (field === "qty" && value !== 0 && !this.allow_negative_stock) {
            const qty_needed = value * item_row.conversion_factor;
            await this.check_stock_availability(item_row, qty_needed, this.frm.doc.set_warehouse);
          }
          await this.trigger_new_item_events(item_row);
          this.update_cart_html(item_row);
          if (this.item_details.$component.is(":visible"))
            this.edit_item_details_of(item_row);
          if (this.check_serial_batch_selection_needed(item_row) && !this.item_details.$component.is(":visible"))
            this.edit_item_details_of(item_row);
        }
      } catch (error) {
        console.log(error);
      } finally {
        frappe.dom.unfreeze();
        return item_row;
      }
    }
    raise_customer_selection_alert() {
      frappe.dom.unfreeze();
      frappe.show_alert({
        message: __("You must select a customer before adding an item."),
        indicator: "orange"
      });
      frappe.utils.play_sound("error");
    }
    get_item_from_frm({ name, item_code, batch_no, uom, rate: rate2 }) {
      let item_row = null;
      if (name) {
        item_row = this.frm.doc.items.find((i) => i.name == name);
      } else {
        const has_batch_no = batch_no !== "null" && batch_no !== null;
        item_row = this.frm.doc.items.find(
          (i) => i.item_code === item_code && (!has_batch_no || has_batch_no && i.batch_no === batch_no) && i.uom === uom && i.rate === flt(rate2)
        );
      }
      return item_row || {};
    }
    edit_item_details_of(item_row) {
      this.item_details.toggle_item_details_section(item_row);
    }
    is_current_item_being_edited(item_row) {
      return item_row.name == this.item_details.current_item.name;
    }
    update_cart_html(item_row, remove_item) {
      this.cart.update_item_html(item_row, remove_item);
      this.cart.update_totals_section(this.frm);
    }
    check_serial_batch_selection_needed(item_row) {
      const serialized = item_row.has_serial_no;
      const batched = item_row.has_batch_no;
      const no_serial_selected = !item_row.serial_no;
      const no_batch_selected = !item_row.batch_no;
      if (serialized && no_serial_selected || batched && no_batch_selected || serialized && batched && (no_batch_selected || no_serial_selected)) {
        return true;
      }
      return false;
    }
    async trigger_new_item_events(item_row) {
      await this.frm.script_manager.trigger("item_code", item_row.doctype, item_row.name);
      await this.frm.script_manager.trigger("qty", item_row.doctype, item_row.name);
    }
    async check_stock_availability(item_row, qty_needed, warehouse) {
      const resp = (await this.get_available_stock(item_row.item_code, warehouse)).message;
      const available_qty = resp[0];
      const is_stock_item = resp[1];
      frappe.dom.unfreeze();
      const bold_uom = item_row.stock_uom.bold();
      const bold_item_code = item_row.item_code.bold();
      const bold_warehouse = warehouse.bold();
      const bold_available_qty = available_qty.toString().bold();
      if (!(available_qty > 0)) {
        if (is_stock_item) {
          frappe.model.clear_doc(item_row.doctype, item_row.name);
          frappe.throw({
            title: __("Not Available"),
            message: __("Item Code: {0} is not available under warehouse {1}.", [
              bold_item_code,
              bold_warehouse
            ])
          });
        } else {
          return;
        }
      } else if (is_stock_item && available_qty < qty_needed) {
        frappe.throw({
          message: __(
            "Stock quantity not enough for Item Code: {0} under warehouse {1}. Available quantity {2} {3}.",
            [bold_item_code, bold_warehouse, bold_available_qty, bold_uom]
          ),
          indicator: "orange"
        });
        frappe.utils.play_sound("error");
      }
      frappe.dom.freeze();
    }
    async check_serial_no_availablilty(item_code, warehouse, serial_no) {
      const method = "erpnext.stock.doctype.serial_no.serial_no.get_pos_reserved_serial_nos";
      const args = { filters: { item_code, warehouse } };
      const res = await frappe.call({ method, args });
      if (res.message.includes(serial_no)) {
        frappe.throw({
          title: "Not Available",
          message: ("Serial No: {0} has already been transacted into another POS Invoice.", [
            serial_no.bold()
          ])
        });
      }
    }
    get_available_stock(item_code, warehouse) {
      const me = this;
      return frappe.call({
        method: "erpnext.accounts.doctype.pos_invoice.pos_invoice.get_stock_availability",
        args: {
          item_code,
          warehouse
        },
        callback(res) {
          if (!me.item_stock_map[item_code])
            me.item_stock_map[item_code] = {};
          me.item_stock_map[item_code][warehouse] = res.message;
        }
      });
    }
    update_item_field(value, field_or_action) {
      if (field_or_action === "checkout") {
        this.item_details.toggle_item_details_section(null);
      } else if (field_or_action === "remove") {
        this.remove_item_from_cart();
      } else {
        const field_control = this.item_details[`${field_or_action}_control`];
        if (!field_control)
          return;
        field_control.set_focus();
        value != "" && field_control.set_value(value);
      }
    }
    remove_item_from_cart() {
      frappe.dom.freeze();
      const { doctype, name, current_item } = this.item_details;
      return frappe.model.set_value(doctype, name, "qty", 0).then(() => {
        frappe.model.clear_doc(doctype, name);
        this.update_cart_html(current_item, true);
        this.item_details.toggle_item_details_section(null);
        frappe.dom.unfreeze();
      }).catch((e) => console.log(e));
    }
    async save_and_checkout() {
      if (this.frm.is_dirty()) {
        let save_error = false;
        await this.frm.save(null, null, null, () => save_error = true);
        !save_error && this.payment.checkout();
        save_error && setTimeout(() => {
          this.cart.toggle_checkout_btn(true);
        }, 300);
      } else {
        this.payment.checkout();
      }
    }
  };
})();
//# sourceMappingURL=packing-list.bundle.7JPZ4ZBS.js.map
