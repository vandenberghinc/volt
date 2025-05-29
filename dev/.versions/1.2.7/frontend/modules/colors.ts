// Define types for color objects
interface RGBA {
    r: number;
    g: number;
    b: number;
    a?: number;
}

// Colors module
const Colors = {
    // Hex module
    hex: {
        // Get the brightness of a hex color (0.0 white, 1.0 dark)
        get_brightness(color: string): number {
            color = color.replace(/^#/, '');

            const bigint = parseInt(color, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;

            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return brightness;
        },

        // Convert hex to RGBA
        to_rgb(hex: string, as_array: boolean = false): RGBA | number[] {
            const index = hex.indexOf("#");
            if (index !== -1) {
                hex = hex.substr(index + 1);
            }

            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            let a = 1;

            if (hex.length > 6) {
                a = parseInt(hex.substring(6, 8), 16) / 255;
            }

            if (as_array) {
                return [r, g, b, a];
            }

            return { r, g, b, a };
        },

        // Adjust brightness of a hex color
        adjust_brightness(color: string, adjust: number = 0): string {
            const rgba = this.to_rgb(color);
            if (Array.isArray(rgba)) {
                rgba[0] += adjust;
                rgba[1] += adjust;
                rgba[2] += adjust;
                return Colors.rgb.to_hex(rgba[0], rgba[1], rgba[2], rgba[3]);
            } else {
                rgba.r += adjust;
                rgba.g += adjust;
                rgba.b += adjust;
                return Colors.rgb.to_hex(rgba.r, rgba.g, rgba.b, rgba.a);
            }
        },

        // Placeholder for aliasing
        to_rgba: null as unknown as (hex: string, as_array?: boolean) => RGBA | number[],
    },

    // RGB module
    rgb: {
        // RGB(a) to hex
        to_hex(r: number, g: number, b: number, a: number = 1): string {
            const hexR = Math.round(r).toString(16).padStart(2, '0');
            const hexG = Math.round(g).toString(16).padStart(2, '0');
            const hexB = Math.round(b).toString(16).padStart(2, '0');
            const hexA = a === 1 ? "" : Math.round(a * 255).toString(16).padStart(2, '0');

            return `#${hexR}${hexG}${hexB}${hexA}`;
        },

        // Convert a color string (e.g., "rgb(255, 0, 0)") to an RGBA object
        to_obj(color: string): RGBA {
            if (!color.startsWith("rgba(") && !color.startsWith("rgb(")) {
                throw new Error("Invalid color format");
            }

            const split = color.trim().split("(")[1].slice(0, -1).split(",");
            const obj: RGBA = { r: 0, g: 0, b: 0, a: 1 };

            obj.r = parseInt(split[0].trim());
            obj.g = parseInt(split[1].trim());
            obj.b = parseInt(split[2].trim());
            if (split[3]) {
                obj.a = parseFloat(split[3].trim());
            }

            return obj;
        },

        // Convert RGBA values to a color string
        to_str(r: number, g: number, b: number, a: number = 1): string {
            if (a !== 1) {
                return `rgba(${r}, ${g}, ${b}, ${a})`;
            } else {
                return `rgb(${r}, ${g}, ${b})`;
            }
        },

        // Adjust brightness of an RGB color
        adjust_brightness(color: string, adjust: number = 0): string {
            const rgba = this.to_obj(color);
            rgba.r += adjust;
            rgba.g += adjust;
            rgba.b += adjust;
            return this.to_str(rgba.r, rgba.g, rgba.b, rgba.a);
        },
    },

    // Placeholder for aliasing
    rgba: null as unknown as typeof Colors.rgb,

    // Utility function to adjust brightness
    adjust_brightness(color: string, adjust: number = 0): string {
        if (color.startsWith("rgb")) {
            return this.rgb.adjust_brightness(color, adjust);
        } else if (color.startsWith("#")) {
            return this.hex.adjust_brightness(color, adjust);
        } else {
            throw new Error("Invalid color format");
        }
    },

    // Set the opacity of a color
    set_opacity(color: string, opacity: number = 1.0): string {
        let rgba: RGBA;
        let type: 'rgb' | 'hex';

        if (color.startsWith("rgb")) {
            type = "rgb";
            rgba = this.rgb.to_obj(color);
        } else if (color.startsWith("#")) {
            type = "hex";
            const result = this.hex.to_rgb(color);
            rgba = Array.isArray(result) ? { r: result[0], g: result[1], b: result[2], a: result[3] } : result;
        } else {
            throw new Error("Invalid color format");
        }

        rgba.a = opacity;

        if (type === "hex") {
            return this.rgb.to_hex(rgba.r, rgba.g, rgba.b, rgba.a);
        } else {
            return this.rgb.to_str(rgba.r, rgba.g, rgba.b, rgba.a);
        }
    },
};

// Aliases
Colors.hex.to_rgba = Colors.hex.to_rgb;
Colors.rgba = Colors.rgb;

// Export
export { Colors };
