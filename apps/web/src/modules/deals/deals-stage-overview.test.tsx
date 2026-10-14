import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { DealsStageOverview } from "./deals-stage-overview";
import { dealField, dealMetadata, dealRecord } from "./test-metadata";

vi.mock("@/lib/api/client/hooks", () => ({
  useHomeCurrency: () => ({ data: { symbol: "$" } }),
}));

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const module = dealMetadata([
  dealField("Stage", {
    label: "Stage",
    dataType: "picklist",
    picklist: [
      {
        displayValue: "Qualification",
        storedValue: "Qualification",
        stage: { probability: 10, forecastCategory: "Pipeline", category: "Open" },
      },
      {
        displayValue: "Closed Won",
        storedValue: "Closed Won",
        stage: { probability: 100, forecastCategory: "Closed", category: "Closed Won" },
      },
      {
        displayValue: "Closed Lost",
        storedValue: "Closed Lost",
        stage: { probability: 0, forecastCategory: "Omitted", category: "Closed Lost" },
      },
    ],
  }),
  dealField("Reason_For_Loss__s", { dataType: "picklist", picklist: [] }),
]);

const lostRecord = dealRecord({
  Stage: "Closed Lost",
  Amount: 100,
  Closing_Date: "2026-12-01",
  Reason_For_Loss__s: "Price",
});

async function openWonDialog(saveRecord: (input: unknown) => Promise<void>) {
  const user = userEvent.setup();
  render(
    <DealsStageOverview module={module} record={lostRecord} saveRecord={saveRecord as never} />,
  );
  await user.click(screen.getByRole("button", { name: "Choose won stage" }));
  const menu = await screen.findByRole("dialog", { name: "Choose won stage" });
  await user.click(within(menu).getByRole("menuitemradio", { name: "Closed Won" }));
  const dialog = await screen.findByRole("dialog", { name: "Verify Details" });
  return { user, dialog };
}

test("lost to won clears the stale loss reason in the request", async () => {
  const saveRecord = vi.fn(async () => {});
  const { user, dialog } = await openWonDialog(saveRecord);
  await user.click(within(dialog).getByRole("button", { name: "Save" }));
  await waitFor(() => expect(saveRecord).toHaveBeenCalled());
  expect(saveRecord).toHaveBeenCalledWith(
    expect.objectContaining({ Stage: "Closed Won", Reason_For_Loss__s: null }),
  );
});

test("a rejected save shows an alert in the dialog and keeps it open", async () => {
  const saveRecord = vi.fn(async () => {
    throw new Error("Record is locked.");
  });
  const { user, dialog } = await openWonDialog(saveRecord);
  await user.click(within(dialog).getByRole("button", { name: "Save" }));
  expect((await within(dialog).findByRole("alert")).textContent).toContain("Record is locked.");
  expect(screen.getByRole("dialog")).toBeTruthy();
});
