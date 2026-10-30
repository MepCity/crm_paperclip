import { ExportHistoryScreen } from "@/components/records/transfer/transfer-screens";
import { PageHeader } from "@/components/shell/page-header";
import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { ApiProvider } from "@/lib/api/client/provider";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function ExportHistoryPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <PageHeader description={t("records.transfer.exportHistoryDescription")} />
      <ApiProvider key={orgSlug} orgSlug={orgSlug}>
        <ExportHistoryScreen />
      </ApiProvider>
    </>
  );
}
