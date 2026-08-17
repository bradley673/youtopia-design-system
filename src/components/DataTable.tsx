import React from "react";

export interface Column<Row> {
  key: keyof Row & string;
  header: string;
  /** Right-align with tabular figures — use for money and other numerics. */
  numeric?: boolean;
  render?: (row: Row) => React.ReactNode;
  /** Allow sorting on this column. Click the header to toggle asc/desc. */
  sortable?: boolean;
  /** Value used for sorting; defaults to the raw cell value. Nulls sort last. */
  sortValue?: (row: Row) => string | number | null;
}

export interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  /** Accessible caption describing the table. */
  caption?: string;
}

type SortState = { col: number; dir: "asc" | "desc" } | null;

/**
 * Financial data table. Money is right-aligned with tabular figures so
 * columns line up; status belongs in a <Badge>, not a stray colour.
 * Columns marked `sortable` get click-to-sort headers; the incoming row
 * order is the default until a header is clicked.
 */
export function DataTable<Row extends Record<string, unknown>>({ columns, rows, caption }: DataTableProps<Row>) {
  const [sort, setSort] = React.useState<SortState>(null);

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const col = columns[sort.col];
    if (!col) return rows;
    const val = (row: Row): string | number | null => {
      if (col.sortValue) return col.sortValue(row);
      const v = row[col.key];
      if (v === null || v === undefined || v === "") return null;
      return typeof v === "number" || typeof v === "boolean" ? Number(v) : String(v);
    };
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = val(a), vb = val(b);
      if (va === null && vb === null) return 0;
      if (va === null) return 1; // nulls always last
      if (vb === null) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: "base" }) * dir;
    });
  }, [rows, columns, sort]);

  const toggle = (col: number) => {
    setSort((s) => (s?.col !== col ? { col, dir: "asc" } : s.dir === "asc" ? { col, dir: "desc" } : null));
  };

  return (
    <div className="table-wrap">
      <table className="data-table">
        {caption && <caption style={{ position: "absolute", left: -9999 }}>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c, ci) => {
              const active = sort?.col === ci;
              const ariaSort = active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined;
              return (
                <th key={ci} className={c.numeric ? "num" : undefined} scope="col" aria-sort={ariaSort}>
                  {c.sortable ? (
                    <button type="button" className="th-sort" onClick={() => toggle(ci)}>
                      {c.header}
                      <span className="th-sort-arrow" aria-hidden="true">
                        {active ? (sort!.dir === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
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
