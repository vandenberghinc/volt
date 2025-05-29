import { VElementTagMap } from "../elements/module.js";
export declare class GoogleMapElement extends VElementTagMap.iframe {
    constructor({ location, mode, api_key, }: {
        location: string;
        mode: string;
        api_key?: string;
    });
    update(): this;
}
export declare const GoogleMap: <Extensions extends object = {}>(args_0: {
    location: string;
    mode: string;
    api_key?: string;
}) => GoogleMapElement & Extensions;
export declare const NullGoogleMap: <Extensions extends object = {}>() => GoogleMapElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        GoogleMapElement: GoogleMapElement;
    }
}
