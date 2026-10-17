# Cases

## Create and edit form

Read-only form research. This section covers the form only; list and record-detail research are separate work products. No field was filled, option selected, record saved, or preference changed.

### Sources and limits

- M1: local metadata, `modules/Cases/fields.json` and `layouts.json`, Standard layout. Configuration is not screen evidence.
- D1: reference CRM public help, **Working with Cases**, Standard fields and Creating Cases Individually, read 2026-10-17. Locator: public help center → CRM → Customer Support → Working with Cases. No external address is stored here.
- Shared form and validation evidence: [record-detail.md](record-detail.md), Layout / Flows; nearest reusable controls: [accounts-form.md](accounts-form.md), then [deals-form.md](deals-form.md) and [contacts-form.md](contacts-form.md).

`m8f-cases-base` paints All Cases with zero records. The parent research issue's explicit empty-list fallback applies: Edit cannot be reached from a record and remains **not observed**. No sample record was created.

### Layout and fields

The full-page Create Case form retains the shell and bottom utility strip. Its title strip has Edit Page Layout and, from left to right on the right, Cancel, Save and New, Save. Case Information has two columns:

| Row | Left | Right |
| --- | --- | --- |
| 1 | Case Number, locked and blank | Case Owner, prefilled, arrow and user lookup |
| 2 | Product Name, lookup | Status, New |
| 3 | Type, -None- | Priority, -None- |
| 4 | Case Origin, -None- | Case Reason, -None- |
| 5 | Related To, contact lookup | Subject |
| 6 | Account Name, lookup | Reported By |
| 7 | Deal Name, lookup | Email |
| 8 | Phone | No field |

Status, Case Origin and Subject have a required input-edge marker. Description Information follows, with Description then Internal Comments as full-width multiline controls with resize grips. Solution Information and the form footer are below the initial viewport; their presence in extracted text alone is not a visual observation. Client Script occupies the right edge. No Case Image section is painted in the initial viewport.

### Control inventory — m8f-cases-create

Shell: SH-01–SH-46 as in [contacts.md](contacts.md), with Cases active. The rail is scrolled to its lower modules; no preference was changed. Initial viewport: Products through Projects; shared shell differences are listed below. No shell rows are repeated.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-01 | Header | Edit Page Layout | link | after title | same | seen (m8f-cases-create) | M11 | AF-01 |
| KF-02 | Header | Cancel | button | right group, first | same | seen (m8f-cases-create) | M8 | AF-02 |
| KF-03 | Header | Save and New | button | right group, second | same | seen (m8f-cases-create) | M8 | AF-03 |
| KF-04 | Header | Save | button | right group, third | same | seen (m8f-cases-create) | M8 | AF-04 |
| KF-05 | Case Information | Case Number | input | left, row 1 | Locked, blank; not editable | seen (m8f-cases-create) | M8 | new |
| KF-06 | Case Information | Lock icon | badge | left, row 1, input right edge | Read-only indicator; no action observed | seen (m8f-cases-create) | M8 | new |
| KF-07 | Case Information | Product Name | input | left, row 2 | Lookup input; no typing | seen (m8f-cases-create) | P2 | new |
| KF-08 | Case Information | Product lookup icon | icon button | left, row 2, input right edge | Opens product picker; no selection | seen (m8f-cases-create) | P2 | new |
| KF-09 | Case Information | Type | select | left, row 3 | not observed | seen (m8f-cases-create) | M8 | new |
| KF-10 | Case Information | Case Origin | select | left, row 4 | Opens origin choices; no selection | seen (m8f-cases-create) | M8 | new |
| KF-11 | Case Information | Related To | input | left, row 5 | Contact lookup input; no typing | seen (m8f-cases-create) | M2 | new |
| KF-12 | Case Information | Contact lookup icon | icon button | left, row 5, input right edge | Opens contact picker; no selection | seen (m8f-cases-create) | M2 | new |
| KF-13 | Case Information | Account Name | input | left, row 6 | same | seen (m8f-cases-create) | M3 | DF-08 moved |
| KF-14 | Case Information | Account lookup icon | icon button | left, row 6, input right edge | same | seen (m8f-cases-create) | M3 | AF-11 moved |
| KF-15 | Case Information | Deal Name | input | left, row 7 | Lookup input; no typing | seen (m8f-cases-create) | M4 | new |
| KF-16 | Case Information | Deal lookup icon | icon button | left, row 7, input right edge | Opens deal picker; no selection | seen (m8f-cases-create) | M4 | new |
| KF-17 | Case Information | Phone | input | left, row 8 | same | seen (m8f-cases-create) | M8 | AF-18 moved |
| KF-18 | Case Information | Case Owner | select | right, row 1 | Prefilled; identity omitted; not opened | seen (m8f-cases-create) | M8 | new |
| KF-19 | Case Information | User lookup icon | icon button | right, row 1, input right edge | same | seen (m8f-cases-create) | M8 | AF-07 moved |
| KF-20 | Case Information | Status | select | right, row 2 | Opens status choices; no selection | seen (m8f-cases-create) | M8 | new |
| KF-21 | Case Information | Priority | select | right, row 3 | Opens priority choices; no selection | seen (m8f-cases-create) | M8 | new |
| KF-22 | Case Information | Case Reason | select | right, row 4 | not observed | seen (m8f-cases-create) | M8 | new |
| KF-23 | Case Information | Subject | input | right, row 5 | Empty; required marker | seen (m8f-cases-create) | M8 | new |
| KF-24 | Case Information | Reported By | input | right, row 6 | Empty text input, distinct from Related To | seen (m8f-cases-create) | M8 | new |
| KF-25 | Case Information | Email | input | right, row 7 | Empty email input | seen (m8f-cases-create) | M8 | new |
| KF-26 | Description Information | Description | input | first full-width row | same | seen (m8f-cases-create) | M8 | AF-44 moved |
| KF-27 | Description Information | Internal Comments | input | second full-width row | Multiline editor; not filled | seen (m8f-cases-create) | M8 | new |
| KF-32 | Right edge | Client Script | tab | page right edge | same | seen (m8f-cases-create) | M11 | AF-47 |
| KF-33 | Description Information | Resize grip | icon button | Description, lower-right corner | not operated | seen (m8f-cases-create) | M8 | DF-29 moved |
| KF-34 | Description Information | Resize grip | icon button | Internal Comments, lower-right corner | not operated | seen (m8f-cases-create) | M8 | DF-29 moved |

KF-06, KF-33 and KF-34 are image-only. A select includes its arrow; a required marker is a field state, not an extra control. KF-28–KF-31 are reserved for the lower form. Absent here: account image, address blocks, Copy Address, account-specific commercial fields.

### Control inventory — m8f-cases-status

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-20.1 | Status list | New | menu item | option 1 | Initially checked; no selection | seen (m8f-cases-status) | M8 | new |
| KF-20.2 | Status list | Escalated | menu item | option 2 | not observed | seen (m8f-cases-status) | M8 | new |
| KF-20.3 | Status list | On Hold | menu item | option 3 | not observed | seen (m8f-cases-status) | M8 | new |
| KF-20.4 | Status list | Closed | menu item | option 4 | not observed | seen (m8f-cases-status) | M8 | new |

Rest: as in m8f-cases-create; covered by the overlay: KF-21–KF-23. No search box is painted. The selected row has a check mark.

### Control inventory — m8f-cases-origin

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-10.1 | Case Origin list | -None- | menu item | option 1 | Initially checked; no selection | seen (m8f-cases-origin) | M8 | new |
| KF-10.2 | Case Origin list | Email | menu item | option 2 | not observed | seen (m8f-cases-origin) | M8 | new |
| KF-10.3 | Case Origin list | Phone | menu item | option 3 | not observed | seen (m8f-cases-origin) | M8 | new |
| KF-10.4 | Case Origin list | Web | menu item | option 4 | not observed | seen (m8f-cases-origin) | M8 | new |

Rest: as in m8f-cases-create; covered by the overlay: KF-11–KF-16. No search box is painted. The selected row has a check mark. Display label Web agrees with M1; D1 uses a longer channel name.

### Control inventory — m8f-cases-priority

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-21.1 | Priority list | -None- | menu item | option 1 | Initially checked; no selection | seen (m8f-cases-priority) | M8 | new |
| KF-21.2 | Priority list | High | menu item | option 2 | not observed | seen (m8f-cases-priority) | M8 | new |
| KF-21.3 | Priority list | Medium | menu item | option 3 | not observed | seen (m8f-cases-priority) | M8 | new |
| KF-21.4 | Priority list | Low | menu item | option 4 | not observed | seen (m8f-cases-priority) | M8 | new |

Rest: as in m8f-cases-create; covered by the overlay: KF-22–KF-23 and the upper edge of KF-24. No search box is painted. The selected row has a check mark. Options agree with M1; no option was selected.

### Control inventory — m8f-cases-account

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-14.1 | Account popup | Close cross | icon button | header, far right | same | seen (m8f-cases-account) | M3 | AF-11.1 |
| KF-14.2 | Account popup | Search by Account Name | input | below title, left | same | seen (m8f-cases-account) | M3 | AF-11.2 |
| KF-14.3 | Account popup | New Account | button | below title, right | same | seen (m8f-cases-account) | M3 | AF-11.3 |
| KF-14.4 | Account popup | Table with down arrow icon | icon button | table header, first | same | seen (m8f-cases-account) | M3 | AF-11.4 |
| KF-14.5 | Account popup | Account Name | column header | table header, text column 1 | same | seen (m8f-cases-account) | M3 | AF-11.5 |
| KF-14.6 | Account popup | Column options | icon button | text column 1, right | same | seen (m8f-cases-account) | M3 | AF-11.6 |
| KF-14.7 | Account popup | Phone | column header | table header, text column 2 | same | seen (m8f-cases-account) | M3 | AF-11.7 |
| KF-14.8 | Account popup | Column options | icon button | text column 2, right | same | seen (m8f-cases-account) | M3 | AF-11.8 |
| KF-14.9 | Account popup | Website | column header | table header, text column 3 | same | seen (m8f-cases-account) | M3 | AF-11.9 |
| KF-14.10 | Account popup | Column options | icon button | text column 3, right | same | seen (m8f-cases-account) | M3 | AF-11.10 |
| KF-14.11 | Account popup | Account Owner | column header | table header, text column 4 | same | seen (m8f-cases-account) | M3 | AF-11.11 |
| KF-14.12 | Account popup | Column options | icon button | text column 4, right | same | seen (m8f-cases-account) | M3 | AF-11.12 |
| KF-14.13 | Account popup | Filter | icon button | table header, far right | same | seen (m8f-cases-account) | M3 | AF-11.13 |
| KF-14.14 | Account popup | Row selection circle | toggle | each fully visible row, first | same | seen (m8f-cases-account) | M3 | AF-11.14 |
| KF-14.15 | Account popup | Account record link | link | each fully visible row, Account Name | same | seen (m8f-cases-account) | M3 | AF-11.15 |
| KF-14.16 | Account popup | Phone handset icon | icon button | populated Phone cells, after value | same | seen (m8f-cases-account) | M5 | AF-11.16 |
| KF-14.17 | Account popup | Previous | icon button | footer, right group, first | same | seen (m8f-cases-account) | M3 | AF-11.17 |
| KF-14.18 | Account popup | Next | icon button | footer, right group, second | same | seen (m8f-cases-account) | M3 | AF-11.18 |

Rest: as in m8f-cases-create; covered by the overlay: all or part of KF-01–KF-25, and part of the shell. KF-26–KF-27 and KF-32 remain visible; underlying controls are inactive. The modal title is Choose Account. Five complete rows are visible, followed by a clipped row edge; record values are omitted. Previous is disabled and Next is enabled. Search has the initial focus ring without user typing. The table has an internal scrollbar; it was not scrolled. No popup action, row, column option, filter or pagination control was used. KF-14.16 is image-only. Absent here: multi-select confirmation buttons.

### Shell controls missing from app-shell.md

The lower rail is visible without a user preference change. These shell differences are recorded once; all have untested navigation behaviour. Module names are labels, not copied assets.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-S01 | Rail | Products | link | lower rail, item 1 | not observed | seen (m8f-cases-create) | P2 | new |
| KF-S02 | Rail | Quotes | link | lower rail, item 2 | not observed | seen (m8f-cases-create) | P2 | new |
| KF-S03 | Rail | Invoices | link | lower rail, item 3 | not observed | seen (m8f-cases-create) | P2 | new |
| KF-S04 | Rail | Sales Orders | link | lower rail, item 4 | not observed | seen (m8f-cases-create) | P2 | new |
| KF-S05 | Rail | Solutions | link | lower rail, item 5 | not observed | seen (m8f-cases-create) | M8 | new |
| KF-S06 | Rail | Social | link | lower rail, item 6 | not observed | seen (m8f-cases-create) | M15 | new |
| KF-S07 | Rail | Forecasts | link | lower rail, item 7 | not observed | seen (m8f-cases-create) | P2 | new |
| KF-S08 | Rail | Purchase Orders | link | lower rail, item 8 | not observed | seen (m8f-cases-create) | P2 | new |
| KF-S09 | Rail | Vendors | link | lower rail, item 9 | not observed | seen (m8f-cases-create) | P2 | new |
| KF-S10 | Rail | SalesInbox | link | lower rail, item 10 | not observed | seen (m8f-cases-create) | M10 | new |
| KF-S11 | Rail | Cases | link | lower rail, item 11 | not observed | seen (m8f-cases-create) | M8 | new |
| KF-S12 | Rail | My Jobs | link | lower rail, item 12 | not observed | seen (m8f-cases-create) | ? | new |
| KF-S13 | Rail | Services | link | lower rail, item 13 | not observed | seen (m8f-cases-create) | ? | new |
| KF-S14 | Rail | Projects | link | lower rail, item 14 | not observed | seen (m8f-cases-create) | ? | new |

The rail resize handle is reported in controls.json but no separate handle is painted over the boundary. It is not operated. No Channels or Threads shortcut is painted. The shared utility trash icon SH-46 is image-only.

### Form fields versus metadata

M1 configures 30 fields. Case Number is an auto-number; Owner is an owner lookup; Status / Type / Priority / Case Reason / Case Origin are picklists; Product Name targets Products, Related To targets Contacts, Account Name targets Accounts, and Deal Name targets Deals. The rendered Related To and Reported By controls are distinct. Case Number is locked on Create. The metadata requirements Status / Case Origin / Subject agree with their three visible markers. No values from an existing record were copied.

The initial viewport visually establishes KF-05–KF-27. Solution, Add Comment and Comments are not established by that image. Metadata-only system fields, tags, timestamps, comment counts and connection fields must not be inferred as create inputs. A Case Image section exists in M1 but has no fields and is not painted here.

## Evidence gaps

| Gap | Evidence | Temporary implementation reference / question |
| --- | --- | --- |
| Edit form, field order, defaults and buttons | not observed: All Cases has zero records | Reuse Create structure only as a provisional rule; confirm at the module gate. Do not invent a reference record. |
| Empty required-field errors | M1 requires Status, Case Origin, Subject; D1 agrees; Save is forbidden | Ref: record-detail.md, Layout / Flows, Leads invalid-create evidence. Reuse shared inline required-field feedback provisionally; exact Cases messages, focus and timing remain not observed. |
| Origin Email conditional validation | D1 describes an email requirement for email-origin cases; no option was selected | Gate question: confirm conditional rule against the current layout; do not claim an observed marker or message. |
| Successful Save / Save and New, server errors, duplicates and dirty Cancel | not observable without a write or field change | Ref: record-detail.md and leads-write-behaviour.md; no observed Cases-specific outcome. |
| Lower form and repeated footer buttons | not observed: below the initial viewport | Solution Information is extracted and configured, but its rendered field and footer positions need a permitted scroll capture; KF-28–KF-31 remain unassigned. |
| Deal, Contact and Product picker interiors | pending capture; Account popup observed in m8f-cases-account | Partial step files without meta.json/network.json are excluded; do not infer popup controls from metadata. |
| Field hover affordances and validation tooltips | not observed | Shared form pattern only, pending evidence. |
| Shell ownership for My Jobs, Services, Projects and utility shortcuts | visible labels / icons; destination not opened | Keep unknown module attribution until scope is decided. |

## Form capture reconciliation

### Reconciliation — m8f-cases-create

Source ordinals are one-based in controls.json; duplicate wrappers map to the same logical control. All source entries are covered. Screenshot-only controls are stated separately.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, duplicate decoration or non-control text | 1, 4, 109, 111, 114, 135–136, 139, 151–152, 200, 266–267 |
| SH-01 | 2–3 |
| KF-15 | 177–180 |
| Excluded: zero-area hidden node | 5–10, 13, 16, 19, 22, 25, 28, 33, 108, 110, 118–119, 121–122, 124–125, 128–129, 146–150, 160, 170, 176, 182, 213–222, 224–238 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27, 29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| Excluded: clipped or outside viewport | 37–65, 134, 205–212, 239, 270 |
| KF-S01 | 66–68 |
| KF-S02 | 69–71 |
| KF-S03 | 72–74 |
| KF-S04 | 75–77 |
| KF-S05 | 78–80 |
| KF-S06 | 81–83 |
| KF-S07 | 84–86 |
| KF-S08 | 87–89 |
| KF-S09 | 90–92 |
| KF-S10 | 93–95 |
| KF-S11 | 96–98 |
| KF-S12 | 99–101 |
| KF-S13 | 102–104 |
| KF-S14 | 105–107 |
| SH-26 | 112 |
| SH-27 | 113 |
| SH-28 | 115 |
| SH-29 | 116 |
| SH-30 | 117 |
| SH-31 | 120 |
| SH-32 | 123 |
| SH-33 | 126–127 |
| SH-34 | 130–133 |
| KF-01 | 137–138 |
| KF-04 | 140–141 |
| KF-03 | 142–143 |
| KF-02 | 144–145 |
| KF-05 | 153–154 |
| KF-07 | 155–158 |
| KF-08 | 159, 251–253 |
| KF-09 | 161–162 |
| KF-10 | 163–164 |
| KF-11 | 165–168 |
| KF-12 | 169, 254–256 |
| KF-13 | 171–174 |
| KF-14 | 175, 257–259 |
| KF-16 | 181, 260–262 |
| KF-17 | 183–184 |
| KF-19 | 185, 263–265 |
| KF-18 | 186–187 |
| KF-20 | 188–189 |
| KF-21 | 190–191 |
| KF-22 | 192–193 |
| KF-23 | 194–195 |
| KF-24 | 196–197 |
| KF-25 | 198–199 |
| KF-26 | 201–202, 268 |
| KF-27 | 203–204, 269 |
| KF-32 | 223 |
| SH-35 | 240 |
| SH-36 | 241 |
| SH-37 | 242 |
| SH-38 | 243 |
| SH-39 | 244 |
| SH-40 | 245 |
| SH-41 | 246 |
| SH-42 | 247 |
| SH-43 | 248 |
| SH-44 | 249 |
| SH-45 | 250 |

Self-audit: 270 entries → 72 numbered controls (160 mapped entries); 110 excluded entries. Screenshot-only: KF-06, KF-33, KF-34 and SH-46.

### Reconciliation — m8f-cases-status

Source ordinals are one-based in controls.json; duplicate wrappers map to the same logical control. All source entries are covered. Screenshot-only controls are stated separately.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, duplicate decoration or non-control text | 1, 4, 109, 111, 114, 135–136, 139, 151–152, 200, 251, 256, 259, 262, 265, 268, 271–272, 276 |
| SH-01 | 2–3 |
| KF-15 | 177–180 |
| Excluded: zero-area hidden node | 5–10, 13, 16, 19, 22, 25, 28, 33, 108, 110, 118–119, 121–122, 124–125, 128–129, 146–150, 160, 170, 176, 182, 213–222, 224–238 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27, 29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| Excluded: clipped or outside viewport | 37–65, 134, 205–212, 239, 275 |
| KF-S01 | 66–68 |
| KF-S02 | 69–71 |
| KF-S03 | 72–74 |
| KF-S04 | 75–77 |
| KF-S05 | 78–80 |
| KF-S06 | 81–83 |
| KF-S07 | 84–86 |
| KF-S08 | 87–89 |
| KF-S09 | 90–92 |
| KF-S10 | 93–95 |
| KF-S11 | 96–98 |
| KF-S12 | 99–101 |
| KF-S13 | 102–104 |
| KF-S14 | 105–107 |
| SH-26 | 112 |
| SH-27 | 113 |
| SH-28 | 115 |
| SH-29 | 116 |
| SH-30 | 117 |
| SH-31 | 120 |
| SH-32 | 123 |
| SH-33 | 126–127 |
| SH-34 | 130–133 |
| KF-01 | 137–138 |
| KF-04 | 140–141 |
| KF-03 | 142–143 |
| KF-02 | 144–145 |
| KF-05 | 153–154 |
| KF-07 | 155–158 |
| KF-08 | 159, 257–258 |
| KF-09 | 161–162 |
| KF-10 | 163–164 |
| KF-11 | 165–168 |
| KF-12 | 169, 260–261 |
| KF-13 | 171–174 |
| KF-14 | 175, 263–264 |
| KF-16 | 181, 266–267 |
| KF-17 | 183–184 |
| KF-19 | 185, 269–270 |
| KF-18 | 186–187 |
| KF-20 | 188–189 |
| KF-21 | 190–191 |
| KF-22 | 192–193 |
| KF-23 | 194–195 |
| KF-24 | 196–197 |
| KF-25 | 198–199 |
| KF-26 | 201–202, 273 |
| KF-27 | 203–204, 274 |
| KF-32 | 223 |
| SH-35 | 240 |
| SH-36 | 241 |
| SH-37 | 242 |
| SH-38 | 243 |
| SH-39 | 244 |
| SH-40 | 245 |
| SH-41 | 246 |
| SH-42 | 247 |
| SH-43 | 248 |
| SH-44 | 249 |
| SH-45 | 250 |
| KF-20.1 | 252 |
| KF-20.2 | 253 |
| KF-20.3 | 254 |
| KF-20.4 | 255 |

Self-audit: 276 entries → 76 numbered controls (159 mapped entries); 117 excluded entries. Screenshot-only: KF-06, KF-33, KF-34 and SH-46.

### Reconciliation — m8f-cases-origin

Source ordinals are one-based in controls.json; duplicate wrappers map to the same logical control. All source entries are covered. Screenshot-only controls are stated separately.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, duplicate decoration or non-control text | 1, 4, 109, 111, 114, 135–136, 139, 151–152, 200, 251, 256, 259, 262, 265, 268, 271–272, 276 |
| SH-01 | 2–3 |
| KF-15 | 177–180 |
| Excluded: zero-area hidden node | 5–10, 13, 16, 19, 22, 25, 28, 33, 108, 110, 118–119, 121–122, 124–125, 128–129, 146–150, 160, 170, 176, 182, 213–222, 224–237, 250 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27, 29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| Excluded: clipped or outside viewport | 37–65, 134, 205–212, 238, 275 |
| KF-S01 | 66–68 |
| KF-S02 | 69–71 |
| KF-S03 | 72–74 |
| KF-S04 | 75–77 |
| KF-S05 | 78–80 |
| KF-S06 | 81–83 |
| KF-S07 | 84–86 |
| KF-S08 | 87–89 |
| KF-S09 | 90–92 |
| KF-S10 | 93–95 |
| KF-S11 | 96–98 |
| KF-S12 | 99–101 |
| KF-S13 | 102–104 |
| KF-S14 | 105–107 |
| SH-26 | 112 |
| SH-27 | 113 |
| SH-28 | 115 |
| SH-29 | 116 |
| SH-30 | 117 |
| SH-31 | 120 |
| SH-32 | 123 |
| SH-33 | 126–127 |
| SH-34 | 130–133 |
| KF-01 | 137–138 |
| KF-04 | 140–141 |
| KF-03 | 142–143 |
| KF-02 | 144–145 |
| KF-05 | 153–154 |
| KF-07 | 155–158 |
| KF-08 | 159, 257–258 |
| KF-09 | 161–162 |
| KF-10 | 163–164 |
| KF-11 | 165–168 |
| KF-12 | 169, 260–261 |
| KF-13 | 171–174 |
| KF-14 | 175, 263–264 |
| KF-16 | 181, 266–267 |
| KF-17 | 183–184 |
| KF-19 | 185, 269–270 |
| KF-18 | 186–187 |
| KF-20 | 188–189 |
| KF-21 | 190–191 |
| KF-22 | 192–193 |
| KF-23 | 194–195 |
| KF-24 | 196–197 |
| KF-25 | 198–199 |
| KF-26 | 201–202, 273 |
| KF-27 | 203–204, 274 |
| KF-32 | 223 |
| SH-35 | 239 |
| SH-36 | 240 |
| SH-37 | 241 |
| SH-38 | 242 |
| SH-39 | 243 |
| SH-40 | 244 |
| SH-41 | 245 |
| SH-42 | 246 |
| SH-43 | 247 |
| SH-44 | 248 |
| SH-45 | 249 |
| KF-10.1 | 252 |
| KF-10.2 | 253 |
| KF-10.3 | 254 |
| KF-10.4 | 255 |

Self-audit: 276 entries → 76 numbered controls (159 mapped entries); 117 excluded entries. Screenshot-only: KF-06, KF-33, KF-34 and SH-46.


### Reconciliation — m8f-cases-priority

Source ordinals are one-based in controls.json; duplicate wrappers map to the same logical control. All source entries are covered. Screenshot-only controls are stated separately.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, duplicate decoration or non-control text | 1, 4, 109, 111, 114, 135–136, 139, 151–152, 200, 251, 256, 259, 262, 265, 268, 271–272, 276 |
| SH-01 | 2–3 |
| KF-15 | 177–180 |
| Excluded: zero-area hidden node | 5–10, 13, 16, 19, 22, 25, 28, 33, 108, 110, 118–119, 121–122, 124–125, 128–129, 146–150, 160, 170, 176, 182, 213–222, 224–238 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27, 29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| Excluded: clipped or outside viewport | 37–65, 134, 205–212, 239, 275 |
| KF-S01 | 66–68 |
| KF-S02 | 69–71 |
| KF-S03 | 72–74 |
| KF-S04 | 75–77 |
| KF-S05 | 78–80 |
| KF-S06 | 81–83 |
| KF-S07 | 84–86 |
| KF-S08 | 87–89 |
| KF-S09 | 90–92 |
| KF-S10 | 93–95 |
| KF-S11 | 96–98 |
| KF-S12 | 99–101 |
| KF-S13 | 102–104 |
| KF-S14 | 105–107 |
| SH-26 | 112 |
| SH-27 | 113 |
| SH-28 | 115 |
| SH-29 | 116 |
| SH-30 | 117 |
| SH-31 | 120 |
| SH-32 | 123 |
| SH-33 | 126–127 |
| SH-34 | 130–133 |
| KF-01 | 137–138 |
| KF-04 | 140–141 |
| KF-03 | 142–143 |
| KF-02 | 144–145 |
| KF-05 | 153–154 |
| KF-07 | 155–158 |
| KF-08 | 159, 257–258 |
| KF-09 | 161–162 |
| KF-10 | 163–164 |
| KF-11 | 165–168 |
| KF-12 | 169, 260–261 |
| KF-13 | 171–174 |
| KF-14 | 175, 263–264 |
| KF-16 | 181, 266–267 |
| KF-17 | 183–184 |
| KF-19 | 185, 269–270 |
| KF-18 | 186–187 |
| KF-20 | 188–189 |
| KF-21 | 190–191 |
| KF-22 | 192–193 |
| KF-23 | 194–195 |
| KF-24 | 196–197 |
| KF-25 | 198–199 |
| KF-26 | 201–202, 273 |
| KF-27 | 203–204, 274 |
| KF-32 | 223 |
| SH-35 | 240 |
| SH-36 | 241 |
| SH-37 | 242 |
| SH-38 | 243 |
| SH-39 | 244 |
| SH-40 | 245 |
| SH-41 | 246 |
| SH-42 | 247 |
| SH-43 | 248 |
| SH-44 | 249 |
| SH-45 | 250 |
| KF-21.1 | 252 |
| KF-21.2 | 253 |
| KF-21.3 | 254 |
| KF-21.4 | 255 |

Self-audit: 276 entries → 76 numbered controls (159 mapped entries); 117 excluded entries. Screenshot-only: KF-06, KF-33, KF-34 and SH-46.


### Reconciliation — m8f-cases-account

Source ordinals are one-based. Underlying form and shell entries retain their base mapping, including entries covered by the modal; this does not claim they are operable. Repeated row controls share a number; record values are excluded.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, duplicate decoration or non-control text | 1, 4, 109, 111, 114, 135–136, 139, 151–152, 200, 253, 261–265, 275, 278, 389–390, 409–410, 414 |
| SH-01 | 2–3 |
| KF-15 | 177–180 |
| Excluded: zero-area hidden node | 5–10, 13, 16, 19, 22, 25, 28, 33, 108, 110, 118–119, 121–122, 124–125, 128–129, 146–150, 160, 170, 176, 182, 213–224, 226–240, 259, 276–277 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27, 29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| Excluded: clipped or outside viewport | 37–65, 134, 205–212, 241, 334–388, 413 |
| KF-S01 | 66–68 |
| KF-S02 | 69–71 |
| KF-S03 | 72–74 |
| KF-S04 | 75–77 |
| KF-S05 | 78–80 |
| KF-S06 | 81–83 |
| KF-S07 | 84–86 |
| KF-S08 | 87–89 |
| KF-S09 | 90–92 |
| KF-S10 | 93–95 |
| KF-S11 | 96–98 |
| KF-S12 | 99–101 |
| KF-S13 | 102–104 |
| KF-S14 | 105–107 |
| SH-26 | 112 |
| SH-27 | 113 |
| SH-28 | 115 |
| SH-29 | 116 |
| SH-30 | 117 |
| SH-31 | 120 |
| SH-32 | 123 |
| SH-33 | 126–127 |
| SH-34 | 130–133 |
| KF-01 | 137–138 |
| KF-04 | 140–141 |
| KF-03 | 142–143 |
| KF-02 | 144–145 |
| KF-05 | 153–154 |
| KF-07 | 155–158 |
| KF-08 | 159, 393–395 |
| KF-09 | 161–162 |
| KF-10 | 163–164 |
| KF-11 | 165–168 |
| KF-12 | 169, 396–398 |
| KF-13 | 171–174 |
| KF-14 | 175, 399–401 |
| KF-16 | 181, 402–404 |
| KF-17 | 183–184 |
| KF-19 | 185, 405–407 |
| KF-18 | 186–187 |
| KF-20 | 188–189 |
| KF-21 | 190–191 |
| KF-22 | 192–193 |
| KF-23 | 194–195 |
| KF-24 | 196–197 |
| KF-25 | 198–199 |
| KF-26 | 201–202, 411 |
| KF-27 | 203–204, 412 |
| KF-32 | 225 |
| SH-35 | 242 |
| SH-36 | 243 |
| SH-37 | 244 |
| SH-38 | 245 |
| SH-39 | 246 |
| SH-40 | 247 |
| SH-41 | 248 |
| SH-42 | 249 |
| SH-43 | 250 |
| SH-44 | 251 |
| SH-45 | 252 |
| KF-14.1 | 254 |
| KF-14.2 | 255–256, 408 |
| KF-14.3 | 257–258 |
| KF-14.4 | 266 |
| KF-14.5 | 267 |
| KF-14.6 | 268 |
| KF-14.7 | 269 |
| KF-14.8 | 270 |
| KF-14.9 | 271 |
| KF-14.10 | 272 |
| KF-14.11 | 273 |
| KF-14.12 | 274 |
| KF-14.13 | 260 |
| KF-14.17 | 391 |
| KF-14.18 | 392 |
| KF-14.14 | 281–282, 292–293, 303–304, 314–315, 325–326 |
| KF-14.15 | 284–285, 295–296, 306–307, 317–318, 328–329 |
| Excluded: record-row wrappers and non-interactive record cell data | 279–280, 283, 286–291, 294, 297–302, 305, 308–313, 316, 319–324, 327, 330–333 |

Self-audit: 414 entries → 89 numbered controls (198 mapped entries); 216 excluded entries. Missing / duplicate ordinals: 0. Screenshot-only: KF-14.16 (five handsets); base image-only KF-33, KF-34 and SH-46 remain visible, while KF-06 is covered. The five complete rows have unselected circles and record links. The clipped sixth row is excluded rather than inferred from the DOM.
