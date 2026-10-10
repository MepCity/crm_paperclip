import { NotFoundMessage } from "@/components/shell/not-found-message";
import { PageTitle } from "@/components/shell/page-title";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";

export const metadata = shellPageMetadata(shellPageTitle.pageNotFound);

export default function OrganizationNotFound() {
  return (
    <div className="p-6">
      <PageTitle title={shellPageTitle.pageNotFound} />
      <NotFoundMessage />
    </div>
  );
}
