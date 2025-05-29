// ------------------------------------------------------------------------------------------------
// The base VElement.
export class VBaseElement {
    _init_velement() {
        console.log("Testing!");
    }
}
// ------------------------------------------------------------------------------------------------
// Wrapper functions.
// Mixin function.
const mixed_classes = [];
function mixin(derived, mixins) {
    for (const mixin of mixins) {
        Object.getOwnPropertyNames(mixin.prototype).forEach(name => {
            if (name !== 'constructor') {
                derived.prototype[name] = mixin.prototype[name];
            }
        });
    }
    mixed_classes.push(derived);
}
// Extend VElements.
function extend(methods) {
    Object.assign(VBaseElement.prototype, methods);
    mixed_classes.forEach(derivedCtor => {
        Object.assign(derivedCtor.prototype, methods);
    });
}
// ------------------------------------------------------------------------------------------------
// Specific VElements.
// Base class VAnchorElement derived from HTMLAnchorElement.
export class VAnchorElement extends HTMLAnchorElement {
    static element_tag = "a"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VAnchorElement, [VBaseElement]);
customElements.define("VAnchorElement", VAnchorElement, { extends: "a" });
// Base class VAreaElement derived from HTMLAreaElement.
export class VAreaElement extends HTMLAreaElement {
    static element_tag = "area"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VAreaElement, [VBaseElement]);
customElements.define("VAreaElement", VAreaElement, { extends: "area" });
// Base class VAudioElement derived from HTMLAudioElement.
export class VAudioElement extends HTMLAudioElement {
    static element_tag = "audio"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VAudioElement, [VBaseElement]);
customElements.define("VAudioElement", VAudioElement, { extends: "audio" });
// Base class VElement derived from HTMLElement.
export class VElement extends HTMLElement {
    static element_tag = "base"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VElement, [VBaseElement]);
customElements.define("VElement", VElement, { extends: "base" });
// Base class VQuoteElement derived from HTMLQuoteElement.
export class VQuoteElement extends HTMLQuoteElement {
    static element_tag = "blockquote"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VQuoteElement, [VBaseElement]);
customElements.define("VQuoteElement", VQuoteElement, { extends: "blockquote" });
// Base class VBodyElement derived from HTMLBodyElement.
export class VBodyElement extends HTMLBodyElement {
    static element_tag = "body"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VBodyElement, [VBaseElement]);
customElements.define("VBodyElement", VBodyElement, { extends: "body" });
// Base class VBRElement derived from HTMLBRElement.
export class VBRElement extends HTMLBRElement {
    static element_tag = "br"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VBRElement, [VBaseElement]);
customElements.define("VBRElement", VBRElement, { extends: "br" });
// Base class VButtonElement derived from HTMLButtonElement.
export class VButtonElement extends HTMLButtonElement {
    static element_tag = "button"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VButtonElement, [VBaseElement]);
customElements.define("VButtonElement", VButtonElement, { extends: "button" });
// Base class VCanvasElement derived from HTMLCanvasElement.
export class VCanvasElement extends HTMLCanvasElement {
    static element_tag = "canvas"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VCanvasElement, [VBaseElement]);
customElements.define("VCanvasElement", VCanvasElement, { extends: "canvas" });
// Base class VTableCaptionElement derived from HTMLTableCaptionElement.
export class VTableCaptionElement extends HTMLTableCaptionElement {
    static element_tag = "caption"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VTableCaptionElement, [VBaseElement]);
customElements.define("VTableCaptionElement", VTableCaptionElement, { extends: "caption" });
// Base class VTableColElement derived from HTMLTableColElement.
export class VTableColElement extends HTMLTableColElement {
    static element_tag = "col"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VTableColElement, [VBaseElement]);
customElements.define("VTableColElement", VTableColElement, { extends: "col" });
// Base class VDataElement derived from HTMLDataElement.
export class VDataElement extends HTMLDataElement {
    static element_tag = "data"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VDataElement, [VBaseElement]);
customElements.define("VDataElement", VDataElement, { extends: "data" });
// Base class VDataListElement derived from HTMLDataListElement.
export class VDataListElement extends HTMLDataListElement {
    static element_tag = "datalist"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VDataListElement, [VBaseElement]);
customElements.define("VDataListElement", VDataListElement, { extends: "datalist" });
// Base class VDListElement derived from HTMLDListElement.
export class VDListElement extends HTMLDListElement {
    static element_tag = "dl"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VDListElement, [VBaseElement]);
customElements.define("VDListElement", VDListElement, { extends: "dl" });
// Base class VDirectoryElement derived from HTMLDirectoryElement.
export class VDirectoryElement extends HTMLDirectoryElement {
    static element_tag = "dir"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VDirectoryElement, [VBaseElement]);
customElements.define("VDirectoryElement", VDirectoryElement, { extends: "dir" });
// Base class VDivElement derived from HTMLDivElement.
export class VDivElement extends HTMLDivElement {
    static element_tag = "div"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VDivElement, [VBaseElement]);
customElements.define("VDivElement", VDivElement, { extends: "div" });
// Base class VHtmlElement derived from HTMLHtmlElement.
export class VHtmlElement extends HTMLHtmlElement {
    static element_tag = "html"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VHtmlElement, [VBaseElement]);
customElements.define("VHtmlElement", VHtmlElement, { extends: "html" });
// Base class VEmbedElement derived from HTMLEmbedElement.
export class VEmbedElement extends HTMLEmbedElement {
    static element_tag = "embed"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VEmbedElement, [VBaseElement]);
customElements.define("VEmbedElement", VEmbedElement, { extends: "embed" });
// Base class VFieldSetElement derived from HTMLFieldSetElement.
export class VFieldSetElement extends HTMLFieldSetElement {
    static element_tag = "fieldset"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VFieldSetElement, [VBaseElement]);
customElements.define("VFieldSetElement", VFieldSetElement, { extends: "fieldset" });
// Base class VFormElement derived from HTMLFormElement.
export class VFormElement extends HTMLFormElement {
    static element_tag = "form"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VFormElement, [VBaseElement]);
customElements.define("VFormElement", VFormElement, { extends: "form" });
// Base class VHeadingElement derived from HTMLHeadingElement.
export class VHeadingElement extends HTMLHeadingElement {
    static element_tag = "h1"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VHeadingElement, [VBaseElement]);
customElements.define("VHeadingElement", VHeadingElement, { extends: "h1" });
// Base class VHeadElement derived from HTMLHeadElement.
export class VHeadElement extends HTMLHeadElement {
    static element_tag = "head"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VHeadElement, [VBaseElement]);
customElements.define("VHeadElement", VHeadElement, { extends: "head" });
// Base class VHRElement derived from HTMLHRElement.
export class VHRElement extends HTMLHRElement {
    static element_tag = "hr"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VHRElement, [VBaseElement]);
customElements.define("VHRElement", VHRElement, { extends: "hr" });
// Base class VImageElement derived from HTMLImageElement.
export class VImageElement extends HTMLImageElement {
    static element_tag = "img"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VImageElement, [VBaseElement]);
customElements.define("VImageElement", VImageElement, { extends: "img" });
// Base class VInputElement derived from HTMLInputElement.
export class VInputElement extends HTMLInputElement {
    static element_tag = "input"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VInputElement, [VBaseElement]);
customElements.define("VInputElement", VInputElement, { extends: "input" });
// Base class VModElement derived from HTMLModElement.
export class VModElement extends HTMLModElement {
    static element_tag = "ins"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VModElement, [VBaseElement]);
customElements.define("VModElement", VModElement, { extends: "ins" });
// Base class VLabelElement derived from HTMLLabelElement.
export class VLabelElement extends HTMLLabelElement {
    static element_tag = "label"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VLabelElement, [VBaseElement]);
customElements.define("VLabelElement", VLabelElement, { extends: "label" });
// Base class VLegendElement derived from HTMLLegendElement.
export class VLegendElement extends HTMLLegendElement {
    static element_tag = "legend"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VLegendElement, [VBaseElement]);
customElements.define("VLegendElement", VLegendElement, { extends: "legend" });
// Base class VLIElement derived from HTMLLIElement.
export class VLIElement extends HTMLLIElement {
    static element_tag = "li"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VLIElement, [VBaseElement]);
customElements.define("VLIElement", VLIElement, { extends: "li" });
// Base class VLinkElement derived from HTMLLinkElement.
export class VLinkElement extends HTMLLinkElement {
    static element_tag = "link"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VLinkElement, [VBaseElement]);
customElements.define("VLinkElement", VLinkElement, { extends: "link" });
// Base class VMapElement derived from HTMLMapElement.
export class VMapElement extends HTMLMapElement {
    static element_tag = "map"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VMapElement, [VBaseElement]);
customElements.define("VMapElement", VMapElement, { extends: "map" });
// Base class VMetaElement derived from HTMLMetaElement.
export class VMetaElement extends HTMLMetaElement {
    static element_tag = "meta"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VMetaElement, [VBaseElement]);
customElements.define("VMetaElement", VMetaElement, { extends: "meta" });
// Base class VMeterElement derived from HTMLMeterElement.
export class VMeterElement extends HTMLMeterElement {
    static element_tag = "meter"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VMeterElement, [VBaseElement]);
customElements.define("VMeterElement", VMeterElement, { extends: "meter" });
// Base class VObjectElement derived from HTMLObjectElement.
export class VObjectElement extends HTMLObjectElement {
    static element_tag = "object"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VObjectElement, [VBaseElement]);
customElements.define("VObjectElement", VObjectElement, { extends: "object" });
// Base class VOListElement derived from HTMLOListElement.
export class VOListElement extends HTMLOListElement {
    static element_tag = "ol"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VOListElement, [VBaseElement]);
customElements.define("VOListElement", VOListElement, { extends: "ol" });
// Base class VOptGroupElement derived from HTMLOptGroupElement.
export class VOptGroupElement extends HTMLOptGroupElement {
    static element_tag = "optgroup"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VOptGroupElement, [VBaseElement]);
customElements.define("VOptGroupElement", VOptGroupElement, { extends: "optgroup" });
// Base class VOptionElement derived from HTMLOptionElement.
export class VOptionElement extends HTMLOptionElement {
    static element_tag = "option"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VOptionElement, [VBaseElement]);
customElements.define("VOptionElement", VOptionElement, { extends: "option" });
// Base class VOutputElement derived from HTMLOutputElement.
export class VOutputElement extends HTMLOutputElement {
    static element_tag = "output"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VOutputElement, [VBaseElement]);
customElements.define("VOutputElement", VOutputElement, { extends: "output" });
// Base class VParagraphElement derived from HTMLParagraphElement.
export class VParagraphElement extends HTMLParagraphElement {
    static element_tag = "p"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VParagraphElement, [VBaseElement]);
customElements.define("VParagraphElement", VParagraphElement, { extends: "p" });
// Base class VParamElement derived from HTMLParamElement.
export class VParamElement extends HTMLParamElement {
    static element_tag = "param"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VParamElement, [VBaseElement]);
customElements.define("VParamElement", VParamElement, { extends: "param" });
// Base class VPictureElement derived from HTMLPictureElement.
export class VPictureElement extends HTMLPictureElement {
    static element_tag = "picture"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VPictureElement, [VBaseElement]);
customElements.define("VPictureElement", VPictureElement, { extends: "picture" });
// Base class VPreElement derived from HTMLPreElement.
export class VPreElement extends HTMLPreElement {
    static element_tag = "pre"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VPreElement, [VBaseElement]);
customElements.define("VPreElement", VPreElement, { extends: "pre" });
// Base class VProgressElement derived from HTMLProgressElement.
export class VProgressElement extends HTMLProgressElement {
    static element_tag = "progress"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VProgressElement, [VBaseElement]);
customElements.define("VProgressElement", VProgressElement, { extends: "progress" });
// Base class VScriptElement derived from HTMLScriptElement.
export class VScriptElement extends HTMLScriptElement {
    static element_tag = "script"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VScriptElement, [VBaseElement]);
customElements.define("VScriptElement", VScriptElement, { extends: "script" });
// Base class VSelectElement derived from HTMLSelectElement.
export class VSelectElement extends HTMLSelectElement {
    static element_tag = "select"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VSelectElement, [VBaseElement]);
customElements.define("VSelectElement", VSelectElement, { extends: "select" });
// Base class VSlotElement derived from HTMLSlotElement.
export class VSlotElement extends HTMLSlotElement {
    static element_tag = "slot"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VSlotElement, [VBaseElement]);
customElements.define("VSlotElement", VSlotElement, { extends: "slot" });
// Base class VSourceElement derived from HTMLSourceElement.
export class VSourceElement extends HTMLSourceElement {
    static element_tag = "source"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VSourceElement, [VBaseElement]);
customElements.define("VSourceElement", VSourceElement, { extends: "source" });
// Base class VSpanElement derived from HTMLSpanElement.
export class VSpanElement extends HTMLSpanElement {
    static element_tag = "span"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VSpanElement, [VBaseElement]);
customElements.define("VSpanElement", VSpanElement, { extends: "span" });
// Base class VTableElement derived from HTMLTableElement.
export class VTableElement extends HTMLTableElement {
    static element_tag = "table"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VTableElement, [VBaseElement]);
customElements.define("VTableElement", VTableElement, { extends: "table" });
// Base class VTableSectionElement derived from HTMLTableSectionElement.
export class VTableSectionElement extends HTMLTableSectionElement {
    static element_tag = "thead"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VTableSectionElement, [VBaseElement]);
customElements.define("VTableSectionElement", VTableSectionElement, { extends: "thead" });
// Base class VTableCellElement derived from HTMLTableCellElement.
export class VTableCellElement extends HTMLTableCellElement {
    static element_tag = "th"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VTableCellElement, [VBaseElement]);
customElements.define("VTableCellElement", VTableCellElement, { extends: "th" });
// Base class VTemplateElement derived from HTMLTemplateElement.
export class VTemplateElement extends HTMLTemplateElement {
    static element_tag = "template"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VTemplateElement, [VBaseElement]);
customElements.define("VTemplateElement", VTemplateElement, { extends: "template" });
// Base class VTextAreaElement derived from HTMLTextAreaElement.
export class VTextAreaElement extends HTMLTextAreaElement {
    static element_tag = "textarea"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VTextAreaElement, [VBaseElement]);
customElements.define("VTextAreaElement", VTextAreaElement, { extends: "textarea" });
// Base class VTimeElement derived from HTMLTimeElement.
export class VTimeElement extends HTMLTimeElement {
    static element_tag = "time"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VTimeElement, [VBaseElement]);
customElements.define("VTimeElement", VTimeElement, { extends: "time" });
// Base class VTitleElement derived from HTMLTitleElement.
export class VTitleElement extends HTMLTitleElement {
    static element_tag = "title"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VTitleElement, [VBaseElement]);
customElements.define("VTitleElement", VTitleElement, { extends: "title" });
// Base class VTableRowElement derived from HTMLTableRowElement.
export class VTableRowElement extends HTMLTableRowElement {
    static element_tag = "tr"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VTableRowElement, [VBaseElement]);
customElements.define("VTableRowElement", VTableRowElement, { extends: "tr" });
// Base class VTrackElement derived from HTMLTrackElement.
export class VTrackElement extends HTMLTrackElement {
    static element_tag = "track"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VTrackElement, [VBaseElement]);
customElements.define("VTrackElement", VTrackElement, { extends: "track" });
// Base class VUListElement derived from HTMLUListElement.
export class VUListElement extends HTMLUListElement {
    static element_tag = "ul"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VUListElement, [VBaseElement]);
customElements.define("VUListElement", VUListElement, { extends: "ul" });
// Base class VIFrameElement derived from HTMLIFrameElement.
export class VIFrameElement extends HTMLIFrameElement {
    static element_tag = "iframe"; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    constructor() {
        super();
        this._init_velement();
    }
}
mixin(VIFrameElement, [VBaseElement]);
customElements.define("VIFrameElement", VIFrameElement, { extends: "iframe" });
// The VElement map per html tag.
export const VElementTagMap = {
    a: VAnchorElement,
    area: VAreaElement,
    audio: VAudioElement,
    base: VElement,
    blockquote: VQuoteElement,
    body: VBodyElement,
    br: VBRElement,
    button: VButtonElement,
    canvas: VCanvasElement,
    caption: VTableCaptionElement,
    col: VTableColElement,
    data: VDataElement,
    datalist: VDataListElement,
    dl: VDListElement,
    dir: VDirectoryElement,
    div: VDivElement,
    html: VHtmlElement,
    embed: VEmbedElement,
    fieldset: VFieldSetElement,
    form: VFormElement,
    h1: VHeadingElement,
    h2: VHeadingElement,
    h3: VHeadingElement,
    h4: VHeadingElement,
    h5: VHeadingElement,
    h6: VHeadingElement,
    head: VHeadElement,
    hr: VHRElement,
    img: VImageElement,
    input: VInputElement,
    ins: VModElement,
    label: VLabelElement,
    legend: VLegendElement,
    li: VLIElement,
    link: VLinkElement,
    map: VMapElement,
    meta: VMetaElement,
    meter: VMeterElement,
    object: VObjectElement,
    ol: VOListElement,
    optgroup: VOptGroupElement,
    option: VOptionElement,
    output: VOutputElement,
    p: VParagraphElement,
    param: VParamElement,
    picture: VPictureElement,
    pre: VPreElement,
    progress: VProgressElement,
    q: VQuoteElement,
    script: VScriptElement,
    select: VSelectElement,
    slot: VSlotElement,
    source: VSourceElement,
    span: VSpanElement,
    table: VTableElement,
    thead: VTableSectionElement,
    tbody: VTableSectionElement,
    tfoot: VTableSectionElement,
    th: VTableCellElement,
    td: VTableCellElement,
    template: VTemplateElement,
    textarea: VTextAreaElement,
    time: VTimeElement,
    title: VTitleElement,
    tr: VTableRowElement,
    track: VTrackElement,
    ul: VUListElement,
    iframe: VIFrameElement,
    code: VElement,
    section: VElement,
    default: VElement,
};
