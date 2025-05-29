"use strict";
/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// ---------------------------------------------------------
// Meta information.
/*  @docs:
 *  @nav: Backend
    @chapter: Endpoints
    @title: Meta
    @description: The js view meta information class.
    @parameter:
        @name: author
        @description: The author's name.
        @type: string
    @parameter:
        @name: title
        @description: The page's title.
        @type: string
    @parameter:
        @name: description
        @description: The page's description.
        @type: string
    @parameter:
        @name: image
        @description: The page's image source.
        @type: string
    @parameter:
        @name: robots
        @description: The robots rules.
        @type: string
    @parameter:
        @name: charset
        @description: The used charset.
        @type: string
    @parameter:
        @name: viewport
        @description: The viewport settings.
        @type: string
    @parameter:
        @name: favicon
        @description: The url to the favicon.
        @type: string
 */
class Meta {
    constructor({ author = null, title = null, description = null, image = null, robots = "index, follow", charset = "UTF-8", viewport = "width=device-width, initial-scale=1", favicon = "/favicon.ico", } = {}) {
        this.author = author;
        this.title = title;
        this.description = description;
        this.image = image;
        this.robots = robots;
        this.charset = charset;
        this.viewport = viewport;
        this.favicon = favicon;
    }
    // Copy.
    /*  @docs:
        @title: Copy
        @description: Create a copy of the current meta object without any references.
        @param:
            @name: override
            @descr: The <Type>Meta</Type> constructor arguments to override.
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
    /* @docs:
     * @title: Set value
     * @description: Set value funcs that return the current object.
     * @return: Returns the current <Type>Meta</Type> object.
     * @type: Meta
     * @funcs: 8
     */
    set_author(value) { this.author = value; return this; }
    set_title(value) { this.title = value; return this; }
    set_description(value) { this.description = value; return this; }
    set_image(value) { this.image = value; return this; }
    set_robots(value) { this.robots = value; return this; }
    set_charset(value) { this.charset = value; return this; }
    set_viewport(value) { this.viewport = value; return this; }
    set_favicon(value) { this.favicon = value; return this; }
    // Get as object.
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
module.exports = Meta;
