import type { FieldDefinition, ModuleMetadata } from "@crm/core/records";
import { expect, test } from "vitest";
import {
  addressRulesList,
  buildFormModel,
  formFields,
  resolveFormRules,
} from "@/components/records/form/form-model";
import { leadsFormFields, leadsFormRules } from "./leads-form-rules";

function leadField(apiName: string, extra: Partial<FieldDefinition> = {}): FieldDefinition {
  return {
    apiName,
    label: apiName,
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
    ...extra,
  };
}

function leadMetadata(
  fields: readonly FieldDefinition[] = [],
  layout: ModuleMetadata["layout"] = [],
): ModuleMetadata {
  return {
    apiName: "Leads",
    singularLabel: "Lead",
    pluralLabel: "Leads",
    fields,
    businessCardFields: [],
    layout,
  };
}

test("leadsFormFields exports all standard composite field API names", () => {
  expect(leadsFormFields).toEqual({
    owner: "Owner",
    firstName: "First_Name",
    salutation: "Salutation",
    address: "Address",
    country: "Country",
    state: "State",
    latitude: "Latitude",
    longitude: "Longitude",
    coordinates: "Coordinates",
    revenue: "Annual_Revenue",
    twitter: "Twitter",
    connected: "Connected_To__s",
    building: "Flat_House_No_Building_Apartment_Name",
  });
});

test("owner rule designates Owner field", () => {
  expect(leadsFormRules.owner).toBe(leadsFormFields.owner);
  expect(leadsFormRules.owner).toBe("Owner");
});

test("prefix rule pairs Salutation with First_Name in layout and form fields", () => {
  expect(leadsFormRules.prefix).toEqual({
    field: leadsFormFields.firstName,
    prefix: leadsFormFields.salutation,
  });

  const metadata = leadMetadata(
    [
      leadField("Owner"),
      leadField("First_Name"),
      leadField("Salutation", { dataType: "picklist" }),
    ],
    [
      {
        label: "Lead Information",
        columnCount: 1,
        columns: [["Owner", "First_Name"]],
        fields: ["Owner", "First_Name"],
      },
    ],
  );

  const fields = formFields(metadata, buildFormModel(metadata, "create"), "create", leadsFormRules);
  expect(fields.some((f) => f.apiName === "Salutation")).toBe(true);
});

test("prefix rule does not pull Salutation when First_Name is absent from layout", () => {
  const metadata = leadMetadata(
    [
      leadField("Owner"),
      leadField("First_Name"),
      leadField("Salutation", { dataType: "picklist" }),
    ],
    [
      {
        label: "Lead Information",
        columnCount: 1,
        columns: [["Owner"]],
        fields: ["Owner"],
      },
    ],
  );

  const fields = formFields(metadata, buildFormModel(metadata, "create"), "create", leadsFormRules);
  expect(fields.some((f) => f.apiName === "Salutation")).toBe(false);
});

test("prefix rule respects views visibility for Salutation", () => {
  const metadata = leadMetadata(
    [
      leadField("Owner"),
      leadField("First_Name"),
      leadField("Salutation", {
        views: { view: true, create: false, edit: true, quickCreate: false },
      }),
    ],
    [
      {
        label: "Lead Information",
        columnCount: 1,
        columns: [["Owner", "First_Name"]],
        fields: ["Owner", "First_Name"],
      },
    ],
  );

  const createFields = formFields(
    metadata,
    buildFormModel(metadata, "create"),
    "create",
    leadsFormRules,
  );
  expect(createFields.some((f) => f.apiName === "Salutation")).toBe(false);

  const editFields = formFields(metadata, buildFormModel(metadata, "edit"), "edit", leadsFormRules);
  expect(editFields.some((f) => f.apiName === "Salutation")).toBe(true);
});

test("address rule configures Address composite fields and auto-includes coordinates", () => {
  expect(leadsFormRules.address).toEqual({
    field: leadsFormFields.address,
    latitude: leadsFormFields.latitude,
    longitude: leadsFormFields.longitude,
    coordinates: leadsFormFields.coordinates,
    country: leadsFormFields.country,
    state: leadsFormFields.state,
  });

  const rulesList = addressRulesList(leadsFormRules);
  expect(rulesList).toHaveLength(1);
  expect(rulesList[0]?.field).toBe("Address");
  expect(rulesList[0]?.latitude).toBe("Latitude");
  expect(rulesList[0]?.longitude).toBe("Longitude");

  const metadata = leadMetadata(
    [
      leadField("Address"),
      leadField("Latitude", { dataType: "double" }),
      leadField("Longitude", { dataType: "double" }),
    ],
    [
      {
        label: "Address Information",
        columnCount: 1,
        columns: [["Address"]],
        fields: ["Address"],
      },
    ],
  );

  const fields = formFields(metadata, buildFormModel(metadata, "create"), "create", leadsFormRules);
  expect(fields.some((f) => f.apiName === "Address")).toBe(true);
  expect(fields.some((f) => f.apiName === "Latitude")).toBe(true);
  expect(fields.some((f) => f.apiName === "Longitude")).toBe(true);
});

test("address rule does not pull coordinates when Address is not in layout", () => {
  const metadata = leadMetadata(
    [
      leadField("Company"),
      leadField("Address"),
      leadField("Latitude", { dataType: "double" }),
      leadField("Longitude", { dataType: "double" }),
    ],
    [
      {
        label: "Lead Information",
        columnCount: 1,
        columns: [["Company"]],
        fields: ["Company"],
      },
    ],
  );

  const fields = formFields(metadata, buildFormModel(metadata, "create"), "create", leadsFormRules);
  expect(fields.some((f) => f.apiName === "Latitude")).toBe(false);
  expect(fields.some((f) => f.apiName === "Longitude")).toBe(false);
});

test("country rule pairs Country and State", () => {
  expect(leadsFormRules.country).toEqual({
    field: leadsFormFields.country,
    state: leadsFormFields.state,
  });
  expect(leadsFormRules.country?.field).toBe("Country");
  expect(leadsFormRules.country?.state).toBe("State");
});

test("currency rule designates Annual_Revenue", () => {
  expect(leadsFormRules.currency).toBe(leadsFormFields.revenue);
  expect(leadsFormRules.currency).toBe("Annual_Revenue");
});

test("textPrefixes rule defines Twitter @ prefix", () => {
  expect(leadsFormRules.textPrefixes).toEqual({
    [leadsFormFields.twitter]: "@",
  });
  expect(leadsFormRules.textPrefixes?.Twitter).toBe("@");
  expect(leadsFormRules.textPrefixes?.Company).toBeUndefined();
});

test("omitted rule excludes Connected_To__s from form fields", () => {
  expect(leadsFormRules.omitted).toEqual([leadsFormFields.connected]);
  expect(leadsFormRules.omitted).toContain("Connected_To__s");

  const metadata = leadMetadata(
    [leadField("Company"), leadField("Connected_To__s", { dataType: "multi_module_lookup" })],
    [
      {
        label: "Lead Information",
        columnCount: 1,
        columns: [["Company", "Connected_To__s"]],
        fields: ["Company", "Connected_To__s"],
      },
    ],
  );

  const fields = formFields(metadata, buildFormModel(metadata, "create"), "create", leadsFormRules);
  expect(fields.some((f) => f.apiName === "Company")).toBe(true);
  expect(fields.some((f) => f.apiName === "Connected_To__s")).toBe(false);
});

test("labelLines rule provides multi-line formatting for building field", () => {
  expect(leadsFormRules.labelLines).toEqual({
    [leadsFormFields.building]: ["Flat / House No./", "Building /", "Apartment Name"],
  });
  expect(leadsFormRules.labelLines?.Flat_House_No_Building_Apartment_Name).toEqual([
    "Flat / House No./",
    "Building /",
    "Apartment Name",
  ]);
  expect(leadsFormRules.labelLines?.Street).toBeUndefined();
});

test("resolveFormRules preserves leadsFormRules without stage conditional alterations", () => {
  const metadata = leadMetadata([leadField("Owner")]);
  const resolvedCreate = resolveFormRules(leadsFormRules, {
    mode: "create",
    metadata,
  });
  expect(resolvedCreate).toBe(leadsFormRules);
  expect(resolvedCreate.omitted).toEqual(["Connected_To__s"]);

  const resolvedEdit = resolveFormRules(leadsFormRules, {
    mode: "edit",
    metadata,
    record: { id: "lead-1", fields: { Owner: "user-1" } },
  });
  expect(resolvedEdit).toBe(leadsFormRules);
});

test("integration: full layout verifies composite, prefix, omission, and required rules", () => {
  const metadata: ModuleMetadata = {
    apiName: "Leads",
    singularLabel: "Lead",
    pluralLabel: "Leads",
    businessCardFields: [],
    fields: [
      leadField("Owner"),
      leadField("First_Name"),
      leadField("Salutation", { dataType: "picklist" }),
      leadField("Last_Name", { required: true }),
      leadField("Company", { required: true }),
      leadField("Address"),
      leadField("Country"),
      leadField("State"),
      leadField("Latitude", { dataType: "double" }),
      leadField("Longitude", { dataType: "double" }),
      leadField("Coordinates"),
      leadField("Annual_Revenue", { dataType: "currency" }),
      leadField("Twitter"),
      leadField("Connected_To__s", { dataType: "multi_module_lookup" }),
      leadField("Flat_House_No_Building_Apartment_Name"),
    ],
    layout: [
      {
        label: "Lead Information",
        columnCount: 2,
        columns: [
          ["Owner", "First_Name", "Company", "Flat_House_No_Building_Apartment_Name"],
          ["Last_Name", "Annual_Revenue", "Twitter", "Connected_To__s"],
        ],
        fields: [
          "Owner",
          "First_Name",
          "Company",
          "Flat_House_No_Building_Apartment_Name",
          "Last_Name",
          "Annual_Revenue",
          "Twitter",
          "Connected_To__s",
        ],
      },
      {
        label: "Address Information",
        columnCount: 1,
        columns: [["Address", "Country", "State"]],
        fields: ["Address", "Country", "State"],
      },
    ],
  };

  const fields = formFields(metadata, buildFormModel(metadata, "create"), "create", leadsFormRules);

  const apiNames = fields.map((f) => f.apiName);
  expect(apiNames).toContain("Owner");
  expect(apiNames).toContain("First_Name");
  expect(apiNames).toContain("Salutation"); // pulled in by prefix rule
  expect(apiNames).toContain("Last_Name");
  expect(apiNames).toContain("Company");
  expect(apiNames).toContain("Address");
  expect(apiNames).toContain("Latitude"); // pulled in by address rule
  expect(apiNames).toContain("Longitude"); // pulled in by address rule
  expect(apiNames).toContain("Country");
  expect(apiNames).toContain("State");
  expect(apiNames).toContain("Annual_Revenue");
  expect(apiNames).toContain("Twitter");
  expect(apiNames).toContain("Flat_House_No_Building_Apartment_Name");
  expect(apiNames).not.toContain("Connected_To__s"); // omitted rule

  expect(fields.find((f) => f.apiName === "Last_Name")?.required).toBe(true);
  expect(fields.find((f) => f.apiName === "Company")?.required).toBe(true);
  expect(fields.find((f) => f.apiName === "First_Name")?.required).toBe(false);
});
