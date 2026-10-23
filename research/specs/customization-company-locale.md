# Customization — Company details and currencies (R2)

## Purpose and status

Research the initial read-only Company Details and Currencies screens for
organization locale and currency configuration. This research is intended to
inform MEP-496 and ADR 0011. **Incomplete: no target screen was captured.**
No implementation or locale decision should be derived from this document.

Module 2+ parity applies: control inventory and observed behaviour, without
pixel measurements, styling metrics or frontend request shapes. Editors,
activation controls, currency creation, exchange-rate updates and persisted
preferences are outside the authorized inspection scope.

## Evidence and capture refs

- Existing R1 evidence: `m11r1-modules-base/controls.json` exposes a Company
  Settings navigation link to `/crm/<org>/settings/company-details`. This
  verifies a navigation destination only, not the target screen's content.
- R2 attempt: `captures/m11r2-company-details/`, 2026-10-23.
  Its only output is `progress.json`. The capture attached to the browser,
  acquired a capture page, enabled its cache and reached the `goto` stage.
  Navigation exceeded the tool's 90-second load timeout and exited with error.
- No `screenshot.png`, `aria.yml`, `page.txt`, `controls.json`, `network.json`
  or `meta.json` was produced for this attempt. The paint gate cannot pass.
  The failed attempt is diagnostic evidence, never an empty-state reference.
- Exactly one capture attempt was made for Company Details. No click, hover,
  toggle, field entry, editor, preference change or browser-tab closure was
  requested. No Currencies attempt was made: its initial navigation destination
  was not established from the available evidence.

## Layout

Unobserved for both target screens. Existing settings-shell evidence in
`customization-modules-fields.md` is not proof of these screens' layout.

## Control inventory

There is no accepted target screenshot or control export. Therefore no target
controls can be numbered or reconciled. Zero inventoried controls means
**unobserved**, not that these screens contain no controls. The full visible
shell, utility strip and content inventory remains required on successful
capture.

## Fields

The requested research covers country/locale, time zone, date and number
formats, home currency and the currency list. Their presence, labels, types,
formatting, grouping and read-only presentation remain unverified. No actual
company, address, account or customer values are retained here.

## Actions

Only initial page or tab navigation is authorized. Edit, Save, Add, Enable,
exchange-rate updates and on/off controls must remain untouched. No target
action or destination was observed successfully.

## Filters / views / sorting / search

Unobserved. No filter, sort, search, view or saved preference was operated.

## Flows and safety verification

The sole attempted flow was direct navigation to the previously evidenced
Company Settings destination through the capture tool. It timed out before
producing inspectable screen evidence. No guards were changed and no requests
were replayed. This is a tool/navigation failure, not observed product error
behaviour.

The requested non-GET audit is **unavailable**, because neither `network.json`
nor `meta.json` exists. There is no evidence of a reference write in the
available output; absence of those logs cannot establish that no non-GET
request occurred. Blocked-request counts and successful non-GET classifications
must not be reported as zero. No further live capture is attempted in this run.

## Open questions

1. What caused the initial Company Details load timeout, and can another
   bounded read-only attempt be authorized after the access/tool issue is
   resolved? Owner for access/scope escalation: CTO.
2. What is the safe initial Currencies navigation link or tab? Do not infer a
   route or open an editor to discover it.
3. Which locale and formatting fields appear on the initial read-only page,
   and which are organization-level versus user-level? No decision for
   MEP-496 or ADR 0011 is established by this failed attempt.
4. How are the home currency, active currencies and rates displayed? Which
   controls are visible without opening a write-capable editor?
5. Save-dependent validation, activation, exchange-rate updates and success
   or error outcomes are not observable within this read-only scope.
6. The numbered screenshot inventories and non-GET audit remain outstanding;
   they require valid capture evidence before UI Lead approval.

## Verification and handoff

Verified the prior navigation evidence and the failed capture's output-file
list. Documentation checks: neutral wording, no copied customer values and
`git diff --check`. No application code changed; application tests are not
applicable. `docs/parity-checklist.md` is unchanged. This is an incomplete
research record to support an access escalation, not an approval-ready spec.
