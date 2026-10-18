import type { FieldDefinition } from "@crm/core/records";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { LeadStatusRibbonSection } from "./lead-status-ribbon-section";

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const update = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false }));
vi.mock("@/lib/api/client/hooks", () => ({ useUpdateRecord: () => update }));

const field = {
  apiName: "Lead_Status",
  label: "Lead Status",
  dataType: "picklist",
  required: false,
  readOnly: false,
  massUpdate: true,
  unique: false,
  views: { view: true, create: true, edit: true, quickCreate: false },
  picklist: [
    { storedValue: "Not Contacted", displayValue: "Not Contacted" },
    { storedValue: "Contacted", displayValue: "Contacted" },
  ],
} as unknown as FieldDefinition;

function setup(value: string | null = "Not Contacted") {
  const onValueChange = vi.fn();
  render(
    <LeadStatusRibbonSection
      module="Leads"
      recordId="lead-1"
      field={field}
      value={value}
      onValueChange={onValueChange}
    />,
  );
  return onValueChange;
}

afterEach(() => {
  cleanup();
  update.mutateAsync.mockReset();
  update.isPending = false;
});

describe("LeadStatusRibbonSection", () => {
  it("shows the current status in a menu button and the other stages as text", () => {
    setup("Not Contacted");
    expect(screen.getByRole("button", { name: "Choose lead status" }).textContent).toContain(
      "Not Contacted",
    );
    expect(screen.getByText("Contacted")).toBeTruthy();
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("Not Contacted");
  });

  it("saves a status chosen while none is set", async () => {
    update.mutateAsync.mockResolvedValue({});
    const onValueChange = setup(null);
    fireEvent.click(screen.getByRole("button", { name: "Contacted" }));
    await waitFor(() =>
      expect(update.mutateAsync).toHaveBeenCalledWith({
        id: "lead-1",
        input: { Lead_Status: "Contacted" },
      }),
    );
    expect(onValueChange).toHaveBeenCalledWith("Contacted");
  });

  it("rolls back and shows an alert when saving fails", async () => {
    update.mutateAsync.mockRejectedValue(new Error("boom"));
    const onValueChange = setup(null);
    fireEvent.click(screen.getByRole("button", { name: "Contacted" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Unable to update lead status.");
    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  it("does not show an alert initially", () => {
    setup();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
