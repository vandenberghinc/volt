/** Separate file for register_element() method to prevent recursive imports from base.ts and module.ts */

export const registered_names = new Set<string>();
export function register_element(constructor: any): void {
    // @warning dont use any caching on the constructor, it will break the element registration since the constructor can be used as base class.
    const any_ctor = constructor as any;
    if (!any_ctor.element_name) {
        console.error("Error constructor:", constructor);
        throw new Error("Static element attribute 'element_name' should always be defined, create static attribute \"element_name: string\" and assign the name of the class to this attribute.");
    }
    const base_name = any_ctor.element_name as string;
    let new_tag = "";
    let count = 0;
    do {
        new_tag = `v-${base_name.toLowerCase()}${count ? `-${count}` : ""}`;
        count++;
    } while (registered_names.has(new_tag));
    registered_names.add(new_tag);

    const extend_options = any_ctor.element_tag
        ? { extends: any_ctor.element_tag }
        : undefined;
    customElements.define(new_tag, any_ctor, extend_options);
}