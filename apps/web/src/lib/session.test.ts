import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readOrgContext: vi.fn(),
  readSession: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@crm/core", () => ({
  NotFoundError: class NotFoundError extends Error {},
  UnauthenticatedError: class UnauthenticatedError extends Error {},
  requireOrgContext: mocks.readOrgContext,
  getSession: mocks.readSession,
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ cookie: "session=test" }) }));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound, redirect: mocks.redirect }));
vi.mock("react", () => ({ cache: <T extends (...args: never[]) => unknown>(fn: T) => fn }));

import { NotFoundError, UnauthenticatedError } from "@crm/core";
import { requireOrgContext } from "./session";

beforeEach(() => vi.clearAllMocks());

it("passes request headers and returns the organization context", async () => {
  const ctx = { orgId: "org", orgSlug: "alpha", orgName: "Alpha", userId: "user", role: "admin" };
  mocks.readOrgContext.mockResolvedValue(ctx);
  expect(await requireOrgContext("alpha")).toBe(ctx);
  expect(mocks.readOrgContext).toHaveBeenCalledWith(expect.any(Headers), "alpha");
  const requestHeaders = mocks.readOrgContext.mock.calls.at(0)?.at(0) as Headers | undefined;
  expect(requestHeaders?.get("cookie")).toBe("session=test");
});

it("renders not found when access is missing", async () => {
  mocks.readOrgContext.mockRejectedValue(new NotFoundError());
  await expect(requireOrgContext("alpha")).rejects.toThrow("NEXT_NOT_FOUND");
  expect(mocks.notFound).toHaveBeenCalledOnce();
});

it("redirects a signed-out visitor to sign in with the organization path", async () => {
  mocks.readOrgContext.mockRejectedValue(new UnauthenticatedError());
  await expect(requireOrgContext("alpha")).rejects.toThrow("NEXT_REDIRECT");
  expect(mocks.redirect).toHaveBeenCalledWith("/sign-in?next=%2Fo%2Falpha");
});
