import { redirect } from "next/navigation";

/** The Members page became Setup → Users (reference route); old links land there. */
export default async function MembersSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  redirect(`/crm/${orgSlug}/settings/users`);
}
