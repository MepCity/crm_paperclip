import { listOrganizationsForUser } from "@crm/core";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

/** Sends a visitor to sign-in, organization setup, or their first organization. */
export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const organizations = await listOrganizationsForUser(session.user.id);
  const first = organizations[0];
  if (!first) redirect("/orgs/new");
  redirect(`/o/${first.slug}`);
}
