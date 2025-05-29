import { VElementTagMap } from "../elements/module.js";
export declare class ButtonElement extends VElementTagMap.a {
    /**
     * @docs:
     * @nav: Frontend
     * @chapter: Buttons
     * @title: Button
     * @desc: Initializes the Button element with the provided text.
     * @param:
     *     @name: text
     *     @description The text to display on the button.
     */
    constructor(text?: string);
}
export declare const Button: <Extensions extends object = {}>(text?: string | undefined) => ButtonElement & Extensions;
export declare const NullButton: <Extensions extends object = {}>() => ButtonElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        ButtonElement: ButtonElement;
    }
}
