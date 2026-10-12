import { listInvitations, listMembers } from "@crm/core";
import { formatDate } from "@crm/core/format";
import { InvitationsTable } from "@/components/members/invitations-table";
import { InviteMemberDialog } from "@/components/members/invite-member-dialog";
import { MembersTable } from "@/components/members/members-table";
import { PageHeader } from "@/components/shell/page-header";
import { PageTitle } from "@/components/shell/page-title";
import { DEFAULT_FORMAT } from "@/lib/locale";
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
  const canManage = org.role === "admin";
  const [members, invitations] = await Promise.all([
    listMembers(org),
    canManage ? listInvitations(org) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <PageHeader
        description="People in this organization."
        actions={
          canManage ? (
            <InviteMemberDialog action={createInvitationAction.bind(null, orgSlug)} />
          ) : null
        }
      />
      <MembersTable
        members={members.map((member) => ({
          userId: member.userId,
          name: member.name,
          email: member.email,
          role: member.role,
          joinedAt: formatDate(member.joinedAt, DEFAULT_FORMAT),
        }))}
        currentUserId={org.userId}
        canManage={canManage}
        onChangeRole={changeMemberRoleAction.bind(null, orgSlug)}
        onRemove={removeMemberAction.bind(null, orgSlug)}
      />
      {canManage ? (
        <InvitationsTable
          invitations={invitations.map((invitation) => ({
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            expiresAt: formatDate(invitation.expiresAt, DEFAULT_FORMAT),
          }))}
          onRevoke={revokeInvitationAction.bind(null, orgSlug)}
        />
      ) : null}
    </>
  );
}
