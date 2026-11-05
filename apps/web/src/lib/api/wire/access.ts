import type {
  DefaultAccess,
  FieldPermissionRow,
  GroupDetail,
  MemberAccessRow,
  ProfileDetail,
  ProfileSummary,
  RoleNode,
  SharingRuleDetail,
} from "@crm/core/access";

/** Wire shapes of the access-control settings endpoints (ADR 0017 §9). All need `admin.userManagement`. */
export type AccessEnvelopes = {
  profiles: { profiles: ProfileSummary[] };
  profile: { profile: ProfileDetail };
  fieldPermissions: { field_permissions: FieldPermissionRow[] };
  roles: { roles: RoleNode[] };
  role: { role: RoleNode };
  groups: { groups: GroupDetail[] };
  group: { group: GroupDetail };
  moduleDefaults: { module_defaults: { module: string; level: DefaultAccess }[] };
  sharingRules: { sharing_rules: SharingRuleDetail[] };
  sharingRule: { sharing_rule: SharingRuleDetail };
  members: { members: MemberAccessRow[] };
  member: { member: MemberAccessRow };
};

export const ACCESS_PATHS = {
  profiles: "/crm/v9/settings/profiles",
  profile: "/crm/v9/settings/profiles/{profileId}",
  fieldPermissions: "/crm/v9/settings/profiles/{profileId}/field_permissions/{module}",
  roles: "/crm/v9/settings/roles",
  role: "/crm/v9/settings/roles/{roleId}",
  groups: "/crm/v9/settings/groups",
  group: "/crm/v9/settings/groups/{groupId}",
  moduleDefaults: "/crm/v9/settings/module_defaults",
  sharingRules: "/crm/v9/settings/sharing_rules",
  sharingRule: "/crm/v9/settings/sharing_rules/{ruleId}",
  members: "/crm/v9/settings/member_access",
  member: "/crm/v9/settings/member_access/{userId}",
} as const;
