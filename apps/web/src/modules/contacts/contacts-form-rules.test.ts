import { expect, test } from "vitest";
import { buildFormModel, formFields } from "@/components/records/form/form-model";
import {
  CONTACTS_FORM_ADDRESS_CHILD_ORDER,
  CONTACTS_FORM_ADDRESS_GROUPS,
  CONTACTS_FORM_INFORMATION_COLUMNS,
  contactsFormRules,
} from "./contacts-form-rules";
import { contactField, contactMetadata } from "./test-metadata";

test("reads required Last Name and salutation from metadata and supplies current-user owner key", () => {
  const metadata = {
    ...contactMetadata([
      contactField("Owner"),
      contactField("Last_Name", { required: true }),
      contactField("First_Name"),
      contactField("Salutation", { dataType: "picklist" }),
    ]),
    layout: [
      {
        label: "Contact Information",
        columnCount: 2,
        columns: [["Owner", "First_Name"], ["Last_Name"]],
        fields: ["Owner", "First_Name", "Last_Name"],
      },
    ],
  };
  const fields = formFields(
    metadata,
    buildFormModel(metadata, "create"),
    "create",
    contactsFormRules,
  );
  expect(fields.find((field) => field.apiName === "Last_Name")?.required).toBe(true);
  expect(fields.some((field) => field.apiName === "Salutation")).toBe(true);
  expect(contactsFormRules.owner).toBe("Owner");
  expect(contactsFormRules.textPrefixes).toEqual({ Twitter: "@" });
  expect(contactsFormRules.omitted).toEqual(["Connected_To__s"]);
  expect(contactsFormRules.countries).toHaveLength(2);
  expect(contactsFormRules.addresses).toHaveLength(2);
});
test("exports spec column order and address presentation composites", () => {
  expect(CONTACTS_FORM_INFORMATION_COLUMNS[0]).toEqual([
    "Owner",
    "First_Name",
    "Account_Name",
    "Email",
    "Phone",
    "Other_Phone",
    "Mobile",
    "Assistant",
  ]);
  expect(CONTACTS_FORM_INFORMATION_COLUMNS[1]).toEqual([
    "Lead_Source",
    "Last_Name",
    "Vendor_Name",
    "Title",
    "Department",
    "Home_Phone",
    "Fax",
    "Date_of_Birth",
    "Asst_Phone",
    "Email_Opt_Out",
    "Skype_ID",
    "Secondary_Email",
    "Twitter",
    "Reporting_To",
  ]);
  expect(
    CONTACTS_FORM_ADDRESS_GROUPS.map((group) => [group.field, group.latitude, group.longitude]),
  ).toEqual([
    ["Mailing_Address", "Mailing_Latitude", "Mailing_Longitude"],
    ["Other_Address", "Other_Latitude", "Other_Longitude"],
  ]);
  expect(CONTACTS_FORM_ADDRESS_CHILD_ORDER).toEqual([
    "Country",
    "Flat_House_No_Building_Apartment_Name",
    "Street",
    "City",
    "State",
    "Zip",
    "Latitude",
  ]);
});
