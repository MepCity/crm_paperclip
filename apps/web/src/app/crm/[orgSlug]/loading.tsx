import { PageTitle } from "@/components/shell/page-title";
import { Spinner } from "@/components/ui/spinner";

export default function OrganizationLoading() {
  return (
    <div className="flex items-center gap-3 p-6">
      <PageTitle title="Loading" />
      <Spinner className="size-6" />
      <p className="text-md">Loading page…</p>
    </div>
  );
}
