export declare namespace CSS {
    function minify(data: string): string;
    function bundle({ data, paths, minify, output, postprocess, log_level, }: {
        data: string;
        paths?: string[];
        minify?: boolean;
        output?: string | string[];
        postprocess?: undefined | ((data: string) => string | Promise<string>);
        log_level?: number;
    }): Promise<string>;
}
