import type { PersonalSettings, PersonalSettingsPort } from "./port";

export const fixturePersonalSettingsPort: PersonalSettingsPort = {
  async getPersonalSettings(user) {
    const [first = "", ...rest] = user.name.trim().split(/\s+/);
    const blank = (label: string) => ({ label, value: "" });
    const result: PersonalSettings = {
      name: user.name,
      email: user.email,
      profile: "Administrator",
      role: "CEO",
      organization: "Organization",
      user: [
        { label: "First Name", value: first },
        { label: "Last Name", value: rest.join(" ") },
        { label: "Email", value: user.email },
        { label: "Role", value: "CEO" },
        { label: "Profile", value: "Administrator" },
        blank("Alias"),
        blank("Phone"),
        blank("Mobile"),
        blank("Website"),
        blank("Fax"),
        blank("Date of Birth"),
      ],
      address: ["Street", "City", "State", "Zip Code", "Country"].map(blank),
      audit: ["Added By", "Modified By", "Invited By", "Confirmed Time", "Status Updated By"].map(
        blank,
      ),
      teamspaces: ["Default Teamspace"],
      locale: {
        language: "English (United States)",
        countryLocale: "United States",
        dateFormat: "MM/DD/YYYY",
        timeFormat: "12 Hours",
        timeZone: "(GMT 0:00) Coordinated Universal Time (UTC)",
        distanceUnit: "Kilometers (km)",
        numberFormat: "123,456.789",
      },
      groups: [],
      nameFormat: "Salutation First Name Last Name",
      sortOrder: "First Name",
    };
    return result;
  },
};
