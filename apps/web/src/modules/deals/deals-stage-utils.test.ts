import { expect, test } from "vitest";
import { buildStageBarStages, stageChangeToRecordInput } from "./deals-stage-utils";
import { dealField, dealMetadata } from "./test-metadata";

test("maps stage picklist metadata to stage bar kinds", () => {
  const stages = buildStageBarStages(
    dealMetadata([
      dealField("Stage", {
        label: "Stage",
        dataType: "picklist",
        picklist: [
          {
            displayValue: "Qualification",
            storedValue: "Qualification",
            stage: { probability: 10, forecastCategory: "Pipeline", category: "Open" },
          },
          {
            displayValue: "Closed Won",
            storedValue: "Closed Won",
            stage: { probability: 100, forecastCategory: "Closed", category: "Closed Won" },
          },
        ],
      }),
    ]),
  );
  expect(stages).toEqual([
    { label: "Qualification", value: "Qualification", kind: "open" },
    { label: "Closed Won", value: "Closed Won", kind: "won" },
  ]);
});

test("builds record input from verify dialog values", () => {
  expect(
    stageChangeToRecordInput({
      amount: 100,
      closingDate: "2026-12-01",
      stage: "Closed Lost",
      reasonForLoss: "Price",
    }),
  ).toEqual({
    Stage: "Closed Lost",
    Closing_Date: "2026-12-01",
    Amount: 100,
    Reason_For_Loss__s: "Price",
  });
});
