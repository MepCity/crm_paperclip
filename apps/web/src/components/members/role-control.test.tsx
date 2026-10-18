import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { type ChangeRoleAction, RoleControl } from "./role-control";
import type { MemberRole } from "./roles";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  router.push.mockReset();
  router.replace.mockReset();
  router.refresh.mockReset();
});

const adminRole: MemberRole = "admin";
const memberRole: MemberRole = "member";

test("shows a select named Role for <name> with the current role", () => {
  const { rerender } = render(
    <RoleControl
      userId="user-1"
      name="Ada Lovelace"
      role={adminRole}
      onChangeRole={vi.fn()}
      report={vi.fn()}
    />,
  );

  const adminTrigger = screen.getByRole("button", { name: /Role for Ada Lovelace/ });
  expect(adminTrigger.textContent).toContain("Admin");

  rerender(
    <RoleControl
      userId="user-1"
      name="Ada Lovelace"
      role={memberRole}
      onChangeRole={vi.fn()}
      report={vi.fn()}
    />,
  );

  const memberTrigger = screen.getByRole("button", { name: /Role for Ada Lovelace/ });
  expect(memberTrigger.textContent).toContain("Member");
});

test("choosing the other role calls report(null) then onChangeRole with the new role and refreshes on success", async () => {
  const calls: string[] = [];
  const report = vi.fn((message: string | null) => {
    calls.push(`report:${message}`);
  });
  const onChangeRole: ChangeRoleAction = vi.fn(async (userId, _previous, formData) => {
    calls.push(`onChangeRole:${userId}:${formData.get("role")}`);
    return { status: "success" as const };
  });
  const user = userEvent.setup();

  render(
    <RoleControl
      userId="user-1"
      name="Ada Lovelace"
      role={adminRole}
      onChangeRole={onChangeRole}
      report={report}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Role for Ada Lovelace/ }));
  await user.click(screen.getByRole("option", { name: "Member" }));

  await waitFor(() => expect(onChangeRole).toHaveBeenCalledTimes(1));
  expect(calls[0]).toBe("report:null");
  expect(calls[1]).toBe("onChangeRole:user-1:member");
  expect(router.refresh).toHaveBeenCalledTimes(1);
  expect(report).toHaveBeenCalledTimes(1);
});

test("reports error message and does not refresh when onChangeRole returns an error", async () => {
  const calls: string[] = [];
  const report = vi.fn((message: string | null) => {
    calls.push(`report:${message}`);
  });
  const onChangeRole: ChangeRoleAction = vi.fn(async () => {
    calls.push("onChangeRole");
    return { status: "error" as const, message: "Cannot change role." };
  });
  const user = userEvent.setup();

  render(
    <RoleControl
      userId="user-1"
      name="Ada Lovelace"
      role={adminRole}
      onChangeRole={onChangeRole}
      report={report}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Role for Ada Lovelace/ }));
  await user.click(screen.getByRole("option", { name: "Member" }));

  await waitFor(() => expect(onChangeRole).toHaveBeenCalledTimes(1));
  expect(calls).toEqual(["report:null", "onChangeRole", "report:Cannot change role."]);
  expect(router.refresh).not.toHaveBeenCalled();
});

test("choosing the current role again does nothing", async () => {
  const report = vi.fn();
  const onChangeRole: ChangeRoleAction = vi.fn();
  const user = userEvent.setup();

  render(
    <RoleControl
      userId="user-1"
      name="Ada Lovelace"
      role={adminRole}
      onChangeRole={onChangeRole}
      report={report}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Role for Ada Lovelace/ }));
  await user.click(screen.getByRole("option", { name: "Admin" }));

  expect(report).not.toHaveBeenCalled();
  expect(onChangeRole).not.toHaveBeenCalled();
  expect(router.refresh).not.toHaveBeenCalled();
});
