/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
// Imports.
import { Elements, VElementTagMap } from "../elements/module.js";
import { Scheme } from "@vandenberghinc/vlib/frontend";
// Table head element.
let TableHeadElement = (() => {
    let _classDecorators = [Elements.create({
            name: "TableHeadElement",
            default_style: {
                "padding": "0px",
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.thead;
    var TableHeadElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TableHeadElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(...content) {
            // Initialize base class.
            super({
                derived: TableHeadElement,
            });
            // Append content.
            this.append(...content);
        }
    };
    return TableHeadElement = _classThis;
})();
export { TableHeadElement };
export const TableHead = Elements.wrapper(TableHeadElement);
export const NullTableHead = Elements.create_null(TableHeadElement);
// Table header element.
let TableHeaderElement = (() => {
    let _classDecorators = [Elements.create({
            name: "TableHeaderElement",
            default_style: {
                "text-align": "left",
                "padding": "0px 10px",
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.th;
    var TableHeaderElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TableHeaderElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(...content) {
            // Initialize base class.
            super({
                derived: TableHeadElement,
            });
            // Append content.
            this.append(...content);
        }
    };
    return TableHeaderElement = _classThis;
})();
export { TableHeaderElement };
export const TableHeader = Elements.wrapper(TableHeaderElement);
export const NullTableHeader = Elements.create_null(TableHeaderElement);
// Table body element.
let TableBodyElement = (() => {
    let _classDecorators = [Elements.create({
            name: "TableBodyElement",
            default_style: {
                "padding": "0px",
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.tbody;
    var TableBodyElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TableBodyElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(...content) {
            // Initialize base class.
            super({
                derived: TableBodyElement,
            });
            // Append content.
            this.append(...content);
        }
    };
    return TableBodyElement = _classThis;
})();
export { TableBodyElement };
export const TableBody = Elements.wrapper(TableBodyElement);
export const NullTableBody = Elements.create_null(TableBodyElement);
// Table row element.
let TableRowElement = (() => {
    let _classDecorators = [Elements.create({
            name: "TableRowElement",
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.tr;
    var TableRowElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TableRowElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(...content) {
            // Initialize base class.
            super({
                derived: TableRowElement,
            });
            // Append content.
            this.append(...content);
        }
    };
    return TableRowElement = _classThis;
})();
export { TableRowElement };
export const TableRow = Elements.wrapper(TableRowElement);
export const NullTableRow = Elements.create_null(TableRowElement);
// Table data element.
let TableDataElement = (() => {
    let _classDecorators = [Elements.create({
            name: "TableDataElement",
            default_style: {
                "text-align": "left",
                "padding": "0px 10px",
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.td;
    var TableDataElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TableDataElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(...content) {
            // Initialize base class.
            super({
                derived: TableDataElement,
            });
            // Append content.
            this.append(...content);
        }
    };
    return TableDataElement = _classThis;
})();
export { TableDataElement };
export const TableData = Elements.wrapper(TableDataElement);
export const NullTableData = Elements.create_null(TableDataElement);
// Inner Table element.
// Use a container for the Table element so a border color + border radius can be set.
// Since border-collapse collapse prevents a border radius but is required for different background for the table head.
let InnerTableElement = (() => {
    let _classDecorators = [Elements.create({
            name: "InnerTableElement",
            default_style: {
                "border-collapse": "collapse", /* Ensures there is no spacing between table cells */
                "padding": "0",
                "margin": 0,
                "border-spacing": 0, /* Removes any default spacing between cells */
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.table;
    var InnerTableElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            InnerTableElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(...content) {
            // Initialize base class.
            super({
                derived: InnerTableElement,
            });
            // Append content.
            this.append(...content);
        }
    };
    return InnerTableElement = _classThis;
})();
export { InnerTableElement };
export const InnerTable = Elements.wrapper(InnerTableElement);
export const NullInnerTable = Elements.create_null(InnerTableElement);
// Table data element.
let TableElement = (() => {
    let _classDecorators = [Elements.create({
            name: "TableElement",
            default_style: {},
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.div;
    var TableElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TableElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Attributes.
        table_rows;
        show_columns;
        table = NullInnerTable();
        table_head = NullTableHead();
        table_body = NullTableBody();
        // Constructor.
        constructor({ rows = [
            ["a", "b"],
            ["c", "d"],
        ], columns = ["Column 1", "Column 2"], show_columns = true, }) {
            // Initialize base class.
            super({
                derived: TableElement,
            });
            // Attributes.
            this.table_rows = [];
            this.show_columns = show_columns === true && columns !== false;
            // Append content.
            this.create({ rows, columns: columns === false ? [] : columns });
            this.overflow("hidden"); // without overflow hidden when border radius is set on the element the background of rows can overflow.
        }
        // Iterate the table data items.
        iterate(callback) {
            let row_index = 0;
            this.table_rows.iterate(row => {
                let column_index = 0;
                row.iterate(column => {
                    callback({
                        column,
                        column_index,
                        columns: row.children.length,
                        is_last_column: column_index === row.children.length - 1,
                        is_header: this.show_columns && row_index === 0,
                        row,
                        rows: this.table_rows.length,
                        is_last_row: row_index === this.table_rows.length - 1,
                    });
                    ++column_index;
                });
                ++row_index;
            });
            return this;
        }
        // Iterate table rows.
        iterate_rows(callback) {
            let index = 0;
            this.table_rows.iterate(e => {
                callback(e, index, index === this.table_rows.length - 1);
                ++index;
            });
            return this;
        }
        // Create the table.
        create({ rows, columns }) {
            // if (!Array.isArray(rows)) {
            // 	console.error(`Invalid type "${Scheme.value_type(rows)}" for parameter "rows" the valid type is "array".`)
            // 	return this;
            // }
            if (!Array.isArray(columns)) {
                console.error(`Invalid type "${Scheme.value_type(columns)}" for parameter "columns" the valid type is "array".`);
                return this;
            }
            // console.log(columns, rows)
            return this.append(this.table = InnerTable(this.show_columns
                ? this.table_head = TableHead(TableRow(columns.map(column => TableHeader(column).padding(0).text_leading()))
                    .exec(e => this.table_rows.append(e)))
                    .parent(this)
                : null, this.table_body = TableBody(!Array.isArray(rows)
                ? null
                : rows.map(row => TableRow(row.map(column => TableData(column).padding(0)))
                    .exec(e => this.table_rows.append(e))))
                .parent(this))
                .width("100%"));
        }
        // Set borders.
        borders(...values) {
            // @ts-ignore
            this.border(...values);
            this.iterate(({ row, column, is_last_column, is_last_row }) => {
                if (!is_last_column) {
                    column.border_right(...values);
                }
                if (!is_last_row) {
                    column.border_bottom(...values);
                }
            });
            return this;
        }
        // Set header background.
        head_background(value) {
            if (this.table_head) {
                this.table_head.background(value);
            }
            return this;
        }
        // Set padding on the table headers and table data's.
        column_padding(...values) {
            return this.iterate(({ column }) => {
                column.padding(...values);
            });
        }
        cell_padding(...args) {
            return this.iterate(({ column }) => {
                column.padding(...args);
            });
        }
        row_padding(...args) {
            return this.iterate_rows((row) => {
                row.padding(...args);
            });
        }
        // Set column widths.
        column_widths(...widths) {
            this.table.style.tableLayout = "fixed";
            let i = 0;
            this.iterate(({ column }) => {
                column.width(widths[i]);
                ++i;
            });
            return this;
        }
    };
    return TableElement = _classThis;
})();
export { TableElement };
export const Table = Elements.wrapper(TableElement);
export const NullTable = Elements.create_null(TableElement);
