import type { PortalModule, PortalModules, PortalUserTypeSettings } from "@crm/core/portals";

export interface Portal {
  id: string;
  name: string;
  slug: string;
  status: "active" | "disabled";
  defaultLanguage: "en" | "tr";
  createdAt: string;
  updatedAt: string;
}

export interface PortalUserType {
  id: string;
  portalId: string;
  name: string;
  primaryModule: "Contacts";
  modules: PortalModules;
  settings: PortalUserTypeSettings;
  identityCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortalIdentity {
  id: string;
  portalId: string;
  userTypeId: string;
  email: string;
  displayName: string;
  recordModule: "Contacts";
  recordId: string;
  status: "invited" | "active" | "disabled";
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface PortalAuthEvent {
  id: string;
  identityId: string | null;
  kind: string;
  at: string;
}

export interface ContactOption {
  id: string;
  fullName: string;
  email: string;
}

export interface MemberOption {
  id: string;
  name: string;
  email: string;
}

export type { PortalModule, PortalModules, PortalUserTypeSettings };
