"use client";

import { ValidationError } from "@crm/core/errors";
import type { ConvertLeadInput, ConvertTarget, ModuleApiName } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Icons } from "@/components/ui/icon";
import { NumberField } from "@/components/ui/number-field";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toast";
import { useUiTranslations } from "@/i18n/client-provider";
import {
  useConvertLead,
  useModule,
  useRecord,
  useRecordList,
  useUsers,
  useViews,
} from "@/lib/api/client/hooks";
import { moduleRecordPath } from "@/lib/crm-paths";

type Mode = "new" | "existing";
type DealErrors = Partial<Record<"Deal_Name" | "Closing_Date" | "Stage", string>>;

function ExistingRecordSelect({
  module,
  label,
  selectedId,
  onChange,
  errorMessage,
}: {
  module: ModuleApiName;
  label: string;
  selectedId: string | null;
  onChange: (id: string | null) => void;
  errorMessage?: string;
}) {
  const t = useUiTranslations();
  const views = useViews(module);
  const viewId = views.data?.find((view) => view.isDefault)?.id ?? "";
  const list = useRecordList(
    module,
    { viewId, page: 1, perPage: 50, fields: ["id"] },
    { enabled: Boolean(viewId) },
  );
  const items = (list.data?.records ?? []).map((record) => ({
    id: record.id,
    name: String(record.fields.Account_Name ?? record.fields.Full_Name ?? record.id),
  }));
  return (
    <Select
      label={label}
      items={items}
      selectedKey={selectedId}
      onSelectionChange={(key) => onChange(key === null ? null : String(key))}
      errorMessage={errorMessage}
      isInvalid={Boolean(errorMessage)}
      placeholder={t("records.convert.selectRecord")}
    >
      {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
    </Select>
  );
}

function TargetChoice({
  module,
  mode,
  onMode,
  name,
  existingId,
  onExisting,
  existingError,
}: {
  module: "Accounts" | "Contacts";
  mode: Mode;
  onMode: (mode: Mode) => void;
  name: string;
  existingId: string | null;
  onExisting: (id: string | null) => void;
  existingError?: string;
}) {
  const t = useUiTranslations();
  const [expanded, setExpanded] = useState(false);
  const label =
    module === "Accounts"
      ? t("records.convert.createNewAccount")
      : t("records.convert.createNewContact");
  return (
    <div className="flex flex-col gap-2" data-convert-target={module}>
      {expanded ? (
        <RadioGroup
          label={
            module === "Accounts" ? t("records.convert.account") : t("records.convert.contact")
          }
          orientation="horizontal"
          value={mode}
          onChange={(value) => onMode(value as Mode)}
          options={[
            { value: "new", label },
            { value: "existing", label: t("records.convert.chooseExisting") },
          ]}
        />
      ) : null}
      {mode === "new" ? (
        <div className="flex items-center gap-2 text-md">
          <span>{label}</span>
          <Button
            variant="ghost"
            size="compact"
            onPress={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={`${label}: ${name}`}
            className="rounded-[3px] bg-(--color-control-border) px-2 font-normal"
            data-convert-chip
          >
            {name}
          </Button>
        </div>
      ) : (
        <ExistingRecordSelect
          module={module}
          label={
            module === "Accounts"
              ? t("records.convert.existingAccount")
              : t("records.convert.existingContact")
          }
          selectedId={existingId}
          onChange={onExisting}
          errorMessage={existingError}
        />
      )}
    </div>
  );
}

export function LeadConvertScreen({ orgSlug, recordId }: { orgSlug: string; recordId: string }) {
  const t = useUiTranslations();
  const router = useRouter();
  const lead = useRecord("Leads", recordId);
  const dealModule = useModule("Deals");
  const users = useUsers();
  const convert = useConvertLead();
  const [accountMode, setAccountMode] = useState<Mode>("new");
  const [contactMode, setContactMode] = useState<Mode>("new");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);
  const [withDeal, setWithDeal] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [dealName, setDealName] = useState<string | null>(null);
  const [closingDate, setClosingDate] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [dealErrors, setDealErrors] = useState<DealErrors>({});
  const [existingErrors, setExistingErrors] = useState<{ account?: string; contact?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const leadPath = moduleRecordPath(orgSlug, "Leads", recordId);
  const fields = lead.data?.fields;
  const company = String(fields?.Company ?? "");
  const fullName = String(fields?.Full_Name ?? "");
  const ownerId = typeof fields?.Owner === "string" ? fields.Owner : null;
  const ownerName = users.data?.find((user) => user.userId === ownerId)?.name ?? ownerId ?? "";
  const stageOptions = useMemo(
    () => dealModule.data?.fields.find((field) => field.apiName === "Stage")?.picklist ?? [],
    [dealModule.data],
  );
  const effectiveStage = stage ?? stageOptions[0]?.storedValue ?? "";
  const effectiveDealName = dealName ?? company;

  if (lead.isError)
    return (
      <div className="p-8 text-md text-danger" role="alert">
        Could not load the lead.
      </div>
    );
  if (!fields) return <div className="p-8 text-md text-text-muted">Loading…</div>;

  const cancel = () => router.push(leadPath);
  const converted = fields.Converted__s === true;

  const submit = async () => {
    setFormError(null);
    const nextDealErrors: DealErrors = {};
    if (withDeal) {
      if (!effectiveDealName.trim()) nextDealErrors.Deal_Name = "Deal Name is required.";
      if (!closingDate) nextDealErrors.Closing_Date = "Closing Date is required.";
      if (!effectiveStage) nextDealErrors.Stage = "Stage is required.";
    }
    const nextExisting = {
      ...(accountMode === "existing" && !accountId
        ? { account: "Choose an account to convert into." }
        : {}),
      ...(contactMode === "existing" && !contactId
        ? { contact: "Choose a contact to convert into." }
        : {}),
    };
    setDealErrors(nextDealErrors);
    setExistingErrors(nextExisting);
    if (Object.keys(nextDealErrors).length || Object.keys(nextExisting).length) return;

    const target = (mode: Mode, id: string | null): ConvertTarget =>
      mode === "existing" && id ? { reuseId: id } : { create: {} };
    const input: ConvertLeadInput = {
      account: target(accountMode, accountId),
      contact: target(contactMode, contactId),
      ...(withDeal
        ? {
            deal: {
              create: {
                Deal_Name: effectiveDealName.trim(),
                Closing_Date: closingDate,
                Stage: effectiveStage,
                ...(amount === null ? {} : { Amount: amount }),
              },
            },
          }
        : {}),
    };
    try {
      const result = await convert.mutateAsync({ leadId: recordId, input });
      toast({ variant: "success", title: "Lead converted", message: `${fullName} was converted.` });
      router.push(
        result.contactId ? moduleRecordPath(orgSlug, "Contacts", result.contactId) : leadPath,
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        const dealFieldErrors: DealErrors = {};
        for (const key of ["Deal_Name", "Closing_Date", "Stage"] as const)
          if (error.fieldErrors[key]?.[0]) dealFieldErrors[key] = error.fieldErrors[key][0];
        setDealErrors(dealFieldErrors);
      }
      const message = error instanceof Error ? error.message : "Conversion failed.";
      setFormError(message);
      toast({ variant: "danger", title: "Conversion failed", message });
    }
  };

  return (
    <div data-lead-convert className="flex min-h-full bg-surface text-text">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-panel-border px-8">
          <h1 className="text-xl font-bold">{t("records.convert.title")}</h1>
          <span className="text-md font-semibold text-text-muted">
            ({fullName}
            {company ? ` - ${company}` : ""})
          </span>
        </header>
        <form
          className="flex max-w-[845px] flex-col gap-3 px-8 py-8"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {converted ? (
            <p role="alert" className="text-md text-danger">
              This lead is already converted.
            </p>
          ) : null}
          {formError ? (
            <p role="alert" data-convert-error className="text-md text-danger">
              {formError}
            </p>
          ) : null}
          <TargetChoice
            module="Accounts"
            mode={accountMode}
            onMode={setAccountMode}
            name={company}
            existingId={accountId}
            onExisting={setAccountId}
            existingError={existingErrors.account}
          />
          <TargetChoice
            module="Contacts"
            mode={contactMode}
            onMode={setContactMode}
            name={fullName}
            existingId={contactId}
            onExisting={setContactId}
            existingError={existingErrors.contact}
          />
          <Checkbox
            className="mt-7 mb-4"
            label={t("records.convert.createDeal")}
            isSelected={withDeal}
            onChange={setWithDeal}
          />
          {withDeal ? (
            <div data-convert-deal className="flex w-[600px] flex-col gap-4">
              <NumberField
                label={t("records.convert.amount")}
                prefix="TL"
                value={amount ?? Number.NaN}
                onChange={(value) => setAmount(Number.isNaN(value) ? null : value)}
              />
              <TextField
                label={t("records.convert.dealName")}
                isRequired
                value={effectiveDealName}
                onChange={setDealName}
                errorMessage={dealErrors.Deal_Name}
                isInvalid={Boolean(dealErrors.Deal_Name)}
              />
              <DatePicker
                label={t("records.convert.closingDate")}
                isRequired
                value={closingDate}
                onChange={setClosingDate}
                errorMessage={dealErrors.Closing_Date}
                isInvalid={Boolean(dealErrors.Closing_Date)}
              />
              <Select
                label={t("records.convert.stage")}
                isRequired
                items={stageOptions.map((option) => ({ ...option, id: option.storedValue }))}
                selectedKey={effectiveStage}
                onSelectionChange={(key) => setStage(key === null ? null : String(key))}
                errorMessage={dealErrors.Stage}
                isInvalid={Boolean(dealErrors.Stage)}
              >
                {(item) => <SelectItem id={item.id}>{item.displayValue}</SelectItem>}
              </Select>
            </div>
          ) : null}
          <div className="mb-10 flex w-[220px] items-end gap-2">
            <TextField
              label={t("records.convert.ownerOfNewRecords")}
              value={ownerName}
              isReadOnly
            />
            <Button variant="icon" aria-label={t("records.list.openOwnerPicker")} isDisabled>
              <Icons.users aria-hidden className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="recordPrimary"
              size="record"
              isDisabled={converted || convert.isPending}
            >
              {t("records.convert.convertButton")}
            </Button>
            <Button variant="recordSecondary" size="record" onPress={cancel}>
              {t("records.convert.cancelButton")}
            </Button>
          </div>
        </form>
      </div>
      <aside className="mt-[52px] w-[300px] shrink-0 border-l border-panel-border px-4 py-2">
        <h2 className="text-md font-semibold">{t("records.convert.quickLinks")}</h2>
        <p className="mt-3 text-md text-primary">{t("records.convert.conversionMapping")}</p>
        <Button variant="ghost" laterModule="P3" className="mt-2">
          <Icons.help aria-hidden className="size-4" />
          {t("shell.help")}
        </Button>
      </aside>
    </div>
  );
}
