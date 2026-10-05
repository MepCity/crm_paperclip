"use client";

import {
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ComboBox as AriaComboBox,
  type ComboBoxProps as AriaComboBoxProps,
  Button,
  ComboBoxStateContext,
  FieldError,
  Group,
  Input,
  type Key,
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

const styles = {
  field: "flex flex-col gap-1",
  label: "text-md font-normal text-text",
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
  /** Initial lookup selection, including its label so no search is needed to display it. */
  defaultSelectedItem?: { id: Key; label: string };
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
  defaultSelectedItem,
  allowsEmptyCollection,
  defaultFilter,
  children,
  ...props
}: ComboBoxProps<T>) {
  const isAsync = loadOptions !== undefined;
  const [selected, setSelected] = useState(() => {
    if (defaultSelectedItem) return defaultSelectedItem;
    const id = props.defaultValue ?? props.defaultSelectedKey;
    return id != null && props.defaultInputValue !== undefined
      ? { id, label: props.defaultInputValue }
      : null;
  });
  // A lookup's initial key is valid only when its label is known.
  const [localKey, setLocalKey] = useState<Key | null>(selected?.id ?? null);
  const [localInput, setLocalInput] = useState(
    props.defaultInputValue ?? defaultSelectedItem?.label ?? "",
  );
  const key =
    props.value !== undefined
      ? props.value
      : props.selectedKey !== undefined
        ? props.selectedKey
        : localKey;
  const inputValue = props.inputValue ?? localInput;
  // RAC can commit more than once before React renders the controlled values.
  const currentKey = useRef(key);
  const currentInput = useRef(inputValue);
  useLayoutEffect(() => {
    currentKey.current = key;
    currentInput.current = inputValue;
  }, [key, inputValue]);
  const [search, setSearch] = useState<{ query: string } | null>(null);
  const [loaded, setLoaded] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  // Invalidated immediately on edits/close, including requests already in flight.
  const searchId = useRef(0);
  const selectionHandler = useRef<((key: Key | null) => void) | null>(null);
  const loader = useRef(loadOptions);
  useEffect(() => {
    loader.current = loadOptions;
  });

  function stopSearch() {
    searchId.current++;
    setSearch(null);
    setIsLoading(false);
  }

  function startSearch(query: string) {
    searchId.current++;
    setLoaded([]);
    setHasSearched(false);
    setIsLoading(true);
    setSearch({ query });
  }

  function changeInput(value: string) {
    setLocalInput(value);
    if (value !== currentInput.current) {
      currentInput.current = value;
      props.onInputChange?.(value);
    }
  }

  function changeSelection(nextKey: Key | null, label: string) {
    setLocalKey(nextKey);
    setSelected(nextKey === null ? null : { id: nextKey, label });
    changeInput(label);
    stopSearch();
    if (nextKey !== currentKey.current) {
      currentKey.current = nextKey;
      props.onChange?.(nextKey);
      props.onSelectionChange?.(nextKey);
    }
  }

  useEffect(() => {
    if (!isAsync || !search) return;
    const current = searchId.current;
    let active = true;
    const timer = setTimeout(async () => {
      const load = loader.current;
      if (!load) return;
      let result: T[];
      try {
        result = await load(search.query);
      } catch {
        result = [];
      }
      if (!active || current !== searchId.current) return;
      setLoaded(result);
      setHasSearched(true);
      setIsLoading(false);
    }, LOAD_DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isAsync, search]);

  const showNoResults = isAsync && !isLoading && hasSearched && loaded.length === 0;
  const asyncProps: Partial<AriaComboBoxProps<T>> = isAsync
    ? {
        items: loaded,
        value: key,
        inputValue,
        onChange: (nextKey) => selectionHandler.current?.(nextKey),
        // Forward the legacy callback once from changeSelection, alongside onChange.
        onSelectionChange: undefined,
        // RAC calls this for edits. Selection and revert use onChange when both values are controlled.
        onInputChange: (value) => {
          changeInput(value);
          if (value === "") {
            setLocalKey(null);
            setSelected(null);
            if (currentKey.current !== null) {
              currentKey.current = null;
              props.onChange?.(null);
              props.onSelectionChange?.(null);
            }
          }
          startSearch(value);
        },
        onOpenChange: (open, trigger) => {
          if (open) {
            // Input changes already started the search; button/arrow openings need their own.
            if (trigger !== "input") startSearch(inputValue);
          } else {
            stopSearch();
          }
          props.onOpenChange?.(open, trigger);
        },
      }
    : {};

  return (
    <AriaComboBox
      {...props}
      {...asyncProps}
      defaultFilter={defaultFilter}
      allowsEmptyCollection={isAsync ? true : allowsEmptyCollection}
      className={styles.field}
    >
      {({ isInvalid }) => (
        <>
          {isAsync && (
            <LookupSelection
              handler={selectionHandler}
              selected={selected}
              onChange={changeSelection}
            />
          )}
          <Label className={styles.label}>{label}</Label>
          {/* The group draws the border, but React Aria reports the resolved invalid state
              (prop or Form validationErrors) only on the ComboBox root. */}
          <Group data-invalid={isInvalid || undefined} className={styles.group}>
            <PreservedInput className={styles.input} />
            <Button slot="trigger" className={styles.trigger}>
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

/**
 * Hydration leaves text the user typed into the server markup, then React writes the
 * field state over it. The value tracker already matches that text, so an input event
 * would be ignored. Reset the tracker and publish the event so React Aria keeps it.
 */
function PreservedInput({ className }: { className: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || node.value === node.defaultValue) return;
    const tracker = (
      node as HTMLInputElement & { _valueTracker?: { setValue: (value: string) => void } }
    )._valueTracker;
    tracker?.setValue(node.defaultValue);
    node.dispatchEvent(new Event("input", { bubbles: true }));
  }, []);
  return <Input ref={ref} className={className} />;
}

/** Reads option text from RAC's collection without imposing a shape on loader results. */
function LookupSelection({
  handler,
  selected,
  onChange,
}: {
  handler: RefObject<((key: Key | null) => void) | null>;
  selected: { id: Key; label: string } | null;
  onChange: (key: Key | null, label: string) => void;
}) {
  const state = useContext(ComboBoxStateContext);
  useLayoutEffect(() => {
    // CollectionBuilder also renders this child without a state context.
    if (!state) return;
    handler.current = (key) => {
      const label =
        key === null
          ? ""
          : selected?.id === key
            ? selected.label
            : (state.collection.getItem(key)?.textValue ?? "");
      onChange(key, label);
    };
    return () => {
      handler.current = null;
    };
  }, [handler, selected, state, onChange]);
  return null;
}

export function ComboBoxItem(props: ListBoxItemProps) {
  return (
    <ListBoxItem
      {...props}
      className="cursor-default rounded px-3 py-2 text-sm outline-none data-disabled:opacity-50 data-focused:bg-surface-hover data-focus-visible:ring-2 data-focus-visible:ring-focus-ring data-hovered:bg-surface-hover data-selected:font-semibold"
    />
  );
}
