import { buildExportModule, type ExportTable } from "../export-module";
import table from "./export-table.json";

const built = buildExportModule(table as unknown as ExportTable, {
  apiName: "Invoices",
  singularLabel: "Invoice",
  pluralLabel: "Invoices",
});
export const invoicesMetadata = built.metadata;
export const invoicesPicklists = built.picklists;
export const invoicesViews = built.views;
