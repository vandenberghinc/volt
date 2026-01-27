/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
/** Nested types for the {@link Meta} class. */
export declare namespace Meta {
    /** Constructor options. */
    interface Opts {
        /** The author's name. */
        author?: string;
        /** The page's title. */
        title?: string;
        /** The page's description. */
        description?: string;
        /** The page's image source. */
        image?: string;
        /** The robots rules. */
        robots?: string;
        /** The used charset. */
        charset?: string;
        /** The viewport settings. */
        viewport?: string;
        /** The url to the favicon. */
        favicon?: string;
    }
}
/**
 * The js view meta information class.
 * @nav Backend/Endpoints
 */
export declare class Meta {
    author?: string;
    title?: string;
    description?: string;
    image?: string;
    robots: string;
    charset: string;
    viewport: string;
    favicon: string;
    constructor({ author, title, description, image, robots, charset, viewport, favicon, }?: Meta.Opts);
    /**
     * Create a copy of the current meta object without any references.
     * @param override - The <Type>Meta</Type> constructor arguments to override.
     * @docs
     */
    copy(override?: Partial<Meta.Opts>): Meta;
    /**
     * Set value funcs that return the current object.
     * @return: Returns the current <Type>Meta</Type> object.
     * @funcs 8
     * @docs
     */
    set_author(value: string | undefined): this;
    set_title(value: string | undefined): this;
    set_description(value: string | undefined): this;
    set_image(value: string | undefined): this;
    set_robots(value: string): this;
    set_charset(value: string): this;
    set_viewport(value: string): this;
    set_favicon(value: string): this;
    obj(): Meta.Opts;
    build_html(domain?: string | null): string;
}
export default Meta;
