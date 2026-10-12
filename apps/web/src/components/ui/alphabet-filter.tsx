"use client";

import "./alphabet-filter.css";
import { useState } from "react";
import { Button, ListBox, ListBoxItem } from "react-aria-components";
import { Popover, PopoverTrigger } from "./popover";

/** `All`, then A to Z: the 27 rows of the measured layer, in screen order. */
export const ALPHABET_OPTIONS = ["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"] as const;

/** Option text that means "no letter chosen". */
const ALL = "All";

export interface AlphabetFilterProps {
  /** Accessible name of the control. */
  label: string;
  /** Chosen letter, or null while no letter is chosen. */
  value: string | null;
  /** Called with the chosen letter, or null for `All`. Choosing closes the list. */
  onChange: (letter: string | null) => void;
  /** Layout class the caller adds to the trigger. */
  className?: string;
}

/**
 * Single-choice alphabetical filter: a text control that shows the current choice and opens a
 * scrollable list of `All` and the letters. It loads no data and filters nothing itself.
 */
export function AlphabetFilter({ label, value, onChange, className }: AlphabetFilterProps) {
  const [open, setOpen] = useState(false);
  const selected = value ?? ALL;
  function choose(option: string) {
    setOpen(false);
    onChange(option === ALL ? null : option);
  }
  return (
    <PopoverTrigger isOpen={open} onOpenChange={setOpen}>
      <Button
        aria-label={label}
        data-part="alphabet"
        className={`alphabet-trigger ${className ?? ""}`}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span data-part="alphabet-value">{selected}</span>
      </Button>
      <Popover
        title={label}
        hideTitle
        placement="bottom start"
        className="alphabet-panel"
        contentClassName="alphabet-dialog"
      >
        <ListBox
          aria-label={`${label} choices`}
          selectionMode="single"
          escapeKeyBehavior="none"
          autoFocus
          selectedKeys={new Set([selected])}
          onSelectionChange={(keys) => {
            // Re-choosing the selected row reports an empty set, so fall back to it.
            const key = keys === "all" ? selected : ([...keys][0] ?? selected);
            if (typeof key === "string") choose(key);
          }}
          className="alphabet-list"
        >
          {ALPHABET_OPTIONS.map((option) => (
            <ListBoxItem
              key={option}
              id={option}
              textValue={option}
              data-part="alphabet-option"
              className="alphabet-option"
            >
              {option}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </PopoverTrigger>
  );
}
