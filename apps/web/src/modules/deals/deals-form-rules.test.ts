import { expect, test } from "vitest";
import { buildFormModel, formFields } from "@/components/records/form/form-model";
import {
  buildDealsFormDefaults,
  DEALS_FORM_CREATE_TITLE,
  DEALS_FORM_DEFAULTS,
  DEALS_FORM_EDIT_TITLE,
  DEALS_FORM_INFORMATION_COLUMNS,
  DEALS_FORM_PICKLIST_NONE,
  DEALS_FORM_PROBABILITY_DEFAULT,
  DEALS_FORM_STAGE_DEFAULT,
  dealsFormRules,
} from "./deals-form-rules";
import { dealField, dealMetadata } from "./test-metadata";

test("preserves Deals form titles, owner key, currencies and default values", () => {
  expect(DEALS_FORM_CREATE_TITLE).toBe("Create Deal");
  expect(DEALS_FORM_EDIT_TITLE).toBe("Edit Deal");

  expect(dealsFormRules.owner).toBe("Owner");
  expect(dealsFormRules.currency).toBe("Amount");
  expect(dealsFormRules.currencies).toEqual(["Amount", "Expected_Revenue"]);
  expect(dealsFormRules.omitted).toEqual(["Connected_To__s", "Reason_For_Loss__s"]);
  expect(dealsFormRules.omittedSections).toEqual(["Deal Image"]);

  expect(DEALS_FORM_STAGE_DEFAULT).toBe("Qualification");
  expect(DEALS_FORM_PROBABILITY_DEFAULT).toBe(10);
  expect(DEALS_FORM_PICKLIST_NONE).toBe("-None-");
  expect(buildDealsFormDefaults()).toEqual(DEALS_FORM_DEFAULTS);
  expect(typeof dealsFormRules.defaultValues).toBe("function");
});

test("reads Stage and Probability defaults from metadata picklist (PicklistOption.stage.probability)", () => {
  const customMetadata = dealMetadata([
    dealField("Stage", {
      dataType: "picklist",
      picklist: [
        {
          storedValue: "Needs Analysis",
          displayValue: "Needs Analysis",
          stage: {
            probability: 20,
            forecastCategory: "Pipeline",
            category: "Open",
          },
        },
        {
          storedValue: "Value Proposition",
          displayValue: "Value Proposition",
          stage: {
            probability: 40,
            forecastCategory: "Pipeline",
            category: "Open",
          },
        },
      ],
    }),
  ]);

  const defaults = buildDealsFormDefaults(customMetadata);
  expect(defaults).toEqual({
    Stage: "Needs Analysis",
    Probability: 20,
    Type: "-None-",
    Lead_Source: "-None-",
  });
});

test("marks required fields and currency types in form fields model", () => {
  const metadata = {
    ...dealMetadata([
      dealField("Owner"),
      dealField("Deal_Name", { required: true }),
      dealField("Account_Name", { required: true, dataType: "lookup" }),
      dealField("Closing_Date", { required: true, dataType: "date" }),
      dealField("Stage", { required: true, dataType: "picklist" }),
      dealField("Amount", { dataType: "currency" }),
      dealField("Expected_Revenue", { dataType: "currency", readOnly: true }),
      dealField("Connected_To__s", { dataType: "multi_module_lookup" }),
      dealField("Reason_For_Loss__s", { dataType: "picklist" }),
    ]),
    layout: [
      {
        label: "Deal Information",
        columnCount: 2,
        columns: [
          ["Owner", "Deal_Name", "Account_Name", "Connected_To__s"],
          ["Closing_Date", "Stage", "Amount", "Expected_Revenue", "Reason_For_Loss__s"],
        ],
        fields: [
          "Owner",
          "Deal_Name",
          "Account_Name",
          "Connected_To__s",
          "Closing_Date",
          "Stage",
          "Amount",
          "Expected_Revenue",
          "Reason_For_Loss__s",
        ],
      },
    ],
  };

  const fields = formFields(metadata, buildFormModel(metadata, "create"), "create", dealsFormRules);

  expect(fields.find((f) => f.apiName === "Deal_Name")?.required).toBe(true);
  expect(fields.find((f) => f.apiName === "Account_Name")?.required).toBe(true);
  expect(fields.find((f) => f.apiName === "Closing_Date")?.required).toBe(true);
  expect(fields.find((f) => f.apiName === "Stage")?.required).toBe(true);
  expect(fields.find((f) => f.apiName === "Amount")?.dataType).toBe("currency");
  expect(fields.find((f) => f.apiName === "Expected_Revenue")?.readOnly).toBe(true);

  // Reason For Loss and Connected To are omitted from form
  expect(fields.find((f) => f.apiName === "Connected_To__s")).toBeUndefined();
  expect(fields.find((f) => f.apiName === "Reason_For_Loss__s")).toBeUndefined();
});

test("exports spec 7-row column order for Deal Information", () => {
  expect(DEALS_FORM_INFORMATION_COLUMNS[0]).toEqual([
    "Owner",
    "Deal_Name",
    "Account_Name",
    "Type",
    "Next_Step",
    "Lead_Source",
    "Contact_Name",
  ]);
  expect(DEALS_FORM_INFORMATION_COLUMNS[1]).toEqual([
    "Amount",
    "Closing_Date",
    "Stage",
    "Probability",
    "Expected_Revenue",
    "Campaign_Source",
  ]);
});
