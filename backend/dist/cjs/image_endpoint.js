var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  ImageEndpoint: () => ImageEndpoint
});
module.exports = __toCommonJS(stdin_exports);
var import_sharp = __toESM(require("sharp"));
var import_endpoint = require("./endpoint.js");
var import_logger = require("./logger.js");
const { log, error } = import_logger.logger;
class ImageEndpoint extends import_endpoint.Endpoint {
  // Cache the original and transformed image data in memory.
  static cache_in_memory = false;
  // Supported image extensions.
  static supported_images = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".tif",
    ".tiff",
    ".svg",
    ".heif",
    ".avif"
  ];
  i_path;
  i_type;
  i_data;
  i_cache;
  is_image_endpoint;
  constructor({ endpoint, path, content_type, cache = true, _is_static = true, rate_limit = void 0 }) {
    super({
      method: "GET",
      endpoint,
      content_type,
      compress: false,
      cache,
      params: {
        "type": { type: "string", default: null },
        "width": { type: ["number", "string"], default: null },
        "height": { type: ["number", "string"], default: null },
        "aspect_ratio": { type: "string", default: null }
      },
      rate_limit,
      _static_path: path.str(),
      _is_static
    });
    this.i_path = path.abs();
    this.i_type = this.i_path.extension().substr(1);
    this.i_cache = /* @__PURE__ */ new Map();
    if (ImageEndpoint.cache_in_memory) {
      this.i_data = this.i_path.load_sync({ type: "buffer" });
    }
    this.is_image_endpoint = true;
    this.callback = async (stream, params) => {
      const buff = await this.i_path.load({ type: "buffer" });
      return stream.send({
        status: 200,
        data: buff,
        headers: {
          "Content-Length": buff.length.toString()
        }
      });
      if ((params.type == null || this.i_type === params.type) && params.width == null && params.height == null) {
        return stream.send({
          status: 200,
          data: ImageEndpoint.cache_in_memory ? this.i_data : this.i_path.load_sync({ type: "buffer" })
        });
      }
      if (this.i_type === params.type) {
        params.type = null;
      }
      let cache_id;
      if (ImageEndpoint.cache_in_memory) {
        cache_id = `${params.width == null ? "" : params.width}.${params.height == null ? "" : params.height}.${params.type == null ? "" : params.type}`;
        if (this.i_cache.has(cache_id)) {
          return stream.send({
            status: 200,
            data: this.i_cache.get(cache_id)
          });
        }
      }
      const data = await this.transform(params.type, params.width, params.height, params.aspect_ratio);
      if (ImageEndpoint.cache_in_memory && cache_id) {
        this.i_cache.set(cache_id, data);
      }
      return stream.send({
        status: 200,
        data
      });
    };
  }
  // Transform image.
  async transform(type = null, width = null, height = null, aspect_ratio = true) {
    const img = (0, import_sharp.default)(this.i_path.str());
    let metadata;
    if (width != null || height != null) {
      let parsed_width;
      let parsed_height;
      if (typeof width === "string") {
        let last_char = width.charAt(width.length - 1);
        if (last_char === "%" || last_char === "x") {
          if (metadata === void 0) {
            metadata = await img.metadata();
          }
          if (last_char === "x") {
            parsed_width = parseInt(String(metadata.width * parseFloat(width)));
          } else {
            parsed_width = parseInt(String(metadata.width * (parseFloat(width) / 100)));
          }
        } else {
          parsed_width = parseInt(width);
        }
      } else if (typeof width === "number") {
        parsed_width = parseInt(String(width));
      }
      if (typeof height === "string") {
        let last_char = height.charAt(height.length - 1);
        if (last_char === "%" || last_char === "x") {
          if (metadata === void 0) {
            metadata = await img.metadata();
          }
          if (last_char === "x") {
            parsed_height = parseInt(String(metadata.height * parseFloat(height)));
          } else {
            parsed_height = parseInt(String(metadata.height * (parseFloat(height) / 100)));
          }
        } else {
          parsed_height = parseInt(height);
        }
      } else if (typeof height === "number") {
        parsed_height = parseInt(String(height));
      }
      const opts = {
        width: parsed_width,
        height: parsed_height
      };
      if (aspect_ratio === "false" || aspect_ratio === false) {
        opts.fit = "fill";
      }
      img.resize(opts);
    }
    if (type != null) {
      img.toFormat(type);
    }
    return img.toBuffer();
  }
  // Get aspect ratio.
  async get_aspect_ratio() {
    try {
      const metadata = await (0, import_sharp.default)(this._static_path).metadata();
      return `${metadata.width} / ${metadata.height}`;
    } catch (err) {
      error(`Unable to determine the aspect ratio of image ${this._static_path}: `, err);
      return null;
    }
  }
  // Clear cache.
  _clear_cache() {
    if (ImageEndpoint.cache_in_memory) {
      this.i_cache.clear();
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ImageEndpoint
});
