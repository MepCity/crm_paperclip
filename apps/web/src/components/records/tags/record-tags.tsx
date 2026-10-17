"use client";

import type { Tag } from "@crm/core/records";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type RecordTagResult,
  readRecordTagsAction,
  removeRecordTagAction,
  saveRecordTagsAction,
} from "@/app/crm/[orgSlug]/tags/actions";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { TagEntry } from "@/components/ui/tag-entry";

export function RecordTags({
  orgSlug,
  module,
  recordId,
  label,
}: {
  orgSlug: string;
  module: string;
  recordId: string;
  label: string;
}) {
  const readVersion = useRef(0);
  const [tags, setTags] = useState<readonly Tag[]>([]);
  const [catalogue, setCatalogue] = useState<readonly Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const receive = useCallback((result: RecordTagResult) => {
    if (result.status === "error") {
      setError(
        Object.values(result.fieldErrors ?? {})
          .flat()
          .join(" ") || result.message,
      );
      return false;
    }
    setTags(result.tags);
    setCatalogue(result.catalogue);
    return true;
  }, []);
  useEffect(() => {
    let active = true;
    const version = ++readVersion.current;
    readRecordTagsAction(orgSlug, module, recordId)
      .then((result) => {
        if (active && version === readVersion.current) receive(result);
      })
      .catch(() => {
        if (active && version === readVersion.current)
          setError("Unable to load tags. Please try again.");
      });
    return () => {
      active = false;
    };
  }, [orgSlug, module, recordId, receive]);
  function changeOpen(next: boolean) {
    if (busy) return;
    setOpen(next);
    setInput("");
    setPending([]);
    setError(null);
    if (next) {
      const version = ++readVersion.current;
      readRecordTagsAction(orgSlug, module, recordId)
        .then((result) => {
          if (version === readVersion.current) receive(result);
        })
        .catch(() => {
          if (version === readVersion.current) setError("Unable to load tags. Please try again.");
        });
    }
  }
  function add(name: string) {
    const value = name.trim().normalize("NFC");
    if (value && !pending.some((item) => item.toLowerCase() === value.toLowerCase()))
      setPending([...pending, value]);
    setInput("");
  }
  async function mutate(action: () => Promise<RecordTagResult>, close: boolean) {
    readVersion.current++;
    setBusy(true);
    setError(null);
    try {
      if (receive(await action()) && close) {
        setOpen(false);
        setInput("");
        setPending([]);
      }
    } catch {
      setError("Unable to update tags. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-1 flex items-center gap-1.5">
      <Icons.recordTag aria-hidden className="size-3.5 shrink-0 text-text-muted" />
      <PopoverTrigger isOpen={open} onOpenChange={changeOpen}>
        <Button variant="ghost" size="compact">
          {label}
        </Button>
        <Popover
          title="Add Tags"
          hideTitle
          placement="bottom start"
          className="w-150 max-w-full"
          isNonModal
        >
          <div className="flex items-start gap-2">
            <Icons.recordTag aria-hidden className="mt-2 size-5 shrink-0 text-text-muted" />
            <div className="min-w-0 flex-1">
              {pending.length ? (
                <div className="mb-2 flex flex-wrap gap-1">
                  {pending.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 rounded bg-bg px-2 py-1 text-sm"
                    >
                      {name}
                      <Button
                        variant="ghost"
                        size="compact"
                        aria-label={`Remove pending tag ${name}`}
                        isDisabled={busy}
                        onPress={() => setPending(pending.filter((item) => item !== name))}
                      >
                        ×
                      </Button>
                    </span>
                  ))}
                </div>
              ) : null}
              <TagEntry
                value={input}
                onChange={setInput}
                onAdd={add}
                suggestions={catalogue}
                disabled={busy}
              />
            </div>
          </div>
          {error ? (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              isDisabled={busy}
              onPress={() => changeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              isDisabled={busy || (!pending.length && !input.trim())}
              onPress={() =>
                void mutate(
                  () =>
                    saveRecordTagsAction(orgSlug, module, recordId, [
                      ...pending,
                      ...(input.trim() ? [input] : []),
                    ]),
                  true,
                )
              }
            >
              Save
            </Button>
          </div>
        </Popover>
      </PopoverTrigger>
      <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex shrink-0 items-center gap-1 rounded border border-border bg-bg px-2 text-sm"
            style={tag.color ? { borderColor: tag.color } : undefined}
          >
            {tag.name}
            <Button
              variant="ghost"
              size="compact"
              aria-label={`Remove tag ${tag.name}`}
              isDisabled={busy}
              onPress={() =>
                void mutate(() => removeRecordTagAction(orgSlug, module, recordId, tag.id), false)
              }
            >
              ×
            </Button>
          </span>
        ))}
      </div>
      {!open && error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
