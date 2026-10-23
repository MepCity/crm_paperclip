export const configurationTabs = [
  { id: "email-compose-settings", label: "Compose" },
  { id: "email-settings", label: "Email", disabled: true },
  { id: "email-sharing", label: "Email Sharing" },
  { id: "organization-emails", label: "Organization Emails" },
  { id: "custom-email-fields-preference", label: "Custom Email Fields" },
] as const;

export type EmailConfigurationTab = (typeof configurationTabs)[number]["id"];
export type EmailSettingsArea = "email-configuration" | "email-parser" | "bcc-dropbox";

export interface EmailSharingUser {
  id: string;
  name: string;
  role: string;
  profile: string;
  status: string;
  configuration: string;
  sharing: string;
  sharedWith: string | null;
  domainsExcluded: readonly string[];
}

export interface EmailSettingsSnapshot {
  compose: {
    fontFamily: string;
    fontSize: string;
    fromAddress: string;
    replyToAddress: string;
  };
  sharingUsers: readonly EmailSharingUser[];
  customEmailFieldsEnabled: boolean;
}

/** Read-only boundary: preference changes and mailbox setup have no port. */
export interface EmailSettingsPort {
  readSettings(): Promise<EmailSettingsSnapshot>;
}
