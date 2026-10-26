import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/client-provider";
import { WorkflowCreate } from "./workflow-create";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(cleanup);

it("requires module and name, advances WHEN date trigger to the observed initial criteria and discards on cancel", async () => {
  const user = userEvent.setup();
  const close = vi.fn();
  render(<WorkflowCreate onClose={close} />);
  expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(true);
  await user.click(screen.getByRole("button", { name: /Module/ }));
  await user.click(screen.getByRole("option", { name: "Leads" }));
  await user.type(screen.getByRole("textbox", { name: "Rule Name" }), "Review follow-up");
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: /Execute this workflow rule/ }));
  for (const name of ["Record Action", "Date/Time Field", "Record Score", "Record Notes"])
    expect(screen.getByRole("option", { name })).toBeDefined();
  await user.click(screen.getByRole("option", { name: "Date/Time Field" }));
  await user.click(screen.getByRole("button", { name: /Execution date\/time field/ }));
  await user.click(screen.getByRole("option", { name: "Created Time" }));
  expect(screen.getByRole("button", { name: /Execution time/ }).textContent).toContain(
    "Immediately",
  );
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("region", { name: "Condition 1" })).toBeDefined();
  expect(
    (screen.getByRole("radio", { name: "Leads matching certain conditions" }) as HTMLInputElement)
      .checked,
  ).toBe(true);
  const all = screen.getByRole("radio", { name: "All Leads" }) as HTMLInputElement;
  expect(all.checked).toBe(false);
  expect(all.disabled).toBe(false);
  await user.click(all);
  expect(all.checked).toBe(false);
  expect(screen.getByRole("region", { name: "Condition 1" })).toBeDefined();
  expect(screen.getByRole("button", { name: /Criterion field/ }).textContent).toContain("Select");
  expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(true);
  await user.click(screen.getByRole("button", { name: "Edit" }));
  expect(screen.getByRole("button", { name: /Execution date\/time field/ }).textContent).toContain(
    "Created Time",
  );
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(close).toHaveBeenCalledOnce();
});

it("uses the Turkish shell module label in the observed scope without changing the selected radio", async () => {
  const user = userEvent.setup();
  render(
    <LanguageProvider language="tr">
      <WorkflowCreate onClose={vi.fn()} />
    </LanguageProvider>,
  );
  await user.click(screen.getByRole("button", { name: /Modül/ }));
  await user.click(screen.getByRole("option", { name: "Müşteri Adayları" }));
  await user.type(screen.getByRole("textbox", { name: "Kural Adı" }), "Follow-up");
  await user.click(screen.getByRole("button", { name: "Sonraki" }));
  await user.click(screen.getByRole("button", { name: /Bu iş akışı kuralını/ }));
  await user.click(screen.getByRole("option", { name: "Date/Time Field" }));
  await user.click(screen.getByRole("button", { name: /Yürütme tarih/ }));
  await user.click(screen.getByRole("option", { name: "Oluşturma Zamanı" }));
  await user.click(screen.getByRole("button", { name: "Sonraki" }));
  expect(screen.getByText("@ Müşteri Adayları")).toBeDefined();
  expect(screen.getByText("Açıklama Ekle")).toBeDefined();
  expect(screen.getByText("Bu kural, yürütülür şunda: Oluşturma Zamanı.")).toBeDefined();
  expect(screen.getByText(/Yinele/).textContent).toBe("Yinele Bir Kez");
  expect(
    screen.getByRole("radiogroup", {
      name: "Kuralı hangi müşteri adayları öğesine uygulamak istersiniz?",
    }),
  ).toBeDefined();
  expect(
    (
      screen.getByRole("radio", {
        name: "Müşteri Adayları belirli koşullarla eşleşiyor",
      }) as HTMLInputElement
    ).checked,
  ).toBe(true);
  const all = screen.getByRole("radio", { name: "Tüm Müşteri Adayları" }) as HTMLInputElement;
  expect(all.checked).toBe(false);
  expect(all.disabled).toBe(false);
});
