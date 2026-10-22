import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { CalendarBookingScreen } from "@/modules/calendar-booking";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function CalendarBookingPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);

  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <CalendarBookingScreen orgSlug={orgSlug} />
    </>
  );
}
