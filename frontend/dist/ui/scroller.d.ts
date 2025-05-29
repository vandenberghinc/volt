import { VElementBaseSignature, VElement, VElementTagMap, AppendType } from "../elements/module.js";
import { AnyElement } from "./any_element.js";
import { VStackElement } from "./stack";
type OnScrollCallback = ((element: ScrollerElement, event: Event) => any);
interface ScrollCallbackItem {
    callback: (event: Event) => any;
    user_callback: OnScrollCallback;
}
export declare class ScrollerElement extends VElementTagMap.div {
    content: VStackElement;
    thumb: VStackElement & {
        dragging: boolean;
    };
    track: VStackElement & {
        __background_value__?: string;
    };
    on_scroll_callbacks: ScrollCallbackItem[];
    iterate: (start: number | ((child: any, index: number) => any), end?: number, handler?: (child: any, index: number) => any) => any;
    iterate_nodes: (start: number | ((node: any, index: number) => any), end?: number, handler?: (node: any, index: number) => any) => any;
    m_delay: number;
    _h_alignment?: string;
    _current_h_alignment?: string;
    _v_alignment?: string;
    _current_v_alignment?: string;
    _alignment_callback_activated: boolean;
    _alignment_callback: any;
    _fadeout_timeout: any;
    constructor(...children: AppendType[]);
    is_scrollable(): boolean;
    remove_children(): this;
    append(...children: AppendType[]): this;
    child(index: number): any;
    overflow(): string;
    overflow(value: string): this;
    overflow_x(): string;
    overflow_x(value: string): this;
    super_overflow_x(): string;
    super_overflow_x(value: string): this;
    overflow_y(): string;
    overflow_y(value: string): this;
    super_overflow_y(): string;
    super_overflow_y(value: string): this;
    show_overflow(): this;
    hide_overflow(): this;
    delay(): number;
    delay(msec: number): this;
    scroll_top(): number | string;
    scroll_top(value: number | string): this;
    scroll_left(): number | string;
    scroll_left(value: number | string): this;
    scroll_height(): number;
    scroll_width(): number;
    on_scroll(): ScrollCallbackItem[];
    on_scroll(opts_or_callback?: OnScrollCallback | {
        callback: OnScrollCallback;
        delay?: number;
    }): this;
    remove_on_scroll(callback: OnScrollCallback): this;
    set_scroll_top_without_event(top: number | string): this;
    set_scroll_left_without_event(left: number | string): this;
    set_scroll_position_without_event(top?: number | string, left?: number | string): this;
    align(): string;
    align(value: string): this;
    center(): this;
    leading(): this;
    trailing(): this;
    align_vertical(): string;
    align_vertical(value: string): this;
    center_vertical(): this;
    leading_vertical(): this;
    trailing_vertical(): this;
}
export declare const Scroller: <Extensions extends object = {}>(...args: AppendType[]) => ScrollerElement & Extensions;
export declare const NullScroller: <Extensions extends object = {}>() => ScrollerElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        ScrollerElement: ScrollerElement;
    }
}
declare const SnapScrollerElement_base: VElementBaseSignature;
export declare class SnapScrollerElement extends SnapScrollerElement_base {
    constructor(...children: VElement[]);
    append(...children: AnyElement[]): this;
    scroll_into_child(index: number, behaviour?: string): this;
}
export declare const SnapScroller: <Extensions extends object = {}>(...args: VElement[]) => SnapScrollerElement & Extensions;
export declare const NullSnapScroller: <Extensions extends object = {}>() => SnapScrollerElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        SnapScrollerElement: SnapScrollerElement;
    }
}
export {};
