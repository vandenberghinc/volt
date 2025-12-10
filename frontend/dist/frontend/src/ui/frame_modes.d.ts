/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import { VElement } from "../elements/module.js";
export declare class FrameNodes extends Array<VElement> {
    constructor(...children: VElement[]);
}
type OnSet<Mode extends string> = (mode: Mode, nodes: FrameNodes) => any;
/**
 * Frame modes used to switch easily between frame nodes.
 *
 * Initialize the class with the wanted frame modes, then call `.exec(MyMode.my_mode.push)` on the nodes.
 *
 * Afterwards the mode can be set using `MyMode.set("my_mode")`.
 * @docs
 */
export declare class FrameModes<Mode extends string = string> {
    modes: Record<Mode, FrameNodes>;
    active?: Mode;
    _on_set?: OnSet<Mode>;
    constructor(...modes: Mode[]);
    get(mode: Mode): FrameNodes;
    set(mode: Mode): this;
    switch(mode: Mode): this;
    on_set(): undefined | OnSet<Mode>;
    on_set(callback: OnSet<Mode>): this;
    on_switch(): undefined | OnSet<Mode>;
    on_switch(callback: OnSet<Mode>): this;
}
declare global {
    interface VElementExtensions {
        frame_mode(frame_mode: FrameNodes): this;
        frame_mode<Mode extends string>(frame_modes: FrameModes<Mode>, mode_name: Mode): this;
    }
}
export {};
