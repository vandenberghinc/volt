/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElementTagMap, VElement, AppendType } from "../elements/module.js"

// Div element
// export const VDivElement = Elements.create({type: "Div", tag: "div"}); // should always remain a "div" since some elements like LoaderButton rely on the behaviour of a div.
// export type VDivElement = InstanceType<typeof VDivElement>;
// export const VDiv = Elements.wrapper(VDivElement);
// export const NullVDiv = Elements.create_null(VDivElement);
// declare module './any_element.d.ts' { interface AnyElementMap { VDivElement: VDivElement }}

// VStack.
@Elements.create({
    name: "FrameElement",
    default_style: {
        // "position": "relative",
        "margin": "0px",
        "padding": "0px",
        // "clear": "both",
        "display": "block",
        "overflow": "hidden",
        "width": "100%", // to ensure its passed along all children.
    }
})
export class FrameElement extends VElementTagMap.div {

    // Constructor.
    constructor(...children: AppendType[]) {

        // Initialize base class.
        super({
            derived: FrameElement,
        });

        // Add children.
        this.append(...children);

    }
}
export const Frame = Elements.wrapper(FrameElement);
export const NullFrame = Elements.create_null(FrameElement);
declare module './any_element.d.ts' { interface AnyElementMap { FrameElement: FrameElement } }

// VStack.
@Elements.create({
    name: "VStackElement",
    default_style: {
        // "position": "relative",
        "margin": "0px",
        "padding": "0px",
        // "clear": "both",
        "display": "flex", // to support vertical spacers.
        "overflow": "visible",
        // "flex": "1", // disabled to support horizontal spacers in VStacks.
        "align-content": "flex-start", // align items at start, do not stretch / space when inside HStack.
        // "align-items": "flex-start", // otherwise the children automatically expand width to match the vstacks width.
        "flex-direction": "column",
        // "text-align": "start",
        "outline": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
        "border": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
        "width": "100%", // to ensure its passed along all children.
    }
})
export class VStackElement extends VElementTagMap.div {

    // Constructor.
    constructor(...children: AppendType[]) {

        // Initialize base class.
        super({
            derived: VStackElement,
        });

        // Add children.
        this.append(...children);

    }
}
export const VStack = Elements.wrapper(VStackElement);
export const NullVStack = Elements.create_null(VStackElement);
declare module './any_element.d.ts' { interface AnyElementMap { VStackElement: VStackElement } }

// AnchorVStack.
@Elements.create({
    name: "AnchorVStackElement",
    default_style: {
        // "position": "relative",
        "margin": "0px",
        "padding": "0px",
        // "clear": "both",
        "display": "flex", // to support vertical spacers.
        "overflow": "visible",
        // "flex": "1", // disabled to support horizontal spacers in VStacks.
        "align-content": "flex-start", // align items at start, do not stretch / space when inside HStack.
        // "align-items": "flex-start", // otherwise the children automatically expand width to match the vstacks width.
        "flex-direction": "column",
        // "text-align": "start",
        "outline": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
        "border": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
        "text-decoration": "none",

        "width": "100%", // to ensure its passed along all children.

        // After extending VStack.
        "color": "inherit", // inherit colors since <a> does not have that and a <div> does.
    },
})
export class AnchorVStackElement extends VElementTagMap.a {

    // Constructor.
    constructor(...children: AppendType[]) {

        // Initialize base class.
        super({
            derived: AnchorVStackElement,
        });

        // Add children.
        this.append(...children);

    }
}
export const AnchorVStack = Elements.wrapper(AnchorVStackElement);
export const NullAnchorVStack = Elements.create_null(AnchorVStackElement);
declare module './any_element.d.ts' { interface AnyElementMap { AnchorVStackElement: AnchorVStackElement } }

// const stack: VElement = new AnchorVStackElement();

// HStack.
@Elements.create({
    name: "HStackElement",
    default_style: {
        // "position": "relative",
        "margin": "0px",
        "padding": "0px",
        // "clear": "both",
        "overflow-x": "visible",
        "overflow-y": "visible",
        // "text-align": "start",
        "display": "flex",
        "flex-direction": "row",
        "align-items": "flex-start", // disable the auto extending of the childs height to the max child height.
        // "flex": "1", // disabled to support horizontal spacers in VStacks.
        "flex:": "1 1 auto", // prevent children from exceeding its max width, @warning do not remove this cause it can produce some nasty overflow bugs, so if you want to remove it create an function to optionally remove it.
        "outline": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
        "border": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
        "width": "100%", // to ensure its passed along all children.
    },
})
export class HStackElement extends VElementTagMap.div {;

    // Constructor.
    constructor(...children: AppendType[]) {

        // Initialize base class.
        super({
            derived: HStackElement,
        });

        // Add children.
        this.append(...children);
    }
}
export const HStack = Elements.wrapper(HStackElement);
export const NullHStack = Elements.create_null(HStackElement);
declare module './any_element.d.ts' { interface AnyElementMap { HStackElement: HStackElement } }

// AnchorHStack
@Elements.create({
    name: "AnchorHStackElement",
    default_style: {
        // "position": "relative",
        "margin": "0px",
        "padding": "0px",
        // "clear": "both",
        "overflow-x": "visible",
        "overflow-y": "visible",
        // "text-align": "start",
        "display": "flex",
        "flex-direction": "row",
        "align-items": "flex-start", // disable the auto extending of the childs height to the max child height.
        // "flex": "1", // disabled to support horizontal spacers in VStacks.
        "flex:": "1 1 auto", // prevent children from exceeding its max width, @warning do not remove this cause it can produce some nasty overflow bugs, so if you want to remove it create an function to optionally remove it.
        "outline": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
        "border": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
        "text-decoration": "none",
        "width": "100%", // to ensure its passed along all children.

        // After extending VStack.
        "color": "inherit", // inherit colors since <a> does not have that and a <div> does.
    },
})
export class AnchorHStackElement extends VElementTagMap.a {

    // Constructor.
    constructor(...children: AppendType[]) {

        // Initialize base class.
        super({
            derived: AnchorHStackElement,
        });

        // Add children.
        this.append(...children);
    }
}
export const AnchorHStack = Elements.wrapper(AnchorHStackElement);
export const NullAnchorHStack = Elements.create_null(AnchorHStackElement);
declare module './any_element.d.ts' { interface AnyElementMap { AnchorHStackElement: AnchorHStackElement } }

// ZStack.
@Elements.create({
    name: "ZStackElement",
    default_style: {
        // "position": "relative",
        "margin": "0px",
        "padding": "0px",
        "display": "grid",
        // "text-align": "start",
        "outline": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
        "border": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
        "width": "100%", // to ensure its passed along all children.
    },
})
export class ZStackElement extends VElementTagMap.div {

    // Constructor.
    constructor(...children: AppendType[]) {

        // Initialize base class.
        super({
            derived: ZStackElement,
        });

        // Add children.
        this.zstack_append(children);

    }

    // Override append.
    append(...children: AppendType[]): this {
        return this.zstack_append(children);
    }
}
export const ZStack = Elements.wrapper(ZStackElement);
export const NullZStack = Elements.create_null(ZStackElement);
declare module './any_element.d.ts' { interface AnyElementMap { ZStackElement: ZStackElement } }
