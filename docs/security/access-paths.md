# Access-path inventory (Feature D, input to ADR 0017)

Scope: every server-side entry point that reads or writes CRM data, and the guard it has today. Read-only inventory of the repository at the head of `main` when MEP-1450 was written; no code was changed. Paths are repo-relative.

## 1. Current auth model

**Session.** `better-auth` (`packages/core/src/auth/index.ts:15` `createAuth`, cookie session). `getSession(headers)` (`:83`) returns `{user:{id,email,name}, sessionId, expiresAt}` or `null`; `requireUser(headers)` (`:94`) throws `UnauthenticatedError`. `handleAuthRequest` (`:44`) serves `/api/auth/*` with an origin check on non-GET.

**Organisation.** `requireOrgContext(headers, orgSlug)` (`packages/core/src/tenancy/index.ts:92`) = session + a `memberships` row for that slug; otherwise `NotFoundError`. It returns `OrgContext {orgId, orgSlug, orgName, userId, role}` (`packages/core/src/tenancy/types.ts`). It is the **only** tenant/member check; there is no per-module, per-record or per-field check anywhere.

**Roles.** The only role is `memberships.role` in `('admin','member')` (`packages/db/src/schema/tenancy.ts`, CHECK `memberships_role_check`; `OrgRole` in `packages/core/src/tenancy/types.ts:3`). The creator of an organisation is `admin` (`packages/core/src/tenancy/create-organization.ts:15`); invitations carry a role (`invitations.role`). There is no profile, role hierarchy, sharing rule or permission table.

**Where `role === "admin"` is actually enforced (complete list):**
- Members/invitations: `requireCurrentAdmin` (`packages/core/src/tenancy/index.ts:120`), used by `changeMemberRole` (:196), `removeMember` (:225), `createInvitation` (:292), `listInvitations` (:331), `revokeInvitation` (:347). It re-reads the membership inside the transaction.
- Customization (fields/layouts/modules write): `packages/core/src/customization/service.ts:24,29` (`context.role !== "admin"` -> `ForbiddenError`).
- Documents read gate: `apps/web/src/server/documents/access.ts:15` (admin passes; member passes via `documentsEnabled`, currently always true).
- UI hints only (not enforcement): `apps/web/src/app/crm/[orgSlug]/settings/members/page.tsx:27`, `.../layout.tsx:25`, `.../workqueue/page.tsx:40`, `apps/web/src/components/records/list/module-list-screen.tsx:216,250` and `module-list-custom-view.tsx:32` (custom-view create/edit shown to admins; the matching API ops `createSharedView`/`patchSharedView`/`deleteSharedView` do not check the role).

**HTTP wrapper.** `apiRoute` (`apps/web/src/lib/api/server.ts`): same-origin check on non-GET -> session -> `X-CRM-ORG` header (or `?org=` for download routes with `orgFromQuery`) -> `requireOrgContext` -> handler. `operationRoute` (`apps/web/src/lib/api/operation-route.ts`) and `transferRoute` (`apps/web/src/lib/api/transfer-route.ts`) are thin binders over it. `attachmentRoute` (`apps/web/src/server/attachments/wrapper.ts:17`) re-implements the same gate order by hand. `tagsBinRoute` (`apps/web/src/server/tags-bin/route.ts:31`) wraps `apiRoute`.

**Server actions / RSC.** `requireOrgContext(orgSlug)` / `requireUser()` from `apps/web/src/lib/session.ts` (cached per request; redirects to sign-in, `notFound()` for non-members).

**Tenancy context (ADR 0012).** `withOrg(ctx, work)` (`packages/core/src/tenancy/index.ts:110`) opens a transaction and runs `select set_config('app.org_id', ctx.orgId, true)`; RLS policy `tenant_isolation` uses `public.current_org_id()` (`packages/db/migrations/0004_tenant_context_foundation.sql`) for runtime role `crm_app`. RLS tables today: `report_definitions`, `assignment_shells`, `organization_email_addresses` (migration 0006) and the six `chat_*` tables (0007). **CRM record data is not in the database**: `getRecordService(ctx)` (`apps/web/src/lib/records.ts:16`) returns `createFixtureRecordService` (`packages/core/src/records/fixture/index.ts:186`), an in-memory, per-organisation fixture. So record isolation relies on the service instance being created from `ctx`, not on RLS. Documents, mail, calendar, automation, customization and jobs are also in-memory services (`apps/web/src/server/*`, `packages/core/src/{automation,customization,jobs}/memory.ts`).

**Worker.** `apps/worker/src/main.ts` registers mail send/sync handlers on an `InMemoryJobQueue`; each handler has `isCurrent(context)` (re-check tenant/connection/authorization, `apps/worker/src/worker.ts`) and jobs carry `organizationId`. No user identity/permission is carried by a job.

## 2. Entry-point table

Guard legend: **S** = session + `X-CRM-ORG` + membership (what `apiRoute` gives every route below; "tenant only" in practice). **A** = additionally admin check. **O** = owner/participant check inside the service. "none" = no auth at all. Every row in the "Record / list" group below has guard **S only** and no per-module, per-record, per-field or owner check.

### 2.1 Auth / platform (4 route handlers)
| Entry point | Op | Guard | Core call |
|---|---|---|---|
| `apps/web/src/app/api/auth/[...all]/route.ts` GET, POST | sign-in/up, session | none (this *is* auth); origin check on non-GET | `handleAuthRequest` |
| `apps/web/src/app/api/health/route.ts` GET | health | none | `checkHealth` |
| `apps/web/src/app/api/personal-settings/language/route.ts` GET, PUT | personal setting | session only (no org) | `persistLanguage` |
| `apps/web/src/app/crm/v9/users/route.ts` GET | list members (user lookup) | S | `listMembers` |

### 2.2 Records (modules: leads, contacts, accounts, deals, tasks, meetings, calls, campaigns, cases, solutions, products, quotes, invoices, notes…) — 22 handlers / 31 method bindings
All via `operationRoute(operations.X)` -> `getRecordService(ctx)`; the `[module]` param is a path segment, so one handler serves every module.
| Entry point (under `apps/web/src/app/crm/`) | Op | Guard | Service call |
|---|---|---|---|
| `v2.2/[module]/route.ts` POST | create | S | `records.create` |
| `v2.2/[module]/[recordId]/route.ts` GET / PUT / DELETE | detail / update / delete | S | `records.get/update/delete` |
| `v2.2/[module]/bulk/route.ts` POST | list (query, view, filters, sort) | S | `records.list` |
| `v2.2/[module]/actions/count` POST | count | S | `records.count` |
| `v2.2/[module]/actions/grouped_counts` POST | summarize / group counts | S | `records.summarize` |
| `v2.2/[module]/actions/mass_update` POST | mass update | S | `records.massUpdate` |
| `v2.2/[module]/actions/mass_delete` POST | mass delete | S | `records.delete` (loop) |
| `v2.2/[module]/actions/change_owner` POST | mass owner change | S | `records.changeOwner` |
| `v2.2/[module]/actions/merge` POST | merge | S | `records.merge` |
| `v2.2/[module]/actions/deduplicate` POST | deduplicate | S | `records.deduplicate` |
| `v2.2/[module]/actions/duplicate_groups` POST | duplicate scan | S | `records.findDuplicateGroups` |
| `v2.2/[module]/[recordId]/actions/convert` POST | convert lead | S | `records.convertLead` (creates contact/account/deal) |
| `v2.2/actions/search/route.ts` POST | global search | S | `records.search` |
| `v2.2/org/currencies` GET | home currency | S | `records.getHomeCurrency` |
| `v9/[module]/[recordId]/timelines` GET | timeline / history | S | `getRecordHistoryService` (`apps/web/src/lib/records.ts:25`) |
| `v9/settings/custom_views` GET, POST; `[viewId]` GET, PATCH, DELETE | list/create/update/delete shared views | S (create/patch/delete are **not** admin-checked server-side) | `records.getView…` |
| `v9/settings/kanban_views` GET, POST; `[viewId]` GET, PUT | kanban views | S | `records.*Kanban*` |

### 2.3 Tags and recycle bin — 8 handlers
`tagsBinRoute` builds `createFixtureRecordService(ctx)` per call (`apps/web/src/server/tags-bin/route.ts:31`). All S only.
| Entry point | Op |
|---|---|
| `v2.2/settings/tags` GET, POST; `v2.2/settings/tags/[tagId]` PUT, DELETE | tag catalogue read/create/update/delete (delete affects all records using the tag) |
| `v2.2/[module]/[recordId]/actions/add_tags`, `remove_tags` POST | tag a record |
| `v2.2/settings/recycle_bin` GET | list deleted records of **all** modules |
| `v2.2/settings/recycle_bin/actions/restore`, `permanent_delete`, `empty` POST | restore / purge / empty whole organisation bin |

### 2.4 Import / export — 9 handlers
`transferRoute` -> `getTransferService()` (`apps/web/src/lib/api/transfer-route.ts:13`). The service calls `deps.authorize(ctx, module, action)` (`packages/core/src/transfer/service.ts:56,71,198,222`, `import.ts:532`) with actions `create|update|delete|read` — **the hook exists and is the right seam, but the wired implementation only checks membership** (`transfer-route.ts:17`, comment "module profiles do not exist yet").
| Entry point | Op | Guard |
|---|---|---|
| `v2.2/[module]/actions/export` POST | export | S + `authorize(read)` = membership |
| `v2.2/[module]/actions/import`, `import_preview` POST; `import_sample` GET (`?org=`) | import | S + `authorize(create/update)` = membership |
| `v9/settings/imports` GET; `[importId]` GET; `[importId]/actions/undo` POST | history / undo | S + `authorize(delete)` = membership. History is process-local, not per user |
| `v9/settings/exports` GET; `[exportId]/download` GET (`?org=`) | export history / file download | S + `authorize(read)` |

### 2.5 Attachments — 2 handlers (4 methods)
`attachmentRoute()` (`apps/web/src/server/attachments/wrapper.ts`) -> `handleAttachmentRequest` (`apps/web/src/server/attachments/http.ts`); lifecycle is `createFixtureAttachmentLifecycle(ctx)`; blobs `LocalDiskBlobStore`. Guard S only.
`v2.2/[module]/[recordId]/Attachments` GET (list), POST (upload); `.../Attachments/[attachmentId]` GET (download), DELETE. The host record is loaded through `getRecordService(ctx)` only to assert existence.

### 2.6 Customization / settings — 5 handlers
Through `operationRoute`; writes call `getCustomizationService(ctx)` which enforces admin.
| Entry point | Op | Guard |
|---|---|---|
| `v2.2/settings/fields` GET | field metadata read | S |
| `v2.2/settings/fields` POST, PATCH, DELETE | create / patch / retire field | **A** (`customization/service.ts:24`) |
| `v2.2/settings/modules/[module]` GET; PATCH | module metadata; module settings | S; A |
| `v2.1/settings/layouts` GET; PATCH | layouts | S; A |

### 2.7 Chat — 19 handlers (`v2.2/chat/**`)
`getChatService()` (`packages/core/src/chat/service.ts`) runs everything inside `withOrg` (RLS on `chat_*`). Guard: S + participant checks inside the service (O): conversation membership (`isCurrentMember`, :302), owner-only settings (:354), direct conversations immutable (:343). Routes: `conversations` GET/POST; `conversations/[id]` GET/PATCH; `…/members` POST, `…/members/[userId]` DELETE; `…/messages` GET/POST; `…/pin` PUT/DELETE; `…/read` POST; `messages/[id]` PATCH/DELETE; `messages/[id]/replies` GET/POST; `…/star` PUT/DELETE; `…/thread-read` POST; `contacts`, `mentions`, `presence`, `search`, `starred`, `sync`, `threads`. `contacts` lists all org members.

### 2.8 Documents — 3 handlers (read-only)
`v2.2/documents/folders`, `folders/[folderId]/items`, `items/[itemId]` GET -> `getDocumentsService` (`apps/web/src/server/documents/service.ts`) -> `canReadDocuments` (`access.ts:14`): admin passes, member passes via `documentsAccessSource` (interim: always true). Guard: S + capability stub (the one place a "profile enables module" seam already exists; ADR 0008 §2). `operationRoute` explicitly 404s `module=documents` (`operation-route.ts:13`).

### 2.9 Mail — 5 handlers
| Entry point | Op | Guard |
|---|---|---|
| `v2.2/mail/conversations` GET | read inbox / per-record mail | S + mailbox owner (`server/mail/service.ts:68`) + `canReadRecord` for record-scoped reads |
| `v2.2/mail/mailboxes` GET | connected mailboxes | S + owner filter (`server/mail/mailboxes.ts:34`) |
| `v2.2/mail/messages` POST | compose / send | S + mailbox owner (`server/mail/write.ts:50`) |
| `v2.2/mail/messages/[id]/links` POST, DELETE | link/unlink mail to CRM record | S + owner |
| `v2.2/mail/messages/[id]/sharing` PATCH | sharing | S + owner |

### 2.10 Server actions (RSC, `"use server"`) — 14 exported actions + 2 inline
| Symbol | Op | Guard |
|---|---|---|
| `apps/web/src/app/orgs/new/actions.ts` `createOrganizationAction` | create org | session only |
| `apps/web/src/app/invite/[token]/actions.ts` `acceptInvitationAction` | accept invitation | session only + token |
| `.../settings/members/actions.ts` `changeMemberRoleAction`, `removeMemberAction`, `createInvitationAction`, `revokeInvitationAction` | member admin | S + **A** (core) |
| `.../settings/recycle-bin/actions.ts` `listRecycleBinAction`, `mutateRecycleBinAction` | bin list / restore / purge / empty | S only |
| `.../tags/actions.ts` `readRecordTagsAction`, `saveRecordTagsAction`, `removeRecordTagAction`, `readTagCatalogueAction`, `mutateTagCatalogueAction` | tags | S only (comment at :98 notes "no administrator-only grant is inferred") |
| `.../tab/Dashboards/page.tsx` `getDashboard` (inline) | dashboard analytics | S only |
| `.../tab/Reports/[reportId]/page.tsx` (inline action) | report run | S only |
| `apps/web/src/components/ui/form-demo-action.ts` | demo | none (demo only; confirm unreachable in prod) |

### 2.11 Server-rendered pages that load data (48 `page.tsx` under `apps/web/src/app/crm/[orgSlug]`)
The layout (`.../[orgSlug]/layout.tsx:18`) calls `requireOrgContext` once for the subtree, so every page is **S only**. Pages that read CRM data server-side or hand a service-backed port to a client component and so need their own check: `tab/Dashboards`, `tab/Reports`, `tab/Reports/[reportId]`, `workqueue`, `settings/modules/[module]/fields`, `settings/modules/[module]/layouts`. All other record pages (`tab/[moduleTab]/…` list, custom-view list, create, `[recordId]` detail/edit/clone/convert/merge/print, deduplicate, drafts, import, tags, print, `search`, `calendar`) fetch through the HTTP routes above from the browser. Settings pages without a data route today (assignment-rules, workflow-rules, templates, email-configuration, email-parser, bcc-dropbox, calendar-booking, company-details, currencies, personal-settings, import-history, export-history, members, recycle-bin) have no admin gate at page level (`settings/members/page.tsx:27` only hides buttons). Non-data tabs (Emails, Documents, Social, Visits, Calendar) are S only.

### 2.12 Worker jobs — 2 handlers
`apps/worker/src/main.ts`: mail send handler and mail sync handler (`createMailSendHandler`, `createMailSyncHandler` in `packages/core/src/mail`). Guard: job carries `organizationId` + mailbox id; `isCurrentContext` re-checks tenant and connection; no user permission is re-evaluated at run time.

### 2.13 Not exposed over HTTP but holding CRM data (no entry point yet)
Automation (`packages/core/src/automation/memory.ts`: workflow rules, assignment rules), report definitions and calendar (`packages/core/src/calendar`) have service code and RLS tables (`report_definitions`, `assignment_shells`) but **no route handler**; they are reachable only through the pages/actions in 2.10–2.11. When routes are added they must go through the same engine.

### Counts
| Group | Route handlers | Method bindings / actions | Guard today |
|---|---|---|---|
| Auth/platform | 4 | 6 | 1 none (health), 1 session-only, 1 auth itself, 1 S |
| Records + views | 22 | 31 | S only (0 permission checks) |
| Tags + recycle bin | 8 | 12 | S only |
| Import/export | 9 | 9 | S + membership-only `authorize` seam |
| Attachments | 2 | 4 | S only |
| Customization/settings | 3 | 7 | 3 write bindings admin-checked, reads S |
| Chat | 19 | ~32 | S + participant (O) |
| Documents | 3 | 3 | S + capability stub |
| Mail | 5 | 7 | S + mailbox owner (O) |
| Server actions | 6 files | 14 + 2 inline | 4 admin, rest S/session |
| Worker jobs | 2 | 2 | tenant re-check only |
| **Total** | **72 `route.ts` files** | | |
Unguarded beyond S (no module/record/field/owner/admin check): all of Records, Tags/Bin, Attachments, Import/Export (seam only), shared-view writes, Dashboards/Reports actions, settings pages — roughly **60 handlers / 80 method bindings**.

## 3. Choke points

1. **`RecordService`** (`packages/core/src/records/contract.ts`; only implementation `createFixtureRecordService`, `packages/core/src/records/fixture/index.ts:186`, selected at one place `apps/web/src/lib/records.ts:16`). `list/get/create/update/delete/massUpdate/changeOwner/merge/deduplicate/convertLead/count/summarize/search` pass through it. A permission engine that wraps `getRecordService(ctx)` (decorator) covers the whole 2.2 record group, search, bulk, timelines (if history also decorated) and the analytics port (`apps/web/src/modules/analytics/record-port.ts` wraps `getRecordService`).
2. **List/query compiler** (`packages/core/src/records/fixture/query.ts`, `system-filters.ts`, `related-module-filters.ts`): the single place to inject row-level predicates (owner, sharing) for list, count, summarize, search, export, kanban and report data.
3. **Transfer service `authorize` hook** (`packages/core/src/transfer/service.ts`): already called per `(module, action)`; today a membership stub (`apps/web/src/lib/api/transfer-route.ts:17`).
4. **`CustomizationService`** (`packages/core/src/customization/service.ts:24`): existing admin gate, to be replaced by a permission check.
5. **`apiRoute`** (`apps/web/src/lib/api/server.ts`): one place to add a coarse "module access" check by `params.module` and HTTP method.
6. **`withOrg`** (`tenancy/index.ts:110`): one place to set additional DB session settings (user id, role) for RLS-backed tables (chat, definitions).

**Bypasses (do not go through `getRecordService`):**
- `createFixtureRecordService(ctx, …)` instantiated directly in `apps/web/src/server/tags-bin/route.ts:32` (tags + recycle bin) — also `createFixtureRecycleBinService` (`apps/web/src/lib/recycle-bin.ts`) and `createFixtureTagService` / `createFixtureRecordHistoryService` / `createFixtureAttachmentLifecycle` in `apps/web/src/lib/records.ts`, `attachments/wrapper.ts`.
- Attachments (`attachmentRoute`), own gate and lifecycle.
- Documents, mail, chat, calendar, automation, customization: separate services with their own (or no) rules; mail reads CRM records through `source.canReadRecord` (`server/mail/service.ts:63`), which is a ready-made record-visibility hook.
- Import `runImport` writes through `deps.records` (`getRecordService`) so would be covered by a decorator, but the authorize hook is module-level only (no row-level on update-by-match).
- `convertLead` and `merge` create/alter records of other modules inside the service (cross-module write: needs create permission on the targets).
- Server actions and RSC pages that call services directly (2.10, 2.11).
- Mass delete/restore/purge on the recycle bin ignore the original module.

## 4. Owner fields

- **Records:** every module that has an owner uses the field API name `Owner` (value = member user id, a string) and `Created_By`, `Modified_By`, `Created_Time`, `Modified_Time` as managed fields (`packages/core/src/records/fixture/metadata.ts:23,221`; `registry.ts:88-100,249`). Defaulting: `Owner` = `ctx.userId` on create (`fixture/index.ts:218,875`), inherited from the lead on conversion (`:1047`), validated against org members (`:492`), changed through `changeOwner` (`:1602`). Records live in memory in fixture state (JSON field bag), so **there is no database column and no index**. A DB-backed record store must add an indexed `owner_id` (and `created_by`) column per record table with `organization_id` leading composite indexes.
- Modules without an `Owner` field in metadata (check per module before enforcing "owner" rules): notes, attachments and line items inherit the parent record; activity modules use `Owner` as well.
- **Chat:** `chat_members.role = 'owner'`, `chat_conversations.created_by` (`packages/db/migrations/0007_chat.sql`).
- **Mail:** `mailbox.ownerUserId` (in-memory repository, `server/mail/*`); documents: `space.ownerUserId` (`server/documents/service.ts:11`).
- **Tenancy:** `invitations.invited_by` (indexed by organisation+email, not by inviter).
- **Definitions:** `report_definitions` and `assignment_shells` have `organization_id` only; check `packages/db/migrations/0006_definition_stores.sql` for any creator column (none used for access today).

## 5. Client-side gating (places that will need permission props)

Today almost nothing is gated on the client; `role` reaches the UI only as `isAdmin`/`canManage`/`canInvite`.
- Org layout: `apps/web/src/app/crm/[orgSlug]/layout.tsx:18-25` computes `canInvite` from `org.role` and passes it to `AppShell` (`apps/web/src/components/shell/app-shell.tsx:26,35,248`).
- Top navigation and module tabs: `apps/web/src/components/shell/nav.ts` (`settingsNav`, module tab list) and `settings-navigation.tsx` — need "module visible" and "settings section visible".
- List screens: `apps/web/src/components/records/list/module-list-screen.tsx:198-250` (`isAdmin`, `userRole` props), `list-toolbar.tsx` (create, import, export, mass actions, delete), `module-list-create-menu`, `view-settings-menu.tsx`, `module-list-custom-view.tsx:32-62` (custom view create/edit, admin-only in UI), `custom-view-dialog.tsx:37,916`.
- Record detail: `apps/web/src/components/records/detail/record-header.tsx` (edit, clone, delete, convert, change owner, print, tags), `details-card.tsx` / `inline-field-editor.tsx` / `field-pencil.tsx` (field-level edit; needs field read/edit flags), related-list cards under `components/records/detail/*-card-body.tsx` and `components/records/notes/*`, `attachments/attachments-card.tsx` (upload/delete), `components/records/tags/*`.
- Forms/merge/dedupe/import/recycle bin: `components/records/form/*` (field visibility, owner picker `select-user-dialog.tsx`), `merge/`, `deduplicate/`, `transfer/`, `recycle-bin/`.
- Settings: `.../settings/members/page.tsx:27` (`canManage`), `components/members/members-table.tsx`, `settings/modules/[module]/{fields,layouts}` (already server-gated for writes, UI not), other settings pages listed in 2.11.
- Chat and mail UIs: `components/shell/chat-bottom-bar.tsx`, `modules/chat/*` (`chat-panel.tsx`, `member-picker-dialog.tsx`), `modules/emails/*`.
- Module routing: `apps/web/src/modules/module-route.tsx`, `module-route-client.tsx`, `module-list-client.tsx` decide which module screen renders; this is where "no access to module" must render a denied state.
- Data source for the props: a new permissions payload alongside `OrgContext` (server) and a client hook (new); field flags can ride on the module metadata projection (`getModuleProjection`, `apps/web/src/lib/api/wire/customization.ts`).

## Findings to carry into ADR 0017
1. Authorization today is membership + a two-value org role; only members management, customization writes and (stub) documents consult the role.
2. Records are fixture/in-memory; the engine must be written as a decorator over `RecordService` and the query compiler, not as RLS, until a database record store exists.
3. Every list/count/summarize/search/export/report path must share the row filter, or owner/sharing rules leak through aggregates.
4. Bypass services listed in section 3 must be moved behind the engine in the same change.
5. Shared-view writes, tag catalogue, recycle bin and dashboard/report actions are privileged operations with no admin check today.
