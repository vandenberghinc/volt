/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElement, VElementTagMap, AppendType } from "../elements/module.js"
import { Scheme } from "@vandenberghinc/vlib/frontend";

// Table head element.
@Elements.create({
    name: "TableHeadElement",
    default_style: {
		"padding": "0px",
	},
})
export class TableHeadElement extends VElementTagMap.thead {
	
	// Constructor.
	constructor(...content: any[]) {
		
		// Initialize base class.
		super({
			derived: TableHeadElement,
		});
	
		// Append content.
		this.append(...content);
	}
}
export const TableHead = Elements.wrapper(TableHeadElement);
export const NullTableHead = Elements.create_null(TableHeadElement);
declare module './any_element.d.ts' { interface AnyElementMap { TableHeadElement: TableHeadElement }}

// Table header element.
@Elements.create({
    name: "TableHeaderElement",
    default_style: {
		"text-align": "left",
		"padding": "0px 10px",
	},
})
export class TableHeaderElement extends VElementTagMap.th {

	// Constructor.
	constructor(...content: AppendType[]) {
		
		// Initialize base class.
		super({
			derived: TableHeadElement,
		});
	
		// Append content.
		this.append(...content);
	}
}
export const TableHeader = Elements.wrapper(TableHeaderElement);
export const NullTableHeader = Elements.create_null(TableHeaderElement);
declare module './any_element.d.ts' { interface AnyElementMap { TableHeaderElement: TableHeaderElement }}

// Table body element.
@Elements.create({
    name: "TableBodyElement",
    default_style: {
		"padding": "0px",
	},
})
export class TableBodyElement extends VElementTagMap.tbody {
	
	// Constructor.
	constructor(...content: any[]) {
		
		// Initialize base class.
		super({
			derived: TableBodyElement,
		});
	
		// Append content.
		this.append(...content);
	}
}
export const TableBody = Elements.wrapper(TableBodyElement);
export const NullTableBody = Elements.create_null(TableBodyElement);
declare module './any_element.d.ts' { interface AnyElementMap { TableBodyElement: TableBodyElement }}


// Table row element.
@Elements.create({
    name: "TableRowElement",
})
export class TableRowElement extends VElementTagMap.tr {

	// Constructor.
	constructor(...content: any[]) {
		
		// Initialize base class.
		super({
			derived: TableRowElement,
		});
	
		// Append content.
		this.append(...content);
	}
}
export const TableRow = Elements.wrapper(TableRowElement);
export const NullTableRow = Elements.create_null(TableRowElement);
declare module './any_element.d.ts' { interface AnyElementMap { TableRowElement: TableRowElement }}

// Table data element.
@Elements.create({
    name: "TableDataElement",
    default_style: {
		"text-align": "left",
		"padding": "0px 10px",
	},
})
export class TableDataElement extends VElementTagMap.td {
	
	// Constructor.
	constructor(...content: any[]) {
		
		// Initialize base class.
		super({
			derived: TableDataElement,
		});
	
		// Append content.
		this.append(...content);
	}
}
export const TableData = Elements.wrapper(TableDataElement);
export const NullTableData = Elements.create_null(TableDataElement);
declare module './any_element.d.ts' { interface AnyElementMap { TableDataElement: TableDataElement }}

// Inner Table element.
// Use a container for the Table element so a border color + border radius can be set.
// Since border-collapse collapse prevents a border radius but is required for different background for the table head.
@Elements.create({
    name: "InnerTableElement",
    default_style: {
		"border-collapse": "collapse", /* Ensures there is no spacing between table cells */
	    "padding": "0",
	    "margin": 0,
	    "border-spacing": 0, /* Removes any default spacing between cells */
	},
})
export class InnerTableElement extends VElementTagMap.table {
	
	// Constructor.
	constructor(...content: any[]) {
		
		// Initialize base class.
		super({
			derived: InnerTableElement,
		});

		// Append content.
		this.append(...content);
	}
}
export const InnerTable = Elements.wrapper(InnerTableElement);
export const NullInnerTable = Elements.create_null(InnerTableElement);
declare module './any_element.d.ts' { interface AnyElementMap { InnerTableElement: InnerTableElement }}

// Table data element.
@Elements.create({
    name: "TableElement",
    default_style: {},
})
export class TableElement extends VElementTagMap.div {
	
	// Attributes.
	public table_rows: TableRowElement[];
	public show_columns: boolean;
	public table: InnerTableElement = NullInnerTable();
	public table_head: TableHeadElement = NullTableHead();
	public table_body: TableBodyElement = NullTableBody();
	
	// Constructor.
	constructor({
		rows = [
			["a", "b"],
			["c", "d"],
		],
		columns = ["Column 1", "Column 2"],
		show_columns = true,
	}: {
        rows?: AppendType[][],
        columns: AppendType[] | boolean,
		show_columns?: boolean,
	}) {
		
		// Initialize base class.
		super({
			derived: TableElement,
		});

		// Attributes.
		this.table_rows = [];
		this.show_columns = show_columns === true && columns !== false;
	
		// Append content.
		this.create({rows, columns: columns === false ? [] : columns as string[]});
		this.overflow("hidden") // without overflow hidden when border radius is set on the element the background of rows can overflow.
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
				})
				++column_index;
			})
			++row_index;
		})
		return this;
	}

	// Iterate table rows.
	iterate_rows(callback: (row: TableRowElement, index: number, is_last: boolean) => void) {
		let index = 0;
		this.table_rows.iterate(e => {
			callback(e, index, index === this.table_rows.length - 1)
			++index;
		});
		return this;
	}

	// Create the table.
	create({rows, columns}: {
		rows?: AppendType[][],
        columns: AppendType[],
	}) {
		// if (!Array.isArray(rows)) {
		// 	console.error(`Invalid type "${Scheme.value_type(rows)}" for parameter "rows" the valid type is "array".`)
		// 	return this;
		// }
		if (!Array.isArray(columns)) {
			console.error(`Invalid type "${Scheme.value_type(columns)}" for parameter "columns" the valid type is "array".`)
			return this;
		}
		// console.log(columns, rows)
		return this.append(
			this.table = InnerTable(
				this.show_columns
					? this.table_head = TableHead(
							TableRow(
								columns.map(column => TableHeader(column).padding(0).text_leading())
							)
							.exec(e => this.table_rows.append(e))
						)
						.parent(this)
					: null,
				this.table_body = TableBody(
					!Array.isArray(rows)
						? null
						: rows.map(row => 
							TableRow(
                                row.map(column => TableData(column).padding(0))
							)
							.exec(e => this.table_rows.append(e))
						)
				)
				.parent(this),
			)
			.width("100%")
		)
	}

	// Set borders.
	borders(...values: (string | number)[]) : this {
		// @ts-ignore
		this.border(...values);
		this.iterate(({row, column, is_last_column, is_last_row}) => {
			if (!is_last_column) {
				column.border_right(...values)
			}
			if (!is_last_row) {
				column.border_bottom(...values)
			}
		})
		return this;
	}

	// Set header background.
	head_background(value: string) : this {
		if (this.table_head) {
			this.table_head.background(value)
		}
		return this;
	}

	// Set padding on the table headers and table data's.
	column_padding(...values: (string | number)[]) : this {
		return this.iterate(({column}) => {
			column.padding(...values);
		})
	}
	cell_padding(...args: (string | number)[]): this {
		return this.iterate(({column}) => {
			column.padding(...args);
		})
	}
    row_padding(...args: (string | number)[]): this {
        return this.iterate_rows((row) => {
            row.padding(...args as [any, any]);
        })
    }

	// Set column widths.
	column_widths(...widths: (string | number)[]): this {
		this.table.style.tableLayout = "fixed";
		let i = 0;
		this.iterate(({column}) => {
			column.width(widths[i]);
			++i;
		})
		return this;
	}
}
export const Table = Elements.wrapper(TableElement);
export const NullTable = Elements.create_null(TableElement);
declare module './any_element.d.ts' { interface AnyElementMap { TableElement: TableElement }}
