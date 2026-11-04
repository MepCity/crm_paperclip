# ADR 0016 — Products, Quotes and Invoices (line items, totals, conversion)

- Status: Accepted (CTO, 2026-11-04)
- Issue: MEP-1434; research MEP-1435 (`research/specs/quotes.md`, `invoices.md`, `products-lookup.md`)
- Scope: record storage, line-item shape, calculation rules, taxes, currency, Quote → Invoice conversion, print, CSV, related lists, out-of-scope modules

## Context
The board asked for Quotes and Invoices (2026-11-04). The reference organisation holds no quote, invoice or product records, so the research observed list empty states and create forms only; populated lists, detail pages, line-item popups, conversion and print preview stay unobserved. The metadata export gives every field, picklist and layout, but no formula expressions. All CRM modules (Leads … Cases, Solutions) run on the fixture record service (`packages/core/src/records`, README "Cases"/"Solutions" pattern); ADR 0012 Postgres record storage is not in place for any module yet.

## Decision

### 1. Modules and storage
Three new modules on the fixture record service, following the Cases/Solutions bundle pattern (metadata projection, picklists, views, seed, auto-number): **Products**, **Quotes**, **Invoices**. All exported fields are published; `Quote_Number` and `Invoice_Number` use the interim auto-number helper (start 1). Seeds: 30 products, 40 quotes, 30 invoices with synthetic data only, linked to seeded Accounts, Contacts and Deals, covering every stage/status. When record storage moves to Postgres these modules move with all others; nothing here pre-empts that.

### 2. Line items (subform)
`Quoted_Items` / `Invoiced_Items` are stored **inline on the parent record** as an ordered array (a new `subform` field family in the record contract; there is no separate line-item module, list or search). Row shape (API names from the export):
`id` (opaque, server-assigned), `Sequence_Number` (1..n, server-assigned in order), `Product_Name` (`{id, name}` reference to Products, required), `Description`, `Quantity` (> 0, up to 2 decimals), `List_Price` (≥ 0), `Total`, `Discount` (amount), `Total_After_Discount`, `Tax`, `Net_Total`, `Line_Tax` (array of `{name, percentage, value}`). Our extension: `Discount_Percentage` (number or null) so a percent discount survives quantity changes. `Price_Book_Name` is not published (§8). 1–200 rows; ≥ 1 row required on create/edit. Update replaces the whole array (rows keep `id` when sent back).

### 3. Calculation rules (server-authoritative)
One pure function in `packages/core` (`computeLineItemTotals`) is used by the service on every create/update and by the form for live preview; client-sent formula values are ignored. Each step rounds with `roundMoneyTwoDecimals`:
- `Total = Quantity × List_Price`
- Row discount: percent mode `Discount = Total × p / 100`; amount mode as entered; `0 ≤ Discount ≤ Total` (else `ValidationError`).
- `Total_After_Discount = Total − Discount`
- `Line_Tax[i].value = Total_After_Discount × percentage / 100`; `Tax = Σ Line_Tax.value`
- `Net_Total = Total_After_Discount + Tax`
- Header: `Sub_Total = Σ Net_Total`; header `Discount` (amount or percent of Sub_Total, same `Discount_Percentage` extension, `0 ≤ Discount ≤ Sub_Total`); header `Tax` = Σ over header tax selections of `(Sub_Total − Discount) × percentage / 100` (header taxes stored as `Header_Tax` array, our extension, default empty); `Adjustment` signed, user-entered; `Grand_Total = Sub_Total − Discount + Tax + Adjustment`.
Rationale: the reference's table shows Amount / Discount / Tax / Total per row, so the row Total is the net total and the Sub Total sums them; header tax then applies only to header-level selections, which avoids counting line tax twice.

### 4. Taxes
Organisation tax definitions `{name, percentage}` are fixture data: seeded `Sales Tax 0 %` and `Vat 20 %`, read-only (no Setup tax page in this feature; open question). `Products.Tax` is a multi-select of these names, displayed `Name - P %`. Picking a product on a line fills `Line_Tax` from the product's taxes when `Taxable` is true, empty otherwise; the user can change line taxes in the row tax popup.

### 5. Currency
Single currency TRY, symbol `TL`, 2 decimals, Turkish separators, through the existing currency formatting (`settings-currencies`). Column headers show the unit `(TL)`. No multi-currency.

### 6. Product selection on a line
Choosing a product fills `List_Price` from `Unit_Price`, `Description` from the product description, `Quantity` 1 (only if empty), taxes per §4, and keeps an existing discount. Only `Product_Active = true` products are offered in the lookup. Deleting a product keeps line references (existing dangling-reference read policy).

### 7. Quote → Invoice conversion
The board asked for it; the metadata only shows Quote → Sales Order and Sales Order → Invoice, and Sales Orders are out of scope. Decision: the quote detail **Convert** action offers **Invoice** only. It opens a confirmation dialog and creates one invoice in one atomic write: copies Subject, Account, Contact, Deal (`Deal_Name__s`), Owner, both addresses, Terms_and_Conditions, Description, all line items (new row ids, recomputed), header Discount / Header_Tax / Adjustment; sets `Status = Created`, `Invoice_Date = today`. The quote is not changed. The new invoice opens afterwards. No back-reference field is added (the reference has no Quote lookup on invoices).

### 8. Out of scope (with reason)
- **Price Books**: optional line lookup; list price comes from the product. Field not published.
- **Sales Orders, Purchase Orders, Vendors**: not needed for quoting or invoicing. `Invoices.Sales_Order` and `Products.Vendor_Name` are kept in metadata as unregistered references (existing Phase-2 reference policy) and hidden from forms and detail; the Quotes "Sales Orders" related list is not shown.
- Review processes, locking, email drafts related lists: not shown (no backing feature).

### 9. Detail, print, CSV, related lists
- Detail pages use the shared record detail (Overview, Timeline, related lists from metadata that have a backing feature: Notes, Attachments, Tasks, Events, Calls and histories, Emails) plus a read-only line-item table with the totals block.
- **Print preview**: a print route per quote/invoice renders a printable document (organisation name, record number, dates, billing/shipping, line table, totals, terms) and uses the browser's print / save-as-PDF. No server-side PDF.
- **CSV**: import and export through ADR 0005 for header fields only; line items are neither imported nor exported in this feature (open question). Imported quotes/invoices without lines are allowed only through import.
- **Related cards**: Quotes and Invoices related lists on Account, Contact and Deal detail via the existing related-module filters; Products detail shows Quotes and Invoices that contain the product.
- Navigation: Products, Quotes, Invoices tabs in the app shell module list.

## Consequences
- One new record-contract field family (`subform`) and one shared line-item editor/table component used by two modules.
- Our extensions (`Discount_Percentage`, `Header_Tax`) are not in the reference export; they stay internal fields.

## Open questions (do not block)
1. Populated list columns, detail header buttons, popups and print layout — check at the side-by-side review; reference has no records.
2. Exact reference formula for Sub Total and header tax (§3 is our decision).
3. Setup tax page; line items in CSV; quote stage effects (e.g. lock on Closed Won).
