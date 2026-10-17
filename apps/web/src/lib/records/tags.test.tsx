import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { createFixtureTagCatalog, TagCatalogProvider, useModuleTags } from "./tags";

afterEach(cleanup);
test("fixtures isolate modules and return fresh tag objects", async () => {
  const client = createFixtureTagCatalog();
  const leads = await client.listTags("Leads");
  expect(leads).toHaveLength(3);
  expect((await client.listTags("Contacts"))[0]?.id).not.toBe(leads[0]?.id);
  if (leads[0]) leads[0].name = "Changed";
  expect((await client.listTags("Leads"))[0]?.name).toBe("Follow up");
});
test("hook exposes loading, populated and empty catalogs", async () => {
  const { result, rerender } = renderHook(({ module }) => useModuleTags(module), {
    initialProps: { module: "Leads" as "Leads" | "Contacts" },
    wrapper: ({ children }) => <TagCatalogProvider client={client}>{children}</TagCatalogProvider>,
  });
  expect(result.current.status).toBe("loading");
  await waitFor(() => expect(result.current.tags).toHaveLength(1));
  rerender({ module: "Contacts" });
  expect(result.current).toEqual({ status: "loading", tags: [] });
  await waitFor(() => expect(result.current).toMatchObject({ status: "ready", tags: [] }));
});
const client = createFixtureTagCatalog({ Leads: [{ id: "sample", name: "Sample", color: null }] });
test("hook exposes rejection and ignores an obsolete module response", async () => {
  let finish: (tags: []) => void = () => {};
  const listTags = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<[]>((resolve) => {
          finish = resolve;
        }),
    )
    .mockRejectedValue(new Error("Unavailable"));
  const port = { listTags };
  const { result, rerender } = renderHook(({ module }) => useModuleTags(module), {
    initialProps: { module: "Leads" as "Leads" | "Deals" },
    wrapper: ({ children }) => <TagCatalogProvider client={port}>{children}</TagCatalogProvider>,
  });
  await waitFor(() => expect(listTags).toHaveBeenCalledOnce());
  rerender({ module: "Deals" });
  await waitFor(() => expect(result.current.status).toBe("error"));
  finish([]);
  await waitFor(() => expect(result.current).toMatchObject({ status: "error", tags: [] }));
});
