import { listMembers } from "@crm/core";
import {
  getAccessSnapshot,
  listGroups,
  listMemberAccess,
  listProfiles,
  listRoles,
} from "@crm/core/access";
import { formatDate } from "@crm/core/format";
import { PageTitle } from "@/components/shell/page-title";
import { loadOrganizationFormat } from "@/lib/format-settings";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { UsersScreen } from "@/modules/settings-access/users-screen";
import {
  changeMemberRoleAction,
  createInvitationAction,
  removeMemberAction,
} from "../members/actions";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function UsersSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await requireOrgContext(orgSlug);
  const access = await getAccessSnapshot(org);
  const canManage =
    access.profileKind === "administrator" || access.permissions.admin.userManagement;
  const members = await listMembers(org);
  const accessData = canManage
    ? await Promise.all([
        listProfiles(org),
        listRoles(org),
        listMemberAccess(org),
        listGroups(org),
      ]).catch(() => null)
    : null;
  const orgFormat = await loadOrganizationFormat();

  const groupsByUser: Record<string, string[]> = {};
  for (const group of accessData?.[3] ?? []) {
    for (const member of group.members) {
      if (member.kind !== "user") continue;
      groupsByUser[member.id] = [...(groupsByUser[member.id] ?? []), group.name];
    }
  }
  const choices = accessData
    ? {
        profiles: accessData[0].map(({ id, name }) => ({ id, name })),
        roles: accessData[1].map(({ id, name }) => ({ id, name })),
      }
    : undefined;

  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <UsersScreen
        orgSlug={orgSlug}
        users={members.map((member) => ({
          userId: member.userId,
          name: member.name,
          email: member.email,
          role: member.role,
          joinedAt: formatDate(member.joinedAt, orgFormat),
        }))}
        currentUserId={org.userId}
        canManage={canManage}
        access={
          accessData && choices
            ? {
                orgSlug,
                ...choices,
                byUser: Object.fromEntries(
                  accessData[2].map((m) => [
                    m.userId,
                    { profileId: m.profileId, roleId: m.roleId, isOwner: m.isOwner },
                  ]),
                ),
              }
            : undefined
        }
        groupsByUser={groupsByUser}
        localization={{
          language: orgFormat.language,
          locale: orgFormat.locale,
          datePattern: orgFormat.datePattern,
          clock: orgFormat.clock,
          timeZone: orgFormat.timeZone,
        }}
        inviteAction={canManage ? createInvitationAction.bind(null, orgSlug) : undefined}
        inviteOptions={choices}
        onChangeRole={changeMemberRoleAction.bind(null, orgSlug)}
        onRemove={removeMemberAction.bind(null, orgSlug)}
      />
    </>
  );
}
