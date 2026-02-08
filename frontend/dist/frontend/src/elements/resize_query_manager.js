"use strict";
// /**
//  * @author Daan van den Bergh
//  * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
//  */
// import { AnyElement } from "src/ui/any_element";
// /**
//  * Global manager for container-style predicates (single ResizeObserver).
//  */
// export class ResizeQueryManager {
//     /** Shared ResizeObserver instance (one per app). */
//     private static resize_observer: ResizeObserver | null = null;
//     /** Target -> records depending on this container target. */
//     private static records_by_target = new Map<AnyElement, Set<ResizeQueryManager.Record<any>>>();
//     /** Target -> latest size from RO callback (batched). */
//     private static pending_sizes = new Map<AnyElement, { width: number; height: number }>();
//     /** Prevent scheduling multiple RAF flushes. */
//     private static raf_scheduled = false;
//     /**
//      * Ensure global observer exists.
//      */
//     static ensure_observer(): void {
//         if (this.resize_observer !== null) return;
//         // ResizeObserver fires for element size changes, not just window resizes.
//         this.resize_observer = new ResizeObserver((entries) => {
//             for (const entry of entries) {
//                 const target = entry.target as unknown as AnyElement;
//                 const rect = entry.contentRect;
//                 // Coalesce sizes per target so we only compute once per frame.
//                 this.pending_sizes.set(target, { width: rect.width, height: rect.height });
//             }
//             this.schedule_flush();
//         });
//     }
//     /**
//      * Observe a target element and register a record.
//      */
//     static observe_target<T extends AnyElement>(target: AnyElement, record: ResizeQueryManager.Record<T>): void {
//         this.ensure_observer();
//         let records = this.records_by_target.get(target);
//         if (records === undefined) {
//             records = new Set();
//             this.records_by_target.set(target, records);
//             // Start observing this target once, regardless of how many records use it.
//             this.resize_observer!.observe(target as unknown as HTMLElement);
//         }
//         records.add(record as ResizeQueryManager.Record<any>);
//         // Initialize immediately using current layout (no need to wait for RO tick).
//         this.evaluate_record(record, target);
//     }
//     /**
//      * Unobserve a record from a target; stop observing target if unused.
//      */
//     static unobserve_target<T extends AnyElement>(target: AnyElement, record: ResizeQueryManager.Record<T>): void {
//         const records = this.records_by_target.get(target);
//         if (records === undefined) return;
//         records.delete(record as ResizeQueryManager.Record<any>);
//         // If no more records depend on this target, unobserve it.
//         if (records.size === 0) {
//             this.records_by_target.delete(target);
//             this.resize_observer?.unobserve(target as unknown as HTMLElement);
//         }
//     }
//     /**
//      * Schedule a batched flush of pending size changes.
//      */
//     private static schedule_flush(): void {
//         if (this.raf_scheduled) return;
//         this.raf_scheduled = true;
//         requestAnimationFrame(() => {
//             this.raf_scheduled = false;
//             this.flush_pending();
//         });
//     }
//     /**
//      * Evaluate all records for all targets that changed this frame.
//      */
//     private static flush_pending(): void {
//         for (const [target] of this.pending_sizes) {
//             const records = this.records_by_target.get(target);
//             if (records === undefined) continue;
//             // Evaluate all records attached to this target.
//             for (const record of records) {
//                 this.evaluate_record(record, target);
//             }
//         }
//         this.pending_sizes.clear();
//     }
//     /**
//      * Evaluate one record against a target and fire handlers on state changes.
//      */
//     private static evaluate_record<T extends AnyElement>(record: ResizeQueryManager.Record<T>, target: AnyElement): void {
//         let matches = false;
//         try {
//             // NOTE: predicate gets the AnyElement + the target container element.
//             // Users can do target.clientWidth / target.getBoundingClientRect() etc.
//             matches = record.predicate(record.owner, target);
//         } catch {
//             // Treat predicate errors as "no match" to keep the system stable.
//             matches = false;
//         }
//         // Only fire when state flips (or first run).
//         if (record.last_match === undefined || record.last_match !== matches) {
//             record.last_match = matches;
//             if (matches) record.on_true?.(record.owner);
//             else record.on_false?.(record.owner);
//         }
//     }
// }
// /**
//  * Namespaced types for ContainerQueryManager.
//  */
// export namespace ResizeQueryManager {
//     /**
//      * Generic callback type for handlers.
//      */
//     export type Callback<T> = (e: T) => void;
//     /**
//      * Predicate for container evaluation.
//      *
//      * `target` is the observed container (defaults to the element's own AnyElement).
//      */
//     export type Predicate<T extends AnyElement> = (e: T, target: AnyElement) => boolean;
//     /**
//      * Internal record stored in the manager.
//      */
//     export type Record<T extends AnyElement> = {
//         /** Owning AnyElement instance. */
//         owner: T;
//         /** User-provided predicate. */
//         predicate: Predicate<T>;
//         /** Called when predicate becomes true. */
//         on_true?: Callback<T>;
//         /** Called when predicate becomes false. */
//         on_false?: Callback<T>;
//         /** Last match state for flip detection. */
//         last_match?: boolean;
//     };
//     /**
//      * Per-element subscription handle.
//      */
//     export type Subscription<T extends AnyElement> = {
//         /** Container element being observed. */
//         target: AnyElement;
//         /** Record registered with the manager. */
//         record: Record<T>;
//         /** Remove function for cleanup. */
//         remove: () => void;
//     };
// }
