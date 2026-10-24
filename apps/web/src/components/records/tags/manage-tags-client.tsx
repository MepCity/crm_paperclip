"use client";

import { useCallback, useEffect, useState } from "react";
import {
  mutateTagCatalogueAction,
  readTagCatalogueAction,
  type TagCatalogueResult,
} from "@/app/crm/[orgSlug]/tags/actions";
import { ManageTagsPage } from "./manage-tags-page";

export function ManageTagsClient({
  orgSlug,
  module,
  moduleName,
  onBack,
}: {
  orgSlug: string;
  module: string;
  moduleName: string;
  onBack: () => void;
}) {
  const [result, setResult] = useState<Extract<TagCatalogueResult, { status: "success" }> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const receive = useCallback((next: TagCatalogueResult) => {
    if (next.status === "error") {
      setError(
        Object.values(next.fieldErrors ?? {})
          .flat()
          .join(" ") || next.message,
      );
      return false;
    }
    setResult(next);
    setError(null);
    return true;
  }, []);
  useEffect(() => {
    let active = true;
    setResult(null);
    setError(null);
    readTagCatalogueAction(orgSlug, module)
      .then((next) => {
        if (active) receive(next);
      })
      .catch(() => {
        if (active) setError("Unable to load tags. Please try again.");
      });
    return () => {
      active = false;
    };
  }, [orgSlug, module, receive]);
  return (
    <ManageTagsPage
      moduleName={moduleName}
      onBack={onBack}
      tags={result?.tags}
      tagsCapacity={result?.capacity ?? 100}
      loading={!result && !error}
      error={error}
      canManage={result?.canManage ?? false}
      onSave={async (name, id) => {
        setError(null);
        return receive(
          await mutateTagCatalogueAction(
            orgSlug,
            module,
            id ? { kind: "rename", id, name } : { kind: "create", name },
          ),
        );
      }}
      onDelete={async (id) => {
        setError(null);
        return receive(await mutateTagCatalogueAction(orgSlug, module, { kind: "delete", id }));
      }}
    />
  );
}
