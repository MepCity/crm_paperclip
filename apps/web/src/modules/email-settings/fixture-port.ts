import type { EmailSettingsPort, EmailSettingsSnapshot } from "./port";

/** Invented identities and reserved-domain addresses; no reference account data. */
export const fixtureEmailSettings: EmailSettingsSnapshot = {
  compose: {
    fontFamily: "Verdana",
    fontSize: "10",
    fromAddress: "Demo User <demo@example.com>",
    replyToAddress: "Demo User <demo@example.com>",
  },
  customEmailFieldsEnabled: false,
  sharingUsers: [
    {
      id: "demo-user-1",
      name: "Demo User One",
      role: "Manager",
      profile: "Standard",
      status: "Active",
      configuration: "Not Configured",
      sharing: "User's Choice",
      sharedWith: "All",
      domainsExcluded: [],
    },
    {
      id: "demo-user-2",
      name: "Demo User Two",
      role: "Manager",
      profile: "Standard",
      status: "Active",
      configuration: "Not Configured",
      sharing: "User's Choice",
      sharedWith: "All",
      domainsExcluded: [],
    },
    {
      id: "demo-user-3",
      name: "Demo User Three",
      role: "Administrator",
      profile: "Administrator",
      status: "Active",
      configuration: "Not Configured",
      sharing: "Private",
      sharedWith: null,
      domainsExcluded: [],
    },
  ],
};

export const fixtureEmailSettingsPort: EmailSettingsPort = {
  async readSettings() {
    return structuredClone(fixtureEmailSettings);
  },
};
