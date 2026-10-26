import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/client-provider";
import { TemplateCreate } from "./template-create";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(cleanup);

it("selects a module, opens the gallery and editor, preserves text across modes and exposes both save choices", async () => {
  const user = userEvent.setup();
  const close = vi.fn();
  render(<TemplateCreate modules={["Leads", "Contacts"]} onClose={close} />);
  expect(screen.getByRole("dialog", { name: "Create Email Template" })).toBeDefined();
  await user.click(screen.getByRole("button", { name: /Select Module/ }));
  await user.click(screen.getByRole("option", { name: "Contacts" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "Template Gallery" })).toBeDefined();
  expect(screen.getByRole("heading", { name: "Basic 6" })).toBeDefined();
  expect(screen.getByText("Blank")).toBeDefined();
  for (const category of [
    "All",
    "Basic",
    "Celebration",
    "Invitation",
    "Follow-up",
    "Product Promotion",
    "Notification",
  ])
    expect(screen.getByRole("button", { name: category })).toBeDefined();
  await user.click(screen.getByRole("button", { name: "Add HTML / Plain Text" }));
  await user.type(screen.getByRole("textbox", { name: "Template name" }), "Welcome");
  await user.type(screen.getByRole("textbox", { name: "Template body" }), "Hello there");
  await user.click(screen.getByRole("button", { name: "Plain text" }));
  expect(screen.getByRole("textbox", { name: "Template body" }).textContent).toBe("Hello there");
  const toolbar = screen.getByRole("toolbar", { name: "Template formatting" });
  expect(within(toolbar).getByRole("button", { name: "HTML" })).toBeDefined();
  expect(within(toolbar).getByRole("button", { name: "Show Tips" })).toBeDefined();
  expect(within(toolbar).getByRole("button", { name: "Bold" })).toBeDefined();
  await user.click(screen.getByRole("button", { name: "HTML" }));
  expect(screen.getByRole("textbox", { name: "Template body" }).textContent).toBe("Hello there");
  await user.click(screen.getByRole("button", { name: "Save" }));
  const menu = screen.getByRole("menu", { name: "Save" });
  for (const name of ["Save now", "Save as draft"])
    expect(within(menu).getByRole("menuitem", { name }).getAttribute("aria-disabled")).toBe("true");
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(close).toHaveBeenCalledOnce();
});

it("cancels the module dialog without entering the gallery", async () => {
  const user = userEvent.setup();
  const close = vi.fn();
  render(<TemplateCreate modules={["Leads"]} onClose={close} />);
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(close).toHaveBeenCalledOnce();
});

it("renders the observed Turkish gallery labels and editor mode without replacing the HTML canvas", async () => {
  const user = userEvent.setup();
  render(
    <LanguageProvider language="tr">
      <TemplateCreate modules={["Leads"]} onClose={vi.fn()} />
    </LanguageProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Sonraki" }));
  expect(screen.getByRole("heading", { name: "Temel 6" })).toBeDefined();
  for (const name of ["Tümü", "Temel", "Kutlama", "Davet", "İzleme", "Ürün Promosyonu", "Bildirim"])
    expect(screen.getByRole("button", { name })).toBeDefined();
  for (const name of [
    "Boş",
    "Tek sütun",
    "İki sütun",
    "Görüntü 1 ile iki sütun",
    "Görüntü 2 ile iki sütun",
    "Üç sütun",
  ])
    expect(screen.getByText(name, { exact: true })).toBeDefined();
  await user.click(screen.getByRole("button", { name: "Kutlama" }));
  expect(screen.queryByText("Boş", { exact: true })).toBeNull();
  await user.click(screen.getByRole("button", { name: "HTML/Düz Metin ekle" }));
  const body = screen.getByRole("textbox", { name: "Şablon içeriği" });
  await user.type(body, "Merhaba");
  const plain = screen.getByRole("button", { name: "Düz metin" });
  expect(plain.closest('[role="toolbar"]')).not.toBeNull();
  await user.click(plain);
  expect(screen.getByRole("textbox", { name: "Şablon içeriği" })).toBe(body);
  expect(body.getAttribute("contenteditable")).toBe("true");
  expect(body.textContent).toBe("Merhaba");
  expect(screen.getByRole("button", { name: "HTML" })).toBeDefined();
  expect(screen.getByRole("button", { name: "İpuçlarını Göster" })).toBeDefined();
});
