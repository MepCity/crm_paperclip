import { redirect } from "next/navigation";

export default async function JourneyDetailRedirectPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  redirect(`/crm/${orgSlug}/settings/commandcenter/journey-builder/${id}`);
}
