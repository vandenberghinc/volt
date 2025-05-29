var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  SplashScreen: () => SplashScreen,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
class SplashScreen {
  background;
  image;
  loader;
  style;
  _html;
  // Constructor.
  constructor({ background = null, image = null, loader = true, style = null }) {
    this.background = background;
    this.image = image;
    this.loader = loader;
    this.style = style;
    this._html = void 0;
  }
  // Get html.
  get html() {
    if (this._html !== void 0) {
      return this._html;
    }
    this._html = `<div id='__volt_splash_screen' style='width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; ${this.background == null ? "" : "background: " + this.background}; ${this.style == null ? "" : this.style};'>`;
    const margin_between_img_and_loader = this.loader && this.image != null && this.image.src != null ? "50px" : null;
    if (this.image != null && this.image.src != null) {
      this._html += `<img src='${this.image.src}' alt='${this.image.alt || "Icon"}' ${this.image.width ? "width='" + this.image.width + "'" : ""} ${this.image.height ? "height='" + this.image.height + "'" : ""} style='${this.image.width ? "width: " + this.image.width + ";" : ""} ${this.image.height ? "height: " + this.image.height + ";" : ""} ${margin_between_img_and_loader ? "margin-bottom: " + margin_between_img_and_loader : ""}; ${this.image.style == null ? "" : this.image.style};'>`;
    }
    if (this.loader) {
      const size = typeof this.loader === "object" && this.loader.size ? this.loader.size : 60;
      const color = typeof this.loader === "object" && this.loader.color ? this.loader.color : "#fff";
      this._html += `<style>.__volt_splash_screen_loader {  display: inline-block;  position: relative;  width: calc(${size}px / 2);  height: calc(${size}px / 2);  position: absolute; bottom: 50px;}.__volt_splash_screen_loader div {  box-sizing: border-box;  display: block;  position: absolute;  width: calc(${64 / 80 * size}px / 2);  height: calc(${64 / 80 * size}px / 2);  margin: calc(${8 / 80 * size}px / 2);  border: calc(${8 / 80 * size}px / 2) solid ${color};  border-radius: 50%;  animation: __volt_splash_screen_loader 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;  border-color: ${color} transparent transparent transparent;}.__volt_splash_screen_loader div:nth-child(1) {  animation-delay: -0.45s;}.__volt_splash_screen_loader div:nth-child(2) {  animation-delay: -0.3s;}.__volt_splash_screen_loader div:nth-child(3) {  animation-delay: -0.15s;}@keyframes __volt_splash_screen_loader {  0% {    transform: rotate(0deg);  }  100% {    transform: rotate(360deg);  }}</style><div class='__volt_splash_screen_loader'><div></div><div></div><div></div><div></div></div>`;
    }
    this._html += "</div>";
    return this._html;
  }
  // Serve a client.
  _serve(stream) {
    stream.send({
      status: 200,
      headers: { "Content-Type": "text/html" },
      data: this.html
    });
  }
}
var stdin_default = SplashScreen;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SplashScreen
});
