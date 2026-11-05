"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Switch } from "@/components/ui/switch";
import { useUsers } from "@/lib/api/client/hooks";
import { createApprovalProcess, fetchApprovalProcess, updateApprovalProcess } from "./api";
import type { FieldUpdateAction, ProcessCondition, ProcessStep, ProcessTrigger } from "./types";

interface ApprovalProcessFormScreenProps {
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
  { id: "Tasks", label: "Görevler (Tasks)" },
  { id: "Meetings", label: "Toplantılar (Meetings)" },
  { id: "Calls", label: "Aramalar (Calls)" },
  { id: "Campaigns", label: "Kampanyalar (Campaigns)" },
  { id: "Cases", label: "Servis Dosyaları (Cases)" },
  { id: "Solutions", label: "Çözümler (Solutions)" },
];

const COMPARATOR_OPTIONS = [
  { id: "equal", label: "eşittir" },
  { id: "not_equal", label: "eşit değildir" },
  { id: "greater_than", label: "büyüktür" },
  { id: "greater_equal", label: "büyük eşittir" },
  { id: "less_than", label: "küçüktür" },
  { id: "less_equal", label: "küçük eşittir" },
  { id: "contains", label: "içerir" },
  { id: "not_contains", label: "içermez" },
  { id: "starts_with", label: "ile başlar" },
  { id: "ends_with", label: "ile biter" },
  { id: "is_empty", label: "boştur" },
  { id: "is_not_empty", label: "dolu / boş değildir" },
];

type ApproverKind = ProcessStep["approvers"]["kind"];
type StepRule = ProcessStep["rule"];
type CriterionComparator =
  | "equal"
  | "not_equal"
  | "greater_than"
  | "greater_equal"
  | "less_than"
  | "less_equal"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "is_empty"
  | "is_not_empty";

type FormStep = ProcessStep & { _id: string };
type FormAction = FieldUpdateAction & { _id: string };

let nextUniqueId = 0;
const generateId = () => `id-${Date.now()}-${++nextUniqueId}`;

export function ApprovalProcessFormScreen({ orgSlug, processId }: ApprovalProcessFormScreenProps) {
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

  // Criteria State: "all_records" | "criteria"
  const [criteriaKind, setCriteriaKind] = useState<"all_records" | "criteria">("all_records");
  const [criterionField, setCriterionField] = useState("Amount");
  const [criterionComparator, setCriterionComparator] = useState("greater_than");
  const [criterionValue, setCriterionValue] = useState("1000000");

  // Steps State (1 to 5 steps)
  const [steps, setSteps] = useState<FormStep[]>([
    {
      _id: "step-init",
      name: "Yönetici Onayı",
      approvers: { kind: "roles", refs: ["admin"] },
      rule: "any",
    },
  ]);

  // Field updates on approve / reject
  const [onApprove, setOnApprove] = useState<FormAction[]>([]);
  const [onReject, setOnReject] = useState<FormAction[]>([]);

  const { data: users = [] } = useUsers();

  useEffect(() => {
    if (!processId) return;
    setLoading(true);
    fetchApprovalProcess(orgSlug, processId)
      .then((proc) => {
        setName(proc.name);
        setModule(proc.module);
        setTrigger(proc.trigger);
        setActive(proc.active);
        if (proc.criteria.kind === "criteria" && "field" in proc.criteria.criteria) {
          setCriteriaKind("criteria");
          setCriterionField(proc.criteria.criteria.field);
          setCriterionComparator(proc.criteria.criteria.comparator);
          setCriterionValue(String(proc.criteria.criteria.value ?? ""));
        } else {
          setCriteriaKind("all_records");
        }
        if (proc.steps?.length) {
          setSteps(proc.steps.map((s, idx) => ({ ...s, _id: `step-load-${idx}` })));
        }
        setOnApprove((proc.onApprove ?? []).map((a, idx) => ({ ...a, _id: `appr-load-${idx}` })));
        setOnReject((proc.onReject ?? []).map((a, idx) => ({ ...a, _id: `rej-load-${idx}` })));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Onay işlemi yüklenemedi.");
      })
      .finally(() => setLoading(false));
  }, [orgSlug, processId]);

  const handleAddStep = () => {
    if (steps.length >= 5) return;
    setSteps([
      ...steps,
      {
        _id: generateId(),
        name: `Adım ${steps.length + 1}`,
        approvers: { kind: "roles", refs: ["admin"] },
        rule: "any",
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, patch: Partial<FormStep>) => {
    setSteps(steps.map((st, i) => (i === index ? { ...st, ...patch } : st)));
  };

  const handleAddOnApproveAction = () => {
    setOnApprove([
      ...onApprove,
      { _id: generateId(), kind: "field_update", field: "Stage", value: "Approved" },
    ]);
  };

  const handleAddOnRejectAction = () => {
    setOnReject([
      ...onReject,
      { _id: generateId(), kind: "field_update", field: "Stage", value: "Rejected" },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("İşlem adı zorunludur.");
      return;
    }

    const condition: ProcessCondition =
      criteriaKind === "all_records"
        ? { kind: "all_records" }
        : {
            kind: "criteria",
            criteria: {
              field: criterionField,
              comparator: criterionComparator as CriterionComparator,
              value:
                Number.isFinite(Number(criterionValue)) && criterionValue !== ""
                  ? Number(criterionValue)
                  : criterionValue,
            },
          };

    const payload = {
      name: name.trim(),
      module,
      trigger,
      criteria: condition,
      steps: steps.map(({ _id, ...st }) => st),
      onApprove: onApprove.map(({ _id, ...act }) => act),
      onReject: onReject.map(({ _id, ...act }) => act),
      active,
    };

    try {
      setSubmitting(true);
      setError(null);
      if (isEdit && processId) {
        await updateApprovalProcess(orgSlug, processId, payload);
      } else {
        await createApprovalProcess(orgSlug, payload);
      }
      router.push(`/crm/${orgSlug}/settings/approval-processes`);
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
      data-testid="approval-process-form"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text">
            {isEdit ? `Onay İşlemini Düzenle: ${name}` : "Yeni Onay İşlemi"}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Kayıtlar için onay aşamalarını ve onaylayıcı kurallarını yapılandırın.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/crm/${orgSlug}/settings/approval-processes`}
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

      {/* 1. Temel Bilgiler Card */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <h2 className="text-base font-semibold text-text border-b border-border pb-2">
          1. Temel Bilgiler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="appr-proc-name" className="block text-xs font-semibold text-text mb-1">
              İşlem Adı <span className="text-danger">*</span>
            </label>
            <input
              id="appr-proc-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Büyük Anlaşma Onayı"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-hidden focus:border-primary"
            />
          </div>

          <div>
            <label
              htmlFor="appr-proc-module"
              className="block text-xs font-semibold text-text mb-1"
            >
              Modül <span className="text-danger">*</span>
            </label>
            <select
              id="appr-proc-module"
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
              htmlFor="appr-proc-trigger"
              className="block text-xs font-semibold text-text mb-1"
            >
              Yürütme Eşiği (Tetikleme) <span className="text-danger">*</span>
            </label>
            <select
              id="appr-proc-trigger"
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

      {/* 2. Giriş Kriterleri Card */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <h2 className="text-base font-semibold text-text border-b border-border pb-2">
          2. Giriş Kriterleri
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-text">
              <input
                type="radio"
                name="criteriaKind"
                checked={criteriaKind === "all_records"}
                onChange={() => setCriteriaKind("all_records")}
                className="text-primary focus:ring-primary"
              />
              <span>Tüm Kayıtlar (Kriter Yok)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-text">
              <input
                type="radio"
                name="criteriaKind"
                checked={criteriaKind === "criteria"}
                onChange={() => setCriteriaKind("criteria")}
                className="text-primary focus:ring-primary"
              />
              <span>Kriter Belirt</span>
            </label>
          </div>

          {criteriaKind === "criteria" && (
            <div className="flex flex-wrap items-center gap-3 rounded-md bg-surface-secondary/40 p-4 border border-border/70">
              <input
                type="text"
                placeholder="Alan Adı (örn: Amount)"
                value={criterionField}
                onChange={(e) => setCriterionField(e.target.value)}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text"
              />
              <select
                value={criterionComparator}
                onChange={(e) => setCriterionComparator(e.target.value)}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text"
              >
                {COMPARATOR_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Değer (örn: 1000000)"
                value={criterionValue}
                onChange={(e) => setCriterionValue(e.target.value)}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text"
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Onay Adımları Card */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-base font-semibold text-text">3. Onay Adımları (1-5 Adım)</h2>
          {steps.length < 5 && (
            <Button variant="secondary" size="compact" onPress={handleAddStep}>
              + Adım Ekle
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div
              key={step._id}
              className="rounded-md border border-border p-4 bg-surface-secondary/20 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Adım {idx + 1}
                </span>
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="text-xs text-danger hover:underline"
                  >
                    Adımı Kaldır
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor={`step-name-${idx}`}
                    className="block text-xs font-semibold text-text-muted mb-1"
                  >
                    Adım Adı
                  </label>
                  <input
                    id={`step-name-${idx}`}
                    type="text"
                    required
                    value={step.name}
                    onChange={(e) => handleStepChange(idx, { name: e.target.value })}
                    className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`step-kind-${idx}`}
                    className="block text-xs font-semibold text-text-muted mb-1"
                  >
                    Onaylayan Türü
                  </label>
                  <select
                    id={`step-kind-${idx}`}
                    value={step.approvers.kind}
                    onChange={(e) => {
                      const kind = e.target.value as ApproverKind;
                      const refs = kind === "record_owner_manager" ? [] : ["admin"];
                      handleStepChange(idx, { approvers: { kind, refs } });
                    }}
                    className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text"
                  >
                    <option value="roles">Roller</option>
                    <option value="users">Belirli Kullanıcılar</option>
                    <option value="groups">Gruplar</option>
                    <option value="record_owner_manager">Kayıt Sahibinin Yöneticisi</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`step-rule-${idx}`}
                    className="block text-xs font-semibold text-text-muted mb-1"
                  >
                    Onay Kuralı
                  </label>
                  <select
                    id={`step-rule-${idx}`}
                    value={step.rule}
                    onChange={(e) => handleStepChange(idx, { rule: e.target.value as StepRule })}
                    className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text"
                  >
                    <option value="any">Herhangi biri onaylarsa</option>
                    <option value="all">Tüm onaylayanlar onaylamalı</option>
                  </select>
                </div>
              </div>

              {step.approvers.kind === "roles" && (
                <div>
                  <label
                    htmlFor={`step-roles-${idx}`}
                    className="block text-xs font-semibold text-text-muted mb-1"
                  >
                    Rol Seçin (örn: admin)
                  </label>
                  <input
                    id={`step-roles-${idx}`}
                    type="text"
                    value={step.approvers.refs.join(", ")}
                    onChange={(e) =>
                      handleStepChange(idx, {
                        approvers: {
                          ...step.approvers,
                          refs: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                    placeholder="admin, standard, manager"
                    className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text"
                  />
                </div>
              )}

              {step.approvers.kind === "users" && (
                <div>
                  <label
                    htmlFor={`step-users-${idx}`}
                    className="block text-xs font-semibold text-text-muted mb-1"
                  >
                    Kullanıcı Seçin
                  </label>
                  <select
                    id={`step-users-${idx}`}
                    value={step.approvers.refs[0] ?? ""}
                    onChange={(e) =>
                      handleStepChange(idx, {
                        approvers: { ...step.approvers, refs: [e.target.value] },
                      })
                    }
                    className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text"
                  >
                    <option value="">Kullanıcı seçin...</option>
                    {users.map((u) => (
                      <option key={u.userId} value={u.userId}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Onay Eylemleri (Field updates) */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-base font-semibold text-text">4. Onay / Reddetme Eylemleri</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700">
                Onaylandığında Alan Güncellemeleri
              </span>
              <button
                type="button"
                onClick={handleAddOnApproveAction}
                className="text-xs text-primary hover:underline font-semibold"
              >
                + Ekle
              </button>
            </div>
            {onApprove.length === 0 ? (
              <p className="text-xs text-text-muted">Güncelleme eylemi yok.</p>
            ) : (
              onApprove.map((act, i) => (
                <div key={act._id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={act.field}
                    onChange={(e) => {
                      const next = [...onApprove];
                      const item = next[i];
                      if (item) item.field = e.target.value;
                      setOnApprove(next);
                    }}
                    placeholder="Alan"
                    className="w-1/2 rounded border border-border px-2 py-1 text-xs"
                  />
                  <input
                    type="text"
                    value={String(act.value ?? "")}
                    onChange={(e) => {
                      const next = [...onApprove];
                      const item = next[i];
                      if (item) item.value = e.target.value;
                      setOnApprove(next);
                    }}
                    placeholder="Değer"
                    className="w-1/2 rounded border border-border px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setOnApprove(onApprove.filter((_, idx) => idx !== i))}
                    className="text-text-muted hover:text-danger"
                  >
                    <Icons.close className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700">
                Reddedildiğinde Alan Güncellemeleri
              </span>
              <button
                type="button"
                onClick={handleAddOnRejectAction}
                className="text-xs text-primary hover:underline font-semibold"
              >
                + Ekle
              </button>
            </div>
            {onReject.length === 0 ? (
              <p className="text-xs text-text-muted">Güncelleme eylemi yok.</p>
            ) : (
              onReject.map((act, i) => (
                <div key={act._id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={act.field}
                    onChange={(e) => {
                      const next = [...onReject];
                      const item = next[i];
                      if (item) item.field = e.target.value;
                      setOnReject(next);
                    }}
                    placeholder="Alan"
                    className="w-1/2 rounded border border-border px-2 py-1 text-xs"
                  />
                  <input
                    type="text"
                    value={String(act.value ?? "")}
                    onChange={(e) => {
                      const next = [...onReject];
                      const item = next[i];
                      if (item) item.value = e.target.value;
                      setOnReject(next);
                    }}
                    placeholder="Değer"
                    className="w-1/2 rounded border border-border px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setOnReject(onReject.filter((_, idx) => idx !== i))}
                    className="text-text-muted hover:text-danger"
                  >
                    <Icons.close className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-2">
        <Link
          href={`/crm/${orgSlug}/settings/approval-processes`}
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
