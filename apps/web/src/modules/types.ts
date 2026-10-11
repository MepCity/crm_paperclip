import type { FormatOptions } from "@crm/core/format";
import type {
  FieldDefinition,
  FieldValue,
  ModuleApiName,
  ModuleMetadata,
  RecordData,
} from "@crm/core/records";
import type { ComponentType } from "react";
import type { BusinessCardField } from "@/components/records/detail/business-card";
import type { DetailSection } from "@/components/records/detail/details-card";
import type { RecordMenuGroup } from "@/components/records/detail/record-header";
import type {
  TimelineEvent,
  TimelineFilterOption,
  TimelineSubtab,
} from "@/components/records/detail/timeline";
import type { FormRules } from "@/components/records/form/form-model";
import type { FilterGroup } from "@/components/records/list/filter-panel";
import type { ModuleListScreenConfig } from "@/components/records/list/module-list-screen";
import type { Icon } from "@/components/ui/icon";
import type { ModuleKey } from "@/components/ui/later-module";

export interface StatusRibbonSectionProps {
  module: ModuleApiName;
  recordId: string;
  field: FieldDefinition;
  value: string | null;
  onValueChange: (value: string | null | undefined) => void;
}

/** Only presentation rules absent from service metadata belong here. */
export interface ModuleScreenDefinition {
  apiName: ModuleApiName;
  tab: string;
  singularLabel: string;
  pluralLabel: string;
  pageTitle: string;
  navigation: { id: string; icon: Icon };
  list: ModuleListScreenConfig;
  listCurrencyCode: string;
  buildFilterGroups: (input: {
    fields: readonly FieldDefinition[];
    users: readonly { userId: string; name: string; email?: string }[];
    linkField: string;
    currencyCode: string;
  }) => readonly FilterGroup[];
  form: {
    rules: FormRules;
    /** Screen fallback only when layout columns are missing; never overrides metadata. */
    fallbackColumns?: Readonly<Record<string, readonly (readonly string[])[]>>;
    addressGroups?: readonly {
      field: string;
      country: string;
      state: string;
      latitude: string;
      longitude: string;
      coordinates: string;
    }[];
  };
  detail: {
    header: (record: RecordData) => {
      title: string;
      subtitle?: string;
      subtitleLaterModule?: ModuleKey;
    };
    businessCard: (module: ModuleMetadata, record: RecordData) => BusinessCardField[];
    sections: (module: ModuleMetadata, record: RecordData) => DetailSection[];
    inlineEditable: (field: FieldDefinition) => boolean;
    lastUpdate: (record: RecordData, now: Date, format: FormatOptions) => string | null;
    moreOptions: (handlers: { onClone: () => void; onDelete: () => void }) => RecordMenuGroup[];
    deleteTitle: string;
    deleteMessage: string;
    loadingAttributes?: Readonly<Record<string, boolean>>;
    statusRibbon?: {
      field: string;
      readValue: (value: FieldValue | undefined) => string | null;
      component: ComponentType<StatusRibbonSectionProps>;
    };
    timeline: {
      subtabs: readonly TimelineSubtab[];
      modules: readonly TimelineFilterOption[];
      sources: readonly TimelineFilterOption[];
      events: readonly TimelineEvent[];
      normalizeEventKind: (kind: string) => string;
    };
  };
}
