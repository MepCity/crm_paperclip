// Temporary copies of the shared transfer contract (packages/core/src/transfer/types.ts).
// Replace with imports from the core package once it lands on `main`.
export type TransferModule = "Leads" | "Contacts" | "Accounts" | "Deals";

export interface Actor {
  id: string;
  name: string;
}

export interface ExportRequest {
  module: TransferModule;
  viewId?: string;
  ids?: string[];
  fields: "all" | { include: string[] } | { exclude: string[] };
}

export interface ExportJob {
  id: string;
  module: TransferModule;
  scope: string;
  createdBy: Actor;
  createdAt: string;
  status: "completed" | "failed";
  rowCount: number;
  code?: string;
  fileName: string;
}

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
