"use strict";
/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// ---------------------------------------------------------
// Imports.
const PDFDocument = require("pdfkit");
const libfs = require("fs");
const blobstream = require('blob-stream');
// ---------------------------------------------------------
// The mail object.
const PDF = {
    // Use pixels instead of pdfkit points.
    use_pixels: true,
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
        console.log(hex, "=>", `rgb(${r}, ${g}, ${b})`);
        // Return the rgb(a) color.
        if (alpha != 1) {
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return `rgb(${r}, ${g}, ${b})`;
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
        console.log(hex, "=>", r, g, b);
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
        console.log(hex, "=>", [computedC, computedM, computedY, computedK]);
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
function CreateVElementClass({ type, is_text = false, is_img = false, }) {
    class E {
        // ---------------------------------------------------------
        // Attributes.
        static is_text = is_text;
        static is_img = is_img;
        // ---------------------------------------------------------
        // Constructor.
        constructor(...children) {
            // Attributes.
            this.type = type;
            this._parent = null; // will be assigned by `_build().`
            this._children = [];
            this._text = null;
            this._img = null;
            this._style = {}; // for element options. 
            this._calls = {}; // for doc calls.
            this._id = null;
            this._margin = [0, 0, 0, 0];
            this._padding = [0, 0, 0, 0];
            this._position = [null, null, null, null]; // absolute positioning.
            this._background = null;
            this._border_radius = null;
            this._border_color = null;
            this._border_width = 1;
            this._font_weight = null;
            // this._wrap = true;
            this._href = null;
            this._force_same_page = false;
            this._page = undefined;
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
            copy._style = this._style;
            copy._calls = this._calls;
            copy._id = this._id;
            copy._margin = this._margin;
            copy._padding = this._padding;
            copy._position = this._position;
            copy._background = this._background;
            copy._border_radius = this._border_radius;
            copy._border_color = this._border_color;
            copy._border_width = this._border_width;
            copy._font_weight = this._font_weight;
            // copy._wrap = this._wrap;
            copy._href = this._href;
            copy._force_same_page = this._force_same_page;
            return copy;
        }
        // ---------------------------------------------------------
        // System.
        /*
        // Get width.
        _get_width(doc) {
            let width = 0;
            if (this._style.width != null) {
                width = this._style.width;
            }
            else if (E.is_text) {
                width = doc.widthOfString(this._text, this._style);
            }
            return width;
        }

        // Get full height.
        _get_height(doc) {
            let height = 0;
            if (this._style.height != null) {
                height = this._style.height;
            }
            else if (E.is_text) {
                height = doc.heightOfString(this._text, this._style);
            }
            return height;
        }
        */
        // Convert pixels to points.
        _px(px) {
            if (typeof px !== "number") {
                return px;
            }
            return (px / 96) * 72;
        }
        _compute(doc, x, y, page, refresh = false) {
            // Cached.
            if (refresh === false && this._computed !== undefined) {
                return this._computed;
            }
            // Is PDF type.
            if (this.type === "PDF" && doc == null) {
                this._create_doc();
                doc = this._doc;
                x = doc.page.margins.left;
                y = doc.page.margins.top;
                page = 0;
                refresh = true;
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
                computed.start_x = doc.page.margins.left;
                computed.start_y = doc.page.margins.top;
                ++computed.start_page;
                ++computed.end_page;
            }
            // Absolute positioning, ignore document margins!
            let is_absolute_right = false;
            let is_absolute_bottom = false;
            if (computed.is_absolute) {
                if (this._position[1] != null && this._position[3] != null) {
                    computed.start_x = this._position[3];
                    this._style.width = doc.page.width - this._position[1] - this._position[3];
                }
                else if (this._position[1] != null) {
                    computed.start_x = doc.page.width - this._position[1] - this._margin[1] - this._margin[3] - this._padding[1] - this._padding[3];
                    is_absolute_right = true;
                }
                else if (this._position[3] != null) {
                    computed.start_x = this._position[3];
                }
                if (this._position[0] != null && this._position[2] != null) {
                    computed.start_y = this._position[0];
                    this._style.height = doc.page.height - this._position[0] - this._position[2];
                }
                else if (this._position[0] != null) {
                    computed.start_y = this._position[0];
                }
                else if (this._position[2] != null) {
                    computed.start_y = doc.page.height - this._position[2] - this._margin[0] - this._margin[2] - this._padding[0] - this._padding[2];
                    is_absolute_bottom = true;
                }
            }
            // Set relative width.
            if (typeof this._style.width === "string" && this._style.width.last() === "%") {
                if (this._parent != null && this._parent._max_width != null) {
                    this._style.width = Math.max(0, this._parent._max_width * (parseInt(this._style.width.slice(0, -1)) / 100)
                        - (this._margin[1] + this._margin[3] + this._padding[1] + this._padding[3]));
                }
                else {
                    delete this._style.width;
                }
            }
            // Calculate the max X (after padding and margin are added to x) (after calc relative width).
            if (this._parent == null || this._parent._max_x != null) {
                this._max_x = doc.page.width - doc.page.margins.right;
            }
            else {
                this._max_x = this._parent._max_x;
            }
            if (this._style.width != null) {
                this._max_x = Math.min(x + this._style.width, this._max_x);
            }
            this._max_x -= (this._margin[1] - this._padding[1]);
            // Calculate the max width (after padding and margin are added to x) (after calc relative width).
            this._max_width = this._max_x - x;
            // --------------------------------------------------------------------------------
            // Doc styling.
            // Set doc styling.
            let restore_font, original_font = doc._font.name;
            doc.save();
            const set_styling = () => {
                // Execute document calls.
                console.log(this.type, "=>", "Set styling");
                Object.keys(this._calls).iterate((func) => {
                    console.log(func, this._calls[func]);
                    if (Array.isArray(this._calls[func])) {
                        doc[func](...this._calls[func]);
                    }
                    else {
                        doc[func](this._calls[func]);
                    }
                });
                // Font weight.
                if (this._font_weight != null && !doc._font.name.endsWith(this._font_weight)) {
                    restore_font = original_font;
                    doc.font(`${original_font}-${this._font_weight}`);
                }
            };
            const restore_styling = () => {
                doc.restore();
                if (restore_font !== undefined) {
                    doc.font(restore_font);
                }
            };
            set_styling();
            // --------------------------------------------------------------------------------
            // Calculate inner width and height.
            // Add image / text.
            if (E.is_text || E.is_img) {
                // Check width & height.
                if (E.is_img) {
                    if (this._style.width == null) {
                        throw Error("A defined width is required for an \"Image\" element.");
                    }
                    if (this._style.height == null) {
                        throw Error("A defined height is required for an \"Image\" element.");
                    }
                }
                // Set line gap to zero by default to ensure accurate height calcuations.
                if (E.is_text && this._style.lineGap === undefined) {
                    this._style.lineGap = 0;
                }
                // Check wrap.
                let width = 0;
                if (this._style.width != null) {
                    width = this._style.width;
                }
                else if (E.is_text) {
                    width = doc.widthOfString(this._text, this._style); // does not account for line breaks.
                }
                if (width > this._max_width) {
                    width = this._max_width;
                }
                this._style.width = width;
                // Get height (must be after width in case of adjustments).
                let height = 0;
                if (this._style.height != null) {
                    height = this._style.height;
                }
                else if (E.is_text) {
                    height = doc.heightOfString(this._text, this._style);
                    this._style.height = height; // required for absolute positioned page numbers in the bottom left corner.
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
                this._wrap_x = x;
                // Iterate.
                this._children.iterate((child) => {
                    // Vars.
                    const is_stack = child.type === "VStack" || child.type === "HStack";
                    // Assign parent.
                    child._parent = this;
                    // Compute.
                    let response = child._compute(doc, x, y, child_page, refresh);
                    // New page.
                    if (response.end_page > computed.end_page) {
                        // Go to next page.
                        child_page = response.end_page;
                        computed.end_page = response.end_page;
                        if (this.type === "HStack") {
                            x = response.resume_x;
                            y = doc.page.margins.top;
                            // Wrap to new y.
                            if (response.resume_x >= this._max_x) {
                                x = this._wrap_x;
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
                    else if (this.type === "HStack") {
                        x = response.resume_x;
                        // Wrap to new y.
                        if (response.resume_x >= this._max_x) {
                            x = this._wrap_x;
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
                });
                // @todo is still incorrect when one of the children creates a new page.
                // Could fill "stretch" widths over here.
                // Set X/Y to max of children.
                if (this._style.width == null) {
                    computed.inner_width = max_child_x - computed.padding_start_x;
                }
                else {
                    computed.inner_width = Math.max(this._style.width, max_child_x - computed.padding_start_x);
                }
                if (this._style.height == null) {
                    computed.inner_height = max_child_y - computed.padding_start_y;
                }
                else {
                    computed.inner_height = Math.max(this._style.height, max_child_y - computed.padding_start_y);
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
            if (!is_absolute && computed.resume_y > doc.page.height - doc.page.margins.bottom &&
                (E.is_text || E.is_img) // not for stacks.
            ) {
                // For texts.
                if (E.is_text) {
                    // When the text can not be split since there is not any space to split even a single line, then wrap the entire text to the new page.
                    if (computed.padding_start_y + doc.heightOfString("A", this._style) > doc.page.height - doc.page.margins.bottom) {
                        restore_styling();
                        return this._compute(doc, this._parent._wrap_x, doc.page.margins.top, page + 1, true);
                    }
                    // Find where the text should break vertically.
                    let get_v_break, get_height_style = this._style;
                    delete get_height_style.height;
                    if (this._text.indexOf(" ") === -1) {
                        get_v_break = (text, max_height) => {
                            let i, str = "";
                            for (i = 0; i < text.length; i++) {
                                const sub_height = doc.heightOfString(str + text.charAt(i), get_height_style);
                                if (sub_height >= max_height) {
                                    return i;
                                }
                                str += text.charAt(i);
                            }
                            return i;
                        };
                    }
                    else {
                        get_v_break = (text, max_height) => {
                            let i, last_break = 0, str = "", sub_str = "";
                            for (i = 0; i < text.length; i++) {
                                const c = text.charAt(i);
                                str += text.charAt(i);
                                if (c === " " || c === ".") {
                                    const sub_height = doc.heightOfString(str, get_height_style);
                                    if (sub_height >= max_height) {
                                        return last_break + 1;
                                    }
                                    last_break = i;
                                }
                            }
                            return i;
                        };
                    }
                    // console.log('ENTER SPLIT LOOP !!!!!!!!!!!!!!!!!!!!!!', computed.resume_y - (doc.page.height - doc.page.margins.bottom))
                    // console.log(computed.toString())
                    // console.log("SPLIT ENTER HEIGHT:", computed.inner_height)
                    // Restore styling for new computations.
                    restore_styling();
                    // Split text into multiple texts.
                    let remaining_text = this._text;
                    const sub_texts = [];
                    let child_page = page;
                    for (let i = 0; i < 100000; i++) {
                        // console.log("Split", i, remaining_text.substr(0, 25));
                        // Get break index.
                        const max_height = i === 0 ? (doc.page.height - doc.page.margins.bottom) - computed.padding_start_y : doc.page.height - doc.page.margins.bottom - doc.page.margins.top;
                        const break_index = get_v_break(remaining_text, max_height);
                        const is_last = break_index == remaining_text.length;
                        // console.log("MAX HEIGHT:",max_height, remaining_text.substr(0, break_index), doc.heightOfString(remaining_text.substr(0, break_index), this.style))
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
                        copy._text = remaining_text.substr(0, break_index);
                        remaining_text = remaining_text.substr(break_index);
                        // Add page.
                        if (i > 0) {
                            ++child_page;
                        }
                        // Recompute.
                        copy._compute(doc, i === 0 ? computed.start_x : this._parent._wrap_x, i === 0 ? computed.start_y : doc.page.margins.top, child_page, true);
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
                else if (E.is_img && fits_on_one_page) {
                    restore_styling();
                    return this._compute(doc, this._parent._wrap_x, doc.page.margins.top, page + 1, true);
                }
            }
            // Check force same page for stacks.
            const is_stack = !E.is_text && !E.is_img;
            if (!is_absolute &&
                is_stack &&
                this._force_same_page &&
                computed.start_page !== computed.end_page &&
                computed.end_y - computed.start_y <= doc.page.height - doc.page.margins.bottom - doc.page.margins.top // must fit on one page.
            ) {
                restore_styling();
                return this._compute(doc, this._parent._wrap_x, doc.page.margins.top, page + 1, true);
            }
            // Restore func calls and font.
            restore_styling();
            // Response.
            // console.log(this.type, computed.start_page+":"+computed.start_x+","+computed.start_y, "=>", computed.end_page+":"+computed.resume_x+","+computed.resume_y)
            // console.log(this.type, computed.start_page+":"+computed.start_x+","+computed.start_y, "=>", computed.end_page+":"+computed.end_x+","+computed.end_y)
            // console.log(this.toString(), computed.toString())
            this._computed = computed;
            return this._computed;
        }
        _build(doc) {
            // Is PDF type.
            if (this.type === "PDF") {
                this._create_doc();
                doc = this._doc;
                this._compute(doc, doc.page.margins.left, doc.page.margins.top, 0, true);
            }
            // Compute.
            const computed = this._computed;
            // Add all pages.
            if (this.type === "PDF") {
                for (let i = 0; i < computed.end_page; i++) { // the first page is already added.
                    doc.addPage();
                }
            }
            // Switch to page.
            doc.switchToPage(computed.start_page);
            // Set doc styling.
            let restore_font, original_font = doc._font.name;
            doc.save();
            const set_styling = () => {
                // Execute document calls.
                Object.keys(this._calls).iterate((func) => {
                    if (Array.isArray(this._calls[func])) {
                        doc[func](...this._calls[func]);
                    }
                    else {
                        doc[func](this._calls[func]);
                    }
                });
                // Font weight.
                if (this._font_weight != null && !doc._font.name.endsWith(this._font_weight)) {
                    restore_font = original_font;
                    doc.font(`${original_font}-${this._font_weight}`);
                }
            };
            const restore_styling = () => {
                doc.restore();
                if (restore_font !== undefined) {
                    doc.font(restore_font);
                }
            };
            set_styling();
            // Add background.
            // @todo, when an element expands across pages it will cause UB.
            if (typeof this._background === "string" || typeof this._border_color === "string") {
                // Vars.
                let x = computed.margin_start_x;
                let y = computed.margin_start_y;
                let rect_width = computed.margin_end_x - computed.margin_start_x;
                let rect_height = computed.margin_end_y - computed.margin_start_y;
                // Check percentage border radius.
                let border_radius = this._border_radius;
                if (typeof border_radius === "string" && border_radius.last() === "%") {
                    border_radius = Math.min(rect_width, rect_height) * (parseInt(border_radius.slice(0, -1)) / 100);
                }
                // Rounded rect.
                if (border_radius != null) {
                    doc.roundedRect(x, y, rect_width, rect_height, border_radius);
                }
                // Normal rect.
                else {
                    doc.rect(x, y, rect_width, rect_height);
                }
                // Fill and stroke.
                if (typeof this._background === "string" && typeof this._border_color === "string") {
                    doc.lineWidth(this._border_width);
                    const bg_opacity = PDF.hex_opacity(this._background);
                    let bg_color = this._background;
                    if (bg_opacity !== null) {
                        bg_color = this._background.slice(0, -2);
                        doc.fillColor(bg_color, bg_opacity); // this needs to be set before fillAndStroke otherwise opacity wont work.
                    }
                    const border_opacity = PDF.hex_opacity(this._border_color);
                    let border_color = this._border_color;
                    if (border_opacity !== null) {
                        border_color = this._border_color.slice(0, -2);
                        doc.strokeColor(border_color, border_opacity); // this needs to be set before fillAndStroke otherwise opacity wont work.
                    }
                    doc.fillAndStroke(bg_color, border_color);
                }
                else if (typeof this._background === "string") {
                    const opacity = PDF.hex_opacity(this._background);
                    let color = this._background;
                    if (opacity !== null) {
                        color = this._background.slice(0, -2);
                        doc.fillColor(color, opacity);
                    }
                    doc.fill(color);
                }
                else if (typeof this._border_color === "string") {
                    const opacity = PDF.hex_opacity(this._border_color);
                    let color = this._border_color;
                    if (opacity !== null) {
                        color = this._border_color.slice(0, -2);
                        doc.strokeColor(color, opacity); // this needs to be set before fillAndStroke otherwise opacity wont work.
                    }
                    doc.lineWidth(this._border_width);
                    doc.stroke(color);
                }
                /*
                // Create bg.
                let x = computed.margin_start_x, rect_width = computed.margin_end_x - computed.margin_start_x;
                let y, rect_height;
                for (let i = computed.start_page; i <= computed.end_page; i++) {

                    // Only one page.
                    if (computed.start_page === computed.end_page) {
                        y = computed.margin_start_y;
                        rect_height = computed.margin_end_y - computed.margin_start_y;
                    }

                    // On first page.
                    else if (i === computed.start_page) {
                        y = computed.margin_start_y;
                        rect_height = doc.page.height - computed.margin_start_y;
                    }

                    // On last page.
                    else if (i === computed.end_page) {
                        y = 0;
                        rect_height = computed.margin_end_y;
                    }

                    // In between pages.
                    else {
                        y = 0;
                        rect_height = doc.page.height;
                    }

                    // Check percentage border radius.
                    let border_radius = this._border_radius;
                    if (typeof border_radius === "string" && border_radius.last() === "%") {
                        border_radius = Math.min(rect_width, rect_height) * (parseInt(border_radius.slice(0, -1)) / 100);
                    }

                    // Rounded rect.
                    if (border_radius != null) {
                        doc.roundedRect(x, y, rect_width, rect_height, border_radius);
                    }

                    // Normal rect.
                    else {
                        doc.rect(x, y, rect_width, rect_height);
                    }

                    // Fill and stroke.
                    if (typeof this._background === "string" && typeof this._border_color === "string") {
                        doc.lineWidth(this._border_width);
                        const bg_opacity = PDF.hex_opacity(this._background);
                        let bg_color = this._background;
                        if (bg_opacity !== null) {
                            bg_color = this._background.slice(0, -2);
                            doc.fillColor(bg_color, bg_opacity); // this needs to be set before fillAndStroke otherwise opacity wont work.
                        }
                        const border_opacity = PDF.hex_opacity(this._border_color);
                        let border_color = this._border_color;
                        if (border_opacity !== null) {
                            border_color = this._border_color.slice(0, -2);
                            doc.strokeColor(border_color, border_opacity); // this needs to be set before fillAndStroke otherwise opacity wont work.
                        }
                        doc.fillAndStroke(bg_color, border_color);
                    }
                    else if (typeof this._background === "string") {
                        const opacity = PDF.hex_opacity(this._background);
                        let color = this._background;
                        if (opacity !== null) {
                            color = this._background.slice(0, -2);
                            doc.fillColor(color, opacity);
                        }
                        doc.fill(color);
                    }
                    else if (typeof this._border_color === "string") {
                        const opacity = PDF.hex_opacity(this._border_color);
                        let color = this._border_color;
                        if (opacity !== null) {
                            color = this._border_color.slice(0, -2)
                            doc.strokeColor(color, opacity); // this needs to be set before fillAndStroke otherwise opacity wont work.
                        }
                        doc.lineWidth(this._border_width);
                        doc.stroke(color);
                    }

                }
                */
                // Restore.
                restore_styling();
                set_styling();
            }
            // Id.
            if (this._id != null) {
                doc._vweb_ids[this._id] = computed.start_page;
            }
            // Add image / text.
            if (E.is_text || E.is_img) {
                // Href.
                if (this._href != null) {
                    if (this._href.startsWith("http")) {
                        doc.link(x, y, width, height, this._href);
                    }
                    else {
                        doc._vweb_hrefs.append({
                            page: computed.start_page,
                            href: this._href,
                            args: [x, y, width, height],
                        });
                    }
                }
                // Element.
                if (E.is_text) {
                    doc.text(this._text, computed.padding_start_x, computed.padding_start_y, this._style);
                }
                else if (E.is_img) {
                    doc.image(this._img, computed.padding_start_x, computed.padding_start_y, this._style);
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
            restore_styling();
            // End.
            if (this.type === "PDF") {
                this._doc.end();
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
                this._children.append(children[i]);
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
        // Width.
        width(val) {
            if (val == undefined) {
                return this._style.width;
            }
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._style.width = val;
            return this;
        }
        // Height.
        height(val) {
            if (val == undefined) {
                return this._style.height;
            }
            if (typeof val === "string" && val.last() === "%") {
                throw Error("Function \"height()\" does not accept relative percentages.");
            }
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._style.height = val;
            return this;
        }
        // Wrap.
        wrap(val) {
            if (E.is_text) {
                this._style.lineBreak = val;
            }
            else {
            }
            return this;
        }
        // Font family.
        font_family(val) {
            if (val === undefined) {
                return this._style.font;
            }
            this._calls.font = val;
            return this;
        }
        // Font size.
        font_size(val) {
            if (val === undefined) {
                return this._calls.fontSize;
            }
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._calls.fontSize = val;
            return this;
        }
        // Font weight, the suffix for the font so: Helvetica-"Bold", can be lowercase.
        // Suffix might depend per font.
        font_weight(val) {
            if (val === undefined) {
                return this._font_weight;
            }
            switch (val.toLowerCase()) {
                case "bold":
                    this._font_weight = "Bold";
                    break;
                case "oblique":
                    this._font_weight = "Oblique";
                    break;
                case "boldoblique":
                    this._font_weight = "BoldOblique";
                    break;
                case "oblique":
                    this._font_weight = "Oblique";
                    break;
                case "roman":
                    this._font_weight = "Roman";
                    break;
                default:
                    this._font_weight = null;
                    break;
            }
            return this;
        }
        // Ellipsis overflow.
        ellipsis_overflow(value) {
            if (value === undefined) {
                return this._style.ellipsis;
            }
            this._style.ellipsis = value;
            return this;
        }
        // Line height.
        line_height(val) {
            if (val === undefined) {
                return this._style.lineGap;
            }
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._style.lineGap = val;
            return this;
        }
        // Word spacing.
        word_spacing(val) {
            if (val === undefined) {
                return this._style.wordSpacing;
            }
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._style.wordSpacing = val;
            return this;
        }
        // Align.
        align(val) {
            if (val === undefined) {
                return this._style.align;
            }
            this._style.align = val;
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
        // Align (for images mainly).
        align_vertical(val) {
            if (val === undefined) {
                return this._style.valign;
            }
            this._style.valign = val;
            return this;
        }
        leading_vertical() {
            return this.align_vertical("top");
        }
        center_vertical() {
            return this.align_vertical("center");
        }
        trailing_vertical() {
            return this.align_vertical("bottom");
        }
        // Fit image (for images mainly).
        fit(width, height) {
            if (width === undefined) {
                return this._style.fit;
            }
            if (PDF.use_pixels) {
                width = this._px(width);
                height = this._px(height);
            }
            this._style.fit = [width, height];
            return this;
        }
        // Margin, 1, 2 or 4 args.
        margin(...values) {
            if (values.length === 0) {
                return this._margin;
            }
            else {
                if (PDF.use_pixels) {
                    for (let i = 0; i < values.length; i++) {
                        values[i] = this._px(values[i]);
                    }
                }
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
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._margin[0] = val;
            return this;
        }
        margin_right(val) {
            if (val === undefined) {
                return this._margin[1];
            }
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._margin[1] = val;
            return this;
        }
        margin_bottom(val) {
            if (val === undefined) {
                return this._margin[2];
            }
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._margin[2] = val;
            return this;
        }
        margin_left(val) {
            if (val === undefined) {
                return this._margin[3];
            }
            if (PDF.use_pixels) {
                val = this._px(val);
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
                if (PDF.use_pixels) {
                    for (let i = 0; i < values.length; i++) {
                        values[i] = this._px(values[i]);
                    }
                }
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
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._padding[0] = val;
            return this;
        }
        padding_right(val) {
            if (val === undefined) {
                return this._padding[1];
            }
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._padding[1] = val;
            return this;
        }
        padding_bottom(val) {
            if (val === undefined) {
                return this._padding[2];
            }
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._padding[2] = val;
            return this;
        }
        padding_left(val) {
            if (val === undefined) {
                return this._padding[3];
            }
            if (PDF.use_pixels) {
                val = this._px(val);
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
                if (PDF.use_pixels) {
                    values[0] = this._px(values[0]);
                }
                this._position = [values[0], values[0], values[0], values[0]];
            }
            else if (values.length === 4) {
                if (values[0] != null) {
                    if (PDF.use_pixels) {
                        values[0] = this._px(values[0]);
                    }
                    this._position[0] = values[0];
                }
                if (values[1] != null) {
                    if (PDF.use_pixels) {
                        values[1] = this._px(values[1]);
                    }
                    this._position[1] = values[1];
                }
                if (values[2] != null) {
                    if (PDF.use_pixels) {
                        values[2] = this._px(values[2]);
                    }
                    this._position[2] = values[2];
                }
                if (values[3] != null) {
                    if (PDF.use_pixels) {
                        values[3] = this._px(values[3]);
                    }
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
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._position[0] = val;
            return this;
        }
        right(val) {
            if (val === undefined) {
                return this._position[1];
            }
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._position[1] = val;
            return this;
        }
        bottom(val) {
            if (val === undefined) {
                return this._position[2];
            }
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._position[2] = val;
            return this;
        }
        left(val) {
            if (val === undefined) {
                return this._position[3];
            }
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._position[3] = val;
            return this;
        }
        // Color.
        color(val) {
            if (val === undefined) {
                return this._calls.fillColor;
            }
            const opacity = PDF.hex_opacity(val);
            if (opacity !== null) {
                this._calls.fillColor = [val.slice(0, -2), opacity];
            }
            else {
                this._calls.fillColor = val;
            }
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
            if (PDF.use_pixels) {
                val = this._px(val);
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
            if (PDF.use_pixels) {
                val = this._px(val);
            }
            this._border_width = val;
            return this;
        }
        // Underine (boolean).
        underline(val) {
            if (val === undefined) {
                return this._style.underline;
            }
            this._style.underline = val;
            return this;
        }
        // strike (boolean).
        strike(val) {
            if (val === undefined) {
                return this._style.strike;
            }
            this._style.strike = val;
            return this;
        }
        // Wrap.
        // wrap(val) {
        //     if (val === undefined) { return this._wrap; }
        //     this._wrap = val;
        //     return this;
        // }
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
    }
    return E;
}
// ---------------------------------------------------------
// PDF element.
class PDFElement extends CreateVElementClass({
    type: "PDF",
}) {
    // Constructor.
    constructor(...children) {
        // Initialize base class.
        super(...children);
        // Attributes.
        this._margin = [0, 0, 0, 0];
        this._doc_margin = [50, 50, 50, 50]; // no ref.
        this._is_built = false;
    }
    // Create a document.
    _create_doc() {
        if (this._margin[0] !== 0 || this._margin[1] !== 0 || this._margin[2] !== 0 || this._margin[3] !== 0) {
            this._doc_margin = [...this._margin]; // otherwise it would upset the x and y calcuationg of this._built, easier to disable this._margin;
        }
        this._margin = [0, 0, 0, 0];
        this._doc = new PDFDocument({
            size: "A4",
            margins: {
                top: this._doc_margin[0],
                right: this._doc_margin[1],
                bottom: this._doc_margin[2],
                left: this._doc_margin[3],
            },
            bufferPages: true,
        });
        this._doc._vweb_ids = {}; // {$id: $page_nr}.
        this._doc._vweb_hrefs = [];
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
        for (let i = 0; i <= this._computed.end_page; i++) {
            callback(i);
        }
        return this;
    }
    // Number pages.
    number_pages({ align = "right", // left, center, right
    margin = 12.5, font_size = 6, color = "black", }) {
        this.iterate_pages((page) => {
            const text = PDF.Text(`Page ${page + 1}`)
                .color(color)
                .font_size(font_size)
                .position(null, align === "right" ? margin : null, margin, align === "left" ? margin : null)
                .page(page);
            if (align === "center") {
                text.width("100%").center();
            }
            this.append(text);
        });
        return this;
    }
    // Save.
    async save(path) {
        if (!this._is_built) {
            this.build();
        }
        const stream = libfs.createWriteStream(path);
        this._doc.pipe(stream);
        return new Promise((resolve, reject) => {
            stream.on('finish', () => {
                resolve();
            });
            stream.on('error', (error) => {
                reject(error);
            });
        });
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
// Export.
module.exports = PDF;
/*
        _build_v1(doc, x, y, dry = false) {

            // Is PDF type.
            if (this.type === "PDF") {
                this._create_doc();
                doc = this._doc;
                // x = 0;
                // y = 0;
                x = doc.page.margins.left;
                y = doc.page.margins.top;
            }

            // Is dry and result already cached.
            if (dry && this._build_result !== undefined) {
                return this._build_result;
            }

            // Flags.
            const has_background = typeof this._background === "string" || typeof this._border_color === "string";
            let has_wrapped = false;
            const has_absolute_pos = this._position[0] != null || this._position[1] != null || this._position[2] != null || this._position[3] != null;
            let added_page = false;

            // Variables.
            const start_x = x;
            const start_y = y;

            // Get dry x and y.
            let dry_response;
            if (!dry && has_background) {
                dry_response = this._build(doc, x, y, true);
                if (this.type === "PDF") {
                    this._create_doc(); // recreate new doc, required for addPage.
                }
            }

            // Add page, also in dry.
            if (this.type === "Page") {
                x = doc.page.margins.left;
                y = doc.page.margins.top;
                ++doc._vweb_page_nr;
            }

            // Absolute positioning.
            if (has_absolute_pos) {
                if (this._position[1] != null && this._position[3] != null) {
                    x = this._position[3];
                    this._style.width = doc.page.width - this._position[1] - this._position[3];
                    console.log(x, this._style.width)
                } else if (this._position[1] != null) {
                    x = doc.page.width - this._position[1];
                } else if (this._position[3] != null) {
                    x = this._position[3];
                }
                if (this._position[0] != null && this._position[2] != null) {
                    y = this._position[0];
                    this._style.height = doc.page.height - this._position[0] - this._position[2];
                } else if (this._position[0] != null) {
                    y = this._position[0];
                } else if (this._position[2] != null) {
                    y = doc.page.height - this._position[2];
                }
            }

            // Add pre margin.
            x += this._margin[3];
            y += this._margin[0];

            // Padding start X/Y.
            let padding_start_x = x;
            let padding_start_y = y;

            // Add background.
            if (!dry && has_background) {
                
                // Cache.
                doc.save();

                // Vars.
                const rect_width = dry_response.padding_end_x - dry_response.padding_start_x;
                const rect_height = dry_response.padding_end_y - dry_response.padding_start_y;

                // Check percentage border radius.
                if (typeof this._border_radius === "string" && this._border_radius.last() === "%") {
                    this._border_radius = Math.min(rect_width, rect_height) * (parseInt(this._border_radius.slice(0, -1)) / 100);
                }

                // Rounded rect.
                if (this._border_radius != null) {
                    // always use dry in case it is a text that has been wrapped by dry run.
                    doc.roundedRect(dry_response.padding_start_x, dry_response.padding_start_y, rect_width, rect_height, this._border_radius);
                }

                // Normal rect.
                else {
                    // always use dry in case it is a text that has been wrapped by dry run.
                    doc.rect(dry_response.padding_start_x, dry_response.padding_start_y, rect_width, rect_height);
                }
                if (typeof this._background === "string" && typeof this._border_color === "string") {
                    doc.lineWidth(this._border_width);
                    doc.fillAndStroke(this._background, this._border_color);
                }
                else
                if (typeof this._background === "string") {
                    doc.fill(this._background);
                }
                else if (typeof this._border_color === "string") {
                    doc.lineWidth(this._border_width);
                    doc.stroke(this._border_color);
                }
                doc.restore();
            }

            // Add pre padding.
            x += this._padding[3];
            y += this._padding[0];

            // Execute document calls.
            doc.save();
            Object.keys(this._calls).iterate((func) => {
                if (Array.isArray(this._calls[func])) {
                    doc[func](...this._calls[func])
                } else {
                    doc[func](this._calls[func])
                }
            })

            // Font weight.
            let old_font;
            if (this._font_weight != null && !doc._font.name.endsWith(this._font_weight)) {
                old_font = doc._font.name;
                doc.font(`${doc._font.name}-${this._font_weight}`)
            }

            // Set relative width.
            if (typeof this._style.width === "string" && this._style.width.last() === "%") {
                if (this._parent != null && this._parent._max_width != null) {
                    this._style.width = Math.max(
                        0,
                        this._parent._max_width * (parseInt(this._style.width.slice(0, -1)) / 100)
                        - (this._margin[1] + this._margin[3] + this._padding[1] + this._padding[3])
                    );
                } else {
                    delete this._style.width;
                }
            }


            // Calculate the max X (after padding and margin are added to x) (after calc relative width).
            if (this._parent == null || this._parent._max_x != null) {
                this._max_x = doc.page.width - doc.page.margins.right;
            } else {
                this._max_x = this._parent._max_x;
            }
            if (this._style.width != null) {
                this._max_x = Math.min(x + this._style.width, this._max_x);
            }
            this._max_x -= (this._margin[1] - this._padding[1]);

            // Calculate the max width (after padding and margin are added to x) (after calc relative width).
            this._max_width = this._max_x - x;

            // Set relative height.
            // Deprecated, no good way of knowing.
            // if (typeof this._style.height === "string" && this._style.height.last() === "%") {
            //     if (this._parent != null && this._parent._relative_height != null) {
            //         this._style.height = Math.max(
            //             0,
            //             this._parent._relative_height * (parseInt(this._style.height.slice(0, -1)) / 100)
            //             - (this._margin[0] + this._margin[2] + this._padding[0] + this._padding[2])
            //         );
            //     } else {
            //         delete this._style.height;
            //     }
            // }

            // Add image / text.
            if (E.is_text || E.is_img) {

                // Check width & height.
                if (E.is_img) {
                    if (this._style.width == null) {
                        throw Error("A defined width is required for an \"Image\" element.");
                    }
                    if (this._style.height == null) {
                        throw Error("A defined height is required for an \"Image\" element.");
                    }
                }

                // Check wrap.
                let width = this._get_width(doc);
                if (width > this._max_width) {
                    if (this._parent._wrap && this._parent._wrap_y != null) {
                        x = this._parent._wrap_x + this._padding[3] + this._margin[3];
                        y = this._parent._wrap_y + this._padding[0] + this._margin[0];
                        padding_start_x = this._parent._wrap_x + this._margin[3];
                        padding_start_y = this._parent._wrap_y + this._margin[0];
                        has_wrapped = true;
                    } else {
                        width = this._max_width;
                        this._style.width = this._max_width;
                    }
                }
                let height = this._get_height(doc); // must be after width in case of adjustments.

                // Create.
                if (!dry) {

                    // Id.
                    if (!dry && this._id != null) {
                        doc._vweb_ids[this._id] = doc._vweb_page_nr;
                    }

                    // Href.
                    if (!dry && this._href != null) {
                        if (this._href.startsWith("http")) {
                            doc.link(x, y, width, height, this._href);
                        } else {
                            doc._vweb_hrefs.append({
                                page: doc._vweb_page_nr,
                                href: this._href,
                                args: [x, y, width, height],
                            })
                        }
                    }

                    // Element.
                    if (E.is_text) {
                        const t = doc.text(this._text, x, y, this._style);
                    } else if (E.is_img) {
                        doc.image(this._img, x, y, this._style);
                    }
                }

                // Adjust coordinates.
                x += width;
                y += height;
            }

            // With children.
            else if (this._children.length > 0) {

                // Id.
                if (!dry && this._id != null) {
                    doc._vweb_ids[this._id] = doc._vweb_page_nr;
                }

                // Next line wrap x.
                this._wrap_x = x;
                // const relative_start_y = y;

                // Vars.
                let max_child_x = 0, max_child_y = 0;
                let start_x = x;
                let start_y = y;
                let default_height = 0;

                // Check if one of the children will create a new page when force same page is enabled.
                let add_page_on = []
                if (this._force_same_page) {
                    let i = -1;
                    const edited_y = this._children.iterate((child) => {
                        ++i;
                        if (child == null) { return ; }

                        // Assign parent.
                        child._parent = this;

                        // Get response.
                        const response = child._build(doc, x, y, true);

                        // Increment X/Y.
                        if (this.type === "HStack") {
                            x = response.x;
                            if (response.has_wrapped) {
                                y = this._wrap_y;
                            }
                        } else {
                            y = response.y;
                        }

                        // Check new page.
                        if (response.y > doc.page.height - doc.page.margins.bottom) {
                            console.log("ADD PAGE ON", i, this.toString())
                            add_page_on.append(i);
                            y = doc.page.margins.top;
                            added_page = true;
                        }
                    })
                    x = start_x;
                    y = start_y;
                }

                // Add children.
                let i = -1;
                this._children.iterate((child) => {
                    ++i;
                    if (child == null) { return ; }

                    // if (i === 97) {
                    //     console.log("ADD PAGE", i)
                    //     doc.addPage();
                    //     y = doc.y;
                    // }

                    if (add_page_on.includes(i)) {
                        doc.addPage();
                        y = doc.y;
                        max_child_y = 0
                        console.log("ADD PAGE", i, doc.y, doc.page.margins.top, add_page_on)
                    }

                    // Assign parent.
                    child._parent = this;

                    // Get response.
                    const response = child._build(doc, x, y, dry);
                    // if (response.added_page) {
                    //     console.log("RES ADDED", i)
                    // }

                    // Increment X/Y.
                    if (this.type === "HStack") {
                        x = response.x;
                        if (response.added_page || response.has_wrapped) {
                            y = this._wrap_y;
                        }
                    } else {
                        y = response.y;
                    }

                    // Cache max y.
                    // Must be after increment x/y for wrapping.
                    if (response.y > max_child_y) {
                        max_child_y = response.y;
                        this._wrap_y = max_child_y;
                        // if (max_child_y > doc.page.height - doc.page.margins.bottom) {
                        //     console.log("ERR", this._text, this.type)
                        //     y = response.y;
                        //     // doc.addPage();
                        //     // y = doc.y;
                        //     // y += this._margin[0];
                        //     // padding_start_y = y;
                        //     // y += this._padding[0];
                        // }
                        // this._relative_height = response.y - relative_start_y;
                    }
                    if (response.x > max_child_x) {
                        max_child_x = response.x;
                    }

                })

                // Set X/Y to max of children.
                if (this._style.width == null) {
                    x = max_child_x;
                } else {
                    x = Math.max(start_x + this._style.width, max_child_x);
                }
                if (this._style.height == null) {
                    y = max_child_y;
                } else {
                    y = Math.max(start_y + this._style.height, max_child_y);
                }
            }

            // No chidldren or text, might be an emtpy stack with background, use static frame.
            else {
                if (this._style.width != null) {
                    x += this._style.width
                }
                if (this._style.height != null) {
                    y += this._style.height
                }
            }

            // Add post padding.
            x += this._padding[1];
            y += this._padding[2];

            // Padding end X/Y.
            const padding_end_x = x;
            const padding_end_y = y;

            // Add post margin.
            x += this._margin[1];
            y += this._margin[2];

            // Restore.
            doc.restore();
            if (old_font !== undefined) {
                doc.font(old_font)
            }

            // Restore x/y on absolute.
            if (has_absolute_pos) {
                x = start_x;
                y = start_y;
            }

            // Post for PDF page.
            if (this.type === "PDF") {

                // Links.
                doc._vweb_hrefs.iterate((item) => {
                    console.log(item)
                    doc.switchToPage(item.page);
                    doc.link(...item.args.concat(doc._vweb_ids[item.href]));
                })

                // End.
                this._doc.end();
            }

            // Logs.
            // if (!dry) {
            //     console.log("post", {x, y, page: doc._vweb_page_nr}, this._text)
            // }

            // Cache build result for dry runs.
            this._build_result = {x, y, padding_start_x, padding_start_y, padding_end_x, padding_end_y, has_wrapped, added_page};

            // Response.
            return {x, y, padding_start_x, padding_start_y, padding_end_x, padding_end_y, has_wrapped, added_page};

            // doc.x
            // doc.y

            // create a document, and enable bufferPages mode
            // let i;
            // let end;
            // const doc = new PDFDocument({
            // bufferPages: true});
            // // add some content...
            // doc.addPage();
            // // ...
            // doc.addPage();
            // // see the range of buffered pages
            // const range = doc.bufferedPageRange(); // => { start: 0, count: 2 }
            // for (i = range.start, end = range.start + range.count, range.start <= end; i < end; i+
            // +;) {
            // doc.switchToPage(i);
            // doc.text(`Page ${i + 1} of ${range.count}`);
            // }
            // // manually flush pages that have been buffered
            // doc.flushPages();
            // // or, if you are at the end of the document anyway,
            // // doc.end() will call it for you automatically.
            // doc.end()
        }
        */ 
