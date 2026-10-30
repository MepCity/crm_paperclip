import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/client-provider";
import { SignatureCreate } from "./signature-create";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(cleanup);

it("opens all signature fields, validates the missing sender with the observed message, and cancels", async () => {
  const user = userEvent.setup();
  const cancel = vi.fn();
  render(<SignatureCreate onCancel={cancel} />);
  await user.type(screen.getByRole("textbox", { name: "Signature name" }), "Team signature");
  expect(screen.getByRole("button", { name: /Associate sender address/ })).toBeDefined();
  await user.type(screen.getByRole("textbox", { name: "Signature body" }), "Regards");
  await user.click(screen.getByRole("button", { name: "Save" }));
  const alert = screen.getByRole("alert");
  expect(alert.textContent).toBe("En az bir Gönderen adresini ilişkilendirin.");
  expect(alert.className).toContain("fixed");
  expect(
    screen.getByRole("button", { name: /Associate sender address/ }).getAttribute("data-invalid"),
  ).toBe("true");
  await user.click(within(alert).getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("textbox", { name: "Signature name" })).toBeDefined();
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getByRole("alert")).toBeDefined();
  await user.click(screen.getByRole("button", { name: "Plain text" }));
  expect(
    (screen.getByRole("textbox", { name: "Signature body" }) as HTMLTextAreaElement).value,
  ).toBe("Regards");
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(cancel).toHaveBeenCalledOnce();
});

it("localizes the signature text-mode switch and preserves the draft and validation", async () => {
  const user = userEvent.setup();
  render(
    <LanguageProvider language="tr">
      <SignatureCreate onCancel={vi.fn()} />
    </LanguageProvider>,
  );
  const body = screen.getByRole("textbox", { name: "İmza içeriği" });
  await user.type(body, "Regards");
  await user.click(screen.getByRole("button", { name: "Düz metin" }));
  expect((screen.getByRole("textbox", { name: "İmza içeriği" }) as HTMLTextAreaElement).value).toBe(
    "Regards",
  );
  await user.click(screen.getByRole("button", { name: "HTML" }));
  expect(screen.getByRole("textbox", { name: "İmza içeriği" }).textContent).toBe("Regards");
  await user.click(screen.getByRole("button", { name: "Kaydet" }));
  expect(screen.getByRole("alert").textContent).toBe("En az bir Gönderen adresini ilişkilendirin.");
});
