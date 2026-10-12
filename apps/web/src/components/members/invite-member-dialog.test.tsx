import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import type { InvitationActionState } from "./invitation-state";
import { InviteMemberDialog } from "./invite-member-dialog";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function openDialog() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Invite member" }));
  return user;
}

test("shows a server field error on the email field", async () => {
  const action = vi.fn(
    async (): Promise<InvitationActionState> => ({
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { email: ["This email is already a member."] },
    }),
  );
  render(<InviteMemberDialog action={action} />);
  const user = await openDialog();

  const email = screen.getByRole("textbox", { name: "Email" });
  await user.type(email, "member@example.test");
  await user.click(screen.getByRole("button", { name: "Create invitation" }));

  await waitFor(() => expect(email.getAttribute("aria-invalid")).toBe("true"));
  const describedBy = email.getAttribute("aria-describedby");
  expect(document.getElementById(describedBy?.split(" ").at(-1) ?? "")?.textContent).toBe(
    "This email is already a member.",
  );
});

test("shows the invitation link and Copy link after success", async () => {
  const inviteUrl = "http://127.0.0.1:3000/invite/one-time-token";
  const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
  const action = vi.fn(
    async (): Promise<InvitationActionState> => ({ status: "success", inviteUrl }),
  );
  render(<InviteMemberDialog action={action} />);
  const user = await openDialog();

  await user.type(screen.getByRole("textbox", { name: "Email" }), "new@example.test");
  await user.click(screen.getByRole("button", { name: "Create invitation" }));

  expect(await screen.findByText(inviteUrl)).toBeTruthy();
  const copy = screen.getByRole("button", { name: "Copy link" });
  expect(copy).toBeTruthy();
  await user.click(copy);
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(inviteUrl));
});
