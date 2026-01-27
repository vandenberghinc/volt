/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
/**
 * The meta information class for HTML endpoints.
 *
 * @nav Endpoints
 * @docs
 */
export class Meta {
    author;
    title;
    description;
    image;
    robots;
    charset;
    viewport;
    favicon;
    /**
     * Construct a meta information object.
     * @docs
     */
    constructor({ author, title, description, image, robots = "index, follow", charset = "UTF-8", viewport = "width=device-width, initial-scale=1", favicon = "/favicon.ico", } = {}) {
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
     * @param override - The <Type>Meta</Type> constructor arguments to override.
     * @docs
     */
    copy(override = {}) {
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
        });
    }
    /**
     * Update the author property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_author(value) { this.author = value; return this; }
    /**
     * Update the title property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_title(value) { this.title = value; return this; }
    /**
     * Update the description property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_description(value) { this.description = value; return this; }
    /**
     * Update the image property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_image(value) { this.image = value; return this; }
    /**
     * Update the robots property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_robots(value) { this.robots = value; return this; }
    /**
     * Update the charset property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_charset(value) { this.charset = value; return this; }
    /**
     * Update the viewport property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_viewport(value) { this.viewport = value; return this; }
    /**
     * Update the favicon property.
     * @return Returns the current {@link Meta} instance for chaining.
     * @docs
     */
    set_favicon(value) { this.favicon = value; return this; }
    /**
     * Get the meta information as a plain object.
     * @docs
     */
    obj() {
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
    build_html(domain = null) {
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
            html += `<meta property="og:url" content="${domain}"/>`;
        }
        html += `<meta property="og:type" content="website"/>`;
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
