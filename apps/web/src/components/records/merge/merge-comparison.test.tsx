import type { FieldDefinition, RecordData } from "@crm/core/records";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { MergeComparison } from "./merge-comparison";

const format = { locale: "en-US", timeZone: "Europe/Istanbul" };

function ComparisonHarness(
  props: Omit<
    ComponentProps<typeof MergeComparison>,
    "conflictsOnly" | "onConflictsOnlyChange"
  >,
) {
  const [conflictsOnly, setConflictsOnly] = useState(false);
  return (
    <MergeComparison
      {...props}
      conflictsOnly={conflictsOnly}
      onConflictsOnlyChange={setConflictsOnly}
    />
  );
}

const email: FieldDefinition = {
  apiName: "Email",
  label: "Email",
  dataType: "email",
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: true,
  views: { view: true, create: true, edit: true, quickCreate: true },
};

const modified: FieldDefinition = {
  ...email,
  apiName: "Modified_Time",
  label: "Modified Time",
  dataType: "datetime",
  readOnly: true,
};

const records: RecordData[] = [
  { id: "1", fields: { Full_Name: "One", Email: "one@test", Modified_Time: "2020-01-01" } },
  { id: "2", fields: { Full_Name: "Two", Email: "two@test", Modified_Time: "2020-01-01" } },
];

describe("MergeComparison", () => {
  it("hides non-conflicting rows when conflicts only is enabled", async () => {
    const user = userEvent.setup();
    render(
      <ComparisonHarness
        records={records}
        fields={[email, modified]}
        masterId="1"
        fieldChoices={{ Email: "1" }}
        ownerNames={{}}
        format={format}
        displayNameField="Full_Name"
        onMasterChange={vi.fn()}
        onFieldChoiceChange={vi.fn()}
        onSelectAllFromRecord={vi.fn()}
      />,
    );
    expect(screen.getByText("Modified Time")).toBeTruthy();
    await user.click(screen.getByRole("checkbox", { name: "Show Conflicts Only" }));
    expect(screen.queryByText("Modified Time")).toBeNull();
    expect(screen.getByText("Email")).toBeTruthy();
  });

  it("does not render row radios for read-only fields", () => {
    render(
      <MergeComparison
        records={records}
        fields={[modified]}
        masterId="1"
        fieldChoices={{}}
        conflictsOnly={false}
        ownerNames={{}}
        format={format}
        displayNameField="Full_Name"
        onMasterChange={vi.fn()}
        onFieldChoiceChange={vi.fn()}
        onSelectAllFromRecord={vi.fn()}
        onConflictsOnlyChange={vi.fn()}
      />,
    );
    expect(screen.queryAllByRole("radio", { name: /Modified Time value choice/ })).toHaveLength(0);
  });
});
