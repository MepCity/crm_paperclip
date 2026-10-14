import { ValidationError } from "@crm/core/errors";
import { expect, test } from "vitest";
import { StageChangeSubmitError } from "@/components/records/detail/stage-bar";
import {
  buildStageBarStages,
  mapStageChangeError,
  stageChangeToRecordInput,
} from "./deals-stage-utils";
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

const stageModule = () =>
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
        {
          displayValue: "Closed Lost",
          storedValue: "Closed Lost",
          stage: { probability: 0, forecastCategory: "Omitted", category: "Closed Lost" },
        },
      ],
    }),
  ]);

const base = { amount: 100, closingDate: "2026-12-01", reasonForLoss: "Price" };

test("sends the chosen reason when the target stage is lost", () => {
  expect(stageChangeToRecordInput({ ...base, stage: "Closed Lost" }, stageModule())).toEqual({
    Stage: "Closed Lost",
    Closing_Date: "2026-12-01",
    Amount: 100,
    Reason_For_Loss__s: "Price",
  });
});

test("clears the stale reason for won and open target stages", () => {
  for (const stage of ["Closed Won", "Qualification"]) {
    expect(
      stageChangeToRecordInput({ ...base, stage }, stageModule()).Reason_For_Loss__s,
    ).toBeNull();
  }
});

test("maps service validation errors to dialog errors", () => {
  const mapped = mapStageChangeError(
    new ValidationError({ Amount: ["Too low"], Other: ["x"] }, "bad"),
  );
  expect(mapped).toBeInstanceOf(StageChangeSubmitError);
  expect((mapped as StageChangeSubmitError).fieldErrors.amount).toBe("Too low");
  expect((mapped as StageChangeSubmitError).generalMessage).toBe("x");
  const plain = new Error("x");
  expect(mapStageChangeError(plain)).toBe(plain);
});

test("maps unmapped service validation errors to general message", () => {
  const mapped = mapStageChangeError(
    new ValidationError({ Probability: ["Choose an integer between 0 and 100."] }),
  );
  expect(mapped).toBeInstanceOf(StageChangeSubmitError);
  expect((mapped as StageChangeSubmitError).generalMessage).toBe(
    "Choose an integer between 0 and 100.",
  );
});
