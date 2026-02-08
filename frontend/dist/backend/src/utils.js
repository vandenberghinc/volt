/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
// ---------------------------------------------------------
// Imports.
import * as vlib from "@vandenberghinc/vlib";
// ---------------------------------------------------------
// Utils.
// Implementation
export var Utils;
(function (Utils) {
    // Fill templates {{TEMPLATE}}
    function fill_templates(data, templates, curly_style = true) {
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
    }
    Utils.fill_templates = fill_templates;
    /** Content type per mime. */
    const content_type_mimes = new Map([
        [".html", "text/html"],
        [".htm", "text/html"],
        [".shtml", "text/html"],
        [".css", "text/css"],
        [".xml", "application/xml"],
        [".gif", "image/gif"],
        [".jpeg", "image/jpeg"],
        [".jpg", "image/jpeg"],
        [".js", "application/javascript"],
        [".ts", "application/typescript"],
        [".atom", "application/atom+xml"],
        [".rss", "application/rss+xml"],
        [".mml", "text/mathml"],
        [".txt", "text/plain"],
        [".jad", "text/vnd.sun.j2me.app-descriptor"],
        [".wml", "text/vnd.wap.wml"],
        [".htc", "text/x-component"],
        [".png", "image/png"],
        [".tif", "image/tiff"],
        [".tiff", "image/tiff"],
        [".wbmp", "image/vnd.wap.wbmp"],
        [".ico", "image/x-icon"],
        [".jng", "image/x-jng"],
        [".bmp", "image/x-ms-bmp"],
        [".svg", "image/svg+xml"],
        [".svgz", "image/svg+xml"],
        [".webp", "image/webp"],
        [".woff", "font/woff"],
        [".woff2", "font/woff2"],
        [".jar", "application/java-archive"],
        [".war", "application/java-archive"],
        [".ear", "application/java-archive"],
        [".json", "application/json"],
        [".hqx", "application/mac-binhex40"],
        [".doc", "application/msword"],
        [".pdf", "application/pdf"],
        [".ps", "application/postscript"],
        [".eps", "application/postscript"],
        [".ai", "application/postscript"],
        [".rtf", "application/rtf"],
        [".m3u8", "application/vnd.apple.mpegurl"],
        [".xls", "application/vnd.ms-excel"],
        [".eot", "application/vnd.ms-fontobject"],
        [".ppt", "application/vnd.ms-powerpoint"],
        [".wmlc", "application/vnd.wap.wmlc"],
        [".kml", "application/vnd.google-earth.kml+xml"],
        [".kmz", "application/vnd.google-earth.kmz"],
        [".7z", "application/x-7z-compressed"],
        [".cco", "application/x-cocoa"],
        [".jardiff", "application/x-java-archive-diff"],
        [".jnlp", "application/x-java-jnlp-file"],
        [".run", "application/x-makeself"],
        [".pl", "application/x-perl"],
        [".pm", "application/x-perl"],
        [".prc", "application/x-pilot"],
        [".pdb", "application/x-pilot"],
        [".rar", "application/x-rar-compressed"],
        [".rpm", "application/x-redhat-package-manager"],
        [".sea", "application/x-sea"],
        [".swf", "application/x-shockwave-flash"],
        [".sit", "application/x-stuffit"],
        [".tcl", "application/x-tcl"],
        [".tk", "application/x-tcl"],
        [".der", "application/x-x509-ca-cert"],
        [".pem", "application/x-x509-ca-cert"],
        [".crt", "application/x-x509-ca-cert"],
        [".xpi", "application/x-xpinstall"],
        [".xhtml", "application/xhtml+xml"],
        [".xspf", "application/xspf+xml"],
        [".zip", "application/zip"],
        [".bin", "application/octet-stream"],
        [".exe", "application/octet-stream"],
        [".dll", "application/octet-stream"],
        [".deb", "application/octet-stream"],
        [".dmg", "application/octet-stream"],
        [".iso", "application/octet-stream"],
        [".img", "application/octet-stream"],
        [".msi", "application/octet-stream"],
        [".msp", "application/octet-stream"],
        [".msm", "application/octet-stream"],
        [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
        [".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
        [".mid", "audio/midi"],
        [".midi", "audio/midi"],
        [".kar", "audio/midi"],
        [".mp3", "audio/mpeg"],
        [".ogg", "audio/ogg"],
        [".m4a", "audio/x-m4a"],
        [".ra", "audio/x-realaudio"],
        [".3gpp", "video/3gpp"],
        [".3gp", "video/3gpp"],
        // [".ts", "video/mp2t"],
        [".mp4", "video/mp4"],
        [".mpeg", "video/mpeg"],
        [".mpg", "video/mpeg"],
        [".mov", "video/quicktime"],
        [".webm", "video/webm"],
        [".flv", "video/x-flv"],
        [".m4v", "video/x-m4v"],
        [".mng", "video/x-mng"],
        [".asx", "video/x-ms-asf"],
        [".asf", "video/x-ms-asf"],
        [".wmv", "video/x-ms-wmv"],
        [".avi", "video/x-msvideo"],
    ]);
    /** Get the mime type by file extension. */
    function mime_type(extension) {
        const ext = extension.startsWith(".") ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
        if (content_type_mimes.has(ext)) {
            return content_type_mimes.get(ext);
        }
        return null;
    }
    Utils.mime_type = mime_type;
    /** All file path extensions that are already compressed. */
    const compressed_extensions = new Set([
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".bmp",
        ".tiff",
        ".ico",
        // ".svg",
        ".svgz",
        ".mng",
        ".apng",
        ".jfif",
        ".jp2",
        ".jpx",
        ".j2k",
        ".jpm",
        ".jpf",
        ".heif",
        ".mp3",
        ".ogg",
        ".wav",
        ".flac",
        ".m4a",
        ".aac",
        ".wma",
        ".ra",
        ".mid",
        ".mp4",
        ".webm",
        ".mkv",
        ".mov",
        ".avi",
        ".wmv",
        ".mpg",
        ".mpeg",
        ".flv",
    ]);
    /** Check if a file extension is compressed. */
    function is_compressed_extension(extension) {
        const ext = extension.startsWith(".") ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
        return compressed_extensions.has(ext);
    }
    Utils.is_compressed_extension = is_compressed_extension;
    // Compressed content type.
    const compressed_content_types = new Set([
        // Image formats (often already compressed)
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/tiff",
        "image/vnd.microsoft.icon", // ICO
        // Audio formats (usually compressed)
        "audio/mpeg", // MP3
        "audio/mp3",
        "audio/ogg",
        "audio/wav",
        "audio/x-wav",
        "audio/flac",
        "audio/aac",
        "audio/midi",
        // Video formats (typically compressed)
        "video/mp4",
        "video/mpeg",
        "video/ogg",
        "video/webm",
        "video/x-msvideo", // AVI
        "video/quicktime", // MOV
        // Archive / Compressed file formats
        "application/zip",
        "application/x-7z-compressed",
        "application/x-rar-compressed",
        "application/x-tar",
        "application/gzip",
        "application/x-gzip",
        "application/x-bzip",
        "application/x-bzip2",
        "application/x-xz",
        // Documents that are usually compressed internally
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        // Font files
        "font/woff",
        "font/woff2",
        "application/font-sfnt",
        "application/vnd.ms-fontobject",
        // Other binary data
        "application/octet-stream",
    ]);
    /** Check if a content type is compressed. */
    function is_compressed_content_type(content_type) {
        return compressed_content_types.has(content_type.toLowerCase().split(";")[0]);
    }
    Utils.is_compressed_content_type = is_compressed_content_type;
    // ---------------------------------------
    // DEPRECATED
    // Utils.
    function get_currency_symbol(currency) {
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
    }
    Utils.get_currency_symbol = get_currency_symbol;
    // Try a compiled js cache using the /tmp/
    function get_compiled_cache(domain, method, endpoint) {
        const cache_path = new vlib.Path(`/tmp/${domain.replaceAll("/", "")}:${method}:${endpoint.replaceAll("/", "_")}`);
        let cache_data, cache_hash;
        if (cache_path.exists()) {
            cache_data = cache_path.load_sync();
            cache_hash = new vlib.Path(cache_path.str() + '.hash').load_sync();
        }
        return { cache_path, cache_hash, cache_data };
    }
    Utils.get_compiled_cache = get_compiled_cache;
    // @todo
    function set_compiled_cache(path, data, hash) {
        path.save_sync(data);
        new vlib.Path(path.str() + '.hash').save_sync(hash);
    }
    Utils.set_compiled_cache = set_compiled_cache;
})(Utils || (Utils = {}));
export { Utils as utils }; // lowercase export for compatibility
