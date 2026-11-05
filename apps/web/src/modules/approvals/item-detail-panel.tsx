"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SelectUserDialog,
  type SelectUserRecord,
} from "@/components/records/form/select-user-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { TextArea } from "@/components/ui/text-area";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUsers } from "@/lib/api/client/hooks";
import { decideApprovalAction, fetchApprovalDetail } from "./api";
import type { ActionKind, ApprovalDetail, RequestStatus } from "./types";

interface ItemDetailPanelProps {
  orgSlug: string;
  approvalId: string;
  onClose: () => void;
  onDecided: () => void;
}

const statusLabels: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: "Bekliyor", className: "bg-amber-100 text-amber-800 border-amber-300" },
  approved: { label: "Onaylandı", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  rejected: { label: "Reddedildi", className: "bg-rose-100 text-rose-800 border-rose-300" },
  recalled: { label: "Geri Alındı", className: "bg-zinc-100 text-zinc-800 border-zinc-300" },
  waiting_review: {
    label: "Gözden Geçirme Bekliyor",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  in_review: {
    label: "İnceleme Sürüyor",
    className: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
  waiting_rereview: {
    label: "Yeniden Gözden Geçirme Bekliyor",
    className: "bg-amber-100 text-amber-800 border-amber-300",
  },
};

const actionLabels: Record<ActionKind, { label: string; icon: keyof typeof Icons }> = {
  submitted: { label: "Onaya Gönderildi", icon: "activity" },
  approved: { label: "Onaylandı", icon: "check" },
  rejected: { label: "Reddedildi", icon: "close" },
  delegated: { label: "Yetki Devredildi", icon: "userPlus" },
  recalled: { label: "Geri Alındı", icon: "history" },
  auto_approved: { label: "Otomatik Onaylandı", icon: "checkSquare" },
};

export function ItemDetailPanel({ orgSlug, approvalId, onClose, onDecided }: ItemDetailPanelProps) {
  const [detail, setDetail] = useState<ApprovalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Decision dialogs state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveComment, setApproveComment] = useState("");

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [delegateDialogOpen, setDelegateDialogOpen] = useState(false);
  const [recallConfirmOpen, setRecallConfirmOpen] = useState(false);

  const { data: users = [] } = useUsers();

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchApprovalDetail(orgSlug, approvalId);
      setDetail(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onay detayı yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [orgSlug, approvalId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await decideApprovalAction(orgSlug, approvalId, "approve", {
        comment: approveComment.trim() || undefined,
      });
      setApproveDialogOpen(false);
      setApproveComment("");
      onDecided();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onaylama başarısız oldu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    const trimmed = rejectComment.trim();
    if (!trimmed) {
      setRejectError("Reddetme gerekçesi belirtilmelidir.");
      return;
    }
    try {
      setSubmitting(true);
      setRejectError(null);
      await decideApprovalAction(orgSlug, approvalId, "reject", { comment: trimmed });
      setRejectDialogOpen(false);
      setRejectComment("");
      onDecided();
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : "Reddetme başarısız oldu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelegate = async (targetUserId: string) => {
    try {
      setSubmitting(true);
      await decideApprovalAction(orgSlug, approvalId, "delegate", { targetUserId });
      setDelegateDialogOpen(false);
      onDecided();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yetki devri başarısız oldu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecall = async () => {
    try {
      setSubmitting(true);
      await decideApprovalAction(orgSlug, approvalId, "recall", {});
      setRecallConfirmOpen(false);
      onDecided();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Geri alma başarısız oldu.");
    } finally {
      setSubmitting(false);
    }
  };

  const mappedUsers: SelectUserRecord[] = users.map((u) => ({
    id: u.userId,
    name: u.name,
    email: u.email ?? "",
  }));

  return (
    <>
      <section
        className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col bg-surface shadow-2xl border-l border-border"
        data-testid="item-detail-panel"
        aria-label="Onay Detayı"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-text">
              {detail ? detail.request.recordLabel || detail.request.processName : "Onay Detayı"}
            </h2>
            {detail && (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  statusLabels[detail.request.status]?.className ?? "bg-surface-secondary text-text"
                }`}
              >
                {statusLabels[detail.request.status]?.label ?? detail.request.status}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-md p-1.5 text-text-muted hover:bg-surface-secondary hover:text-text transition-colors"
          >
            <Icons.close className="size-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12 text-text-muted">
              <Icons.spinner className="size-6 animate-spin mr-2" />
              <span>Yükleniyor...</span>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          )}

          {detail && (
            <>
              {/* Record Summary Card */}
              <div className="rounded-lg border border-border bg-surface-secondary/40 p-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {detail.request.module}
                  </span>
                  <Link
                    href={`/crm/${orgSlug}/${detail.request.module}/${detail.request.recordId}`}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Kayıt Sayfasına Git →
                  </Link>
                </div>
                <div className="text-base font-semibold text-text">
                  {detail.record?.label || detail.request.recordLabel}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-border/50">
                  <div>
                    <span className="text-xs text-text-muted block">Gönderen:</span>
                    <span className="font-medium text-text">{detail.request.submitter.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted block">Gönderme Tarihi:</span>
                    <span className="font-medium text-text">
                      {new Date(detail.request.submittedAt).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted block">İşlem:</span>
                    <span className="font-medium text-text">{detail.request.processName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted block">Mevcut Adım:</span>
                    <span className="font-medium text-text">
                      {detail.request.step} / {detail.request.stepCount} ({detail.request.stepName})
                    </span>
                  </div>
                </div>

                {/* Record Fields Preview */}
                {detail.record?.fields && Object.keys(detail.record.fields).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <span className="text-xs font-semibold text-text-muted block mb-2">
                      Kayıt Bilgileri
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(detail.record.fields)
                        .slice(0, 8)
                        .map(([key, val]) => (
                          <div key={key} className="truncate">
                            <span className="text-text-muted">{key}: </span>
                            <span className="font-medium text-text">
                              {val === null || val === undefined
                                ? "-"
                                : typeof val === "object"
                                  ? JSON.stringify(val)
                                  : String(val)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step Progress Card */}
              <div className="rounded-lg border border-border p-4 space-y-4">
                <h3 className="text-sm font-semibold text-text">Onay Adımları</h3>
                <div className="space-y-4">
                  {detail.steps.map((st) => {
                    const isCurrent =
                      st.step === detail.request.step && detail.request.status === "pending";
                    const isPast = st.step < detail.request.step;
                    return (
                      <div
                        key={st.step}
                        className={`rounded-md border p-3 ${
                          isCurrent
                            ? "border-primary/50 bg-primary/5"
                            : isPast
                              ? "border-border bg-surface-secondary/20"
                              : "border-border/60 bg-surface"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                                isCurrent
                                  ? "bg-primary text-primary-text"
                                  : isPast
                                    ? "bg-emerald-600 text-white"
                                    : "bg-surface-secondary text-text-muted border border-border"
                              }`}
                            >
                              {isPast ? <Icons.check className="size-3.5" /> : st.step}
                            </span>
                            <span className="font-medium text-sm text-text">{st.name}</span>
                          </div>
                          <span className="text-xs text-text-muted">
                            {st.rule === "any"
                              ? "Herhangi biri onaylarsa"
                              : "Tüm onaylayanlar onaylamalı"}
                          </span>
                        </div>

                        {/* Approvers list */}
                        <div className="mt-2 space-y-1.5 pl-8">
                          {st.approvers.map((appr) => (
                            <div
                              key={appr.id}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-text font-medium">{appr.name}</span>
                              <span
                                className={`rounded px-1.5 py-0.5 font-medium ${
                                  appr.state === "approved"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : appr.state === "rejected"
                                      ? "bg-rose-100 text-rose-800"
                                      : appr.state === "delegated"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {appr.state === "approved"
                                  ? "Onaylandı"
                                  : appr.state === "rejected"
                                    ? "Reddedildi"
                                    : appr.state === "delegated"
                                      ? "Yetki Devredildi"
                                      : "Bekliyor"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* History Timeline */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h3 className="text-sm font-semibold text-text">Geçmiş Eylemler</h3>
                {detail.actions.length === 0 ? (
                  <p className="text-xs text-text-muted">Henüz bir eylem gerçekleştirilmedi.</p>
                ) : (
                  <div className="space-y-3 border-l-2 border-border pl-4 ml-2">
                    {detail.actions.map((act) => {
                      const meta = actionLabels[act.action] ?? {
                        label: act.action,
                        icon: "activity",
                      };
                      return (
                        <div key={act.id} className="relative text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text">{meta.label}</span>
                            <span className="text-text-muted">— {act.actor?.name ?? "Sistem"}</span>
                            <span className="text-text-muted/70">
                              {new Date(act.actedAt).toLocaleString("tr-TR")}
                            </span>
                          </div>
                          {act.target && (
                            <p className="text-text-muted">
                              Hedef:{" "}
                              <span className="text-text font-medium">{act.target.name}</span>
                            </p>
                          )}
                          {act.comment && (
                            <p className="rounded bg-surface-secondary/70 p-2 text-text italic">
                              "{act.comment}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        {detail && (detail.permissions.canDecide || detail.permissions.canRecall) && (
          <div className="border-t border-border bg-surface p-4 flex items-center justify-end gap-3">
            {detail.permissions.canRecall && (
              <Button
                variant="secondary"
                onPress={() => setRecallConfirmOpen(true)}
                isDisabled={submitting}
              >
                Geri Al
              </Button>
            )}
            {detail.permissions.canDecide && (
              <>
                <Button
                  variant="secondary"
                  onPress={() => setDelegateDialogOpen(true)}
                  isDisabled={submitting}
                >
                  Yetki Devret
                </Button>
                <Button
                  variant="danger"
                  onPress={() => {
                    setRejectComment("");
                    setRejectError(null);
                    setRejectDialogOpen(true);
                  }}
                  isDisabled={submitting}
                >
                  Reddet
                </Button>
                <Button
                  variant="primary"
                  onPress={() => {
                    setApproveComment("");
                    setApproveDialogOpen(true);
                  }}
                  isDisabled={submitting}
                >
                  Onayla
                </Button>
              </>
            )}
          </div>
        )}
      </section>

      {/* Approve Dialog (optional comment) */}
      <TopAlignedModal
        isOpen={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        isDismissable
        aria-labelledby="approve-modal-title"
      >
        <div className="p-6 space-y-4">
          <h3 id="approve-modal-title" className="text-lg font-semibold text-text">
            Onayı Onayla
          </h3>
          <p className="text-sm text-text-muted">
            Bu kaydı onaylamak üzeresiniz. İsteğe bağlı bir yorum ekleyebilirsiniz:
          </p>
          <TextArea
            label="Yorum (isteğe bağlı)"
            value={approveComment}
            onChange={setApproveComment}
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onPress={() => setApproveDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="primary" onPress={handleApprove} isDisabled={submitting}>
              {submitting ? "Onaylanıyor..." : "Onayla"}
            </Button>
          </div>
        </div>
      </TopAlignedModal>

      {/* Reject Dialog (comment required!) */}
      <TopAlignedModal
        isOpen={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        isDismissable
        aria-labelledby="reject-modal-title"
      >
        <div className="p-6 space-y-4">
          <h3 id="reject-modal-title" className="text-lg font-semibold text-danger">
            Talebi Reddet
          </h3>
          <p className="text-sm text-text-muted">
            Bu kaydı reddetmek için bir gerekçe belirtmeniz zorunludur:
          </p>
          <TextArea
            label="Reddetme Sebebi"
            value={rejectComment}
            onChange={(val) => {
              setRejectComment(val);
              if (rejectError) setRejectError(null);
            }}
            rows={3}
            isRequired
            isInvalid={Boolean(rejectError)}
            errorMessage={rejectError ?? undefined}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onPress={() => setRejectDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="danger" onPress={handleReject} isDisabled={submitting}>
              {submitting ? "Reddediliyor..." : "Reddet"}
            </Button>
          </div>
        </div>
      </TopAlignedModal>

      {/* Delegate User Dialog */}
      {delegateDialogOpen && (
        <SelectUserDialog
          title="Yetki Devret"
          searchLabel="Kullanıcı ara"
          searchPlaceholder="Kullanıcı ara..."
          selectedUserLabel="Seçilen kullanıcı"
          selectColumnLabel="Seç"
          columnUserName="Kullanıcı Adı"
          columnAvatarLabel="Avatar"
          columnRole="Rol"
          columnEmail="E-posta"
          columnProfile="Profil"
          cancelLabel="İptal"
          doneLabel="Yetki Devret"
          users={mappedUsers}
          selectedId=""
          onDone={handleDelegate}
          onCancel={() => setDelegateDialogOpen(false)}
        />
      )}
      {/* Recall Confirm Dialog */}
      <ConfirmDialog
        isOpen={recallConfirmOpen}
        onOpenChange={setRecallConfirmOpen}
        title="Onay Talebini Geri Al"
        message="Bu onay talebini geri almak istediğinizden emin misiniz?"
        confirmLabel="Geri Al"
        cancelLabel="İptal"
        tone="danger"
        busy={submitting}
        onConfirm={handleRecall}
      />
    </>
  );
}
