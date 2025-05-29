export = Meta;
declare class Meta {
    constructor({ author, title, description, image, robots, charset, viewport, favicon, }?: {
        author?: null | undefined;
        title?: null | undefined;
        description?: null | undefined;
        image?: null | undefined;
        robots?: string | undefined;
        charset?: string | undefined;
        viewport?: string | undefined;
        favicon?: string | undefined;
    });
    author: any;
    title: any;
    description: any;
    image: any;
    robots: string;
    charset: string;
    viewport: string;
    favicon: string;
    copy(override?: {}): Meta;
    set_author(value: any): this;
    set_title(value: any): this;
    set_description(value: any): this;
    set_image(value: any): this;
    set_robots(value: any): this;
    set_charset(value: any): this;
    set_viewport(value: any): this;
    set_favicon(value: any): this;
    obj(): {
        author: any;
        title: any;
        description: any;
        image: any;
        robots: string;
        charset: string;
        viewport: string;
        favicon: string;
    };
    build_html(domain?: null): string;
}
