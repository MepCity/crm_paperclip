# ADR 0004 — Request shape: browser requests that resemble the reference CRM

- Status: Accepted (§5 holds interim shapes; the deviations listed at the end await the board)
- Date: 2026-10-04
- Decider: CTO
- Issue: MEP-69

## Context

Board decision, 2026-10-04: the frontend's network requests (endpoint path, method, query parameters, payload shape) should resemble the reference CRM's.

ADR 0003 cannot meet that. Its pages are server components that call `@crm/core` directly and its mutations are server actions, so the browser sends no data request at all.

Evidence: the **Data needs** sections of `research/specs/list-views.md`, `record-detail.md`, `app-shell.md` and `leads-fields-and-layout.md`.

Observed:

- The shell renders first; the screen then loads its data with JSON requests from the browser.
- Paths: `/crm/v<version>/<Module>…` for records, `/crm/v<version>/settings/<resource>` for metadata, `/crm/v<version>/users`. The version differs per endpoint (v2 to v10). Shell bootstrap uses older `/crm/<org>/<Name>.do` endpoints.
- Query names are snake_case: `page`, `per_page`, `cvid`, `fields`, `module`, `sort_by`, `sort_order`.
- A response is an object with one array named after the resource (`data`, `custom_views`, `fields`, `layouts`, `modules`, `users`) and, for pages, `info`.
- Paging: `info{per_page, count, page, sort_by, sort_order, more_records}`. The total comes from a separate request that returns `{count}`.
- An empty collection is `204` with no body (the list of an empty view, notes, view filters).
- The record list and its count are `POST` requests although they only read.
- One error body was captured: `404` with the keys `code`, `details`, `message`, `status`, for an unknown record path (capture `list-main`).

Not observed, because the reference CRM is read-only for us: any record create, update or delete request; the body of a validation, permission or conflict error; request headers; how an ad-hoc filter, a search text or a changed sort travels. Preference writes were seen as method and path only (`PUT`, blocked by the capture tool).

The record service port (MEP-68) is independent of storage, so this decision does not wait for ADR 0002.

## Decision

### 1. Where screens get their data

- **Screens with a counterpart in the reference CRM** (module list, record detail, forms, related lists; later modules alike) render in the browser. The page is a server component that authorizes (`requireOrgContext`) and renders the shell plus the screen's client component. Records, module metadata and views are fetched by the browser from route handlers. Nothing of it is read during server rendering, and record mutations are requests to route handlers, not server actions.
- **The shell and our own screens** (sign-in, organization, members, settings without a reference counterpart) keep ADR 0003 §3 and §4: server components and server actions.

### 2. Paths

- A route handler's path is the observed path, version segment included: `/crm/v2.2/Leads/bulk` is served by `app/crm/v2.2/[module]/bulk/route.ts`. The version is a label, not a compatibility promise. An endpoint we need but never observed takes the version of the nearest observed endpoint of the same resource.
- The module segment is the module API name. Handlers are generic over it (ADR 0001 §5.1 and §5.6); no handler is written for one module.
- Pages move from `/o/[orgSlug]/…` to `/crm/[orgSlug]/…`. The rest of a page path follows the reference: `tab/<Module>/list`, `tab/<Module>/custom-view/<viewId>/list`, `tab/<Module>/create`, `tab/<Module>/<recordId>`. Organization slugs of the form `v<digits>` or `v<digits>.<digits>` are reserved.
- The older `.do` bootstrap endpoints are not reproduced (deviation 1).

### 3. Organization and authentication

- The session cookie authenticates. Without a session the handler answers `401` with an error body and no redirect; the browser layer sends the user to sign-in.
- The organization slug travels in the request header `X-CRM-ORG`. The handler passes it to `requireOrgContext`. It is explicit per request, like the URL segment in ADR 0001 §3, and never session state. A missing header is `400`; an unknown organization or a non-member is `404`.
- Every request that is not `GET` must carry an `Origin` equal to the app's own origin, otherwise `403`. Together with the required header this stops cross-site requests. No CORS headers are sent. Responses are `Cache-Control: no-store`.

### 4. Wire format

1. Key names and nesting come from the evidence: the Data needs tables and, for metadata resources, the metadata export (it is the output of these endpoints). Field API names are used verbatim. Where an observed key exists, no other name is invented. A key of our own is listed in the codec's README.
2. Paging uses `page` and `per_page`; the page body carries `info` as observed, with `count` the number of items in this page. The total is the separate count request.
3. An empty collection is `204` with no body.
4. The browser sends the reference's parameter names for what our service acts on. Parameters that mean nothing in our system are not sent (deviation 2). Handlers ignore unknown query parameters.

Mapping of the record service port:

| Port method | Request | Response |
| --- | --- | --- |
| `getModule` | `GET /crm/v2.2/settings/modules/{module}`, `GET /crm/v2.2/settings/fields?module=`, `GET /crm/v2.1/settings/layouts?module=` | `modules[]`, `fields[]`, `layouts[]{sections[]}` |
| `listViews` | `GET /crm/v9/settings/custom_views?module=&page=&per_page=` | `custom_views[]`, `info` |
| `getView` | `GET /crm/v9/settings/custom_views/{viewId}?module=` | `custom_views[]` with one item: `criteria`, `fields[]`, `sort_by`, `sort_order` |
| `list` | `POST /crm/v2.2/{module}/bulk?cvid=&page=&per_page=&fields=` | `200` `data[]`, `info`; `204` when empty |
| `count` | `POST /crm/v2.2/{module}/actions/count?cvid=` | `{count}` |
| `get` | `GET /crm/v2.2/{module}/{recordId}` | `data[]` with one item |
| `create`, `update`, `delete` | not observed, see §5 | |

User names for owner fields come from `GET /crm/v9/users?type=&page=&per_page=` (`users[]`, `info`).

Interim, because the transport was not observed: a changed sort is sent as `sort_by` and `sort_order` in the query (the names appear in `info` and on the notes request); ad-hoc filters and a search text are sent as a JSON body on `bulk` and `count`, with filters in the criteria shape of saved views (`comparator`, `field`, `value`; `group_operator`, `group[]`).

### 5. Writes and errors

Decided, whatever later evidence shows:

- Record writes are browser requests to route handlers on the record paths. Each handler calls the port, which is the one write path of ADR 0001 §5.2.
- The wire shape of write requests, write responses and error bodies exists only in the codec (§6). Screens see the port: `RecordData`, and `AppError` subclasses whose `fieldErrors` are keyed by field API name.
- The codec carries every `AppError` subclass across the wire without loss, including several field errors at once.

Observed: an error body is `{"code", "details", "message", "status"}`, and an unknown record is `404`. Every error we send uses these four keys.

Interim shapes. Basis: analogy with the observed read envelope and general knowledge of the reference CRM's public API conventions. Nobody has verified them.

- `POST /crm/v2.2/{module}` creates, `PUT /crm/v2.2/{module}/{recordId}` updates, `DELETE /crm/v2.2/{module}?ids=` deletes. The request body is `{"data": [{<field API name>: <value>}]}`.
- Errors other than the observed one: status `400` validation, `401` unauthenticated, `403` forbidden, `409` conflict; an unexpected failure is `500` with empty `details`. The values of `code` and the layout of `details` for field errors are ours.

They become final when evidence exists (open question 1). Until Phase 6 publishes the API, our own browser layer is the only consumer, so a change costs the codec and its tests.

### 6. Code layout

```
apps/web/src/app/crm/v<version>/…/route.ts   thin handlers
apps/web/src/lib/api/wire/                   wire types, codec, one operation per endpoint
apps/web/src/lib/api/server.ts               handler wrapper: session, organization, origin, error body, 204
apps/web/src/lib/api/client/                 fetch wrapper, HTTP record service, query hooks
```

- `wire/` is free of framework and database imports and is shared by server and browser. An operation takes a decoded request and a `RecordService` and returns the wire response; a route handler is the wrapper plus one operation.
- The browser's HTTP record service implements the `RecordService` port over `fetch` and the codec. Screens and components never call `fetch` and never build an API path; they use the hooks in `client/`. Component tests pass the fixture service.
- **TanStack Query** is the client cache (deduplication, keeping the previous page while the next loads, invalidation after a write, cancellation). It is imported only in `lib/api/client`. This replaces "no client-side data-fetching library" in ADR 0003 §3 for these screens.
- Handlers hold no business logic and no SQL (ADR 0001 §2). The port gains one optional member, `ListQuery.fields`: the column projection the reference sends as `fields` on the list request. Without it every field is returned.

Verification:

- The record service contract suite (MEP-68) runs against the HTTP record service connected to the operations in process. It proves that the wire round trip keeps the port's behaviour.
- Each handler group has an integration test for session, organization header, origin check and tenant isolation.
- The end-to-end test of each reference-backed screen records the browser's requests and compares method, path and query names with the table in §4.

### 7. Relation to earlier ADRs

- ADR 0001 §5.6 planned the REST API as a thin layer over the services. This is that layer, built from Module 1 on. API keys, rate limits, a versioning promise and webhooks stay in Phase 6.
- ADR 0001 §2 and §3, ADR 0003 §5: `/o/[orgSlug]/…` becomes `/crm/[orgSlug]/…`.
- ADR 0003 §3 and §4 no longer apply to reference-backed screens. They stay in force for the shell and our own screens.
- ADR 0002 is independent: handlers call the port, whichever adapter is behind it.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Keep server components and server actions; add the REST layer in Phase 6 | The browser sends no data request, against the board decision. |
| Read on the server for the first render, then fetch from the browser | The first load shows no data request; two read paths to keep equal. The reference shows the shell first, then the data. |
| An API of our own design (own REST naming, RPC, GraphQL) | The board asks for resemblance; it adds a second naming scheme beside the field API names. |
| One version prefix for every endpoint | Differs from every observed path and gains nothing. |
| Organization in the API path (`/crm/<org>/v2.2/…`) | Changes every path. A header keeps the observed paths. |
| Active organization stored in the session | Hidden state; two tabs with different organizations break (ADR 0001 §3). |
| Reproduce the `.do` bootstrap endpoints | Their response shapes are mostly missing from the captures and they carry product-internal bootstrap groups; the shell already has this data on the server. |
| SWR or a hand-written cache | Weaker invalidation and mutation tools; a hand-written cache is code we would have to test ourselves. |

## Consequences

- The network panel of a record screen resembles the reference's, and a test checks it.
- First paint is the shell; the data follows. Loading and error states are the screen's job.
- More client code, and one more library on every record screen.
- Two patterns live side by side. The rule is the reference counterpart: with one, HTTP and hooks; without one, server components and server actions.
- An HTTP surface exists from Module 1 on. Each handler enforces session and organization; authorization stays in the services.
- The mixed version labels look arbitrary. The operation list in `wire/` is the single place that names them.

## Deviations from the reference (await the board)

1. The `.do` bootstrap endpoints are not reproduced; the shell data is rendered on the server.
2. Parameters without meaning in our system are not sent (`approved`, `converted`, `formatted_currency`, `home_converted_currency`, `on_demand_properties`, `include…`).
3. The organization segment of a page path is our slug, not the reference's identifier format.

## Open questions

1. Which evidence source settles the write shapes and the error details (§5)? The reference CRM cannot be written to. Candidates: its public developer documentation, a network record the board makes itself, or keeping our interim design.
2. Request header names are not in the captures. `X-CRM-ORG` is our choice; only `server.ts` and the fetch wrapper know it.
3. How do an ad-hoc filter, a search text and a changed sort travel in the reference (§4, interim)?
4. Which value does `info.sort_by` carry when neither the request nor the view sets a sort? The observed default view returns strings. Until known we send `null`.
