"use client";

import type { KanbanView } from "@crm/core/records";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUiTranslations } from "@/i18n/client-provider";
import { useMetadataDisplayAdapter } from "@/i18n/metadata-adapter";
import "./kanban-settings-dialog.css";

export interface KanbanManageDialogProps {
  open: boolean;
  views: readonly KanbanView[];
  /** Label of a Categorize By field API name. */
  fieldLabel(apiName: string): string;
  onCreate(): void;
  onClose(): void;
}

/** Lists the saved Kanban views; reordering and deleting are not available yet. */
export function KanbanManageDialog(props: KanbanManageDialogProps) {
  return props.open ? <ManageContent {...props} /> : null;
}

function ManageContent({ views, fieldLabel, onCreate, onClose }: KanbanManageDialogProps) {
  const t = useUiTranslations();
  const adapter = useMetadataDisplayAdapter();
  const titleId = useId();
  return (
    <TopAlignedModal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      aria-labelledby={titleId}
      panelClassName="kanban-manage-panel"
    >
      <div className="kanban-settings-content">
        <header className="flex items-center justify-between gap-4 px-6 py-6">
          <h2 id={titleId} className="text-xl font-semibold">
            {t("records.kanban.manage")}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onPress={onCreate}>
              {t("records.kanban.create")}
            </Button>
            <Button
              variant="ghost"
              aria-label={t("common.customViews.closeModal")}
              onPress={onClose}
            >
              <Icons.close aria-hidden className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className="kanban-settings-body">
          <Table>
            <TableHeader>
              <tr>
                <th aria-label={t("records.kanban.reorder")} className="w-8" />
                <TableHead>{t("records.kanban.name")}</TableHead>
                <TableHead>{t("records.kanban.usedField")}</TableHead>
                <TableHead>{t("records.kanban.sharedTo")}</TableHead>
                <TableHead>{t("records.kanban.modifiedBy")}</TableHead>
                <TableHead>{t("records.kanban.createdBy")}</TableHead>
              </tr>
            </TableHeader>
            <TableBody columnCount={6}>
              {views.map((view) => (
                <TableRow key={view.id}>
                  <td />
                  <TableCell>{view.name}</TableCell>
                  <TableCell>{adapter.getNamedLabel(fieldLabel(view.categorizeBy))}</TableCell>
                  <TableCell>
                    {view.sharedTo === "only_me"
                      ? t("records.kanban.onlyMe")
                      : view.sharedTo === "everyone"
                        ? t("records.kanban.everyone")
                        : view.sharedTo}
                  </TableCell>
                  <TableCell>{view.modifiedBy.name}</TableCell>
                  <TableCell>{view.createdBy.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TopAlignedModal>
  );
}
