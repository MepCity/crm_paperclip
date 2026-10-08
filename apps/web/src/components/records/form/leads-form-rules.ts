import type { FormRules } from "./form-model";

/** Interim Leads composites; no module-specific field names belong in the screen. */
export const leadsFormFields = {
  owner: "Owner",
  firstName: "First_Name",
  salutation: "Salutation",
  address: "Address",
  country: "Country",
  state: "State",
  latitude: "Latitude",
  longitude: "Longitude",
  coordinates: "Coordinates",
  revenue: "Annual_Revenue",
  twitter: "Twitter",
  connected: "Connected_To__s",
} as const;

export const leadsFormRules: FormRules = {
  owner: leadsFormFields.owner,
  prefix: { field: leadsFormFields.firstName, prefix: leadsFormFields.salutation },
  address: {
    field: leadsFormFields.address,
    latitude: leadsFormFields.latitude,
    longitude: leadsFormFields.longitude,
    coordinates: leadsFormFields.coordinates,
  },
  country: { field: leadsFormFields.country, state: leadsFormFields.state },
  currency: leadsFormFields.revenue,
  textPrefixes: { [leadsFormFields.twitter]: "@" },
  omitted: [leadsFormFields.connected],
};
