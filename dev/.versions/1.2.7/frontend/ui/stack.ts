/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"
import { CreateVElementClass } from "./element"

// VStack.
@Elements.register
export class FrameElement extends CreateVElementClass({
	type: "Frame",
	tag: "div",
	default_style: {
		// "position": "relative",
		"margin": "0px",
		"padding": "0px",
		// "clear": "both",
		"display": "block",
		"overflow": "visible",
	},
}) {
	
	// Constructor.
	constructor(...children: any[]) {
		
		// Initialize base class.
		super();

		// Add children.
		this.append(...children);

	}
}
export const Frame = Elements.wrapper(FrameElement);

// VStack.
@Elements.register
export class VStackElement extends CreateVElementClass({
	type: "VStack",
	tag: "div",
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
	},
}) {
	
	// Constructor.
	constructor(...children: any[]) {
		
		// Initialize base class.
		super();

		// Add children.
		this.append(...children);

	}	
}
export const VStack = Elements.wrapper(VStackElement);

// AnchorVStack.
@Elements.register
export class AnchorVStackElement extends CreateVElementClass({
	type: "AnchorVStack",
	tag: "a",
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

		// After extending VStack.
		"color": "inherit", // inherit colors since <a> does not have that and a <div> does.
	},
}) {
	
	// Constructor.
	constructor(...children: any[]) {
		
		// Initialize base class.
		super();

		// Add children.
		this.append(...children);

	}
}
export const AnchorVStack = Elements.wrapper(AnchorVStackElement);

// HStack.
@Elements.register
export class HStackElement extends CreateVElementClass({
	type: "HStack",
	tag: "div",
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
	},
}) {

	// Constructor.
	constructor(...children: any[]) {
		
		// Initialize base class.
		super();
		
		// Add children.
		this.append(...children);
	}
}
export const HStack = Elements.wrapper(HStackElement);

// AnchorHStack.
@Elements.register
export class AnchorHStackElement extends CreateVElementClass({
	type: "AnchorHStack",
	tag: "a",
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

		// After extending VStack.
		"color": "inherit", // inherit colors since <a> does not have that and a <div> does.
	},
}) {

	// Constructor.
	constructor(...children: any[]) {
		
		// Initialize base class.
		super();
		
		// Add children.
		this.append(...children);
	}
}
export const AnchorHStack = Elements.wrapper(AnchorHStackElement);

// ZStack.
@Elements.register
export class ZStackElement extends CreateVElementClass({
	type: "ZStack",
	tag: "div",
	default_style: {
		// "position": "relative",
		"margin": "0px",
		"padding": "0px",
		"display": "grid",
		// "text-align": "start",
		"outline": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
		"border": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
	},
}) {
	
	// Constructor.
	constructor(...children: any[]) {
		
		// Initialize base class.
		super();
		
		// Add children.
		this.zstack_append(...children);

	}
	
	// Override append.
	append(...children: any[]) : this {
		return this.zstack_append(...children);
	}
}
export const ZStack = Elements.wrapper(ZStackElement);