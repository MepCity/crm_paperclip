# Recycle Bin

Status: ready for UI Lead review within the approved read-only boundary.
Initial populated screen observed on
2026-10-15; Search initial state observed on 2026-10-16. Filter execution and
a naturally empty state remain unverified.
No record was restored, deleted or selected; no preference was changed.

## Purpose and scope

Inspect deleted records available to the current user, including records from
Leads, Contacts, Accounts and Deals. The observed initial list combines record
types; it is not limited to the module from which Setup was opened.

## Layout and entry flow

Open the Setup navigation entry, then Recycle Bin under Data Administration.
`m6-setup` proves the navigation entry; `m6-recycle-bin` proves the destination.
The destination uses the Setup shell: settings navigation on the left, global
utilities at the top and a utility dock at the bottom. The content is a large
card with a title, Help, explanatory policy notices, action toolbar and table.

The top toolbar places Restore and Delete on the left and Empty Recycle Bin
on the right. A displayed range/count is above the table on the right. Headers
are an unlabelled selection column, Name, Type, Deleted By and Deleted Time,
with a funnel-shaped Search control at the far right. Each row has an unchecked
selection checkbox. Names, users, dates and other record values are intentionally
omitted from this spec. The content has its own vertical scroll container.

## Fields and control inventory

| ID | Position | Control | Initial state / observed purpose | Owner |
| --- | --- | --- | --- | --- |
| RB-01 | Settings sidebar top | Setup Home / back arrow | Return navigation; not exercised | Setup shell |
| RB-02 | Beside Setup Home | Settings customization icon | Preference affordance; never activated | Setup shell |
| RB-03 | Below Setup Home | Search | Settings navigation search; no input | Setup shell |
| RB-04 | Settings sidebar, Data Administration | Recycle Bin | Current selected navigation entry | Recycle Bin |
| RB-05 | Content header right | Help | Help navigation; not opened | Recycle Bin |
| RB-06 | Toolbar left | Restore | Visible outlined button; accessibility snapshot does not mark it disabled; no row selected | Recycle Bin |
| RB-07 | After Restore | Delete | Visible outlined destructive button; not marked disabled; never pressed | Recycle Bin |
| RB-08 | Toolbar right | Empty Recycle Bin | Visible outlined destructive button; not marked disabled; never pressed | Recycle Bin |
| RB-09 | Table header first column | Select all | Unchecked; never selected | Recycle Bin |
| RB-10 | Every visible row first column | Row selection checkbox | Unchecked; one control per visible row; never selected | Recycle Bin |
| RB-11 | Table header far right | Funnel / Search | Exported name Search; initial inline search rows observed on 2026-10-16 | Recycle Bin |
| RB-12 | Content right edge | Scroll container | Independent content scrolling; no sort/filter preference changed | Setup shell |

The capture folder's `inventory.md` separately numbers every visible row
checkbox, settings navigation entry and shell utility. Its sources are the
screenshot, accessibility snapshot and `controls.json`; nested duplicate DOM
nodes are counted as one control surface. Offscreen controls reported by the
accessibility tree are not asserted to be visible.

## Visible policy notices and action constraints

The screen describes a 60-day retention period followed by permanent removal.
It states that administrator profiles can permanently delete records, and that
other users can restore their own records and, with appropriate permission,
other users' records. A notice also describes a mass-restore restriction for
related child items while their parent remains in the bin. These are paraphrases
of visible explanatory notices, not verified action outcomes or API contracts.

No selected-row or confirmation state was manufactured. Initial buttons are
visible and not announced as disabled; that does not establish that invoking
them without a selection succeeds. No destructive action may be used to verify
validation. No filter, search value, sort or persisted preference was changed.

## Filters and empty state

The initial screen is naturally populated. No module dropdown is directly
visible before opening Search. The Search control was not activated in that initial capture. MEP-638 later
permitted one initial opening. That opening was successfully observed in
`m6-recycle-bin-search-cached`; its inline rows are described below. Visibility
persistence remains unknown; no criterion, module or search value was changed.
No records may be removed or restored to create an empty state.

## Capture refs

- `m6-setup` (2026-10-15; Setup navigation evidence)
- `m6-recycle-bin` (2026-10-15; initial populated list and `inventory.md`)
- `m6-recycle-bin-search-cached` (2026-10-16; initial inline Search rows,
  `step-1.png`, `step-1.yml` and `inventory.md`)

The capture's four blocked requests are automatic reminder/status and telemetry
requests. They are not evidence that a Restore/Delete operation was attempted.
Raw screenshots and record values remain in the local research workspace;
repository content describes structure only.

## Open questions

1. Search operator options, Type selector options and whether changing a selection
   persists a preference. Initial opening is now observed; no selector was opened
   or changed, and no search was submitted.
2. Module-specific filtered states for Leads, Contacts, Accounts and Deals.
3. Naturally empty state and its toolbar availability; not observable by creating
   or removing data under the read-only rule.
4. Selected-row enablement, confirmations, validation and restore/delete outcomes:
   not observable without a write; do not test them in the reference CRM.
5. Exact roles and permissions beyond the visible explanatory notices.
6. Row hover actions and offscreen pagination, if any; neither is inferred from
   unlabelled blank cells or the visible range/count.

## Search capture verification

The approved cached retry completed on 2026-10-16 with `ready.ok=true`,
`cacheEnabled=true`, no failed scripts and no skipped steps. Search opened once
and Escape was pressed. `dialogVisibleAfterClose=false` does not establish that
an inline panel collapsed. No file chooser, download, popup or print call
occurred. Four automatic reminder/status and telemetry POSTs were blocked; no
record operation was attempted. Browser page count was two before and after;
no tabs were closed by the analyst. This is initial-panel evidence only.

Raw images and per-state numbered inventories remain in the research workspace.
Historical failures are preserved in task attachments rather than repeated here.

## Initial Search state

Source: `m6-recycle-bin-search-cached/step-1.png` and `step-1.yml`.
Search expands two inline rows beneath the table headers and above records;
it is not a separate modal. Filters align with Name, Type, Deleted By and
Deleted Time. The existing toolbar and records remain visible. The first row
contains operators and a Search button at the far right; the second holds
values. No field was filled, no option menu was opened and Search was not
submitted. Escape is evidenced as pressed, but does not establish that an
inline panel collapses or that its visibility is persisted.

| ID | Position | Control | Initial observed state / constraint |
| --- | --- | --- | --- |
| RB-13 | Name column, first search row | Operator combobox | `contains`; options unobserved |
| RB-14 | Name column, second search row | Textbox | Empty; no input |
| RB-15 | Type column, first search row | Operator combobox | `is`; options unobserved |
| RB-16 | Type column, second search row | Type combobox | `Select`; choices unobserved; no module selected |
| RB-17 | Deleted By column, first search row | Operator combobox | `contains`; options unobserved |
| RB-18 | Deleted By column, second search row | Textbox | Empty; no input |
| RB-19 | Deleted Time column, first search row | Operator combobox | `is`; options unobserved |
| RB-20 | Deleted Time column, second search row | Date textbox | Empty with `DD.MM.YYYY` placeholder |
| RB-21 | After date textbox | Time textbox | `01:00` with adjacent AM indicator; not changed |
| RB-22 | Far right of first search row | Search button | Visible primary button; never pressed |

A standalone numbered inventory in this capture folder includes the shell,
unchanged toolbar, visible row checkboxes and all ten additional controls.
Raw captures remain local because they contain customer data.

## MEP-779 evidence handoff

The existing per-state numbered inventories are preserved in
[m6-tags-print-share-recycle-inventory.md](m6-tags-print-share-recycle-inventory.md).
No fresh Recycle Bin capture was needed on 2026-10-17: the populated list and
initial Search state were already captured and inventoried. Those completed
observations were not repeated. Unknown filtered/empty/selected states remain
explicit open questions; no restore, delete, search submission or preference
change was attempted.
