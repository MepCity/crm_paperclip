# Deals — pipelines, stage board and stage transitions

Status: research for Grok QA inventory review, then UI Lead approval. MEP-353 / Module 4.

## Purpose

Describe Deals-specific pipeline structure and stage transitions without changing reference records or persisted preferences. Shared list controls reuse [accounts.md](accounts.md), then [contacts.md](contacts.md). The existing board inventory is in [deals.md](deals.md). Forecasts (P2), pipeline setup (M11), workflow and Blueprint configuration (M12) are outside this screen's implementation scope.

## Sources and evidence levels

| Evidence | Meaning | Scope |
| --- | --- | --- |
| seen (slug) | Saved screenshot opened as an image; controls reconciled | Existing m4-list-base; no new successful capture |
| metadata | Exported fields, layouts and history configuration | Values cross-checked against deals.md; not a screenshot or write observation |
| documented (D1–D7) | Public help text; each claim has an original supporting sentence in local keys.md | General capability, not proof of this organization's configuration |
| not observed | No usable image or explicit document evidence | No inferred labels, mandatory markers, messages or write results |

Documentation copies and evidence keys are kept in the local research workspace's docs-notes/m4-pipeline directory. URLs and original source text are not reproduced here. D1: creating Deals; D2: multiple sales pipelines; D3: Deals FAQ; D4: Kanban views; D5: Kanban FAQ; D6: layout rules; D7: picklist history tracking. Documentation screenshots were not used.

All three new capture commands were attempted with zero clicks and retried once after at least two minutes. Each failed with profile in use before producing meta.json, controls.json, network.json or screenshot.png. No alternate profile, selector or browser operation was attempted. Therefore the new base/after record comparison is **not observed**, rather than equal or changed. The existing m4-list-base is an explicitly older baseline, not a substitute current-state capture.

Detail and form specs are absent from origin/main at research time: their control references remain `pending` (MEP-346 and MEP-350). No record-detail/form capture was added to this task's image inventory.

## Pipelines and stages

| Property | Rule / observation | Source |
| --- | --- | --- |
| Pipeline | Tracks deal progress through sales stages | documented (D2) |
| Layout relationship | Pipelines belong to layouts; a layout may have several | documented (D2) |
| Stage membership | Stages belong to a particular pipeline | documented (D2) |
| Stage order | Pipeline stages can be reordered | documented (D2) |
| Stage removal | Removing a stage from a pipeline retains it in the stage builder | documented (D2) |
| Probability | Each stage has a probability; reuse across pipelines keeps the same probability | documented (D2) |
| Allowed probability | 0–100 | documented (D1) |
| Categories | Open: active sales cycle; Closed Won / Closed Lost: outside it | documented (D1) |
| Forecast relationship | Won maps to Closed, lost to Omitted; open supports further forecast categories | documented (D2) |
| Organization pipeline count / names | No Pipeline selector painted in the saved board; setup capture unavailable; multiplicity not established | not observed |

The exported Stage configuration below is the master picklist order, **not** evidence of membership or order in a named pipeline. Metadata: [deals.md — Stages](deals.md#stages). No Pipeline field is exported in Deals fields; this does not prove the absence of configured pipelines.

Generated from Stage.pick_list_values in exported order; Order preserves sequence_number (starts at 2).

| Order | Stage | Probability | Forecast category | Deal category |
| --- | --- | --- | --- | --- |
| 2 | Qualification | 10 | Pipeline | Open |
| 3 | Needs Analysis | 20 | Pipeline | Open |
| 4 | Value Proposition | 40 | Pipeline | Open |
| 5 | Identify Decision Makers | 60 | Pipeline | Open |
| 6 | Proposal/Price Quote | 75 | Pipeline | Open |
| 7 | Negotiation/Review | 90 | Pipeline | Open |
| 8 | Closed Won | 100 | Closed | Closed Won |
| 9 | Closed Lost | 0 | Omitted | Closed Lost |
| 10 | Closed Lost to Competition | 0 | Omitted | Closed Lost |

No layout-bound pipeline definition is present in the exported layout. Pipeline research must establish it separately. Identify Decision Makers has actual_value `Id. Decision Makers`; all other stage display/actual pairs agree.

## Stage (Kanban) view

The saved m4-list-base opens as a populated stage board. Seen: STAGEVIEW selector and adjacent pencil, three visible stage headers, four visible cards; remaining columns extend beyond the viewport. No total-record counter is painted. Header counts and currency totals display zero while cards are present, so neither establishes the total number of records. No empty column is visible; its placeholder, footer and empty text remain `not observed`.

| Aspect | Structure / behaviour | Source |
| --- | --- | --- |
| Columns | Qualification, Needs Analysis, Value Proposition are visible, left to right | seen (m4-list-base) |
| Headers | Stage label, count badge, probability, then amount total on a second line | seen (m4-list-base) |
| Card contents | Deal link, stage, account link, owner, contact link, amount, closing date, in that order | seen (m4-list-base) |
| Card action | Task/checkmark link at lower right on two cards; its outcome is not observed | seen (m4-list-base) |
| Card hover actions | No hover state captured | not observed |
| Grouping | Categorize by selects grouping | documented (D4) |
| Totals | Aggregate by selects summed values; optional | documented (D4) |
| Card fields | Select Fields determines displayed fields | documented (D4) |
| Sorting | Sort Records sorts by record fields | documented (D4) |
| Dragging | Moving a card changes its category and refreshes aggregates | documented (D4) |
| Missing category | Unaccounted holds records with no categorizing picklist value | documented (D5) |
| Layout / pipeline | Kanban filtering supports layout and pipeline | documented (D2) |
| Preference persistence | Applied layout/pipeline persist per user and Kanban view | documented (D4) |

## Control inventory

### Control inventory — m4-list-base

Full inventory of the existing image because this task owns the board. DP numbers reuse the suffixes of deals.md's DL numbers; gaps are intentional. Shell: SH-01–SH-46 as in contacts.md; SH-16 (Deals) active, Accounts/Contacts inactive. Module title is static. Shared controls inherit the cited spec's observation limits; `same` does not claim an action was tested. No control was clicked.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DP-01 | View strip | All Deals | tab | left, first | same | seen (m4-list-base) | M4 | AL-01 |
| DP-02 | View strip | Three dots icon | icon button | after current view tab | same | seen (m4-list-base) | M4 | AL-02 moved |
| DP-03 | Toolbar | Filter | button | left group, first | same | seen (m4-list-base) | M4 | AL-03 |
| DP-04 | Toolbar | Sort | button | left group, second | same | seen (m4-list-base) | M4 | AL-04 |
| DP-05 | Toolbar | List view icon | icon button | view group, first | same | seen (m4-list-base) | M4 | AL-05 |
| DP-06 | Toolbar | Kanban view icon (active) | icon button | view group, second | same | seen (m4-list-base) | M4 | AL-06 |
| DP-07 | Toolbar | Sheet view icon | icon button | view group, third | same | seen (m4-list-base) | M4 | AL-07 |
| DP-08 | Toolbar | Chart view icon | icon button | view group, fourth | same | seen (m4-list-base) | M4 | AL-08 |
| DP-09 | Toolbar | Timeline view icon | icon button | view group, fifth | same | seen (m4-list-base) | M4 | AL-09 |
| DP-10 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | same | seen (m4-list-base) | M4 | AL-10 |
| DP-11 | Toolbar | Down chevron | icon button | view group, seventh | same | seen (m4-list-base) | M4 | AL-11 |
| DP-12 | Toolbar | Create Deal | button | right group, first | same | seen (m4-list-base) | M4 | AL-12 |
| DP-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Deal | same | seen (m4-list-base) | M6 | AL-13 |
| DP-14 | Toolbar | Three dots / Actions | icon button | right group, far right | same | seen (m4-list-base) | M4 | AL-14 |
| DP-15 | Filter panel | Search | input | below Filter Deals by heading | same | seen (m4-list-base) | M4 | AL-15 |
| DP-16 | Filter panel | System Defined Filters | toggle | first section heading | same | seen (m4-list-base) | M4 | AL-16 |
| DP-20 | Filter panel | Locked | checkbox | system-defined section, Locked | same | seen (m4-list-base) | M4 | AL-20 moved |
| DP-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | same | seen (m4-list-base) | M4 | AL-21 moved |
| DP-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | same | seen (m4-list-base) | M4 | AL-22 moved |
| DP-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | same | seen (m4-list-base) | M4 | AL-23 moved |
| DP-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | same | seen (m4-list-base) | M4 | AL-24 moved |
| DP-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | same | seen (m4-list-base) | P3 | AL-25 moved |
| DP-26 | Filter panel | Filter By Fields | toggle | second section heading | same | seen (m4-list-base) | M4 | AL-26 |
| DP-27 | Filter panel | Account Name | checkbox | field section, first row | same | seen (m4-list-base) | M3 | AL-27 |
| DP-17 | Filter panel | Activities | checkbox | system section, first row | same | seen (m4-list-base) | M5 | L-17 |
| DP-19 | Filter panel | Latest Email Status | checkbox | system section, second row | same | seen (m4-list-base) | M10 | L-19 moved |
| DP-65 | Filter panel | Amount | checkbox | field section, second row | not observed | seen (m4-list-base) | M4 | new |
| DP-66 | Filter panel | Campaign Source | checkbox | field section, third row | not observed | seen (m4-list-base) | M7 | new |
| DP-67 | Filter panel | Closing Date | checkbox | field section, fourth row | not observed | seen (m4-list-base) | M4 | new |
| DP-68 | Filter panel | Connected To | checkbox | field section, fifth row | same | seen (m4-list-base) | M4 | L-30 moved |
| DP-69 | Filter panel | Contact Name checkbox (label clipped) | checkbox | field section, sixth row, clipped at bottom | same | seen (m4-list-base) | M2 | L-31 moved |
| DP-70 | Board toolbar | STAGEVIEW | select | below main toolbar, left | not observed | seen (m4-list-base) | M4 | new |
| DP-71 | Board toolbar | Pencil icon | icon button | after STAGEVIEW | not observed | seen (m4-list-base) | M4 | new |
| DP-72 | Board | Qualification | badge | first visible stage header | not observed | seen (m4-list-base) | M4 | new |
| DP-73 | Board | Needs Analysis | badge | second visible stage header | not observed | seen (m4-list-base) | M4 | new |
| DP-74 | Board | Value Proposition | badge | third visible stage header, right edge | not observed | seen (m4-list-base) | M4 | new |
| DP-75 | Board | Stage record count | badge | beside each visible stage label | not observed | seen (m4-list-base) | M4 | new |
| DP-76 | Board | Stage probability | badge | after count and separator in each header | not observed | seen (m4-list-base) | M4 | new |
| DP-77 | Board | Stage amount total | badge | second line of each visible stage header | not observed | seen (m4-list-base) | M4 | new |
| DP-78 | Board card | Deal record link | link | card first line | same | seen (m4-list-base) | M4 | AL-42 moved |
| DP-79 | Board card | Account record link | link | card third line | same | seen (m4-list-base) | M3 | AL-42 moved |
| DP-80 | Board card | Contact record link | link | card fifth line | same | seen (m4-list-base) | M2 | L-42 moved |
| DP-81 | Board card | Task with checkmark icon | link | card bottom right where present | not observed | seen (m4-list-base) | M5 | new |

Absent here: AL-33–AL-36, AL-39–AL-40, AL-45–AL-46, AL-48–AL-63 in their table/filter positions; AL-42 is reused in cards. AL-64 refresh footprint is not painted. L-18 Campaigns system filter is absent. No table pagination, selection checkboxes or stage footer creation control is painted.

Card owner, stage, amount and date text are record data, not separate controls. The three source stage labels are non-operated badges, not verified stage-update buttons. DP-75 and DP-76 plus SH-46 are image-only additions. No visible resize grip was found.

### Control inventory — m4p-list-base

No inventory rows: both attempts failed before files existed. No screenshot comparison or record count possible. Rest: not established against m4-list-base; covered by the overlay: not applicable (no image).

### Control inventory — m4p-setup-pipeline

No inventory rows: the address suffix was found in setup-deal-management's existing Pipelines link, but both no-click attempts failed before files existed. No setup labels or controls inferred. Rest: not observed; covered by the overlay: not applicable (no image).

### Control inventory — m4p-list-after

No inventory rows: both attempts failed before files existed. Base/after equality is not observed. Rest: not established against m4-list-base; covered by the overlay: not applicable (no image).

### Documented controls — not captured

Positions are limited to the documented region; order is `not observed`. These are capability evidence, not additional controls proven present in this organization's screenshot. No screenshot-based counts include these rows.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DP-90 | Kanban settings | Kanban View Name | input | settings; order not observed | Names view | documented (D4) | M4 | new |
| DP-91 | Kanban settings | Categorize by | select | settings; order not observed | Groups records | documented (D4) | M4 | new |
| DP-92 | Kanban settings | Aggregate by | select | settings; order not observed | Selects aggregate | documented (D4) | M4 | new |
| DP-93 | Kanban settings | Select Fields | not observed | settings; exact widget not observed | Selects card fields | documented (D4) | M4 | new |
| DP-103 | Kanban settings | Header style | select | settings; order not observed | Chooses header style | documented (D4) | M4 | new |
| DP-94 | Kanban selector menu | Create Kanban View | menu item | dropdown; order not observed | Creates view | documented (D4) | M4 | new |
| DP-95 | Kanban selector menu | Manage Kanban Views | menu item | dropdown; order not observed | Manages views | documented (D4) | M4 | new |
| DP-96 | Kanban board | Pipeline | select | board; order not observed | Selects pipeline for Stage grouping | documented (D4) | M4 | new |
| DP-97 | Stage footer | Stage-specific creation button (label not observed) | button | each stage footer | Creates stage-specific records | documented (D4) | M4 | new |
| DP-98 | Record detail | Quick stage-update section | not observed | detail; exact widget/order not observed | Updates stage/date | documented (D1) | M4 | pending |
| DP-99 | Verify Details | Amount | not observed | won popup; order not observed | Confirms amount | documented (D1) | M4 | new |
| DP-100 | Verify Details | Closing date | not observed | won popup; order not observed | Confirms date | documented (D1) | M4 | new |
| DP-101 | Verify Details | Stage | not observed | won popup; order not observed | Confirms stage | documented (D1) | M4 | new |
| DP-102 | Verify Details | Reason for Loss | select | lost popup; order not observed | Chooses loss reason | documented (D1) | M4 | new |

No invented popup submit/cancel/close labels or mandatory asterisks. D4 documents expand/collapse capability but not a control label/type/position; its visual control remains an open question. DP-93, DP-98, DP-99, DP-100 and DP-101 widget types are not observed; no concrete control type is asserted.

### Shell controls missing from app-shell.md

No additional shell control beyond contacts.md's existing missing-shell list. Shared utility-control ownership marked `?` in contacts.md remains unresolved there; no new module assignment is inferred.

### Reconciliation — m4-list-base

Source item ordinals are one-based, never selectors. Each item has one ID or explicit exclusion. References were checked in Accounts first, then Contacts; DP-70–DP-81 correspond to deals.md DL-70–DL-81. The screenshot was scanned including rail, top bar, toolbar, filter panel, card edges, right edge and bottom utilities.

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| DP-01 | 112 |
| DP-02 | 113–116 |
| DP-03 | 117 |
| DP-04 | 118 |
| DP-05 | 120 |
| DP-06 | 121 |
| DP-07 | 122 |
| DP-08 | 123 |
| DP-09 | 124 |
| DP-10 | 125 |
| DP-11 | 126–127 |
| DP-12 | 130 |
| DP-13 | 131–132 |
| DP-14 | 133 |
| DP-15 | 140–141 |
| DP-16 | 143 |
| DP-17 | 145–146 |
| DP-19 | 147–148 |
| DP-20 | 149–150 |
| DP-21 | 151–152 |
| DP-22 | 153–154 |
| DP-23 | 155–156 |
| DP-24 | 157–158 |
| DP-25 | 159–160 |
| DP-26 | 161 |
| DP-27 | 163–164 |
| DP-65 | 165–166 |
| DP-66 | 167–168 |
| DP-67 | 169–170 |
| DP-68 | 171–172 |
| DP-69 | 173–174 |
| DP-70 | 134–136 |
| DP-71 | 137 |
| DP-72 | 242 |
| DP-73 | 253 |
| DP-74 | 272 |
| DP-77 | 243, 254, 273 |
| DP-78 | 245–246, 256–257, 265–266, 275–276 |
| DP-79 | 247–248, 258–259, 267–268, 277–278 |
| DP-80 | 249–250, 260–261, 269–270, 279–280 |
| DP-81 | 252, 263 |
| SH-01 | 2–4 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| SH-35 | 306 |
| SH-36 | 307 |
| SH-37 | 308 |
| SH-38 | 309 |
| SH-39 | 310 |
| SH-40 | 311 |
| SH-41 | 312 |
| SH-42 | 313 |
| SH-43 | 314 |
| SH-44 | 315 |
| SH-45 | 316 |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 83, 87, 111, 119, 139, 144, 162, 240, 305 |
| excluded: invisible below panel boundary or beyond horizontal viewport | 65–80, 175–236, 282–288 |
| excluded: invisible refresh footprint; no painted icon | 128–129 |
| excluded: invisible resize hotspot; no painted grip | 82, 239 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 138, 142, 237–238, 241, 289–304 |
| excluded: record card wrapper or record amount data | 244, 251, 255, 262, 264, 271, 274, 281 |

316 source items; 86 inventory IDs represented; 158 excluded items.

## Stage transitions

| Entry point | Supported behaviour / limit | Source |
| --- | --- | --- |
| Detail quick stage section | Updates Stage and Closing date; exact click/save sequence not specified | documented (D1) |
| Form / inline Stage update | Stage-based layout rules can prompt for mandated fields on detail edits; form/inline widget and commit sequence remain not observed | documented (D6) |
| Card drag to another column | Updates category; aggregate refresh | documented (D4) |
| Stage-based required fields | A configured rule can prompt from detail, Blueprint or pipeline; drag evaluates rules | documented (D6) |
| Read-only categorizing field | A rule locking it prevents moving to another category | documented (D6) |
| Stage to probability automatic update | Mapping exists; exact record-field overwrite timing and manual override behaviour not established | not observed |
| Closed to open | Reopening entry point, validation and retained values not established | not observed |
| Closed lost to won, then lost again | Loss reason hidden while won; a new loss requires selecting it again | documented (D1) |

No transitions were executed. Organization-specific Stage rules are not observed. Blueprint/workflow names explain possible constraints only; no configured automation is inferred.

## Closing a deal (won / lost)

| Case | Behaviour / fields | Source |
| --- | --- | --- |
| Won category | Selecting a won stage opens Verify Details with amount, date and stage | documented (D1) |
| Lost category | Loss popup adds Reason for Loss | documented (D1) |
| Loss reason visibility | Only closed-lost stages expose the loss reason | documented (D1) |
| Organization requiredness | Stage is required; Closing Date is layout-required; Amount and Reason For Loss are not statically required | metadata (deals.md — Fields and layout) |
| Popup validation | Field asterisks, defaults, requiredness beyond static metadata, error text, cancel behaviour and save-success state | not observed |

Metadata loss-reason options reuse [deals.md — Picklists](deals.md#picklists), without copying the catalog. The loss dialog's amount/date/stage parity with the won dialog is not explicit enough in D1 to assert its complete field set. Static optionality is not proof of popup optionality.

## Stage history and derived fields

| Aspect | Behaviour / constraint | Source |
| --- | --- | --- |
| Tracking | Picklist history tracks updates and related values; Deals has a default stage-history related list | documented (D7) |
| Default history fields | Picklist value, duration, modified time, modified by, moved to | documented (D7) |
| Ordering | History listed chronologically | documented (D3) |
| Metadata binding | Stage tracks DealHistory; duration field is Stage_Duration_Calendar_Days | metadata (deals.md — Stage History module) |
| Exported history fields | Reuse full catalog in deals.md; no live rows observed | metadata (deals.md — Stage History module) |
| Expected Revenue | Automatically calculated from Stage and Amount; not manually entered | documented (D3) |
| Formula / rounding | Exact percentage equation, rounding, null handling and recalculation timing not explicit in selected sources | not observed |
| Probability | Probability participates in Expected Revenue calculation | documented (D1) |
| History customization conflict | D3 says non-customizable; D7 permits extra columns/name changes; organization UI not established | documented (D3, D7) |
| Same-stage write / edits to Amount only | Whether these create a new history row, and transactional failure behaviour | not observed |

Expected Revenue is exported read-only currency, two decimal places. Stage Modified Time is exported datetime, outside layout and field-read-only. These are metadata properties, not proof of a particular write outcome.

## Evidence gaps

| Topic | Documented (D key) | Not image-verified | Required to obtain image / behaviour |
| --- | --- | --- | --- |
| Current base / after equality | — | Current board and overall record count | Working capture tool; fresh no-click snapshots |
| Pipeline multiplicity / membership | D2 structure only | Organization names, count, ordering | Working no-click setup capture; no preferences changed |
| Settings / selector menu | D4 | Concrete widgets and available rows | Opening controls; not authorized in this task |
| Layout / Pipeline selection | D2, D4 | Presence and selected defaults | Persisted preference change; forbidden |
| Empty / offscreen columns, footer | D4 capability only | Empty text, create button, collapse control | Unseen columns/state; no preference operation authorized |
| Card hover | D1 owner hover only | Additional icons/actions | Hover capture unavailable |
| Card drag / stage selection | D1, D4 | Drag ghost, confirmation, rollback, success | Stage write; forbidden |
| Won/lost popup | D1 | Geometry, full loss field set, defaults, validation | Stage write; forbidden |
| Probability recalculation | D1 mapping only | Auto-overwrite, override retention | Stage write; forbidden; explicit documentation still needed |
| Expected Revenue equation | D1, D3 dependencies only | Formula, rounding, null behaviour | Explicit documentation or write; write forbidden |
| History results / customization conflict | D3, D7 | New-row timing, same-stage writes, configurable columns | Write for results; configuration observation remains separate |
| Reopen to an open stage | — | Entry point, validation, retained reason/date | Stage write; forbidden; explicit documentation still needed |
| Organization stage rules | D6 general behaviour | Configured mandatory fields / blocked stages | Metadata/rule evidence or write; write forbidden |

## Capability table

| Capability | Accounts / Contacts reuse | Deals-specific | Module | Evidence |
| --- | --- | --- | --- | --- |
| Shell, views, filters, toolbar | Accounts AL refs; Contacts SH and L fallbacks | Stage presentation replaces table | M4 | seen (m4-list-base) |
| Record navigation | AL-42 / L-42 moved | Deal/account/contact card links | M4 / M3 / M2 | seen (m4-list-base) |
| Stage headers and card field order | — | DP-70–DP-81 | M4; task action M5 | seen (m4-list-base) |
| Pipeline / ordered stages | — | Layout-bound pipelines, stage probability/categories | M4; setup M11 | documented (D1, D2); metadata |
| Kanban settings / sorting / dragging | Shared pattern; no prior observed board copied | Stage grouping and Pipeline selector | M4 | documented (D4) |
| Verify Details / loss reason | — | Won/lost transitions | M4 | documented (D1) |
| History / derived revenue | — | Stage tracking and calculated field | M4 | documented (D3, D7); metadata |
| Conditional rule / Blueprint traces | — | Stage prompts / movement constraints | M12 | documented (D6) |
| Forecast category semantics | — | Stage mapping only, no forecast screen | P2 | documented (D2); metadata |

## Capture refs

| Slug | Evidence available | Clicks / skipped | Result |
| --- | --- | --- | --- |
| m4-list-base | Existing screenshot, controls, metadata, network | 0 / 0 | Stage board; four visible cards; overall count absent |
| m4p-list-base | None after two attempts | Requested 0; skipped not recorded | profile in use |
| m4p-setup-pipeline | None after two attempts | Requested 0; skipped not recorded | profile in use; link recovered from setup-deal-management |
| m4p-list-after | None after two attempts | Requested 0; skipped not recorded | profile in use; count comparison not observed |

No GET-outside-baseline or blocked-request assertion is possible for failed captures. Existing m4-list-base network safety audit is recorded in the issue comment; it is not a new after-state audit.

## Open questions

1. Current base/after state and organization pipeline multiplicity remain not observed because captures failed.
2. DP-70 menu and DP-71 settings contents are documented, not opened here; precise widget types remain unverified.
3. Empty/offscreen column presentation, footer creation and expand/collapse icon position are not observed.
4. Additional card hover actions are not observed; D1 describes owner on hover while this saved board paints owner text directly.
5. Probability auto-update/manual override and exact Expected Revenue equation/rounding remain not observed.
6. Closing requiredness and error/success/cancel states, loss-dialog complete field set and closed-to-open reopening remain not observed without a write.
7. D3 and D7 disagree on Stage History customization; no organization-specific resolution claimed.
8. Stage-based layout rules, Blueprint restrictions and same-stage/history row behaviour remain not observed.
9. Detail stage bar and form Stage control references are pending until MEP-346 / MEP-350 enter main.
10. Shared shell utility module owners marked `?` remain the questions recorded in contacts.md.
