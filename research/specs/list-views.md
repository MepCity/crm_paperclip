# Leads list views

Status: draft for CTO review (MEP-17). This describes only the Leads list in the live reference CRM. It is the reusable list pattern for later modules; their specs should cite this file and state only differences. The field model and shell are specified in `research/specs/leads-fields-and-layout.md` and `research/specs/app-shell.md`, both incorporated into `main`. Routes use `<org>` and `<viewId>` placeholders.

## Purpose

Browse Leads in a saved view, inspect the available filters and list controls, and reach a Lead record. The captured account has 14 configured views in Leads metadata: 11 system-defined public views and three user-created views. The default view's stored `name` is **All Open Leads**, while its `display_value`, and therefore its list-tab label, is **All Leads**. All three custom views are configured and remain in the view inventory.

## Layout

The persistent shell is described in `research/specs/app-shell.md`. Within Leads, a view tab occupies the top of the content area. A toolbar below it has Filter, Sort, several view-type icons, Refresh Custom View, a split Create Lead button, and the ellipsis Actions button. The split button's named **More** part opens the import/sync menu; the ellipsis is **Actions** and opens the bulk-operation menu. Refresh Custom View sits after the view-type controls; it is in the accessibility tree of `list-default` and visible in `list-more` and `list-sort`. The left **Advanced Filters** panel is open in the captured default view. It has a search box and three expandable groups: System Defined Filters, Filter By Fields, and Filter By Related Modules. The right side holds the records table with a View Settings control at its top edge. The table footer shows Total Records and a range with Previous/Next buttons.

The populated default capture displays six data columns in this order: Lead Name, Company, Email, Phone, Lead Source, Lead Owner. Its header sequence is an unlabeled leading strip, a selection-checkbox strip, one unlabeled badge strip, the data columns, then the narrow View Settings cell. The badge strip can contain a dated activity ribbon, but the capture does not establish how its space is divided between the selected Activity Badge and Note Badge settings. The default view has ten visible rows and disabled Previous/Next controls at its single page. Text wraps within cells; a row grows when a name or email takes a second line. The captured Converted Leads view has Lead Name, Company, Phone, Email, an explicit “No Leads found” empty state, and Total Records 0. Its header has only two leading unlabeled cells and no selection checkbox or visible badge strip: the populated view's third leading cell, associated visually with the ribbon lane, is absent. `list-sysview-3` has the same two-cell empty-view header. Columns are view-specific. The plain `/tab/Leads/list` capture (`list-main`) is not a loading state of the list: the app treats `list` as a record id, the record request returns `404`, and the page body stays blank (see Flows 1 and `research/specs/leads.md`).

View Settings opens Manage Columns, disabled Reset Column Size, Records Per Page, and View Mode. Manage Columns opens a dialog with search, checked visible columns, further available columns, Cancel and Save. It also includes Activity Badge and Note Badge as selected presentation columns. The page-size submenu offers 10, 20, 30, 40, 50, and 100; 30 is shown as the current setting. No setting was changed. Column drag/reorder, resize, maximum selected columns, and save validation were not tested.

Editing the system default opens a full-page view form with a disabled view-name box, available/selected column lists, a Lock this View switch, Cancel, and Save. The three user-created view forms add enabled view names, a criteria section, a related-modules-criteria switch that is off, and sharing radios (Only me, Everyone, Selected users); Everyone is selected in all three. Their criteria section shows one numbered row with module, field, comparator, record category and value controls, followed by an add-row icon. An AND connector precedes the related-modules section. The selected columns in each are Last Name, First Name, Company, and Email. No form control was changed or saved. The new-view entry point and its validation remain unobserved.

### Visual layout

All measurements below are **measured from screenshot** at 2940 × 1670 image pixels with a 2× display scale (1470 × 835 CSS px). Values are approximate where antialiasing, shadows or clipped horizontal content obscure an edge. They describe the visible 1470 px viewport, not an untested responsive layout. Icons are described by function; no source image, icon or font asset is reused.

| Element | Measured value / visible state | Source slug |
| --- | --- | --- |
| Leads content canvas | Starts after the 320 px shell sidebar; pale blue-gray `#EEF1F9` behind cards; 16 px content inset | `list-default` |
| Header and tab strip | Header about 50 px high; tab strip about 42 px high; selected view pill 75.5 × 26 px (x 332–407.5, y 57.5–83.5) with 6 px corners and `#F0F4FC` fill | `list-default`, `list-converted` |
| Toolbar | About 47 px high below tab strip; Filter/Sort group left, presentation icons center-left, split Create Lead and ellipsis right; 8–12 px gaps between nearby controls | `list-default` |
| Filter panel | 202 px wide including its 1 px borders (x 335–537), top edge at y≈154 px; 10 px gap to the table, whose left border starts at x=547; white `#FFFFFF` surface, 1 px pale border, 6 px corners; 18 px horizontal inner padding | `list-default` |
| Filter content | Visible heading **Filter Leads by**, about 15 px semibold; search field with **Search** placeholder about 34 px high; group headings about 14 px semibold with a downward expand arrow when open; the first is clipped as **System Defined Fil...** at this width; checkbox rows about 30 px high with 14 px text | `list-default`, `list-converted` |
| Records table | Begins at x≈547 px and y≈154 px; width about 908 px; white `#FFFFFF`, pale 1 px dividers, 6 px outer corners; horizontally scrollable data area with settings control at right edge | `list-default` |
| Table header and rows | Header 37 px high: 35 px white plus a 2 px `#DCDBEE` bottom border (y 154–191). Each data column header has a 1 px `#DCDBEE` divider on its right edge, 23.5 px tall, starting 6 px below the header's top edge (y 160–183.5); the first data column has no divider on its left edge and body rows have no vertical dividers. Column text about 14 px medium; row text about 14 px regular with an 18 px line pitch. Cell content is top-aligned: a row is 9 px, plus 18 px per text line of its tallest cell, plus 9 px, followed by a 1 px `#EDF0F4` separator. Single-line rows are 36 px and repeat every 37 px (list-sysview-2); two-line rows are 54 px and repeat every 55 px (list-default, where every row wraps); the first row of both captures measures 53 px. A single-line cell in a taller row stays on the first text line. Populated header has unlabeled leading, checkbox, and badge cells before data | `list-default`, `list-sysview-2` |
| Leading table strips | From the table edge at x=548 to the first data column edge at x=788 (240 px). The unlabeled leading cell and the selection cell together span 100 px (x 548–648); the header shows no divider between them, so their individual widths are not measurable. The 15 × 15 px checkbox sits at x 623–638, its right edge 10 px inside the pair's right edge; it is vertically centred in the header (y 164–179) and starts 12 px below the top edge of a body row. The badge strip is 140 px (x 648–788). Empty Converted Leads and My Converted Leads omit the badge strip: their first data column edge is at x=648 and the two remaining leading cells contain no checkbox control | `list-default`, `list-converted`, `list-sysview-3` |
| Data and trailing column widths | Column edges, the dividers mark the right edge of each column (x=988, 1188, 1388), are at x=788, 988, 1188 and 1388 in the default view (x=648, 848, 1048 and 1248 in the empty views): 200 px per column. Header and cell text starts 12 px inside the column edge (x≈800, 1000, 1200, 1400). View Settings is a header-only cell: 40 px at the right edge (x 1414–1454) with a 1 px `#DCDBEE` left border over the full header height, laid over the scrolling columns. Body rows have no trailing cell there; their text runs to the table's right edge. | `list-default`, `list-converted` |
| Table footer | 31 px high between two 1 px `#DCDBEE` lines (y 760–793), white. Left: Total Records label followed by a bold number, starting 16.5 px inside the table's inner left edge (x 564.5). Right, in this order: Previous chevron, range, Next chevron. The controls are icon-only; Previous and Next are accessible names. Chevron ink is 6 × 11 px: Previous at x 1335.5–1341.5, range text at x 1362.5–1402.5, Next at x 1422–1428, 26 px inside the table's inner right edge (x 1454); all vertically centred. Range endpoints are bold `#313949`, the word between them is `#616E88`; text about 13 px. A view with no records shows only the total: no range and no chevrons | `list-default`, `list-converted` |
| Text roles | View tab about 13 px semibold; toolbar labels about 14 px medium `#313949`; column headers about 14 px medium `#202123`; ordinary cells about 14 px regular `#313949`. Lead Name and Email values use the same dark body color, even when linked, rather than the blue action color. Placeholder and subdued text `#8C91AB`; disabled pagination text/icon about `#B5B8BE` | `list-default`, `list-settings` |
| Surface and line colors | Main canvas `#EEF1F9`; cards `#FFFFFF`; panel and table outline 1 px `#DCDBEE`; horizontal row separators 1 px `#EDF0F4`; filter search outline and unchecked checkbox border `#C5C4D3`; search outline about 1 px, checkbox outline about 2 px | `list-default` |
| Selected / disabled | Active Filter button 69.5 × 27 px with fill `#EDF0F9`; active list presentation icon tile 26 × 26 px with fill `#F0F1FF` and glyph `#5464F2`; highlighted settings-menu row 250 × 30 px with fill `#F0F4FC`. Disabled pagination arrows about `#B5B8BE`; disabled view-menu entries are muted gray. Unselected checkboxes about 15 × 15 px with 2 px `#C5C4D3` border and 2–3 px radius | `list-default`, `list-settings`, `list-view-options` |
| Create and action buttons | Split Create Lead 137.5 × 33 px (x 1259.5–1397, y 99–132) with 6 px corners; vertical gradient `#5767F6` at top to `#154EC5` at bottom, white `#FFFFFF` label; primary segment 102.5 px, then a 1 px `#C3C8F4` divider at x=1362, then a 34 px arrow segment. An 8.5 px gap separates it from the ellipsis button, which is 44 × 32 px (x 1405.5–1449.5, y 99.5–131.5) with a 1 px `#D5D8E9` border, 6 px corners and a light vertical gradient fill from `#FEFEFE` at top to `#F2F1F8` at bottom | `list-default` |
| Activity ribbon | Pale `#FFECEC` fill; activity icon `#FF5D5A` (about 11 × 12 px, at the left) followed by date text `#F14949`; 72 × 24 px (x 659–731, y 580–604 in the captured row) with a notched right end, starting 11 px inside the badge strip | `list-default` |
| Empty view | Column header and footer remain. The first body band is 57 px high (y 191–248) with a 1 px `#EDF0F4` separator below it. A single "No Leads found." message in #8B9AB9 is centred horizontally on the table (ink x 949.5–1052.5); its text line starts 30 px below the band's top edge (ink y 223.5–234). Zero total, no row data | `list-converted`, `list-sysview-1` |
| View options popover | About 128 px wide, anchored below the tab ellipsis; white, 6 px corners, soft shadow, 30 px option rows; Clone, Close View and Delete View muted in the system view | `list-view-options` |
| Create More / Actions menus | Import menu about 180 px wide beneath the split-button arrow; Actions menu about 200 px wide beneath the toolbar ellipsis and tall enough to scroll; white surface, 6 px corners, soft shadow, hovered row pale blue | `list-more`, `list-actions` |
| View Settings popover | About 264 px wide below the right table icon; white, 6 px corners and shadow; rows around 30 px high, separated into column controls and page/view settings; Reset Column Size is disabled | `list-settings` |
| Sort popover | About 385 × 157 px beneath Sort; two side-by-side selectors around 150 px wide, 28 px high; Cancel and disabled Apply at lower right. Outer box x 412.5–797.5, y 138–296, with a 1 px `#CED0E1` border. The only visible label is **Sort By** (glyphs at x 444.5–489.5, y 162–174.5), above the first selector. Both selectors sit at y 195–223: the first at x 443.5–593.5, 31 px from the outer left edge, and the second at x 608.5–758.5 after a 15 px gap. In this initial state the second selector shows a `#F5F6F8` fill and a 1 px `#D2D9F1` border; whether it is disabled until a field is chosen was not captured. Both buttons sit at y 243–270, 27 px high and 20 px below the selectors: Cancel is 66.5 px wide (x 624–690.5) with a 1 px `#D5D8E9` border and the same light vertical gradient as the ellipsis button; after an 8 px gap, disabled Apply is 60 px wide (x 698.5–758.5) with a flat `#ADB3EE` fill and a white `#FFFFFF` label. Apply's right edge lines up with the second selector's right edge, 39 px from the outer right edge | `list-sort` |
| Manage Columns dialog | Centered overlay about 400 px wide and 770 px high; dark translucent scrim; white dialog with about 16 px corners, 30 px inner padding, scrollable checkbox list, and fixed Cancel/Save footer | `list-columns` |
| View edit form | Full content pane; 1 px pale bordered criteria cards, 8 px corners, 28–32 px inner padding; name input spans roughly 600 px; numbered criterion laid out module → field → comparator → value type → multi-value input; selected-column lane about 280 px wide | `list-view-edit-1` |

The screenshot only establishes the visible desktop state. Exact font family and breakpoint behavior remain open; implement with project-owned typography and tokens matching the measured weight, spacing and color roles.

## Fields

These are the six visible data columns in the populated capture. API names, types, and flags come from the Leads `fields.json` metadata; the required Company constraint is from the Standard layout in the approved field spec. No displayed field is unique. The row request contains `Full_Name`, `First_Name`, and `Last_Name`, confirming that the **Lead Name** list label is backed by `Full_Name`; the metadata label remains **Full Name**.

| List label | API name | Data type | Required / unique / read-only | Sortable / filterable | Notes |
| --- | --- | --- | --- | --- | --- |
| Lead Name | `Full_Name` | `text` | no / no / no | yes / yes | Metadata label is Full Name; row links open Lead detail. The list request includes this field and both name components. |
| Company | `Company` | `text` | layout-required / no / no | yes / yes | Visible in default and empty-view column sets. |
| Email | `Email` | `email` | no / no / no | yes / yes | Rendered as a mail link when populated. |
| Phone | `Phone` | `phone` | no / no / no | yes / yes | Visible text in list. |
| Lead Source | `Lead_Source` | `picklist` | no / no / no | yes / yes | Visible in the populated default view. |
| Lead Owner | `Owner` | `ownerlookup` | no / no / field-managed | yes / yes | `field_read_only=true` in metadata, although `read_only=false`; ownership behavior belongs to the field spec. |

For the complete Leads field dictionary and constraints, see `research/specs/leads-fields-and-layout.md` and the external research metadata `metadata/modules/Leads/fields.json`. The list column chooser also offers many fields that are not selected in the captured view; its choices must be driven by the view/field configuration rather than copied into this table.

## Actions

| Control | Observed options or effect | Boundary |
| --- | --- | --- |
| View tab options | Edit, Pin, Clone, Close View, Delete View | Only Edit was followed, to inspect the form. Pin/favorite persistence and permission rules are unverified. |
| Filter | Toggles the Advanced Filters panel | Filter selection was blocked by the capture tool; no filter was applied. |
| Sort | Opens Sort By field, Ascending/Descending order control, Cancel and Apply | No sort was applied. Available sort fields and default order were not captured. |
| View Settings | Manage Columns, Reset Column Size, Records Per Page, View Mode Wrap Text | Column dialog and page-size submenu opened; no changes saved. |
| Create Lead | Named primary part of a split button | Creation flow belongs to the Leads form spec. |
| More | Named arrow part of the Create Lead split button; Import Leads, Import Notes, Facebook Ads Sync, LinkedIn Ads Sync, Tiktok Ads Sync | Menu only. Import and sync execution are outside this task. |
| Actions | Mass Transfer, Mass Delete, Mass Update, Mass Convert, Manage Tags, Assignment Rules, Drafts, Mass Email, Approve Leads, Deduplicate Leads, Add to Campaigns, Create Client Script, Export Leads, spreadsheet view, Print View | Menu only. No bulk, export, send, approval, or other action was run. |
| Row selection | Checkbox in each row and one in table header | No selection was made. Resulting selection toolbar and row quick actions are unverified. |
| Row link | Lead Name opens the record detail route | Record detail is covered by its own spec. |
| Lead Name header: All | Small dropdown adjoining the column label | Visible in the table header; options and effect were not inspected. |
| Refresh Custom View | Circular refresh control after presentation controls | Named in the accessibility tree. It is visible in `list-more` and `list-sort`; no refresh was triggered. |
| Pagination | Previous and Next controls, current range and total count | One populated page only; both buttons disabled. |

The view-type toolbar shows six icon controls (an active bulleted-list icon, then vertically split, grid, pie/chart, connected-block, and stacked-row icons), followed by an overflow chevron. This is a **visual inference** from `list-default`, not confirmation of the type behind each icon. `ViewPreference.do` exposes `table_view`, `kanban_view`, `map_view`, `timeline_view`, `canvas_view`, `card_view`, `split_view`, `chart_view`, and `sheet_view` keys, while the Leads preference response has `default_view_type` and `last_accessed_views[].type`. These keys show possible presentation types, not their availability or use here. The populated list is the only observed type; other types are **not confirmed in use**. Their exact behavior remains open for research or board scope decision.

The following visible controls had no accessible name in `list-default`; they were not clicked under the named-control rule. Counts follow the accessibility tree, which contains 11 unnamed buttons and two unnamed comboboxes outside the record table.

| Control group | Why not inspected | Evidence |
| --- | --- | --- |
| Product selector combobox and top-bar shortcut/navigation buttons | No accessible names on the controls; shell behavior is handled in the shell spec. | `list-default` |
| View-type icon buttons and overflow combobox | No accessible names; icon meaning is only a visual inference. | `list-default` |
| Table-adjacent and utility-strip unnamed buttons | No accessible names; row quick actions cannot be attributed safely. | `list-default` |

## Filters / views / sorting / search

**Views.** The following inventory is from `custom_views.json`. The UI tab uses `display_value`; `name` is shown only where it differs. `system_name` is a system key, not a record value.

| Display value | Different stored name | System name | System defined | Category | Default | Accessed | Columns, in screen order | Records |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| All Leads | All Open Leads | `ALLVIEWS` | yes | `public_views` | yes | yes | Lead Name (`Full_Name`), Company (`Company`), Email (`Email`), Phone (`Phone`), Lead Source (`Lead_Source`), Lead Owner (`Owner`) | 10 |
| All Locked Leads | — | `ALLLOCKEDLEADS` | yes | `public_views` | no | no | Same as All Leads | 0 |
| Converted Leads | — | `CONVERTEDVIEWS` | yes | `public_views` | no | no | Lead Name (`Full_Name`), Company (`Company`), Phone (`Phone`), Email (`Email`) | 0 |
| Junk Leads | — | — | no | `created_by_me` | no | no | Last Name (`Last_Name`), First Name (`First_Name`), Company (`Company`), Email (`Email`); selected in edit form, list screen not captured | — |
| Mailing Labels | — | `ALLVIEWS` | yes | `public_views` | no | yes | Salutation (`Salutation`), Lead Name (`Full_Name`), Company (`Company`) visible in the capture; export also selects `Old_Street`, `Old_City`, `Old_State`, `Old_Country`, `Old_Zip_Code` after them | 10 |
| My Converted Leads | — | `MYCONVERTEDVIEWS` | yes | `public_views` | no | no | Same as Converted Leads | 0 |
| My Leads | — | `MYVIEWS` | yes | `public_views` | no | yes | Lead Name (`Full_Name`), Company (`Company`), Email (`Email`), Phone (`Phone`), Lead Source (`Lead_Source`) | 10 |
| Not Qualified Leads | — | — | no | `created_by_me` | no | no | Same selected columns as Junk Leads; list screen not captured | — |
| Open Leads | — | — | no | `created_by_me` | no | yes | Same selected columns as Junk Leads; list screen not captured | — |
| Recently Created Leads | — | `RECENTLYCREATED` | yes | `public_views` | no | no | Same as All Leads | 0 |
| Recently Modified Leads | — | `RECENTLYMODIFIED` | yes | `public_views` | no | no | Same as All Leads | 0 |
| Today's Leads | Todays Leads | `today` | yes | `public_views` | no | yes | Same as All Leads | 0 |
| Unread Leads | — | `UNREADVIEWS` | yes | `public_views` | no | yes | Same as All Leads | 6 |
| Unsubscribed Leads | — | `UNSUBSCRIBED` | yes | `public_views` | no | no | Lead Name (`Full_Name`), Company (`Company`), Email (`Email`), Lead Owner (`Owner`), Created Time (`Created_Time`), Unsubscribed Mode (`Unsubscribed_Mode`), Unsubscribed Time (`Unsubscribed_Time`) | 0 |

The current view tab exposes Pin and view-management options. The inventory response has four grouping translation keys: `public_views`, `other_users_views`, `shared_with_me`, and `created_by_me`; only public and created-by-me categories occur in the 14 configured views. In the current metadata export, `last_accessed_time` is populated for All Leads, Mailing Labels, My Leads, Unread Leads, Today's Leads, and the user-created Open Leads. All except Today's Leads were accessed during this research's capture sessions, so those stamps do not establish team use; opening a view can set the field. A null stamp for the other eight views does not prove they are unused. See `research/specs/leads.md`. A full selector and new-view entry point were not reached through named controls. `favorite` is null for every metadata item, so configured favorites are **not in use in the captured metadata**; Pin was not exercised. All nine newly captured system view lists use the same shell, filter panel, toolbar and footer structure. Mailing Labels changes the visible data columns; the others retain the same basic table layout.

### View definitions from the metadata export

The 14 rows follow `custom_views.json` inventory order. Each criterion leaf below is written as `field.api_name` / `comparator` / `type` / `value` / `$disrupted`; semicolons preserve the order inside each `group[]`. Parentheses preserve nested groups. `null` is the literal saved sort value, not a guessed runtime sort. Every listed `_pin` is `false`. The export has 11 system and three user views; Mailing Labels and All Leads both carry `system_name: ALLVIEWS`.

| Display value | `system_name` | `system_defined` | `default` | `category` | `access_type` | `locked` | Columns in `fields[]` order | `criteria` tree | Saved `sort_by` / `sort_order` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| All Leads | `ALLVIEWS` | `true` | `true` | `public_views` | `public` | `false` | `Full_Name` (`_pin`: `false`), `Company` (`_pin`: `false`), `Email` (`_pin`: `false`), `Phone` (`_pin`: `false`), `Lead_Source` (`_pin`: `false`), `Owner` (`_pin`: `false`) | `Converted__s` / `equal` / `value` / false / `false` | `null` / `null` |
| All Locked Leads | `ALLLOCKEDLEADS` | `true` | `false` | `public_views` | `public` | `false` | `Full_Name` (`_pin`: `false`), `Company` (`_pin`: `false`), `Email` (`_pin`: `false`), `Phone` (`_pin`: `false`), `Lead_Source` (`_pin`: `false`), `Owner` (`_pin`: `false`) | `AND`(`Locked__s` / `equal` / `value` / true / `false`; `Converted__s` / `equal` / `value` / false / `false`) | `null` / `null` |
| Converted Leads | `CONVERTEDVIEWS` | `true` | `false` | `public_views` | `public` | `false` | `Full_Name` (`_pin`: `false`), `Company` (`_pin`: `false`), `Phone` (`_pin`: `false`), `Email` (`_pin`: `false`) | `Converted__s` / `equal` / `value` / true / `false` | `null` / `null` |
| Junk Leads | none | `false` | `false` | `created_by_me` | `public` | `false` | `Last_Name` (`_pin`: `false`), `First_Name` (`_pin`: `false`), `Company` (`_pin`: `false`), `Email` (`_pin`: `false`) | `Lead_Status` / `equal` / `value` / `${CATEGORY.Junk}` / `false` | `null` / `null` |
| Mailing Labels | `ALLVIEWS` | `true` | `false` | `public_views` | `public` | `false` | `Salutation` (`_pin`: `false`), `Full_Name` (`_pin`: `false`), `Company` (`_pin`: `false`), `Old_Street` (`_pin`: `false`), `Old_City` (`_pin`: `false`), `Old_State` (`_pin`: `false`), `Old_Country` (`_pin`: `false`), `Old_Zip_Code` (`_pin`: `false`) | `Converted__s` / `equal` / `value` / false / `false` | `null` / `null` |
| My Converted Leads | `MYCONVERTEDVIEWS` | `true` | `false` | `public_views` | `public` | `false` | `Full_Name` (`_pin`: `false`), `Company` (`_pin`: `false`), `Phone` (`_pin`: `false`), `Email` (`_pin`: `false`) | `AND`(`Converted__s` / `equal` / `value` / true / `false`; `Owner` / `equal` / `value` / {`name`: `${CURRENTUSER}`} / `false`) | `null` / `null` |
| My Leads | `MYVIEWS` | `true` | `false` | `public_views` | `public` | `false` | `Full_Name` (`_pin`: `false`), `Company` (`_pin`: `false`), `Email` (`_pin`: `false`), `Phone` (`_pin`: `false`), `Lead_Source` (`_pin`: `false`) | `AND`(`Owner` / `equal` / `value` / {`name`: `${CURRENTUSER}`} / `false`; `Converted__s` / `equal` / `value` / false / `false`) | `null` / `null` |
| Not Qualified Leads | none | `false` | `false` | `created_by_me` | `public` | `false` | `Last_Name` (`_pin`: `false`), `First_Name` (`_pin`: `false`), `Company` (`_pin`: `false`), `Email` (`_pin`: `false`) | `Lead_Status` / `equal` / `value` / `${CATEGORY.Not Qualified}` / `false` | `null` / `null` |
| Open Leads | none | `false` | `false` | `created_by_me` | `public` | `false` | `Last_Name` (`_pin`: `false`), `First_Name` (`_pin`: `false`), `Company` (`_pin`: `false`), `Email` (`_pin`: `false`) | `Lead_Status` / `equal` / `value` / `${CATEGORY.Open}` / `false` | `null` / `null` |
| Recently Created Leads | `RECENTLYCREATED` | `true` | `false` | `public_views` | `public` | `false` | `Full_Name` (`_pin`: `false`), `Company` (`_pin`: `false`), `Email` (`_pin`: `false`), `Phone` (`_pin`: `false`), `Lead_Source` (`_pin`: `false`), `Owner` (`_pin`: `false`) | `AND`(`AND`(`Common_Status` / `contains` / `value` / `c` / `false`; `Converted__s` / `equal` / `value` / false / `false`); `Created_Time` / `less_equal` / `value` / `${AGEINDAYS}+31` / `false`) | `null` / `null` |
| Recently Modified Leads | `RECENTLYMODIFIED` | `true` | `false` | `public_views` | `public` | `false` | `Full_Name` (`_pin`: `false`), `Company` (`_pin`: `false`), `Email` (`_pin`: `false`), `Phone` (`_pin`: `false`), `Lead_Source` (`_pin`: `false`), `Owner` (`_pin`: `false`) | `AND`(`AND`(`Common_Status` / `contains` / `value` / `m` / `false`; `Converted__s` / `equal` / `value` / false / `false`); `Modified_Time` / `less_equal` / `value` / `${AGEINDAYS}+31` / `false`) | `null` / `null` |
| Today's Leads | `today` | `true` | `false` | `public_views` | `public` | `false` | `Full_Name` (`_pin`: `false`), `Company` (`_pin`: `false`), `Email` (`_pin`: `false`), `Phone` (`_pin`: `false`), `Lead_Source` (`_pin`: `false`), `Owner` (`_pin`: `false`) | `AND`(`Created_Time` / `equal` / `value` / `${TODAY}` / `false`; `Converted__s` / `equal` / `value` / false / `false`) | `null` / `null` |
| Unread Leads | `UNREADVIEWS` | `true` | `false` | `public_views` | `public` | `false` | `Full_Name` (`_pin`: `false`), `Company` (`_pin`: `false`), `Email` (`_pin`: `false`), `Phone` (`_pin`: `false`), `Lead_Source` (`_pin`: `false`), `Owner` (`_pin`: `false`) | `AND`(`Converted__s` / `equal` / `value` / false / `false`; `Common_Status` / `not_contains` / `value` / `v` / `false`) | `null` / `null` |
| Unsubscribed Leads | `UNSUBSCRIBED` | `true` | `false` | `public_views` | `public` | `false` | `Full_Name` (`_pin`: `false`), `Company` (`_pin`: `false`), `Email` (`_pin`: `false`), `Owner` (`_pin`: `false`), `Created_Time` (`_pin`: `false`), `Unsubscribed_Mode` (`_pin`: `false`), `Unsubscribed_Time` (`_pin`: `false`) | `AND`(`Converted__s` / `equal` / `value` / false / `false`; `Email_Opt_Out` / `equal` / `value` / true / `false`) | `null` / `null` |

### Criteria wire format

A leaf has `comparator`, `field` (including `api_name` and `id`), `$disrupted`, `type`, and `value`. A group has `group_operator` and ordered `group[]`; groups can nest. The exported criteria use only `AND` for `group_operator`. Field and view IDs are omitted here. All 14 definitions have a criterion; across them there are 24 leaves.

| Dimension | Wire value or form | Leaf count |
| --- | --- | ---: |
| `comparator` | `equal` | 19 |
| `comparator` | `contains` | 2 |
| `comparator` | `less_equal` | 2 |
| `comparator` | `not_contains` | 1 |
| `type` | `value` | 24 |
| `$disrupted` | `false` | 24 |
| `value` form | Boolean (`true` or `false`) | 13 |
| `value` form | Plain text (`c`, `m`, `v`) | 3 |
| `value` form | Direct `${…}` token (`${CATEGORY.Junk}`, `${CATEGORY.Not Qualified}`, `${CATEGORY.Open}`, `${TODAY}`, `${AGEINDAYS}+31`) | 6 |
| `value` form | Object containing token (`{"name":"${CURRENTUSER}"}`) | 2 |

The three user-view edit forms label the `Lead_Status` comparator **is** and the value mode **Record Category**. Their exported wire comparator is `equal`, `type` is `value`, and `value` is the corresponding `${CATEGORY.…}` token. The captured editor does not establish whether other displayed comparator labels map to the other wire values.

### Fields absent from the Leads field metadata

`Common_Status` is used in criteria for Recently Created Leads, Recently Modified Leads, and Unread Leads but is absent from the 56 entries in `fields.json`. Mailing Labels has five columns absent from that file: `Old_Street`, `Old_City`, `Old_State`, `Old_Country`, `Old_Zip_Code`. In `list-sysview-2`, its rendered data-column headers are **Salutation**, **Lead Name**, and **Company**. No header for any of the five older address API names is rendered in that capture's visible table. Other exported column API names are present in `fields.json`.

### What the criteria establish

| Leaf form in the export | Established by the definition | Not established by the definition |
| --- | --- | --- |
| `Converted__s equal value true/false` | The view compares a boolean conversion flag with the stated value. | How the flag is set, or whether every conversion outcome is represented by it. |
| `Locked__s equal value true` | All Locked Leads also requires the locked flag. | Which lock mechanisms set that flag or whether lock visibility varies by user. |
| `Email_Opt_Out equal value true` | Unsubscribed Leads also requires the email opt-out flag. | Whether every unsubscribe mechanism sets it or whether other opt-out fields contribute. |
| `Owner equal value {"name":"${CURRENTUSER}"}` | The two owner-filtered views use a current-user token inside an object. | The token resolution point, identity scope, and behavior for delegated ownership. |
| `Lead_Status equal value ${CATEGORY.…}` | Each user view targets one named status category; the category-to-option mapping is in the field spec. | Whether category membership is resolved at query time and how changed mappings affect results. |
| `Common_Status contains value c/m` | Recent-created and recent-modified views each test a different one-letter text value. | The meanings of `c` and `m`, and whether `contains` is substring or token matching. |
| `Common_Status not_contains value v` | Unread Leads excludes a one-letter text value. | The meaning of `v`, whether unread state is per user, or whether `not_contains` includes missing values. |
| `Created_Time` / `Modified_Time less_equal value ${AGEINDAYS}+31` | The two recent views compare a time field against the same age token plus 31. | The age window's direction or boundary, unit interpretation, calendar/time-zone basis, and whether 31 is inclusive. |
| `Created_Time equal value ${TODAY}` | Today's Leads compares creation time with a today token. | The day boundary, time zone, or equality granularity. |

### Saved and response sort evidence

Every detailed view response has literal `sort_by: null` and `sort_order: null`; the table above records each pair. The capture tool preserves only response value **types** for list `info` keys. A `string` below does not reveal the value; a 204 has no response body and therefore no `info` object. `list-main` and `list-view-edit` have no list response in their capture.

| Capture | List response status | `info.sort_by` type | `info.sort_order` type |
| --- | --- | --- | --- |
| `list-main` | no list response | — | — |
| `list-default` | 200 | `string` | `string` |
| `list-view-selector` | 200 | `string` | `string` |
| `list-view-options` | 200 | `string` | `string` |
| `list-sort` | 200 | `string` | `string` |
| `list-settings` | 200 | `string` | `string` |
| `list-columns` | 200 | `string` | `string` |
| `list-actions` | 200 | `string` | `string` |
| `list-more` | 200 | `string` | `string` |
| `list-filter-text` | 200 | `string` | `string` |
| `list-converted` | 204 | — | — |
| `list-page-size` | 200 | `string` | `string` |
| `list-view-edit` | no list response | — | — |
| `list-view-edit-default` | 200 | `string` | `string` |
| `list-view-edit-1` | 204 | — | — |
| `list-view-edit-2` | 204 | — | — |
| `list-view-edit-3` | 200 | `string` | `string` |
| `list-sysview-1` | 204 | — | — |
| `list-sysview-2` | 200 | `string` | `string` |
| `list-sysview-3` | 204 | — | — |
| `list-sysview-4` | 200 | `string` | `string` |
| `list-sysview-5` | 204 | — | — |
| `list-sysview-6` | 204 | — | — |
| `list-sysview-7` | 204 | — | — |
| `list-sysview-8` | 200 | `string` | `string` |
| `list-sysview-9` | 204 | — | — |

The actual runtime `info.sort_by` and `info.sort_order` values remain unknown; the board question is tracked in the parent research issue. Saved `null` values do not prove a runtime default.

**Saved view criteria observed.** All three user-created views use one Lead Status (`Lead_Status`, picklist) row with the **is** comparator and the **Record Category** value-type control. The value editor is a multi-value input, shown with one selected category token in each capture. The Lead Status category-to-option mapping is documented in `research/specs/leads-fields-and-layout.md`; the category criterion's runtime evaluation is not established by these definitions. Their selected columns, in order, are `Last_Name`, `First_Name`, `Company`, `Email`; sharing is Everyone and related-module criteria are off. The category labels below are configuration, not record data. System default edit has no visible criteria section and its name is disabled. The metadata export now supplies the literal wire values: `equal`, `value`, and the corresponding `${CATEGORY.…}` token.

| View | Comparator | Record category | Selected columns |
| --- | --- | --- | --- |
| Junk Leads | is | Junk | `Last_Name`, `First_Name`, `Company`, `Email` |
| Not Qualified Leads | is | Not Qualified | `Last_Name`, `First_Name`, `Company`, `Email` |
| Open Leads | is | Open | `Last_Name`, `First_Name`, `Company`, `Email` |

**Left filters.** System Defined Filters lists Activities, Campaigns, Latest Email Status, Locked, Record Action, Related Records Action, Touched Records, Untouched Records, and Cadences. The 42 **Filter By Fields** entries in display order are: Address; Address - City; Address - Country / Region; Address - Flat / House No./ Building / Apartment Name; Address - State / Province; Address - Street Address; Address - Zip / Postal Code; Annual Revenue; Company; Connected To; Converted Account; Converted Contact; Converted Deal; Created By; Created Time; Email; Email Opt Out; Fax; First Name; Industry; Last Activity Time; Last Name; Lead Conversion Time; Lead Name; Lead Owner; Lead Source; Lead Status; Mobile; Modified By; Modified Time; No. of Employees; Phone; Rating; Salutation; Secondary Email; Skype ID; Tag; Title; Twitter; Unsubscribed Mode; Unsubscribed Time; Website. Address is a parent entry and its City, Country / Region, Flat / House No./ Building / Apartment Name, State / Province, Street Address and Zip / Postal Code components are separate entries.

The 19 **Filter By Related Modules** entries in display order are: Accounts (Connected Records); Calls; Campaigns (Connected Records); Cases (Connected Records); Contacts (Connected Records); Deals (Connected Records); Emails; Invitees (Invited Meetings); Invoices (Connected Records); Lead Product Relation (Products); Meetings; Notes; Products (Connected Records); Purchase Orders (Connected Records); Quotes (Connected Records); Sales Orders (Connected Records); Solutions (Connected Records); Tasks; Vendors (Connected Records). Their detailed behavior belongs to later module work.

`fields.json` marks 48 of 56 Leads fields filterable. Seven filterable metadata labels do not appear in this field panel: Converted Date Time (`Converted_Date_Time`), Enrich Status (`Enrich_Status__s`), Full Name (`Full_Name`), Is Converted (`Converted__s`), Last Enriched Time (`Last_Enriched_Time__s`), Locked (`Locked__s`), and Record Id (`id`). The UI instead calls `Full_Name` **Lead Name**; the other six are genuinely absent from the field group. The separate **Locked** system filter is present, but its relationship to `Locked__s` was not exercised. The capture tool skipped the Company filter checkbox as an editable toggle, so no operator/value panel was opened. Exact operator lists for text, email/phone/website/textarea, picklist, date/datetime, integer/double/currency/bigint, lookup/owner lookup/multi-module lookup, boolean, address and image types are **not observable with the current capture tool**. No operator set is inferred from the data types. The only **editor label observed in saved views** is **is** for Lead Status with Record Category; the export adds wire comparator values for other system-view criteria, without establishing their filter-panel labels. Filter AND/OR combination, validation, and zero-result behavior after applying filters also remain unobserved.

**Sorting.** Sort opens a small dialog with Sort By and direction selectors. No sort field options or applied order were captured. The table headers are visible, but their menus and sort effects were not exercised. The network list response exposes `sort_by` and `sort_order` keys in `info`. Leads metadata marks **47 of 56** fields sortable. The nine non-sortable API names are `Description`, `Tag`, `Record_Image`, `Change_Log_Time__s`, `Last_Enriched_Time__s`, `Enrich_Status__s`, `Address`, `Coordinates`, and `Connected_To__s`. This is the field eligibility source; the exact Sort By menu may be narrower.

**Search.** The shell-level Search records entry is global and described in `research/specs/app-shell.md`; it is not evidence of module-local search. The filter panel's Search box appears to search filter choices, but no term was entered. A module-local record search control, search scope, request shape, result presentation, and no-match state were not verified. No customer name was used as a query.

## Flows

1. **Open Leads list.** Navigate to a configured `/crm/<org>/tab/Leads/custom-view/<viewId>/list` route (the rail link resolves to the default view; the plain `/crm/<org>/tab/Leads/list` path is not a list route, see `research/specs/leads.md`). The shell renders first; then the view tab, filter panel, table and footer appear. If the view has no matching records, keep column headers and show the empty message and zero total, as seen in `list-converted`. An explicit loading indicator and an error state were not seen.
2. **Inspect a view.** The current tab shows its `display_value`. Opening its More Options menu reveals Edit, Pin, Clone, Close View and Delete View. Edit opens the view form. For user views, inspect the name, the one Lead Status/is/Record Category row, multi-value category input, AND connector, off related-module criteria switch, selected columns, sharing radios and Lock switch. For the system default, inspect the disabled name and column chooser. Leave without saving; no view was created, changed, pinned or deleted. The new-view form and validation remain unobserved.
3. **Inspect sort.** Open Sort; the field selector initially shows None and the order control shows Ascending. Apply is disabled until a field is chosen. Cancel is present. The validation and response after choosing a field remain unverified.
4. **Inspect columns.** Open View Settings then Manage Columns. The dialog shows checked current columns, unchecked available columns, search, Cancel and Save. Leave without changing any checkbox or saving. Invalid selection and save failure behavior remain unverified.
5. **Inspect page size.** Open View Settings then Records Per Page 30. The six choices appear. No choice was selected; the effect on pagination and preference persistence is unverified.
6. **Inspect filters.** The panel groups and checkboxes appear at load. A click on Company was skipped by the read-only capture tool; no filter-specific criteria, operator, value, AND/OR, or result state was reached. The saved-view form separately confirms one picklist **is** comparator. Implementers must resolve the left-filter operator contracts before building those controls.
7. **Inspect operation menus.** Open the Create Lead arrow (More) or ellipsis (Actions) to list entries, then leave them. No operation was executed. Selection-dependent availability, confirmations and error states remain unverified.

## Data needs

The following are sanitized request *shapes* observed in `network.json`, not prescriptions for our internal API. Only method, endpoint, parameter names and response field names are recorded. The list uses read-shaped POST requests; no record mutation was performed.

| Method | Endpoint path | Query/request field names | Response field names | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/crm/<org>/ViewPreference.do` | None observed | `modules[]`: `module_name`, `cvid`, `per_page`, `table_view`, `kanban_view`, `map_view`, `timeline_view`, `canvas_view`, `card_view`, `split_view`, `chart_view`, `sheet_view`, `viewid`, `filter_status`, `customized_view`, `cv_tab_status`, `filter_width` | View preference bootstrap; type keys do not establish use. |
| GET | `/crm/<org>/ModuleCache.do` | Query: `module`, `getField` | `id`, `fields` | Module field cache. |
| GET | `/crm/v9/settings/custom_views` | Query: `page`, `module`, `per_page`, `filters` | `custom_views[]`: `display_value`, `name`, `system_name`, `system_defined`, `category`, `default`, `favorite`, `pin`, `tab_order`, `last_accessed_time`, `access_type`, `locked`, `module`; `info`: `per_page`, `default`, `count`, `page`, `more_records`, `translation` (`public_views`, `other_users_views`, `shared_with_me`, `created_by_me`) | View inventory and selector grouping. |
| GET | `/crm/v9/settings/custom_views/<viewId>` | Query: `module`; edit form also requests `include_inner_details` | `custom_views[]`: leaf `criteria` (`comparator`, `field.api_name`, `field.id`, optional `field.field_label`, `type`, `value`, `$disrupted`) or nested groups (`group_operator`, ordered `group[]`); `fields[]` (`api_name`, `_pin`), `sort_by`, `sort_order`, `shared_to`, `wrap_text`, `access_type`, `locked`, `default`, `pin`, `$modified_criteria` | Selected view configuration and edit form. The metadata export supplies literal criteria and column values for all 14 views; capture response shapes alone do not supply those values. |
| GET | `/crm/v9/settings/custom_views/<viewId>/filters` | Query: `module`, `cvid` | No body captured (204) | Selected view filters. |
| GET | `/crm/v4.0/settings/fields` | Query: `module` | `fields` | A `list-default` call using this path requested a different module; it is not evidence of a Leads-specific field fetch. |
| GET | `/crm/v2.2/settings/fields`, `/crm/v2/settings/fields` | Query: `module`, optionally `type` | `fields` | Field definitions used while the edit form loads. |
| GET | `/crm/v8/settings/custom_views` | Query: `module`, `page`, `per_page`, `favourite` | No response body captured | Additional edit-form view request. |
| GET | `/crm/v2.2/Leads/actions` | Query: `cvid` | `actions` | Available record/list actions. |
| POST | `/crm/v2.2/Leads/actions/count` | Query: `on_demand_properties`, `approved`, `cvid`, `home_converted_currency`, `formatted_currency`; multipart body present, constituent field names unavailable in the capture | `count` | Total matching records. |
| POST | `/crm/v2.2/Leads/bulk` | Query: `page`, `fields`, `approved`, `cvid`, `home_converted_currency`, `formatted_currency`, `per_page`, `on_demand_properties`; capture records `request: null`, so **there are no observable request-body field names**. The `fields` query list includes `Full_Name`, `First_Name`, `Last_Name`, `Owner`, `Tag`, `Locked__s` and record state/permission properties. | `data[]`: row field values, `id`, `Owner`, state/permission properties; `info`: `per_page`, `count`, `page`, `sort_by`, `sort_order`, `more_records` | Paged list rows and confirmed name-field mapping. |
| GET | `/crm/v9/settings/modules/Leads/actions/view_preference_configurations` | None observed | `modules[]`: `per_page`, `default_view_type`, `last_accessed_views[]` (`type`, `custom_view.id`), `filter_status`, `show_filter_count`, `activity_badge`, `notes_badge` | List presentation preference; configuration shape alone does not prove non-list usage. |

Opening a different view caused the capture tool to block `PUT` requests for pin state and view preference configuration. They did not complete. This is an observed application side effect of navigation; it was not initiated through a research action. `network.json` records request/response shapes and types, not response values, so it cannot establish a before/after preference change.

The default view's detailed metadata contains one leaf criterion, although its edit form does not display a criteria section. Detailed metadata establishes `AND` groups, including nested groups, but does not establish whether the editor exposes nested-group controls.

## Capture refs

`list-main` (plain `/list` path: record request returns 404, blank body), `list-default` (populated default list), `list-view-selector` (current tab), `list-view-options` (view options), `list-sort` (sort dialog), `list-settings` (table settings), `list-columns` (column dialog), `list-actions` (bulk menu), `list-more` (import menu), `list-filter-text` (filter selection skipped), `list-converted` (empty system view), `list-page-size` (page-size submenu), `list-view-edit` (initial route did not hydrate before named clicks), `list-view-edit-default` (system default form), `list-view-edit-1`, `list-view-edit-2`, `list-view-edit-3` (three configured user view forms), and system-view lists `list-sysview-1`, `list-sysview-2`, `list-sysview-3`, `list-sysview-4`, `list-sysview-5`, `list-sysview-6`, `list-sysview-7`, `list-sysview-8`, `list-sysview-9`. The existing metadata export at `metadata/modules/Leads/custom_views/` supplies the 14 literal view definitions; `metadata/modules/Leads/custom_views.json` supplies their order, and `metadata/modules/Leads/fields.json` supplies field membership. Captures remain in the local research workspace. No raw capture or customer value is included here. The five additional edit captures and nine navigation-only system-view captures were authorized in the CTO's review. One initial edit capture did not hydrate before named clicks; the other four reached a form. Each of the nine system-view navigations encountered two blocked application-generated preference/pin PUT requests; the block was not bypassed.

## Open questions

1. What are the full view selector's rendered groups, favorite presentation, default-selection behavior, and new-view entry point? The inventory exposes four grouping keys, while the dropdown controls lack accessible names. The new-view form and its validation were not observed. The export has nested `AND` criteria groups, but editor controls for group nesting and an OR choice remain unobserved.
2. Which exact operators and value editors are offered for each Leads filterable type (text, email/phone/website/textarea, picklist, date/datetime, integer/double/currency/bigint, lookup/owner lookup/multi-module lookup, boolean, image/address)? This is **not observable with the current capture tool** because it skips the filter checkbox. The only saved-view comparator observed is picklist **is**.
3. Which toolbar icons correspond to specific presentation types, and which types are actually configured or used? The six icons have no accessible names. Only the active list type is confirmed.
4. Which field options appear under Sort By, and do column headings open a menu or sort directly? Metadata gives sortable eligibility, but no field or header action was selected. All 14 saved sort pairs are `null`; populated list responses report `info.sort_by` and `info.sort_order` only as `string` types. What are the actual response values and effective default sort field/direction? The parent research issue asks the board for these values.
5. What options does the **All** dropdown beside Lead Name expose? Does a module-local record search exist, and if so what fields, matching rule and result/empty states does it use? The global shell search is separate.
6. What row-hover quick actions, selection toolbar, page transitions, record-range behavior, and list error state appear? Only an unselected single page and an empty view were observed.
7. Do view settings and Pin persist at user or shared scope, and what permissions constrain menu entries? The capture tool blocked preference writes during view navigation, so persistence was not studied.
8. The list label **Lead Name** maps to metadata `Full_Name`, labeled **Full Name**. Is this label override specific to list views or shared with other presentation types? No other visible field-label mismatch was found.
9. Why does the default view's response contain a `Converted__s` leaf criterion while its edit form hides the criteria section? The user views encode Record Category as `type: value` with a `${CATEGORY.…}` token, but whether category membership is resolved at query time, how changed mappings affect results, and how multi-value selections encode multiple categories remain unknown.
10. What distinguishes the unlabeled leading table strip from the selection strip? The populated table has three leading header cells, but two empty converted-view tables have only two; the approximately 140 px ribbon strip disappears. The exact assignment of Activity Badge versus Note Badge within that ribbon area is not proven by the screenshots. The two leading cells together measure 100 px and show no divider between them, so their individual widths are also unknown.
11. Which responsive breakpoints, precise font family and offscreen horizontal column behavior apply outside the captured 1470 × 835 CSS px viewport? Only the desktop screenshot was measured.
12. What do `Common_Status` values `c`, `m`, and `v` mean? Does `contains` match substrings or tokens, does `not_contains` include missing values, and is unread state user-specific? The export only supplies comparisons; this field is absent from `fields.json`.
13. How is `${AGEINDAYS}+31` evaluated for `less_equal`: age direction, boundary inclusion, unit, and calendar/time-zone basis? The definitions do not establish a 31-day window.
14. What day boundary, time zone, and equality granularity does `${TODAY}` use against `Created_Time`?
15. When are `${CURRENTUSER}` and status-category tokens resolved, what user/ownership scope do they use, and how do delegated ownership and changed category mappings affect the results?
16. What sets `Converted__s`, `Locked__s`, and `Email_Opt_Out`, and does each flag cover every conversion, lock, or unsubscribe mechanism? The view definitions do not establish these state transitions.
