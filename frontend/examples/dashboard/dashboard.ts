// @ts-nocheck

// Imports.
// import * as volt from "@vandenberghinc/volt/frontend"
import { ResponseStatus, Theme, UI } from "../defaults.js";

// Global variables.
const endpoint = volt.Utils.endpoint();

// ---------------------------------------------------------
// Utils.

// A side by side form container.
const SideByFormContainer = (...children) => {
    return volt.HStack(
        ...children
    )
    .align_height()
    .width("100%")
    .overflow("hidden")
    .media(
        "width >= 900px",
        e => e.side_by_side({ columns: 2, vspacing: 0, hspacing: 65 }).margin_bottom(65),
        e => e.side_by_side({ columns: 1, vspacing: 50, hspacing: 0 }).margin_bottom(50)
    )
}

// Dashboard form.
function FormWidget(
    {
        title = undefined,
        text = undefined,
        button = "Button",
        center_button = false,
        small_button = true,
        right_top_button = false,
        inputs = [],
        on_submit = (data, form) => { },
        spacer = false,
    }: {
        title?: string,
        text?: string,
        button?: string | boolean,
        center_button?: boolean,
        small_button?: boolean,
        right_top_button?: boolean,
        inputs?: any[],
        on_submit?: (data: any, form: volt.FormElement) => any,
        spacer?: boolean,
    }
) {
    return volt.Form(

        right_top_button
            ? [
                volt.HStack(
                    UI.Title(title)
                        .stretch(true)
                        .margin(0)
                        .wrap(true),
                    UI.Button(button)
                        .padding(5, 15)
                        .margin_top(0)
                        .font_size(15)
                )
                    .center_vertical()
                    .margin(0, 0, 12.5, 0)
                    .wrap(false)
            ]
            : title == null ? null : (
                UI.Title(title)
                    .width("fit-content")
                    .margin(0, 0, 7.5, 0)
            ),


        // @ts-ignore-error
        text == null ? null : (
            UI.Text(text)
                .margin_bottom(inputs.length > 0 ? 20 : 0)
        ),

        volt.ForEach(inputs, (item) => UI.Input(item)),

        spacer ? volt.Spacer() : null,

        // Save.
        right_top_button ? null : (
            volt.VStack(
                button === false ? null : (
                    UI.Button(button)
                        .padding(small_button ? 7.5 : 10, small_button ? 25 : 40)
                        .margin_top(inputs.length > 0 ? 15 : 25)
                )
            )
                .width("100%")
                .align(center_button ? (inputs.length > 0 ? "center" : "start") : "start")
        ),
    )
        .width("100%")
        .on_submit((e, data) => on_submit(data, e))
        .on_submit_error((_, error) => {
            ResponseStatus.error(error)
        })
}

// ---------------------------------------------------------
// Pages.

function AccountPage(): PageOptions {
    return {
        type: "item",
        title: "Account Settings",
        endpoint: "/dashboard/account",
        icon: "/static/icons/username.webp",
        content() {
            return volt.Frame(
                SideByFormContainer(
                    
                    // General info.
                    FormWidget({
                        title: "Profile",
                        text: "Setup your account and edit your profile details.",
                        button: "Update",
                        inputs: [
                            { label: "First name", placeholder: "John", id: "first_name", required: true, image: "/static/icons/username.red.webp", },
                            { label: "Last name", placeholder: "Doe", id: "last_name", required: true, image: "/static/icons/username.red.webp", },
                            { label: "Username", placeholder: "myusername", id: "username", required: true, image: "/static/icons/username.red.webp", },
                            { label: "Email", placeholder: "my@email.com", id: "email", required: true, image: "/static/icons/mail.webp", },
                        ],
                        right_top_button: true,
                        on_submit: async (data) => {
                            const response = await volt.User.set(data)
                            ResponseStatus.message(response.message);
                        }
                    }),
                    // ThemeV2.Divider().margin(40, 0),

                    // Password.
                    FormWidget({
                        title: "Password",
                        text: "Change your account's password.",
                        button: "Update",
                        inputs: [
                            { label: "Current password", placeholder: "Current password", id: "current_password", required: true, image: "/static/icons/password.webp", type: "password" },
                            { label: "New Password", placeholder: "Password", id: "password", required: true, image: "/static/icons/password.webp", type: "password" },
                            { label: "Verify new password", placeholder: "Verify password", id: "verify_password", required: true, image: "/static/icons/password.webp", type: "password" },
                        ],
                        right_top_button: true,
                        on_submit: async (data, form) => {
                            const response =
                                volt.User.change_password(data)
                                    .then((response) => {
                                        ResponseStatus.message(response.message);
                                    })
                                    .catch(({ error, status, invalid_fields }) => {
                                        if (invalid_fields) {
                                            if (invalid_fields.current_password) {
                                                form.fields.current_password.missing(true, invalid_fields.current_password);
                                            }
                                            if (invalid_fields.password) {
                                                form.fields.password.missing(true, invalid_fields.password);
                                            }
                                            if (invalid_fields.verify_password) {
                                                form.fields.verify_password.missing(true, invalid_fields.verify_password);
                                            }
                                        }
                                        ResponseStatus.error(error);
                                    })
                        },
                    }),
                ),
                SideByFormContainer(
                    volt.VStack(
                        // No api key exists.
                        FormWidget({
                            title: "API key",
                            text: "Currently you do not have an API key. Generate an API key to get API access.\nWhen generated the API key is only shown once. Make sure to store it correctly, since you have to regenerate the API key if you lose it.",
                            button: "Generate",
                            right_top_button: true,
                            async on_submit() {
                                const response = await volt.User.generate_api_key()
                                if (response.error) {
                                    ResponseStatus.message(response.error);
                                } else if (response.api_key) {
                                    volt.Elements.get("api_key").value(response.api_key);
                                    volt.Elements.get("api_key_not_generated").hide();
                                    volt.Elements.get("api_key_generated").show();
                                    ResponseStatus.message(response.message);
                                }
                            }
                        })
                        .id("api_key_not_generated"),

                        // API key exists.
                        FormWidget({
                            title: "API key",
                            text: "Your personal API key. An API key is only shown once.\nYou should revoke your old API key and generate an one when you have lost your API key.",
                            button: "Revoke",
                            inputs: [
                                {
                                    label: "API key",
                                    placeholder: "**************************************************************",
                                    id: "api_key",
                                    readonly: true,
                                    type: volt.Input,
                                    image: "/static/icons/password.webp",
                                }
                            ],
                            right_top_button: true,
                            async on_submit(data) {
                                const response = await volt.User.revoke_api_key()
                                volt.Elements.get("api_key").value("");
                                volt.Elements.get("api_key_not_generated").show();
                                volt.Elements.get("api_key_generated").hide();
                                ResponseStatus.message(response.message);
                            }
                        })
                        .id("api_key_generated")
                        .hide(),
                    ),


                    // Support PIN.
                    FormWidget({
                        title: "Support PIN",
                        text: "Your account's support pin to verify any support tickets.",
                        button: false,
                        inputs: [
                            { label: "Support PIN", placeholder: "Support PIN", id: "support_pin", required: false, readonly: true, image: "/static/icons/key.webp" },
                        ],
                    }),
                )
            )
        }
    }
}

// ---------------------------------------------------------
// Build content tree mapped under Navigations module.

interface PageOptions {
    type: "chapter" | "item",
    title: string,
    endpoint?: string, // only chapter type may omit this.
    icon: string,
    content?: () => void,
}

const Navigation: {
    selected_name: string,
    selected_index: number,
    items: {
        text: string,
        active: boolean,
        navigation_node?: { select(): void; },
        content: PageOptions[],
        on_select?: () => void,
    }[],
    select(index_or_name: string | number): void;
} = {
    selected_name: undefined as any,
    selected_index: undefined as any,
    items: [
        {
            text: "Account",
            active: endpoint === "/dashboard" || endpoint.includes("/dashboard/account/"),
            content: [
                {
                    type: "chapter",
                    title: "Account",
                    icon: "/static/icons/username.webp",
                    content: () => { }
                },
                AccountPage(),
                {
                    type: "item",
                    title: "API",
                    endpoint: "/dashboard/api",
                    icon: "/static/icons/key.webp",
                    content: () => { }
                },

                {
                    type: "chapter",
                    title: "Billing",
                    icon: "/static/icons/pricing.webp",
                    content: () => { }
                },
                {
                    type: "item",
                    title: "Subscriptions",
                    endpoint: "/dashboard/billing",
                    icon: "/static/icons/pricing.webp",
                    content: () => { }
                },
                {
                    type: "item",
                    title: "Usage",
                    endpoint: "/dashboard/usage",
                    icon: "/static/icons/bar-chart.webp",
                    content: () => { }
                },

                {
                    type: "chapter",
                    title: "Customer Service",
                    icon: "/static/icons/username.webp",
                    content: () => { }
                },
                {
                    type: "item",
                    title: "Contact",
                    endpoint: "/dashboard/billing",
                    icon: "/static/icons/help.webp",
                    content: () => { }
                },
                {
                    type: "item",
                    title: "Feedback",
                    endpoint: "/dashboard/usage",
                    icon: "/static/icons/feedback.webp",
                    content: () => { }
                },
                
            ],
        },
        {
            text: "Projects",
            active: endpoint.includes("/dashboard/project/") || endpoint.includes("/dashboard/projects/"),
            content: [
                {
                    type: "chapter",
                    title: "Settings",
                    icon: "/static/icons/settings.webp",
                    content: () => { }
                },
                {
                    type: "item",
                    title: "Roles & Permissions",
                    endpoint: "/dashboard/project/permissions",
                    icon: "/static/icons/key.webp",
                    content: () => { }
                },
                {
                    type: "item",
                    title: "Git Integration",
                    endpoint: "/dashboard/project/git",
                    icon: "/static/icons/github.webp",
                    content: () => { }
                },
                // ------------------------------------------
                {
                    type: "chapter",
                    title: "AI",
                    icon: "/static/icons/sparkle.webp",
                    content: () => { }
                },
                {
                    type: "item",
                    title: "MDX Pages",
                    endpoint: "/dashboard/project/mdx",
                    icon: "/static/icons/code.webp",
                    content: () => { }
                },
                {
                    type: "item",
                    title: "Generated Pages",
                    endpoint: "/dashboard/project/generate",
                    icon: "/static/icons/docs.webp",
                    content: () => { }
                },
                // ------------------------------------------
                {
                    type: "chapter",
                    title: "Insight",
                    icon: "/static/icons/search.webp",
                    content: () => { }
                },
                {
                    type: "item",
                    title: "Analytics",
                    endpoint: "/dashboard/project/analytics",
                    icon: "/static/icons/bar-chart.webp",
                    content: () => { }
                },
                {
                    type: "item",
                    title: "User Feedback",
                    endpoint: "/dashboard/project/feedback",
                    icon: "/static/icons/feedback.webp",
                    content: () => { }
                },
            ],
            on_select() {
                const node = volt.HStack(
                    UI.SelectionPicker({
                        value: "Select Project",
                        title: "Select Project",
                        items: [],
                    })
                        .border_radius(12.5)
                        .width("initial")
                        .letter_spacing(UI.letter_spacing_1)
                        .flex(1),
                    volt.ImageMask("/static/icons/plus.webp")
                        .frame(25, 25)
                        .padding(6.5)
                        .margin_left(15)
                        .flex_shrink(0)
                        .color(Theme.fg_2)
                        .border(1, Theme.div_bg)
                        .border_radius("50%")
                        .flex_shrink(0) // wrap items in hstack instead of shrinking.
                        .transition("background 300ms ease-in-out")
                        .transition_mask("background 300ms ease-in-out")
                        .on_mouse_over_out(
                            e => e.color(Theme.fg).background(Theme.auto_darken_lighten("bg", 0.05)),
                            e => e.color(Theme.fg_2).background("transparent"),
                        )
                )
                .center_vertical()
                .width("100%").overflow("hidden").wrap(false)
                .padding(7.5, 20, 20, 20)
                SideBar.content.insertBefore(node, SideBar.content.child(0))
            },
        },
    ],
    select(index: string | number) {
        if (typeof index === "string") {
            const name = index;
            for (let i = 0; i < this.items.length; i++) {
                if (this.items[i].text === name) {
                    index = i;
                    break;
                }
            }
            if (typeof index === "string") {
                throw new Error(`Navigation "${name}" does not exist.`)
            }
        }

        // Set attrs.
        if (index >= this.items.length) {
            throw new Error(`Invalid index ${index} max index is ${this.items.length - 1}`);
        }
        const item = this.items[index];
        this.selected_name = item.text;
        this.selected_index = index as number;

        // Select active node from nav bar.
        this.items[index]?.navigation_node?.select();

        // Render sidebar content of active nav.
        SideBar.render();

        // Call on select.
        if (typeof item.on_select === "function") {
            item.on_select();
        }
    },
}
if (endpoint === "/dashboard") {
    Navigation.selected_name = Navigation.items[0].text;
    Navigation.selected_index = 0;
} else {
    for (let i = 0; i < Navigation.items.length; i++) {
        if (Navigation.items[i].content.find(item => endpoint === item.endpoint)){
            Navigation.selected_name = Navigation.items[i].text;
            Navigation.selected_index = i;
            break;
        }
    }
}
if (!Navigation.selected_name) {
    throw new Error("No navigation is selected with the current url.");
}

// ---------------------------------------------------------
// Core elements.

// TopBar.
const TopBar = (() => {
    return volt.HStack(
        UI.ProjectIcon(20),
        volt.Spacer(),
        volt.ImageMask("/static/icons/username.webp")
            .color(Theme.fg)
            .frame(20,20)
            .margin_right(15),
        volt.Frame(
            UI.Text(volt.User.first_name())
                .color(Theme.fg)
                .font_size(13)
                .margin(0, 0, 0, 0),
            UI.Text(volt.User.email())
                .color(Theme.fg_1)
                .font_size(11)
                .margin(0),
        )
        .width("fit-content")
        .on_click(() => Navigation.select("Account"))
    )
        .center_vertical()
        .border_bottom(1, Theme.div_bg)
        .padding(12.5, 20)
})()

// Navigation bar (a second top bar below the first top bar).
const NavigationBar = (() => {
    let selected_node;
    return volt.HStack(

        Navigation.items.map((item, index) => {
            let text, divider;
            const node = volt.VStack(
                text = UI.Text(item.text)
                    .font_size(14)
                    .line_height("2.2em")
                    .font_weight(500)
                    .margin(0, 7.5) // to make divider larger then text.
                    .letter_spacing(UI.letter_spacing_2)
                    .transition("color 300ms ease-in-out, font-weight 500ms ease-in-out"),
                divider = volt.Frame()
                    .position(null, 0, 0, 0)
                    .height(1.75)
                    .border_radius(0.5)
                    .transition("background 300ms ease-in-out")
                    .background("transparent"),
            )
                .width("fit-content")
                .position("relative")
                .margin_right(10)
                .extend({
                    hover(forced = false) {
                        if (!forced && selected_node === node) return;
                        text.color(Theme.fg);
                    },
                    unhover(forced = false) {
                        if (!forced && selected_node === node) return;
                        text.color(Theme.fg_2);
                    },
                    select() {
                        if (selected_node === node) return;
                        else if (selected_node) selected_node.unselect();
                        selected_node = node;
                        this.hover(true);
                        text.font_weight(600);
                        divider.background(Theme.fg);
                    },
                    unselect() {
                        if (selected_node !== node) return;
                        selected_node = undefined;
                        this.unhover(true);
                        text.font_weight(500);
                        divider.background("transparent");
                    },
                })
                .on_mouse_over_out(e => e.hover(), e => e.unhover())
                .on_click(() => index != null && Navigation.select(index))
            if (Navigation.selected_index === index) {
                node.select();
            }
            item.navigation_node = node;
            return node;
        }),

        volt.Spacer(),
    )
        .center_vertical()
        .border_bottom(1, Theme.div_bg)
        .padding(15, 20)
})();

// SideBar.
const SideBar = (() => {
    let selected_node: any;
    return volt.Scroller()
        .flex("1 1 0") // for height
        .fixed_width(350)
        .border_right(1, Theme.div_bg)
        .content
            .padding(15, 0)
            .parent<volt.ScrollerElement>()
        .extend({
            render() {
                selected_node = undefined; // reset is required.
                const items = Navigation.items[Navigation.selected_index].content;
                console.log("Rendering sidebar...");
                console.log("Items:", items);
                this.remove_children()
                this.append(
                    items.map((item, index) => {
                        let image, text, divider;
                        const node = volt.HStack(
                            divider = item.type === "chapter" ? undefined : UI.Divider()
                                .frame(1, "100%")
                                .transition("background 300ms ease-in-out")
                                .margin(0, 23, 0, 7.5),
                            volt.HStack(
                                image = volt.ImageMask(item.icon)
                                    .frame(15, 15)
                                    .transition_mask("background 300ms ease-in-out")
                                    .color(item.type === "chapter" ? Theme.fg : Theme.fg_1)
                                    .margin_right(15)
                                    .margin_bottom(4),
                                text = volt.Text(item.title)
                                    .font_size(14)
                                    .line_height("1.6em")
                                    .font_weight(item.type === "chapter" ? 500 : 300)
                                    .transition("color 300ms ease-in-out, font-weight 300ms ease-in-out")
                                    .color(item.type === "chapter" ? Theme.fg : Theme.fg_1)
                                    .letter_spacing(UI.letter_spacing_1)
                                    .margin(0),
                            )
                            .wrap(false)
                            .center_vertical()
                            .padding(10, 0)
                        )
                            .padding(0, 20)
                            .center_vertical()
                            .transition("background 300ms ease-in-out")
                            .on_click(() => {
                                if (item.content) item.content();
                            })
                            .extend({
                                hover(forced = false) {
                                    if (item.type === "chapter") { return; }
                                    else if (!forced && selected_node === node) return;
                                    image.color(Theme.fg);
                                    // text.font_weight(400)
                                    text.color(Theme.fg);
                                    this.background(Theme.auto_darken_lighten("bg", 0.025))
                                    if (divider) divider.background(Theme.auto_darken_lighten("bg", 0.5))
                                },
                                unhover(forced = false) {
                                    if (item.type === "chapter") { return; }
                                    else if (!forced && selected_node === node) return;
                                    image.color(Theme.fg_2);
                                    // text.font_weight(300)
                                    text.color(Theme.fg_2);
                                    this.background("transparent")
                                    if (divider) divider.background(Theme.div_bg)
                                },
                                select() {
                                    if (item.type === "chapter") { return; }
                                    else if (selected_node === node) return;
                                    else if (selected_node) selected_node.unselect();
                                    selected_node = node;
                                    this.hover(true);
                                    text.font_weight(400)
                                    if (divider) divider.background(Theme.fg_1)
                                },
                                unselect() {
                                    if (item.type === "chapter") { return; }
                                    else if (selected_node !== node) return;
                                    selected_node = undefined;
                                    this.unhover(true);
                                    text.font_weight(300)
                                    if (divider) divider.background(Theme.div_bg)
                                },
                            })
                            .on_mouse_over_out(e => e.hover(), e => e.unhover())
                        if (item.type === "chapter") {
                            node.color("#ffffff")
                            if (index > 0) {
                                node.margin_top(15)
                            }
                        } else {
                            if (endpoint === item.endpoint || (selected_node === undefined && endpoint === "/dashboard")) {
                                node.select();
                            } else {
                                node.unselect();
                            }
                        }
                        return node;
                    })
                );
                return this;
            },
        })
        .render()
})();

// Actions.
const Actions = (() => {
    return volt.VStack(
        [
            { text: "Documentation", icon: "/static/icons/book-0.webp", href: "/docs" }
        ].map((item) => {
            return volt.AnchorHStack<{ text: volt.TextElement, img: volt.ImageMaskElement, arrow: volt.ImageMaskElement }>(
                volt.ImageMask(item.icon)
                    .assign_to_parent_as("img")
                    .frame(15, 15)
                    .transition_mask("background 300ms ease-in-out")
                    .color(Theme.fg_1)
                    .margin_right(15)
                    .margin_bottom(2),
                UI.Text(item.text)
                    .assign_to_parent_as("text")
                    .font_size(14)
                    .line_height("2.2em")
                    .font_weight(500)
                    .margin(0)
                    .letter_spacing(UI.letter_spacing_2)
                    .transition("color 300ms ease-in-out, font-weight 500ms ease-in-out"),
                volt.Spacer(),
                UI.FoldArrow()
                    .rotate(0)
                    .assign_to_parent_as("arrow")
                    .color(Theme.fg_1)
                    .margin_left(15),
            )
                .position("relative")
                .center_vertical()
                .wrap(false)
                .margin_right(10)
                .href(item.href)
                .on_mouse_over_out(
                    e => {
                        e.text.color(Theme.fg);
                        e.img.color(Theme.fg);
                        e.arrow.color(Theme.fg);
                    },
                    e => {
                        e.text.color(Theme.fg_1);
                        e.img.color(Theme.fg_1);
                        e.arrow.color(Theme.fg_1);
                    },
                )
        })
        
    )
    .flex(0)
    .padding(10, 20)
    .border_top(1, Theme.div_bg)
    .border_right(1, Theme.div_bg)
})()

// Content.
const Content = (() => {
    return volt.Scroller(

    )
    .height("100%")
    .flex(1)
    .background(Theme.auto_darken_lighten("bg", 0.01))
    .content
        .padding(20)
        .parent<volt.ScrollerElement>()
})

// ---------------------------------------------------------
// On load.

volt.Utils.on_load(() => {
    return UI.View(

        // Topbar.
        TopBar,

        // Navigation bar.
        NavigationBar,

        // Main content.
        volt.HStack(
            volt.VStack(
                SideBar,
                Actions,
            )
            .frame("fit-content", "100%"),
            Content,
        )
        .flex("1 1 0")
    );
});