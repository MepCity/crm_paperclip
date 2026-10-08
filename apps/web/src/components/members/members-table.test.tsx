import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import type { ActionState } from "@/lib/action";
import { render } from "@/test/render";
import { type MemberRow, MembersTable } from "./members-table";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const ada: MemberRow = {
  userId: "ada",
  name: "Ada Admin",
  email: "ada@example.test",
  role: "admin",
  joinedAt: "Oct 4, 2026",
};

const bea: MemberRow = {
  userId: "bea",
  name: "Bea Member",
  email: "bea@example.test",
  role: "member",
  joinedAt: "Oct 5, 2026",
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** The trigger's accessible name also carries the selected role, so match on the label part. */
function roleTrigger(name: string): HTMLButtonElement {
  return screen.getByRole("button", { name: new RegExp(`Role for ${name}`) });
}

test("an admin sees role controls, remove, the You marker and role labels", () => {
  render(
    <MembersTable
      members={[ada, bea]}
      currentUserId={ada.userId}
      canManage
      onChangeRole={vi.fn()}
      onRemove={vi.fn()}
    />,
  );

  const adaRow = screen.getByText("Ada Admin").closest("tr");
  const beaRow = screen.getByText("Bea Member").closest("tr");
  expect(adaRow?.textContent).toContain("You");
  expect(adaRow?.textContent).toContain("Admin");
  expect(beaRow?.textContent).toContain("Member");
  expect(adaRow?.textContent).toContain("Oct 4, 2026");
  expect(screen.getByRole("button", { name: /Role for Ada Admin/ })).toBeTruthy();
  expect(screen.getByRole("button", { name: /Role for Bea Member/ })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Remove Ada Admin" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Remove Bea Member" })).toBeTruthy();
});

test("a member sees the table without role controls or remove", () => {
  render(<MembersTable members={[ada, bea]} currentUserId={bea.userId} canManage={false} />);

  expect(screen.getByText("Bea Member")).toBeTruthy();
  expect(screen.getByText("You")).toBeTruthy();
  expect(screen.getByText("Member")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Role for/ })).toBeNull();
  expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
});

test("cancel does not remove a member and confirm calls the action once", async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn(async () => ({ status: "success" as const }));
  render(
    <MembersTable
      members={[bea]}
      currentUserId="someone-else"
      canManage
      onChangeRole={vi.fn()}
      onRemove={onRemove}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Remove Bea Member" }));
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onRemove).not.toHaveBeenCalled();
  expect(screen.queryByRole("alertdialog")).toBeNull();

  await user.click(screen.getByRole("button", { name: "Remove Bea Member" }));
  await user.click(screen.getByRole("button", { name: "Remove" }));
  await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
  expect(onRemove).toHaveBeenCalledWith("bea", { status: "idle" }, expect.any(FormData));
});

test("picking a new role submits it once with the member id and keeps the console clean", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const onChangeRole = vi.fn(
    async (_userId: string, _previous: ActionState, _formData: FormData) => ({
      status: "success" as const,
    }),
  );
  const user = userEvent.setup();
  render(
    <MembersTable
      members={[bea]}
      currentUserId={ada.userId}
      canManage
      onChangeRole={onChangeRole}
      onRemove={vi.fn()}
    />,
  );

  const trigger = roleTrigger("Bea Member");
  await user.click(trigger);
  await user.click(screen.getByRole("option", { name: "Member" }));
  expect(onChangeRole).not.toHaveBeenCalled();

  await user.click(trigger);
  await user.click(screen.getByRole("option", { name: "Admin" }));

  await waitFor(() => expect(onChangeRole).toHaveBeenCalledTimes(1));
  expect(onChangeRole.mock.calls[0]?.[0]).toBe("bea");
  expect(onChangeRole.mock.calls[0]?.[2].get("role")).toBe("admin");
  expect(consoleError).not.toHaveBeenCalled();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("a failed role change warns above the table and keeps the selected role", async () => {
  const onChangeRole = vi.fn(
    async (_userId: string, _previous: ActionState, _formData: FormData) => ({
      status: "error" as const,
      message: "An organization must have an admin.",
    }),
  );
  const user = userEvent.setup();
  render(
    <MembersTable
      members={[ada]}
      currentUserId={ada.userId}
      canManage
      onChangeRole={onChangeRole}
      onRemove={vi.fn()}
    />,
  );

  await user.click(roleTrigger("Ada Admin"));
  await user.click(screen.getByRole("option", { name: "Member" }));

  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("An organization must have an admin.");
  const table = screen.getByRole("table");
  expect(alert.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(roleTrigger("Ada Admin").textContent).toContain("Admin");
});

test("role and remove failures share one warning that a new action clears", async () => {
  let releaseRemove: (state: ActionState) => void = () => {};
  const onChangeRole = vi.fn(
    async (_userId: string, _previous: ActionState, _formData: FormData) => ({
      status: "error" as const,
      message: "An organization must have an admin.",
    }),
  );
  const onRemove = vi.fn(
    () =>
      new Promise<ActionState>((resolve) => {
        releaseRemove = resolve;
      }),
  );
  const user = userEvent.setup();
  render(
    <MembersTable
      members={[ada]}
      currentUserId={ada.userId}
      canManage
      onChangeRole={onChangeRole}
      onRemove={onRemove}
    />,
  );

  await user.click(roleTrigger("Ada Admin"));
  await user.click(screen.getByRole("option", { name: "Member" }));
  await screen.findByRole("alert");

  await user.click(screen.getByRole("button", { name: "Remove Ada Admin" }));
  await user.click(screen.getByRole("button", { name: "Remove" }));
  await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole("alert")).toBeNull();

  releaseRemove({ status: "error", message: "You do not have permission to do this." });
  await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(1));
  expect(screen.getByRole("alert").textContent).toContain("You do not have permission to do this.");
});
