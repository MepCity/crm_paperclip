"use client";

import type { FieldDefinition, RecordInput } from "@crm/core/records";
import { createContext, type ReactNode, useContext, useState } from "react";
import type { OwnerOption } from "../form/field-input";

export interface InlineEditContextValue {
  activeId: string | null;
  activate: (id: string | null) => void;
  eligible: (field: FieldDefinition) => boolean;
  save: (input: RecordInput) => Promise<void>;
  users?: readonly OwnerOption[];
  ownerNames?: Readonly<Record<string, string>>;
  recordPath?: (module: string, id: string) => string;
}
const InlineEditContext = createContext<InlineEditContextValue | null>(null);
export const useInlineEdit = () => useContext(InlineEditContext);

export function InlineEditProvider({
  children,
  eligible,
  save,
  users,
  ownerNames,
  recordPath,
}: {
  children: ReactNode;
  eligible: InlineEditContextValue["eligible"];
  save: InlineEditContextValue["save"];
  users?: readonly OwnerOption[];
  ownerNames?: Readonly<Record<string, string>>;
  recordPath?: (module: string, id: string) => string;
}) {
  const [activeId, activate] = useState<string | null>(null);
  const resolvedOwnerNames =
    ownerNames ?? (users ? Object.fromEntries(users.map((u) => [u.id, u.name])) : undefined);
  return (
    <InlineEditContext.Provider
      value={{
        activeId,
        activate,
        eligible,
        save,
        users,
        ownerNames: resolvedOwnerNames,
        recordPath,
      }}
    >
      {children}
    </InlineEditContext.Provider>
  );
}
