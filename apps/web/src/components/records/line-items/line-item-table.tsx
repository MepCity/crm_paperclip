import { formatMoney } from "./money";
import "./line-items.css";

export interface LineItemTableProps {
  title: string;
  /** Rows exactly as stored on the record. */
  items: readonly Record<string, unknown>[];
  totals: {
    Sub_Total?: unknown;
    Discount?: unknown;
    Tax?: unknown;
    Adjustment?: unknown;
    Grand_Total?: unknown;
  };
}

const UNIT = "(TL)";
const num = (value: unknown): number | null => (typeof value === "number" ? value : null);

/** Read-only variant for detail pages. Server values are shown as stored. */
export function LineItemTable({ title, items, totals }: LineItemTableProps) {
  return (
    <div className="line-items line-items--readonly" data-testid="line-item-table">
      <table className="line-items__table" aria-label={title}>
        <thead>
          <tr>
            <th className="line-items__col-serial">Serial Number</th>
            <th className="line-items__col-product">Product Name</th>
            <th className="line-items__num">Quantity</th>
            <th className="line-items__num">List Price {UNIT}</th>
            <th className="line-items__num">Amount {UNIT}</th>
            <th className="line-items__num">Discount {UNIT}</th>
            <th className="line-items__num">Tax {UNIT}</th>
            <th className="line-items__num">Total {UNIT}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={String(item.id ?? index)}>
              <td className="line-items__col-serial">
                {String(item.Sequence_Number ?? index + 1)}
              </td>
              <td className="line-items__col-product">
                {(item.Product_Name as { name?: string } | null)?.name ?? ""}
              </td>
              <td className="line-items__num">{String(item.Quantity ?? "")}</td>
              <td className="line-items__num">{formatMoney(num(item.List_Price))}</td>
              <td className="line-items__num">{formatMoney(num(item.Total))}</td>
              <td className="line-items__num">{formatMoney(num(item.Discount))}</td>
              <td className="line-items__num">{formatMoney(num(item.Tax))}</td>
              <td className="line-items__num">{formatMoney(num(item.Net_Total))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="line-items__totals" aria-label="Totals">
        <div>
          <dt>Sub Total {UNIT}</dt>
          <dd data-total="sub">{formatMoney(num(totals.Sub_Total))}</dd>
        </div>
        <div>
          <dt>Discount {UNIT}</dt>
          <dd data-total="discount">{formatMoney(num(totals.Discount) ?? 0)}</dd>
        </div>
        <div>
          <dt>Tax {UNIT}</dt>
          <dd data-total="tax">{formatMoney(num(totals.Tax) ?? 0)}</dd>
        </div>
        <div>
          <dt>Adjustment {UNIT}</dt>
          <dd data-total="adjustment">{formatMoney(num(totals.Adjustment) ?? 0)}</dd>
        </div>
        <div className="line-items__grand">
          <dt>Grand Total {UNIT}</dt>
          <dd data-total="grand">{formatMoney(num(totals.Grand_Total))}</dd>
        </div>
      </dl>
    </div>
  );
}
