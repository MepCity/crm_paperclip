import { NotFoundError, ValidationError } from "@crm/core/errors";
import { describe, expect, it, vi } from "vitest";
import { createHttpDocumentsPort } from "./http-port";

const row = {
  id: "i1",
  name: "a.pdf",
  kind: "file",
  uploadedBy: "U",
  modifiedBy: "U",
  modifiedAt: "2026-01-01T00:00:00Z",
  parentId: "f1",
};

describe("createHttpDocumentsPort", () => {
  it("maps list responses to port DTOs and builds the request paths", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        data: [{ id: "f1", name: "Team", section: "team", locked: false }],
      })
      .mockResolvedValueOnce({ data: [row] });
    const port = createHttpDocumentsPort("acme", fetcher);
    expect(await port.listFolders()).toEqual([
      { id: "f1", name: "Team", section: "team", locked: false },
    ]);
    expect(await port.listItems("f 1", { field: "modifiedAt", direction: "asc" })).toEqual([row]);
    expect(fetcher.mock.calls.map((c) => c[0])).toEqual([
      "/crm/v2.2/documents/folders",
      "/crm/v2.2/documents/folders/f%201/items?sort_by=modifiedAt&sort_order=asc",
    ]);
  });

  it("getItem returns the item, undefined on 404 and throws other errors", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ data: [row] })
      .mockRejectedValueOnce(new NotFoundError())
      .mockRejectedValueOnce(new ValidationError({ id: ["bad"] }));
    const port = createHttpDocumentsPort("acme", fetcher);
    expect(await port.getItem("i1")).toEqual(row);
    expect(await port.getItem("x")).toBeUndefined();
    await expect(port.getItem("y")).rejects.toBeInstanceOf(ValidationError);
  });
});
