/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
// Imports.
import { Utils } from "../modules/utils";
import { Elements } from "../modules/elements";
import { CreateVElementClass } from "./element";
import { GradientType } from "./gradient";
// Canvas.
/*	@docs:
 *	@nav: Frontend
 *	@chapter: Elements
 *	@title: Canvas
 *	@description:
 *		Canvas element.
 *	@experimental: true
 *	@warning:
 *		This class is still experimental and may be subject to future change.
 */
let CanvasElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "Canvas",
        tag: "canvas",
    });
    var CanvasElement = _classThis = class extends _classSuper {
        // ---------------------------------------------------------
        // Constructors.
        constructor() {
            super();
            // Safari does not render images correctly for custom elements.
            if (Utils.is_safari) {
                this.attachShadow({ mode: 'open' });
                this._e = document.createElement("canvas");
                this._e.style.objectFit = "cover";
                this.shadowRoot?.appendChild(this._e);
                this.position("relative"); // for img width height 100%
                this.overflow("hidden"); // for border radius.
                // Set resize event otherwise when the item resizes the shadow image does not.
                this.on_resize(() => {
                    this._e.style.width = this.style.width;
                    this._e.width = this.width;
                    this._e.style.height = this.style.height;
                    this._e.height = this.height;
                });
            }
            this.ctx_2d = this.getContext("2d");
        }
        height(value, check_attribute) {
            if (this._e === undefined) {
                return super.height(value, check_attribute);
            }
            if (value == null) {
                return this._e.height;
            }
            super.height(value, false);
            this._e.style.height = this.pad_numeric(value, "px");
            this._e.height = this.pad_numeric(value, "");
            return this;
        }
        min_height(value) {
            if (this._e === undefined) {
                return super.min_height(value);
            }
            if (value == null) {
                return this._e.style.minHeight;
            }
            this._e.style.minHeight = this.pad_numeric(value, "px");
            return this;
        }
        max_height(value) {
            if (this._e === undefined) {
                return super.max_height(value);
            }
            if (value == null) {
                return this._e.style.maxHeight;
            }
            this._e.style.maxHeight = this.pad_numeric(value, "px");
            return this;
        }
        width(value, check_attribute = true) {
            if (this._e === undefined) {
                return super.width(value, check_attribute);
            }
            if (value == null) {
                return this._e.width;
            }
            super.width(value, false);
            this._e.style.width = this.pad_numeric(value, "px");
            this._e.width = value;
            return this;
        }
        min_width(value) {
            if (this._e === undefined) {
                return super.min_width(value);
            }
            if (value == null) {
                return this._e.style.minWidth;
            }
            this._e.style.minWidth = this.pad_numeric(value, "px");
            return this;
        }
        max_width(value) {
            if (this._e === undefined) {
                return super.max_width(value);
            }
            if (value == null) {
                return this._e.style.maxWidth;
            }
            this._e.style.maxWidth = this.pad_numeric(value, "px");
            return this;
        }
        // ---------------------------------------------------------
        // Utility functions.
        getContext(...args) {
            if (Utils.is_safari) {
                return this._e.getContext(...args);
            }
            return super.getContext(...args);
        }
        // Draw lines.
        draw_lines(ctx, points = [], tension) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            let t;
            for (let i = 0; i < points.length - 1; i++) {
                if (points[i].tension != undefined) {
                    t = points[i].tension;
                }
                else {
                    t = (tension != undefined) ? tension : 0;
                }
                let p0 = (i > 0) ? points[i - 1] : points[0];
                let p1 = points[i];
                let p2 = points[i + 1];
                let p3 = (i != points.length - 2) ? points[i + 2] : p2;
                let cp1x = p1.x + (p2.x - p0.x) / 6 * t;
                let cp1y = p1.y + (p2.y - p0.y) / 6 * t;
                let cp2x = p2.x - (p3.x - p1.x) / 6 * t;
                let cp2y = p2.y - (p3.y - p1.y) / 6 * t;
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
            }
            return this;
        }
        // Create gradient.
        create_gradient(ctx, gradient, start_x, start_y, end_x, end_y) {
            if (!(gradient instanceof GradientType)) {
                console.error("Invalid usage, parameter \"gradient\" should be type \"GradientType\".");
                return null;
            }
            if (gradient.colors === undefined) {
                console.error("Invalid usage, gradient attribute \"colors\" is undefined.");
                return null;
            }
            let value;
            if (gradient.type == "linear") {
                value = ctx.createLinearGradient(start_x, start_y, end_x, end_y);
            }
            else if (gradient.type == "radial") {
                value = ctx.createRadialGradient(start_x, start_y, end_x, end_y); // @TODO.
            }
            else {
                value = ctx.createLinearGradient(start_x, start_y, end_x, end_y);
            }
            for (let i = 0; i < gradient.colors.length; i++) {
                let stop = gradient.colors[i].stop;
                if (Utils.is_string(stop) && stop.includes("%")) {
                    stop = parseFloat(stop.substr(0, stop.length - 1)) / 100;
                }
                else if (Utils.is_string(stop) && stop.includes("px")) {
                    stop = parseFloat(stop.substr(0, stop.length - 2));
                }
                value.addColorStop(stop, gradient.colors[i].color);
            }
            return value;
        }
        // ---------------------------------------------------------
        // Functions.
        // Create a line.
        /*	@docs:
         *	@title: Line.
         *	@description:
         *		Create a line, optionally curved and with custom styling.
         *	@return:
         *		Returns the `Canvas` object.
         *	@parameter:
         *		@name: points
         *		@description: The line points, an array with objects with `x` and `y` values.
         *	@parameter:
         *		@name: tension
         *		@description: The smoothness of the line, use `null` or `0` for a straight line and {0.0, 2.0} for a smooth line.
         *	@parameter:
         *		@name: color
         *		@description: The line color.
         *	@parameter:
         *		@name: fill
         *		@description: The fill color, supports a `GradientType` class. leave `null` to ignore.
         *	@parameter:
         *		@name: scale
         *		@type: boolean
         *		@description: When enabled all x and y coordinates are treated as a 0.0 till 1.0 scale in relation to the canvas' width and height.
         *	@parameter:
         *		@name: dots
         *		@type: object
         *		@description:
         *			Place dots at each coordinate, leave `null` to ignore.
         *			Fields:
         *			```{
         *				width: 0.01, // Dot width in pixels when `scale` is `false`, and dot width in percentage `{0.0,1.0}` when `scale` is `true`.
         *				color: "black", // Fill color.
         *			}```
         */
        lines({ points, tension, color = "black", width, fill, scale = false, dots, }) {
            // Create context.
            let ctx = this.ctx_2d;
            // Scale.
            if (scale) {
                let width = this.width() ?? 1;
                if (typeof width !== "number") {
                    width = 1;
                }
                let height = this.height() ?? 1;
                if (typeof height !== "number") {
                    height = 1;
                }
                for (let i = 0; i < points.length; i++) {
                    points[i].x = width * points[i].x;
                    points[i].y = height * points[i].y;
                }
            }
            // Draw.
            this.draw_lines(ctx, points, tension);
            // ctx.beginPath();
            // ctx.moveTo(points[0].x, points[0].y);
            // for (let i = 1; i < points.length; i++) {
            // 	ctx.lineTo(points[i].x, points[i].y);
            // }
            // Stroke style.
            if (width != null) {
                ctx.lineWidth = width;
            }
            if (color != null) {
                ctx.strokeStyle = color;
            }
            else {
                ctx.strokeStyle = "transparent";
            }
            ctx.stroke();
            // Fill style.
            if (fill != null) {
                // Gradient.
                if (fill instanceof GradientType) {
                    let minX = Infinity;
                    let maxX = -Infinity;
                    let minY = Infinity;
                    let maxY = -Infinity;
                    points.forEach((point) => {
                        minX = Math.min(minX, point.x);
                        maxX = Math.max(maxX, point.x);
                        minY = Math.min(minY, point.y);
                        maxY = Math.max(maxY, point.y);
                    });
                    ctx.fillStyle = this.create_gradient(ctx, fill, minX, minY, maxX, maxY);
                }
                // Default color.
                else {
                    ctx.fillStyle = fill;
                }
                // Fill.
                ctx.fill();
            }
            // Draw dots.
            if (dots != null) {
                if (dots.width == null) {
                    if (scale) {
                        dots.width = 0.01;
                    }
                    else {
                        dots.width = 5;
                    }
                }
                if (scale) {
                    let width = this.width() ?? 1;
                    if (typeof width !== "number") {
                        width = 1;
                    }
                    dots.width = dots.width * width;
                }
                let is_gradient = false;
                if (dots.color != null) {
                    if (dots.color instanceof GradientType) {
                        is_gradient = true;
                    }
                    else {
                        ctx.fillStyle = dots.color;
                    }
                }
                for (let i = 0; i < points.length; i++) {
                    ctx.beginPath();
                    ctx.arc(points[i].x, points[i].y, dots.width, 0, 2 * Math.PI);
                    if (is_gradient) {
                        const gradient = this.create_gradient(ctx, dots.color, points[i].x - dots.width, points[i].y, points[i].x + dots.width, points[i].y);
                        ctx.fillStyle = gradient;
                    }
                    ctx.fill();
                    // ctx.fillRect(points[i].x - dots.width / 2, points[i].y - dots.width / 2, dots.width, dots.width);
                }
            }
            return this;
        }
        // Remove all contexts.
        // @ts-ignore
        clear() {
            this.ctx_2d.clearRect(0, 0, this.width, this.height);
            return this;
        }
        shadow_color(val) {
            if (val === undefined) {
                return this.ctx_2d.shadowColor ?? "";
            }
            this.ctx_2d.shadowColor = val;
            return this;
        }
        shadow_blur(val) {
            if (val === undefined) {
                return this.ctx_2d.shadowBlur ?? "";
            }
            this.ctx_2d.shadowBlur = val;
            return this;
        }
        shadow_offset_x(val) {
            if (val === undefined) {
                return this.ctx_2d.shadowOffsetX ?? "";
            }
            this.ctx_2d.shadowOffsetX = this.pad_numeric(val);
            return this;
        }
        shadow_offset_y(val) {
            if (val === undefined) {
                return this.ctx_2d.shadowOffsetY ?? "";
            }
            this.ctx_2d.shadowOffsetY = this.pad_numeric(val);
            return this;
        }
    };
    __setFunctionName(_classThis, "CanvasElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CanvasElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CanvasElement = _classThis;
})();
export { CanvasElement };
;
export const Canvas = Elements.wrapper(CanvasElement);
// function Canvas(...args) {
// 	if (Utils.is_safari) {
// 		const e = document.createElement(CanvasElement.element_tag, {is: "v-" + CanvasElement.name.toLowerCase()})
// 		console.log("E", e);
// 		e._init(...args);
// 		return e;
// 	} else {
// 		return new CanvasElement(...args);
// 	}
// }
