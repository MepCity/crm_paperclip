import { ForbiddenError, ValidationError } from "@crm/core/errors";
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
        deletedByOperator: "is",
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
    deletedBy: "test-admin",
    page: 2,
    perPage: 30,
  });
});

test("unsupported date/time and actor operators return explicit errors without broadening a query", async () => {
  for (const search of [
    { ...initialBinSearch, date: "17.10.2026" },
    { ...initialBinSearch, time: "02:00" },
    { ...initialBinSearch, deletedBy: "test" },
  ]) {
    expect((await listRecycleBinAction("demo", search, 1, 30)).status).toBe("error");
  }
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
