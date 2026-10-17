# Solutions

## Create and edit form

Research in progress for MEP-841. No completed Solutions form capture is available in this worktree yet. There is no observed SF inventory; reserve SF-01 onward for screenshot-backed controls. Do not treat the configuration below as a rendered form or copy the Cases field order into this module.

### Sources and limits

- M1: local metadata, `modules/Solutions/fields.json` and `layouts.json`, Standard layout. Configuration only.
- D1: reference CRM public help, **Working with Solutions**, Standard Fields in Solutions / Create Solutions Individually, read 2026-10-17. Locator: public help center → CRM → Customer Support → Working with Solutions. No external address is stored here.
- Shared form and validation reference: [record-detail.md](record-detail.md), Layout / Flows; [leads-write-behaviour.md](leads-write-behaviour.md). Nearest reusable controls: [accounts-form.md](accounts-form.md); Cases differences: [cases.md](cases.md).

### Form fields versus metadata

M1 defines 20 fields. Solution Number is an auto-number and read-only in the Standard layout. Solution Owner is an owner lookup, Product Name targets Products, Solution Title is text, Status is a picklist, and Question / Answer are multiline fields. These types do not prove their rendered positions or controls.

The field dictionary marks Solution Title as system mandatory; the Standard layout additionally marks Question and Answer required. D1 also describes all three as mandatory. Implementation must consider layout requirements as well as system requirements; visible markers and exact error behaviour remain unobserved.

Configured Status options are Draft, Reviewed, Duplicate; no open dropdown or default has been observed. Published exists as a boolean in the field dictionary but is absent from the Standard layout sections. It must not be invented as a Create form checkbox.

D1 describes Add Comment as available in edit mode and absent during creation. Metadata places Add Comment in Description Information, while read-only Comments has its own section. This is documented/configured information only; no comment action is permitted in this research.

## Evidence gaps

| Gap | Evidence | Temporary implementation reference / question |
| --- | --- | --- |
| Create sections, field order, default Status, required markers and buttons | not observed; capture pending | Use M1 for the data model, not the screen inventory. Establish SF numbers only from a completed image and controls reconciliation. |
| Edit form and availability of an existing record | not observed; list baseline pending | No sample record may be created. Apply the parent research issue's empty-list fallback only if a painted list establishes zero records. |
| Status dropdown and Product lookup interior | not observed; capture pending | No selection or search is allowed. |
| Empty required-field errors | M1 layout and D1 require Solution Title, Question, Answer; Save is forbidden | Ref: record-detail.md, Layout / Flows, Leads invalid-create evidence. Exact messages, timing and focus remain not observable without a write. |
| Save / Save and New success, server errors, duplicates and dirty Cancel | not observable without a write or field change | Ref: record-detail.md and leads-write-behaviour.md; no observed Solutions-specific outcome. |
| Published field and comment editing | metadata / D1 only | Confirm the rendered form without toggling, publishing or submitting comments. |

## Open questions

- Complete the screenshot-backed Create inventory and the permitted Status / Product picker captures.
- Establish whether a record exists before attempting detail → Edit; do not infer an empty list from Cases.
- Confirm the actual required markers against M1's layout requirements; keep validation messages as evidence gaps.
