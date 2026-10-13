"use client";

import "./activity-filter-editor.css";

import { Radio, RadioGroup } from "react-aria-components";
import { Icons } from "@/components/ui/icon";
import { Select, SelectItem } from "@/components/ui/select";

export type ActivityDueRange = "today" | "tomorrow" | "next_7_days" | "today_overdue";

export type ActivityFilterValue =
  | { choice: "without_open_activity" | "overdue" | "without_any_activity" | "activity_done" }
  | { choice: "activity_due"; range: ActivityDueRange };

export interface ActivityFilterEditorProps {
  value: ActivityFilterValue;
  onChange: (value: ActivityFilterValue) => void;
  className?: string;
  "aria-label"?: string;
}

export const ACTIVITY_CHOICES = [
  { value: "without_open_activity", label: "Without Open Activity", inventoryId: "AX-40.1" },
  { value: "overdue", label: "Overdue", inventoryId: "AX-40.2" },
  { value: "activity_due", label: "Activity Due", inventoryId: "AX-40.3" },
  { value: "without_any_activity", label: "Without Any Activity", inventoryId: "AX-40.4" },
  { value: "activity_done", label: "Activity Done", inventoryId: "AX-40.5" },
] as const;

export const ACTIVITY_DUE_RANGES = [
  { id: "today", label: "Today", inventoryId: "AX-41.1" },
  { id: "tomorrow", label: "Tomorrow", inventoryId: "AX-41.2" },
  { id: "next_7_days", label: "Next 7 days", inventoryId: "AX-41.3" },
  { id: "today_overdue", label: "Today + Overdue", inventoryId: "AX-41.4" },
] as const;

export function ActivityFilterEditor({
  value,
  onChange,
  className = "",
  "aria-label": ariaLabel = "Activities",
}: ActivityFilterEditorProps) {
  const currentRange: ActivityDueRange =
    value.choice === "activity_due" ? (value.range ?? "today_overdue") : "today_overdue";

  const handleChoiceChange = (choice: string) => {
    if (choice === "activity_due") {
      const range = value.choice === "activity_due" ? currentRange : "today_overdue";
      onChange({ choice: "activity_due", range });
    } else if (
      choice === "without_open_activity" ||
      choice === "overdue" ||
      choice === "without_any_activity" ||
      choice === "activity_done"
    ) {
      onChange({ choice });
    }
  };

  const handleRangeChange = (rangeKey: unknown) => {
    if (!rangeKey) return;
    const range = String(rangeKey) as ActivityDueRange;
    onChange({ choice: "activity_due", range });
  };

  return (
    <div className={`activity-filter-editor ${className}`}>
      <RadioGroup
        aria-label={ariaLabel}
        value={value.choice}
        onChange={handleChoiceChange}
        className="activity-filter-radiogroup"
      >
        <Radio
          value="without_open_activity"
          className="activity-filter-option"
          data-inventory="AX-40.1"
        >
          {({ isSelected }) => (
            <>
              <span aria-hidden="true" className="activity-filter-radio-circle">
                {isSelected && <span className="activity-filter-radio-dot" />}
              </span>
              <span>Without Open Activity</span>
            </>
          )}
        </Radio>

        <Radio value="overdue" className="activity-filter-option" data-inventory="AX-40.2">
          {({ isSelected }) => (
            <>
              <span aria-hidden="true" className="activity-filter-radio-circle">
                {isSelected && <span className="activity-filter-radio-dot" />}
              </span>
              <span>Overdue</span>
            </>
          )}
        </Radio>

        <Radio value="activity_due" className="activity-filter-option" data-inventory="AX-40.3">
          {({ isSelected }) => (
            <>
              <span aria-hidden="true" className="activity-filter-radio-circle">
                {isSelected && <span className="activity-filter-radio-dot" />}
              </span>
              <span>Activity Due</span>
            </>
          )}
        </Radio>

        {value.choice === "activity_due" && (
          <div className="activity-filter-range-control" data-inventory="AX-41">
            <Select
              label="Activity Due range"
              hideLabel
              variant="filter"
              items={ACTIVITY_DUE_RANGES}
              selectedKey={currentRange}
              value={currentRange}
              onSelectionChange={handleRangeChange}
              onChange={handleRangeChange}
            >
              {(item) => (
                <SelectItem
                  variant="filter"
                  id={item.id}
                  textValue={item.label}
                  data-inventory={item.inventoryId}
                >
                  {({ isSelected }) => (
                    <div className="flex w-full items-center justify-between">
                      <span>{item.label}</span>
                      {isSelected && (
                        <span data-testid="selected-check" className="flex items-center">
                          <Icons.recordPanelCheck
                            className="h-3 w-3 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                        </span>
                      )}
                    </div>
                  )}
                </SelectItem>
              )}
            </Select>
          </div>
        )}

        <Radio
          value="without_any_activity"
          className="activity-filter-option"
          data-inventory="AX-40.4"
        >
          {({ isSelected }) => (
            <>
              <span aria-hidden="true" className="activity-filter-radio-circle">
                {isSelected && <span className="activity-filter-radio-dot" />}
              </span>
              <span>Without Any Activity</span>
            </>
          )}
        </Radio>

        <Radio value="activity_done" className="activity-filter-option" data-inventory="AX-40.5">
          {({ isSelected }) => (
            <>
              <span aria-hidden="true" className="activity-filter-radio-circle">
                {isSelected && <span className="activity-filter-radio-dot" />}
              </span>
              <span>Activity Done</span>
            </>
          )}
        </Radio>
      </RadioGroup>
    </div>
  );
}

export default ActivityFilterEditor;
