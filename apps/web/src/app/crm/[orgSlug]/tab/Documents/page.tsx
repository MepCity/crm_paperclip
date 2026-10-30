import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { DocumentsHttpScreen } from "@/modules/documents/documents-screen";

export const metadata = { title: "Documents" };

export default async function DocumentsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Documents" />
      <DocumentsHttpScreen orgSlug={orgSlug} />
    </>
  );
}
