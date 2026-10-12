import type { FieldDefinition, RecordData } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import { buildCompositeAddressDetailFields } from "./composite-address-detail";

function field(apiName: string, label: string): FieldDefinition {
  return {
    apiName,
    label,
    dataType: "textarea",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
  };
}

describe("buildCompositeAddressDetailFields", () => {
  const moduleFields = [
    field("Mailing_Address", "Mailing Address"),
    field("Other_Address", "Other Address"),
  ];

  const record: RecordData = {
    id: "contact-1",
    fields: {
      Mailing_Country: "Canada",
      Mailing_City: "Toronto",
      Other_Country: "United States",
      Other_Street: "1 Main St",
      Other_Zip: "90210",
    },
  };

  const mailingDisplay = ["Mailing_Country", "Mailing_Street", "Mailing_City"] as const;
  const otherDisplay = ["Other_Country", "Other_Street", "Other_Zip"] as const;

  it("renders one detail row per address composite", () => {
    const rows = buildCompositeAddressDetailFields(
      [
        { parentApiName: "Mailing_Address", displayFieldApiNames: mailingDisplay },
        { parentApiName: "Other_Address", displayFieldApiNames: otherDisplay },
      ],
      moduleFields,
      record,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.field.label).toBe("Mailing Address");
    expect(rows[0]?.value).toBe("Canada, Toronto");
    expect(rows[1]?.field.label).toBe("Other Address");
    expect(rows[1]?.value).toBe("United States, 1 Main St, 90210");
  });
});
