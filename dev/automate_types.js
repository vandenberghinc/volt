const name_overrides = {
    blockquote: "VBlockQuoteElement",
    th: "VTHElement",
    td: "VTDElement",
    thead: "VTHeadElement",
    tbody: "VTBodyElement",
    tfoot: "VTFootElement",
}
const native_elements =  {
    _base: "HTMLElement", // keep as base for HTMLElement not <base>
	a: "HTMLAnchorElement",
    area: "HTMLAreaElement",
    audio: "HTMLAudioElement",
    blockquote: "HTMLQuoteElement",
    body: "HTMLBodyElement",
    br: "HTMLBRElement",
    button: "HTMLButtonElement",
    canvas: "HTMLCanvasElement",
    caption: "HTMLTableCaptionElement",
    col: "HTMLTableColElement",
    data: "HTMLDataElement",
    datalist: "HTMLDataListElement",
    dl: "HTMLDListElement",
    dir: "HTMLDirectoryElement",
    div: "HTMLDivElement",
    // html: "HTMLHtmlElement",
    embed: "HTMLEmbedElement",
    fieldset: "HTMLFieldSetElement",
    form: "HTMLFormElement",
    h1: "HTMLHeadingElement",
    // h2: "HTMLHeadingElement",
    // h3: "HTMLHeadingElement",
    // h4: "HTMLHeadingElement",
    // h5: "HTMLHeadingElement",
    // h6: "HTMLHeadingElement",
    head: "HTMLHeadElement",
    hr: "HTMLHRElement",
    img: "HTMLImageElement",
    input: "HTMLInputElement",
    ins: "HTMLModElement",
    label: "HTMLLabelElement",
    legend: "HTMLLegendElement",
    li: "HTMLLIElement",
    link: "HTMLLinkElement",
    map: "HTMLMapElement",
    meta: "HTMLMetaElement",
    meter: "HTMLMeterElement",
    object: "HTMLObjectElement",
    ol: "HTMLOListElement",
    optgroup: "HTMLOptGroupElement",
    option: "HTMLOptionElement",
    output: "HTMLOutputElement",
    p: "HTMLParagraphElement",
    param: "HTMLParamElement",
    picture: "HTMLPictureElement",
    pre: "HTMLPreElement",
    progress: "HTMLProgressElement",
    // q: "HTMLQuoteElement",
    script: "HTMLScriptElement",
    select: "HTMLSelectElement",
    slot: "HTMLSlotElement",
    source: "HTMLSourceElement",
    span: "HTMLSpanElement",
    table: "HTMLTableElement",
    thead: "HTMLTableSectionElement",
    tbody: "HTMLTableSectionElement",
    tfoot: "HTMLTableSectionElement",
    th: "HTMLTableCellElement",
    td: "HTMLTableCellElement",
    template: "HTMLTemplateElement",
    textarea: "HTMLTextAreaElement",
    time: "HTMLTimeElement",
    title: "HTMLTitleElement",
    tr: "HTMLTableRowElement",
    track: "HTMLTrackElement",
    ul: "HTMLUListElement",
    iframe: "HTMLIFrameElement",
    code: "HTMLElement",
    section: "HTMLElement",
    // default: "HTMLElement",
}

let added = [];
let data = "", map = "\n\n// The VElement map per html tag.\nexport const VElementTagMap = {\n";
Object.keys(native_elements).forEach(tag => {
    let output_tag = tag;
    if (tag === "_base") {
        output_tag = "div";
    }

    let new_name, short_name, extend_target = native_elements[tag];
    if (name_overrides[tag] != null) {
        new_name = name_overrides[tag];
        short_name = name_overrides[tag].slice(0, -7);
    }
    else if (tag !== "_base" && native_elements[tag] === "HTMLElement") {
        new_name = "V" + tag[0].toUpperCase() + tag.slice(1) + "Element";
        short_name = "V" + tag[0].toUpperCase() + tag.slice(1);
    } else if (tag === "_base") {
        new_name = "VHTMLElement";
        short_name = "VHTML";
    } else {
        new_name = "V" + native_elements[tag].slice(4);
        short_name = "V" + native_elements[tag].slice(4, -7);
    }
    
    data += `
// Base class ${new_name} derived from ${native_elements[tag]}.
// @ts-ignore
export class ${new_name} extends (${native_elements[tag]} as unknown as _SafeVBaseElement) {
    static element_tag = "${output_tag}";
    constructor(args: DerivedConstructorOptions = {}) {
        super();
        args.derived ??= ${new_name};
        this._init_velement(args as VBaseElementOptions);
    }
}
// @ts-ignore
export interface ${new_name} extends ${native_elements[tag]}, VBaseElement, VElementExtensions {};
postprocess(${new_name}${tag === "_base" ? ', null' : ''});
export const ${short_name} = wrapper(${new_name});
export const Null${short_name} = create_null(${new_name});
declare module '../ui/any_element.d.ts' { interface AnyElementMap { ${new_name}: ${new_name} }}
`

    map += `\t${tag}: ${new_name},\n`
})
map += "} as const;\n";
data += map

console.log(data);