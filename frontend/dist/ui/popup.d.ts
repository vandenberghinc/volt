import { VElementBaseSignature } from "../elements/module.js";
import { Mutex } from "../modules/mutex";
import { HStackElement, VStackElement } from "./stack";
import { TextElement } from "./text";
import { TitleElement } from "./title";
import { LoaderButtonElement } from "./loader_button";
import { ImageMaskElement } from "./image";
export type OnYesNoPopup = ((element: YesNoPopupElement) => Promise<any> | void);
declare const YesNoPopupElement_base: VElementBaseSignature;
export declare class YesNoPopupElement extends YesNoPopupElement_base {
    p_mutex: Mutex;
    p_auto_hide: boolean;
    p_auto_remove: boolean;
    p_animation_duration: number;
    p_blur: number;
    p_on_no_handler: OnYesNoPopup;
    p_on_yes_handler: OnYesNoPopup;
    p_on_popup_handler: OnYesNoPopup;
    p_escape_handler: any;
    image: ImageMaskElement;
    title: TitleElement;
    text: TextElement;
    no_button: LoaderButtonElement;
    yes_button: LoaderButtonElement;
    buttons: HStackElement;
    content: VStackElement;
    widget: VStackElement;
    _on_no_called: boolean;
    constructor({ title, text, no, yes, image, image_color, content, auto_hide, auto_remove, animation_duration, // in ms.
    blur, on_no, on_yes, on_popup, }: {
        title: string;
        text: string;
        no?: string;
        yes?: string;
        image?: boolean | string;
        image_color?: string;
        content?: any[];
        auto_hide?: boolean;
        auto_remove?: boolean;
        animation_duration?: number;
        blur?: number;
        on_no?: OnYesNoPopup;
        on_yes?: OnYesNoPopup;
        on_popup?: OnYesNoPopup;
    });
    set_default(): this;
    await(): Promise<void>;
    remove_animation(): Promise<void>;
    hide_animation(): Promise<void>;
    close(): Promise<void>;
    image_color(): string;
    image_color(value: string): this;
    popup({ title, text, image, image_color, content, on_no, on_yes, }?: {
        title?: string;
        text?: string;
        no?: string;
        yes?: string;
        image?: boolean | string;
        image_color?: string;
        content?: any[];
        on_no?: OnYesNoPopup;
        on_yes?: OnYesNoPopup;
    }): Promise<void>;
}
export declare const YesNoPopup: <Extensions extends object = {}>(args_0: {
    title: string;
    text: string;
    no?: string;
    yes?: string;
    image?: boolean | string;
    image_color?: string;
    content?: any[];
    auto_hide?: boolean;
    auto_remove?: boolean;
    animation_duration?: number;
    blur?: number;
    on_no?: OnYesNoPopup;
    on_yes?: OnYesNoPopup;
    on_popup?: OnYesNoPopup;
}) => YesNoPopupElement & Extensions;
export declare const NullYesNoPopup: <Extensions extends object = {}>() => YesNoPopupElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        YesNoPopupElement: YesNoPopupElement;
    }
}
export {};
