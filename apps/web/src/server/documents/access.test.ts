import type { OrgContext } from "@crm/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { canReadDocuments, documentsAccessSource } from "./access";

const as = (role: string) => ({ orgId: "o", userId: "u", role }) as unknown as OrgContext;

describe("canReadDocuments", () => {
  afterEach(() => vi.restoreAllMocks());

  it("admin is always enabled and never consults the source", async () => {
    const spy = vi.spyOn(documentsAccessSource, "documentsEnabled").mockResolvedValue(false);
    expect(await canReadDocuments(as("admin"))).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it("member follows the source", async () => {
    const spy = vi.spyOn(documentsAccessSource, "documentsEnabled");
    spy.mockResolvedValue(true);
    expect(await canReadDocuments(as("member"))).toBe(true);
    spy.mockResolvedValue(false);
    expect(await canReadDocuments(as("member"))).toBe(false);
    spy.mockResolvedValue("yes" as never);
    expect(await canReadDocuments(as("member"))).toBe(false);
  });

  it("any other role is denied without consulting the source", async () => {
    const spy = vi.spyOn(documentsAccessSource, "documentsEnabled");
    expect(await canReadDocuments(as("guest"))).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});
