"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StageBar } from "./stage-bar";
import { StageChangeDialog } from "./stage-change-dialog";
import type { StageBarLabels, StageBarStage, StageChangeFormValues } from "./types";

export const demoStages: StageBarStage[] = [
  { value: "qualification", label: "Qualification", kind: "open" },
  { value: "needs-analysis", label: "Needs Analysis", kind: "open" },
  { value: "value-proposition", label: "Value Proposition", kind: "open" },
  { value: "id-decision-makers", label: "Identify Decision Makers", kind: "open" },
  { value: "proposal", label: "Proposal/Price Quote", kind: "open" },
  { value: "negotiation", label: "Negotiation/Review", kind: "open" },
  { value: "closed-won", label: "Closed Won", kind: "won" },
  { value: "closed-lost", label: "Closed Lost", kind: "lost" },
  { value: "closed-lost-competition", label: "Closed Lost to Competition", kind: "lost" },
];

export const demoLabels: StageBarLabels = {
  bar: "Deal stage",
  startPrefix: "START ",
  closingPrefix: "CLOSING ",
  scrollPrevious: "Scroll previous stages",
  scrollNext: "Scroll next stages",
  wonMenu: "Choose won stage",
  lostMenu: "Choose lost stage",
  search: "Search stages",
  searchPlaceholder: "Search",
  empty: "No matching stages",
  currentStageMarker: "Current stage marker",
};

const reasonForLossOptions = [
  { storedValue: "price", displayValue: "Price" },
  { storedValue: "competition", displayValue: "Competition" },
  { storedValue: "other", displayValue: "Other" },
];

function BarExample({
  current,
  narrow,
  openMenu,
}: {
  current: string;
  narrow?: boolean;
  openMenu?: "won" | "lost";
}) {
  const [value, setValue] = useState(current);
  return (
    <div className={narrow ? "stage-bar-demo-narrow" : "stage-bar-demo-wide"}>
      <StageBar
        stages={demoStages}
        currentStageValue={value}
        startDate="13.10.2026"
        closingDate="31.12.2026"
        labels={demoLabels}
        onSelectStage={setValue}
        defaultOpenMenu={openMenu}
      />
      <p role="status">Selected stage: {value}</p>
    </div>
  );
}

export default function StageBarDemo() {
  const [barExample, setBarExample] = useState<"first" | "middle" | "won" | "lost" | "menus">(
    "first",
  );
  const [dialogExample, setDialogExample] = useState<"won" | "lost">("won");
  const [dialogOpen, setDialogOpen] = useState(false);

  const dialogInitial: StageChangeFormValues = {
    amount: 25000,
    closingDate: "2026-12-31",
    stage: dialogExample === "won" ? "closed-won" : "closed-lost",
    reasonForLoss: null,
  };

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <fieldset aria-label="Stage bar states" className="flex flex-wrap gap-2">
          {(
            [
              ["first", "First open stage"],
              ["middle", "Middle open stage"],
              ["won", "Closed won"],
              ["lost", "Closed lost"],
              ["menus", "Terminal menus open"],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              variant="secondary"
              aria-pressed={barExample === id}
              onPress={() => setBarExample(id)}
            >
              {label}
            </Button>
          ))}
        </fieldset>
        <div key={barExample}>
          {barExample === "first" && <BarExample current="qualification" />}
          {barExample === "middle" && <BarExample current="value-proposition" />}
          {barExample === "won" && <BarExample current="closed-won" />}
          {barExample === "lost" && <BarExample current="closed-lost" />}
          {barExample === "menus" && (
            <div className="space-y-8">
              <BarExample current="qualification" openMenu="won" />
              <BarExample current="qualification" openMenu="lost" narrow />
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <fieldset aria-label="Verify Details dialog" className="flex gap-2">
          {(
            [
              ["won", "Won fields"],
              ["lost", "Lost fields"],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              variant="secondary"
              aria-pressed={dialogExample === id}
              onPress={() => {
                setDialogExample(id);
                setDialogOpen(true);
              }}
            >
              {label}
            </Button>
          ))}
        </fieldset>
        <StageChangeDialog
          isOpen={dialogOpen}
          onOpenChange={setDialogOpen}
          stages={demoStages}
          initialValues={dialogInitial}
          reasonForLossOptions={reasonForLossOptions}
          showReasonForLoss={dialogExample === "lost"}
          onSubmit={async () => {}}
        />
      </div>
    </div>
  );
}
