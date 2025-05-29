/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement } from "../elements/module.js"
import { Scheme } from "@vandenberghinc/vlib/frontend";
import { VStack, VStackElement, HStack, HStackElement, ZStack } from "./stack"
import { ForEach } from "./for_each"
import { Text, TextElement } from "./text"
import { Divider, DividerElement } from "./divider"

// The header tab element interface.
// @ts-expect-error
export interface TabElement extends HStackElement {
	_header_title: TextElement;
	_header_div: VStackElement;

	_on_select?: ((TabElement) => any);
	_on_unselect?: ((TabElement) => any);

	on_select(): undefined | ((TabElement) => any);
	on_select(callback: ((TabElement) => any)): this;

	on_unselect(): undefined | ((TabElement) => any);
	on_unselect(callback: ((TabElement) => any)): this;

	select(): this;
	unselect(): this;
	is_selected(): boolean;
}
export interface TabContentItem {
	title: string,
	content: any,
}

// Callbacks.
type OnTabHeader = ((name: string, header: HStackElement, tab: TabsElement) => any)

/*	@docs:
	@nav: Frontend
	@chapter: Elements
	@title: Tabs
	@description: Create a tabs element with content that will be presented when the tab is selected.
	@param:
		@name: content
		@descr: The tab contents.
		@type: Tab[]
		@attributes_type: Tab
		@attr:
			@name: title
			@descr: The tab title.
		@attr:
			@name: content
			@descr: The volt node to be presented when the tab is selected.
		@attr:
			@name: on_header
			@descr:
				A callback that can be set to edit the tab's header title node.
				The callback takes the arguments local header node and parent tabs node as `(header_node, tabs_node)`.
 */
@Elements.create({
    name: "TabsElement",
    default_style:  {
        ...VStackElement.default_style,
        "font-size": "16px",
        "font-weight": "500",
        "overflow-x": "hidden",
        "width": "100%",
        "--tabs-tint": "blue",
        "--tabs-tab-opac": 0.8,
        "--tabs-div-bg": "gray",
        "--tabs-div-opac": 0.5,
    },
})
export class TabsElement extends (VStackElement as any as VElementBaseSignature) {

	// Attributes.
	public _tint: string;
	public _tab_opac: number;
	public _div_bg: string;
	public _div_opac: number;
	public _selected_node: any;
	public _tab_nodes: (HStackElement & TabElement)[];
	public _on_tab_header?: OnTabHeader;
	public _div?: DividerElement;

	protected _animate: boolean;
	protected _duration: number;

	// Constructor.
	constructor({
		content = [],
		animate = true,
		duration = 300,
	}: {
		content: TabContentItem[] | Record<string, any>,
		animate?: boolean,
		duration?: number,
	}) {

		// Inherit.
		super();
		this._init({
			derived: TabsElement,
		})

		// Params.
		this._animate = animate;
		this._duration = duration;

		// Attributes.
		this._tint = TabsElement.default_style["--tabs-tint"];
		this._tab_opac = TabsElement.default_style["--tabs-tab-opac"];
		if ((this._tab_opac as any) === false) {
			this._tab_opac = -1;
		}
		this._div_bg = TabsElement.default_style["--tabs-div-bg"];
		this._div_opac = TabsElement.default_style["--tabs-div-opac"];
		this._selected_node = undefined;
		this._tab_nodes = [];

		// Build.
		this.color("white")
		this.build(content);
	}

	// Set default since it inherits another element.
	set_default() : this {
		return super.set_default(TabsElement);
	}

	// Get the styling attributes.
	styles(): Record<string, string>;
	styles(style_dict: Record<string, any>) : this;
	styles(style_dict?: Record<string, any>) {
		if (style_dict == null) {
			let styles = super.styles();
			styles["--tabs-tint"] = this._tint;
			styles["--tabs-tab-opac"] = this._tab_opac.toString();
			styles["--tabs-div-bg"] = this._div_bg;
			styles["--tabs-div-opac"] = this._div_opac.toString();
			return styles;
		} else {
			return super.styles(style_dict);
		}
	}

	// Build.
	/*	@docs:
		@title: Build
		@description:
			Build the tab's content. This function is called automatically from the constructor.
	 */
	build(content: TabContentItem[] | Record<string, any> = []) {

		// Convert conent object to array.
		if (content && typeof content === "object" && !Array.isArray(content)) {
			const old = content;
			content = Object.keys(old).map(key => ({
				title: key as string,
				content: old[key],
			}));
		}
		else if (!Array.isArray(content)) {
			console.error(`Invalid parameter type "${Scheme.value_type(content)}" for parameter "content", the valid type is "array" or "object".`)
			return this;
		}
		content = content as {title: string, content: any}[]


		// Build.
		this.remove_children();
		const main_this = this;
		let zstack;
		this.append(
			HStack(
				ForEach(content as TabContentItem[], (content_item, index, is_last) => {
					const name = content_item.title;
					const content_stack = content_item.content;
					if (typeof name !== "string") {
						console.error(`Invalid parameter type "${Scheme.value_type(name)}" for parameter "content.${index}.title", the valid type is "string".`)
					} else if (content_stack == null) {
						console.error(`Invalid parameter type "${Scheme.value_type(content_stack)}" for parameter "content.${index}.content", the valid type is "Node". or "Array"`)
					}
					const item = HStack<TabElement>( // use an hstack so the user can still add flexed elements through the on_tab_header callback.
						Text(name)
							.assign_to_parent_as("_header_title") // use unique name since more elements might be added by the user.
							.flex_shrink(0)
							.width("fit-content")
							.margin_bottom(5)
							.font_weight("inherit")
							.font_size("inherit")
							.color(index === 0 ? this._tint : "inherit")
							.transition("color 250ms ease-in-out, background 250ms ease-in-out"), // also background animation for gradient colors.
						VStack()
							.assign_to_parent_as("_header_div") // use unique name since more elements might be added by the user.
							.position(null, 0, -1, 0)
							.height(2)
							.border_radius(2)
							.background(index === 0 ? this._tint : "transparent")
							.transition("background 250ms ease-in-out, opacity 250ms ease-in-out")
					)
					.center_vertical()  // so the user can still add flexed elements through the on_tab_header callback.
					.transition("opacity 250ms ease-in-out")
					.display("inline-flex")
					.padding(0, 2)
					.flex_shrink(0)
					.margin_right(is_last ? 0 : 25)
					.position("relative")
					.wrap(false)
					.opacity(this._tab_opac === -1 ? 1 : this._tab_opac)
					.extend({
						on_select(callback) {
							if (callback == null) { return this._on_select; }
							this._on_select = callback;
							return this;
						},
						select() {
							this._header_title.color(main_this._tint);
							this._header_div.background(main_this._tint).opacity(1);
							if (main_this._tab_opac !== -1) {
								this.opacity(1)
							}
							if (main_this._selected_node && main_this._selected_node != this) {
								main_this._selected_node.unselect();
							}
							if (main_this._animate) {
								content_stack.show().getBoundingClientRect();
								content_stack.opacity(1);
							} else {
								content_stack.show();
							}
							if (typeof this._on_select === "function") {
								this._on_select(this);
							}
							main_this._selected_node = this;
							return this;
						},
						on_unselect(callback) {
							if (callback == null) { return this._on_unselect; }
							this._on_unselect = callback;
							return this;
						},
						unselect() {
							this._header_title.color("inherit");
							this._header_div.background("transparent");
							if (main_this._tab_opac !== -1) {
								this.opacity(main_this._tab_opac)
							}
							if (main_this._animate) {
								content_stack.opacity(0).timeout(main_this._duration, e => e.hide());
							} else {
								content_stack.hide();
							}
							if (typeof this._on_unselect === "function") {
								this._on_unselect(this);
							}
							return this;
						},
						is_selected() {
							return this === main_this._selected_node;
						}
					} as HStackElement & TabElement)
					.on_mouse_over(e => {
						if (e !== main_this._selected_node) {
							if (this._tab_opac !== -1) {
								e.opacity(1)
							}
							const color = window.getComputedStyle(e as any).color;
							e._header_div.opacity(this._div_opac).background(color);
						}
					})
					.on_mouse_out(e => {
						if (e !== main_this._selected_node) {
							if (this._tab_opac !== -1) {
								e.opacity(this._tab_opac)
							}
							e._header_div.background("transparent").opacity(1);
						}
					})
					.on_click(e => e.select())
					.exec(e => {
						if (index === 0) { main_this._selected_node = e; }
						this._tab_nodes.append(e);
					})
					if (typeof content_item.on_header === "function") {
						content_item.on_header(item, this)
					}
					if (typeof this._on_tab_header === "function") {
						this._on_tab_header(name, item, this)
					}
					return item;
				}),
			)
			.width("100%"),

			this._div = Divider()
				.frame("100%", 1)
				.background(this._div_bg)
				.margin(1, 0, 25, 0),

			zstack = ZStack(),
		)
		let index = 0;
		content.iterate(item => {
			const content_stack = item.content;
			if (index === 0) {
				content_stack.show();
			} else {
				content_stack.hide();
				if (this._animate) {
					content_stack.opacity(0);
				}
			}
			if (content_stack.overflow_x() === "visible") {
				content_stack.overflow_x("hidden");
			}
			content_stack.width("100%");
			content_stack.transition(`opacity ${this._duration}ms ease-in-out`)
			zstack.append(content_stack);
			++index;
		});
	}

	/*	@docs:
		@title: Selected
		@description: Get the selected tab title, returns `null` when no tab has been selected.
	 */
	// @ts-ignore
	selected() : string | null {
		return this._selected_node ? this._selected_node.textContent : null;
	}

	/*	@docs:
		@title: Select
		@description: Select a tab based on the title text.
	 */
	// @ts-ignore
	select() : string | null;
	// @ts-ignore
	select(tab: string): this;
	// @ts-ignore
	select(tab?: string) : this | string | null {
		if (tab == null) { return this._selected_node ? this._selected_node.textContent : null; }
		this._tab_nodes.iterate(node => {
			if (node.textContent === tab) {
				node.select();
				return true;
			}
		})
		return this;
	}

	/*	@docs:
		@title: Set/Get tint
		@description: Set or get the tint color.
	 */
	tint() : string;
	tint(value: string);
	tint(value?: string) : this | string {
		if (value == null) { return this._tint ?? ""; }
		this._tint = value;
		if (this._selected_node) {
			this._selected_node.select();
		}
		return this;
	}

	/*	@docs:
		@title: Set tab opacity
		@description: Set or get the tab title opacity. By default non selected tabs have a slight opacity `0.8`, value `-1` can be used to disable this behaviour.
	 */
	tab_opacity() : number;
	tab_opacity(value: number | boolean) : this;
	tab_opacity(value?: number | boolean) : this | number {
		if (value == null) { return this._tab_opac; }
		if (value === false) {
			value = -1;
		} else if (value === true) {
			value = 0.8;
		}
		this._tab_opac = value;
		this._tab_nodes.iterate(node => {
			if (this._selected_node !== node) {
				node.opacity(value);
			}
		})
		return this;
	}

	/*	@docs:
		@title: Set/Get tint
		@description: Set or get the tint color.
	 */
	divider_background() : string;
	divider_background(value: string);
	divider_background(value?: string) : this | string {
		if (value == null) { return this._div_bg; }
		this._div_bg = value;
		this._div?.background(this._div_bg);
		return this;
	}

	/*	@docs:
		@title: Set divider opacity
		@description: Set or get the divider opacity from mouse over events. By default in mouse over events the tab bottom divider will have the same color as the tab title, but with an opacity.
	 */
	divider_opacity() : number;
	divider_opacity(value: number) : this;
	divider_opacity(value?: number) : this | number {
		if (value == null) { return this._div_opac; }
		this._div_opac = value;
		return this;
	}

	/*	@docs:
		@title: On tab header
		@description:
			Set a on tab header callback. This callback is executed when a title's header is built.

			Beware, by default the content is already built in the constructor. Therefore, you should not pass a `content` parameter to the constructor.
			Instead construct the object, set this callback and then use `TabsElement.build(content)` to build the content after the callback has been set.
		@param:
			@name: callback
			@type: function
			@descr:
				The callback accepts parameters `(tab_name, tab_node, node)`. The last node is the parent `TabsElements` object.

	 */
	on_tab_header() : OnTabHeader | undefined;
	on_tab_header(callback: OnTabHeader);
	on_tab_header(callback?: OnTabHeader) : this | OnTabHeader | undefined {
		if (callback == null) { return this._on_tab_header; }
		this._on_tab_header = callback;
		return this;
	}
}
export const Tabs = Elements.wrapper(TabsElement);
export const NullTabs = Elements.create_null(TabsElement);
declare module './any_element.d.ts' { interface AnyElementMap { TabsElement: TabsElement }}