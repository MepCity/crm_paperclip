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
import "./kanban-settings-dialog.css";

export interface KanbanManageDialogProps {
  open: boolean;
  views: readonly KanbanView[];
  /** Label of a Categorize By field API name. */
  fieldLabel(apiName: string): string;
  onCreate(): void;
  onClose(): void;
}

const SHARED_LABELS: Record<string, string> = { only_me: "Only me", everyone: "Everyone" };

/** Lists the saved Kanban views; reordering and deleting are not available yet. */
export function KanbanManageDialog(props: KanbanManageDialogProps) {
  return props.open ? <ManageContent {...props} /> : null;
}

function ManageContent({ views, fieldLabel, onCreate, onClose }: KanbanManageDialogProps) {
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
            Manage Kanban Views
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onPress={onCreate}>
              Create Kanban View
            </Button>
            <Button variant="ghost" aria-label="Close Modal" onPress={onClose}>
              <Icons.close aria-hidden className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className="kanban-settings-body">
          <Table>
            <TableHeader>
              <tr>
                <th aria-label="Reorder" className="w-8" />
                <TableHead>View Name</TableHead>
                <TableHead>Used Field</TableHead>
                <TableHead>Shared To</TableHead>
                <TableHead>Last Modified By</TableHead>
                <TableHead>Created By</TableHead>
              </tr>
            </TableHeader>
            <TableBody columnCount={6}>
              {views.map((view) => (
                <TableRow key={view.id}>
                  <td />
                  <TableCell>{view.name}</TableCell>
                  <TableCell>{fieldLabel(view.categorizeBy)}</TableCell>
                  <TableCell>{SHARED_LABELS[view.sharedTo] ?? view.sharedTo}</TableCell>
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
