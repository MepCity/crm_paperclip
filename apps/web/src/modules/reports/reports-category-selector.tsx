"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { TextField } from "@/components/ui/text-field";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { useUiTranslations } from "@/i18n/client-provider";

export interface CategoryOption {
  id: string;
  name: string;
}

export const REPORT_CATEGORIES: readonly CategoryOption[] = [
  { id: "all", name: "All Reports" },
  { id: "mine", name: "My Reports" },
  { id: "favorites", name: "Favorites" },
  { id: "recent", name: "Recently Viewed" },
  { id: "shared", name: "Shared Reports" },
  { id: "scheduled", name: "Scheduled Reports" },
  { id: "deleted", name: "Recently Deleted" },
] as const;

export const SYNTHETIC_REPORT_FOLDER: CategoryOption = {
  id: "account-and-contact",
  name: "Account and Contact Reports",
};

export function ReportsCategorySelector() {
  const t = useUiTranslations();
  const [isOpen, setIsOpen] = useState(false);
  // search semantics unobserved (R3 U3): R09 accepts text but does not filter
  const [searchQuery, setSearchQuery] = useState("");

  const categoryName = (id: string, fallback: string) => {
    switch (id) {
      case "all":
        return t("modules.reports.allReports");
      case "mine":
        return t("modules.reports.myReports");
      case "favorites":
        return t("modules.reports.favorites");
      case "recent":
        return t("modules.reports.recentlyViewed");
      case "shared":
        return t("modules.reports.sharedReports");
      case "scheduled":
        return t("modules.reports.scheduledReports");
      case "deleted":
        return t("modules.reports.recentlyDeleted");
      case "account-and-contact":
        return t("modules.reports.accountAndContact");
      default:
        return fallback;
    }
  };

  const handleSelect = (_categoryId: string) => {
    // selection semantics unobserved (R3 U2): clicking R11–R17 closes panel and keeps All Reports
    setIsOpen(false);
  };

  return (
    <PopoverTrigger
      isOpen={isOpen}
      onOpenChange={(next) => {
        if (next) setSearchQuery("");
        setIsOpen(next);
      }}
    >
      <Button
        variant="recordSelector"
        aria-label={t("modules.reports.allReports")}
        className="gap-4"
      >
        {t("modules.reports.allReports")} <Icons.chevronDown className="size-4" aria-hidden />
      </Button>
      <Popover
        title={t("modules.reports.reports")}
        hideTitle
        placement="bottom start"
        offset={4}
        className="w-80 overflow-hidden rounded-md border border-border bg-surface shadow-lg"
        contentClassName="!p-0 flex flex-col"
      >
        {/* R09: Search Folder textbox */}
        <div className="border-b border-border p-2.5">
          <TextField
            label={t("modules.reports.searchFolder")}
            placeholder={t("modules.reports.searchFolder")}
            hideLabel
            variant="filter-search"
            size="fill"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        {/* Categories listbox */}
        <div
          role="listbox"
          aria-label={t("modules.reports.reportFolders")}
          className="max-h-60 overflow-y-auto py-1"
        >
          {REPORT_CATEGORIES.map((category) => {
            const isSelected = category.id === "all";
            const name = categoryName(category.id, category.name);
            return (
              <button
                key={category.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-selected={isSelected ? "true" : undefined}
                onClick={() => handleSelect(category.id)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm cursor-pointer outline-none transition-colors ${
                  isSelected
                    ? "bg-surface-selected font-semibold text-text hover:bg-surface-selected/80"
                    : "font-normal text-text hover:bg-surface-hover focus-visible:bg-surface-hover"
                }`}
              >
                {isSelected ? (
                  <Icons.check className="size-4 shrink-0 text-primary" aria-hidden />
                ) : (
                  <span className="size-4 shrink-0" aria-hidden />
                )}
                <span className="truncate">{name}</span>
              </button>
            );
          })}

          {/* Divider between standard categories and folders */}
          <hr className="my-1 border-border" />

          {/* R17: One synthetic report-folder option */}
          <button
            type="button"
            role="option"
            aria-selected={false}
            onClick={() => handleSelect(SYNTHETIC_REPORT_FOLDER.id)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-normal text-text cursor-pointer outline-none transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover"
          >
            <span className="size-4 shrink-0" aria-hidden />
            <span className="truncate">
              {categoryName(SYNTHETIC_REPORT_FOLDER.id, SYNTHETIC_REPORT_FOLDER.name)}
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-surface p-2 flex flex-col gap-1">
          {/* R18: Manage Folders button with gear icon, disabled with tooltip */}
          <TooltipTrigger delay={0} closeDelay={0}>
            <Button
              variant="ghost"
              aria-disabled="true"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="flex w-full items-center justify-start gap-2.5 px-3 py-2 text-left text-sm text-text-muted cursor-not-allowed"
              aria-label={t("modules.reports.manageFolders")}
            >
              <Icons.settings className="size-4 shrink-0" aria-hidden />
              <span>{t("modules.reports.manageFolders")}</span>
            </Button>
            <Tooltip>{t("modules.reports.notAvailableYet")}</Tooltip>
          </TooltipTrigger>

          {/* R19: Integration entry (two-line label + icon, neutral text "Advanced analytics"), disabled with tooltip */}
          <TooltipTrigger delay={0} closeDelay={0}>
            <Button
              variant="ghost"
              aria-disabled="true"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="flex w-full items-center justify-start gap-2.5 px-3 py-2 text-left text-sm text-text-muted cursor-not-allowed"
              aria-label={t("modules.reports.advancedAnalytics")}
            >
              <Icons.barChart className="size-4 shrink-0 text-text-muted" aria-hidden />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-xs font-semibold text-text">
                  {t("modules.reports.advancedAnalytics")}
                </span>
                <span className="text-[11px] text-text-muted">
                  {t("modules.reports.advancedAnalyticsSub")}
                </span>
              </div>
            </Button>
            <Tooltip>{t("modules.reports.notAvailableYet")}</Tooltip>
          </TooltipTrigger>
        </div>
      </Popover>
    </PopoverTrigger>
  );
}
