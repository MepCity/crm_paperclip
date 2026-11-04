"use client";

import { formatCurrency, formatDate } from "@crm/core/format";
import type { RecordData } from "@crm/core/records";
import { fixtureCompanyDetails } from "@/modules/settings-company/fixture-port";
import type { ModuleScreenDefinition } from "@/modules/types";
import { PrintToolbar } from "./print-toolbar";
import "./print-page.css";

interface InventoryRecordPrintProps {
  orgSlug: string;
  definition: ModuleScreenDefinition;
  record: RecordData;
  orgFormat: import("@crm/core/format").FormatOptions;
}

interface LineItemRow {
  id?: string;
  Sequence_Number?: number;
  Product_Name?: { id?: string; name?: string } | string;
  Quantity?: number;
  List_Price?: number;
  Discount?: number;
  Tax?: number;
  Line_Tax?: readonly { name: string; percentage?: number }[];
  Total?: number;
  Net_Total?: number;
}

export function InventoryRecordPrint({ definition, record, orgFormat }: InventoryRecordPrintProps) {
  const isQuote = definition.apiName === "Quotes";
  const fields = record.fields;

  const recordNumber = (isQuote ? fields.Quote_Number : fields.Invoice_Number) as
    | string
    | undefined;
  const subject = (fields.Subject as string) ?? "";
  const companyName = fixtureCompanyDetails.name;

  const validTill =
    isQuote && fields.Valid_Till ? formatDate(fields.Valid_Till as string, orgFormat) : null;
  const invoiceDate =
    !isQuote && fields.Invoice_Date ? formatDate(fields.Invoice_Date as string, orgFormat) : null;
  const dueDate =
    !isQuote && fields.Due_Date ? formatDate(fields.Due_Date as string, orgFormat) : null;

  const billingStreet = (fields.Billing_Street as string) ?? "";
  const billingCity = [fields.Billing_City, fields.Billing_State, fields.Billing_Code]
    .filter(Boolean)
    .join(", ");
  const billingCountry = (fields.Billing_Country as string) ?? "";

  const shippingStreet = (fields.Shipping_Street as string) ?? "";
  const shippingCity = [fields.Shipping_City, fields.Shipping_State, fields.Shipping_Code]
    .filter(Boolean)
    .join(", ");
  const shippingCountry = (fields.Shipping_Country as string) ?? "";

  const rawLines = (isQuote ? fields.Quoted_Items : fields.Invoiced_Items) as
    | LineItemRow[]
    | undefined;
  const lines: LineItemRow[] = Array.isArray(rawLines) ? rawLines : [];

  const subTotal = (fields.Sub_Total as number) ?? 0;
  const discount = (fields.Discount as number) ?? 0;
  const tax = (fields.Tax as number) ?? 0;
  const adjustment = (fields.Adjustment as number) ?? 0;
  const grandTotal = (fields.Grand_Total as number) ?? 0;
  const terms = (fields.Terms_and_Conditions as string) ?? "";

  return (
    <div className="print-page" data-print-kind="inventory">
      <PrintToolbar
        title={subject || recordNumber || definition.singularLabel}
        moduleLabel={definition.singularLabel}
      />

      <div className="print-page__doc-header">
        <div>
          <div className="print-page__doc-org">{companyName}</div>
          <div className="mt-1 text-sm text-text-muted">{subject}</div>
        </div>
        <div className="print-page__doc-meta">
          <div className="print-page__doc-num">
            {isQuote ? "Quote" : "Invoice"} #{recordNumber ?? record.id}
          </div>
          {validTill && (
            <div className="mt-1 text-sm text-text-muted">
              <span className="font-medium">Valid Till: </span>
              {validTill}
            </div>
          )}
          {invoiceDate && (
            <div className="mt-1 text-sm text-text-muted">
              <span className="font-medium">Invoice Date: </span>
              {invoiceDate}
            </div>
          )}
          {dueDate && (
            <div className="text-sm text-text-muted">
              <span className="font-medium">Due Date: </span>
              {dueDate}
            </div>
          )}
        </div>
      </div>

      <div className="print-page__addresses">
        <div>
          <h3 className="font-semibold text-sm uppercase text-text-muted mb-2">Billing Address</h3>
          {billingStreet && <div>{billingStreet}</div>}
          {billingCity && <div>{billingCity}</div>}
          {billingCountry && <div>{billingCountry}</div>}
          {!billingStreet && !billingCity && !billingCountry && (
            <div className="text-text-muted italic text-sm">No billing address provided</div>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-sm uppercase text-text-muted mb-2">Shipping Address</h3>
          {shippingStreet && <div>{shippingStreet}</div>}
          {shippingCity && <div>{shippingCity}</div>}
          {shippingCountry && <div>{shippingCountry}</div>}
          {!shippingStreet && !shippingCity && !shippingCountry && (
            <div className="text-text-muted italic text-sm">No shipping address provided</div>
          )}
        </div>
      </div>

      <table className="print-page__table" aria-label="Line items">
        <thead>
          <tr>
            <th style={{ width: 48 }}>#</th>
            <th>Product Name</th>
            <th style={{ textAlign: "right", width: 80 }}>Quantity</th>
            <th style={{ textAlign: "right", width: 110 }}>List Price</th>
            <th style={{ textAlign: "right", width: 100 }}>Discount</th>
            <th style={{ textAlign: "right", width: 90 }}>Tax</th>
            <th style={{ textAlign: "right", width: 120 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => {
            const productName =
              typeof line.Product_Name === "object" && line.Product_Name !== null
                ? (line.Product_Name.name ?? line.Product_Name.id ?? "")
                : String(line.Product_Name ?? "");
            const qty = line.Quantity ?? 0;
            const price = line.List_Price ?? 0;
            const disc = line.Discount ?? 0;
            const lineTax = line.Tax ?? 0;
            const total = line.Net_Total ?? line.Total ?? 0;

            return (
              <tr key={line.id ?? index}>
                <td>{line.Sequence_Number ?? index + 1}</td>
                <td>{productName}</td>
                <td style={{ textAlign: "right" }}>{qty}</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(price, "TRY", orgFormat)}</td>
                <td style={{ textAlign: "right" }}>
                  {disc ? formatCurrency(disc, "TRY", orgFormat) : "-"}
                </td>
                <td style={{ textAlign: "right" }}>
                  {lineTax ? formatCurrency(lineTax, "TRY", orgFormat) : "-"}
                </td>
                <td style={{ textAlign: "right" }}>{formatCurrency(total, "TRY", orgFormat)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="print-page__totals">
        <table className="print-page__totals-table">
          <tbody>
            <tr>
              <td className="text-text-muted">Sub Total</td>
              <td style={{ textAlign: "right" }}>{formatCurrency(subTotal, "TRY", orgFormat)}</td>
            </tr>
            {discount > 0 && (
              <tr>
                <td className="text-text-muted">Discount</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(discount, "TRY", orgFormat)}</td>
              </tr>
            )}
            {tax > 0 && (
              <tr>
                <td className="text-text-muted">Tax</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(tax, "TRY", orgFormat)}</td>
              </tr>
            )}
            {adjustment !== 0 && (
              <tr>
                <td className="text-text-muted">Adjustment</td>
                <td style={{ textAlign: "right" }}>
                  {formatCurrency(adjustment, "TRY", orgFormat)}
                </td>
              </tr>
            )}
            <tr style={{ fontWeight: 600 }}>
              <td>Grand Total</td>
              <td style={{ textAlign: "right" }}>{formatCurrency(grandTotal, "TRY", orgFormat)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {terms && (
        <div className="print-page__terms">
          <h3 className="font-semibold text-sm uppercase text-text-muted mb-1">
            Terms &amp; Conditions
          </h3>
          <p className="whitespace-pre-wrap text-sm">{terms}</p>
        </div>
      )}
    </div>
  );
}
