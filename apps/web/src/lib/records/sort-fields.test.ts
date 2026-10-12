import type { FieldDefinition } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { beforeAll, expect, test } from "vitest";
import { LEADS_SORT_FIELD_LABELS, leadsListPageConfig } from "@/modules/leads/list-config";
import { resolveSortFieldLabels } from "./sort-fields";

/** research/specs/list-views.md › Sorting and Layout › Visual layout › Sort By field dropdown. */
const OBSERVED_LABELS = [
  "Address - City",
  "Address - Country / Region",
  "Address - Flat / House No./ Building / Apartment Name",
  "Address - Latitude",
  "Address - Longitude",
  "Address - State / Province",
  "Address - Street Address",
  "Address - Zip / Postal Code",
  "Annual Revenue",
  "Company",
  "Created By",
  "Created Time",
  "Distance",
  "Email",
  "Email Opt Out",
  "Fax",
  "First Name",
  "Industry",
  "Last Activity Time",
  "Last Name",
  "Lead Conversion Time",
  "Lead Name",
  "Lead Owner",
  "Lead Source",
  "Lead Status",
  "Mobile",
  "Modified By",
  "Modified Time",
  "No. of Employees",
  "Phone",
  "Rating",
  "Salutation",
  "Secondary Email",
  "Skype ID",
  "Title",
  "Twitter",
  "Unsubscribed Mode",
  "Unsubscribed Time",
  "Website",
] as const;

/** Each observed label maps to the Leads metadata field carrying that label. */
const OBSERVED_API_NAMES = [
  "City",
  "Country",
  "Flat_House_No_Building_Apartment_Name",
  "Latitude",
  "Longitude",
  "State",
  "Street",
  "Zip_Code",
  "Annual_Revenue",
  "Company",
  "Created_By",
  "Created_Time",
  "nearby_distance__s",
  "Email",
  "Email_Opt_Out",
  "Fax",
  "First_Name",
  "Industry",
  "Last_Activity_Time",
  "Last_Name",
  "Lead_Conversion_Time",
  "Full_Name",
  "Owner",
  "Lead_Source",
  "Lead_Status",
  "Mobile",
  "Modified_By",
  "Modified_Time",
  "No_of_Employees",
  "Phone",
  "Rating",
  "Salutation",
  "Secondary_Email",
  "Skype_ID",
  "Designation",
  "Twitter",
  "Unsubscribed_Mode",
  "Unsubscribed_Time",
  "Website",
] as const;

let fields: readonly FieldDefinition[] = [];

beforeAll(async () => {
  const service = createFixtureRecordService({
    orgId: "org-1",
    orgSlug: "sort-fields-test",
    orgName: "Sort Fields Test",
    userId: "sort-fields-user",
    role: "admin",
  });
  fields = (await service.getModule("Leads")).fields;
});

test("the configured Sort By labels are the observed list in the observed order", () => {
  expect(LEADS_SORT_FIELD_LABELS).toEqual(OBSERVED_LABELS);
  expect(OBSERVED_LABELS).toHaveLength(39);
});

test("every observed label resolves to a Leads metadata field, in order", () => {
  const options = resolveSortFieldLabels(leadsListPageConfig, fields);
  expect(options.map((option) => option.label)).toEqual([...OBSERVED_LABELS]);
  expect(options.map((option) => option.apiName)).toEqual([...OBSERVED_API_NAMES]);
});

test("Lead Name resolves to the configured link field, keeping the observed label", () => {
  const config = {
    sortFieldLabels: ["Lead Name"],
    linkField: leadsListPageConfig.linkField,
    linkFieldLabel: leadsListPageConfig.linkFieldLabel,
  };
  expect(resolveSortFieldLabels(config, fields)).toEqual([
    { apiName: "Full_Name", label: "Lead Name" },
  ]);
});

test("labels with no metadata field are dropped and the order is kept", () => {
  const config = {
    sortFieldLabels: ["Address - City", "Converted Account Owner", "Company"],
    linkField: leadsListPageConfig.linkField,
    linkFieldLabel: leadsListPageConfig.linkFieldLabel,
  };
  expect(resolveSortFieldLabels(config, fields)).toEqual([
    { apiName: "City", label: "Address - City" },
    { apiName: "Company", label: "Company" },
  ]);
});

test("a link field label with no configured link field in metadata is dropped", () => {
  const config = {
    sortFieldLabels: ["Lead Name", "Lead Name"],
    linkField: "Missing_Name",
    linkFieldLabel: "Lead Name",
  };
  expect(resolveSortFieldLabels(config, fields)).toEqual([]);
});
