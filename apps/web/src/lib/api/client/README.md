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
| `useUpdateRecord` | Update; invalidates list, count and the record |
| `useDeleteRecords` | Delete; invalidates list, count and each record |

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
