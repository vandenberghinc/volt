import type { AnyElement, LoaderButtonElement, VElementInstance } from "../../frontend/dist/volt.js"
const X: Record<string, AnyElement> = {};
const a: number = (X["test"] as any as VElementInstance).offsetTop;
const b: number = (X["test"] as any as LoaderButtonElement).offsetTop;
const c: number = X["test"]!.offsetTop;