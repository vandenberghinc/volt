/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { GradientType } from "../types/gradient.js"


class VBaseElement {
    
}









// We remove (omit) those existing members from HTMLElement
// and then re-declare them in a new interface, MyHTMLElement.
export type NativeElementBase<T extends HTMLElement = HTMLElement> = Omit<
    T,
    | "blur"
    | "animate"
    | "translate"
    | "dir"
    | "draggable"
    | "id"
    | "lang"
    | "title"
    | "text"
    | "height"
    | "width"
    | "getContext"
    | "append"
> 
// {

//     append(...children: any[]): this;

//     // Originally 'blur()': void;  -> override to return `this` for fluency
//     blur(): string;
//     blur(value: number): this;

//     // Originally 'animate(...)': Animation; -> override to return `this` for fluency
//     animate(options: {
//         keyframes: Array<any>;
//         delay?: number;
//         duration?: number;
//         repeat?: boolean;
//         persistent?: boolean;
//         on_finish?: ((element: any) => any) | null;
//         easing?: string;
//     }): this;

//     // Originally 'translate': boolean (property) -> override as a method
//     translate(): string;
//     translate(value: string | number): this;

//     // Originally 'dir': string (property) -> override as a method
//     dir(): string;
//     dir(value: string): this;

//     // Originally 'draggable': boolean (property) -> override as a method
//     draggable(): boolean;
//     draggable(value: boolean): this;

//     // Originally 'id': string (property) -> override as a method
//     id(): string;
//     id(value: string): this;

//     // Originally 'lang': string (property) -> override as a method
//     lang(): string;
//     lang(value: string): this;

//     // Originally 'title': string (property) -> override as a method
//     title(): string;
//     title(value: string): this;
// }

// Interface.
// @ts-ignore
// export declare class VElement extends HTMLElement implements HTMLElement, VElementExtensions {
//     constructor();
// {{ EMBED_VELEMENT_STATIC}}
// {{ EMBED_VELEMENT_INSTANCE}}
// }

// Is velement.
export function is_velement(obj: any): obj is VElement {
    return obj && typeof obj === 'object' && obj.__is_velement === true;
}
export function isVElement(obj: any): obj is VElement {
    return obj && typeof obj === 'object' && obj.__is_velement === true;
}

// Interface.
// export interface VElementInstance<NativeElement extends HTMLElement = HTMLElement> extends NativeElement, NativeElementBase<NativeElement>, HTMLElement, VElementExtensions {
// 	EMBED_VELEMENT_INSTANCE}}
// }

export interface __VElementInstance {
    {{EMBED_VELEMENT_INSTANCE}}
}

export type VElementInstance<NativeElement extends HTMLElement = HTMLElement> = NativeElementBase<NativeElement> & __VElementInstance;
export type VElementClass<NativeElement extends HTMLElement = HTMLElement> = {
    {{EMBED_VELEMENT_INTERFACE_STATIC}}

    // @ts-ignore
    new(): VElementInstance<NativeElement>;
    // new(): VElementInstance<NativeElement> & HTMLElement;
}


// export type VElement<NativeElement extends HTMLElement = HTMLElement> = {
//     EMBED_VELEMENT_INTERFACE_STATIC}}
//     new(): __VElementInstance & NativeElement;
// }

// & (new () => VElementInstance<NativeElement>);
// export interface VElementClass<NativeElement = HTMLElement> {
// 	EMBED_VELEMENT_INTERFACE_STATIC}}
//     new(): VElementInstance & NativeElementBase<NativeElement>; 
//     // new(): VElement; 
// }


// Create the VElement type, including the interface of the `declare global { interface VElement }`
// @note dont add `Element &` here since this will cause some issues with `append` signature.
// @note always use `declare global { interface VElementExtension { ... } }` to extend the VElement signature.
//       dont use `interface VElement` since that can cause issues when returning `this`.
// declare global { interface VElementExtensions {} }

// v2.
// export type VElement = VElementClass & { [K in keyof globalThis.VElementStaticExtensions]: globalThis.VElementStaticExtensions[K] };
    
// declare const VElement: Class<VElementInstance, any[]>;

// v1.
export type VElement = 
    VElementInstance
    // & VElementClass
    // & { [K in keyof globalThis.VElement]: globalThis.VElement[K] }
    & { [K in keyof globalThis.VElementExtensions]: globalThis.VElementExtensions[K] }
    // & { element_tag: string, default_style: Record<string, any>, default_attributes: Record<string, any>, default_events: Record<string, any> }

// v4.
// export type VElement = 
//     VElementInstance & VElementClass
//     // & { [K in keyof globalThis.VElement]: globalThis.VElement[K] }
//     & { [K in keyof globalThis.VElementExtensions]: globalThis.VElementExtensions[K] }
//     // & { element_tag: string, default_style: Record<string, any>, default_attributes: Record<string, any>, default_events: Record<string, any> }

// Is velement.
// export function is_velement(obj: any): obj is VElementInstance {
//     return obj && typeof obj === 'object' && obj.__is_velement === true;
// }
// export function isVElement(obj: any): obj is VElementInstance {
//     return obj && typeof obj === 'object' && obj.__is_velement === true;
// }

/* Abstract class version
export abstract class VElement extends HTMLElement {
	EMBED_VELEMENT_STATIC}}
    EMBED_VELEMENT_INSTANCE}}
}
export function is_velement(obj: any): obj is VElement {
    return obj && typeof obj === 'object' && obj.__is_velement === true;
}
export function isVElement(obj: any): obj is VElement {
    return obj && typeof obj === 'object' && obj.__is_velement === true;
}
*/