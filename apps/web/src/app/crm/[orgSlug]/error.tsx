"use client";

import { PageHeader } from "@/components/shell/page-header";
import { PageTitle } from "@/components/shell/page-title";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useUiTranslations } from "@/i18n/client-provider";
import { shellPageTitle } from "@/lib/shell-page-title";

export default function OrganizationError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useUiTranslations();
  return (
    <div className="p-6">
      <PageTitle title={shellPageTitle.somethingWentWrong} />
      <PageHeader
        actions={
          <Button variant="secondary" onPress={retry}>
            {t("common.actions.retry")}
          </Button>
        }
      />
      <Alert variant="danger">{t("common.pageError")}</Alert>
    </div>
  );
}
