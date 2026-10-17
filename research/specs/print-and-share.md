# Print, Share and Drafts

Status: partial research for MEP-629. Drafts initial empty states are observed
in all four modules; Leads sharing initial state is observed; print destinations and other module
sharing states remain unverified.
Screenshots and accessibility snapshots were inspected on 2026-10-15.
No print dialog, send operation or reference write was performed.

## Purpose and layout

Study record Print Preview, list Print View, record Share and module Drafts for
Leads, Contacts, Accounts and Deals. Entry points sit in the upper-right Actions
or record More menu. Drafts content is observed below; print and sharing
destination layouts remain unobserved.

## Observed control inventory

| ID | Position / state | Control and observed behaviour | Source / owner |
| --- | --- | --- | --- |
| PS-01 | Leads record header, upper right | More menu is open beside primary record actions. | `w2f-detail-more` / record detail |
| PS-02 | Record More menu, after Clone | Share entry is visible. Leads initial dialog observed below; permission outcomes unverified. | `w2f-detail-more` / Share |
| PS-03 | Record More menu, below Delete and a separator | Print Preview entry is visible. Destination not observed. | `w2f-detail-more` / Print |
| PS-04 | List toolbar, upper right | Actions opens the module menu. | Four Actions captures below / module list |
| PS-05 | Actions menu, below Manage Tags | Drafts is a module-scoped navigation link in all four modules. | Four Actions captures / Drafts |
| PS-06 | Actions menu bottom, Leads / Contacts / Accounts tables | Print View has a right-facing submenu indicator. Submenu observed below; destination unobserved. | Three table Actions screenshots / Print |

Deals was already in stage-board view. Its open Actions menu ends after Export
Deals and has no visible Print View entry. Do not infer its table view behaviour
or change the user's saved view to obtain it.

## Drafts initial empty state (all four modules)

`m6-leads-drafts`, `m6-contacts-drafts`, `m6-accounts-drafts` and
`m6-deals-drafts` each open a full content page in the app shell. A back arrow,
Drafts title and information icon occupy the header left; Help is on the right.
An expanded Criteria card contains a numbered criterion, field selector showing
None, a second None selector with disabled styling, a disabled value textbox,
a green plus control and a disabled Search button. Hide with a chevron is at
the card top right; it was not pressed because persistence was not established.
Below is a separate empty results card with the short status No records available.
No result headers, row actions or send controls are visible in this empty state.

| ID | Position | Control / purpose | Initial state |
| --- | --- | --- | --- |
| PS-07 | Header left | Back navigation | Visible; not exercised |
| PS-08 | Beside title | Information icon | Visible; tooltip not inspected |
| PS-09 | Header right | Help | Visible; not opened |
| PS-10 | Criteria card top right | Hide / chevron | Expanded panel; never toggled |
| PS-11 | Criteria row left | Number textbox | Shows first criterion index |
| PS-12 | Criteria row | Field selector | None |
| PS-13 | After field selector | Operator selector | None; disabled-looking |
| PS-14 | After operator | Value textbox | Disabled |
| PS-15 | Row right | Plus icon | Additional criterion affordance; not pressed |
| PS-16 | Under criterion row | Search | Disabled |

## Print View submenu (Leads, Contacts and Accounts)

In `m6-leads-print-menu`, `m6-contacts-print-menu` and
`m6-accounts-print-menu`, hovering Print View opens a compact submenu to the left
of the Actions menu.
The first row is Print Default view and the second is Print Using Canvas with
an accent marker. These are action entries; neither was activated in these three submenu captures. The later bounded Leads Default view attempt is recorded below. The capture
therefore proves submenu structure, not whether either opens a preview page or
immediately requests the browser print dialog. That distinction must be resolved
before activation because this task excludes the print dialog.

| ID | Position | Control / purpose | Observation |
| --- | --- | --- | --- |
| PS-17 | Actions menu bottom | Print View | Hover opens left-side submenu |
| PS-18 | Submenu top | Print Default view | Visible; not activated |
| PS-19 | Submenu bottom | Print Using Canvas | Visible; not activated |

## Fields and flows

Drafts links carry module context. All four observed destinations are naturally
empty. Populated-result columns and row actions are therefore unverified. Leads sharing controls are described below. Recipient suggestions, access-level
options, notifications, permissions, validation and confirmation remain unknown. Print layout, section selection, controls,
new-window behaviour and pagination remain unknown.

Safe continuation: open each module's Drafts route through its visible link;
open record More and the named Share / Print Preview entry only when permitted
by the capture guard. Inspect Print View submenu before any item selection.
Never open the browser print dialog, submit sharing, send a draft or change a
persisted preference. Capture each initial state before Escape.

## Capture refs

- `m6-csv-leads-actions`, `m6-csv-contacts-actions-retry`,
  `m6-csv-accounts-actions-retry`, `m6-csv-deals-actions` (2026-10-14)
- `w2f-detail-more` (2026-10-09; inherited Leads detail evidence)
- `m6-leads-drafts`, `m6-contacts-drafts`, `m6-accounts-drafts`,
  `m6-deals-drafts` (2026-10-15; fresh empty-state evidence)
- `m6-leads-print-menu`, `m6-contacts-print-menu`, `m6-accounts-print-menu`
  (2026-10-15; hover submenu evidence and standalone `inventory.md`)

## Open questions

1. Print Preview initial page/window and every control in all four modules.
2. Print View destination and Deals table availability without a view change;
   the submenu is now observed in Leads, Contacts and Accounts.
3. Share initial state in Contacts, Accounts and Deals; Leads is observed below.
   No sharing may be submitted.
4. Drafts populated-result columns and row actions; initial empty states are
   observed in all four modules without creating drafts.
5. See each capture folder’s `inventory.md` and the shared shell inventory
   in [tags.md](tags.md#shared-shell-control-inventory). No populated Drafts state
   can be manufactured under the read-only rule.
6. If an opening fails, follow the MEP-765 stop conditions and route the
   evidence to Platform Lead; do not substitute a selector to bypass a guard.

## Capture tool boundary

MEP-765 clarifies that Print text is not blocked by the dangerous-text guard.
The approved capture tool replaces `window.print` with a counter, records and
refuses `window.open`, and closes popups. The bounded Print Preview and Print
Default view clicks are permitted under those guards; Print Using Canvas is
excluded. This permission establishes no print destination layout.

If a destination opens in the current tab, its screenshot and final route are
evidence. If it requests another window, record that fact from `openRequests`;
never navigate to its sanitized `:id` address or infer the hidden print layout.
A nonzero `printCalls` count is a suppressed call, not proof of an opened browser
print dialog. No browser print dialog may be opened.

The approved list-to-record path, ready probe, preflight and stop conditions are
summarized in [tags.md](tags.md#current-research-continuation). Share still permits
only its initial exact-name opening and Escape. No recipient or permission field
may be changed and no sharing may be submitted. The remaining initial states
are unobserved; this spec remains partial.

## MEP-779 evidence handoff

The existing per-state numbered inventories are preserved in
[m6-tags-print-share-recycle-inventory.md](m6-tags-print-share-recycle-inventory.md).
A fresh Leads Add Tags capture was completed on 2026-10-17. MEP-787 accepted
its blocked background requests as expected and authorized the remaining
bounded openings. The fresh `m6-leads-detail-more` capture completed successfully:
all 15 visible action entries are inventoried, and unique Share / Print Preview
selectors are available. Nineteen blocked POSTs match the approved background
baseline; no unexpected blocked path or new unblocked non-GET request occurred.
Zero print calls or window requests were recorded. This is menu evidence only.


## Leads Share initial state

Source: `m6-leads-share-v2/step-3.png` and `step-3.yml` (2026-10-17).
A modal titled Sharing Lead overlays dimmed record detail. A Help icon appears
beside the title. Record access type offers Private (checked) and Public
(unchecked). Beneath them, an empty Add members textbox sits beside a combobox
showing Full Access. With Related list is unchecked and has an information icon.
Cancel and disabled Share appear at the lower right. No visible close icon was
present in this viewport. No fields or options were changed; Escape closed the
modal and the capture reports no remaining visible dialog.

All nine modal controls are numbered in the shared evidence inventory. Twenty-one
blocked POSTs match the MEP-787 allowance: eighteen telemetry, three baseline
non-telemetry paths once each. No new unblocked non-GET request, print call or
window request. This establishes initial state only, not sharing outcomes.
The subsequent load of 101.77 delayed print captures until a later valid preflight.


## Print Preview bounded attempt (2026-10-17)

`m6-leads-print-preview-v2` is a tooling stop, not a preview observation.
Preflight passed: load 9.60, no capture lock, two page targets. One CDP attach
completed; ready passed without failed scripts. The record link and More Options
clicks completed. The exported Print Preview selector matched, but the tool
skipped its click because the element attributes triggered the dangerous-action
guard. No preview page was opened. Exit code zero does not override a skipped
step: the MEP-765 stop condition applies, and this one permitted attempt is
consumed. No retry or alternate selector is allowed without Platform Lead review.

Eighteen POSTs were blocked: fifteen telemetry plus the three detail-baseline
non-telemetry requests, each once. No unexpected blocked request or new unblocked
non-GET request occurred. Print calls, window requests, popups, downloads and
file choosers were all zero. The unchanged record menu remains the visible state;
its numbered inventory is reused rather than claiming a new preview inventory.
The independent Print Default view attempt is recorded separately below.


## Print Default view bounded attempt (2026-10-17)

Source: `m6-leads-print-default-v2`, step screenshots and metadata. Preflight
passed at load 9.87 with no lock and two page targets. Ready passed without
failed scripts; one CDP attach. Actions opened, Print View was hovered and
Print Default view was clicked. The capture guard recorded and refused one
new-window request. The current tab returned to the Leads list with the action
menu closed. No destination page or print controls were visible; no browser
print dialog opened (`printCalls=0`). The captured window address was not
navigated to, including its apparently static path. No retry was attempted.

Fifteen POSTs were blocked: thirteen telemetry and the two list-baseline legacy
requests, each once. No unexpected blocked path or new unblocked non-GET request;
zero popups, downloads and file choosers. The attempt establishes that this
entry requests another window under the guard, not the contents of that window.
Destination inspection requires a separate Platform Lead decision. Contacts and
Accounts destinations, and Deals table availability, remain unobserved.


## Reviewed print observation boundary (MEP-793, 2026-10-17)

Platform Lead reviewed the local tool and both bounded attempts. The Preview
selector exported by the menu is `[data-zcqa="print_preview"]`; Default view
is `[data-zcqa="canvas-print-default-action"]`. Preview was skipped because
the guard inspects attribute values as well as visible text. The earlier
MEP-765 statement about Print text does not exempt these attributes. No retry,
alternate selector or guard exception is approved.

Default view requests a static shell in a new window; the originating script
would populate it. Navigating directly to that shell is neither approved nor
evidence of the print layout. Request blocking and the print counter currently
apply only to the capture page, so permitting a popup would leave those
protections behind. There is no safe destination observation with this tool.

Both print destination layouts are explicitly outside this research pass and
remain open questions. Existing menu evidence is the deliverable for this
boundary. The same restriction applies to Contacts and Accounts: menu evidence
only; do not click Preview or Default view. Deals remains in its existing
stage-board state; do not switch views. No print destination is inferred.

The platform decision proposes an implementation using our own tokens; it does
not establish reference layout parity or grant board approval for a design
deviation. Any later destination-parity work needs the board decision and a
separate bounded tool change before further observation.
