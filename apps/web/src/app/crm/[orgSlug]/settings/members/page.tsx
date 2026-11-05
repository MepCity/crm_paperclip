import { listInvitations, listMembers } from "@crm/core";
import { getAccessSnapshot, listMemberAccess, listProfiles, listRoles } from "@crm/core/access";
import { formatDate } from "@crm/core/format";
import { InvitationsTable } from "@/components/members/invitations-table";
import { InviteMemberDialog } from "@/components/members/invite-member-dialog";
import { MembersTable } from "@/components/members/members-table";
import { PageHeader } from "@/components/shell/page-header";
import { PageTitle } from "@/components/shell/page-title";
import { loadOrganizationFormat } from "@/lib/format-settings";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import {
  changeMemberRoleAction,
  createInvitationAction,
  removeMemberAction,
  revokeInvitationAction,
} from "./actions";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function MembersSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await requireOrgContext(orgSlug);
  const access = await getAccessSnapshot(org);
  const canManage =
    access.profileKind === "administrator" || access.permissions.admin.userManagement;
  const [members, invitations] = await Promise.all([
    listMembers(org),
    canManage ? listInvitations(org) : Promise.resolve([]),
  ]);

  const accessData = canManage
    ? await Promise.all([listProfiles(org), listRoles(org), listMemberAccess(org)]).catch(
        () => null,
      )
    : null;
  const orgFormat = await loadOrganizationFormat();
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <PageHeader
        description="People in this organization."
        actions={
          canManage ? (
            <InviteMemberDialog
              action={createInvitationAction.bind(null, orgSlug)}
              accessOptions={
                accessData
                  ? {
                      profiles: accessData[0].map(({ id, name }) => ({ id, name })),
                      roles: accessData[1].map(({ id, name }) => ({ id, name })),
                    }
                  : undefined
              }
            />
          ) : null
        }
      />
      <MembersTable
        members={members.map((member) => ({
          userId: member.userId,
          name: member.name,
          email: member.email,
          role: member.role,
          joinedAt: formatDate(member.joinedAt, orgFormat),
        }))}
        currentUserId={org.userId}
        canManage={canManage}
        access={
          accessData
            ? {
                orgSlug,
                profiles: accessData[0].map(({ id, name }) => ({ id, name })),
                roles: accessData[1].map(({ id, name }) => ({ id, name })),
                byUser: Object.fromEntries(
                  accessData[2].map((m) => [
                    m.userId,
                    { profileId: m.profileId, roleId: m.roleId, isOwner: m.isOwner },
                  ]),
                ),
              }
            : undefined
        }
        onChangeRole={changeMemberRoleAction.bind(null, orgSlug)}
        onRemove={removeMemberAction.bind(null, orgSlug)}
      />
      {canManage ? (
        <InvitationsTable
          invitations={invitations.map((invitation) => ({
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            expiresAt: formatDate(invitation.expiresAt, orgFormat),
          }))}
          onRevoke={revokeInvitationAction.bind(null, orgSlug)}
        />
      ) : null}
    </>
  );
}
