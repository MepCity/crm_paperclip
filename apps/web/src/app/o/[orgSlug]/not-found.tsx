import { PageTitle } from "@/components/shell/page-title";

export default function OrganizationNotFound() {
  return (
    <div className="p-6">
      <PageTitle title="Page not found" />
      <p className="text-md">The requested page could not be found.</p>
    </div>
  );
}
