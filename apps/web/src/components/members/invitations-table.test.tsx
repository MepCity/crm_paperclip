import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import type { ActionState } from "@/lib/action";
import { render } from "@/test/render";
import { type InvitationRow, InvitationsTable } from "./invitations-table";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const memberInvite: InvitationRow = {
  id: "inv-1",
  email: "bea@example.test",
  role: "member",
  expiresAt: "Oct 11, 2026",
};

const adminInvite: InvitationRow = {
  id: "inv-2",
  email: "cloe@example.test",
  role: "admin",
  expiresAt: "Oct 12, 2026",
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("a failed revoke warns once, above the table", async () => {
  const onRevoke = vi.fn(
    async (invitationId: string, _previous: ActionState, _formData: FormData) => ({
      status: "error" as const,
      message: invitationId === "inv-1" ? "This invitation no longer exists." : "Try again later.",
    }),
  );
  const user = userEvent.setup();
  render(<InvitationsTable invitations={[memberInvite, adminInvite]} onRevoke={onRevoke} />);

  await user.click(screen.getByRole("button", { name: "Revoke bea@example.test" }));
  await waitFor(() => expect(onRevoke).toHaveBeenCalledTimes(1));
  expect(onRevoke.mock.calls[0]?.[0]).toBe("inv-1");
  const alert = screen.getByRole("alert");
  expect(alert.textContent).toContain("This invitation no longer exists.");
  expect(
    alert.compareDocumentPosition(screen.getByRole("table")) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();

  await user.click(screen.getByRole("button", { name: "Revoke cloe@example.test" }));
  await waitFor(() => expect(onRevoke).toHaveBeenCalledTimes(2));
  expect(screen.getAllByRole("alert")).toHaveLength(1);
  expect(screen.getByRole("alert").textContent).toContain("Try again later.");
});
