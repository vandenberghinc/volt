/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Scroller.
// - Warning: Setting padding on element attribute "content" may cause undefined behaviour.
@constructor_wrapper
@register_element
class ScrollerElement extends CreateVElementClass({
    type: "Scroller",
    tag: "div",
    default_style: {
        "position": "relative", // is required for attribute "track" 
        "margin": "0px",
        "padding": "0px",
        // "clear": "both",
        "display": "flex", // to support vertical spacers.
        "overflow": "hidden",
        // "flex": "1", // disabled to support horizontal spacers in VStacks.
        "align-content": "flex-start", // align items at start, do not stretch / space when inside HStack.
        "flex-direction": "column",
        // "text-align": "start",
        "scroll-behavior": "auto",
        "overscroll-behavior": "auto", // relay to parent to resume scroll when local scroll has ended.
        "height": "fit-content", // set height to max compared to parents non overflow, so scrolling can take effect.
        "content-visibility": "auto", // improve rendering.
        // "align-content": "flex-start", // align items at start, do not stretch / space when inside HStack.
        // "align-items": "flex-start", // align items at start, do not stretch / space when inside HStack.
    },
}) {
    
    // Constructor.
    constructor(...children) {
        
        // Initialize base class.
        super();

        // Style.
        if (this.position() != "absolute") {
            this.position("relative"); // is required for attribute "track" 
        }
        super.overflow("hidden"); // should always be hidden to enable scrolling, and otherwise the thumb not be visible due to overflow width.
        this.class("hide_scrollbar")
        this.styles({
            "content-visibility": "auto",
        })

        // Content.
        this.content = VStack(...children)
            .parent(this)
            .class("hide_scrollbar")
            .position("relative") // in case it has absolute children that should scroll, otherwise the content wont scroll without "relative".
            .frame("100%", "100%")
            .flex("1 1 0") // flex-basis 0 otherwise it expands its parent.
            .overflow("scroll")
            .overscroll_behavior(ScrollerElement.default_style["overscroll-behavior"])
            .styles({
                "content-visibility": "auto",
            })

        // Scroll bar.
        this.thumb = VStack()
            .parent(this)
            .position(0, 0, null, 0)
            .height(30)
            .border_radius(10)
            .overflow("visible") // for thumb shadow.
            .background_color("#CCCCCC")
            .opacity(0)
            .transition("opacity 0.3s linear")
            .box_shadow("0px 0px 5px #00000005")
        this.track = VStack(this.thumb)
            .parent(this)
            .class("hide_scrollbar")
            .position(5, 5, 5, null)
            .width(10)
            .background_color("transparent")
            .border_radius(10)
            .transition("background-color 0.3s linear")
            .assign("background_value", "#28292E")
            .overflow("visible")

        // Add children.
        super.append(this.content, this.track);

        // The on scroll callbacks.
        this.on_scroll_callbacks = [];

        // Alias functions.
        // this.raw_append = super.append.bind(super);
        this.iterate = this.content.iterate.bind(this.content);
        this.iterate_nodes = this.content.iterate_nodes.bind(this.content);

        // Set default delay.
        this.m_delay = 1000;

        // Overwrite track background functions to keep the background color.
        this.track.__background__ = this.track.background;
        this.track.__background_color__ = this.background_color;
        this.track.background = function(value) {
            if (value != null) {
                this.__background_value__ = value;
            }
            return this;
        }
        this.track.background_color = function(value) {
            if (value != null) {
                this.__background_value__ = value;
            }
            return this;
        }

        // Mouse enter event.
        this.track.addEventListener("mouseenter", (event) => {
            if (!this.is_scrollable()) {
                return null;
            }
            this.track.style.backgroundColor = this.track.__background_value__;
            clearTimeout(this.fadeout_timeout);
            this.thumb.style.opacity = 1; // keep as opacity for box shadow.
        })

        // Mouse leave event.
        this.track.addEventListener("mouseleave", (event) => {
            if (!this.is_scrollable()) {
                return null;
            }
            if (!this.thumb.dragging) {
                this.track.style.backgroundColor = "transparent";
                this.thumb.style.opacity = 0; // keep as opacity for box shadow.
            }
        })

        // Scroll event.
        this.content.addEventListener("scroll", (event) => {

            // Calculate thumb offset.
            const height = this.content.clientHeight; 
            const relative_height = this.track.clientHeight; //this.content.clientHeight;
            const thumb_height = this.thumb.clientHeight;
            const scroll_height = this.content.scrollHeight;
            const scroll_top = this.content.scrollTop;
            let relative_top;
            if (scroll_top >= scroll_height - height) {
                relative_top = relative_height - thumb_height;
            } else {
                relative_top = relative_height * (scroll_top / (scroll_height - height)) - thumb_height / 2;
                if (relative_top + thumb_height >= relative_height) {
                    relative_top = relative_height - thumb_height - 3;
                }
            }
            if (relative_top < 0) {
                relative_top = 0;
            }
            this.thumb.style.transform = `translateY(${relative_top}px)`;

            // Fade in.
            // this.track.style.backgroundColor = this.track.__background_value__;
            clearTimeout(this.fadeout_timeout);
            this.thumb.style.opacity = 1;

            // Fade out.
            clearTimeout(this.fadeout_timeout);
            this.fadeout_timeout = setTimeout(() => {
                this.track.style.backgroundColor = "transparent"; // also hide track so that when the user drags the thumb and the track becomes visible, the track and the thumb fade out simultaneously when the dragging ends.
                this.thumb.style.opacity = 0;
            }, this.m_delay)
        })

        // Set scroll by dragging thumb.
        let start_y, old_user_select;
        const mouse_up_handler = (event) => {

            // No longer dragging.
            this.thumb.dragging = false;

            // Restore user select.
            this.style.userSelect = old_user_select;

            // Remove handler.
            document.body.removeEventListener("mouseup", mouse_up_handler);

        };
        this.thumb.onmousedown = (event) => {

            // Not scrollable.
            if (!this.is_scrollable()) {
                return null;
            }

            // Set start y.
            start_y = this.content.getBoundingClientRect().top + parseFloat(window.getComputedStyle(this.track).marginTop);

            // Set user select.
            // Should be set on "this" on "this.content" does not work correctly.
            old_user_select = this.content.style.userSelect;
            this.style.userSelect = "none";

            // Set dragging.
            this.thumb.dragging = true;

            // Show track.
            this.track.style.backgroundColor = this.track.__background_value__;
            clearTimeout(this.fadeout_timeout);
            this.thumb.style.opacity = 1; // keep as opacity for box shadow.

            // Add mouse up handler to body.
            document.body.addEventListener("mouseup", mouse_up_handler);

        }
        this.addEventListener("mousemove", (event) => {
            if (this.thumb.dragging) {

                // Vars.
                const height = this.content.clientHeight;
                const y = Math.max(0, event.clientY - start_y);
                let y_percentage = vweb.utils.round(y / height, 2); // needs to be rounder otherwise it always remains at 0.9999 and never reaches the end. 
                const computed = window.getComputedStyle(this.content);
                const max_scroll_top = (
                    this.content.scrollHeight - 
                    this.content.clientHeight + 
                    parseFloat(computed.paddingTop) + 
                    parseFloat(computed.paddingBottom)
                );
                const scroll_top = Math.round(max_scroll_top * y_percentage);

                // Set the scroll top.
                this.content.scrollTop = scroll_top; // triggers on scroll which updates the thumb top.

            }
        });

        // Scroll by clicking on the track.
        this.track.onclick = (event) => {

            // Not scrollable.
            if (!this.is_scrollable()) {
                return null;
            }

            // Vars.
            const height = this.content.clientHeight;
            const start_y = this.content.getBoundingClientRect().top + parseFloat(window.getComputedStyle(this.track).marginTop);
            const y = Math.max(0, event.clientY - start_y);
            let y_percentage = vweb.utils.round(y / height, 2); // needs to be rounder otherwise it always remains at 0.9999 and never reaches the end. 
            const computed = window.getComputedStyle(this.content);
            const max_scroll_top = (
                this.content.scrollHeight - 
                this.content.clientHeight + 
                parseFloat(computed.paddingTop) + 
                parseFloat(computed.paddingBottom)
            );
            const scroll_top = Math.round(max_scroll_top * y_percentage);

            // Set the scroll top.
            this.content.scrollTop = scroll_top; // triggers on scroll which updates the thumb top.
        };

        // On alignment check callback.
        // When the alignment is set to not leading, and the content can scroll, then it is temporarily set to leading till the content is no longer scrollable.
        this._h_alignment = undefined;
        this._current_h_alignment = undefined;
        this._v_alignment = undefined;
        this._current_v_alignment = undefined;
        this._alignment_callback_activated = false;
        this._alignment_callback = () => {
            if (this._h_alignment !== undefined) {
                if (this.content.clientWidth >= this.clientWidth) {
                    if (this._current_h_alignment !== "normal") {
                        super.align_items("normal");
                        this._current_h_alignment = "normal";
                    }
                } else {
                    if (this._current_h_alignment !== this._h_alignment) {
                        super.align(this._h_alignment);
                        this._current_h_alignment = this._h_alignment;
                    }
                }
            }
            if (this._v_alignment !== undefined) {
                if (this.content.clientHeight > this.clientHeight) {
                    if (this._current_v_alignment !== "normal") {
                        super.align_vertical("normal");
                        this._current_v_alignment = "normal";
                    }
                } else {
                    if (this._current_v_alignment !== this._v_alignment) {
                        super.align_vertical(this._v_alignment);
                        this._current_v_alignment = this._v_alignment;
                    }
                }
            }
        };

    }

    // Is scrollable.
    is_scrollable() {
        return this.content.scrollHeight > this.content.clientHeight || this.content.scrollWidth > this.content.clientWidth;
    }

    // Set remove children to content.
    remove_children() {
        this.content.inner_html("");
        return this;
    }

    // By default append items to the content.
    append(...children) {
        this.content.append(...children);
        return this;
    }

    // By default get child of the content.
    child(index) {
        return this.content.child(index);
    }

    // Replace overflow.
    overflow(value) {
        if (value == null) {
            return this.content.overflow();
        }
        this.content.overflow(value);
        return this;
    }
    overflow_x(value) {
        if (value == null) {
            return this.content.overflow_x();
        }
        this.content.overflow_x(value);
        return this;
    }
    super_overflow_x(value) {
        if (value == null) {
            return super.overflow_x();
        }
        super.overflow_x(value);
        return this;
    }
    overflow_y(value) {
        if (value == null) {
            return this.content.overflow_y();
        }
        this.content.overflow_y(value);
        return this;
    }
    super_overflow_y(value) {
        if (value == null) {
            return super.overflow_y();
        }
        super.overflow_y(value);
        return this;
    }

    // Show the overflow so the scroller no longer scrolls.
    show_overflow() {
        super.overflow("visible");
        this.content.overflow("visible");
        return this;
    }

    // Hide the overflow so the scroller can scrolls.
    hide_overflow() {
        super.overflow("hidden");
        this.content.overflow("auto");
        return this;
    }

    // Set the opactiy delay when finished scrolling.
    delay(msec) {
        if (msec == null) {
            return this.m_delay;
        }
        this.m_delay = msec;
        return this;
    }

    // Get the scroll top.
    scroll_top(value) {
        if (value == null) {
            return this.content.scrollTop;
        }
        this.content.scrollTop = value;
        return this;
    }

    // Get the scroll left.
    scroll_left(value) {
        if (value == null) {
            return this.content.scrollLeft;
        }
        this.content.scrollLeft = value;
        return this;
    }

    // Get the scroll height.
    scroll_height() {
        return this.content.scrollHeight;
    }

    // Get the scroll width.
    scroll_width() {
        return this.content.scrollWidth;
    }

    // Add a on scroll callback.
    on_scroll(opts_or_callback = {callback: null, delay: null}) {
        if (opts_or_callback == null) { return this.on_scroll_callbacks; }
        let callback;
        if (vweb.utils.is_func(opts_or_callback)) {
            const e = this;
            callback = (event) => opts_or_callback(e, event);
            this.on_scroll_callbacks.push({callback, user_callback: opts_or_callback});
        } else {
            if (opts_or_callback.delay == null) {
                callback = opts_or_callback.callback;
            } else {
                let timer;
                const e = this;
                callback = function(t) {
                    clearTimeout(timer);
                    setTimeout(() => opts_or_callback.callback(e, t), opts_or_callback.delay);
                }
            }
            this.on_scroll_callbacks.push({callback, user_callback: opts_or_callback.callback});
        }
        this.content.addEventListener("scroll", callback);
        return this;
    }

    // Remove a on scroll callback.
    remove_on_scroll(callback) {
        let dropped = [];
        this.on_scroll_callbacks.iterate((item) => {
            if (item.user_callback === callback) {
                this.content.removeEventListener("scroll", item.callback);
            } else {
                dropped.push(item);
            }
        })
        this.on_scroll_callbacks = dropped;
        return this;
    }

    // Small wrapper to set scroll top without triggering a certain on scroll handler.
    set_scroll_top_without_event(top) {
        return this.set_scroll_position_without_event(top);
    }

    // Small wrapper to set scroll left without triggering a certain on scroll handler.
    set_scroll_left_without_event(left) {
        return this.set_scroll_position_without_event(null, left);
    }

    // Small wrapper to set scroll top / left without triggering a certain on scroll handler.
    set_scroll_position_without_event(top = null, left = null) {
        this.on_scroll_callbacks.iterate((item) => {
            this.content.removeEventListener("scroll", item.callback);
        });
        if (top != null) {
            this.scroll_top(top);
        }
        if (left != null) {
            this.scroll_left(left);
        }
        this.on_scroll_callbacks.iterate((item) => {
            this.content.addEventListener("scroll", item.callback);
        });
        return this;
    }

    // Alignments.
    // When the alignment is set to not leading, and the content can scroll, then it is temporarily set to leading till the content is no longer scrollable.
    // @warning: This only works when a max width has been set on the content attribute.
    align(value) {
        if (value === null) { return this._h_alignment; }
        super.align(value);
        this._h_alignment = value;
        if (this._alignment_callback_activated !== true) {
            this._alignment_callback_activated = true;
            this.on_resize(this._alignment_callback);
            this.on_render(this._alignment_callback);
        }
        return this;
    }
    center() {
        this.align("center");
        return this;
    }
    leading() {
        this.align("start");
        return this;
    }
    trailing() {
        this.align("end");
        return this;
    }
    align_vertical(value) {
        if (value === null) { return this._v_alignment; }
        super.align_vertical(value);
        this._v_alignment = value;
        if (this._alignment_callback_activated !== true) {
            this._alignment_callback_activated = true;
            this.on_resize(this._alignment_callback);
            this.on_render(this._alignment_callback);
        }
        return this;
    }
    center_vertical() {
        this.align_vertical("center");
        return this;
    }
    leading_vertical() {
        this.align_vertical("start");
        return this;
    }
    trailing_vertical() {
        this.align_vertical("end");
        return this;
    }
}

// Scroller.
/*  @docs:
    @nav: Frontend
    @chapter: Elements
    @title: Virtual Scroller
    @experimental: true
    @note: The `VirtualScrollerElement` is also initializable under function `VirtualScroller`.
    @description: 
        The virtual scroller element.

        Can be initialed with function `VirtualScroller()`.
    
        After appending children you should call `render()` otherwise the children will only show up after a scroll event.

        The virtual scroller can work in two ways. 
         1) You must set a fixed height for every direct child.
         2) You call the member function `update_heights()` after any height involving edits are made and before you call member function `render()` for the first time.
    @warning: Using content-visibility on the direct or nested children may cause undefined behaviour, it may cause elements to become hidden.
    @warning: Every element must have a fixed height, Unless you use `update_heights()`. Otherwise the rendering will throw an error. Any incorrect heights may cause undefined behaviour.
    @warning: Setting padding on element attribute "content" may cause undefined behaviour.
    @parameter:
        @name: children
        @description: The elements children.
        @type: array[Node]
 */
@constructor_wrapper
@register_element
class VirtualScrollerElement extends ScrollerElement {
    
    // Constructor.
    constructor(...children) {
        
        // Initialize base class.
        super();

        // Set element type.
        this.element_type = "VirtualScroller";

        // Virtual children.
        this.v_children = [];

        // Attributes.
        this.top_diff = 0;
        this.scroll_top_value = 0;
        this.last_v_children = 0;

        // Append children.
        this.append(...children);

        // The visible container with the scroll dimensions and positioned children inside.
        this.visible_container = VStack()
            .position("relative")
            .overflow_x("visible")
            .overflow_y("hidden")
            .styles({
                "content-visibility": "auto",
            })
        this.content.append(this.visible_container)

        // The height measurer.
        this.height_measurer = Span()
            .visibility("hidden")
        this.content.append(this.height_measurer)

        // Render.
        this.render(true);

        // Set scroll event listener.
        // @todo set_scroll_top_without event wont work with this new scroll event.
        this.content.addEventListener("scroll", () => this.render())

    }

    // Set default since it inherits HStackElement.
    set_default() {
        return super.set_default(VirtualScrollerElement);
    }

    // Replace overflow.
    overflow(value) {
        if (value == null) {
            return this.content.overflow();
        }
        this.content.overflow(value);
        this.visible_container.overflow_x(value.split(" ")[0]);
        return this;
    }
    overflow_x(value) {
        if (value == null) {
            return this.content.overflow_x();
        }
        this.content.overflow_x(value);
        this.visible_container.overflow_x(value);
        return this;
    }
    // keep overflow y on this.visible_container always hidden otherwise it may mess with expanding this.content and cause an infinite scroll event.

    // Set remove children to content.
    remove_children() {
        this.v_children = [];
        this.visible_container.min_height(0);
        this.visible_container.max_height(0);
        this.visible_container.inner_html("");
        return this;
    }

    // Render the visible content.
    render() {
        // Do not use a clearTimeout setTimout structure cause that will cause some elements to be appended too late on a very fast sroll.

        // Get scroll direction.
        const last_scroll_top = this.scroll_top_value;
        this.scroll_top_value = this.content.scrollTop;
        const last_v_children = this.last_v_children;
        this.last_v_children = this.v_children.length;
        let scrolling_down = true;
        if (this.scroll_top_value > last_scroll_top) {
            scrolling_down = true;
        } else if (this.scroll_top_value < last_scroll_top) {
            scrolling_down = false;
        }
        // Disable forced behaviour because when height edits are made it should also be updated, but this is easily forgotten by the user.
        // else if (!forced && this.last_v_children == last_v_children) {
        //     return null; // horizontal scroll.
        // }

        // Get the start and end y.
        const start_y = this.content.scrollTop;
        const end_y = start_y + this.content.offsetHeight + this.top_diff;

        // Iterate.
        let is_first = true;
        let is_visible = false; 
        let total_height = 0;
        let visible_height = 0;
        this.v_children.iterate((child) => {

            // Child vars.
            const height = child.v_height !== undefined ? child.v_height : this.get_height(child);
            if (height == 0) {
                return null; // no fixed height or no height.
            }
            const child_start_y = total_height;
            const child_end_y = total_height + height; // Adjust as needed
            total_height += height;

            // First item.
            if (is_first && child_end_y >= start_y) {
                child.transform(`translateY(${child_start_y}px)`); // also update when still visible but height changes may have been made to an element.
                visible_height += height;
                is_first = false;
                is_visible = true;
                if (!child.rendered) {
                    if (scrolling_down) {
                        this.visible_container.appendChild(child);
                    } else {
                        this.visible_container.insertBefore(child, this.visible_container.firstChild);
                    }
                    child.rendered = true;
                }
            }

            // Last visible element.
            else if (is_visible && child_start_y >= end_y) {
                child.transform(`translateY(${child_start_y - visible_height}px)`); // also update when still visible but height changes may have been made to an element.
                visible_height += height;
                is_visible = false;
                if (!child.rendered) {
                    if (scrolling_down) {
                        this.visible_container.appendChild(child);
                    } else {
                        this.visible_container.insertBefore(child, this.visible_container.firstChild);
                    }
                    child.rendered = true;
                }
            }

            // Visible elements.
            else if (is_visible) {
                child.transform(`translateY(${child_start_y - visible_height}px)`); // also update when still visible but height changes may have been made to an element.
                visible_height += height;
                if (!child.rendered) {
                    if (scrolling_down) {
                        this.visible_container.appendChild(child);
                    } else {
                        this.visible_container.insertBefore(child, this.visible_container.firstChild);
                    }
                    child.rendered = true;
                }
            }

            // Invisible elements.
            else if (child.rendered) {
                child.remove();
                child.rendered = false;
            }
        })

        // Set scroll dimension.
        this.visible_container.min_height(total_height);
        this.visible_container.max_height(total_height);

        // Return this.
        return this;
    }

    // Update heights.
    update_heights() {
        this.v_children.iterate((child) => {
            child.v_height = this.get_height(child, false);
        })
    }

    // Update height of a certain child.
    update_height(child) {
        child.v_height = this.get_height(child, false);
    }

    // Get the height of an element.
    get_height(element, fixed = true) {
        let height;

        // Get fixed height.
        if (fixed) {
            height = parseFloat(element.style.height);
            if (isNaN(height)) {
                console.error("Every element in the virtual scroller must have a fixed height, ignoring element: " + element);
                element.style.display = "none";
                return 0;
            }
        }

        // Append to document and get height.
        // Does not require fixed heights but is slow.
        else {
            element.rendered = false; // set rendered to false because this will remove the child from this.visible_container when it was rendered.
            this.height_measurer.appendChild(element);
            height = element.offsetHeight;
            this.height_measurer.removeChild(element);
        }

        // Add margin.
        const margin_top = parseFloat(element.style.marginTop);
        if (!isNaN(margin_top)) {
            height += margin_top;
        }
        const margin_bottom = parseFloat(element.style.marginBottom);
        if (!isNaN(margin_bottom)) {
            height += margin_bottom;
        }

        // Handler.
        return height;
    }

    // Custom append function.
    append(...children) {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child != null) {

                // VWeb element.
                if (child.element_type != null) {
                    if (
                        child.element_type == "ForEach" ||
                        child.element_type == "If" ||
                        child.element_type == "IfDeviceWith"
                    ) {
                        child.append_children_to(this);
                    } else {
                        this.v_children.push(child);
                    }
                }

                // Execute function.
                else if (vweb.utils.is_func(child)) {
                    this.append(child());
                }

                // Node element.
                else if (child instanceof Node) {
                    this.v_children.push(child);
                }

                // Append text.
                else if (vweb.utils.is_string(child)) {
                    this.v_children.push(document.createTextNode(child));   
                }
            }
        }
        return this;
    }
}

/*  @docs:
    @nav: Frontend
    @chapter: Elements
    @title: Snap Scroller
    @experimental: true
    @note: The `SnapScrollerElement` is also initializable under function `SnapScroller`.
    @description: 
        Scrolls the windows per window (snap scrolling).

        This class is still experimental.
 */
@constructor_wrapper
@register_element
class SnapScrollerElement extends VStackElement {
    constructor(...children) {

        // Base.
        super();

        // Element type.
        this.element_type = "SnapScroller";

        // Style.
        this.overflow_y("scroll");
        this.scroll_snap_type("y mandatory");

        // Add children.
        this.append(...children);
    }

    // Append.
    append(...children) {
        for (let i = 0; i < children.length; i++) {
            const win = children[i];
            if (win == null) { continue; }

            // Style.
            win.min_height("100%");
            // win.scroll_snap_align("start");

            // Set alignment.
            win.on_render((e) => {
                if (win.scrollHeight > this.clientHeight) {
                    e.align_vertical("default");
                } else {
                    e.center_vertical();
                }
            })
            win.on_resize((e) => {
                if (win.scrollHeight > this.clientHeight) {
                    e.align_vertical("default");
                } else {
                    e.center_vertical();
                }
            })

            // Append.
            win.style.height = "100%";
            win.style.minHeight = "100%";
            win.style.maxHeight = "100%";
            win.style.overflowY = "scroll";
            win.style["scroll-snap-align"] = "start";
            super.append(win);
            // const section = document.createElement("section");
            // section.style.height = "100%";
            // section.style.minHeight = "100%";
            // section.style.maxHeight = "100%";
            // section.style.overflowY = "scroll";
            // section.style["scroll-snap-align"] = "start";
            // section.appendChild(win);
            // super.append(section);
        }

        // Response.
        return this
    }

    // Scroll into child.
    scroll_into_child(index, behaviour = "smooth") {
        this.child(index).scrollIntoView({behavior: behaviour});
        return this;
    }
}

// Window Scroller.
/*
@constructor_wrapper
@register_element
class WindowScrollerElement extends CreateVElementClass({
    type: "WindowScroller",
    tag: "div",
    default_style: {
        "margin": "0px",
        "padding": "0px",
        "display": "flex", // to support vertical spacers.
        "overflow": "visible",
        "align-content": "flex-start", // align items at start, do not stretch / space when inside HStack.
        "flex-direction": "column",
    },
}) {
    constructor({
        duration = 500,     // duration of the animation.
        _topbar = null,     // can be passed to assign a shadow to an item when the content is scrolling and a shadow should present.
    } = {}) {


        // Super.
        super();

        // Attributes.
        this.duration = duration;
        this.index = 0;
        this.windows = [];
        this.last_scroll_top = 0;
        this.window_scroll_height = 50; // the minimum scroll required to go to the next window.

        // Styling.
        this.min_width("100%");
        this.stretch(true);
        this.position("relative");
        this.overflow("hidden scroll");
        this.class("hide_scrollbar");

        // The event that will be called when the window scrolls.
        this.on_animation_scroll = () => {};

        // @todo update scroll position on resize.
        const _this_ = this;
        this.child_scrolling = false;
        this._child_on_scroll = function (e) {

            // console.log("Child:", _this_.child_scrolling)
            _this_.child_scrolling = true;
            setTimeout(() => {_this_.child_scrolling = false}, 250)

            // Set top bar shadow.
            if (_topbar != null) {
                if (this.scrollTop > 0 && _topbar.has_shadow !== true) {
                    _topbar.has_shadow = true;
                    _topbar.shadow("0px 0px 10px #000000")
                } else if (this.scrollTop === 0 && _topbar.has_shadow === true) {
                    _topbar.has_shadow = false;
                    _topbar.shadow("none")
                }
            }

            // Relay scroll when the child can no longer scroll.
            if (this.scrollTop === 0) {
                _this_.scrollTop = (_this_.index - 1) * _this_.window_scroll_height;
            } else if (this.scrollTop + this.clientHeight >= this.scrollHeight) {
                _this_.scrollTop = (_this_.index + 1) * _this_.window_scroll_height;
            }
        }

        // On wheel event.
        const _on_scroll_callback = (e) => {

            // Prevent default on already animating.
            // console.log("Parent:", _this_.child_scrolling)
            if (this.animating === true || _this_.child_scrolling) {
                e.preventDefault();
                return ;
            }

            // Vars.
            const win = this.windows[this.index];
            const scroll_top = this.scrollTop;
            const height = this.clientHeight;
            const scroll_up = this.scrollTop > this.last_scroll_top;
            this.last_scroll_top = scroll_top;

            // Set top bar shadow.
            if (_topbar != null) {
                if (win.scrollTop > 0 && _topbar.has_shadow !== true) {
                    _topbar.has_shadow = true;
                    _topbar.shadow("0px 0px 10px #000000")
                } else if (win.scrollTop === 0 && _topbar.has_shadow === true) {
                    setTimeout(() => {
                        _topbar.has_shadow = false;
                        _topbar.shadow("none")
                    }, this.duration) // must be the at least the duration of window transition.
                }
            }

            // Prevent default on max scroll height.
            if (scroll_top > this.windows.length * this.window_scroll_height) {
                this.scrollTop = this.windows.length * this.window_scroll_height;
                e.stopPropagation();
                e.preventDefault();
                return null;
            }

            // Next or previous.
            // Skip when the child is not fully scroller.
            if (
                (win.scrollTop + win.clientHeight >= win.scrollHeight) ||
                (win.scrollTop === 0)
            ) {
            
                // Check views.
                const scroll_index = parseInt(scroll_top / this.window_scroll_height);
                const stop_animating = () => {
                    setTimeout(() => {
                        this.animating = false;
                        this.scrollTop = this.index * this.window_scroll_height;
                    }, 250)
                }
                if (scroll_index > this.index) {
                    this.animating = true;
                    e.preventDefault();
                    this.next(scroll_index, false)
                        .then(stop_animating)
                        .catch(stop_animating)
                    this.scrollTop = this.index * this.window_scroll_height;
                } else if (scroll_index < this.index) {
                    this.animating = true;
                    e.preventDefault();
                    this.prev(scroll_index, false)
                        .then(stop_animating)
                        .catch(stop_animating)
                    this.scrollTop = this.index * this.window_scroll_height;
                }

            }

        }

        // Add event listener.
        this.addEventListener("scroll", _on_scroll_callback, { passive: false });

        // Add the on hash change listener for any direct children id's.
        window.addEventListener("hashchange", (e) => {
            const hash = window.location.hash.substr(1);
            if (hash !== null && hash !== "") {
                this.windows.iterate((win) => {
                    if (hash === win.id()) {
                        console.log("Select", win.id())
                        if (win.index > this.index) {
                            this.next(win.index, true);
                        } else {
                            this.prev(win.index, true);
                        }
                        return false;
                    }
                })
                // window.location.hash = ""; // reset the hash so that when the user clicks the hash button again it is rerendered.
            }
        })
    }
    

    // Add a window.
    append(win) {

        // Update window.
        win.transition(`opacity ${this.duration*2}ms, transform ${this.duration}ms ease`)
        win.fixed_frame("100%", "100%");
        win.position(0, 0, 0, 0);
        win.position("sticky");
        win.overflow("scroll");
        win.overscroll_behavior("bounce"); // must be bounce so the on scroll event is also called when the user scrolls up and the page is already scrolled all the way up.
        // win.align("default"); // must start with leading for checks will be centered later
        win.align_vertical("default"); // must start with leading for checks will be centered later
        win.addEventListener("scroll", this._child_on_scroll);
        win.outline("none"); // otherwise an outline border may appear while scrolling windows.
        win.border("none"); // otherwise an outline border may appear while scrolling windows.
        win.center();

        // Add scroll forwarder.

        // Initial window.
        if (this.windows.length > 0) {
            win.transform("translateY(100%)")
            win.opacity(0)
        }

        // Other windows.
        else {
            win.transform("translateY(0)")
            win.opacity(1)
        }

        // Set alignment.
        win.on_render((e) => {
            // Setting horizontal align causes issues with slide in animations.
            // setTimeout(() => {
            // const width = this.clientWidth;
            // const width = e.clientWidth;
            // if (e.scrollWidth > width) {
            //     console.log(e.scrollWidth, width, "default", win.child(0).text().substr(0, 10))
            //     e.align("default");
            // } else {
            //     console.log(e.scrollWidth, width, "center", win.child(0).text().substr(0, 10))
            //     e.center();
            // }
            if (win.scrollHeight > this.clientHeight) {
                e.align_vertical("default");
            } else {
                e.center_vertical();
            }
        })
        win.on_resize((e) => {
            if (win.scrollHeight > this.clientHeight) {
                e.align_vertical("default");
            } else {
                e.center_vertical();
            }
        })

        // Append.
        win.index = this.windows.length;
        this.windows.push(win);
        super.append(win);

        // Check if the href hash is set on this windows id.
        const hash = window.location.hash.substr(1);
        if (hash !== null && hash !== "" && hash === win.id()) {
            this.on_render(() => {
                this.next(win.index, true);
            })
        }


        // response.
        return this;
    }

    // Next window.
    async next(index, update_scroll_top = true) {
        return new Promise(async (resolve) => {
            if (index < this.windows.length) {

                // Update scroll top.
                if (update_scroll_top) {
                    this.scrollTop = this.window_scroll_height * index;
                }
                
                // Slide out.
                const current = this.windows[this.index];
                current.style.opacity = 0;
                current.style.transform = 'translateY(-100%)';
                
                // Update index.
                this.index = index;
                    
                // Slide in.
                const next = this.windows[this.index];
                if (next.is_scrollable()) {
                    next.leading_vertical()
                } else {
                    next.center_vertical()
                }
                next.scrollTop = 0;
                next.style.opacity = 1;
                next.style.transform = 'translateY(0)';
                next.scrollTop = 0; // required since sometimes it does not start at the start or end, which requires the user to scroll up and down before it can scroll to the next window.
                
                // Call on appear on children.
                if (Array.isArray(next._on_appear_callbacks)) {
                    let promises = [];
                    for (let i = 0; i < next._on_appear_callbacks.length; i++) {
                        const res = next._on_appear_callbacks[i].exec()
                        if (res instanceof Promise) {
                            promises.push(res);
                        }
                    }
                    await Promise.all(promises);
                }

                // Resolve.
                setTimeout(resolve, this.duration);
            }
            else {
                resolve();
            }
        });
    }

    // Previous window.
    async prev(index, update_scroll_top = true) {
        return new Promise(async (resolve) => {
            const old_index = this.index;
            if (index >= 0) {

                // Update scroll top.
                if (update_scroll_top) {
                    this.scrollTop = this.window_scroll_height * index;
                }
                
                // Slide out.
                const current = this.windows[this.index];
                current.style.opacity = 0;
                current.style.transform = 'translateY(100%)';
                
                // Update index.
                this.index = index;
                
                // Slide in.
                const next = this.windows[this.index];
                if (next.is_scrollable()) {
                    next.leading_vertical()
                } else {
                    next.center_vertical()
                }
                next.scrollTop = next.scrollHeight;
                next.style.opacity = 1;
                next.style.transform = 'translateY(0)';
                next.scrollTop = next.scrollHeight; // required since sometimes it does not start at the start or end, which requires the user to scroll up and down before it can scroll to the next window.
                
                // Call on appear on children.
                if (Array.isArray(next._on_appear_callbacks)) {
                    let promises = [];
                    for (let i = 0; i < next._on_appear_callbacks.length; i++) {
                        const res = next._on_appear_callbacks[i].exec()
                        if (res instanceof Promise) {
                            promises.push(res);
                        }
                    }
                    await Promise.all(promises);
                }

                // Resolve.
                setTimeout(resolve, this.duration);
            }
            else {
                resolve();
            }
        });
    }

}
*/