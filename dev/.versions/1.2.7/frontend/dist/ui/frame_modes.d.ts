export declare class FrameNodesType extends Array {
    constructor(...children: any[]);
}
export declare const FrameNodes: (...args: any[]) => any;
export declare class FrameModesType {
    modes: string[];
    active?: string;
    _on_set?: ((mode: string, nodes: FrameNodesType) => any);
    constructor(...modes: string[]);
    set(mode: string): this;
    switch(mode: string): this;
    on_set(): undefined | ((mode: string, nodes: FrameNodesType) => any);
    on_set(callback: ((mode: string, nodes: FrameNodesType) => any)): this;
    on_switch(): undefined | ((mode: string, nodes: FrameNodesType) => any);
    on_switch(callback: ((mode: string, nodes: FrameNodesType) => any)): this;
}
export declare const FramesMode: (...args: any[]) => any;
