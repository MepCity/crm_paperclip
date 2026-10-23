import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/session";

export default async function EmailConfigurationPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  redirect(`/crm/${orgSlug}/settings/email-configuration/email-compose-settings`);
}
