"use client";

import { formatDateTime } from "@crm/core/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Spinner } from "@/components/ui/spinner";
import { useUiTranslations } from "@/i18n/client-provider";
import { usePermissions } from "@/lib/access";
import { useOrgSlug } from "@/lib/api/client/provider";
import { useFormat } from "@/lib/format-context";
import {
  fetchRecordCadences,
  pauseEnrollment,
  resumeEnrollment,
  unenrollRecord,
} from "@/modules/cadences/api";
import type { RecordCadenceEnrollmentItem } from "@/modules/cadences/types";

export interface CadencesCardBodyProps {
  module: string;
  recordId: string;
}

export const CADENCES_RELATED_TITLE = "Cadences";
export const CADENCE_ENROLL_LABEL = "Enroll";

export function isCadenceSupported(module: string): boolean {
  return module === "Leads" || module === "Contacts" || module === "Accounts" || module === "Deals";
}

export function CadencesCardBody({ module, recordId }: CadencesCardBodyProps) {
  const t = useUiTranslations();
  const orgSlug = useOrgSlug();
  const orgFormat = useFormat();
  const permissions = usePermissions();
  const queryClient = useQueryClient();

  const isSupported = isCadenceSupported(module);
  const canManage = permissions
    ? (permissions.modules[module]?.enrollCadence ?? true) ||
      (permissions.features.cadences?.manage ?? false)
    : true;

  const queryKey = ["record-cadences", orgSlug, module, recordId];

  const {
    data: enrollments = [],
    isLoading,
    error,
  } = useQuery<RecordCadenceEnrollmentItem[]>({
    queryKey,
    queryFn: () => fetchRecordCadences(orgSlug, module, recordId),
    enabled: isSupported && Boolean(recordId) && Boolean(orgSlug),
  });

  const pauseMutation = useMutation({
    mutationFn: (enrollmentId: string) => pauseEnrollment(orgSlug, enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (enrollmentId: string) => resumeEnrollment(orgSlug, enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: (enrollmentId: string) => unenrollRecord(orgSlug, enrollmentId, "manual_unenroll"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  if (!isSupported) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6" data-testid="cadences-related-loading">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-xs text-destructive" data-testid="cadences-related-error">
        {error instanceof Error ? error.message : "Failed to load cadences."}
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div
        data-testid="cadences-related-empty"
        data-part="empty"
        className="py-6 text-left text-sm text-muted-foreground"
      >
        {t("modules.cadences.recordRelated.noRecords")}
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    active: t("modules.cadences.list.statusActive") || "Active",
    paused: t("modules.cadences.reports.paused") || "Paused",
    completed: t("modules.cadences.reports.completed") || "Completed",
    exited: t("modules.cadences.reports.exited") || "Exited",
    stopped: t("modules.cadences.reports.stopped") || "Stopped",
  };

  return (
    <div className="overflow-x-auto py-1" data-testid="cadences-related-table">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="pb-2 font-semibold">{t("modules.cadences.recordRelated.columnName")}</th>
            <th className="pb-2 font-semibold">
              {t("modules.cadences.recordRelated.columnStartDate")}
            </th>
            <th className="pb-2 font-semibold">
              {t("modules.cadences.recordRelated.columnStatus")}
            </th>
            <th className="pb-2 font-semibold text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {enrollments.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-muted/10 transition-colors"
              data-testid={`cadence-enrollment-row-${item.id}`}
            >
              <td className="py-2.5 font-semibold text-foreground">
                <Link
                  href={`/crm/${orgSlug}/settings/cadences/${item.cadenceId}`}
                  className="text-primary hover:underline"
                >
                  {item.cadenceName}
                </Link>
              </td>
              <td className="py-2.5 font-mono text-muted-foreground">
                {formatDateTime(item.recordStartDate, orgFormat)}
              </td>
              <td className="py-2.5">
                <Badge
                  variant={
                    item.status === "active"
                      ? "success"
                      : item.status === "paused"
                        ? "neutral"
                        : item.status === "exited"
                          ? "danger"
                          : "neutral"
                  }
                >
                  {statusLabels[item.status] ?? item.status}
                  {item.status === "exited" && item.reason ? ` (${item.reason})` : ""}
                </Badge>
              </td>
              <td className="py-2.5 text-right">
                {canManage && (
                  <div className="flex items-center justify-end gap-1.5">
                    {item.status === "active" && (
                      <Button
                        variant="secondary"
                        size="compact"
                        onPress={() => pauseMutation.mutate(item.id)}
                        isDisabled={pauseMutation.isPending}
                        data-testid={`cadence-pause-${item.id}`}
                      >
                        {t("modules.cadences.recordRelated.actionPause")}
                      </Button>
                    )}
                    {item.status === "paused" && (
                      <Button
                        variant="secondary"
                        size="compact"
                        onPress={() => resumeMutation.mutate(item.id)}
                        isDisabled={resumeMutation.isPending}
                        data-testid={`cadence-resume-${item.id}`}
                      >
                        {t("modules.cadences.recordRelated.actionResume")}
                      </Button>
                    )}
                    {(item.status === "active" || item.status === "paused") && (
                      <Button
                        variant="secondary"
                        size="compact"
                        onPress={() => unenrollMutation.mutate(item.id)}
                        isDisabled={unenrollMutation.isPending}
                        className="text-destructive hover:bg-destructive/10"
                        data-testid={`cadence-unenroll-${item.id}`}
                      >
                        {t("modules.cadences.recordRelated.actionUnenroll")}
                      </Button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
