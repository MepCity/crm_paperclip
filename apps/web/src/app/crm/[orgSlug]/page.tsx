import { PageTitle } from "@/components/shell/page-title";
import { requireUser } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { resolveHomeView } from "@/modules/home/fixture";
import { HomeContent } from "@/modules/home/home-preview";

export const metadata = shellPageMetadata(shellPageTitle.home);

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  const { orgSlug } = await params;
  const { state } = await searchParams;
  const user = await requireUser(`/crm/${orgSlug}`);
  return (
    <>
      <PageTitle title={shellPageTitle.home} />
      <HomeContent orgSlug={orgSlug} userName={user.name} initialView={resolveHomeView(state)} />
    </>
  );
}
