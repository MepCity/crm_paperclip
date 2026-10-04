import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
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

afterEach(cleanup);

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
