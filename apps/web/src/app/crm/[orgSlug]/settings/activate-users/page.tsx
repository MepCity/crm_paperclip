import { listInvitations } from "@crm/core";
import { formatDate } from "@crm/core/format";
import { PageTitle } from "@/components/shell/page-title";
import { loadOrganizationFormat } from "@/lib/format-settings";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { ActivateUsersScreen } from "@/modules/settings-access/activate-users-screen";
import { AccessPage } from "@/server/access/page-gate";
import { revokeInvitationAction } from "../members/actions";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function ActivateUsersPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <AccessPage orgSlug={orgSlug}>
        <PendingInvitations orgSlug={orgSlug} />
      </AccessPage>
    </>
  );
}

async function PendingInvitations({ orgSlug }: { orgSlug: string }) {
  const org = await requireOrgContext(orgSlug);
  const [invitations, orgFormat] = await Promise.all([
    listInvitations(org),
    loadOrganizationFormat(),
  ]);
  return (
    <ActivateUsersScreen
      orgSlug={orgSlug}
      invitations={invitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: formatDate(invitation.expiresAt, orgFormat),
      }))}
      onRevoke={revokeInvitationAction.bind(null, orgSlug)}
    />
  );
}
