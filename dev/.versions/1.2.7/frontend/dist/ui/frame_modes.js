/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// Imports.
import { Elements } from "../modules/elements";
export class FrameNodesType extends Array {
    constructor(...children) {
        super(...children);
    }
}
export const FrameNodes = Elements.wrapper(FrameNodesType);
// Frame mode used to switch easily between frames.
/*	@docs:
    @title: Frame Modes
    @descr:
        Frame modes used to switch easily between frame nodes.

        Initialize the class with the wanted frame modes, then call `.exec(MyMode.my_mode.push)` on the nodes.

        Afterwards the mode can be set using `MyMode.set("my_mode")`.
 */
export class FrameModesType {
    // Provide mode names as args: `sign_in, sign_up`.
    constructor(...modes) {
        // Macros.
        // Attributes.
        this.modes = [];
        for (const mode of modes) {
            if (this.active == null) {
                this.active = mode;
            }
            this.modes.push(mode);
            this[mode] = FrameNodes();
        }
    }
    // Set mode.
    set(mode) {
        this.active = mode;
        for (const m of this.modes) {
            if (m === mode) {
                for (const node of this[m]) {
                    node.show();
                }
            }
            else {
                for (const node of this[m]) {
                    node.hide();
                }
            }
        }
        if (this._on_set !== undefined) {
            this._on_set(mode, this[mode]);
        }
        return this;
    }
    switch(mode) { return this.set(mode); }
    on_set(callback) {
        if (callback == null) {
            return this._on_set;
        }
        this._on_set = callback;
        return this;
    }
    on_switch(callback) {
        if (callback == null) {
            return this._on_set;
        }
        this._on_set = callback;
        return this;
    }
}
export const FramesMode = Elements.wrapper(FrameModesType);
