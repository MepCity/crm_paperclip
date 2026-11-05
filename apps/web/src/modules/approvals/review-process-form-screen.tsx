"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Switch } from "@/components/ui/switch";
import { createReviewProcess, fetchReviewProcess, updateReviewProcess } from "./api";
import type { FieldUpdateAction, ProcessStep, ProcessTrigger } from "./types";

interface ReviewProcessFormScreenProps {
  orgSlug: string;
  processId?: string;
}

const SUPPORTED_MODULES = [
  { id: "Deals", label: "Satış Fırsatları (Deals)" },
  { id: "Leads", label: "Müşteri Adayları (Leads)" },
  { id: "Contacts", label: "Kişiler (Contacts)" },
  { id: "Accounts", label: "Firmalar (Accounts)" },
  { id: "Quotes", label: "Teklifler (Quotes)" },
  { id: "Invoices", label: "Faturalar (Invoices)" },
  { id: "Products", label: "Ürünler (Products)" },
];

const COMMON_FIELDS = [
  "Amount",
  "Stage",
  "Closing_Date",
  "Account_Name",
  "Contact_Name",
  "Email",
  "Phone",
  "Company",
  "Lead_Source",
  "Description",
];

export function ReviewProcessFormScreen({ orgSlug, processId }: ReviewProcessFormScreenProps) {
  const router = useRouter();
  const isEdit = Boolean(processId);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [module, setModule] = useState("Deals");
  const [trigger, setTrigger] = useState<ProcessTrigger>("create_or_edit");
  const [active, setActive] = useState(true);

  // Review Fields
  const [reviewFields, setReviewFields] = useState<string[]>(["Amount", "Stage"]);
  const [newFieldInput, setNewFieldInput] = useState("");

  // Criteria State
  const [_criteriaKind, _setCriteriaKind] = useState<"all_records" | "criteria">("all_records");

  // Steps State
  const [steps, setSteps] = useState<ProcessStep[]>([
    {
      name: "İnceleme Adımı",
      approvers: { kind: "roles", refs: ["admin"] },
      rule: "any",
    },
  ]);

  const [onApprove, setOnApprove] = useState<FieldUpdateAction[]>([]);
  const [onReject, setOnReject] = useState<FieldUpdateAction[]>([]);

  useEffect(() => {
    if (!processId) return;
    setLoading(true);
    fetchReviewProcess(orgSlug, processId)
      .then((proc) => {
        setName(proc.name);
        setModule(proc.module);
        setTrigger(proc.trigger);
        setActive(proc.active);
        setReviewFields(proc.reviewFields ?? []);
        if (proc.steps?.length) setSteps(proc.steps);
        setOnApprove(proc.onApprove ?? []);
        setOnReject(proc.onReject ?? []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gözden geçirme süreci yüklenemedi.");
      })
      .finally(() => setLoading(false));
  }, [orgSlug, processId]);

  const toggleReviewField = (field: string) => {
    if (reviewFields.includes(field)) {
      setReviewFields(reviewFields.filter((f) => f !== field));
    } else {
      setReviewFields([...reviewFields, field]);
    }
  };

  const handleAddCustomField = () => {
    const trimmed = newFieldInput.trim();
    if (trimmed && !reviewFields.includes(trimmed)) {
      setReviewFields([...reviewFields, trimmed]);
      setNewFieldInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Süreç adı zorunludur.");
      return;
    }
    if (reviewFields.length === 0) {
      setError("En az bir gözden geçirilecek alan seçilmelidir.");
      return;
    }

    const payload = {
      name: name.trim(),
      module,
      trigger,
      criteria: { kind: "all_records" as const },
      reviewFields,
      steps,
      onApprove,
      onReject,
      active,
    };

    try {
      setSubmitting(true);
      setError(null);
      if (isEdit && processId) {
        await updateReviewProcess(orgSlug, processId, payload);
      } else {
        await createReviewProcess(orgSlug, payload);
      }
      router.push(`/crm/${orgSlug}/settings/review-processes`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted">
        <Icons.spinner className="size-6 animate-spin mr-2" />
        <span>Yükleniyor...</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 max-w-4xl"
      data-testid="review-process-form"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text">
            {isEdit ? `Gözden Geçirme Sürecini Düzenle: ${name}` : "Yeni Gözden Geçirme Süreci"}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Kayıtların el ile doğrulanması için alanları ve onaylayıcıları belirleyin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/crm/${orgSlug}/settings/review-processes`}
            className="rounded-md border border-border px-3.5 py-2 text-sm font-semibold text-text hover:bg-surface-secondary transition-colors"
          >
            İptal
          </Link>
          <Button variant="primary" type="submit" isDisabled={submitting}>
            {submitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* 1. Temel Bilgiler */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <h2 className="text-base font-semibold text-text border-b border-border pb-2">
          1. Temel Bilgiler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="rev-proc-name" className="block text-xs font-semibold text-text mb-1">
              Süreç Adı <span className="text-danger">*</span>
            </label>
            <input
              id="rev-proc-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Müşteri Bilgileri Doğrulama"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-hidden focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="rev-proc-module" className="block text-xs font-semibold text-text mb-1">
              Modül <span className="text-danger">*</span>
            </label>
            <select
              id="rev-proc-module"
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-hidden focus:border-primary"
            >
              {SUPPORTED_MODULES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="rev-proc-trigger"
              className="block text-xs font-semibold text-text mb-1"
            >
              Yürütme Eşiği <span className="text-danger">*</span>
            </label>
            <select
              id="rev-proc-trigger"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as ProcessTrigger)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-hidden focus:border-primary"
            >
              <option value="create_or_edit">Oluşturulduğunda veya Düzenlendiğinde</option>
              <option value="create">Yalnızca Oluşturulduğunda</option>
              <option value="edit">Yalnızca Düzenlendiğinde</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <Switch
              label="Süreç Aktif"
              hideLabel
              isSelected={active}
              onChange={setActive}
              aria-label="Süreç aktif"
            />
            <span className="text-sm font-semibold text-text">
              {active ? "Süreç Aktif" : "Süreç Etkin Değil"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Gözden Geçirilecek Alanlar */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <h2 className="text-base font-semibold text-text border-b border-border pb-2">
          2. Gözden Geçirilecek Alanlar <span className="text-danger">*</span>
        </h2>
        <p className="text-xs text-text-muted">
          İnceleyicinin doğrulaması gereken alanları işaretleyin veya yeni bir alan ekleyin:
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {COMMON_FIELDS.map((f) => {
            const selected = reviewFields.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => toggleReviewField(f)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                  selected
                    ? "bg-primary text-primary-text border-primary"
                    : "bg-surface-secondary text-text border-border hover:bg-surface-hover"
                }`}
              >
                <span>{f}</span>
                {selected && <Icons.check className="size-3" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="Başka alan adı..."
            value={newFieldInput}
            onChange={(e) => setNewFieldInput(e.target.value)}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-text w-48"
          />
          <button
            type="button"
            onClick={handleAddCustomField}
            className="rounded-md bg-surface-secondary border border-border px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-hover"
          >
            + Ekle
          </button>
        </div>
      </div>

      {/* 3. İnceleme Adımı */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <h2 className="text-base font-semibold text-text border-b border-border pb-2">
          3. İnceleyici Kuralları
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="rev-proc-role"
              className="block text-xs font-semibold text-text-muted mb-1"
            >
              İnceleyici Rolü (örn: admin)
            </label>
            <input
              id="rev-proc-role"
              type="text"
              value={steps[0]?.approvers.refs.join(", ") ?? "admin"}
              onChange={(e) =>
                setSteps([
                  {
                    ...steps[0],
                    name: steps[0]?.name || "İnceleme Adımı",
                    approvers: {
                      kind: "roles",
                      refs: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                    rule: "any",
                  },
                ])
              }
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-2">
        <Link
          href={`/crm/${orgSlug}/settings/review-processes`}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-text hover:bg-surface-secondary transition-colors"
        >
          İptal
        </Link>
        <Button variant="primary" type="submit" isDisabled={submitting}>
          {submitting ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </form>
  );
}
