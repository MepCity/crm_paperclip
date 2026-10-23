# Customization — Personal locale (R3)

## Purpose and evidence status

Inspect the initial Personal Settings page without clicks, input, hover,
scrolling, editor opening or preference changes. This research informs
MEP-496 and ADR 0011; it does not establish an organization formatting policy.
Module 2+ parity applies: control inventory and behaviour, without visual
measurements or frontend request-shape specifications.

**Bounded evidence, pending UI Lead review:** the initial viewport is painted,
but Locale Information is below the content viewport. Its rows are present in
both page.txt and aria.yml, without being visually verified in screenshot.png.
An additional page error occurred; live research stopped after this single
capture. Do not treat this as full visual acceptance of the lower page or as
verification of working locale controls.

## Capture refs

- `captures/m11r3-personal-locale/`, captured 2026-10-23 17:10 UTC.
- One capture, no steps or clicks; target `/crm/<org>/settings/personal-settings`.
  This destination was evidenced by the Personal Settings anchor in
  `captures/m11r2-company-details-resume/controls.json`, entries 18–19.
- screenshot.png, aria.yml, page.txt, controls.json, network.json, meta.json
  and progress.json remain in the local research workspace. Raw personal and
  organization values are neither committed nor uploaded.
- Prior organization-level comparison:
  [Company details and currencies](customization-company-locale.md).

## Layout

The left settings navigation, global top utilities and bottom utility strip
match the Company Details shell. Personal Settings is selected in the sidebar.
The main panel has Personal Settings (active) and Accessibility (inactive) tabs.
An identity header contains an avatar, user name, profile badge, role and
organization links, email display and pencil affordance. Values are omitted.
Hide Details is shown above expanded User Information. Address Information
begins near the bottom of the initial viewport; only its first row is visible.

The unchanged DOM text continues with the remaining address rows, Audit
Information, Teamspace Information, Locale Information, Groups, and Display
Name Format & Preferences. These lower sections are clipped by the content
scroll container. No scrolling was performed. Their presence in text/ARIA
must not be represented as screenshot-confirmed visibility.

## Fields and format observations

The following table describes the **representation**, not the current user's
selected personal values. All locale rows below are text/ARIA evidence only.
No language, country, time-zone name, actual offset, unit choice or exact
numeric sample is reproduced.

| Row | Representation in the initial DOM | Evidence / limit |
| --- | --- | --- |
| Language | Language display name followed by a parenthesized regional variant | Locale Information rows in page.txt and aria.yml; alternatives unopened |
| Country Locale | A country display name, separate from Language | Same; no country-code selector or option set observed |
| Date Format | Uppercase day/month/year tokens; two-digit day, two-digit month, four-digit year, separated by periods (`DD.MM.YYYY`) | A format token string, not a person's date |
| Time Format | Hour-cycle label consisting of a number plus “Hours”; denotes a twelve-hour clock | No time picker or option list observed |
| Time Zone | Parenthesized GMT offset, human-readable zone name, then parenthesized IANA region/city identifier | Actual offset and zone omitted; no selector opened |
| Preferred Unit for Distance | Unit display name with a parenthesized abbreviation | Adjacent locale row; selected unit omitted |
| Number Format | Numeric illustration with period grouping and comma decimal separator; three digits on either side of each displayed separator | Structural pattern `ddd.ddd,ddd`; no currency symbol; not a stored amount or evidence of currency precision |

Country in Address Information is a separate profile/address field; it must
not be conflated with Country Locale. User Information includes first/last
name, email, role, profile, alias, phone, mobile, website, fax and date of birth.
No profile/contact values are copied. A blank date-of-birth row does not
establish input syntax or validation. Audit timestamps use a weekday, day,
abbreviated month, year and a time with an AM/PM marker in the text export;
this differs from the locale date token string and prevents assuming all
screen timestamps use one renderer.

The local metadata exports cover CRM modules, profiles, roles and related
configuration, not a dedicated personal-locale schema. No metadata API was
called and no storage key, type, default or persistence layer is inferred
from a label or editor placeholder.

## Control inventory

`P` refers to one-based entries in this capture's controls.json. Numbers
identify distinct controls, not nested wrapper/anchor duplicates. The shared
shell below was reconciled against this screenshot and export; sources
1–253 match the preceding R2 shell positions, while the bottom strip is now
P374–384. Positions are qualitative. All controls were untouched; actions
are affordances, not tested outcomes. Screenshot-only controls have no
exported selector. Hidden dialogs and offscreen nodes are not counted as
visible controls.

### Initial viewport — shared shell

| No. | Position / visible control | Observed affordance / limit | Source | Owner |
| --- | --- | --- | --- | --- |
| 1 | Sidebar top, back arrow | Return navigation; not opened | P3 + image | Shell |
| 2 | Sidebar top, Setup Home | Setup landing link | P4–5 | Settings |
| 3 | Sidebar top right, sliders | Settings editor affordance; forbidden to open | P6–7 + image | Settings |
| 4 | Sidebar beneath header, Search | Empty settings search input; no typing | P8–9 | Settings |
| 5 | Sidebar, Frequently Used heading/chevron | Expanded accordion; no preference change | P10–11 | Settings |
| 6 | Below Frequently Used, Profiles | Profile settings shortcut | P13–14 | Settings |
| 7 | Sidebar, General heading/chevron | Expanded accordion; untouched | P15–16 | Settings |
| 8 | General, Personal Settings | Selected personal-settings navigation; no click | P18–19 | Settings |
| 9 | General, Users | User settings navigation | P20–21 | Settings |
| 10 | General, Company Settings | Company-settings navigation; unopened | P22–23 | Settings |
| 11 | General, Calendar Booking | Booking settings navigation | P24–25 | Settings |
| 12 | General, Motivator | Motivation settings navigation | P26–27 | Settings |
| 13 | General, Agents | Agent settings navigation | P28–29 | Settings |
| 14 | Sidebar, Security Control heading/chevron | Expanded accordion; untouched | P30–31 | Settings |
| 15 | Security Control, Profiles | Profile settings navigation | P33–34 | Settings |
| 16 | Security Control, Roles and Sharing | Roles/sharing navigation | P35–36 | Settings |
| 17 | Security Control, mail add-on users | Mail add-on settings link; neutralized label | P37–38 + image | Settings |
| 18 | Security Control, Compliance Settings | Compliance settings navigation | P39–40 | Settings |
| 19 | Security Control, Territory Management | Territory settings navigation | P41–42 | Settings |
| 20 | Security Control, Trusted Domain | Trusted-domain navigation | P43–44 | Settings |
| 21 | Security Control, Support Access | Support-access navigation | P45–46 | Settings |
| 22 | Security Control, Single Sign-On | SAML settings affordance | P47 | Settings |
| 23 | Security Control, Security Policies | Security-policy affordance | P48 | Settings |
| 24 | Security Control, Active Directory Sync | Directory-sync affordance | P49 | Settings |
| 25 | Security Control, Login History | Login-history affordance | P50 | Settings |
| 26 | Sidebar lower edge, Audit Log | Audit navigation; partly clipped | P51–52 + image | Settings |
| 27 | Global top bar, Search records | Global search affordance; untouched | P234 | Shell |
| 28 | Global top bar, plus | Global create affordance; forbidden | P235 | Shell |
| 29 | Global top bar, assistant icon | Assistant affordance; neutralized label | P237 + image | Shell |
| 30 | Global top bar, bell | Notifications affordance | P238 | Shell |
| 31 | Global top bar, calendar | Calendar navigation | P239 | Shell |
| 32 | Global top bar, storefront | Marketplace affordance | P242 | Shell |
| 33 | Global top bar, gear | Setup selected | P245 | Shell |
| 34 | Global top bar, avatar | Profile menu affordance | P248–249 | Shell |
| 35 | Global top bar, grid | Applications menu affordance | P252–253 | Shell |
| 36 | Bottom left, My Pins | Pins utility | P374 | Shell |
| 37 | Bottom left, Chats | Chat utility | P375 | Shell |
| 38 | Bottom left, Contacts | Contacts utility | P376 | Shell |
| 39 | Bottom right strip, command icon | Command palette affordance | P377 | Shell |
| 40 | Bottom right strip, megaphone | Announcements affordance | P378 | Shell |
| 41 | Bottom right strip, chart | Motivator affordance | P379 | Shell |
| 42 | Bottom right strip, note icon | Sticky Notes affordance | P380 | Shell |
| 43 | Bottom right strip, alarm | Activity Reminders affordance | P381 | Shell |
| 44 | Bottom right strip, recent icon | Recent Items affordance | P382 | Shell |
| 45 | Bottom right strip, accessibility | Accessibility affordance | P383 | Shell |
| 46 | Bottom right strip, Help | Help affordance | P384 | Shell |
| 47 | Bottom far right, bin icon | Utility bin affordance; destination unverified | Image only | Shell |

### Initial viewport — personal content

| No. | Position / control | Observed affordance / limit | Source | Owner |
| --- | --- | --- | --- | --- |
| 48 | Content tab, Personal Settings | Active tab | P258–260 + image | Personal settings |
| 49 | Content tab, Accessibility | Inactive navigation tab; unopened | P261–263 + image | Accessibility |
| 50 | Identity header, profile badge | Profile-details link; value omitted | P266 + image | User/profile settings |
| 51 | Identity header, pencil | Profile editor affordance; forbidden, unopened | P267 + image | Personal settings |
| 52 | Identity header, role | Role-details link; value omitted | P270 + image | Roles |
| 53 | Identity header, organization | Company-details link; value omitted | P271 + image | Company settings |
| 54 | Above User Information, Hide Details | Expanded detail visibility control; no preference change | P272–274 + image | Personal settings |
| 55 | User Information, First Name value area | Exported button role; edit behaviour untested | P277 + image | Personal settings |
| 56 | User Information, Last Name value area | Exported button role; untouched | P280 + image | Personal settings |
| 57 | User Information, Email value area | Button wrapper around email anchor; one logical row action | P283–284 + image | Personal settings |
| 58 | User Information, Role value area | Exported button role; untouched | P286 + image | User/role settings |
| 59 | User Information, Profile value area | Exported button role; untouched | P289 + image | User/profile settings |
| 60 | User Information, Alias value area | Exported button role even when visually blank; untouched | P292 + image | Personal settings |
| 61 | User Information, Phone value area | Exported button role; untouched | P295 + image | Personal settings |
| 62 | User Information, Mobile value area | Exported button role; untouched | P298 + image | Personal settings |
| 63 | User Information, Website value area | Exported button role; hidden zero-size anchor is not a second visible control | P301–303 + image | Personal settings |
| 64 | User Information, Fax value area | Exported button role; untouched | P305 + image | Personal settings |
| 65 | User Information, Date of Birth value area | Exported button role; untouched | P308 + image | Personal settings |
| 66 | Address Information, Street value area | Exported button role; last visible content row | P311 + image | Personal settings |

Reconciliation: 398 exported entries, **66 distinct initial-viewport controls**.
Broad containers, text labels, duplicate wrappers, presentation icons,
zero-size modal placeholders and offscreen nodes are excluded. The avatar
and identity-header email are display content; no action is established.
The City row starts below the clipped content viewport, despite its
positive bounding box. This is why export entry count is not a visible
control count. P398 identifies the overflowing main content scroll container;
it is a navigation surface, not an additional action, and was not scrolled.

### Below viewport — separate provisional DOM inventory

These numbers continue the inventory for traceability but are **not** added
to the 66 visible controls. No screenshot confirmation or interactions exist.

| No. | Lower-page location / node | Evidence / limit | Source | Owner |
| --- | --- | --- | --- | --- |
| 67 | Address, City value | Button-role field node | P314 | Personal settings |
| 68 | Address, State value | Button-role field node | P317 | Personal settings |
| 69 | Address, Zip Code value | Button-role field node | P320 | Personal settings |
| 70 | Address, Country value | Button-role field node; separate from locale | P323 | Personal settings |
| 71 | Audit, Added By value | Button-role field node | P326–327 | User audit |
| 72 | Audit, Modified By value | Button-role field node | P329–330 | User audit |
| 73 | Audit, Invited By value | Button-role field node | P332–333 | User audit |
| 74 | Audit, Confirmed Time value | Button-role field node | P335–336 | User audit |
| 75 | Audit, Status Updated By value | Button-role field node | P338–339 | User audit |
| 76 | Teamspace association icon | Exported node; action not established | P340–341 | Teamspace |
| 77 | Locale Information heading, edit node | `#localeEditDiv`; zero-size editor modal is unopened | P342–343 + ARIA | Personal locale |
| 78 | Groups heading, add node | Write-capable affordance; unopened | P346 | Groups |
| 79 | Name Format | Collapsed combobox; persisted preference untouched | P350–352 + ARIA | Personal preferences |
| 80 | Sort order preference | Collapsed combobox; persisted preference untouched | P354–356 + ARIA | Personal preferences |

The seven locale rows are static cells in aria.yml, not individual observed
selectors or dropdowns. The export's hidden native selects P349/P353 and
their text options are not proof of opened menus. No locale choice set is
visible or enumerated. Zero-size locale/group dialogs do not imply an open
editor. This inventory cannot establish lower-page icon appearance.

## Actions, filters, flows and states

1. Navigate once through the capture tool to the evidenced personal-settings
   path, without steps. Observe the resting page and export its evidence.
2. Inspect that saved evidence only. Do not open the pencil, locale edit,
   profile rows, details toggle, Accessibility tab or preference comboboxes.
3. Stop live inspection when the additional page error is found; no retry,
   scroll capture or alternative route follows it.

There is no record table, filter, pagination or sort action in the visible
content. The lower name-order preference is not a list sorting control.
Shell searches remain untouched. No save, validation, success, server error,
permission-denied, empty search or preference propagation flow was exercised.
Captured runtime errors are research diagnostics, not documented product
error states or a reason to invent error UI.

## Paint gate and non-GET accounting

The tool reached `done`; the screenshot was inspected separately. Its initial
viewport has the correct active Personal Settings tab and painted identity,
User Information and start of Address Information. This does **not** accept
paint of the offscreen locale section. There are no failed script loads.
One utility-frame GET was pending at ready time; late scripts were recorded.

Diagnostics include the known `_sortableParentData` page error and invalid
hovercard-origin warning from R1/R2, plus **a new null `appendChild` page
error**. The prior fully-painted settings-screen exception does not silently
extend to this additional error. Research stopped here under the issue's
error rule. UI Lead must assess the evidentiary limits; no second capture
was attempted and the new error has not been diagnosed or fixed.

| Accounting category | Count / outcome |
| --- | --- |
| API export entries | 44 |
| Successful non-GET | One page-initiated visitor trigger POST, count 1, status 200 |
| Blocked non-GET | Two POSTs, remained refused |
| PUT / PATCH / DELETE | None in network export |
| Clicks / steps / automatic Escape | None |
| Popup / print / download / file chooser | None |

The successful POST is `/visitor/v2/<workspace>/livevisitors/<id>/triggers`:
same visitor response shape as the passive visit trace classified in R1 and
recorded in R2. No manual request or replay occurred. Blocked requests were
`/crm/<org>/ActivityReminder.do` (reminder polling) and
`/crm/<org>/crminotification.do` (notification status), one each. Expected
request-failed diagnostics correspond to those refusals. No unexpected
successful non-GET, PageLayout POST or evidence of record, setting or
preference mutation was found. The write guard remained enabled throughout.

## Open questions and policy implications

1. The personal page exposes all six requested locale concepts together.
   This is evidence of a **user-facing locale configuration surface**, not
   proof of where values are stored or how overrides work. R2 also exposes
   organization Time Zone. Which user/organization setting wins, and what
   default/inheritance rules apply? No change to MEP-496 defaults or ADR
   0011 should be inferred from this one user's display.
2. Which alternate language, country, date/time and number formats are
   selectable? No options were visible; the editor was forbidden and unopened.
3. Does number format apply to currency, decimals, rounding, precision,
   reports, exports and all record/list renderers? A three-decimal generic
   sample does not prove three-decimal currency storage or rendering.
4. Why do audit timestamp strings use a different representation from the
   displayed date-format token? Locale propagation and exceptions remain
   unverified; changing a preference to test them is forbidden.
5. Are the lower rows fully painted, and does the additional `appendChild`
   error affect their controls? Text/ARIA presence alone cannot resolve
   this. Further live work requires the error/restart condition to be
   addressed through the lead; no retry is authorized by this spec.
6. Validation, allowed combinations, save/cancel, success/error, authorization,
   session scope and cross-user propagation are not observable under this
   no-editor/no-write scope. Do not invent these behaviours.

## Verification and handoff

Screenshot-to-control reconciliation, text/ARIA cross-check, network/meta
accounting, value redaction and `git diff --check` are the documentation
checks. Only this spec changes; application unit/e2e/typecheck runs are not
applicable. UI Lead reviews the bounded research and the explicit distinction
between painted viewport evidence and provisional lower-page DOM evidence.
