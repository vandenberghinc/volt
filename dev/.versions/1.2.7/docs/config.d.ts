export let name: string;
export let version: string;
export namespace icon {
    let dark: string;
    let light: string;
    let height: number;
}
export namespace meta {
    let author: string;
    let title: string;
    let description: string;
    let image: string;
}
export namespace dark_theme {
    let tint_fg: string;
    let anchor_fg: string;
    let token_type: string;
    let method_get: string;
    let note_bg: string;
}
export namespace light_theme {
    let tint_fg_1: string;
    export { tint_fg_1 as tint_fg };
    let anchor_fg_1: string;
    export { anchor_fg_1 as anchor_fg };
    let token_type_1: string;
    export { token_type_1 as token_type };
    let method_get_1: string;
    export { method_get_1 as method_get };
    let note_bg_1: string;
    export { note_bg_1 as note_bg };
}
export let default_theme: string;
export namespace chapter_order {
    let Backend: string[];
}
export namespace title_order {
    let NO_CHAPTER: string[];
}
export let include: string[];
export let exclude: string[];
export let documents: string[];
export let output: string;
