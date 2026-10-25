# Phase 1 i18n Screen Inventory and Turkish Localization Coverage

This document tracks the complete Turkish localization inventory across all 15 Phase 1 modules of the MepCity CRM, in accordance with ADR 0014 (Interface Internationalization, Slices I, II, and III) and issue MEP-1340.

## Overview

Interface language selection follows personal user preference (`Personal Settings → Locale Information → Language: "tr"` / `"en"`), with English as the fallback and default.
Number, currency, date, and time formatting follow organization settings (ADR 0014 / MEP-496), while relative time expressions ("Today" / "Bugün", "{count} days overdue" / "{count} gün geç") follow the user's interface language.

---

## Phase 1 Screen Inventory & Status

| Module # | Module Name | Primary Routes | Key Localized Screens / Components | Catalogs | Status |
|---|---|---|---|---|---|
| **01** | **Leads** | `/crm/[slug]/tab/Leads/list`<br>`/crm/[slug]/tab/Leads/create`<br>`/crm/[slug]/tab/Leads/[id]` | List views, filter panel, quick filters, detail view, timeline, convert lead, clone | `crm.json`<br>`metadata.json` | Localized (Slice II) |
| **02** | **Contacts** | `/crm/[slug]/tab/Contacts/list`<br>`/crm/[slug]/tab/Contacts/create`<br>`/crm/[slug]/tab/Contacts/[id]` | List views, filter panel, detail view, related lists, timeline, quick filters | `crm.json`<br>`metadata.json` | Localized (Slice II) |
| **03** | **Accounts** | `/crm/[slug]/tab/Accounts/list`<br>`/crm/[slug]/tab/Accounts/create`<br>`/crm/[slug]/tab/Accounts/[id]` | List views, filter panel, detail view, related lists, timeline, hierarchy | `crm.json`<br>`metadata.json` | Localized (Slice II) |
| **04** | **Deals** | `/crm/[slug]/tab/Deals/list`<br>`/crm/[slug]/tab/Deals/board`<br>`/crm/[slug]/tab/Deals/create`<br>`/crm/[slug]/tab/Deals/[id]` | List view, pipeline Kanban board, stage change dialogs, detail view, related lists | `crm.json`<br>`metadata.json` | Localized (Slice II) |
| **05** | **Activities** | `/crm/[slug]/tab/Tasks/*`<br>`/crm/[slug]/tab/Meetings/*`<br>`/crm/[slug]/tab/Calls/*` | Tasks, Meetings, and Calls lists, forms, and detail views; activity cards on parent records | `crm.json`<br>`metadata.json` | Localized (Slice II) |
| **06** | **Notes, Attachments & CSV** | `/crm/[slug]/tab/[Module]/[id]`<br>`/crm/[slug]/tab/[Module]/import`<br>`/crm/[slug]/tab/[Module]/export` | Record notes card, attachments dropzone and file table, CSV import mapper and export dialog | `crm.json`<br>`common.json` | Localized (Slice II) |
| **07** | **Campaigns** | `/crm/[slug]/tab/Campaigns/list`<br>`/crm/[slug]/tab/Campaigns/create`<br>`/crm/[slug]/tab/Campaigns/[id]` | Campaigns list view, status filters, create/edit form, member status list, detail | `crm.json`<br>`metadata.json` | Localized (Slice II) |
| **08** | **Cases & Solutions** | `/crm/[slug]/tab/Cases/*`<br>`/crm/[slug]/tab/Solutions/*` | Cases & Solutions lists, filter panel, create forms, solutions search, detail views | `crm.json`<br>`metadata.json` | Localized (Slice II) |
| **09** | **Documents** | `/crm/[slug]/documents` | Folders tree, documents table, folder create modal, rename/delete actions, preview | `modules.json` (`documents`) | Localized (Slice III) |
| **10** | **Email & Calendar** | `/crm/[slug]/tab/Emails`<br>`/crm/[slug]/tab/Calendar` | Webmail inbox, compose modal, folder tree, thread view, month/week/day calendar grid | `modules.json` (`emails`, `calendar`) | Localized (Slice III) |
| **11** | **Customization (Setup)** | `/crm/[slug]/settings/setup`<br>`/crm/[slug]/settings/modules` | Setup category grid, search, modules and fields manager, layout editor | `modules.json` (`setup`) | Localized (Slice III) |
| **12** | **Automation (Workflows)** | `/crm/[slug]/settings/workflow-rules`<br>`/crm/[slug]/settings/workflow-rules/[id]` | Workflow rules list, rule detail screen, rule trigger formatters, criteria display | `modules.json` (`workflow`) | Localized (Slice III) |
| **13** | **Reports & Analytics** | `/crm/[slug]/tab/Reports`<br>`/crm/[slug]/tab/Reports/[id]`<br>`/crm/[slug]/tab/Analytics` | Reports catalog, folder navigation, report detail/export, analytics dashboard and metric cards | `modules.json` (`reports`, `analytics`) | Localized (Slice III) |
| **14** | **Home & Workqueue** | `/crm/[slug]/home`<br>`/crm/[slug]/tab/Workqueue` | Home onboarding preview and dashboard cards, Workqueue task/lead queues and overdue tags | `modules.json` (`home`, `workqueue`) | Localized (Slice III) |
| **15** | **Visits & Social** | `/crm/[slug]/tab/Visits`<br>`/crm/[slug]/tab/Visits/[id]`<br>`/crm/[slug]/tab/Social` | Visitor tracking intro carousel, visits list & detail, social monitor, connect cards | `modules.json` (`visits`, `social`) | Localized (Slice III) |

---

## Formatting Integration

1. **Core Single Formatter**:
   - `packages/core/src/format/index.ts` formats dates, numbers, currency, percentages, and relative time expressions.
   - `FormatOptions` supports an explicit `language?: string` option so relative time strings ("Bugün", "{count} gün önce", "{count} gün geç") follow the user's interface language while numeric formatting obeys organization rules.

2. **Format Context**:
   - `apps/web/src/lib/format-context.tsx` wires `useUiLanguage()` from client provider into `useFormat()`.
   - Verified via unit test matrix: `apps/web/src/lib/mixed-language-format.test.ts` (TR UI with US org format, EN UI with EU org format, TR UI with TR org format).

3. **AST Baseline Reduction**:
   - Removed remaining Phase 1 string literals from `scripts/ui-messages-baseline.json`.
   - Guard verified using `node scripts/check-ui-messages.mjs`.
