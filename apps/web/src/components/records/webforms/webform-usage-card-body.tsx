"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import { Spinner } from "@/components/ui/spinner";
import { useUiTranslations } from "@/i18n/client-provider";
import { useOrgSlug } from "@/lib/api/client/provider";
import { fetchRecordWebformUsage } from "@/modules/webforms/api";
import type { WebformRecordUsageItem } from "@/modules/webforms/types";

export interface WebformUsageCardBodyProps {
  module: string;
  recordId: string;
}

export const WEBFORM_USAGE_TITLE = "Webform Usage";

export function isWebformUsageSupported(module: string): boolean {
  return module === "Leads" || module === "Contacts" || module === "Cases";
}

export function WebformUsageCardBody({ module, recordId }: WebformUsageCardBodyProps) {
  const t = useUiTranslations();
  const orgSlug = useOrgSlug();
  const isSupported = isWebformUsageSupported(module);

  const {
    data: submissions = [],
    isLoading,
    error,
  } = useQuery<WebformRecordUsageItem[]>({
    queryKey: ["record-webform-usage", orgSlug, module, recordId],
    queryFn: () => fetchRecordWebformUsage(orgSlug, module, recordId),
    enabled: isSupported && Boolean(recordId) && Boolean(orgSlug),
  });

  if (!isSupported) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-xs text-destructive">
        {error instanceof Error ? error.message : "Failed to load webform usage."}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div
        data-testid="webform-usage-empty"
        data-part="empty"
        className="py-6 text-left text-sm text-muted-foreground"
      >
        {t("modules.webforms.recordUsage.noUsage")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto py-1" data-testid="webform-usage-table">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="pb-2 font-medium">{t("modules.webforms.recordUsage.submissionDate")}</th>
            <th className="pb-2 font-medium">{t("modules.webforms.recordUsage.form")}</th>
            <th className="pb-2 font-medium">{t("modules.webforms.recordUsage.location")}</th>
            <th className="pb-2 font-medium text-right">
              {t("modules.webforms.recordUsage.outcome")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {submissions.map((sub) => (
            <tr key={sub.id} className="hover:bg-muted/10 transition-colors">
              <td className="py-2.5 font-mono text-muted-foreground">
                {new Date(sub.createdAt).toLocaleString()}
              </td>
              <td className="py-2.5 font-medium text-foreground">
                <Link
                  href={`/crm/${orgSlug}/settings/webforms/${sub.formId}`}
                  className="text-primary hover:underline"
                >
                  {sub.formName}
                </Link>
              </td>
              <td className="py-2.5 font-mono text-muted-foreground">{sub.location}</td>
              <td className="py-2.5 text-right">
                <Badge variant={sub.outcome === "accepted" ? "success" : "neutral"}>
                  {sub.outcome}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
