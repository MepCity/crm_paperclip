# Products and the line-item lookup — spec (MEP-1435)

Sources: captures `products-list`, `products-create`; Products metadata; currencies metadata. Product list is empty (empty state with Create / Import). No write happened.

## Product form ("Create Product")
Header: Edit page layout link, Cancel, Save and New, Save. Sections:
- **Product Image** (profile image upload).
- **Product Information**: Product Owner, Product Name (text, **required**), Product Code, Vendor Name (lookup Vendors), Product Active (checkbox), Manufacturer (picklist), Product Category (picklist: Hardware, Software, CRM Applications), Sales Start Date, Sales End Date, Support Start Date, Support Expiry Date.
- **Price Information**: Unit Price (labelled "List Price", currency 2dp), Tax (multi-select: org tax names with percent, e.g. a sales tax and a VAT entry, both 0.0 % here), Commission Rate, Taxable (checkbox).
- **Stock Information**: Usage Unit (picklist: Box, Carton, Dozen, Each, Hour(s), … ), Quantity in Stock, Handler (owner lookup), Quantity Ordered, Reorder Level, Quantity in Demand.
- **Description Information**: Description.
Other fields: Tag, Record Image, Locked, Connected To.

## Line-item product lookup
Line item `Product Name` is a lookup to Products (required); `Price Book` optional lookup (Price Books not needed to ship). Selecting a product fills List Price from Unit Price, quantity defaults to 1 and per-row tax from the product's Tax selection (assumed from documentation; popup unobserved because no products/rows exist).

## Tax handling
Taxes are org-level named percentages (Setup tax page not captured); products pick a subset; each line stores a Line Tax breakdown; header Tax is the sum. Taxable flag gates tax application (assumed).

## Currency
Single currency in metadata: Turkish Lira (TRY), symbol "TL" shown as prefix, 2 decimals, comma decimal separator, period thousands separator, exchange rate 1; currently marked inactive in the export. Currency columns show the unit in the header, e.g. "(TL)".

## Dependencies
Quotes/Invoices need Products (lookup) and Accounts; Price Books, Vendors, Purchase Orders are not required. Sales Orders required only as Invoice's optional lookup and Quote conversion target.

## Open questions
Lookup popup layout, qty/discount/tax popups, tax Setup page, product list columns, whether product selection overrides discount.
