var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  CSS: () => CSS,
  CSSElement: () => CSSElement,
  Divider: () => Divider,
  DividerElement: () => DividerElement,
  Element: () => Element,
  Image: () => Image,
  ImageElement: () => ImageElement,
  ImageMask: () => ImageMask,
  ImageMaskElement: () => ImageMaskElement,
  Mail: () => Mail,
  MailElement: () => MailElement,
  NullCSSElement: () => NullCSSElement,
  NullDividerElement: () => NullDividerElement,
  NullImageElement: () => NullImageElement,
  NullImageMaskElement: () => NullImageMaskElement,
  NullMailElement: () => NullMailElement,
  NullSubtitle: () => NullSubtitle,
  NullTableDataElement: () => NullTableDataElement,
  NullTableElement: () => NullTableElement,
  NullTableRowElement: () => NullTableRowElement,
  NullText: () => NullText,
  NullTitle: () => NullTitle,
  NullVStackElement: () => NullVStackElement,
  Subtitle: () => Subtitle,
  SubtitleElement: () => SubtitleElement,
  Table: () => Table,
  TableData: () => TableData,
  TableDataElement: () => TableDataElement,
  TableElement: () => TableElement,
  TableRow: () => TableRow,
  TableRowElement: () => TableRowElement,
  Text: () => Text,
  TextElement: () => TextElement,
  Title: () => Title,
  TitleElement: () => TitleElement,
  VStack: () => VStack,
  VStackElement: () => VStackElement
});
module.exports = __toCommonJS(stdin_exports);
class Element {
  // ---------------------------------------------------------
  // Attributes.
  // static element_tag: string = tag; // must remain static.
  type;
  element_type;
  tag;
  _style;
  _attrs;
  classes;
  _inner_html;
  children;
  _lang;
  _charset;
  _viewport;
  _title;
  _links;
  _disabled;
  // ---------------------------------------------------------
  // Constructor.
  constructor({ type = "VElement", tag = "div", default_style = null, default_attributes = null, default_events = null }) {
    this.type = type;
    this.element_type = type;
    this.tag = tag;
    this._style = {};
    this._attrs = {};
    this.classes = [];
    this._inner_html = null;
    this.children = [];
    if (default_style != null) {
      Object.keys(default_style).forEach((key) => {
        this._style[key] = default_style[key];
      });
    }
    if (default_attributes != null) {
      Object.keys(default_attributes).forEach((key) => {
        this._attrs[key] = default_attributes[key];
      });
    }
    if (default_events != null) {
      Object.keys(default_events).forEach((key) => {
        this._attrs[key] = default_events[key];
      });
    }
  }
  // ---------------------------------------------------------
  // Utils.
  // Pad a numeric with px.
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
    let html = "", tag;
    if (this.tag !== "mail") {
      tag = this.tag;
    } else {
      tag = "body";
      html += "<!DOCTYPE html>";
      html += `<html lang="${this._lang || "en"}" style="height: 100%;">`;
      html += `<head>`;
      html += `<meta charset="${this._charset || "UTF-8"}">`;
      html += `<meta name="viewport" charset="${this._viewport || "width=device-width, initial-scale=1.0"}">`;
      html += `<meta name="color-scheme" content="light">`;
      html += `<meta name="supported-color-schemes" content="light">`;
      html += `<title>${this._title || ""}"</title>`;
      html += '<style type="text/css">* {box-sizing:border-box;}</style>';
      if (this._links !== void 0) {
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
            throw Error('Invalid type for a css include, the valid value types are "string" and "object".');
          }
        });
      }
      html += `</head>`;
      if (this.children.length > 0 && this.children[0].tag === "table") {
        this.children[0]._attrs.role = "presentation";
      }
    }
    html += "<";
    html += tag;
    html += " ";
    if (this.classes.length > 0) {
      html += 'class="';
      let i = 0;
      this.classes.forEach((key) => {
        html += key;
        if (i < this.classes.length - 1) {
          html += " ";
        }
        ++i;
      });
      html += '" ';
    }
    if (Object.keys(this._style).length > 0) {
      html += 'style="';
      Object.keys(this._style).forEach((key) => {
        html += `${key}:${this._style[key].replaceAll('"', "'")};`;
      });
      html += '"';
    }
    Object.keys(this._attrs).forEach((key) => {
      html += ` ${key}="${this._attrs[key]}"`;
    });
    html += ">\n";
    if (this._inner_html != null) {
      html += this._inner_html;
    }
    this.children.forEach((child) => {
      html += child.html();
    });
    html += "</";
    html += this.tag;
    html += "";
    html += ">\n";
    if (this.tag === "mail") {
      html += "</html>";
    }
    return html;
  }
  // Add links to the main MailElement.
  links(links) {
    if (this._links === void 0) {
      this._links = [];
    }
    this._links = this._links.concat(links);
    return this;
  }
  background_color(value) {
    if (value == null)
      return this._style["background-color"];
    this._style["background-color"] = value;
    return this;
  }
  display(value) {
    if (value == null)
      return this._style["display"];
    this._style["display"] = value;
    return this;
  }
  background_image(value) {
    if (value == null)
      return this._style["background-image"];
    this._style["background-image"] = value;
    return this;
  }
  background_repeat(value) {
    if (value == null)
      return this._style["background-repeat"];
    this._style["background-repeat"] = value;
    return this;
  }
  border_top(value) {
    if (value == null)
      return this._style["border-top"];
    this._style["border-top"] = value;
    return this;
  }
  border_bottom(value) {
    if (value == null)
      return this._style["border-bottom"];
    this._style["border-bottom"] = value;
    return this;
  }
  border_right(value) {
    if (value == null)
      return this._style["border-right"];
    this._style["border-right"] = value;
    return this;
  }
  border_left(value) {
    if (value == null)
      return this._style["border-left"];
    this._style["border-left"] = value;
    return this;
  }
  border_color(value) {
    if (value == null)
      return this._style["border-color"];
    this._style["border-color"] = value;
    return this;
  }
  border_style(value) {
    if (value == null)
      return this._style["border-style"];
    this._style["border-style"] = value;
    return this;
  }
  cursor(value) {
    if (value == null)
      return this._style["cursor"];
    this._style["cursor"] = value;
    return this;
  }
  justify_items(value) {
    if (value == null)
      return this._style["justify-items"];
    this._style["justify-items"] = value;
    return this;
  }
  letter_spacing(value) {
    if (value == null)
      return this._style["letter-spacing"];
    this._style["letter-spacing"] = value;
    return this;
  }
  line_height(value) {
    if (value == null)
      return this._style["line-height"];
    this._style["line-height"] = value;
    return this;
  }
  outline(value) {
    if (value == null)
      return this._style["outline"];
    this._style["outline"] = value;
    return this;
  }
  overflow(value) {
    if (value == null)
      return this._style["overflow"];
    this._style["overflow"] = value;
    return this;
  }
  overflow_x(value) {
    if (value == null)
      return this._style["overflow-x"];
    this._style["overflow-x"] = value;
    return this;
  }
  overflow_y(value) {
    if (value == null)
      return this._style["overflow-y"];
    this._style["overflow-y"] = value;
    return this;
  }
  text_align(value) {
    if (value == null)
      return this._style["text-align"];
    this._style["text-align"] = value;
    return this;
  }
  text_align_last(value) {
    if (value == null)
      return this._style["text-align-last"];
    this._style["text-align-last"] = value;
    return this;
  }
  text_decoration(value) {
    if (value == null)
      return this._style["text-decoration"];
    this._style["text-decoration"] = value;
    return this;
  }
  text_decoration_color(value) {
    if (value == null)
      return this._style["text-decoration-color"];
    this._style["text-decoration-color"] = value;
    return this;
  }
  text_wrap(value) {
    if (value == null)
      return this._style["text-wrap"];
    this._style["text-wrap"] = value;
    return this;
  }
  white_space(value) {
    if (value == null)
      return this._style["white-space"];
    this._style["white-space"] = value;
    return this;
  }
  overflow_wrap(value) {
    if (value == null)
      return this._style["overflow-wrap"];
    this._style["overflow-wrap"] = value;
    return this;
  }
  word_wrap(value) {
    if (value == null)
      return this._style["word-wrap"];
    this._style["word-wrap"] = value;
    return this;
  }
  box_shadow(value) {
    if (value == null)
      return this._style["box-shadow"];
    this._style["box-shadow"] = value;
    return this;
  }
  drop_shadow(value) {
    if (value == null)
      return this._style["drop-shadow"];
    this._style["drop-shadow"] = value;
    return this;
  }
  font_size(value) {
    if (value == null)
      return this._style["font-size"];
    this._style["font-size"] = this.pad_numeric(value);
    return this;
  }
  font(value) {
    if (value == null)
      return this._style["font"];
    this._style["font"] = this.pad_numeric(value);
    return this;
  }
  font_family(value) {
    if (value == null)
      return this._style["font-family"];
    this._style["font-family"] = this.pad_numeric(value);
    return this;
  }
  font_style(value) {
    if (value == null)
      return this._style["font-style"];
    this._style["font-style"] = this.pad_numeric(value);
    return this;
  }
  font_weight(value) {
    if (value == null)
      return this._style["font-weight"];
    this._style["font-weight"] = this.pad_numeric(value);
    return this;
  }
  width(value) {
    if (value == null)
      return this._style["width"];
    this._style["width"] = this.pad_numeric(value);
    return this;
  }
  min_width(value) {
    if (value == null)
      return this._style["min-width"];
    this._style["min-width"] = this.pad_numeric(value);
    return this;
  }
  max_width(value) {
    if (value == null)
      return this._style["max-width"];
    this._style["max-width"] = this.pad_numeric(value);
    return this;
  }
  height(value) {
    if (value == null)
      return this._style["height"];
    this._style["height"] = this.pad_numeric(value);
    return this;
  }
  min_height(value) {
    if (value == null)
      return this._style["min-height"];
    this._style["min-height"] = this.pad_numeric(value);
    return this;
  }
  max_height(value) {
    if (value == null)
      return this._style["max-height"];
    this._style["max-height"] = this.pad_numeric(value);
    return this;
  }
  margin_top(value) {
    if (value == null)
      return this._style["margin-top"];
    this._style["margin-top"] = this.pad_numeric(value);
    return this;
  }
  margin_bottom(value) {
    if (value == null)
      return this._style["margin-bottom"];
    this._style["margin-bottom"] = this.pad_numeric(value);
    return this;
  }
  margin_right(value) {
    if (value == null)
      return this._style["margin-right"];
    this._style["margin-right"] = this.pad_numeric(value);
    return this;
  }
  margin_left(value) {
    if (value == null)
      return this._style["margin-left"];
    this._style["margin-left"] = this.pad_numeric(value);
    return this;
  }
  padding_top(value) {
    if (value == null)
      return this._style["padding-top"];
    this._style["padding-top"] = this.pad_numeric(value);
    return this;
  }
  padding_bottom(value) {
    if (value == null)
      return this._style["padding-bottom"];
    this._style["padding-bottom"] = this.pad_numeric(value);
    return this;
  }
  padding_right(value) {
    if (value == null)
      return this._style["padding-right"];
    this._style["padding-right"] = this.pad_numeric(value);
    return this;
  }
  padding_left(value) {
    if (value == null)
      return this._style["padding-left"];
    this._style["padding-left"] = this.pad_numeric(value);
    return this;
  }
  border_width(value) {
    if (value == null)
      return this._style["border-width"];
    this._style["border-width"] = this.pad_numeric(value);
    return this;
  }
  align_items(value) {
    if (value == null)
      return this._style["align-items"];
    this._style["align-items"] = value;
    this._style["-ms-align-items"] = value;
    this._style["-webkit-align-items"] = value;
    this._style["-moz-align-items"] = value;
    return this;
  }
  align_content(value) {
    if (value == null)
      return this._style["align-content"];
    this._style["align-content"] = value;
    this._style["-ms-align-content"] = value;
    this._style["-webkit-align-content"] = value;
    this._style["-moz-align-content"] = value;
    return this;
  }
  background_size(value) {
    if (value == null)
      return this._style["background-size"];
    this._style["background-size"] = value;
    this._style["-ms-background-size"] = value;
    this._style["-webkit-background-size"] = value;
    this._style["-moz-background-size"] = value;
    return this;
  }
  box_sizing(value) {
    if (value == null)
      return this._style["box-sizing"];
    this._style["box-sizing"] = value;
    this._style["-ms-box-sizing"] = value;
    this._style["-webkit-box-sizing"] = value;
    this._style["-moz-box-sizing"] = value;
    return this;
  }
  flex(value) {
    if (value == null)
      return this._style["flex"];
    this._style["flex"] = value;
    this._style["-ms-flex"] = value;
    this._style["-webkit-flex"] = value;
    this._style["-moz-flex"] = value;
    return this;
  }
  flex_grow(value) {
    if (value == null)
      return this._style["flex-grow"];
    this._style["flex-grow"] = value;
    this._style["-ms-flex-grow"] = value;
    this._style["-webkit-flex-grow"] = value;
    this._style["-moz-flex-grow"] = value;
    return this;
  }
  flex_shrink(value) {
    if (value == null)
      return this._style["flex-shrink"];
    this._style["flex-shrink"] = value;
    this._style["-ms-flex-shrink"] = value;
    this._style["-webkit-flex-shrink"] = value;
    this._style["-moz-flex-shrink"] = value;
    return this;
  }
  justify_content(value) {
    if (value == null)
      return this._style["justify-content"];
    this._style["justify-content"] = value;
    this._style["-ms-justify-content"] = value;
    this._style["-webkit-justify-content"] = value;
    this._style["-moz-justify-content"] = value;
    return this;
  }
  mask(value) {
    if (value == null)
      return this._style["mask"];
    this._style["mask"] = value;
    this._style["-ms-mask"] = value;
    this._style["-webkit-mask"] = value;
    this._style["-moz-mask"] = value;
    return this;
  }
  user_select(value) {
    if (value == null)
      return this._style["user-select"];
    this._style["user-select"] = value;
    this._style["-ms-user-select"] = value;
    this._style["-webkit-user-select"] = value;
    this._style["-moz-user-select"] = value;
    return this;
  }
  // ---------------------------------------------------------
  // Edit the element.
  // Style the element.
  styles(styles) {
    Object.keys(styles).forEach((key) => {
      this._style[key] = styles[key];
    });
    return this;
  }
  // Add attributes to the element.
  attrs(attrs) {
    Object.keys(attrs).forEach((key) => {
      this._attrs[key] = attrs[key];
    });
    return this;
  }
  // Add events to the element.
  events(events) {
    Object.keys(events).forEach((key) => {
      this._attrs[key] = events[key];
    });
    return this;
  }
  // Add class.
  add_class(name) {
    if (this.classes.includes(name) === false) {
      this.classes.push(name);
    }
    return this;
  }
  // Remove class.
  remove_class(name) {
    this.classes = this.classes.filter((cls) => cls !== name);
    return this;
  }
  // Append a child.
  append(...children) {
    children.forEach((child) => {
      if (child == null) {
        return;
      } else if (Array.isArray(child)) {
        this.append(...child);
      } else if (typeof child === "function") {
        this.append(child(this));
      } else {
        this.children.push(child);
      }
    });
    return this;
  }
  inner_html(value) {
    if (value == null) {
      return this._inner_html;
    }
    this._inner_html = value;
    return this;
  }
  // ---------------------------------------------------------
  // Styling.
  // Center the data.
  center() {
    switch (this.tag) {
      case "table":
      case "tr":
      case "td":
        this._attrs["align"] = "center";
        return this;
      default:
        this._style["text-align"] = "center";
        return this;
    }
  }
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
      console.error('Invalid number of arguments for function "padding()".');
    }
    return this;
  }
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
      console.error('Invalid number of arguments for function "margin()".');
    }
    return this;
  }
  fixed_width(value) {
    if (value == null) {
      return this._style["min-width"];
    }
    value = this.pad_numeric(value);
    this._style["width"] = value;
    this._style["min-width"] = value;
    this._style["max-width"] = value;
    return this;
  }
  fixed_height(value) {
    if (value == null) {
      return this._style.height;
    }
    value = this.pad_numeric(value);
    this._style["height"] = value;
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
      this._style.width = width;
      this._style["min-width"] = width;
      this._style["max-width"] = width;
    }
    if (height != null) {
      height = this.pad_numeric(height);
      this._style.height = height;
      this._style["min-height"] = height;
      this._style["max-height"] = height;
    }
    return this;
  }
  color(value) {
    if (value == null) {
      return this._style.color;
    }
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
  border(...values) {
    if (values.length === 0) {
      return this._style.border;
    } else if (values.length === 1) {
      this._style.border = values[0].toString();
    } else if (values.length === 2) {
      this._style.border = `${this.pad_numeric(values[0])} solid ${values[1]}`;
    } else if (values.length === 3) {
      this._style.border = `${this.pad_numeric(values[0])} ${values[1]} ${values[2]}`;
    } else {
      console.error('Invalid number of arguments for function "border()".');
    }
    return this;
  }
  border_radius(value) {
    if (value == null) {
      return this._style["border-radius"];
    }
    const paddedValue = this.pad_numeric(value);
    this._style["border-radius"] = paddedValue;
    this._style["-ms-border-radius"] = paddedValue;
    this._style["-webkit-border-radius"] = paddedValue;
    this._style["-moz-border-radius"] = paddedValue;
    return this;
  }
  background(value) {
    if (value == null) {
      return this._style.background;
    }
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
  ellipsis_overflow(to = true) {
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
  on_click(callback) {
    if (callback == null) {
      return this._attrs.onclick;
    }
    this._style.cursor = "pointer";
    const e = this;
    this._attrs.onclick = (t) => {
      if (this._disabled !== true) {
        callback(e, t);
      }
    };
    return this;
  }
  lang(value) {
    if (value == null) {
      return this._lang;
    }
    this._lang = value;
    return this;
  }
  charset(value) {
    if (value == null) {
      return this._charset;
    }
    this._charset = value;
    return this;
  }
  viewport(value) {
    if (value == null) {
      return this._viewport;
    }
    this._viewport = value;
    return this;
  }
  title(value) {
    if (value == null) {
      return this._title;
    }
    this._title = value;
    return this;
  }
}
function wrapper(constructor) {
  return (...args) => new constructor(...args);
}
function create_null(target_class) {
  let instance;
  return () => {
    if (instance === void 0) {
      instance = new target_class();
    }
    return instance;
  };
}
class TitleElement extends Element {
  // Constructor.
  constructor(text) {
    super({
      type: "Title",
      tag: "h1",
      default_style: {
        "margin": "0px 0px 0px 0px",
        "color": "inherit",
        "white-space": "wrap",
        "text-align": "inherit",
        "font-size": "26px",
        "line-height": "1.2em"
      }
    });
    if (text) {
      this._inner_html = text;
    }
  }
}
const Title = wrapper(TitleElement);
const NullTitle = create_null(TitleElement);
class SubtitleElement extends Element {
  // Constructor.
  constructor(text) {
    super({
      type: "Subtitle",
      tag: "h2",
      default_style: {
        "margin": "0px",
        "color": "inherit",
        "white-space": "wrap",
        "text-align": "inherit",
        "font-size": "22px",
        "line-height": "1.2em"
      }
    });
    if (text) {
      this._inner_html = text;
    }
  }
}
const Subtitle = wrapper(SubtitleElement);
const NullSubtitle = create_null(SubtitleElement);
class TextElement extends Element {
  // Constructor.
  constructor(text) {
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
        "white-space": "wrap"
      }
    });
    if (text) {
      this._inner_html = text;
    }
  }
}
const Text = wrapper(TextElement);
const NullText = create_null(TextElement);
class ImageElement extends Element {
  // Constructor.
  constructor(src) {
    super({
      type: "Image",
      tag: "img",
      default_style: {
        "margin": "0px",
        "padding": "0px",
        "object-fit": "cover"
      }
    });
    if (src) {
      this._attrs.src = src;
    }
  }
}
const Image = wrapper(ImageElement);
const NullImageElement = create_null(ImageElement);
class ImageMaskElement extends Element {
  mask_child;
  _src;
  // Constructor.
  constructor(src) {
    super({
      type: "ImageMask",
      tag: "div",
      default_style: {
        "margin": "0px",
        "padding": "0px",
        "object-fit": "cover",
        "display": "inline-block"
      }
    });
    this.mask_child = VStack().width("100%").height("100%").background("black");
    if (src != null) {
      this.mask_child.mask(`url('${src}') no-repeat center/contain`);
    }
    this.append(this.mask_child);
    if (src) {
      this.src(src);
    }
  }
  mask_color(value) {
    if (value == null) {
      return this.mask_child._style.background;
    }
    this.mask_child._style.background = value;
    return this;
  }
  src(value) {
    if (value == null) {
      return this._src;
    }
    this.mask_child.mask(`url('${value}') no-repeat center/contain`);
    this._src = value;
    return this;
  }
  mask(value) {
    if (value == null) {
      return this.mask_child.mask();
    }
    this.mask_child.mask(value);
    return this;
  }
}
const ImageMask = wrapper(ImageMaskElement);
const NullImageMaskElement = create_null(ImageMaskElement);
class VStackElement extends Element {
  // Constructor.
  constructor(...children) {
    super({
      type: "VStack",
      tag: "div"
    });
    this.append(...children);
  }
}
const VStack = wrapper(VStackElement);
const NullVStackElement = create_null(VStackElement);
class DividerElement extends Element {
  // Constructor.
  constructor(text) {
    super({
      type: "Divider",
      tag: "div",
      default_style: {
        "margin": "0px",
        "padding": "0px",
        "width": "100%",
        "height": "1px",
        "min-height": "1px"
        // "background": "black",
      }
    });
    if (text) {
      this._inner_html = text;
    }
  }
}
const Divider = wrapper(DividerElement);
const NullDividerElement = create_null(DividerElement);
class TableDataElement extends Element {
  // Constructor.
  constructor(...children) {
    super({
      type: "TableData",
      tag: "td",
      default_style: {
        "width": "100%"
      },
      default_attributes: {}
    });
    this.append(...children);
  }
  // Center the data.
  center() {
    this.attrs({ align: "center" });
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
const TableData = wrapper(TableDataElement);
const NullTableDataElement = create_null(TableDataElement);
class TableRowElement extends Element {
  current_cell;
  _wrap = false;
  // Constructor.
  constructor(...children) {
    super({
      type: "TableRow",
      tag: "tr",
      default_style: {
        "width": "100%"
      },
      default_attributes: {}
    });
    this.append(...children);
  }
  // Append.
  append(...children) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child == null) {
        continue;
      } else if (Array.isArray(child)) {
        this.append(...child);
      } else if (typeof child === "function") {
        this.append(child(this));
      } else if (child instanceof TableDataElement) {
        this.current_cell = child;
        this.children.push(child);
      } else {
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
  wrap(value) {
    if (value == null) {
      return this._wrap;
    }
    this._wrap = value;
    const set_display_inline = (child) => {
      if (child instanceof TableDataElement) {
        child.children.forEach(set_display_inline);
      } else {
        if ((child._style.display == null || child._style.display === "") && this._wrap === true) {
          if (child.tag === "p" || child.tag === "h1" || child.tag === "h2") {
            child._style.display = "inline";
          } else {
            child._style.display = "inline-block";
          }
        } else if ((child._style.display === "inline" || child._style.display === "inline-block") && this._wrap === false) {
          child._style.display = "default";
        }
      }
    };
    this.children.forEach(set_display_inline);
    return this;
  }
  // Center.
  center() {
    this._attrs["align"] = "center";
    this.children.forEach((child) => {
      if (child instanceof TableDataElement) {
        child.attrs({ align: "center" });
      }
    });
    return this;
  }
  // Vertically center.
  center_vertical() {
    this._style["vertical-align"] = "middle";
    this.children.forEach((child) => {
      child._style["vertical-align"] = "middle";
      if (child instanceof TableDataElement) {
        child.children.forEach((nested) => {
          nested._style["vertical-align"] = "middle";
        });
      }
    });
    return this;
  }
  leading_vertical() {
    this._style["vertical-align"] = "top";
    this.children.forEach((child) => {
      child._style["vertical-align"] = "top";
      if (child instanceof TableDataElement) {
        child.children.forEach((nested) => {
          nested._style["vertical-align"] = "top";
        });
      }
    });
    return this;
  }
  trailing_vertical() {
    this._style["vertical-align"] = "bottom";
    this.children.forEach((child) => {
      child._style["vertical-align"] = "bottom";
      if (child instanceof TableDataElement) {
        child.children.forEach((nested) => {
          nested._style["vertical-align"] = "bottom";
        });
      }
    });
    return this;
  }
}
const TableRow = wrapper(TableRowElement);
const NullTableRowElement = create_null(TableRowElement);
class TableElement extends Element {
  current_cell;
  current_row;
  // Constructor.
  constructor(...children) {
    super({
      type: "Stack",
      tag: "table",
      default_style: {
        "width": "100%"
      },
      default_attributes: {
        "cellspacing": "0",
        "cellpadding": "0",
        "border": "0"
      }
    });
    this.current_row = TableRow();
    this.children.append(this.current_row);
    this.append(...children);
  }
  // Add a row.
  row(...children) {
    this.current_row = TableRow();
    this.children.push(this.current_row);
    this.current_cell = void 0;
    this.append(...children);
    return this;
  }
  // Append.
  append(...children) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child == null) {
        continue;
      } else if (Array.isArray(child)) {
        this.append(...child);
      } else if (typeof child === "function") {
        this.append(child(this));
      } else if (child instanceof TableRowElement) {
        this.current_row = child;
        this.children.push(child);
      } else {
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
const Table = wrapper(TableElement);
const NullTableElement = create_null(TableElement);
class CSSElement extends Element {
  // Constructor.
  constructor(style) {
    super({
      type: "CSS",
      tag: "style"
    });
    if (style) {
      this._inner_html = style;
    }
  }
}
const CSS = wrapper(CSSElement);
const NullCSSElement = create_null(CSSElement);
class MailElement extends Element {
  _subject;
  // Constructor.
  constructor(...children) {
    super({
      type: "Mail",
      tag: "mail",
      default_style: {
        "width": "100% !important",
        "min-height": "100% !important",
        "box-sizing": "border-box",
        "padding": "0px",
        // this is required, sometimes it glitches and makes it scrolling without zero padding.
        "margin": "0px"
      }
    });
    this.append(...children);
  }
  subject(subj) {
    if (subj == null) {
      return this._subject;
    }
    this._subject = subj;
    return this;
  }
}
const Mail = wrapper(MailElement);
const NullMailElement = create_null(MailElement);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CSS,
  CSSElement,
  Divider,
  DividerElement,
  Element,
  Image,
  ImageElement,
  ImageMask,
  ImageMaskElement,
  Mail,
  MailElement,
  NullCSSElement,
  NullDividerElement,
  NullImageElement,
  NullImageMaskElement,
  NullMailElement,
  NullSubtitle,
  NullTableDataElement,
  NullTableElement,
  NullTableRowElement,
  NullText,
  NullTitle,
  NullVStackElement,
  Subtitle,
  SubtitleElement,
  Table,
  TableData,
  TableDataElement,
  TableElement,
  TableRow,
  TableRowElement,
  Text,
  TextElement,
  Title,
  TitleElement,
  VStack,
  VStackElement
});
