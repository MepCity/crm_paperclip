import type { FieldDefinition } from "@crm/core/records";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { DEDUP_MAX_FIELDS, dedupConfirmMessage, dedupFieldPanelMessage } from "./dedup-config";
import {
  DedupConfirmDialog,
  DedupConflictPopup,
  DedupFieldDialog,
  type DedupFieldDialogProps,
  DedupProgressDialog,
} from "./dedup-dialogs";

const sampleFields: readonly FieldDefinition[] = [
  {
    apiName: "Email",
    label: "Email",
    dataType: "email",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Company",
    label: "Company",
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Phone",
    label: "Phone",
    dataType: "phone",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Mobile",
    label: "Mobile",
    dataType: "phone",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("DedupFieldDialog", () => {
  function renderFieldDialog(overrides: Partial<DedupFieldDialogProps> = {}) {
    const props: DedupFieldDialogProps = {
      pluralLabel: "Leads",
      panelFields: sampleFields,
      selected: ["Email"],
      onToggle: vi.fn(),
      onSubmit: vi.fn(),
      onCancel: vi.fn(),
      ...overrides,
    };
    render(<DedupFieldDialog {...props} />);
    return props;
  }

  it("renders a dialog named 'Select Field' with panel message and max selection rule", () => {
    renderFieldDialog({ pluralLabel: "Leads" });
    const dialog = screen.getByRole("dialog", { name: "Select Field" });
    expect(dialog).toBeTruthy();

    expect(
      within(dialog).getByText(dedupFieldPanelMessage("Leads"), { exact: false }),
    ).toBeTruthy();
    expect(
      within(dialog).getByText(`Maximum of ${DEDUP_MAX_FIELDS} fields can be selected.`),
    ).toBeTruthy();
  });

  it("renders one checkbox per panelFields label, checked exactly for selected", () => {
    renderFieldDialog({
      panelFields: sampleFields,
      selected: ["Email", "Phone"],
    });
    const dialog = screen.getByRole("dialog", { name: "Select Field" });

    for (const field of sampleFields) {
      expect(within(dialog).getByRole("checkbox", { name: field.label })).toBeTruthy();
    }

    const emailBox = within(dialog).getByRole("checkbox", { name: "Email" }) as HTMLInputElement;
    const companyBox = within(dialog).getByRole("checkbox", {
      name: "Company",
    }) as HTMLInputElement;
    const phoneBox = within(dialog).getByRole("checkbox", { name: "Phone" }) as HTMLInputElement;
    const mobileBox = within(dialog).getByRole("checkbox", { name: "Mobile" }) as HTMLInputElement;

    expect(emailBox.checked).toBe(true);
    expect(companyBox.checked).toBe(false);
    expect(phoneBox.checked).toBe(true);
    expect(mobileBox.checked).toBe(false);
  });

  it("calls onToggle(apiName) once when clicking a checkbox", async () => {
    const user = userEvent.setup();
    const props = renderFieldDialog({
      panelFields: sampleFields,
      selected: ["Email"],
    });
    const dialog = screen.getByRole("dialog", { name: "Select Field" });
    const companyBox = within(dialog).getByRole("checkbox", { name: "Company" });

    await user.click(companyBox);
    expect(props.onToggle).toHaveBeenCalledTimes(1);
    expect(props.onToggle).toHaveBeenCalledWith("Company");
  });

  it("disables 'Find And Merge Duplicates' with no selection and calls onSubmit when enabled", async () => {
    const user = userEvent.setup();
    renderFieldDialog({ selected: [] });
    const dialogDisabled = screen.getByRole("dialog", { name: "Select Field" });
    const disabledButton = within(dialogDisabled).getByRole("button", {
      name: "Find And Merge Duplicates",
    }) as HTMLButtonElement;
    expect(disabledButton.disabled).toBe(true);

    cleanup();

    const enabledProps = renderFieldDialog({ selected: ["Email"] });
    const dialogEnabled = screen.getByRole("dialog", { name: "Select Field" });
    const enabledButton = within(dialogEnabled).getByRole("button", {
      name: "Find And Merge Duplicates",
    }) as HTMLButtonElement;
    expect(enabledButton.disabled).toBe(false);

    await user.click(enabledButton);
    expect(enabledProps.onSubmit).toHaveBeenCalledOnce();
  });

  it("disables unselected checkboxes when DEDUP_MAX_FIELDS are selected while selected stay enabled", () => {
    const selectedFields = sampleFields.slice(0, DEDUP_MAX_FIELDS).map((f) => f.apiName);
    renderFieldDialog({
      panelFields: sampleFields,
      selected: selectedFields,
    });
    const dialog = screen.getByRole("dialog", { name: "Select Field" });

    for (const field of sampleFields) {
      const checkbox = within(dialog).getByRole("checkbox", {
        name: field.label,
      }) as HTMLInputElement;
      if (selectedFields.includes(field.apiName)) {
        expect(checkbox.checked).toBe(true);
        expect(checkbox.disabled).toBe(false);
      } else {
        expect(checkbox.checked).toBe(false);
        expect(checkbox.disabled).toBe(true);
      }
    }
  });

  it("calls onCancel when clicking 'Cancel'", async () => {
    const user = userEvent.setup();
    const props = renderFieldDialog();
    const dialog = screen.getByRole("dialog", { name: "Select Field" });

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(props.onCancel).toHaveBeenCalledOnce();
  });

  it("calls no callback and keeps the dialog open when pressing Escape", async () => {
    const user = userEvent.setup();
    const props = renderFieldDialog();

    await user.keyboard("{Escape}");

    expect(props.onCancel).not.toHaveBeenCalled();
    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(props.onToggle).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Select Field" })).toBeTruthy();
  });
});

describe("DedupConfirmDialog", () => {
  it("renders a dialog named 'Deduplicate <plural>' with confirm message, auto-merge and conflict items, learn more link and buttons in DOM order", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onProceed = vi.fn();
    const pluralLabel = "Leads";

    render(
      <DedupConfirmDialog pluralLabel={pluralLabel} onCancel={onCancel} onProceed={onProceed} />,
    );

    const dialog = screen.getByRole("dialog", { name: `Deduplicate ${pluralLabel}` });
    expect(dialog).toBeTruthy();

    expect(within(dialog).getByText(dedupConfirmMessage(pluralLabel))).toBeTruthy();
    expect(within(dialog).getByText("Auto-Merge:")).toBeTruthy();
    expect(within(dialog).getByText("Resolve Conflicts:")).toBeTruthy();

    const link = within(dialog).getByRole("link", { name: "Learn More" });
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("#learn-more");

    const buttons = within(dialog).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["Cancel", "Yes, proceed"]);

    const cancelButton = within(dialog).getByRole("button", { name: "Cancel" });
    const proceedButton = within(dialog).getByRole("button", { name: "Yes, proceed" });

    await user.click(cancelButton);
    expect(onCancel).toHaveBeenCalledOnce();

    await user.click(proceedButton);
    expect(onProceed).toHaveBeenCalledOnce();
  });
});

describe("DedupProgressDialog", () => {
  it("renders a dialog named 'Deduplication started' with progress text, and 'OK' calls onDismiss", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(<DedupProgressDialog onDismiss={onDismiss} />);

    const dialog = screen.getByRole("dialog", { name: "Deduplication started" });
    expect(dialog).toBeTruthy();

    expect(
      within(dialog).getByText(
        "Deduplication will take few minutes. You will be notified via email and popup once this action is complete.",
      ),
    ).toBeTruthy();

    const okButton = within(dialog).getByRole("button", { name: "OK" });
    await user.click(okButton);
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});

describe("DedupConflictPopup", () => {
  it("renders dialog named 'Deduplicate <plural>' with summary, conflictMessage, collapses on notice close and link, and resolves on action", async () => {
    const user = userEvent.setup();
    const onLater = vi.fn();
    const onResolveNow = vi.fn();
    const pluralLabel = "Leads";
    const summary = "1 duplicate group merged and 1 record removed.";
    const conflictMessage = "A Few duplicate Leads with conflicts found.";

    render(
      <DedupConflictPopup
        pluralLabel={pluralLabel}
        summary={summary}
        conflictMessage={conflictMessage}
        onLater={onLater}
        onResolveNow={onResolveNow}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: `Deduplicate ${pluralLabel}` });
    expect(dialog).toBeTruthy();

    expect(within(dialog).getByText(summary)).toBeTruthy();
    expect(within(dialog).getByText(conflictMessage)).toBeTruthy();

    const collapseButton = within(dialog).getByRole("button", {
      name: "Collapse deduplication notice",
    });
    await user.click(collapseButton);
    expect(onLater).toHaveBeenCalledTimes(1);

    const laterLink = within(dialog).getByRole("link", { name: "Do it later" });
    await user.click(laterLink);
    expect(onLater).toHaveBeenCalledTimes(2);

    const resolveButton = within(dialog).getByRole("button", { name: "Resolve Now" });
    await user.click(resolveButton);
    expect(onResolveNow).toHaveBeenCalledOnce();
  });
});
