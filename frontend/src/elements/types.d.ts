
// Add some html properties since VBaseElement wants properties of them all since is is mixed in.
interface HTMLElement extends VElementExtensions {
    
    setAttribute(name: string, value: string | number | boolean): void;

    acceptCharset: any;
    name: any;
    hreflang: any;
    // readOnly: any;
    autoplay: any;
    maxlength: any;
    minlength: any;
    dateTime: any;
    srcset?: string
    srclang?: string;
    srcdoc?: string;
    novalidate?: boolean;
    isMap?: boolean;
    httpEquiv?: string;
    formAction?: string;
    rowspan?: number;
    autocomplete?: "" | "on" | "off";
    useMap?: string;

    // value(): string; 
    // value(value: string): this;
    // type(): string; 
    // type(value: string): this;
    // title(): string; 
    // title(value: string): this;
    // target(): string; 
    // target(value: string): this;
    // pattern(): string; 
    // pattern(value: string): this;
    // step(): string; 
    // step(value: string): this;
    // start(): number | null; 
    // start(value: number): this;
    // multiple(): boolean; 
    // multiple(value: boolean): this;
    // checked(): boolean; 
    // checked(value: boolean): this;
    // required(): boolean; 
    // required(value: boolean): this;

    // rows(): null | number 
    // rows(value: number): this;
    // span(): null | number 
    // span(value: number): this;

    // 

    // alt(): string; 
    // alt(value: string): this;
    // accept(): string; 
    // accept(value: string): this;
    // action(): string; 
    // action(value: string): this;
    // enctype(): string; 
    // enctype(value: string): this;
    // id(): string; 
    // id(value: string): this;
    // lang(): string; 
    // lang(value: string): this;
    // max(): string; 
    // max(value: string): this;
    // method(): string; 
    // method(value: string): this;
    // min(): string; 
    // min(value: string): this;
    // placeholder(): string; 
    // placeholder(value: string): this;
    // rel(): string; 
    // rel(value: string): this;
    // shape(): string; 
    // shape(value: string): this;

    // download(): string; 
    // download(value: string): this;
    // charset(): string;
    // charset(value: string): this;
    // cite(): string;
    // cite(value: string): this;
    // cols(): null | number 
    // cols(value: number): this;
    // colspan(): null | number 
    // colspan; (value: number): this;
    // controls(): boolean;
    // controls(value: boolean): this;
    // coords(): string;
    // coords(value: string): this;
    // data(): string;
    // data(value: string): this;
    // async(): boolean;
    // async(value: boolean): this;
    // default(): boolean;
    // default(value: boolean): this;
    // defer(): boolean;
    // defer(value: boolean): this;
    // dir(): string;
    // dir(value: string): this;
    // dirname(): string;
    // dirname(value: string): this;
    // disabled(): boolean;
    // disabled(value: boolean): this;
    // draggable(): boolean;
    // draggable(value: boolean): this;
    // for(): string;
    // for(value: string): this;
    // headers(): string;
    // headers(value: string): this;
    // high(): string;
    // high(value: string | number): this;
    // href(): string;
    // href(value: string): this;
    // kind(): string;
    // kind(value: string): this;
    // label(): string;
    // label(value: string): this;
    // loop(): boolean;
    // loop(value: boolean): this;
    // low(): string;
    // low(value: string | number): this;
    // muted(): boolean;
    // muted(value: boolean): this;
    // open(): boolean;
    // open(value: boolean): this;
    // optimum(): null | number 
    // optimum(value: number): this;
    // poster(): string;
    // poster(value: string): this;
    // preload(): string;
    // preload(value: string): this;
    // reversed(): boolean;
    // reversed(value: boolean): this;
    // sandbox(): string;
    // sandbox(value: string): this;
    // scope(): string;
    // scope(value: string): this;
    // selected(): boolean;
    // selected(value: boolean): this;
    // shape(): string;
    // shape(value: string): this;
    // span(): null | number;
    // span(value: number): this;
    // size(): null | number;
    // size(value: number): this;
    // sizes(): string; 
    // sizes(value: string): this;
    // span(): string; 
    // span(value: string): this;
    // src(): string; 
    // src(value: string): this;
}