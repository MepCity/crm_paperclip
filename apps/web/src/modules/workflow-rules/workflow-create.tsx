"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectItem } from "@/components/ui/select";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUiTranslations } from "@/i18n/client-provider";

const modules = ["Leads", "Contacts", "Accounts", "Deals"];
const triggers = ["Record Action", "Date/Time Field", "Record Score", "Record Notes"];
const dates = [
  "Created Time",
  "Modified Time",
  "Last Activity Time",
  "Unsubscribed Time",
  "Last Enrichment Time",
];

export function WorkflowCreate({ onClose }: { onClose: () => void }) {
  const t = useUiTranslations();
  const titleId = useId();
  const [step, setStep] = useState<"details" | "when" | "criteria">("details");
  const [module, setModule] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState("");
  const [date, setDate] = useState("");
  return (
    <TopAlignedModal
      isOpen
      aria-labelledby={titleId}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      panelStyle={
        step === "details"
          ? { width: "min(600px, 95vw)" }
          : {
              width: "100vw",
              top: "var(--size-topbar-height, 60px)",
              height: "calc(100dvh - var(--size-topbar-height, 60px))",
              overflow: "auto",
            }
      }
    >
      {step === "details" ? (
        <div className="p-8 space-y-5">
          <h2 id={titleId} className="text-xl font-semibold">
            {t("modules.observedFlows.createRule")}
          </h2>
          <Select
            label={t("modules.observedFlows.module")}
            placeholder={t("modules.observedFlows.selectModule")}
            items={modules.map((id) => ({ id }))}
            value={module || null}
            onChange={(key) => setModule(String(key))}
          >
            {(item) => <SelectItem id={item.id}>{item.id}</SelectItem>}
          </Select>
          <TextField
            label={t("modules.observedFlows.ruleName")}
            value={name}
            onChange={setName}
            isRequired
            validationBehavior="aria"
          />
          <TextArea
            label={t("modules.observedFlows.description")}
            value={description}
            onChange={setDescription}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onPress={onClose}>
              {t("modules.observedFlows.cancel")}
            </Button>
            <Button isDisabled={!module || !name.trim()} onPress={() => setStep("when")}>
              {t("modules.observedFlows.next")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="min-h-full bg-bg p-8 pb-28">
          <header className="mb-12 flex gap-3">
            <Button
              variant="icon"
              aria-label={t("modules.observedFlows.back")}
              onPress={() => setStep("details")}
            >
              <Icons.chevronLeft className="size-5" />
            </Button>
            <div>
              <h2 id={titleId} className="text-xl font-semibold">
                {name}
              </h2>
              <p className="mt-2">@ {module}</p>
              <p className="mt-2 text-primary">{description || "Add Description"}</p>
            </div>
          </header>
          <div className="relative ml-12 pl-28 space-y-24">
            <div className="relative flex items-start">
              <span aria-hidden className="absolute -left-28 top-12 h-0.5 w-28 bg-primary" />
              {step === "criteria" && (
                <span
                  aria-hidden
                  className="absolute -left-28 top-12 h-[calc(100%+6rem)] w-0.5 bg-primary"
                />
              )}
              <span className="absolute -left-40 flex size-24 items-center justify-center rounded-full bg-primary text-primary-text">
                {t("modules.observedFlows.when")}
              </span>
              <div
                className={`relative w-full max-w-lg rounded-xl border border-border bg-surface p-6 ${step === "criteria" ? "space-y-3" : "space-y-5"}`}
              >
                {step === "criteria" ? (
                  <>
                    <p>
                      {t("modules.observedFlows.thisRuleExecutesOn")} <strong>{date}</strong>
                    </p>
                    <p>
                      {t("modules.observedFlows.repeat")}{" "}
                      <strong>{t("modules.observedFlows.once")}</strong>
                    </p>
                    <Button
                      variant="ghost"
                      size="compact"
                      aria-label={t("modules.observedFlows.edit")}
                      className="absolute top-4 right-4"
                      onPress={() => setStep("when")}
                    >
                      <Icons.fieldEdit className="size-3" aria-hidden />
                    </Button>
                  </>
                ) : (
                  <>
                    <Select
                      label={t("modules.observedFlows.executeThisWorkflowRuleBasedOn")}
                      placeholder={t("modules.observedFlows.select")}
                      items={triggers.map((id) => ({ id }))}
                      value={trigger || null}
                      onChange={(key) => {
                        setTrigger(String(key));
                        setDate("");
                      }}
                    >
                      {(item) => <SelectItem id={item.id}>{item.id}</SelectItem>}
                    </Select>
                    {trigger === "Date/Time Field" && (
                      <Select
                        label={t("modules.observedFlows.executionDateTimeField")}
                        placeholder={t("modules.observedFlows.select")}
                        items={dates.map((id) => ({ id }))}
                        value={date || null}
                        onChange={(key) => setDate(String(key))}
                      >
                        {(item) => <SelectItem id={item.id}>{item.id}</SelectItem>}
                      </Select>
                    )}
                    {date && (
                      <div className="grid grid-cols-3 gap-4">
                        {["On", "Immediately", "Once"].map((value) => (
                          <Select
                            key={value}
                            label={
                              value === "On"
                                ? "Execution date"
                                : value === "Once"
                                  ? "Repeat"
                                  : "Execution time"
                            }
                            items={[{ id: value }]}
                            value={value}
                            isDisabled
                          >
                            {(item) => <SelectItem id={item.id}>{item.id}</SelectItem>}
                          </Select>
                        ))}
                      </div>
                    )}
                    <Button isDisabled={!date} onPress={() => setStep("criteria")}>
                      {t("modules.observedFlows.next")}
                    </Button>
                  </>
                )}
              </div>
            </div>
            {step === "criteria" && (
              <div className="relative">
                <span aria-hidden className="absolute -left-28 top-20 h-0.5 w-28 bg-primary" />
                <span className="absolute -left-40 top-8 flex size-24 rotate-45 items-center justify-center rounded-lg bg-primary text-primary-text">
                  <span className="-rotate-45 text-sm">
                    {t("modules.observedFlows.conditionBadge")}
                  </span>
                </span>
                <section
                  aria-label={t("modules.observedFlows.condition1")}
                  className="max-w-5xl rounded-xl border-2 border-primary bg-surface p-8 shadow-md space-y-6"
                >
                  <RadioGroup
                    label={`Which ${module} would you like to apply this rule to?`}
                    value="specific"
                    orientation="horizontal"
                    options={[
                      { value: "specific", label: `${module} matching certain conditions` },
                      { value: "all", label: `All ${module}` },
                    ]}
                  />
                  <div className="grid grid-cols-[auto_1fr_1fr_2fr_auto] items-end gap-3">
                    <span className="rounded-full border border-border p-3">1</span>
                    <Select
                      label={t("modules.observedFlows.criterionField")}
                      hideLabel
                      placeholder={t("modules.observedFlows.select")}
                      items={[]}
                      isDisabled
                    >
                      {(item: { id: string }) => <SelectItem id={item.id}>{item.id}</SelectItem>}
                    </Select>
                    <Select
                      label={t("modules.observedFlows.criterionOperator")}
                      hideLabel
                      placeholder={t("modules.observedFlows.select")}
                      items={[]}
                      isDisabled
                    >
                      {(item: { id: string }) => <SelectItem id={item.id}>{item.id}</SelectItem>}
                    </Select>
                    <TextField
                      label={t("modules.observedFlows.criterionValue")}
                      hideLabel
                      isDisabled
                    />
                    <Button
                      variant="ghost"
                      aria-label={t("modules.observedFlows.addCriterion")}
                      isDisabled
                      className="text-accent-green data-disabled:opacity-100!"
                    >
                      <Icons.plus className="size-5 rounded-full border border-current text-accent-green" />
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <Button isDisabled>{t("modules.observedFlows.done")}</Button>
                  </div>
                </section>
              </div>
            )}
          </div>
          <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface p-5 flex gap-3">
            <Button isDisabled>{t("modules.observedFlows.save")}</Button>
            <Button variant="secondary" onPress={onClose}>
              {t("modules.observedFlows.cancel")}
            </Button>
          </footer>
        </div>
      )}
    </TopAlignedModal>
  );
}
