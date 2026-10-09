"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusRibbon, type StatusRibbonProps } from "./status-ribbon";

export const demoStages = [
  { value: null, label: "-None-" },
  ...[
    "Attempted to Contact",
    "Contact in Future",
    "Contacted",
    "Junk Lead",
    "Lost Lead",
    "Not Contacted",
    "Pre-Qualified",
    "Not Qualified",
  ].map((label, i) => ({ value: `stage-${i}`, label })),
];
export const demoGroups = [
  { label: "Junk", options: demoStages.filter((stage) => stage.value === "stage-3") },
  { label: "Not Qualified", options: demoStages.filter((stage) => stage.value === "stage-7") },
];
export const demoLabels: StatusRibbonProps["labels"] = {
  ribbon: "Example status",
  stageMenu: "Choose stage",
  terminalMenu: "Choose terminal stage",
  search: "Search stages",
  searchPlaceholder: "Search",
  empty: "No matching stages",
  scrollPrevious: "Scroll previous stages",
  scrollNext: "Scroll next stages",
};

function Example({ narrow = false, open }: { narrow?: boolean; open?: "stage" | "terminal" }) {
  const [value, setValue] = useState<string | null>("stage-4");
  return (
    <div
      data-status-demo={open ?? (narrow ? "narrow" : "wide")}
      className={narrow ? "status-demo-narrow" : "status-demo-wide"}
    >
      <StatusRibbon
        stages={demoStages}
        value={value}
        terminalGroups={demoGroups}
        labels={demoLabels}
        onSelect={setValue}
        defaultOpenMenu={open}
      />
      <p role="status">Selected: {value ?? "None"}</p>
    </div>
  );
}
export default function StatusRibbonDemo() {
  const [example, setExample] = useState<"widths" | "stage" | "terminal">("widths");
  return (
    <div className="space-y-4">
      <fieldset aria-label="Status ribbon examples" className="flex gap-2">
        {(
          [
            ["widths", "Two widths"],
            ["stage", "Stage menu open"],
            ["terminal", "Terminal menu open"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            variant="secondary"
            aria-pressed={example === id}
            onPress={() => setExample(id)}
          >
            {label}
          </Button>
        ))}
      </fieldset>
      <div key={example} className="space-y-8">
        {example === "widths" ? (
          <>
            <Example />
            <Example narrow />
          </>
        ) : (
          <Example open={example} />
        )}
      </div>
    </div>
  );
}
