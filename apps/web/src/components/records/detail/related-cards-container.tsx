"use client";

import type { RelatedListDefinition } from "@/modules/types";
import { RecordPageFooter } from "./record-page-footer";
import { RelatedListCard } from "./related-list-card";

export interface RelatedCardsContainerProps {
  relatedLists: readonly RelatedListDefinition[];
}

export function RelatedCardsContainer({ relatedLists }: RelatedCardsContainerProps) {
  if (!relatedLists || relatedLists.length === 0) return null;

  return (
    <div data-related-cards-container className="flex flex-col gap-3">
      {relatedLists.map((def) => (
        <RelatedListCard key={def.id} definition={def} />
      ))}
      <RecordPageFooter />
    </div>
  );
}
