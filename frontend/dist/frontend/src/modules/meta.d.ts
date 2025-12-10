/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
export declare namespace Meta {
    function set({ author, title, description, image, favicon, }: {
        author?: string;
        title?: string;
        description?: string;
        image?: string;
        favicon?: string;
    }): void;
}
export { Meta as meta };
