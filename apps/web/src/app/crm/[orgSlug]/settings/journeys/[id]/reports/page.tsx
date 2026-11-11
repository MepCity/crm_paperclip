import { redirect } from "next/navigation";

export default async function SettingsJourneyReportPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  redirect(`/crm/${orgSlug}/settings/commandcenter/journey-builder/${id}/reports`);
}
