import { buildExportModule, type ExportTable } from "../export-module";
import table from "./export-table.json";

const built = buildExportModule(table as unknown as ExportTable, {
  apiName: "Products",
  singularLabel: "Product",
  pluralLabel: "Products",
});
export const productsMetadata = built.metadata;
export const productsPicklists = built.picklists;
export const productsViews = built.views;
