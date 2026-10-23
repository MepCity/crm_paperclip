import { notFound } from "next/navigation";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { EmailSettingsScreen } from "@/modules/email-settings/email-settings-screen";
import { configurationTabs } from "@/modules/email-settings/port";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function EmailConfigurationTabPage({
  params,
}: {
  params: Promise<{ orgSlug: string; tab: string }>;
}) {
  const { orgSlug, tab } = await params;
  await requireOrgContext(orgSlug);
  const selected = configurationTabs.find((item) => item.id === tab && !("disabled" in item));
  if (!selected) notFound();
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <EmailSettingsScreen orgSlug={orgSlug} initialTab={selected.id} />
    </>
  );
}
