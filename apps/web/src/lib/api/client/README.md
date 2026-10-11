# Browser API client

Screens that load CRM data in the browser use this folder only. Route paths and
`fetch` stay here; components call the hooks below.

## Setup

Mount `ApiProvider` once in the organization layout, not on every screen. The
query cache and each adapter's module metadata live for as long as that provider
stays mounted. Tests may pass `service` from
`createClientRecordService(fixture, { listUsers })` instead of HTTP.

```tsx
import { ApiProvider } from "@/lib/api/client/provider";
import { useRecordList } from "@/lib/api/client/hooks";

export function OrgCrmLayout({
  orgSlug,
  children,
}: {
  orgSlug: string;
  children: React.ReactNode;
}) {
  return <ApiProvider orgSlug={orgSlug}>{children}</ApiProvider>;
}

export function LeadsListScreen() {
  const list = useRecordList("Leads", { viewId: "all", page: 1, perPage: 10 });
  // …
}
```

## Hooks

| Hook | Purpose |
| --- | --- |
| `useModule` | Module metadata (fields and layout) |
| `useViews` | View summaries (`id`, `name`, flags); use `useView` for the full definition |
| `useView` | One view definition |
| `useRecordList` | Paginated list; keeps the previous page while the next loads |
| `useRecordCount` | Total count for a view and restrictions |
| `useRecord` | Single record |
| `useUsers` | Organization members for owner display |
| `useCreateRecord` | Create; invalidates list, count and the new record |
| `useUpdateRecord` | Update; writes the response into the record cache, cancels in-flight record reads, invalidates list and count (not the record query) |
| `useDeleteRecords` | Delete; invalidates list, count and each record |
| `useMassUpdate` | Update one eligible field; invalidates list, count and each selected record |
| `useChangeOwner` | Transfer ownership; invalidates list, count and each selected record |

## Rules

- Do not import `@tanstack/react-query`, call `fetch`, or build `/crm/…` paths
  outside this folder (except `lib/api/server.ts` for handlers).
- The organization travels in the `X-CRM-ORG` header via `apiFetch`; it is not
  stored in client state beyond `ApiProvider`'s slug.

## Caching and retries

- Module metadata (module definition, fields, layout) is fetched once per adapter
  instance. `getModule`, `list`, `get`, `create`, and `update` share that load;
  concurrent calls on the same instance share a single in-flight load. A load
  that ends in error is not cached.
- There is no refresh path yet: a full page load creates a new adapter instance.
  Refresh behaviour will be decided when the customization module lands.
- `AppError` and `UnexpectedApiError` with `status < 500` are not retried. Other
  query failures retry at most three times. Write requests are not retried.

## Documented writes and batch hooks

Write paths and envelopes follow ADR 0004 §5 and A11 of
`research/specs/leads-write-behaviour.md`. Create/update decode `details.id` from
the SUCCESS result, then fetch the full record. Update does not send body `id`.
Delete uses record DELETE for one ID and POST `actions/mass_delete` for multiple
IDs; an empty batch is rejected by the service. `massUpdate` posts `{data:[input],ids}`
to `actions/mass_update`; `changeOwner` posts `{ids,owner:{id}}` to
`actions/change_owner`, even for one record. No trigger/notification/related module,
view-wide or scheduler parameters are sent.

`useMassUpdate`, `useChangeOwner` and `useDeleteRecords` invalidate module list/count
queries and every selected record query after success. On failure they preserve
cache contents. Error decoding uses the HTTP status and code; body status is a
string. A 400 DUPLICATE_DATA restores ConflictError, and validation maps retain
all field messages. Remaining Interim choices are listed in ADR 0004 §5.

`useHomeCurrency()` reads the organization home currency through `getHomeCurrency`, cached under `apiKeys.homeCurrency(orgSlug)` inside the organization provider.
