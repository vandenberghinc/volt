/*
 * @author: Daan van den Bergh
 * @copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Utils } from "./utils";
import { User } from "./user";
import { 
    HStack, 
    VStack, 
    Text, 
    Title, 
    ForEach, 
    Image,
    ImageMask, 
    RingLoader,
    BorderButton,
    LoaderButton, 
    Divider, 
    Input, 
    Spacer, 
    Link, 
    CheckBox,
    Form,
    ExtendedSelect,
    ExtendedInput,
    Popup,
} from "../vweb";

// Declare global variables or external libraries if necessary.
declare const Paddle: any;

// ---------------------------------------------------------
// Payments Object.

const Payments = {
    // ---------------------------------------------------------
    // Private Properties.

    client_key: "{{PADDLE_CLIENT_KEY}}",
    // @ts-ignore
    sandbox: "{{PADDLE_SANDBOX}}" === "true",
    // @ts-ignore
    tax_inclusive: "{{PADDLE_INCLUSIVE_TAX}}" === "true",
    countries: {
        "AD": { name: "🇦🇩 Andorra", calling_code: "+376" },
        "AE": { name: "🇦🇪 United Arab Emirates", calling_code: "+971" },
        "AF": { name: "🇦🇫 Afghanistan", calling_code: "+93" },
        "AG": { name: "🇦🇬 Antigua and Barbuda", calling_code: "+1-268" },
        "AI": { name: "🇦🇮 Anguilla", calling_code: "+1-264" },
        "AL": { name: "🇦🇱 Albania", calling_code: "+355" },
        "AM": { name: "🇦🇲 Armenia", calling_code: "+374" },
        "AO": { name: "🇦🇴 Angola", calling_code: "+244" },
        "AQ": { name: "🇦🇶 Antarctica", calling_code: "+672" },
        "AR": { name: "🇦🇷 Argentina", calling_code: "+54" },
        "AS": { name: "🇦🇸 American Samoa", calling_code: "+1-684" },
        "AT": { name: "🇦🇹 Austria", calling_code: "+43" },
        "AU": { name: "🇦🇺 Australia", calling_code: "+61" },
        "AW": { name: "🇦🇼 Aruba", calling_code: "+297" },
        "AX": { name: "🇦🇽 Åland Islands", calling_code: "+358-18" },
        "AZ": { name: "🇦🇿 Azerbaijan", calling_code: "+994" },
        "BA": { name: "🇧🇦 Bosnia and Herzegovina", calling_code: "+387" },
        "BB": { name: "🇧🇧 Barbados", calling_code: "+1-246" },
        "BD": { name: "🇧🇩 Bangladesh", calling_code: "+880" },
        "BE": { name: "🇧🇪 Belgium", calling_code: "+32" },
        "BF": { name: "🇧🇫 Burkina Faso", calling_code: "+226" },
        "BG": { name: "🇧🇬 Bulgaria", calling_code: "+359" },
        "BH": { name: "🇧🇭 Bahrain", calling_code: "+973" },
        "BI": { name: "🇧🇮 Burundi", calling_code: "+257" },
        "BJ": { name: "🇧🇯 Benin", calling_code: "+229" },
        "BL": { name: "🇧🇱 Saint Barthélemy", calling_code: "+590" },
        "BM": { name: "🇧🇲 Bermuda", calling_code: "+1-441" },
        "BN": { name: "🇧🇳 Brunei", calling_code: "+673" },
        "BO": { name: "🇧🇴 Bolivia", calling_code: "+591" },
        "BQ": { name: "🇧🇶 Caribbean Netherlands", calling_code: "+599" },
        "BR": { name: "🇧🇷 Brazil", calling_code: "+55" },
        "BS": { name: "🇧🇸 Bahamas", calling_code: "+1-242" },
        "BT": { name: "🇧🇹 Bhutan", calling_code: "+975" },
        "BV": { name: "🇧🇻 Bouvet Island", calling_code: "+47" },
        "BW": { name: "🇧🇼 Botswana", calling_code: "+267" },
        "BY": { name: "🇧🇾 Belarus", calling_code: "+375" },
        "BZ": { name: "🇧🇿 Belize", calling_code: "+501" },
        "CA": { name: "🇨🇦 Canada", calling_code: "+1" },
        "CC": { name: "🇨🇨 Cocos (Keeling) Islands", calling_code: "+61" },
        "CD": { name: "🇨🇩 Congo (DRC)", calling_code: "+243" },
        "CF": { name: "🇨🇫 Central African Republic", calling_code: "+236" },
        "CG": { name: "🇨🇬 Congo (Republic)", calling_code: "+242" },
        "CH": { name: "🇨🇭 Switzerland", calling_code: "+41" },
        "CI": { name: "🇨🇮 Côte d'Ivoire", calling_code: "+225" },
        "CK": { name: "🇨🇰 Cook Islands", calling_code: "+682" },
        "CL": { name: "🇨🇱 Chile", calling_code: "+56" },
        "CM": { name: "🇨🇲 Cameroon", calling_code: "+237" },
        "CN": { name: "🇨🇳 China", calling_code: "+86" },
        "CO": { name: "🇨🇴 Colombia", calling_code: "+57" },
        "CR": { name: "🇨🇷 Costa Rica", calling_code: "+506" },
        "CU": { name: "🇨🇺 Cuba", calling_code: "+53" },
        "CV": { name: "🇨🇻 Cape Verde", calling_code: "+238" },
        "CW": { name: "🇨🇼 Curaçao", calling_code: "+599" },
        "CX": { name: "🇨🇽 Christmas Island", calling_code: "+61" },
        "CY": { name: "🇨🇾 Cyprus", calling_code: "+357" },
        "CZ": { name: "🇨🇿 Czech Republic", calling_code: "+420" },
        "DE": { name: "🇩🇪 Germany", calling_code: "+49" },
        "DJ": { name: "🇩🇯 Djibouti", calling_code: "+253" },
        "DK": { name: "🇩🇰 Denmark", calling_code: "+45" },
        "DM": { name: "🇩🇲 Dominica", calling_code: "+1-767" },
        "DO": { name: "🇩🇴 Dominican Republic", calling_code: "+1-809" },
        "DZ": { name: "🇩🇿 Algeria", calling_code: "+213" },
        "EC": { name: "🇪🇨 Ecuador", calling_code: "+593" },
        "EE": { name: "🇪🇪 Estonia", calling_code: "+372" },
        "EG": { name: "🇪🇬 Egypt", calling_code: "+20" },
        "EH": { name: "🇪🇭 Western Sahara", calling_code: "+212" },
        "ER": { name: "🇪🇷 Eritrea", calling_code: "+291" },
        "ES": { name: "🇪🇸 Spain", calling_code: "+34" },
        "ET": { name: "🇪🇹 Ethiopia", calling_code: "+251" },
        "FI": { name: "🇫🇮 Finland", calling_code: "+358" },
        "FJ": { name: "🇫🇯 Fiji", calling_code: "+679" },
        "FK": { name: "🇫🇰 Falkland Islands (Malvinas)", calling_code: "+500" },
        "FM": { name: "🇫🇲 Micronesia", calling_code: "+691" },
        "FO": { name: "🇫🇴 Faroe Islands", calling_code: "+298" },
        "FR": { name: "🇫🇷 France", calling_code: "+33" },
        "GA": { name: "🇬🇦 Gabon", calling_code: "+241" },
        "GB": { name: "🇬🇧 United Kingdom", calling_code: "+44" },
        "GD": { name: "🇬🇩 Grenada", calling_code: "+1-473" },
        "GE": { name: "🇬🇪 Georgia", calling_code: "+995" },
        "GF": { name: "🇬🇫 French Guiana", calling_code: "+594" },
        "GG": { name: "🇬🇬 Guernsey", calling_code: "+44" },
        "GH": { name: "🇬🇭 Ghana", calling_code: "+233" },
        "GI": { name: "🇬🇮 Gibraltar", calling_code: "+350" },
        "GL": { name: "🇬🇱 Greenland", calling_code: "+299" },
        "GM": { name: "🇬🇲 Gambia", calling_code: "+220" },
        "GN": { name: "🇬🇳 Guinea", calling_code: "+224" },
        "GP": { name: "🇬🇵 Guadeloupe", calling_code: "+590" },
        "GQ": { name: "🇬🇶 Equatorial Guinea", calling_code: "+240" },
        "GR": { name: "🇬🇷 Greece", calling_code: "+30" },
        "GS": { name: "🇬🇸 South Georgia and the South Sandwich Islands", calling_code: "+500" },
        "GT": { name: "🇬🇹 Guatemala", calling_code: "+502" },
        "GU": { name: "🇬🇺 Guam", calling_code: "+1-671" },
        "GW": { name: "🇬🇼 Guinea-Bissau", calling_code: "+245" },
        "GY": { name: "🇬🇾 Guyana", calling_code: "+592" },
        "HK": { name: "🇭🇰 Hong Kong", calling_code: "+852" },
        "HM": { name: "🇭🇲 Heard Island and McDonald Islands", calling_code: "+672" },
        "HN": { name: "🇭🇳 Honduras", calling_code: "+504" },
        "HR": { name: "🇭🇷 Croatia", calling_code: "+385" },
        "HT": { name: "🇭🇹 Haiti", calling_code: "+509" },
        "HU": { name: "🇭🇺 Hungary", calling_code: "+36" },
        "ID": { name: "🇮🇩 Indonesia", calling_code: "+62" },
        "IE": { name: "🇮🇪 Ireland", calling_code: "+353" },
        "IL": { name: "🇮🇱 Israel", calling_code: "+972" },
        "IM": { name: "🇮🇲 Isle of Man", calling_code: "+44" },
        "IN": { name: "🇮🇳 India", calling_code: "+91" },
        "IO": { name: "🇮🇴 British Indian Ocean Territory", calling_code: "+246" },
        "IQ": { name: "🇮🇶 Iraq", calling_code: "+964" },
        "IR": { name: "🇮🇷 Iran", calling_code: "+98" },
        "IS": { name: "🇮🇸 Iceland", calling_code: "+354" },
        "IT": { name: "🇮🇹 Italy", calling_code: "+39" },
        "JE": { name: "🇯🇪 Jersey", calling_code: "+44" },
        "JM": { name: "🇯🇲 Jamaica", calling_code: "+1-876" },
        "JO": { name: "🇯🇴 Jordan", calling_code: "+962" },
        "JP": { name: "🇯🇵 Japan", calling_code: "+81" },
        "KE": { name: "🇰🇪 Kenya", calling_code: "+254" },
        "KG": { name: "🇰🇬 Kyrgyzstan", calling_code: "+996" },
        "KH": { name: "🇰🇭 Cambodia", calling_code: "+855" },
        "KI": { name: "🇰🇮 Kiribati", calling_code: "+686" },
        "KM": { name: "🇰🇲 Comoros", calling_code: "+269" },
        "KN": { name: "🇰🇳 Saint Kitts and Nevis", calling_code: "+1-869" },
        "KP": { name: "🇰🇵 North Korea", calling_code: "+850" },
        "KR": { name: "🇰🇷 South Korea", calling_code: "+82" },
        "KW": { name: "🇰🇼 Kuwait", calling_code: "+965" },
        "KY": { name: "🇰🇾 Cayman Islands", calling_code: "+1-345" },
        "KZ": { name: "🇰🇿 Kazakhstan", calling_code: "+7" },
        "LA": { name: "🇱🇦 Laos", calling_code: "+856" },
        "LB": { name: "🇱🇧 Lebanon", calling_code: "+961" },
        "LC": { name: "🇱🇨 Saint Lucia", calling_code: "+1-758" },
        "LI": { name: "🇱🇮 Liechtenstein", calling_code: "+423" },
        "LK": { name: "🇱🇰 Sri Lanka", calling_code: "+94" },
        "LR": { name: "🇱🇷 Liberia", calling_code: "+231" },
        "LS": { name: "🇱🇸 Lesotho", calling_code: "+266" },
        "LT": { name: "🇱🇹 Lithuania", calling_code: "+370" },
        "LU": { name: "🇱🇺 Luxembourg", calling_code: "+352" },
        "LV": { name: "🇱🇻 Latvia", calling_code: "+371" },
        "LY": { name: "🇱🇾 Libya", calling_code: "+218" },
        "MA": { name: "🇲🇦 Morocco", calling_code: "+212" },
        "MC": { name: "🇲🇨 Monaco", calling_code: "+377" },
        "MD": { name: "🇲🇩 Moldova", calling_code: "+373" },
        "ME": { name: "🇲🇪 Montenegro", calling_code: "+382" },
        "MF": { name: "🇲🇫 Saint Martin", calling_code: "+590" },
        "MG": { name: "🇲🇬 Madagascar", calling_code: "+261" },
        "MH": { name: "🇲🇭 Marshall Islands", calling_code: "+692" },
        "MK": { name: "🇲🇰 North Macedonia", calling_code: "+389" },
        "ML": { name: "🇲🇱 Mali", calling_code: "+223" },
        "MM": { name: "🇲🇲 Myanmar (Burma)", calling_code: "+95" },
        "MN": { name: "🇲🇳 Mongolia", calling_code: "+976" },
        "MO": { name: "🇲🇴 Macao", calling_code: "+853" },
        "MP": { name: "🇲🇵 Northern Mariana Islands", calling_code: "+1-670" },
        "MQ": { name: "🇲🇶 Martinique", calling_code: "+596" },
        "MR": { name: "🇲🇷 Mauritania", calling_code: "+222" },
        "MS": { name: "🇲🇸 Montserrat", calling_code: "+1-664" },
        "MT": { name: "🇲🇹 Malta", calling_code: "+356" },
        "MU": { name: "🇲🇺 Mauritius", calling_code: "+230" },
        "MV": { name: "🇲🇻 Maldives", calling_code: "+960" },
        "MW": { name: "🇲🇼 Malawi", calling_code: "+265" },
        "MX": { name: "🇲🇽 Mexico", calling_code: "+52" },
        "MY": { name: "🇲🇾 Malaysia", calling_code: "+60" },
        "MZ": { name: "🇲🇿 Mozambique", calling_code: "+258" },
        "NA": { name: "🇳🇦 Namibia", calling_code: "+264" },
        "NC": { name: "🇳🇨 New Caledonia", calling_code: "+687" },
        "NE": { name: "🇳🇪 Niger", calling_code: "+227" },
        "NF": { name: "🇳🇫 Norfolk Island", calling_code: "+672" },
        "NG": { name: "🇳🇬 Nigeria", calling_code: "+234" },
        "NI": { name: "🇳🇮 Nicaragua", calling_code: "+505" },
        "NL": { name: "🇳🇱 Netherlands", calling_code: "+31" },
        "NO": { name: "🇳🇴 Norway", calling_code: "+47" },
        "NP": { name: "🇳🇵 Nepal", calling_code: "+977" },
        "NR": { name: "🇳🇷 Nauru", calling_code: "+674" },
        "NU": { name: "🇳🇺 Niue", calling_code: "+683" },
        "NZ": { name: "🇳🇿 New Zealand", calling_code: "+64" },
        "OM": { name: "🇴🇲 Oman", calling_code: "+968" },
        "PA": { name: "🇵🇦 Panama", calling_code: "+507" },
        "PE": { name: "🇵🇪 Peru", calling_code: "+51" },
        "PF": { name: "🇵🇫 French Polynesia", calling_code: "+689" },
        "PG": { name: "🇵🇬 Papua New Guinea", calling_code: "+675" },
        "PH": { name: "🇵🇭 Philippines", calling_code: "+63" },
        "PK": { name: "🇵🇰 Pakistan", calling_code: "+92" },
        "PL": { name: "🇵🇱 Poland", calling_code: "+48" },
        "PM": { name: "🇵🇲 Saint Pierre and Miquelon", calling_code: "+508" },
        "PN": { name: "🇵🇳 Pitcairn Islands", calling_code: "+64" },
        "PR": { name: "🇵🇷 Puerto Rico", calling_code: "+1-787" },
        "PS": { name: "🇵🇸 Palestine", calling_code: "+970" },
        "PT": { name: "🇵🇹 Portugal", calling_code: "+351" },
        "PW": { name: "🇵🇼 Palau", calling_code: "+680" },
        "PY": { name: "🇵🇾 Paraguay", calling_code: "+595" },
        "QA": { name: "🇶🇦 Qatar", calling_code: "+974" },
        "RE": { name: "🇷🇪 Réunion", calling_code: "+262" },
        "RO": { name: "🇷🇴 Romania", calling_code: "+40" },
        "RS": { name: "🇷🇸 Serbia", calling_code: "+381" },
        "RU": { name: "🇷🇺 Russia", calling_code: "+7" },
        "RW": { name: "🇷🇼 Rwanda", calling_code: "+250" },
        "SA": { name: "🇸🇦 Saudi Arabia", calling_code: "+966" },
        "SB": { name: "🇸🇧 Solomon Islands", calling_code: "+677" },
        "SC": { name: "🇸🇨 Seychelles", calling_code: "+248" },
        "SD": { name: "🇸🇩 Sudan", calling_code: "+249" },
        "SE": { name: "🇸🇪 Sweden", calling_code: "+46" },
        "SG": { name: "🇸🇬 Singapore", calling_code: "+65" },
        "SH": { name: "🇸🇭 Saint Helena, Ascension and Tristan da Cunha", calling_code: "+290" },
        "SI": { name: "🇸🇮 Slovenia", calling_code: "+386" },
        "SJ": { name: "🇸🇯 Svalbard and Jan Mayen", calling_code: "+47" },
        "SK": { name: "🇸🇰 Slovakia", calling_code: "+421" },
        "SL": { name: "🇸🇱 Sierra Leone", calling_code: "+232" },
        "SM": { name: "🇸🇲 San Marino", calling_code: "+378" },
        "SN": { name: "🇸🇳 Senegal", calling_code: "+221" },
        "SO": { name: "🇸🇴 Somalia", calling_code: "+252" },
        "SR": { name: "🇸🇷 Suriname", calling_code: "+597" },
        "SS": { name: "🇸🇸 South Sudan", calling_code: "+211" },
        "ST": { name: "🇸🇹 São Tomé and Príncipe", calling_code: "+239" },
        "SV": { name: "🇸🇻 El Salvador", calling_code: "+503" },
        "SX": { name: "🇸🇽 Sint Maarten", calling_code: "+1-721" },
        "SY": { name: "🇸🇾 Syria", calling_code: "+963" },
        "SZ": { name: "🇸🇿 Eswatini", calling_code: "+268" },
        "TC": { name: "🇹🇨 Turks and Caicos Islands", calling_code: "+1-649" },
        "TD": { name: "🇹🇩 Chad", calling_code: "+235" },
        "TF": { name: "🇹🇫 French Southern and Antarctic Lands", calling_code: "+262" },
        "TG": { name: "🇹🇬 Togo", calling_code: "+228" },
        "TH": { name: "🇹🇭 Thailand", calling_code: "+66" },
        "TJ": { name: "🇹🇯 Tajikistan", calling_code: "+992" },
        "TK": { name: "🇹🇰 Tokelau", calling_code: "+690" },
        "TL": { name: "🇹🇱 Timor-Leste", calling_code: "+670" },
        "TM": { name: "🇹🇲 Turkmenistan", calling_code: "+993" },
        "TN": { name: "🇹🇳 Tunisia", calling_code: "+216" },
        "TO": { name: "🇹🇴 Tonga", calling_code: "+676" },
        "TR": { name: "🇹🇷 Turkey", calling_code: "+90" },
        "TT": { name: "🇹🇹 Trinidad and Tobago", calling_code: "+1-868" },
        "TV": { name: "🇹🇻 Tuvalu", calling_code: "+688" },
        "TW": { name: "🇹🇼 Taiwan", calling_code: "+886" },
        "TZ": { name: "🇹🇿 Tanzania", calling_code: "+255" },
        "UA": { name: "🇺🇦 Ukraine", calling_code: "+380" },
        "UG": { name: "🇺🇬 Uganda", calling_code: "+256" },
        "UM": { name: "🇺🇲 U.S. Minor Outlying Islands", calling_code: "+1" },
        "US": { name: "🇺🇸 United States", calling_code: "+1" },
        "UY": { name: "🇺🇾 Uruguay", calling_code: "+598" },
        "UZ": { name: "🇺🇿 Uzbekistan", calling_code: "+998" },
        "VA": { name: "🇻🇦 Vatican City", calling_code: "+379" },
        "VC": { name: "🇻🇨 Saint Vincent and the Grenadines", calling_code: "+1-784" },
        "VE": { name: "🇻🇪 Venezuela", calling_code: "+58" },
        "VG": { name: "🇻🇬 British Virgin Islands", calling_code: "+1-284" },
        "VI": { name: "🇻🇮 U.S. Virgin Islands", calling_code: "+1-340" },
        "VN": { name: "🇻🇳 Vietnam", calling_code: "+84" },
        "VU": { name: "🇻🇺 Vanuatu", calling_code: "+678" },
        "WF": { name: "🇼🇫 Wallis and Futuna", calling_code: "+681" },
        "WS": { name: "🇼🇸 Samoa", calling_code: "+685" },
        "YE": { name: "🇾🇪 Yemen", calling_code: "+967" },
        "YT": { name: "🇾🇹 Mayotte", calling_code: "+262" },
        "ZA": { name: "🇿🇦 South Africa", calling_code: "+27" },
        "ZM": { name: "🇿🇲 Zambia", calling_code: "+260" },
        "ZW": { name: "🇿🇼 Zimbabwe", calling_code: "+263" }
    },

    _paddle_initialized: false,
    _payment_element: undefined as any, // Replace 'any' with the actual type if known.
    _sign_in_redirect: undefined as string | undefined | null,
    _step: 0,
    _steps_element: undefined as any,
    _steps_container: undefined as any,
    _overview_container: undefined as any,
    _order_container: undefined as any,
    _billing_container: undefined as any,
    _payment_container: undefined as any,
    _processing_container: undefined as any,
    _checkout_button: undefined as any,
    _prev_step_button: undefined as any,
    _style: undefined as any,
    _currency_symbol: undefined as string | undefined,
    _render_payment_element_reject: undefined as undefined | Function,
    _render_payment_element_resolve: undefined as undefined | Function,
    _refunds_element: undefined as any,
    _refunds_container: undefined as any,
    _processing_element: undefined as any,
    _theme: undefined as any,
    _products: undefined as any,
    _days_refundable: 30, // **Added Property**

    on_error: (data: string | Error) => {},

    // Additional properties that might be inferred from function bodies:
    _refund_policy: undefined as string | undefined, // Used in commented code
    _cancellation_policy: undefined as string | undefined, // Used in commented code

    // cart: { 
    //     items: [] as any[], // Replace 'any' with the actual item type.
    //     refresh: function() { /* Implement refresh logic */ },
    //     save: function() { /* Implement save logic */ },
    //     add: async function(productId: string, quantity: number) { /* Implement add logic */ },
    //     remove: async function(productId: string, quantity: number | "all") { /* Implement remove logic */ },
    // },

    _billing_element: undefined as any, // Replace 'any' with the actual type if known.
    _billing_details: undefined as any, // Replace 'any' with the actual type if known.

    _overview_subtotal: undefined as any, // Replace 'any' with the actual type if known.
    _overview_total: undefined as any, // Replace 'any' with the actual type if known.
    _overview_subtotal_tax: undefined as any, // Replace 'any' with the actual type if known.
    _overview_tax_container: undefined as any, // Replace 'any' with the actual type if known.
    _overview_incl_excl_tax: undefined as any, // Replace 'any' with the actual type if known.
    _overview_element: undefined as any, // Replace 'any' with the actual type if known.
    _order_element: undefined as any, // Replace 'any' with the actual type if known.

    // ---------------------------------------------------------
    // Private Methods.

    /**
     * Initialize Paddle with the provided client key and set up event callbacks.
     */
    _initialize_paddle: function(): void {
        if (this._paddle_initialized !== true) {
            if (this.sandbox) {
                Paddle.Environment.set("sandbox");
            }
            Paddle.Setup({ 
                token: this.client_key,
                eventCallback: (data: any) => {
                    if (data.name === "checkout.loaded") {
                        (this._render_payment_element_resolve as Function)();
                    }
                    else if (data.name === "checkout.completed") {
                        this._show_processing("success");
                    }
                    else if (data.name === "checkout.payment.initiated") {
                        // Uncomment and implement if needed.
                        // this._show_processing("processing");
                    }
                    else if (data.name === "checkout.payment.failed") {
                        this._show_processing("error");
                    }
                    else if (data.type === "checkout.error") {
                        if (data.error?.detail) {
                            console.error(data);
                            this.on_error(data.error.detail);
                        } else {
                            console.error(data);
                            this.on_error(new Error("Unknown error"));
                        }
                        (this._render_payment_element_reject as Function)(data.detail.split("|")[0]);
                    }
                    else if (data.type === "checkout.warning") {
                        if (this.sandbox) {
                            console.log("Checkout warning:", data);
                        }
                    }
                    else {
                        // Handle other events if necessary.
                        // Uncomment for debugging.
                        // if (this.sandbox) {
                        //     console.log("Event", data);
                        // }
                    }
                }
            });
            this._paddle_initialized = true;
        }
    },

    /**
     * Reset the payment element by removing it if it exists.
     */
    _reset: function(): void {
        if (this._payment_element !== undefined) {
            this._payment_element.remove();
        }
        this._payment_element = undefined;
    },

    /**
     * Initialize the order by verifying authentication and making a POST request.
     */
    _init_order: async function (): Promise<void> {
        try {
            if (this._sign_in_redirect != null && !User.is_authenticated()) {
                Utils.redirect(this._sign_in_redirect);
            }
            const response = await Utils.request({
                method: "POST",
                url: "/vweb/payments/init",
                data: {
                    items: this.cart.items,
                }
            });
            // Handle response if necessary.
        } catch (err: any) {
            if (typeof err === "object" && err.error != null) {
                err = err.error;
            }
            throw new Error(err);
        }
    },

    /**
     * Set the current step in the payment process.
     */
    _set_step: async function (): Promise<void | null> {
        // Switch step.
        switch (this._step) {

            // Order.
            case 0: {
                // Select the current step.
                this._steps_element.select(this._step);

                // Show and hide relevant containers.
                this._overview_container.show();
                this._order_container.show();
                this._billing_container.hide();
                this._payment_container.hide();
                this._processing_container.hide();
                this._checkout_button.nodes.text.text("Next");
                // this._policy_checkbox.hide();
                this._prev_step_button.hide();
                break;
            }

            // Address.
            case 1: {
                // Minimum duration for the loader.
                const min_duration = new Promise(resolve => setTimeout(resolve, 350));

                // Verify the order.
                try {
                    await this._init_order();
                } catch (err) {
                    --this._step;
                    console.error(err);
                    this.on_error(err as Error);
                    return null;
                }

                // Render billing element.
                this._render_billing_element();

                // Await minimum duration.
                await min_duration;

                // Select the current step.
                this._steps_element.select(this._step);

                // Show and hide relevant containers.
                this._overview_container.show();
                this._order_container.hide();
                this._billing_container.show();
                this._payment_container.hide();
                this._processing_container.hide();
                this._checkout_button.nodes.text.text("Next");
                // this._policy_checkbox.hide();
                this._prev_step_button.show();
                break;
            }

            // Payment.
            case 2: {
                // Check if the billing details are entered correctly.
                try {
                    this._billing_details = this._billing_element.data();
                    this._billing_details.phone_number = this._billing_details.phone_country_code + this._billing_details.phone_number;
                    delete this._billing_details.phone_country_code;
                } catch (error) {
                    --this._step;
                    console.error(error);
                    this.on_error(error as Error);
                    return null;
                }

                // Render payment element.
                try {
                    await this._render_payment_element();
                } catch (error) {
                    --this._step;
                    console.error(error);
                    this.on_error(error as Error);
                    return null;
                }

                // Select the current step.
                this._steps_element.select(this._step);

                // Show and hide relevant containers.
                this._overview_container.hide();
                this._order_container.hide();
                this._billing_container.hide();
                this._payment_container.show();
                this._processing_container.hide();
                this._checkout_button.nodes.text.text("Checkout");
                // this._policy_checkbox.show();
                this._prev_step_button.show();
                break;
            }
        }
    },

    /**
     * Navigate to the next step in the payment process.
     */
    _next: async function (): Promise<void | null> {
        if (this._step < 3) {
            ++this._step;
            return this._set_step();
        } else if (this._step === 3) {
            return this._set_step();
        }
    },

    /**
     * Navigate to the previous step in the payment process.
     */
    _prev: async function (): Promise<void | null> {
        if (this._step > 0) {
            --this._step;
            return this._set_step();
        }
    },

    /**
     * Render the steps element in the UI.
     */
    _render_steps_element: function (): void {
        // Shortcuts.
        const style = this._style;

        // The previous step button.
        this._prev_step_button = HStack(
            ImageMask("/vweb_static/payments/arrow.long.webp")
                .frame(15, 15)
                .mask_color(this._style.fg_1)
                .transition_mask("background 300ms ease-in-out")
                .transform("rotate(180deg)")
                .margin_right(10),
            Text("Previous Step")
                .color(this._style.fg_1)
                .transition("color 300ms ease-in-out")
                .padding(0)
                .margin(0)
                .font_size(14)
        )
        .hide()
        .on_mouse_over_out(
            (e: any) => {
                e.child(0).color(this._style.fg);
                e.child(1).color(this._style.fg);
            },
            (e: any) => {
                e.child(0).color(this._style.fg_1);
                e.child(1).color(this._style.fg_1);
            },
        )
        .on_click(() => {
            this._prev()
                .catch((err: any) => console.error(err));
        })
        .center_vertical();

        // The steps element.
        this._steps_element = HStack(
            ForEach(
                ["Order Details", "Billing Details", "Payment Details", "Processing Details"],
                (item: string, index: number) => {
                    const stack = HStack(
                        VStack((index + 1).toString())
                            .font_size(11)
                            .padding(0)
                            .margin(0)
                            .color(index === 0 ? this._style.selected.fg : this._style.fg_1)
                            .frame(17.5, 17.5)
                            .background(index === 0 ? this._style.selected.bg : this._style.bg_1)
                            .transition("color 300ms ease-in-out, background 300ms ease-in-out")
                            .border_radius("50%")
                            .margin_right(15)
                            .flex_shrink(0)
                            .center()
                            .center_vertical()
                            .border(1, this._style.divider_bg),
                        Text(item)
                            .color(index === 0 ? this._style.fg : this._style.fg_1)
                            .transition("color 300ms ease-in-out")
                            .padding(0)
                            .font_size(14)
                            .line_height(16)
                    )
                    .center_vertical()
                    .margin_right(25);
                    return stack;
                }
            ),
            Spacer().min_frame(10, 1),
            this._prev_step_button,
        )
        .overflow_x("scroll")
        .class("hide_scrollbar")
        .extend({
            selected_index: 0,
            /**
             * Select the current step index and update UI accordingly.
             * @param index - The index of the step to select.
             */
            select: function(index: number) {
                let e = this.child(this.selected_index);
                e.child(0)
                    .color(style.fg_1)
                    .background(style.bg_1);
                e.child(1)
                    .color(style.fg_1);

                this.selected_index = index;

                e = this.child(this.selected_index);
                e.child(0)
                    .color(style.selected.fg)
                    .background(style.selected.bg);
                e.child(1)
                    .color(style.fg);
            }
        });

        // Append the steps element to the steps container.
        this._steps_container.append(this._steps_element);
    },

    /**
     * Render the overview element in the UI.
     */
    _render_overview_element: function (): void {
        // The subtotal price from the overview.
        this._overview_subtotal = Text(`${this._currency_symbol == null ? "$" : this._currency_symbol} 0.00`)
            .color(this._style.fg)
            .font_size(this._style.font_size)
            .flex_shrink(0)
            .margin(0)
            .padding(0);
        
        // The total price from the overview.
        this._overview_total = Text(`${this._currency_symbol == null ? "$" : this._currency_symbol} 0.00`)
            .font_weight("bold")
            .color(this._style.fg)
            .font_size(this._style.font_size)
            .flex_shrink(0)
            .margin(0)
            .padding(0);
        
        // The subtotal VAT price from the overview.
        this._overview_subtotal_tax = Text(`${this._currency_symbol == null ? "$" : this._currency_symbol} 0.00`)
            .color(this._style.fg)
            .font_size(this._style.font_size)
            .flex_shrink(0)
            .margin(0)
            .padding(0);
        
        // The tax stack.
        this._overview_tax_container = HStack(
                Text("Tax:")
                    .color(this._style.fg)
                    .font_size(this._style.font_size)
                    .stretch(true)
                    .flex_shrink(0)
                    .margin(0, 5, 0, 0)
                    .padding(0)
                    .wrap(false)
                    .overflow("hidden")
                    .text_overflow("ellipsis"),
                this._overview_subtotal_tax,
            )
            .margin_top(5);
        
        // The incl/excl tax text.
        this._overview_incl_excl_tax = Text(this.tax_inclusive ? "incl. tax" : "excl. tax")
            .color(this._style.fg_2)
            .font_size(this._style.font_size - 6)
            .margin(2.5, 0, 0, 0)
            .padding(0)
            .flex_shrink(0)
            .text_trailing();
        
        // The checkout button.
        this._checkout_button = LoaderButton("Next")
            .color(this._style.button.fg)
            .background(this._style.button.bg)
            .border_radius(this._style.button.border_radius)
            .border(this._style.button.border_inset ? `${this._style.button.border_width} inset ${this._style.button.border_color}` : `${this._style.button.border_width} solid ${this._style.button.border_color}`)
            .hover_brightness(...this._style.button.hover_brightness)
            .loader
                .background(this._style.button.fg)
                .update()
                .parent()
            .on_click(async () => {
                this._checkout_button.show_loader();
                Payments._next()
                    .then(() => {
                        this._checkout_button.hide_loader();
                    })
                    .catch((err: any) => {
                        console.error(err);
                        this._checkout_button.hide_loader();
                    });
            });
        
        // Accept agreements (currently commented out).
        // this._policy_checkbox = CheckBox({
        //     text: "I agree to the Terms and Conditions and the " + 
        //           Link("Refund", this._refund_policy) + 
        //           " and " + 
        //           Link("Cancellation", this._cancellation_policy) + 
        //           " policy. I agree that my payment method may be used for recurring subscriptions.", 
        //     required: true
        // }) // @todo check text.
        // .color(this._style.fg_2)
        // .border_color(this._style.divider_bg)
        // .font_size(this._style.font_size - 6)
        // .focus_color(this._style.theme_fg)
        // .missing_color(this._style.missing_fg)
        // .inner_bg(this._style.bg)
        // .margin_bottom(15)
        // .hide();
        
        // The overview element.
        this._overview_element = VStack(
            Title("Overview")
                .color(this._style.fg)
                .width("fit-content")
                .font_size(this._style.font_size - 2)
                .flex_shrink(0)
                .margin(0, 0, 15, 0)
                .letter_spacing("1px")
                .text_transform("uppercase")
                .ellipsis_overflow(true),
        
            HStack(
                Text("Subtotal:")
                    .color(this._style.fg)
                    .font_size(this._style.font_size)
                    .stretch(true)
                    .flex_shrink(0)
                    .margin(0, 5, 0, 0)
                    .padding(0)
                    .wrap(false)
                    .overflow("hidden")
                    .text_overflow("ellipsis"),
                this._overview_subtotal,
            ),
            // Uncomment and define Shipping if needed.
            // HStack(
            //     Text("Shipping:")
            //         .color(this._style.fg_1)
            //         .font_size(this._style.font_size)
            //         .stretch(true)
            //         .flex_shrink(0)
            //         .margin(0, 5, 0, 0)
            //         .padding(0)
            //         .wrap(false)
            //         .overflow("hidden")
            //         .text_overflow("ellipsis"),
            //     Text("free")
            //         .color(this._style.fg_1)
            //         .font_size(this._style.font_size)
            //         .flex_shrink(0)
            //         .margin(0)
            //         .padding(0)
            //         .wrap(false)
            //         .overflow("hidden")
            //         .text_overflow("ellipsis"),
            // )
            // .margin_top(5),
            this._overview_tax_container,
            Divider()
                .margin(20, 0, 20, 0)
                .background(this._style.divider_bg),
            HStack(
                Text("Total:")
                    .font_weight("bold")
                    .color(this._style.fg)
                    .font_size(this._style.font_size)
                    .stretch(true)
                    .flex_shrink(0)
                    .margin(0, 5, 0, 0)
                    .padding(0)
                    .wrap(false)
                    .overflow("hidden")
                    .text_overflow("ellipsis"),
                VStack(
                    this._overview_total,
                    this._overview_incl_excl_tax,
                ),
            )
            .margin_bottom(25),
            // this._policy_checkbox,
            this._checkout_button,
        )
        .extend({
            total: 0,
            tax: 0,
            /**
             * Handle unknown tax scenarios by updating the UI accordingly.
             */
            unknown_tax: () => {
                this._overview_incl_excl_tax.text(this.tax_inclusive ? "incl. tax" : "excl. tax");
                this._overview_tax_container.hide();
                this._overview_element.tax = 0;
                this._overview_total.text(`${this._currency_symbol} ${this._overview_element.total.toFixed(2)}`);
            },
            /**
             * Calculate tax based on the provided country code.
             * @param country - The country code to calculate tax for.
             */
            calc_tax: async (country: string) => {
                this._initialize_paddle();
                try {
                    const result = await Paddle.PricePreview({
                        items: this.cart.items.map((item: any) => { 
                            return { priceId: item.product.price_id, quantity: item.quantity }; 
                        }),
                        address: { countryCode: country },
                    });
                    this._overview_element.tax = 0;
                    result.data.details.lineItems.forEach((item: any) => {
                        this._overview_element.tax += parseInt(item.totals.tax) / 100;
                    });
                    this._overview_tax_container.show();
                    this._overview_incl_excl_tax.text("incl. tax");
                    this._overview_subtotal_tax.text(`${this._currency_symbol} ${this._overview_element.tax.toFixed(2)}`);
                    this._overview_total.text(`${this._currency_symbol} ${(this._overview_element.total + this._overview_element.tax).toFixed(2)}`);
                } catch (error: any) {
                    if (error?.error?.detail) {
                        this.on_error(error.error.detail);
                        console.error(error);
                    } else {
                        console.error(error);
                    }
                    this._overview_element.unknown_tax();
                }
            },
        });

        // Append the overview element to the overview container.
        this._overview_container.append(this._overview_element);
    },

    /**
     * Render the order element in the UI.
     */
    _render_order_element: function (): void {
        // Render.
        this._order_element = VStack()
        .extend({
            /**
             * Refresh the order element by updating the cart and UI elements.
             */
            refresh: function () {
                // Refresh the cart.
                Payments.cart.refresh();

                // Shortcuts.
                const style = Payments._style;
                const cart = Payments.cart;
                const cart_items = Payments.cart.items;
                
                // Shopping cart view.
                let currency_symbol: string | null = null;
                let subtotal = 0;
                cart_items.forEach((item: any) => {
                    if (currency_symbol === null) {
                        currency_symbol = Payments.get_currency_symbol(item.product.currency);
                    }
                    subtotal += item.product.price * item.quantity;
                });
                if (currency_symbol === null) {
                    currency_symbol = "$";
                }
                Payments._currency_symbol = currency_symbol;
                
                // Set the overview prices.
                Payments._overview_subtotal.text(`${currency_symbol} ${subtotal.toFixed(2)}`);
                Payments._overview_element.total = subtotal;
                Payments._overview_element.unknown_tax();
                
                // Add the products.
                this.remove_children();
                if (cart_items.length === 0) {
                    this.height(160);
                    this.append(
                        VStack(
                            Title("Empty Shopping Cart")
                                .color(style.fg_1)
                                .font_size(style.font_size - 2)
                                .flex_shrink(0)
                                .letter_spacing("1px")
                                .text_transform("uppercase")
                                .ellipsis_overflow(true)
                                .margin(0)
                                .padding(0)
                                .assign_to_parent_as("title_e"),
                            Text(`Your shopping cart is empty.`)
                                .color(style.fg_2)
                                .font_size(style.font_size - 2)
                                .line_height(style.font_size)
                                .margin(5, 0, 0, 0)
                                .padding(0)
                                .assign_to_parent_as("text_e")
                                .white_space("pre")
                                .line_height("1.4em")
                                .center(),
                            ImageMask("/vweb_static/payments/shopping_cart.webp")
                                .frame(35, 35)
                                .margin_top(20)
                                .mask_color(style.theme_fg),
                        )
                        .frame("100%", "100%")
                        .center()
                        .center_vertical()
                    );
                } else {
                    // Uncomment and adjust height if necessary.
                    // this.height("100%");
                    this.append(
                        Title("Order Details")
                            .color(style.fg)
                            .width("fit-content")
                            .font_size(style.font_size - 2)
                            .flex_shrink(0)
                            .margin(0, 0, 0, 0)
                            .letter_spacing("1px")
                            .text_transform("uppercase")
                            .ellipsis_overflow(true),
        
                        Divider()
                            .background(style.divider_bg)
                            .margin(10, 0, 20, 0),
        
                        ForEach(cart_items, (item: any, index: number) => {
                            let focus = false, mouse_over = false;
                            const quantity_input = Input("Quantity")
                                .value(item.quantity)
                                .font_size(16)
                                .color(style.fg_1)
                                .font_size(style.font_size - 2)
                                .border(1, style.divider_bg)
                                // .padding(12.5, 10, 12.5, 10)
                                .padding(2.5, 7.5)
                                .margin_right(25)
                                .flex_shrink(0)
                                .width(`calc(${item.quantity.toString().length}ch + 17.5px)`) // add padding.
                                .background(style.bg_1)
                                .display("inline")
                                .transition("color 300ms ease-in-out")
                                .center()
                                .on_input((_, event: any) => {
                                    const value = quantity_input.value();
                                    quantity_input.width(`calc(${value.length}ch + 17.5px)`); // add padding.
                                    clearTimeout(quantity_input.timeout);
                                    quantity_input.timeout = setTimeout(() => {
                                        const quantity = parseInt(value);
                                        if (isNaN(quantity)) {
                                            console.error(`Specified quantity "${value}" is not a number.`);
                                            Payments.on_error(new Error(`Specified quantity "${value}" is not a number.`));
                                            quantity_input.value(item.quantity.toString());
                                            return null;
                                        }
                                        item.quantity = quantity;
                                        cart.save();
                                        this.refresh();
                                    }, 500);
                                })
                                .on_mouse_over_out(
                                    (e: any) => {
                                        e.color(style.fg);
                                        mouse_over = true;
                                        e.mask_color(style.fg);
                                    }, 
                                    (e: any) => {
                                        mouse_over = false;
                                        if (!mouse_over && !focus) {
                                            e.color(style.fg_1);
                                        }
                                    },
                                )
                                .on_focus((e: any) => {
                                    e.color(style.fg);
                                    focus = true;
                                })
                                .on_blur((e: any) => {
                                    focus = false;
                                    if (!mouse_over && !focus) {
                                        e.color(style.fg_1);
                                    }
                                });
                            
                            let per_item = " per item" + (Payments.tax_inclusive ? " incl. tax" : " excl. tax") + ",";
                            let renews_every: string | null = null;
                            if (item.product.interval) {
                                if (item.product.frequency === 1) {
                                    renews_every = `renews ${item.product.interval}ly.`;
                                } else {
                                    renews_every = `renews every ${item.product.frequency} ${item.product.interval}s.`;
                                }
                            }
                            let trial_text: string | null = null;
                            if (item.product.trial) {
                                if (item.product.trial.frequency === 1) {
                                    trial_text = `${item.product.trial.frequency} ${item.product.trial.interval} free`;
                                } else {
                                    trial_text = `${item.product.trial.frequency} ${item.product.trial.interval}s free`;
                                }
                            }
                            const stack = HStack(
                                item.product.icon == null ? null : 
                                    ImageMask(item.product.icon)
                                        .frame(30, 30)
                                        .flex_shrink(0)
                                        .margin(0, 25, 0, 0),
                                VStack(
                                    Title(item.product.name)
                                        .color(style.fg)
                                        .font_size(style.font_size)
                                        .margin(0, 10, 0, 0)
                                        .padding(0)
                                        .wrap(false)
                                        .overflow("hidden")
                                        .text_overflow("ellipsis"),
                                    Text(item.product.description)
                                        .color(style.fg_1)
                                        .font_size(style.font_size - 2)
                                        .line_height(style.font_size)
                                        .margin(10, 10, 0, 0)
                                        .wrap(true)
                                        .padding(0),
                                    HStack(
                                        Text("Quantity:")
                                            .color(style.fg_1)
                                            .font_size(style.font_size - 2)
                                            // .line_height(style.font_size)
                                            .margin(0, 10, 2, 0)
                                            .padding(0)
                                            .flex_shrink(0),
                                        quantity_input,
                                        ImageMask("/vweb_static/payments/minus.webp")
                                            .frame(20, 20)
                                            .padding(5)
                                            .margin_right(5)
                                            .mask_color(style.fg_1)
                                            .background(style.bg_1)
                                            .border(1, style.divider_bg)
                                            .border_radius("50%")
                                            .flex_shrink(0)
                                            .transition_mask("background 300ms ease-in-out")
                                            .on_mouse_over_out(
                                                (e: any) => e.mask_color(style.fg), 
                                                (e: any) => e.mask_color(style.fg_1)
                                            )
                                            .on_click(async () => {
                                                if (item.quantity === 1) {
                                                    await cart.remove(item.product.id, "all");
                                                    this.refresh();
                                                } else {
                                                    await cart.remove(item.product.id, 1);
                                                    this.refresh();
                                                }
                                            }),
                                        ImageMask("/vweb_static/payments/plus.webp")
                                            .frame(20, 20)
                                            .padding(5)
                                            .margin_right(5)
                                            .mask_color(style.fg_1)
                                            .background(style.bg_1)
                                            .border(1, style.divider_bg)
                                            .border_radius("50%")
                                            .flex_shrink(0)
                                            .transition_mask("background 300ms ease-in-out")
                                            .on_mouse_over_out(
                                                (e: any) => e.mask_color(style.fg), 
                                                (e: any) => e.mask_color(style.fg_1)
                                            )
                                            .on_click(async () => {
                                                await cart.add(item.product.id, 1);
                                                this.refresh();
                                            }),
                                        ImageMask("/vweb_static/payments/trash.webp")
                                            .frame(20, 20)
                                            .padding(5)
                                            .margin_right(5)
                                            .mask_color(style.fg_1)
                                            .background(style.bg_1)
                                            .border(1, style.divider_bg)
                                            .border_radius("50%")
                                            .flex_shrink(0)
                                            .transition_mask("background 300ms ease-in-out")
                                            .on_mouse_over_out(
                                                (e: any) => e.mask_color(style.fg), 
                                                (e: any) => e.mask_color(style.fg_1)
                                            )
                                            .on_click(async () => {
                                                await cart.remove(item.product.id, "all");
                                                this.refresh();
                                            }),
                                    )
                                    .center_vertical()
                                    .wrap(true)
                                    .margin_top(17.5),
                                )
                                .stretch(true),
                                VStack(
                                    Title(trial_text ? trial_text : `${currency_symbol} ${(item.product.price * item.quantity).toFixed(2)}`)
                                        .color(style.fg)
                                        .font_size(style.font_size)
                                        .margin(0)
                                        .padding(0)
                                        .flex_shrink(0)
                                        .wrap(false)
                                        .overflow("hidden")
                                        .text_overflow("ellipsis"),
                                    Text(`${trial_text ? "Then " : ""}${currency_symbol} ${item.product.price} ${per_item}`)
                                        .color(style.fg_1)
                                        .font_size(style.font_size - 6)
                                        .margin(5, 0, 0, 0)
                                        .padding(0)
                                        .flex_shrink(0),
                                    renews_every == null ? null : Text(renews_every)
                                        .color(style.fg_1)
                                        .font_size(style.font_size - 6)
                                        .margin(2.5, 0, 0, 0)
                                        .padding(0)
                                        .flex_shrink(0),
                                )
                            )
                            .overflow_x("scroll")
                            .class("hide_scrollbar")
                            .width("100%")
                            .media(
                                "width >= 800px",
                                (e: any) => {
                                    e.wrap(false);
                                    e.child(2).min_width("none")
                                        .margin(0);
                                },
                                (e: any) => {
                                    e.wrap(true);
                                    e.child(2)
                                        .min_width("100%")
                                        .margin(15, 0, 0, 55);
                                },
                            );
                            return [
                                stack,
                                index === cart_items.length - 1 ? null : Divider()
                                    .background(style.divider_bg)
                                    .margin(20, 0, 20, 0)
                            ];
                        })
                    );
                }
                return this;
            }
        });
            
        // Append the order element to the order container.
        this._order_container.append(this._order_element.refresh());
    },

    // Render the refunds element.
    _render_refunds_element: function(): void {
        // Render.
        const style = this._style;
        this._refunds_element = VStack()
        .extend({
            /**
             * Refresh the refunds element by fetching and displaying refundable, refunding, and refunded payments.
             */
            refresh: async function() {
                // Reset.
                this.inner_html("");

                // Create containers.
                let payments = await Payments.get_refundable_payments({
                    days: Payments._days_refundable,
                });
                const refundable_container = VStack()
                    .extend({
                        title: "Refundable Payments",
                        payments: payments,
                        is_refundable: true,
                    });
                payments = await Payments.get_refunding_payments();
                const refunding_container = VStack()
                    .hide()
                    .extend({
                        title: "Processing Refunds",
                        payments: payments,
                        is_refunding: true,
                    });
                payments = await Payments.get_refunded_payments();
                const refunded_container = VStack()
                    .hide()
                    .extend({
                        title: "Refunded Payments",
                        payments: payments,
                        is_refunded: true,
                    });

                // Option bar.
                const option_bar = HStack(
                    Text("Refundable")
                        .font_size(style.font_size)
                        .color(style.fg_1)
                        .background(style.bg_1)
                        .padding(8, 6)
                        .margin(0)
                        .stretch(true)
                        .text_center()
                        .transition("color 350ms ease, background 350ms ease")
                        .on_mouse_over((e: any) => {
                            if (e.background() === "transparent") {
                                e.color(style.fg);
                            }
                        })
                        .on_mouse_out((e: any) => {
                            if (e.background() === "transparent") {
                                e.color(style.fg_1);
                            }
                        })
                        .on_click((e: any) => {
                            e.color(Payments._style.fg_1);
                            e.background(Payments._style.bg_1);
                            [e.parentElement.child(1), e.parentElement.child(2)].forEach((child: any) => {
                                child.color(Payments._style.fg_1);
                                child.background("none");
                            });

                            refundable_container.show();
                            refunding_container.hide();
                            refunded_container.hide();
                        }),
                    Text("Processing")
                        .font_size(style.font_size)
                        .color(style.fg_1)
                        .background("transparent")
                        .padding(8, 6)
                        .margin(0)
                        .stretch(true)
                        .text_center()
                        .transition("color 350ms ease, background 350ms ease")
                        .on_mouse_over((e: any) => {
                            if (e.background() === "transparent") {
                                e.color(style.fg);
                            }
                        })
                        .on_mouse_out((e: any) => {
                            if (e.background() === "transparent") {
                                e.color(style.fg_1);
                            }
                        })
                        .on_click((e: any) => {
                            e.color(Payments._style.fg_1);
                            e.background(Payments._style.bg_1);
                            [e.parentElement.child(0), e.parentElement.child(2)].forEach((child: any) => {
                                child.color(Payments._style.fg_1);
                                child.background("none");
                            });

                            refundable_container.hide();
                            refunding_container.show();
                            refunded_container.hide();
                        }),
                    Text("Refunded")
                        .font_size(style.font_size)
                        .color(style.fg_1)
                        .background("transparent")
                        .padding(8, 6)
                        .margin(0)
                        .stretch(true)
                        .text_center()
                        .transition("color 350ms ease, background 350ms ease")
                        .on_mouse_over((e: any) => {
                            if (e.background() === "transparent") {
                                e.color(style.fg);
                            }
                        })
                        .on_mouse_out((e: any) => {
                            if (e.background() === "transparent") {
                                e.color(style.fg_1);
                            }
                        })
                        .on_click((e: any) => {
                            e.color(Payments._style.fg_1);
                            e.background(Payments._style.bg_1);
                            [e.parentElement.child(0), e.parentElement.child(1)].forEach((child: any) => {
                                child.color(Payments._style.fg_1);
                                child.background("none");
                            });

                            refundable_container.hide();
                            refunding_container.hide();
                            refunded_container.show();
                        }),
                )
                .overflow("hidden")
                .border(1, style.divider_bg)
                .border_radius(style.border_radius)
                .margin_bottom(30)
                .flex_shrink(0);

                // Assign to parent.
                this.refundable_option = option_bar.child(0);
                this.refunding_option = option_bar.child(1);
                this.refunded_option = option_bar.child(2);

                // Add elements.
                this.append(
                    option_bar,
                    refundable_container,
                    refunding_container,
                    refunded_container,
                );

                // Separate payments.
                let currency_symbol: string | null = null;
                await Promise.all([refundable_container, refunding_container, refunded_container].map(async (container: any) => {
                    if (container.payments.length === 0) {
                        container.append(
                            VStack(
                                Title("No Payments")
                                    .color(style.fg)
                                    .font_size(style.font_size - 2)
                                    .flex_shrink(0)
                                    .letter_spacing("1px")
                                    .text_transform("uppercase")
                                    .ellipsis_overflow(true)
                                    .margin(0)
                                    .padding(0)
                                    .assign_to_parent_as("title_e"),
                                Text(`There are no ${container.title.toLowerCase()}.`)
                                    .color(style.fg_1)
                                    .font_size(style.font_size - 2)
                                    .line_height(style.font_size)
                                    .margin(5, 0, 0, 0)
                                    .padding(0)
                                    .assign_to_parent_as("text_e")
                                    .white_space("pre")
                                    .line_height("1.4em")
                                    .center(),
                                Image("/vweb_static/payments/check.webp")
                                    .frame(30, 30)
                                    .margin_top(15)
                                    .assign_to_parent_as("success_image_e"),
                            )
                            .min_height(160)
                            .frame("100%", "100%")
                            .center()
                            .center_vertical()
                        );
                    } else {
                        await Promise.all(container.payments.map(async (payment: any) => {
                            await Promise.all(payment.line_items.map(async (item: any) => {
                                item.product = await Payments.get_product(item.product);
                            }));
                        }));
                        container.append(
                            Title(container.title)
                                .color(style.fg)
                                .width("fit-content")
                                .font_size(style.font_size - 2)
                                .flex_shrink(0)
                                .margin(0, 0, 0, 0)
                                .letter_spacing("1px")
                                .text_transform("uppercase")
                                .ellipsis_overflow(true),

                            Divider()
                                .background(style.divider_bg)
                                .margin(10, 0, 20, 0),

                            ForEach(container.payments, (payment: any, index: number) => {
                                // Line items.
                                const items = VStack(
                                    ForEach(payment.line_items, (item: any, index: number) => {
                                        if (currency_symbol == null) {
                                            currency_symbol = Payments.get_currency_symbol(item.product.currency);
                                        }
                                        return [
                                            HStack(
                                                item.product.icon == null ? null : 
                                                    Image(item.product.icon)
                                                        .frame(25, 25)
                                                        .flex_shrink(0)
                                                        .margin(0, 20, 0, 0),
                                                VStack(
                                                    Title(item.product.name)
                                                        .color(style.fg)
                                                        .font_size(style.font_size - 2)
                                                        .line_height(style.font_size)
                                                        .margin(0, 10, 0, 0)
                                                        .padding(0)
                                                        .font_weight("bold")
                                                        .ellipsis_overflow(true),
                                                    Text(item.product.description)
                                                        .color(style.fg_1)
                                                        .font_size(style.font_size - 4)
                                                        .line_height(style.font_size - 2)
                                                        .margin(5, 0, 0, 0)
                                                        .wrap(true)
                                                        .padding(0),
                                                )
                                                .stretch(true),
                                                VStack(
                                                    Text(`${currency_symbol} ${(item.total).toFixed(2)}`)
                                                        .color(style.fg_1)
                                                        .font_size(style.font_size - 4)
                                                        .line_height(style.font_size - 2)
                                                        .margin(0)
                                                        .padding(0)
                                                        .flex_shrink(0)
                                                        .ellipsis_overflow(true),
                                                )
                                            ),
                                            index === payment.line_items.length - 1 ? null : Divider()
                                                .background(style.divider_bg)
                                                .margin(15, 0, 15, 0),                      
                                        ];
                                    }),
                                )
                                .background(style.bg_1)
                                .border_radius(style.border_radius)
                                .border(1, style.divider_bg)
                                .padding(20);

                                // Payment.
                                const stack = VStack(
                                    HStack(
                                        Title("Payment")
                                            .color(style.fg)
                                            .font_size(style.font_size)
                                            .margin(0, 10, 0, 0)
                                            .padding(0)
                                            .wrap(false)
                                            .overflow("hidden")
                                            .text_overflow("ellipsis")
                                            .stretch(true),
                                        !container.is_refundable ? null : BorderButton("Refund")
                                            .font_size(style.font_size - 4)
                                            .padding(7.5, 10)
                                            .margin(0, 5, 0, 0)
                                            .color(style.button.bg)
                                            .border_radius(style.button.border_radius)
                                            .border_color(style.button.bg)
                                            .hover_brightness(...style.button.hover_brightness)
                                            .font_weight("bold")
                                            .on_click(() => {
                                                document.body.appendChild(
                                                    Popup({
                                                        title: "Request Refund",
                                                        text: `You are about to request a refund for payment <span style='border-radius: 7px; background: ${style.bg_1}; padding: 1px 4px; font-size: 0.9em;'>${payment.id}</span>, do you wish to proceed?`,
                                                        no: "No",
                                                        yes: "Yes",
                                                        image: "/vweb_static/payments/error.webp",
                                                        blur: 5,
                                                        animation_duration: 300,
                                                        on_yes: async () => {
                                                            try {
                                                                await Payments.create_refund(payment);
                                                            } catch(err) {
                                                                console.error(err);
                                                                Payments.on_error(err as Error);
                                                                return null;
                                                            }
                                                            this.refresh().then(() => {
                                                                this.refunding_option.click();
                                                            });
                                                        },
                                                    })
                                                    .font(window.getComputedStyle(Payments._refunds_container).font)
                                                    .widget
                                                        .background(style.bg)
                                                        .color(style.fg_1)
                                                        .border_bottom("4px solid #E8454E")
                                                        // .leading()
                                                        .parent()
                                                    .title
                                                        .color(style.fg)
                                                        // .width("fit-content")
                                                        .font_size(style.font_size + 2)
                                                        .flex_shrink(0)
                                                        .margin(0, 0, 0, 10)
                                                        // .letter_spacing("1px")
                                                        // .text_transform("uppercase")
                                                        // .ellipsis_overflow(true)
                                                        // .color(style.fg_1)
                                                        .center()
                                                        .parent()
                                                    .text
                                                        .color(style.fg_1)
                                                        .font_size(style.font_size)
                                                        .margin_left(10)
                                                        .center()
                                                        .parent()
                                                    .image
                                                        .padding(10)
                                                        .mask_color(style.bg)
                                                        .border_radius("50%")
                                                        .background("#E8454E")
                                                        .frame(40, 40)
                                                        .box_shadow('0 0 0 4px #E8454E50')
                                                        .parent()
                                                    .no_button
                                                        .padding(10, 0)
                                                        .font_size(style.font_size)
                                                        .background(style.bg_1)
                                                        .color(style.fg_1)
                                                        .border(1, style.divider_bg)
                                                        .hover_brightness(...style.button.hover_brightness)
                                                        .box_shadow('0px 0px 5px #00000030')
                                                        .parent()
                                                    .yes_button
                                                        .padding(10, 0)
                                                        .font_size(style.font_size)
                                                        .background("#E8454E")
                                                        .color(style.fg_1)
                                                        .border(1, style.divider_bg)
                                                        .hover_brightness(...style.button.hover_brightness)
                                                        .box_shadow('0px 0px 5px #00000030')
                                                        .parent()
                                                );
                                            }),
                                        !container.is_refunding ? null : RingLoader()
                                            .frame(20, 20)
                                            .background(style.theme_fg)
                                            .margin(0, 5, 0, 0)
                                            .update(),
                                        !container.is_refunded ? null : Image("/vweb_static/payments/check.webp")
                                            .frame(20, 20)
                                            .margin(0, 5, 0, 0),
                                    )
                                    .min_height(30),
                                    Text()
                                        .inner_html(`Purchased at ${Utils.unix_to_date(payment.timestamp/1000)} <span style='font-size: 0.8em'>${payment.id}<span>.`)
                                        .color(style.fg_1)
                                        .font_size(style.font_size - 6)
                                        .line_height(style.font_size - 4)
                                        .margin(-5, 0, 10, 0)
                                        .wrap(true)
                                        .padding(0)
                                        .white_space("pre")
                                        .line_height("1.4em")
                                        .center(),
                                    items
                                )
                                .width("100%");

                                // Elements.
                                return [
                                    stack,
                                    index === container.payments.length - 1 ? null : Divider()
                                        .background(style.divider_bg)
                                        .margin(20, 0, 20, 0),                                  
                                ];
                            })
                        );
                    }
                }));
                return this;
            }
        });

        // Append.
        this._refunds_element.refresh();
        this._refunds_container.append(this._refunds_element);
    },

    // Render the address element.
    _render_billing_element: function(): void {
        if (this._billing_element !== undefined) { return ; }

        // Utils.
        const CreateInput = (args: any) => {
            return ExtendedInput(args)
                .color(this._style.fg)
                .font_size(this._style.font_size)
                .missing_color(this._style.missing_fg)
                .focus_color(this._style.theme_fg)
                .border_color(this._style.divider_bg)
                .border_radius(this._style.border_radius)
                .input
                    .color(this._style.fg_1)
                    .parent();
        }
        const CreateSelect = (args: any) => {
            return ExtendedSelect(args)
                .background(this._style.bg)
                .color(this._style.fg)
                .font_size(this._style.font_size)
                .missing_color(this._style.missing_fg)
                .focus_color(this._style.theme_fg)
                .border_color(this._style.divider_bg)
                .border_radius(this._style.border_radius)
                .dropdown_height(150)
                .background("transparent")
                .dropdown
                    .background(this._style.bg_1)
                    .background_blur(20)
                    .parent()
                .input
                    .white_space("pre")
                    // .border_radius(0)
                    .color(this._style.fg_1)
                    .parent();
        }

        // Create element.
        const input_spacing = 15;
        let country_code: any;
        this._billing_element = Form(

            Title("Billing Details")
                .color(this._style.fg)
                .width("fit-content")
                .font_size(this._style.font_size - 2)
                .flex_shrink(0)
                .margin(0, 0, 0, 0)
                .letter_spacing("1px")
                .text_transform("uppercase")
                .ellipsis_overflow(true),

            Divider()
                .background(this._style.divider_bg)
                .margin(10, 0, 10, 0),

            HStack(
                Text("Personal")
                    .font_size(this._style.font_size)
                    .color(this._style.fg)
                    .background(this._style.bg_1)
                    .padding(8, 6)
                    .margin(0)
                    .stretch(true)
                    .text_center()
                    .transition("color 350ms ease, background 350ms ease")
                    .on_mouse_over((e: any) => {
                        if (e.background() === "transparent") {
                            e.color(this._style.fg);
                        }
                    })
                    .on_mouse_out((e: any) => {
                        if (e.background() === "transparent") {
                            e.color(this._style.fg_1);
                        }
                    })
                    .on_click((e: any) => {

                        e.color(this._style.fg_1);
                        e.background(this._style.bg_1)
                        const other = e.parentElement.child(1);
                        other.color(this._style.fg_1);
                        other.background("none");

                        this._billing_element.name_input.show();
                        this._billing_element.name_input.required(true);
                        this._billing_element.business_input.hide();
                        this._billing_element.business_input.required(false);
                        this._billing_element.vat_id_input.hide();
                        this._billing_element.vat_id_input.required(false);
                    }),
                Text("Business")
                    .font_size(this._style.font_size)
                    .color(this._style.fg_1)
                    .background("transparent")
                    .padding(8, 6)
                    .margin(0)
                    .stretch(true)
                    .text_center()
                    .transition("color 350ms ease, background 350ms ease")
                    .on_mouse_over((e: any) => {
                        if (e.background() === "transparent") {
                            e.color(this._style.fg);
                        }
                    })
                    .on_mouse_out((e: any) => {
                        if (e.background() === "transparent") {
                            e.color(this._style.fg_1);
                        }
                    })
                    .on_click((e: any) => {

                        e.color(this._style.fg_1);
                        e.background(this._style.bg_1)
                        const other = e.parentElement.child(0);
                        other.color(this._style.fg_1);
                        other.background("transparent");

                        this._billing_element.name_input.hide();
                        this._billing_element.name_input.required(false);
                        this._billing_element.business_input.show();
                        this._billing_element.business_input.required(true);
                        this._billing_element.vat_id_input.show();
                        this._billing_element.vat_id_input.required(true);
                    }),
            )
            .overflow("hidden")
            .border(1, this._style.divider_bg)
            .border_radius(this._style.border_radius)
            .margin_top(10)
            .margin_bottom(10)
            .flex_shrink(0),

            CreateInput({
                label: "Full Name",
                placeholder: "John Doe",
            })
            .value(User.first_name() == null ? "" : (User.first_name() + " " + User.last_name()))
            .margin_top(input_spacing)
            .required(true)
            .id("name")
            .assign_to_parent_as("name_input"),

            CreateInput({
                label: "Business Name",
                placeholder: "Company Inc.",
            })
            .margin_top(input_spacing)
            .required(false)
            .id("business")
            .hide()
            .assign_to_parent_as("business_input"),

            CreateInput({
                label: "VAT ID",
                placeholder: "VAT ID",
            })
            .margin_top(input_spacing)
            .required(false)
            .id("vat_id")
            .hide()
            .assign_to_parent_as("vat_id_input"),

            CreateInput({
                label: "Email",
                placeholder: "my@email.com",
            })
            .value(User.email() || "")
            .margin_top(input_spacing)
            .required(true)
            .id("email"),

            CreateInput({
                label: "Street",
                placeholder: "123 Park Avenue",
            })
            .margin_top(input_spacing)
            .required(true)
            .id("street"),

            CreateInput({
                label: "House Number",
                placeholder: "Suite 405",
            })
            .margin_top(input_spacing)
            .required(true)
            .id("house_number"),

            CreateInput({
                label: "Postal Code",
                placeholder: "10001",
            })
            .margin_top(input_spacing)
            .required(true)
            .id("postal_code"),

            CreateInput({
                label: "City",
                placeholder: "New York",
            })
            .margin_top(input_spacing)
            .required(true)
            .id("city"),

            CreateInput({
                label: "Province",
                placeholder: "New York",
            })
            .margin_top(input_spacing)
            .required(true)
            .id("province"),

            CreateSelect({
                label: "Country",
                placeholder: "United States",
                items: Object.fromEntries(Object.entries(Payments.countries).map(([key, value]) => [key, value.name])),
            })
            .on_change((_: any, country: string) => {
                this._overview_element.calc_tax(country);
                country_code.value(Payments.countries[country].calling_code);
            })
            .margin_top(input_spacing)
            .required(true)
            .id("country"),

            HStack(
                country_code = CreateInput({
                    label: "Country Code",
                    placeholder: "+1",
                    type: "tel",
                })
                .max_width("fit-content")
                .margin_top(input_spacing)
                .margin_right(input_spacing)
                .required(true)
                .input
                    .readonly(true)
                    .parent()
                .id("phone_country_code"),

                CreateInput({
                    label: "Phone Number",
                    placeholder: "1234567890",
                    type: "tel",
                })
                .margin_top(input_spacing)
                .stretch(true)
                .required(true)
                .id("phone_number"),
            )
            .width("100%")
        );

        // Append.
        this._billing_container.append(this._billing_element);
    },

    // Render the payment element.
    _render_payment_element: async function(): Promise<void> {
        return new Promise((resolve, reject) => {
            this._render_payment_element_resolve = resolve;
            this._render_payment_element_reject = reject;

            // Already rendered.
            if (this._payment_element !== undefined) {
                return resolve();
            }

            // Checks.
            if (this.client_key == null) {
                return reject(new Error(`No client key has been assigned to "Payments.client_key".`));
            }
            if (this.cart.items.length === 0) {
                return reject(new Error("Shopping cart is empty."));
            }

            // Check subscription or one time payment.
            let is_subscription = false;
            this.cart.items.forEach((item: any) => {
                if (item.is_subscription === true) {
                    is_subscription = true;
                    return false;
                }
            });

            // Initialize paddle.
            this._initialize_paddle();

            // Create element.
            this._payment_element = VStack()
                .class("checkout-container");

            // Append.
            this._payment_container.append(this._payment_element);

            // Initialize.
            let custom_data: any = {
                customer_name: this._billing_details.name,
            };
            if (User.is_authenticated()) {
                custom_data.uid = User.uid();
            }
            try {
                let business: any = undefined;
                if (this._billing_details.business !== "") {
                    business = {
                        name: this._billing_details.business,
                        taxIdentifier: this._billing_details.vat_id === "" ? undefined : this._billing_details.vat_id,
                    };
                }
                Paddle.Checkout.open({
                    settings: {
                        displayMode: "inline",
                        theme: this._theme,
                        locale: "en",
                        frameTarget: "checkout-container",
                        frameInitialHeight: "450",
                        frameStyle: "width: 100%; min-width: 312px; background-color: transparent; border: none;",
                        // successUrl: this.return_url,
                        // successUrl: "http://test.vandenberghinc.com/checkout?payment_status=success",
                    },
                    items: this.cart.items.map((item: any) => { return { priceId: item.product.price_id, quantity: item.quantity }; }),
                    customer: {
                        email: this._billing_details.email,
                        address: {
                            countryCode: this._billing_details.country,
                            postalCode: this._billing_details.postal_code,
                            region: this._billing_details.province,
                            city: this._billing_details.city,
                            firstLine: `${this._billing_details.street} ${this._billing_details.house_number}`,
                        },
                        business,
                    },
                    customData: custom_data,
                });
            } catch (err: any) {
                return reject(err);
            }

            // const iframe = this._payment_element.children[0];
            // iframe.onload = () => {
            //     console.log("ON LOAD");
            //     let doc = iframe.contentDocument || iframe.contentWindow.document;
            //     let elementInsideIframe = doc.getElementById('cardNumber');
            //     elementInsideIframe.style.background = 'red'; // Example of editing an element
            // }

        });
    },

    // Render the processing element.
    _render_processing_element: function(): void {

        // Already defined.
        if (this._processing_element !== undefined) {
            this._processing_element.set_processing();
            return ;
        }
        
        // Create element.
        this._processing_element = VStack(
            Title("Processing")
                .color(this._style.fg)
                .font_size(this._style.font_size - 2)
                .flex_shrink(0)
                .letter_spacing("1px")
                .text_transform("uppercase")
                .ellipsis_overflow(true)
                .margin(0)
                .padding(0)
                .assign_to_parent_as("title_e"),
            Text("Processing your payment, please wait.")
                .color(this._style.fg_1)
                .font_size(this._style.font_size - 2)
                .line_height(this._style.font_size)
                .margin(5, 0, 0, 0)
                .padding(0)
                .assign_to_parent_as("text_e")
                .white_space("pre")
                .line_height("1.4em")
                .center(),
            ImageMask("/vweb_static/payments/error.webp")
                .hide()
                .frame(40, 40)
                .padding(5)
                .mask_color(this._style.missing_fg)
                .margin_top(15)
                .assign_to_parent_as("error_image_e"),
            Image("/vweb_static/payments/party.webp")
                .hide()
                .frame(40, 40)
                .margin_top(15)
                .assign_to_parent_as("success_image_e"),
            RingLoader()
                .background(this._style.theme_fg)
                .frame(40, 40)
                .update()
                .margin_top(15)
                .assign_to_parent_as("loader_e"),
        )
        .padding(15, 0)
        .center()
        .center_vertical()
        .extend({
            timestamp: Date.now(),
            /**
             * Set the processing element to display an error message.
             * @param message - The error message to display.
             */
            set_error: function (message: string = "The payment has failed, please check your information and try again.\n If the problem persists, contact support for assistance.") {
                this.loader_e.hide();
                this.error_image_e.src("/vweb_static/payments/error.webp");
                this.error_image_e.show();
                this.success_image_e.hide();
                this.title_e.text("Error");
                this.text_e.text(message);
            },
            /**
             * Set the processing element to display a cancelled message.
             * @param message - The cancellation message to display.
             */
            set_cancelled: function (message: string = "The payment has been cancelled.") {
                this.loader_e.hide();
                this.error_image_e.src("/vweb_static/payments/cancelled.webp");
                this.error_image_e.show();
                this.success_image_e.hide();
                this.title_e.text("Cancelled");
                this.text_e.text(message);
            },
            /**
             * Set the processing element to display a success message.
             * @param message - The success message to display.
             */
            set_success: function (message: string = "The payment has succeeded and is currently processing.\n Thank you for your purchase!") {
                this.loader_e.hide();
                this.error_image_e.hide();
                this.success_image_e.show();
                this.title_e.text("Success");
                this.text_e.text(message);
            },
            /**
             * Set the processing element to display a processing message.
             * @param message - The processing message to display.
             */
            set_processing: function (message: string = "Processing your payment, please wait.") {
                this.loader_e.show();
                this.error_image_e.hide();
                this.success_image_e.hide();
                this.title_e.text("Processing");
                this.text_e.text(message);
            },
        });

        // Append.
        this._processing_container.append(this._processing_element);
    },

    // Show the processing container.
    _show_processing: async function(status: string | null = null): Promise<void> {
        
        // Select step.
        this._step = 3;
        this._steps_element.select(this._step);

        // Render the processing element.
        this._render_processing_element();

        // Set elements.
        this._order_container.hide();
        this._billing_container.hide();
        this._payment_container.hide();
        this._processing_container.show();
        this._overview_container.hide();
        this._prev_step_button.hide();

        // Update.
        if (status != null) {
            this._update_processing(status);
        }

    },

    // Update the processing container.
    _update_processing: async function(status: string): Promise<void> {

        // Handle result code.
        switch (status) {
            case "success":
                this._processing_element.set_success();
                break;
            case "processing":
                this._processing_element.set_processing();
                break;
            case "cancelled":
                this._processing_element.set_cancelled();
                break;
            case "error":
                this._processing_element.set_error();
                break;
            default:
                console.error(`Unknown session result code "${status}".`);
                this._processing_element.set_error("An unknown error has occurred.");
                break;
        }
    },

    // Initialize checkout page.
    style: function({
        theme = "light", // light or dark
        font_size = 16,
        border_radius = 10,
        bg = "#FFFFFF",
        bg_1 = "#00000099",
        divider_bg = "gray",
        fg = "#687282",
        fg_1 = "black",
        fg_2 = "#6D6E77",
        theme_fg = "#8EB8EB",
        missing_fg = "#E8454E",
        selected = {
            fg: null as null | string,
            bg: null as null | string,
        },
        button = {
            fg: null as null | string,
            bg: null as null | string,
            border_color: null as null | string,
            border_radius: 25 as null | number,
            border_width: 1 as null | number | string,
            border_inset: false,
            hover_brightness: [1.1, 1.2] as null | number[],
        },
    } = {}): void {
        // Set selected defaults.
        if (selected == null) {
            selected = { fg: null, bg: null };
        }
        selected.fg ??= fg;
        selected.bg ??= theme_fg;

        // Set button defaults.
        if (button == null) {
            button = {
                fg: null,
                bg: null,
                border_radius: null,
                border_color: null,
                border_width: 1,
                hover_brightness: null,
                border_inset: false,
            };
        }
        button.fg ??= fg;
        button.bg ??= bg_1; // Corrected bg_2 to bg_1 as bg_2 is not defined
        button.border_radius ??= 25;
        button.border_color ??= fg;
        button.border_width ??= 1;
        button.border_inset ??= false;
        button.hover_brightness ??= [1.1, 1.2];
        if (typeof button.border_width === "number") { button.border_width = `${button.border_width}px`; }

        // Save style.
        this._style = {};
        this._theme = theme;
        this._style.font_size = font_size;
        this._style.border_radius = border_radius;
        this._style.bg = bg;
        this._style.bg_1 = bg_1;
        this._style.divider_bg = divider_bg;
        this._style.fg = fg;
        this._style.fg_1 = fg_1;
        this._style.fg_2 = fg_2;
        this._style.theme_fg = theme_fg;
        this._style.missing_fg = missing_fg;
        this._style.selected = selected;
        this._style.button = button;

        // Set CSS variables.
        Object.keys(this._style).forEach((key) => {
            if (typeof this._style[key] === "number") {
                document.documentElement.style.setProperty(`--vpayments_${key}`, `${this._style[key]}px`);
            } else {
                document.documentElement.style.setProperty(`--vpayments_${key}`, this._style[key]);
            }
        });
        document.documentElement.style.setProperty(`--vpayments_theme_fg_80`, `${this._style.theme_fg}80`);
        document.documentElement.style.setProperty(`--vpayments_missing_fg_80`, `${this._style.missing_fg}80`);
    },

    // Initialize checkout page.
    create_checkout_dropin: function({
        steps_container,
        order_container,
        billing_container,
        payment_container,
        processing_container,
        overview_container,
        sign_in_redirect = null,
        on_error = (error: string | Error) => {},
    }: {
        steps_container: any,
        order_container: any,
        billing_container: any,
        payment_container: any,
        processing_container: any,
        overview_container: any,
        sign_in_redirect?: string | null,
        on_error?: (error: string | Error) => void,
    }): void {
        
        // Check args.
        if (!(steps_container instanceof Node)) {
            throw new Error('The "steps_container" must be assigned with a container node.');
        }
        if (!(order_container instanceof Node)) {
            throw new Error('The "order_container" must be assigned with a container node.');
        }
        if (!(billing_container instanceof Node)) {
            throw new Error('The "billing_container" must be assigned with a container node.');
        }
        if (!(payment_container instanceof Node)) {
            throw new Error('The "payment_container" must be assigned with a container node.');
        }
        if (!(processing_container instanceof Node)) {
            throw new Error('The "processing_container" must be assigned with a container node.');
        }
        if (!(overview_container instanceof Node)) {
            throw new Error('The "overview_container" must be assigned with a container node.');
        }

        // Args.
        this._steps_container = steps_container;
        this._order_container = order_container;
        // @ts-ignore
        this._billing_container = billing_container.hide();
        // @ts-ignore
        this._payment_container = payment_container.hide();
        // @ts-ignore
        this._processing_container = processing_container.hide();
        this._overview_container = overview_container;

        // Settings.
        this._sign_in_redirect = sign_in_redirect;

        // Events.
        this.on_error = on_error;

        // Check style.
        if (this._style === undefined) {
            this.style();
        }

        // Other attributes.
        this._step = 0;

        // Render the steps element.
        this._render_steps_element();

        // When the user was redirected the URL params are defined, if so only render the processing view.
        if (Utils.url_param("payment_status", null) != null) {
            this._show_processing(Utils.url_param("payment_status", null));
        }
        // No redirect.
        else {
            // Render the overview element.
            this._render_overview_element();

            // Render the order element.
            // Must be rendered after the overview element is rendered.
            this._render_order_element();
        }
    },

    // Initialize refund page.
    create_refunds_dropin: function({
        // The element containers.
        refunds_container,

        // Refundable settings.
        days_refundable = 30,

        // Events.
        on_error = (error: any) => {},
    }: {
        refunds_container: any,
        days_refundable?: number,
        on_error?: (error: any) => void,
    }): void {

        // Check args.
        if (!(refunds_container instanceof Node)) {
            throw new Error('The "refunds_container" must be assigned with a container node.');
        }

        // Args.
        this._refunds_container = refunds_container;
        this._days_refundable = days_refundable;
        
        // Events.
        this.on_error = on_error;

        // Check style.
        if (this._style === undefined) {
            this.style();
        }

        // Other attributes.
        this._step = 0;

        // Render the refunds element.
        this._render_refunds_element();
    },

    // Backend API.

    // Get the currency symbol for a product currency.
    // Returns `null` when the currency is not supported.
    /**
     * @docs:
     * @nav: Frontend
     * @chapter: Payments
     * @title: Get Currency Symbol
     * @description: Get the currency symbol for a product currency.
     * @type: string | null
     * @return: Returns the currency symbol when the currency is supported, otherwise `null`
     * @param:
     *   @name: currency
     *   @description: The currency from the product object.
     */
    get_currency_symbol: function(currency: string): string | null {
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

    // Fetch the payment products.
    /**
     * @docs:
     * @nav: Frontend
     * @chapter: Payments
     * @title: Payment Products
     * @description: Get the backend defined payment products asynchronously.
     * @type: array[object]
     * @return: Returns the backend defined payment products.
     */
    get_products: async function(): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (this._products !== undefined) {
                return resolve(this._products);
            }
            Utils.request({
                method: "GET",
                url: "/vweb/payments/products",
            })
            .then((products: any[]) => {
                this._products = products;
                resolve(this._products);
            })
            .catch((err: any) => {
                reject(err);
            });
        });
    },

    // Fetch a payment product by id.
    /**
     * @docs:
     * @nav: Frontend
     * @chapter: Payments
     * @title: Get Payment Product
     * @description: Get the backend defined payment product by id asynchronously.
     * @type: object
     * @return: Returns the backend defined payment product.
     * @param:
     *   @name: id
     *   @required: true
     *   @type: string
     *   @desc: The id of the payment product.
     */
    get_product: async function(id: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const products = await this.get_products();
            let product: any = null;
            for (const p of products) {
                if (p.id === id) {
                    product = p;
                    break;
                }
                if (p.is_subscription) {
                    for (const plan of p.plans) {
                        if (plan.id === id) {
                            product = plan;
                            break;
                        }
                    }
                    if (product) break;
                }
            }
            if (product == null) {
                return reject(new Error(`Product "${id}" does not exist.`));
            }
            resolve(product);
        });
    },

    // Fetch a payment object by id.
    /**
     * @docs:
     * @nav: Frontend
     * @chapter: Payments
     * @title: Get Payment.
     * @desc: Get a payment by id.
     * @param:
     *   @name: id
     *   @required: true
     *   @type: string
     *   @desc: The id of the payment.
     */
    get_payment: async function(id: string): Promise<any> {
        return Utils.request({
            method: "GET",
            url: "/vweb/payments/payment",
            data: {
                id: id,
            }
        });
    },

    // Get all payments.
    /**
     * @docs:
     * @nav: Frontend
     * @chapter: Payments
     * @title: Get Refunded Payments.
     * @desc:
     *   Get all payments of the authenticated user
     *
     *   All failed payments are no longer stored in the database.
     * @param:
     *   @name: days
     *   @type: number
     *   @desc: Retrieve payments from the last amount of days.
     * @param:
     *   @name: limit
     *   @type: number
     *   @desc: Limit the amount of response payment objects.
     * @param:
     *   @name: status
     *   @type: string
     *   @desc: Filter the payments by status. Be aware that the line items of a payment also have a status with possible values of `open`, `cancelled`, `refunding` or `refunded.`
     *   @enum:
     *     @value: "open"
     *     @desc: Payments that are still open and unpaid.
     *   @enum:
     *     @value: "paid"
     *     @desc: Payments that are paid.
     */
    get_payments: async function({
        days = 30,
        limit = null,
        status = null,
    } = {}): Promise<any> {
        return Utils.request({
            method: "GET",
            url: "/vweb/payments/payments",
            data: {
                days,
                limit,
                status,
            }
        });
    },

    // Get refundable payments.
    /**
     * @docs:
     * @nav: Frontend
     * @chapter: Payments
     * @title: Get Refundable Payments.
     * @desc: Get all payments that are refundable for the authenticated user.
     * @param:
     *   @name: days
     *   @type: number
     *   @desc: Retrieve payments from the last amount of days.
     * @param:
     *   @name: limit
     *   @type: number
     *   @desc: Limit the amount of response payment objects.
     */
    get_refundable_payments: async function({
        days = 30,
        limit = null,
    } = {}): Promise<any> {
        return Utils.request({
            method: "GET",
            url: "/vweb/payments/payments/refundable",
            data: {
                days,
                limit,
            }
        });
    },

    // Get refunded payments.
    /**
     * @docs:
     * @nav: Frontend
     * @chapter: Payments
     * @title: Get Refunded Payments.
     * @desc: Get all successfully refunded payments of the authenticated user.
     * @param:
     *   @name: days
     *   @type: number
     *   @desc: Retrieve payments from the last amount of days.
     * @param:
     *   @name: limit
     *   @type: number
     *   @desc: Limit the amount of response payment objects.
     */
    get_refunded_payments: async function({
        days = 30,
        limit = null,
    } = {}): Promise<any> {
        return Utils.request({
            method: "GET",
            url: "/vweb/payments/payments/refunded",
            data: {
                days,
                limit,
            }
        });
    },

    // Get refunding payments.
    /**
     * @docs:
     * @nav: Frontend
     * @chapter: Payments
     * @title: Get Refunding Payments.
     * @desc: Get all payments that are currently in the refunding process of the authenticated user.
     * @param:
     *   @name: days
     *   @type: number
     *   @desc: Retrieve payments from the last amount of days.
     * @param:
     *   @name: limit
     *   @type: number
     *   @desc: Limit the amount of response payment objects.
     */
    get_refunding_payments: async function({
        days = null,
        limit = null,
    } = {}): Promise<any> {
        return Utils.request({
            method: "GET",
            url: "/vweb/payments/payments/refunding",
            data: {
                days,
                limit,
            }
        });
    },

    // Create refund.
    /**
     * @docs:
     * @nav: Frontend
     * @chapter: Payments
     * @title: Refund Payment.
     * @desc: Refund a payment based on the payment id for the authenticated user.
     * @warning: Refunding a subscription will also cancel all other subscriptions that were created by the same payment request.
     * @param:
     *   @name: payment
     *   @required: true
     *   @type: number | string
     *   @desc: The id of the payment object or the payment object itself.
     * @param:
     *   @name: line_items
     *   @required: true
     *   @type: array[object]
     *   @desc: The line items to refund, these must be retrieved from the original payment line items otherwise it may cause undefined behaviour. When undefined the entire payment will be refunded.
     * @param:
     *   @name: reason
     *   @type: string
     *   @desc: The refund reason.
     */
    create_refund: async function(payment: number | string, line_items: any[] | null = null, reason: string = "refund"): Promise<any> {
        return Utils.request({
            method: "POST",
            url: "/vweb/payments/refund",
            data: {
                payment,
                line_items,
                reason,
            }
        });
    },

    // Cancel subscription.
    /**
     * @docs:
     * @nav: Frontend
     * @chapter: Payments
     * @title: Cancel Subscription.
     * @desc: Cancel a subscription based on the product id.
     * @warning: Cancelling a subscription will also cancel all other subscriptions that were created by the same payment request.
     * @param:
     *   @name: product
     *   @required: true
     *   @type: string
     *   @desc: The product id.
     */
    cancel_subscription: async function(product: string): Promise<any> {
        return Utils.request({
            method: "DELETE",
            url: "/vweb/payments/subscription",
            data: {
                product,
            }
        });
    },

    // Is subscribed.
    /**
     * @docs:
     * @nav: Frontend
     * @chapter: Payments
     * @title: Is Subscribed.
     * @desc: Check if the authenticated user is subscribed to a product plan.
     * @param:
     *   @name: product
     *   @required: true
     *   @type: string
     *   @desc: The product id.
     */
    is_subscribed: async function(product: string): Promise<any> {
        return Utils.request({
            method: "GET",
            url: "/vweb/payments/subscribed",
            data: {
                product,
            }
        });
    },

    // Get active subscriptions.
    /**
     * @docs:
     * @nav: Frontend
     * @chapter: Payments
     * @title: Get active subscriptions
     * @desc: Get the active subscriptions of the authenticated user.
     */
    get_active_subscriptions: async function(): Promise<any> {
        return Utils.request({
            method: "GET",
            url: "/vweb/payments/active_subscriptions",
        });
    },

    // Shopping cart.

    // The shopping cart object.
    cart: {
        items: [] as any[],

        // Refresh the shopping cart.
        /**
         * @docs:
         * @nav: Frontend
         * @chapter: Payments
         * @title: Refresh Cart
         * @description:
         *   Refresh the shopping cart.
         *
         *   The current cart items are accessible as `Payments.cart.items`.
         */
        refresh: function(): void {
            // Load from local storage.
            try {
                this.items = JSON.parse(localStorage.getItem("vweb_shopping_cart") as string) || [];
            } catch(err) {
                this.items = [];
            }

            // Reset the charge objects.
            Payments._reset();
        },

        // Save the shopping cart.
        /**
         * @docs:
         * @nav: Frontend
         * @chapter: Payments
         * @title: Save Cart
         * @description:
         *   Save the shopping cart in the local storage.
         *
         *   The current cart items are accessible as `Payments.cart.items`.
         */
        save: function(): void {
            // Save to local storage.
            localStorage.setItem("vweb_shopping_cart", JSON.stringify(this.items));

            // Reset the charge objects.
            Payments._reset();
        },

        // Add a product to the shopping cart.
        /**
         * @docs:
         * @nav: Frontend
         * @chapter: Payments
         * @title: Add to Cart
         * @description: 
         *   Add a product to the shopping cart.
         *
         *   When the product was already added to the shopping cart only the quantity will be incremented.
         *
         *   An error will be thrown if the product id does not exist.
         *
         *   The current cart items are accessible as `Payments.cart.items`.
         * @param:
         *   @name: id
         *   @description: The product's id.
         *   @type: string
         * @param:
         *   @name: quantity
         *   @description: The quantity to add.
         *   @type: number
         */
        add: async function(id: string, quantity: number = 1): Promise<void> {
            this.refresh(); // Update in case another window has updated the cart.
            const found = this.items.some((item: any) => {
                if (item.product.id === id) {
                    item.quantity += quantity;
                    return true;
                }
                return false;
            });
            if (!found) {
                try {
                    const product = await Payments.get_product(id);
                    this.items.push({
                        product: product,
                        quantity: quantity,
                    });
                } catch (error: any) {
                    console.error(error);
                    Payments.on_error(error as Error);
                    throw new Error(`Failed to add product with id "${id}" to the cart.`);
                }
            }
            this.save();
        },

        // Remove a product from the shopping cart.
        /**
         * @docs:
         * @nav: Frontend
         * @chapter: Payments
         * @title: Remove from Cart
         * @description: 
         *   Remove a product from the shopping cart.
         *
         *   Does not throw an error when the product was not added to the shopping cart.
         *
         *   The current cart items are accessible as `Payments.cart.items`.
         * @param:
         *   @name: id
         *   @description: The product's id.
         *   @type: string
         * @param:
         *   @name: quantity
         *   @description: The quantity to remove. When the quantity value is "all", the entire product will be removed from the shopping cart.
         *   @type: number | "all"
         */
        remove: async function(id: string, quantity: number | "all" = 1): Promise<void> {
            this.refresh(); // Update in case another window has updated the cart.
            let new_cart: any[] = [];
            this.items.forEach((item: any) => {
                if (item.product.id === id) {
                    if (quantity === "all") {
                        item.quantity = 0;
                    } else {
                        item.quantity -= quantity;
                    }
                }
                if (item.quantity > 0) {
                    new_cart.push(item);
                }
            });
            this.items = new_cart;
            this.save();
        },

        // Clear the shopping cart.
        /**
         * @docs:
         * @nav: Frontend
         * @chapter: Payments
         * @title: Clear Cart
         * @description: 
         *   Clear the shopping cart.
         *
         *   Will automatically be called if `Payments.confirm_charge()` finishes without any errors.
         *
         *   The current cart items are accessible as `Payments.cart.items`.
         */
        clear: async function(): Promise<void> {
            this.items = [];
            this.save();
        }
    },


};

// Exports.
export { Payments };