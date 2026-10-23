import type { OrgContext } from "@crm/core";
import { getMailState } from "./state";

export type ComposeMailboxItem = {
  id: string;
  address: string;
  name?: string;
};

/**
 * Lists the authenticated actor's own connected mailboxes within the current organization.
 *
 * Rules:
 * - organizationId === ctx.orgId && ownerUserId === ctx.userId && status === "connected".
 * - Disconnected, error, other users' (no admin bypass), and other tenants' mailboxes are omitted.
 * - address and name are derived from the actor's user profile; mailbox rows store no address column.
 * - If the actor has no usable email address, returns an empty list.
 * - Sorted by mailbox id ascending.
 * - Exact key set: only id, address, and optional name are exposed.
 */
export async function listConnectedMailboxes(
  ctx: OrgContext,
  actor?: { email?: string | null; name?: string | null } | null,
): Promise<ComposeMailboxItem[]> {
  const email = actor?.email?.trim();
  if (!email?.includes("@")) {
    return [];
  }
  const { repository } = await getMailState(ctx);
  const data = await repository.read(ctx.orgId);
  const matching = data.mailboxes.filter(
    (box) =>
      box.organizationId === ctx.orgId &&
      box.ownerUserId === ctx.userId &&
      box.status === "connected",
  );
  matching.sort((a, b) => a.id.localeCompare(b.id));
  const name = actor?.name?.trim();
  return matching.map((box) => {
    const item: ComposeMailboxItem = {
      id: box.id,
      address: email,
    };
    if (name) {
      item.name = name;
    }
    return item;
  });
}
