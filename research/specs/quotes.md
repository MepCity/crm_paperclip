# Quotes — functional spec (MEP-1435)

Sources: read-only captures `quotes-list`, `quotes-create`, `m4c-card-quotes` (research workspace), module metadata (fields, layouts, views, related lists). The reference organisation currently holds **no quote records**, so the list empty state and the create form were captured; the record detail, convert dialog and print preview could not be observed without creating data (see Open questions). Nothing was written in the reference.

## 1. List screen (empty state observed)
1. Page title "Quotes" top-left; global search and shell as in other modules.
2. Empty state (no records): left block with heading "Manage customer quotes", a one-sentence description (agreements to deliver requested products at an agreed price within a time frame), two primary buttons: **Create** and **Import**.
3. Right block: promotional "automate with CPQ" card with a link and an outlined button (do not rebuild; vendor upsell). A collapsible side tab sits on the right edge.
4. A Finance-suite promo strip appears in the filter area ("try Finance Suite … Books / Expense / Billing / Inventory", "Get started", "Don't show again") — not rebuilt.
5. System views (metadata): **All Quotes** (default, `ALLVIEWS`), **My Quotes** (`MYVIEWS`), **All Locked Quotes**. Same list chrome as Leads/Deals (view selector, filter sidebar, column picker, sort, mass actions) — reuse the shared list component.
6. Populated list columns, sort and mass-action menu: not observable (empty). Assume default columns: Quote Number? Subject, Stage, Account, Contact, Deal, Grand Total, Owner, Created Time — **unverified**.

## 2. Create / edit form ("Create Quote")
Header: title "Create Quote", link "Edit page layout" (do not rebuild), buttons **Cancel**, **Save and New**, **Save** (primary).
Section **Quote Information** (two columns of label/input pairs):
1. Quote Owner — owner lookup, default current user, required-look-up icon button.
2. Subject — text, **required** (red left bar).
3. Quote Stage — picklist, default `Draft`.
4. Team (label "Team Name") — text.
5. Carrier — picklist, default first value `FedEX`.
6. Deal Name — lookup (Deals) with icon button.
7. Valid Till — date, placeholder `DD.MM.YYYY`.
8. Contact Name — lookup (Contacts).
9. Account Name — lookup (Accounts), **required**.
Section **Address Information**: "Copy Address" control; Billing group (Country picklist default "-None-", Flat/House No/Building, Street, City, State picklist, Postal Code, Coordinates) with "Clear All"; Shipping group identically with its own "Clear All".
Section **Quoted Items** (line-item table, required — at least one row): columns Serial Number, Product Name (lookup), Quantity, List Price (TL), Amount (TL), Discount (TL), Tax (TL), Total (TL), then row actions; button **Add row**. Totals block under the table: **Sub Total, Discount, Tax, Adjustment (labelled "Rounding" in the Turkish UI), Grand Total** (currency in header unit "(TL)").
Sections **Terms and Conditions** (textarea) and **Description Information** (textarea). Footer "Create Form Views / Standard view / custom form page" is layout tooling — not rebuilt. A side tab "Client Script" is tooling — not rebuilt.
Page-load errors in the reference console are harmless to behaviour.

## 3. Line-item behaviour (from metadata; popups not opened because Cancel-only capture of dynamic popups was impossible without a populated row)
- Row fields: Product (lookup, required), Description, Quantity (double), Price Book (optional lookup — hidden/empty here), List Price (currency), Total = Quantity × List Price (formula, read-only), Discount (currency amount per row), Total After Discount = Total − Discount (formula), Tax (currency, per-row total), Net Total = Total After Discount + Tax (formula), Line Tax (per-tax breakdown list: one entry per tax name with percentage and amount).
- Header: Sub Total = Σ row Total After Discount? (formula; exact definition in Open questions), Discount (header currency field), Tax (header currency), Adjustment (currency, signed, user-entered), Grand Total = Sub Total − Discount + Tax + Adjustment.
- Tax is per-row via Line Tax; header Tax is the sum. Product's Tax multi-select supplies defaults (see `products-lookup.md`).

## 4. Fields (metadata, neutral names)
| Field | Type | Req | Notes |
|---|---|---|---|
| Quote Number | autonumber | | read-only, system |
| Subject | text(120) | yes | |
| Deal | lookup Deals | | |
| Quote Stage | picklist | | Draft, Negotiation, Delivered, On Hold, Confirmed, Closed Won, Closed Lost |
| Valid Till | date | | |
| Team | text(120) | | |
| Contact | lookup Contacts | | |
| Carrier | picklist | | FedEX, UPS, USPS, DHL, BlueDart |
| Account | lookup Accounts | yes (layout) | |
| Owner / Created By / Modified By | owner lookup | | |
| Created Time / Modified Time / Last Activity Time | datetime | | |
| Sub Total | formula currency | | read-only |
| Discount, Tax, Adjustment | currency | | |
| Grand Total | formula currency | | read-only |
| Terms and Conditions, Description | textarea(32000) | | |
| Tag | text | | |
| Quoted Items | subform | yes | see `Quoted_Items` rows above |
| Billing/Shipping address parts | text/picklist (country, state), lat/long double, coordinates | | |
| Locked, Connected To | boolean / multi-module lookup | | system |
Line item module fields: sequence number, parent quote (required), product (required), description, quantity, price book, list price, total, discount, total after discount, tax, net total, line tax.

## 5. Record detail (not observed)
Related lists in metadata (order): Connected Records, Review Processes, Notes, Review Logs, Sales Orders, Attachments, Calls, Events, Tasks, Tasks History, Events History, Calls History, Emails, Checklists, Locking Information, Email Drafts. Standard detail chrome (header actions Edit/Send Mail/Convert/Print/More, Overview/Timeline tabs, line-item table with totals) assumed identical to other modules — **unverified**.

## 6. Conversion and related modules
- A "Sales Orders" related list exists on Quotes: Quote → Sales Order conversion exists (noted only, out of scope). No Quote → Invoice conversion appears in metadata: the Invoice's lookup is to Sales Orders, not Quotes. **Quote → Invoice direct conversion is therefore not confirmed.**
- Quotes do not require Price Books or Vendors; Price Book is an optional line lookup. Sales Orders only required for the chain Quote → Order → Invoice.

## 7. Related cards on Account / Contact / Deal
Capture `m4c-card-quotes` and `m2d2-card-invoices` confirm "Quotes" and "Invoices" related-list entries in the detail sidebars; column sets could not be read (empty).

## Open questions
1. Populated list columns/sort and mass-action menu.
2. Record detail layout, header buttons, Convert / Print / PDF preview.
3. Exact Sub Total definition (net of row discounts?) and rounding; discount by percent vs amount; header-level discount/tax popups.
4. Quote → Invoice conversion: does it exist, and mapping. Needs a write window or documentation.
5. Related-card columns and buttons on Account/Contact/Deal.
