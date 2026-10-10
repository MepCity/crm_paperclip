"use client";

import type { FieldDefinition, RecordInput } from "@crm/core/records";
import { createContext, type ReactNode, useContext, useState } from "react";
import type { OwnerOption } from "../form/field-input";

interface InlineEditContextValue {
  activeId: string | null;
  activate: (id: string | null) => void;
  eligible: (field: FieldDefinition) => boolean;
  save: (input: RecordInput) => Promise<void>;
  users?: readonly OwnerOption[];
}
const InlineEditContext = createContext<InlineEditContextValue | null>(null);
export const useInlineEdit = () => useContext(InlineEditContext);

export function InlineEditProvider({
  children,
  eligible,
  save,
  users,
}: {
  children: ReactNode;
  eligible: InlineEditContextValue["eligible"];
  save: InlineEditContextValue["save"];
  users?: readonly OwnerOption[];
}) {
  const [activeId, activate] = useState<string | null>(null);
  return (
    <InlineEditContext.Provider value={{ activeId, activate, eligible, save, users }}>
      {children}
    </InlineEditContext.Provider>
  );
}
