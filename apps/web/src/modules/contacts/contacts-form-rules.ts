import type { FormRules } from "@/components/records/form/form-model";

export const contactsFormRules: FormRules = {
  owner: "Owner",
  prefix: { field: "First_Name", prefix: "Salutation" },
  textPrefixes: { Twitter: "@" },
};

/** Only used when service layout columns are unavailable; metadata always wins. */
export const CONTACTS_FORM_INFORMATION_COLUMNS = [
  ["Owner", "First_Name", "Account_Name", "Email", "Phone", "Other_Phone", "Mobile", "Assistant"],
  [
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
  ],
] as const;
/** Last_Name.required and create owner initialization come from metadata and the shared form. */
export const CONTACTS_FORM_ADDRESS_GROUPS = ["Mailing", "Other"].map((prefix) => ({
  field: `${prefix}_Address`,
  country: `${prefix}_Country`,
  state: `${prefix}_State`,
  latitude: `${prefix}_Latitude`,
  longitude: `${prefix}_Longitude`,
  coordinates: `${prefix}_Coordinates`,
}));
