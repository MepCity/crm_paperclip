import { PageTitle } from "@/components/shell/page-title";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";

export const metadata = shellPageMetadata(shellPageTitle.pageNotFound);

export default function OrganizationNotFound() {
  return (
    <div className="p-6">
      <PageTitle title={shellPageTitle.pageNotFound} />
      <p className="text-md">The requested page could not be found.</p>
    </div>
  );
}
