import { expect, test } from "vitest";
import {
  buildDealsBusinessCardFields,
  buildDealsDetailSections,
  DEALS_BUSINESS_CARD_FIELDS,
} from "./deals-detail-sections";
import { dealField, dealMetadata, dealRecord } from "./test-metadata";

test("builds business card in the order: Deal Owner, Stage, Probability (%), Expected Revenue, Closing Date", () => {
  const metadata = dealMetadata([
    dealField("Owner", { label: "Deal Owner" }),
    dealField("Stage", { label: "Stage" }),
    dealField("Probability", { label: "Probability (%)" }),
    dealField("Expected_Revenue", { label: "Expected Revenue" }),
    dealField("Closing_Date", { label: "Closing Date" }),
  ]);

  const record = dealRecord({
    Owner: "user-1",
    Stage: "Qualification",
    Probability: 10,
    Expected_Revenue: 5000,
    Closing_Date: "2026-12-31",
  });

  const fields = buildDealsBusinessCardFields(metadata, record);
  expect(fields.map((f) => f.field.apiName)).toEqual([
    "Owner",
    "Stage",
    "Probability",
    "Expected_Revenue",
    "Closing_Date",
  ]);
  expect(fields.map((f) => f.value)).toEqual(["user-1", "Qualification", 10, 5000, "2026-12-31"]);
  expect(DEALS_BUSINESS_CARD_FIELDS).toEqual([
    "Owner",
    "Stage",
    "Probability",
    "Expected_Revenue",
    "Closing_Date",
  ]);
});

test("builds detail sections from layout, filtering out Deal Image", () => {
  const metadata = {
    ...dealMetadata([
      dealField("Deal_Name", { label: "Deal Name" }),
      dealField("Amount", { label: "Amount" }),
      dealField("Description", { label: "Description" }),
      dealField("Created_By", { label: "Created By" }),
      dealField("Created_Time", { label: "Created Time" }),
    ]),
    layout: [
      {
        label: "Deal Image",
        columnCount: 1,
        columns: [[]],
        fields: [],
      },
      {
        label: "Deal Information",
        columnCount: 2,
        columns: [["Deal_Name", "Created_By"], ["Amount"]],
        fields: ["Deal_Name", "Created_By", "Amount"],
      },
      {
        label: "Description Information",
        columnCount: 1,
        columns: [["Description"]],
        fields: ["Description"],
      },
    ],
  };

  const record = dealRecord({
    Deal_Name: "Sample Deal",
    Amount: 1000,
    Description: "Some details",
    Created_By: "admin",
    Created_Time: "2026-10-10T10:00:00Z",
  });

  const sections = buildDealsDetailSections(metadata, record);
  expect(sections.map((s) => s.title)).toEqual(["Deal Information", "Description Information"]);

  const dealInfoFields = sections[0]?.fields ?? [];
  expect(dealInfoFields.map((f) => f.field.apiName)).toEqual(["Deal_Name", "Created_By", "Amount"]);
  expect(dealInfoFields[0]?.column).toBe("left");
  expect(dealInfoFields[1]?.column).toBe("left");
  expect(dealInfoFields[1]?.auditTimestamp).toBe("2026-10-10T10:00:00Z");
  expect(dealInfoFields[2]?.column).toBe("right");

  const descFields = sections[1]?.fields ?? [];
  expect(descFields[0]?.column).toBe("full");
  expect(descFields[0]?.value).toBe("Some details");
});
