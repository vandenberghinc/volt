/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// The mail object.

const mail = {};

// ---------------------------------------------------------
// The HTML element server side for creating mails.
// Element.
function CreateVElementClass({
    type = "VElement", 
    tag = "div",
    default_style = null, 
    default_attributes = null, 
    default_events = null, 
}) {
    
    // The class.
    class E {

        // ---------------------------------------------------------
        // Attributes.

        static element_tag = tag; // must remain static.
        static default_style = default_style;
        static default_attributes = default_attributes;
        static default_events = default_events;

        // ---------------------------------------------------------
        // Constructor.

        constructor() {

            // Arguments.
            this.type = type;
            this.element_type = type
            this.tag = tag;

            // Attributes.
            this._style = {};
            this._attrs = {};
            this.classes = [];
            this._inner_html = null;
            this.children = [];

            // Assign default style.
            if (E.default_style != null) {
                Object.keys(E.default_style).iterate((key) => {
                    this._style[key] = E.default_style[key];
                })
            }

            // Assign default attributes.
            if (E.default_attributes != null) {
                Object.keys(E.default_attributes).iterate((key) => {
                    this._attrs[key] = E.default_attributes[key];
                })
            }

            // Assign default events.
            if (E.default_events != null) {
                Object.keys(E.default_events).iterate((key) => {
                    this._attrs[key] = E.default_events[key];
                })
            }

            // Create default style functions.
            [
                ["background_color", "background-color"],
                ["display", "display"],
                ["background_image", "background-image"],
                ["background_repeat", "background-repeat"],
                ["border_top", "border-top"],
                ["border_bottom", "border-bottom"],
                ["border_right", "border-right"],
                ["border_left", "border-left"],
                ["border_color", "border-color"],
                ["border_style", "border-style"],
                ["cursor", "cursor"],
                ["justify_items", "justify-items"],
                ["letter_spacing", "letter-spacing"],
                ["line_height", "line-height"],
                ["outline", "outline"],
                ["overflow", "overflow"],
                ["overflow_x", "overflow-x"],
                ["overflow_y", "overflow-y"],
                ["text_align", "text-align"],
                ["text_align_last", "text-align-last"],
                ["text_decoration", "text-decoration"],
                ["text_decoration_color", "text-decoration-color"],
                ["text_wrap", "text-wrap"],
                ["white_space", "white-space"],
                ["overflow_wrap", "overflow-wrap"],
                ["word_wrap", "word-wrap"],
                ["box_shadow", "box-shadow"],
                ["drop_shadow", "drop-shadow"],
            ].iterate((item) => {
                const name = item[0], style = item[1];
                this[name] = function(value) {
                    if (value == null) { return this._style[style]; }
                    this._style[style] = value;
                    return this;
                }
            });

            // Create style functions that pad a numeric with px.
            [
                ["font_size", "font-size"],
                ["font", "font"],
                ["font_family", "font-family"],
                ["font_style", "font-style"],
                ["font_weight", "font-weight"],
                ["width", "width"],
                ["min_width", "min-width"],
                ["max_width", "max-width"],
                ["height", "height"],
                ["min_height", "min-height"],
                ["max_height", "max-height"],
                ["margin_top", "margin-top"],
                ["margin_bottom", "margin-bottom"],
                ["margin_right", "margin-right"],
                ["margin_left", "margin-left"],
                ["padding_top", "padding-top"],
                ["padding_bottom", "padding-bottom"],
                ["padding_right", "padding-right"],
                ["padding_left", "padding-left"],
                ["border_width", "border-width"],
            ].iterate((item) => {
                const name = item[0], style = item[1];
                this[name] = function(value) {
                    if (value == null) { return this._style[style]; }
                    this._style[style] = this.pad_numeric(value);
                    return this;
                }
            });

            // Create style functions with browser dependent values.
            [
                ["align_items", "align-items"],
                ["align_content", "align-content"],
                ["background_size", "background-size"],
                ["box_sizing", "box-sizing"],
                ["flex", "flex"],
                ["flex_grow", "flex-grow"],
                ["flex_shrink", "flex-shrink"],
                ["justify_content", "justify-content"],
                ["mask", "mask"],
                ["user_select", "user-select"],
            ].iterate((item) => {
                const name = item[0], style = item[1];
                this[name] = function(value) {
                    if (value == null) { return this._style[style]; }
                    this._style[style] = value;
                    this._style[`-ms-${style}`] = value;
                    this._style[`-webkit-${style}`] = value;
                    this._style[`-moz-${style}`] = value;
                    return this;
                }
            });


        }

        // ---------------------------------------------------------
        // Utils.

        // Padd a numeric with px.
        pad_numeric(value, padding = "px") {
            if (typeof value === "number") {
                return value + padding;
            }
            return value;
        }

        // ---------------------------------------------------------
        // Build functions.

        // Build the html.
        html() {

            // Vars.
            let html = "", tag;

            // A default element.
            if (this.tag !== "mail") {
                tag = this.tag;
            }

            // The parent mail element.
            else {
                tag = "body";

                // Build header.
                html += "<!DOCTYPE html>";
                html += `<html lang="${this._lang || "en"}" style="height: 100%;">`;
                html += `<head>`;
                html += `<meta charset="${this._charset || "UTF-8"}">`;
                html += `<meta name="viewport" charset="${this._viewport || "width=device-width, initial-scale=1.0"}">`;
                html += `<meta name="color-scheme" content="light">`
                html += `<meta name="supported-color-schemes" content="light">`
                html += `<title>${this._title || ""}"</title>`;
                html += "<style type=\"text/css\">* {box-sizing:border-box;}</style>"

                /*
                // Create classes for static colors that remain the same in dark mode and light mode.
                // Fetch colors.
                const _static_fg = [], _static_bg = [], _static_bgc = [];
                const fetch_static_colors = (child) => {
                    if (child._style.color != null && child._style.color.indexOf(" ") === -1) {
                        if (_static_fg.includes(child._style.color) === false) {
                            _static_fg.append(child._style.color);
                        }
                        child.add_class(`_fg_${child._style.color.replaceAll("#", "")}`);
                        delete child._style.color;
                    }
                    if (child._style.background != null && child._style.background.indexOf(" ") === -1) {
                        if (_static_bg.includes(child._style.background) === false) {
                            _static_bg.append(child._style.background);
                        }
                        child.add_class(`_bg_${child._style.background.replaceAll("#", "")}`);
                        if (child.tag === "table") {
                            child._attrs.bgcolor = child._style.background;
                        }
                        delete child._style.background;
                    }
                    if (child._style["background-color"] != null && child._style["background-color"].indexOf(" ") === -1) {
                        if (_static_bgc.includes(child._style["background-color"]) === false) {
                            _static_bgc.append(child._style["background-color"]);
                        }
                        child.add_class(`_bgc_${child._style["background-color"].replaceAll("#", "")}`);
                        if (child.tag === "table") {
                            child._attrs.bgcolor = child._style["background-color"];
                        }
                        delete child._style["background-color"];
                    }
                    child.children.iterate(fetch_static_colors);
                }
                fetch_static_colors(this);
                console.log(_static_fg)
                console.log(_static_bg)
                console.log(_static_bgc)

                // Build dark theme.
                html += "<style type=\"text/css\">";
                _static_fg.iterate((color) => { html += `._fg_${color.replaceAll("#", "")} { color: ${color} !important; }\n` })
                _static_bg.iterate((color) => { html += `._bg_${color.replaceAll("#", "")} { background: ${color} !important; }\n` })
                _static_bgc.iterate((color) => { html += `._bgc_${color.replaceAll("#", "")} { background-color: ${color} !important; }\n` })
                html += "@media (prefers-color-scheme: dark) {\n";
                _static_fg.iterate((color) => { html += `._fg_${color.replaceAll("#", "")} { color: ${color} !important; }\n` })
                _static_bg.iterate((color) => { html += `._bg_${color.replaceAll("#", "")} { background: ${color} !important; }\n` })
                _static_bgc.iterate((color) => { html += `._bgc_${color.replaceAll("#", "")} { background-color: ${color} !important; }\n` })
                html += "}\n";
                html += "</style>"
                */

                // Links.
                if (this._links !== undefined) {
                    this._links.iterate((url) => {
                        if (typeof url === "string") {
                            html += `<link rel="stylesheet" href="${url}">`;
                        } else if (typeof url === "object") {
                            if (url.rel == null) {
                                url.rel = "stylesheet";
                            }
                            html += "<link";
                            Object.keys(url).iterate((key) => {
                                html += ` ${key}="${url[key]}"`;
                            })
                            html += ">";
                        } else {
                            throw Error("Invalid type for a css include, the valid value types are \"string\" and \"object\".");
                        }
                    })
                }

                // Close header.
                html += `</head>`;

                // Set presentation role.
                if (this.children.length > 0 && this.children[0].tag === "table") {
                    this.children[0]._attrs.role = "presentation";
                }
            }

            // Open.
            html += "<";
            html += tag;
            html += " ";

            // Classes.
            if (this.classes.length > 0) {
                html += "class=\"";
                let i = 0;
                this.classes.iterate((key) => {
                    html += key
                    if (i < this.classes.length - 1) { html += " "}
                        ++i;
                })
                html += "\" ";
            }

            // Style.
            if (Object.keys(this._style).length > 0) {
                html += "style=\"";
                Object.keys(this._style).iterate((key) => {
                    html += `${key}:${this._style[key].replaceAll('"', '\'')};`
                })
                html += "\"";
            }

            // Attributes.
            Object.keys(this._attrs).iterate((key) => {
                html += ` ${key}=\"${this._attrs[key]}\"`
            })

            // End opening.
            html += ">\n";

            // Add inner html.
            if (this._inner_html != null) {
                html += this._inner_html;
            }

            // Add children.
            this.children.iterate((child) => {
                html += child.html();
            })

            // Close.
            html += "</";
            html += this.tag;
            html += "";
            html += ">\n";

            // The parent mail element.
            if (this.tag === "mail") {
                html += "</html>";
            }

            // Response.
            return html;
        }

        // Add links to the main MailElement.
        links(links) {
            if (this._links === undefined) {
                this._links = [];
            }
            this._links = this._links.concat(links);
            return this;
        }

        // ---------------------------------------------------------
        // Edit the element.

        // Style the element.
        styles(styles) {
            Object.keys(styles).iterate((key) => {
                this._style[key] = styles[key];
            })
            return this;
        }

        // Add attributes tp the element.
        attrs(attrs) {
            Object.keys(attrs).iterate((key) => {
                this._attrs[key] = attrs[key];
            })
            return this;
        }

        // Add attributes tp the element.
        events(events) {
            Object.keys(events).iterate((key) => {
                this._attrs[key] = events[key];
            })
            return this;
        }

        // Add class.
        add_class(name) {
            if (this.classes.includes(name) === false) {
                this.classes.append(name);
            }
            return this;
        }

        // Remove class.
        remove_class(name) {
            this.classes = this.classes.drop(name);
            return this;
        }

        // Append a child.
        append(...children) {
            for (let i = 0; i < children.length; i++) {
                const child = children[i];

                // Skip undefined.
                if (child == null) {
                    continue;
                }

                // Array.
                else if (Array.isArray(child)) {
                    this.append(...child);
                }

                // Execute function.
                else if (typeof child === "function") {
                    this.append(child(this));
                }

                // Default.
                else {
                    this.children.append(child);
                }
            }
            return this;
        }

        // Inner html.
        inner_html(value) {
            if (value == null) { return this._inner_html; }
            this._inner_html = value;
            return this;
        }

        // ---------------------------------------------------------
        // Styling.

        // Center the data.
        center() {
            switch (this.tag) {
                case "table": case "tr": case "td":
                    this._attrs["align"] = "center";
                    return this;    
                default:
                    this._style["text-align"] = "center";
                    return this;    
            }
        }

        // Padding, 1 or 4 args.
        padding(...values) {
            if (values.length === 0) {
                return this._style.padding;
            } else if (values.length === 1) {
                this._style.padding = this.pad_numeric(values[0]);
            } else if (values.length === 2) {   
                if (values[0] != null) {
                    this._style["padding-top"] = this.pad_numeric(values[0]);
                }
                if (values[1] != null) {
                    this._style["padding-right"] = this.pad_numeric(values[1]);
                }
                if (values[0] != null) {
                    this._style["padding-bottom"] = this.pad_numeric(values[0]);
                }
                if (values[1] != null) {
                    this._style["padding-left"] = this.pad_numeric(values[1]);
                }
            } else if (values.length === 4) {
                this._style["padding-top"] = this.pad_numeric(values[0]);
                if (values[1] != null) {
                    this._style["padding-right"] = this.pad_numeric(values[1]);
                }
                if (values[2] != null) {
                    this._style["padding-bottom"] = this.pad_numeric(values[2]);
                }
                if (values[3] != null) {
                    this._style["padding-left"] = this.pad_numeric(values[3]);
                }
            } else {
                console.error("Invalid number of arguments for function \"padding()\".");
            }
            return this;
        }
        
        // Margin, 1 or 4 args.
        margin(...values) {
            if (values.length === 0) {
                return this._style.margin;
            } else if (values.length === 1) {
                this._style.margin = this.pad_numeric(values[0]);
            } else if (values.length === 2) {       
                this._style["margin-top"] = this.pad_numeric(values[0]);
                if (values[1] != null) {
                    this._style["margin-left"] = this.pad_numeric(values[1]);
                }
                if (values[0] != null) {
                    this._style["margin-bottom"] = this.pad_numeric(values[0]);
                }
                if (values[1] != null) {
                    this._style["margin-left"] = this.pad_numeric(values[1]);
                }
            } else if (values.length === 4) {
                this._style["margin-top"] = this.pad_numeric(values[0]);
                if (values[1] != null) {
                    this._style["margin-left"] = this.pad_numeric(values[1]);
                }
                if (values[2] != null) {
                    this._style["margin-bottom"] = this.pad_numeric(values[2]);
                }
                if (values[3] != null) {
                    this._style["margin-left"] = this.pad_numeric(values[3]);
                }
            } else {
                console.error("Invalid number of arguments for function \"margin()\".");
            }
            return this;
        }

        // Specify the width or height of the element
        // Returns the offset width or height when the param value is null.
        fixed_width(value) {
            if (value == null) { return this._style["min-width"]; }
            value = this.pad_numeric(value);
            this._style["width"] = value; // also required for for example image masks.
            this._style["min-width"] = value;
            this._style["max-width"] = value;
            return this;
        }
        fixed_height(value) {
            if (value == null) { return this.style.height; }
            value = this.pad_numeric(value);
            this._style["height"] = value; // also required for for example image masks.
            this._style["min-height"] = value;
            this._style["max-height"] = value;
            return this;
        }

        // Frame.
        frame(width, height) {
            if (width != null) {
                this.width(width);
            }
            if (height != null) {
                this.height(height);
            }
            return this;
        }
        min_frame(width, height) {
            if (width != null) {
                this.min_width(width);
            }
            if (height != null) {
                this.min_height(height);
            }
            return this;
        }
        max_frame(width, height) {
            if (width != null) {
                this.max_width(width);
            }
            if (height != null) {
                this.max_height(height);
            }
            return this;
        }
        fixed_frame(width, height) {
            if (width != null) {
                width = this.pad_numeric(width);
                this._style.width = width; // also required for for example image masks.
                this._style["min-width"] = width;
                this._style["max-width"] = width;
            }
            if (height != null) {
                height = this.pad_numeric(height);
                this._style.height = height; // also required for for example image masks.
                this._style["min-height"] = height;
                this._style["max-height"] = height;
            }
            return this;
        }

        // Color.
        color(value) {
            if (value == null) { return this.style.color; }
            if (value.eq_first("linear-gradient(") || value.eq_first("radial-gradient(")) {
                this._style["background-image"] = value;
                this._style["background-clip"] = "text";
                this._style["-webkit-background-clip"] = "text";
                this._style.color = "transparent";
            } else {
                this._style.color = value;
            }
            return this;
        }

        // Border, 1 till 3 args.
        border(...values) {
            if (values.length === 0) {
                return this._style.border;
            } else if (values.length === 1) {
                this._style.border = values[0];
            } else if (values.length === 2) {
                this._style.border = this.pad_numeric(values[0]) + " solid " + values[1];
            } else if (values.length === 3) {
                this._style.border = this.pad_numeric(values[0]) + " ", values[1] + " " + values[2];
            } else {
                console.error("Invalid number of arguments for function \"border()\".");
            }
            return this;
        }

        // Border radius.
        border_radius(value) {
            if (value == null) { return this._style["border-radius"]; }
            this._style["border-radius"] = this.pad_numeric(value);
            this._style["-ms-border-radius"] = this.pad_numeric(value);
            this._style["-webkit-border-radius"] = this.pad_numeric(value);
            this._style["-moz-border-radius"] = this.pad_numeric(value);
            return this;
        }
        
        // A shorthand property for all the background-* properties.
        background(value) {
            if (value == null) { return this._style.background; }
            if (typeof value === "string" && (value.eq_first("linear-gradient") || value.eq_first("radial-gradient"))) {
                this._style.background = value;
                this._style["background-image"] = value
                this._style["background-repeat"] = "no-repeat"
                this._style["background-size"] = "cover"
            } else {
                this._style.background = value;
            }
            return this;
        }

        // Set text ellipsis overflow.
        ellipsis_overflow(to = true) {
            if (to === null) {
                return this._style["text-overflow"] === "ellipsis";
            } else if (to === true) {
                this._style["text-overflow"] = "ellipsis";
                this._style["white-space"] = "nowrap";
                this._style.overflow = "hidden";
                this._style["text-wrap"] = "wrap";
                this._style["overflow-wrap"] = "break-word";
            } else if (to === false) {
                this._style["text-overflow"] = "default";
                this._style["white-space"] = "default";
                this._style.overflow = "default";
                this._style["text-wrap"] = "default";
                this._style["overflow-wrap"] = "default";
            }
            return this;
        }

        // ---------------------------------------------------------
        // Events.

        // Script to be run when the element is being clicked
        on_click(callback) {
            if (callback == null) {
                return this.attrs.onclick;
            }
            this._style.cursor = "pointer";
            const e = this;
            this.attrs.onclick = (t) => {
                if (this._disabled !== true) {
                    callback(e, t);
                }
            };
            return this;
        }

        // ---------------------------------------------------------
        // Edit the mail object.

        lang(value) {
            if (value == null) { return this._lang; }
            this._lang = value;
            return this;
        }
        charset(value) {
            if (value == null) { return this._charset; }
            this._charset = value;
            return this;
        }
        viewport(value) {
            if (value == null) { return this._viewport; }
            this._viewport = value;
            return this;
        }
        title(value) {
            if (value == null) { return this._title; }
            this._title = value;
            return this;
        }

    }
    return E;
}

const Element = CreateVElementClass({});
mail.Element = () => {return new Element()};

// ---------------------------------------------------------
// Title.

class TitleElement extends CreateVElementClass({
    type: "Title",
    tag: "h1",
    default_style: {
        "margin": "0px 0px 0px 0px",
        "color": "inherit",
        "white-space": "wrap",
        "text-align": "inherit",
        "font-size": "26px",
        "line-height": "1.2em",
    },
}) {
    
    // Constructor.
    constructor(text) {
        
        // Initialize base class.
        super();
        
        // Set text.
        this._inner_html = text;
    }
}

function Title(...args) { return new TitleElement(...args); }

mail.TitleElement = TitleElement;
mail.Title = Title;

// ---------------------------------------------------------
// Subtitle.

class SubtitleElement extends CreateVElementClass({
    type: "Subtitle",
    tag: "h2",
    default_style: {
        "margin": "0px",
        "color": "inherit",
        "white-space": "wrap",
        "text-align": "inherit",
        "font-size": "22px",
        "line-height": "1.2em",
    },
}) {
    
    // Constructor.
    constructor(text) {
        
        // Initialize base class.
        super();
        
        // Set text.
        this._inner_html = text;
    }  
}

function Subtitle(...args) { return new SubtitleElement(...args); }

mail.SubtitleElement = SubtitleElement;
mail.Subtitle = Subtitle;

// ---------------------------------------------------------
// Text.

class TextElement extends CreateVElementClass({
    type: "Text",
    tag: "p",
    default_style: {
        "margin": "0px",
        "padding": "0px",
        "font-size": "18px",
        "line-height": "1.4em",
        "color": "inherit",
        "text-align": "inherit",
        "white-space": "wrap",
    },
}) {
    
    // Constructor.
    constructor(text) {
        
        // Initialize base class.
        super();
    
        // Set text.
        this._inner_html = text;
    }    
}

function Text(...args) { return new TextElement(...args); }

mail.TextElement = TextElement;
mail.Text = Text;

// ---------------------------------------------------------
// Image.

class ImageElement extends CreateVElementClass({
    type: "Image",
    tag: "img",
    default_style: {
        "margin": "0px",
        "padding": "0px",
        "object-fit": "cover",
    },
}) {
    
    // Constructor.
    constructor(src) {
        
        // Initialize base class.
        super();

        // Set src.
        this._attrs.src = src;
    }  
}

function Image(...args) { return new ImageElement(...args); }

mail.ImageElement = ImageElement;
mail.Image = Image;

// ---------------------------------------------------------
// ImageMask.

class ImageMaskElement extends CreateVElementClass({
    type: "ImageMask",
    tag: "div",
    default_style: {
        "margin": "0px",
        "padding": "0px",
        "object-fit": "cover",
        "display": "inline-block",
    },
}) {
    
    // Constructor.
    constructor(src) {
        
        // Initialize base class.
        super();
    
        // Append child.
        this.mask_child = VStack()
            // .position(0, 0, 0, 0)
            .width("100%")
            .height("100%")
            .background("black")
        if (src != null) {
            this.mask_child.mask("url('" + src + "') no-repeat center/contain");
        }
        // this.position("relative");
        this.append(this.mask_child);

        // Set src.
        this.src(src);
    }

    // Image color.
    mask_color(value) {
        if (value == null) {
            return this.mask_child._style.background;
        }
        this.mask_child._style.background = value;
        return this;
    }

    // Override src.
    src(value) {
        if (value == null) {
            return this._src;
        }
        this.mask_child.mask("url('" + value + "') no-repeat center/contain");
        this._src = value;
        return this;
    }

    // Override mask.
    mask(value) {
        if (value == null) {
            return this.mask_child.mask();
        }
        this.mask_child.mask(value);
        return this;
    }       
}

function ImageMask(...args) { return new ImageMaskElement(...args); }

mail.ImageMaskElement = ImageMaskElement;
mail.ImageMask = ImageMask;

// ---------------------------------------------------------
// VStack.

class VStackElement extends CreateVElementClass({
    type: "VStack",
    tag: "div",
}) {
    
    // Constructor.
    constructor(...children) {
        
        // Initialize base class.
        super();

        // Add children.
        this.append(...children);

    }
        
}

function VStack(...args) { return new VStackElement(...args); }

mail.VStackElement = VStackElement;
mail.VStack = VStack;

// ---------------------------------------------------------
// Divider.

const DividerElement = CreateVElementClass({
    type: "Divider",
    tag: "div",
    default_style: {
        "margin": "0px",
        "padding": "0px",
        "width": "100%",
        "height": "1px",
        "min-height": "1px",
        // "background": "black",
    },
});

function Divider(...args) { return new DividerElement(...args); }

mail.DividerElement = DividerElement;
mail.Divider = Divider;

// ---------------------------------------------------------
// Table data.

class TableDataElement extends CreateVElementClass({
    type: "TableData",
    tag: "td",
    default_style: {
        "width": "100%",
    },
    default_attributes: {
    }
}) {

    // Constructor.
    constructor(...children) {
        
        // Initialize base class.
        super();
        
        // Add children.
        this.append(...children);
    }  

    // Center the data.
    center() {
        this._attrs["align"] = "center";
        return this;
    }

    // Vertically center.
    center_vertical() {
        this._style["vertical-align"] = "middle";
        return this;
    }
    leading_vertical() {
        this._style["vertical-align"] = "top";
        return this;
    }
    trailing_vertical() {
        this._style["vertical-align"] = "bottom";
        return this;
    }
}

function TableData(...args) { return new TableDataElement(...args); }

mail.TableDataElement = TableDataElement;
mail.TableData = TableData;

// ---------------------------------------------------------
// Table row.

class TableRowElement extends CreateVElementClass({
    type: "TableRow",
    tag: "tr",
    default_style: {
        "width": "100%",
    },
    default_attributes: {
    }
}) {

    // Constructor.
    constructor(...children) {
        
        // Initialize base class.
        super();
        
        // Add children.
        this.append(...children);
    }

    // Append.
    append(...children) {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];

            // Skip undefined.
            if (child == null) {
                continue;
            }

            // Array.
            else if (Array.isArray(child)) {
                this.append(...child);
            }

            // Execute function.
            else if (typeof child === "function") {
                this.append(child(this));
            }

            // Table data.
            else if (child instanceof TableDataElement) {
                this.current_cell = child;
                this.children.append(child);
            }

            // Default.
            else {
                if (this.current_cell == null) {
                    this.current_cell = TableData();
                    this.children.append(this.current_cell);
                    if (this._attrs["align"] === "center") {
                        this.current_cell._attrs["align"] = "center";
                    }
                    if (this._style["vertical-align"] === "middle") {
                        this.current_cell._style["align"] = "middle";
                    }
                }
                if ((child._style.display == null || child._style.display == "") && this._wrap === true) {
                    if (child.tag === "p" || child.tag === "h1" || child.tag === "h2") {
                        child._style.display = "inline";
                    } else {
                        child._style.display = "inline-block";
                    }
                }
                this.current_cell.append(child);
            }
        }
        return this;
    }

    // Wrap side by side.
    wrap(value = true) {
        if (value == null) { return this._wrap; }
        this._wrap = value;
        const set_display_inline = (child) => {
            if (child instanceof TableDataElement) {
                child.children.iterate(set_display_inline);
            } else {
                if ((child._style.display == null || child._style.display == "") && this._wrap === true) {
                    if (child.tag === "p" || child.tag === "h1" || child.tag === "h2") {
                        child._style.display = "inline";
                    } else {
                        child._style.display = "inline-block";
                    }
                }
                else if ((child._style.display == "inline" || child._style.display == "inline-block") && this._wrap === false) {
                    child._style.display = "default";
                }
            }
        }
        this.children.iterate(set_display_inline);
        return this;
    }

    // Center.
    center() {
        this._attrs["align"] = "center";
        this.children.iterate((child) => {
            if (child instanceof TableDataElement) {
                child._attrs["align"] = "center";
            }
        });
        return this;
    }

    // Vertically center.
    center_vertical() {
        this._style["vertical-align"] = "middle";
        this.children.iterate((child) => {
            child._style["vertical-align"] = "middle";
            if (child instanceof TableDataElement) {
                child.children.iterate((nested) => {
                    nested._style["vertical-align"] = "middle";
                });
            }
        });
        return this;
    }
    leading_vertical() {
        this._style["vertical-align"] = "top";
        this.children.iterate((child) => {
            child._style["vertical-align"] = "top";
            if (child instanceof TableDataElement) {
                child.children.iterate((nested) => {
                    nested._style["vertical-align"] = "top";
                });
            }
        });
        return this;
    }
    trailing_vertical() {
        this._style["vertical-align"] = "bottom";
        this.children.iterate((child) => {
            child._style["vertical-align"] = "bottom";
            if (child instanceof TableDataElement) {
                child.children.iterate((nested) => {
                    nested._style["vertical-align"] = "bottom";
                });
            }
        });
        return this;
    }
}

function TableRow(...args) { return new TableRowElement(...args); }

mail.TableRowElement = TableRowElement;
mail.TableRow = TableRow;

// ---------------------------------------------------------
// Table, automatically inserts table rows and optionally table data's when the appended object is not already a table data.

class TableElement extends CreateVElementClass({
    type: "Stack",
    tag: "table",
    default_style: {
        "width": "100%",
    },
    default_attributes: {
        "cellspacing": "0",
        "cellpadding": "0",
        "border": "0" ,
    }
}) {

    // Constructor.
    constructor(...children) {
        
        // Initialize base class.
        super();
        
        // Add children.
        this.current_row = TableRow();
        this.children.append(this.current_row);
        this.append(...children);
    }

    // Add a row.
    row(...children) {
        this.current_row = TableRow()
        this.children.append(this.current_row);
        this.current_cell = null;
        this.append(...children);
        return this;
    }

    // Append.
    append(...children) {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];

            // Skip undefined.
            if (child == null) {
                continue;
            }
            
            // Array.
            else if (Array.isArray(child)) {
                this.append(...child);
            }

            // Execute function.
            else if (typeof child === "function") {
                this.append(child(this));
            }

            // Table row.
            else if (child instanceof TableRowElement) {
                this.current_row = child;
                this.children.append(child);
            }

            // Default.
            else {
                if (this.current_row == null) {
                    this.current_row = TableRow();
                    this.children.append(this.current_row);
                }
                this.current_row.append(child);
            }
        }
        return this;
    }
}

function Table(...args) { return new TableElement(...args); }

mail.TableElement = TableElement;
mail.Table = Table;

// ---------------------------------------------------------
// CSS.

class CSSElement extends CreateVElementClass({
    type: "CSS",
    tag: "style",
}) {

    // Constructor.
    constructor(style) {
        
        // Initialize base class.
        super();
        
        // Add inner html.
        this._inner_html = style;
    }
}

function CSS(...args) { return new CSSElement(...args); }

mail.CSSElement = CSSElement;
mail.CSS = CSS;

// ---------------------------------------------------------
// Mail.

class MailElement extends CreateVElementClass({
    type: "Mail",
    tag: "mail",
    default_style: {
        "width": "100% !important",
        "min-height": "100% !important",
        "box-sizing": "border-box",
        "padding": "0px", // this is required, sometimes it glitches and makes it scrolling without zero padding.
        "margin": "0px",
    },
}) {

    // Constructor.
    constructor(...children) {
        
        // Initialize base class.
        super();
        
        // Add children.
        this.append(...children);

        // Attributes.
        this._subject = null
    }

    // Set the mail's subject.
    subject(subj) {
        if (subj == null) {
            return this._subject
        }
        this._subject = subj
        return this
    }
}

function Mail(...args) { return new MailElement(...args); }

mail.MailElement = MailElement;
mail.Mail = Mail;

// ---------------------------------------------------------
// Export.

module.exports = mail;













