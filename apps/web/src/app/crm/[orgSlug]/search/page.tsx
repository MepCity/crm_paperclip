import { AdvancedSearchScreen } from "@/components/records/search/advanced-search-screen";
import { ApiProvider } from "@/lib/api/client/provider";
import { requireOrgContext } from "@/lib/session";

export const metadata = {
  title: "Search Results",
};

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ q?: string; module?: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  const { q = "", module } = await searchParams;

  return (
    <ApiProvider key={orgSlug} orgSlug={orgSlug}>
      <AdvancedSearchScreen initialQuery={q} initialModule={module} />
    </ApiProvider>
  );
}
