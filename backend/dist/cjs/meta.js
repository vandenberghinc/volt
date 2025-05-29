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
  Meta: () => Meta,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
class Meta {
  author;
  title;
  description;
  image;
  robots;
  charset;
  viewport;
  favicon;
  constructor({ author = null, title = null, description = null, image = null, robots = "index, follow", charset = "UTF-8", viewport = "width=device-width, initial-scale=1", favicon = "/favicon.ico" } = {}) {
    this.author = author;
    this.title = title;
    this.description = description;
    this.image = image;
    this.robots = robots;
    this.charset = charset;
    this.viewport = viewport;
    this.favicon = favicon;
  }
  // Copy.
  /*  @docs:
      @title: Copy
      @description: Create a copy of the current meta object without any references.
      @param:
          @name: override
          @descr: The <Type>Meta</Type> constructor arguments to override.
   */
  copy(override = {}) {
    return new Meta({
      author: this.author,
      title: this.title,
      description: this.description,
      image: this.image,
      robots: this.robots,
      charset: this.charset,
      viewport: this.viewport,
      favicon: this.favicon,
      ...override
    });
  }
  /* @docs:
   * @title: Set value
   * @description: Set value funcs that return the current object.
   * @return: Returns the current <Type>Meta</Type> object.
   * @type: Meta
   * @funcs: 8
   */
  set_author(value) {
    this.author = value;
    return this;
  }
  set_title(value) {
    this.title = value;
    return this;
  }
  set_description(value) {
    this.description = value;
    return this;
  }
  set_image(value) {
    this.image = value;
    return this;
  }
  set_robots(value) {
    this.robots = value;
    return this;
  }
  set_charset(value) {
    this.charset = value;
    return this;
  }
  set_viewport(value) {
    this.viewport = value;
    return this;
  }
  set_favicon(value) {
    this.favicon = value;
    return this;
  }
  // Get as object.
  obj() {
    return {
      author: this.author,
      title: this.title,
      description: this.description,
      image: this.image,
      robots: this.robots,
      charset: this.charset,
      viewport: this.viewport,
      favicon: this.favicon
    };
  }
  // Build meta headers.
  build_html(domain = null) {
    let html = "";
    html += `<meta charset='${this.charset}'>`;
    html += `<meta name='viewport' content='${this.viewport}'/>`;
    html += `<title id='__page_title'>${this.title}</title>`;
    html += `<meta name='author' content='${this.author}'/>`;
    html += `<meta name='description' content='${this.description}'/>`;
    html += `<meta property='og:title' content='${this.title}'/>`;
    html += `<meta property='og:description' content='${this.description}'/>`;
    html += `<meta property='og:image' content='${this.image}'/>`;
    if (domain) {
      html += `<meta property="og:url" content="${domain}"/>`;
    }
    html += `<meta property="og:type" content="website"/>`;
    html += `<meta name='twitter:card' content='summary_large_image'/>`;
    html += `<meta name='twitter:title' content='${this.title}'/>`;
    html += `<meta name='twitter:description' content='${this.description}'/>`;
    html += `<meta name='twitter:image' content='${this.image}'/>`;
    html += `<meta name='robots' content='${this.robots}'>`;
    html += `<link rel='icon' href='${this.favicon}' type='image/x-icon'/>`;
    return html;
  }
}
var stdin_default = Meta;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Meta
});
