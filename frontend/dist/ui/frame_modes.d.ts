import { VElement } from "../elements/module.js";
export declare class FrameNodes extends Array<VElement> {
    constructor(...children: VElement[]);
}
type OnSet = (mode: string, nodes: FrameNodes) => any;
export declare class FrameModes {
    modes: Record<string, FrameNodes>;
    active?: string;
    _on_set?: OnSet;
    constructor(...modes: string[]);
    get(mode: string): FrameNodes;
    set(mode: string): this;
    switch(mode: string): this;
    on_set(): undefined | OnSet;
    on_set(callback: OnSet): this;
    on_switch(): undefined | OnSet;
    on_switch(callback: OnSet): this;
}
declare global {
    interface VElementExtensions {
        frame_mode(frame_mode: FrameNodes): this;
        frame_mode(frame_modes: FrameModes, mode_name: string): this;
    }
}
export {};
