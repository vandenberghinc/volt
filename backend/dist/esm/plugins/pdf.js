/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// ---------------------------------------------------------
// Imports.
const { vlib, vhighlight } = require("../vinc.js");
const { jsPDF } = require("jspdf");
const libfs = require("fs");
// ---------------------------------------------------------
// The mail object.
const PDF = {
    // Use pixels instead of points (NOT ADVISED).
    // use_pixels: false,
    // Get opacity from hex as a floating number 0/1, returns `null` on no opacity.
    hex_opacity(hex) {
        if ((typeof hex !== "string" && hex instanceof String === false) ||
            hex.charAt(0) !== "#" ||
            hex.length <= 7) {
            return null;
        }
        const opacity = parseInt(hex.slice(-2)) / 100;
        return isNaN(opacity) ? null : opacity;
    },
    // Convert hex to rgb(a), since pdfkit does not support a hex with opacity.
    hex_to_rgb(hex) {
        // Not a string.
        if (typeof hex !== "string" && hex instanceof String === false) {
            return hex;
        }
        // Not a hex.
        if (hex.charAt(0) !== "#") {
            return hex; // perhaps a normal color like "blue".
        }
        // Remove the hash (#).
        hex = hex.slice(1);
        // Parse alpha
        let alpha = 1;
        if (hex.length > 6) {
            alpha = parseInt(hex.slice(-2)) / 100;
            hex = hex.slice(0, -2);
        }
        // Parse the hex color.
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        // Return the rgb(a) color.
        if (alpha != 1) {
            return [r, g, b, alpha];
            // return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return [r, g, b];
        // return `rgb(${r}, ${g}, ${b})`;
    },
    hex_to_cmyk(hex) {
        // Remove the hash if present
        // hex = hex.slice(1);
        // // Convert hex to decimal
        // const r = parseInt(hex.substring(0, 2), 16) / 255;
        // const g = parseInt(hex.substring(2, 4), 16) / 255;
        // const b = parseInt(hex.substring(4, 6), 16) / 255;
        // // Calculate CMY
        // let c = 1 - r;
        // let m = 1 - g;
        // let y = 1 - b;
        // // Calculate K (black)
        // let k = Math.min(c, m, y);
        // // Adjust CMY values
        // c = (c - k) / (1 - k);
        // m = (m - k) / (1 - k);
        // y = (y - k) / (1 - k);
        // // Round values to make them more manageable
        // c = Math.round(c * 100);
        // m = Math.round(m * 100);
        // y = Math.round(y * 100);
        // k = Math.round(k * 100);
        // return [c, m, y, k];
        // Convert hex to decimal
        // const r = parseInt(hex.substring(0, 2), 16) / 255;
        // const g = parseInt(hex.substring(2, 4), 16) / 255;
        // const b = parseInt(hex.substring(4, 6), 16) / 255;
        // // Find the maximum of RGB
        // const max = Math.max(r, g, b);
        // // Calculate K (black)
        // const k = 1 - max;
        // // Calculate CMY, considering white (1) is subtracted from RGB
        // const c = (1 - r - k) / (1 - k);
        // const m = (1 - g - k) / (1 - k);
        // const y = (1 - b - k) / (1 - k);
        // // Round values to make them more manageable
        // const cPercent = Math.round(c * 100);
        // const mPercent = Math.round(m * 100);
        // const yPercent = Math.round(y * 100);
        // const kPercent = Math.round(k * 100);
        // return [cPercent, mPercent, yPercent, kPercent];
        // TO RGB.
        // Not a string.
        if (typeof hex !== "string" && hex instanceof String === false) {
            return hex;
        }
        // Not a hex.
        if (hex.charAt(0) !== "#") {
            return hex; // perhaps a normal color like "blue".
        }
        // Remove the hash (#).
        hex = hex.slice(1);
        // Parse alpha
        let alpha = 1;
        if (hex.length > 6) {
            alpha = parseInt(hex.slice(-2)) / 100;
            hex = hex.slice(0, -2);
        }
        // Parse the hex color.
        const bigint = parseInt(hex, 16);
        let r = (bigint >> 16) & 255;
        let g = (bigint >> 8) & 255;
        let b = bigint & 255;
        // TO CMYK.
        var computedC = 0;
        var computedM = 0;
        var computedY = 0;
        var computedK = 0;
        //remove spaces from input RGB values, convert to int
        r = parseInt(('' + r).replace(/\s/g, ''), 10);
        g = parseInt(('' + g).replace(/\s/g, ''), 10);
        b = parseInt(('' + b).replace(/\s/g, ''), 10);
        if (r == null || g == null || b == null ||
            isNaN(r) || isNaN(g) || isNaN(b)) {
            console.error('Please enter numeric RGB values!');
            return;
        }
        if (r < 0 || g < 0 || b < 0 || r > 255 || g > 255 || b > 255) {
            console.error('RGB values must be in the range 0 to 255.');
            return;
        }
        // BLACK
        if (r == 0 && g == 0 && b == 0) {
            computedK = 1;
            return [0, 0, 0, 1];
        }
        computedC = 1 - (r / 255);
        computedM = 1 - (g / 255);
        computedY = 1 - (b / 255);
        var minCMY = Math.min(computedC, Math.min(computedM, computedY));
        computedC = Math.round((computedC - minCMY) / (1 - minCMY) * 100);
        computedM = Math.round((computedM - minCMY) / (1 - minCMY) * 100);
        computedY = Math.round((computedY - minCMY) / (1 - minCMY) * 100);
        computedK = Math.round(minCMY * 100);
        // return [93, 2, 91, 6]
        // return [0, 0, 0, 0]
        return [computedC, computedM, computedY, computedK];
    }
};
// ---------------------------------------------------------
// The pdf base element
// Element.
class Computed {
    static ids = 0;
    constructor({ start_x, start_y, resume_x, resume_y, inner_width = 0, // inner width without padding or margin.
    inner_height = 0, // inner height without padding or margin.
    is_absolute = false, is_wrapped = false, start_page = 0, end_page = 0, _padding, _margin, }) {
        this.start_x = start_x;
        this.start_y = start_y;
        this.resume_x = resume_x;
        this.resume_y = resume_y;
        this.inner_width = inner_width;
        this.inner_height = inner_height;
        this.is_absolute = is_absolute;
        this.is_wrapped = is_wrapped;
        this.start_page = start_page;
        this.end_page = end_page;
        this.allow_force_same_page = true;
        this._margin = _margin;
        this._padding = _padding;
        ++Computed.ids;
        this._id = Computed.ids;
    }
    // Get end x/y.
    get end_x() { return this.start_x + this._margin[1] + this._margin[3] + this._padding[1] + this._padding[3] + this.inner_width; }
    get end_y() { return this.start_y + this._margin[0] + this._margin[2] + this._padding[0] + this._padding[2] + this.inner_height; }
    // Start and end x/y from AFTER the margin.
    get margin_start_x() { return this.start_x + this._margin[3]; }
    get margin_end_x() { return this.end_x - this._margin[1]; }
    get margin_start_y() { return this.start_y + this._margin[0]; }
    get margin_end_y() { return this.end_y - this._margin[2]; }
    // Start and end x/y from AFTER the padding and margin.
    get padding_start_x() { return this.start_x + this._margin[3] + this._padding[3]; }
    get padding_end_x() { return this.end_x - this._margin[1] - this._padding[1]; }
    get padding_start_y() { return this.start_y + this._margin[0] + this._padding[0]; }
    get padding_end_y() { return this.end_y - this._margin[2] - this._padding[2]; }
    // As string for debugging.
    toString() {
        return {
            id: this._id,
            start_x: this.start_x,
            start_y: this.start_y,
            resume_x: this.resume_x,
            resume_y: this.resume_y,
            inner_width: this.inner_width,
            inner_height: this.inner_height,
            is_absolute: this.is_absolute,
            is_wrapped: this.is_wrapped,
            start_page: this.start_page,
            end_page: this.end_page,
            _margin: this._margin,
            _padding: this._padding,
            end_x: this.end_x,
            end_y: this.end_y,
            margin_start_x: this.margin_start_x,
            margin_end_x: this.margin_end_x,
            margin_start_y: this.margin_start_y,
            margin_end_y: this.margin_end_y,
            padding_start_x: this.padding_start_x,
            padding_end_x: this.padding_end_x,
            padding_start_y: this.padding_start_y,
            padding_end_y: this.padding_end_y,
        };
    }
}
function CreateVElementClass({ type, is_text = false, is_img = false, is_hstack = false, is_stack = false, }) {
    class E {
        // ---------------------------------------------------------
        // Constructor.
        constructor(...children) {
            // Attributes.
            this.type = type;
            this._parent = null; // will be assigned by `_build().`
            this._children = [];
            this._text = null;
            this._img = null;
            this._options = {}; // for element options. 
            this._calls = {}; // for doc calls.
            this._id = null;
            this._width = undefined;
            this._height = undefined;
            this._stretch = undefined;
            this._margin = [0, 0, 0, 0];
            this._padding = [0, 0, 0, 0];
            this._position = [null, null, null, null]; // absolute positioning.
            this._background = null;
            this._border_radius = null;
            this._border_color = null;
            this._border_width = 1;
            this._font = null;
            this._font_weight = null;
            // this._wrap = true;
            this._href = null;
            this._force_same_page = false;
            this._page = undefined;
            this._valign = undefined;
            // Static attributes but keep as member.
            this.is_text = is_text;
            this.is_img = is_img;
            this.is_hstack = is_hstack;
            this.is_stack = is_stack;
            // Append.
            this.append(...children);
        }
        copy() {
            const copy = new this.constructor(this._children);
            // Attributes.
            copy.type = this.type;
            copy._parent = this._parent;
            copy._children = this._children;
            copy._text = this._text;
            copy._img = this._img;
            copy._style = this._options;
            copy._calls = this._calls;
            copy._id = this._id;
            copy._width = this._width;
            copy._height = this._height;
            copy._stretch = this.stretch;
            copy._margin = this._margin;
            copy._padding = this._padding;
            copy._position = this._position;
            copy._background = this._background;
            copy._border_radius = this._border_radius;
            copy._border_color = this._border_color;
            copy._border_width = this._border_width;
            copy._font = this._font;
            copy._font_weight = this._font_weight;
            // copy._wrap = this._wrap;
            copy._href = this._href;
            copy._force_same_page = this._force_same_page;
            copy._page = this._page;
            copy._valign = this._valign;
            return copy;
        }
        // ---------------------------------------------------------
        // System.
        // Set doc styling.
        _set_styling(doc) {
            this._restore = {};
            // Execute document calls.
            Object.keys(this._calls).iterate((func) => {
                if (func === "setFont") {
                    return null;
                }
                // Cache.
                this._restore[func] = doc["g" + func.substr(1)]();
                // Array.
                if (Array.isArray(this._calls[func])) {
                    doc[func](...this._calls[func]);
                }
                // Single arg.
                else {
                    doc[func](this._calls[func]);
                }
            });
            // Font.
            if (this._font != null || this._font_weight != null) {
                const font = doc.getFont();
                this._restore.setFont = [font.fontName, font.fontStyle];
                doc.setFont(this._font || doc.fontName, this._font_weight || doc.fontStyle);
            }
        }
        // Restore doc styling.
        _restore_styling(doc) {
            Object.keys(this._restore).iterate((func) => {
                if (Array.isArray(this._restore[func])) {
                    doc[func](...this._restore[func]);
                }
                else {
                    doc[func](this._restore[func]);
                }
            });
        }
        // Check if the _text attr contains whitespace.
        _has_whitespace() {
            if (!this.is_text) {
                return false;
            }
            for (let i = 0; i < this._text.length; i++) {
                const c = this._text.charAt(i);
                if (c === " " || c === "\t") {
                    return true;
                }
            }
            return false;
        }
        // Compute.
        _compute(doc, x, y, page, refresh = false) {
            // Cached.
            if (refresh === false && this._computed !== undefined) {
                return this._computed;
            }
            // Is PDF type.
            if (this.type === "PDF" && doc == null) {
                this._create_doc();
                doc = this._doc;
                x = 0; //doc._volt_margin_left;
                y = 0; //doc._volt_margin_top;
                page = 1;
                refresh = true;
            }
            // Initialize.
            if (this._initialize !== undefined) {
                this._initialize();
            }
            // Convert text to string, since instance String is also not accepted by jspdf.
            if (this._text != null) {
                this._text = this._text.toString();
            }
            // --------------------------------------------------------------------------------
            // Pre compute.
            // Flags.
            const is_absolute = this._position[0] != null || this._position[1] != null || this._position[2] != null || this._position[3] != null;
            if (this._page != null) {
                if (!is_absolute) {
                    throw Error(`Only absolute positioned elements may define an explicit page using "page()".`);
                }
                page = this._page;
            }
            let computed = new Computed({
                start_x: x,
                start_y: y,
                resume_x: x,
                resume_y: y,
                start_page: page,
                end_page: page,
                is_absolute,
                _margin: this._margin,
                _padding: this._padding,
            });
            // Add page.
            if (this.type === "Page") {
                computed.start_x = doc._volt_margin_left;
                computed.start_y = doc._volt_margin_top;
                ++page;
                ++computed.start_page;
                ++computed.end_page;
            }
            // Absolute positioning, ignore document margins!
            let is_absolute_right = false;
            let is_absolute_bottom = false;
            if (computed.is_absolute) {
                if (this._position[1] != null && this._position[3] != null) {
                    computed.start_x = this._position[3];
                    this._width = doc._volt_page_width - this._position[1] - this._position[3];
                }
                else if (this._position[1] != null) {
                    computed.start_x = doc._volt_page_width - this._position[1] - this._margin[1] - this._margin[3] - this._padding[1] - this._padding[3];
                    is_absolute_right = true;
                }
                else if (this._position[3] != null) {
                    computed.start_x = this._position[3];
                }
                if (this._position[0] != null && this._position[2] != null) {
                    computed.start_y = this._position[0];
                    this._height = doc._volt_page_height - this._position[0] - this._position[2];
                }
                else if (this._position[0] != null) {
                    computed.start_y = this._position[0];
                }
                else if (this._position[2] != null) {
                    computed.start_y = doc._volt_page_height - this._position[2] - this._margin[0] - this._margin[2] - this._padding[0] - this._padding[2];
                    is_absolute_bottom = true;
                }
            }
            // Set relative width.
            if (typeof this._width === "string" && this._width.last() === "%") {
                if (this._parent != null && this._parent._max_width != null) {
                    this._width = Math.max(0, this._parent._max_width * (parseInt(this._width.slice(0, -1)) / 100)
                        - (this._margin[1] + this._margin[3] + this._padding[1] + this._padding[3]));
                }
                else {
                    delete this._width;
                }
            }
            // Calculate the max X (after padding and margin are added to x) (after calc relative width).
            if (this._parent == null || this._parent._max_x != null) {
                this._max_x = doc._volt_page_width - doc._volt_margin_right;
            }
            else {
                this._max_x = this._parent._max_x;
            }
            if (this._width != null) {
                this._max_x = Math.min(x + this._width, this._max_x);
            }
            this._max_x -= (this._margin[1] - this._padding[1]);
            // Calculate the max width (after padding and margin are added to x) (after calc relative width).
            this._max_width = parseInt(this._max_x - x); // round down otherwise some text might overflow its background.
            // --------------------------------------------------------------------------------
            // Doc styling.
            this._set_styling(doc);
            // --------------------------------------------------------------------------------
            // Calculate inner width and height.
            // Add image / text.
            if (this.is_text || this.is_img) {
                // Vars.
                let width = 0, height = 0, dimensions;
                const has_whitespace = this._has_whitespace();
                // Check width & height.
                if (this.is_img) {
                    if (this._width == null) {
                        throw Error("A defined width is required for an \"Image\" element.");
                    }
                    if (this._height == null) {
                        throw Error("A defined height is required for an \"Image\" element.");
                    }
                }
                // Check wrap.
                if (this._width != null) {
                    width = this._width;
                }
                else if (this.is_text) {
                    let no_spaces = "", space_count = 0;
                    for (let i = 0; i < this._text.length; i++) {
                        const c = this._text.charAt(i);
                        if (c === " ") {
                            ++space_count;
                        }
                        else if (c === "\t") {
                            space_count += 8;
                        }
                        else {
                            no_spaces += c;
                        }
                    }
                    dimensions = doc.getTextDimensions(no_spaces);
                    width = dimensions.w + (doc.getStringUnitWidth(" ") * doc.getFontSize() * space_count); // does not account for line breaks.
                    // width = dimensions.w / doc.internal.scaleFactor
                }
                if (width > this._max_width) {
                    width = this._max_width;
                    if (this._width != null) {
                        this._width = width;
                    } // prevent inifnite loop.
                    if (this.is_text && !has_whitespace && width < this._parent._max_width) {
                        this._restore_styling(doc);
                        const computed = this._compute(doc, this._parent._wrap_x, this._parent._wrap_y, page, true);
                        computed.has_wrapped = true;
                        return computed;
                    }
                }
                if (this._font_weight === "bold") {
                    width *= 1.04;
                }
                // Get height (must be after width in case of adjustments).
                if (this._height != null) {
                    height = this._height;
                }
                else if (this.is_text) {
                    if (dimensions === undefined) {
                        dimensions = doc.getTextDimensions(this._text);
                    }
                    // let height_correction = false;
                    if (!has_whitespace && width < this._parent._max_width) {
                        height = 1 * (dimensions.h * doc.getLineHeightFactor());
                    }
                    else {
                        const lines = doc.splitTextToSize(this._text, width);
                        height = lines.length * (dimensions.h * doc.getLineHeightFactor());
                    }
                    height += dimensions.h * doc.getLineHeightFactor() * 0.15; // small height correction since the default jspdf padding top is small and padding bottom is none.
                    // do not assign to this._height since that causes problems with `copy()` while splitting long text into sub texts.
                }
                // Adjust coordinates.
                computed.inner_width = width;
                computed.inner_height = height;
            }
            // Check children, also when length is 0, in order to add the width and height etc.
            else {
                // Vars.
                let max_child_x = 0, max_child_y = 0;
                let x = computed.padding_start_x;
                let y = computed.padding_start_y;
                let child_page = page;
                let stretch_children = [], row_children = [];
                this._wrap_x = x;
                // Apply vertical alignment.
                const apply_vertical_alignment = (children) => {
                    // Vars.
                    const is_center = this._valign === "center";
                    const is_trailing = this._valign === "trailing";
                    if (!is_center && !is_trailing) {
                        return;
                    }
                    // Get highest child.
                    let max_height = 0;
                    children.iterate((child) => {
                        const height = child._computed.inner_height + child._computed._padding[0] + child._computed._padding[2];
                        if (!child._computed.is_absolute && height > max_height) {
                            max_height = height;
                        }
                    });
                    // Apply alignment.
                    children.iterate((child) => {
                        if (!child._computed.is_absolute) {
                            const height = child._computed.inner_height + child._computed._padding[0] + child._computed._padding[2];
                            if (is_center) {
                                child._computed.start_y += (max_height - height) / 2;
                            }
                            else if (is_trailing) {
                                child._computed.start_y += max_height - height;
                            }
                        }
                    });
                };
                // Iterate.
                this._children.iterate((child) => {
                    // Vars.
                    const is_stack = child.is_stack;
                    // Assign parent.
                    child._parent = this;
                    // Compute.
                    let response = child._compute(doc, x, y, child_page, refresh);
                    // New page.
                    if (response.end_page > computed.end_page) {
                        // Apply vertical alignment.
                        apply_vertical_alignment(row_children);
                        row_children = [];
                        // Reset stretch children.
                        stretch_children = [];
                        // Go to next page.
                        child_page = response.end_page;
                        computed.end_page = response.end_page;
                        if (this.is_hstack) {
                            x = response.resume_x;
                            y = doc._volt_margin_top;
                            // Wrap to new y.
                            if (response.has_wrapped || response.resume_x >= this._max_x) {
                                x = response.has_wrapped ? response.resume_x : this._wrap_x;
                                y = this._wrap_y === undefined ? response.resume_y : this._wrap_y;
                            }
                        }
                        else {
                            x = this._wrap_x;
                            y = response.resume_y;
                        }
                        max_child_x = x;
                        max_child_y = y;
                    }
                    // Increment X/Y.
                    else if (this.is_hstack) {
                        x = response.resume_x;
                        // Wrap to new y.
                        if (response.has_wrapped || response.resume_x >= this._max_x) {
                            x = response.has_wrapped ? response.resume_x : this._wrap_x;
                            y = this._wrap_y === undefined ? response.resume_y : this._wrap_y;
                        }
                    }
                    // Resume on y.
                    else {
                        y = response.resume_y;
                    }
                    // Cache max y.
                    // Must be after increment x/y for wrapping.
                    if (response.resume_y > max_child_y) {
                        max_child_y = response.resume_y;
                        this._wrap_y = max_child_y;
                    }
                    if (response.resume_x > max_child_x) {
                        max_child_x = response.resume_x;
                    }
                    // Append stretch child.
                    if (child._stretch) {
                        stretch_children.append(child);
                    }
                    // Append row children.
                    row_children.append(child);
                });
                // Apply vertical alignment.
                apply_vertical_alignment(row_children);
                // Stretch.
                if (stretch_children.length > 0) {
                    if (this.is_hstack) {
                        const step = (this._max_x - max_child_x) / stretch_children.length;
                        let incr_x = 0;
                        row_children.iterate((child) => {
                            child._computed.start_x += incr_x;
                            if (child._stretch) {
                                child._computed.inner_width += step;
                                incr_x += step;
                                console.log("Stretch:", child.type, child._text, step);
                            }
                        });
                    }
                    else {
                        // still to do.
                    }
                }
                // @todo is still incorrect when one of the children creates a new page.
                // Could fill "stretch" widths over here.
                // Set X/Y to max of children.
                if (this._width == null) {
                    computed.inner_width = Math.max(0, max_child_x - computed.padding_start_x);
                }
                else {
                    computed.inner_width = Math.max(this._width, max_child_x - computed.padding_start_x);
                }
                if (this._height == null) {
                    computed.inner_height = Math.max(0, max_child_y - computed.padding_start_y);
                }
                else {
                    computed.inner_height = Math.max(this._height, max_child_y - computed.padding_start_y);
                }
            }
            // --------------------------------------------------------------------------------
            // Post compute.
            // Decrement start x with width when an absolute right is used.
            if (is_absolute_right) {
                computed.start_x -= computed.inner_width;
            }
            // Decrement start y with height when an absolute bottom is used.
            if (is_absolute_bottom) {
                computed.start_y -= computed.inner_height;
            }
            // Set resume x/y.
            if (!computed.is_absolute) {
                computed.resume_x = computed.end_x;
                computed.resume_y = computed.end_y;
            }
            // Check new page required for non stacks.
            if (!is_absolute && computed.resume_y > doc._volt_page_height - doc._volt_margin_bottom &&
                (this.is_text || this.is_img) // not for stacks.
            ) {
                // For texts.
                if (this.is_text) {
                    // Split text into lines.
                    const line_height_factor = doc.getLineHeightFactor();
                    const dimensions = doc.getTextDimensions(this._text);
                    let lines = doc.splitTextToSize(this._text, computed.inner_width);
                    const get_break_index = (max_height) => {
                        let i, height;
                        for (i = 0; i < lines.length; i++) {
                            height = (i + 1) * (dimensions.h * line_height_factor); // here i+1 is required or it will calc wrong and cause inf loop.
                            height += dimensions.h * line_height_factor * 0.15;
                            if (height >= max_height) {
                                return i - 1;
                            }
                        }
                        return i;
                    };
                    // When the text can not be split since there is not any space to split even a single line, then wrap the entire text to the new page.
                    if (computed.padding_start_y + dimensions.h > doc._volt_page_height - doc._volt_margin_bottom) {
                        this._restore_styling(doc);
                        return this._compute(doc, this._parent._wrap_x, doc._volt_margin_top, page + 1, true);
                    }
                    // Restore styling for new computations.
                    this._restore_styling(doc);
                    // Split text into multiple texts.
                    let remaining_text = this._text;
                    const sub_texts = [];
                    let child_page = page;
                    for (let i = 0; i < 100000; i++) {
                        // Get break index.
                        const max_height = i === 0 ? (doc._volt_page_height - doc._volt_margin_bottom) - computed.padding_start_y : doc._volt_page_height - doc._volt_margin_bottom - doc._volt_margin_top;
                        const break_index = get_break_index(max_height);
                        const is_last = break_index == lines.length;
                        // Nothing fits.
                        if (break_index === 0) {
                            ++child_page;
                            continue;
                        }
                        // Create copy.
                        const copy = this.copy();
                        copy._parent = this._parent;
                        // Remove bottom padding and margin.
                        if (!is_last) {
                            copy._margin[3] = 0;
                            copy._padding[3] = 0;
                        }
                        // Remove top padding.
                        if (i > 0) {
                            copy._margin[0] = 0;
                            copy._padding[0] = 0;
                        }
                        // Slice text.
                        copy._text = lines.slice(0, break_index).join("\n");
                        lines = lines.slice(break_index);
                        // Add page.
                        if (i > 0) {
                            ++child_page;
                        }
                        // Recompute.
                        // process.exit(0)
                        copy._compute(doc, i === 0 ? computed.start_x : this._parent._wrap_x, i === 0 ? computed.start_y : doc._volt_margin_top, child_page, true);
                        // Append.
                        sub_texts.append(copy);
                        // Stop.
                        if (is_last) {
                            break;
                        }
                    }
                    // Insert.
                    this._parent.insert_before(this, sub_texts);
                    this._parent.remove_child(this);
                    return sub_texts.last()._computed;
                }
                // For images that do fit on a single page.
                else if (this.is_img && fits_on_one_page) {
                    this._restore_styling(doc);
                    return this._compute(doc, this._parent._wrap_x, doc._volt_margin_top, page + 1, true);
                }
            }
            // Check force same page for stacks.
            const is_stack = this.is_stack;
            if (!is_absolute &&
                is_stack &&
                this._force_same_page &&
                computed.start_page !== computed.end_page &&
                computed.end_y - computed.start_y <= doc._volt_page_height - doc._volt_margin_bottom - doc._volt_margin_top // must fit on one page.
            ) {
                this._restore_styling(doc);
                return this._compute(doc, this._parent._wrap_x, doc._volt_margin_top, page + 1, true);
            }
            // Restore func calls and font.
            this._restore_styling(doc);
            // Response.
            console.log(this.type, this._text, computed.start_y);
            this._computed = computed;
            return this._computed;
        }
        // Build element.
        _build(doc) {
            // Is PDF type.
            if (this.type === "PDF") {
                this._create_doc();
                doc = this._doc;
                this._compute(doc, 0, 0, 1, true);
            }
            // Compute.
            const computed = this._computed;
            // Add all pages.
            if (this.type === "PDF") {
                for (let i = 0; i < computed.end_page - 1; i++) { // the first page is already added.
                    doc.addPage();
                }
            }
            // Switch to page.
            doc.setPage(computed.start_page);
            // Set styling.
            this._set_styling(doc);
            // Add background.
            if (typeof this._background === "string" || typeof this._border_color === "string") {
                let x = computed.margin_start_x, rect_width = computed.margin_end_x - computed.margin_start_x;
                let y, rect_height;
                let color;
                for (let i = computed.start_page; i <= computed.end_page; i++) {
                    doc.setPage(i);
                    // Only one page.
                    if (computed.start_page === computed.end_page) {
                        y = computed.margin_start_y;
                        rect_height = computed.margin_end_y - computed.margin_start_y;
                    }
                    // On first page.
                    else if (i === computed.start_page) {
                        y = computed.margin_start_y;
                        rect_height = (doc._volt_page_height - doc._volt_margin_bottom) - computed.margin_start_y;
                    }
                    // On last page.
                    else if (i === computed.end_page) {
                        y = doc._volt_margin_top; // - this._padding[0];
                        rect_height = computed.margin_end_y - doc._volt_margin_bottom; // + this._padding[2];
                    }
                    // In between pages.
                    else {
                        y = doc._volt_margin_top; // - this._padding[0];
                        rect_height = doc._volt_page_height - doc._volt_margin_bottom - doc._volt_margin_top; // + this._padding[2];
                    }
                    // Check percentage border radius.
                    let border_radius = this._border_radius;
                    if (typeof border_radius === "string" && border_radius.last() === "%") {
                        border_radius = Math.min(rect_width, rect_height) * (parseInt(border_radius.slice(0, -1)) / 100);
                    }
                    // Background color.
                    if (typeof this._background === "string") {
                        color = PDF.hex_to_rgb(this._background);
                        let restore = false;
                        if (Array.isArray(color)) {
                            if (color.length === 4) {
                                restore = true;
                                doc.saveGraphicsState();
                                doc.setGState(new doc.GState({ opacity: color[3] }));
                                --color.length;
                            }
                            doc.setFillColor(...color);
                        }
                        else {
                            doc.setFillColor(color);
                        }
                        if (border_radius != null) {
                            doc.roundedRect(x, y, rect_width, rect_height, border_radius, border_radius, "F"); // fill.
                        }
                        else {
                            doc.rect(x, y, rect_width, rect_height, "F"); // fill.
                        }
                        if (restore) {
                            doc.restoreGraphicsState();
                        }
                    }
                    // Border color.
                    if (typeof this._border_color === "string") {
                        doc.setLineWidth(this._border_width === undefined ? 1 : this._border_width);
                        color = PDF.hex_to_rgb(this._border_color);
                        let restore = false;
                        if (Array.isArray(color)) {
                            if (color.length === 4) {
                                restore = true;
                                doc.saveGraphicsState();
                                doc.setGState(new doc.GState({ "stroke-opacity": color[3] }));
                                --color.length;
                            }
                            doc.setDrawColor(...color);
                        }
                        else {
                            doc.setDrawColor(color);
                        }
                        if (border_radius != null) {
                            doc.roundedRect(x, y, rect_width, rect_height, border_radius, border_radius, "S"); // stroke.
                        }
                        else {
                            doc.rect(x, y, rect_width, rect_height, "S"); // stroke.
                        }
                        if (restore) {
                            doc.restoreGraphicsState();
                        }
                    }
                }
                // Restore.
                this._restore_styling(doc);
                doc.setPage(computed.start_page);
                this._set_styling(doc);
            }
            // Id.
            if (this._id != null) {
                doc._volt_ids[this._id] = computed.start_page;
            }
            // Add image / text.
            if (this.is_text || this.is_img) {
                // Href.
                if (this._href != null) {
                    if (this._href.startsWith("http")) {
                        doc.link(x, y, width, height, this._href);
                    }
                    else {
                        doc._volt_hrefs.append({
                            page: computed.start_page,
                            href: this._href,
                            args: [x, y, width, height],
                        });
                    }
                }
                // Element.
                if (this.is_text) {
                    // this._options.maxWidth = computed.inner_width; // sometimes jspdf's width calculation is just a tiny bit off which causes the text to wrap, so this line must remain commented out.
                    const font_size = doc.getFontSize();
                    let x = computed.padding_start_x;
                    let y = computed.padding_start_y + font_size;
                    if (this._options.align === "right") {
                        x += computed.inner_width;
                    }
                    y -= font_size * 0.05; // since default top padding is too large.
                    doc.text(this._text, x, y, this._options); // account for baseline y behaviour.
                }
                else if (this.is_img) {
                    doc.addImage(libfs.readFileSync(this._img).toString('base64'), new vlib.Path(this._img).extension().slice(1).toUpperCase(), computed.padding_start_x, computed.padding_start_y, this._width, this._height);
                }
            }
            // With children.
            else if (this._children.length > 0) {
                // Add children.
                this._children.iterate((child) => {
                    child._build(doc);
                });
            }
            // Restore func calls and font.
            this._restore_styling(doc);
            // End.
            if (this.type === "PDF") {
            }
        }
        // ---------------------------------------------------------
        // Functions.
        // As string.
        toString(indent = 0) {
            let indent_str = "";
            for (let i = 0; i < indent; i++) {
                indent_str += " ";
            }
            if (this.children.length > 0) {
                let str = `${indent_str}${this.type}(\n`;
                str += this._children.iterate_append((c) => c.toString(indent + 4)).join(",\n");
                str += `\n${indent_str})`;
                return str;
            }
            else if (this.type === "Text") {
                return `${indent_str}${this.type}("${this._text}")`;
            }
            else if (this.type === "Image") {
                return `${indent_str}${this.type}("${this._img}")`;
            }
            else {
                return `${indent_str}${this.type}()`;
            }
        }
        // Get/set text.
        text(val) {
            if (val === undefined) {
                return this._text;
            }
            this._text = val;
            return this;
        }
        // Get/set children.
        get children() {
            return this._children;
        }
        set children(val) {
            this._children = val;
        }
        // Append.
        append(...children) {
            for (let i = 0; i < children.length; i++) {
                if (children[i] == null) {
                    continue;
                }
                else if (Array.isArray(children[i])) {
                    this.append(...children[i]);
                }
                else if (typeof children[i] === "string") {
                    this._children.append(PDF.Text(children[i]));
                }
                else if (typeof children[i] !== "object") {
                    this._children.append(PDF.Text(children[i].toString()));
                }
                else {
                    this._children.append(children[i]);
                }
            }
            return this;
        }
        // Insert before.
        insert_before(relative, child) {
            const children = [];
            this._children.iterate((x) => {
                if (x === relative) {
                    if (Array.isArray(child)) {
                        children.append(...child);
                    }
                    else {
                        children.append(child);
                    }
                }
                children.append(x);
            });
            this._children = children;
            return this;
        }
        // Insert after.
        insert_after(relative, child) {
            const children = [];
            this._children.iterate((x) => {
                children.append(x);
                if (x === relative) {
                    if (Array.isArray(child)) {
                        children.append(...child);
                    }
                    else {
                        children.append(child);
                    }
                }
            });
            this._children = children;
            return this;
        }
        // Remove child.
        remove_child(child) {
            this._children = this._children.drop(child);
            return this;
        }
        // Remove children.
        remove_children() {
            this._children = [];
            return this;
        }
        // id.
        id(val) {
            if (val === undefined) {
                return this._id;
            }
            this._id = val;
            return this;
        }
        // Href.
        href(val) {
            if (val === undefined) {
                return this._href;
            }
            this._href = val;
            return this;
        }
        // Force same page for HStacks.
        force_same_page(val) {
            if (val === undefined) {
                return this._force_same_page;
            }
            this._force_same_page = val;
            return this;
        }
        // Set start page.
        page(val) {
            if (val === undefined) {
                return this._page;
            }
            this._page = val;
            return this;
        }
        // Margin, 1, 2 or 4 args.
        margin(...values) {
            if (values.length === 0) {
                return this._margin;
            }
            else {
                if (values.length === 1) {
                    this._margin = [values[0], values[0], values[0], values[0]];
                }
                else if (values.length === 2) {
                    this._margin = [values[0], values[1], values[0], values[1]];
                }
                else if (values.length === 4) {
                    this._margin = [values[0], values[1], values[2], values[3]];
                }
                else {
                    console.error("Invalid number of arguments for function \"margin()\".");
                }
            }
            return this;
        }
        margin_top(val) {
            if (val === undefined) {
                return this._margin[0];
            }
            this._margin[0] = val;
            return this;
        }
        margin_right(val) {
            if (val === undefined) {
                return this._margin[1];
            }
            this._margin[1] = val;
            return this;
        }
        margin_bottom(val) {
            if (val === undefined) {
                return this._margin[2];
            }
            this._margin[2] = val;
            return this;
        }
        margin_left(val) {
            if (val === undefined) {
                return this._margin[3];
            }
            this._margin[3] = val;
            return this;
        }
        // Padding, 1, 2 or 4 args.
        padding(...values) {
            if (values.length === 0) {
                return this._padding;
            }
            else {
                if (values.length === 1) {
                    this._padding = [values[0], values[0], values[0], values[0]];
                }
                else if (values.length === 2) {
                    this._padding = [values[0], values[1], values[0], values[1]];
                }
                else if (values.length === 4) {
                    this._padding = [values[0], values[1], values[2], values[3]];
                }
                else {
                    console.error("Invalid number of arguments for function \"padding()\".");
                }
            }
            return this;
        }
        padding_top(val) {
            if (val === undefined) {
                return this._padding[0];
            }
            this._padding[0] = val;
            return this;
        }
        padding_right(val) {
            if (val === undefined) {
                return this._padding[1];
            }
            this._padding[1] = val;
            return this;
        }
        padding_bottom(val) {
            if (val === undefined) {
                return this._padding[2];
            }
            this._padding[2] = val;
            return this;
        }
        padding_left(val) {
            if (val === undefined) {
                return this._padding[3];
            }
            this._padding[3] = val;
            return this;
        }
        // Position, 1 or 4 args.
        position(...values) {
            if (values.length === 0) {
                return this._position;
            }
            else if (values.length === 1) {
                this._position = [values[0], values[0], values[0], values[0]];
            }
            else if (values.length === 4) {
                if (values[0] != null) {
                    this._position[0] = values[0];
                }
                if (values[1] != null) {
                    this._position[1] = values[1];
                }
                if (values[2] != null) {
                    this._position[2] = values[2];
                }
                if (values[3] != null) {
                    this._position[3] = values[3];
                }
            }
            else {
                console.error("Invalid number of arguments for function \"position()\".");
            }
            return this;
        }
        top(val) {
            if (val === undefined) {
                return this._position[0];
            }
            this._position[0] = val;
            return this;
        }
        right(val) {
            if (val === undefined) {
                return this._position[1];
            }
            this._position[1] = val;
            return this;
        }
        bottom(val) {
            if (val === undefined) {
                return this._position[2];
            }
            this._position[2] = val;
            return this;
        }
        left(val) {
            if (val === undefined) {
                return this._position[3];
            }
            this._position[3] = val;
            return this;
        }
        // Align.
        align(val) {
            if (val === undefined) {
                return this._options.align;
            }
            this._options.align = val;
            return this;
        }
        leading() {
            return this.align("left");
        }
        center() {
            return this.align("center");
        }
        trailing() {
            return this.align("right");
        }
        justify() {
            return this.align("justify");
        }
        // Width.
        width(val) {
            if (val == undefined) {
                return this._width;
            }
            this._width = val;
            return this;
        }
        // Height.
        height(val) {
            if (val == undefined) {
                return this._height;
            }
            if (typeof val === "string" && val.last() === "%") {
                throw Error("Function \"height()\" does not accept relative percentages.");
            }
            this._height = val;
            return this;
        }
        // Stretch.
        stretch(val) {
            if (val == undefined) {
                return this._stretch;
            }
            this._stretch = val;
            return this;
        }
        // Font family.
        font_family(val) {
            if (val === undefined) {
                return this._font;
            }
            this._font = val;
            return this;
        }
        // Font size.
        font_size(val) {
            if (val === undefined) {
                return this._calls.setFontSize;
            }
            this._calls.setFontSize = val;
            return this;
        }
        // Font weight, the suffix for the font so: Helvetica-"Bold", can be lowercase.
        // Suffix might depend per font.
        font_weight(val) {
            if (val === undefined) {
                return this._font_weight;
            }
            this._font_weight = val;
            return this;
        }
        // Color.
        color(val) {
            if (val === undefined) {
                return this._calls.setTextColor;
            }
            this._calls.setTextColor = val;
            return this;
        }
        // Background.
        background(val) {
            if (val === undefined) {
                return this._background;
            }
            this._background = val;
            return this;
        }
        // Border radius.
        border_radius(val) {
            if (val === undefined) {
                return this._border_radius;
            }
            this._border_radius = val;
            return this;
        }
        // Border color.
        border_color(val) {
            if (val === undefined) {
                return this._border_color;
            }
            this._border_color = val;
            return this;
        }
        // Border width.
        border_width(val) {
            if (val === undefined) {
                return this._border_width;
            }
            this._border_width = val;
            return this;
        }
        // Align (for images mainly).
        align_vertical(val) {
            if (val === undefined) {
                return this._valign;
            }
            this._valign = val;
            return this;
        }
        leading_vertical() {
            return this.align_vertical("leading");
        }
        center_vertical() {
            return this.align_vertical("center");
        }
        trailing_vertical() {
            return this.align_vertical("trailing");
        }
    }
    return E;
}
// ---------------------------------------------------------
// PDF element.
class PDFElement extends CreateVElementClass({
    type: "PDF",
    is_stack: true,
}) {
    // Constructor.
    constructor(...children) {
        // Initialize base class.
        super(...children);
        // Attributes.
        this._margin = [50, 50, 50, 50];
        this._is_built = false;
        this._fonts = [];
        this.add_font("Menlo", "normal", `${import.meta.dirname}/fonts/Menlo-Regular.ttf`);
        this.add_font("Menlo", "bold", `${import.meta.dirname}/fonts/Menlo-Bold.ttf`);
    }
    // Create a document.
    _create_doc() {
        this._doc = new jsPDF("p", "pt", "a4"); // PDF.use_pixels ? "px" : "pt"
        this._doc._volt_margin_top = this._margin[0];
        this._doc._volt_margin_right = this._margin[1];
        this._doc._volt_margin_bottom = this._margin[2];
        this._doc._volt_margin_left = this._margin[3];
        this._doc._volt_page_width = this._doc.getPageWidth();
        this._doc._volt_page_height = this._doc.getPageHeight();
        this._doc._volt_ids = {}; // {$id: $page_nr}.
        this._doc._volt_hrefs = [];
        this._fonts.iterate((item) => {
            this._doc.addFileToVFS(item.file_name, item.base64);
            this._doc.addFont(item.file_name, item.name, item.style);
        });
        return this._doc;
    }
    // Build.
    build() {
        this._build(); // refresh in case any edits were made after `iterate_pages` or `switch_page`.
        this._is_built = true;
        return this;
    }
    // Get max page.
    max_page() {
        if (this._computed === undefined) {
            this._compute();
        }
        return this._computed.end_page;
    }
    // Iterate pages.
    iterate_pages(callback) {
        this._compute(undefined, undefined, undefined, undefined, true);
        for (let i = 1; i <= this._computed.end_page; i++) {
            callback(i);
        }
        return this;
    }
    // Number pages.
    number_pages({ align = "right", // left, center, right
    margin = 12.5, font_size = 6, color = "black", }) {
        this.iterate_pages((page) => {
            const text = PDF.Text(`Page ${page}`)
                .color(color)
                .font_size(font_size)
                .position(null, align === "right" ? margin : null, margin, align === "left" ? margin : null)
                .page(page);
            // if (align === "center") {
            //     text.width("100%").center()
            // }
            this.append(text);
        });
        return this;
    }
    // Add font.
    add_font(name = "Menlo", style = "normal", path = "Menlo-Regular.ttf") {
        this._fonts.append({
            name,
            style,
            file_name: new vlib.Path(path).name(),
            base64: Buffer.from(libfs.readFileSync(path)).toString("base64"),
        });
        return this;
    }
    // Save.
    save(path) {
        if (!this._is_built) {
            this.build();
        }
        libfs.writeFileSync(path, this._doc.output(), "binary");
    }
    // Get as bytes.
    async bytes() {
        if (!this._is_built) {
            this.build();
        }
        const stream = this._doc.pipe(blobstream());
        return new Promise((resolve, reject) => {
            stream.on('finish', () => {
                const bytes = stream.toBuffer();
                resolve(bytes);
            });
            stream.on('error', (error) => {
                reject(error);
            });
        });
    }
    // Get as blob stream.
    stream() {
        if (!this._is_built) {
            this.build();
        }
        return this._doc.pipe(blobstream());
    }
}
;
PDF.PDFElement = PDFElement;
PDF.PDF = function PDF(...args) { return new PDFElement(...args); };
// ---------------------------------------------------------
// Page element.
PDF.PageElement = class PageElement extends CreateVElementClass({
    type: "Page",
    is_stack: true,
}) {
    // Constructor.
    constructor(...children) {
        // Initialize base class.
        super(...children);
    }
};
PDF.Page = function Page(...args) { return new PDF.PageElement(...args); };
// ---------------------------------------------------------
// VStack element.
PDF.VStackElement = class VStackElement extends CreateVElementClass({
    type: "VStack",
    is_stack: true,
}) {
    // Constructor.
    constructor(...children) {
        // Initialize base class.
        super(...children);
    }
};
PDF.VStack = function VStack(...args) { return new PDF.VStackElement(...args); };
// ---------------------------------------------------------
// HStack element.
PDF.HStackElement = class HStackElement extends CreateVElementClass({
    type: "HStack",
    is_stack: true,
    is_hstack: true,
}) {
    // Constructor.
    constructor(...children) {
        // Initialize base class.
        super(...children);
    }
};
PDF.HStack = function HStack(...args) { return new PDF.HStackElement(...args); };
// ---------------------------------------------------------
// Text element.
PDF.TextElement = class TextElement extends CreateVElementClass({
    type: "Text",
    is_text: true,
}) {
    // Constructor.
    constructor(text = "") {
        // Initialize base class.
        super();
        // Set text.
        this._text = text;
    }
};
PDF.Text = function Text(...args) { return new PDF.TextElement(...args); };
// ---------------------------------------------------------
// Image element.
PDF.ImageElement = class ImageElement extends CreateVElementClass({
    type: "Image",
    is_img: true,
}) {
    // Constructor.
    constructor(img) {
        // Initialize base class.
        super();
        // Set text.
        this._img = img;
    }
};
PDF.Image = function Image(...args) { return new PDF.ImageElement(...args); };
// ---------------------------------------------------------
// Code block.
PDF.CodeBlockElement = class CodeBlockElement extends CreateVElementClass({
    type: "CodeBlock",
    is_stack: true,
}) {
    static menlo_initialized = false;
    // Constructor.
    constructor(language, code) {
        // Initialize base class.
        super();
        this._language = language;
        this._code = code;
        this._initialized = false;
        this._calls.setFontSize = 6;
        this._padding = [12.5, 5, 12.5, 5];
        this._background = "#00000005";
        this._border_radius = 5;
        this._border_color = "#00000020";
        this._border_width = 0.5;
        this._font = "Menlo";
    }
    copy() {
        const copy = super.copy();
        copy._language = this.language;
        copy._code = this.code;
        copy._initialized = this._initialized;
        return copy;
    }
    // Initialize.
    _initialize() {
        // Already initialized.
        if (this._initialized) {
            return this;
        }
        // Tokenize.
        const tokenizer = vhighlight.init_tokenizer(this._language);
        if (tokenizer == null) {
            throw Error(`Language "${language}" is not a supported code language for "PDF.CodeBlock".`);
        }
        tokenizer.code = this._code;
        const tokens = tokenizer.tokenize();
        // Create children.
        this._children = [];
        this._children.append(CodeBlockElement.build_tokens(tokens));
        // Initialized.
        this._initialized = true;
        return this;
    }
    // Build tokens.
    static build_tokens(tokens) {
        // Create token classes.
        const token_classes = {
            comment: (text) => {
                return PDF.Text(text)
                    .color("#818C97");
            },
            comment_keyword: (text) => {
                return PDF.Text(text)
                    .color("#818C97")
                    .font_weight("bold");
            },
            comment_codeblock: (text) => {
                return PDF.Text(text)
                    .color("#818C97")
                    .font_weight("italic")
                    .background("#FFFFFF10")
                    .border_radius(5);
            },
            url: (text) => {
                return PDF.Text(text)
                    .color("#818C97");
            },
            string: (text) => {
                return PDF.Text(text)
                    .color("#D6C986");
            },
            numeric: (text) => {
                return PDF.Text(text)
                    .color("#D6C986");
            },
            keyword: (text) => {
                return PDF.Text(text)
                    .color("#EE8378")
                    .font_weight("bold");
            },
            operator: (text) => {
                return PDF.Text(text)
                    .color("#EE8378")
                    .font_weight("bold");
            },
            preprocessor: (text) => {
                return PDF.Text(text)
                    .color("#EE8378");
            },
            type_def: (text) => {
                return PDF.Text(text)
                    .color("#C78BF0");
            },
            type: (text) => {
                return PDF.Text(text)
                    .color("#5795F3");
            },
            parameter: (text) => {
                return PDF.Text(text)
                    .color("#F9AE58");
            },
        };
        // Build.
        if (tokens.length === 0) {
            return null;
        }
        if (Array.isArray(tokens[0])) {
            tokens.iterate((line_tokens) => {
                const hstack = PDF.HStack();
                line_tokens.iterate((token) => {
                    if (token.is_line_break) {
                        return null;
                    }
                    const token_class = token_classes[token.token];
                    if (token_class == null) {
                        hstack.append(PDF.Text(token.data));
                    }
                    else {
                        hstack.append(token_class(token.data));
                    }
                });
                children.append(hstack);
            });
            return children;
        }
        else {
            const hstack = PDF.HStack();
            tokens.iterate((token) => {
                if (token.is_line_break) {
                    return null;
                }
                const token_class = token_classes[token.token];
                if (token_class == null) {
                    hstack.append(PDF.Text(token.data));
                }
                else {
                    hstack.append(token_class(token.data));
                }
            });
            return hstack;
        }
    }
};
PDF.CodeBlock = function CodeBlock(...args) { return new PDF.CodeBlockElement(...args); };
// ---------------------------------------------------------
// Export.
module.exports = PDF;
export {};
