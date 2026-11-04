# Invoices — functional spec (MEP-1435)

Sources: captures `invoices-list`, `invoices-create`, `m2d2-card-invoices`; module metadata. No invoice records exist in the reference; only the empty list and create form were observed. No write happened.

## 1. List (empty state)
1. Title "Invoices"; heading "Create Invoices"; text: invoices are bills issued by a seller for goods/services at delivery. Buttons **Create**, **Import**. Finance-suite promo strip (not rebuilt).
2. System views: **All Invoices**, **My Invoices**, **All Locked Invoices**. Populated columns/sort/mass actions unobserved (assume Subject, Status, Account, Invoice Date, Due Date, Grand Total, Owner — unverified).

## 2. Create / edit form ("Create Invoice")
Header: title, "Edit page layout" link (not rebuilt), **Save**, **Save and New**, **Cancel**.
Section **Invoice Information**: Invoice Owner (owner lookup), Subject (text, **required**), Invoice Date (date), Due Date (date), Purchase Order (text), Sales Order (lookup Sales Orders), Excise Duty (currency), Sales Commission (currency), Status (picklist: Created, Approved, Delivered, Cancelled), Account Name (lookup, **required**), Contact Name (lookup), Deal Name (lookup, system field). Account is marked required in the layout.
Section **Address Information**: same billing/shipping block as Quotes (Copy Address, Clear All).
Section **Invoiced Items**: same line-item table as Quotes (Serial Number, Product Name, Quantity, List Price, Amount, Discount, Tax, Total, Add row) and totals Sub Total / Discount / Tax / Adjustment (Rounding) / Grand Total. Required (>= 1 row).
Sections Terms and Conditions, Description Information.

## 3. Fields (metadata)
Invoice Number (autonumber, read-only), Subject (req), Sales Order (lookup), Invoice Date, Purchase Order (text), Due Date, Excise Duty (currency 2dp), Sales Commission (currency 2dp), Status (Created/Approved/Delivered/Cancelled), Account (lookup, req in layout), Contact (lookup), Deal (lookup), Owner/Created By/Modified By, timestamps, Sub Total & Grand Total (formula, read-only), Discount/Tax/Adjustment (currency), Terms, Description, Tag, Invoiced Items (subform, req), billing/shipping address parts, Locked, Connected To. Line items identical in shape to Quoted Items (parent = Invoices).
Calculation rules: see `quotes.md` section 3.

## 4. Record detail (unobserved)
Related lists: Connected Records, Review Processes, Notes, Review Logs, Attachments, Tasks, Events, Calls, histories, Emails, Checklists, Locking Information, Email Drafts. No Quotes lookup on the invoice: conversion source is Sales Order only.

## 5. Related cards
Invoices card exists on Account/Contact/Deal sidebars (capture `m2d2-card-invoices`); columns unobserved.

## Open questions
Populated list/detail/print preview, status colouring, whether Quote → Invoice conversion exists (metadata suggests only Sales Order → Invoice), card columns.
