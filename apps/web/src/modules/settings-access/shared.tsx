"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { AccessApiError } from "./api";

export function errorText(error: unknown): string {
  if (error instanceof AccessApiError) {
    if (error.code === "permission_denied") return "You do not have permission to manage access.";
    return error.fullMessage;
  }
  return "The change could not be saved.";
}

export type Loaded<T> =
  | { status: "loading" }
  | { status: "error"; message: string; denied: boolean }
  | { status: "ready"; data: T };

/** Loads data (again on `reload`); the screens render loading, error and denied states. */
export function useLoad<T>(load: () => Promise<T>): [Loaded<T>, () => void] {
  const [state, setState] = useState<Loaded<T>>({ status: "loading" });
  const [tick, setTick] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `tick` re-runs the loader.
  useEffect(() => {
    let live = true;
    load()
      .then((data) => live && setState({ status: "ready", data }))
      .catch((error: unknown) => {
        if (!live) return;
        const denied = error instanceof AccessApiError && error.code === "permission_denied";
        setState({
          status: "error",
          denied,
          message: denied
            ? "You do not have permission to manage access."
            : "This page could not be loaded.",
        });
      });
    return () => {
      live = false;
    };
  }, [load, tick]);
  return [state, useCallback(() => setTick((n) => n + 1), [])];
}

export function Screen<T>({
  state,
  title,
  actions,
  children,
}: {
  state: Loaded<T>;
  title: string;
  actions?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4" data-settings-access>
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text">{title}</h1>
        {state.status === "ready" ? actions : null}
      </header>
      {state.status === "loading" ? (
        <p role="status" className="text-sm text-text-muted">
          Loading…
        </p>
      ) : state.status === "error" ? (
        <Alert variant="danger" title={state.denied ? "Access denied" : undefined}>
          {state.message}
        </Alert>
      ) : (
        children(state.data)
      )}
    </section>
  );
}

export function HelpText({ children }: { children: ReactNode }) {
  return <p className="max-w-3xl text-sm text-text-muted">{children}</p>;
}

export const LEVEL_LABELS = {
  private: "Private (owner can view)",
  public_read: "Public (Read only)",
  public_read_write: "Public (Read/Write)",
  public_read_write_delete: "Public (Read/Write/Delete)",
} as const;

export const SHARING_LEVEL_LABELS = {
  read: "Read only",
  read_write: "Read/Write",
  read_write_delete: "Read/Write/Delete",
} as const;

export const SUBJECT_KIND_LABELS = {
  role: "Role",
  role_and_subordinates: "Role and subordinates",
  group: "Group",
} as const;
