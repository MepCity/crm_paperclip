import type { ProfilePermissions } from "./catalogue";

/** Record access level, totally ordered: none < read < read_write < read_write_delete. */
export type AccessLevel = "none" | "read" | "read_write" | "read_write_delete";
/** Per-module default access of the organisation (ADR 0017 §1). */
export type DefaultAccess =
  | "private"
  | "public_read"
  | "public_read_write"
  | "public_read_write_delete";
/** Field access per profile x module x field. Absent row = `read_write`. */
export type FieldAccessMode = "read_write" | "read_only" | "hidden";
export type StoredFieldAccess = Exclude<FieldAccessMode, "read_write">;
export type ProfileKind = "administrator" | "standard" | "custom";
export type ModuleAction = "view" | "create" | "edit" | "delete";
export type SharingLevel = Exclude<AccessLevel, "none">;
/** What a record operation needs from the record access level. */
export type RecordOperation = "read" | "edit" | "delete";

export type SubjectKind = "role" | "role_and_subordinates" | "group";
export type GroupMemberKind = "user" | "role" | "role_and_subordinates" | "group";

export const ACCESS_LEVELS: readonly AccessLevel[] = [
  "none",
  "read",
  "read_write",
  "read_write_delete",
];
export const DEFAULT_ACCESS_VALUES: readonly DefaultAccess[] = [
  "private",
  "public_read",
  "public_read_write",
  "public_read_write_delete",
];

export type AccessRoleRow = {
  id: string;
  name: string;
  parentRoleId: string | null;
  shareWithPeers: boolean;
};
export type AccessMemberRow = { userId: string; roleId: string; profileId: string };
export type AccessGroupMemberRow = { groupId: string; kind: GroupMemberKind; memberId: string };
export type AccessSharingRuleRow = {
  id: string;
  module: string;
  sourceKind: SubjectKind;
  sourceId: string;
  targetKind: SubjectKind;
  targetId: string;
  level: SharingLevel;
};
export type AccessFieldRow = { module: string; field: string; access: StoredFieldAccess };

/** Raw rows of one organisation: the input of the pure snapshot builder. */
export type AccessData = {
  orgId: string;
  userId: string;
  version: number;
  profile: { id: string; name?: string; kind: ProfileKind; permissions: ProfilePermissions };
  fieldRows: readonly AccessFieldRow[];
  roles: readonly AccessRoleRow[];
  members: readonly AccessMemberRow[];
  groupMembers: readonly AccessGroupMemberRow[];
  defaults: readonly { module: string; level: DefaultAccess }[];
  rules: readonly AccessSharingRuleRow[];
};

/** Everything the engine needs to decide for one user in one organisation (ADR 0017 §5). */
export type AccessSnapshot = {
  orgId: string;
  userId: string;
  version: number;
  profileId: string;
  profileName?: string;
  profileKind: ProfileKind;
  permissions: ProfilePermissions;
  fieldAccess: ReadonlyMap<string, ReadonlyMap<string, FieldAccessMode>>;
  roleId: string;
  /** module -> owner user id -> level the viewer gets on records that user owns. */
  ownerLevels: ReadonlyMap<string, ReadonlyMap<string, AccessLevel>>;
  /** module -> level granted to everybody by the module default. */
  defaults: ReadonlyMap<string, AccessLevel>;
  /** Users whose role is a strict descendant of the viewer's role. */
  subordinateUserIds: ReadonlySet<string>;
};

/** The permission payload sent to the browser (ADR 0017 §8). No record data. */
export type ClientModulePermissions = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  import: boolean;
  export: boolean;
  massUpdate: boolean;
  massDelete: boolean;
  changeOwner: boolean;
  convert: boolean;
  merge: boolean;
  print: boolean;
  enrollCadence: boolean;
};
export type ClientPermissions = {
  profile: { id: string; name: string; kind: ProfileKind };
  modules: Record<string, ClientModulePermissions>;
  features: ProfilePermissions["features"];
  tools: { manageViews: boolean; tags: boolean; recordTimeline: boolean };
  admin: {
    userManagement: boolean;
    moduleCustomization: boolean;
    manageCurrencies: boolean;
    customizeHome: boolean;
    manageAutomation: boolean;
    manageTemplates: boolean;
    emailSettings: boolean;
    dataManagement: boolean;
    manageWebforms: boolean;
    manageJourneys: boolean;
    manageIntegrations: boolean;
  };
  onlyListSubordinates: boolean;
};
