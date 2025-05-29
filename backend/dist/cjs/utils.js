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
  ExternalError: () => ExternalError,
  InternalError: () => InternalError,
  Utils: () => Utils,
  default: () => stdin_default,
  utils: () => Utils
});
module.exports = __toCommonJS(stdin_exports);
var vlib = __toESM(require("@vandenberghinc/vlib"));
var import_status = require("./status.js");
class BaseError extends Error {
  type;
  status;
  data;
  invalid_fields;
  constructor({ type = "APIError", message, status, data, invalid_fields }) {
    super(message);
    this.name = "APIError";
    this.type = type;
    this.status = status ?? import_status.Status.internal_server_error;
    this.data = data;
    this.invalid_fields = invalid_fields ?? {};
  }
  serve(stream) {
    stream.error({
      status: this.status ?? import_status.Status.internal_server_error,
      headers: { "Content-Type": "application/json" },
      message: this.message,
      type: this.type,
      invalid_fields: this.invalid_fields
    });
    return this;
  }
}
class ExternalError extends BaseError {
  constructor(args) {
    args.type ??= "ExternalError";
    super(args);
  }
  serve(stream) {
    stream.error({
      status: this.status ?? import_status.Status.internal_server_error,
      headers: { "Content-Type": "application/json" },
      message: this.message,
      type: this.type,
      invalid_fields: this.invalid_fields
    });
    return this;
  }
}
class InternalError extends BaseError {
  constructor(args) {
    args.type ??= "InternalError";
    super(args);
  }
  serve(stream) {
    stream.error({
      status: import_status.Status.internal_server_error,
      headers: { "Content-Type": "application/json" },
      message: "Internal Server Error",
      type: "InternalServerError"
    });
    return this;
  }
}
const Utils = {
  // An error that may be shown to the frontend user.
  "APIError": ExternalError,
  // Fill templates {{TEMPLATE}}
  fill_templates(data, templates, curly_style = true) {
    if (templates == null) {
      return data;
    }
    const keys = Object.keys(templates);
    if (keys.length > 0) {
      for (let i = 0; i < data.length; i++) {
        if (curly_style && data.charAt(i) === "{" && data.charAt(i + 1) === "{") {
          for (let k = 0; k < keys.length; k++) {
            if (data.charAt(i + keys[k].length + 2) === "}" && data.charAt(i + keys[k].length + 3) === "}" && data.startsWith(keys[k], i + 2)) {
              const end_index = i + keys[k].length + 4;
              if (templates[keys[k]] != null && typeof templates[keys[k]] === "object") {
                data = vlib.String.replace_indices(data, JSON.stringify(templates[keys[k]]), i, end_index);
              } else {
                data = vlib.String.replace_indices(data, templates[keys[k]], i, end_index);
              }
              i = end_index - 1;
            }
          }
        } else if (!curly_style && data.charAt(i) === "$") {
          for (let k = 0; k < keys.length; k++) {
            if (data.startsWith(keys[k], i + 1)) {
              const end_index = i + keys[k].length + 1;
              if (templates[keys[k]] != null && typeof templates[keys[k]] === "object") {
                data = vlib.String.replace_indices(data, JSON.stringify(templates[keys[k]]), i, end_index);
              } else {
                data = vlib.String.replace_indices(data, templates[keys[k]], i, end_index);
              }
              i = end_index - 1;
            }
          }
        }
      }
    }
    return data;
  },
  // Utils.
  get_currency_symbol(currency) {
    switch (currency.toLowerCase()) {
      case "aed":
        return "\u062F.\u0625";
      case "afn":
        return "Af";
      case "all":
        return "L";
      case "amd":
        return "\u058F";
      case "ang":
        return "\u0192";
      case "aoa":
        return "Kz";
      case "ars":
        return "$";
      case "aud":
        return "$";
      case "awg":
        return "\u0192";
      case "azn":
        return "\u20BC";
      case "bam":
        return "KM";
      case "bbd":
        return "Bds$";
      case "bdt":
        return "\u09F3";
      case "bgn":
        return "\u043B\u0432";
      case "bhd":
        return ".\u062F.\u0628";
      case "bif":
        return "FBu";
      case "bmd":
        return "BD$";
      case "bnd":
        return "B$";
      case "bob":
        return "Bs";
      case "brl":
        return "R$";
      case "bsd":
        return "B$";
      case "btn":
        return "Nu.";
      case "bwp":
        return "P";
      case "byn":
        return "Br";
      case "bzd":
        return "BZ$";
      case "cad":
        return "$";
      case "cdf":
        return "FC";
      case "chf":
        return "Fr";
      case "clf":
        return "UF";
      case "clp":
        return "$";
      case "cny":
        return "\xA5";
      case "cop":
        return "$";
      case "crc":
        return "\u20A1";
      case "cuc":
        return "CUC$";
      case "cup":
        return "CUP$";
      case "cve":
        return "$";
      case "czk":
        return "K\u010D";
      case "djf":
        return "Fdj";
      case "dkk":
        return "kr";
      case "dop":
        return "RD$";
      case "dzd":
        return "\u062F\u062C";
      case "egp":
        return "E\xA3";
      case "ern":
        return "Nfk";
      case "etb":
        return "Br";
      case "eur":
        return "\u20AC";
      case "fjd":
        return "FJ$";
      case "fkp":
        return "\xA3";
      case "fok":
        return "F$";
      case "gbp":
        return "\xA3";
      case "gel":
        return "\u20BE";
      case "ghc":
        return "\u20B5";
      case "gip":
        return "\xA3";
      case "gmd":
        return "D";
      case "gnf":
        return "FG";
      case "gtq":
        return "Q";
      case "gyd":
        return "GY$";
      case "hkd":
        return "HK$";
      case "hnl":
        return "L";
      case "hrk":
        return "kn";
      case "htg":
        return "G";
      case "huf":
        return "Ft";
      case "idr":
        return "Rp";
      case "ils":
        return "\u20AA";
      case "inr":
        return "\u20B9";
      case "iqd":
        return "\u062F.\u0639";
      case "irr":
        return "\uFDFC";
      case "isk":
        return "kr";
      case "jmd":
        return "J$";
      case "jod":
        return "JD";
      case "jpy":
        return "\xA5";
      case "kes":
        return "Ksh";
      case "kgs":
        return "\u0441";
      case "khr":
        return "\u17DB";
      case "kmf":
        return "CF";
      case "kpw":
        return "\u20A9";
      case "krw":
        return "\u20A9";
      case "kwd":
        return "KD";
      case "kyd":
        return "CI$";
      case "kzt":
        return "\u20B8";
      case "lak":
        return "\u20AD";
      case "lbp":
        return "L\xA3";
      case "lkr":
        return "Rs";
      case "lrd":
        return "L$";
      case "lsl":
        return "L";
      case "lyd":
        return "\u0644.\u062F";
      case "mad":
        return "\u062F.\u0645.";
      case "mdl":
        return "L";
      case "mnt":
        return "\u20AE";
      case "mop":
        return "MOP$";
      case "mur":
        return "Rs";
      case "mvr":
        return "Rf";
      case "mwk":
        return "MK";
      case "mxn":
        return "$";
      case "myr":
        return "RM";
      case "mzn":
        return "MTn";
      case "nad":
        return "N$";
      case "ngn":
        return "\u20A6";
      case "nio":
        return "C$";
      case "nok":
        return "kr";
      case "npr":
        return "\u0930\u0942";
      case "nzd":
        return "$";
      case "omr":
        return "\u0631.\u0639.";
      case "pab":
        return "B/.";
      case "pen":
        return "S/.";
      case "pgk":
        return "K";
      case "php":
        return "\u20B1";
      case "pkr":
        return "Rs";
      case "pln":
        return "z\u0142";
      case "pyg":
        return "\u20B2";
      case "qar":
        return "\u0631.\u0642";
      case "ron":
        return "lei";
      case "rsd":
        return "din.";
      case "rub":
        return "\u20BD";
      case "rwf":
        return "FRw";
      case "sar":
        return "\u0631.\u0633";
      case "sbd":
        return "SI$";
      case "scr":
        return "Sr";
      case "sdg":
        return "\u062C.\u0633.";
      case "sek":
        return "kr";
      case "sgd":
        return "S$";
      case "shp":
        return "\xA3";
      case "sll":
        return "Le";
      case "sos":
        return "S";
      case "srd":
        return "SRD$";
      case "ssp":
        return "\xA3";
      case "std":
        return "Db";
      case "sek":
        return "kr";
      case "syp":
        return "S\xA3";
      case "szl":
        return "L";
      case "thb":
        return "\u0E3F";
      case "tjs":
        return "\u0405\u041C";
      case "tmt":
        return "m";
      case "tnd":
        return "\u062F.\u062A";
      case "top":
        return "T$";
      case "try":
        return "\u20BA";
      case "ttd":
        return "TT$";
      case "twd":
        return "NT$";
      case "tzs":
        return "TSh";
      case "uah":
        return "\u20B4";
      case "ugx":
        return "USh";
      case "usd":
        return "$";
      case "uyu":
        return "$U";
      case "uzs":
        return "\u043B\u0432";
      case "ves":
        return "Bs.S.";
      case "vnd":
        return "\u20AB";
      case "vuv":
        return "VT";
      case "wst":
        return "WS$";
      case "xaf":
        return "FCFA";
      case "xcd":
        return "EC$";
      case "xof":
        return "CFA";
      case "xpf":
        return "CFP";
      case "yer":
        return "\uFDFC";
      case "zar":
        return "R";
      case "zmw":
        return "ZK";
    }
    return null;
  },
  // Try a compiled js cache using the /tmp/
  get_compiled_cache(domain, method, endpoint) {
    const cache_path = new vlib.Path(`/tmp/${domain.replaceAll("/", "")}:${method}:${endpoint.replaceAll("/", "_")}`);
    let cache_data, cache_hash;
    if (cache_path.exists()) {
      cache_data = cache_path.load_sync();
      cache_hash = new vlib.Path(cache_path.str() + ".hash").load_sync();
    }
    return { cache_path, cache_hash, cache_data };
  },
  // @todo
  set_compiled_cache(path, data, hash) {
    path.save_sync(data);
    new vlib.Path(path.str() + ".hash").save_sync(hash);
  }
};
var stdin_default = Utils;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ExternalError,
  InternalError,
  Utils,
  utils
});
