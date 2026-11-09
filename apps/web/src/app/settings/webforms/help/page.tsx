import { listOrganizationsForUser } from "@crm/core";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function SettingsWebformsHelpRedirect() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const organizations = await listOrganizationsForUser(session.user.id);
  const first = organizations[0];
  if (!first) redirect("/orgs/new");
  redirect(`/crm/${first.slug}/settings/webforms/help`);
}
