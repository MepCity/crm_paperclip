"use client";

import {
  type InvitationRow,
  InvitationsTable,
  type RevokeInvitationAction,
} from "@/components/members/invitations-table";
import { SettingsTabs } from "./settings-tabs";

/**
 * Activate Users tab: people who were invited and have not joined yet. Revoking reuses the
 * members action, so the write path is unchanged.
 */
export function ActivateUsersScreen({
  orgSlug,
  invitations,
  onRevoke,
}: {
  orgSlug: string;
  invitations: readonly InvitationRow[];
  onRevoke: RevokeInvitationAction;
}) {
  return (
    <section
      className="flex flex-col rounded-lg border border-border bg-surface"
      data-settings-access
    >
      <SettingsTabs set="users" orgSlug={orgSlug} />
      <div className="px-6 pb-6">
        <InvitationsTable invitations={invitations} onRevoke={onRevoke} />
      </div>
    </section>
  );
}
