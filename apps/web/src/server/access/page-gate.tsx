import { getAccessSnapshot } from "@crm/core/access";
import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { requireOrgContext } from "@/lib/session";

/** True when the viewer may manage access settings (`admin.userManagement`). */
export async function canManageAccess(orgSlug: string): Promise<boolean> {
  const ctx = await requireOrgContext(orgSlug);
  const snapshot = await getAccessSnapshot(ctx);
  return snapshot.profileKind === "administrator" || snapshot.permissions.admin.userManagement;
}

/** Server-side gate of the access settings pages: a denied page instead of the screen. */
export async function AccessPage({ orgSlug, children }: { orgSlug: string; children: ReactNode }) {
  if (!(await canManageAccess(orgSlug))) {
    return (
      <Alert variant="danger" title="Access denied">
        You do not have permission to manage users, roles and profiles.
      </Alert>
    );
  }
  return <>{children}</>;
}
