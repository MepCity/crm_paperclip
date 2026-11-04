"use client";

import { listOrganisationTaxes, taxLabel } from "@crm/core/records/tax";
import { Button as AriaButton } from "react-aria-components";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { formatMoney } from "./money";

export interface DiscountPopupProps {
  label: string;
  mode: "amount" | "percent";
  value: string;
  /** Computed discount amount shown on the trigger. */
  amount: number | null;
  disabled?: boolean;
  onChange: (next: { mode: "amount" | "percent"; value: string }) => void;
}

/** Discount popup: percent or amount (ADR 0016 §3). */
export function DiscountPopup({
  label,
  mode,
  value,
  amount,
  disabled,
  onChange,
}: DiscountPopupProps) {
  return (
    <PopoverTrigger>
      <AriaButton className="line-items__popup-trigger" isDisabled={disabled} aria-label={label}>
        {formatMoney(amount ?? 0)}
      </AriaButton>
      <Popover title={label} placement="bottom end" contentClassName="line-items__popup">
        <div role="radiogroup" aria-label={`${label} type`} className="line-items__popup-modes">
          {(["percent", "amount"] as const).map((option) => (
            <label key={option} className="line-items__radio">
              <input
                type="radio"
                name={`${label}-mode`}
                checked={mode === option}
                onChange={() => onChange({ mode: option, value })}
              />
              {option === "percent" ? "Percent (%)" : "Amount (TL)"}
            </label>
          ))}
        </div>
        <input
          type="text"
          inputMode="decimal"
          className="line-items__input"
          aria-label={`${label} value`}
          value={value}
          onChange={(event) => onChange({ mode, value: event.target.value })}
        />
      </Popover>
    </PopoverTrigger>
  );
}

export interface TaxPopupProps {
  label: string;
  selected: readonly string[];
  amount: number | null;
  disabled?: boolean;
  onChange: (next: string[]) => void;
}

/** Tax popup: organisation taxes with checkboxes and percentages (ADR 0016 §4). */
export function TaxPopup({ label, selected, amount, disabled, onChange }: TaxPopupProps) {
  return (
    <PopoverTrigger>
      <AriaButton className="line-items__popup-trigger" isDisabled={disabled} aria-label={label}>
        {formatMoney(amount ?? 0)}
      </AriaButton>
      <Popover title={label} placement="bottom end" contentClassName="line-items__popup">
        <ul className="line-items__tax-list">
          {listOrganisationTaxes().map((tax) => (
            <li key={tax.name}>
              <label className="line-items__radio">
                <input
                  type="checkbox"
                  checked={selected.includes(tax.name)}
                  onChange={(event) =>
                    onChange(
                      event.target.checked
                        ? [...selected, tax.name]
                        : selected.filter((name) => name !== tax.name),
                    )
                  }
                />
                {taxLabel(tax)}
              </label>
            </li>
          ))}
        </ul>
      </Popover>
    </PopoverTrigger>
  );
}
