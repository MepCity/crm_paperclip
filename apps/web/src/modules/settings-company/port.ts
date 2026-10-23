export interface CompanyDetails {
  name: string;
  displayId: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  fax: string | null;
  website: string | null;
  address: string | null;
  accessUrl: string;
  timeZone: { offset: string; name: string; identifier: string };
}

/** Read-only screen boundary; editing and licensing contracts remain unresearched. */
export interface CompanyDetailsPort {
  readCompanyDetails(): Promise<CompanyDetails>;
}
