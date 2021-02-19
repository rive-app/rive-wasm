"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.sum = exports.loadWasm = exports.rive = void 0;
var Rive = require('../../wasm/publish/rive');
//#region Type declarations
// Loop types
var Loop;
(function (Loop) {
    Loop[Loop["OneShot"] = 0] = "OneShot";
    Loop[Loop["Loop"] = 1] = "Loop";
    Loop[Loop["PingPong"] = 2] = "PingPong";
})(Loop || (Loop = {}));
// Playback states
var Playback;
(function (Playback) {
    Playback[Playback["Play"] = 0] = "Play";
    Playback[Playback["Pause"] = 1] = "Pause";
    Playback[Playback["Stop"] = 2] = "Stop";
})(Playback || (Playback = {}));
// Fit types
var Fit;
(function (Fit) {
    Fit[Fit["Cover"] = 0] = "Cover";
    Fit[Fit["Contain"] = 1] = "Contain";
    Fit[Fit["Fill"] = 2] = "Fill";
    Fit[Fit["FitWidth"] = 3] = "FitWidth";
    Fit[Fit["FitHeight"] = 4] = "FitHeight";
    Fit[Fit["ScaleDown"] = 5] = "ScaleDown";
    Fit[Fit["None"] = 6] = "None";
})(Fit || (Fit = {}));
;
// Alignments
var Alignment;
(function (Alignment) {
    Alignment[Alignment["TopLeft"] = 0] = "TopLeft";
    Alignment[Alignment["TopCenter"] = 1] = "TopCenter";
    Alignment[Alignment["TopRight"] = 2] = "TopRight";
    Alignment[Alignment["CenterLeft"] = 3] = "CenterLeft";
    Alignment[Alignment["Center"] = 4] = "Center";
    Alignment[Alignment["CenterRight"] = 5] = "CenterRight";
    Alignment[Alignment["BottomLeft"] = 6] = "BottomLeft";
    Alignment[Alignment["BottomCenter"] = 7] = "BottomCenter";
    Alignment[Alignment["BottomRight"] = 8] = "BottomRight";
})(Alignment || (Alignment = {}));
;
// Fit string values
var fitValues = ['cover', 'contain', 'fill', 'fitWidth', 'fitHeight', 'none',
    'scaleDown'];
// Canvas string values
var alignmentValues = ['topLeft', 'topCenter', 'topRight', 'centerLeft', 'center',
    'centerRight', 'bottomLeft', 'bottomCenter', 'bottomRight'];
// Alignment of Rive animations in a canvas
var CanvasAlignment = /** @class */ (function () {
    function CanvasAlignment(fit, alignment, minX, minY, maxX, maxY) {
        this.fit = fit;
        this.alignment = alignment;
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }
    return CanvasAlignment;
}());
;
// Loads the runtime Wasm bundle
var loadWasm = function () {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Rive({
                        locateFile: function (file) { return 'file://../../wasm/publish/' + file; }
                    }).then(function (r) {
                        exports.rive = r;
                        console.log('Loaded Rive ' + r);
                    })["catch"](function (e) {
                        console.error('Unable to load Wasm module');
                        throw e;
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
};
exports.loadWasm = loadWasm;
//#endregion
// Testing Jest setup
var sum = function (a, b) { return a + b; };
exports.sum = sum;
