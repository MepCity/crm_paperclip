"use client";

import { useCallback, useEffect, useState } from "react";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { fetchApprovalCounts, fetchQueue } from "./api";
import { FilterCaret, FilterMenu } from "./filter-menu";
import { ItemDetailPanel } from "./item-detail-panel";
import type { ApprovalCounts, ApprovalListItem, MyJobsTabKey } from "./types";

interface MyJobsScreenProps {
  orgSlug: string;
}

const MODULE_OPTIONS = [
  { id: "", label: "Tüm Modüller" },
  { id: "Leads", label: "Müşteri Adayları" },
  { id: "Contacts", label: "Kişiler" },
  { id: "Accounts", label: "Firmalar" },
  { id: "Deals", label: "Satış Fırsatları" },
  { id: "Products", label: "Ürünler" },
  { id: "Quotes", label: "Teklifler" },
  { id: "Invoices", label: "Faturalar" },
  { id: "Tasks", label: "Görevler" },
  { id: "Meetings", label: "Toplantılar" },
  { id: "Calls", label: "Aramalar" },
  { id: "Campaigns", label: "Kampanyalar" },
  { id: "Cases", label: "Servis Dosyaları" },
  { id: "Solutions", label: "Çözümler" },
];

const REVIEW_STATUS_OPTIONS = [
  { id: "", label: "Tüm Durum" },
  { id: "waiting_review", label: "Gözden geçirme için bekliyor" },
  { id: "in_review", label: "İnceleme Sürüyor" },
  { id: "waiting_rereview", label: "Yeniden gözden geçirme için bekliyor" },
  { id: "rejected", label: "Reddedildi" },
];

export function MyJobsScreen({ orgSlug }: MyJobsScreenProps) {
  // Tabs: blueprint, approval, review, image_validation. Default is "review"
  const [activeTab, setActiveTab] = useState<MyJobsTabKey>("review");
  const [counts, setCounts] = useState<ApprovalCounts>({
    blueprint: 0,
    approval: 0,
    review: 0,
    image_validation: 0,
  });

  const [items, setItems] = useState<ApprovalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for Reviews tab
  const [statusFilter, setStatusFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false);

  // Detail panel selection
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetchApprovalCounts(orgSlug);
      setCounts(res);
    } catch {
      // Ignore count fetch errors
    }
  }, [orgSlug]);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchQueue(orgSlug, {
        type: activeTab,
        status: statusFilter || undefined,
        module: moduleFilter || undefined,
      });
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıtlar yüklenemedi.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [orgSlug, activeTab, statusFilter, moduleFilter]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleTabChange = (tab: MyJobsTabKey) => {
    setActiveTab(tab);
    setStatusFilter("");
    setModuleFilter("");
    setSelectedApprovalId(null);
  };

  const activeStatusLabel =
    REVIEW_STATUS_OPTIONS.find((o) => o.id === statusFilter)?.label ?? "Tüm Durum";
  const activeModuleLabel =
    MODULE_OPTIONS.find((o) => o.id === moduleFilter)?.label ?? "Tüm Modüller";

  const tabs: { key: MyJobsTabKey; label: string; count: number }[] = [
    { key: "blueprint", label: "Şema Geçişleri", count: counts.blueprint },
    { key: "approval", label: "onaylar", count: counts.approval },
    { key: "review", label: "İncelemeler", count: counts.review },
    { key: "image_validation", label: "Görüntü Doğrulamaları", count: counts.image_validation },
  ];
  const thCls = "px-3 h-[52px] whitespace-nowrap text-[15px] font-semibold text-text";
  const tdCls = "px-3 py-3 text-[15px]";
  const emptyRow = (cols: number, text: string) => (
    <tr>
      <td colSpan={cols} className="h-14 text-center text-[15px] font-normal text-[#7c8b9e]">
        {text}
      </td>
    </tr>
  );
  const loadingRow = (cols: number) => (
    <tr>
      <td colSpan={cols} className="py-6 text-center text-[15px] text-text-muted">
        Yükleniyor...
      </td>
    </tr>
  );
  const caretHead = (label: string) => (
    <th className={thCls}>
      <span className="inline-flex items-center gap-2">
        {label} <FilterCaret open={false} />
      </span>
    </th>
  );

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-surface" data-testid="my-jobs-screen">
      <div className="flex items-center justify-between border-b border-border bg-surface px-8 h-[50px] shrink-0">
        <div className="flex items-center gap-10 h-full" role="tablist">
          {tabs.map((t) => {
            const selected = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => handleTabChange(t.key)}
                className={`flex items-center gap-1.5 h-full whitespace-nowrap text-base border-b-2 -mb-px outline-none cursor-pointer ${
                  selected
                    ? "border-primary font-bold text-text"
                    : "border-transparent font-normal text-text hover:text-primary"
                }`}
              >
                <span>{t.label}</span>
                <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 text-sm font-normal text-text rounded-full border border-border">
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {activeTab === "review" && (
          <Link
            href={`/crm/${orgSlug}/tab/Approvals/history`}
            className="text-base font-normal text-primary hover:underline whitespace-nowrap"
          >
            Gözden Geçirme Günlükleri
          </Link>
        )}
      </div>

      <div className="flex-1 px-10 py-5 overflow-y-auto">
        {error && (
          <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-border bg-surface overflow-visible">
          {activeTab === "review" && (
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full text-left">
                <thead className="border-b border-border">
                  <tr>
                    <th className={thCls}>Kayıt Adı</th>
                    <th className={thCls}>Gözden Geçirilecek Alan Sayısı</th>
                    <th className={`${thCls} relative`}>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusDropdownOpen((v) => !v);
                          setModuleDropdownOpen(false);
                        }}
                        className="inline-flex items-center gap-2 whitespace-nowrap font-semibold text-text cursor-pointer"
                      >
                        <span>{activeStatusLabel}</span>
                        <FilterCaret open={statusDropdownOpen} />
                      </button>
                      {statusDropdownOpen && (
                        <FilterMenu
                          options={REVIEW_STATUS_OPTIONS}
                          value={statusFilter}
                          onSelect={(id) => {
                            setStatusFilter(id);
                            setStatusDropdownOpen(false);
                          }}
                        />
                      )}
                    </th>
                    <th className={thCls}>Oluşturan</th>
                    <th className={thCls}>Gönderme Tarihi</th>
                    <th className={thCls}>İşlem Adı</th>
                    <th className={`${thCls} relative`}>
                      <button
                        type="button"
                        onClick={() => {
                          setModuleDropdownOpen((v) => !v);
                          setStatusDropdownOpen(false);
                        }}
                        className="inline-flex items-center gap-2 whitespace-nowrap font-semibold text-text cursor-pointer"
                      >
                        <span>{activeModuleLabel}</span>
                        <FilterCaret open={moduleDropdownOpen} />
                      </button>
                      {moduleDropdownOpen && (
                        <FilterMenu
                          align="right"
                          options={MODULE_OPTIONS}
                          value={moduleFilter}
                          onSelect={(id) => {
                            setModuleFilter(id);
                            setModuleDropdownOpen(false);
                          }}
                        />
                      )}
                    </th>
                    <th className={`${thCls} text-right`}>Düzen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading
                    ? loadingRow(8)
                    : items.length === 0
                      ? emptyRow(8, "İnceleme Bekleyen Kayıt Yok")
                      : items.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedApprovalId(item.id)}
                            className="hover:bg-surface-secondary/40 cursor-pointer transition-colors"
                          >
                            <td className={`${tdCls} font-semibold text-text`}>
                              {item.recordLabel}
                            </td>
                            <td className={`${tdCls} text-text-muted`}>1</td>
                            <td className={tdCls}>
                              <span className="inline-flex rounded px-2 py-0.5 text-xs font-semibold bg-surface-secondary text-text">
                                {item.status}
                              </span>
                            </td>
                            <td className={`${tdCls} text-text-muted`}>{item.submitter.name}</td>
                            <td className={`${tdCls} text-text-muted`}>
                              {new Date(item.submittedAt).toLocaleDateString("tr-TR")}
                            </td>
                            <td className={`${tdCls} text-text`}>{item.processName}</td>
                            <td className={`${tdCls} text-text-muted`}>{item.module}</td>
                            <td className={`${tdCls} text-right text-text-muted`}>
                              <Icons.columns className="size-4 inline-block" />
                            </td>
                          </tr>
                        ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "approval" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-border">
                  <tr>
                    <th className={thCls}>Kayıt Adı</th>
                    <th className={thCls}>Modül</th>
                    <th className={thCls}>İşlem Adı</th>
                    <th className={thCls}>Adım</th>
                    <th className={thCls}>Gönderen</th>
                    <th className={thCls}>Gönderme Tarihi</th>
                    <th className={thCls}>Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading
                    ? loadingRow(7)
                    : items.length === 0
                      ? emptyRow(7, "Bekleyen onay yok")
                      : items.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedApprovalId(item.id)}
                            className="hover:bg-surface-secondary/40 cursor-pointer transition-colors"
                            data-testid={`approval-row-${item.id}`}
                          >
                            <td className={`${tdCls} font-semibold text-text`}>
                              {item.recordLabel}
                            </td>
                            <td className={`${tdCls} text-text-muted`}>{item.module}</td>
                            <td className={`${tdCls} text-text`}>{item.processName}</td>
                            <td className={`${tdCls} text-text-muted`}>
                              {item.step}. {item.stepName}
                            </td>
                            <td className={`${tdCls} text-text-muted`}>{item.submitter.name}</td>
                            <td className={`${tdCls} text-text-muted`}>
                              {new Date(item.submittedAt).toLocaleDateString("tr-TR")}
                            </td>
                            <td className={tdCls}>
                              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                                {item.status === "pending" ? "Bekliyor" : item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "blueprint" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-border">
                  <tr>
                    <th className={thCls}>Kayıt Adı</th>
                    {caretHead("Tüm Modüller")}
                    {caretHead("Tüm Sahipler")}
                    {caretHead("Tümü")}
                    <th className={thCls}>
                      <span className="inline-flex items-center gap-2">
                        Şema <Icons.sort className="size-3.5" />
                      </span>
                    </th>
                    <th className={thCls}>Eylemler</th>
                  </tr>
                </thead>
                <tbody>{emptyRow(6, "Bekleyen onay yok")}</tbody>
              </table>
            </div>
          )}

          {activeTab === "image_validation" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-border">
                  <tr>
                    <th className={thCls}>Kayıt Adı</th>
                    {caretHead("Tüm Modüller")}
                    <th className={thCls}>Oluşturan:</th>
                    <th className={thCls}>Hata Durumundaki Eylem</th>
                    <th className={thCls}>Bekleyen Resim Sayısı</th>
                  </tr>
                </thead>
                <tbody>{emptyRow(5, "Bekleyen onay yok")}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedApprovalId && (
        <ItemDetailPanel
          orgSlug={orgSlug}
          approvalId={selectedApprovalId}
          onClose={() => setSelectedApprovalId(null)}
          onDecided={() => {
            loadQueue();
            loadCounts();
            setSelectedApprovalId(null);
          }}
        />
      )}
    </div>
  );
}
