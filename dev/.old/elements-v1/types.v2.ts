
// The VElement user defined extensions.
declare global {
	interface VElementExtensions {}
}

// Base element.
interface VBaseElement extends VElementExtensions {}
class VBaseElement {
	_init_velement() {
		console.log("Testing!");
	}
}

// Mixin function.
const mixed_classes = [] as any[];
function mixin(derived: any, mixins: any[]) {
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
function extend(methods: Partial<VElementExtensions>) {
	Object.assign(VBaseElement.prototype, methods);
	mixed_classes.forEach(derivedCtor => {
	    Object.assign(derivedCtor.prototype, methods);
	  });
}

// Base class VAnchorElement derived from HTMLAnchorElement.
export class VAnchorElement extends HTMLAnchorElement {
    static element_tag: string = "a"; // must also be static.
    static default_style: Record<string, any> = {};
    static default_attributes: Record<string, any> = {};
    static default_events: Record<string, any> = {};
    constructor() {
        super();
        this._init_velement();
    }
}
interface VAnchorElement extends HTMLAnchorElement, VBaseElement, VElementExtensions {}
mixin(VAnchorElement, [VBaseElement])
customElements.define("VAnchorElement", VAnchorElement, {extends: "a"});
 
// The VElement map per html tag.
export const VElementTagMap = {
	a: VAnchorElement,
	area: VAreaElement,
	audio: VAudioElement,
	base: VBaseElement,
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