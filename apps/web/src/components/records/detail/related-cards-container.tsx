"use client";

import type { RelatedListBodyContext, RelatedListDefinition } from "@/modules/types";
import { RecordPageFooter } from "./record-page-footer";
import { RelatedListCard } from "./related-list-card";

export interface RelatedCardsContainerProps {
  relatedLists: readonly RelatedListDefinition[];
  context?: RelatedListBodyContext;
}

export function RelatedCardsContainer({ relatedLists, context }: RelatedCardsContainerProps) {
  if (!relatedLists || relatedLists.length === 0) return null;
  return (
    <div data-related-cards-container className="flex flex-col gap-3">
      {relatedLists.map((definition) => (
        <RelatedListCard key={definition.id} definition={definition} context={context} />
      ))}
      <RecordPageFooter />
    </div>
  );
}
