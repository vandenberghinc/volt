/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// Imports.
import { Elements } from "../elements/module.js";
// Nodes type.
export class FrameNodes extends Array {
    constructor(...children) {
        super(...children);
    }
}
// Frame mode used to switch easily between frames.
/*	@docs:
    @title: Frame Modes
    @descr:
        Frame modes used to switch easily between frame nodes.

        Initialize the class with the wanted frame modes, then call `.exec(MyMode.my_mode.push)` on the nodes.

        Afterwards the mode can be set using `MyMode.set("my_mode")`.
 */
export class FrameModes {
    // Attributes.
    modes = {};
    active;
    _on_set;
    // Provide mode names as args: `sign_in, sign_up`.
    constructor(...modes) {
        for (const mode of modes) {
            if (this.active == null) {
                this.active = mode;
            }
            this.modes[mode] = new FrameNodes();
        }
    }
    // Get.
    get(mode) {
        const nodes = this.modes[mode];
        if (nodes === undefined) {
            throw new Error(`Requested mode "${mode}" does not exist.`);
        }
        return nodes;
    }
    // Set mode.
    set(mode) {
        this.active = mode;
        for (const m of Object.keys(this.modes)) {
            if (m === mode) {
                for (const node of this.modes[m]) {
                    node.show();
                }
            }
            else {
                for (const node of this.modes[m]) {
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
Elements.extend({
    /**
     * @docs:
     * @title: Frame Mode
     * @desc: Adds a node to a FrameMode. Can accept a single argument to push the current instance or two arguments to specify a FrameModesType and an index.
     * @param:
     *     @name: args
     *     @descr: Arguments to determine the operation to perform for adding a node.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    frame_mode(...args) {
        if (args.length === 1) {
            args[0].push(this);
        }
        else if (args.length === 2 && args[0] instanceof FrameModes) {
            const frames_mode = args[0];
            const mode_name = args[1];
            if (mode_name !== frames_mode.active) {
                this.hide();
            }
            frames_mode.modes[mode_name].push(this);
        }
        return this;
    }
});
// @test
// import { Form } from "./form"
// Form()
// 	.frame_mode(FrameModes("test"), "test")
// 	.on_submit(((e) => {}) as any)
// Form()
// 	.frame_mode(FrameModes("test"), "test")
// 	.on_submit2(((e) => {}) as any)
