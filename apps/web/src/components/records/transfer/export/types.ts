import type { ExportJob, ExportRequest, TransferModule } from "@crm/core";

export type { Actor, ExportJob, ExportRequest, TransferModule } from "@crm/core";

export interface ExportDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  module: TransferModule;
  moduleLabel: string;
  views: { id: string; name: string }[];
  defaultViewId?: string;
  /** When set, the scope is "Selected records (n)" and the view picker is hidden. */
  selectedIds?: string[];
  fields: { apiName: string; label: string }[];
  onExport(request: ExportRequest): Promise<ExportJob>;
  historyHref: string;
  /** Called after a successful export; the default shows a plain success toast. */
  onCompleted?(job: ExportJob): void;
}
