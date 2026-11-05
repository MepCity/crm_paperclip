"use client";

import { useCallback, useEffect, useState } from "react";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { fetchHistory, fetchHistoryMeta } from "./api";
import type { ApprovalHistoryItem, HistoryMeta } from "./types";

interface ReviewLogsScreenProps {
  orgSlug: string;
}

const ACTION_LABELS: Record<string, string> = {
  submitted: "Onaya Gönderildi",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  delegated: "Yetki Devredildi",
  recalled: "Geri Alındı",
  auto_approved: "Otomatik Onaylandı",
};

const TIME_RANGES = [
  { id: "", label: "Herhangi bir zaman" },
  { id: "today", label: "Bugün" },
  { id: "yesterday", label: "Dün" },
  { id: "last7", label: "Son 7 Gün" },
  { id: "last30", label: "Son 30 Gün" },
];

export function ReviewLogsScreen({ orgSlug }: ReviewLogsScreenProps) {
  const [meta, setMeta] = useState<HistoryMeta>({
    types: ["approval", "review"],
    actions: [],
    modules: [],
    users: [],
  });
  const [items, setItems] = useState<ApprovalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [moduleFilter, setModuleFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");

  const [moduleOpen, setModuleOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  useEffect(() => {
    fetchHistoryMeta(orgSlug, "review")
      .then(setMeta)
      .catch(() => {});
  }, [orgSlug]);

  const loadHistory = useCallback(async () => {
    const calculateDates = (rangeId: string) => {
      if (!rangeId) return { from: undefined, to: undefined };
      const now = new Date();
      if (rangeId === "today") {
        const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        return { from, to: now.toISOString() };
      }
      if (rangeId === "yesterday") {
        const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
        const to = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        return { from, to };
      }
      if (rangeId === "last7") {
        const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        return { from, to: now.toISOString() };
      }
      if (rangeId === "last30") {
        const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        return { from, to: now.toISOString() };
      }
      return { from: undefined, to: undefined };
    };

    try {
      setLoading(true);
      setError(null);
      const { from, to } = calculateDates(timeFilter);
      const res = await fetchHistory(orgSlug, {
        type: "review",
        module: moduleFilter || undefined,
        user: userFilter || undefined,
        action: actionFilter || undefined,
        from,
        to,
      });
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Geçmiş kayıtları yüklenemedi.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [orgSlug, timeFilter, moduleFilter, userFilter, actionFilter]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const activeModuleLabel = moduleFilter ? moduleFilter : "Tüm Modüller";
  const activeUserLabel = userFilter
    ? (meta.users.find((u) => u.id === userFilter)?.name ?? "Tüm Kullanıcılar")
    : "Tüm Kullanıcılar";
  const activeActionLabel = actionFilter
    ? (ACTION_LABELS[actionFilter] ?? actionFilter)
    : "Tüm Eylemler";
  const activeTimeLabel =
    TIME_RANGES.find((r) => r.id === timeFilter)?.label ?? "Herhangi bir zaman";

  return (
    <div className="flex flex-col gap-5 p-6" data-testid="review-logs-screen">
      {/* Title & Back Link */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-xl font-bold text-text">Gözden Geçirme Geçmişi</h1>
        <Link
          href={`/crm/${orgSlug}/tab/Approvals`}
          className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1.5"
        >
          <Icons.arrowLeft className="size-4" />
          <span>Gözden geçirilecek kayıtlara dön</span>
        </Link>
      </div>

      {/* Four Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Module Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setModuleOpen((v) => !v);
              setUserOpen(false);
              setActionOpen(false);
              setTimeOpen(false);
            }}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-xs hover:bg-surface-secondary transition-colors"
          >
            <span>{activeModuleLabel}</span>
            <Icons.chevronDown className={`size-3.5 ${moduleOpen ? "rotate-180" : ""}`} />
          </button>
          {moduleOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 max-h-60 w-48 overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-lg">
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
                Tüm Modüller
              </button>
              {meta.modules.map((mod) => (
                <button
                  key={mod}
                  type="button"
                  onClick={() => {
                    setModuleFilter(mod);
                    setModuleOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-xs ${
                    moduleFilter === mod
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-text hover:bg-surface-secondary"
                  }`}
                >
                  <span>{mod}</span>
                  {moduleFilter === mod && <Icons.check className="size-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setUserOpen((v) => !v);
              setModuleOpen(false);
              setActionOpen(false);
              setTimeOpen(false);
            }}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-xs hover:bg-surface-secondary transition-colors"
          >
            <span>{activeUserLabel}</span>
            <Icons.chevronDown className={`size-3.5 ${userOpen ? "rotate-180" : ""}`} />
          </button>
          {userOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 max-h-60 w-52 overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setUserFilter("");
                  setUserOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-xs ${
                  !userFilter
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-text hover:bg-surface-secondary"
                }`}
              >
                Tüm Kullanıcılar
              </button>
              {meta.users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setUserFilter(u.id);
                    setUserOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-xs ${
                    userFilter === u.id
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-text hover:bg-surface-secondary"
                  }`}
                >
                  <span>{u.name}</span>
                  {userFilter === u.id && <Icons.check className="size-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setActionOpen((v) => !v);
              setModuleOpen(false);
              setUserOpen(false);
              setTimeOpen(false);
            }}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-xs hover:bg-surface-secondary transition-colors"
          >
            <span>{activeActionLabel}</span>
            <Icons.chevronDown className={`size-3.5 ${actionOpen ? "rotate-180" : ""}`} />
          </button>
          {actionOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-52 rounded-md border border-border bg-surface p-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setActionFilter("");
                  setActionOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-xs ${
                  !actionFilter
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-text hover:bg-surface-secondary"
                }`}
              >
                Tüm Eylemler
              </button>
              {meta.actions.map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => {
                    setActionFilter(act);
                    setActionOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-xs ${
                    actionFilter === act
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-text hover:bg-surface-secondary"
                  }`}
                >
                  <span>{ACTION_LABELS[act] ?? act}</span>
                  {actionFilter === act && <Icons.check className="size-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setTimeOpen((v) => !v);
              setModuleOpen(false);
              setUserOpen(false);
              setActionOpen(false);
            }}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-xs hover:bg-surface-secondary transition-colors"
          >
            <span>{activeTimeLabel}</span>
            <Icons.chevronDown className={`size-3.5 ${timeOpen ? "rotate-180" : ""}`} />
          </button>
          {timeOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-44 rounded-md border border-border bg-surface p-1 shadow-lg">
              {TIME_RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setTimeFilter(r.id);
                    setTimeOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-xs ${
                    timeFilter === r.id
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-text hover:bg-surface-secondary"
                  }`}
                >
                  <span>{r.label}</span>
                  {timeFilter === r.id && <Icons.check className="size-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-lg border border-border bg-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-secondary/50 text-xs font-semibold text-text-muted">
              <tr>
                <th className="px-4 py-3">Kayıt Adı</th>
                <th className="px-4 py-3">Modül</th>
                <th className="px-4 py-3">İşlem Adı</th>
                <th className="px-4 py-3">Adım</th>
                <th className="px-4 py-3">Eylem</th>
                <th className="px-4 py-3">Kullanıcı</th>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Yorum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-text-muted">
                    <Icons.spinner className="mx-auto size-6 animate-spin mb-2" />
                    Yükleniyor...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-text-muted font-semibold">
                    Görüntülenecek kayıt yok
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text">{item.recordLabel}</td>
                    <td className="px-4 py-3 text-text-muted">{item.module}</td>
                    <td className="px-4 py-3 text-text">{item.processName}</td>
                    <td className="px-4 py-3 text-text-muted">Adım {item.step}</td>
                    <td className="px-4 py-3 font-semibold text-text">
                      {ACTION_LABELS[item.action] ?? item.action}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{item.actor?.name ?? "Sistem"}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {new Date(item.actedAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-text-muted italic">{item.comment || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
