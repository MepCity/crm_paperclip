"use client";

import type { CampaignFilterValue, ListQuery } from "@crm/core/records";
import { campaignMemberStatuses } from "@crm/core/records/campaigns";
import { useMemo, useState } from "react";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { useRecordList, useViews } from "@/lib/api/client/hooks";

export interface CampaignFilterEditorProps {
  value: CampaignFilterValue;
  onChange: (value: CampaignFilterValue) => void;
  campaignOptions?: readonly MultiSelectOption[];
  className?: string;
}

const MEMBER_STATUS_OPTIONS: readonly MultiSelectOption[] = campaignMemberStatuses.map(
  (status) => ({
    id: status,
    label: status,
  }),
);

interface CampaignSelectProps {
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onChange: (nextIds: string[]) => void;
  statusMessage?: string;
  warningMessage?: string | null;
}

function CampaignSelect({
  options,
  value,
  onChange,
  statusMessage,
  warningMessage,
}: CampaignSelectProps) {
  return (
    <div className="flex flex-col gap-1 min-w-0" data-inventory="CX-207">
      <span className="text-xs font-medium text-text-muted">Campaign Name</span>
      <MultiSelect
        label="Campaign Name"
        placeholder="Select Campaigns"
        options={options}
        value={value}
        onChange={onChange}
        statusMessage={statusMessage}
      />
      {warningMessage && (
        <span className="text-xs text-danger" role="alert">
          {warningMessage}
        </span>
      )}
    </div>
  );
}

function DynamicCampaignSelect({
  value,
  onChange,
  warningMessage,
}: {
  value: readonly string[];
  onChange: (nextIds: string[]) => void;
  warningMessage?: string | null;
}) {
  const viewsQuery = useViews("Campaigns");
  const defaultViewId = useMemo(
    () => viewsQuery.data?.find((view) => view.isDefault)?.id ?? "all-campaigns",
    [viewsQuery.data],
  );

  const listQuery: ListQuery = useMemo(
    () => ({
      viewId: defaultViewId,
      page: 1,
      perPage: 100,
      sort: { field: "id", order: "asc" },
    }),
    [defaultViewId],
  );

  const campaignsList = useRecordList("Campaigns", listQuery, {
    enabled: Boolean(defaultViewId),
  });

  const options = useMemo(() => {
    if (!campaignsList.data?.records) return [];
    return campaignsList.data.records.map((record) => ({
      id: record.id,
      label:
        typeof record.fields.Campaign_Name === "string" && record.fields.Campaign_Name
          ? record.fields.Campaign_Name
          : record.id,
    }));
  }, [campaignsList.data]);

  return (
    <CampaignSelect
      options={options}
      value={value}
      onChange={onChange}
      statusMessage={campaignsList.isLoading ? "Loading campaigns..." : undefined}
      warningMessage={warningMessage}
    />
  );
}

export function CampaignFilterEditor({
  value,
  onChange,
  campaignOptions: propCampaignOptions,
  className = "",
}: CampaignFilterEditorProps) {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const handleCampaignsChange = (nextIds: string[]) => {
    if (nextIds.length > 5) {
      setWarningMessage("Maximum 5 campaigns can be selected.");
      onChange({
        ...value,
        campaignIds: nextIds.slice(0, 5),
      });
      return;
    }
    setWarningMessage(null);
    onChange({
      ...value,
      campaignIds: nextIds,
    });
  };

  const handleMemberStatusChange = (nextStatuses: string[]) => {
    onChange({
      ...value,
      memberStatuses: nextStatuses.length > 0 ? nextStatuses : undefined,
    });
  };

  return (
    <div className={`campaign-filter-editor flex flex-col gap-2 min-w-0 w-full ${className}`}>
      {propCampaignOptions ? (
        <CampaignSelect
          options={propCampaignOptions}
          value={value.campaignIds}
          onChange={handleCampaignsChange}
          warningMessage={warningMessage}
        />
      ) : (
        <DynamicCampaignSelect
          value={value.campaignIds}
          onChange={handleCampaignsChange}
          warningMessage={warningMessage}
        />
      )}

      <div className="flex flex-col gap-1 min-w-0" data-inventory="CX-209">
        <span className="text-xs font-medium text-text-muted">Member Status</span>
        <MultiSelect
          label="Member Status"
          placeholder="Select Member Status"
          options={MEMBER_STATUS_OPTIONS}
          value={value.memberStatuses ?? []}
          onChange={handleMemberStatusChange}
        />
      </div>
    </div>
  );
}

export default CampaignFilterEditor;
