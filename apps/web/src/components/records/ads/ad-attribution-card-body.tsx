"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { TextField } from "@/components/ui/text-field";
import { useUiTranslations } from "@/i18n/client-provider";
import { useOrgSlug } from "@/lib/api/client/provider";
import {
  fetchRecordAttribution,
  type ManualAttributionBody,
  type RecordAttributionOptions,
  type RecordAttributionResponse,
  type RecordAttributionView,
  saveRecordAttribution,
} from "@/modules/ads/api";

export const AD_ATTRIBUTION_TITLE = "Ad Attribution";

/** Only these record pages carry the section; the query never runs elsewhere (no 400 on other pages). */
export function isAdAttributionModule(module: string): boolean {
  return module === "Leads" || module === "Contacts" || module === "Deals";
}

export interface AdAttributionCardBodyProps {
  module: string;
  recordId: string;
}

const NONE = "__none";
const TEXT_FIELDS = [
  "gclid",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmTerm",
  "utmContent",
] as const;
type TextKey = (typeof TEXT_FIELDS)[number];

function draftOf(view: RecordAttributionView | null): ManualAttributionBody {
  return {
    gclid: view?.gclid ?? null,
    utmSource: view?.utmSource ?? null,
    utmMedium: view?.utmMedium ?? null,
    utmCampaign: view?.utmCampaign ?? null,
    utmTerm: view?.utmTerm ?? null,
    utmContent: view?.utmContent ?? null,
    campaignId: view?.campaign?.id ?? null,
    adGroupId: view?.adGroup?.id ?? null,
    keywordId: view?.keyword?.id ?? null,
    adItemId: view?.ad?.id ?? null,
  };
}

export function AdAttributionCardBody({ module, recordId }: AdAttributionCardBodyProps) {
  const t = useUiTranslations();
  const orgSlug = useOrgSlug();
  const queryClient = useQueryClient();
  const supported = isAdAttributionModule(module);
  const queryKey = ["record-ad-attribution", orgSlug, module, recordId];
  const [draft, setDraft] = useState<ManualAttributionBody | null>(null);

  const { data, isLoading, error } = useQuery<RecordAttributionResponse>({
    queryKey,
    queryFn: () => fetchRecordAttribution(orgSlug, module, recordId),
    enabled: supported && Boolean(recordId) && Boolean(orgSlug),
  });

  const save = useMutation({
    mutationFn: (body: ManualAttributionBody) =>
      saveRecordAttribution(orgSlug, module, recordId, body),
    onSuccess: (next) => {
      queryClient.setQueryData(queryKey, next);
      setDraft(null);
    },
  });

  if (!supported) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-6" data-testid="ad-attribution-loading">
        <Spinner
          className="size-5 text-text-muted"
          aria-label={t("modules.adAttribution.loading")}
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p role="alert" className="py-4 text-xs text-danger" data-testid="ad-attribution-error">
        {t("modules.adAttribution.loadError")}
      </p>
    );
  }

  if (draft && data.options) {
    return (
      <AttributionForm
        draft={draft}
        options={data.options}
        saving={save.isPending}
        failed={save.isError}
        onChange={setDraft}
        onCancel={() => {
          save.reset();
          setDraft(null);
        }}
        onSave={() => save.mutate(draft)}
      />
    );
  }

  const view = data.attribution;
  const editButton = data.canEdit ? (
    <div className="flex justify-end pb-2">
      <Button
        variant="secondary"
        data-testid="ad-attribution-edit"
        onPress={() => setDraft(draftOf(view))}
      >
        {view ? t("modules.adAttribution.edit") : t("modules.adAttribution.add")}
      </Button>
    </div>
  ) : null;

  if (!view) {
    return (
      <div data-testid="ad-attribution-section">
        {editButton}
        <div
          data-testid="ad-attribution-empty"
          data-part="empty"
          className="py-6 text-left text-sm text-text-muted"
        >
          {t("modules.adAttribution.empty")}
        </div>
      </div>
    );
  }

  const none = t("modules.adAttribution.none");
  const rows: readonly [string, string, string][] = [
    ["campaign", t("modules.adAttribution.fields.campaign"), view.campaign?.name ?? none],
    ["adGroup", t("modules.adAttribution.fields.adGroup"), view.adGroup?.name ?? none],
    ["keyword", t("modules.adAttribution.fields.keyword"), view.keyword?.name ?? none],
    ["ad", t("modules.adAttribution.fields.ad"), view.ad?.name ?? none],
    ...TEXT_FIELDS.map(
      (key) =>
        [key, t(`modules.adAttribution.fields.${key}`), view[key] ?? none] as [
          string,
          string,
          string,
        ],
    ),
    [
      "source",
      t("modules.adAttribution.fields.source"),
      t(`modules.adAttribution.sources.${view.source}`),
    ],
    ["modifiedTime", t("modules.adAttribution.fields.modifiedTime"), formatTime(view.modifiedTime)],
  ];

  return (
    <div data-testid="ad-attribution-section">
      {editButton}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 py-1 text-sm">
        {rows.map(([key, label, value]) => (
          <div key={key} className="grid grid-cols-[minmax(0,10rem)_1fr] gap-3">
            <dt className="truncate text-text-muted">{label}</dt>
            <dd className="truncate text-text" data-testid={`ad-attribution-${key}`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AttributionForm({
  draft,
  options,
  saving,
  failed,
  onChange,
  onCancel,
  onSave,
}: {
  draft: ManualAttributionBody;
  options: RecordAttributionOptions;
  saving: boolean;
  failed: boolean;
  onChange: (next: ManualAttributionBody) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const t = useUiTranslations();
  const none = { id: NONE, name: t("modules.adAttribution.none") };
  const groups = options.adGroups.filter((g) => g.campaignId === draft.campaignId);
  const keywords = options.keywords.filter((k) => k.adGroupId === draft.adGroupId);
  const ads = options.ads.filter((a) => a.adGroupId === draft.adGroupId);
  const pick = (key: string) => (key === NONE ? null : key);

  const picker = (
    field: "campaign" | "adGroup" | "keyword" | "ad",
    items: readonly { id: string; name: string }[],
    selected: string | null,
    apply: (id: string | null) => void,
  ) => (
    <Select
      label={t(`modules.adAttribution.fields.${field}`)}
      items={[none, ...items]}
      selectedKey={selected ?? NONE}
      onSelectionChange={(key) => apply(pick(String(key)))}
      data-testid={`ad-attribution-input-${field}`}
    >
      {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
    </Select>
  );

  return (
    <form
      data-testid="ad-attribution-form"
      className="flex flex-col gap-3 py-1"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {picker("campaign", options.campaigns, draft.campaignId, (campaignId) =>
          onChange({ ...draft, campaignId, adGroupId: null, keywordId: null, adItemId: null }),
        )}
        {picker("adGroup", groups, draft.adGroupId, (adGroupId) =>
          onChange({ ...draft, adGroupId, keywordId: null, adItemId: null }),
        )}
        {picker("keyword", keywords, draft.keywordId, (keywordId) =>
          onChange({ ...draft, keywordId }),
        )}
        {picker("ad", ads, draft.adItemId, (adItemId) => onChange({ ...draft, adItemId }))}
        {TEXT_FIELDS.map((key: TextKey) => (
          <TextField
            key={key}
            size="fill"
            label={t(`modules.adAttribution.fields.${key}`)}
            value={draft[key] ?? ""}
            maxLength={255}
            onChange={(value) => onChange({ ...draft, [key]: value === "" ? null : value })}
            data-testid={`ad-attribution-input-${key}`}
          />
        ))}
      </div>
      {failed ? (
        <p role="alert" className="text-xs text-danger">
          {t("modules.adAttribution.saveError")}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onPress={onCancel} isDisabled={saving}>
          {t("modules.adAttribution.cancel")}
        </Button>
        <Button
          variant="primary"
          type="submit"
          isDisabled={saving}
          data-testid="ad-attribution-save"
        >
          {saving ? t("modules.adAttribution.saving") : t("modules.adAttribution.save")}
        </Button>
      </div>
    </form>
  );
}
