import type { ModuleMetadata } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { createHttpRecordService } from "@/lib/api/client/http-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { decodeModule } from "@/lib/api/wire/codec";
import type { WireField } from "@/lib/api/wire/types";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { buildAccountsDetailSections } from "@/modules/accounts/accounts-detail-sections";
import { buildCallsDetailSections } from "@/modules/calls/calls-detail-sections";
import { buildContactsDetailSections } from "@/modules/contacts/contacts-detail-sections";
import { buildLeadsDetailSections } from "@/modules/leads/leads-detail-sections";
import { MeetingInformationDialog } from "@/modules/meetings/meeting-information-dialog";
import { buildMeetingsDetailSections } from "@/modules/meetings/meetings-detail-sections";
import { buildTasksDetailSections } from "@/modules/tasks/tasks-detail-sections";
import { render } from "@/test/render";
import { DetailsCard } from "./detail/details-card";
import { RecordFormScreen } from "./form/record-form-screen";
import { effectiveFilterGroups } from "./list/effective-fields";
import { FilterPanel } from "./list/filter-panel";
import { ManageColumnsDialog } from "./search/manage-columns-dialog";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(cleanup);
const custom: WireField & { id: string; custom_field: boolean } = {
  id: "custom-text",
  custom_field: true,
  api_name: "Custom_Text",
  field_label: "Custom Text",
  data_type: "text",
  system_mandatory: false,
  read_only: false,
  mass_update: true,
  unique: {},
  view_type: { view: true, create: true, edit: true, quick_create: true },
};
function metadata(): ModuleMetadata {
  const retired = {
    ...custom,
    id: "retired",
    api_name: "Retired_Text",
    field_label: "Retired Text",
  };
  return decodeModule(
    { api_name: "Leads", singular_label: "Lead", plural_label: "Leads", business_card_fields: [] },
    [custom],
    {
      id: "layout-default",
      default: true,
      sections: [
        {
          display_label: "Custom Information",
          column_count: 2,
          columns: [[custom.api_name], [retired.api_name]],
          fields: [custom, retired],
        },
      ],
    },
  );
}

it("renders an overlay field in the column chooser and filter panel; omitted fields stay absent", () => {
  const module = metadata();
  render(
    <ManageColumnsDialog
      isOpen
      onClose={vi.fn()}
      moduleLabel="Leads"
      allFields={module.fields}
      selectedColumns={[]}
      onSave={vi.fn()}
    />,
  );
  expect(
    within(screen.getByRole("dialog")).getByRole("checkbox", { name: "Custom Text" }),
  ).toBeTruthy();
  cleanup();
  render(
    <FilterPanel
      title="Filter Leads by"
      searchLabel="Search filter choices"
      searchPlaceholder="Search"
      groups={effectiveFilterGroups(
        [{ id: "fields", label: "Filter By Fields", items: [] }],
        module.fields,
        "Name",
        "Name",
      )}
      selectedIds={[]}
      onSelectionChange={vi.fn()}
    />,
  );
  expect(screen.getByRole("checkbox", { name: "Custom Text" })).toBeTruthy();
  expect(screen.queryByText("Retired Text")).toBeNull();
});

it.each(["create", "edit"])(
  "renders an overlay field in the %s form from its layout",
  async (mode) => {
    const fixture = createFixtureRecordService({
      orgId: `effective-${mode}`,
      orgSlug: "example",
      orgName: "Example",
      userId: "member-1",
      role: "admin",
    });
    const service = createClientRecordService(fixture, { listUsers: async () => [] });
    vi.spyOn(service, "getModule").mockResolvedValue(metadata());
    vi.spyOn(service, "get").mockResolvedValue({
      id: "record-1",
      fields: { Custom_Text: "Saved" },
    });
    render(
      <ApiProvider orgSlug="example" service={service}>
        <RecordFormScreen
          config={{
            module: "Leads",
            rules: { owner: "Owner" },
            paths: { detail: (id) => id, create: "create", cancel: "list" },
            navigate: vi.fn(),
          }}
          currentUserId="member-1"
          recordId={mode === "edit" ? "record-1" : undefined}
        />
      </ApiProvider>,
    );
    expect(await screen.findByRole("textbox", { name: "Custom Text" })).toBeTruthy();
    expect(screen.queryByText("Retired Text")).toBeNull();
  },
);

it.each([
  buildLeadsDetailSections,
  buildTasksDetailSections,
  buildMeetingsDetailSections,
  buildCallsDetailSections,
])("renders overlay layout fields in specialized detail sections", (buildSections) => {
  const module = metadata();
  const record = {
    id: "record-1",
    fields: { Custom_Text: "Custom value", Retired_Text: "Retired value" },
  };
  render(<DetailsCard sections={buildSections(module, record)} format={DEFAULT_FORMAT} />);
  expect(screen.getByText("Custom Information")).toBeTruthy();
  expect(screen.getByText("Custom value")).toBeTruthy();
  expect(screen.queryByText("Retired value")).toBeNull();
});

it.each([buildLeadsDetailSections, buildContactsDetailSections, buildAccountsDetailSections])(
  "keeps custom address-section fields while omitting retired composite values",
  (buildSections) => {
    const baseline = metadata();
    const module = {
      ...baseline,
      layout: baseline.layout.map((section) => ({ ...section, label: "Address Information" })),
    };
    const sections = buildSections(module, {
      id: "record-1",
      fields: {
        Custom_Text: "Custom value",
        City: "Retired value",
        Mailing_City: "Retired value",
        Billing_City: "Retired value",
      },
    });
    render(<DetailsCard sections={sections} format={DEFAULT_FORMAT} />);
    expect(screen.getByText("Custom value")).toBeTruthy();
    expect(screen.queryByText("Retired value")).toBeNull();
  },
);

it("includes effective quick-create fields in the meeting dialog", async () => {
  const fixture = createFixtureRecordService({
    orgId: "effective-quick",
    orgSlug: "example",
    orgName: "Example",
    userId: "member-1",
    role: "admin",
  });
  const service = createClientRecordService(fixture, { listUsers: async () => [] });
  vi.spyOn(service, "getModule").mockResolvedValue(metadata());
  render(
    <ApiProvider orgSlug="example" service={service}>
      <MeetingInformationDialog orgSlug="example" currentUserId="member-1" onClose={vi.fn()} />
    </ApiProvider>,
  );
  expect(await screen.findByRole("textbox", { name: "Custom Text" })).toBeTruthy();
  expect(screen.queryByText("Retired Text")).toBeNull();
});

it("shows a terminal metadata load error after exactly one retry of mismatched revisions", async () => {
  const fetch = vi.fn(async (path: string) => {
    if (path.includes("modules/"))
      return {
        revision: "a:1",
        modules: [
          {
            api_name: "Leads",
            singular_label: "Lead",
            plural_label: "Leads",
            business_card_fields: [],
          },
        ],
      };
    if (path.includes("fields?")) return { revision: "b:2", fields: [custom] };
    return { revision: "a:1", layouts: [{ id: "layout-1", default: true, sections: [] }] };
  });
  const fixture = createFixtureRecordService({
    orgId: "effective-mismatch",
    orgSlug: "example",
    orgName: "Example",
    userId: "member-1",
    role: "admin",
  });
  const service = createClientRecordService(fixture, { listUsers: async () => [] });
  service.getModule = createHttpRecordService({ orgSlug: "example", fetch }).getModule;
  render(
    <ApiProvider orgSlug="example" service={service}>
      <RecordFormScreen
        config={{
          module: "Leads",
          rules: { owner: "Owner" },
          paths: { detail: (id) => id, create: "create", cancel: "list" },
          navigate: vi.fn(),
        }}
        currentUserId="member-1"
      />
    </ApiProvider>,
  );
  expect((await screen.findByRole("alert")).textContent).toBe("Unable to load the form.");
  expect(fetch).toHaveBeenCalledTimes(6);
});
