"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/components/ui/link";
import { fetchHistory, fetchHistoryMeta } from "./api";
import { FilterCaret, FilterMenu } from "./filter-menu";
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

  const filters: {
    key: string;
    label: string;
    open: boolean;
    setOpen: (v: boolean) => void;
    options: { id: string; label: string }[];
    value: string;
    onSelect: (id: string) => void;
  }[] = [
    {
      key: "module",
      label: activeModuleLabel,
      open: moduleOpen,
      setOpen: setModuleOpen,
      options: [
        { id: "", label: "Tüm Modüller" },
        ...meta.modules.map((m) => ({ id: m, label: m })),
      ],
      value: moduleFilter,
      onSelect: setModuleFilter,
    },
    {
      key: "user",
      label: activeUserLabel,
      open: userOpen,
      setOpen: setUserOpen,
      options: [
        { id: "", label: "Tüm Kullanıcılar" },
        ...meta.users.map((u) => ({ id: u.id, label: u.name })),
      ],
      value: userFilter,
      onSelect: setUserFilter,
    },
    {
      key: "action",
      label: activeActionLabel,
      open: actionOpen,
      setOpen: setActionOpen,
      options: [
        { id: "", label: "Tüm Eylemler" },
        ...meta.actions.map((a) => ({ id: a, label: ACTION_LABELS[a] ?? a })),
      ],
      value: actionFilter,
      onSelect: setActionFilter,
    },
    {
      key: "time",
      label: activeTimeLabel,
      open: timeOpen,
      setOpen: setTimeOpen,
      options: TIME_RANGES,
      value: timeFilter,
      onSelect: setTimeFilter,
    },
  ];
  const closeAll = () => {
    setModuleOpen(false);
    setUserOpen(false);
    setActionOpen(false);
    setTimeOpen(false);
  };

  return (
    <div className="flex flex-col gap-5 px-8 py-6" data-testid="review-logs-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-bold leading-tight text-text">Gözden Geçirme Geçmişi</h1>
        <Link
          href={`/crm/${orgSlug}/tab/Approvals`}
          className="text-base font-normal text-primary hover:underline"
        >
          Gözden geçirilecek kayıtlara dön
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {filters.map((f) => (
          <div key={f.key} className="relative">
            <button
              type="button"
              onClick={() => {
                const next = !f.open;
                closeAll();
                f.setOpen(next);
              }}
              className="inline-flex h-[34px] items-center gap-3 rounded-md border border-border bg-surface px-3 text-base font-normal text-text hover:bg-surface-secondary transition-colors"
            >
              <span>{f.label}</span>
              <FilterCaret open={f.open} />
            </button>
            {f.open && (
              <FilterMenu
                options={f.options}
                value={f.value}
                onSelect={(id) => {
                  f.onSelect(id);
                  closeAll();
                }}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-base text-text-muted">Yükleniyor...</div>
      ) : items.length === 0 ? (
        <div className="py-6 text-center text-base font-normal text-[#7c8b9e]">
          Görüntülenecek kayıt yok
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
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
                {items.map((item) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
