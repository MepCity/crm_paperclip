import type { FieldDefinition, ModuleMetadata, RecordInput } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it } from "vitest";
import { buildCloneInput } from "./build-clone-input";

function field(apiName: string, options: Partial<FieldDefinition> = {}): FieldDefinition {
  return {
    apiName,
    label: apiName,
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
    ...options,
  };
}

const syntheticMetadata: ModuleMetadata = {
  apiName: "Examples",
  singularLabel: "Example",
  pluralLabel: "Examples",
  businessCardFields: [],
  fields: [
    field("Owner", { dataType: "ownerlookup" }),
    field("Company"),
    field("Last_Name"),
    field("Record_Image", { dataType: "profileimage" }),
    field("Created_By", { views: { view: true, create: false, edit: false, quickCreate: false } }),
    field("Locked_Field", { readOnly: true }),
    field("Tag", { views: { view: true, create: false, edit: false, quickCreate: false } }),
  ],
  layout: [],
};

describe("buildCloneInput", () => {
  it("copies create-visible writable fields including Owner", () => {
    const source = {
      Owner: "user-a",
      Company: "Acme",
      Last_Name: "Source",
      Created_By: "system",
      Record_Image: "image-token",
      Tag: "hidden-on-create",
      Locked_Field: "blocked",
    };
    const result = buildCloneInput(syntheticMetadata, source);
    expect(result).toEqual({
      Owner: "user-a",
      Company: "Acme",
      Last_Name: "Source",
    });
  });

  it("preserves explicit nulls for cloneable fields", () => {
    const source: RecordInput = {
      Company: "Acme",
      Last_Name: "Source",
      Email: null,
    };
    const meta: ModuleMetadata = {
      ...syntheticMetadata,
      fields: [...syntheticMetadata.fields, field("Email", { dataType: "email" })],
    };
    const result = buildCloneInput(meta, source);
    expect(result.Email).toBeNull();
  });

  it("returns an empty object when the source has no cloneable values", () => {
    expect(buildCloneInput(syntheticMetadata, {})).toEqual({});
  });

  it("matches Leads fixture metadata exclusions", async () => {
    const service = createFixtureRecordService({
      orgId: "clone-test",
      orgSlug: "clone-test",
      orgName: "Clone Test",
      userId: "actor",
      role: "admin",
    });
    const metadata = await service.getModule("Leads");
    const result = buildCloneInput(metadata, {
      Owner: "user-a",
      Company: "Acme",
      Last_Name: "Source",
      Created_By: "system",
      Created_Time: "2026-01-01T00:00:00Z",
      Modified_By: "system",
      Modified_Time: "2026-01-02T00:00:00Z",
      Record_Image: "image-token",
    });
    expect(result).toMatchObject({
      Owner: "user-a",
      Company: "Acme",
      Last_Name: "Source",
    });
    expect(result.Created_By).toBeUndefined();
    expect(result.Record_Image).toBeUndefined();
  });
});
