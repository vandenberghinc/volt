/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"
import { VStackElement, VStack, HStack, HStackElement } from "./stack"

// Slider.
@Elements.register
export class SliderElement extends VStackElement {

    // Macros.
    #macro OnChangeCallback ((element: SliderElement, value: number) => void)

    // Attributes.
    public _type: string;
    public _value: number;
    public _enabled_color: string;
    public _disabled_color: string;
    public slider: VStackElement;
    public button: VStackElement;

    protected slider_on_mouse_down_handler: any;
    protected on_mouse_down_handler: any;
    protected on_mouse_move_handler: any;
    protected on_mouse_up_handler: any;

    constructor(value: number = 0.0) {

        // Initialize base class.
        super();

        // Set element type.
        this.element_type = "Slider";

        // Attributes.
        this._type = "SliderElement";
        this._value = value;
        this._enabled_color = "green";
        this._disabled_color = "none";

        // The slider background.
        this.slider = VStack(
            VStack()
                .position(0, null, 0, 0)
                .background(this._enabled_color)
                .transition("right 0.05s ease-out"),
            VStack()
                .position(0, 0, 0, 0)
                .background(this._disabled_color)
                .transition("left 0.05s ease-out"),
        )
            .background("white")
            .position("relative")
            // .border(`1px solid ${SETTINGS.theme.lightest_widget_background}90`)
            .frame("100%", 5)
            .border_radius(10)
            .overflow("hidden")
            .box_shadow(`0px 0px 2px #00000030`)
            .on_click((element, event) => this.slider_on_mouse_down_handler(event))
            .parent(this)
            .abs_parent(this)

        // The button.
        this.button = VStack()
            .border_radius("50%")
            .frame(15, 15)
            .background("gray")
            .position("absolute")
            .left(0)
            .top(0)
            .transition("left 0.05s ease-out")
            .box_shadow(`0px 0px 2px #00000060`)
            .cursor("pointer")
            .on_mouse_down(() => this.on_mouse_down_handler())
            .parent(this)
            .abs_parent(this)

        // Append.
        this.append(this.slider, this.button)

        // Styling.
        this.min_height(15)
        this.position("relative")
        this.flex_shrink(0)
        this.center_vertical()
        this.height("fit-content")

        // On mouse down handler for the button.
        this.slider_on_mouse_down_handler = (event) => {
            this.rect = this.getBoundingClientRect();
            this.button_rect = this.button.getBoundingClientRect();
            const min = this.rect.left;
            const max = this.rect.left + this.rect.width;
            const x = Math.max(min, Math.min(event.clientX, max));
            this.value((x - min) / (max - min));
        }

        // On mouse down handler for the button.
        this.on_mouse_down_handler = () => {
            this.dragging = true;
            this.rect = this.getBoundingClientRect();
            this.button_rect = this.button.getBoundingClientRect();
            document.body.addEventListener("mouseup", this.on_mouse_up_handler);
            document.body.addEventListener("mousemove", this.on_mouse_move_handler);
        }

        // On mouse move handler for the button.
        this.on_mouse_move_handler = (event) => {
            this.rect = this.getBoundingClientRect();
            this.button_rect = this.button.getBoundingClientRect();
            const min = this.rect.left;
            const max = this.rect.left + this.rect.width;
            const x = Math.max(min, Math.min(event.clientX, max));
            this.value((x - min) / (max - min));
        }

        // On mouse up handler for the button.
        this.on_mouse_up_handler = () => {
            this.dragging = false;
            document.body.removeEventListener("mouseup", this.on_mouse_up_handler);
            document.body.removeEventListener("mousemove", this.on_mouse_move_handler);
        }

        // On change handler.
        this.on_change_handler = (a, b) => {};

        // Set value.
        if (value != 0.0) {
            this.on_render(() => {
                this.value(value);
            })
        }

    }

    // Set default since it inherits HStackElement.
    set_default() : this {
        return super.set_default(SliderElement);
    }

    // Get or set the enabled color.
    enabled_color(): string;
    enabled_color(value: string): this;
    enabled_color(value?: string): this | string {
        if (value == null) {
            return this._enabled_color;
        }
        this._enabled_color = value;
        this.slider.child(0).background(this._enabled_color);
        return this;
    }

    // Get or set the disabled color.
    disabled_color(): string;
    disabled_color(value: string): this;
    disabled_color(value?: string): this | string {
        if (value == null) {
            return this._disabled_color;
        }
        this._disabled_color = value;
        this.slider.child(1).background(this.disabled_color);
        return this;
    }

    // Set the on change handler.
    // @ts-ignore
    on_change(): OnChangeCallback;
    // @ts-ignore
    on_change(handler: OnChangeCallback): this 
    // @ts-ignore
    on_change(handler?: OnChangeCallback): OnChangeCallback | this {
        if (handler == null) {
            return this.on_change_handler;
        }
        this.on_change_handler = handler;
        return this;
    }

    // Set or get the value.
    // @ts-ignore
    value(): number;
    // @ts-ignore
    value(value: number): this;
    // @ts-ignore
    value(value?: number): this | number {
        if (value == null) {
            return this._value;
        }
        this._value = Math.max(0.0, Math.min(1.0, value));
        this.rect = this.getBoundingClientRect();
        this.button_rect = this.button.getBoundingClientRect();
        this.slider_rect = this.slider.getBoundingClientRect();
        const left = Math.min(
            this.rect.width - this.button_rect.width, 
            Math.max(
                0, 
                (this._value * this.rect.width) - (this.button_rect.width / 2)
            )
        );
        this.button.style.left = `${left}px`
        this.slider.child(0).right(this.slider_rect.width - left);
        this.slider.child(1).left(left);
        this.on_change_handler(this, this._value)
        return this;
    }
}
export const Slider = Elements.wrapper(SliderElement);