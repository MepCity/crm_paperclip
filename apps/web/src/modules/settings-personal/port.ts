export type LocaleInformation = {
  language: string;
  countryLocale: string;
  dateFormat: string;
  timeFormat: string;
  timeZone: string;
  distanceUnit: string;
  numberFormat: string;
};

export type PersonalSettings = {
  name: string;
  email: string;
  profile: string;
  role: string;
  organization: string;
  user: { label: string; value: string }[];
  address: { label: string; value: string }[];
  audit: { label: string; value: string }[];
  teamspaces: string[];
  locale: LocaleInformation;
  groups: string[];
  nameFormat: string;
  sortOrder: string;
};

export type PersonalSettingsPort = {
  getPersonalSettings(user: { name: string; email: string }): Promise<PersonalSettings>;
};
