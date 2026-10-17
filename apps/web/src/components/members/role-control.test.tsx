import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import type { ActionState } from "@/lib/action";
import { render } from "@/test/render";
import { type ChangeRoleAction, RoleControl } from "./role-control";
import type { MemberRole } from "./roles";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("renders the current role and accessible label", () => {
  const currentRole: MemberRole = "admin";
  render(
    <RoleControl
      userId="user-1"
      name="Ada Lovelace"
      role={currentRole}
      onChangeRole={vi.fn()}
      report={vi.fn()}
    />,
  );

  const trigger = screen.getByRole("button", { name: /Role for Ada Lovelace/ });
  expect(trigger.textContent).toContain("Admin");
});

test("renders with member role", () => {
  const currentRole: MemberRole = "member";
  render(
    <RoleControl
      userId="user-2"
      name="Grace Hopper"
      role={currentRole}
      onChangeRole={vi.fn()}
      report={vi.fn()}
    />,
  );

  const trigger = screen.getByRole("button", { name: /Role for Grace Hopper/ });
  expect(trigger.textContent).toContain("Member");
});

test("selecting the same role does not invoke onChangeRole or clear error", async () => {
  const currentRole: MemberRole = "admin";
  const onChangeRole: ChangeRoleAction = vi.fn();
  const report = vi.fn();
  const user = userEvent.setup();

  render(
    <RoleControl
      userId="user-1"
      name="Ada Lovelace"
      role={currentRole}
      onChangeRole={onChangeRole}
      report={report}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Role for Ada Lovelace/ }));
  await user.click(screen.getByRole("option", { name: "Admin" }));

  expect(onChangeRole).not.toHaveBeenCalled();
  expect(report).not.toHaveBeenCalled();
});

test("changing role invokes onChangeRole with formData and refreshes router on success", async () => {
  const initialRole: MemberRole = "member";
  const onChangeRole: ChangeRoleAction = vi.fn(
    async (_userId: string, _prev: ActionState, _data: FormData): Promise<ActionState> => ({
      status: "success",
    }),
  );
  const report = vi.fn();
  const user = userEvent.setup();

  render(
    <RoleControl
      userId="user-1"
      name="Ada Lovelace"
      role={initialRole}
      onChangeRole={onChangeRole}
      report={report}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Role for Ada Lovelace/ }));
  await user.click(screen.getByRole("option", { name: "Admin" }));

  await waitFor(() => expect(onChangeRole).toHaveBeenCalledTimes(1));
  expect(report).toHaveBeenCalledWith(null);
  expect(onChangeRole).toHaveBeenCalledWith("user-1", { status: "idle" }, expect.any(FormData));
  const sentFormData = (onChangeRole as unknown as { mock: { calls: unknown[][] } }).mock
    .calls[0]?.[2] as FormData;
  expect(sentFormData.get("role")).toBe("admin");
  expect(refreshMock).toHaveBeenCalledTimes(1);
});

test("reports error when onChangeRole returns an error result", async () => {
  const currentRole: MemberRole = "admin";
  const onChangeRole: ChangeRoleAction = vi.fn(
    async (): Promise<ActionState> => ({
      status: "error",
      message: "An organization must have at least one admin.",
    }),
  );
  const report = vi.fn();
  const user = userEvent.setup();

  render(
    <RoleControl
      userId="user-1"
      name="Ada Lovelace"
      role={currentRole}
      onChangeRole={onChangeRole}
      report={report}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Role for Ada Lovelace/ }));
  await user.click(screen.getByRole("option", { name: "Member" }));

  await waitFor(() =>
    expect(report).toHaveBeenCalledWith("An organization must have at least one admin."),
  );
  expect(refreshMock).not.toHaveBeenCalled();
});

test("disables the select control while role change action is pending", async () => {
  const currentRole: MemberRole = "member";
  let resolveAction: (state: ActionState) => void = () => {};
  const onChangeRole: ChangeRoleAction = vi.fn(
    () =>
      new Promise<ActionState>((resolve) => {
        resolveAction = resolve;
      }),
  );
  const user = userEvent.setup();

  render(
    <RoleControl
      userId="user-1"
      name="Ada Lovelace"
      role={currentRole}
      onChangeRole={onChangeRole}
      report={vi.fn()}
    />,
  );

  const trigger = screen.getByRole("button", {
    name: /Role for Ada Lovelace/,
  }) as HTMLButtonElement;
  expect(trigger.disabled).toBe(false);

  await user.click(trigger);
  await user.click(screen.getByRole("option", { name: "Admin" }));

  await waitFor(() => expect(onChangeRole).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(trigger.disabled).toBe(true));

  resolveAction({ status: "success" });
  await waitFor(() => expect(trigger.disabled).toBe(false));
});
