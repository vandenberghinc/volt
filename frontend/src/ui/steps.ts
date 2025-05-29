/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, isVElement, VElementTagMap } from "../elements/module.js"
import { VStack, VStackElement, HStack, HStackElement } from "./stack"
import { Divider, DividerElement } from "./divider"
import { Span } from "./span"
import { ForEach } from "./for_each"

export interface StepContentOptions {
	content: any[];
	title?: string;
	hstack?: boolean;
	side_by_side_width?: number;
}	

/*	@docs:
	@nav: Frontend
	@chapter: Elements
	@title: Steps
	@descr: Steps element.
	@param:
		@name: content
		@descr: The steps content. By default it should be an array with `Step` objects. However, when one of the items is an array, the `Step` object will automatically be initialized with the array as the `Step.content` attribute.
		@type: Step[]
		@attributes_type: Step
		@attr:
			@name: title
			@descr: The step title.
			@type: string
		@attr:
			@name: content / children
			@descr: The step children.
			@type: node[]
		@attr:
			@name: hstack
			@descr: Flag to use a hstack instead of vstack as the children container.
			@type: boolean
			@default: false
		@attr:
			@name: side_by_side_width
			@descr: The minimum pixels width of the content container (not the full screen) to show content side by side when `hstack` is enabled.
			@type: number
	@param:
		@name: spacing
		@descr: Spacing between the step content.
		@type: string, number
		@default: "1.25em"
 */
@Elements.create({
    name: "StepsElement",
    default_style: {
        ...VStackElement.default_style,
        "--steps-tint": "gray",
        "--steps-tint-opac": 1,
        "--steps-step-bg": "gray",
        "--steps-step-border": "gray",
        "--steps-step-border-radius": "50%",
        "--steps-div-bg": "gray",
    },
})
export class StepsElement extends (VStackElement as any as VElementBaseSignature) {

	public _tint: string;
	public _tint_opac: number;
	public _step_bg: string;
	public _step_border: string;
	public _step_border_radius: string;
    public _step_margin_right: string = "1em";
	public _div_bg: string;
	public _step_nr_nodes: (VStackElement & { bg: VStackElement }) [] = [];
	public _step_nodes: HStackElement[] = [];
	public _div_nodes: DividerElement[] = [];
	public _content_nodes: (HStackElement | VStackElement)[] = [];

	// Constructor.
	constructor({
		content = [],
	}: {
        content: any[] | any[][] | StepContentOptions[],
	}) {

		// Inherit.
		super();
		this._init({
			derived: StepsElement,
		});

		// Assign single array argument to content.
		if (Array.isArray(arguments[0])) {
			content = arguments[0];
		}
		for (let i = 0; i < content.length; i++) {
			if (Array.isArray(content[i]) || isVElement(content[i])) {
				content[i] = {
					content: content[i],
                } as StepContentOptions;
			}
		}

		// Attributes.
		this._tint = StepsElement.default_style["--steps-tint"];
		this._tint_opac = parseFloat(StepsElement.default_style["--steps-tint-opac"] as any);
		this._step_bg = StepsElement.default_style["--steps-step-bg"];
		this._step_border = StepsElement.default_style["--steps-step-border"];
		this._step_border_radius = StepsElement.default_style["--steps-step-border-radius"];
		this._div_bg = StepsElement.default_style["--steps-div-bg"];

		// Build.
        const spacing = "1.25em";
		this.append(ForEach(content, (item, index, is_last) => {

			// Build divider.
		    const divider = is_last ? null : Divider()
		    	.margin(0)
		    	.font_size("0.7em") // for relative distances.
		    	.position("2em", null, 0, "0.875em")
		    	.frame(1.5, `calc(100% + ${spacing} - 0.6em)`)
		    	.background(this._div_bg)
		    	.z_index(0)
		    	.exec(e => this._div_nodes.append(e))

		    // Build content.
		    const content = (item.hstack ? HStack() : VStack())		
				.z_index(1)
				// .width("100%")
				.stretch(true)
            	.overflow("hidden"); // required otherwise when inside Tabs will mess up.
			if (typeof item.title === "string") {
				content.append(
					Span(item.title)
					.color("inherit")
					.display("block") // line wrap after.
					.margin_bottom("0.5em")
					.font_weight(500)
					.line_height("1.6em"),
				)
			}
			if (item.content) {
				content.append(item.content);
			} else if (item.children) {
				content.append(item.children);
			}
			if (typeof item.side_by_side_width == "number") {
				content.on_resize_rule(
					() => content.clientWidth >= item.side_by_side_width,
					() => content.flex_direction("row"),
					() => content.flex_direction("column"),
				)
			}
			this._content_nodes.append(content);

			// Append.
			let step_nr;
		    const element = HStack(
		    		step_nr = VStack<{ bg: VStackElement }>(
		    			VStack() // to support opacity on background only.
		    				.assign_to_parent_as("bg")
		    				.background(this._step_bg)
		    				.transition("background 300ms ease-in-out")
		    				.position(0, 0, 0, 0)
		    				.z_index(0),
		    			Span((index + 1).toString())
		    				.z_index(1),
		    		)
	    			.position("relative")
	    			.overflow("hidden")
	    			.font_size("0.7em")
	    			.flex_shrink(0)
	    			.frame("1.8em", "1.8em")
                    .margin("0.2em", this._step_margin_right, null, null)
	    			// .border_radius(this._step_border_radius)
	    			.border_radius(5)
	    			.border(1, this._step_border)
	    			.center()
	    			.center_vertical()
	    			.z_index(1)
	    			.exec(e => this._step_nr_nodes.append(e)),
		    		divider,
		    		content,
	    	)
	    	.fixed_width("100%")
	    	.margin_top(index > 0 ? spacing : 0)
	    	.position("relative")
	    	.exec(e => this._step_nodes.append(e))
	    	.on_mouse_over(() => step_nr.bg.opacity(this._tint_opac).background(this._tint))
	    	.on_mouse_out(() => step_nr.bg.opacity(1).background(this._step_bg))
	    	return element;
		}))
	}

	// Set default since it inherits another element.
	set_default() : this {
		return super.set_default(StepsElement);
	}

	// Get the styling attributes.
	styles() : Record<string, string>;
	styles(style_dict: Record<string, any>) : this;
	styles(style_dict?: Record<string, any>) : this | Record<string, string> {
		if (style_dict == null) {
			let styles = super.styles();
			styles["--steps-tint"] = this._tint;
			styles["--steps-step-bg"] = this._step_bg;
			styles["--steps-step-border"] = this._step_border;
			styles["--steps-step-border-radius"] = this._step_border_radius;
			styles["--steps-div-bg"] = this._div_bg;
			return styles;
		} else {
			return super.styles(style_dict);
		}
	}

	/*	@docs:
		@title: Set/Get tint
		@description: Set or get the step number tint color.
	 */
	tint() : string;
	tint(value: string) : this;
	tint(value?: string) : this | string {
		if (value == null) { return this._tint; }
		this._tint = value;
		return this;
	}

	/*	@docs:
		@title: Set/Get tint opacity
		@description: Set or get the step number tint opacity.
	 */
	tint_opacity() : number;
	tint_opacity(value: number) : this;
	tint_opacity(value?: number) : this | number {
		if (value == null) { return this._tint_opac; }
		this._tint_opac = value;
		return this;
	}

	/*	@docs:
		@title: Set/Get content overflow
		@description: Set or get the step's content overflow.
	 */
	content_overflow() : string;
	content_overflow(value: string) : this;
	content_overflow(value?: string) : this | string {
		if (value == null) { return this._content_nodes[0].overflow(); }
		this._content_nodes.iterate(node => {
			node.overflow(value);
		})
		return this;
	}

	/*	@docs:
		@title: Set divider background
		@description: Set the divider background between the steps.
	 */
	divider_background() : string;
	divider_background(value: string) : this;
	divider_background(value?: string) : this | string {
		if (value == null) { return this._div_bg; }
		this._div_bg = value;
		this._div_nodes.iterate(node => {
			node.background(value);
		})
		return this;
	}

	/*	@docs:
		@title: Set step number background
		@description: Set or get the step number background.
	 */
	step_number_background() : string;
	step_number_background(value: string) : this;
	step_number_background(value?: string) : this | string {
		if (value == null) { return this._step_bg; }
		this._step_bg = value;
		this._step_nr_nodes.iterate(node => {
			node.bg.background(value);
		})
		return this;
	}

	/*	@docs:
		@title: Set step number border color
		@description: Set or get the step number border color.
	 */
	step_number_border_color() : string;
	step_number_border_color(value: string) : this;
	step_number_border_color(value?: string) : this | string {
		if (value == null) { return this._step_border; }
		this._step_border = value;
		this._step_nr_nodes.iterate(node => {
			node.border_color(value);
		})
		return this;
	}

	/*	@docs:
		@title: Set step number border radius
		@description: Set or get the step number border radius.
	 */
	step_number_border_radius() : string;
	step_number_border_radius(value: string) : this;
	step_number_border_radius(value?: string) : this | string {
		if (value == null) { return this._step_border_radius; }
		this._step_border_radius = value;
		this._step_nr_nodes.iterate(node => {
			node.border_radius(value);
		})
		return this;
	}

    /*	@docs:
        @title: Set step number border radius
        @description: Set or get the step number border radius.
     */
    step_number_margin_right(): string;
    step_number_margin_right(value: string): this;
    step_number_margin_right(value?: string): this | string {
        if (value == null) { return this._step_margin_right; }
        this._step_margin_right = value;
        this._step_nr_nodes.iterate(node => {
            node.margin_right(value);
        })
        return this;
    }

	/*	@docs:
		@title: Iterate step number nodes
		@description: Iterate the step number nodes. When the callback returns any non null value the iteration will be stopped.
	 */
	iterate_step_numbers(callback: (element: VStackElement) => void) {
		this._step_nr_nodes.iterate(node => {callback(node)})
		return this;
	}

	/*	@docs:
		@title: Iterate step nodes
		@description: Iterate the step nodes. When the callback returns any non null value the iteration will be stopped.
	 */
	iterate_steps(callback: (element: HStackElement) => void) {
		this._step_nodes.iterate(node => {callback(node)})
		return this;
	}
}
export const Steps = Elements.wrapper(StepsElement);
export const NullSteps = Elements.create_null(StepsElement);
declare module './any_element.d.ts' { interface AnyElementMap { StepsElement: StepsElement }}