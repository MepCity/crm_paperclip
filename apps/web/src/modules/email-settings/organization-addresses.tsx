"use client";

import type { DefinitionResult, OrganizationAddress } from "@crm/core/definitions";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUiTranslations } from "@/i18n/client-provider";

export interface OrganizationAddressActions {
  list?(): Promise<DefinitionResult<readonly OrganizationAddress[]>>;
  add(
    input: { displayName: string; address: string },
    key: string,
  ): Promise<DefinitionResult<OrganizationAddress>>;
}

export function OrganizationAddresses({
  actions,
  orgSlug,
}: {
  actions?: OrganizationAddressActions;
  orgSlug?: string;
}) {
  const t = useUiTranslations();
  const [rows, setRows] = useState<readonly OrganizationAddress[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ displayName: "", address: "" });
  const [key, setKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!!actions);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: reload explicitly retries the same read.
  useEffect(() => {
    if (!actions) return;
    let active = true;
    setLoading(true);
    const read = actions.list
      ? actions.list()
      : fetch(`/api/definitions/${encodeURIComponent(orgSlug ?? "")}/organization-addresses`, {
          cache: "no-store",
        }).then((response): Promise<DefinitionResult<readonly OrganizationAddress[]>> => {
          if (!response.ok) throw new Error("Unavailable");
          return response.json();
        });
    read
      .then((result) => {
        if (!active) return;
        if (result.ok) {
          setRows(result.value);
          setError(null);
        } else setError(result.error.code);
      })
      .catch(() => {
        if (active) setError("unavailable");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [actions, orgSlug, reload]);
  async function save() {
    if (!actions || busy) return;
    const requestKey = key ?? crypto.randomUUID();
    setKey(requestKey);
    setBusy(true);
    setError(null);
    try {
      const result = await actions.add(draft, requestKey);
      if (result.ok) {
        setRows((previous) => [...previous.filter((r) => r.id !== result.value.id), result.value]);
        setOpen(false);
      } else setError(result.error.code);
    } catch {
      setError("unavailable");
    } finally {
      setBusy(false);
    }
  }
  const errorText =
    error &&
    t(
      error === "forbidden"
        ? "modules.definitionWrites.forbidden"
        : error === "conflict"
          ? "modules.definitionWrites.conflict"
          : error === "validation"
            ? "modules.definitionWrites.validation"
            : "modules.definitionWrites.error",
    );
  return (
    <>
      <h1 className="text-xl font-semibold">{t("modules.emailSettings.orgTitle")}</h1>
      <p className="mt-3 max-w-5xl text-md leading-relaxed">
        {t("modules.emailSettings.orgDescription")}
      </p>
      {loading && <p role="status">{t("modules.emailSettings.loading")}</p>}
      {error && !open && (
        <div>
          <p role="alert">{errorText}</p>
          <Button variant="secondary" onPress={() => setReload((n) => n + 1)}>
            {t("modules.assignment.retry")}
          </Button>
        </div>
      )}
      {rows.length > 0 && (
        <table className="mt-6 w-full text-left text-md">
          <thead>
            <tr className="border-b border-border">
              <th className="p-3">{t("modules.emailSettings.displayName")}</th>
              <th className="p-3">{t("modules.emailSettings.emailAddress")}</th>
              <th className="p-3">{t("modules.assignment.status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="p-3">{row.displayName}</td>
                <td className="p-3">{row.address}</td>
                <td className="p-3">
                  <span className="text-accent-orange">
                    {t("modules.definitionWrites.unverified")}
                  </span>
                  <p className="mt-1 text-sm text-text-muted">
                    {t("modules.definitionWrites.verificationPending")}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Button
        className="mt-8"
        isDisabled={loading || error === "forbidden"}
        onPress={() => {
          setDraft({ displayName: "", address: "" });
          setKey(null);
          setError(null);
          setOpen(true);
        }}
      >
        {t("modules.emailSettings.addAddress")}
      </Button>
      <TopAlignedModal
        isOpen={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
        aria-labelledby="org-address-title"
        panelStyle={{ width: "min(600px,95vw)" }}
      >
        <form
          className="p-8 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <h2 id="org-address-title" className="text-xl font-semibold">
            {t("modules.emailSettings.addAddress")}
          </h2>
          <TextField
            label={t("modules.emailSettings.displayName")}
            isRequired
            isDisabled={busy}
            maxLength={255}
            value={draft.displayName}
            onChange={(displayName) => {
              setDraft({ ...draft, displayName });
              setKey(null);
            }}
          />
          <TextField
            label={t("modules.emailSettings.emailAddress")}
            type="email"
            isRequired
            isDisabled={busy}
            maxLength={320}
            value={draft.address}
            onChange={(address) => {
              setDraft({ ...draft, address });
              setKey(null);
            }}
          />
          <p className="text-text-muted">{t("modules.definitionWrites.verificationPending")}</p>
          {error && <p role="alert">{errorText}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" isDisabled={busy} onPress={() => setOpen(false)}>
              {t("common.actions.cancel")}
            </Button>
            <Button
              type="submit"
              isDisabled={busy || !actions || !draft.displayName.trim() || !draft.address.trim()}
            >
              {t("common.actions.save")}
            </Button>
          </div>
        </form>
      </TopAlignedModal>
    </>
  );
}
