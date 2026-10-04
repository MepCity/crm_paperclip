"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  ComboBox as AriaComboBox,
  type ComboBoxProps as AriaComboBoxProps,
  Button,
  FieldError,
  Group,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  Popover,
  Text,
} from "react-aria-components";
import { Icons } from "./icon";
import { Spinner } from "./spinner";

/** How long typing has to pause before a search goes out, so one request covers one pause. */
const LOAD_DEBOUNCE_MS = 300;

/** A loader already filtered the results, so the list is shown as it came back. */
const keepEveryOption = () => true;

const styles = {
  field: "flex flex-col gap-1",
  label: "text-sm font-medium text-text",
  group:
    "flex items-center rounded-md border border-border bg-surface " +
    "focus-within:border-primary focus-within:ring-2 focus-within:ring-focus-ring " +
    "data-disabled:bg-surface-hover data-disabled:opacity-50 data-invalid:border-danger",
  input: "min-w-0 flex-1 bg-transparent px-3 py-2 text-text outline-none data-disabled:opacity-50",
  trigger:
    "flex cursor-default items-center justify-center rounded-md px-2 py-2 outline-none " +
    "data-disabled:opacity-50 data-focus-visible:ring-2 data-focus-visible:ring-focus-ring " +
    "data-hovered:bg-surface-hover data-pressed:bg-surface-pressed",
  popover:
    "max-h-60 overflow-auto rounded-md border border-border bg-surface shadow-lg outline-none",
  status: "flex items-center gap-2 px-3 py-2 text-sm text-text-muted",
  listbox: "p-1 outline-none",
  description: "text-sm text-text-muted",
  error: "text-sm text-danger",
} as const;

export interface ComboBoxProps<T extends object>
  extends Omit<
    AriaComboBoxProps<T>,
    "children" | "items" | "defaultFilter" | "allowsEmptyCollection"
  > {
  label: string;
  description?: string;
  errorMessage?: string;
  /** Fixed list of options, filtered locally as the user types. */
  items?: Iterable<T>;
  /** Fetches the options for the typed text; this is how lookup fields search. */
  loadOptions?: (query: string) => Promise<T[]>;
  /** Whether the list stays open when a search came back empty, so "No results" is visible. */
  allowsEmptyCollection?: boolean;
  defaultFilter?: (textValue: string, inputValue: string) => boolean;
  children: (item: T) => ReactNode;
}

export function ComboBox<T extends object>({
  label,
  description,
  errorMessage,
  items,
  loadOptions,
  allowsEmptyCollection,
  defaultFilter,
  children,
  ...props
}: ComboBoxProps<T>) {
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  // Numbers the searches so a slow answer cannot overwrite the result of a newer one.
  const searchId = useRef(0);
  // Held in a ref so an inline loader does not restart the debounce on every parent render.
  const loader = useRef(loadOptions);
  useEffect(() => {
    loader.current = loadOptions;
  });

  const isAsync = loadOptions !== undefined;

  useEffect(() => {
    if (!isAsync) return;

    const current = ++searchId.current;
    if (query === "") {
      setLoaded([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const load = loader.current;
      if (!load) return;
      const settle = (result: T[]) => {
        if (current !== searchId.current) return;
        setLoaded(result);
        setHasSearched(true);
        setIsLoading(false);
      };
      load(query).then(settle, () => settle([]));
    }, LOAD_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [isAsync, query]);

  const showNoResults = isAsync && !isLoading && hasSearched && loaded.length === 0;

  return (
    <AriaComboBox
      {...props}
      defaultFilter={isAsync ? keepEveryOption : defaultFilter}
      allowsEmptyCollection={isAsync ? true : allowsEmptyCollection}
      onInputChange={(value) => {
        setQuery(value);
        props.onInputChange?.(value);
      }}
      className={styles.field}
    >
      {({ isInvalid }) => (
        <>
          <Label className={styles.label}>{label}</Label>
          {/* The group draws the border, but React Aria reports the resolved invalid state
              (prop or Form validationErrors) only on the ComboBox root. */}
          <Group data-invalid={isInvalid || undefined} className={styles.group}>
            <Input className={styles.input} />
            <Button slot="trigger" className={styles.trigger} aria-label="Show options">
              <Icons.chevronDown className="h-4 w-4 text-text-muted" aria-hidden="true" />
            </Button>
          </Group>
          {description && (
            <Text slot="description" className={styles.description}>
              {description}
            </Text>
          )}
          <FieldError className={styles.error}>{errorMessage}</FieldError>
          <Popover className={styles.popover}>
            {isLoading && (
              <div role="status" className={styles.status}>
                <Spinner className="h-4 w-4" aria-hidden />
                Loading
              </div>
            )}
            {showNoResults && (
              <div role="status" className={styles.status}>
                No results
              </div>
            )}
            <ListBox items={isAsync ? loaded : items} className={styles.listbox}>
              {children}
            </ListBox>
          </Popover>
        </>
      )}
    </AriaComboBox>
  );
}

export function ComboBoxItem(props: ListBoxItemProps) {
  return (
    <ListBoxItem
      {...props}
      className="cursor-default rounded px-3 py-2 text-sm outline-none data-disabled:opacity-50 data-focused:bg-surface-hover data-focus-visible:ring-2 data-focus-visible:ring-focus-ring data-hovered:bg-surface-hover data-selected:font-semibold"
    />
  );
}
