import { redirect } from "next/navigation";
import { requireSettingsOrg } from "@/lib/access/settings-gate";

export default async function EmailConfigurationPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireSettingsOrg(orgSlug, "emailSettings");
  redirect(`/crm/${orgSlug}/settings/email-configuration/email-compose-settings`);
}
