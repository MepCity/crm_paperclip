import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { SocialEntryScreen } from "@/modules/social/social-entry-screen";

export const metadata = { title: "Social" };

export default async function SocialPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Social" />
      <SocialEntryScreen />
    </>
  );
}
