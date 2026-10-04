# Browser API client

Screens that load CRM data in the browser use this folder only. Route paths and
`fetch` stay here; components call the hooks below.

## Setup

Wrap the screen tree in `ApiProvider` with the active organization slug. Tests
may pass `service` with the fixture-backed `RecordService` instead of HTTP.

```tsx
import { ApiProvider } from "@/lib/api/client/provider";
import { useRecordList } from "@/lib/api/client/hooks";

export function LeadsListScreen({ orgSlug }: { orgSlug: string }) {
  return (
    <ApiProvider orgSlug={orgSlug}>
      <LeadsTable />
    </ApiProvider>
  );
}
```

## Hooks

| Hook | Purpose |
| --- | --- |
| `useModule` | Module metadata (fields and layout) |
| `useViews` | View inventory for a module |
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
