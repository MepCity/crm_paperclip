import type {
  DefaultAccess,
  FieldPermissionRow,
  GroupDetail,
  GroupMemberRef,
  MemberAccessRow,
  ProfileDetail,
  ProfileSummary,
  RoleNode,
  SharingLevel,
  SharingRuleDetail,
  SubjectKind,
} from "@crm/core/access";

/** A failed settings call; `code` is the wire code (`permission_denied`, `DUPLICATE_DATA`, …). */
export class AccessApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details: Record<string, string[]>,
  ) {
    super(message);
  }

  /** Message plus per-field detail messages, for one alert. */
  get fullMessage(): string {
    const extra = Object.values(this.details)
      .flat()
      .filter((m) => m !== this.message);
    return [this.message, ...extra].join(" ");
  }
}

export type AccessClient = ReturnType<typeof createAccessClient>;

const BASE = "/crm/v9/settings";

export function createAccessClient(orgSlug: string) {
  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${BASE}${path}`, {
        method,
        headers: { "Content-Type": "application/json", "X-CRM-ORG": orgSlug },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new AccessApiError("The server could not be reached.", 0, "network", {});
    }
    if (res.status === 204) return null as T;
    const json = (await res.json().catch(() => ({}))) as {
      code?: string;
      message?: string;
      details?: Record<string, string[]>;
    };
    if (!res.ok) {
      throw new AccessApiError(
        json.message ?? "The change could not be saved.",
        res.status,
        json.code ?? "error",
        json.details ?? {},
      );
    }
    return json as T;
  }
  const q = (params: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) search.set(k, v);
    const text = search.toString();
    return text ? `?${text}` : "";
  };
  return {
    listProfiles: async () =>
      (await call<{ profiles: ProfileSummary[] }>("GET", "/profiles")).profiles,
    getProfile: async (id: string) =>
      (await call<{ profile: ProfileDetail }>("GET", `/profiles/${id}`)).profile,
    cloneProfile: async (input: { sourceProfileId: string; name: string; description?: string }) =>
      (
        await call<{ profile: ProfileDetail }>("POST", "/profiles", {
          source_profile_id: input.sourceProfileId,
          name: input.name,
          description: input.description,
        })
      ).profile,
    updateProfile: async (
      id: string,
      input: { name?: string; description?: string; permissions?: unknown },
    ) => (await call<{ profile: ProfileDetail }>("PUT", `/profiles/${id}`, input)).profile,
    deleteProfile: (id: string, replacementProfileId?: string) =>
      call<null>("DELETE", `/profiles/${id}${q({ replacement_profile_id: replacementProfileId })}`),
    getFieldPermissions: async (profileId: string, module: string) =>
      (
        await call<{ field_permissions: FieldPermissionRow[] }>(
          "GET",
          `/profiles/${profileId}/field_permissions/${module}`,
        )
      ).field_permissions,
    putFieldPermissions: async (profileId: string, module: string, rows: FieldPermissionRow[]) =>
      (
        await call<{ field_permissions: FieldPermissionRow[] }>(
          "PUT",
          `/profiles/${profileId}/field_permissions/${module}`,
          { field_permissions: rows },
        )
      ).field_permissions,
    listRoles: async () => (await call<{ roles: RoleNode[] }>("GET", "/roles")).roles,
    getRole: async (id: string) => (await call<{ role: RoleNode }>("GET", `/roles/${id}`)).role,
    createRole: async (input: {
      name: string;
      parentRoleId: string;
      shareWithPeers: boolean;
      description: string;
    }) =>
      (
        await call<{ role: RoleNode }>("POST", "/roles", {
          name: input.name,
          parent_role_id: input.parentRoleId,
          share_with_peers: input.shareWithPeers,
          description: input.description,
        })
      ).role,
    updateRole: async (
      id: string,
      input: { name: string; parentRoleId?: string; shareWithPeers: boolean; description: string },
    ) =>
      (
        await call<{ role: RoleNode }>("PUT", `/roles/${id}`, {
          name: input.name,
          parent_role_id: input.parentRoleId,
          share_with_peers: input.shareWithPeers,
          description: input.description,
        })
      ).role,
    deleteRole: (id: string, transferRoleId: string) =>
      call<null>("DELETE", `/roles/${id}${q({ transfer_role_id: transferRoleId })}`),
    listGroups: async () => (await call<{ groups: GroupDetail[] }>("GET", "/groups")).groups,
    createGroup: async (input: { name: string; description: string; members: GroupMemberRef[] }) =>
      (await call<{ group: GroupDetail }>("POST", "/groups", input)).group,
    updateGroup: async (
      id: string,
      input: { name: string; description: string; members: GroupMemberRef[] },
    ) => (await call<{ group: GroupDetail }>("PUT", `/groups/${id}`, input)).group,
    deleteGroup: (id: string) => call<null>("DELETE", `/groups/${id}`),
    getModuleDefaults: async () =>
      (
        await call<{ module_defaults: { module: string; level: DefaultAccess }[] }>(
          "GET",
          "/module_defaults",
        )
      ).module_defaults,
    putModuleDefaults: async (defaults: { module: string; level: DefaultAccess }[]) =>
      (
        await call<{ module_defaults: { module: string; level: DefaultAccess }[] }>(
          "PUT",
          "/module_defaults",
          { module_defaults: defaults },
        )
      ).module_defaults,
    listSharingRules: async (module?: string) =>
      (await call<{ sharing_rules: SharingRuleDetail[] }>("GET", `/sharing_rules${q({ module })}`))
        .sharing_rules,
    saveSharingRule: async (id: string | null, rule: RuleInput) => {
      const body = {
        module: rule.module,
        name: rule.name,
        source_kind: rule.sourceKind,
        source_id: rule.sourceId,
        target_kind: rule.targetKind,
        target_id: rule.targetId,
        level: rule.level,
      };
      return (
        await call<{ sharing_rule: SharingRuleDetail }>(
          id ? "PUT" : "POST",
          id ? `/sharing_rules/${id}` : "/sharing_rules",
          body,
        )
      ).sharing_rule;
    },
    deleteSharingRule: (id: string) => call<null>("DELETE", `/sharing_rules/${id}`),
    listMembers: async () =>
      (await call<{ members: MemberAccessRow[] }>("GET", "/member_access")).members,
    setMemberAccess: async (userId: string, input: { profileId?: string; roleId?: string }) =>
      (
        await call<{ member: MemberAccessRow }>("PUT", `/member_access/${userId}`, {
          profile_id: input.profileId,
          role_id: input.roleId,
        })
      ).member,
  };
}

export type RuleInput = {
  module: string;
  name: string;
  sourceKind: SubjectKind;
  sourceId: string;
  targetKind: SubjectKind;
  targetId: string;
  level: SharingLevel;
};
