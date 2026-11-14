import { describe, expect, it } from "vitest";
import type { AccessData } from "../access";
import { buildAccessSnapshot, standardPermissions } from "../access";
import { ForbiddenError, NotFoundError } from "../errors";
import type { RecordService } from "./contract";
import { assertRecordEditable } from "./record-guard";

const snapshot = (userId: string) =>
  buildAccessSnapshot({
    orgId: "o",
    userId,
    version: 1,
    profile: { id: "p", kind: "standard", permissions: standardPermissions() },
    fieldRows: [],
    roles: [{ id: "r", name: "R", parentRoleId: null, shareWithPeers: false }],
    members: [{ userId, roleId: "r", profileId: "p" }],
    groupMembers: [],
    defaults: [],
    rules: [],
  } satisfies AccessData);

const serviceReturning = (owner: string) =>
  ({
    get: async () => ({ id: "1", fields: { Owner: owner } }),
  }) as unknown as RecordService;

describe("assertRecordEditable (lead 10)", () => {
  it("allows the owner", async () => {
    await expect(
      assertRecordEditable(
        { accessSnapshot: snapshot("me"), recordService: serviceReturning("me") },
        "Leads",
        "1",
      ),
    ).resolves.toBeUndefined();
  });
  it("refuses a record owned by someone the caller cannot edit", async () => {
    await expect(
      assertRecordEditable(
        { accessSnapshot: snapshot("me"), recordService: serviceReturning("other") },
        "Leads",
        "1",
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
  it("propagates not-found from the access-bound record service", async () => {
    const recordService = {
      get: async () => {
        throw new NotFoundError("Record not found.");
      },
    } as unknown as RecordService;
    await expect(
      assertRecordEditable({ accessSnapshot: snapshot("me"), recordService }, "Leads", "1"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
