import { NotFoundMessage } from "@/components/shell/not-found-message";
import { PageTitle } from "@/components/shell/page-title";

export default function OrganizationNotFound() {
  return (
    <div className="p-6">
      <PageTitle title="Page not found" />
      <NotFoundMessage />
    </div>
  );
}
