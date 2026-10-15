# Deals — create and edit forms

Status: read-only research submitted with capture limits. The Create form is visually inventoried; the authorized popup attempts failed with profile in use, and Edit has no validated source selector. These are evidence gaps, not inferred UI states.

## Purpose

Inventory the Deals form and its differences from [accounts-form.md](accounts-form.md), then [contacts-form.md](contacts-form.md). Shared form behaviour remains in [record-detail.md](record-detail.md); field configuration and option catalogs remain in [deals.md](deals.md). Screenshots establish rendered controls; metadata establishes configuration only. No field was filled, option selected, lookup searched, or save/cancel control operated.

## Layout

The painted Create Deal page retains the shared shell with Deals active. The fixed title strip contains Edit Page Layout and the right-hand Cancel, Save and New, Save group. Deal Information has two columns:

| Row | Left | Right |
| --- | --- | --- |
| 1 | Deal Owner and user lookup | Amount, TL prefix and information icon |
| 2 | Deal Name | Closing Date |
| 3 | Account Name and account lookup | Stage |
| 4 | Type | Probability (%) |
| 5 | Next Step | Expected Revenue, TL prefix and lock |
| 6 | Lead Source | Campaign Source and campaign lookup |
| 7 | Contact Name and contact lookup | No field |

Description Information follows with one multiline editor and a visible lower-right resize grip. The footer shows Create Form Views, Standard View and Create a custom form page. Client Script occupies the right edge and partly covers the Campaign Source icon and Expected Revenue lock. The utility strip remains at the bottom. Deal Image is not rendered in the painted create screenshot, although an image section is configured in metadata.

Required input-edge markers are visible on Deal Name, Account Name, Closing Date and Stage. Owner is prefilled; its identity is omitted. The page automatically focuses the owner control on load; no field focus was requested. Stage initially displays Qualification, Probability (%) displays 10, and Type / Lead Source display -None-. Other create fields are blank. Closing Date shows DD.MM.YYYY. No calendar icon is painted. No pipeline selector is visible.

## Control inventory

DF numbers persist across captures. `same` preserves the cited control's observation limits. A select includes its arrow; required markers are field states, not additional controls. Image-only controls supplement controls.json. References resolve to Accounts first, then Contacts; references to footer numbers reserved in Accounts are explicitly limited to source evidence, because their Accounts rendering was not observed.

### Control inventory — m4f-list-base

No painted controls: the screenshot is a loading skeleton. Shell: SH-01–SH-46 as in [contacts.md](contacts.md) is the reuse baseline, but none is visibly established here.

Rest: comparison with m4-list-base in [deals.md](deals.md) is not visually established; covered by the loading state: all DL controls and SH-01–SH-46. No overall record count or record link was observed. This capture cannot supply a validated record selector for the detail/edit steps.

### Control inventory — m4f-create

Shell: SH-01–SH-46 as in [contacts.md](contacts.md); Deals SH-16 is active, Contacts SH-14 and Accounts SH-15 inactive. Channels and Threads (AF-48–AF-49) are not painted. SH-46 is image-only. No shell row is repeated.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DF-01 | Header | Edit Page Layout | link | title strip, after title | same | seen (m4f-create) | M11 | AF-01 |
| DF-02 | Header | Cancel | button | right group, first | same | seen (m4f-create) | M4 | AF-02 |
| DF-03 | Header | Save and New | button | right group, second | same | seen (m4f-create) | M4 | AF-03 |
| DF-04 | Header | Save | button | right group, third | same | seen (m4f-create) | M4 | AF-04 |
| DF-05 | Deal Information | Deal Owner | select | left, row 1 | same | seen (m4f-create) | M4 | AF-06 |
| DF-06 | Deal Information | User lookup icon | icon button | left, row 1, input right edge | same | seen (m4f-create) | M4 | AF-07 |
| DF-07 | Deal Information | Deal Name | input | left, row 2 | same | seen (m4f-create) | M4 | AF-08 |
| DF-08 | Deal Information | Account Name | input | left, row 3 | same; required marker here | seen (m4f-create) | M3 | F-10 |
| DF-09 | Deal Information | Account lookup icon | icon button | left, row 3, input right edge | Popup not observed; opening requested only | seen (m4f-create) | M3 | AF-11 moved |
| DF-10 | Deal Information | Type | select | left, row 4 | not observed | seen (m4f-create) | M4 | new |
| DF-11 | Deal Information | Next Step | input | left, row 5 | not observed | seen (m4f-create) | M4 | new |
| DF-12 | Deal Information | Lead Source | select | left, row 6 | Popup not observed; opening requested only | seen (m4f-create) | M4 | F-17 moved |
| DF-13 | Deal Information | Contact Name | input | left, row 7 | not observed | seen (m4f-create) | M2 | new |
| DF-14 | Deal Information | Contact lookup icon | icon button | left, row 7, input right edge | Popup not observed; opening requested only | seen (m4f-create) | M2 | new |
| DF-15 | Deal Information | Amount | input | right, row 1, after TL | not observed | seen (m4f-create) | M4 | new |
| DF-16 | Deal Information | TL | badge | Amount prefix, right row 1 | not observed | seen (m4f-create) | M4 | new |
| DF-17 | Deal Information | Information icon | icon button | Amount, input right edge | same | seen (m4f-create) | M4 | AF-16 moved |
| DF-18 | Deal Information | Closing Date | input | right, row 2 | not observed; calendar not opened | seen (m4f-create) | M4 | new |
| DF-19 | Deal Information | Stage | select | right, row 3 | Popup not observed; opening requested only | seen (m4f-create) | M4 | new |
| DF-20 | Deal Information | Probability (%) | input | right, row 4 | not observed; no readonly attribute in control evidence | seen (m4f-create) | M4 | new |
| DF-21 | Deal Information | Expected Revenue | input | right, row 5, after TL | Readonly in control evidence; no interaction | seen (m4f-create) | M4 | new |
| DF-21.1 | Deal Information | TL | badge | Expected Revenue prefix, right row 5 | not observed | seen (m4f-create) | M4 | new |
| DF-21.2 | Deal Information | Lock icon | icon button | Expected Revenue, right edge, partly under Client Script | not observed | seen (m4f-create) | M4 | new |
| DF-23 | Deal Information | Campaign Source | input | right, row 6 | not observed | seen (m4f-create) | M7 | new |
| DF-24 | Deal Information | Campaign lookup icon | icon button | right, row 6, input right edge, partly covered | not observed | seen (m4f-create) | M7 | new |
| DF-25 | Description Information | Description | input | only multiline editor | same | seen (m4f-create) | M4 | AF-44 |
| DF-26 | Form footer | Standard View | select | after Create Form Views, before custom-page button | not observed; Accounts ref is source-only | seen (m4f-create) | M11 | AF-45 |
| DF-27 | Form footer | Create a custom form page | button | footer, far right | not observed; Accounts ref is source-only | seen (m4f-create) | M11 | AF-46 |
| DF-28 | Right edge | Client Script | tab | page right edge | same | seen (m4f-create) | M11 | AF-47 |
| DF-29 | Description Information | Resize grip | icon button | editor, lower-right corner | not observed | seen (m4f-create) | M4 | new |

Absent here: AF-05 Account image; AF-09–AF-10, AF-12–AF-15 and AF-17–AF-43 in their Accounts field positions; AF-48–AF-49. AF-08 is reused as DF-07 with the module name changed to Deal. There is no address section or Copy Address control. Absence here means absence from this painted create view, not proof of removal from configuration.

### Control inventory — m4f-create-stage

No saved screenshot or controls.json: the initial profile-in-use failure and the single authorized retry both produced no meta.json. No open-list control, search or Stage option is claimed as seen. Popup order cannot be compared with the exported Stages catalog.

Rest: not observed; expected baseline m4f-create; covered by the overlay: not observed.

### Control inventory — m4f-create-account

No saved screenshot or controls.json: profile in use on the initial attempt and its single authorized retry. Account lookup title, search, columns, row controls and footer are not observed in this task; AF-11.1–AF-11.18 remain shared reuse evidence only, not Deals popup observations.

Rest: not observed; expected baseline m4f-create; covered by the overlay: not observed.

### Control inventory — m4f-create-contact

No saved screenshot or controls.json: profile in use on the initial attempt and its single authorized retry. Contact lookup title, search, columns, row controls and footer remain not observed; no Account popup columns are assumed for Contacts.

Rest: not observed; expected baseline m4f-create; covered by the overlay: not observed.

### Control inventory — m4f-create-lower

No saved screenshot or controls.json: profile in use on the initial attempt and its single authorized retry. The Lead Source opening uses the uniquely validated create control, but no popup is claimed as seen. Description DF-25, resize grip DF-29 and footer DF-26–DF-27 are already unobscured in m4f-create, so their visual coverage does not depend on this failed attempt.

Rest: not observed; expected baseline m4f-create; covered by the overlay: not observed.

### Control inventory — m4f-detail-base

Not attempted: m4f-list-base has no record link to validate. No inventory by task scope; detail controls belong to the separate Deals detail task. Related-read baseline is not established.

### Control inventory — m4f-edit

Not attempted: no detail capture exists to supply an Edit selector. The required full Edit inventory remains not observed; no create inventory is presented as Edit evidence.

Rest: not observed; expected Edit baseline unavailable; covered by the overlay: not observed.

### Control inventory — m4f-list-after

No saved screenshot or controls.json: profile in use on the initial no-click attempt and its single authorized retry. No control or count is asserted. The initial count also was not observed; equality or a mismatch cannot be established.

Rest: not observed; expected baseline m4f-list-base; covered by the overlay: not observed.

### Shell controls missing from app-shell.md

No new shell control is visible in m4f-create. Reuse the missing-shell list in [contacts.md](contacts.md). Hover-only controls remain not observed.

## Edit form

Not observed. The list baseline is a loading skeleton and contains no record link. Under the single-match selector rule, neither the detail nor Edit opening can be attempted; no alternate record, route or selector was used. Create/edit differences, Edit title, actions, populated-control states and optional image section remain open questions. No record value is reproduced.

## Stage, probability and amount fields

Stage DF-19 is a required select. The create default Qualification and probability 10 agree with [deals.md](deals.md) › Stages; agreement after changing Stage is not observable without choosing a value, which this task forbids. Write-triggered probability changes belong to pipeline research (MEP-353). No pipeline selection control is painted. The expanded Stage list was not captured after the profile-in-use failure and its permitted retry; exported stage order is a metadata reference, not observed popup order.

Probability DF-20 appears as a single-line input without a readonly attribute in the saved evidence. Manual editing and range validation were not exercised. Expected Revenue DF-21 is visually muted with a lock and carries aria-readonly=true control evidence, agreeing with the metadata. Its calculation is not established by this capture; [deals.md](deals.md) records no exported formula.

Amount DF-15 uses a TL prefix DF-16 and information icon DF-17, comparable to Annual Revenue AF-15–AF-16 at a new position. The information icon was not opened. Expected Revenue has its own TL prefix and lock rather than the Amount information icon. Type, Next Step and Closing Date are single-field controls at the positions above; date behaviour reuses MEP-317 and [contacts-form.md](contacts-form.md), with the date placeholder visible here and no calendar opening.

Validation messages and post-save flows were not observed; refer to [leads-write-behaviour.md](leads-write-behaviour.md) and [duplicates.md](duplicates.md) for their documented shared rules, without asserting that untested rules apply to Deals.

## Lookups (Account, Contact, Campaign)

Account Name DF-08 has a required edge marker and a building-style lookup icon. Contact Name DF-13 has a person-style lookup icon and no required marker. Campaign Source DF-23 has a campaign-style lookup icon at the right, partly covered by Client Script; no required marker is visible. No autocomplete entry or search was performed.

Shared lookup structure comes from MEP-318 and [accounts-form.md](accounts-form.md) › Parent Account lookup. Popup differences are recorded only when actually painted below. Campaign popup opening is not among the authorized captures, so its title, columns, search and footer remain not observed.

## Differences from the Account form

The two-column field order is Deals-specific; the image and both address blocks in Accounts are not rendered here. Deal Name, Account Name, Closing Date and Stage have required markers, compared with Account Name alone in the Accounts create capture. Owner, header actions, Description, form customization and Client Script reuse the nearest controls noted above. Account lookup moves from left row 4 to row 3. Lead Source moves from the Contacts right row 1 to left row 6. Description and the footer are visible without opening a lower-form control in this create capture; the Accounts footer remained visually unobserved. Reason For Loss and Connected To are metadata create-enabled but have no painted control here.

## Form fields vs metadata

Source: [deals.md](deals.md) › Fields and layout. This comparison covers the painted create form only. Edit presence is assessed separately; metadata type does not prove an editor was rendered.

| Form field | Metadata API name | Metadata type | Deal form # | Reconciliation |
| --- | --- | --- | --- | --- |
| Deal Owner | Owner | ownerlookup | DF-05–DF-06 | Present |
| Amount | Amount | currency | DF-15–DF-17 | Present |
| Deal Name | Deal_Name | text | DF-07 | Present; required marker |
| Closing Date | Closing_Date | date | DF-18 | Present; required marker |
| Account Name | Account_Name | lookup | DF-08–DF-09 | Present; required marker |
| Stage | Stage | picklist | DF-19 | Present; required marker |
| Type | Type | picklist | DF-10 | Present |
| Next Step | Next_Step | text | DF-11 | Present |
| Probability (%) | Probability | integer | DF-20 | Present |
| Lead Source | Lead_Source | picklist | DF-12 | Present |
| Expected Revenue | Expected_Revenue | currency, readonly | DF-21 | Present; readonly |
| Contact Name | Contact_Name | lookup | DF-13–DF-14 | Present |
| Campaign Source | Campaign_Source | lookup | DF-23–DF-24 | Present |
| Description | Description | textarea | DF-25 | Present |
| Reason For Loss | Reason_For_Loss__s | picklist, create/edit enabled | — | No painted create control; conditional visibility unknown |
| Connected To | Connected_To__s | multi_module_lookup, create enabled | — | No painted create control |

Form fields without a metadata counterpart: none. The Deal Image section has no field entry in the exported Deals layout dictionary and is not painted here. Created By, Modified By, Created Time, Modified Time, Last Activity Time, Lead Conversion Time, Sales Cycle Duration, Overall Sales Duration, Tag and Record Id have no create-editor capability in the metadata; Change Log Time, Locked and Stage Modified Time are outside the layout. They are not missing create-enabled editors. The readonly Expected Revenue is still marked create-visible in the exported layout.

## Deal subform in lead conversion

No new conversion capture. Source: [lead-conversion.md](lead-conversion.md) › Fields. This compares only written conversion evidence and the painted m4f-create form.

| Conversion field | Deal form # | Same control? | Difference |
| --- | --- | --- | --- |
| Amount | DF-15–DF-17 | Same visible input/prefix/info arrangement | Conversion single column; standalone right row 1; conversion auto-focus is not exercised here |
| Deal Name | DF-07 | Same single-line required control | Conversion prefilled; standalone blank; left row 2 |
| Closing Date | DF-18 | Same required date input and DD.MM.YYYY placeholder | Standalone right row 2; calendar behaviour not compared |
| Stage | DF-19 | Same required select and Qualification default | Standalone right row 3; expanded options require this task's popup evidence |
| Campaign Source | DF-23–DF-24 | Same lookup input with right-edge trigger | Standalone right row 6; trigger partly covered; popup comparison not observed |
| Contact Role | — | No matching standalone control | Conversion relationship-role selector is outside the Deal subform; standalone not painted |
| Owner of the New Records | DF-05–DF-06 | Not established as identical | Conversion readonly owner input for all new records; standalone Deal Owner select with lookup |

Standalone Account Name, Type, Next Step, Lead Source, Probability, Expected Revenue, Contact Name and Description are not listed as conversion Deal-subform editors. This does not assert any conversion mapping beyond that spec.

## Capability table

| Capability | Inventory | Module | Reused from Accounts / Contacts or Deals-specific |
| --- | --- | --- | --- |
| Header actions and owner | DF-01–DF-06 | M4 / M11 | Accounts reused; action results not exercised |
| Deal fields, markers and order | DF-07–DF-15, DF-18–DF-21 | M4 | Deals-specific; Account/Contact lookup targets cross modules |
| Currency decoration | DF-16–DF-17, DF-21.1–DF-21.2 | M4 | Accounts money component reused at new position; Expected Revenue readonly is Deals-specific |
| Account lookup | DF-08–DF-09 | M3 | Contacts field, Accounts popup reused; required marker here |
| Contact lookup | DF-13–DF-14 | M2 | Shared lookup; Deals-specific placement |
| Campaign lookup | DF-23–DF-24 | M7 | Shared lookup shape; popup not observed |
| Lead Source | DF-12 | M4 | Contacts reused at new position |
| Description | DF-25, DF-29 | M4 | Accounts reused; visible resize grip added to inventory |
| Form views and Client Script | DF-26–DF-28 | M11 | Accounts/Contacts reused; footer first visually established here |
| Stage recalculation, validation and save | — | M4 | Not observed without write; pipeline/documentation research owns remaining behaviour |

## Source control reconciliation

Each controls.json item is mapped by one-based ordinal. Numbers describe visible controls, including duplicate DOM representations mapped to one control. Exclusions cover invisible elements, structural wrappers and items outside the screenshot viewport; no field value or source selector is reproduced. Image-only supplements are DF-16, DF-17, DF-21.1, DF-21.2, DF-29 and SH-46. The currency wrapper is also mapped to its field input; the prefix is counted separately from the image.

### m4f-list-base

| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: loading wrapper, no painted interactive control | 1 |
| Excluded: invisible zero-area element | 2–3 |

3 source items; 0 source-backed inventory numbers; 3 excluded.

### m4f-create

| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| SH-01 | 2, 3, 4 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29, 30, 31 |
| SH-10 | 33 |
| SH-11 | 34, 35 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 60, 61 |
| SH-25 | 63, 64 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98, 99 |
| SH-34 | 102, 103, 104, 105 |
| SH-35 | 202 |
| SH-36 | 203 |
| SH-37 | 204 |
| SH-38 | 205 |
| SH-39 | 206 |
| SH-40 | 207 |
| SH-41 | 208 |
| SH-42 | 209 |
| SH-43 | 210 |
| SH-44 | 211 |
| SH-45 | 212 |
| DF-01 | 109, 110 |
| DF-02 | 116, 117 |
| DF-03 | 114, 115 |
| DF-04 | 112, 113 |
| DF-05 | 126, 127 |
| DF-06 | 125 |
| DF-07 | 128, 129 |
| DF-08 | 130, 131, 132 |
| DF-09 | 133 |
| DF-10 | 135, 136 |
| DF-11 | 137, 138 |
| DF-12 | 139, 140 |
| DF-13 | 141, 142, 143 |
| DF-14 | 144 |
| DF-15 | 146, 147 |
| DF-18 | 150, 151 |
| DF-19 | 152, 153, 154 |
| DF-20 | 155, 156 |
| DF-21 | 157, 158 |
| DF-23 | 161, 162, 163 |
| DF-24 | 164 |
| DF-25 | 167, 168 |
| DF-26 | 170, 171, 172 |
| DF-27 | 173, 174 |
| DF-28 | 185 |
| Excluded: duplicate structural wrapper, section text or non-interactive title | 1, 37, 51, 59, 62, 83, 86, 107, 108, 111, 123, 124, 166, 169, 201 |
| Excluded: unpainted rail-boundary resize hit area | 82 |
| Excluded: outside visible viewport | 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 106 |
| Excluded: invisible zero-area element | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 81, 90, 91, 93, 94, 96, 97, 100, 101, 118, 119, 120, 121, 122, 134, 145, 148, 149, 159, 160, 165, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200 |

212 source items; 70 source-backed inventory numbers; 91 excluded. Six image-only controls bring visible inventory to 76 unique numbers.

## Capture refs

A dash means no meta.json exists; it is not zero clicks or zero skipped controls. Requested counts describe the authorized command, not a completed interaction. A failed launcher produced no auditable browser capture. No alternative selector, record or route was tried.

| Slug | Requested clicks per command | Clicks (meta) | Skipped (meta) | Evidence |
| --- | --- | --- | --- | --- |
| m4f-list-base | 0 | 0 | 0 | Loading skeleton; 9 GET calls; no count or record link |
| m4f-create | 0 | 0 | 0 | Painted complete Create form; inventory and selector source |
| m4f-create-stage | 1 | — | — | Profile in use on initial attempt and single retry; no files |
| m4f-create-account | 1 | — | — | Profile in use on initial attempt and single retry; no files |
| m4f-create-contact | 1 | — | — | Profile in use on initial attempt and single retry; no files |
| m4f-create-lower | 1 | — | — | Profile in use on initial attempt and single retry; no files |
| m4f-detail-base | 1 planned; not attempted | — | — | No record selector in the list baseline; related-read baseline not established |
| m4f-edit | 2 planned; not attempted | — | — | No detail/Edit selector source |
| m4f-list-after | 0 | — | — | Profile in use on initial attempt and single retry; no files |

The two saved screenshots were opened as images. m4f-create has visitor triggers × 1 (200), with six expected blocked background requests: reminder × 1, notification × 1 and telemetry × 4. No additional non-GET baseline path appears. m4f-list-base has no blocked request or non-GET entry. Failed captures have no meta.json/network.json, so request counts cannot be audited for those attempts. No successful record-write request is present in saved evidence. Total-record equality cannot be established from the initial loading view.

## Open questions

- Expanded Stage list, visible option order and search control remain not observed after both authorized attempts. Compare with deals.md › Stages only when a permitted capture succeeds; do not treat exported order as a screenshot observation.
- Account and Contact lookup popup title, search, columns, row controls and footer remain not observed after both authorized attempts. Account AF-11.1–AF-11.18 is reuse evidence only. Campaign lookup opening was outside the authorized capture list, so its popup also remains not observed.
- Edit title, actions, sections, populated-control states and create/edit differences are not observed: the list baseline supplies no record selector. No alternative path was used.
- Total-record comparison is not established: the initial list is a loading skeleton. No record count is inferred from a stage badge or loading state.
- Deal Image is configured as a layout section but not painted; Reason For Loss and Connected To are create-enabled metadata without painted controls. Conditional visibility is not observable from this screenshot.
- Probability editing, stage-driven changes and Expected Revenue calculation were not exercised. Write-triggered stage probability behaviour belongs to pipeline research (MEP-353); no stage option was selected here.
- Type options and the expanded Lead Source list were not observed. Their exported catalogs remain in deals.md. Amount information, form view customization, Client Script and hover-only controls were not operated.
- AF-45–AF-46 are source-only reuse references: their Accounts placement was not visually established, while the corresponding Deals footer is visible here. Preserve that distinction in implementation and review.

No new board decision is requested. No missing state justifies a record write, preference change or additional unlisted click. Raw reference images remain in the research workspace.

## Follow-up — Amount information icon (MEP-539)

Fresh no-click capture `m539-amount-base-v2` is painted and confirms DF-17 at the right edge of Amount, after the blank currency input. The Create form control inventory above remains the baseline; no additional visible control was established. No field was filled and no form action was operated.

The refreshed `controls.json` exposes the Amount input and hidden popover containers, but contains no entry or unique selector for the painted information icon. The input's `aria-describedby` points to `revenueInfo`; this attribute is not evidence of the icon's hover content. Zero-area popover containers do not establish a visible popup. The screenshot and control export were checked together before any hover was attempted.

Hover/click content, popup placement, dismissal and whether the icon is interactive remain **not observed**. Do not implement tooltip text or a calculator from these attributes alone. A capture-tool follow-up must expose this exact icon safely; no positional or guessed selector was used.

Capture: `m539-amount-base-v2` (screenshot, aria, controls, metadata and network). No clicks, hovers or scrolls; two background requests blocked (reminder and notification status). No record or preference operation was attempted.

### Refreshed icon inventory and hover evidence

The painted no-click capture `m539-amount-base-v3` now exports the information icon as `kind: "icon"` with the unique selector `#Crm_Potentials_AMOUNT div.cxBoxRightIcon div`. Its enclosing right-edge icon area is also exported. This supersedes the selector gap above, without changing the DF-17 control inventory.

`m539-amount-hover` uses the exact inner-icon selector. Metadata confirms one completed hover. The painted `step-1.png` and final screenshot show the complete Create form and the information icon, but no visible explanation, tooltip or popup. The step accessibility snapshot supplies no explanatory content. This establishes **no visible popup after the captured hover**, not that the icon has no click behaviour. No tooltip wording, placement or dismissal can be specified from this result. No click was requested in this continuation, and no field was filled.

Safety audit: `m539-amount-base-v3` blocked five background requests (reminder ×1, notification status ×1, telemetry ×3); `m539-amount-hover` blocked six (reminder ×1, notification status ×1, telemetry ×4). Screenshots, step evidence, controls and metadata were inspected together. Raw captures remain in the local research workspace. Click-triggered content and dismissal remain open questions; no record or preference operation was attempted.

### Follow-up after dialog-tool approval — paint gate (MEP-539)

The dialog-opening tool dependency is complete, but the next no-click baseline
did not paint a usable form. `m539-amount-base-v4` used an unverified module
route and shows only a loading skeleton; it is not evidence about the create
form. The single corrected baseline, `m539-amount-base-v5`, uses the native
module route already established by the earlier successful captures. It paints
the shell with a blank content area, without the Amount field. Neither capture
establishes new form or dialog behaviour.

Both screenshots were inspected with their controls and metadata. The first
exports three controls and records six failed static-script GETs with HTTP/2
protocol errors (plus six console error entries). The corrected baseline exports
114 shell controls, records two failed static-script GETs and client
initialization errors, and blocks one background telemetry POST. There were no
clicks, hovers, scrolls, dialog openings or submitted values in either capture.
No browser/profile repair or request-guard change was attempted.

Research stopped at the paint gate. The previous successful hover observation
remains valid; click content/dismissal, Stage badge activation, Assign, both
Contact Roles dialogs and natural many-card overflow remain open. Tool support
for initial Assign/Edit All opening is now available; usable screen painting is
the current access dependency. Raw captures remain local because they may
contain session or customer information.

### Low-load recovery attempt — paint gate remains closed (MEP-539)

Following the access diagnosis, `m539-amount-base-v6` repeats the established
native create route without interactions and with a 15-second wait. The
one-minute machine load before launch was 12.29, below the prescribed threshold
of 20. The screenshot still shows only the loading skeleton, not the form.
Ten static-script GET requests failed with HTTP/2 protocol errors; eight API
calls were recorded. Both blocked requests were background telemetry. There
were zero clicks, hover/scroll steps, dialog openings, print calls or popup
requests. Screenshot, controls and metadata were inspected together.

This is the first low-load recovery attempt, not a new form observation.
A single delayed retry is reserved after at least ten minutes; no browser,
profile or guard change is authorized by this result. All outstanding behaviour
questions above remain open. Raw evidence remains in the research workspace.
