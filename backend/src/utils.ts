/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports.

import * as libcrypto from "crypto";
import * as vlib from "@vandenberghinc/vlib";
import { Status } from "./status.js";
import type { Stream } from "./stream.js";

// ---------------------------------------------------------
// Utils.

/**
 * The base class for internal and external errors.
 */
class BaseError extends Error {
    public type: string;
    public status: number;
    public data?: any[] | Record<string, any>;
    public invalid_fields: Record<string, string>;
    constructor({ type = "APIError", message, status, data, invalid_fields }: {
        type?: string,
        message: string,
        status?: number,
        data?: any,
        invalid_fields?: Record<string, string>,
    }) {
        super(message);
        this.name = "APIError";
        this.type = type;
        this.status = status ?? Status.internal_server_error;
        this.data = data;
        this.invalid_fields = invalid_fields ?? {};
    }
    serve(stream: Stream) {
        stream.error({
            status: this.status ?? Status.internal_server_error, 
            headers: {"Content-Type": "application/json"},
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
    constructor(args: ConstructorParameters<typeof BaseError>[0]) {
        args.type ??= "ExternalError";
        super(args);
    }
    serve(stream: Stream) {
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
    constructor(args: ConstructorParameters<typeof BaseError>[0]) {
        args.type ??= "InternalError";
        super(args);
    }
    serve(stream: Stream) {
        stream.error({
            status: Status.internal_server_error,
            headers: { "Content-Type": "application/json" },
            message: "Internal Server Error",
            type: "InternalServerError",
        });
        return this;
    }
}

/*  @docs:
 *  @nav: Backend
    @parent: Utils
    @chapter: Exceptions
    @title: Frontend Error
    @description: 
        The frontend error class can be used to throw an error that will be presented to the user. All other errors will result in an internal server error response without the error's message.
    @usage:
        throw new volt.FrontendError("Some error occured.");
        throw new volt.FrontendError("Bad request.", volt.status.bad_request);
    @param:
        @name: message
        @descr: The error message.
        @type: string
    @param:
        @name: status
        @descr: The http error status.
        @type: number
    @param:
        @name: data
        @descr: The error body data.
        @type: any
 */
// export class FrontendError extends Error {
//     public name: string;
//     public status?: number;
//     public data?: any;
//     public invalid_fields: Record<string, string> = {};
//     constructor(message: string, status?: number, data?: any, invalid_fields?: Record<string, string>) {
//         super(message);
//         this.name = "FrontendError";
//         this.status = status;
//         this.data = data;
//         if (invalid_fields !== undefined) {
//             this.invalid_fields = invalid_fields;
//         }
//     }
// }

/*  @docs:
 *  @nav: Backend
    @parent: Utils
    @chapter: Exceptions
    @title: API Error
    @description: 
        The api error class can be used to throw an error that will be presented to the user. All other errors will result in an internal server error response without the error's message.
    @usage:
        throw new volt.APIError("Some error occured.");
        throw new volt.APIError("Bad request.", volt.status.bad_request);
    @param:
        @name: message
        @descr: The error message.
        @type: string
    @param:
        @name: status
        @descr: The http error status.
        @type: number
    @param:
        @name: data
        @descr: The error body data.
        @type: any
 */
// export class APIError extends FrontendError {
//     constructor(message: string, status?: number, data?: any, invalid_fields?: Record<string, string>) {
//         super(message, status, data, invalid_fields);
//         this.name = "APIError";
//     }
// }

// Define interface with overloads
interface UtilsInt {
    "APIError": typeof ExternalError;  // Replace with actual type
    
    fill_templates(data: string, templates: Record<string, any>, curly_style?: boolean): string;
    get_currency_symbol(currency: string): string | null;
    get_compiled_cache(domain: string, method: string, endpoint: string): { cache_path: any, cache_hash: any, cache_data: any };
    set_compiled_cache(path: any, data: string, hash: string): void;
}

// Implementation
export const Utils: UtilsInt = {

    // An error that may be shown to the frontend user.
    "APIError": ExternalError,

    // Fill templates {{TEMPLATE}}
    fill_templates(data: string, templates: Record<string, any>, curly_style: boolean = true): string {
        if (templates == null) { return data; }
        const keys = Object.keys(templates);

        // Iterate data.
        if (keys.length > 0) {
            for (let i = 0; i < data.length; i++) {

                // {{TEMPLATE}} Curly style.
                if (curly_style && data.charAt(i) === "{" && data.charAt(i + 1) === "{") {

                    // Iterate all templates.  
                    for (let k = 0; k < keys.length; k++) {
                        if (
                            data.charAt(i + keys[k].length + 2) === "}" && 
                            data.charAt(i + keys[k].length + 3) === "}" && 
                            data.startsWith(keys[k], i + 2)
                        ) {
                            const end_index = i + keys[k].length + 4;
                            if (templates[keys[k]] != null && typeof templates[keys[k]] === "object") {
                                data = vlib.String.replace_indices(data, JSON.stringify(templates[keys[k]]), i, end_index);
                            } else {
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
                        if (
                            data.startsWith(keys[k], i + 1)
                        ) {
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

        // Response.
        return data;
    },

    // Utils.
    get_currency_symbol(currency: string): string | null {
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
    get_compiled_cache(domain: string, method: string, endpoint: string) {
        const cache_path = new vlib.Path(`/tmp/${domain.replaceAll("/", "")}:${method}:${endpoint.replaceAll("/", "_")}`);
        let cache_data, cache_hash;
        if (cache_path.exists()) {
            cache_data = cache_path.load_sync();
            cache_hash = new vlib.Path(cache_path.str() + '.hash').load_sync();
        }
        return {cache_path, cache_hash, cache_data};
    },
    // @todo
    set_compiled_cache(path: any, data: string, hash: string): void {
        path.save_sync(data);
        new vlib.Path(path.str() + '.hash').save_sync(hash);
    },

}
export { Utils as utils }; // lowercase export for compatibility
export default Utils;