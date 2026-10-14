import type { FormatOptions } from "@crm/core/format";
import type {
  CurrencyDefinition,
  FieldDefinition,
  FieldValue,
  ModuleApiName,
  ModuleMetadata,
  RecordData,
  RecordId,
} from "@crm/core/records";
import type { ComponentType, ReactNode } from "react";
import type { BusinessCardField } from "@/components/records/detail/business-card";
import type { DetailSection } from "@/components/records/detail/details-card";
import type { RecordCommand, RecordMenuGroup } from "@/components/records/detail/record-header";
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

export type RelatedListControlType = "button" | "split-button" | "select" | "icon-button";

export interface ModuleMergeDefinition {
  criterionFields: readonly string[];
  matchingColumns: readonly string[];
}

export interface RelatedListControlDefinition {
  id: string;
  label: string;
  type: RelatedListControlType;
  moduleKey?: ModuleKey | "M2";
  moreModuleKey?: ModuleKey | "M2";
  icon?: Icon | ((props: import("react").SVGProps<SVGSVGElement>) => import("react").ReactNode);
  position?: "right" | "after-title";
  options?: readonly { id: string; label: string; onAction?: () => void }[];
  onAction?: () => void;
}

export interface RelatedListActivityColumnDefinition {
  id: string;
  title: string;
  count: number;
  emptyText: string;
  icon?: Icon | ((props: import("react").SVGProps<SVGSVGElement>) => import("react").ReactNode);
}

export interface RelatedListTableColumnDefinition {
  id: string;
  label: string;
  cellKind?: "recordLink" | "emailLink" | "phoneAction";
}

export interface RelatedListTableRowDefinition {
  id: string;
  cells: Readonly<Record<string, string>>;
  recordLink?: { href: string };
  emailLink?: { href: string };
  phoneAction?: { moduleKey?: ModuleKey };
}

export interface RelatedListRailLinksGroupDefinition {
  title: string;
  addLink: {
    id: string;
    label: string;
    moduleKey: ModuleKey;
  };
}

export interface RelatedListRailChromeDefinition {
  organizeAriaLabel: string;
  /** Omitted on Deals detail (Add Link is not painted in the reference viewport). */
  linksGroup?: RelatedListRailLinksGroupDefinition;
}

export interface RelatedListBodyContext {
  record?: RecordData;
  module?: ModuleApiName;
  orgSlug: string;
  recordPath: (module: ModuleApiName, recordId: RecordId) => string;
}

export interface RelatedListDefinition {
  /** Return null or undefined to use the generic body; render hook-based bodies as elements. */
  renderBody?: (
    context: RelatedListBodyContext & { definition: RelatedListDefinition },
  ) => ReactNode;
  showEmptyTable?: boolean;
  id: string;
  title: string;
  moduleKey: ModuleKey | "M2";
  order: number;
  targetId: string;
  countBadge?: number | string;
  railAction?: {
    id: string;
    label: string;
    moduleKey?: ModuleKey | "M2";
    onAction?: () => void;
  };
  upperControls?: readonly RelatedListControlDefinition[];
  emptyStateText?: string;
  loadingText?: string;
  activityColumns?: readonly RelatedListActivityColumnDefinition[];
  subtabs?: readonly { id: string; label: string }[];
  subtabRowEndControl?: RelatedListControlDefinition;
  tableColumns?: readonly RelatedListTableColumnDefinition[];
  tablePreviewRows?: readonly RelatedListTableRowDefinition[];
  /**
   * Lookup field on the related module that points back to the record owning this card.
   * Module-owned body builders use it to filter the record service.
   */
  recordFilterField?: string;
  notesShowMore?: boolean;
  socialLinks?: readonly { id: string; label: string; moduleKey?: ModuleKey | "M2" }[];
  socialGuidance?: string;
  introductoryText?: string;
  bodyAction?: {
    id: string;
    label: string;
    moduleKey?: ModuleKey | "M2";
    onAction?: () => void;
  };
}

export interface StatusRibbonSectionProps {
  module: ModuleApiName;
  recordId: string;
  field: FieldDefinition;
  value: string | null;
  onValueChange: (value: string | null | undefined) => void;
}

export type ModuleRecordDetailPaths = {
  defaultList: (orgSlug: string, module: ModuleApiName) => string;
  record: (orgSlug: string, module: ModuleApiName, recordId: RecordId) => string;
  edit: (orgSlug: string, module: ModuleApiName, recordId: RecordId) => string;
  clone: (orgSlug: string, module: ModuleApiName, recordId: RecordId) => string;
  merge: (orgSlug: string, module: ModuleApiName, recordId: RecordId) => string;
};

export type ModuleRecordDetailScreenProps = {
  orgSlug: string;
  recordId: RecordId;
  paths: ModuleRecordDetailPaths;
  definition: ModuleScreenDefinition;
};

/** Only presentation rules absent from service metadata belong here. */
export interface ModuleScreenDefinition {
  apiName: ModuleApiName;
  tab: string;
  singularLabel: string;
  pluralLabel: string;
  pageTitle: string;
  navigation: { id: string; icon: Icon; group?: "sales" | "activities" };
  search?: { secondaryFields: readonly string[] };
  list: ModuleListScreenConfig;
  listCurrencyCode: string;
  searchColumns?: readonly string[];
  merge?: ModuleMergeDefinition;
  buildFilterGroups: (input: {
    fields: readonly FieldDefinition[];
    users: readonly { userId: string; name: string; email?: string }[];
    linkField: string;
    currencyCode: string;
  }) => readonly FilterGroup[];
  form: {
    rules: FormRules;
    /** Screen column order when service layout columns do not match the reference form. */
    fallbackColumns?: Readonly<Record<string, readonly (readonly string[])[]>>;
    inventoryChrome?: boolean;
    profileImageLaterModule?: ModuleKey;
    profileImageIcon?: ComponentType<import("react").SVGProps<SVGSVGElement>>;
    /**
     * Pickers that target this module draw the reference-observed record-picker chrome
     * (`accounts-form.md` › Parent Account lookup). Omitted keeps the shared interim picker.
     */
    recordPickerChrome?: "observed";
  };
  detail: {
    Screen?: ComponentType<ModuleRecordDetailScreenProps>;
    headerCurrency?: boolean;
    header: (
      record: RecordData,
      context?: {
        orgSlug?: string;
        currency?: CurrencyDefinition;
        currencySymbol?: string;
      },
    ) => {
      title: string;
      subtitle?: string;
      subtitleLaterModule?: ModuleKey;
      subtitleHref?: string;
      portraitIcon?: ComponentType<import("react").SVGProps<SVGSVGElement>>;
      hasPortrait?: boolean;
      recordNavigation?: boolean;
    };
    hasPortrait?: boolean;
    recordNavigation?: boolean;
    portraitIcon?: ComponentType<import("react").SVGProps<SVGSVGElement>>;
    addTags?: { label: string; laterModule: ModuleKey };
    headerCommands?: readonly RecordCommand[];
    businessCard: (module: ModuleMetadata, record: RecordData) => BusinessCardField[];
    sections: (module: ModuleMetadata, record: RecordData) => DetailSection[];
    inlineEditable: (field: FieldDefinition) => boolean;
    lastUpdate: (record: RecordData, now: Date, format: FormatOptions) => string | null;
    /**
     * AD-35 / D-35: `tab-row` draws the update label at the far right of the Overview/Timeline row
     * with its clock glyph. Omitted keeps it at the top of the overview (Module 1).
     */
    lastUpdatePlacement?: "tab-row";
    moreOptions: (handlers: {
      onClone: () => void;
      onDelete: () => void;
      onFindMergeDuplicates?: () => void;
    }) => RecordMenuGroup[];
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
      upcomingAutomatedActions?: { label: string; laterModule: ModuleKey };
    };
    relatedLists?: readonly RelatedListDefinition[];
    linkedContactSummary?: boolean;
    relatedListRail?: RelatedListRailChromeDefinition;
  };
}
