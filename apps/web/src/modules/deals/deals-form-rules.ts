import type { FieldValue, ModuleMetadata } from "@crm/core/records";
import type { FormRules } from "@/components/records/form/form-model";

export const DEALS_FORM_CREATE_TITLE = "Create Deal";
export const DEALS_FORM_EDIT_TITLE = "Edit Deal";

export const DEALS_FORM_STAGE_DEFAULT = "Qualification";
export const DEALS_FORM_PROBABILITY_DEFAULT = 10;
export const DEALS_FORM_PICKLIST_NONE = "-None-";

/**
 * Builds creation default values for Deals:
 * Stage defaults to the first stage option in metadata picklist.
 * Probability defaults to that stage's metadata probability (PicklistOption.stage.probability).
 * Type and Lead Source default to "-None-".
 */
export function buildDealsFormDefaults(metadata?: ModuleMetadata): Record<string, FieldValue> {
  const stageField = metadata?.fields.find((f) => f.apiName === "Stage");
  const firstStage = stageField?.picklist?.[0];
  const stage = firstStage ? firstStage.storedValue : DEALS_FORM_STAGE_DEFAULT;
  const probability = firstStage?.stage?.probability ?? DEALS_FORM_PROBABILITY_DEFAULT;

  return {
    Stage: stage,
    Probability: probability,
    Type: DEALS_FORM_PICKLIST_NONE,
    Lead_Source: DEALS_FORM_PICKLIST_NONE,
  };
}

export const DEALS_FORM_DEFAULTS = buildDealsFormDefaults();

/** `PicklistOption.stage.category` values whose records show a reason for loss. */
export const DEALS_FORM_LOST_STAGE_CATEGORIES = ["Closed Lost"] as const;

/** Reason For Loss is editable in metadata but painted only while the record's stage is lost. */
export const DEALS_FORM_REASON_FOR_LOSS = "Reason_For_Loss__s";

export const dealsFormRules: FormRules = {
  owner: "Owner",
  currency: "Amount",
  currencies: ["Amount", "Expected_Revenue"],
  omitted: ["Connected_To__s"],
  omittedSections: ["Deal Image"],
  stageProbability: { stage: "Stage", probability: "Probability" },
  numberLimits: { Probability: { min: 0, max: 100 } },
  // Interim: neither popup was painted in the Deals capture, so the Contact picker draws the
  // same observed record-picker shape as Choose Account, named after the Contact Name column.
  lookupPickers: {
    Contact_Name: { chrome: "observed", searchLabel: "Search by Contact Name" },
  },
  stageConditionalFields: [
    {
      field: DEALS_FORM_REASON_FOR_LOSS,
      stage: "Stage",
      categories: DEALS_FORM_LOST_STAGE_CATEGORIES,
    },
  ],
  defaultValues: buildDealsFormDefaults,
};

/**
 * Spec column order for Deal Information (seven rows in two columns).
 * Row 1: Deal Owner (left) / Amount (right)
 * Row 2: Deal Name (left) / Closing Date (right)
 * Row 3: Account Name (left) / Stage (right), with Reason For Loss under Stage only while the
 *        record's stage is a lost category
 * Row 4: Type (left) / Probability (%) (right)
 * Row 5: Next Step (left) / Expected Revenue (right)
 * Row 6: Lead Source (left) / Campaign Source (right)
 * Row 7: Contact Name (left) / (no field)
 */
export const DEALS_FORM_INFORMATION_COLUMNS = [
  ["Owner", "Deal_Name", "Account_Name", "Type", "Next_Step", "Lead_Source", "Contact_Name"],
  [
    "Amount",
    "Closing_Date",
    "Stage",
    DEALS_FORM_REASON_FOR_LOSS,
    "Probability",
    "Expected_Revenue",
    "Campaign_Source",
  ],
] as const;
