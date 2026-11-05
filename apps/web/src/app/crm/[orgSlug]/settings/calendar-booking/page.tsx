import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireSettingsOrg } from "@/lib/access/settings-gate";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { CalendarBookingScreen } from "@/modules/calendar-booking";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function CalendarBookingPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireSettingsOrg(orgSlug, "emailSettings");

  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.settings")} />
      <CalendarBookingScreen orgSlug={orgSlug} />
    </>
  );
}
