"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import { Spinner } from "@/components/ui/spinner";
import { useUiTranslations } from "@/i18n/client-provider";
import { useOrgSlug } from "@/lib/api/client/provider";
import { fetchRecordJourneys } from "@/modules/journeys/api";
import type { RecordJourneyInstanceItem } from "@/modules/journeys/types";

export interface JourneysCardBodyProps {
  module: string;
  recordId: string;
}

export const JOURNEYS_RELATED_TITLE = "Journeys";

export function isJourneySupported(module: string): boolean {
  return module === "Leads" || module === "Contacts" || module === "Accounts" || module === "Deals";
}

export function JourneysCardBody({ module, recordId }: JourneysCardBodyProps) {
  const t = useUiTranslations();
  const orgSlug = useOrgSlug();

  const isSupported = isJourneySupported(module);
  const queryKey = ["record-journeys", orgSlug, module, recordId];

  const {
    data: instances = [],
    isLoading,
    error,
  } = useQuery<RecordJourneyInstanceItem[]>({
    queryKey,
    queryFn: () => fetchRecordJourneys(orgSlug, module, recordId),
    enabled: isSupported && Boolean(recordId) && Boolean(orgSlug),
  });

  if (!isSupported) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6" data-testid="journeys-related-loading">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-xs text-destructive" data-testid="journeys-related-error">
        {error instanceof Error ? error.message : "Failed to load journeys."}
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div
        data-testid="journeys-related-empty"
        data-part="empty"
        className="py-6 text-left text-sm text-muted-foreground"
      >
        {t("modules.journeys.recordRelated.noRecords") || "No journeys found"}
      </div>
    );
  }

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="overflow-x-auto py-1" data-testid="journeys-related-table">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="pb-2 font-semibold">
              {t("modules.journeys.recordRelated.columnJourney") || "Journey Name"}
            </th>
            <th className="pb-2 font-semibold">
              {t("modules.journeys.recordRelated.columnState") || "Current State"}
            </th>
            <th className="pb-2 font-semibold">
              {t("modules.journeys.recordRelated.columnEnteredAt") || "Entered At"}
            </th>
            <th className="pb-2 font-semibold">
              {t("modules.journeys.recordRelated.columnStatus") || "Status"}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {instances.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-muted/10 transition-colors"
              data-testid={`journey-instance-row-${item.id}`}
            >
              <td className="py-2.5 font-semibold text-foreground">
                <Link
                  href={`/crm/${orgSlug}/settings/commandcenter/journey-builder/${item.journeyId}`}
                  className="hover:underline text-primary"
                  data-testid={`journey-name-link-${item.id}`}
                >
                  {item.journeyName}
                </Link>
              </td>
              <td className="py-2.5 text-foreground">
                <Badge variant="neutral" className="text-xs">
                  {item.currentStateName}
                </Badge>
              </td>
              <td className="py-2.5 text-muted-foreground font-mono">
                {formatDate(item.stateEnteredAt)}
              </td>
              <td className="py-2.5">
                <Badge
                  variant={
                    item.status === "active"
                      ? "success"
                      : item.status === "completed"
                        ? "neutral"
                        : item.status === "exited"
                          ? "warning"
                          : "neutral"
                  }
                >
                  {item.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
