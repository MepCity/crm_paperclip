"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { type BoardColumn, RecordBoard } from "./record-board";

const columns: readonly BoardColumn[] = [
  {
    key: "first",
    label: "Qualification",
    count: 1,
    percentage: "10%",
    totalText: "USD 1,000",
    cards: [
      {
        id: "example",
        rows: [
          { text: "Example opportunity", href: "#example" },
          { text: "Qualification" },
          { text: "Sample company", href: "#company" },
          { text: "Sample owner", strong: true },
          { text: "Sample contact", href: "#contact" },
          { text: "USD 1,000" },
          { text: "31.12.2026", tone: "danger" },
        ],
        iconLink: {
          href: "#task",
          label: "Task",
          laterModule: "M5",
          icon: <Icons.check className="h-4 w-4" />,
        },
      },
    ],
  },
  {
    key: "second",
    label: "Needs Analysis",
    count: 0,
    percentage: "20%",
    totalText: "USD 0",
    cards: [],
  },
  {
    key: "reject",
    label: "Rejected move",
    count: 0,
    percentage: "40%",
    totalText: "USD 0",
    cards: [],
  },
  { key: "fourth", label: "Proposal", count: 0, cards: [] },
];
export default function RecordBoardDemo() {
  return (
    <div className="flex h-128 min-w-0 bg-bg p-4" data-board-demo>
      <RecordBoard
        columns={columns}
        createLabel="Create Record"
        onCreate={() => {}}
        toolbar={
          <>
            <select
              aria-label="Board grouping"
              className="rounded border border-control-border bg-surface px-2 py-1"
            >
              <option>STAGEVIEW</option>
            </select>
            <Button variant="ghost" aria-label="Board settings">
              <Icons.fieldEdit aria-hidden className="h-4 w-4" />
            </Button>
          </>
        }
        onMove={async (_id, _from, to) => {
          await new Promise((resolve) => setTimeout(resolve, 350));
          if (to === "reject") throw new Error("Demo rejection");
          return "moved";
        }}
      />
    </div>
  );
}
