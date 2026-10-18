import { randomUUID } from "node:crypto";
import { ForbiddenError, ValidationError } from "@crm/core/errors";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { beforeEach, expect, test, vi } from "vitest";
import {
  listRecycleBinAction,
  mutateRecycleBinAction,
} from "@/app/crm/[orgSlug]/settings/recycle-bin/actions";
import { initialBinSearch } from "./contracts";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  service: vi.fn(),
  revalidate: vi.fn(),
  list: vi.fn(),
  restore: vi.fn(),
  purge: vi.fn(),
  empty: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ requireOrgContext: mocks.session }));
vi.mock("@/lib/recycle-bin", () => ({ getRecycleBinService: mocks.service }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ orgId: "test-org", userId: "test-admin", role: "admin" });
  mocks.service.mockReturnValue(mocks);
  mocks.list.mockResolvedValue({ entries: [], total: 0 });
});

test("read reauthorizes and passes supported criteria and paging to the org-bound service", async () => {
  expect(
    await listRecycleBinAction(
      "demo",
      {
        ...initialBinSearch,
        name: "Example",
        module: "Leads",
        deletedBy: "test-admin",
        date: "17.10.2026",
      },
      2,
      30,
    ),
  ).toEqual({ status: "success", entries: [], total: 0 });
  expect(mocks.session).toHaveBeenCalledWith("demo");
  expect(mocks.service).toHaveBeenCalledWith(expect.objectContaining({ orgId: "test-org" }));
  expect(mocks.list).toHaveBeenCalledWith({
    name: "Example",
    module: "Leads",
    deletedByContains: "test-admin",
    deletedOn: { date: "2026-10-17", time: "01:00" },
    page: 2,
    perPage: 30,
  });
});

test("date-only searches omit time; empty criteria do not filter", async () => {
  await listRecycleBinAction("demo", { ...initialBinSearch, date: "29.02.2028", time: "" }, 1, 30);
  expect(mocks.list).toHaveBeenLastCalledWith(
    expect.objectContaining({
      deletedOn: { date: "2028-02-29", time: undefined },
    }),
  );
  await listRecycleBinAction("demo", initialBinSearch, 1, 30);
  expect(mocks.list).toHaveBeenLastCalledWith(
    expect.objectContaining({
      deletedOn: undefined,
      deletedByContains: undefined,
    }),
  );
});

test("invalid calendar dates and times reach service validation and retain field errors", async () => {
  for (const values of [
    { date: "31.02.2026", time: "01:00" },
    { date: "17.10.2026", time: "25:00" },
  ]) {
    mocks.list.mockRejectedValueOnce(
      new ValidationError({ deletedOn: ["Invalid deletion date or time."] }),
    );
    expect(
      await listRecycleBinAction("demo", { ...initialBinSearch, ...values }, 1, 30),
    ).toMatchObject({
      status: "error",
      fieldErrors: { deletedOn: ["Invalid deletion date or time."] },
    });
    expect(mocks.list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        deletedOn: { date: values.date.split(".").reverse().join("-"), time: values.time },
      }),
    );
  }
});

test("malformed display dates and a time without a date fail explicitly", async () => {
  for (const search of [
    { ...initialBinSearch, date: "2026-10-17" },
    { ...initialBinSearch, time: "02:00" },
  ])
    expect((await listRecycleBinAction("demo", search, 1, 30)).status).toBe("error");
  expect(mocks.list).not.toHaveBeenCalled();
});

test("empty selected actions never call purge/restore; explicit empty uses service.empty", async () => {
  for (const action of ["delete", "restore"] as const)
    expect((await mutateRecycleBinAction("demo", action, [])).status).toBe("error");
  expect(mocks.purge).not.toHaveBeenCalled();
  expect(mocks.restore).not.toHaveBeenCalled();
  await mutateRecycleBinAction("demo", "empty", []);
  expect(mocks.empty).toHaveBeenCalledOnce();
  expect(mocks.empty).toHaveBeenCalledWith();
});

test("mutations pass entry IDs and invalidate organization routes only after success", async () => {
  await mutateRecycleBinAction("demo", "restore", ["entry"]);
  expect(mocks.restore).toHaveBeenCalledWith(["entry"]);
  expect(mocks.revalidate).toHaveBeenCalledWith("/crm/demo", "layout");
  mocks.purge.mockRejectedValue(new ForbiddenError());
  expect((await mutateRecycleBinAction("demo", "delete", ["entry"])).status).toBe("error");
  expect(mocks.revalidate).toHaveBeenCalledTimes(1);
});

test("service field errors survive transport and authentication failures never call the service", async () => {
  mocks.restore.mockRejectedValue(new ValidationError({ Last_Name: ["Already in use."] }));
  expect(await mutateRecycleBinAction("demo", "restore", ["entry"])).toMatchObject({
    status: "error",
    fieldErrors: { Last_Name: ["Already in use."] },
  });
  mocks.service.mockClear();
  mocks.session.mockRejectedValue(new Error("redirect"));
  await expect(listRecycleBinAction("demo", initialBinSearch, 1, 30)).rejects.toThrow("redirect");
  await expect(mutateRecycleBinAction("demo", "empty", [])).rejects.toThrow("redirect");
  expect(mocks.service).not.toHaveBeenCalled();
});

test("real service validation rejects invalid dates and times through the action", async () => {
  const service = createFixtureRecordService({
    orgId: randomUUID(),
    orgSlug: "demo",
    orgName: "Demo",
    userId: "test-admin",
    role: "admin",
  });
  mocks.service.mockReturnValue(service.recycleBin);
  for (const values of [
    { date: "31.02.2026", time: "01:00" },
    { date: "17.10.2026", time: "25:00" },
  ]) {
    expect(
      await listRecycleBinAction("demo", { ...initialBinSearch, ...values }, 1, 30),
    ).toMatchObject({
      status: "error",
      fieldErrors: { deletedOn: expect.any(Array) },
    });
  }
});
