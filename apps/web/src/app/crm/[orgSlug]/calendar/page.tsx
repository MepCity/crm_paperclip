import { PageTitle } from "@/components/shell/page-title";
import { ApiProvider } from "@/lib/api/client/provider";
import { requireOrgContext } from "@/lib/session";
import { CalendarScreen } from "@/modules/calendar/calendar-screen";

export const metadata = { title: "Calendar" };

export default async function CalendarPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const context = await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Calendar" />
      <ApiProvider orgSlug={orgSlug}>
        <CalendarScreen orgSlug={orgSlug} userId={context.userId} />
      </ApiProvider>
    </>
  );
}
