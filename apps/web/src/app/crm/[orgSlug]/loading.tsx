import { PageTitle } from "@/components/shell/page-title";
import { Spinner } from "@/components/ui/spinner";
import { shellPageTitle } from "@/lib/shell-page-title";

export default function OrganizationLoading() {
  return (
    <div className="flex items-center gap-3 p-6">
      <PageTitle title={shellPageTitle.loading} />
      <Spinner className="size-6" />
      <p className="text-md">Loading page…</p>
    </div>
  );
}
