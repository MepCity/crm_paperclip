import type { RecycleBinEntry } from "@crm/core/records";

export interface BinSearch {
  name: string;
  nameOperator: "contains";
  module: string;
  deletedBy: string;
  deletedByOperator: "contains" | "is";
  date: string;
  time: string;
}
export const initialBinSearch: BinSearch = {
  name: "",
  nameOperator: "contains",
  module: "",
  deletedBy: "",
  deletedByOperator: "contains",
  date: "",
  time: "01:00",
};
export type BinReadResult =
  | { status: "success"; entries: readonly RecycleBinEntry[]; total: number }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };
export type BinMutationResult =
  | { status: "success" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };
export interface BinActions {
  list: (search: BinSearch, page: number, perPage: number) => Promise<BinReadResult>;
  mutate: (
    action: "restore" | "delete" | "empty",
    ids: readonly string[],
  ) => Promise<BinMutationResult>;
}
