"use client";

import type { FieldDefinition, ListView } from "@crm/core/records";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CustomViewDialog } from "@/components/records/views/custom-view-dialog";
import { invalidateModuleLists, useModuleProjection } from "@/lib/api/client/hooks";
import { useClientRecordService } from "@/lib/api/client/provider";
import { apiKeys } from "@/lib/api/client/query-keys";
import type { ModuleListScreenConfig } from "./module-list-screen";

export function useCustomViewModal({
  config,
  orgSlug,
  currentUserId,
  userRole,
  isAdmin: explicitIsAdmin,
  view,
  views,
  moduleFields,
}: {
  config: ModuleListScreenConfig;
  orgSlug: string;
  currentUserId?: string;
  userRole?: "admin" | "member";
  isAdmin?: boolean;
  view?: ListView;
  views?: readonly { id: string; name: string; isDefault?: boolean; systemDefined?: boolean }[];
  moduleFields?: readonly FieldDefinition[];
}) {
  const isAdmin = Boolean(explicitIsAdmin ?? userRole === "admin");
  const queryClient = useQueryClient();
  const router = useRouter();
  const service = useClientRecordService();
  const [modal, setModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    viewId?: string;
  } | null>(null);

  const projectionQuery = useModuleProjection(config.module, {
    enabled: Boolean(modal?.open && isAdmin),
  });

  const onNewView = isAdmin ? () => setModal({ open: true, mode: "create" }) : undefined;
  const onEditView =
    isAdmin && view && !view.systemDefined && !view.isDefault
      ? (id: string) => setModal({ open: true, mode: "edit", viewId: id })
      : undefined;

  const modalElement = modal?.open ? (
    <CustomViewDialog
      open
      mode={modal.mode}
      module={config.module}
      orgSlug={orgSlug}
      userId={currentUserId}
      isAdmin={isAdmin}
      expectedRevision={projectionQuery.data?.revision ?? ""}
      isLoadingRevision={
        isAdmin &&
        (projectionQuery.isLoading ||
          (Boolean(!projectionQuery.data?.revision) && !projectionQuery.isError))
      }
      revisionError={
        projectionQuery.isError
          ? projectionQuery.error instanceof Error
            ? projectionQuery.error.message
            : String(projectionQuery.error)
          : null
      }
      initial={
        modal.mode === "edit"
          ? modal.viewId && modal.viewId !== view?.id
            ? ((views?.find((v) => v.id === modal.viewId) as ListView | undefined) ?? view)
            : view
          : undefined
      }
      fields={projectionQuery.data?.fields ?? moduleFields ?? []}
      onClose={() => setModal(null)}
      onSave={(savedView) => {
        service.invalidate?.(config.module);
        void queryClient.invalidateQueries({
          queryKey: apiKeys.module(orgSlug, config.module),
          exact: true,
        });
        void queryClient.invalidateQueries({
          queryKey: apiKeys.views(orgSlug, config.module),
        });
        void queryClient.invalidateQueries({
          queryKey: apiKeys.view(orgSlug, config.module, savedView.id),
        });
        void queryClient.invalidateQueries({
          queryKey: apiKeys.moduleProjection(orgSlug, config.module),
        });
        invalidateModuleLists(queryClient, orgSlug, config.module);
        setModal(null);
        if (modal.mode === "create") {
          router.push(config.paths.customList(orgSlug, config.module, savedView.id));
        }
      }}
      onDelete={(deletedId) => {
        service.invalidate?.(config.module);
        void queryClient.invalidateQueries({
          queryKey: apiKeys.module(orgSlug, config.module),
          exact: true,
        });
        void queryClient.invalidateQueries({
          queryKey: apiKeys.views(orgSlug, config.module),
        });
        void queryClient.invalidateQueries({
          queryKey: apiKeys.moduleProjection(orgSlug, config.module),
        });
        setModal(null);
        if (deletedId === view?.id) {
          router.push(config.paths.defaultList(orgSlug, config.module));
        } else {
          queryClient.removeQueries({
            queryKey: apiKeys.view(orgSlug, config.module, deletedId),
          });
          invalidateModuleLists(queryClient, orgSlug, config.module);
        }
      }}
    />
  ) : null;

  return { onNewView, onEditView, modalElement };
}
