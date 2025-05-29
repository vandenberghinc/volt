import { VElementTagMap, AppendType } from "../elements/module.js";
export declare class TableHeadElement extends VElementTagMap.thead {
    constructor(...content: any[]);
}
export declare const TableHead: <Extensions extends object = {}>(...args: any[]) => TableHeadElement & Extensions;
export declare const NullTableHead: <Extensions extends object = {}>() => TableHeadElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        TableHeadElement: TableHeadElement;
    }
}
export declare class TableHeaderElement extends VElementTagMap.th {
    constructor(...content: AppendType[]);
}
export declare const TableHeader: <Extensions extends object = {}>(...args: AppendType[]) => TableHeaderElement & Extensions;
export declare const NullTableHeader: <Extensions extends object = {}>() => TableHeaderElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        TableHeaderElement: TableHeaderElement;
    }
}
export declare class TableBodyElement extends VElementTagMap.tbody {
    constructor(...content: any[]);
}
export declare const TableBody: <Extensions extends object = {}>(...args: any[]) => TableBodyElement & Extensions;
export declare const NullTableBody: <Extensions extends object = {}>() => TableBodyElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        TableBodyElement: TableBodyElement;
    }
}
export declare class TableRowElement extends VElementTagMap.tr {
    constructor(...content: any[]);
}
export declare const TableRow: <Extensions extends object = {}>(...args: any[]) => TableRowElement & Extensions;
export declare const NullTableRow: <Extensions extends object = {}>() => TableRowElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        TableRowElement: TableRowElement;
    }
}
export declare class TableDataElement extends VElementTagMap.td {
    constructor(...content: any[]);
}
export declare const TableData: <Extensions extends object = {}>(...args: any[]) => TableDataElement & Extensions;
export declare const NullTableData: <Extensions extends object = {}>() => TableDataElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        TableDataElement: TableDataElement;
    }
}
export declare class InnerTableElement extends VElementTagMap.table {
    constructor(...content: any[]);
}
export declare const InnerTable: <Extensions extends object = {}>(...args: any[]) => InnerTableElement & Extensions;
export declare const NullInnerTable: <Extensions extends object = {}>() => InnerTableElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        InnerTableElement: InnerTableElement;
    }
}
export declare class TableElement extends VElementTagMap.div {
    table_rows: TableRowElement[];
    show_columns: boolean;
    table: InnerTableElement;
    table_head: TableHeadElement;
    table_body: TableBodyElement;
    constructor({ rows, columns, show_columns, }: {
        rows?: AppendType[][];
        columns: AppendType[] | boolean;
        show_columns?: boolean;
    });
    iterate(callback: any): this;
    iterate_rows(callback: (row: TableRowElement, index: number, is_last: boolean) => void): this;
    create({ rows, columns }: {
        rows?: AppendType[][];
        columns: AppendType[];
    }): this;
    borders(...values: (string | number)[]): this;
    head_background(value: string): this;
    column_padding(...values: (string | number)[]): this;
    cell_padding(...args: (string | number)[]): this;
    row_padding(...args: (string | number)[]): this;
    column_widths(...widths: (string | number)[]): this;
}
export declare const Table: <Extensions extends object = {}>(args_0: {
    rows?: AppendType[][];
    columns: AppendType[] | boolean;
    show_columns?: boolean;
}) => TableElement & Extensions;
export declare const NullTable: <Extensions extends object = {}>() => TableElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        TableElement: TableElement;
    }
}
