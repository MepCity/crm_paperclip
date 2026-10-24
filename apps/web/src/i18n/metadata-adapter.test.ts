import type { ModuleMetadata } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import { translator } from "./catalogs";
import { createMetadataDisplayAdapter } from "./metadata-adapter";

describe("MetadataDisplayAdapter", () => {
  const sampleModule: ModuleMetadata = {
    apiName: "Leads",
    singularLabel: "Lead",
    pluralLabel: "Leads",
    businessCardFields: ["Company", "Email"],
    fields: [
      {
        apiName: "Company",
        label: "Company",
        dataType: "text",
        required: true,
        readOnly: false,
        unique: false,
        massUpdate: true,
        views: { view: true, create: true, edit: true, quickCreate: true },
      },
      {
        apiName: "First_Name",
        label: "First Name",
        dataType: "text",
        required: false,
        readOnly: false,
        unique: false,
        massUpdate: false,
        views: { view: false, create: true, edit: true, quickCreate: true },
      },
      {
        apiName: "Custom_Field__c",
        label: "My Custom Label",
        dataType: "text",
        required: false,
        readOnly: false,
        unique: false,
        massUpdate: false,
        views: { view: true, create: true, edit: true, quickCreate: true },
      },
      {
        apiName: "Phone",
        label: "Customized Telephone", // User customized this standard field
        dataType: "phone",
        required: false,
        readOnly: false,
        unique: false,
        massUpdate: true,
        views: { view: true, create: true, edit: true, quickCreate: true },
      },
    ],
    layout: [
      {
        label: "Lead Information",
        columnCount: 2,
        columns: [["Company"], ["First_Name"]],
        fields: ["Company", "First_Name"],
      },
      {
        label: "Custom Section",
        columnCount: 1,
        columns: [["Custom_Field__c"]],
        fields: ["Custom_Field__c"],
      },
    ],
  };

  it("translates built-in module names, field labels, and layout sections in Turkish", () => {
    const t = translator("tr");
    const adapter = createMetadataDisplayAdapter(t, "tr");

    expect(adapter.getModuleSingular("Leads")).toBe("Müşteri Adayı");
    expect(adapter.getModulePlural("Leads")).toBe("Müşteri Adayları");

    const adapted = adapter.adaptModule(sampleModule);
    expect(adapted.singularLabel).toBe("Müşteri Adayı");
    expect(adapted.pluralLabel).toBe("Müşteri Adayları");

    // Built-in fields are translated
    const company = adapted.fields.find((f) => f.apiName === "Company");
    expect(company?.label).toBe("Şirket");

    const firstName = adapted.fields.find((f) => f.apiName === "First_Name");
    expect(firstName?.label).toBe("Adı");

    // Layout sections
    expect(adapted.layout[0]?.label).toBe("Müşteri Adayı Bilgisi");
  });

  it("preserves customized and custom field labels verbatim in Turkish", () => {
    const t = translator("tr");
    const adapter = createMetadataDisplayAdapter(t, "tr");
    const adapted = adapter.adaptModule(sampleModule);

    // Custom field stays verbatim
    const custom = adapted.fields.find((f) => f.apiName === "Custom_Field__c");
    expect(custom?.label).toBe("My Custom Label");

    // Standard field with customized label stays verbatim
    const phone = adapted.fields.find((f) => f.apiName === "Phone");
    expect(phone?.label).toBe("Customized Telephone");

    // Custom layout section stays verbatim
    expect(adapted.layout[1]?.label).toBe("Custom Section");
  });

  it("returns English baseline labels in English mode", () => {
    const t = translator("en");
    const adapter = createMetadataDisplayAdapter(t, "en");

    expect(adapter.getModuleSingular("Leads")).toBe("Lead");
    expect(adapter.getModulePlural("Leads")).toBe("Leads");

    const adapted = adapter.adaptModule(sampleModule);
    expect(adapted.singularLabel).toBe("Lead");
    expect(adapted.pluralLabel).toBe("Leads");

    const company = adapted.fields.find((f) => f.apiName === "Company");
    expect(company?.label).toBe("Company");
    expect(adapted.layout[0]?.label).toBe("Lead Information");
  });

  it("translates related list titles in Turkish and preserves unknown titles", () => {
    const t = translator("tr");
    const adapter = createMetadataDisplayAdapter(t, "tr");

    expect(adapter.getRelatedListTitle("notes", "Notes")).toBe("Notlar");
    expect(adapter.getRelatedListTitle("attachments", "Attachments")).toBe("Eklentiler");
    expect(adapter.getRelatedListTitle("openActivities", "Open Activities")).toBe(
      "Açık Aktiviteler",
    );
    expect(adapter.getRelatedListTitle("open-activities", "Open Activities")).toBe(
      "Açık Aktiviteler",
    );
    expect(adapter.getRelatedListTitle("closed-activities", "Closed Activities")).toBe(
      "Kapalı Aktiviteler",
    );
    expect(adapter.getRelatedListTitle("unknown", "Custom Related List")).toBe(
      "Custom Related List",
    );
    expect(adapter.getNamedLabel("Lead Name")).toBe("Müşteri Adayı Adı");
    expect(adapter.getNamedLabel("Custom Field Name")).toBe("Custom Field Name");
  });
});
