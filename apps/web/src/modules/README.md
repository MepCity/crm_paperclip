# Module screens

1. Add a module package with a `ModuleScreenDefinition` (see `leads/definition.ts`).
   Keep only rules missing from service metadata here: label overrides, composite
   fields, menu inventory, optional status ribbon, form rules and timeline mapping.
   Fields, layout, views, picklists, business-card field order and users still come
   from the existing record service.
2. Add its definition to `moduleScreens` in `registry.ts`. This single registry
   entry enables the shell links, create menu, page titles and all six routes.
   `tab` controls page URLs; `apiName` controls service requests and list context.
3. Use the shared list, detail and form clients. Route server components validate
   the tab, check organization access and send only serializable route arguments
   across the client boundary. The client resolves presentation callbacks locally.
4. Add focused definition tests and reuse the existing screen tests. Unknown tabs
   reach the existing not-found boundary. Register unfinished modules only when
   their screens are ready; Leads and Contacts are registered.

The small Leads adapters preserve existing component-test entry points. Production
routes use `ModuleRouteClient` and the shared clients directly.
