"use client";

import { Button } from "./button";
import { EmptyState } from "./empty-state";

export default function EmptyStateDemo() {
  return (
    <div className="flex flex-col gap-8">
      <EmptyState
        title="No leads"
        description="Create a lead to start a record."
        action={<Button>Create lead</Button>}
      />
      <EmptyState title="No results" description="Nothing matches these filters." />
    </div>
  );
}
