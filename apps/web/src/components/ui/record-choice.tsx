"use client";

import "./record-input.css";
import type { ReactNode } from "react";
import { useId, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  TextField,
} from "react-aria-components";
import { Icons } from "./icon";

export interface RecordChoiceOption {
  value: string | null;
  label: string;
  secondaryLabel?: string;
}

export interface RecordChoiceProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: readonly RecordChoiceOption[];
  searchable?: boolean;
  owner?: boolean;
  prefix?: boolean;
  searchLabel?: string;
  disabled?: boolean;
  required?: boolean;
  errorMessage?: string;
  hideLabel?: boolean;
  mutedEmpty?: boolean;
  defaultOpen?: boolean;
  id?: string;
  endAction?: ReactNode;
  inline?: boolean;
}

/** Pure option UI; supplies no inventories and performs no data loading. */
export function RecordChoice({
  label,
  value,
  onChange,
  options,
  searchable = false,
  owner = false,
  prefix = false,
  searchLabel = "Search",
  disabled,
  required,
  errorMessage,
  hideLabel,
  mutedEmpty,
  defaultOpen = false,
  id: controlId,
  endAction,
  inline = false,
}: RecordChoiceProps) {
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const [open, setOpen] = useState(defaultOpen && !disabled);
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);
  const items = options.map((option, index) => ({ ...option, id: String(index) }));
  const selectedId = items.find((option) => option.value === value)?.id;
  const filtered = items.filter((option) => {
    const needle = query.toLowerCase();
    return (
      option.value === null ||
      option.label.toLowerCase().includes(needle) ||
      (owner && (option.secondaryLabel ?? "").toLowerCase().includes(needle))
    );
  });
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const valueId = `${id}-value`;
  const triggerClass = prefix
    ? "record-choice-trigger"
    : endAction
      ? "record-choice-trigger"
      : "record-control record-choice-trigger";
  const shellClass = endAction
    ? "record-control record-choice-shell record-choice-shell--owner"
    : prefix
      ? undefined
      : undefined;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span id={labelId} className={hideLabel ? "sr-only" : "record-label"}>
        {label}
      </span>
      <DialogTrigger
        isOpen={open && !disabled}
        onOpenChange={(next) => {
          // Non-modal focus can scroll an ancestor, which requests overlay closure.
          // Keep the list open while its option still holds focus.
          if (inline && !next && listRef.current?.contains(document.activeElement)) return;
          setOpen(next);
          setQuery("");
        }}
      >
        {shellClass ? (
          <div
            className={shellClass}
            data-required={required || undefined}
            data-inline-empty={(inline && value === null) || undefined}
            data-invalid={Boolean(errorMessage) || undefined}
          >
            <Button
              id={id}
              aria-labelledby={labelId}
              aria-describedby={`${valueId}${errorMessage ? ` ${errorId}` : ""}`}
              render={(domProps) => (
                <button {...domProps} aria-invalid={errorMessage ? true : undefined} />
              )}
              isDisabled={disabled}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  setOpen(true);
                  setQuery("");
                }
              }}
              className={triggerClass}
            >
              <span
                id={valueId}
                className={`truncate ${mutedEmpty && value === null ? "record-prefix-empty" : ""}`}
                {...((mutedEmpty || inline) && value === null
                  ? { "data-part": "empty-value" }
                  : {})}
              >
                {inline && value === null ? "None" : (selected?.label ?? value ?? "-None-")}
              </span>
              <Icons.recordFormCaret
                className="record-form-caret"
                data-open={open ? "" : undefined}
                aria-hidden
              />
            </Button>
            {endAction}
          </div>
        ) : (
          <Button
            id={prefix ? undefined : id}
            aria-labelledby={labelId}
            aria-describedby={`${valueId}${errorMessage ? ` ${errorId}` : ""}`}
            render={(domProps) => (
              <button {...domProps} aria-invalid={errorMessage ? true : undefined} />
            )}
            data-inline-empty={(inline && value === null) || undefined}
            data-invalid={Boolean(errorMessage) || undefined}
            data-required={required || undefined}
            isDisabled={disabled}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                setOpen(true);
                setQuery("");
              }
            }}
            className={triggerClass}
          >
            <span
              id={valueId}
              className={`truncate ${mutedEmpty && value === null ? "record-prefix-empty" : ""}`}
              {...((mutedEmpty || inline) && value === null ? { "data-part": "empty-value" } : {})}
            >
              {inline && value === null ? "None" : (selected?.label ?? value ?? "-None-")}
            </span>
            <Icons.recordFormCaret
              className="record-form-caret"
              data-open={open ? "" : undefined}
              aria-hidden
            />
          </Button>
        )}
        <Popover
          isNonModal={inline}
          offset={inline ? -1 : 0}
          placement="bottom start"
          style={prefix ? { width: "var(--size-form-prefix-width)" } : undefined}
          className={`record-choice-panel ${inline ? "record-inline-choice-panel" : ""} ${owner ? "record-owner-panel" : searchable ? "record-search-panel" : ""}`}
        >
          <Dialog aria-label={`${label} options`} className="record-search-dialog">
            {searchable && (
              <TextField className="record-panel-search" value={query} onChange={setQuery}>
                <Label className="sr-only">{searchLabel}</Label>
                <Icons.recordPanelSearch aria-hidden className="record-panel-search-icon" />
                <Input
                  autoFocus
                  placeholder={owner ? searchLabel : ""}
                  className="record-control"
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      listRef.current?.focus();
                    }
                  }}
                />
              </TextField>
            )}
            <ListBox
              ref={listRef}
              aria-label={`${label} choices`}
              items={filtered}
              selectionMode="single"
              selectedKeys={selectedId === undefined ? [] : [selectedId]}
              onSelectionChange={(keys) => {
                const key = keys === "all" ? selectedId : ([...keys][0] ?? selectedId);
                const option = items.find((item) => item.id === key);
                if (option) {
                  onChange(option.value);
                  setOpen(false);
                  setQuery("");
                }
              }}
              className="record-choice-list"
              autoFocus={!searchable}
            >
              {(option) => (
                <ListBoxItem
                  id={option.id}
                  textValue={option.label}
                  className={`record-choice-row ${owner ? "record-owner-row" : ""}`}
                >
                  {({ isSelected }) => (
                    <>
                      {inline && (
                        <span className="record-inline-choice-check" aria-hidden>
                          {isSelected && <Icons.inlineCheck />}
                        </span>
                      )}
                      {!inline && isSelected && (
                        <Icons.recordPanelCheck aria-hidden className="record-choice-check" />
                      )}
                      {owner && (
                        <span aria-hidden className="record-owner-avatar">
                          <Icons.avatarPerson className="record-owner-avatar-icon" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        <span className={owner ? "record-owner-name block truncate" : ""}>
                          {option.label}
                        </span>
                        {owner && option.secondaryLabel && (
                          <span className="record-owner-email block truncate font-normal">
                            {option.secondaryLabel}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </ListBoxItem>
              )}
            </ListBox>
          </Dialog>
        </Popover>
      </DialogTrigger>
      {errorMessage && (
        <span id={errorId} className="record-form-validation-error">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
