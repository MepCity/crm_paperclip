# Access control engine (ADR 0017)

- `catalogue.ts` — permission keys (Zod, `schemaVersion` 1), system profile defaults.
- `types.ts` — `AccessSnapshot`, levels, `ClientPermissions`.
- `evaluate.ts` — pure `can`, `fieldAccess`, `recordLevel`, `visibleOwnerIds`, `buildAccessSnapshot`.
- `groups.ts` — group resolution, cycle and depth (<= 5) checks.
- `store.ts` / `context.ts` — snapshot loader and LRU cache keyed by `(orgId, userId, version)`; `OrgContext.accessVersion` rides on the `requireOrgContext` membership query. Use `getAccessSnapshot(ctx)`.
- `admin.ts` — settings services (profiles, field permissions, roles, groups, defaults, sharing rules, member assignment). Every write needs `admin.userManagement` and bumps `access_versions` in the same transaction.
- Denials: `ForbiddenError(undefined, "permission_denied" | "field_forbidden")`.
