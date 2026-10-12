import type { FormRules } from "@/components/records/form/form-model";

const buildingLabelLines = ["Flat / House No./", "Building /", "Apartment Name"] as const;

export const contactsFormRules: FormRules = {
  owner: "Owner",
  prefix: { field: "First_Name", prefix: "Salutation" },
  textPrefixes: { Twitter: "@" },
  omitted: ["Connected_To__s"],
  countries: [
    { field: "Mailing_Country", state: "Mailing_State" },
    { field: "Other_Country", state: "Other_State" },
  ],
  labelLines: {
    Mailing_Flat_House_No_Building_Apartment_Name: buildingLabelLines,
    Other_Flat_House_No_Building_Apartment_Name: buildingLabelLines,
  },
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
