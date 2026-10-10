# Contacts — list screen and module inventory


Status: incomplete research; capture stop requires review. MEP-20 / Module 2. The two recorded screenshots were opened as images. Metadata tables are complete for the exported configuration; menu, operator and selection states remain unobserved. This document must not be treated as a completed parity baseline.


## Purpose

Define the Contacts list controls and exported module configuration. Follow [list-views.md](list-views.md) for shared list behaviour; apply only the evidenced Contacts differences below. Record detail, forms, global search and duplicate flows belong to later research tasks.


## Layout

The navigation rail is leftmost. The top bar spans the remaining width. Below it are the current-view strip and list toolbar. The filter panel is already visible at the left of the content area; the populated table is to its right. Pagination is inside the table footer. The utility strip spans the bottom. Some table columns and filter rows are clipped; offscreen metadata is not evidence of a visible control.


## Control inventory

SH numbers are introduced here for the first complete shell inventory; subsequent Contacts tasks must reuse them. Repeated record controls share an ID and never copy record text. `seen` establishes presence only: every unclicked control has `not observed` behaviour. All menu-state captures were stopped before any click.


### Control inventory — m2-list-base

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2-list-base) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2-list-base) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2-list-base) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2-list-base) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2-list-base) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2-list-base) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2-list-base) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2-list-base) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2-list-base) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2-list-base) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2-list-base) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2-list-base) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2-list-base) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2-list-base) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2-list-base) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2-list-base) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2-list-base) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2-list-base) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2-list-base) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2-list-base) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2-list-base) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2-list-base) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2-list-base) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2-list-base) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2-list-base) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2-list-base) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2-list-base) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2-list-base) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2-list-base) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2-list-base) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2-list-base) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2-list-base) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2-list-base) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2-list-base) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2-list-base) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2-list-base) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2-list-base) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2-list-base) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2-list-base) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2-list-base) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2-list-base) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2-list-base) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2-list-base) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2-list-base) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2-list-base) | ? |
| SH-46 | Utility strip | Trash bin icon | icon button | far right, after Help | not observed | seen (m2-list-base) | ? |
| L-01 | View strip | All Contacts | tab | left, first | not observed | seen (m2-list-base) | M2 |
| L-02 | View strip | Three dots icon | icon button | after current view tab | not observed | seen (m2-list-base) | M2 |
| L-03 | Toolbar | Filter | button | left group, first | not observed | seen (m2-list-base) | M2 |
| L-04 | Toolbar | Sort | button | left group, second | not observed | seen (m2-list-base) | M2 |
| L-05 | Toolbar | List view icon | icon button | view group, first | not observed | seen (m2-list-base) | M2 |
| L-06 | Toolbar | Kanban view icon | icon button | view group, second | not observed | seen (m2-list-base) | M2 |
| L-07 | Toolbar | Sheet view icon | icon button | view group, third | not observed | seen (m2-list-base) | M2 |
| L-08 | Toolbar | Chart view icon | icon button | view group, fourth | not observed | seen (m2-list-base) | M2 |
| L-09 | Toolbar | Timeline view icon | icon button | view group, fifth | not observed | seen (m2-list-base) | M2 |
| L-10 | Toolbar | Split view icon | icon button | view group, sixth | not observed | seen (m2-list-base) | M2 |
| L-11 | Toolbar | Down chevron | icon button | view group, seventh | not observed | seen (m2-list-base) | M2 |
| L-12 | Toolbar | Create Contact | button | right group, first | not observed | seen (m2-list-base) | M2 |
| L-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Contact | not observed | seen (m2-list-base) | M6 |
| L-14 | Toolbar | Three dots / Actions | icon button | right group, far right | not observed | seen (m2-list-base) | M2 |
| L-15 | Filter panel | Search | input | below Filter Contacts by heading | not observed | seen (m2-list-base) | M2 |
| L-16 | Filter panel | System Defined Filters | toggle | first section heading | not observed | seen (m2-list-base) | M2 |
| L-17 | Filter panel | Activities | checkbox | system-defined section, Activities | not observed | seen (m2-list-base) | M5 |
| L-18 | Filter panel | Campaigns | checkbox | system-defined section, Campaigns | not observed | seen (m2-list-base) | M7 |
| L-19 | Filter panel | Latest Email Status | checkbox | system-defined section, Latest Email Status | not observed | seen (m2-list-base) | M10 |
| L-20 | Filter panel | Locked | checkbox | system-defined section, Locked | not observed | seen (m2-list-base) | M2 |
| L-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | not observed | seen (m2-list-base) | M2 |
| L-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | not observed | seen (m2-list-base) | M2 |
| L-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | not observed | seen (m2-list-base) | M2 |
| L-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | not observed | seen (m2-list-base) | M2 |
| L-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | not observed | seen (m2-list-base) | P3 |
| L-26 | Filter panel | Filter By Fields | toggle | second section heading | not observed | seen (m2-list-base) | M2 |
| L-27 | Filter panel | Account Name | checkbox | field section, Account Name | not observed | seen (m2-list-base) | M3 |
| L-28 | Filter panel | Assistant | checkbox | field section, Assistant | not observed | seen (m2-list-base) | M2 |
| L-29 | Filter panel | Asst Phone | checkbox | field section, Asst Phone | not observed | seen (m2-list-base) | M2 |
| L-30 | Filter panel | Connected To | checkbox | field section, Connected To | not observed | seen (m2-list-base) | M2 |
| L-31 | Filter panel | Contact Name | checkbox | field section, Contact Name | not observed | seen (m2-list-base) | M2 |
| L-32 | Filter panel | Contact Owner (partly clipped) | checkbox | field section, Contact Owner (partly clipped) | not observed | seen (m2-list-base) | M2 |
| L-33 | Table | Sliders icon | icon button | header, far right overlay | not observed | seen (m2-list-base) | M11 |
| L-34 | Table | Select all checkbox | checkbox | header, before activity column | not observed | seen (m2-list-base) | M2 |
| L-35 | Table | Contact Name | column header | first text column | not observed | seen (m2-list-base) | M2 |
| L-36 | Table | All with down arrow | select | within Contact Name header, right | not observed | seen (m2-list-base) | M2 |
| L-37 | Table | Account Name | column header | second text column | not observed | seen (m2-list-base) | M3 |
| L-38 | Table | Email | column header | third text column | not observed | seen (m2-list-base) | M2 |
| L-39 | Table | Phone (partly clipped) | column header | fourth text column, right edge | not observed | seen (m2-list-base) | M2 |
| L-40 | Table | Record selection checkbox | checkbox | each visible row, before activity column | not observed | seen (m2-list-base) | M2 |
| L-41 | Table | Call activity flag | badge | rows with activity, before Contact Name | not observed | seen (m2-list-base) | M5 |
| L-42 | Table | Contact record link | link | Contact Name cells | not observed | seen (m2-list-base) | M2 |
| L-43 | Table | Account record link | link | Account Name cells | not observed | seen (m2-list-base) | M3 |
| L-44 | Table | Email address link | link | Email cells | not observed | seen (m2-list-base) | M10 |
| L-45 | Table | Row three dots icon | icon button | highlighted row, first control | not observed | seen (m2-list-base) | M2 |
| L-46 | Table | Row note bubble icon | icon button | highlighted row, second control | not observed | seen (m2-list-base) | M6 |
| L-47 | Table | Row pulse icon | icon button | highlighted row, after selection checkbox | not observed | seen (m2-list-base) | ? |
| L-48 | List footer | Total Records | badge | left | not observed | seen (m2-list-base) | M2 |
| L-49 | List footer | Displayed record range | badge | right group, between arrows | not observed | seen (m2-list-base) | M2 |
| L-50 | List footer | Previous | icon button | right group, before range | not observed | seen (m2-list-base) | M2 |
| L-51 | List footer | Next | icon button | right group, after range | not observed | seen (m2-list-base) | M2 |



### Control inventory — m2-list-after

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2-list-after) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2-list-after) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2-list-after) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2-list-after) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2-list-after) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2-list-after) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2-list-after) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2-list-after) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2-list-after) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2-list-after) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2-list-after) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2-list-after) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2-list-after) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2-list-after) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2-list-after) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2-list-after) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2-list-after) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2-list-after) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2-list-after) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2-list-after) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2-list-after) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2-list-after) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2-list-after) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2-list-after) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2-list-after) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2-list-after) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2-list-after) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2-list-after) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2-list-after) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2-list-after) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2-list-after) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2-list-after) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2-list-after) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2-list-after) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2-list-after) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2-list-after) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2-list-after) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2-list-after) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2-list-after) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2-list-after) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2-list-after) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2-list-after) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2-list-after) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2-list-after) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2-list-after) | ? |
| SH-46 | Utility strip | Trash bin icon | icon button | far right, after Help | not observed | seen (m2-list-after) | ? |
| L-01 | View strip | All Contacts | tab | left, first | not observed | seen (m2-list-after) | M2 |
| L-02 | View strip | Three dots icon | icon button | after current view tab | not observed | seen (m2-list-after) | M2 |
| L-03 | Toolbar | Filter | button | left group, first | not observed | seen (m2-list-after) | M2 |
| L-04 | Toolbar | Sort | button | left group, second | not observed | seen (m2-list-after) | M2 |
| L-05 | Toolbar | List view icon | icon button | view group, first | not observed | seen (m2-list-after) | M2 |
| L-06 | Toolbar | Kanban view icon | icon button | view group, second | not observed | seen (m2-list-after) | M2 |
| L-07 | Toolbar | Sheet view icon | icon button | view group, third | not observed | seen (m2-list-after) | M2 |
| L-08 | Toolbar | Chart view icon | icon button | view group, fourth | not observed | seen (m2-list-after) | M2 |
| L-09 | Toolbar | Timeline view icon | icon button | view group, fifth | not observed | seen (m2-list-after) | M2 |
| L-10 | Toolbar | Split view icon | icon button | view group, sixth | not observed | seen (m2-list-after) | M2 |
| L-11 | Toolbar | Down chevron | icon button | view group, seventh | not observed | seen (m2-list-after) | M2 |
| L-12 | Toolbar | Create Contact | button | right group, first | not observed | seen (m2-list-after) | M2 |
| L-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Contact | not observed | seen (m2-list-after) | M6 |
| L-14 | Toolbar | Three dots / Actions | icon button | right group, far right | not observed | seen (m2-list-after) | M2 |
| L-15 | Filter panel | Search | input | below Filter Contacts by heading | not observed | seen (m2-list-after) | M2 |
| L-16 | Filter panel | System Defined Filters | toggle | first section heading | not observed | seen (m2-list-after) | M2 |
| L-17 | Filter panel | Activities | checkbox | system-defined section, Activities | not observed | seen (m2-list-after) | M5 |
| L-18 | Filter panel | Campaigns | checkbox | system-defined section, Campaigns | not observed | seen (m2-list-after) | M7 |
| L-19 | Filter panel | Latest Email Status | checkbox | system-defined section, Latest Email Status | not observed | seen (m2-list-after) | M10 |
| L-20 | Filter panel | Locked | checkbox | system-defined section, Locked | not observed | seen (m2-list-after) | M2 |
| L-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | not observed | seen (m2-list-after) | M2 |
| L-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | not observed | seen (m2-list-after) | M2 |
| L-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | not observed | seen (m2-list-after) | M2 |
| L-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | not observed | seen (m2-list-after) | M2 |
| L-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | not observed | seen (m2-list-after) | P3 |
| L-26 | Filter panel | Filter By Fields | toggle | second section heading | not observed | seen (m2-list-after) | M2 |
| L-27 | Filter panel | Account Name | checkbox | field section, Account Name | not observed | seen (m2-list-after) | M3 |
| L-28 | Filter panel | Assistant | checkbox | field section, Assistant | not observed | seen (m2-list-after) | M2 |
| L-29 | Filter panel | Asst Phone | checkbox | field section, Asst Phone | not observed | seen (m2-list-after) | M2 |
| L-30 | Filter panel | Connected To | checkbox | field section, Connected To | not observed | seen (m2-list-after) | M2 |
| L-31 | Filter panel | Contact Name | checkbox | field section, Contact Name | not observed | seen (m2-list-after) | M2 |
| L-32 | Filter panel | Contact Owner (partly clipped) | checkbox | field section, Contact Owner (partly clipped) | not observed | seen (m2-list-after) | M2 |
| L-33 | Table | Sliders icon | icon button | header, far right overlay | not observed | seen (m2-list-after) | M11 |
| L-34 | Table | Select all checkbox | checkbox | header, before activity column | not observed | seen (m2-list-after) | M2 |
| L-35 | Table | Contact Name | column header | first text column | not observed | seen (m2-list-after) | M2 |
| L-36 | Table | All with down arrow | select | within Contact Name header, right | not observed | seen (m2-list-after) | M2 |
| L-37 | Table | Account Name | column header | second text column | not observed | seen (m2-list-after) | M3 |
| L-38 | Table | Email | column header | third text column | not observed | seen (m2-list-after) | M2 |
| L-39 | Table | Phone (partly clipped) | column header | fourth text column, right edge | not observed | seen (m2-list-after) | M2 |
| L-40 | Table | Record selection checkbox | checkbox | each visible row, before activity column | not observed | seen (m2-list-after) | M2 |
| L-41 | Table | Call activity flag | badge | rows with activity, before Contact Name | not observed | seen (m2-list-after) | M5 |
| L-42 | Table | Contact record link | link | Contact Name cells | not observed | seen (m2-list-after) | M2 |
| L-43 | Table | Account record link | link | Account Name cells | not observed | seen (m2-list-after) | M3 |
| L-44 | Table | Email address link | link | Email cells | not observed | seen (m2-list-after) | M10 |
| L-48 | List footer | Total Records | badge | left | not observed | seen (m2-list-after) | M2 |
| L-49 | List footer | Displayed record range | badge | right group, between arrows | not observed | seen (m2-list-after) | M2 |
| L-50 | List footer | Previous | icon button | right group, before range | not observed | seen (m2-list-after) | M2 |
| L-51 | List footer | Next | icon button | right group, after range | not observed | seen (m2-list-after) | M2 |


The row three dots, note bubble and pulse icon visible in the base capture are absent in the after screenshot; they are not counted in this state. Presence in the base screenshot is observed, but activation and hover causality are not.


### Shell controls missing from app-shell.md

The following controls have no individual entry in the shell spec: the Motivator shortcut, Sticky Notes, the far-right trash bin, and the document-with-clock utility icon (identity unresolved). The shell spec describes channels and threads, but those are not separately painted in these captures. The Contacts control in the utility strip is distinct from the Contacts module navigation link.


### Reconciliation of controls.json

Item ordinals below are one-based positions in each local controls.json array. They are evidence references, not DOM selectors. Every item maps to a structural inventory number or an explicit exclusion. Screenshot-only controls (including the far-right trash bin) are included in the inventory independently of this array.


#### m2-list-base

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| L-01 | 112 |
| L-02 | 113, 114, 115, 116 |
| L-03 | 117 |
| L-04 | 118 |
| L-05 | 120 |
| L-06 | 121 |
| L-07 | 122 |
| L-08 | 123 |
| L-09 | 124 |
| L-10 | 125 |
| L-11 | 126, 127 |
| L-12 | 130 |
| L-13 | 131, 132 |
| L-14 | 133 |
| L-15 | 136, 137 |
| L-16 | 139 |
| L-17 | 141, 142 |
| L-18 | 143, 144 |
| L-19 | 145, 146 |
| L-20 | 147, 148 |
| L-21 | 149, 150 |
| L-22 | 151, 152 |
| L-23 | 153, 154 |
| L-24 | 155, 156 |
| L-25 | 157, 158 |
| L-26 | 159 |
| L-27 | 161, 162 |
| L-28 | 163, 164 |
| L-29 | 165, 166 |
| L-30 | 167, 168 |
| L-31 | 169, 170 |
| L-32 | 171, 172 |
| L-33 | 285 |
| L-34 | 294, 295 |
| L-35 | 297 |
| L-36 | 298, 299 |
| L-37 | 300 |
| L-38 | 301 |
| L-39 | 302 |
| L-40 | 309, 310, 325, 326, 340, 341, 355, 356, 371, 372, 386, 387, 402, 403, 419, 420, 435, 436, 450, 451, 466, 467, 482, 483, 497, 498 |
| L-41 | 312, 358, 389, 405, 438, 453, 469, 500 |
| L-42 | 314, 329, 344, 360, 375, 391, 407, 424, 440, 455, 471, 486, 502 |
| L-43 | 316, 331, 346, 362, 377, 393, 409, 426, 442, 457, 473, 488, 504 |
| L-44 | 318, 333, 348, 364, 379, 395, 428, 459, 475, 490, 506 |
| L-45 | 416 |
| L-46 | 417 |
| L-47 | 422 |
| L-48 | 671 |
| L-49 | 672 |
| L-50 | 673 |
| L-51 | 674 |
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
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99, 100 |
| SH-34 | 103, 104, 105, 106 |
| SH-35 | 691 |
| SH-36 | 692 |
| SH-37 | 693 |
| SH-38 | 694 |
| SH-39 | 695 |
| SH-40 | 696 |
| SH-41 | 697 |
| SH-42 | 698 |
| SH-43 | 699 |
| SH-44 | 700 |
| SH-45 | 701 |
| duplicate or structural wrapper (not a separate painted control) | 1, 37, 51, 59, 62, 65, 66, 67, 82, 83, 87, 111, 119, 135, 140, 160, 173, 174, 284, 288, 289, 290, 291, 292, 293, 296, 514, 525, 526, 527, 530, 531, 533, 535, 537, 690 |
| invisible: zero-area element | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91, 92, 94, 95, 97, 98, 101, 102, 107, 108, 109, 110, 134, 138, 281, 282, 286, 287, 662, 663, 664, 665, 666, 667, 668, 669, 670, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686, 687, 688, 689, 702 |
| invisible: outside viewport | 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 303, 304, 320, 321, 335, 336, 350, 351, 366, 367, 381, 382, 397, 398, 412, 413, 430, 431, 445, 446, 461, 462, 477, 478, 492, 493, 508, 509, 523, 524, 528, 529, 532, 534, 536, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 660, 661 |
| invisible: refresh footprint has no painted icon in screenshot | 128, 129 |
| invisible: resize hotspot has no painted grip | 283 |
| record row data or row wrapper | 305, 306, 307, 308, 311, 313, 315, 317, 319, 322, 323, 324, 327, 328, 330, 332, 334, 337, 338, 339, 342, 343, 345, 347, 349, 352, 353, 354, 357, 359, 361, 363, 365, 368, 369, 370, 373, 374, 376, 378, 380, 383, 384, 385, 388, 390, 392, 394, 396, 399, 400, 401, 404, 406, 408, 410, 411, 414, 415, 418, 421, 423, 425, 427, 429, 432, 433, 434, 437, 439, 441, 443, 444, 447, 448, 449, 452, 454, 456, 458, 460, 463, 464, 465, 468, 470, 472, 474, 476, 479, 480, 481, 484, 485, 487, 489, 491, 494, 495, 496, 499, 501, 503, 505, 507 |
| invisible: clipped below table body | 510, 511, 512, 513, 515, 516, 517, 518, 519, 520, 521, 522 |



#### m2-list-after

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| L-01 | 112 |
| L-02 | 113, 114, 115, 116 |
| L-03 | 117 |
| L-04 | 118 |
| L-05 | 120 |
| L-06 | 121 |
| L-07 | 122 |
| L-08 | 123 |
| L-09 | 124 |
| L-10 | 125 |
| L-11 | 126, 127 |
| L-12 | 130 |
| L-13 | 131, 132 |
| L-14 | 133 |
| L-15 | 136, 137 |
| L-16 | 139 |
| L-17 | 141, 142 |
| L-18 | 143, 144 |
| L-19 | 145, 146 |
| L-20 | 147, 148 |
| L-21 | 149, 150 |
| L-22 | 151, 152 |
| L-23 | 153, 154 |
| L-24 | 155, 156 |
| L-25 | 157, 158 |
| L-26 | 159 |
| L-27 | 161, 162 |
| L-28 | 163, 164 |
| L-29 | 165, 166 |
| L-30 | 167, 168 |
| L-31 | 169, 170 |
| L-32 | 171, 172 |
| L-33 | 285 |
| L-34 | 294, 295 |
| L-35 | 297 |
| L-36 | 298, 299 |
| L-37 | 300 |
| L-38 | 301 |
| L-39 | 302 |
| L-40 | 309, 310, 325, 326, 340, 341, 355, 356, 371, 372, 386, 387, 402, 403, 417, 418, 432, 433, 447, 448, 463, 464, 479, 480, 494, 495 |
| L-41 | 312, 358, 389, 405, 435, 450, 466, 497 |
| L-42 | 314, 329, 344, 360, 375, 391, 407, 421, 437, 452, 468, 483, 499 |
| L-43 | 316, 331, 346, 362, 377, 393, 409, 423, 439, 454, 470, 485, 501 |
| L-44 | 318, 333, 348, 364, 379, 395, 425, 456, 472, 487, 503 |
| L-48 | 668 |
| L-49 | 669 |
| L-50 | 670 |
| L-51 | 671 |
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
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99, 100 |
| SH-34 | 103, 104, 105, 106 |
| SH-35 | 688 |
| SH-36 | 689 |
| SH-37 | 690 |
| SH-38 | 691 |
| SH-39 | 692 |
| SH-40 | 693 |
| SH-41 | 694 |
| SH-42 | 695 |
| SH-43 | 696 |
| SH-44 | 697 |
| SH-45 | 698 |
| duplicate or structural wrapper (not a separate painted control) | 1, 37, 51, 59, 62, 65, 66, 67, 82, 83, 87, 111, 119, 135, 140, 160, 173, 174, 284, 288, 289, 290, 291, 292, 293, 296, 511, 522, 523, 524, 527, 528, 530, 532, 534, 687 |
| invisible: zero-area element | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91, 92, 94, 95, 97, 98, 101, 102, 107, 108, 109, 110, 134, 138, 281, 282, 286, 287, 659, 660, 661, 662, 663, 664, 665, 666, 667, 672, 673, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686, 699 |
| invisible: outside viewport | 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 303, 304, 320, 321, 335, 336, 350, 351, 366, 367, 381, 382, 397, 398, 412, 413, 427, 428, 442, 443, 458, 459, 474, 475, 489, 490, 505, 506, 520, 521, 525, 526, 529, 531, 533, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658 |
| invisible: refresh footprint has no painted icon in screenshot | 128, 129 |
| invisible: resize hotspot has no painted grip | 283 |
| record row data or row wrapper | 305, 306, 307, 308, 311, 313, 315, 317, 319, 322, 323, 324, 327, 328, 330, 332, 334, 337, 338, 339, 342, 343, 345, 347, 349, 352, 353, 354, 357, 359, 361, 363, 365, 368, 369, 370, 373, 374, 376, 378, 380, 383, 384, 385, 388, 390, 392, 394, 396, 399, 400, 401, 404, 406, 408, 410, 411, 414, 415, 416, 419, 420, 422, 424, 426, 429, 430, 431, 434, 436, 438, 440, 441, 444, 445, 446, 449, 451, 453, 455, 457, 460, 461, 462, 465, 467, 469, 471, 473, 476, 477, 478, 481, 482, 484, 486, 488, 491, 492, 493, 496, 498, 500, 502, 504 |
| invisible: clipped below table body | 507, 508, 509, 510, 512, 513, 514, 515, 516, 517, 518, 519 |



## Fields and layout

Source: exported `metadata/modules/Contacts/fields.json` and `layouts.json`. There are 61 fields and one Standard layout, default for both Administrator and Standard profiles. The layout is visible, active and has business-card display enabled. Column counts are configuration, not measurements. Column placement and form rendering require the separate form task.

| Order | Section | Columns | Fields | Configured sequence |
| --- | --- | --- | --- | --- |
| 1 | Contact Image | 1 | 1 | 1: Contact Image |
| 2 | Contact Information | 2 | 34 | 1: Contact Owner; 2: Lead Source; 3: First Name; 4: Last Name (required); 4: Full Name; 5: Account Name; 6: Vendor Name; 7: Email; 8: Title; 10: Department; 11: Phone; 12: Home Phone; 13: Other Phone; 14: Fax; 15: Mobile; 16: Date of Birth; 16: Tag; 17: Assistant; 18: Asst Phone; 20: Email Opt Out; 21: Created By; 22: Skype ID; 23: Modified By; 25: Created Time; 26: Modified Time; 29: Salutation; 30: Secondary Email; 33: Last Activity Time; 34: Twitter; 34: Reporting To; 47: Unsubscribed Mode; 48: Unsubscribed Time; 48: Record Id; 53: Connected To |
| 3 | Address Information | 2 | 20 | 1: Mailing Address; 1: Mailing Address - City; 1: Mailing Address - Coordinates; 1: Mailing Address - Country / Region; 1: Mailing Address - Flat / House No./ Building / Apartment Name; 1: Mailing Address - Latitude; 1: Mailing Address - Longitude; 1: Mailing Address - State / Province; 1: Mailing Address - Street Address; 1: Mailing Address - Zip / Postal Code; 2: Other Address; 2: Other Address - City; 2: Other Address - Coordinates; 2: Other Address - Country / Region; 2: Other Address - Flat / House No./ Building / Apartment Name; 2: Other Address - Latitude; 2: Other Address - Longitude; 2: Other Address - State / Province; 2: Other Address - Street Address; 2: Other Address - Zip / Postal Code |
| 4 | Description Information | 1 | 1 | 1: Description |


The Address Information section contains separate Mailing and Other address composites and their components. Repeated sequence values do not establish visible order. Five exported fields are outside this layout: Change Log Time, Locked, Last Enriched Time, Enrich Status and Distance.


### Field dictionary

Required = system and/or layout constraint. Read-only reports both `read_only` and `field_read_only` independently; profile permissions are listed separately. Form flags are metadata only: V detail, C create, E edit, Q quick create. Empty unique configuration means no exported uniqueness constraint.

| Label | API name | Type | Length | Required | Unique | RO / field RO | VCEQ | Section | Sequence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mailing Address - Latitude | Mailing_Latitude | double | 50, 9 decimals | no | none | False / False | VCE- | Address Information | 1 |
| Mailing Address - Longitude | Mailing_Longitude | double | 50, 9 decimals | no | none | False / False | VCE- | Address Information | 1 |
| Other Address - Latitude | Other_Latitude | double | 50, 9 decimals | no | none | False / False | VCE- | Address Information | 2 |
| Other Address - Longitude | Other_Longitude | double | 50, 9 decimals | no | none | False / False | VCE- | Address Information | 2 |
| Contact Owner | Owner | ownerlookup | 120 | no | none | False / True | VCE- | Contact Information | 1 |
| Lead Source | Lead_Source | picklist | 120 | no | none | False / False | VCE- | Contact Information | 2 |
| First Name | First_Name | text | 40 | no | none | False / False | -CEQ | Contact Information | 3 |
| Last Name | Last_Name | text | 80 | system, layout | none | False / False | -CEQ | Contact Information | 4 |
| Account Name | Account_Name | lookup | 120 | no | none | False / False | VCEQ | Contact Information | 5 |
| Vendor Name | Vendor_Name | lookup | 120 | no | none | False / False | VCE- | Contact Information | 6 |
| Email | Email | email | 100 | no | {"casesensitive": "0"} | False / False | VCEQ | Contact Information | 7 |
| Title | Title | text | 100 | no | none | False / False | VCE- | Contact Information | 8 |
| Department | Department | text | 50 | no | none | False / False | VCE- | Contact Information | 10 |
| Phone | Phone | phone | 50 | no | none | False / False | VCEQ | Contact Information | 11 |
| Home Phone | Home_Phone | phone | 30 | no | none | False / False | VCE- | Contact Information | 12 |
| Other Phone | Other_Phone | phone | 30 | no | none | False / False | VCE- | Contact Information | 13 |
| Fax | Fax | text | 30 | no | none | False / False | VCE- | Contact Information | 14 |
| Mobile | Mobile | phone | 30 | no | none | False / False | VCE- | Contact Information | 15 |
| Date of Birth | Date_of_Birth | date | 20 | no | none | False / False | VCE- | Contact Information | 16 |
| Assistant | Assistant | text | 50 | no | none | False / False | VCE- | Contact Information | 17 |
| Asst Phone | Asst_Phone | phone | 30 | no | none | False / False | VCE- | Contact Information | 18 |
| Created By | Created_By | ownerlookup | 120 | no | none | False / False | V--- | Contact Information | 21 |
| Modified By | Modified_By | ownerlookup | 120 | no | none | False / False | V--- | Contact Information | 23 |
| Created Time | Created_Time | datetime | 120 | no | none | False / False | V--- | Contact Information | 25 |
| Modified Time | Modified_Time | datetime | 120 | no | none | False / False | V--- | Contact Information | 26 |
| Full Name | Full_Name | text | 120 | no | none | False / False | V--- | Contact Information | 4 |
| Description | Description | textarea | 32000 | no | none | False / False | VCE- | Description Information | 1 |
| Email Opt Out | Email_Opt_Out | boolean | 5 | no | none | False / False | VCE- | Contact Information | 20 |
| Skype ID | Skype_ID | text | 50 | no | none | False / False | VCE- | Contact Information | 22 |
| Salutation | Salutation | picklist | 25 | no | none | False / False | -CE- | Contact Information | 29 |
| Secondary Email | Secondary_Email | email | 100 | no | none | False / False | VCE- | Contact Information | 30 |
| Last Activity Time | Last_Activity_Time | datetime | 120 | no | none | False / True | V--- | Contact Information | 33 |
| Twitter | Twitter | text | 50 | no | none | False / False | VCE- | Contact Information | 34 |
| Tag | Tag | text | 2000 | no | none | False / False | V--- | Contact Information | 16 |
| Contact Image | Record_Image | profileimage | 255 | no | none | False / False | VCE- | Contact Image | 1 |
| Reporting To | Reporting_To | lookup | 120 | no | none | False / False | VCE- | Contact Information | 34 |
| Unsubscribed Mode | Unsubscribed_Mode | picklist | 120 | no | none | True / True | V--- | Contact Information | 47 |
| Unsubscribed Time | Unsubscribed_Time | datetime | 120 | no | none | True / True | V--- | Contact Information | 48 |
| Record Id | id | bigint | 18 | no | none | True / True | V--- | Contact Information | 48 |
| Change Log Time | Change_Log_Time__s | datetime | 120 | no | none | True / True | ---- | outside layout | — |
| Locked | Locked__s | boolean | 5 | no | none | True / True | ---- | outside layout | — |
| Last Enriched Time | Last_Enriched_Time__s | datetime | 120 | no | none | True / True | ---- | outside layout | — |
| Enrich Status | Enrich_Status__s | picklist | 120 | no | none | True / True | ---- | outside layout | — |
| Mailing Address | Mailing_Address | textarea | 2000 | no | none | True / True | VCE- | Address Information | 1 |
| Mailing Address - Country / Region | Mailing_Country | picklist | 120 | no | none | False / False | VCE- | Address Information | 1 |
| Mailing Address - Flat / House No./ Building / Apartment Name | Mailing_Flat_House_No_Building_Apartment_Name | text | 255 | no | none | False / False | VCE- | Address Information | 1 |
| Mailing Address - Street Address | Mailing_Street | text | 255 | no | none | False / False | VCE- | Address Information | 1 |
| Mailing Address - City | Mailing_City | text | 255 | no | none | False / False | VCE- | Address Information | 1 |
| Mailing Address - State / Province | Mailing_State | picklist | 120 | no | none | False / False | VCE- | Address Information | 1 |
| Mailing Address - Zip / Postal Code | Mailing_Zip | text | 255 | no | none | False / False | VCE- | Address Information | 1 |
| Mailing Address - Coordinates | Mailing_Coordinates | textarea | 255 | no | none | True / True | VCE- | Address Information | 1 |
| Other Address | Other_Address | textarea | 2000 | no | none | True / True | VCE- | Address Information | 2 |
| Other Address - Country / Region | Other_Country | picklist | 120 | no | none | False / False | VCE- | Address Information | 2 |
| Other Address - Flat / House No./ Building / Apartment Name | Other_Flat_House_No_Building_Apartment_Name | text | 255 | no | none | False / False | VCE- | Address Information | 2 |
| Other Address - Street Address | Other_Street | text | 255 | no | none | False / False | VCE- | Address Information | 2 |
| Other Address - City | Other_City | text | 255 | no | none | False / False | VCE- | Address Information | 2 |
| Other Address - State / Province | Other_State | picklist | 120 | no | none | False / False | VCE- | Address Information | 2 |
| Other Address - Zip / Postal Code | Other_Zip | text | 255 | no | none | False / False | VCE- | Address Information | 2 |
| Other Address - Coordinates | Other_Coordinates | textarea | 255 | no | none | True / True | VCE- | Address Information | 2 |
| Distance | nearby_distance__s | double | 16, 2 decimals | no | none | True / True | ---- | outside layout | — |
| Connected To | Connected_To__s | multi_module_lookup | 120 | no | none | False / False | VC-- | Contact Information | 53 |



## Picklists

Source: field metadata, preserving exported option order. These are option definitions, not captured dropdowns. The product-specific fourth Unsubscribed Mode label is normalized to “reference CRM campaigns”; its original literal must not enter the repository. Country and state catalogs are consolidated because Mailing and Other have identical option definitions.

| Label | API name | Options | Exported options |
| --- | --- | --- | --- |
| Lead Source | Lead_Source | 19 | -None-; Advertisement; Cold Call; Employee Referral; External Referral; Online Store; Partner; X (Twitter); Facebook; Public Relations; Sales Email Alias; Seminar Partner; Internal Seminar; Trade Show; Web Download; Web Research; Web Cases; Web Mail; Chat |
| Salutation | Salutation | 6 | -None-; Mr.; Mrs.; Ms.; Dr.; Prof. |
| Unsubscribed Mode | Unsubscribed_Mode | 4 | Consent form; Manual; Unsubscribe link; reference CRM campaigns |
| Enrich Status | Enrich_Status__s | 3 | Available; Enriched; Data not found |
| Mailing Address - Country / Region / Other Address - Country / Region | Mailing_Country / Other_Country | 248 | see shared catalog below; no dependent-country filtering was observed |
| Mailing Address - State / Province / Other Address - State / Province | Mailing_State / Other_State | 3954 | see shared catalog below; no dependent-country filtering was observed |



### Country / Region catalog

<details>
<summary>Complete exported option catalog, shared by Mailing and Other</summary>


| Order | Display option | Actual option when different |
| --- | --- | --- |
| 1 | -None- | same |
| 2 | Afghanistan | same |
| 3 | Aland Islands | same |
| 4 | Albania | same |
| 5 | Algeria | same |
| 6 | American Samoa | same |
| 7 | Andorra | same |
| 8 | Angola | same |
| 9 | Anguilla | same |
| 10 | Antarctica | same |
| 11 | Antigua and Barbuda | same |
| 12 | Argentina | same |
| 13 | Armenia | same |
| 14 | Aruba | same |
| 15 | Australia | same |
| 16 | Austria | same |
| 17 | Azerbaijan | same |
| 18 | Bahamas | same |
| 19 | Bahrain | same |
| 20 | Bangladesh | same |
| 21 | Barbados | same |
| 22 | Belarus | same |
| 23 | Belgium | same |
| 24 | Belize | same |
| 25 | Benin | same |
| 26 | Bermuda | same |
| 27 | Bhutan | same |
| 28 | Bolivia | same |
| 29 | Bonaire, Sint Eustatius and Saba | same |
| 30 | Bosnia and Herzegovina | same |
| 31 | Botswana | same |
| 32 | Bouvet Island | same |
| 33 | Brazil | same |
| 34 | British Indian Ocean Territory | same |
| 35 | Brunei | same |
| 36 | Bulgaria | same |
| 37 | Burkina Faso | same |
| 38 | Burundi | same |
| 39 | Cambodia | same |
| 40 | Cameroon | same |
| 41 | Canada | same |
| 42 | Cape Verde | same |
| 43 | Cayman Islands | same |
| 44 | Central African Republic | same |
| 45 | Chad | same |
| 46 | Chile | same |
| 47 | China | same |
| 48 | Christmas Island | same |
| 49 | Cocos (Keeling) Islands | same |
| 50 | Colombia | same |
| 51 | Comoros | same |
| 52 | Cook Islands | same |
| 53 | Costa Rica | same |
| 54 | Cote D'Ivoire (Ivory Coast) | same |
| 55 | Croatia | same |
| 56 | Cuba | same |
| 57 | Curaçao | same |
| 58 | Cyprus | same |
| 59 | Czech Republic | same |
| 60 | Democratic Republic of the Congo | same |
| 61 | Denmark | same |
| 62 | Djibouti | same |
| 63 | Dominica | same |
| 64 | Dominican Republic | same |
| 65 | Ecuador | same |
| 66 | Egypt | same |
| 67 | El Salvador | same |
| 68 | Equatorial Guinea | same |
| 69 | Eritrea | same |
| 70 | Estonia | same |
| 71 | Eswatini | same |
| 72 | Ethiopia | same |
| 73 | Falkland Islands | same |
| 74 | Faroe Islands | same |
| 75 | Fiji Islands | same |
| 76 | Finland | same |
| 77 | France | same |
| 78 | French Guiana | same |
| 79 | French Southern Territories | same |
| 80 | Gabon | same |
| 81 | Gambia | same |
| 82 | Georgia | same |
| 83 | Germany | same |
| 84 | Ghana | same |
| 85 | Gibraltar | same |
| 86 | Greece | same |
| 87 | Greenland | same |
| 88 | Grenada | same |
| 89 | Guadeloupe | same |
| 90 | Guam | same |
| 91 | Guatemala | same |
| 92 | Guernsey and Alderney | same |
| 93 | Guinea | same |
| 94 | Guinea-Bissau | same |
| 95 | Guyana | same |
| 96 | Haiti | same |
| 97 | Heard Island and McDonald Islands | same |
| 98 | Honduras | same |
| 99 | Hong Kong S.A.R. | same |
| 100 | Hungary | same |
| 101 | Iceland | same |
| 102 | India | same |
| 103 | Indonesia | same |
| 104 | Iran | same |
| 105 | Iraq | same |
| 106 | Ireland | same |
| 107 | Isle of Man | same |
| 108 | Israel | same |
| 109 | Italy | same |
| 110 | Jamaica | same |
| 111 | Japan | same |
| 112 | Jersey | same |
| 113 | Jordan | same |
| 114 | Kazakhstan | same |
| 115 | Kenya | same |
| 116 | Kiribati | same |
| 117 | Kosovo | same |
| 118 | Kuwait | same |
| 119 | Kyrgyzstan | same |
| 120 | Laos | same |
| 121 | Latvia | same |
| 122 | Lebanon | same |
| 123 | Lesotho | same |
| 124 | Liberia | same |
| 125 | Libya | same |
| 126 | Liechtenstein | same |
| 127 | Lithuania | same |
| 128 | Luxembourg | same |
| 129 | Macau S.A.R. | same |
| 130 | Madagascar | same |
| 131 | Malawi | same |
| 132 | Malaysia | same |
| 133 | Maldives | same |
| 134 | Mali | same |
| 135 | Malta | same |
| 136 | Marshall Islands | same |
| 137 | Martinique | same |
| 138 | Mauritania | same |
| 139 | Mauritius | same |
| 140 | Mayotte | same |
| 141 | Mexico | same |
| 142 | Micronesia | same |
| 143 | Moldova | same |
| 144 | Monaco | same |
| 145 | Mongolia | same |
| 146 | Montenegro | same |
| 147 | Montserrat | same |
| 148 | Morocco | same |
| 149 | Mozambique | same |
| 150 | Myanmar | same |
| 151 | Namibia | same |
| 152 | Nauru | same |
| 153 | Nepal | same |
| 154 | Netherlands | same |
| 155 | New Caledonia | same |
| 156 | New Zealand | same |
| 157 | Nicaragua | same |
| 158 | Niger | same |
| 159 | Nigeria | same |
| 160 | Niue | same |
| 161 | Norfolk Island | same |
| 162 | North Korea | same |
| 163 | North Macedonia | same |
| 164 | Northern Mariana Islands | same |
| 165 | Norway | same |
| 166 | Oman | same |
| 167 | Pakistan | same |
| 168 | Palau | same |
| 169 | Palestine | same |
| 170 | Panama | same |
| 171 | Papua New Guinea | same |
| 172 | Paraguay | same |
| 173 | Peru | same |
| 174 | Philippines | same |
| 175 | Pitcairn Island | same |
| 176 | Poland | same |
| 177 | Portugal | same |
| 178 | Puerto Rico | same |
| 179 | Qatar | same |
| 180 | Republic of the Congo | same |
| 181 | Reunion | same |
| 182 | Romania | same |
| 183 | Russia | same |
| 184 | Rwanda | same |
| 185 | Saint Helena, Ascension and Tristan da Cunha | same |
| 186 | Saint Kitts and Nevis | same |
| 187 | Saint Lucia | same |
| 188 | Saint Pierre and Miquelon | same |
| 189 | Saint Vincent and The Grenadines | same |
| 190 | Saint-Barthelemy | same |
| 191 | Saint-Martin (French part) | same |
| 192 | Samoa | same |
| 193 | San Marino | same |
| 194 | Sao Tome and Principe | same |
| 195 | Saudi Arabia | same |
| 196 | Senegal | same |
| 197 | Serbia | same |
| 198 | Seychelles | same |
| 199 | Sierra Leone | same |
| 200 | Singapore | same |
| 201 | Sint Maarten (Dutch part) | same |
| 202 | Slovakia | same |
| 203 | Slovenia | same |
| 204 | Solomon Islands | same |
| 205 | Somalia | same |
| 206 | South Africa | same |
| 207 | South Georgia | same |
| 208 | South Korea | same |
| 209 | South Sudan | same |
| 210 | Spain | same |
| 211 | Sri Lanka | same |
| 212 | Sudan | same |
| 213 | Suriname | same |
| 214 | Svalbard and Jan Mayen Islands | same |
| 215 | Sweden | same |
| 216 | Switzerland | same |
| 217 | Syria | same |
| 218 | Taiwan | same |
| 219 | Tajikistan | same |
| 220 | Tanzania | same |
| 221 | Thailand | same |
| 222 | Timor-Leste | same |
| 223 | Togo | same |
| 224 | Tokelau | same |
| 225 | Tonga | same |
| 226 | Trinidad and Tobago | same |
| 227 | Tunisia | same |
| 228 | Turkmenistan | same |
| 229 | Turks and Caicos Islands | same |
| 230 | Tuvalu | same |
| 231 | Türkiye | same |
| 232 | Uganda | same |
| 233 | Ukraine | same |
| 234 | United Arab Emirates | same |
| 235 | United Kingdom | same |
| 236 | United States | same |
| 237 | Uruguay | same |
| 238 | Uzbekistan | same |
| 239 | Vanuatu | same |
| 240 | Vatican City State (Holy See) | same |
| 241 | Venezuela | same |
| 242 | Vietnam | same |
| 243 | Virgin Islands (British) | same |
| 244 | Wallis and Futuna Islands | same |
| 245 | Western Sahara | same |
| 246 | Yemen | same |
| 247 | Zambia | same |
| 248 | Zimbabwe | same |



</details>


### State / Province catalog

<details>
<summary>Complete exported option catalog, shared by Mailing and Other</summary>


| Order | Display option | Actual option when different |
| --- | --- | --- |
| 1 | -None- | same |
| 2 | Bougainville | same |
| 3 | Central Province (Papua New Guinea) | same |
| 4 | Chimbu Province | same |
| 5 | East New Britain | same |
| 6 | Eastern Highlands Province | same |
| 7 | Enga Province | same |
| 8 | Gulf | same |
| 9 | Hela | same |
| 10 | Jiwaka Province | same |
| 11 | Madang Province | same |
| 12 | Manus Province | same |
| 13 | Milne Bay Province | same |
| 14 | Morobe Province | same |
| 15 | New Ireland Province | same |
| 16 | Oro Province | same |
| 17 | Port Moresby | same |
| 18 | Sandaun Province | same |
| 19 | Southern Highlands Province | same |
| 20 | West New Britain Province | same |
| 21 | Western Highlands Province | same |
| 22 | Western Province (Papua New Guinea) | same |
| 23 | Banteay Meanchey | same |
| 24 | Battambang | same |
| 25 | Kampong Cham | same |
| 26 | Kampong Chhnang | same |
| 27 | Kampong Speu | same |
| 28 | Kampong Thom | same |
| 29 | Kampot | same |
| 30 | Kandal | same |
| 31 | Kep | same |
| 32 | Koh Kong | same |
| 33 | Kratie | same |
| 34 | Mondulkiri | same |
| 35 | Oddar Meanchey | same |
| 36 | Pailin | same |
| 37 | Phnom Penh | same |
| 38 | Preah Vihear | same |
| 39 | Prey Veng | same |
| 40 | Pursat | same |
| 41 | Ratanakiri | same |
| 42 | Siem Reap | same |
| 43 | Sihanoukville | same |
| 44 | Stung Treng | same |
| 45 | Svay Rieng | same |
| 46 | Takeo | same |
| 47 | Akmola Region | same |
| 48 | Aktobe Region | same |
| 49 | Almaty | same |
| 50 | Almaty Region | same |
| 51 | Atyrau Region | same |
| 52 | East Kazakhstan Region | same |
| 53 | Karaganda Region | same |
| 54 | Kostanay Region | same |
| 55 | Kyzylorda Region | same |
| 56 | Mangystau Region | same |
| 57 | North Kazakhstan Region | same |
| 58 | Pavlodar Region | same |
| 59 | West Kazakhstan Province | same |
| 60 | Alto Paraguay | same |
| 61 | Alto Paraná | same |
| 62 | Amambay | same |
| 63 | Asuncion | same |
| 64 | Boquerón | same |
| 65 | Caaguazú | same |
| 66 | Caazapá | same |
| 67 | Canindeyú | same |
| 68 | Central (Paraguay) | same |
| 69 | Concepción | same |
| 70 | Cordillera | same |
| 71 | Guairá | same |
| 72 | Itapúa | same |
| 73 | Misiones (Paraguay) | same |
| 74 | Paraguarí | same |
| 75 | Presidente Hayes | same |
| 76 | San Pedro | same |
| 77 | Ñeembucú | same |
| 78 | Al-Hasakah | same |
| 79 | Al-Raqqah | same |
| 80 | Aleppo | same |
| 81 | As-Suwayda | same |
| 82 | Damascus | same |
| 83 | Daraa | same |
| 84 | Deir ez-Zor | same |
| 85 | Hama | same |
| 86 | Homs | same |
| 87 | Idlib | same |
| 88 | Latakia | same |
| 89 | Quneitra | same |
| 90 | Rif Dimashq | same |
| 91 | Tartus | same |
| 92 | Acklins | same |
| 93 | Acklins and Crooked Islands | same |
| 94 | Berry Islands | same |
| 95 | Bimini | same |
| 96 | Black Point | same |
| 97 | Cat Island | same |
| 98 | Central Abaco | same |
| 99 | Central Andros | same |
| 100 | Central Eleuthera | same |
| 101 | Crooked Island | same |
| 102 | East Grand Bahama | same |
| 103 | Exuma | same |
| 104 | Freeport | same |
| 105 | Fresh Creek | same |
| 106 | Governor's Harbour | same |
| 107 | Grand Cay | same |
| 108 | Green Turtle Cay | same |
| 109 | Harbour Island | same |
| 110 | High Rock | same |
| 111 | Hope Town | same |
| 112 | Inagua | same |
| 113 | Kemps Bay | same |
| 114 | Long Island | same |
| 115 | Mangrove Cay | same |
| 116 | Marsh Harbour | same |
| 117 | Mayaguana District | same |
| 118 | New Providence | same |
| 119 | Nichollstown and Berry Islands | same |
| 120 | North Abaco | same |
| 121 | North Andros | same |
| 122 | North Eleuthera | same |
| 123 | Ragged Island | same |
| 124 | Rock Sound | same |
| 125 | Rum Cay District | same |
| 126 | San Salvador Island | same |
| 127 | San Salvador and Rum Cay | same |
| 128 | Sandy Point | same |
| 129 | South Abaco | same |
| 130 | South Andros | same |
| 131 | South Eleuthera | same |
| 132 | Spanish Wells | same |
| 133 | West Grand Bahama | same |
| 134 | Central Province (Solomon Islands) | same |
| 135 | Choiseul Province | same |
| 136 | Guadalcanal Province | same |
| 137 | Honiara | same |
| 138 | Isabel Province | same |
| 139 | Makira-Ulawa Province | same |
| 140 | Malaita Province | same |
| 141 | Rennell and Bellona Province | same |
| 142 | Temotu Province | same |
| 143 | Western Province (Solomon Islands) | same |
| 144 | Bamako | same |
| 145 | Gao Region | same |
| 146 | Kayes Region | same |
| 147 | Kidal Region | same |
| 148 | Koulikoro Region | same |
| 149 | Mopti Region | same |
| 150 | Ménaka Region | same |
| 151 | Sikasso Region | same |
| 152 | Ségou Region | same |
| 153 | Taoudénit Region | same |
| 154 | Tombouctou Region | same |
| 155 | Bocas del Toro | same |
| 156 | Chiriquí | same |
| 157 | Coclé | same |
| 158 | Colón | same |
| 159 | Darién | same |
| 160 | Emberá | same |
| 161 | Guna Yala | same |
| 162 | Herrera | same |
| 163 | Los Santos | same |
| 164 | Naso Tjër Di | same |
| 165 | Ngäbe-Buglé | same |
| 166 | Panamá | same |
| 167 | Panamá Oeste | same |
| 168 | Veraguas | same |
| 169 | Bonaire (Bonaire, Sint Eustatius and Saba) | same |
| 170 | Saba (Bonaire, Sint Eustatius and Saba) | same |
| 171 | Sint Eustatius (Bonaire, Sint Eustatius and Saba) | same |
| 172 | Attapeu | same |
| 173 | Bokeo | same |
| 174 | Bolikhamxai | same |
| 175 | Champasak | same |
| 176 | Houaphanh | same |
| 177 | Khammouane | same |
| 178 | Luang Namtha | same |
| 179 | Luang Prabang | same |
| 180 | Oudomxay | same |
| 181 | Phongsaly | same |
| 182 | Sainyabuli | same |
| 183 | Salavan | same |
| 184 | Savannakhet | same |
| 185 | Sekong | same |
| 186 | Vientiane Prefecture (Capital City) | same |
| 187 | Vientiane Province | same |
| 188 | Xaisomboun | same |
| 189 | Xiangkhouang | same |
| 190 | Buenos Aires | same |
| 191 | Catamarca | same |
| 192 | Chaco | same |
| 193 | Chubut | same |
| 194 | Ciudad Autónoma de Buenos Aires | same |
| 195 | Corrientes | same |
| 196 | Córdoba (Argentina) | same |
| 197 | Entre Ríos | same |
| 198 | Formosa | same |
| 199 | Jujuy | same |
| 200 | La Pampa | same |
| 201 | La Rioja (Argentina) | same |
| 202 | Mendoza | same |
| 203 | Misiones (Argentina) | same |
| 204 | Neuquén | same |
| 205 | Río Negro (Argentina) | same |
| 206 | Salta | same |
| 207 | San Juan (Argentina) | same |
| 208 | San Luis | same |
| 209 | Santa Cruz (Argentina) | same |
| 210 | Santa Fe | same |
| 211 | Santiago del Estero | same |
| 212 | Tierra del Fuego | same |
| 213 | Tucumán | same |
| 214 | Anse Boileau | same |
| 215 | Anse Royale | same |
| 216 | Anse-aux-Pins | same |
| 217 | Au Cap | same |
| 218 | Baie Lazare | same |
| 219 | Baie Sainte Anne | same |
| 220 | Beau Vallon | same |
| 221 | Bel Air | same |
| 222 | Bel Ombre | same |
| 223 | Cascade | same |
| 224 | Glacis | same |
| 225 | Grand'Anse Mahé | same |
| 226 | Grand'Anse Praslin | same |
| 227 | La Digue | same |
| 228 | La Rivière Anglaise | same |
| 229 | Les Mamelles | same |
| 230 | Mont Buxton | same |
| 231 | Mont Fleuri | same |
| 232 | Plaisance | same |
| 233 | Pointe La Rue | same |
| 234 | Port Glaud | same |
| 235 | Roche Caiman | same |
| 236 | Saint Louis | same |
| 237 | Takamaka | same |
| 238 | Belize | same |
| 239 | Cayo | same |
| 240 | Corozal | same |
| 241 | Orange Walk | same |
| 242 | Stann Creek | same |
| 243 | Toledo (Belize) | same |
| 244 | Central Province (Zambia) | same |
| 245 | Copperbelt Province | same |
| 246 | Eastern Province (Zambia) | same |
| 247 | Luapula Province | same |
| 248 | Lusaka Province | same |
| 249 | Muchinga Province | same |
| 250 | Northern Province (Zambia) | same |
| 251 | Northwestern Province | same |
| 252 | Southern Province (Zambia) | same |
| 253 | Western Province (Zambia) | same |
| 254 | Al Janūbịyah | same |
| 255 | Al Muḩarraq | same |
| 256 | Al ‘Āşimah | same |
| 257 | Ash Shamālīyah | same |
| 258 | Bafatá | same |
| 259 | Biombo Region | same |
| 260 | Cacheu Region | same |
| 261 | Gabú Region | same |
| 262 | Leste Province | same |
| 263 | Norte Province | same |
| 264 | Oio Region | same |
| 265 | Quinara Region | same |
| 266 | Sul Province | same |
| 267 | Tombali Region | same |
| 268 | Erongo | same |
| 269 | Hardap | same |
| 270 | Karas | same |
| 271 | Kavango East | same |
| 272 | Kavango West | same |
| 273 | Khomas | same |
| 274 | Kunene | same |
| 275 | Ohangwena | same |
| 276 | Omaheke | same |
| 277 | Omusati | same |
| 278 | Oshana | same |
| 279 | Oshikoto | same |
| 280 | Otjozondjupa | same |
| 281 | Zambezi | same |
| 282 | Birkaland | same |
| 283 | Egentliga Finland | same |
| 284 | Egentliga Tavastland | same |
| 285 | Kajanaland | same |
| 286 | Kymmenedalen | same |
| 287 | Landskapet Åland | same |
| 288 | Lappland | same |
| 289 | Mellersta Finland | same |
| 290 | Mellersta Österbotten | same |
| 291 | Norra Karelen | same |
| 292 | Norra Savolax | same |
| 293 | Norra Österbotten | same |
| 294 | Nyland | same |
| 295 | Päijänne-Tavastland | same |
| 296 | Satakunta | same |
| 297 | Södra Karelen | same |
| 298 | Södra Savolax | same |
| 299 | Södra Österbotten | same |
| 300 | Österbotten | same |
| 301 | Anjouan | same |
| 302 | Grande Comore | same |
| 303 | Mohéli | same |
| 304 | Aerodrom | same |
| 305 | Aračinovo | same |
| 306 | Berovo | same |
| 307 | Bitola | same |
| 308 | Bogdanci | same |
| 309 | Bogovinje | same |
| 310 | Bosilovo | same |
| 311 | Brvenica | same |
| 312 | Butel | same |
| 313 | Centar | same |
| 314 | Centar Župa | same |
| 315 | Debar | same |
| 316 | Debrca | same |
| 317 | Delčevo | same |
| 318 | Demir Hisar | same |
| 319 | Demir Kapija | same |
| 320 | Dojran | same |
| 321 | Dolneni | same |
| 322 | Gazi Baba | same |
| 323 | Gevgelija | same |
| 324 | Gjorče Petrov | same |
| 325 | Gostivar | same |
| 326 | Gradsko | same |
| 327 | Ilinden | same |
| 328 | Jegunovce | same |
| 329 | Karbinci | same |
| 330 | Karpoš | same |
| 331 | Kavadarci | same |
| 332 | Kisela Voda | same |
| 333 | Kičevo | same |
| 334 | Konče | same |
| 335 | Kočani | same |
| 336 | Kratovo | same |
| 337 | Kriva Palanka | same |
| 338 | Krivogaštani | same |
| 339 | Kruševo | same |
| 340 | Kumanovo | same |
| 341 | Lipkovo | same |
| 342 | Lozovo | same |
| 343 | Makedonska Kamenica | same |
| 344 | Makedonski Brod | same |
| 345 | Mavrovo i Rostuše | same |
| 346 | Mogila | same |
| 347 | Negotino | same |
| 348 | Novaci | same |
| 349 | Novo Selo | same |
| 350 | Ohrid | same |
| 351 | Pehčevo | same |
| 352 | Petrovec | same |
| 353 | Plasnica | same |
| 354 | Prilep | same |
| 355 | Probištip | same |
| 356 | Radoviš | same |
| 357 | Rankovce | same |
| 358 | Resen | same |
| 359 | Rosoman | same |
| 360 | Saraj | same |
| 361 | Sopište | same |
| 362 | Staro Nagoričane | same |
| 363 | Struga | same |
| 364 | Strumica | same |
| 365 | Studeničani | same |
| 366 | Sveti Nikole | same |
| 367 | Tearce | same |
| 368 | Tetovo | same |
| 369 | Valandovo | same |
| 370 | Vasilevo | same |
| 371 | Veles | same |
| 372 | Vevčani | same |
| 373 | Vinica | same |
| 374 | Vrapčište | same |
| 375 | Zelenikovo | same |
| 376 | Zrnovci | same |
| 377 | Čair | same |
| 378 | Čaška | same |
| 379 | Češinovo-Obleševo | same |
| 380 | Čučer-Sandevo | same |
| 381 | Štip | same |
| 382 | Šuto Orizari | same |
| 383 | Želino | same |
| 384 | Adjara | same |
| 385 | Guria | same |
| 386 | Imereti | same |
| 387 | Kakheti | same |
| 388 | Kvemo Kartli | same |
| 389 | Mtskheta-Mtianeti | same |
| 390 | Racha-Lechkhumi and Kvemo Svaneti | same |
| 391 | Samegrelo-Zemo Svaneti | same |
| 392 | Samtskhe-Javakheti | same |
| 393 | Shida Kartli | same |
| 394 | Tbilisi | same |
| 395 | Adana | same |
| 396 | Adıyaman | same |
| 397 | Afyonkarahisar | same |
| 398 | Aksaray | same |
| 399 | Amasya | same |
| 400 | Ankara | same |
| 401 | Antalya | same |
| 402 | Ardahan | same |
| 403 | Artvin | same |
| 404 | Aydın | same |
| 405 | Ağrı | same |
| 406 | Balıkesir | same |
| 407 | Bartın | same |
| 408 | Batman | same |
| 409 | Bayburt | same |
| 410 | Bilecik | same |
| 411 | Bingöl | same |
| 412 | Bitlis | same |
| 413 | Bolu | same |
| 414 | Burdur | same |
| 415 | Bursa | same |
| 416 | Denizli | same |
| 417 | Diyarbakır | same |
| 418 | Düzce | same |
| 419 | Edirne | same |
| 420 | Elazığ | same |
| 421 | Erzincan | same |
| 422 | Erzurum | same |
| 423 | Eskişehir | same |
| 424 | Gaziantep | same |
| 425 | Giresun | same |
| 426 | Gümüşhane | same |
| 427 | Hakkâri | same |
| 428 | Hatay | same |
| 429 | Isparta | same |
| 430 | Iğdır | same |
| 431 | Kahramanmaraş | same |
| 432 | Karabük | same |
| 433 | Karaman | same |
| 434 | Kars | same |
| 435 | Kastamonu | same |
| 436 | Kayseri | same |
| 437 | Kilis | same |
| 438 | Kocaeli | same |
| 439 | Konya | same |
| 440 | Kütahya | same |
| 441 | Kırklareli | same |
| 442 | Kırıkkale | same |
| 443 | Kırşehir | same |
| 444 | Malatya | same |
| 445 | Manisa | same |
| 446 | Mardin | same |
| 447 | Mersin | same |
| 448 | Muğla | same |
| 449 | Muş | same |
| 450 | Nevşehir | same |
| 451 | Niğde | same |
| 452 | Ordu | same |
| 453 | Osmaniye | same |
| 454 | Rize | same |
| 455 | Sakarya | same |
| 456 | Samsun | same |
| 457 | Siirt | same |
| 458 | Sinop | same |
| 459 | Sivas | same |
| 460 | Tekirdağ | same |
| 461 | Tokat | same |
| 462 | Trabzon | same |
| 463 | Tunceli | same |
| 464 | Uşak | same |
| 465 | Van | same |
| 466 | Yalova | same |
| 467 | Yozgat | same |
| 468 | Zonguldak | same |
| 469 | Çanakkale | same |
| 470 | Çankırı | same |
| 471 | Çorum | same |
| 472 | İstanbul | same |
| 473 | İzmir | same |
| 474 | Şanlıurfa | same |
| 475 | Şırnak | same |
| 476 | Christ Church Nichola Town Parish | same |
| 477 | Nevis | same |
| 478 | Saint Anne Sandy Point Parish | same |
| 479 | Saint George Gingerland Parish | same |
| 480 | Saint James Windward Parish | same |
| 481 | Saint John Capisterre Parish | same |
| 482 | Saint John Figtree Parish | same |
| 483 | Saint Kitts | same |
| 484 | Saint Mary Cayon Parish | same |
| 485 | Saint Paul Capisterre Parish | same |
| 486 | Saint Paul Charlestown Parish | same |
| 487 | Saint Peter Basseterre Parish | same |
| 488 | Saint Thomas Lowland Parish | same |
| 489 | Saint Thomas Middle Island Parish | same |
| 490 | Trinity Palmetto Point Parish | same |
| 491 | 'Adan | same |
| 492 | 'Amran | same |
| 493 | Abyan | same |
| 494 | Al Bayda' | same |
| 495 | Al Hudaydah | same |
| 496 | Al Jawf (Yemen) | same |
| 497 | Al Mahrah | same |
| 498 | Al Mahwit | same |
| 499 | Amanat Al Asimah | same |
| 500 | Dhamar | same |
| 501 | Hadhramaut | same |
| 502 | Hajjah | same |
| 503 | Ibb | same |
| 504 | Lahij | same |
| 505 | Ma'rib | same |
| 506 | Raymah | same |
| 507 | Saada | same |
| 508 | Sana'a | same |
| 509 | Shabwah | same |
| 510 | Socotra | same |
| 511 | Ta'izz | same |
| 512 | Anseba Region | same |
| 513 | Debub Region | same |
| 514 | Gash-Barka Region | same |
| 515 | Maekel Region | same |
| 516 | Northern Red Sea Region | same |
| 517 | Southern Red Sea Region | same |
| 518 | Antananarivo Province | same |
| 519 | Antsiranana Province | same |
| 520 | Fianarantsoa Province | same |
| 521 | Mahajanga Province | same |
| 522 | Toamasina Province | same |
| 523 | Toliara Province | same |
| 524 | Al Wahat District | same |
| 525 | Benghazi | same |
| 526 | Derna District | same |
| 527 | Ghat District | same |
| 528 | Jabal al Akhdar | same |
| 529 | Jabal al Gharbi District | same |
| 530 | Jafara | same |
| 531 | Jufra | same |
| 532 | Kufra District | same |
| 533 | Marj District | same |
| 534 | Misrata District | same |
| 535 | Murqub | same |
| 536 | Murzuq District | same |
| 537 | Nalut District | same |
| 538 | Nuqat al Khams | same |
| 539 | Sabha District | same |
| 540 | Sirte District | same |
| 541 | Tripoli District | same |
| 542 | Wadi al Hayaa District | same |
| 543 | Wadi al Shatii District | same |
| 544 | Zawiya District | same |
| 545 | Blekinge | same |
| 546 | Dalarna | same |
| 547 | Gotland | same |
| 548 | Gävleborg | same |
| 549 | Halland | same |
| 550 | Jämtland | same |
| 551 | Jönköping | same |
| 552 | Kalmar | same |
| 553 | Kronoberg | same |
| 554 | Norrbotten | same |
| 555 | Skåne | same |
| 556 | Stockholm | same |
| 557 | Södermanland | same |
| 558 | Uppsala | same |
| 559 | Värmland | same |
| 560 | Västerbotten | same |
| 561 | Västernorrland | same |
| 562 | Västmanland | same |
| 563 | Västra Götaland | same |
| 564 | Örebro | same |
| 565 | Östergötland | same |
| 566 | Balaka District | same |
| 567 | Blantyre District | same |
| 568 | Central Region (Malawi) | same |
| 569 | Chikwawa District | same |
| 570 | Chiradzulu District | same |
| 571 | Chitipa district | same |
| 572 | Dedza District | same |
| 573 | Dowa District | same |
| 574 | Karonga District | same |
| 575 | Kasungu District | same |
| 576 | Likoma District | same |
| 577 | Lilongwe District | same |
| 578 | Machinga District | same |
| 579 | Mangochi District | same |
| 580 | Mchinji District | same |
| 581 | Mulanje District | same |
| 582 | Mwanza District | same |
| 583 | Mzimba District | same |
| 584 | Nkhata Bay District | same |
| 585 | Nkhotakota District | same |
| 586 | Northern Region | same |
| 587 | Nsanje District | same |
| 588 | Ntcheu District | same |
| 589 | Ntchisi District | same |
| 590 | Phalombe District | same |
| 591 | Rumphi District | same |
| 592 | Salima District | same |
| 593 | Southern Region | same |
| 594 | Thyolo District | same |
| 595 | Zomba District | same |
| 596 | Andorra la Vella | same |
| 597 | Canillo | same |
| 598 | Encamp | same |
| 599 | Escaldes-Engordany | same |
| 600 | La Massana | same |
| 601 | Ordino | same |
| 602 | Sant Julià de Lòria | same |
| 603 | Balzers | same |
| 604 | Eschen | same |
| 605 | Gamprin | same |
| 606 | Mauren | same |
| 607 | Planken | same |
| 608 | Ruggell | same |
| 609 | Schaan | same |
| 610 | Schellenberg | same |
| 611 | Triesen | same |
| 612 | Triesenberg | same |
| 613 | Vaduz | same |
| 614 | Greater Poland | same |
| 615 | Holy Cross | same |
| 616 | Kuyavia-Pomerania | same |
| 617 | Lesser Poland | same |
| 618 | Lower Silesia | same |
| 619 | Lublin | same |
| 620 | Lubusz | same |
| 621 | Mazovia | same |
| 622 | Podlaskie | same |
| 623 | Pomerania | same |
| 624 | Silesia | same |
| 625 | Subcarpathia | same |
| 626 | Upper Silesia | same |
| 627 | Warmia-Masuria | same |
| 628 | West Pomerania | same |
| 629 | Łódź | same |
| 630 | Blagoevgrad | same |
| 631 | Burgas | same |
| 632 | Dobrich | same |
| 633 | Gabrovo | same |
| 634 | Haskovo | same |
| 635 | Kardzhali | same |
| 636 | Kyustendil | same |
| 637 | Lovech | same |
| 638 | Montana (Bulgaria) | same |
| 639 | Pazardzhik | same |
| 640 | Pernik | same |
| 641 | Pleven | same |
| 642 | Plovdiv | same |
| 643 | Razgrad | same |
| 644 | Ruse | same |
| 645 | Shumen | same |
| 646 | Silistra | same |
| 647 | Sliven | same |
| 648 | Smolyan | same |
| 649 | Sofia | same |
| 650 | Stara Zagora | same |
| 651 | Targovishte | same |
| 652 | Varna | same |
| 653 | Veliko Tarnovo | same |
| 654 | Vidin | same |
| 655 | Vratsa | same |
| 656 | Yambol | same |
| 657 | Ajloun | same |
| 658 | Amman | same |
| 659 | Aqaba | same |
| 660 | Balqa | same |
| 661 | Irbid | same |
| 662 | Jerash | same |
| 663 | Karak | same |
| 664 | Ma'an | same |
| 665 | Madaba | same |
| 666 | Mafraq | same |
| 667 | Tafilah | same |
| 668 | Zarqa | same |
| 669 | Ariana | same |
| 670 | Ben Arous | same |
| 671 | Bizerte | same |
| 672 | Béja | same |
| 673 | Gabès | same |
| 674 | Gafsa | same |
| 675 | Jendouba | same |
| 676 | Kairouan | same |
| 677 | Kasserine | same |
| 678 | Kebili | same |
| 679 | Kef | same |
| 680 | Mahdia | same |
| 681 | Manouba | same |
| 682 | Medenine | same |
| 683 | Monastir | same |
| 684 | Nabeul | same |
| 685 | Sfax | same |
| 686 | Sidi Bouzid | same |
| 687 | Siliana | same |
| 688 | Sousse | same |
| 689 | Tataouine | same |
| 690 | Tozeur | same |
| 691 | Tunis | same |
| 692 | Zaghouan | same |
| 693 | Funafuti | same |
| 694 | Nanumanga | same |
| 695 | Nanumea | same |
| 696 | Niutao Island Council | same |
| 697 | Nui | same |
| 698 | Nukufetau | same |
| 699 | Nukulaelae | same |
| 700 | Vaitupu | same |
| 701 | Abu Dhabi Emirate | same |
| 702 | Ajman Emirate | same |
| 703 | Dubai | same |
| 704 | Fujairah | same |
| 705 | Ras al-Khaimah | same |
| 706 | Sharjah Emirate | same |
| 707 | Umm al-Quwain | same |
| 708 | Baringo | same |
| 709 | Bomet | same |
| 710 | Bungoma | same |
| 711 | Busia | same |
| 712 | Elgeyo-Marakwet | same |
| 713 | Embu | same |
| 714 | Garissa | same |
| 715 | Homa Bay | same |
| 716 | Isiolo | same |
| 717 | Kajiado | same |
| 718 | Kakamega | same |
| 719 | Kericho | same |
| 720 | Kiambu | same |
| 721 | Kilifi | same |
| 722 | Kirinyaga | same |
| 723 | Kisii | same |
| 724 | Kisumu | same |
| 725 | Kitui | same |
| 726 | Kwale | same |
| 727 | Laikipia | same |
| 728 | Lamu | same |
| 729 | Machakos | same |
| 730 | Makueni | same |
| 731 | Mandera | same |
| 732 | Marsabit | same |
| 733 | Meru | same |
| 734 | Migori | same |
| 735 | Mombasa | same |
| 736 | Murang'a | same |
| 737 | Nairobi City | same |
| 738 | Nakuru | same |
| 739 | Nandi | same |
| 740 | Narok | same |
| 741 | Nyamira | same |
| 742 | Nyandarua | same |
| 743 | Nyeri | same |
| 744 | Samburu | same |
| 745 | Siaya | same |
| 746 | Taita–Taveta | same |
| 747 | Tana River | same |
| 748 | Tharaka-Nithi | same |
| 749 | Trans Nzoia | same |
| 750 | Turkana | same |
| 751 | Uasin Gishu | same |
| 752 | Vihiga | same |
| 753 | Wajir | same |
| 754 | West Pokot | same |
| 755 | Ali Sabieh Region | same |
| 756 | Arta Region | same |
| 757 | Dikhil Region | same |
| 758 | Djibouti | same |
| 759 | Obock Region | same |
| 760 | Tadjourah Region | same |
| 761 | Akkar | same |
| 762 | Baalbek-Hermel | same |
| 763 | Beirut | same |
| 764 | Beqaa | same |
| 765 | Mount Lebanon | same |
| 766 | Nabatieh | same |
| 767 | North (Lebanon) | same |
| 768 | South (Lebanon) | same |
| 769 | Belait | same |
| 770 | Brunei-Muara | same |
| 771 | Temburong | same |
| 772 | Tutong | same |
| 773 | Absheron District | same |
| 774 | Agdam District | same |
| 775 | Agdash District | same |
| 776 | Aghjabadi District | same |
| 777 | Agstafa District | same |
| 778 | Agsu District | same |
| 779 | Astara District | same |
| 780 | Babek District | same |
| 781 | Baku | same |
| 782 | Balakan District | same |
| 783 | Barda District | same |
| 784 | Beylagan District | same |
| 785 | Bilasuvar District | same |
| 786 | Dashkasan District | same |
| 787 | Fizuli District | same |
| 788 | Ganja | same |
| 789 | Gobustan District | same |
| 790 | Goranboy District | same |
| 791 | Goychay | same |
| 792 | Goygol District | same |
| 793 | Gədəbəy | same |
| 794 | Hajigabul District | same |
| 795 | Imishli District | same |
| 796 | Ismailli District | same |
| 797 | Jabrayil District | same |
| 798 | Jalilabad District | same |
| 799 | Julfa District | same |
| 800 | Kalbajar District | same |
| 801 | Kangarli District | same |
| 802 | Khachmaz District | same |
| 803 | Khizi District | same |
| 804 | Khojali District | same |
| 805 | Kurdamir District | same |
| 806 | Lachin District | same |
| 807 | Lankaran | same |
| 808 | Lerik District | same |
| 809 | Martuni | same |
| 810 | Masally District | same |
| 811 | Mingachevir | same |
| 812 | Nakhchivan Autonomous Republic | same |
| 813 | Neftchala District | same |
| 814 | Oghuz District | same |
| 815 | Ordubad District | same |
| 816 | Qabala District | same |
| 817 | Qakh District | same |
| 818 | Qazakh District | same |
| 819 | Quba District | same |
| 820 | Qubadli District | same |
| 821 | Qusar District | same |
| 822 | Saatly District | same |
| 823 | Sabirabad District | same |
| 824 | Sadarak District | same |
| 825 | Salyan District | same |
| 826 | Samukh District | same |
| 827 | Shabran District | same |
| 828 | Shahbuz District | same |
| 829 | Shaki | same |
| 830 | Shamakhi District | same |
| 831 | Shamkir District | same |
| 832 | Sharur District | same |
| 833 | Shirvan | same |
| 834 | Shusha District | same |
| 835 | Siazan District | same |
| 836 | Sumqayit | same |
| 837 | Tartar District | same |
| 838 | Tovuz District | same |
| 839 | Ujar District | same |
| 840 | Yardymli District | same |
| 841 | Yevlakh | same |
| 842 | Zangilan District | same |
| 843 | Zaqatala District | same |
| 844 | Zardab District | same |
| 845 | Artemisa Province | same |
| 846 | Camagüey Province | same |
| 847 | Ciego de Ávila Province | same |
| 848 | Cienfuegos Province | same |
| 849 | Granma Province | same |
| 850 | Guantánamo Province | same |
| 851 | Havana Province | same |
| 852 | Holguín Province | same |
| 853 | Isla de la Juventud | same |
| 854 | Las Tunas Province | same |
| 855 | Matanzas Province | same |
| 856 | Mayabeque Province | same |
| 857 | Pinar del Río Province | same |
| 858 | Sancti Spíritus Province | same |
| 859 | Santiago de Cuba Province | same |
| 860 | Villa Clara Province | same |
| 861 | Benešov | same |
| 862 | Brno-město | same |
| 863 | Bruntál | same |
| 864 | Břeclav | same |
| 865 | Domažlice | same |
| 866 | Děčín | same |
| 867 | Frýdek-Místek | same |
| 868 | Havlíčkův Brod | same |
| 869 | Hlavní město | same |
| 870 | Hodonín | same |
| 871 | Hradec Králové | same |
| 872 | Jeseník | same |
| 873 | Jihomoravský kraj | same |
| 874 | Jihočeský kraj | same |
| 875 | Jindřichův Hradec | same |
| 876 | Jičín | same |
| 877 | Karlovarský kraj | same |
| 878 | Karviná | same |
| 879 | Kolín | same |
| 880 | Kraj Vysočina | same |
| 881 | Kroměříž | same |
| 882 | Královéhradecký kraj | same |
| 883 | Kutná Hora | same |
| 884 | Liberecký kraj | same |
| 885 | Litoměřice | same |
| 886 | Mladá Boleslav | same |
| 887 | Moravskoslezský kraj | same |
| 888 | Mělník | same |
| 889 | Nový Jičín | same |
| 890 | Náchod | same |
| 891 | Olomoucký kraj | same |
| 892 | Ostrava-město | same |
| 893 | Pardubický kraj | same |
| 894 | Pelhřimov | same |
| 895 | Plzeň-sever | same |
| 896 | Plzeňský kraj | same |
| 897 | Praha, Hlavní město | same |
| 898 | Praha-východ | same |
| 899 | Praha-západ | same |
| 900 | Prostějov | same |
| 901 | Písek | same |
| 902 | Přerov | same |
| 903 | Příbram | same |
| 904 | Rakovník | same |
| 905 | Rychnov nad Kněžnou | same |
| 906 | Středočeský kraj | same |
| 907 | Tábor | same |
| 908 | Třebíč | same |
| 909 | Uherské Hradiště | same |
| 910 | Vsetín | same |
| 911 | Vyškov | same |
| 912 | Zlín | same |
| 913 | Zlínský kraj | same |
| 914 | Ústecký kraj | same |
| 915 | Ústí nad Labem | same |
| 916 | Ústí nad Orlicí | same |
| 917 | Česká Lípa | same |
| 918 | České Budějovice | same |
| 919 | Český Krumlov | same |
| 920 | Šumperk | same |
| 921 | Žďár nad Sázavou | same |
| 922 | Adrar (Mauritania) | same |
| 923 | Assaba | same |
| 924 | Brakna | same |
| 925 | Dakhlet Nouadhibou | same |
| 926 | Gorgol | same |
| 927 | Guidimaka | same |
| 928 | Hodh Ech Chargui | same |
| 929 | Hodh El Gharbi | same |
| 930 | Inchiri | same |
| 931 | Nouakchott-Nord | same |
| 932 | Nouakchott-Ouest | same |
| 933 | Nouakchott-Sud | same |
| 934 | Tagant | same |
| 935 | Tiris Zemmour | same |
| 936 | Trarza | same |
| 937 | Anse la Raye Quarter | same |
| 938 | Canaries | same |
| 939 | Castries Quarter | same |
| 940 | Choiseul Quarter | same |
| 941 | Dauphin Quarter | same |
| 942 | Dennery Quarter | same |
| 943 | Gros Islet Quarter | same |
| 944 | Laborie Quarter | same |
| 945 | Micoud Quarter | same |
| 946 | Praslin Quarter | same |
| 947 | Soufrière Quarter | same |
| 948 | Vieux Fort Quarter | same |
| 949 | Central District (Israel) | same |
| 950 | Haifa District | same |
| 951 | Jerusalem District | same |
| 952 | Northern District | same |
| 953 | Southern District (Israel) | same |
| 954 | Tel Aviv District | same |
| 955 | Acquaviva | same |
| 956 | Borgo Maggiore | same |
| 957 | Chiesanuova | same |
| 958 | Domagnano | same |
| 959 | Faetano | same |
| 960 | Fiorentino | same |
| 961 | Montegiardino | same |
| 962 | San Marino | same |
| 963 | Serravalle | same |
| 964 | Australian Capital Territory | same |
| 965 | New South Wales | same |
| 966 | Northern Territory | same |
| 967 | Queensland | same |
| 968 | South Australia | same |
| 969 | Tasmania | same |
| 970 | Victoria (Australia) | same |
| 971 | Western Australia | same |
| 972 | Dushanbe | same |
| 973 | Khatlon | same |
| 974 | Kŭhistoni Badakhshon | same |
| 975 | Nohiyahoi Tobéi Jumhurí | same |
| 976 | Sughd | same |
| 977 | Ayeyarwady Region | same |
| 978 | Bago | same |
| 979 | Chin State | same |
| 980 | Kachin State | same |
| 981 | Kayah State | same |
| 982 | Kayin State | same |
| 983 | Magway Region | same |
| 984 | Mandalay Region | same |
| 985 | Mon State | same |
| 986 | Naypyidaw Union Territory | same |
| 987 | Rakhine State | same |
| 988 | Sagaing Region | same |
| 989 | Shan State | same |
| 990 | Tanintharyi Region | same |
| 991 | Yangon Region | same |
| 992 | Adamawa (Cameroon) | same |
| 993 | Centre (Cameroon) | same |
| 994 | East | same |
| 995 | Far North | same |
| 996 | Littoral (Cameroon) | same |
| 997 | North (Cameroon) | same |
| 998 | Northwest | same |
| 999 | South (Cameroon) | same |
| 1000 | Southwest | same |
| 1001 | West | same |
| 1002 | Famagusta District (Mağusa) | same |
| 1003 | Kyrenia District (Keryneia) | same |
| 1004 | Larnaca District (Larnaka) | same |
| 1005 | Limassol District (Leymasun) | same |
| 1006 | Nicosia District (Lefkoşa) | same |
| 1007 | Paphos District (Pafos) | same |
| 1008 | Johor | same |
| 1009 | Kedah | same |
| 1010 | Kelantan | same |
| 1011 | Kuala Lumpur | same |
| 1012 | Labuan | same |
| 1013 | Malacca | same |
| 1014 | Negeri Sembilan | same |
| 1015 | Pahang | same |
| 1016 | Penang | same |
| 1017 | Perak | same |
| 1018 | Perlis | same |
| 1019 | Putrajaya | same |
| 1020 | Sabah | same |
| 1021 | Sarawak | same |
| 1022 | Selangor | same |
| 1023 | Terengganu | same |
| 1024 | Ad Dākhilīyah | same |
| 1025 | Al Buraymī | same |
| 1026 | Al Wusţá | same |
| 1027 | Az̧ Z̧āhirah | same |
| 1028 | Janūb al Bāţinah | same |
| 1029 | Janūb ash Sharqīyah | same |
| 1030 | Masqaţ | same |
| 1031 | Musandam | same |
| 1032 | Shamāl al Bāţinah | same |
| 1033 | Shamāl ash Sharqīyah | same |
| 1034 | Z̧ufār | same |
| 1035 | Austurland | same |
| 1036 | Höfuðborgarsvæðið | same |
| 1037 | Norðurland eystra | same |
| 1038 | Norðurland vestra | same |
| 1039 | Suðurland | same |
| 1040 | Suðurnes | same |
| 1041 | Vestfirðir | same |
| 1042 | Vesturland | same |
| 1043 | Aragatsotn Region | same |
| 1044 | Ararat Province | same |
| 1045 | Armavir Region | same |
| 1046 | Gegharkunik Province | same |
| 1047 | Kotayk Region | same |
| 1048 | Lori Region | same |
| 1049 | Shirak Region | same |
| 1050 | Syunik Province | same |
| 1051 | Tavush Region | same |
| 1052 | Vayots Dzor Region | same |
| 1053 | Yerevan | same |
| 1054 | Estuaire Province | same |
| 1055 | Haut-Ogooué Province | same |
| 1056 | Moyen-Ogooué Province | same |
| 1057 | Ngounié Province | same |
| 1058 | Nyanga Province | same |
| 1059 | Ogooué-Ivindo Province | same |
| 1060 | Ogooué-Lolo Province | same |
| 1061 | Ogooué-Maritime Province | same |
| 1062 | Woleu-Ntem Province | same |
| 1063 | Canton of Capellen | same |
| 1064 | Canton of Clervaux | same |
| 1065 | Canton of Diekirch | same |
| 1066 | Canton of Echternach | same |
| 1067 | Canton of Esch-sur-Alzette | same |
| 1068 | Canton of Luxembourg | same |
| 1069 | Canton of Mersch | same |
| 1070 | Canton of Redange | same |
| 1071 | Canton of Remich | same |
| 1072 | Canton of Vianden | same |
| 1073 | Canton of Wiltz | same |
| 1074 | Diekirch District | same |
| 1075 | Grevenmacher District | same |
| 1076 | Luxembourg District | same |
| 1077 | Acre | same |
| 1078 | Alagoas | same |
| 1079 | Amapá | same |
| 1080 | Amazonas (Brazil) | same |
| 1081 | Bahia | same |
| 1082 | Ceará | same |
| 1083 | Distrito Federal | same |
| 1084 | Espírito Santo | same |
| 1085 | Goiás | same |
| 1086 | Maranhão | same |
| 1087 | Mato Grosso | same |
| 1088 | Mato Grosso do Sul | same |
| 1089 | Minas Gerais | same |
| 1090 | Paraná | same |
| 1091 | Paraíba | same |
| 1092 | Pará | same |
| 1093 | Pernambuco | same |
| 1094 | Piauí | same |
| 1095 | Rio Grande do Norte | same |
| 1096 | Rio Grande do Sul | same |
| 1097 | Rio de Janeiro | same |
| 1098 | Rondônia | same |
| 1099 | Roraima | same |
| 1100 | Santa Catarina (Brazil) | same |
| 1101 | Sergipe | same |
| 1102 | São Paulo | same |
| 1103 | Tocantins | same |
| 1104 | Adrar (Algeria) | same |
| 1105 | Algiers | same |
| 1106 | Annaba | same |
| 1107 | Aïn Defla | same |
| 1108 | Aïn Témouchent | same |
| 1109 | Batna | same |
| 1110 | Biskra | same |
| 1111 | Blida | same |
| 1112 | Bordj Baji Mokhtar | same |
| 1113 | Bordj Bou Arréridj | same |
| 1114 | Boumerdès | same |
| 1115 | Bouïra | same |
| 1116 | Béchar | same |
| 1117 | Béjaïa | same |
| 1118 | Béni Abbès | same |
| 1119 | Chlef | same |
| 1120 | Constantine | same |
| 1121 | Djanet | same |
| 1122 | Djelfa | same |
| 1123 | El Bayadh | same |
| 1124 | El M'ghair | same |
| 1125 | El Menia | same |
| 1126 | El Oued | same |
| 1127 | El Tarf | same |
| 1128 | Ghardaïa | same |
| 1129 | Guelma | same |
| 1130 | Illizi | same |
| 1131 | In Guezzam | same |
| 1132 | In Salah | same |
| 1133 | Jijel | same |
| 1134 | Khenchela | same |
| 1135 | Laghouat | same |
| 1136 | M'Sila | same |
| 1137 | Mascara | same |
| 1138 | Mila | same |
| 1139 | Mostaganem | same |
| 1140 | Médéa | same |
| 1141 | Naama | same |
| 1142 | Oran | same |
| 1143 | Ouargla | same |
| 1144 | Ouled Djellal | same |
| 1145 | Oum El Bouaghi | same |
| 1146 | Relizane | same |
| 1147 | Saïda | same |
| 1148 | Sidi Bel Abbès | same |
| 1149 | Skikda | same |
| 1150 | Souk Ahras | same |
| 1151 | Sétif | same |
| 1152 | Tamanghasset | same |
| 1153 | Tiaret | same |
| 1154 | Timimoun | same |
| 1155 | Tindouf | same |
| 1156 | Tipasa | same |
| 1157 | Tissemsilt | same |
| 1158 | Tizi Ouzou | same |
| 1159 | Tlemcen | same |
| 1160 | Touggourt | same |
| 1161 | Tébessa | same |
| 1162 | Ajdovščina Municipality | same |
| 1163 | Braslovče Municipality | same |
| 1164 | Brežice Municipality | same |
| 1165 | Divača Municipality | same |
| 1166 | Dobrova–Polhov Gradec Municipality | same |
| 1167 | Domžale Municipality | same |
| 1168 | Gorenja Vas–Poljane Municipality | same |
| 1169 | Gorišnica Municipality | same |
| 1170 | Hodoš Municipality | same |
| 1171 | Hoče–Slivnica Municipality | same |
| 1172 | Hrpelje–Kozina Municipality | same |
| 1173 | Ivančna Gorica Municipality | same |
| 1174 | Juršinci Municipality | same |
| 1175 | Kanal ob Soči Municipality | same |
| 1176 | Kidričevo Municipality | same |
| 1177 | Kočevje Municipality | same |
| 1178 | Križevci Municipality | same |
| 1179 | Laško Municipality | same |
| 1180 | Log–Dragomer Municipality | same |
| 1181 | Loška Dolina Municipality | same |
| 1182 | Loški Potok Municipality | same |
| 1183 | Luče Municipality | same |
| 1184 | Majšperk Municipality | same |
| 1185 | Mengeš Municipality | same |
| 1186 | Mežica Municipality | same |
| 1187 | Miklavž na Dravskem Polju Municipality | same |
| 1188 | Miren–Kostanjevica Municipality | same |
| 1189 | Mirna Peč Municipality | same |
| 1190 | Mokronog–Trebelno Municipality | same |
| 1191 | Moravče Municipality | same |
| 1192 | Municipality of Apače | same |
| 1193 | Municipality of Krško | same |
| 1194 | Municipality of Škofljica | same |
| 1195 | Ormož Municipality | same |
| 1196 | Podčetrtek Municipality | same |
| 1197 | Poljčane Municipality | same |
| 1198 | Radeče Municipality | same |
| 1199 | Ravne na Koroškem Municipality | same |
| 1200 | Razkrižje Municipality | same |
| 1201 | Rače–Fram Municipality | same |
| 1202 | Renče–Vogrsko Municipality | same |
| 1203 | Rečica ob Savinji Municipality | same |
| 1204 | Rogaška Slatina Municipality | same |
| 1205 | Rogašovci Municipality | same |
| 1206 | Ruše Municipality | same |
| 1207 | Semič Municipality | same |
| 1208 | Sežana Municipality | same |
| 1209 | Sodražica Municipality | same |
| 1210 | Solčava Municipality | same |
| 1211 | Središče ob Dravi | same |
| 1212 | Starše Municipality | same |
| 1213 | Straža Municipality | same |
| 1214 | Sveti Andraž v Slovenskih Goricah Municipality | same |
| 1215 | Sveti Jurij ob Ščavnici Municipality | same |
| 1216 | Sveti Tomaž Municipality | same |
| 1217 | Tišina Municipality | same |
| 1218 | Tržič Municipality | same |
| 1219 | Turnišče Municipality | same |
| 1220 | Velike Lašče Municipality | same |
| 1221 | Veržej Municipality | same |
| 1222 | Zavrč Municipality | same |
| 1223 | Zreče Municipality | same |
| 1224 | Črenšovci Municipality | same |
| 1225 | Črna na Koroškem Municipality | same |
| 1226 | Črnomelj Municipality | same |
| 1227 | Šalovci Municipality | same |
| 1228 | Šempeter–Vrtojba Municipality | same |
| 1229 | Šentilj Municipality | same |
| 1230 | Šentjernej Municipality | same |
| 1231 | Šentjur Municipality | same |
| 1232 | Šentrupert Municipality | same |
| 1233 | Šenčur Municipality | same |
| 1234 | Škocjan Municipality | same |
| 1235 | Škofja Loka Municipality | same |
| 1236 | Šmarje pri Jelšah Municipality | same |
| 1237 | Šmarješke Toplice Municipality | same |
| 1238 | Šmartno ob Paki Municipality | same |
| 1239 | Šmartno pri Litiji Municipality | same |
| 1240 | Šoštanj Municipality | same |
| 1241 | Štore Municipality | same |
| 1242 | Žalec Municipality | same |
| 1243 | Železniki Municipality | same |
| 1244 | Žetale Municipality | same |
| 1245 | Žiri Municipality | same |
| 1246 | Žirovnica Municipality | same |
| 1247 | Žužemberk Municipality | same |
| 1248 | Bouenza Department | same |
| 1249 | Brazzaville | same |
| 1250 | Cuvette Department | same |
| 1251 | Cuvette-Ouest Department | same |
| 1252 | Kouilou Department | same |
| 1253 | Likouala Department | same |
| 1254 | Lékoumou Department | same |
| 1255 | Niari Department | same |
| 1256 | Plateaux Department | same |
| 1257 | Pointe-Noire | same |
| 1258 | Pool Department | same |
| 1259 | Sangha Department | same |
| 1260 | Barbuda | same |
| 1261 | Redonda | same |
| 1262 | Saint George Parish (Antigua and Barbuda) | same |
| 1263 | Saint John Parish (Antigua and Barbuda) | same |
| 1264 | Saint Mary Parish (Antigua and Barbuda) | same |
| 1265 | Saint Paul Parish (Antigua and Barbuda) | same |
| 1266 | Saint Peter Parish (Antigua and Barbuda) | same |
| 1267 | Saint Philip Parish | same |
| 1268 | Amazonas (Colombia) | same |
| 1269 | Antioquia | same |
| 1270 | Arauca | same |
| 1271 | Archipiélago de San Andrés, Providencia y Santa Catalina | same |
| 1272 | Atlántico | same |
| 1273 | Bogotá D.C. | same |
| 1274 | Bolívar (Colombia) | same |
| 1275 | Boyacá | same |
| 1276 | Caldas | same |
| 1277 | Caquetá | same |
| 1278 | Casanare | same |
| 1279 | Cauca | same |
| 1280 | Cesar | same |
| 1281 | Chocó | same |
| 1282 | Cundinamarca | same |
| 1283 | Córdoba (Colombia) | same |
| 1284 | Guainía | same |
| 1285 | Guaviare | same |
| 1286 | Huila | same |
| 1287 | La Guajira | same |
| 1288 | Magdalena | same |
| 1289 | Meta | same |
| 1290 | Nariño | same |
| 1291 | Norte de Santander | same |
| 1292 | Putumayo | same |
| 1293 | Quindío | same |
| 1294 | Risaralda | same |
| 1295 | Santander | same |
| 1296 | Sucre (Colombia) | same |
| 1297 | Tolima | same |
| 1298 | Valle del Cauca | same |
| 1299 | Vaupés | same |
| 1300 | Vichada | same |
| 1301 | Azuay | same |
| 1302 | Bolívar (Ecuador) | same |
| 1303 | Carchi | same |
| 1304 | Cañar | same |
| 1305 | Chimborazo | same |
| 1306 | Cotopaxi | same |
| 1307 | El Oro | same |
| 1308 | Esmeraldas | same |
| 1309 | Galápagos | same |
| 1310 | Guayas | same |
| 1311 | Imbabura | same |
| 1312 | Loja | same |
| 1313 | Los Ríos (Ecuador) | same |
| 1314 | Manabí | same |
| 1315 | Morona-Santiago | same |
| 1316 | Napo | same |
| 1317 | Orellana | same |
| 1318 | Pastaza | same |
| 1319 | Pichincha | same |
| 1320 | Santa Elena | same |
| 1321 | Santo Domingo de los Tsáchilas | same |
| 1322 | Sucumbíos | same |
| 1323 | Tungurahua | same |
| 1324 | Zamora Chinchipe | same |
| 1325 | Anenii Noi District | same |
| 1326 | Basarabeasca District | same |
| 1327 | Bender Municipality | same |
| 1328 | Briceni District | same |
| 1329 | Bălți Municipality | same |
| 1330 | Cahul District | same |
| 1331 | Cantemir District | same |
| 1332 | Chișinău Municipality | same |
| 1333 | Cimișlia District | same |
| 1334 | Criuleni District | same |
| 1335 | Călărași District | same |
| 1336 | Căușeni District | same |
| 1337 | Dondușeni District | same |
| 1338 | Drochia District | same |
| 1339 | Dubăsari District | same |
| 1340 | Edineț District | same |
| 1341 | Florești District | same |
| 1342 | Fălești District | same |
| 1343 | Gagauzia | same |
| 1344 | Glodeni District | same |
| 1345 | Hîncești District | same |
| 1346 | Ialoveni District | same |
| 1347 | Nisporeni District | same |
| 1348 | Ocnița District | same |
| 1349 | Orhei District | same |
| 1350 | Rezina District | same |
| 1351 | Rîșcani District | same |
| 1352 | Soroca District | same |
| 1353 | Strășeni District | same |
| 1354 | Sîngerei District | same |
| 1355 | Taraclia District | same |
| 1356 | Telenești District | same |
| 1357 | Transnistria autonomous territorial unit | same |
| 1358 | Ungheni District | same |
| 1359 | Șoldănești District | same |
| 1360 | Ștefan Vodă District | same |
| 1361 | Malampa | same |
| 1362 | Penama | same |
| 1363 | Sanma | same |
| 1364 | Shefa | same |
| 1365 | Tafea | same |
| 1366 | Torba | same |
| 1367 | Hhohho District | same |
| 1368 | Lubombo District | same |
| 1369 | Manzini District | same |
| 1370 | Shiselweni District | same |
| 1371 | Agrigento | same |
| 1372 | Alessandria | same |
| 1373 | Ancona | same |
| 1374 | Aosta | same |
| 1375 | Arezzo | same |
| 1376 | Ascoli Piceno | same |
| 1377 | Asti | same |
| 1378 | Avellino | same |
| 1379 | Bari | same |
| 1380 | Bari (Italy) | same |
| 1381 | Barletta-Andria-Trani | same |
| 1382 | Belluno | same |
| 1383 | Benevento | same |
| 1384 | Bergamo | same |
| 1385 | Biella | same |
| 1386 | Bologna | same |
| 1387 | Bolzano | same |
| 1388 | Brescia | same |
| 1389 | Brindisi | same |
| 1390 | Cagliari | same |
| 1391 | Caltanissetta | same |
| 1392 | Campobasso | same |
| 1393 | Caserta | same |
| 1394 | Catania | same |
| 1395 | Catanzaro | same |
| 1396 | Chieti | same |
| 1397 | Como | same |
| 1398 | Cosenza | same |
| 1399 | Cremona | same |
| 1400 | Crotone | same |
| 1401 | Cuneo | same |
| 1402 | Enna | same |
| 1403 | Fermo | same |
| 1404 | Ferrara | same |
| 1405 | Florence | same |
| 1406 | Foggia | same |
| 1407 | Forlì-Cesena | same |
| 1408 | Frosinone | same |
| 1409 | Genoa | same |
| 1410 | Gorizia | same |
| 1411 | Grosseto | same |
| 1412 | Imperia | same |
| 1413 | Isernia | same |
| 1414 | L'Aquila | same |
| 1415 | La Spezia | same |
| 1416 | Latina | same |
| 1417 | Lecce | same |
| 1418 | Lecco | same |
| 1419 | Livorno | same |
| 1420 | Lodi | same |
| 1421 | Lucca | same |
| 1422 | Macerata | same |
| 1423 | Mantua | same |
| 1424 | Massa and Carrara | same |
| 1425 | Matera | same |
| 1426 | Messina | same |
| 1427 | Milan | same |
| 1428 | Modena | same |
| 1429 | Monza and Brianza | same |
| 1430 | Naples | same |
| 1431 | Novara | same |
| 1432 | Nuoro | same |
| 1433 | Oristano | same |
| 1434 | Padua | same |
| 1435 | Palermo | same |
| 1436 | Parma | same |
| 1437 | Pavia | same |
| 1438 | Perugia | same |
| 1439 | Pesaro and Urbino | same |
| 1440 | Pescara | same |
| 1441 | Piacenza | same |
| 1442 | Pisa | same |
| 1443 | Pistoia | same |
| 1444 | Pordenone | same |
| 1445 | Potenza | same |
| 1446 | Prato | same |
| 1447 | Ragusa | same |
| 1448 | Ravenna | same |
| 1449 | Reggio Calabria | same |
| 1450 | Reggio Emilia | same |
| 1451 | Rieti | same |
| 1452 | Rimini | same |
| 1453 | Rome | same |
| 1454 | Rovigo | same |
| 1455 | Salerno | same |
| 1456 | Sassari | same |
| 1457 | Savona | same |
| 1458 | Siena | same |
| 1459 | Siracusa | same |
| 1460 | Sondrio | same |
| 1461 | Taranto | same |
| 1462 | Teramo | same |
| 1463 | Terni | same |
| 1464 | Trapani | same |
| 1465 | Trento | same |
| 1466 | Treviso | same |
| 1467 | Trieste | same |
| 1468 | Turin | same |
| 1469 | Udine | same |
| 1470 | Varese | same |
| 1471 | Venice | same |
| 1472 | Verbano-Cusio-Ossola | same |
| 1473 | Vercelli | same |
| 1474 | Verona | same |
| 1475 | Vibo Valentia | same |
| 1476 | Vicenza | same |
| 1477 | Viterbo | same |
| 1478 | Atlántida Department | same |
| 1479 | Bay Islands Department | same |
| 1480 | Choluteca Department | same |
| 1481 | Colón Department | same |
| 1482 | Comayagua Department | same |
| 1483 | Copán Department | same |
| 1484 | Cortés Department | same |
| 1485 | El Paraíso Department | same |
| 1486 | Francisco Morazán Department | same |
| 1487 | Gracias a Dios Department | same |
| 1488 | Intibucá Department | same |
| 1489 | La Paz Department (Honduras) | same |
| 1490 | Lempira Department | same |
| 1491 | Ocotepeque Department | same |
| 1492 | Olancho Department | same |
| 1493 | Santa Bárbara Department | same |
| 1494 | Valle Department | same |
| 1495 | Yoro Department | same |
| 1496 | Aiwo District | same |
| 1497 | Anabar District | same |
| 1498 | Anetan District | same |
| 1499 | Anibare District | same |
| 1500 | Baiti District | same |
| 1501 | Boe District | same |
| 1502 | Buada District | same |
| 1503 | Denigomodu District | same |
| 1504 | Ewa District | same |
| 1505 | Ijuw District | same |
| 1506 | Meneng District | same |
| 1507 | Nibok District | same |
| 1508 | Uaboe District | same |
| 1509 | Yaren District | same |
| 1510 | Artibonite | same |
| 1511 | Centre (Haiti) | same |
| 1512 | Grand'Anse | same |
| 1513 | Nippes | same |
| 1514 | Nord | same |
| 1515 | Nord-Est | same |
| 1516 | Nord-Ouest | same |
| 1517 | Ouest | same |
| 1518 | Sud | same |
| 1519 | Sud-Est | same |
| 1520 | Badakhshan | same |
| 1521 | Badghis | same |
| 1522 | Baghlan | same |
| 1523 | Balkh | same |
| 1524 | Bamyan | same |
| 1525 | Daykundi | same |
| 1526 | Farah | same |
| 1527 | Faryab | same |
| 1528 | Ghazni | same |
| 1529 | Ghōr | same |
| 1530 | Helmand | same |
| 1531 | Herat | same |
| 1532 | Jowzjan | same |
| 1533 | Kabul | same |
| 1534 | Kandahar | same |
| 1535 | Kapisa | same |
| 1536 | Khost | same |
| 1537 | Kunar | same |
| 1538 | Kunduz Province | same |
| 1539 | Laghman | same |
| 1540 | Logar | same |
| 1541 | Nangarhar | same |
| 1542 | Nimruz | same |
| 1543 | Nuristan | same |
| 1544 | Paktia | same |
| 1545 | Paktika | same |
| 1546 | Panjshir | same |
| 1547 | Parwan | same |
| 1548 | Samangan | same |
| 1549 | Sar-e Pol | same |
| 1550 | Takhar | same |
| 1551 | Urozgan | same |
| 1552 | Zabul | same |
| 1553 | Bubanza Province | same |
| 1554 | Bujumbura Mairie Province | same |
| 1555 | Bujumbura Rural Province | same |
| 1556 | Bururi Province | same |
| 1557 | Cankuzo Province | same |
| 1558 | Cibitoke Province | same |
| 1559 | Gitega Province | same |
| 1560 | Karuzi Province | same |
| 1561 | Kayanza Province | same |
| 1562 | Kirundo Province | same |
| 1563 | Makamba Province | same |
| 1564 | Muramvya Province | same |
| 1565 | Muyinga Province | same |
| 1566 | Mwaro Province | same |
| 1567 | Ngozi Province | same |
| 1568 | Rumonge Province | same |
| 1569 | Rutana Province | same |
| 1570 | Ruyigi Province | same |
| 1571 | Central Singapore | same |
| 1572 | North East (Singapore) | same |
| 1573 | North West (Singapore) | same |
| 1574 | South East | same |
| 1575 | South West | same |
| 1576 | Altai Krai | same |
| 1577 | Altai Republic | same |
| 1578 | Amur Oblast | same |
| 1579 | Arkhangelsk | same |
| 1580 | Astrakhan Oblast | same |
| 1581 | Belgorod Oblast | same |
| 1582 | Bryansk Oblast | same |
| 1583 | Chechen Republic | same |
| 1584 | Chelyabinsk Oblast | same |
| 1585 | Chukotka Autonomous Okrug | same |
| 1586 | Chuvash Republic | same |
| 1587 | Irkutsk | same |
| 1588 | Ivanovo Oblast | same |
| 1589 | Jewish Autonomous Oblast | same |
| 1590 | Kabardino-Balkar Republic | same |
| 1591 | Kaliningrad | same |
| 1592 | Kaluga Oblast | same |
| 1593 | Kamchatka Krai | same |
| 1594 | Karachay-Cherkess Republic | same |
| 1595 | Kemerovo Oblast | same |
| 1596 | Khabarovsk Krai | same |
| 1597 | Khanty-Mansi Autonomous Okrug | same |
| 1598 | Kirov Oblast | same |
| 1599 | Komi Republic | same |
| 1600 | Kostroma Oblast | same |
| 1601 | Krasnodar Krai | same |
| 1602 | Krasnoyarsk Krai | same |
| 1603 | Kurgan Oblast | same |
| 1604 | Kursk Oblast | same |
| 1605 | Leningrad Oblast | same |
| 1606 | Lipetsk Oblast | same |
| 1607 | Magadan Oblast | same |
| 1608 | Mari El Republic | same |
| 1609 | Moscow | same |
| 1610 | Moscow Oblast | same |
| 1611 | Murmansk Oblast | same |
| 1612 | Nenets Autonomous Okrug | same |
| 1613 | Nizhny Novgorod Oblast | same |
| 1614 | Novgorod Oblast | same |
| 1615 | Novosibirsk | same |
| 1616 | Omsk Oblast | same |
| 1617 | Orenburg Oblast | same |
| 1618 | Oryol Oblast | same |
| 1619 | Penza Oblast | same |
| 1620 | Perm Krai | same |
| 1621 | Primorsky Krai | same |
| 1622 | Pskov Oblast | same |
| 1623 | Republic of Adygea | same |
| 1624 | Republic of Bashkortostan | same |
| 1625 | Republic of Buryatia | same |
| 1626 | Republic of Dagestan | same |
| 1627 | Republic of Ingushetia | same |
| 1628 | Republic of Kalmykia | same |
| 1629 | Republic of Karelia | same |
| 1630 | Republic of Khakassia | same |
| 1631 | Republic of Mordovia | same |
| 1632 | Republic of North Ossetia-Alania | same |
| 1633 | Republic of Tatarstan | same |
| 1634 | Rostov Oblast | same |
| 1635 | Ryazan Oblast | same |
| 1636 | Saint Petersburg | same |
| 1637 | Sakha Republic | same |
| 1638 | Sakhalin | same |
| 1639 | Samara Oblast | same |
| 1640 | Saratov Oblast | same |
| 1641 | Sevastopol (Russia) | same |
| 1642 | Smolensk Oblast | same |
| 1643 | Stavropol Krai | same |
| 1644 | Sverdlovsk | same |
| 1645 | Tambov Oblast | same |
| 1646 | Tomsk Oblast | same |
| 1647 | Tula Oblast | same |
| 1648 | Tuva Republic | same |
| 1649 | Tver Oblast | same |
| 1650 | Tyumen Oblast | same |
| 1651 | Udmurt Republic | same |
| 1652 | Ulyanovsk Oblast | same |
| 1653 | Vladimir Oblast | same |
| 1654 | Volgograd Oblast | same |
| 1655 | Vologda Oblast | same |
| 1656 | Voronezh Oblast | same |
| 1657 | Yamalo-Nenets Autonomous Okrug | same |
| 1658 | Yaroslavl Oblast | same |
| 1659 | Zabaykalsky Krai | same |
| 1660 | Bonaire (Netherlands) | same |
| 1661 | Drenthe | same |
| 1662 | Flevoland | same |
| 1663 | Friesland | same |
| 1664 | Gelderland | same |
| 1665 | Groningen | same |
| 1666 | Limburg (Netherlands) | same |
| 1667 | North Brabant | same |
| 1668 | North Holland | same |
| 1669 | Overijssel | same |
| 1670 | Saba (Netherlands) | same |
| 1671 | Sint Eustatius (Netherlands) | same |
| 1672 | South Holland | same |
| 1673 | Utrecht | same |
| 1674 | Zeeland | same |
| 1675 | Anhui | same |
| 1676 | Beijing | same |
| 1677 | Chongqing | same |
| 1678 | Fujian | same |
| 1679 | Gansu | same |
| 1680 | Guangdong | same |
| 1681 | Guangxi Zhuang | same |
| 1682 | Guizhou | same |
| 1683 | Hainan | same |
| 1684 | Hebei | same |
| 1685 | Heilongjiang | same |
| 1686 | Henan | same |
| 1687 | Hong Kong SAR | same |
| 1688 | Hubei | same |
| 1689 | Hunan | same |
| 1690 | Inner Mongolia | same |
| 1691 | Jiangsu | same |
| 1692 | Jiangxi | same |
| 1693 | Jilin | same |
| 1694 | Liaoning | same |
| 1695 | Macau SAR | same |
| 1696 | Ningxia Huizu | same |
| 1697 | Qinghai | same |
| 1698 | Shaanxi | same |
| 1699 | Shandong | same |
| 1700 | Shanghai | same |
| 1701 | Shanxi | same |
| 1702 | Sichuan | same |
| 1703 | Taiwan | same |
| 1704 | Tianjin | same |
| 1705 | Xinjiang | same |
| 1706 | Xizang | same |
| 1707 | Yunnan | same |
| 1708 | Zhejiang | same |
| 1709 | Batken Region | same |
| 1710 | Bishkek | same |
| 1711 | Chuy Region | same |
| 1712 | Issyk-Kul Region | same |
| 1713 | Jalal-Abad Region | same |
| 1714 | Naryn Region | same |
| 1715 | Osh | same |
| 1716 | Osh Region | same |
| 1717 | Talas Region | same |
| 1718 | Bumthang | same |
| 1719 | Chhukha | same |
| 1720 | Dagana | same |
| 1721 | Gasa | same |
| 1722 | Haa | same |
| 1723 | Lhuentse | same |
| 1724 | Mongar | same |
| 1725 | Paro | same |
| 1726 | Pemagatshel | same |
| 1727 | Punakha | same |
| 1728 | Samdrup Jongkhar | same |
| 1729 | Samtse | same |
| 1730 | Sarpang | same |
| 1731 | Thimphu | same |
| 1732 | Trashigang | same |
| 1733 | Trashiyangste | same |
| 1734 | Trongsa | same |
| 1735 | Tsirang | same |
| 1736 | Wangdue Phodrang | same |
| 1737 | Zhemgang | same |
| 1738 | Alba | same |
| 1739 | Arad | same |
| 1740 | Arges | same |
| 1741 | Bacău | same |
| 1742 | Bihor | same |
| 1743 | Bistrița-Năsăud | same |
| 1744 | Botoșani | same |
| 1745 | Braila | same |
| 1746 | Brașov | same |
| 1747 | Bucharest | same |
| 1748 | Buzău | same |
| 1749 | Caraș-Severin | same |
| 1750 | Cluj | same |
| 1751 | Constanța | same |
| 1752 | Covasna | same |
| 1753 | Călărași | same |
| 1754 | Dolj | same |
| 1755 | Dâmbovița | same |
| 1756 | Galați | same |
| 1757 | Giurgiu | same |
| 1758 | Gorj | same |
| 1759 | Harghita | same |
| 1760 | Hunedoara | same |
| 1761 | Ialomița | same |
| 1762 | Iași | same |
| 1763 | Ilfov | same |
| 1764 | Maramureș | same |
| 1765 | Mehedinți | same |
| 1766 | Mureș | same |
| 1767 | Neamț | same |
| 1768 | Olt | same |
| 1769 | Prahova | same |
| 1770 | Satu Mare | same |
| 1771 | Sibiu | same |
| 1772 | Suceava | same |
| 1773 | Sălaj | same |
| 1774 | Teleorman | same |
| 1775 | Timiș | same |
| 1776 | Tulcea | same |
| 1777 | Vaslui | same |
| 1778 | Vrancea | same |
| 1779 | Vâlcea | same |
| 1780 | Centrale Region | same |
| 1781 | Kara Region | same |
| 1782 | Maritime | same |
| 1783 | Plateaux Region | same |
| 1784 | Savanes Region | same |
| 1785 | Abra | same |
| 1786 | Agusan del Norte | same |
| 1787 | Agusan del Sur | same |
| 1788 | Aklan | same |
| 1789 | Albay | same |
| 1790 | Antique | same |
| 1791 | Apayao | same |
| 1792 | Aurora | same |
| 1793 | Basilan | same |
| 1794 | Bataan | same |
| 1795 | Batanes | same |
| 1796 | Batangas | same |
| 1797 | Benguet | same |
| 1798 | Biliran | same |
| 1799 | Bohol | same |
| 1800 | Bukidnon | same |
| 1801 | Bulacan | same |
| 1802 | Cagayan | same |
| 1803 | Camarines Norte | same |
| 1804 | Camarines Sur | same |
| 1805 | Camiguin | same |
| 1806 | Capiz | same |
| 1807 | Catanduanes | same |
| 1808 | Cavite | same |
| 1809 | Cebu | same |
| 1810 | Cotabato | same |
| 1811 | Davao Occidental | same |
| 1812 | Davao Oriental | same |
| 1813 | Davao del Norte | same |
| 1814 | Davao del Sur | same |
| 1815 | Dinagat Islands | same |
| 1816 | Eastern Samar | same |
| 1817 | Guimaras | same |
| 1818 | Ifugao | same |
| 1819 | Ilocos Norte | same |
| 1820 | Ilocos Sur | same |
| 1821 | Iloilo | same |
| 1822 | Isabela | same |
| 1823 | Kalinga | same |
| 1824 | La Union | same |
| 1825 | Lanao del Norte | same |
| 1826 | Lanao del Sur | same |
| 1827 | Leyte | same |
| 1828 | Marinduque | same |
| 1829 | Masbate | same |
| 1830 | Misamis Occidental | same |
| 1831 | Misamis Oriental | same |
| 1832 | Mountain Province | same |
| 1833 | Negros Occidental | same |
| 1834 | Negros Oriental | same |
| 1835 | Northern Samar | same |
| 1836 | Nueva Ecija | same |
| 1837 | Nueva Vizcaya | same |
| 1838 | Palawan | same |
| 1839 | Pampanga | same |
| 1840 | Pangasinan | same |
| 1841 | Quezon | same |
| 1842 | Quirino | same |
| 1843 | Rizal | same |
| 1844 | Romblon | same |
| 1845 | Sarangani | same |
| 1846 | Siquijor | same |
| 1847 | Sorsogon | same |
| 1848 | South Cotabato | same |
| 1849 | Southern Leyte | same |
| 1850 | Sultan Kudarat | same |
| 1851 | Sulu | same |
| 1852 | Surigao del Norte | same |
| 1853 | Surigao del Sur | same |
| 1854 | Tarlac | same |
| 1855 | Tawi-Tawi | same |
| 1856 | Zambales | same |
| 1857 | Zamboanga Sibugay | same |
| 1858 | Zamboanga del Norte | same |
| 1859 | Zamboanga del Sur | same |
| 1860 | Andijan Region | same |
| 1861 | Bukhara Region | same |
| 1862 | Fergana Region | same |
| 1863 | Jizzakh Region | same |
| 1864 | Karakalpakstan | same |
| 1865 | Namangan Region | same |
| 1866 | Navoiy Region | same |
| 1867 | Qashqadaryo Region | same |
| 1868 | Samarqand Region | same |
| 1869 | Sirdaryo Region | same |
| 1870 | Surxondaryo Region | same |
| 1871 | Tashkent | same |
| 1872 | Tashkent Region | same |
| 1873 | Xorazm Region | same |
| 1874 | Bulawayo Province | same |
| 1875 | Harare Province | same |
| 1876 | Manicaland | same |
| 1877 | Mashonaland Central Province | same |
| 1878 | Mashonaland East Province | same |
| 1879 | Mashonaland West Province | same |
| 1880 | Masvingo Province | same |
| 1881 | Matabeleland North Province | same |
| 1882 | Matabeleland South Province | same |
| 1883 | Midlands Province | same |
| 1884 | Andrijevica | same |
| 1885 | Bar | same |
| 1886 | Berane | same |
| 1887 | Bijelo Polje | same |
| 1888 | Budva | same |
| 1889 | Cetinje | same |
| 1890 | Danilovgrad | same |
| 1891 | Gusinje | same |
| 1892 | Herceg-Novi | same |
| 1893 | Kolašin | same |
| 1894 | Kotor | same |
| 1895 | Mojkovac | same |
| 1896 | Nikšić | same |
| 1897 | Petnjica | same |
| 1898 | Plav | same |
| 1899 | Pljevlja | same |
| 1900 | Plužine | same |
| 1901 | Podgorica | same |
| 1902 | Rožaje | same |
| 1903 | Tivat | same |
| 1904 | Tuzi | same |
| 1905 | Ulcinj | same |
| 1906 | Zeta | same |
| 1907 | Šavnik | same |
| 1908 | Žabljak | same |
| 1909 | Saint Andrew Parish (Dominica) | same |
| 1910 | Saint David Parish (Dominica) | same |
| 1911 | Saint George Parish (Dominica) | same |
| 1912 | Saint John Parish (Dominica) | same |
| 1913 | Saint Joseph Parish | same |
| 1914 | Saint Luke Parish | same |
| 1915 | Saint Mark Parish (Dominica) | same |
| 1916 | Saint Patrick Parish (Dominica) | same |
| 1917 | Saint Paul Parish (Dominica) | same |
| 1918 | Saint Peter Parish (Dominica) | same |
| 1919 | Aceh | same |
| 1920 | Bali | same |
| 1921 | Banten | same |
| 1922 | Bengkulu | same |
| 1923 | Gorontalo | same |
| 1924 | Jambi | same |
| 1925 | Jawa Barat | same |
| 1926 | Jawa Tengah | same |
| 1927 | Jawa Timur | same |
| 1928 | Kalimantan Barat | same |
| 1929 | Kalimantan Selatan | same |
| 1930 | Kalimantan Tengah | same |
| 1931 | Kalimantan Timur | same |
| 1932 | Kalimantan Utara | same |
| 1933 | Kepulauan Bangka Belitung | same |
| 1934 | Kepulauan Riau | same |
| 1935 | Lampung | same |
| 1936 | Maluku | same |
| 1937 | Maluku Utara | same |
| 1938 | Nusa Tenggara Barat | same |
| 1939 | Nusa Tenggara Timur | same |
| 1940 | Papua | same |
| 1941 | Papua Barat | same |
| 1942 | Riau | same |
| 1943 | Sulawesi Barat | same |
| 1944 | Sulawesi Selatan | same |
| 1945 | Sulawesi Tenggara | same |
| 1946 | Sulawesi Utara | same |
| 1947 | Sumatera Barat | same |
| 1948 | Sumatera Selatan | same |
| 1949 | Sumatera Utara | same |
| 1950 | Alibori | same |
| 1951 | Atakora | same |
| 1952 | Atlantique | same |
| 1953 | Borgou | same |
| 1954 | Collines | same |
| 1955 | Donga | same |
| 1956 | Kouffo | same |
| 1957 | Littoral (Benin) | same |
| 1958 | Mono | same |
| 1959 | Ouémé | same |
| 1960 | Plateau (Benin) | same |
| 1961 | Zou | same |
| 1962 | Bengo Province | same |
| 1963 | Benguela Province | same |
| 1964 | Bié Province | same |
| 1965 | Cabinda Province | same |
| 1966 | Cuando Cubango Province | same |
| 1967 | Cuanza Norte Province | same |
| 1968 | Cuanza Sul | same |
| 1969 | Cunene Province | same |
| 1970 | Huambo Province | same |
| 1971 | Huíla Province | same |
| 1972 | Luanda Province | same |
| 1973 | Lunda Norte Province | same |
| 1974 | Lunda Sul Province | same |
| 1975 | Malanje Province | same |
| 1976 | Moxico Province | same |
| 1977 | Uíge Province | same |
| 1978 | Zaire Province | same |
| 1979 | Al Jazirah | same |
| 1980 | Al Qadarif | same |
| 1981 | Blue Nile | same |
| 1982 | Central Darfur | same |
| 1983 | East Darfur | same |
| 1984 | Kassala | same |
| 1985 | Khartoum | same |
| 1986 | North Darfur | same |
| 1987 | North Kordofan | same |
| 1988 | Northern (Sudan) | same |
| 1989 | Red Sea (Sudan) | same |
| 1990 | River Nile | same |
| 1991 | Sennar | same |
| 1992 | South Darfur | same |
| 1993 | South Kordofan | same |
| 1994 | West Darfur | same |
| 1995 | West Kordofan | same |
| 1996 | White Nile | same |
| 1997 | Aveiro | same |
| 1998 | Açores | same |
| 1999 | Beja | same |
| 2000 | Braga | same |
| 2001 | Bragança | same |
| 2002 | Castelo Branco | same |
| 2003 | Coimbra | same |
| 2004 | Faro | same |
| 2005 | Guarda | same |
| 2006 | Leiria | same |
| 2007 | Lisbon | same |
| 2008 | Madeira | same |
| 2009 | Portalegre | same |
| 2010 | Porto | same |
| 2011 | Santarém | same |
| 2012 | Setúbal | same |
| 2013 | Viana do Castelo | same |
| 2014 | Vila Real | same |
| 2015 | Viseu | same |
| 2016 | Évora | same |
| 2017 | Chagang Province | same |
| 2018 | Kangwon Province | same |
| 2019 | North Hamgyong Province | same |
| 2020 | North Hwanghae Province | same |
| 2021 | North Pyongan Province | same |
| 2022 | Ryanggang Province | same |
| 2023 | South Hamgyong Province | same |
| 2024 | South Hwanghae Province | same |
| 2025 | South Pyongan Province | same |
| 2026 | Carriacou | same |
| 2027 | Carriacou and Petite Martinique | same |
| 2028 | Saint Andrew (Grenada) | same |
| 2029 | Saint Andrew Parish (Grenada) | same |
| 2030 | Saint David | same |
| 2031 | Saint David Parish (Grenada) | same |
| 2032 | Saint George (Grenada) | same |
| 2033 | Saint George Parish (Grenada) | same |
| 2034 | Saint John (Grenada) | same |
| 2035 | Saint John Parish (Grenada) | same |
| 2036 | Saint Mark | same |
| 2037 | Saint Mark Parish (Grenada) | same |
| 2038 | Saint Patrick | same |
| 2039 | Saint Patrick Parish (Grenada) | same |
| 2040 | Anatolikí Makedonía kai Thráki | same |
| 2041 | Attikí | same |
| 2042 | Dytikí Elláda | same |
| 2043 | Dytikí Makedonía | same |
| 2044 | Ionía Nísia | same |
| 2045 | Kentrikí Makedonía | same |
| 2046 | Kríti | same |
| 2047 | Nótio Aigaío | same |
| 2048 | Pelopónnisos | same |
| 2049 | Stereá Elláda | same |
| 2050 | Thessalía | same |
| 2051 | Vóreio Aigaío | same |
| 2052 | Ágion Óros | same |
| 2053 | Ípeiros | same |
| 2054 | Arkhangai Province | same |
| 2055 | Bayan-Ölgii Province | same |
| 2056 | Bayankhongor Province | same |
| 2057 | Bulgan Province | same |
| 2058 | Darkhan-Uul Province | same |
| 2059 | Dornod Province | same |
| 2060 | Dornogovi Province | same |
| 2061 | Dundgovi Province | same |
| 2062 | Govi-Altai Province | same |
| 2063 | Govisümber Province | same |
| 2064 | Khentii Province | same |
| 2065 | Khovd Province | same |
| 2066 | Khövsgöl Province | same |
| 2067 | Orkhon Province | same |
| 2068 | Selenge Province | same |
| 2069 | Sükhbaatar Province | same |
| 2070 | Töv Province | same |
| 2071 | Uvs Province | same |
| 2072 | Zavkhan Province | same |
| 2073 | Ömnögovi Province | same |
| 2074 | Övörkhangai Province | same |
| 2075 | Alborz | same |
| 2076 | Ardabil | same |
| 2077 | Bushehr | same |
| 2078 | Chaharmahal and Bakhtiari | same |
| 2079 | East Azerbaijan | same |
| 2080 | Fars | same |
| 2081 | Gilan | same |
| 2082 | Golestan | same |
| 2083 | Hamadan | same |
| 2084 | Hormozgan | same |
| 2085 | Ilam | same |
| 2086 | Isfahan | same |
| 2087 | Kerman | same |
| 2088 | Kermanshah | same |
| 2089 | Khuzestan | same |
| 2090 | Kohgiluyeh and Boyer-Ahmad | same |
| 2091 | Kurdistan | same |
| 2092 | Lorestan | same |
| 2093 | Markazi | same |
| 2094 | Mazandaran | same |
| 2095 | North Khorasan | same |
| 2096 | Qazvin | same |
| 2097 | Qom | same |
| 2098 | Razavi Khorasan | same |
| 2099 | Semnan | same |
| 2100 | Sistan and Baluchestan | same |
| 2101 | South Khorasan | same |
| 2102 | Tehran | same |
| 2103 | West Azarbaijan | same |
| 2104 | Yazd | same |
| 2105 | Zanjan | same |
| 2106 | Barima-Waini | same |
| 2107 | Cuyuni-Mazaruni | same |
| 2108 | Demerara-Mahaica | same |
| 2109 | East Berbice-Corentyne | same |
| 2110 | Essequibo Islands-West Demerara | same |
| 2111 | Mahaica-Berbice | same |
| 2112 | Pomeroon-Supenaam | same |
| 2113 | Potaro-Siparuni | same |
| 2114 | Upper Demerara-Berbice | same |
| 2115 | Upper Takutu-Upper Essequibo | same |
| 2116 | Alta Verapaz | same |
| 2117 | Baja Verapaz | same |
| 2118 | Chimaltenango | same |
| 2119 | Chiquimula | same |
| 2120 | El Progreso | same |
| 2121 | Escuintla | same |
| 2122 | Guatemala | same |
| 2123 | Huehuetenango | same |
| 2124 | Izabal | same |
| 2125 | Jalapa | same |
| 2126 | Jutiapa | same |
| 2127 | Petén | same |
| 2128 | Quetzaltenango | same |
| 2129 | Quiché | same |
| 2130 | Retalhuleu | same |
| 2131 | Sacatepéquez | same |
| 2132 | San Marcos | same |
| 2133 | Santa Rosa | same |
| 2134 | Sololá | same |
| 2135 | Suchitepéquez | same |
| 2136 | Totonicapán | same |
| 2137 | Zacapa | same |
| 2138 | Al Anbar | same |
| 2139 | Al Muthanna | same |
| 2140 | Al-Qādisiyyah | same |
| 2141 | Babylon | same |
| 2142 | Baghdad | same |
| 2143 | Basra | same |
| 2144 | Dhi Qar | same |
| 2145 | Diyala | same |
| 2146 | Dohuk | same |
| 2147 | Erbil | same |
| 2148 | Karbala | same |
| 2149 | Kirkuk | same |
| 2150 | Maysan | same |
| 2151 | Najaf | same |
| 2152 | Nineveh | same |
| 2153 | Saladin | same |
| 2154 | Sulaymaniyah | same |
| 2155 | Wasit | same |
| 2156 | Aisén del General Carlos Ibañez del Campo | same |
| 2157 | Antofagasta | same |
| 2158 | Arica y Parinacota | same |
| 2159 | Atacama | same |
| 2160 | Biobío | same |
| 2161 | Coquimbo | same |
| 2162 | La Araucanía | same |
| 2163 | Libertador General Bernardo O'Higgins | same |
| 2164 | Los Lagos | same |
| 2165 | Los Ríos (Chile) | same |
| 2166 | Magallanes y de la Antártica Chilena | same |
| 2167 | Maule | same |
| 2168 | Región Metropolitana de Santiago | same |
| 2169 | Tarapacá | same |
| 2170 | Valparaíso | same |
| 2171 | Ñuble | same |
| 2172 | Bagmati | same |
| 2173 | Bagmati Zone | same |
| 2174 | Bheri Zone | same |
| 2175 | Central Region (Nepal) | same |
| 2176 | Dhaulagiri Zone | same |
| 2177 | Eastern Development Region | same |
| 2178 | Far-Western Development Region | same |
| 2179 | Gandaki | same |
| 2180 | Gandaki Zone | same |
| 2181 | Janakpur Zone | same |
| 2182 | Karnali | same |
| 2183 | Karnali Zone | same |
| 2184 | Koshi | same |
| 2185 | Kosi Zone | same |
| 2186 | Lumbini | same |
| 2187 | Lumbini Zone | same |
| 2188 | Madhesh | same |
| 2189 | Mahakali Zone | same |
| 2190 | Mechi Zone | same |
| 2191 | Mid-Western Region | same |
| 2192 | Narayani Zone | same |
| 2193 | Rapti Zone | same |
| 2194 | Sagarmatha Zone | same |
| 2195 | Seti Zone | same |
| 2196 | Sudurpashchim | same |
| 2197 | Western Region | same |
| 2198 | Ba | same |
| 2199 | Bua | same |
| 2200 | Cakaudrove | same |
| 2201 | Kadavu | same |
| 2202 | Lau | same |
| 2203 | Lomaiviti | same |
| 2204 | Macuata | same |
| 2205 | Naitasiri | same |
| 2206 | Namosi | same |
| 2207 | Ra | same |
| 2208 | Rewa | same |
| 2209 | Serua | same |
| 2210 | Tailevu | same |
| 2211 | Arusha | same |
| 2212 | Dar es Salaam | same |
| 2213 | Dodoma | same |
| 2214 | Geita | same |
| 2215 | Iringa | same |
| 2216 | Kagera | same |
| 2217 | Katavi | same |
| 2218 | Kigoma | same |
| 2219 | Kilimanjaro | same |
| 2220 | Lindi | same |
| 2221 | Manyara | same |
| 2222 | Mara | same |
| 2223 | Mbeya | same |
| 2224 | Morogoro | same |
| 2225 | Mtwara | same |
| 2226 | Mwanza | same |
| 2227 | Njombe | same |
| 2228 | Pemba North | same |
| 2229 | Pemba South | same |
| 2230 | Pwani | same |
| 2231 | Rukwa | same |
| 2232 | Ruvuma | same |
| 2233 | Shinyanga | same |
| 2234 | Simiyu | same |
| 2235 | Singida | same |
| 2236 | Songwe | same |
| 2237 | Tabora | same |
| 2238 | Tanga | same |
| 2239 | Zanzibar North | same |
| 2240 | Zanzibar South | same |
| 2241 | Zanzibar West | same |
| 2242 | Autonomous Republic of Crimea | same |
| 2243 | Cherkaska | same |
| 2244 | Chernihivska | same |
| 2245 | Chernivetska | same |
| 2246 | Dnipropetrovska | same |
| 2247 | Donetska | same |
| 2248 | Ivano-Frankivska | same |
| 2249 | Kharkivska | same |
| 2250 | Khersonska | same |
| 2251 | Khmelnytska | same |
| 2252 | Kirovohradska | same |
| 2253 | Kyiv | same |
| 2254 | Kyivska | same |
| 2255 | Luhanska | same |
| 2256 | Lvivska | same |
| 2257 | Mykolaivska | same |
| 2258 | Odeska | same |
| 2259 | Poltavska | same |
| 2260 | Rivnenska | same |
| 2261 | Sevastopol (Ukraine) | same |
| 2262 | Sumska | same |
| 2263 | Ternopilska | same |
| 2264 | Vinnytska | same |
| 2265 | Volynska | same |
| 2266 | Zakarpatska | same |
| 2267 | Zaporizka | same |
| 2268 | Zhytomyrska | same |
| 2269 | Ahafo | same |
| 2270 | Ashanti | same |
| 2271 | Bono | same |
| 2272 | Bono East | same |
| 2273 | Central (Ghana) | same |
| 2274 | Eastern | same |
| 2275 | Greater Accra | same |
| 2276 | North East (Ghana) | same |
| 2277 | Northern (Ghana) | same |
| 2278 | Oti | same |
| 2279 | Savannah | same |
| 2280 | Upper East | same |
| 2281 | Upper West | same |
| 2282 | Volta | same |
| 2283 | Western | same |
| 2284 | Western North | same |
| 2285 | Andaman and Nicobar Islands | same |
| 2286 | Andhra Pradesh | same |
| 2287 | Arunachal Pradesh | same |
| 2288 | Assam | same |
| 2289 | Bihar | same |
| 2290 | Chandigarh | same |
| 2291 | Chhattisgarh | same |
| 2292 | Dadra and Nagar Haveli and Daman and Diu | same |
| 2293 | Delhi | same |
| 2294 | Goa | same |
| 2295 | Gujarat | same |
| 2296 | Haryana | same |
| 2297 | Himachal Pradesh | same |
| 2298 | Jammu and Kashmir | same |
| 2299 | Jharkhand | same |
| 2300 | Karnataka | same |
| 2301 | Kerala | same |
| 2302 | Ladakh | same |
| 2303 | Lakshadweep | same |
| 2304 | Madhya Pradesh | same |
| 2305 | Maharashtra | same |
| 2306 | Manipur | same |
| 2307 | Meghalaya | same |
| 2308 | Mizoram | same |
| 2309 | Nagaland | same |
| 2310 | Odisha | same |
| 2311 | Puducherry | same |
| 2312 | Punjab (India) | same |
| 2313 | Rajasthan | same |
| 2314 | Sikkim | same |
| 2315 | Tamil Nadu | same |
| 2316 | Telangana | same |
| 2317 | Tripura | same |
| 2318 | Uttar Pradesh | same |
| 2319 | Uttarakhand | same |
| 2320 | West Bengal | same |
| 2321 | Alberta | same |
| 2322 | British Columbia | same |
| 2323 | Manitoba | same |
| 2324 | New Brunswick | same |
| 2325 | Newfoundland and Labrador | same |
| 2326 | Northwest Territories | same |
| 2327 | Nova Scotia | same |
| 2328 | Nunavut | same |
| 2329 | Ontario | same |
| 2330 | Prince Edward Island | same |
| 2331 | Quebec | same |
| 2332 | Saskatchewan | same |
| 2333 | Yukon | same |
| 2334 | Addu City | same |
| 2335 | Ariatholhu Dhekunuburi | same |
| 2336 | Ariatholhu Uthuruburi | same |
| 2337 | Faadhippolhu | same |
| 2338 | Felidheatholhu | same |
| 2339 | Fuvammulah | same |
| 2340 | Hahdhunmathi | same |
| 2341 | Huvadhuatholhu Dhekunuburi | same |
| 2342 | Huvadhuatholhu Uthuruburi | same |
| 2343 | Kolhumadulu | same |
| 2344 | Maale/Male | same |
| 2345 | Maaleatholhu | same |
| 2346 | Maalhosmadulu Dhekunuburi | same |
| 2347 | Maalhosmadulu Uthuruburi | same |
| 2348 | Miladhunmadulu Dhekunuburi | same |
| 2349 | Miladhunmadulu Uthuruburi | same |
| 2350 | Mulakatholhu | same |
| 2351 | Nilandheatholhu Dhekunuburi | same |
| 2352 | Nilandheatholhu Uthuruburi | same |
| 2353 | Thiladhunmathee Dhekunuburi | same |
| 2354 | Thiladhunmathee Uthuruburi | same |
| 2355 | Antwerp | same |
| 2356 | Brussels | same |
| 2357 | East Flanders | same |
| 2358 | Flemish Brabant | same |
| 2359 | Hainaut | same |
| 2360 | Limburg (Belgium) | same |
| 2361 | Liège | same |
| 2362 | Luxembourg | same |
| 2363 | Namur | same |
| 2364 | Walloon Brabant | same |
| 2365 | West Flanders | same |
| 2366 | Changhua | same |
| 2367 | Chiayi | same |
| 2368 | Hsinchu | same |
| 2369 | Hualien | same |
| 2370 | Kaohsiung | same |
| 2371 | Keelung | same |
| 2372 | Kinmen | same |
| 2373 | Lienchiang | same |
| 2374 | Miaoli | same |
| 2375 | Nantou | same |
| 2376 | New Taipei | same |
| 2377 | Penghu | same |
| 2378 | Pingtung | same |
| 2379 | Taichung | same |
| 2380 | Tainan | same |
| 2381 | Taipei | same |
| 2382 | Taitung | same |
| 2383 | Taoyuan | same |
| 2384 | Yilan | same |
| 2385 | Yunlin | same |
| 2386 | Eastern Cape | same |
| 2387 | Free State | same |
| 2388 | Gauteng | same |
| 2389 | KwaZulu-Natal | same |
| 2390 | Limpopo | same |
| 2391 | Mpumalanga | same |
| 2392 | North West (South Africa) | same |
| 2393 | Northern Cape | same |
| 2394 | Western Cape | same |
| 2395 | Arima | same |
| 2396 | Chaguanas | same |
| 2397 | Couva-Tabaquite-Talparo Regional Corporation | same |
| 2398 | Diego Martin Regional Corporation | same |
| 2399 | Eastern Tobago | same |
| 2400 | Penal-Debe Regional Corporation | same |
| 2401 | Point Fortin | same |
| 2402 | Port of Spain | same |
| 2403 | Princes Town Regional Corporation | same |
| 2404 | Rio Claro-Mayaro Regional Corporation | same |
| 2405 | San Fernando | same |
| 2406 | San Juan-Laventille Regional Corporation | same |
| 2407 | Sangre Grande Regional Corporation | same |
| 2408 | Siparia Regional Corporation | same |
| 2409 | Tunapuna-Piarco Regional Corporation | same |
| 2410 | Western Tobago | same |
| 2411 | Bamingui-Bangoran Prefecture | same |
| 2412 | Bangui | same |
| 2413 | Basse-Kotto Prefecture | same |
| 2414 | Haut-Mbomou Prefecture | same |
| 2415 | Haute-Kotto Prefecture | same |
| 2416 | Kémo Prefecture | same |
| 2417 | Lobaye Prefecture | same |
| 2418 | Mbomou Prefecture | same |
| 2419 | Nana-Grébizi Economic Prefecture | same |
| 2420 | Nana-Mambéré Prefecture | same |
| 2421 | Ombella-M'Poko Prefecture | same |
| 2422 | Ouaka Prefecture | same |
| 2423 | Ouham Prefecture | same |
| 2424 | Ouham-Pendé Prefecture | same |
| 2425 | Sangha-Mbaéré | same |
| 2426 | Vakaga Prefecture | same |
| 2427 | Bas-Uélé | same |
| 2428 | Haut-Katanga | same |
| 2429 | Haut-Lomami | same |
| 2430 | Haut-Uélé | same |
| 2431 | Ituri | same |
| 2432 | Kasaï | same |
| 2433 | Kasaï Central | same |
| 2434 | Kasaï Oriental | same |
| 2435 | Kinshasa | same |
| 2436 | Kongo Central | same |
| 2437 | Kwango | same |
| 2438 | Kwilu | same |
| 2439 | Lomami | same |
| 2440 | Lualaba | same |
| 2441 | Mai-Ndombe | same |
| 2442 | Maniema | same |
| 2443 | Mongala | same |
| 2444 | Nord-Kivu | same |
| 2445 | Nord-Ubangi | same |
| 2446 | Sankuru | same |
| 2447 | Sud-Kivu | same |
| 2448 | Sud-Ubangi | same |
| 2449 | Tanganyika | same |
| 2450 | Tshopo | same |
| 2451 | Tshuapa | same |
| 2452 | Équateur | same |
| 2453 | Clarendon Parish | same |
| 2454 | Hanover Parish | same |
| 2455 | Kingston Parish | same |
| 2456 | Manchester Parish | same |
| 2457 | Portland Parish | same |
| 2458 | Saint Andrew (Jamaica) | same |
| 2459 | Saint Ann Parish | same |
| 2460 | Saint Catherine Parish | same |
| 2461 | Saint Elizabeth Parish | same |
| 2462 | Saint James Parish | same |
| 2463 | Saint Mary Parish (Jamaica) | same |
| 2464 | Saint Thomas Parish | same |
| 2465 | Trelawny Parish | same |
| 2466 | Westmoreland Parish | same |
| 2467 | Amazonas (Peru) | same |
| 2468 | Apurímac | same |
| 2469 | Arequipa | same |
| 2470 | Ayacucho | same |
| 2471 | Cajamarca | same |
| 2472 | Callao | same |
| 2473 | Cusco | same |
| 2474 | Huancavelica | same |
| 2475 | Huanuco | same |
| 2476 | Ica | same |
| 2477 | Junín | same |
| 2478 | La Libertad | same |
| 2479 | Lambayeque | same |
| 2480 | Lima | same |
| 2481 | Loreto | same |
| 2482 | Madre de Dios | same |
| 2483 | Moquegua | same |
| 2484 | Pasco | same |
| 2485 | Piura | same |
| 2486 | Puno | same |
| 2487 | San Martín | same |
| 2488 | Tacna | same |
| 2489 | Tumbes | same |
| 2490 | Ucayali | same |
| 2491 | Áncash | same |
| 2492 | Ahal Region | same |
| 2493 | Ashgabat | same |
| 2494 | Balkan Region | same |
| 2495 | Daşoguz Region | same |
| 2496 | Lebap Region | same |
| 2497 | Mary Region | same |
| 2498 | Baden-Württemberg | same |
| 2499 | Bavaria | same |
| 2500 | Berlin | same |
| 2501 | Brandenburg | same |
| 2502 | Bremen | same |
| 2503 | Hamburg | same |
| 2504 | Hesse | same |
| 2505 | Lower Saxony | same |
| 2506 | Mecklenburg-Vorpommern | same |
| 2507 | North Rhine-Westphalia | same |
| 2508 | Rhineland-Palatinate | same |
| 2509 | Saarland | same |
| 2510 | Saxony | same |
| 2511 | Saxony-Anhalt | same |
| 2512 | Schleswig-Holstein | same |
| 2513 | Thuringia | same |
| 2514 | Alabama | same |
| 2515 | Alaska | same |
| 2516 | American Samoa | same |
| 2517 | Arizona | same |
| 2518 | Arkansas | same |
| 2519 | California | same |
| 2520 | Colorado | same |
| 2521 | Connecticut | same |
| 2522 | Delaware | same |
| 2523 | District of Columbia | same |
| 2524 | Florida (United States) | same |
| 2525 | Georgia | same |
| 2526 | Guam | same |
| 2527 | Hawaii | same |
| 2528 | Idaho | same |
| 2529 | Illinois | same |
| 2530 | Indiana | same |
| 2531 | Iowa | same |
| 2532 | Kansas | same |
| 2533 | Kentucky | same |
| 2534 | Louisiana | same |
| 2535 | Maine | same |
| 2536 | Maryland | same |
| 2537 | Massachusetts | same |
| 2538 | Michigan | same |
| 2539 | Minnesota | same |
| 2540 | Mississippi | same |
| 2541 | Missouri | same |
| 2542 | Montana (United States) | same |
| 2543 | Nebraska | same |
| 2544 | Nevada | same |
| 2545 | New Hampshire | same |
| 2546 | New Jersey | same |
| 2547 | New Mexico | same |
| 2548 | New York | same |
| 2549 | North Carolina | same |
| 2550 | North Dakota | same |
| 2551 | Northern Mariana Islands | same |
| 2552 | Ohio | same |
| 2553 | Oklahoma | same |
| 2554 | Oregon | same |
| 2555 | Pennsylvania | same |
| 2556 | Puerto Rico | same |
| 2557 | Rhode Island | same |
| 2558 | South Carolina | same |
| 2559 | South Dakota | same |
| 2560 | Tennessee | same |
| 2561 | Texas | same |
| 2562 | United States Minor Outlying Islands | same |
| 2563 | United States Virgin Islands | same |
| 2564 | Utah | same |
| 2565 | Vermont | same |
| 2566 | Virginia | same |
| 2567 | Washington | same |
| 2568 | West Virginia | same |
| 2569 | Wisconsin | same |
| 2570 | Wyoming | same |
| 2571 | Boké Prefecture | same |
| 2572 | Boké Region | same |
| 2573 | Conakry | same |
| 2574 | Dubréka Prefecture | same |
| 2575 | Faranah Prefecture | same |
| 2576 | Forécariah Prefecture | same |
| 2577 | Guéckédou Prefecture | same |
| 2578 | Kankan Prefecture | same |
| 2579 | Kankan Region | same |
| 2580 | Kindia Prefecture | same |
| 2581 | Kindia Region | same |
| 2582 | Kérouané Prefecture | same |
| 2583 | Labé Prefecture | same |
| 2584 | Labé Region | same |
| 2585 | Lélouma Prefecture | same |
| 2586 | Mamou Prefecture | same |
| 2587 | Mamou Region | same |
| 2588 | Nzérékoré Prefecture | same |
| 2589 | Nzérékoré Region | same |
| 2590 | Tougué Prefecture | same |
| 2591 | Télimélé Prefecture | same |
| 2592 | Awdal Region | same |
| 2593 | Bakool | same |
| 2594 | Banaadir | same |
| 2595 | Bari (Somalia) | same |
| 2596 | Bay | same |
| 2597 | Galguduud | same |
| 2598 | Gedo | same |
| 2599 | Hiran | same |
| 2600 | Lower Juba | same |
| 2601 | Lower Shebelle | same |
| 2602 | Mudug | same |
| 2603 | Nugal | same |
| 2604 | Sanaag Region | same |
| 2605 | Togdheer Region | same |
| 2606 | Bahr el Gazel | same |
| 2607 | Batha | same |
| 2608 | Borkou | same |
| 2609 | Chari-Baguirmi | same |
| 2610 | Ennedi-Est | same |
| 2611 | Ennedi-Ouest | same |
| 2612 | Guéra | same |
| 2613 | Hadjer-Lamis | same |
| 2614 | Kanem | same |
| 2615 | Lac | same |
| 2616 | Logone Occidental | same |
| 2617 | Logone Oriental | same |
| 2618 | Mandoul | same |
| 2619 | Mayo-Kebbi Est | same |
| 2620 | Mayo-Kebbi Ouest | same |
| 2621 | Moyen-Chari | same |
| 2622 | N'Djamena | same |
| 2623 | Ouaddaï | same |
| 2624 | Salamat | same |
| 2625 | Sila | same |
| 2626 | Tandjilé | same |
| 2627 | Tibesti | same |
| 2628 | Wadi Fira | same |
| 2629 | Príncipe Province | same |
| 2630 | Amnat Charoen | same |
| 2631 | Ang Thong | same |
| 2632 | Bangkok | same |
| 2633 | Bueng Kan | same |
| 2634 | Buri Ram | same |
| 2635 | Chachoengsao | same |
| 2636 | Chai Nat | same |
| 2637 | Chaiyaphum | same |
| 2638 | Chanthaburi | same |
| 2639 | Chiang Mai | same |
| 2640 | Chiang Rai | same |
| 2641 | Chon Buri | same |
| 2642 | Chumphon | same |
| 2643 | Kalasin | same |
| 2644 | Kamphaeng Phet | same |
| 2645 | Kanchanaburi | same |
| 2646 | Khon Kaen | same |
| 2647 | Krabi | same |
| 2648 | Lampang | same |
| 2649 | Loei | same |
| 2650 | Lop Buri | same |
| 2651 | Mae Hong Son | same |
| 2652 | Maha Sarakham | same |
| 2653 | Mukdahan | same |
| 2654 | Nakhon Nayok | same |
| 2655 | Nakhon Pathom | same |
| 2656 | Nakhon Phanom | same |
| 2657 | Nakhon Ratchasima | same |
| 2658 | Nakhon Sawan | same |
| 2659 | Nakhon Si Thammarat | same |
| 2660 | Nan | same |
| 2661 | Narathiwat | same |
| 2662 | Nong Bua Lam Phu | same |
| 2663 | Nong Khai | same |
| 2664 | Nonthaburi | same |
| 2665 | Pathum Thani | same |
| 2666 | Pattani | same |
| 2667 | Pattaya | same |
| 2668 | Phangnga | same |
| 2669 | Phatthalung | same |
| 2670 | Phayao | same |
| 2671 | Phetchabun | same |
| 2672 | Phetchaburi | same |
| 2673 | Phichit | same |
| 2674 | Phitsanulok | same |
| 2675 | Phra Nakhon Si Ayutthaya | same |
| 2676 | Phrae | same |
| 2677 | Phuket | same |
| 2678 | Prachin Buri | same |
| 2679 | Prachuap Khiri Khan | same |
| 2680 | Ranong | same |
| 2681 | Ratchaburi | same |
| 2682 | Rayong | same |
| 2683 | Roi Et | same |
| 2684 | Sa Kaeo | same |
| 2685 | Sakon Nakhon | same |
| 2686 | Samut Prakan | same |
| 2687 | Samut Sakhon | same |
| 2688 | Samut Songkhram | same |
| 2689 | Saraburi | same |
| 2690 | Satun | same |
| 2691 | Si Sa Ket | same |
| 2692 | Sing Buri | same |
| 2693 | Songkhla | same |
| 2694 | Sukhothai | same |
| 2695 | Suphan Buri | same |
| 2696 | Surat Thani | same |
| 2697 | Surin | same |
| 2698 | Tak | same |
| 2699 | Trang | same |
| 2700 | Trat | same |
| 2701 | Ubon Ratchathani | same |
| 2702 | Udon Thani | same |
| 2703 | Uthai Thani | same |
| 2704 | Uttaradit | same |
| 2705 | Yala | same |
| 2706 | Yasothon | same |
| 2707 | Annobón Province | same |
| 2708 | Bioko Norte Province | same |
| 2709 | Bioko Sur Province | same |
| 2710 | Centro Sur Province | same |
| 2711 | Insular Region | same |
| 2712 | Kié-Ntem Province | same |
| 2713 | Litoral Province | same |
| 2714 | Río Muni | same |
| 2715 | Wele-Nzas Province | same |
| 2716 | Gilbert Islands | same |
| 2717 | Line Islands | same |
| 2718 | Phoenix Islands | same |
| 2719 | Alajuela | same |
| 2720 | Cartago | same |
| 2721 | Guanacaste | same |
| 2722 | Heredia | same |
| 2723 | Limón | same |
| 2724 | Puntarenas | same |
| 2725 | San José (Costa Rica) | same |
| 2726 | Charlotte Parish | same |
| 2727 | Grenadines Parish | same |
| 2728 | Saint Andrew Parish (Saint Vincent and The Grenadines) | same |
| 2729 | Saint David Parish (Saint Vincent and The Grenadines) | same |
| 2730 | Saint George Parish (Saint Vincent and The Grenadines) | same |
| 2731 | Saint Patrick Parish (Saint Vincent and The Grenadines) | same |
| 2732 | An Giang | same |
| 2733 | Bà Rịa-Vũng Tàu | same |
| 2734 | Bình Dương | same |
| 2735 | Bình Phước | same |
| 2736 | Bình Thuận | same |
| 2737 | Bình Định | same |
| 2738 | Bạc Liêu | same |
| 2739 | Bắc Giang | same |
| 2740 | Bắc Kạn | same |
| 2741 | Bắc Ninh | same |
| 2742 | Bến Tre | same |
| 2743 | Cao Bằng | same |
| 2744 | Cà Mau | same |
| 2745 | Cần Thơ | same |
| 2746 | Gia Lai | same |
| 2747 | Hà Giang | same |
| 2748 | Hà Nam | same |
| 2749 | Hà Nội | same |
| 2750 | Hà Tĩnh | same |
| 2751 | Hòa Bình | same |
| 2752 | Hưng Yên | same |
| 2753 | Hải Dương | same |
| 2754 | Hải Phòng | same |
| 2755 | Hậu Giang | same |
| 2756 | Hồ Chí Minh | same |
| 2757 | Khánh Hòa | same |
| 2758 | Kiên Giang | same |
| 2759 | Kon Tum | same |
| 2760 | Lai Châu | same |
| 2761 | Long An | same |
| 2762 | Lào Cai | same |
| 2763 | Lâm Đồng | same |
| 2764 | Lạng Sơn | same |
| 2765 | Nam Định | same |
| 2766 | Nghệ An | same |
| 2767 | Ninh Bình | same |
| 2768 | Ninh Thuận | same |
| 2769 | Phú Thọ | same |
| 2770 | Phú Yên | same |
| 2771 | Quảng Bình | same |
| 2772 | Quảng Nam | same |
| 2773 | Quảng Ngãi | same |
| 2774 | Quảng Ninh | same |
| 2775 | Quảng Trị | same |
| 2776 | Sóc Trăng | same |
| 2777 | Sơn La | same |
| 2778 | Thanh Hóa | same |
| 2779 | Thái Bình | same |
| 2780 | Thái Nguyên | same |
| 2781 | Thừa Thiên-Huế | same |
| 2782 | Tiền Giang | same |
| 2783 | Trà Vinh | same |
| 2784 | Tuyên Quang | same |
| 2785 | Tây Ninh | same |
| 2786 | Vĩnh Long | same |
| 2787 | Vĩnh Phúc | same |
| 2788 | Yên Bái | same |
| 2789 | Điện Biên | same |
| 2790 | Đà Nẵng | same |
| 2791 | Đắk Lắk | same |
| 2792 | Đắk Nông | same |
| 2793 | Đồng Nai | same |
| 2794 | Đồng Tháp | same |
| 2795 | Abia | same |
| 2796 | Abuja Federal Capital Territory | same |
| 2797 | Adamawa (Nigeria) | same |
| 2798 | Akwa Ibom | same |
| 2799 | Anambra | same |
| 2800 | Bauchi | same |
| 2801 | Bayelsa | same |
| 2802 | Benue | same |
| 2803 | Borno | same |
| 2804 | Cross River | same |
| 2805 | Delta | same |
| 2806 | Ebonyi | same |
| 2807 | Edo | same |
| 2808 | Ekiti | same |
| 2809 | Enugu | same |
| 2810 | Gombe | same |
| 2811 | Imo | same |
| 2812 | Jigawa | same |
| 2813 | Kaduna | same |
| 2814 | Kano | same |
| 2815 | Katsina | same |
| 2816 | Kebbi | same |
| 2817 | Kogi | same |
| 2818 | Kwara | same |
| 2819 | Lagos | same |
| 2820 | Nasarawa | same |
| 2821 | Niger | same |
| 2822 | Ogun | same |
| 2823 | Ondo | same |
| 2824 | Osun | same |
| 2825 | Oyo | same |
| 2826 | Plateau (Nigeria) | same |
| 2827 | Rivers | same |
| 2828 | Sokoto | same |
| 2829 | Taraba | same |
| 2830 | Yobe | same |
| 2831 | Zamfara | same |
| 2832 | Al Ahmadi | same |
| 2833 | Al Farwaniyah | same |
| 2834 | Al Jahra | same |
| 2835 | Hawalli | same |
| 2836 | Mubarak Al-Kabeer | same |
| 2837 | Bjelovar-Bilogora | same |
| 2838 | Brod-Posavina | same |
| 2839 | Dubrovnik-Neretva | same |
| 2840 | Istria | same |
| 2841 | Karlovac | same |
| 2842 | Koprivnica-Križevci | same |
| 2843 | Krapina-Zagorje | same |
| 2844 | Lika-Senj | same |
| 2845 | Međimurje | same |
| 2846 | Osijek-Baranja | same |
| 2847 | Požega-Slavonia | same |
| 2848 | Primorje-Gorski Kotar | same |
| 2849 | Sisak-Moslavina | same |
| 2850 | Split-Dalmatia | same |
| 2851 | Varaždin | same |
| 2852 | Virovitica-Podravina | same |
| 2853 | Vukovar-Syrmia | same |
| 2854 | Zadar | same |
| 2855 | Zagreb | same |
| 2856 | Šibenik-Knin | same |
| 2857 | Central Province (Sri Lanka) | same |
| 2858 | Eastern Province (Sri Lanka) | same |
| 2859 | North Central Province | same |
| 2860 | North Western Province | same |
| 2861 | Northern Province (Sri Lanka) | same |
| 2862 | Sabaragamuwa Province | same |
| 2863 | Southern Province (Sri Lanka) | same |
| 2864 | Uva Province | same |
| 2865 | Western Province (Sri Lanka) | same |
| 2866 | Artigas | same |
| 2867 | Canelones | same |
| 2868 | Cerro Largo | same |
| 2869 | Colonia | same |
| 2870 | Durazno | same |
| 2871 | Flores | same |
| 2872 | Florida (Uruguay) | same |
| 2873 | Lavalleja | same |
| 2874 | Maldonado | same |
| 2875 | Montevideo | same |
| 2876 | Paysandú | same |
| 2877 | Rivera | same |
| 2878 | Rocha | same |
| 2879 | Río Negro (Uruguay) | same |
| 2880 | Salto | same |
| 2881 | San José (Uruguay) | same |
| 2882 | Soriano | same |
| 2883 | Tacuarembó | same |
| 2884 | Treinta y Tres | same |
| 2885 | Aileu municipality | same |
| 2886 | Ainaro Municipality | same |
| 2887 | Baucau Municipality | same |
| 2888 | Bobonaro Municipality | same |
| 2889 | Cova Lima Municipality | same |
| 2890 | Dili municipality | same |
| 2891 | Ermera District | same |
| 2892 | Lautém Municipality | same |
| 2893 | Liquiçá Municipality | same |
| 2894 | Manatuto District | same |
| 2895 | Manufahi Municipality | same |
| 2896 | Viqueque Municipality | same |
| 2897 |  Christchurch and Poole | same |
| 2898 | Aberdeen | same |
| 2899 | Aberdeenshire | same |
| 2900 | Angus | same |
| 2901 | Antrim and Newtownabbey | same |
| 2902 | Ards and North Down | same |
| 2903 | Argyll and Bute | same |
| 2904 | Armagh Banbridge and Craigavon | same |
| 2905 | Armagh, Banbridge and Craigavon | same |
| 2906 | Barking and Dagenham | same |
| 2907 | Barnet | same |
| 2908 | Barnsley | same |
| 2909 | Bath and North East Somerset | same |
| 2910 | Bedford | same |
| 2911 | Belfast | same |
| 2912 | Bexley | same |
| 2913 | Birmingham | same |
| 2914 | Blackburn with Darwen | same |
| 2915 | Blackpool | same |
| 2916 | Blaenau Gwent | same |
| 2917 | Bolton | same |
| 2918 | Bournemouth | same |
| 2919 | Bracknell Forest | same |
| 2920 | Bradford | same |
| 2921 | Brent | same |
| 2922 | Bridgend | same |
| 2923 | Brighton and Hove | same |
| 2924 | Bristol | same |
| 2925 | Bromley | same |
| 2926 | Buckinghamshire | same |
| 2927 | Bury | same |
| 2928 | Caerphilly | same |
| 2929 | Calderdale | same |
| 2930 | Cambridgeshire | same |
| 2931 | Camden | same |
| 2932 | Cardiff | same |
| 2933 | Carmarthenshire | same |
| 2934 | Causeway Coast and Glens | same |
| 2935 | Central Bedfordshire | same |
| 2936 | Ceredigion | same |
| 2937 | Cheshire East | same |
| 2938 | Cheshire West and Chester | same |
| 2939 | City of Kingston upon Hull | same |
| 2940 | City of Southampton | same |
| 2941 | Clackmannanshire | same |
| 2942 | Conwy | same |
| 2943 | Cornwall | same |
| 2944 | Coventry | same |
| 2945 | Croydon | same |
| 2946 | Cumbria | same |
| 2947 | Darlington | same |
| 2948 | Denbighshire | same |
| 2949 | Derby | same |
| 2950 | Derbyshire | same |
| 2951 | Derry City and Strabane | same |
| 2952 | Devon | same |
| 2953 | Doncaster | same |
| 2954 | Dorset | same |
| 2955 | Dudley | same |
| 2956 | Dumfries and Galloway | same |
| 2957 | Dundee | same |
| 2958 | Durham | same |
| 2959 | Ealing | same |
| 2960 | East Ayrshire | same |
| 2961 | East Dunbartonshire | same |
| 2962 | East Lothian | same |
| 2963 | East Renfrewshire | same |
| 2964 | East Riding of Yorkshire | same |
| 2965 | East Sussex | same |
| 2966 | Edinburgh | same |
| 2967 | Enfield | same |
| 2968 | Essex | same |
| 2969 | Falkirk | same |
| 2970 | Fermanagh and Omagh | same |
| 2971 | Fife | same |
| 2972 | Flintshire | same |
| 2973 | Gateshead | same |
| 2974 | Glasgow | same |
| 2975 | Gloucestershire | same |
| 2976 | Greenwich | same |
| 2977 | Gwynedd | same |
| 2978 | Hackney | same |
| 2979 | Halton | same |
| 2980 | Hammersmith and Fulham | same |
| 2981 | Hampshire | same |
| 2982 | Haringey | same |
| 2983 | Harrow | same |
| 2984 | Hartlepool | same |
| 2985 | Havering | same |
| 2986 | Herefordshire | same |
| 2987 | Hertfordshire | same |
| 2988 | Highland | same |
| 2989 | Hillingdon | same |
| 2990 | Hounslow | same |
| 2991 | Inverclyde | same |
| 2992 | Isle of Anglesey | same |
| 2993 | Isle of Wight | same |
| 2994 | Isles of Scilly | same |
| 2995 | Islington | same |
| 2996 | Kensington and Chelsea | same |
| 2997 | Kent | same |
| 2998 | Kingston upon Thames | same |
| 2999 | Kirklees | same |
| 3000 | Knowsley | same |
| 3001 | Lambeth | same |
| 3002 | Lancashire | same |
| 3003 | Leeds | same |
| 3004 | Leicester | same |
| 3005 | Leicestershire | same |
| 3006 | Lewisham | same |
| 3007 | Lincolnshire | same |
| 3008 | Lisburn and Castlereagh | same |
| 3009 | Liverpool | same |
| 3010 | London | same |
| 3011 | Luton | same |
| 3012 | Manchester | same |
| 3013 | Medway | same |
| 3014 | Merthyr Tydfil | same |
| 3015 | Merton | same |
| 3016 | Mid Ulster | same |
| 3017 | Mid and East Antrim | same |
| 3018 | Middlesbrough | same |
| 3019 | Midlothian | same |
| 3020 | Milton Keynes | same |
| 3021 | Monmouthshire | same |
| 3022 | Moray | same |
| 3023 | Neath Port Talbot | same |
| 3024 | Newcastle upon Tyne | same |
| 3025 | Newham | same |
| 3026 | Newport | same |
| 3027 | Newry Mourne and Down | same |
| 3028 | Newry, Mourne and Down | same |
| 3029 | Norfolk | same |
| 3030 | North Ayrshire | same |
| 3031 | North East Lincolnshire | same |
| 3032 | North Lanarkshire | same |
| 3033 | North Lincolnshire | same |
| 3034 | North Northamptonshire | same |
| 3035 | North Somerset | same |
| 3036 | North Tyneside | same |
| 3037 | North Yorkshire | same |
| 3038 | Northumberland | same |
| 3039 | Nottingham | same |
| 3040 | Nottinghamshire | same |
| 3041 | Oldham | same |
| 3042 | Orkney Islands | same |
| 3043 | Outer Hebrides | same |
| 3044 | Oxfordshire | same |
| 3045 | Pembrokeshire | same |
| 3046 | Perth and Kinross | same |
| 3047 | Peterborough | same |
| 3048 | Plymouth | same |
| 3049 | Portsmouth | same |
| 3050 | Powys | same |
| 3051 | Reading | same |
| 3052 | Redbridge | same |
| 3053 | Redcar and Cleveland | same |
| 3054 | Renfrewshire | same |
| 3055 | Rhondda Cynon Taf | same |
| 3056 | Richmond upon Thames | same |
| 3057 | Rochdale | same |
| 3058 | Rotherham | same |
| 3059 | Rutland | same |
| 3060 | Salford | same |
| 3061 | Sandwell | same |
| 3062 | Scottish Borders | same |
| 3063 | Sefton | same |
| 3064 | Sheffield | same |
| 3065 | Shetland Islands | same |
| 3066 | Shropshire | same |
| 3067 | Slough | same |
| 3068 | Solihull | same |
| 3069 | Somerset | same |
| 3070 | South Ayrshire | same |
| 3071 | South Gloucestershire | same |
| 3072 | South Lanarkshire | same |
| 3073 | South Tyneside | same |
| 3074 | Southend-on-Sea | same |
| 3075 | Southwark | same |
| 3076 | St Helens | same |
| 3077 | Staffordshire | same |
| 3078 | Stirling | same |
| 3079 | Stockport | same |
| 3080 | Stockton-on-Tees | same |
| 3081 | Stoke-on-Trent | same |
| 3082 | Suffolk | same |
| 3083 | Sunderland | same |
| 3084 | Surrey | same |
| 3085 | Sutton | same |
| 3086 | Swansea | same |
| 3087 | Swindon | same |
| 3088 | Tameside | same |
| 3089 | Telford and Wrekin | same |
| 3090 | Thurrock | same |
| 3091 | Torbay | same |
| 3092 | Torfaen | same |
| 3093 | Tower Hamlets | same |
| 3094 | Trafford | same |
| 3095 | Vale of Glamorgan | same |
| 3096 | Wakefield | same |
| 3097 | Walsall | same |
| 3098 | Waltham Forest | same |
| 3099 | Wandsworth | same |
| 3100 | Warrington | same |
| 3101 | Warwickshire | same |
| 3102 | West Berkshire | same |
| 3103 | West Dunbartonshire | same |
| 3104 | West Lothian | same |
| 3105 | West Northamptonshire | same |
| 3106 | West Sussex | same |
| 3107 | Westminster | same |
| 3108 | Wigan | same |
| 3109 | Wiltshire | same |
| 3110 | Windsor and Maidenhead | same |
| 3111 | Wirral | same |
| 3112 | Wokingham | same |
| 3113 | Wolverhampton | same |
| 3114 | Worcestershire | same |
| 3115 | Wrexham | same |
| 3116 | York | same |
| 3117 | Aargau | same |
| 3118 | Appenzell Ausserrhoden | same |
| 3119 | Appenzell Innerrhoden | same |
| 3120 | Basel-Land | same |
| 3121 | Basel-Stadt | same |
| 3122 | Bern | same |
| 3123 | Fribourg | same |
| 3124 | Geneva | same |
| 3125 | Glarus | same |
| 3126 | Graubünden | same |
| 3127 | Jura | same |
| 3128 | Lucerne | same |
| 3129 | Neuchâtel | same |
| 3130 | Nidwalden | same |
| 3131 | Obwalden | same |
| 3132 | Schaffhausen | same |
| 3133 | Schwyz | same |
| 3134 | Solothurn | same |
| 3135 | St. Gallen | same |
| 3136 | Thurgau | same |
| 3137 | Ticino | same |
| 3138 | Uri | same |
| 3139 | Valais | same |
| 3140 | Vaud | same |
| 3141 | Zug | same |
| 3142 | Zürich | same |
| 3143 | A'ana | same |
| 3144 | Aiga-i-le-Tai | same |
| 3145 | Atua | same |
| 3146 | Fa'asaleleaga | same |
| 3147 | Gaga'emauga | same |
| 3148 | Gaga'ifomauga | same |
| 3149 | Palauli | same |
| 3150 | Satupa'itea | same |
| 3151 | Tuamasaga | same |
| 3152 | Va'a-o-Fonoti | same |
| 3153 | Vaisigano | same |
| 3154 | A Coruña | same |
| 3155 | Albacete | same |
| 3156 | Alicante | same |
| 3157 | Almeria | same |
| 3158 | Araba | same |
| 3159 | Asturias | same |
| 3160 | Badajoz | same |
| 3161 | Barcelona | same |
| 3162 | Bizkaia | same |
| 3163 | Burgos | same |
| 3164 | Caceres | same |
| 3165 | Cantabria | same |
| 3166 | Castellón | same |
| 3167 | Ciudad Real | same |
| 3168 | Cuenca | same |
| 3169 | Cádiz | same |
| 3170 | Córdoba (Spain) | same |
| 3171 | Gipuzkoa | same |
| 3172 | Girona | same |
| 3173 | Granada (Spain) | same |
| 3174 | Guadalajara | same |
| 3175 | Huelva | same |
| 3176 | Huesca | same |
| 3177 | Islas Baleares | same |
| 3178 | Jaén | same |
| 3179 | La Rioja (Spain) | same |
| 3180 | Las Palmas | same |
| 3181 | Lleida | same |
| 3182 | Lugo | same |
| 3183 | Léon | same |
| 3184 | Madrid | same |
| 3185 | Murcia | same |
| 3186 | Málaga | same |
| 3187 | Navarra | same |
| 3188 | Ourense | same |
| 3189 | Palencia | same |
| 3190 | Pontevedra | same |
| 3191 | Salamanca | same |
| 3192 | Santa Cruz de Tenerife | same |
| 3193 | Segovia | same |
| 3194 | Sevilla | same |
| 3195 | Soria | same |
| 3196 | Tarragona | same |
| 3197 | Teruel | same |
| 3198 | Toledo (Spain) | same |
| 3199 | Valencia | same |
| 3200 | Valladolid | same |
| 3201 | Zamora | same |
| 3202 | Zaragoza | same |
| 3203 | Ávila | same |
| 3204 | Bethlehem | same |
| 3205 | Deir El Balah | same |
| 3206 | Gaza | same |
| 3207 | Hebron | same |
| 3208 | Jenin | same |
| 3209 | Jericho and Al Aghwar | same |
| 3210 | Jerusalem | same |
| 3211 | Khan Yunis | same |
| 3212 | Nablus | same |
| 3213 | North Gaza | same |
| 3214 | Qalqilya | same |
| 3215 | Rafah | same |
| 3216 | Ramallah | same |
| 3217 | Salfit | same |
| 3218 | Tubas | same |
| 3219 | Tulkarm | same |
| 3220 | Amazonas (Venezuela) | same |
| 3221 | Anzoátegui | same |
| 3222 | Apure | same |
| 3223 | Aragua | same |
| 3224 | Barinas | same |
| 3225 | Bolívar (Venezuela) | same |
| 3226 | Carabobo | same |
| 3227 | Cojedes | same |
| 3228 | Delta Amacuro | same |
| 3229 | Distrito Capital | same |
| 3230 | Falcón | same |
| 3231 | Federal Dependencies of Venezuela | same |
| 3232 | Guárico | same |
| 3233 | La Guaira | same |
| 3234 | Lara | same |
| 3235 | Miranda | same |
| 3236 | Monagas | same |
| 3237 | Mérida | same |
| 3238 | Nueva Esparta | same |
| 3239 | Portuguesa | same |
| 3240 | Sucre (Venezuela) | same |
| 3241 | Trujillo | same |
| 3242 | Táchira | same |
| 3243 | Yaracuy | same |
| 3244 | Zulia | same |
| 3245 | Bomi County | same |
| 3246 | Bong County | same |
| 3247 | Gbarpolu County | same |
| 3248 | Grand Bassa County | same |
| 3249 | Grand Cape Mount County | same |
| 3250 | Grand Gedeh County | same |
| 3251 | Grand Kru County | same |
| 3252 | Lofa County | same |
| 3253 | Margibi County | same |
| 3254 | Maryland County | same |
| 3255 | Montserrado County | same |
| 3256 | Nimba | same |
| 3257 | River Cess County | same |
| 3258 | River Gee County | same |
| 3259 | Sinoe County | same |
| 3260 | Nord Region, Burkina Faso | same |
| 3261 | Aimeliik | same |
| 3262 | Airai | same |
| 3263 | Angaur | same |
| 3264 | Hatohobei | same |
| 3265 | Kayangel | same |
| 3266 | Koror | same |
| 3267 | Melekeok | same |
| 3268 | Ngaraard | same |
| 3269 | Ngarchelong | same |
| 3270 | Ngardmau | same |
| 3271 | Ngatpang | same |
| 3272 | Ngchesar | same |
| 3273 | Ngeremlengui | same |
| 3274 | Ngiwal | same |
| 3275 | Peleliu | same |
| 3276 | Sonsorol | same |
| 3277 | Harju | same |
| 3278 | Hiiu | same |
| 3279 | Ida-Viru | same |
| 3280 | Järva | same |
| 3281 | Jõgeva | same |
| 3282 | Lääne | same |
| 3283 | Lääne-Viru | same |
| 3284 | Pärnu | same |
| 3285 | Põlva | same |
| 3286 | Rapla | same |
| 3287 | Saare | same |
| 3288 | Tartu | same |
| 3289 | Valga | same |
| 3290 | Viljandi | same |
| 3291 | Võru | same |
| 3292 |  Chungcheongbuk-do | same |
| 3293 |  Chungcheongnam-do | same |
| 3294 |  Daegu | same |
| 3295 |  Daejeon | same |
| 3296 |  Gangwon-do | same |
| 3297 |  Gwangju | same |
| 3298 |  Gyeonggi Province | same |
| 3299 |  Gyeongsangbuk-do | same |
| 3300 |  Gyeongsangnam-do | same |
| 3301 |  Incheon | same |
| 3302 |  Jeju | same |
| 3303 |  Jeollabuk-do | same |
| 3304 |  Jeollanam-do | same |
| 3305 |  Sejong | same |
| 3306 |  Seoul | same |
| 3307 |  Ulsan | same |
| 3308 | Chungcheongbuk-do | same |
| 3309 | Chungcheongnam-do | same |
| 3310 | Daegu | same |
| 3311 | Daejeon | same |
| 3312 | Gangwon-do | same |
| 3313 | Gwangju | same |
| 3314 | Gyeonggi Province | same |
| 3315 | Gyeongsangbuk-do | same |
| 3316 | Gyeongsangnam-do | same |
| 3317 | Incheon | same |
| 3318 | Jeju | same |
| 3319 | Jeollabuk-do | same |
| 3320 | Jeollanam-do | same |
| 3321 | Sejong | same |
| 3322 | Seoul | same |
| 3323 | Ulsan | same |
| 3324 | Busan | same |
| 3325 | Burgenland | same |
| 3326 | Carinthia | same |
| 3327 | Lower Austria | same |
| 3328 | Salzburg | same |
| 3329 | Styria | same |
| 3330 | Tyrol | same |
| 3331 | Upper Austria | same |
| 3332 | Vienna | same |
| 3333 | Vorarlberg | same |
| 3334 | Cabo Delgado Province | same |
| 3335 | Gaza Province | same |
| 3336 | Inhambane Province | same |
| 3337 | Manica Province | same |
| 3338 | Maputo | same |
| 3339 | Maputo Province | same |
| 3340 | Nampula Province | same |
| 3341 | Niassa Province | same |
| 3342 | Sofala Province | same |
| 3343 | Tete Province | same |
| 3344 | Zambezia Province | same |
| 3345 | Ahuachapán Department | same |
| 3346 | Cabañas Department | same |
| 3347 | Chalatenango Department | same |
| 3348 | Cuscatlán Department | same |
| 3349 | La Libertad Department | same |
| 3350 | La Paz Department (El Salvador) | same |
| 3351 | La Unión Department | same |
| 3352 | Morazán Department | same |
| 3353 | San Miguel Department | same |
| 3354 | San Salvador Department | same |
| 3355 | San Vicente Department | same |
| 3356 | Santa Ana Department | same |
| 3357 | Sonsonate Department | same |
| 3358 | Usulután Department | same |
| 3359 | Fontvieille | same |
| 3360 | Jardin Exotique | same |
| 3361 | La Colle | same |
| 3362 | La Condamine | same |
| 3363 | La Gare | same |
| 3364 | La Source | same |
| 3365 | Larvotto | same |
| 3366 | Malbousquet | same |
| 3367 | Monaco-Ville | same |
| 3368 | Moneghetti | same |
| 3369 | Monte-Carlo | same |
| 3370 | Moulins | same |
| 3371 | Port-Hercule | same |
| 3372 | Saint-Roman | same |
| 3373 | Sainte-Dévote | same |
| 3374 | Spélugues | same |
| 3375 | Vallon de la Rousse | same |
| 3376 | Berea District | same |
| 3377 | Butha-Buthe District | same |
| 3378 | Leribe District | same |
| 3379 | Mafeteng District | same |
| 3380 | Maseru District | same |
| 3381 | Mohale's Hoek District | same |
| 3382 | Mokhotlong District | same |
| 3383 | Qacha's Nek District | same |
| 3384 | Quthing District | same |
| 3385 | Thaba-Tseka District | same |
| 3386 | Haʻapai | same |
| 3387 | Niuas | same |
| 3388 | Tongatapu | same |
| 3389 | Vavaʻu | same |
| 3390 | ʻEua | same |
| 3391 | Central Equatoria | same |
| 3392 | Eastern Equatoria | same |
| 3393 | Jonglei State | same |
| 3394 | Lakes | same |
| 3395 | Northern Bahr el Ghazal | same |
| 3396 | Unity | same |
| 3397 | Upper Nile | same |
| 3398 | Warrap | same |
| 3399 | Western Bahr el Ghazal | same |
| 3400 | Western Equatoria | same |
| 3401 | Baranya | same |
| 3402 | Borsod-Abaúj-Zemplén | same |
| 3403 | Budapest | same |
| 3404 | Bács-Kiskun | same |
| 3405 | Békés | same |
| 3406 | Csongrád-Csanád | same |
| 3407 | Fejér | same |
| 3408 | Győr-Moson-Sopron | same |
| 3409 | Hajdú-Bihar | same |
| 3410 | Heves | same |
| 3411 | Jász-Nagykun-Szolnok | same |
| 3412 | Komárom-Esztergom | same |
| 3413 | Nógrád | same |
| 3414 | Pest | same |
| 3415 | Somogy | same |
| 3416 | Szabolcs-Szatmár-Bereg | same |
| 3417 | Tolna | same |
| 3418 | Vas | same |
| 3419 | Veszprém | same |
| 3420 | Zala | same |
| 3421 | Aichi | same |
| 3422 | Akita | same |
| 3423 | Aomori | same |
| 3424 | Chiba | same |
| 3425 | Ehime | same |
| 3426 | Fukui | same |
| 3427 | Fukuoka | same |
| 3428 | Fukushima | same |
| 3429 | Gifu | same |
| 3430 | Gunma | same |
| 3431 | Hiroshima | same |
| 3432 | Hokkaidō | same |
| 3433 | Hyōgo | same |
| 3434 | Ibaraki | same |
| 3435 | Ishikawa | same |
| 3436 | Iwate | same |
| 3437 | Kagawa | same |
| 3438 | Kagoshima | same |
| 3439 | Kanagawa | same |
| 3440 | Kumamoto | same |
| 3441 | Kyōto | same |
| 3442 | Kōchi | same |
| 3443 | Mie | same |
| 3444 | Miyagi | same |
| 3445 | Miyazaki | same |
| 3446 | Nagano | same |
| 3447 | Nagasaki | same |
| 3448 | Nara | same |
| 3449 | Niigata | same |
| 3450 | Okayama | same |
| 3451 | Okinawa | same |
| 3452 | Saga | same |
| 3453 | Saitama | same |
| 3454 | Shiga | same |
| 3455 | Shimane | same |
| 3456 | Shizuoka | same |
| 3457 | Tochigi | same |
| 3458 | Tokushima | same |
| 3459 | Tokyo | same |
| 3460 | Tottori | same |
| 3461 | Toyama | same |
| 3462 | Wakayama | same |
| 3463 | Yamagata | same |
| 3464 | Yamaguchi | same |
| 3465 | Yamanashi | same |
| 3466 | Ōita | same |
| 3467 | Ōsaka | same |
| 3468 | Brest | same |
| 3469 | Gomel | same |
| 3470 | Grodno | same |
| 3471 | Minsk City | same |
| 3472 | Mogilev | same |
| 3473 | Vitebsk | same |
| 3474 | Agalega Islands | same |
| 3475 | Black River | same |
| 3476 | Flacq | same |
| 3477 | Grand Port | same |
| 3478 | Moka | same |
| 3479 | Pamplemousses | same |
| 3480 | Plaines Wilhems | same |
| 3481 | Port Louis | same |
| 3482 | Rivière du Rempart | same |
| 3483 | Rodrigues Island | same |
| 3484 | Saint Brandon Islands | same |
| 3485 | Savanne | same |
| 3486 | Berat | same |
| 3487 | Dibër | same |
| 3488 | Durrës | same |
| 3489 | Elbasan | same |
| 3490 | Fier | same |
| 3491 | Gjirokastër | same |
| 3492 | Korçë | same |
| 3493 | Kukës | same |
| 3494 | Lezhë | same |
| 3495 | Shkodër | same |
| 3496 | Tiranë (Tirana) | same |
| 3497 | Vlorë | same |
| 3498 | Auckland | same |
| 3499 | Bay of Plenty | same |
| 3500 | Canterbury | same |
| 3501 | Chatham Islands | same |
| 3502 | Gisborne | same |
| 3503 | Hawke's Bay | same |
| 3504 | Manawatu-Wanganui | same |
| 3505 | Marlborough | same |
| 3506 | Nelson | same |
| 3507 | Northland | same |
| 3508 | Otago | same |
| 3509 | Southland | same |
| 3510 | Taranaki | same |
| 3511 | Tasman | same |
| 3512 | Waikato | same |
| 3513 | Wellington | same |
| 3514 | West Coast | same |
| 3515 | Dakar | same |
| 3516 | Diourbel Region | same |
| 3517 | Fatick | same |
| 3518 | Kaffrine | same |
| 3519 | Kaolack | same |
| 3520 | Kolda | same |
| 3521 | Kédougou | same |
| 3522 | Louga | same |
| 3523 | Matam | same |
| 3524 | Saint-Louis | same |
| 3525 | Sédhiou | same |
| 3526 | Tambacounda Region | same |
| 3527 | Thiès Region | same |
| 3528 | Ziguinchor | same |
| 3529 | Abidjan | same |
| 3530 | Bas-Sassandra | same |
| 3531 | Comoé | same |
| 3532 | Denguélé | same |
| 3533 | Gôh-Djiboua | same |
| 3534 | Lacs | same |
| 3535 | Lagunes | same |
| 3536 | Montagnes | same |
| 3537 | Sassandra-Marahoué | same |
| 3538 | Savanes | same |
| 3539 | Vallée du Bandama | same |
| 3540 | Woroba | same |
| 3541 | Yamoussoukro | same |
| 3542 | Zanzan | same |
| 3543 | Addis Ababa | same |
| 3544 | Afar Region | same |
| 3545 | Amhara Region | same |
| 3546 | Benishangul-Gumuz Region | same |
| 3547 | Dire Dawa | same |
| 3548 | Gambela Region | same |
| 3549 | Harari Region | same |
| 3550 | Oromia Region | same |
| 3551 | Somali Region | same |
| 3552 | Southern Nations, Nationalities, and Peoples' Region | same |
| 3553 | Tigray Region | same |
| 3554 | Alexandria | same |
| 3555 | Aswan | same |
| 3556 | Asyut | same |
| 3557 | Beheira | same |
| 3558 | Beni Suef | same |
| 3559 | Cairo | same |
| 3560 | Dakahlia | same |
| 3561 | Damietta | same |
| 3562 | Faiyum | same |
| 3563 | Gharbia | same |
| 3564 | Giza | same |
| 3565 | Ismailia | same |
| 3566 | Kafr el-Sheikh | same |
| 3567 | Luxor | same |
| 3568 | Matrouh | same |
| 3569 | Minya | same |
| 3570 | Monufia | same |
| 3571 | New Valley | same |
| 3572 | North Sinai | same |
| 3573 | Port Said | same |
| 3574 | Qalyubia | same |
| 3575 | Qena | same |
| 3576 | Red Sea (Egypt) | same |
| 3577 | Sharqia | same |
| 3578 | Sohag | same |
| 3579 | South Sinai | same |
| 3580 | Suez | same |
| 3581 | Eastern Province (Sierra Leone) | same |
| 3582 | Northern Province (Sierra Leone) | same |
| 3583 | Southern Province (Sierra Leone) | same |
| 3584 | Western Area | same |
| 3585 | Chuquisaca | same |
| 3586 | Cochabamba | same |
| 3587 | El Beni | same |
| 3588 | La Paz | same |
| 3589 | Oruro | same |
| 3590 | Pando | same |
| 3591 | Potosí | same |
| 3592 | Santa Cruz (Bolivia) | same |
| 3593 | Tarija | same |
| 3594 | Attard | same |
| 3595 | Balzan | same |
| 3596 | Birgu | same |
| 3597 | Birkirkara | same |
| 3598 | Birżebbuġa | same |
| 3599 | Cospicua | same |
| 3600 | Dingli | same |
| 3601 | Fgura | same |
| 3602 | Floriana | same |
| 3603 | Fontana | same |
| 3604 | Gudja | same |
| 3605 | Għajnsielem | same |
| 3606 | Għarb | same |
| 3607 | Għargħur | same |
| 3608 | Għasri | same |
| 3609 | Għaxaq | same |
| 3610 | Gżira | same |
| 3611 | Iklin | same |
| 3612 | Kalkara | same |
| 3613 | Kerċem | same |
| 3614 | Kirkop | same |
| 3615 | Lija | same |
| 3616 | Luqa | same |
| 3617 | Marsa | same |
| 3618 | Marsaskala | same |
| 3619 | Marsaxlokk | same |
| 3620 | Mdina | same |
| 3621 | Mellieħa | same |
| 3622 | Mosta | same |
| 3623 | Mqabba | same |
| 3624 | Msida | same |
| 3625 | Mtarfa | same |
| 3626 | Munxar | same |
| 3627 | Mġarr | same |
| 3628 | Nadur | same |
| 3629 | Naxxar | same |
| 3630 | Paola | same |
| 3631 | Pembroke | same |
| 3632 | Pietà | same |
| 3633 | Qala | same |
| 3634 | Qormi | same |
| 3635 | Qrendi | same |
| 3636 | Rabat | same |
| 3637 | Saint Lawrence | same |
| 3638 | San Ġwann | same |
| 3639 | Sannat | same |
| 3640 | Santa Luċija | same |
| 3641 | Santa Venera | same |
| 3642 | Senglea | same |
| 3643 | Siġġiewi | same |
| 3644 | Sliema | same |
| 3645 | St. Julian's | same |
| 3646 | St. Paul's Bay | same |
| 3647 | Swieqi | same |
| 3648 | Ta' Xbiex | same |
| 3649 | Tarxien | same |
| 3650 | Valletta | same |
| 3651 | Victoria (Malta) | same |
| 3652 | Xagħra | same |
| 3653 | Xewkija | same |
| 3654 | Xgħajra | same |
| 3655 | Ħamrun | same |
| 3656 | Żabbar | same |
| 3657 | Żebbuġ Gozo | same |
| 3658 | Żebbuġ Malta | same |
| 3659 | Żejtun | same |
| 3660 | Żurrieq | same |
| 3661 | 'Asir | same |
| 3662 | Al Bahah | same |
| 3663 | Al Jawf (Saudi Arabia) | same |
| 3664 | Al Madinah | same |
| 3665 | Al-Qassim | same |
| 3666 | Eastern Province (Saudi Arabia) | same |
| 3667 | Ha'il | same |
| 3668 | Jizan | same |
| 3669 | Makkah | same |
| 3670 | Najran | same |
| 3671 | Northern Borders | same |
| 3672 | Riyadh | same |
| 3673 | Tabuk | same |
| 3674 | Barlavento Islands | same |
| 3675 | Boa Vista | same |
| 3676 | Brava | same |
| 3677 | Maio Municipality | same |
| 3678 | Mosteiros | same |
| 3679 | Paul | same |
| 3680 | Porto Novo | same |
| 3681 | Praia | same |
| 3682 | Ribeira Brava Municipality | same |
| 3683 | Ribeira Grande | same |
| 3684 | Ribeira Grande de Santiago | same |
| 3685 | Sal | same |
| 3686 | Santa Catarina (Cape Verde) | same |
| 3687 | Santa Catarina do Fogo | same |
| 3688 | Santa Cruz (Cape Verde) | same |
| 3689 | Sotavento Islands | same |
| 3690 | São Domingos | same |
| 3691 | São Filipe | same |
| 3692 | São Lourenço dos Órgãos | same |
| 3693 | São Miguel | same |
| 3694 | São Vicente | same |
| 3695 | Tarrafal | same |
| 3696 | Tarrafal de São Nicolau | same |
| 3697 | Balochistan | same |
| 3698 | Khyber Pakhtunkhwa | same |
| 3699 | Punjab (Pakistan) | same |
| 3700 | Sindh | same |
| 3701 | Peć District | same |
| 3702 | Pristina (Priştine) | same |
| 3703 | Uroševac District (Ferizaj) | same |
| 3704 | Đakovica District (Gjakove) | same |
| 3705 | Banjul | same |
| 3706 | Central River Division | same |
| 3707 | Lower River Division | same |
| 3708 | North Bank Division | same |
| 3709 | Upper River Division | same |
| 3710 | West Coast Division | same |
| 3711 | Carlow | same |
| 3712 | Cavan | same |
| 3713 | Clare | same |
| 3714 | Cork | same |
| 3715 | Donegal | same |
| 3716 | Dublin | same |
| 3717 | Galway | same |
| 3718 | Kerry | same |
| 3719 | Kildare | same |
| 3720 | Kilkenny | same |
| 3721 | Laois | same |
| 3722 | Limerick | same |
| 3723 | Longford | same |
| 3724 | Louth | same |
| 3725 | Mayo | same |
| 3726 | Meath | same |
| 3727 | Monaghan | same |
| 3728 | Offaly | same |
| 3729 | Roscommon | same |
| 3730 | Sligo | same |
| 3731 | Tipperary | same |
| 3732 | Waterford | same |
| 3733 | Westmeath | same |
| 3734 | Wexford | same |
| 3735 | Wicklow | same |
| 3736 | Al Daayen | same |
| 3737 | Al Khor | same |
| 3738 | Al Rayyan | same |
| 3739 | Al Rayyan Municipality | same |
| 3740 | Al Wakrah | same |
| 3741 | Al-Shahaniya | same |
| 3742 | Doha | same |
| 3743 | Madinat ash Shamal | same |
| 3744 | Umm Salal | same |
| 3745 | Umm Salal Municipality | same |
| 3746 | Banská Bystrica | same |
| 3747 | Bratislava | same |
| 3748 | Košice | same |
| 3749 | Nitra | same |
| 3750 | Prešov | same |
| 3751 | Trenčín | same |
| 3752 | Trnava | same |
| 3753 | Žilina | same |
| 3754 | Auvergne-Rhône-Alpes | same |
| 3755 | Bourgogne-Franche-Comté | same |
| 3756 | Brittany | same |
| 3757 | Centre-Val de Loire | same |
| 3758 | Corsica | same |
| 3759 | Grand Est | same |
| 3760 | Hauts-de-France | same |
| 3761 | Normandie | same |
| 3762 | Nouvelle-Aquitaine | same |
| 3763 | Occitanie | same |
| 3764 | Pays de la Loire | same |
| 3765 | Provence-Alpes-Côte d'Azur | same |
| 3766 | Île-de-France | same |
| 3767 | Alytaus | same |
| 3768 | Kauno | same |
| 3769 | Klaipėdos | same |
| 3770 | Marijampolės | same |
| 3771 | Panevėžio | same |
| 3772 | Tauragės | same |
| 3773 | Telšių | same |
| 3774 | Utenos | same |
| 3775 | Vilniaus | same |
| 3776 | Šiaulių | same |
| 3777 | Bor District | same |
| 3778 | Braničevo District | same |
| 3779 | Central Banat District | same |
| 3780 | Jablanica District | same |
| 3781 | Kolubara District | same |
| 3782 | Mačva District | same |
| 3783 | Moravica District | same |
| 3784 | Nišava District | same |
| 3785 | North Banat District | same |
| 3786 | North Bačka District | same |
| 3787 | Pirot District | same |
| 3788 | Podunavlje District | same |
| 3789 | Pomoravlje District | same |
| 3790 | Pčinja District | same |
| 3791 | Rasina District | same |
| 3792 | Raška District | same |
| 3793 | South Banat District | same |
| 3794 | South Bačka District | same |
| 3795 | Srem District | same |
| 3796 | Toplica District | same |
| 3797 | West Bačka District | same |
| 3798 | Zaječar District | same |
| 3799 | Zlatibor District | same |
| 3800 | Šumadija District | same |
| 3801 | Brčko District | same |
| 3802 | Federation of Bosnia and Herzegovina | same |
| 3803 | Republika Srpska | same |
| 3804 | Agadez Region | same |
| 3805 | Diffa Region | same |
| 3806 | Dosso Region | same |
| 3807 | Maradi Region | same |
| 3808 | Tahoua Region | same |
| 3809 | Tillabéri Region | same |
| 3810 | Zinder Region | same |
| 3811 | Eastern Province (Rwanda) | same |
| 3812 | Kigali district | same |
| 3813 | Northern Province (Rwanda) | same |
| 3814 | Southern Province (Rwanda) | same |
| 3815 | Western Province (Rwanda) | same |
| 3816 | Barishal | same |
| 3817 | Chattogram | same |
| 3818 | Dhaka | same |
| 3819 | Khulna | same |
| 3820 | Mymensingh | same |
| 3821 | Rajshahi | same |
| 3822 | Rangpur | same |
| 3823 | Sylhet | same |
| 3824 | Christ Church | same |
| 3825 | Saint Andrew (Barbados) | same |
| 3826 | Saint George (Barbados) | same |
| 3827 | Saint James | same |
| 3828 | Saint John (Barbados) | same |
| 3829 | Saint Joseph | same |
| 3830 | Saint Lucy | same |
| 3831 | Saint Michael | same |
| 3832 | Saint Peter | same |
| 3833 | Saint Philip | same |
| 3834 | Saint Thomas | same |
| 3835 | Boaco | same |
| 3836 | Carazo | same |
| 3837 | Chinandega | same |
| 3838 | Chontales | same |
| 3839 | Estelí | same |
| 3840 | Granada (Nicaragua) | same |
| 3841 | Jinotega | same |
| 3842 | León | same |
| 3843 | Madriz | same |
| 3844 | Managua | same |
| 3845 | Masaya | same |
| 3846 | Matagalpa | same |
| 3847 | North Caribbean Coast | same |
| 3848 | Nueva Segovia | same |
| 3849 | Rivas | same |
| 3850 | Río San Juan | same |
| 3851 | South Caribbean Coast | same |
| 3852 | Agder | same |
| 3853 | Innlandet | same |
| 3854 | Møre og Romsdal | same |
| 3855 | Nordland | same |
| 3856 | Oslo | same |
| 3857 | Rogaland | same |
| 3858 | Troms og Finnmark | same |
| 3859 | Trøndelag | same |
| 3860 | Vestfold og Telemark | same |
| 3861 | Vestland | same |
| 3862 | Viken | same |
| 3863 | Central District (Botswana) | same |
| 3864 | Ghanzi District | same |
| 3865 | Kgalagadi District | same |
| 3866 | Kgatleng District | same |
| 3867 | Kweneng District | same |
| 3868 | North-East District | same |
| 3869 | North-West District | same |
| 3870 | South-East District | same |
| 3871 | Southern District (Botswana) | same |
| 3872 | Azua | same |
| 3873 | Bahoruco | same |
| 3874 | Barahona | same |
| 3875 | Dajabón | same |
| 3876 | Distrito Nacional | same |
| 3877 | Duarte | same |
| 3878 | El Seibo | same |
| 3879 | Elías Piña | same |
| 3880 | Espaillat | same |
| 3881 | Hato Mayor | same |
| 3882 | Hermanas Mirabal | same |
| 3883 | Independencia | same |
| 3884 | La Altagracia | same |
| 3885 | La Romana | same |
| 3886 | La Vega | same |
| 3887 | María Trinidad Sánchez | same |
| 3888 | Monseñor Nouel | same |
| 3889 | Monte Cristi | same |
| 3890 | Monte Plata | same |
| 3891 | Pedernales | same |
| 3892 | Peravia | same |
| 3893 | Puerto Plata | same |
| 3894 | Samaná | same |
| 3895 | San Cristóbal | same |
| 3896 | San José de Ocoa | same |
| 3897 | San Juan (Dominican Republic) | same |
| 3898 | San Pedro de Macorís | same |
| 3899 | Santiago | same |
| 3900 | Santiago Rodríguez | same |
| 3901 | Santo Domingo | same |
| 3902 | Sánchez Ramírez | same |
| 3903 | Valverde | same |
| 3904 | Hovedstaden | same |
| 3905 | Midtjylland | same |
| 3906 | Nordjylland | same |
| 3907 | Sjælland | same |
| 3908 | Syddanmark | same |
| 3909 | Aguascalientes | same |
| 3910 | Baja California | same |
| 3911 | Baja California Sur | same |
| 3912 | Campeche | same |
| 3913 | Chiapas | same |
| 3914 | Chihuahua | same |
| 3915 | Ciudad de México | same |
| 3916 | Coahuila de Zaragoza | same |
| 3917 | Colima | same |
| 3918 | Durango | same |
| 3919 | Estado de México | same |
| 3920 | Guanajuato | same |
| 3921 | Guerrero | same |
| 3922 | Hidalgo | same |
| 3923 | Jalisco | same |
| 3924 | Michoacán de Ocampo | same |
| 3925 | Morelos | same |
| 3926 | Nayarit | same |
| 3927 | Nuevo León | same |
| 3928 | Oaxaca | same |
| 3929 | Puebla | same |
| 3930 | Querétaro | same |
| 3931 | Quintana Roo | same |
| 3932 | San Luis Potosí | same |
| 3933 | Sinaloa | same |
| 3934 | Sonora | same |
| 3935 | Tabasco | same |
| 3936 | Tamaulipas | same |
| 3937 | Tlaxcala | same |
| 3938 | Veracruz de Ignacio de la Llave | same |
| 3939 | Yucatán | same |
| 3940 | Zacatecas | same |
| 3941 | Chuuk State | same |
| 3942 | Kosrae State | same |
| 3943 | Pohnpei State | same |
| 3944 | Yap State | same |
| 3945 | Brokopondo District | same |
| 3946 | Commewijne District | same |
| 3947 | Coronie District | same |
| 3948 | Marowijne District | same |
| 3949 | Nickerie District | same |
| 3950 | Para District | same |
| 3951 | Paramaribo District | same |
| 3952 | Saramacca District | same |
| 3953 | Sipaliwini District | same |
| 3954 | Wanica District | same |



</details>


## Lookups and relations

| Field | Type | Target module | Module key | Exported relation |
| --- | --- | --- | --- | --- |
| Contact Owner | ownerlookup | Users (owner lookup) | M2 | no lookup target in export |
| Account Name | lookup | Accounts | M3 | Contacts |
| Vendor Name | lookup | Vendors | P2 | Contacts |
| Created By | ownerlookup | Users (owner lookup) | M2 | no lookup target in export |
| Modified By | ownerlookup | Users (owner lookup) | M2 | no lookup target in export |
| Reporting To | lookup | Contacts | M2 | Reporting_Contacts |
| Connected To | multi_module_lookup | Leads | M1 | dynamic module addition allowed |


Connected To lists Leads as the exported target and allows dynamic module addition. Do not infer additional target modules. Account Name and Vendor Name report Contacts as their reverse relation; Reporting To reports Reporting_Contacts. Target selection, lookup filtering and relation UI were not opened.


## Views

Ten system-defined public views; no custom views in this export. All have `sort_by=null`, `sort_order=null`, `wrap_text=true`, `locked=false`, `favorite=null`. Null sorting is unknown, not evidence of alphabetical or creation-time order. None of the view choices was opened or selected.


| View | Default | Criteria | Column order (API names) |
| --- | --- | --- | --- |
| All Contacts | yes | null (no exported criterion) | Full_Name, Account_Name, Email, Phone, Owner |
| All Locked Contacts | no | Locked__s equal True | Full_Name, Account_Name, Email, Phone, Owner |
| Mailing Labels | no | null (no exported criterion) | Salutation, Full_Name, Old_Mailing_Street, Old_Mailing_City, Old_Mailing_State, Old_Mailing_Country, Old_Mailing_Zip, Mailing_Address, Mailing_Coordinates, Mailing_Flat_House_No_Building_Apartment_Name, Mailing_Street, Mailing_City, Mailing_State, Mailing_Zip, Mailing_Country, Mailing_Latitude, Mailing_Longitude |
| My Contacts | no | Owner equal ${CURRENTUSER} | Full_Name, Account_Name, Email, Phone |
| New Last Week | no | Created_Time equal ${LASTWEEK} | Full_Name, Account_Name, Email, Phone, Owner |
| New This Week | no | Created_Time equal ${THISWEEK} | Full_Name, Account_Name, Email, Phone, Owner |
| Recently Created Contacts | no | (Common_Status contains c) AND (Created_Time less_equal ${AGEINDAYS}+31) | Full_Name, Account_Name, Email, Phone, Owner |
| Recently Modified Contacts | no | (Common_Status contains m) AND (Modified_Time less_equal ${AGEINDAYS}+31) | Full_Name, Account_Name, Email, Phone, Owner |
| Unread Contacts | no | Common_Status not_contains v | Full_Name, Account_Name, Email, Phone, Owner |
| Unsubscribed Contacts | no | Email_Opt_Out equal True | Full_Name, Account_Name, Email, Owner, Created_Time, Unsubscribed_Mode, Unsubscribed_Time |


Mailing Labels contains seven legacy address column references (Old_Mailing_*), which are not fields in the 61-field dictionary. Common_Status appears only in view criteria. Preserve these as unresolved exported references; do not invent field definitions.


## Related lists

Source: related_lists.json; 31 configured entries, 5 hidden. This is configuration inventory, not observed record-detail behaviour.

| Order | Label | API name | Target module | Module key | Visible | Type | Enabled operations |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Connected Records | Connected_Records__s | — | ? | yes | combined_view | none |
| 1 | Review Process-Review Summary | Review_Processes | Review_Processes | P3 | no | default | none |
| 10 | Open Tasks | Tasks | Tasks | M5 | yes | default | edit, create |
| 13 | Closed Tasks | Tasks_History | Tasks | M5 | yes | default | edit, create |
| 14 | Closed Meetings | Events_History | Events | M5 | yes | default | edit, create |
| 15 | Closed Calls | Calls_History | Calls | M5 | yes | default | edit, create |
| 16 | Invited Meetings | Invited_Events | Events | M5 | yes | default | edit, delete |
| 17 | Email Sentiment | Email_Sentiment | Email_Sentiment | P3 | no | default | none |
| 17 | Products | Products | Products | P2 | yes | default | disassociate |
| 18 | Cases | Cases | Cases | M8 | yes | default | edit, create, bulk_edit, delete, assign, disassociate |
| 19 | Quotes | Quotes | Quotes | P2 | yes | default | edit, create, bulk_edit, delete, assign, disassociate |
| 2 | Notes | Notes | Notes | M6 | yes | default | none |
| 2 | Review Process-Field History | Review_Logs | Review_Logs | P3 | no | default | none |
| 2 | WebformUsage | WebformUsage | WebformUsage | ? | no | default | none |
| 20 | Sales Orders | SalesOrders | Sales_Orders | P2 | yes | default | edit, create, bulk_edit, delete, assign, disassociate |
| 21 | Purchase Orders | PurchaseOrders | Purchase_Orders | P2 | yes | default | edit, create, bulk_edit, delete, assign, disassociate |
| 22 | Emails | Emails | Emails | M10 | yes | default | create, delete |
| 23 | Invoices | Invoices | Invoices | P2 | yes | default | edit, create, bulk_edit, delete, assign, disassociate |
| 24 | Campaigns | Campaigns | Campaigns | M7 | yes | default | edit, disassociate |
| 25 | Social | Social | Social | M15 | yes | default | none |
| 26 | Reporting Contacts | Reporting_Contacts | Contacts | M2 | yes | default | edit, create, delete |
| 27 | Checklists | CheckLists | CheckLists | ? | yes | default | none |
| 28 | Locking Information | Locking_Information__s | Locking_Information__s | M11 | yes | default | none |
| 3 | Attachments | Attachments | Attachments | M6 | yes | default | none |
| 4 | Cadences | Entity_Cadences_contacts | Entity_Cadences__s | P3 | yes | default | none |
| 5 | Deals | Deals | Deals | M4 | yes | default | edit, create, delete |
| 74 | Connected Record Child1 | Connected_Record_Child1 | Leads | ? | yes | default | create |
| 75 | Voice of the Customer | Voice_of_the_Customer__s | — | ? | yes | default | none |
| 76 | Email Drafts | Email_Drafts__s | Email_Drafts__s | M10 | no | default | none |
| 8 | Open Calls | Calls | Calls | M5 | yes | default | edit, create |
| 9 | Open Meetings | Events | Events | M5 | yes | default | edit, create |



## Field permissions by profile

Source: per-field profiles in fields.json, cross-checked against the two profile names in profiles.json. Both profiles have identical field permission assignments. A read_write profile flag does not override system/form read-only flags.

| Field | API name | Administrator | Standard |
| --- | --- | --- | --- |
| Mailing Address - Latitude | Mailing_Latitude | read_write | read_write |
| Mailing Address - Longitude | Mailing_Longitude | read_write | read_write |
| Other Address - Latitude | Other_Latitude | read_write | read_write |
| Other Address - Longitude | Other_Longitude | read_write | read_write |
| Contact Owner | Owner | read_write | read_write |
| Lead Source | Lead_Source | read_write | read_write |
| First Name | First_Name | read_write | read_write |
| Last Name | Last_Name | read_write | read_write |
| Account Name | Account_Name | read_write | read_write |
| Vendor Name | Vendor_Name | read_write | read_write |
| Email | Email | read_write | read_write |
| Title | Title | read_write | read_write |
| Department | Department | read_write | read_write |
| Phone | Phone | read_write | read_write |
| Home Phone | Home_Phone | read_write | read_write |
| Other Phone | Other_Phone | read_write | read_write |
| Fax | Fax | read_write | read_write |
| Mobile | Mobile | read_write | read_write |
| Date of Birth | Date_of_Birth | read_write | read_write |
| Assistant | Assistant | read_write | read_write |
| Asst Phone | Asst_Phone | read_write | read_write |
| Created By | Created_By | read_write | read_write |
| Modified By | Modified_By | read_write | read_write |
| Created Time | Created_Time | read_write | read_write |
| Modified Time | Modified_Time | read_write | read_write |
| Full Name | Full_Name | read_write | read_write |
| Description | Description | read_write | read_write |
| Email Opt Out | Email_Opt_Out | read_write | read_write |
| Skype ID | Skype_ID | read_write | read_write |
| Salutation | Salutation | read_write | read_write |
| Secondary Email | Secondary_Email | read_write | read_write |
| Last Activity Time | Last_Activity_Time | read_write | read_write |
| Twitter | Twitter | read_write | read_write |
| Tag | Tag | read_write | read_write |
| Contact Image | Record_Image | read_write | read_write |
| Reporting To | Reporting_To | read_write | read_write |
| Unsubscribed Mode | Unsubscribed_Mode | read_only | read_only |
| Unsubscribed Time | Unsubscribed_Time | read_only | read_only |
| Record Id | id | read_only | read_only |
| Change Log Time | Change_Log_Time__s | read_only | read_only |
| Locked | Locked__s | read_only | read_only |
| Last Enriched Time | Last_Enriched_Time__s | read_only | read_only |
| Enrich Status | Enrich_Status__s | read_only | read_only |
| Mailing Address | Mailing_Address | read_write | read_write |
| Mailing Address - Country / Region | Mailing_Country | read_write | read_write |
| Mailing Address - Flat / House No./ Building / Apartment Name | Mailing_Flat_House_No_Building_Apartment_Name | read_write | read_write |
| Mailing Address - Street Address | Mailing_Street | read_write | read_write |
| Mailing Address - City | Mailing_City | read_write | read_write |
| Mailing Address - State / Province | Mailing_State | read_write | read_write |
| Mailing Address - Zip / Postal Code | Mailing_Zip | read_write | read_write |
| Mailing Address - Coordinates | Mailing_Coordinates | read_write | read_write |
| Other Address | Other_Address | read_write | read_write |
| Other Address - Country / Region | Other_Country | read_write | read_write |
| Other Address - Flat / House No./ Building / Apartment Name | Other_Flat_House_No_Building_Apartment_Name | read_write | read_write |
| Other Address - Street Address | Other_Street | read_write | read_write |
| Other Address - City | Other_City | read_write | read_write |
| Other Address - State / Province | Other_State | read_write | read_write |
| Other Address - Zip / Postal Code | Other_Zip | read_write | read_write |
| Other Address - Coordinates | Other_Coordinates | read_write | read_write |
| Distance | nearby_distance__s | read_only | read_only |
| Connected To | Connected_To__s | read_write | read_write |



## Differences from Leads list

The title and selected module are Contacts; the current default view tab is All Contacts. The toolbar uses Create Contact. The first text columns are Contact Name, Account Name, Email and a clipped Phone; Contact Owner is exported but outside the visible table width. The first text header contains an All selector. The already-open field filter begins Account Name, Assistant, Asst Phone, Connected To and Contact Name, with Contact Owner partially visible. System filters include Campaigns and Latest Email Status. Call-activity flags and three row controls are visible in the base capture. Contacts has Account Name / Reporting To / Vendor Name relations and two address composites; Leads conversion fields and Lead Status are absent.

Actions menu contents, the adjacent create dropdown, available view choices, operator choices, sort popup, empty state and selected-record toolbar are not observed. Do not import Leads menu labels as observed Contacts controls.


## Capability table

| Capability | Inventory numbers | Module | Evidence / boundary |
| --- | --- | --- | --- |
| Product selector | SH-01 | ? | visible only; behaviour not observed |
| Hide Menu | SH-02 | M1 | visible only; behaviour not observed |
| Home | SH-03 | M14 | visible only; behaviour not observed |
| Workqueue | SH-04 | M14 | visible only; behaviour not observed |
| Reports | SH-05 | M13 | visible only; behaviour not observed |
| Analytics | SH-06 | M13 | visible only; behaviour not observed |
| Agents | SH-07 | P3 | visible only; behaviour not observed |
| MCP Server | SH-08 | P3 | visible only; behaviour not observed |
| Teamspace selector | SH-09 | M11 | visible only; behaviour not observed |
| More Actions | SH-10 | M11 | visible only; behaviour not observed |
| Search | SH-11 | M1 | visible only; behaviour not observed |
| Sales | SH-12 | M1 | visible only; behaviour not observed |
| Leads | SH-13 | M1 | visible only; behaviour not observed |
| Contacts | SH-14 | M2 | visible only; behaviour not observed |
| Accounts | SH-15 | M3 | visible only; behaviour not observed |
| Deals | SH-16 | M4 | visible only; behaviour not observed |
| Documents | SH-17 | M9 | visible only; behaviour not observed |
| Campaigns | SH-18 | M7 | visible only; behaviour not observed |
| Activities | SH-19 | M5 | visible only; behaviour not observed |
| Tasks | SH-20 | M5 | visible only; behaviour not observed |
| Meetings | SH-21 | M5 | visible only; behaviour not observed |
| Calls | SH-22 | M5 | visible only; behaviour not observed |
| Integrations | SH-23 | M15 | visible only; behaviour not observed |
| Visits | SH-24 | M15 | visible only; behaviour not observed |
| Price Books | SH-25 | P2 | visible only; behaviour not observed |
| Search records | SH-26 | ? | visible only; behaviour not observed |
| Plus icon | SH-27 | M1 | visible only; behaviour not observed |
| Assistant shortcut | SH-28 | P3 | visible only; behaviour not observed |
| Notifications | SH-29 | ? | visible only; behaviour not observed |
| Calendar | SH-30 | M10 | visible only; behaviour not observed |
| Marketplace | SH-31 | ? | visible only; behaviour not observed |
| Setup | SH-32 | M11 | visible only; behaviour not observed |
| Profile | SH-33 | ? | visible only; behaviour not observed |
| Applications menu | SH-34 | ? | visible only; behaviour not observed |
| My Pins | SH-35 | ? | visible only; behaviour not observed |
| Chats | SH-36 | ? | visible only; behaviour not observed |
| Contacts | SH-37 | ? | visible only; behaviour not observed |
| Document with small clock icon | SH-38 | ? | visible only; behaviour not observed |
| Announcements | SH-39 | ? | visible only; behaviour not observed |
| Chart with notification dot icon | SH-40 | ? | visible only; behaviour not observed |
| Square with corner arrow icon | SH-41 | ? | visible only; behaviour not observed |
| Activity Reminders | SH-42 | M5 | visible only; behaviour not observed |
| Recent Items | SH-43 | M1 | visible only; behaviour not observed |
| Accessibility | SH-44 | ? | visible only; behaviour not observed |
| Help | SH-45 | ? | visible only; behaviour not observed |
| Trash bin icon | SH-46 | ? | visible only; behaviour not observed |
| All Contacts | L-01 | M2 | visible only; behaviour not observed |
| Three dots icon | L-02 | M2 | visible only; behaviour not observed |
| Filter | L-03 | M2 | visible only; behaviour not observed |
| Sort | L-04 | M2 | visible only; behaviour not observed |
| List view icon | L-05 | M2 | visible only; behaviour not observed |
| Kanban view icon | L-06 | M2 | visible only; behaviour not observed |
| Sheet view icon | L-07 | M2 | visible only; behaviour not observed |
| Chart view icon | L-08 | M2 | visible only; behaviour not observed |
| Timeline view icon | L-09 | M2 | visible only; behaviour not observed |
| Split view icon | L-10 | M2 | visible only; behaviour not observed |
| Down chevron | L-11 | M2 | visible only; behaviour not observed |
| Create Contact | L-12 | M2 | visible only; behaviour not observed |
| Down arrow / More | L-13 | M6 | visible only; behaviour not observed |
| Three dots / Actions | L-14 | M2 | visible only; behaviour not observed |
| Search | L-15 | M2 | visible only; behaviour not observed |
| System Defined Filters | L-16 | M2 | visible only; behaviour not observed |
| Activities | L-17 | M5 | visible only; behaviour not observed |
| Campaigns | L-18 | M7 | visible only; behaviour not observed |
| Latest Email Status | L-19 | M10 | visible only; behaviour not observed |
| Locked | L-20 | M2 | visible only; behaviour not observed |
| Record Action | L-21 | M2 | visible only; behaviour not observed |
| Related Records Action | L-22 | M2 | visible only; behaviour not observed |
| Touched Records | L-23 | M2 | visible only; behaviour not observed |
| Untouched Records | L-24 | M2 | visible only; behaviour not observed |
| Cadences | L-25 | P3 | visible only; behaviour not observed |
| Filter By Fields | L-26 | M2 | visible only; behaviour not observed |
| Account Name | L-27 | M3 | visible only; behaviour not observed |
| Assistant | L-28 | M2 | visible only; behaviour not observed |
| Asst Phone | L-29 | M2 | visible only; behaviour not observed |
| Connected To | L-30 | M2 | visible only; behaviour not observed |
| Contact Name | L-31 | M2 | visible only; behaviour not observed |
| Contact Owner (partly clipped) | L-32 | M2 | visible only; behaviour not observed |
| Sliders icon | L-33 | M11 | visible only; behaviour not observed |
| Select all checkbox | L-34 | M2 | visible only; behaviour not observed |
| Contact Name | L-35 | M2 | visible only; behaviour not observed |
| All with down arrow | L-36 | M2 | visible only; behaviour not observed |
| Account Name | L-37 | M3 | visible only; behaviour not observed |
| Email | L-38 | M2 | visible only; behaviour not observed |
| Phone (partly clipped) | L-39 | M2 | visible only; behaviour not observed |
| Record selection checkbox | L-40 | M2 | visible only; behaviour not observed |
| Call activity flag | L-41 | M5 | visible only; behaviour not observed |
| Contact record link | L-42 | M2 | visible only; behaviour not observed |
| Account record link | L-43 | M3 | visible only; behaviour not observed |
| Email address link | L-44 | M10 | visible only; behaviour not observed |
| Row three dots icon | L-45 | M2 | visible only; behaviour not observed |
| Row note bubble icon | L-46 | M6 | visible only; behaviour not observed |
| Row pulse icon | L-47 | ? | visible only; behaviour not observed |
| Total Records | L-48 | M2 | visible only; behaviour not observed |
| Displayed record range | L-49 | M2 | visible only; behaviour not observed |
| Previous | L-50 | M2 | visible only; behaviour not observed |
| Next | L-51 | M2 | visible only; behaviour not observed |
| Fields and Standard layout | — | M2 | exported metadata |
| Account lookup | — | M3 | exported metadata |
| Reporting To relation | — | M2 | exported metadata |
| Vendor lookup | — | P2 | exported metadata |
| Stored stock views | L-01, L-02 | M2 | metadata; dropdown not observed |
| View customization | L-02 | M11 | not observed |
| Related lists | — | per related-list table | metadata; detail task confirms UI |



## Capture refs

| Slug | Clicks | Skipped | State |
| --- | --- | --- | --- |
| m2-list-base | 0 | 0 | populated list; base screenshot includes row controls |
| m2-list-after | 0 | 0 | same list and range; row controls absent |


These are the only captured states. The view-selector, create-menu, actions, other toolbar/column/operator menus and selected-row capture were not attempted after the mandatory stop. Base and after have the same total record count and zero selected rows. No raw screenshot or customer value is included in this repository.


## Open questions

1. Capture safety: the base and after contain successful POSTs on Contacts bulk/count paths. The issue stop rule was applied before clicks; a reviewer must establish whether these are read operations before any continuation. There is no evidence that records changed. This document records the stop without documenting request shapes.
2. View selector, create dropdown, Actions, page-size, sort popup, first text-column menu, filter operator list and selection toolbar are not observed. The empty state is not observed because the list is populated.
3. SH controls assigned `?` need a module decision: product selector, global search, notifications, marketplace, profile, application grid, utility Pins/Chats/Contacts, document-clock icon, announcements, Motivator, Sticky Notes, accessibility, Help and trash bin. The footer Contacts shortcut is not assumed to be the M2 module.
4. The row pulse icon and CheckLists / combined or unassigned related lists have unresolved module ownership. Row-control activation and hover-only affordances beyond the base screenshot are not observed.
5. Metadata provides no view sort values or layout column placement. Common_Status and Old_Mailing_* references have no field definitions in the current export.
6. Country/state option filtering, defaults, write validation and success/error states are not observed. Form and record-detail research remain separate. The normalized unsubscribe option label needs a neutral implementation label.
7. Grok QA should audit the two saved images and reconciliation; UI Lead must assess the stop and the remaining capture scope. Do not approve this incomplete document as a finished Contacts parity baseline.
