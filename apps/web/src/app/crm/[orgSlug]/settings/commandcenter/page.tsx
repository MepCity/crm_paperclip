import { redirect } from "next/navigation";

export default async function CommandCenterPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  redirect(`/crm/${orgSlug}/settings/commandcenter/journey-builder`);
}
