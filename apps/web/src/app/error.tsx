"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useUiTranslations } from "@/i18n/client-provider";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useUiTranslations();
  void error;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-bg">
      <div className="max-w-md w-full flex flex-col gap-4 items-center text-center">
        <h2 className="text-2xl font-semibold text-text">{t("common.errorTitle")}</h2>
        <Alert variant="danger" title={t("common.errorHeading")}>
          {t("common.unexpectedError")}
        </Alert>
        <Button variant="primary" onPress={() => reset()}>
          {t("common.actions.retry")}
        </Button>
      </div>
    </div>
  );
}
