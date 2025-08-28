import { VElementBaseSignature, VElementTagMap } from "../elements/module.js";
import { VStackElement } from "./stack.js";
export declare class ImageElement extends VElementTagMap.img {
    static default_alt?: string;
    _e?: HTMLImageElement;
    constructor(src?: string, alt?: string);
    set_default(): this;
    src(): string;
    src(value: string, set_aspect_ratio?: boolean): this;
    alt(): string;
    alt(value: string): this;
    height(): string | number;
    height(value: string | number, check_attribute?: boolean): this;
    min_height(): string | number;
    min_height(value: string | number): this;
    max_height(): string | number;
    max_height(value: string | number): this;
    width(): string | number;
    width(value: string | number, check_attribute?: boolean): this;
    min_width(): string | number;
    min_width(value: string | number): this;
    max_width(): string | number;
    max_width(value: string | number): this;
    loading(): string;
    loading(value: string): this;
}
export declare const Image: <Extensions extends object = {}>(src?: string | undefined, alt?: string | undefined) => ImageElement & Extensions;
export declare const NullImage: <Extensions extends object = {}>() => ImageElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        ImageElement: ImageElement;
    }
}
declare const AnchorImageElement_base: VElementBaseSignature;
export declare class AnchorImageElement extends AnchorImageElement_base {
    image: ImageElement;
    constructor(href: string, src: string, alt: string);
    set_default(): this;
    src(): string;
    src(value: string): this;
    alt(): string;
    alt(value: string): this;
    height(): string | number;
    height(value: string | number): this;
    min_height(): string | number;
    min_height(value: string | number): this;
    max_height(): string | number;
    max_height(value: string | number): this;
    width(): string | number;
    width(value: string | number): this;
    min_width(): string | number;
    min_width(value: string | number): this;
    max_width(): string | number;
    max_width(value: string | number): this;
    loading(): string;
    loading(value: string): this;
}
export declare const AnchorImage: <Extensions extends object = {}>(href: string, src: string, alt: string) => AnchorImageElement & Extensions;
export declare const NullAnchorImage: <Extensions extends object = {}>() => AnchorImageElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        AnchorImageElement: AnchorImageElement;
    }
}
export declare class ImageMaskElement extends VElementTagMap.div {
    mask_child: VStackElement;
    _img_src?: string;
    constructor(src?: string);
    mask_color(): string;
    mask_color(value: string): this;
    color(): string;
    color(value: string): this;
    transition_mask(): string;
    transition_mask(value: string): this;
    src(): string;
    src(value: string, set_aspect_ratio?: boolean): this;
    mask(): string;
    mask(value: string): this;
}
export declare const ImageMask: <Extensions extends object = {}>(src?: string | undefined) => ImageMaskElement & Extensions;
export declare const NullImageMask: <Extensions extends object = {}>() => ImageMaskElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        ImageMaskElement: ImageMaskElement;
    }
}
export declare class AnchorImageMaskElement extends VElementTagMap.a {
    mask_child: VStackElement;
    _img_src?: string;
    constructor(src?: string);
    mask_color(): string;
    mask_color(value: string): this;
    color(): string;
    color(value: string): this;
    src(): string;
    src(value: string, set_aspect_ratio?: boolean): this;
    mask(): string;
    mask(value: string): this;
}
export declare const AnchorImageMask: <Extensions extends object = {}>(src?: string | undefined) => AnchorImageMaskElement & Extensions;
export declare const NullAnchorImageMask: <Extensions extends object = {}>() => AnchorImageMaskElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        AnchorImageMaskElement: AnchorImageMaskElement;
    }
}
export {};
