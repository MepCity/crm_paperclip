import { RecycleBinPage } from "@/components/records/recycle-bin/recycle-bin-page";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageTitle } from "@/lib/shell-page-title";
import { listRecycleBinAction, mutateRecycleBinAction } from "./actions";

export const metadata = { title: "Recycle Bin" };

export default async function Page({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title={shellPageTitle.recycleBin} />
      <RecycleBinPage
        actions={{
          list: listRecycleBinAction.bind(null, orgSlug),
          mutate: mutateRecycleBinAction.bind(null, orgSlug),
        }}
      />
    </>
  );
}
