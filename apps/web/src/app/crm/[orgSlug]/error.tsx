"use client";

import { PageHeader } from "@/components/shell/page-header";
import { PageTitle } from "@/components/shell/page-title";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { shellPageTitle } from "@/lib/shell-page-title";

export default function OrganizationError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="p-6">
      <PageTitle title={shellPageTitle.somethingWentWrong} />
      <PageHeader
        actions={
          <Button variant="secondary" onPress={retry}>
            Try again
          </Button>
        }
      />
      <Alert variant="danger">The page could not be loaded. Please try again.</Alert>
    </div>
  );
}
