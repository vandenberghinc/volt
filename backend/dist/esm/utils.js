/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
import * as vlib from "@vandenberghinc/vlib";
import { Status } from "./status.js";
// ---------------------------------------------------------
// Utils.
/**
 * The base class for internal and external errors.
 */
class BaseError extends Error {
    type;
    status;
    data;
    invalid_fields;
    constructor({ type = "APIError", message, status, data, invalid_fields }) {
        super(message);
        this.name = "APIError";
        this.type = type;
        this.status = status ?? Status.internal_server_error;
        this.data = data;
        this.invalid_fields = invalid_fields ?? {};
    }
    serve(stream) {
        stream.error({
            status: this.status ?? Status.internal_server_error,
            headers: { "Content-Type": "application/json" },
            message: this.message,
            type: this.type,
            invalid_fields: this.invalid_fields,
        });
        return this;
    }
}
/**
 * Thrown external errors are presented to the user.
 */
export class ExternalError extends BaseError {
    constructor(args) {
        args.type ??= "ExternalError";
        super(args);
    }
    serve(stream) {
        stream.error({
            status: this.status ?? Status.internal_server_error,
            headers: { "Content-Type": "application/json" },
            message: this.message,
            type: this.type,
            invalid_fields: this.invalid_fields,
        });
        return this;
    }
}
/**
 * Thrown internal errors are not presented to the user, isntead an internal server error message is shown.
 */
export class InternalError extends BaseError {
    constructor(args) {
        args.type ??= "InternalError";
        super(args);
    }
    serve(stream) {
        stream.error({
            status: Status.internal_server_error,
            headers: { "Content-Type": "application/json" },
            message: "Internal Server Error",
            type: "InternalServerError",
        });
        return this;
    }
}
// Implementation
export const Utils = {
    // An error that may be shown to the frontend user.
    "APIError": ExternalError,
    // Fill templates {{TEMPLATE}}
    fill_templates(data, templates, curly_style = true) {
        if (templates == null) {
            return data;
        }
        const keys = Object.keys(templates);
        // Iterate data.
        if (keys.length > 0) {
            for (let i = 0; i < data.length; i++) {
                // {{TEMPLATE}} Curly style.
                if (curly_style && data.charAt(i) === "{" && data.charAt(i + 1) === "{") {
                    // Iterate all templates.  
                    for (let k = 0; k < keys.length; k++) {
                        if (data.charAt(i + keys[k].length + 2) === "}" &&
                            data.charAt(i + keys[k].length + 3) === "}" &&
                            data.startsWith(keys[k], i + 2)) {
                            const end_index = i + keys[k].length + 4;
                            if (templates[keys[k]] != null && typeof templates[keys[k]] === "object") {
                                data = vlib.String.replace_indices(data, JSON.stringify(templates[keys[k]]), i, end_index);
                            }
                            else {
                                data = vlib.String.replace_indices(data, templates[keys[k]], i, end_index);
                            }
                            i = end_index - 1;
                        }
                    }
                }
                // $TEMPLATE dollar style.
                else if (!curly_style && data.charAt(i) === "$") {
                    // Iterate all templates.  
                    for (let k = 0; k < keys.length; k++) {
                        if (data.startsWith(keys[k], i + 1)) {
                            const end_index = i + keys[k].length + 1;
                            if (templates[keys[k]] != null && typeof templates[keys[k]] === "object") {
                                data = vlib.String.replace_indices(data, JSON.stringify(templates[keys[k]]), i, end_index);
                            }
                            else {
                                data = vlib.String.replace_indices(data, templates[keys[k]], i, end_index);
                            }
                            i = end_index - 1;
                        }
                    }
                }
            }
        }
        // Response.
        return data;
    },
    // Utils.
    get_currency_symbol(currency) {
        switch (currency.toLowerCase()) {
            case "aed": return "د.إ";
            case "afn": return "Af";
            case "all": return "L";
            case "amd": return "֏";
            case "ang": return "ƒ";
            case "aoa": return "Kz";
            case "ars": return "$";
            case "aud": return "$";
            case "awg": return "ƒ";
            case "azn": return "₼";
            case "bam": return "KM";
            case "bbd": return "Bds$";
            case "bdt": return "৳";
            case "bgn": return "лв";
            case "bhd": return ".د.ب";
            case "bif": return "FBu";
            case "bmd": return "BD$";
            case "bnd": return "B$";
            case "bob": return "Bs";
            case "brl": return "R$";
            case "bsd": return "B$";
            case "btn": return "Nu.";
            case "bwp": return "P";
            case "byn": return "Br";
            case "bzd": return "BZ$";
            case "cad": return "$";
            case "cdf": return "FC";
            case "chf": return "Fr";
            case "clf": return "UF";
            case "clp": return "$";
            case "cny": return "¥";
            case "cop": return "$";
            case "crc": return "₡";
            case "cuc": return "CUC$";
            case "cup": return "CUP$";
            case "cve": return "$";
            case "czk": return "Kč";
            case "djf": return "Fdj";
            case "dkk": return "kr";
            case "dop": return "RD$";
            case "dzd": return "دج";
            case "egp": return "E£";
            case "ern": return "Nfk";
            case "etb": return "Br";
            case "eur": return "€";
            case "fjd": return "FJ$";
            case "fkp": return "£";
            case "fok": return "F$";
            case "gbp": return "£";
            case "gel": return "₾";
            case "ghc": return "₵";
            case "gip": return "£";
            case "gmd": return "D";
            case "gnf": return "FG";
            case "gtq": return "Q";
            case "gyd": return "GY$";
            case "hkd": return "HK$";
            case "hnl": return "L";
            case "hrk": return "kn";
            case "htg": return "G";
            case "huf": return "Ft";
            case "idr": return "Rp";
            case "ils": return "₪";
            case "inr": return "₹";
            case "iqd": return "د.ع";
            case "irr": return "﷼";
            case "isk": return "kr";
            case "jmd": return "J$";
            case "jod": return "JD";
            case "jpy": return "¥";
            case "kes": return "Ksh";
            case "kgs": return "с";
            case "khr": return "៛";
            case "kmf": return "CF";
            case "kpw": return "₩";
            case "krw": return "₩";
            case "kwd": return "KD";
            case "kyd": return "CI$";
            case "kzt": return "₸";
            case "lak": return "₭";
            case "lbp": return "L£";
            case "lkr": return "Rs";
            case "lrd": return "L$";
            case "lsl": return "L";
            case "lyd": return "ل.د";
            case "mad": return "د.م.";
            case "mdl": return "L";
            case "mnt": return "₮";
            case "mop": return "MOP$";
            case "mur": return "Rs";
            case "mvr": return "Rf";
            case "mwk": return "MK";
            case "mxn": return "$";
            case "myr": return "RM";
            case "mzn": return "MTn";
            case "nad": return "N$";
            case "ngn": return "₦";
            case "nio": return "C$";
            case "nok": return "kr";
            case "npr": return "रू";
            case "nzd": return "$";
            case "omr": return "ر.ع.";
            case "pab": return "B/.";
            case "pen": return "S/.";
            case "pgk": return "K";
            case "php": return "₱";
            case "pkr": return "Rs";
            case "pln": return "zł";
            case "pyg": return "₲";
            case "qar": return "ر.ق";
            case "ron": return "lei";
            case "rsd": return "din.";
            case "rub": return "₽";
            case "rwf": return "FRw";
            case "sar": return "ر.س";
            case "sbd": return "SI$";
            case "scr": return "Sr";
            case "sdg": return "ج.س.";
            case "sek": return "kr";
            case "sgd": return "S$";
            case "shp": return "£";
            case "sll": return "Le";
            case "sos": return "S";
            case "srd": return "SRD$";
            case "ssp": return "£";
            case "std": return "Db";
            case "sek": return "kr";
            case "syp": return "S£";
            case "szl": return "L";
            case "thb": return "฿";
            case "tjs": return "ЅМ";
            case "tmt": return "m";
            case "tnd": return "د.ت";
            case "top": return "T$";
            case "try": return "₺";
            case "ttd": return "TT$";
            case "twd": return "NT$";
            case "tzs": return "TSh";
            case "uah": return "₴";
            case "ugx": return "USh";
            case "usd": return "$";
            case "uyu": return "$U";
            case "uzs": return "лв";
            case "ves": return "Bs.S.";
            case "vnd": return "₫";
            case "vuv": return "VT";
            case "wst": return "WS$";
            case "xaf": return "FCFA";
            case "xcd": return "EC$";
            case "xof": return "CFA";
            case "xpf": return "CFP";
            case "yer": return "﷼";
            case "zar": return "R";
            case "zmw": return "ZK";
        }
        return null;
    },
    // Try a compiled js cache using the /tmp/
    get_compiled_cache(domain, method, endpoint) {
        const cache_path = new vlib.Path(`/tmp/${domain.replaceAll("/", "")}:${method}:${endpoint.replaceAll("/", "_")}`);
        let cache_data, cache_hash;
        if (cache_path.exists()) {
            cache_data = cache_path.load_sync();
            cache_hash = new vlib.Path(cache_path.str() + '.hash').load_sync();
        }
        return { cache_path, cache_hash, cache_data };
    },
    // @todo
    set_compiled_cache(path, data, hash) {
        path.save_sync(data);
        new vlib.Path(path.str() + '.hash').save_sync(hash);
    },
};
export { Utils as utils }; // lowercase export for compatibility
export default Utils;
