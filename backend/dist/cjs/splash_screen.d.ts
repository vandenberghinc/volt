import { Stream } from "./stream.js";
export declare class SplashScreen {
    background: string | null;
    image: {
        src: string;
        width?: number;
        height?: number;
        style?: string | null;
        alt?: string;
    } | null;
    loader: boolean | {
        color?: string;
        size?: number;
    } | null;
    style: string | null;
    _html: string | undefined;
    constructor({ background, image, loader, style, }: {
        background?: string | null;
        image?: {
            src: string;
            width?: number;
            height?: number;
            style?: string | null;
            alt?: string;
        } | null;
        loader?: boolean | {
            color?: string;
            size?: number;
        } | null;
        style?: string | null;
    });
    get html(): string;
    _serve(stream: Stream): void;
}
export default SplashScreen;
