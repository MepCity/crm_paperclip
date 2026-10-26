import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { resolveSocialState } from "@/modules/social/fixture";
import { SocialConnectedScreen } from "@/modules/social/social-connected-screen";
import { SocialEntryScreen } from "@/modules/social/social-entry-screen";

export const metadata = { title: "Social" };

export default async function SocialPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ fixture?: string }>;
}) {
  const { orgSlug } = await params;
  const { fixture } = await searchParams;
  await requireOrgContext(orgSlug);
  const state = resolveSocialState(fixture);
  return (
    <>
      <PageTitle title="Social" />
      {state === "not-connected" ? <SocialEntryScreen /> : <SocialConnectedScreen state={state} />}
    </>
  );
}
