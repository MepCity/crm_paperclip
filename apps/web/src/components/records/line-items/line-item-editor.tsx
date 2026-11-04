"use client";

import { productLineDefaults } from "@crm/core/records/line-items";
import { useMemo } from "react";
import { Icons } from "@/components/ui/icon";
import {
  emptyRow,
  type HeaderState,
  type LineRow,
  liveTotals,
  MAX_LINE_ITEMS,
  parseNumber,
} from "./line-item-model";
import "./line-items.css";
import { formatMoney } from "./money";
import { DiscountPopup, TaxPopup } from "./popups";
import { ProductPicker } from "./product-picker";

export interface LineItemEditorProps {
  /** Heading of the unit column group, e.g. "Quoted Items". */
  title: string;
  rows: readonly LineRow[];
  header: HeaderState;
  disabled?: boolean;
  /** Error text keyed `Field`, `[i].Field` as the service returns them. */
  errors?: Readonly<Record<string, string>>;
  onRowsChange: (rows: LineRow[]) => void;
  onHeaderChange: (header: HeaderState) => void;
}

const UNIT = "(TL)";

export function LineItemEditor({
  title,
  rows,
  header,
  disabled,
  errors = {},
  onRowsChange,
  onHeaderChange,
}: LineItemEditorProps) {
  const live = useMemo(() => liveTotals(rows, header), [rows, header]);
  const totals = live.totals;

  function patch(index: number, change: Partial<LineRow>) {
    onRowsChange(rows.map((row, i) => (i === index ? { ...row, ...change } : row)));
  }
  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    const [moved] = next.splice(index, 1);
    if (moved) next.splice(target, 0, moved);
    onRowsChange(next);
  }
  const rowError = (index: number, field: string) => errors[`[${index}].${field}`];

  const subTotal = totals?.Sub_Total ?? null;
  const headerDiscountPreview =
    header.discountMode === "percent"
      ? subTotal !== null
        ? Math.round(subTotal * (parseNumber(header.discountValue) ?? 0)) / 100
        : null
      : (parseNumber(header.discountValue) ?? 0);

  return (
    <div className="line-items" data-testid="line-item-editor">
      <table className="line-items__table" aria-label={title}>
        <thead>
          <tr>
            <th className="line-items__col-handle" aria-hidden />
            <th className="line-items__col-serial">Serial Number</th>
            <th className="line-items__col-product">Product Name</th>
            <th className="line-items__num">Quantity</th>
            <th className="line-items__num">List Price {UNIT}</th>
            <th className="line-items__num">Amount {UNIT}</th>
            <th className="line-items__num">Discount {UNIT}</th>
            <th className="line-items__num">Tax {UNIT}</th>
            <th className="line-items__num">Total {UNIT}</th>
            <th className="line-items__col-actions" aria-hidden />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const computed = live.lines[index];
            return (
              <tr key={row.key} data-line-row={index}>
                <td className="line-items__col-handle">
                  <button
                    type="button"
                    className="line-items__reorder"
                    aria-label={`Move row ${index + 1} up`}
                    disabled={disabled || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="line-items__reorder"
                    aria-label={`Move row ${index + 1} down`}
                    disabled={disabled || index === rows.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </button>
                </td>
                <td className="line-items__col-serial">{index + 1}</td>
                <td className="line-items__col-product">
                  <ProductPicker
                    label={`Product Name ${index + 1}`}
                    value={row.product}
                    disabled={disabled}
                    invalid={Boolean(rowError(index, "Product_Name"))}
                    onPick={(product) => {
                      const defaults = productLineDefaults(product, {
                        Quantity: parseNumber(row.quantity) ?? undefined,
                      });
                      patch(index, {
                        product: defaults.Product_Name,
                        description: defaults.Description ?? "",
                        listPrice: String(defaults.List_Price),
                        quantity: String(defaults.Quantity),
                        taxes: (defaults.Line_Tax ?? []).map((tax) => tax.name),
                      });
                    }}
                  />
                  {rowError(index, "Product_Name") && (
                    <p className="line-items__error" role="alert">
                      {rowError(index, "Product_Name")}
                    </p>
                  )}
                </td>
                <td className="line-items__num">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="line-items__input line-items__input--num"
                    aria-label={`Quantity ${index + 1}`}
                    aria-invalid={Boolean(rowError(index, "Quantity")) || undefined}
                    disabled={disabled}
                    value={row.quantity}
                    onChange={(event) => patch(index, { quantity: event.target.value })}
                  />
                  {rowError(index, "Quantity") && (
                    <p className="line-items__error" role="alert">
                      {rowError(index, "Quantity")}
                    </p>
                  )}
                </td>
                <td className="line-items__num">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="line-items__input line-items__input--num"
                    aria-label={`List Price ${index + 1}`}
                    aria-invalid={Boolean(rowError(index, "List_Price")) || undefined}
                    disabled={disabled}
                    value={row.listPrice}
                    onChange={(event) => patch(index, { listPrice: event.target.value })}
                  />
                  {rowError(index, "List_Price") && (
                    <p className="line-items__error" role="alert">
                      {rowError(index, "List_Price")}
                    </p>
                  )}
                </td>
                <td className="line-items__num line-items__calc">
                  {formatMoney(computed?.Total ?? null)}
                </td>
                <td className="line-items__num">
                  <DiscountPopup
                    label={`Discount ${index + 1}`}
                    mode={row.discountMode}
                    value={row.discountValue}
                    amount={computed?.Discount ?? null}
                    disabled={disabled}
                    onChange={(next) =>
                      patch(index, { discountMode: next.mode, discountValue: next.value })
                    }
                  />
                  {(rowError(index, "Discount") || rowError(index, "Discount_Percentage")) && (
                    <p className="line-items__error" role="alert">
                      {rowError(index, "Discount") ?? rowError(index, "Discount_Percentage")}
                    </p>
                  )}
                </td>
                <td className="line-items__num">
                  <TaxPopup
                    label={`Tax ${index + 1}`}
                    selected={row.taxes}
                    amount={computed?.Tax ?? null}
                    disabled={disabled}
                    onChange={(taxes) => patch(index, { taxes })}
                  />
                </td>
                <td className="line-items__num line-items__calc">
                  {formatMoney(computed?.Net_Total ?? null)}
                </td>
                <td className="line-items__col-actions">
                  <button
                    type="button"
                    className="line-items__delete"
                    aria-label={`Delete row ${index + 1}`}
                    disabled={disabled}
                    onClick={() => onRowsChange(rows.filter((_, i) => i !== index))}
                  >
                    <Icons.close aria-hidden className="line-items__delete-icon" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {errors[""] && (
        <p className="line-items__error" role="alert">
          {errors[""]}
        </p>
      )}
      <button
        type="button"
        className="line-items__add"
        disabled={disabled || rows.length >= MAX_LINE_ITEMS}
        onClick={() => onRowsChange([...rows, emptyRow()])}
      >
        <Icons.plus aria-hidden className="line-items__add-icon" />
        Add row
      </button>
      <dl className="line-items__totals" aria-label="Totals">
        <div>
          <dt>Sub Total {UNIT}</dt>
          <dd data-total="sub">{formatMoney(subTotal)}</dd>
        </div>
        <div>
          <dt>Discount {UNIT}</dt>
          <dd data-total="discount">
            <DiscountPopup
              label="Discount"
              mode={header.discountMode}
              value={header.discountValue}
              amount={totals?.Discount ?? headerDiscountPreview}
              disabled={disabled}
              onChange={(next) =>
                onHeaderChange({ ...header, discountMode: next.mode, discountValue: next.value })
              }
            />
          </dd>
        </div>
        <div>
          <dt>Tax {UNIT}</dt>
          <dd data-total="tax">
            <TaxPopup
              label="Tax"
              selected={header.taxes}
              amount={totals?.Tax ?? null}
              disabled={disabled}
              onChange={(taxes) => onHeaderChange({ ...header, taxes })}
            />
          </dd>
        </div>
        <div>
          <dt>Adjustment {UNIT}</dt>
          <dd>
            <input
              type="text"
              inputMode="decimal"
              className="line-items__input line-items__input--num"
              aria-label="Adjustment"
              disabled={disabled}
              value={header.adjustment}
              onChange={(event) => onHeaderChange({ ...header, adjustment: event.target.value })}
            />
          </dd>
        </div>
        <div className="line-items__grand">
          <dt>Grand Total {UNIT}</dt>
          <dd data-total="grand">{formatMoney(totals?.Grand_Total ?? null)}</dd>
        </div>
      </dl>
    </div>
  );
}
