import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { type OrganizationAddressActions, OrganizationAddresses } from "./organization-addresses";

afterEach(cleanup);
it("retains failed drafts and retry keys, then shows the saved unverified address after reload", async () => {
  const row = {
    id: "address",
    displayName: "Support",
    address: "support@example.test",
    status: "unverified" as const,
    createdBy: "admin",
    createdAt: "2026-10-27",
  };
  const actions: OrganizationAddressActions = {
    list: vi.fn(async () => ({ ok: true as const, value: [] })),
    add: vi.fn(async () => ({ ok: false as const, error: { code: "unavailable" as const } })),
  };
  const user = userEvent.setup();
  render(<OrganizationAddresses actions={actions} />);
  await user.click(await screen.findByRole("button", { name: "Add Email Address" }));
  await user.type(screen.getByRole("textbox", { name: "Display Name" }), "Support");
  await user.type(screen.getByRole("textbox", { name: "Email Address" }), "support@example.test");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByRole("alert");
  vi.mocked(actions.add).mockResolvedValue({ ok: true as const, value: row });
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(vi.mocked(actions.add).mock.calls[1]).toEqual(vi.mocked(actions.add).mock.calls[0]);
  expect(await screen.findByText("Unverified")).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
  cleanup();
  actions.list = vi.fn(async () => ({ ok: true as const, value: [row] }));
  render(<OrganizationAddresses actions={actions} />);
  expect(await screen.findByText("support@example.test")).toBeTruthy();
  expect(screen.getByText(/No verification email/)).toBeTruthy();
});
it("shows forbidden list errors without allowing create", async () => {
  render(
    <OrganizationAddresses
      actions={{
        list: async () => ({ ok: false as const, error: { code: "forbidden" } }),
        add: vi.fn(),
      }}
    />,
  );
  expect((await screen.findByRole("alert")).textContent).toContain("permission");
  expect(screen.getByRole("button", { name: "Add Email Address" })).toHaveProperty(
    "disabled",
    true,
  );
});
