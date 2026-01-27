/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
/** Nested types for the {@link Meta} class. */
export declare namespace Meta {
    /**
     * Options for constructing a {@link Meta} object.
     *
     * @docs
     */
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
 * The meta information class for HTML endpoints.
 *
 * @nav Endpoints
 * @docs
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
    /**
     * Construct a meta information object.
     * @docs
     */
    constructor({ author, title, description, image, robots, charset, viewport, favicon, }?: Meta.Opts);
    /**
     * Create a copy of the current meta object without any references.
     * @param override - The <Type>Meta</Type> constructor arguments to override.
     * @docs
     */
    copy(override?: Partial<Meta.Opts>): Meta;
    /**
     * Update the author property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_author(value: string | undefined): this;
    /**
     * Update the title property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_title(value: string | undefined): this;
    /**
     * Update the description property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_description(value: string | undefined): this;
    /**
     * Update the image property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_image(value: string | undefined): this;
    /**
     * Update the robots property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_robots(value: string): this;
    /**
     * Update the charset property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_charset(value: string): this;
    /**
     * Update the viewport property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_viewport(value: string): this;
    /**
     * Update the favicon property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_favicon(value: string): this;
    /**
     * Get the meta information as a plain object.
     * @docs
     */
    obj(): Meta.Opts;
    build_html(domain?: string | null): string;
}
export default Meta;
