# ADR 0017 — Profiles, roles and sharing (permission model)

- Status: Proposed (CTO, 2026-11-05) — review Gemini Reviewer 2, security approval Platform Lead
- Issue: MEP-1451; parent MEP-1447 (Feature D)
- Inputs: `research/specs/roles-profiles-sharing.md` (MEP-1449), `docs/security/access-paths.md` (MEP-1450)
- Related: ADR 0008 §2 (documents capability seam), ADR 0009 Q8 (mailbox ownership), ADR 0011 §3 (customization admin gate), ADR 0012 (tenant keys, RLS)
- Scope: data model, evaluation algorithm, enforcement points, caching, migration of existing members, UI gating contract, tests, performance budget. No code.

## Context

Today authorization is session + organisation membership + a two-value `memberships.role` (`admin`/`member`), consulted only by member management, customization writes and the documents stub (access-paths §1). About 60 route handlers / 80 method bindings have no module, record or field check. CRM records live in the in-memory fixture record service (`createFixtureRecordService`), not in Postgres; tenant isolation of records comes from building that service from `OrgContext`.

The reference CRM (research spec §§1–7) separates two concepts: a **profile** (what a user may *do*: module actions, tools, admin settings, field access) and a **role** (which records a user may *see*: owner + role hierarchy + peers + org default access + sharing rules). Each user has exactly one profile and one role. Two system profiles exist (Administrator, Standard), a role tree with one root, groups as sharing sources/targets, one default-access level per module, and sharing rules per module.

## Decision

### 1. Vocabulary and levels

- **Action permission**: a boolean in a profile, keyed by a catalogue key (§3).
- **Access level** on a record, totally ordered: `none < read < read_write < read_write_delete`. Abbreviated R, RW, RWD below.
- **Default access** per module: `private` (→ none for non-owners), `public_read` (R), `public_read_write` (RW), `public_read_write_delete` (RWD).
- **Field access** per profile × module × field: `read_write` (default), `read_only`, `hidden`.

An operation is allowed only when **both** the profile permits the action on the module **and** the record access level is high enough (read → R, edit → RW, delete → RWD). Neither alone grants anything.

### 2. Data model (Postgres, migration `0008_access_control.sql`)

Permission configuration is small, organisation-owned, and read on every request; it goes into Postgres now, following ADR 0012 §2–3: `organization_id` leading every key, composite FKs, UUIDv7 ids, RLS policy `tenant_isolation` (`USING` and `WITH CHECK` `organization_id = (select current_org_id())`) for `crm_app` on every table below. CRM records stay in the fixture service (§6 explains why that does not change the design).

| Table | Columns (all have `organization_id`) | Keys / constraints |
|---|---|---|
| `access_profiles` | `id`, `name`, `description`, `kind` (`administrator`\|`standard`\|`custom`), `permissions jsonb`, `created_by`, `modified_by`, `created_at`, `updated_at` | PK `(organization_id, id)`; unique `(organization_id, lower(name))`; partial unique on `kind` where `kind <> 'custom'` (one of each system profile) |
| `access_field_permissions` | `profile_id`, `module`, `field_api_name`, `access` (`read_only`\|`hidden`) | PK `(organization_id, profile_id, module, field_api_name)`; FK profile cascade. Absent row = `read_write` |
| `access_roles` | `id`, `name`, `parent_role_id` (null only for the root), `share_with_peers bool`, `description`, audit columns | PK `(organization_id, id)`; composite FK parent `restrict`; partial unique index `(organization_id) where parent_role_id is null` (exactly one root); unique `(organization_id, lower(name))` |
| `access_groups` | `id`, `name`, `description`, audit columns | PK `(organization_id, id)`; unique name |
| `access_group_members` | `group_id`, `member_kind` (`user`\|`role`\|`role_and_subordinates`\|`group`), `member_id` | PK `(organization_id, group_id, member_kind, member_id)` |
| `access_module_defaults` | `module`, `level` | PK `(organization_id, module)`; absent row = `private` |
| `access_sharing_rules` | `id`, `module`, `name`, `source_kind`, `source_id`, `target_kind`, `target_id`, `level` (`read`\|`read_write`\|`read_write_delete`), audit columns | PK `(organization_id, id)`; source/target kind ∈ `role`\|`role_and_subordinates`\|`group`; service limit 50 rules per module |
| `member_access` | `user_id`, `profile_id`, `role_id` | PK `(organization_id, user_id)`; composite FK to `memberships (organization_id, user_id)` cascade; FKs to profile and role `restrict` (a profile/role in use cannot be deleted — §9 transfer flow first) |
| `access_versions` | `version bigint` | PK `organization_id`; bumped in the same transaction by every write to the tables above or to `memberships`/`member_access` |
| `invitations` (existing) | + `profile_id`, `role_id` (nullable, composite FKs `set null`) | accepting an invitation creates the `member_access` row; null → Standard + root role |

Decisions inside the model:
- **Profile permissions are one JSONB document**, validated by a Zod schema in `packages/core/src/access/catalogue.ts` with a `schemaVersion`. Nothing filters by single permission bits in SQL; the profile is always read whole. Unknown keys are rejected on write and dropped on read.
- **Field permissions are rows**, only for non-default values, because the field list per module is customisable (ADR 0011) and a retired field must be removable without rewriting JSON. Deleting a custom field deletes its rows.
- **No per-user permissions** and no permission on a role (the reference has none, spec §1).
- **`memberships.role` stays** for this feature as a compatibility column, kept in sync (`admin` ⇔ profile kind `administrator`) by the access service. Every server check that reads it today (access-paths §1) switches to profile permissions in the enforcement issue; a later ADR drops it.
- **Organisation owner**: the organisation creator is the "Super Admin" of the reference (spec §1): stored as `organizations.owner_user_id` (new nullable column, backfilled from the earliest admin membership). The owner always has the Administrator profile and the root role; neither can be changed, and the owner cannot be removed.
- **Lockout guard**: a write that would leave no member with the Administrator profile is rejected (`ConflictError`).
- **Out of scope** (later ADRs if wanted): territories (spec §6), manual per-record sharing (reference "Share" tool), layout assignment per profile, the other security pages (SSO, audit log…).

### 3. Permission catalogue (profile JSONB)

`catalogue.ts` is the single list of keys; the settings UI renders from it and the engine checks only its keys. It contains **only features our CRM has**; reference rows for features we do not ship (portals, CPQ, AI assistant, extension and developer permissions, forecasts, cadences, visits) are not shown — a toggle that controls nothing is worse than a missing row. When such a feature ships, its keys are added in the same change.

```ts
type ProfilePermissions = {
  schemaVersion: 1;
  modules: Record<ModuleApiName, { view: boolean; create: boolean; edit: boolean; delete: boolean }>;
  // Reports: view, manage, schedule, export; Analytics: view, manage, export; Documents: view, create/associate/edit team folder
  features: { reports: {...}; analytics: {...}; documents: {...}; notes: {...}; attachments: {...} };
  importModules: ModuleApiName[];       // Import Records
  exportModules: ModuleApiName[];       // Export
  email: { send: ModuleApiName[]; mass: ModuleApiName[]; delete: ModuleApiName[] };
  tools: {                               // each a module list unless noted
    massUpdate; massDelete; changeOwner; massTransfer; convert; share; printView; findAndMerge;
    manageViews: boolean; tags: boolean; recordTimeline: boolean; onlyListSubordinates: boolean;
  };
  admin: {                               // administrator-level permissions
    userManagement: boolean;            // users, roles, profiles, groups, data sharing
    moduleCustomization: boolean;       // fields, layouts, modules (ADR 0011)
    manageCurrencies: boolean; customizeHome: boolean; manageAutomation: boolean;
    manageTemplates: boolean; emailSettings: boolean; dataManagement: boolean; // recycle bin purge, import history of others
    viewAllRecords: ModuleApiName[]; modifyAllRecords: ModuleApiName[];
  };
};
```

System profiles: **Administrator** = every key true / every module listed; it is **not editable** (stronger than the reference, which lets basic permissions change: the Administrator profile is our lockout-safe anchor; a "custom administrator" is made by cloning). **Standard** = Administrator minus `admin.*` (all false/empty), minus `Visits`, export of two fewer modules (spec §2.2 diff), print view of one fewer; only `modules.*` and `features.*` are editable on Standard (spec §2.2 banner). Custom profiles are created by cloning an existing profile (spec Q3) and are fully editable.

### 4. Evaluation algorithm

All logic is in `packages/core/src/access/` as pure functions over an **AccessSnapshot** (§5). No function in it touches HTTP or storage.

**4.1 Profile gate** `can(snapshot, module, action)`: Administrator kind → true. Otherwise read the JSONB key; module actions also require `modules[M].view` (no create/edit/delete without view). Child modules (`Notes`, `Attachments`) use `features.notes` / `features.attachments` **and** the parent record rule in 4.3.

**4.2 Field security** `fieldAccess(snapshot, module, field)`: Administrator → `read_write` (fixed, not editable — lockout-safe; open question O3). Otherwise the row or `read_write`. Managed system fields (`Created_By`, `Modified_By`, `Created_Time`, `Modified_Time`, `id`) are never hidden. Required fields of a layout cannot be set `hidden` or `read_only` (rejected on write, as the reference does for mandatory fields).

**4.3 Record access level** `recordLevel(snapshot, module, record)` — the maximum of:
1. `admin.modifyAllRecords` contains M → RWD; `admin.viewAllRecords` contains M → R (Administrator kind → RWD everywhere).
2. Owner: `record.Owner === userId` → RWD.
3. `ownerLevels[M].get(record.Owner)` from the snapshot (precomputed, see below).
4. Module default level.
5. Child modules without own owner semantics (`Notes`, `Attachments`, line items): the parent record's level (note author additionally gets RWD on their own note if parent level ≥ R).

`ownerLevels[M]` — map from owner user id to level, built once per snapshot:
- **Role hierarchy**: every user whose role is a strict descendant of the viewer's role → RWD (hierarchy grants upwards only, never down or sideways; spec §3.2).
- **Peers**: if the viewer's role has `share_with_peers`, every other user in the same role → RWD.
- **Sharing rules** of module M whose target set contains the viewer: every user in the rule's source set → the rule's level. Source/target sets: `role` = users in that role; `role_and_subordinates` = users in that role or any descendant; `group` = resolved group members (§4.4). Access granted to a subordinate by a sharing rule is **not** inherited by their managers (open question O1; narrower is the safe default).
- Levels for the same owner are combined by maximum. Profile still gates the action (4.1), so RWD from hierarchy means "as much as your profile allows".

Every module with an `Owner` field uses this algorithm, including Tasks, Meetings and Calls (the reference lists them with their own default, spec §5.1). Records with an empty `Owner` are visible only through levels 1 and 4.

**4.4 Groups**: members are users, roles, roles-and-subordinates, or other groups. Resolution is breadth-first with a visited set; a write that would create a cycle is rejected, nesting depth ≤ 5.

**4.5 Deny semantics**: no profile permission → `ForbiddenError` (HTTP 403, code `permission_denied`, the screen shows the denied state). Record level below read → `NotFoundError` (404, indistinguishable from a missing record, ADR 0012 §2). Record readable but level or profile too low for the write → 403. Hidden field in a write, filter, sort, group-by or criteria → 403 `field_forbidden`; `read_only` field in a write → 403 unless the value equals the stored value (forms may echo unchanged values). Hidden fields are removed from every read projection (get, list, search, export, timeline/history diffs, merge preview, duplicate groups, kanban cards, report rows).

**4.6 Multi-record operations are atomic**: mass update/delete/change owner/tag, merge, mass restore: every selected record must pass; otherwise the whole request fails with 403 listing the count of refused records (no partial success, no leak of ids the user cannot see — invisible ids count as "not found").

**4.7 Cross-module operations**: convert lead = `tools.convert` incl. Leads + lead RW + `create` on each created target + R on each reused target; merge = `tools.findAndMerge` + RW on the master + RWD on the others; change owner = `tools.changeOwner` + RW, and with `onlyListSubordinates` the new owner must be the viewer or a subordinate (also enforced in the user picker list, `GET /crm/v9/users`).

**4.8 System actors**: automation rules and worker jobs run as the organisation **system actor** (bypass; they act on rule criteria, and record their changes as the rule). Assignment rules may assign to any member. Recorded in history as the rule, not as a user.

### 5. AccessSnapshot, caching and invalidation

`AccessSnapshot = { orgId, userId, version, profileKind, permissions, fieldAccess: Map<module, Map<field, access>>, roleId, ownerLevels: Map<module, Map<userId, level>>, defaults: Map<module, level>, subordinateUserIds: Set }`.

- `requireOrgContext` already reads the membership row. It is extended to one query that also returns `member_access.profile_id`, `role_id` and `access_versions.version` — **no extra round trip per request**. `OrgContext` gains `access: AccessSnapshot`, loaded lazily on first use in the request.
- Snapshot build on cache miss: profile + field rows of the profile + roles + member_access + groups/members + defaults + sharing rules: 7 small queries in one `withOrg` transaction (or one query with `json_agg`, implementer's choice), then pure computation.
- In-process LRU cache keyed `(orgId, userId, version)`, max 2 000 entries, TTL 10 minutes as a backstop. Any permission, role, group, rule, default, member_access or membership write bumps `access_versions.version` in the same transaction, so every process sees the change on its next request (multi-instance safe; no pub/sub needed).
- Record ownership changes do **not** invalidate: `ownerLevels` is keyed by owner user, not by record.
- Changing a role, profile or default takes effect on the next request (reference does a background recalculation, spec Q5/Q8; we need none because nothing is materialised per record).

### 6. Pushing visibility into queries (and the relation to ADR 0012 RLS)

**Decision: tenant isolation stays in RLS/OrgContext (ADR 0012); record visibility, profile and field checks live in the service/query layer, not in RLS.**

Evidence:
1. Records are not in Postgres (access-paths §1, finding 2); RLS cannot see them. A query-layer design is the only one that works now and keeps working after the move.
2. ADR 0012 §2: "RLS separates organizations, not actors"; per-user visibility in RLS would need the user id, the role closure, group closure and rule sets inside SQL policies, re-evaluated per row, and policy changes on every permission edit — harder to test, and it would not give us field security or action checks anyway.
3. Every visibility source reduces to **owner sets** (hierarchy, peers, rules, groups are all "records owned by users in set S") plus a module default. So the predicate is `default ≥ R OR Owner ∈ visibleOwners(M) OR <view-all>` where `visibleOwners` has at most the number of members (licence limit 25 in the reference, spec §1). That is cheap in memory and cheap in SQL.

Mechanics:
- **Fixture now**: `getRecordService(ctx)` builds the service with a `RecordAccessPolicy` derived from the snapshot (`createFixtureRecordService(ctx, { access })`). The policy is applied in the **one candidate-selection step** of the query compiler (`fixture/query.ts`, before sort, pagination, counts and grouping) for `list`, `count`, `summarize`, `search`, kanban, export, report/analytics ports, related lists and duplicate scans. Post-filtering a page is forbidden (it breaks pagination and leaks through counts). `get` applies the same predicate. Writes check `recordLevel` on the stored record.
- **Future SQL store**: the same policy compiles to `organization_id = $org AND (default_ok OR owner_id = ANY($owners::uuid[]))` with index `(organization_id, owner_id)`; one predicate, no join per row, no N+1. If member counts ever make arrays large (> 1 000), switch to a per-version materialised `access_visible_owners(organization_id, version, viewer_id, module, owner_id, level)` table — a decision for the record-storage ADR, not now.
- The policy also carries **projection** (hidden fields removed) and **criteria validation** (hidden fields rejected) so every read path shares one implementation.

### 7. Enforcement points (from `docs/security/access-paths.md`)

Three layers, all required; the UI layer never replaces them:

1. **Route gate** in `operationRoute`/`apiRoute`: each operation declares `(moduleSource, action)` in a static map (`operations.X.permission`); the wrapper calls `can()` before the handler. A test walks every `apps/web/src/app/**/route.ts` and every `"use server"` file and fails if any entry point has no declared permission (or an explicit `public`/`memberOnly` marker with a reason). This keeps the inventory true as routes are added.
2. **Service layer**: `RecordAccessPolicy` inside the record service (record level, field projection, criteria, atomic multi-record checks, cross-module rules) — covers access-paths §2.2, search, timelines, analytics port.
3. **Bypass closures** — each moves behind the engine in the enforcement issue:

| Area (access-paths §) | Rule |
|---|---|
| Tags + recycle bin (2.3) | `tagsBinRoute` uses `getRecordService(ctx)`, no direct `createFixtureRecordService`. Add/remove tag = record RW + `tools.tags`. Tag catalogue create/rename/delete = `admin.moduleCustomization`. Recycle bin lists entries the viewer deleted, all entries with `admin.dataManagement`; restore = original module `delete` permission + was deleter or `dataManagement`; purge/empty = `dataManagement` |
| Import/export (2.4) | wire the existing `deps.authorize` to the engine: export = `exportModules` + visibility-filtered rows + hidden fields dropped; import = `importModules` + `create`; update-by-match also needs RW on each matched record; undo/history of others' imports = `dataManagement` |
| Attachments (2.5) | parent record level: list/download R, upload `features.attachments.create` + R, delete RW on parent or own attachment |
| Customization (2.6) | replace `role !== "admin"` with `admin.moduleCustomization`; field metadata reads drop fields hidden for the viewer |
| Shared views (2.2) | create/patch/delete custom and kanban views = `tools.manageViews` |
| Documents (2.8) | `documentsAccessSource` reads `features.documents.view` |
| Mail (2.9) | keep mailbox-owner rules (ADR 0009); `canReadRecord` calls `recordLevel ≥ R` |
| Chat (2.7) | unchanged (org-wide by design) |
| Members/invitations (2.10) | `requireCurrentAdmin` → `admin.userManagement` |
| Dashboards/reports actions (2.10, 2.11) | `features.reports.view` / `analytics.view`; data through the access-wrapped record port |
| Settings pages (2.11) | the settings layout gates each section by its `admin.*` key server-side (denied page), not only in the UI |
| Worker (2.12) | system actor (§4.8); mail jobs unchanged |
| New user picker `GET /crm/v9/users` | `onlyListSubordinates` limits the list |

### 8. UI gating contract

- **Org layout** loads `ClientPermissions` once per navigation (server, from the snapshot) into a React context; hook `usePermissions()` in `apps/web/src/lib/access/`:
  `{ profile: { id, name, kind }, modules: Record<Module, { view, create, edit, delete, import, export, massUpdate, massDelete, changeOwner, convert, merge, print }>, features, tools: { manageViews, tags, recordTimeline }, admin: { …booleans }, onlyListSubordinates }`. It contains no record data and no other users.
- **Per record**: the detail response gains `$access: "read" | "read_write" | "read_write_delete"`; list rows carry the same field (computed in the policy, no extra query). Edit/delete/clone/convert/change-owner controls use profile ∧ `$access`.
- **Per field**: the module projection (`getModuleProjection`) omits hidden fields and marks `read_only` ones (`FieldViewFlags.readOnly`), so forms, inline edit, filters, column choosers and kanban settings follow automatically.
- **Hidden, not disabled** (reference behaviour): controls without permission are not rendered; a module without `view` disappears from the tab bar and its routes render the denied state; settings sections without their `admin.*` key are absent from the settings navigation.
- Administrators see exactly what they see today (all permissions true), so the existing UI and e2e suites stay as they are.

### 9. Settings screens and write flows (behaviour from the spec; unobserved parts decided here)

Users (role and profile in detail and edit; invitation form gets role + profile), Profiles (list, detail with the catalogue sections, clone, edit, delete), Field permissions (per module, a tab per profile, three radios), Roles (tree with expand/collapse, detail, create/edit/delete), Groups, Data Sharing (module defaults table, sharing rules per module). All writes need `admin.userManagement`; all bump the version.
Decisions for the spec's open questions: new profile = clone of an existing one (Q3); new role needs `Reporting To` (Q4); deleting a role asks for a transfer role for its users and child roles, deleting a profile asks for a replacement profile (Q7); system profiles and the root role cannot be deleted; role change keeps record ownership (Q8); default access options are the four levels for every module (Q9); sharing-rule form = name, module, source kind+id, target kind+id, level (Q6).

### 10. Seeds and migration of existing members (no regression)

Migration `0008` (forward-only, ADR 0001 §7), per existing organisation, in one transaction:
1. Create profiles **Administrator** and **Standard** (catalogue defaults), roles **CEO** (root, `share_with_peers = true`) and **Manager** (child of CEO, `false`) — the reference's seed (spec §8).
2. Module defaults as the reference organisation: `private` for all modules except Products `public_read` (spec §5.1). Emails are governed by ADR 0009, not by this table.
3. **Every existing member** (admin and member alike) → Administrator profile + CEO role; `organizations.owner_user_id` = earliest admin; `memberships.role` = `admin` for all (kept in sync). Pending invitations → Standard + CEO when accepted unless set.
4. `access_versions` row with version 1.

`createOrganization` seeds the same in its transaction (creator = owner, Administrator + CEO). The dev seed (`admin/admin`) and e2e fixtures run as Administrator; e2e additionally seeds a **Standard** user in a **Manager** role for the new permission specs. So every existing screen and test behaves exactly as today until an administrator changes something.

### 11. Test strategy (permission-path matrix)

1. **Engine unit tables** (`packages/core/src/access/*.test.ts`), pure and fast: profile × module × action; field access × read/write/filter/sort; role trees (self, child, grandchild, parent, sibling, peer with/without `share_with_peers`, root); four defaults; each sharing-rule source/target kind; nested groups and cycle rejection; view-all/modify-all; Administrator bypass; empty `Owner`; child-module inheritance; atomic multi-record refusal.
2. **Entry-point registry test** (§7.1): every route and server action declares its permission; a new undeclared route fails CI.
3. **Service matrix** (record service with a Standard/Manager snapshot): for each read path — list, count, summarize, search, kanban, export, related list, timeline, duplicate scan, analytics port — the visible id set is identical, and hidden fields are absent from every payload (aggregate-leak test).
4. **Route matrix** (generated from the registry): for each entry point, allowed actor → 2xx, profile-denied → 403, invisible record → 404.
5. **DB integration**: RLS on all new tables as `crm_app` (cross-tenant indistinguishable from missing), FK/lockout/root/cycle constraints, migration backfill on a copy with admin + member rows.
6. **E2E** (`e2e/access-*.spec.ts`): Standard user — module tab hidden and route denied, create/delete buttons absent, read-only field not editable, hidden field absent in list/detail/form/export; settings screens create role/profile/group/rule and see the effect; Administrator flows unchanged (the existing suite).

### 12. Performance budget

| Item | Budget |
|---|---|
| Extra DB round trips per request on cache hit | 0 (version rides on the membership query) |
| Engine overhead per request on cache hit | ≤ 1 ms p95 |
| Snapshot build on miss (25 members, 50 roles, 20 groups, 50 rules × 19 modules) | ≤ 25 ms p95 including queries |
| List/count/search on the fixture with 10 000 records, Standard user | ≤ 10 % slower than Administrator |
| Future SQL predicate | one `owner_id = ANY(...)` on an `(organization_id, owner_id)` index; no per-row subquery |

The engine issue adds a micro-benchmark test (vitest bench-style, small, single run) for the snapshot build and the list predicate; no machine-heavy benchmark.

### 13. Implementation plan (opened by the CTO after acceptance)

1. **Access data + engine** (platform, high): migration 0008 + Drizzle schema, seeds/backfill, `createOrganization`, `packages/core/src/access` (catalogue, snapshot, evaluation, cache/version), admin service + API for profiles/fields/roles/groups/defaults/rules/member assignment with lockout, root, cycle and transfer rules; tests §11.1, §11.5.
2. **Enforcement across entry points** (platform, high; starts in parallel against the §4/§6 interfaces, merges after 1): route permission map + registry test, `RecordAccessPolicy` in the fixture record service and query compiler, every bypass of §7.3, `$access` on detail/list; tests §11.2–§11.4.
3. **Settings screens** (UI, high — new settings area): Users role/profile, Profiles, Field permissions, Roles, Groups, Data Sharing, invitation form; from the spec inventory.
4. **UI gating** (UI, high — shared shell/list/detail/form components): `usePermissions`, hiding controls, denied states, projection-driven field flags; e2e §11.6.

### Open questions (decided as stated; revisit only with evidence)

- O1 Do managers inherit access granted to their subordinates by sharing rules? Decided **no** (narrower).
- O2 Peers and hierarchy grant RWD subject to profile; the reference may grant RW only. Decided RWD.
- O3 Administrator field permissions fixed `read_write` (the reference shows an Administrator tab with radios; editability unobserved).
- O4 Administrator profile not editable (reference allows basic-permission edits) — deliberate lockout-safety deviation.
- O5 Recycle bin visibility per deleter for non-administrators (reference behaviour unobserved).

## Alternatives considered

- **Visibility in RLS** — rejected (§6 evidence 1–2).
- **Materialised per-record share table** (record × user) — rejected: needs recalculation jobs on every role/rule change (the reference's background recalculation, spec Q5), large for no gain at our member counts; owner-set predicates answer the same question.
- **Permissions as normalised rows** (profile × key) — rejected for module/action keys (always read whole, schema evolves with the catalogue); kept rows only for field permissions (§2).
- **Keep `memberships.role` as the permission source** — rejected: two values cannot express module, field or record rules.

## Consequences

- Every new route or server action must declare its permission or CI fails.
- Record modules must have `Owner` semantics or be declared child modules; a new module without either cannot ship.
- The record-storage ADR must keep an indexed `owner_id` per record table and adopt the §6 predicate.
- Feature D adds settings screens and changes shared components; e2e runs as Administrator stay unchanged by design.
