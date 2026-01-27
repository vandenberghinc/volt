/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import * as vlib from "@vandenberghinc/vlib";
import { User } from "./users.js";
/** All events and their callback types. */
export type Events = {
    /**
     * Add an (async) callback executed at the end of `server.start()`. The callback may take arguments `({forked <boolean>})`.
     * @example
     * ...
     * server.on("start", opts => console.log("Hello World!"));
     */
    start: (opts: {
        forked: boolean;
    }) => void | Promise<void>;
    /**
     * Set an (async) callback which will be executed at the start of `server.stop()`.
     * @example
     * ...
     * server.on("stop", () => console.log("Hello World!"));
     */
    stop: () => void | Promise<void>;
    /**
     * Set an (async) callback which will be executed at the start of `server.initialize()`.
     * @example
     * ...
     * server.on("initialize", () => console.log("Hello World!"));
     */
    initialize: (opts: {
        /** The `worker` flag passed to `Server.initialize()` */
        worker: boolean;
    }) => void | Promise<void>;
    /**
     * This callback is executed when a user is created.
     * @note Errors thrown in this callback will be logged but ignored.
     */
    create_user: (opts: {
        user: User;
    }) => void | Promise<void>;
    /**
     * This callback is executed when a user is deleted.
     * @note Errors thrown in this callback will be logged but ignored.
     */
    delete_user: (opts: {
        user: User;
    }) => void | Promise<void>;
};
/** Event name. */
export type EventName = vlib.EventName<Events>;
/** Event callback. */
export type EventCallback<N extends EventName> = vlib.EventCallback<Events, N>;
/** Event parameters. */
export type EventParams<N extends EventName> = vlib.EventParams<Events, N>;
/** Event result type. */
export type EventResult<N extends EventName> = vlib.EventResult<Events, N>;
