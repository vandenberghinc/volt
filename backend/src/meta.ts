/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

// ---------------------------------------------------------
// Meta information.

/** Nested types for the {@link Meta} class. */
export namespace Meta {

    /**
     * Options for constructing a {@link Meta} object.
     * 
     * @docs
     */
    export interface Opts {
        /** The author's name. */
        author?: string,
        /** The page's title. */
        title?: string,
        /** The page's description. */
        description?: string,
        /** The page's image source. */
        image?: string,
        /** The robots rules. */
        robots?: string,
        /** The used charset. */
        charset?: string,
        /** The viewport settings. */
        viewport?: string,
        /** The url to the favicon. */
        favicon?: string,
    }
}

/**
 * The meta information class for HTML endpoints.
 * 
 * @nav Endpoints
 * @docs
 */
export class Meta {
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
    constructor({
        author,
        title,
        description,
        image,
        robots = "index, follow",
        charset = "UTF-8",
        viewport = "width=device-width, initial-scale=1",
        favicon = "/favicon.ico",
    }: Meta.Opts = {}) {
        this.author = author;
        this.title = title;
        this.description = description;
        this.image = image;
        this.robots = robots;
        this.charset = charset;
        this.viewport = viewport;
        this.favicon = favicon;
    }

    /**
     * Create a copy of the current meta object without any references.
     * @param override - The meta constructor arguments to override.
     * @docs
     */
    copy(override: Partial<Meta.Opts> = {}): Meta {
        return new Meta({
            author: this.author,
            title: this.title,
            description: this.description,
            image: this.image,
            robots: this.robots,
            charset: this.charset,
            viewport: this.viewport,
            favicon: this.favicon,
            ...override,
        })
    }

    /**
     * Update the author property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_author(value: string | undefined): this { this.author = value; return this; }
    
    /**
     * Update the title property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_title(value: string | undefined): this { this.title = value; return this; }
    
    /**
     * Update the description property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_description(value: string | undefined): this { this.description = value; return this; }
    
    /**
     * Update the image property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_image(value: string | undefined): this { this.image = value; return this; }
    
    /**
     * Update the robots property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_robots(value: string): this { this.robots = value; return this; }
    
    /**
     * Update the charset property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_charset(value: string): this { this.charset = value; return this; }
    
    /**
     * Update the viewport property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_viewport(value: string): this { this.viewport = value; return this; }
    
    /**
     * Update the favicon property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_favicon(value: string): this { this.favicon = value; return this; }

    /**
     * Get the meta information as a plain object.
     * @docs
     */
    obj(): Meta.Opts {
        return {
            author: this.author,
            title: this.title,
            description: this.description,
            image: this.image,
            robots: this.robots,
            charset: this.charset,
            viewport: this.viewport,
            favicon: this.favicon,
        };
    }

    // Build meta headers.
    build_html(domain: string | null = null): string {
        let html = "";

        // Default meta data.
        html += `<meta charset='${this.charset}'>`;
        html += `<meta name='viewport' content='${this.viewport}'/>`;
        
        // Meta.
        html += `<title id='__page_title'>${this.title}</title>`;
        html += `<meta name='author' content='${this.author}'/>`;
        html += `<meta name='description' content='${this.description}'/>`;
        
        // Meta/facebook.
        html += `<meta property='og:title' content='${this.title}'/>`;
        html += `<meta property='og:description' content='${this.description}'/>`;
        html += `<meta property='og:image' content='${this.image}'/>`;
        if (domain) {
            html += `<meta property="og:url" content="${domain}"/>`
        }
        html += `<meta property="og:type" content="website"/>`

        // Twitter/X.
        html += `<meta name='twitter:card' content='summary_large_image'/>`;
        // html += `<meta name='twitter:site' content='${this.image}'/>`; // twitter username.
        html += `<meta name='twitter:title' content='${this.title}'/>`;
        html += `<meta name='twitter:description' content='${this.description}'/>`;
        html += `<meta name='twitter:image' content='${this.image}'/>`;

        // FB App id.
        // <meta property="fb:app_id" content="your-facebook-app-id" />
        
        // Meta robots.
        html += `<meta name='robots' content='${this.robots}'>`;
        
        // Favicon.
        html += `<link rel='icon' href='${this.favicon}' type='image/x-icon'/>`;

        // Response.
        return html;
    }
}

// ---------------------------------------------------------
// Exports.

export default Meta;