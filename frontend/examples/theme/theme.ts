// @ts-nocheck

// Imports.
// import * as volt from "@vandenberghinc/volt/frontend";

// ---------------------------------------------------------
// Themes.	

// Create theme from options.
const create_theme = (opts: {
    bg: string;
    fg: string;
    primary: string;
}) => {
    return {
        /** 
         * The relative value for font sizes, and the font size used for paragraphs.
         * @warning work with a single fixed font size, and base all other font sizes on this font size using `Theme.multiply("font_size", 1.0)`.
         */
        font_size: 16,

        /** Code fonts */
        font: "'Mona Sans', sans-serif",
        code_font: "'Menlo', 'Consolas', monospace",

        /** Colors */
        primary: opts.primary,
        bg: opts.bg,
        bg_0: opts.bg,
        bg_1: new volt.Color(opts.bg).auto_darken_lighten(0.02).rgb(),
        bg_2: new volt.Color(opts.bg).auto_darken_lighten(0.04).rgb(),
        bg_3: new volt.Color(opts.bg).auto_darken_lighten(0.08).rgb(),
        bg_hover: new volt.Color(opts.bg).auto_darken_lighten(0.02).rgb(),
        div_bg: volt.Color.opposite_s(opts.bg).opacity(0.075).rgb(),
        fg: opts.fg,
        fg_0: opts.fg,
        fg_1: new volt.Color(opts.bg).auto_darken_lighten(0.7).rgb(),
        fg_2: new volt.Color(opts.bg).auto_darken_lighten(0.5).rgb(),

        green: "#60B05B",
        red: "#CA3140",
        yellow: "#F1DA6C", //"#FFFC79",
    }
}

// Initialize the theme.
export const Theme = new volt.Theme("my_website", {
    dark: create_theme({
        bg: "#0B0E12",
        fg: "#FFFFFF", // #F0F0F0
        primary: `linear-gradient(110deg, #00FDF1, rgb(87, 149, 243) 7.5%, #B96593)`,
    }),
    light: create_theme({
        bg: "#F0F0F0",
        fg: "#0E1D32",
        primary: `linear-gradient(110deg, #00FDF1, rgb(87, 149, 243) 7.5%, #B96593)`,
    }),
}) as volt.ExtendTheme<ReturnType<typeof create_theme>>;