export class FrontendError extends Error {
    constructor(message: any, status?: null, data?: null);
    status: any;
    data: any;
}
declare const APIError_base: {
    new (message: any, status?: null, data?: null): {
        name: string;
        status: any;
        data: any;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
    prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
    stackTraceLimit: number;
};
export class APIError extends APIError_base {
}
export declare function clean_endpoint(endpoint: any): any;
export declare function fill_templates(data: any, templates: any, curly_style?: boolean): any;
export declare function get_currency_symbol(currency: any): "$" | "L" | "R" | "د.إ" | "Af" | "֏" | "ƒ" | "Kz" | "₼" | "KM" | "Bds$" | "৳" | "лв" | ".د.ب" | "FBu" | "BD$" | "B$" | "Bs" | "R$" | "Nu." | "P" | "Br" | "BZ$" | "FC" | "Fr" | "UF" | "¥" | "₡" | "CUC$" | "CUP$" | "Kč" | "Fdj" | "kr" | "RD$" | "دج" | "E£" | "Nfk" | "€" | "FJ$" | "£" | "F$" | "₾" | "₵" | "D" | "FG" | "Q" | "GY$" | "HK$" | "kn" | "G" | "Ft" | "Rp" | "₪" | "₹" | "د.ع" | "﷼" | "J$" | "JD" | "Ksh" | "с" | "៛" | "CF" | "₩" | "KD" | "CI$" | "₸" | "₭" | "L£" | "Rs" | "L$" | "ل.د" | "د.م." | "₮" | "MOP$" | "Rf" | "MK" | "RM" | "MTn" | "N$" | "₦" | "C$" | "रू" | "ر.ع." | "B/." | "S/." | "K" | "₱" | "zł" | "₲" | "ر.ق" | "lei" | "din." | "₽" | "FRw" | "ر.س" | "SI$" | "Sr" | "ج.س." | "S$" | "Le" | "S" | "SRD$" | "Db" | "S£" | "฿" | "ЅМ" | "m" | "د.ت" | "T$" | "₺" | "TT$" | "NT$" | "TSh" | "₴" | "USh" | "$U" | "Bs.S." | "₫" | "VT" | "WS$" | "FCFA" | "EC$" | "CFA" | "CFP" | "ZK" | null;
export declare function get_compiled_cache(domain: any, method: any, endpoint: any): {
    cache_path: any;
    cache_hash: any;
    cache_data: any;
};
export declare function set_compiled_cache(path: any, data: any, hash: any): void;
export {};
