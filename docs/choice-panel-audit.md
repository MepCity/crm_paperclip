# Shared choice panel audit

Scope: MEP-980, high tier. Baseline: 86c2eed7. This inventory describes code
geometry; rendered measurements are supplied separately by browser tests. A
responsive trigger has no single width until its surface and viewport are chosen.
No new reference CRM access or capture was performed.

## Coverage inventory

| Module / surface | Shared implementation / panel families | Baseline trigger → panel width | Clipping risk | Reference source |
| --- | --- | --- | --- | --- |
| Leads form | RecordChoice: owner, picklist, country/state, salutation | field → field; prefix 110 → 110 | narrow owner/type; ellipsis | record-detail.md:210–212 |
| Contacts form | Same field-input and composite-inputs primitives; account lookup uses dialog | field → field; prefix 110 → 110 | same shared risk | contacts-form.md; record-detail.md:210–212 family mapping |
| Accounts form | Same owner/picklist/search family; parent lookup uses dialog | field → field | same shared risk | accounts-form.md; record-detail.md:210–212 family mapping |
| Deals form | Same owner/picklist family; Account/Contact lookups use dialogs | field → field | same shared risk | deals-form.md; record-detail.md:210–212 family mapping |
| Tasks form | Same owner/picklist; Contact/Related To module selectors in label | narrow label/value → same width | confirmed board finding: text disappears | activities-form.md:1787–1789 closed controls; open panels not specified |
| Meetings form | Same owner/picklist; participant search has its own dialog | field → field | narrow modal field risk | activities-form.md MF-09; open Host panel not observed |
| Calls form | Same owner/picklist; Contact module prefix; lookup dialogs | prefix 110 → 110; field → field | module text can truncate | activities-form.md:1937–1944; Reminder menu separately measured |
| Campaigns form | Same generic RecordChoice fields | field → field | same shared risk | campaigns.md; open geometry not specified |
| Cases form | Same owner/picklist; polymorphic lookup prefix | prefix 110 → 110; field → field | module text can truncate | cases.md; open geometry not specified |
| Solutions form | Same generic owner/picklist fields | field → field | same shared risk | solutions.md; open geometry not specified |
| All module detail inline editors | RecordChoice; inline check gutter and row styling | inline input → input | owner and long option risk | record-detail.md inline editors; narrow panel not specified |
| All generic list filter operators | Select filter variant | control → 146 | existing independently measured width | list-views.md:50, 27 px row |
| All generic list picklist filter values | MultiSelect choices | control → 170 | no trigger lock; wraps text | list-views.md:58, 28 px row |
| All generic list owner filter values | MultiSelect users | control → 327 | no trigger lock; two-line rows | list-views.md:59, 28 px search / 41 px row |
| All generic list sort field selectors | SearchableSelect sort | control → 380 | no trigger lock | list-views.md:53, 268 px total height |
| List toolbar / bulk menus | Menu, Popover; mass-update field uses RecordChoice | content/token width; mass-update previously field width | action menu content intrinsic; field shares fix | list-views.md selection toolbar; unobserved actions remain unobserved |
| Record stage/terminal choices | PicklistMenu | token width independent of trigger | no trigger lock | record-detail.md stage and terminal panel tables |
| Other lookup search primitives | ComboBox | intrinsic content width | no explicit minimum before fix | lookup errors and narrow lookup panel geometry not specified |

Lists and inline editors compose generic components rather than per-module copies.
Campaign-specific filters use the same MultiSelect primitive. Date/time menus,
participant dialogs, record lookup dialogs, saved view menus and action menus are
separate interaction families; adding an owner-width minimum to them is not justified.

## Reference numbers and implementation policy

| Family | Reference measured geometry | Shared policy |
| --- | --- | --- |
| Owner | 299.5 px outer width, 179 px height, search 30 px, avatar 30 px, pitch 41 px | minimum 299.5 or trigger width; viewport cap |
| Searchable Country | 303 px width, search 34 px, row 32 px | minimum 303 or trigger width; viewport cap |
| Ordinary choice | Salutation 110 px; Lead Status 314.5 px; row 32 px | minimum 110 or trigger width; intrinsic content can widen |
| Filter operator | 146 px, row 27 px | retain measured token |
| Filter picklist | 170 px, row 28 px | retain measured token |
| Filter owner | 327 px, search 28 px, row 41 px | retain measured token |
| Sort fields | 380 × 268 px, list 378 × 220 px | retain measured token |

Owner primary names and ordinary options use `--text-md`; selected names use
`--font-weight-semibold`. Secondary owner typography is explicitly not measurable
in typography.md:262. Existing muted colour and normal weight are retained.

## Open measurement questions

UI Lead requested a CRM Analyst follow-up using existing captures only: activity
owner/Host panels, Contact and Related To module panel widths/row arrangements,
lookup search panel rows, and narrow viewport long-label wrapping. No open activity
panel dimensions are asserted from closed-control measurements. Reusing the closest
measured family is interim, as authorized in the assignment, and needs confirmation.

The 12 px viewport inset is an implementation collision safeguard, not a measured
reference spacing. Numeric activity tests validate this provisional mapping rather
than claiming independently measured activity parity. Visual comparison and runtime
measurements must be attached to the issue before QA completion.

## Rendered verification

The targeted choice-panel browser spec passes five tests at 1470 × 835 and
900 × 835. Synthetic users only; screenshots are issue attachments.

| Surface | Trigger → panel (px) | Search / row (px) | Result |
| --- | --- | --- | --- |
| Leads owner | 286 → 299.5 | 30 / 41 | passes measured family |
| Leads country | 303 → 303 | 34 / 32 | passes |
| Leads salutation | 94 → 110 | none / 32 | passes |
| Tasks owner, both viewports | 81.69 → 299.5 | 30 / 41 | passes provisional mapping |
| Tasks Contact type, both viewports | 74.09 → 110 | none / 32 | passes provisional mapping |
| Tasks Related To type, both viewports | 76.47 → 303 | 34 / 32 | passes provisional mapping |
| Meetings owner, both viewports | 81.69 → 299.5 | 30 / 41 | passes provisional mapping |
| Leads Company filter operator | responsive → 146 | none / 27 | passes |

All tested form panels stay within the viewport in both axes, with no clipped
option text for the supplied synthetic values. Avatar width is 30 px and selected
owner names match the primary text and semibold role tokens. Existing owner
ellipsis for unusually long names/emails is retained per the typography spec.
