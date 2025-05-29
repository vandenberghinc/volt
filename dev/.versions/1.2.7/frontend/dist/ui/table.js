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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
// Imports.
import { Elements } from "../modules/elements";
import { Scheme } from "../modules/scheme";
import { CreateVElementClass } from "./element";
// Table head element.
let TableHeadElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "TableHead",
        tag: "thead",
        default_style: {
            "padding": "0px",
        },
    });
    var TableHeadElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(...content) {
            // Initialize base class.
            super();
            // Append content.
            this.append(...content);
        }
    };
    __setFunctionName(_classThis, "TableHeadElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TableHeadElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TableHeadElement = _classThis;
})();
export { TableHeadElement };
export const TableHead = Elements.wrapper(TableHeadElement);
// Table header element.
let TableHeaderElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "TableHeader",
        tag: "th",
        default_style: {
            "text-align": "left",
            "padding": "0px 10px",
        },
    });
    var TableHeaderElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(...content) {
            // Initialize base class.
            super();
            // Append content.
            this.append(...content);
        }
    };
    __setFunctionName(_classThis, "TableHeaderElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TableHeaderElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TableHeaderElement = _classThis;
})();
export { TableHeaderElement };
export const TableHeader = Elements.wrapper(TableHeaderElement);
// Table body element.
let TableBodyElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "TableBody",
        tag: "tbody",
        default_style: {
            "padding": "0px",
        },
    });
    var TableBodyElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(...content) {
            // Initialize base class.
            super();
            // Append content.
            this.append(...content);
        }
    };
    __setFunctionName(_classThis, "TableBodyElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TableBodyElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TableBodyElement = _classThis;
})();
export { TableBodyElement };
export const TableBody = Elements.wrapper(TableBodyElement);
// Table row element.
let TableRowElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "TableRow",
        tag: "tr",
        default_style: {},
    });
    var TableRowElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(...content) {
            // Initialize base class.
            super();
            // Append content.
            this.append(...content);
        }
    };
    __setFunctionName(_classThis, "TableRowElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TableRowElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TableRowElement = _classThis;
})();
export { TableRowElement };
export const TableRow = Elements.wrapper(TableRowElement);
// Table data element.
let TableDataElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "TableData",
        tag: "td",
        default_style: {
            "text-align": "left",
            "padding": "0px 10px",
        },
    });
    var TableDataElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(...content) {
            // Initialize base class.
            super();
            // Append content.
            this.append(...content);
        }
    };
    __setFunctionName(_classThis, "TableDataElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TableDataElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TableDataElement = _classThis;
})();
export { TableDataElement };
export const TableData = Elements.wrapper(TableDataElement);
// Inner Table element.
// Use a container for the Table element so a border color + border radius can be set.
// Since border-collapse collapse prevents a border radius but is required for different background for the table head.
let InnerTableElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "InnerTable",
        tag: "table",
        default_style: {
            "border-collapse": "collapse", /* Ensures there is no spacing between table cells */
            "padding": "0",
            "margin": 0,
            "border-spacing": 0, /* Removes any default spacing between cells */
        },
    });
    var InnerTableElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(...content) {
            // Initialize base class.
            super();
            // Append content.
            this.append(...content);
        }
    };
    __setFunctionName(_classThis, "InnerTableElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        InnerTableElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return InnerTableElement = _classThis;
})();
export { InnerTableElement };
export const InnerTable = Elements.wrapper(InnerTableElement);
// Table data element.
let TableElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "Table",
        tag: "div",
        default_style: {
            "color": "black",
        },
    });
    var TableElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor({ rows = [
            [0, 1],
            [2, 3],
        ], columns = ["Column 1", "Column 2"], show_columns = true, }) {
            // Initialize base class.
            super();
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
            if (!Array.isArray(rows)) {
                console.error(`Invalid type "${Scheme.value_type(rows)}" for parameter "rows" the valid type is "array".`);
                return this;
            }
            if (!Array.isArray(columns)) {
                console.error(`Invalid type "${Scheme.value_type(columns)}" for parameter "columns" the valid type is "array".`);
                return this;
            }
            // console.log(columns, rows)
            return this.append(this.table = InnerTable(this.show_columns
                ? this.table_head = TableHead(TableRow(columns.iterate_append(column => TableHeader(column)))
                    .exec(e => this.table_rows.append(e)))
                    .parent(this)
                : null, this.table_body = TableBody(rows.iterate_append(row => TableRow(row.iterate_append(column => TableData(column)))
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
    __setFunctionName(_classThis, "TableElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TableElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TableElement = _classThis;
})();
export { TableElement };
export const Table = Elements.wrapper(TableElement);
