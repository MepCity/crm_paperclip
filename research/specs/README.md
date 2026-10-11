# Module & screen specs

One markdown file per module or screen, written by the CRM Analyst from captures in `~/Desktop/mepcity-research/captures/`.

Template:
- **Purpose** — what the user does here
- **Layout** — regions, lists, panels, tabs; with a **Visual layout** subsection (measured sizes, spacing, type, colours, visible states)
- **Fields** — shown fields and their types (cross-check `~/Desktop/mepcity-research/metadata/`)
- **Actions** — buttons/menus and what they do
- **Filters / views / sorting / search**
- **Flows** — step-by-step user flows, including validation and empty/error states
- **Data needs** — which requests the screen makes (from `network.json` shapes) and the data each needs
- **Capture refs** — capture slugs used

From Module 2 onward, specs replace **Visual layout** and **Data needs** with **Control inventory** (board decisions 2026-10-09 and 2026-10-11). Each captured state lists every visible control, including the shell and utility strip, with stable numbers, position, observed behaviour, source and owning module. Screenshot inspection and controls.json reconciliation establish completeness; no measurements, typography, colours or request shapes are recorded.

No customer data, no copied text blocks, no screenshots in the repo.

- [leads-write-behaviour.md](leads-write-behaviour.md) — Write behaviours: delete, clone, mass actions, post-save (from public documentation).

- [contacts.md](contacts.md) — Contacts list control inventory and exported module configuration (incomplete capture research; review required).
- contacts-record-detail.md — Contacts record detail (planned; MEP-286).
- contacts-form.md — Contacts create/edit forms (planned; MEP-287).
- global-search.md — Global search (planned; MEP-288).
- duplicates.md — Duplicate flows (planned; MEP-288).
