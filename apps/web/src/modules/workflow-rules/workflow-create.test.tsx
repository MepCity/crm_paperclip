import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { WorkflowCreate } from "./workflow-create";

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
