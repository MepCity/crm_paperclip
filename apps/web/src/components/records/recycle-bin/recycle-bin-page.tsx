"use client";

import { formatDateTime } from "@crm/core/format";
import type { RecycleBinEntry } from "@crm/core/records";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useFormat } from "@/lib/format-context";
import { type BinActions, type BinSearch, initialBinSearch } from "./contracts";
import { RecycleBin } from "./recycle-bin";

const perPage = 30;

export function RecycleBinPage({ actions }: { actions: BinActions }) {
  const format = useFormat();
  const [data, setData] = useState<{ entries: readonly RecycleBinEntry[]; total: number }>({
    entries: [],
    total: 0,
  });
  const [query, setQuery] = useState({ search: initialBinSearch, page: 1 });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [confirmation, setConfirmation] = useState<{
    action: "delete" | "empty";
    ids: string[];
  } | null>(null);
  const locked = useRef(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const request = ++generation.current;
    setBusy(true);
    setError(null);
    try {
      const result = await actions.list(query.search, query.page, perPage);
      if (request !== generation.current) return;
      if (result.status === "error") {
        setError([result.message, ...Object.values(result.fieldErrors ?? {}).flat()].join(" "));
        setData({ entries: [], total: 0 });
      } else if (query.page > 1 && result.entries.length === 0) {
        setQuery((old) => ({ ...old, page: Math.max(1, Math.ceil(result.total / perPage)) }));
      } else setData(result);
    } catch {
      if (request === generation.current) {
        setError("Unable to load the Recycle Bin. Try again.");
        setData({ entries: [], total: 0 });
      }
    } finally {
      if (request === generation.current) setBusy(false);
    }
  }, [actions, query]);
  useEffect(() => {
    void load();
    return () => {
      generation.current++;
    };
  }, [load]);

  async function mutate(action: "restore" | "delete" | "empty", ids: string[]) {
    if (locked.current) return;
    if (action !== "empty" && ids.length === 0) {
      setError("Select at least one record.");
      return;
    }
    locked.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await actions.mutate(action, ids);
      if (result.status === "error") {
        const message = [result.message, ...Object.values(result.fieldErrors ?? {}).flat()].join(
          " ",
        );
        setError(message);
        throw new Error(message);
      }
      setConfirmation(null);
      setRevision((value) => value + 1);
      setNotice(
        action === "restore" ? "Selected records restored." : "Records permanently deleted.",
      );
      await load();
    } catch (error) {
      setError((current) => current ?? "The action could not be completed. Try again.");
      throw error;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  function confirm(action: "delete" | "empty", ids: string[]) {
    setError(null);
    if (action === "delete" && !ids.length) {
      setError("Select at least one record.");
      return;
    }
    setConfirmation({ action, ids: action === "empty" ? [] : ids });
  }
  return (
    <div className="flex h-160 min-h-0 flex-col gap-3">
      {error && (
        <div role="alert">
          <p>{error}</p>
          {!confirmation && (
            <Button
              variant="secondary"
              size="sm"
              isDisabled={busy}
              onPress={() => {
                void load();
              }}
            >
              Retry
            </Button>
          )}
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {busy && <p role="status">Loading…</p>}
      <RecycleBin
        key={`${revision}:${query.page}:${JSON.stringify(query.search)}`}
        rows={data.entries.map((entry) => ({
          id: entry.id,
          name: entry.name,
          type: entry.module,
          deletedBy: entry.deletedBy,
          deletedTime: formatDateTime(entry.deletedAt, format),
        }))}
        busy={busy}
        search={query.search}
        total={data.total}
        page={query.page}
        perPage={perPage}
        onPageChange={(page) => setQuery((old) => ({ ...old, page }))}
        onSearch={(search: BinSearch) => {
          setNotice(null);
          setQuery({ search, page: 1 });
        }}
        onRestore={(ids) => {
          void mutate("restore", ids).catch(() => {});
        }}
        onDelete={(ids) => confirm("delete", ids)}
        onEmpty={() => confirm("empty", [])}
      />
      <ConfirmDialog
        isOpen={confirmation !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmation(null);
            setError(null);
          }
        }}
        title={
          confirmation?.action === "empty"
            ? "Empty Recycle Bin?"
            : "Permanently delete selected records?"
        }
        message={
          confirmation?.action === "empty"
            ? "Permanently delete all records you can access in the Recycle Bin, including other pages and records outside the current search? This cannot be undone."
            : `Permanently delete ${confirmation?.ids.length ?? 0} selected records? This cannot be undone.`
        }
        confirmLabel="Delete permanently"
        cancelLabel="Cancel"
        tone="danger"
        busy={busy}
        errorMessage={error}
        onConfirm={() => (confirmation ? mutate(confirmation.action, confirmation.ids) : undefined)}
      />
    </div>
  );
}
