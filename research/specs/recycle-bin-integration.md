# Recycle Bin service integration

Implementation handoff for MEP-834. This supplements `recycle-bin.md` and ADR
0007's acceptance scope; it does not claim new reference CRM observations.

## Entry and ownership

The authenticated page is `/crm/{orgSlug}/settings/recycle-bin`. It uses the
existing settings layout. Settings navigation is owned by MEP-610 and is not
modified here. Only this new route, its actions, a dedicated adapter selector
and the Recycle Bin components/tests change.

Each server action resolves organization context anew. The fixture service
retains authority over visibility, restore validation and administrator-only
purge/empty. Restore invalidates the organization's layout; the bin reloads its
current query. The ordinary module list reads the same fixture store.

## QA inventory

The following are implementation evidence, awaiting independent QA sign-off.

| Control | Implemented behavior | Automated evidence |
| --- | --- | --- |
| RB-06 | Restore selected entry IDs; empty selection gives feedback; successful restore reloads | Page selection test, fixture module-list recovery test, action tests |
| RB-07 | Delete selected IDs only after confirmation; cancel writes nothing; failure stays retryable | Confirmation and denied-delete page test; action authorization error test |
| RB-08 | Separate explicit confirmation for all caller-visible entries, including other pages and entries outside the search; calls `empty()` without IDs | Empty confirmation page test; action empty-scope test |
| RB-09 | Select/deselect current page, mixed-selection indicator; reset on paging/search/successful mutation | Existing selection tests; page pagination test |
| RB-10 | Row selection by entry ID; disabled during a request | Existing keyboard test; pending-restore test |
| RB-11 | Funnel toggles two inline search rows | Search page test; existing initial-layout test |
| RB-12 | Bounded content with independently scrollable table | Existing scroll-region test; page container height |
| RB-13 | Name operator `contains` | Inline-search test; action query test |
| RB-14 | Name text sent as service `name` | Inline-search test; action query test |
| RB-15 | Type operator `is` | Inline-search test |
| RB-16 | Select/Leads/Contacts/Accounts/Deals; value sent as service `module` | Inline-search test; action query test |
| RB-17 | Initial `contains`; `is` available; nonempty `contains` explicitly rejected as unsupported | Inline-search test; unsupported-query action test |
| RB-18 | Actor text with `is` sent as exact service `deletedBy` | Action query test |
| RB-19 | Date operator `is` shown | Inline-search test |
| RB-20 | Date textbox with `DD.MM.YYYY`; filled date explicitly rejected until the service supports it | Inline-search test; unsupported-query action test |
| RB-21 | Initial `01:00 AM`; changed time explicitly rejected until the service supports it | Inline-search test; unsupported-query action test |
| RB-22 | Search submits the current draft at page 1, retaining values after submission | Inline-search test |

List totals and ranges come from the service. Previous/Next pass `page/perPage`
(30 per page). Removing the last entry on a later page returns to a valid page.
Request failures have visible feedback and retry; pending writes prevent duplicate
submission. Field errors survive the server action boundary.

## Explicit limits and gate questions

- Confirmation text, no-selection feedback, pagination controls and neutral empty
  message are our interim implementation. Reference confirmation, selected and
  empty states remain unobserved. Delete and Empty use the existing ConfirmDialog.
- The core query supports Name contains, Type equality and Deleted By exact actor
  ID only. It has no Deleted Time query and no actor-name/contains query. These
  unsupported criteria produce explicit errors rather than silently broadening
  the list. Platform Lead was asked to disposition the missing contract.
- Type choices are limited to this slice's four business modules. Additional
  module choices and reference operator menus remain unobserved.
- Deleted By currently displays the service actor identity. Friendly actor-name
  resolution and name-based matching need a service/identity contract decision.
- UTC dates are explicitly labelled UTC. Reference timezone and input-date/time
  matching semantics remain unknown; no local matching rule is invented.
- ADR 0007 gate questions remain open: exact grants/ownership, purge cadence,
  retained-history disposition and persistent storage. This remains fixture-only.

## Targeted checks

- `pnpm exec biome check apps/web/src/components/records/recycle-bin apps/web/src/lib/recycle-bin.ts 'apps/web/src/app/crm/[orgSlug]/settings/recycle-bin'`
- `node scripts/typecheck.mjs`
- `pnpm exec vitest run apps/web/src/components/records/recycle-bin`

No existing Recycle Bin e2e spec exists. The fixture-backed component test proves
restore-to-module-list recovery without editing shared module-list files.
