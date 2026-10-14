import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { demoStages } from "./stage-bar.demo";
import { StageChangeDialog } from "./stage-change-dialog";
import { StageChangeSubmitError } from "./types";

afterEach(() => cleanup());

const reasonForLossOptions = [
  { storedValue: "price", displayValue: "Price" },
  { storedValue: "other", displayValue: "Other" },
];

function setup({
  showReasonForLoss = false,
  onSubmit = vi.fn(async () => {}),
}: {
  showReasonForLoss?: boolean;
  onSubmit?: (values: unknown) => Promise<void>;
} = {}) {
  const onOpenChange = vi.fn();
  render(
    <StageChangeDialog
      isOpen
      onOpenChange={onOpenChange}
      stages={demoStages}
      initialValues={{
        amount: 1000,
        closingDate: "2026-06-15",
        stage: "closed-won",
        reasonForLoss: null,
      }}
      reasonForLossOptions={reasonForLossOptions}
      showReasonForLoss={showReasonForLoss}
      onSubmit={onSubmit}
    />,
  );
  return { onOpenChange, onSubmit, user: userEvent.setup() };
}

test("renders won field set without reason for loss", () => {
  setup();
  expect(screen.getByRole("heading", { name: "Verify Details" })).toBeTruthy();
  expect(screen.getByLabelText("Amount")).toBeTruthy();
  expect(screen.getByLabelText("Closing Date")).toBeTruthy();
  expect(screen.getByLabelText("Stage")).toBeTruthy();
  expect(screen.queryByLabelText("Reason for Loss")).toBeNull();
});

test("renders reason for loss when target stage is lost", () => {
  setup({ showReasonForLoss: true });
  expect(screen.getByLabelText("Reason for Loss")).toBeTruthy();
});

test("renders currency prefix when supplied", () => {
  const onOpenChange = vi.fn();
  render(
    <StageChangeDialog
      isOpen
      onOpenChange={onOpenChange}
      stages={demoStages}
      initialValues={{
        amount: 1000,
        closingDate: "2026-06-15",
        stage: "closed-won",
        reasonForLoss: null,
      }}
      reasonForLossOptions={reasonForLossOptions}
      showReasonForLoss={false}
      currencyPrefix="TL"
      onSubmit={vi.fn(async () => {})}
    />,
  );
  expect(screen.getByText("TL")).toBeTruthy();
});

test("requires stage and closing date before submit", async () => {
  const onSubmit = vi.fn(async () => {});
  const { user } = setup({ onSubmit });
  const closing = screen.getByLabelText("Closing Date");
  await user.clear(closing);
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getByText("Closing Date cannot be empty.")).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();
});

test("shows server-side field errors and keeps dialog open", async () => {
  const onSubmit = vi.fn(async () => {
    throw new StageChangeSubmitError({ amount: "Amount is invalid." });
  });
  const { onOpenChange, user } = setup({ onSubmit });
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(screen.getByText("Amount is invalid.")).toBeTruthy());
  expect(onOpenChange).not.toHaveBeenCalled();
  expect(screen.getByRole("heading", { name: "Verify Details" })).toBeTruthy();
});

test("successful submit closes the dialog", async () => {
  const onSubmit = vi.fn(async () => {});
  const { onOpenChange, user } = setup({ onSubmit });
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  expect(onSubmit).toHaveBeenCalledOnce();
});

test("shows a general error alert, stays open and recovers on retry", async () => {
  const onSubmit = vi
    .fn<(values: unknown) => Promise<void>>()
    .mockRejectedValueOnce(new Error("Record is locked."))
    .mockResolvedValueOnce(undefined);
  const { user, onOpenChange } = setup({ onSubmit });
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Record is locked.");
  expect(onOpenChange).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  expect(screen.queryByRole("alert")).toBeNull();
});

test("shows a field error under the field and unmapped ones as alert", async () => {
  const onSubmit = vi
    .fn<(values: unknown) => Promise<void>>()
    .mockRejectedValueOnce(new StageChangeSubmitError({ amount: "Too low" }))
    .mockRejectedValueOnce(new StageChangeSubmitError({ reasonForLoss: "Reason needed" }));
  const { user } = setup({ onSubmit });
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("Too low")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Reason needed");
});
