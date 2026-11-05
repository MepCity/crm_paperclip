"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Switch } from "@/components/ui/switch";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import {
  deleteApprovalProcess,
  fetchApprovalProcesses,
  reorderApprovalProcesses,
  updateApprovalProcess,
} from "./api";
import type { ApprovalProcess } from "./types";

interface ApprovalProcessListScreenProps {
  orgSlug: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  create: "Oluştur",
  edit: "Düzenle",
  create_or_edit: "Oluştur veya Düzenle",
};

export function ApprovalProcessListScreen({ orgSlug }: ApprovalProcessListScreenProps) {
  const [processes, setProcesses] = useState<ApprovalProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [moduleFilter, setModuleFilter] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [moduleOpen, setModuleOpen] = useState(false);
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // Reorder dialog state
  const [reorderOpen, setReorderOpen] = useState(false);
  const [reorderList, setReorderList] = useState<ApprovalProcess[]>([]);
  const [savingReorder, setSavingReorder] = useState(false);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<ApprovalProcess | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProcesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchApprovalProcesses(orgSlug);
      setProcesses(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onay işlemleri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [orgSlug]);

  useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  const handleToggleActive = async (p: ApprovalProcess) => {
    try {
      await updateApprovalProcess(orgSlug, p.id, { active: !p.active });
      setProcesses((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, active: !item.active } : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Durum güncellenemedi.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteApprovalProcess(orgSlug, deleteTarget.id);
      setProcesses((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Silme işlemi başarısız oldu.");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenReorder = () => {
    setReorderList([...processes]);
    setReorderOpen(true);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const next = [...reorderList];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    const temp = next[index];
    const target = next[targetIndex];
    if (temp && target) {
      next[index] = target;
      next[targetIndex] = temp;
      setReorderList(next);
    }
  };

  const handleSaveReorder = async () => {
    try {
      setSavingReorder(true);
      const ids = reorderList.map((p) => p.id);
      const res = await reorderApprovalProcesses(orgSlug, ids);
      setProcesses(res);
      setReorderOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sıralama kaydedilemedi.");
    } finally {
      setSavingReorder(false);
    }
  };

  const uniqueModules = [...new Set(processes.map((p) => p.module))].sort();

  const filteredProcesses = processes.filter((p) => {
    if (moduleFilter && p.module !== moduleFilter) return false;
    if (triggerFilter && p.trigger !== triggerFilter) return false;
    if (statusFilter === "active" && !p.active) return false;
    if (statusFilter === "inactive" && p.active) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6" data-testid="approval-process-list-screen">
      {/* Title & Subtitle */}
      <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Onay İşlemi</h1>
          <p className="text-sm text-text-muted mt-1">
            Onay sürecini kullanarak bir veya daha fazla yöneticiden onay için kayıt gönderimini
            otomatikleştir.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <Button
            variant="secondary"
            onPress={handleOpenReorder}
            isDisabled={processes.length <= 1}
          >
            İşlemleri Yeniden Düzenle
          </Button>
          <Link
            href={`/crm/${orgSlug}/settings/approval-processes/new`}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-text hover:bg-primary-hover transition-colors"
          >
            <Icons.plus className="size-4" />
            <span>+ Onay İşlemi Ekle</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-lg border border-border bg-surface shadow-xs overflow-visible">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-secondary/50 text-xs font-semibold text-text-muted">
              <tr>
                <th className="px-4 py-3">İşlem Adı</th>
                {/* Module filter */}
                <th className="px-4 py-3 relative">
                  <button
                    type="button"
                    onClick={() => {
                      setModuleOpen((v) => !v);
                      setTriggerOpen(false);
                      setStatusOpen(false);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-text hover:text-primary transition-colors cursor-pointer"
                  >
                    <span>{moduleFilter || "Modül"}</span>
                    <Icons.chevronDown
                      className={`size-3 transition-transform ${moduleOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {moduleOpen && (
                    <div className="absolute left-4 top-full z-30 mt-1 max-h-56 w-48 overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setModuleFilter("");
                          setModuleOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-xs ${
                          !moduleFilter
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-text hover:bg-surface-secondary"
                        }`}
                      >
                        Tümü
                      </button>
                      {uniqueModules.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setModuleFilter(m);
                            setModuleOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-xs ${
                            moduleFilter === m
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-text hover:bg-surface-secondary"
                          }`}
                        >
                          <span>{m}</span>
                          {moduleFilter === m && <Icons.check className="size-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </th>

                {/* Execution trigger filter */}
                <th className="px-4 py-3 relative">
                  <button
                    type="button"
                    onClick={() => {
                      setTriggerOpen((v) => !v);
                      setModuleOpen(false);
                      setStatusOpen(false);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-text hover:text-primary transition-colors cursor-pointer"
                  >
                    <span>{TRIGGER_LABELS[triggerFilter] ?? "Yürütme Eşiği"}</span>
                    <Icons.chevronDown
                      className={`size-3 transition-transform ${triggerOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {triggerOpen && (
                    <div className="absolute left-4 top-full z-30 mt-1 w-48 rounded-md border border-border bg-surface p-1 shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setTriggerFilter("");
                          setTriggerOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-xs ${
                          !triggerFilter
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-text hover:bg-surface-secondary"
                        }`}
                      >
                        Tümü
                      </button>
                      {Object.entries(TRIGGER_LABELS).map(([k, lbl]) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            setTriggerFilter(k);
                            setTriggerOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-xs ${
                            triggerFilter === k
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-text hover:bg-surface-secondary"
                          }`}
                        >
                          <span>{lbl}</span>
                          {triggerFilter === k && <Icons.check className="size-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </th>

                <th className="px-4 py-3">Cetvel</th>

                {/* Status filter */}
                <th className="px-4 py-3 relative">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusOpen((v) => !v);
                      setModuleOpen(false);
                      setTriggerOpen(false);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-text hover:text-primary transition-colors cursor-pointer"
                  >
                    <span>
                      {statusFilter === "active"
                        ? "Aktif"
                        : statusFilter === "inactive"
                          ? "Etkin Değil"
                          : "Durum"}
                    </span>
                    <Icons.chevronDown
                      className={`size-3 transition-transform ${statusOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {statusOpen && (
                    <div className="absolute left-4 top-full z-30 mt-1 w-36 rounded-md border border-border bg-surface p-1 shadow-lg">
                      {[
                        { id: "", label: "Tümü" },
                        { id: "active", label: "Aktif" },
                        { id: "inactive", label: "Etkin Değil" },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setStatusFilter(s.id);
                            setStatusOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-xs ${
                            statusFilter === s.id
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-text hover:bg-surface-secondary"
                          }`}
                        >
                          <span>{s.label}</span>
                          {statusFilter === s.id && <Icons.check className="size-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </th>
                <th className="px-4 py-3 text-right">Eylemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-text-muted">
                    <Icons.spinner className="mx-auto size-6 animate-spin mb-2" />
                    Yükleniyor...
                  </td>
                </tr>
              ) : filteredProcesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <p className="text-base font-semibold text-text mb-4">
                      Onay işlemi yapılandırmanız yok
                    </p>
                    <Link
                      href={`/crm/${orgSlug}/settings/approval-processes/new`}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:bg-primary-hover transition-colors"
                    >
                      <Icons.plus className="size-4" />
                      <span>+ Onay İşlemi Ekle</span>
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredProcesses.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/crm/${orgSlug}/settings/approval-processes/${p.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{p.module}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {TRIGGER_LABELS[p.trigger] ?? p.trigger}
                    </td>
                    <td className="px-4 py-3 text-text-muted">-</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          label="Durum"
                          hideLabel
                          isSelected={p.active}
                          onChange={() => handleToggleActive(p)}
                          aria-label={`${p.name} durumunu değiştir`}
                        />
                        <span className="text-xs text-text-muted font-semibold">
                          {p.active ? "Aktif" : "Etkin Değil"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/crm/${orgSlug}/settings/approval-processes/${p.id}`}
                          className="rounded p-1 text-text-muted hover:bg-surface-secondary hover:text-text transition-colors"
                          aria-label="Düzenle"
                        >
                          <Icons.fieldEdit className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          className="rounded p-1 text-text-muted hover:bg-rose-50 hover:text-danger transition-colors cursor-pointer"
                          aria-label="Sil"
                        >
                          <Icons.close className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reorder Modal */}
      <TopAlignedModal
        isOpen={reorderOpen}
        onOpenChange={setReorderOpen}
        isDismissable
        aria-labelledby="reorder-dialog-title"
      >
        <div className="p-6 space-y-4">
          <h3 id="reorder-dialog-title" className="text-lg font-semibold text-text">
            İşlemleri Yeniden Düzenle
          </h3>
          <p className="text-xs text-text-muted mb-3">
            Süreçlerin kontrol edilme ve tetiklenme sırasını belirleyin:
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {reorderList.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border border-border p-3 bg-surface"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-surface-secondary text-xs font-bold text-text-muted">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-sm text-text">{item.name}</div>
                    <div className="text-xs text-text-muted">{item.module}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, "up")}
                    className="rounded p-1.5 text-text-muted hover:bg-surface-secondary disabled:opacity-30 cursor-pointer"
                    aria-label="Yukarı taşı"
                  >
                    <Icons.chevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === reorderList.length - 1}
                    onClick={() => handleMove(idx, "down")}
                    className="rounded p-1.5 text-text-muted hover:bg-surface-secondary disabled:opacity-30 cursor-pointer"
                    aria-label="Aşağı taşı"
                  >
                    <Icons.chevronDown className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onPress={() => setReorderOpen(false)}>
              İptal
            </Button>
            <Button variant="primary" onPress={handleSaveReorder} isDisabled={savingReorder}>
              {savingReorder ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      </TopAlignedModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Onay İşlemini Sil"
        message={`"${deleteTarget?.name}" onay işlemini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        cancelLabel="İptal"
        tone="danger"
        busy={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
