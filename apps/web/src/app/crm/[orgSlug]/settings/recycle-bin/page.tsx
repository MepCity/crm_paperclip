import { RecycleBinPage } from "@/components/records/recycle-bin/recycle-bin-page";
import { requireOrgContext } from "@/lib/session";
import { listRecycleBinAction, mutateRecycleBinAction } from "./actions";

export const metadata = { title: "Recycle Bin" };

export default async function Page({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <RecycleBinPage
      actions={{
        list: listRecycleBinAction.bind(null, orgSlug),
        mutate: mutateRecycleBinAction.bind(null, orgSlug),
      }}
    />
  );
}
