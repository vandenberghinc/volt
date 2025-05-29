
// Extensions.
declare global {
	interface VElementExtensions {}
}

// Base element.
interface VBaseElement extends VElementExtensions {}
class VBaseElement {
	__init() {}
	my_method() {
		console.log("Testing!");
	}
}


// Mixin function.
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


// HTMLSpanElement
class VSpanElement extends HTMLSpanElement {
	constructor() {
		super();
		this._init_velement();
	}
}
interface VSpanElement extends HTMLSpanElement, VBaseElement, VElementExtensions {}
mixin(VSpanElement, [VBaseElement])
customElements.define("v-span", VSpanElement, {extends: "span"});

// Test span.
const span = new VSpanElement();
span.my_method();
span.innerHTML = "Hello World!";

document.body.appendChild(span);


// @todo test Extensions
const mixed_classes = [] as any[];
function extend(methods: Partial<VElementExtensions>) {
	Object.assign(VBaseElement.prototype, methods);
	mixed_classes.forEach(derivedCtor => {
	    Object.assign(derivedCtor.prototype, methods);
	  });
}
declare global {
	interface VElementExtensions {
		new_method(): void;
	}
}
extend({
	new_method() {
		console.log("I am a new method!")
	}
})
const span2 = new VSpanElement();
span2.new_method();

// @todo test extending VSpanElement with AnyElement issue
class VDerivedElement extends VSpanElement {
	constructor() {
		super();
	}
}
customElements.define("v-derived", VDerivedElement, {extends: "span"});

const derived1 = new VDerivedElement();
derived1.new_method();

type AnyElement = VSpanElement | VDerivedElement;

const X: Record<string, AnyElement> = {};
const y = X.test.offsetTop;
const a0: AnyElement = new VSpanElement();
const a1 = a0.offsetTop;
