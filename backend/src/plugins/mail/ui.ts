/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// The HTML element server side for creating mails.
// Element.
   
// The class.
export class Element {

    // ---------------------------------------------------------
    // Attributes.

    // static element_tag: string = tag; // must remain static.
    
    type: string;
    element_type: string;
    tag: string;
    _style: Record<string, string>;
    _attrs: Record<string, any>;
    classes: string[];
    _inner_html: string | null;
    children: any[];
    _lang?: string;
    _charset?: string;
    _viewport?: string;
    _title?: string;
    _links?: (string | Record<string, string>)[];
    _disabled?: boolean;

    // ---------------------------------------------------------
    // Constructor.

    constructor({
        type = "VElement", 
        tag = "div",
        default_style = null, 
        default_attributes = null, 
        default_events = null,
    }: {
        type?: string;
        tag?: string;
        default_style?: Record<string, string> | null;
        default_attributes?: Record<string, string> | null;
        default_events?: Record<string, (event: Event) => any> | null;
    }) {

        // Arguments.
        this.type = type;
        this.element_type = type;
        this.tag = tag;

        // Attributes.
        this._style = {};
        this._attrs = {};
        this.classes = [];
        this._inner_html = null;
        this.children = [];

        // Assign default style.
        if (default_style != null) {
            Object.keys(default_style).forEach((key) => {
                this._style[key] = default_style![key];
            });
        }

        // Assign default attributes.
        if (default_attributes != null) {
            Object.keys(default_attributes).forEach((key) => {
                this._attrs[key] = default_attributes![key];
            });
        }

        // Assign default events.
        if (default_events != null) {
            Object.keys(default_events).forEach((key) => {
                this._attrs[key] = default_events![key];
            });
        }

    }

    // ---------------------------------------------------------
    // Utils.

    // Pad a numeric with px.
    pad_numeric(value: string | number, padding = "px"): string {
        if (typeof value === "number") {
            return value + padding;
        }
        return value;
    }

    // ---------------------------------------------------------
    // Build functions.

    // Build the html.
    html(): string {
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
            html += `<meta name="color-scheme" content="light">`;
            html += `<meta name="supported-color-schemes" content="light">`;
            html += `<title>${this._title || ""}"</title>`;
            html += "<style type=\"text/css\">* {box-sizing:border-box;}</style>";

            // Links.
            if (this._links !== undefined) {
                this._links.forEach((url) => {
                    if (typeof url === "string") {
                        html += `<link rel="stylesheet" href="${url}">`;
                    } else if (typeof url === "object") {
                        if (url.rel == null) {
                            url.rel = "stylesheet";
                        }
                        html += "<link";
                        Object.keys(url).forEach((key) => {
                            html += ` ${key}="${url[key]}"`;
                        });
                        html += ">";
                    } else {
                        throw Error("Invalid type for a css include, the valid value types are \"string\" and \"object\".");
                    }
                });
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
            this.classes.forEach((key) => {
                html += key;
                if (i < this.classes.length - 1) { html += " "; }
                ++i;
            });
            html += "\" ";
        }

        // Style.
        if (Object.keys(this._style).length > 0) {
            html += "style=\"";
            Object.keys(this._style).forEach((key) => {
                html += `${key}:${this._style[key].replaceAll('"', '\'')};`;
            });
            html += "\"";
        }

        // Attributes.
        Object.keys(this._attrs).forEach((key) => {
            html += ` ${key}="${this._attrs[key]}"`;
        });

        // End opening.
        html += ">\n";

        // Add inner html.
        if (this._inner_html != null) {
            html += this._inner_html;
        }

        // Add children.
        this.children.forEach((child) => {
            html += child.html();
        });

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
    links(links: (string | Record<string, string>)[]): this {
        if (this._links === undefined) {
            this._links = [];
        }
        this._links = this._links.concat(links);
        return this;
    }

    // ---------------------------------------------------------
    // Default funcs.

    /* @docs:
     * @title: Background Color
     * @description: Get or set the background color of the element.
     * @funcs: 3
     * @parameter:
     *    @name: value
     *    @description: The color value to set.
     *    @type: string
     * @returns: The current value when getting, or the element instance when setting.
     */
    background_color(): string | undefined;
    background_color(value: string): this;
    background_color(value?: string): this | string | undefined {
        if (value == null) return this._style["background-color"];
        this._style["background-color"] = value;
        return this;
    }

    /* @docs:
     * @title: Display
     * @description: Get or set the display property.
     * @funcs: 3
     */
    display(): string | undefined;
    display(value: string): this;
    display(value?: string): this | string | undefined {
        if (value == null) return this._style["display"];
        this._style["display"] = value;
        return this;
    }

    /* @docs:
     * @title: Background Image
     * @description: Get or set the background image.
     * @funcs: 3
     */
    background_image(): string | undefined;
    background_image(value: string): this;
    background_image(value?: string): this | string | undefined {
        if (value == null) return this._style["background-image"];
        this._style["background-image"] = value;
        return this;
    }

    background_repeat(): string | undefined;
    background_repeat(value: string): this;
    background_repeat(value?: string): this | string | undefined {
        if (value == null) return this._style["background-repeat"];
        this._style["background-repeat"] = value;
        return this;
    }

    border_top(): string | undefined;
    border_top(value: string): this;
    border_top(value?: string): this | string | undefined {
        if (value == null) return this._style["border-top"];
        this._style["border-top"] = value;
        return this;
    }

    border_bottom(): string | undefined;
    border_bottom(value: string): this;
    border_bottom(value?: string): this | string | undefined {
        if (value == null) return this._style["border-bottom"];
        this._style["border-bottom"] = value;
        return this;
    }

    border_right(): string | undefined;
    border_right(value: string): this;
    border_right(value?: string): this | string | undefined {
        if (value == null) return this._style["border-right"];
        this._style["border-right"] = value;
        return this;
    }

    border_left(): string | undefined;
    border_left(value: string): this;
    border_left(value?: string): this | string | undefined {
        if (value == null) return this._style["border-left"];
        this._style["border-left"] = value;
        return this;
    }

    border_color(): string | undefined;
    border_color(value: string): this;
    border_color(value?: string): this | string | undefined {
        if (value == null) return this._style["border-color"];
        this._style["border-color"] = value;
        return this;
    }

    border_style(): string | undefined;
    border_style(value: string): this;
    border_style(value?: string): this | string | undefined {
        if (value == null) return this._style["border-style"];
        this._style["border-style"] = value;
        return this;
    }

    cursor(): string | undefined;
    cursor(value: string): this;
    cursor(value?: string): this | string | undefined {
        if (value == null) return this._style["cursor"];
        this._style["cursor"] = value;
        return this;
    }

    justify_items(): string | undefined;
    justify_items(value: string): this;
    justify_items(value?: string): this | string | undefined {
        if (value == null) return this._style["justify-items"];
        this._style["justify-items"] = value;
        return this;
    }

    letter_spacing(): string | undefined;
    letter_spacing(value: string): this;
    letter_spacing(value?: string): this | string | undefined {
        if (value == null) return this._style["letter-spacing"];
        this._style["letter-spacing"] = value;
        return this;
    }

    line_height(): string | undefined;
    line_height(value: string): this;
    line_height(value?: string): this | string | undefined {
        if (value == null) return this._style["line-height"];
        this._style["line-height"] = value;
        return this;
    }

    outline(): string | undefined;
    outline(value: string): this;
    outline(value?: string): this | string | undefined {
        if (value == null) return this._style["outline"];
        this._style["outline"] = value;
        return this;
    }

    overflow(): string | undefined;
    overflow(value: string): this;
    overflow(value?: string): this | string | undefined {
        if (value == null) return this._style["overflow"];
        this._style["overflow"] = value;
        return this;
    }

    overflow_x(): string | undefined;
    overflow_x(value: string): this;
    overflow_x(value?: string): this | string | undefined {
        if (value == null) return this._style["overflow-x"];
        this._style["overflow-x"] = value;
        return this;
    }

    overflow_y(): string | undefined;
    overflow_y(value: string): this;
    overflow_y(value?: string): this | string | undefined {
        if (value == null) return this._style["overflow-y"];
        this._style["overflow-y"] = value;
        return this;
    }

    text_align(): string | undefined;
    text_align(value: string): this;
    text_align(value?: string): this | string | undefined {
        if (value == null) return this._style["text-align"];
        this._style["text-align"] = value;
        return this;
    }

    text_align_last(): string | undefined;
    text_align_last(value: string): this;
    text_align_last(value?: string): this | string | undefined {
        if (value == null) return this._style["text-align-last"];
        this._style["text-align-last"] = value;
        return this;
    }

    text_decoration(): string | undefined;
    text_decoration(value: string): this;
    text_decoration(value?: string): this | string | undefined {
        if (value == null) return this._style["text-decoration"];
        this._style["text-decoration"] = value;
        return this;
    }

    text_decoration_color(): string | undefined;
    text_decoration_color(value: string): this;
    text_decoration_color(value?: string): this | string | undefined {
        if (value == null) return this._style["text-decoration-color"];
        this._style["text-decoration-color"] = value;
        return this;
    }

    text_wrap(): string | undefined;
    text_wrap(value: string): this;
    text_wrap(value?: string): this | string | undefined {
        if (value == null) return this._style["text-wrap"];
        this._style["text-wrap"] = value;
        return this;
    }

    white_space(): string | undefined;
    white_space(value: string): this;
    white_space(value?: string): this | string | undefined {
        if (value == null) return this._style["white-space"];
        this._style["white-space"] = value;
        return this;
    }

    overflow_wrap(): string | undefined;
    overflow_wrap(value: string): this;
    overflow_wrap(value?: string): this | string | undefined {
        if (value == null) return this._style["overflow-wrap"];
        this._style["overflow-wrap"] = value;
        return this;
    }

    word_wrap(): string | undefined;
    word_wrap(value: string): this;
    word_wrap(value?: string): this | string | undefined {
        if (value == null) return this._style["word-wrap"];
        this._style["word-wrap"] = value;
        return this;
    }

    box_shadow(): string | undefined;
    box_shadow(value: string): this;
    box_shadow(value?: string): this | string | undefined {
        if (value == null) return this._style["box-shadow"];
        this._style["box-shadow"] = value;
        return this;
    }

    drop_shadow(): string | undefined;
    drop_shadow(value: string): this;
    drop_shadow(value?: string): this | string | undefined {
        if (value == null) return this._style["drop-shadow"];
        this._style["drop-shadow"] = value;
        return this;
    }

    // Group 2: Numeric padding functions
    font_size(): string | undefined;
    font_size(value: string | number): this;
    font_size(value?: string | number): this | string | undefined {
        if (value == null) return this._style["font-size"];
        this._style["font-size"] = this.pad_numeric(value);
        return this;
    }

    font(): string | undefined;
    font(value: string | number): this;
    font(value?: string | number): this | string | undefined {
        if (value == null) return this._style["font"];
        this._style["font"] = this.pad_numeric(value);
        return this;
    }

    font_family(): string | undefined;
    font_family(value: string | number): this;
    font_family(value?: string | number): this | string | undefined {
        if (value == null) return this._style["font-family"];
        this._style["font-family"] = this.pad_numeric(value);
        return this;
    }

    font_style(): string | undefined;
    font_style(value: string | number): this;
    font_style(value?: string | number): this | string | undefined {
        if (value == null) return this._style["font-style"];
        this._style["font-style"] = this.pad_numeric(value);
        return this;
    }

    font_weight(): string | undefined;
    font_weight(value: string | number): this;
    font_weight(value?: string | number): this | string | undefined {
        if (value == null) return this._style["font-weight"];
        this._style["font-weight"] = this.pad_numeric(value);
        return this;
    }

    width(): string | undefined;
    width(value: string | number): this;
    width(value?: string | number): this | string | undefined {
        if (value == null) return this._style["width"];
        this._style["width"] = this.pad_numeric(value);
        return this;
    }

    min_width(): string | undefined;
    min_width(value: string | number): this;
    min_width(value?: string | number): this | string | undefined {
        if (value == null) return this._style["min-width"];
        this._style["min-width"] = this.pad_numeric(value);
        return this;
    }

    max_width(): string | undefined;
    max_width(value: string | number): this;
    max_width(value?: string | number): this | string | undefined {
        if (value == null) return this._style["max-width"];
        this._style["max-width"] = this.pad_numeric(value);
        return this;
    }

    height(): string | undefined;
    height(value: string | number): this;
    height(value?: string | number): this | string | undefined {
        if (value == null) return this._style["height"];
        this._style["height"] = this.pad_numeric(value);
        return this;
    }

    min_height(): string | undefined;
    min_height(value: string | number): this;
    min_height(value?: string | number): this | string | undefined {
        if (value == null) return this._style["min-height"];
        this._style["min-height"] = this.pad_numeric(value);
        return this;
    }

    max_height(): string | undefined;
    max_height(value: string | number): this;
    max_height(value?: string | number): this | string | undefined {
        if (value == null) return this._style["max-height"];
        this._style["max-height"] = this.pad_numeric(value);
        return this;
    }

    margin_top(): string | undefined;
    margin_top(value: string | number): this;
    margin_top(value?: string | number): this | string | undefined {
        if (value == null) return this._style["margin-top"];
        this._style["margin-top"] = this.pad_numeric(value);
        return this;
    }

    margin_bottom(): string | undefined;
    margin_bottom(value: string | number): this;
    margin_bottom(value?: string | number): this | string | undefined {
        if (value == null) return this._style["margin-bottom"];
        this._style["margin-bottom"] = this.pad_numeric(value);
        return this;
    }

    margin_right(): string | undefined;
    margin_right(value: string | number): this;
    margin_right(value?: string | number): this | string | undefined {
        if (value == null) return this._style["margin-right"];
        this._style["margin-right"] = this.pad_numeric(value);
        return this;
    }

    margin_left(): string | undefined;
    margin_left(value: string | number): this;
    margin_left(value?: string | number): this | string | undefined {
        if (value == null) return this._style["margin-left"];
        this._style["margin-left"] = this.pad_numeric(value);
        return this;
    }

    padding_top(): string | undefined;
    padding_top(value: string | number): this;
    padding_top(value?: string | number): this | string | undefined {
        if (value == null) return this._style["padding-top"];
        this._style["padding-top"] = this.pad_numeric(value);
        return this;
    }

    padding_bottom(): string | undefined;
    padding_bottom(value: string | number): this;
    padding_bottom(value?: string | number): this | string | undefined {
        if (value == null) return this._style["padding-bottom"];
        this._style["padding-bottom"] = this.pad_numeric(value);
        return this;
    }

    padding_right(): string | undefined;
    padding_right(value: string | number): this;
    padding_right(value?: string | number): this | string | undefined {
        if (value == null) return this._style["padding-right"];
        this._style["padding-right"] = this.pad_numeric(value);
        return this;
    }

    padding_left(): string | undefined;
    padding_left(value: string | number): this;
    padding_left(value?: string | number): this | string | undefined {
        if (value == null) return this._style["padding-left"];
        this._style["padding-left"] = this.pad_numeric(value);
        return this;
    }

    border_width(): string | undefined;
    border_width(value: string | number): this;
    border_width(value?: string | number): this | string | undefined {
        if (value == null) return this._style["border-width"];
        this._style["border-width"] = this.pad_numeric(value);
        return this;
    }

    // Group 3: Browser prefixed properties
    align_items(): string | undefined;
    align_items(value: string): this;
    align_items(value?: string): this | string | undefined {
        if (value == null) return this._style["align-items"];
        this._style["align-items"] = value;
        this._style["-ms-align-items"] = value;
        this._style["-webkit-align-items"] = value;
        this._style["-moz-align-items"] = value;
        return this;
    }

    align_content(): string | undefined;
    align_content(value: string): this;
    align_content(value?: string): this | string | undefined {
        if (value == null) return this._style["align-content"];
        this._style["align-content"] = value;
        this._style["-ms-align-content"] = value;
        this._style["-webkit-align-content"] = value;
        this._style["-moz-align-content"] = value;
        return this;
    }

    background_size(): string | undefined;
    background_size(value: string): this;
    background_size(value?: string): this | string | undefined {
        if (value == null) return this._style["background-size"];
        this._style["background-size"] = value;
        this._style["-ms-background-size"] = value;
        this._style["-webkit-background-size"] = value;
        this._style["-moz-background-size"] = value;
        return this;
    }

    box_sizing(): string | undefined;
    box_sizing(value: string): this;
    box_sizing(value?: string): this | string | undefined {
        if (value == null) return this._style["box-sizing"];
        this._style["box-sizing"] = value;
        this._style["-ms-box-sizing"] = value;
        this._style["-webkit-box-sizing"] = value;
        this._style["-moz-box-sizing"] = value;
        return this;
    }

    flex(): string | undefined;
    flex(value: string): this;
    flex(value?: string): this | string | undefined {
        if (value == null) return this._style["flex"];
        this._style["flex"] = value;
        this._style["-ms-flex"] = value;
        this._style["-webkit-flex"] = value;
        this._style["-moz-flex"] = value;
        return this;
    }

    flex_grow(): string | undefined;
    flex_grow(value: string): this;
    flex_grow(value?: string): this | string | undefined {
        if (value == null) return this._style["flex-grow"];
        this._style["flex-grow"] = value;
        this._style["-ms-flex-grow"] = value;
        this._style["-webkit-flex-grow"] = value;
        this._style["-moz-flex-grow"] = value;
        return this;
    }

    flex_shrink(): string | undefined;
    flex_shrink(value: string): this;
    flex_shrink(value?: string): this | string | undefined {
        if (value == null) return this._style["flex-shrink"];
        this._style["flex-shrink"] = value;
        this._style["-ms-flex-shrink"] = value;
        this._style["-webkit-flex-shrink"] = value;
        this._style["-moz-flex-shrink"] = value;
        return this;
    }

    justify_content(): string | undefined;
    justify_content(value: string): this;
    justify_content(value?: string): this | string | undefined {
        if (value == null) return this._style["justify-content"];
        this._style["justify-content"] = value;
        this._style["-ms-justify-content"] = value;
        this._style["-webkit-justify-content"] = value;
        this._style["-moz-justify-content"] = value;
        return this;
    }

    mask(): string | undefined;
    mask(value: string): this;
    mask(value?: string): this | string | undefined {
        if (value == null) return this._style["mask"];
        this._style["mask"] = value;
        this._style["-ms-mask"] = value;
        this._style["-webkit-mask"] = value;
        this._style["-moz-mask"] = value;
        return this;
    }

    user_select(): string | undefined;
    user_select(value: string): this;
    user_select(value?: string): this | string | undefined {
        if (value == null) return this._style["user-select"];
        this._style["user-select"] = value;
        this._style["-ms-user-select"] = value;
        this._style["-webkit-user-select"] = value;
        this._style["-moz-user-select"] = value;
        return this;
    }

    // ---------------------------------------------------------
    // Edit the element.

    // Style the element.
    styles(styles: Record<string, string>): this {
        Object.keys(styles).forEach((key) => {
            this._style[key] = styles[key];
        });
        return this;
    }

    // Add attributes to the element.
    attrs(attrs: Record<string, string>): this {
        Object.keys(attrs).forEach((key) => {
            this._attrs[key] = attrs[key];
        });
        return this;
    }

    // Add events to the element.
    events(events: Record<string, (event: Event) => void>): this {
        Object.keys(events).forEach((key) => {
            this._attrs[key] = events[key] as unknown as string;
        });
        return this;
    }

    // Add class.
    add_class(name: string): this {
        if (this.classes.includes(name) === false) {
            this.classes.push(name);
        }
        return this;
    }

    // Remove class.
    remove_class(name: string): this {
        this.classes = this.classes.filter((cls) => cls !== name);
        return this;
    }

    // Append a child.
    append(...children: (Element | any[] | Function | none)[]): this {
        children.forEach((child) => {
            // Skip undefined.
            if (child == null) {
                return;
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
                this.children.push(child);
            }
        });
        return this;
    }

    // Inner html.
    inner_html(): string | null;
    inner_html(value: string): this;
    inner_html(value?: string): this | string | null {
        if (value == null) { return this._inner_html; }
        this._inner_html = value;
        return this;
    }

    // ---------------------------------------------------------
    // Styling.

    // Center the data.
    center(): this {
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
    padding(): string;
    padding(value: string | number): this;
    padding(top_bottom: string | number, left_right: string | number): this;
    padding(top: string | number, right: string | number, bottom: string | number, left: string | number): this;
    padding(...values: (string | number)[]): string | this {
        if (values.length === 0) {
            return this._style.padding;
        } else if (values.length === 1) {
            this._style.padding = this.pad_numeric(values[0]!);
        } else if (values.length === 2) {   
            if (values[0] != null) {
                this._style["padding-top"] = this.pad_numeric(values[0]!);
            }
            if (values[1] != null) {
                this._style["padding-right"] = this.pad_numeric(values[1]!);
            }
            if (values[0] != null) {
                this._style["padding-bottom"] = this.pad_numeric(values[0]!);
            }
            if (values[1] != null) {
                this._style["padding-left"] = this.pad_numeric(values[1]!);
            }
        } else if (values.length === 4) {
            this._style["padding-top"] = this.pad_numeric(values[0]!);
            if (values[1] != null) {
                this._style["padding-right"] = this.pad_numeric(values[1]!);
            }
            if (values[2] != null) {
                this._style["padding-bottom"] = this.pad_numeric(values[2]!);
            }
            if (values[3] != null) {
                this._style["padding-left"] = this.pad_numeric(values[3]!);
            }
        } else {
            console.error("Invalid number of arguments for function \"padding()\".");
        }
        return this;
    }
    
    // Margin, 1 or 4 args.
    margin(): string | undefined;
    margin(value: string | number): this;
    margin(value: none | string | number, value2: none | string | number): this;
    margin(value: none | string | number, value2: none | string | number, value3: none | string | number, value4: none | string | number): this;
    margin(...values: any[]): this | string | undefined {
        if (values.length === 0) {
            return this._style.margin;
        } else if (values.length === 1) {
            this._style.margin = this.pad_numeric(values[0]!);
        } else if (values.length === 2) {       
            this._style["margin-top"] = this.pad_numeric(values[0]!);
            if (values[1] != null) {
                this._style["margin-left"] = this.pad_numeric(values[1]!);
            }
            if (values[0] != null) {
                this._style["margin-bottom"] = this.pad_numeric(values[0]!);
            }
            if (values[1] != null) {
                this._style["margin-left"] = this.pad_numeric(values[1]!);
            }
        } else if (values.length === 4) {
            this._style["margin-top"] = this.pad_numeric(values[0]!);
            if (values[1] != null) {
                this._style["margin-left"] = this.pad_numeric(values[1]!);
            }
            if (values[2] != null) {
                this._style["margin-bottom"] = this.pad_numeric(values[2]!);
            }
            if (values[3] != null) {
                this._style["margin-left"] = this.pad_numeric(values[3]!);
            }
        } else {
            console.error("Invalid number of arguments for function \"margin()\".");
        }
        return this;
    }

    // Specify the width or height of the element
    fixed_width(): string | undefined;
    fixed_width(value: string | number): this;
    fixed_width(value?: string | number): this | string | undefined {
        if (value == null) { return this._style["min-width"]; }
        value = this.pad_numeric(value);
        this._style["width"] = value; // also required for for example image masks.
        this._style["min-width"] = value;
        this._style["max-width"] = value;
        return this;
    }
    fixed_height(): string | undefined;
    fixed_height(value: string | number): this;
    fixed_height(value?: string | number): this | string | undefined {
        if (value == null) { return this._style.height; }
        value = this.pad_numeric(value);
        this._style["height"] = value; // also required for for example image masks.
        this._style["min-height"] = value;
        this._style["max-height"] = value;
        return this;
    }

    // Frame.
    frame(width: string | number | undefined, height: string | number | undefined): this {
        if (width != null) {
            this.width(width);
        }
        if (height != null) {
            this.height(height);
        }
        return this;
    }
    min_frame(width: string | number | undefined, height: string | number | undefined): this {
        if (width != null) {
            this.min_width(width);
        }
        if (height != null) {
            this.min_height(height);
        }
        return this;
    }
    max_frame(width: string | number | undefined, height: string | number | undefined): this {
        if (width != null) {
            this.max_width(width);
        }
        if (height != null) {
            this.max_height(height);
        }
        return this;
    }
    fixed_frame(width: string | number | undefined, height: string | number | undefined): this {
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
    color(): string | undefined;
    color(value: string): this;
    color(value?: string): this | string | undefined {
        if (value == null) { return this._style.color; }
        if (value.startsWith("linear-gradient(") || value.startsWith("radial-gradient(")) {
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
    border(): string | undefined;
    border(a: string): this;
    border(a: string | number, b: string | number): this;
    border(a: string | number, b: string | number, c: string | number): this;
    border(...values: (string | number)[]): this | string | undefined {
        if (values.length === 0) {
            return this._style.border;
        } else if (values.length === 1) {
            this._style.border = values[0].toString();
        } else if (values.length === 2) {
            this._style.border = `${this.pad_numeric(values[0])} solid ${values[1]}`;
        } else if (values.length === 3) {
            this._style.border = `${this.pad_numeric(values[0])} ${values[1]} ${values[2]}`;
        } else {
            console.error("Invalid number of arguments for function \"border()\".");
        }
        return this;
    }

    // Border radius.
    border_radius(): string | undefined;
    border_radius(value: string | number): this;
    border_radius(value?: string | number): this | string | undefined {
        if (value == null) { return this._style["border-radius"]; }
        const paddedValue = this.pad_numeric(value);
        this._style["border-radius"] = paddedValue;
        this._style["-ms-border-radius"] = paddedValue;
        this._style["-webkit-border-radius"] = paddedValue;
        this._style["-moz-border-radius"] = paddedValue;
        return this;
    }
    
    // A shorthand property for all the background-* properties.
    background(): string | undefined;
    background(value: string): this;
    background(value?: string): this | string | undefined {
        if (value == null) { return this._style.background; }
        if (typeof value === "string" && (value.startsWith("linear-gradient") || value.startsWith("radial-gradient"))) {
            this._style.background = value;
            this._style["background-image"] = value;
            this._style["background-repeat"] = "no-repeat";
            this._style["background-size"] = "cover";
        } else {
            this._style.background = value;
        }
        return this;
    }

    // Set text ellipsis overflow.
    ellipsis_overflow(): boolean | undefined;
    ellipsis_overflow(to: boolean): this;
    ellipsis_overflow(to: boolean | undefined = true): this | boolean | undefined {
        if (to == null) {
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
    on_click(): ((e: this, t: Event) => void) | undefined;
    on_click(callback: (e: this, t: Event) => void): this;
    on_click(callback?: (e: this, t: Event) => void): this | ((e: this, t: Event) => void) | undefined {
        if (callback == null) {
            return this._attrs.onclick as unknown as (e: this, t: Event) => void;
        }
        this._style.cursor = "pointer";
        const e = this;
        this._attrs.onclick = (t: Event) => {
            if (this._disabled !== true) {
                callback(e, t);
            }
        };
        return this;
    }

    // ---------------------------------------------------------
    // Edit the mail object.

    lang(): string | undefined;
    lang(value: string): this;
    lang(value?: string): this | string | undefined {
        if (value == null) { return this._lang; }
        this._lang = value;
        return this;
    }
    charset(): string | undefined;
    charset(value: string): this;
    charset(value?: string): this | string | undefined {
        if (value == null) { return this._charset; }
        this._charset = value;
        return this;
    }
    viewport(): string | undefined;
    viewport(value: string): this;
    viewport(value?: string): this | string | undefined {
        if (value == null) { return this._viewport; }
        this._viewport = value;
        return this;
    }
    title(): string | undefined;
    title(value: string): this;
    title(value?: string): this | string | undefined {
        if (value == null) { return this._title; }
        this._title = value;
        return this;
    }
}

// Create a constructor wrapper.
function wrapper<T extends new (...args: any[]) => any>(
    constructor: T
): <Extensions extends object = {}>(...args: ConstructorParameters<T>) => InstanceType<T> & Extensions {
    return <Extensions extends object = {}>(...args: ConstructorParameters<T>) => new constructor(...args) as InstanceType<T> & Extensions;
}

// Create a shared null element mainly for typescript types.
function create_null<T extends new (...args: any[]) => any>(target_class: T): <Extensions extends object = {}>() => InstanceType<T> & Extensions {
    let instance: T | undefined;
    return <Extensions extends object = {}>(): InstanceType<T> & Extensions => {
        if (instance === undefined) {
            instance = new target_class();
        }
        return instance as unknown as InstanceType<T> & Extensions;
    };
}

// ---------------------------------------------------------
// Title.

export class TitleElement extends Element {
    
    // Constructor.
    constructor(text?: string) {
        
        // Initialize base class.
        super({
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
        });
        
        // Set text.
        if (text) { this._inner_html = text; }
    }
}
export const Title = wrapper(TitleElement);
export const NullTitle = create_null(TitleElement);

// ---------------------------------------------------------
// Subtitle.

export class SubtitleElement extends Element {
    
    // Constructor.
    constructor(text?: string) {
        
        // Initialize base class.
        super({
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
        });
        
        // Set text.
        if (text) { this._inner_html = text; }
    }  
}
export const Subtitle = wrapper(SubtitleElement);
export const NullSubtitle = create_null(SubtitleElement);


// ---------------------------------------------------------
// Text.

export class TextElement extends Element {
    
    // Constructor.
    constructor(text?: string) {
        
        // Initialize base class.
        super({
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
        });
    
        // Set text.
        if (text) { this._inner_html = text; }
    }    
}
export const Text = wrapper(TextElement);
export const NullText = create_null(TextElement);

// ---------------------------------------------------------
// Image.

export class ImageElement extends Element {
    
    // Constructor.
    constructor(src?: string) {
        
        // Initialize base class.
        super({
            type: "Image",
            tag: "img",
            default_style: {
                "margin": "0px",
                "padding": "0px",
                "object-fit": "cover",
            },
        });

        // Set src.
        if (src) { this._attrs.src = src; }
    }  
}
export const Image = wrapper(ImageElement);
export const NullImageElement = create_null(ImageElement);

// ---------------------------------------------------------
// ImageMask.

export class ImageMaskElement extends Element {
    mask_child: VStackElement;
    _src?: string;
    
    // Constructor.
    constructor(src?: string) {
        
        // Initialize base class.
        super({
            type: "ImageMask",
            tag: "div",
            default_style: {
                "margin": "0px",
                "padding": "0px",
                "object-fit": "cover",
                "display": "inline-block",
            },
        });
    
        // Append child.
        this.mask_child = VStack()
            .width("100%")
            .height("100%")
            .background("black");
        if (src != null) {
            this.mask_child.mask(`url('${src}') no-repeat center/contain`);
        }
        this.append(this.mask_child);

        // Set src.
        if (src) { this.src(src); }
    }

    // Image color.
    mask_color(): string | undefined;
    mask_color(value: string): this;
    mask_color(value?: string): this | string | undefined {
        if (value == null) {
            return this.mask_child._style.background;
        }
        this.mask_child._style.background = value;
        return this;
    }

    // Override src.
    src(): string | undefined;
    src(value: string): this;
    src(value?: string): this | string | undefined {
        if (value == null) {
            return this._src;
        }
        this.mask_child.mask(`url('${value}') no-repeat center/contain`);
        this._src = value;
        return this;
    }

    // Override mask.
    mask(): string | undefined;
    mask(value: string): this;
    mask(value?: string): this | string | undefined {
        if (value == null) {
            return this.mask_child.mask();
        }
        this.mask_child.mask(value);
        return this;
    }       
}
export const ImageMask = wrapper(ImageMaskElement);
export const NullImageMaskElement = create_null(ImageMaskElement);

// ---------------------------------------------------------
// VStack.

export class VStackElement extends Element {
    
    // Constructor.
    constructor(...children: any[]) {
        
        // Initialize base class.
        super({
            type: "VStack",
            tag: "div",
        });

        // Add children.
        this.append(...children);

    }   
}
export const VStack = wrapper(VStackElement);
export const NullVStackElement = create_null(VStackElement);

// ---------------------------------------------------------
// Divider.

export class DividerElement extends Element {
    
    // Constructor.
    constructor(text?: string) {
        
        // Initialize base class.
        super({
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
        
        // Set text.
        if (text) { this._inner_html = text; }
    }  
}
export const Divider = wrapper(DividerElement);
export const NullDividerElement = create_null(DividerElement);

// ---------------------------------------------------------
// Table data.

export class TableDataElement extends Element {

    // Constructor.
    constructor(...children: any[]) {
        
        // Initialize base class.
        super({
            type: "TableData",
            tag: "td",
            default_style: {
                "width": "100%",
            },
            default_attributes: {
            }
        });
        
        // Add children.
        this.append(...children);
    }  

    // Center the data.
    center(): this {
        this.attrs({ align: "center" });
        return this;
    }

    // Vertically center.
    center_vertical(): this {
        this._style["vertical-align"] = "middle";
        return this;
    }
    leading_vertical(): this {
        this._style["vertical-align"] = "top";
        return this;
    }
    trailing_vertical(): this {
        this._style["vertical-align"] = "bottom";
        return this;
    }
}
export const TableData = wrapper(TableDataElement);
export const NullTableDataElement = create_null(TableDataElement);

// ---------------------------------------------------------
// Table row.

export class TableRowElement extends Element {
    private current_cell!: TableDataElement;
    private _wrap: boolean = false;

    // Constructor.
    constructor(...children: any[]) {
        
        // Initialize base class.
        super({
            type: "TableRow",
            tag: "tr",
            default_style: {
                "width": "100%",
            },
            default_attributes: {
            }
        });
        
        // Add children.
        this.append(...children);
    }

    // Append.
    append(...children: any[]): this {
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
                this.children.push(child);
            }

            // Default.
            else {
                if (this.current_cell == null) {
                    this.current_cell = TableData();
                    this.children.push(this.current_cell);
                    if (this._attrs["align"] === "center") {
                        this.current_cell.attrs({ align: "center" });
                    }
                    if (this._style["vertical-align"] === "middle") {
                        this.current_cell._style["align"] = "middle";
                    }
                }
                if ((child._style.display == null || child._style.display === "") && this._wrap === true) {
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
    wrap(): boolean;
    wrap(value: boolean): this;
    wrap(value?: boolean): this | boolean {
        if (value == null) { return this._wrap; }
        this._wrap = value;
        const set_display_inline = (child: any) => {
            if (child instanceof TableDataElement) {
                child.children.forEach(set_display_inline);
            } else {
                if ((child._style.display == null || child._style.display === "") && this._wrap === true) {
                    if (child.tag === "p" || child.tag === "h1" || child.tag === "h2") {
                        child._style.display = "inline";
                    } else {
                        child._style.display = "inline-block";
                    }
                }
                else if ((child._style.display === "inline" || child._style.display === "inline-block") && this._wrap === false) {
                    child._style.display = "default";
                }
            }
        };
        this.children.forEach(set_display_inline);
        return this;
    }

    // Center.
    center(): this {
        this._attrs["align"] = "center";
        this.children.forEach((child) => {
            if (child instanceof TableDataElement) {
                child.attrs({ align: "center" });
            }
        });
        return this;
    }

    // Vertically center.
    center_vertical(): this {
        this._style["vertical-align"] = "middle";
        this.children.forEach((child) => {
            child._style["vertical-align"] = "middle";
            if (child instanceof TableDataElement) {
                child.children.forEach((nested: any) => {
                    nested._style["vertical-align"] = "middle";
                });
            }
        });
        return this;
    }
    leading_vertical(): this {
        this._style["vertical-align"] = "top";
        this.children.forEach((child) => {
            child._style["vertical-align"] = "top";
            if (child instanceof TableDataElement) {
                child.children.forEach((nested: any) => {
                    nested._style["vertical-align"] = "top";
                });
            }
        });
        return this;
    }
    trailing_vertical(): this {
        this._style["vertical-align"] = "bottom";
        this.children.forEach((child) => {
            child._style["vertical-align"] = "bottom";
            if (child instanceof TableDataElement) {
                child.children.forEach((nested: any) => {
                    nested._style["vertical-align"] = "bottom";
                });
            }
        });
        return this;
    }
}
export const TableRow = wrapper(TableRowElement);
export const NullTableRowElement = create_null(TableRowElement);

// ---------------------------------------------------------
// Table, automatically inserts table rows and optionally table data's when the appended object is not already a table data.

export class TableElement extends Element {
    public current_cell?: TableDataElement;
    public current_row: TableRowElement;

    // Constructor.
    constructor(...children: any[]) {
        
        // Initialize base class.
        super({
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
        });
        
        // Add children.
        this.current_row = TableRow();
        this.children.append(this.current_row);
        this.append(...children);
    }

    // Add a row.
    row(...children: any[]): this {
        this.current_row = TableRow();
        this.children.push(this.current_row);
        this.current_cell = undefined;
        this.append(...children);
        return this;
    }

    // Append.
    append(...children: any[]): this {
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
                this.children.push(child);
            }

            // Default.
            else {
                if (this.current_row == null) {
                    this.current_row = TableRow();
                    this.children.push(this.current_row);
                }
                this.current_row.append(child);
            }
        }
        return this;
    }
}
export const Table = wrapper(TableElement);
export const NullTableElement = create_null(TableElement);

// ---------------------------------------------------------
// CSS.

export class CSSElement extends Element {

    // Constructor.
    constructor(style?: string) {
        
        // Initialize base class.
        super({
            type: "CSS",
            tag: "style",
        });
        
        // Add inner html.
        if (style) { this._inner_html = style; }
    }
}
export const CSS = wrapper(CSSElement);
export const NullCSSElement = create_null(CSSElement);

// ---------------------------------------------------------
// Mail.

export class MailElement extends Element {
    private _subject?: string;

    // Constructor.
    constructor(...children: any[]) {
        
        // Initialize base class.
        super({
            type: "Mail",
            tag: "mail",
            default_style: {
                "width": "100% !important",
                "min-height": "100% !important",
                "box-sizing": "border-box",
                "padding": "0px", // this is required, sometimes it glitches and makes it scrolling without zero padding.
                "margin": "0px",
            },
        });
        
        // Add children.
        this.append(...children);
    }

    // Set the mail's subject.
    subject(): string | undefined;
    subject(subj: string): this;
    subject(subj?: string): this | string | undefined {
        if (subj == null) {
            return this._subject
        }
        this._subject = subj
        return this
    }
}
export const Mail = wrapper(MailElement);
export const NullMailElement = create_null(MailElement);













