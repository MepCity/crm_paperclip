"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { useUtilityLabel } from "@/i18n/utility-labels";
import { type BinSearch, initialBinSearch } from "./contracts";

function Operator({
  label,
  value,
  options,
  onChange,
  busy,
}: {
  label: string;
  value: string;
  options: string[];
  onChange?: (value: string) => void;
  busy?: boolean;
}) {
  const copy = useUtilityLabel();
  return (
    <Select
      label={label}
      hideLabel
      value={value}
      isDisabled={busy}
      onChange={(key) => onChange?.(String(key))}
      items={options.map((id) => ({ id }))}
    >
      {(item) => <SelectItem id={item.id}>{copy(item.id)}</SelectItem>}
    </Select>
  );
}

export function SearchRows({
  onSearch,
  busy,
  initialSearch = initialBinSearch,
}: {
  onSearch?: (search: BinSearch) => void;
  busy?: boolean;
  initialSearch?: BinSearch;
}) {
  const copy = useUtilityLabel();
  const [draft, setDraft] = useState(initialSearch);
  const change = <K extends keyof BinSearch>(key: K, value: BinSearch[K]) =>
    setDraft((old) => ({ ...old, [key]: value }));
  return (
    <>
      <tr className="bg-(--color-surface-selected)">
        <td />
        <td className="px-3 py-2">
          <Operator
            label={copy("Name operator")}
            value={draft.nameOperator}
            options={["contains"]}
            busy={busy}
          />
        </td>
        <td className="px-3 py-2">
          <Operator label={copy("Type operator")} value="is" options={["is"]} busy={busy} />
        </td>
        <td className="px-3 py-2">
          <Operator
            label={copy("Deleted By operator")}
            value={draft.deletedByOperator}
            options={["contains"]}
            busy={busy}
          />
        </td>
        <td className="px-3 py-2">
          <Operator label={copy("Deleted Time operator")} value="is" options={["is"]} busy={busy} />
        </td>
        <td>
          <Button size="sm" isDisabled={busy} onPress={() => onSearch?.(draft)}>
            {copy("Search")}
          </Button>
        </td>
      </tr>
      <tr className="border-b border-panel-border bg-(--color-surface-selected)">
        <td />
        <td className="px-3 pb-2">
          <TextField
            label={copy("Name search")}
            hideLabel
            isDisabled={busy}
            value={draft.name}
            onChange={(value) => change("name", value)}
          />
        </td>
        <td className="px-3 pb-2">
          <Select
            label={copy("Type search")}
            hideLabel
            placeholder={copy("Select")}
            isDisabled={busy}
            value={draft.module || null}
            onChange={(key) => change("module", key === "all" ? "" : String(key ?? ""))}
            items={[
              { id: "all", label: "Select" },
              ...["Leads", "Contacts", "Accounts", "Deals"].map((id) => ({ id, label: id })),
            ]}
          >
            {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
          </Select>
        </td>
        <td className="px-3 pb-2">
          <TextField
            label={copy("Deleted By search")}
            hideLabel
            isDisabled={busy}
            value={draft.deletedBy}
            onChange={(value) => change("deletedBy", value)}
          />
        </td>
        <td className="px-3 pb-2">
          <div className="flex items-center gap-2">
            <TextField
              label={copy("Deleted Time date")}
              hideLabel
              isDisabled={busy}
              placeholder="DD.MM.YYYY"
              value={draft.date}
              onChange={(value) => change("date", value)}
            />
            <TextField
              label={copy("Deleted Time time")}
              hideLabel
              isDisabled={busy}
              value={draft.time}
              onChange={(value) => change("time", value)}
            />
            <span>{copy("AM")}</span>
          </div>
        </td>
        <td />
      </tr>
    </>
  );
}
