import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { SignatureCreate } from "./signature-create";

afterEach(cleanup);

it("opens all signature fields, validates the missing sender with the observed message, and cancels", async () => {
  const user = userEvent.setup();
  const cancel = vi.fn();
  render(<SignatureCreate onCancel={cancel} />);
  await user.type(screen.getByRole("textbox", { name: "Signature name" }), "Team signature");
  expect(screen.getByRole("button", { name: /Associate sender address/ })).toBeDefined();
  await user.type(screen.getByRole("textbox", { name: "Signature body" }), "Regards");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getByRole("alert").textContent).toBe("En az bir Gönderen adresini ilişkilendirin.");
  await user.click(screen.getByRole("button", { name: "Plain text" }));
  expect(
    (screen.getByRole("textbox", { name: "Signature body" }) as HTMLTextAreaElement).value,
  ).toBe("Regards");
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(cancel).toHaveBeenCalledOnce();
});
