import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { ApiProvider } from "@/lib/api/client/provider";
import { requireOrgContext } from "@/lib/session";
import { CalendarScreen } from "@/modules/calendar/calendar-screen";

export const metadata = { title: "Calendar" };

export default async function CalendarPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const context = await requireOrgContext(orgSlug);
  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.calendar")} />
      <ApiProvider orgSlug={orgSlug}>
        <CalendarScreen orgSlug={orgSlug} userId={context.userId} />
      </ApiProvider>
    </>
  );
}
