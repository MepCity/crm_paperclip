"use client";

import type { Criteria, ModuleApiName } from "@crm/core/records";
import { useMemo, useState } from "react";
import {
  type FilterDraft,
  FilterEditor,
  type FilterEditorDefinition,
  initialFilterDraft,
} from "@/components/records/list/filter-editor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { MultiSelectOption } from "@/components/ui/multi-select";
import { TextField } from "@/components/ui/text-field";
import type { OrgMember } from "@/lib/api/client/http-record-service";
import { type PanelFilterInput, panelFiltersToCriteria } from "@/lib/records/filter-criteria";
import {
  DOCUMENTED_MODULE_FILTER_ITEMS,
  REGISTERED_SEARCH_MODULES,
  SYSTEM_FILTER_FIELDS,
} from "./constants";

export interface AdvancedSearchFilterPanelProps {
  appliedModules: readonly ModuleApiName[];
  onApply: (params: { modules: ModuleApiName[]; criteria?: Criteria }) => void;
  onClear: () => void;
  users: readonly OrgMember[];
}

export function AdvancedSearchFilterPanel({
  appliedModules,
  onApply,
  onClear,
  users,
}: AdvancedSearchFilterPanelProps) {
  const [draftModules, setDraftModules] = useState<ModuleApiName[]>(() => [...appliedModules]);
  const [prevApplied, setPrevApplied] = useState(appliedModules);
  if (appliedModules !== prevApplied) {
    setPrevApplied(appliedModules);
    setDraftModules([...appliedModules]);
  }

  const [moduleSearch, setModuleSearch] = useState("");
  const [selectedFieldApiNames, setSelectedFieldApiNames] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, FilterDraft>>({});

  const userOptions: MultiSelectOption[] = useMemo(
    () => users.map((u) => ({ id: u.userId, label: u.name })),
    [users],
  );

  const filteredModules = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return DOCUMENTED_MODULE_FILTER_ITEMS;
    return DOCUMENTED_MODULE_FILTER_ITEMS.filter((item) => item.label.toLowerCase().includes(q));
  }, [moduleSearch]);

  const fieldDefinitions = useMemo<Record<string, FilterEditorDefinition>>(() => {
    const res: Record<string, FilterEditorDefinition> = {};
    for (const field of SYSTEM_FILTER_FIELDS) {
      if (field.dataType === "ownerlookup") {
        res[field.apiName] = {
          fieldType: "ownerlookup",
          options: userOptions,
        };
      } else {
        res[field.apiName] = {
          fieldType: "datetime",
        };
      }
    }
    return res;
  }, [userOptions]);

  function handleToggleModule(moduleName: ModuleApiName, checked: boolean) {
    if (checked) {
      setDraftModules((prev) => [...prev, moduleName]);
    } else {
      setDraftModules((prev) => prev.filter((m) => m !== moduleName));
    }
  }

  function handleToggleField(apiName: string, checked: boolean) {
    if (checked) {
      const editor = fieldDefinitions[apiName];
      if (editor) {
        setDrafts((prev) => ({
          ...prev,
          [apiName]: initialFilterDraft(editor),
        }));
      }
      setSelectedFieldApiNames((prev) => [...prev, apiName]);
    } else {
      setSelectedFieldApiNames((prev) => prev.filter((name) => name !== apiName));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[apiName];
        return next;
      });
    }
  }

  function handleApply() {
    const inputs: PanelFilterInput[] = [];
    for (const apiName of selectedFieldApiNames) {
      const draft = drafts[apiName];
      if (!draft) continue;
      inputs.push({
        field: apiName,
        operatorId: draft.operatorId,
        value: draft.value,
        daysUnit: draft.daysUnit,
      });
    }

    const criteria = panelFiltersToCriteria(inputs);
    onApply({
      modules: [...draftModules],
      criteria,
    });
  }

  function handleClear() {
    setSelectedFieldApiNames([]);
    setDrafts({});
    setDraftModules([...REGISTERED_SEARCH_MODULES]);
    onClear();
  }

  return (
    <aside
      aria-label="Search filter panel"
      className="w-72 shrink-0 rounded-md border border-panel-border bg-surface p-4 flex flex-col gap-4 text-text"
    >
      {/* Modules Section */}
      <div>
        <h3 className="mb-2 text-sm font-bold text-text">Modules</h3>
        <TextField
          label="Search modules"
          hideLabel
          placeholder="Search"
          value={moduleSearch}
          onChange={setModuleSearch}
          className="mb-3 w-full"
        />

        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {filteredModules.map((item) => {
            if (item.isRegistered) {
              const isChecked = draftModules.includes(item.moduleApiName);
              return (
                <Checkbox
                  key={item.id}
                  label={item.label}
                  isSelected={isChecked}
                  onChange={(checked) => handleToggleModule(item.moduleApiName, checked)}
                />
              );
            }
            return <Checkbox key={item.id} label={item.label} laterModule={item.laterModule} />;
          })}
        </div>
      </div>

      {/* Filter By Fields Section */}
      <div className="border-t border-border pt-3">
        <h3 className="mb-2 text-sm font-bold text-text">Filter By Fields</h3>
        <div className="flex flex-col gap-3">
          {SYSTEM_FILTER_FIELDS.map((field) => {
            const isChecked = selectedFieldApiNames.includes(field.apiName);
            const editor = fieldDefinitions[field.apiName];
            const draft = drafts[field.apiName];

            return (
              <div key={field.id} className="flex flex-col gap-1.5">
                <Checkbox
                  label={field.label}
                  isSelected={isChecked}
                  onChange={(checked) => handleToggleField(field.apiName, checked)}
                />

                {isChecked && editor && draft && (
                  <div className="pl-6 pt-1">
                    <FilterEditor
                      label={field.label}
                      editor={editor}
                      draft={draft}
                      onChange={(nextDraft) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [field.apiName]: nextDraft,
                        }))
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border mt-auto">
        <Button variant="primary" size="sm" onPress={handleApply}>
          Apply Filter
        </Button>
        <Button variant="secondary" size="sm" onPress={handleClear}>
          Clear
        </Button>
      </div>
    </aside>
  );
}
