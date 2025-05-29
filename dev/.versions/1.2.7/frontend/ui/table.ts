/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"
import { Scheme } from "../modules/scheme"
import { CreateVElementClass } from "./element"

// Table head element.
@Elements.register
export class TableHeadElement extends CreateVElementClass({
	type: "TableHead",
	tag: "thead",
	default_style: {
		"padding": "0px",
	},
}) {
	
	// Constructor.
	constructor(...content: any[]) {
		
		// Initialize base class.
		super();
	
		// Append content.
		this.append(...content);
	}
}
export const TableHead = Elements.wrapper(TableHeadElement);

// Table header element.
@Elements.register
export class TableHeaderElement extends CreateVElementClass({
	type: "TableHeader",
	tag: "th",
	default_style: {
		"text-align": "left",
		"padding": "0px 10px",
	},
}) {
	
	// Constructor.
	constructor(...content: any[]) {
		
		// Initialize base class.
		super();
	
		// Append content.
		this.append(...content);
	}
}
export const TableHeader = Elements.wrapper(TableHeaderElement);

// Table body element.
@Elements.register
export class TableBodyElement extends CreateVElementClass({
	type: "TableBody",
	tag: "tbody",
	default_style: {
		"padding": "0px",
	},
}) {
	
	// Constructor.
	constructor(...content: any[]) {
		
		// Initialize base class.
		super();
	
		// Append content.
		this.append(...content);
	}
}
export const TableBody = Elements.wrapper(TableBodyElement);


// Table row element.
@Elements.register
export class TableRowElement extends CreateVElementClass({
	type: "TableRow",
	tag: "tr",
	default_style: {
	},
}) {
	
	// Constructor.
	constructor(...content: any[]) {
		
		// Initialize base class.
		super();
	
		// Append content.
		this.append(...content);
	}
}
export const TableRow = Elements.wrapper(TableRowElement);

// Table data element.
@Elements.register
export class TableDataElement extends CreateVElementClass({
	type: "TableData",
	tag: "td",
	default_style: {
		"text-align": "left",
		"padding": "0px 10px",
	},
}) {
	
	// Constructor.
	constructor(...content: any[]) {
		
		// Initialize base class.
		super();
	
		// Append content.
		this.append(...content);
	}
}
export const TableData = Elements.wrapper(TableDataElement);

// Inner Table element.
// Use a container for the Table element so a border color + border radius can be set.
// Since border-collapse collapse prevents a border radius but is required for different background for the table head.
@Elements.register
export class InnerTableElement extends CreateVElementClass({
	type: "InnerTable",
	tag: "table",
	default_style: {
		"border-collapse": "collapse", /* Ensures there is no spacing between table cells */
	    "padding": "0",
	    "margin": 0,
	    "border-spacing": 0, /* Removes any default spacing between cells */
	},
}) {
	
	// Constructor.
	constructor(...content: any[]) {
		
		// Initialize base class.
		super();

		// Append content.
		this.append(...content);
	}
}
export const InnerTable = Elements.wrapper(InnerTableElement);


// Table data element.
@Elements.register
export class TableElement extends CreateVElementClass({
	type: "Table",
	tag: "div",
	default_style: {
		"color": "black",
	},
}) {

	// Attributes.
	public table_rows: TableRowElement[];
	public show_columns: boolean;
	
	// Constructor.
	constructor({
		rows = [
			[0, 1],
			[2, 3],
		],
		columns = ["Column 1", "Column 2"],
		show_columns = true,
	}: {
		rows: (number | string)[][],
		columns: string[] | boolean,
		show_columns: boolean,
	}) {
		
		// Initialize base class.
		super();

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
		rows: (number | string)[][],
		columns: string[],
	}) {
		if (!Array.isArray(rows)) {
			console.error(`Invalid type "${Scheme.value_type(rows)}" for parameter "rows" the valid type is "array".`)
			return this;
		}
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
								columns.iterate_append(column => TableHeader(column))
							)
							.exec(e => this.table_rows.append(e))
						)
						.parent(this)
					: null,
				this.table_body = TableBody(
					rows.iterate_append(row => 
						TableRow(
							row.iterate_append(column => TableData(column))
						)
						.exec(e => this.table_rows.append(e))
					)
				)
				.parent(this),
			)
			.width(100%)
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
