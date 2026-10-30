import { DOTTED_DAY_FIRST_FORMAT } from "@crm/core/format";
import type { CompanyDetails, CompanyDetailsPort } from "./port";

/** Synthetic demonstration data, independent of reference organization values. */
export const fixtureCompanyDetails: CompanyDetails = {
  name: "Example Company",
  displayId: "DEMO-001",
  email: "office@example.test",
  phone: "+1 202 555 0100",
  mobile: null,
  fax: null,
  website: null,
  address: null,
  accessUrl: "https://crm.example.test/crm/demo/",
  timeZone: { offset: "GMT +0:00", name: "Coordinated Universal Time", identifier: "Etc/UTC" },
};

export const fixtureCompanyDetailsPort: CompanyDetailsPort = {
  async readCompanyDetails() {
    return structuredClone(fixtureCompanyDetails);
  },
  async readOrganizationFormat() {
    return structuredClone(DOTTED_DAY_FIRST_FORMAT);
  },
};
