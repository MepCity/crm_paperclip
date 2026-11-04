import { buildExportModule, type ExportTable } from "../export-module";
import table from "./export-table.json";

const built = buildExportModule(table as unknown as ExportTable, {
  apiName: "Quotes",
  singularLabel: "Quote",
  pluralLabel: "Quotes",
});
export const quotesMetadata = built.metadata;
export const quotesPicklists = built.picklists;
export const quotesViews = built.views;
