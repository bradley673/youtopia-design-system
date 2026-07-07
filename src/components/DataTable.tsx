import React from "react";

export interface Column<Row> {
  key: keyof Row & string;
  header: string;
  /** Right-align with tabular figures — use for money and other numerics. */
  numeric?: boolean;
  render?: (row: Row) => React.ReactNode;
}

export interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  /** Accessible caption describing the table. */
  caption?: string;
}

/**
 * Financial data table. Money is right-aligned with tabular figures so
 * columns line up; status belongs in a <Badge>, not a stray colour.
 */
export function DataTable<Row extends Record<string, unknown>>({ columns, rows, caption }: DataTableProps<Row>) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        {caption && <caption style={{ position: "absolute", left: -9999 }}>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c, ci) => (
              <th key={ci} className={c.numeric ? "num" : undefined} scope="col">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c, ci) => (
                <td key={ci} className={c.numeric ? "num" : undefined}>
                  {c.render ? c.render(row) : String(row[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
