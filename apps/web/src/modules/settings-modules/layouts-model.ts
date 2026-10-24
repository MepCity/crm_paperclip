export type LayoutRow = {
  id: string;
  name: string;
  sharedTo: string;
  lastModifiedAt: string | null;
  status: boolean;
};

export function defaultLayoutRow(): LayoutRow {
  return {
    id: "standard",
    name: "Standard",
    sharedTo: "Administrator and Standard",
    lastModifiedAt: null,
    status: true,
  };
}
