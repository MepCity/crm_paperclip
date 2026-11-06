"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Switch } from "@/components/ui/switch";
import { deleteReviewProcess, fetchReviewProcesses, updateReviewProcess } from "./api";
import type { ApprovalProcess } from "./types";

interface ReviewProcessListScreenProps {
  orgSlug: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  create: "Oluştur",
  edit: "Düzenle",
  create_or_edit: "Oluştur veya Düzenle",
};

export function ReviewProcessListScreen({ orgSlug }: ReviewProcessListScreenProps) {
  const [processes, setProcesses] = useState<ApprovalProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<ApprovalProcess | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProcesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchReviewProcesses(orgSlug);
      setProcesses(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gözden geçirme süreçleri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [orgSlug]);

  useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  const handleToggleActive = async (p: ApprovalProcess) => {
    try {
      await updateReviewProcess(orgSlug, p.id, { active: !p.active });
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
      await deleteReviewProcess(orgSlug, deleteTarget.id);
      setProcesses((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Silme işlemi başarısız oldu.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" data-testid="review-process-list-screen">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-text">Gözden Geçirme Süreci</h1>
          <button
            type="button"
            className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1"
          >
            <Icons.help className="size-3.5" />
            <span>Yardım</span>
          </button>
        </div>
        {processes.length > 0 && (
          <Link
            href={`/crm/${orgSlug}/settings/review-processes/new`}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-text hover:bg-primary-hover transition-colors"
          >
            <Icons.plus className="size-4" />
            <span>Yeni Süreç Oluştur</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-muted">
          <Icons.spinner className="size-6 animate-spin mr-2" />
          <span>Yükleniyor...</span>
        </div>
      ) : processes.length === 0 ? (
        /* Empty State §4.2 (from reference S-A2 capture mep1452-setup-review-process) */
        <div className="rounded-lg border border-border bg-surface p-12 text-center max-w-2xl mx-auto shadow-xs space-y-8 my-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-text">Bilgilerin El ile Gözden Geçirilmesi</h2>
              <p className="text-sm text-text-muted">
                Kuruluş, gönderilen bilgilerin el ile alana göre doğrulanmasını gerektirir.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-text">Bilgi Toplamayı İyileştir</h2>
              <p className="text-sm text-text-muted">
                Sorunları ayrıntılı raporlar aracılığıyla tanımlayın ve bilgilerin toplanmasını
                iyileştirin.
              </p>
            </div>
          </div>

          <Link
            href={`/crm/${orgSlug}/settings/review-processes/new`}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-text hover:bg-primary-hover shadow-sm transition-colors"
          >
            Yeni Süreç Oluştur
          </Link>
        </div>
      ) : (
        /* Table of Review Processes */
        <div className="rounded-lg border border-border bg-surface shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-secondary/50 text-xs font-semibold text-text-muted">
              <tr>
                <th className="px-4 py-3">Süreç Adı</th>
                <th className="px-4 py-3">Modül</th>
                <th className="px-4 py-3">Yürütme Eşiği</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">Eylemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {processes.map((p) => (
                <tr key={p.id} className="hover:bg-surface-secondary/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-primary hover:underline">
                    <Link href={`/crm/${orgSlug}/settings/review-processes/${p.id}`}>{p.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{p.module}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {TRIGGER_LABELS[p.trigger] ?? p.trigger}
                  </td>
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
                        href={`/crm/${orgSlug}/settings/review-processes/${p.id}`}
                        className="rounded p-1 text-text-muted hover:bg-surface-secondary hover:text-text transition-colors"
                        aria-label="Düzenle"
                      >
                        <Icons.fieldEdit className="size-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(p)}
                        className="rounded p-1 text-text-muted hover:bg-rose-50 hover:text-danger transition-colors"
                        aria-label="Sil"
                      >
                        <Icons.close className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Gözden Geçirme Sürecini Sil"
        message={`"${deleteTarget?.name}" gözden geçirme sürecini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel={deleting ? "Siliniyor..." : "Sil"}
        cancelLabel="İptal"
        tone="danger"
        busy={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
