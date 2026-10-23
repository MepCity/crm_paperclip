"use client";

import { ValidationError } from "@crm/core/errors";
import type { ConvertLeadInput, ConvertTarget, ModuleApiName } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { NumberField } from "@/components/ui/number-field";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toast";
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

const NEW_LABEL = { Accounts: "Create New Account", Contacts: "Create New Contact" } as const;

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
      placeholder="Select a record"
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
  const label = NEW_LABEL[module];
  return (
    <div className="flex flex-col gap-2" data-convert-target={module}>
      <RadioGroup
        label={module === "Accounts" ? "Account" : "Contact"}
        orientation="horizontal"
        value={mode}
        onChange={(value) => onMode(value as Mode)}
        options={[
          { value: "new", label },
          { value: "existing", label: "Choose existing" },
        ]}
      />
      {mode === "new" ? (
        <span
          data-convert-chip
          className="inline-flex h-[22px] w-fit items-center rounded-[3px] bg-(--color-control-border) px-2 text-md text-text"
        >
          {name}
        </span>
      ) : (
        <ExistingRecordSelect
          module={module}
          label={`Existing ${module === "Accounts" ? "Account" : "Contact"}`}
          selectedId={existingId}
          onChange={onExisting}
          errorMessage={existingError}
        />
      )}
    </div>
  );
}

export function LeadConvertScreen({ orgSlug, recordId }: { orgSlug: string; recordId: string }) {
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
          <h1 className="text-xl font-bold">Convert Lead</h1>
          <span className="text-md font-semibold text-text-muted">
            ({fullName}
            {company ? ` - ${company}` : ""})
          </span>
        </header>
        <form
          className="flex max-w-[845px] flex-col gap-6 px-8 py-8"
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
            label="Create a new Deal for this Account."
            isSelected={withDeal}
            onChange={setWithDeal}
          />
          {withDeal ? (
            <div data-convert-deal className="flex w-[600px] flex-col gap-4">
              <NumberField
                label="Amount"
                prefix="TL"
                value={amount ?? Number.NaN}
                onChange={(value) => setAmount(Number.isNaN(value) ? null : value)}
              />
              <TextField
                label="Deal Name"
                isRequired
                value={effectiveDealName}
                onChange={setDealName}
                errorMessage={dealErrors.Deal_Name}
                isInvalid={Boolean(dealErrors.Deal_Name)}
              />
              <DatePicker
                label="Closing Date"
                isRequired
                value={closingDate}
                onChange={setClosingDate}
                errorMessage={dealErrors.Closing_Date}
                isInvalid={Boolean(dealErrors.Closing_Date)}
              />
              <Select
                label="Stage"
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
          <div className="flex w-[180px] flex-col gap-1">
            <TextField label="Owner of the New Records" value={ownerName} isReadOnly />
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="recordPrimary"
              size="record"
              isDisabled={converted || convert.isPending}
            >
              Convert
            </Button>
            <Button variant="recordSecondary" size="record" onPress={cancel}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
      <aside className="w-[300px] shrink-0 border-l border-panel-border px-4 py-6">
        <h2 className="text-md font-semibold">Quick Links</h2>
        <p className="mt-3 text-md text-primary">Lead Conversion Mapping</p>
      </aside>
    </div>
  );
}
