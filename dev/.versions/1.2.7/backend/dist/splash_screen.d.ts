export = SplashScreen;
declare class SplashScreen {
    constructor({ background, image, loader, style, }: {
        background?: null | undefined;
        image?: null | undefined;
        loader?: boolean | undefined;
        style?: null | undefined;
    });
    background: any;
    image: any;
    loader: boolean;
    style: any;
    _html: string | undefined;
    get html(): string;
    _serve(stream: any): void;
}
