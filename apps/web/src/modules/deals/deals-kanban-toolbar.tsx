"use client";

import type { FieldDefinition, KanbanView, KanbanViewInput } from "@crm/core/records";
import { useMemo, useState } from "react";
import { KanbanManageDialog } from "@/components/records/board/kanban-manage-dialog";
import { KanbanSettingsDialog } from "@/components/records/board/kanban-settings-dialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { toast } from "@/components/ui/toast";
import { useUiTranslations } from "@/i18n/client-provider";
import { useModule, useSaveKanbanView } from "@/lib/api/client/hooks";
import { setSelectedDealsKanbanViewId, useSelectedDealsKanbanView } from "./deals-kanban-selection";

const CREATE_VALUE = "__create_kanban_view__";
const MANAGE_VALUE = "__manage_kanban_views__";
const NUMERIC_TYPES = new Set(["currency", "integer", "double", "bigint"]);
const HIDDEN_CARD_TYPES = new Set(["textarea", "multiselectpicklist"]);

const toOption = (field: FieldDefinition) => ({ value: field.apiName, label: field.label });

const BLANK_VIEW: KanbanViewInput = {
  name: "",
  categorizeBy: "",
  aggregateBy: null,
  headerStyle: "mono_color",
  fields: ["Deal_Name"],
  sharedTo: "only_me",
};

export function DealsKanbanToolbar() {
  const t = useUiTranslations();
  const { views, view } = useSelectedDealsKanbanView();
  const module = useModule("Deals");
  const save = useSaveKanbanView("Deals");
  const [dialog, setDialog] = useState<"edit" | "create" | "manage" | null>(null);

  const options = useMemo(() => {
    const fields = module.data?.fields ?? [];
    return {
      // Only Stage groups the board for now; other picklists are a recorded gap.
      categorize: fields.filter((f) => f.apiName === "Stage").map(toOption),
      aggregate: fields.filter((f) => NUMERIC_TYPES.has(f.dataType)).map(toOption),
      cardFields: fields
        .filter((f) => !HIDDEN_CARD_TYPES.has(f.dataType))
        .map((f) => ({
          apiName: f.apiName,
          label: f.label,
          ...(f.apiName === "Deal_Name" ? { required: true } : {}),
        })),
    };
  }, [module.data]);

  async function handleSave(input: KanbanViewInput) {
    const saved = await save.mutateAsync(
      dialog === "edit" && view ? { id: view.id, input } : { input },
    );
    if (dialog === "create") setSelectedDealsKanbanViewId(saved.id);
    toast({ variant: "success", title: t("records.kanban.saved") });
    setDialog(null);
  }

  const initial: KanbanViewInput =
    dialog === "edit" && view
      ? { ...view, fields: [...view.fields] }
      : { ...BLANK_VIEW, fields: [...BLANK_VIEW.fields] };

  return (
    <>
      <span className="relative inline-flex h-[27px] w-[109px] items-center">
        <select
          aria-label={t("records.kanban.grouping")}
          className="h-full w-full appearance-none rounded border border-control-border bg-surface pl-2 pr-6 text-sm text-(--color-text-muted) outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          value={view?.id ?? ""}
          onChange={(event) => {
            if (event.target.value === CREATE_VALUE) {
              setDialog("create");
              return;
            }
            if (event.target.value === MANAGE_VALUE) {
              setDialog("manage");
              return;
            }
            setSelectedDealsKanbanViewId(event.target.value);
          }}
        >
          {views.map((v: KanbanView) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
          <option value={CREATE_VALUE}>{t("records.kanban.create")}</option>
          <option value={MANAGE_VALUE}>{t("records.kanban.manage")}</option>
        </select>
        <Icons.recordFormCaret
          aria-hidden
          className="pointer-events-none absolute right-3 h-[5px] w-2 text-(--color-text-muted)"
        />
      </span>
      <Button
        variant="ghost"
        aria-label={t("records.kanban.settings")}
        isDisabled={!view}
        onPress={() => setDialog("edit")}
      >
        <Icons.boardEdit aria-hidden className="h-4 w-4" />
      </Button>
      <KanbanManageDialog
        open={dialog === "manage"}
        views={views}
        fieldLabel={(apiName) =>
          module.data?.fields.find((f) => f.apiName === apiName)?.label ?? apiName
        }
        onCreate={() => setDialog("create")}
        onClose={() => setDialog(null)}
      />
      {dialog === "edit" || dialog === "create" ? (
        <KanbanSettingsDialog
          open
          mode={dialog}
          initial={initial}
          categorizeOptions={options.categorize}
          aggregateOptions={options.aggregate}
          headerStyleOptions={[{ value: "mono_color", label: t("records.kanban.singleColor") }]}
          fieldOptions={options.cardFields}
          onSave={handleSave}
          onCancel={() => setDialog(null)}
        />
      ) : null}
    </>
  );
}

export const dealsBoardToolbar = <DealsKanbanToolbar />;
