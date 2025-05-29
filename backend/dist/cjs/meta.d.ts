export declare class Meta {
    author: string | null;
    title: string | null;
    description: string | null;
    image: string | null;
    robots: string;
    charset: string;
    viewport: string;
    favicon: string;
    constructor({ author, title, description, image, robots, charset, viewport, favicon, }?: {
        author?: string | null;
        title?: string | null;
        description?: string | null;
        image?: string | null;
        robots?: string;
        charset?: string;
        viewport?: string;
        favicon?: string;
    });
    copy(override?: {
        author?: string | null;
        title?: string | null;
        description?: string | null;
        image?: string | null;
        robots?: string;
        charset?: string;
        viewport?: string;
        favicon?: string;
    }): Meta;
    set_author(value: string | null): this;
    set_title(value: string | null): this;
    set_description(value: string | null): this;
    set_image(value: string | null): this;
    set_robots(value: string): this;
    set_charset(value: string): this;
    set_viewport(value: string): this;
    set_favicon(value: string): this;
    obj(): {
        author: string | null;
        title: string | null;
        description: string | null;
        image: string | null;
        robots: string;
        charset: string;
        viewport: string;
        favicon: string;
    };
    build_html(domain?: string | null): string;
}
export default Meta;
