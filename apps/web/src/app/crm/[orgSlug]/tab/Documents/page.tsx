import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { DocumentsScreen } from "@/modules/documents/documents-screen";

export const metadata = { title: "Documents" };

export default async function DocumentsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  await requireOrgContext((await params).orgSlug);
  return (
    <>
      <PageTitle title="Documents" />
      <DocumentsScreen />
    </>
  );
}
