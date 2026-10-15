import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { type FieldMapping, ImportMappingStep, type ImportMappingStepProps } from "./mapping-step";

const fields = [
  { apiName: "Last_Name", label: "Last Name", required: true },
  { apiName: "Email", label: "Email", required: false },
  { apiName: "Company", label: "Company", required: true },
];
const base: ImportMappingStepProps = {
  headers: [" last NAME ", "EMAIL", "Unknown", "Last_Name"],
  sampleRows: [["", "example@example.test"], ["Example"]],
  fields,
  mapping: [],
  onMappingChange: vi.fn(),
  defaults: [],
  onDefaultsChange: vi.fn(),
  requireAllRequired: true,
  onValidityChange: vi.fn(),
};
function Harness(props: Partial<ImportMappingStepProps>) {
  const [mapping, setMapping] = useState<FieldMapping[]>(props.mapping ?? []);
  const [defaults, setDefaults] = useState(props.defaults ?? []);
  return (
    <ImportMappingStep
      {...base}
      {...props}
      mapping={mapping}
      onMappingChange={setMapping}
      defaults={defaults}
      onDefaultsChange={setDefaults}
    />
  );
}
async function choose(user: ReturnType<typeof userEvent.setup>, label: RegExp, option: string) {
  await user.click(screen.getByRole("button", { name: label }));
  await user.click(screen.getByRole("option", { name: option }));
}
afterEach(cleanup);

test("tabs count and filter columns; samples use the first nonempty value", async () => {
  const user = userEvent.setup();
  render(<Harness mapping={[{ column: 1, field: "Email" }]} />);
  expect(screen.getByRole("tab", { name: "Mapped (1)" })).toBeTruthy();
  expect(screen.getByRole("tab", { name: "Unmapped (3)" })).toBeTruthy();
  expect(screen.getByText("Example")).toBeTruthy();
  await user.click(screen.getByRole("tab", { name: "Mapped (1)" }));
  expect(screen.getAllByRole("row")).toHaveLength(2);
  expect(screen.queryByText("Example")).toBeNull();
  await user.click(screen.getByRole("tab", { name: "Unmapped (3)" }));
  expect(screen.getAllByRole("row")).toHaveLength(4);
  expect(screen.queryByText("example@example.test")).toBeNull();
  await user.click(screen.getByRole("tab", { name: "All" }));
  expect(screen.getAllByRole("row")).toHaveLength(5);
});

test("auto mapping matches labels and API names ignoring case and whitespace; reset clears all", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole("button", { name: "Auto Mapping" }));
  expect(screen.getByRole("tab", { name: "Mapped (3)" })).toBeTruthy();
  expect(screen.getAllByText("This field is already mapped.")).toHaveLength(2);
  expect(screen.getByRole("button", { name: /CRM field for Unknown/ }).textContent).toContain(
    "None",
  );
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(screen.getByRole("tab", { name: "Unmapped (4)" })).toBeTruthy();
  expect(screen.queryByText("This field is already mapped.")).toBeNull();
});

test("manual mapping toggles replacement inputs and retains typed replacement values", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const replacement = screen.getByRole("textbox", {
    name: /Replace empty values with for Unknown/,
  }) as HTMLInputElement;
  expect(replacement.disabled).toBe(true);
  await choose(user, /CRM field for Unknown/, "Email");
  expect(replacement.disabled).toBe(false);
  await user.type(replacement, "fallback@example.test");
  expect(replacement.value).toBe("fallback@example.test");
  await choose(user, /CRM field for Unknown/, "None");
  expect(replacement.disabled).toBe(true);
});

test("required warning is conditional and nonempty defaults satisfy required fields", () => {
  const { rerender } = render(<ImportMappingStep {...base} />);
  expect(screen.getByRole("alert").textContent).toBe("Map the required fields: Last Name, Company");
  rerender(<ImportMappingStep {...base} defaults={[{ field: "Company", value: "Example" }]} />);
  expect(screen.getByRole("alert").textContent).toBe("Map the required fields: Last Name");
  rerender(<ImportMappingStep {...base} requireAllRequired={false} />);
  expect(screen.queryByRole("alert")).toBeNull();
});

test("default rows add, edit and remove; mapped fields are excluded", async () => {
  const user = userEvent.setup();
  render(<Harness mapping={[{ column: 1, field: "Email" }]} />);
  await user.click(screen.getByRole("button", { name: "+ Add default value" }));
  await user.click(screen.getByRole("button", { name: /Default field 1/ }));
  const list = screen.getByRole("listbox");
  expect(within(list).queryByRole("option", { name: "Email" })).toBeNull();
  await user.click(within(list).getByRole("option", { name: "Company *" }));
  await user.type(screen.getByRole("textbox", { name: "Default value 1" }), "Example");
  expect(screen.getByRole("alert").textContent).toBe("Map the required fields: Last Name");
  await user.click(screen.getByRole("button", { name: "Remove default value 1" }));
  expect(screen.queryByRole("textbox", { name: "Default value 1" })).toBeNull();
  expect(screen.getByRole("alert").textContent).toContain("Company");
});

test("validity reacts to missing fields, defaults, duplicate mappings and update mode", () => {
  const onValidityChange = vi.fn();
  const { rerender } = render(<ImportMappingStep {...base} onValidityChange={onValidityChange} />);
  expect(onValidityChange).toHaveBeenLastCalledWith(false);
  const mapping = [{ column: 0, field: "Last_Name" }];
  rerender(
    <ImportMappingStep
      {...base}
      mapping={mapping}
      defaults={[{ field: "Company", value: "Example" }]}
      onValidityChange={onValidityChange}
    />,
  );
  expect(onValidityChange).toHaveBeenLastCalledWith(true);
  rerender(
    <ImportMappingStep
      {...base}
      mapping={[...mapping, { column: 2, field: "Last_Name" }]}
      requireAllRequired={false}
      onValidityChange={onValidityChange}
    />,
  );
  expect(onValidityChange).toHaveBeenLastCalledWith(false);
  rerender(
    <ImportMappingStep {...base} requireAllRequired={false} onValidityChange={onValidityChange} />,
  );
  expect(onValidityChange).toHaveBeenLastCalledWith(true);
  rerender(
    <ImportMappingStep
      {...base}
      mapping={mapping}
      defaults={[{ field: "Company", value: "   " }]}
      onValidityChange={onValidityChange}
    />,
  );
  expect(onValidityChange).toHaveBeenLastCalledWith(false);
});

test("Create New Fields is unavailable and marked for M11", () => {
  render(<Harness />);
  const button = screen.getByRole("button", { name: /Create New Fields/ });
  expect(button.getAttribute("aria-disabled")).toBe("true");
  expect(button.getAttribute("data-later-module")).toBe("M11");
});
