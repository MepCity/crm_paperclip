import type { FieldDefinition, ModuleMetadata } from "@crm/core/records";
import { addressSubfieldApiNames } from "@/lib/records/composite-address";
import type { FormRules } from "./form-model";

const views = { view: true, create: true, edit: true, quickCreate: false };

/** Visible country options for the dual-address demo and tests (F-34.2–F-34.8). */
export const dualAddressCountryOptions = [
  "-None-",
  "Afghanistan",
  "Aland Islands",
  "Albania",
  "Algeria",
  "American Samoa",
  "Andorra",
] as const;

/** Nonempty states from metadata global set States__s (contacts spec catalog). */
export const dualAddressStateOptions = ["-None-", "Ontario", "Alberta"] as const;

function textField(apiName: string, label: string, maxLength = 255): FieldDefinition {
  return {
    apiName,
    label,
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views,
    maxLength,
  };
}

function picklistField(
  apiName: string,
  label: string,
  options: readonly string[],
): FieldDefinition {
  return {
    ...textField(apiName, label),
    dataType: "picklist",
    picklist: options.map((value) => ({ displayValue: value, storedValue: value })),
  };
}

function numberField(apiName: string, label: string): FieldDefinition {
  return {
    apiName,
    label,
    dataType: "double",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views,
  };
}

function compositeParent(apiName: string, label: string): FieldDefinition {
  return {
    apiName,
    label,
    dataType: "textarea",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views,
    maxLength: 2000,
  };
}

function subfieldsFor(parentApiName: "Mailing_Address" | "Other_Address", label: string) {
  const prefix = parentApiName === "Mailing_Address" ? "Mailing" : "Other";
  const country = picklistField(
    `${prefix}_Country`,
    `${label} - Country / Region`,
    dualAddressCountryOptions,
  );
  const state = picklistField(
    `${prefix}_State`,
    `${label} - State / Province`,
    dualAddressStateOptions,
  );
  const flat = textField(
    `${prefix}_Flat_House_No_Building_Apartment_Name`,
    `${label} - Flat / House No./ Building / Apartment Name`,
  );
  const street = textField(`${prefix}_Street`, `${label} - Street Address`);
  const city = textField(`${prefix}_City`, `${label} - City`);
  const zip = textField(`${prefix}_Zip`, `${label} - Zip / Postal Code`, 30);
  const latitude = numberField(`${prefix}_Latitude`, `${label} - Latitude`);
  const longitude = numberField(`${prefix}_Longitude`, `${label} - Longitude`);
  const coordinates = compositeParent(`${prefix}_Coordinates`, `${label} - Coordinates`);
  return [
    compositeParent(parentApiName, label),
    country,
    flat,
    street,
    city,
    state,
    zip,
    latitude,
    longitude,
    coordinates,
  ];
}

const mailingFields = subfieldsFor("Mailing_Address", "Mailing Address");
const otherFields = subfieldsFor("Other_Address", "Other Address");

const addressSectionFieldApiNames = [
  ...mailingFields.map((field) => field.apiName),
  ...otherFields.map((field) => field.apiName),
];

export const dualAddressFormRules: FormRules = {
  owner: "Contact_Owner",
  addresses: [
    {
      field: "Mailing_Address",
      latitude: "Mailing_Latitude",
      longitude: "Mailing_Longitude",
      coordinates: "Mailing_Coordinates",
      country: "Mailing_Country",
      state: "Mailing_State",
      subfields: addressSubfieldApiNames("Mailing_Address"),
    },
    {
      field: "Other_Address",
      latitude: "Other_Latitude",
      longitude: "Other_Longitude",
      coordinates: "Other_Coordinates",
      country: "Other_Country",
      state: "Other_State",
      subfields: addressSubfieldApiNames("Other_Address"),
    },
  ],
  labelLines: {
    Mailing_Flat_House_No_Building_Apartment_Name: [
      "Flat / House No./",
      "Building /",
      "Apartment Name",
    ],
    Other_Flat_House_No_Building_Apartment_Name: [
      "Flat / House No./",
      "Building /",
      "Apartment Name",
    ],
  },
};

export const dualAddressModuleMetadata: ModuleMetadata = {
  apiName: "Contacts",
  singularLabel: "Contact",
  pluralLabel: "Contacts",
  businessCardFields: [],
  fields: [
    {
      apiName: "Record_Image",
      label: "Contact Image",
      dataType: "profileimage",
      required: false,
      readOnly: false,
      unique: false,
      massUpdate: false,
      views,
      maxLength: 255,
    },
    {
      apiName: "Contact_Owner",
      label: "Contact Owner",
      dataType: "ownerlookup",
      required: false,
      readOnly: false,
      unique: false,
      massUpdate: false,
      views,
      maxLength: 120,
    },
    ...mailingFields,
    ...otherFields,
  ],
  layout: [
    {
      label: "Contact Image",
      columnCount: 1,
      columns: [["Record_Image"]],
      fields: ["Record_Image"],
    },
    {
      label: "Address Information",
      columnCount: 1,
      columns: [addressSectionFieldApiNames],
      fields: addressSectionFieldApiNames,
    },
  ],
};
