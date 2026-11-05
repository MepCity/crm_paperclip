"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { fetchApprovalCounts, fetchQueue } from "./api";
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
  const [moduleSearchQuery, setModuleSearchQuery] = useState("");

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

  const filteredModules = useMemo(() => {
    const q = moduleSearchQuery.trim().toLowerCase();
    if (!q) return MODULE_OPTIONS;
    return MODULE_OPTIONS.filter(
      (m) => m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q),
    );
  }, [moduleSearchQuery]);

  const activeStatusLabel =
    REVIEW_STATUS_OPTIONS.find((o) => o.id === statusFilter)?.label ?? "Tüm Durum";
  const activeModuleLabel =
    MODULE_OPTIONS.find((o) => o.id === moduleFilter)?.label ?? "Tüm Modüller";

  return (
    <div className="flex flex-col gap-4 p-6" data-testid="my-jobs-screen">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">İşlerim</h1>
      </div>

      {/* Tab Strip */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-6" role="tablist">
          {/* Blueprint */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "blueprint"}
            onClick={() => handleTabChange("blueprint")}
            className={`flex items-center gap-2 pb-3 pt-1 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "blueprint"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <span>Şema Geçişleri</span>
            <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-text-muted">
              {counts.blueprint}
            </span>
          </button>

          {/* Onaylar (Capitalised per scope specification) */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "approval"}
            onClick={() => handleTabChange("approval")}
            className={`flex items-center gap-2 pb-3 pt-1 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "approval"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <span>Onaylar</span>
            <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-text-muted">
              {counts.approval}
            </span>
          </button>

          {/* İncelemeler (Selected by default) */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "review"}
            onClick={() => handleTabChange("review")}
            className={`flex items-center gap-2 pb-3 pt-1 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "review"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <span>İncelemeler</span>
            <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-text-muted">
              {counts.review}
            </span>
          </button>

          {/* Görüntü Doğrulamaları */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "image_validation"}
            onClick={() => handleTabChange("image_validation")}
            className={`flex items-center gap-2 pb-3 pt-1 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "image_validation"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <span>Görüntü Doğrulamaları</span>
            <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-text-muted">
              {counts.image_validation}
            </span>
          </button>
        </div>

        {/* Link: Gözden Geçirme Günlükleri */}
        <Link
          href={`/crm/${orgSlug}/tab/Approvals/history`}
          className="text-sm font-medium text-primary hover:underline pb-3 pt-1 inline-flex items-center gap-1"
        >
          <span>Gözden Geçirme Günlükleri</span>
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-lg border border-border bg-surface shadow-xs overflow-visible">
        {/* TAB: İNCELEMELER (Reviews) */}
        {activeTab === "review" && (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-secondary/50 text-xs font-semibold text-text-muted">
                <tr>
                  <th className="px-4 py-3">Kayıt Adı</th>
                  <th className="px-4 py-3">Gözden Geçirilecek Alan Sayısı</th>
                  {/* Status dropdown filter */}
                  <th className="px-4 py-3 relative">
                    <button
                      type="button"
                      onClick={() => {
                        setStatusDropdownOpen((v) => !v);
                        setModuleDropdownOpen(false);
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-text hover:text-primary transition-colors cursor-pointer"
                    >
                      <span>{activeStatusLabel}</span>
                      <Icons.chevronDown
                        className={`size-3 transition-transform ${statusDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {statusDropdownOpen && (
                      <div className="absolute left-4 top-full z-30 mt-1 w-56 rounded-md border border-border bg-surface p-1 shadow-lg">
                        {REVIEW_STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setStatusFilter(opt.id);
                              setStatusDropdownOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded px-3 py-2 text-xs transition-colors ${
                              statusFilter === opt.id
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-text hover:bg-surface-secondary"
                            }`}
                          >
                            <span>{opt.label}</span>
                            {statusFilter === opt.id && <Icons.check className="size-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </th>
                  <th className="px-4 py-3">Oluşturan</th>
                  <th className="px-4 py-3">Gönderme Tarihi</th>
                  <th className="px-4 py-3">İşlem Adı</th>
                  {/* Module dropdown filter */}
                  <th className="px-4 py-3 relative">
                    <button
                      type="button"
                      onClick={() => {
                        setModuleDropdownOpen((v) => !v);
                        setStatusDropdownOpen(false);
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-text hover:text-primary transition-colors cursor-pointer"
                    >
                      <span>{activeModuleLabel}</span>
                      <Icons.chevronDown
                        className={`size-3 transition-transform ${moduleDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {moduleDropdownOpen && (
                      <div className="absolute right-4 top-full z-30 mt-1 w-64 rounded-md border border-border bg-surface p-2 shadow-lg space-y-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Modüllerde ara..."
                            value={moduleSearchQuery}
                            onChange={(e) => setModuleSearchQuery(e.target.value)}
                            className="w-full rounded border border-border px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted outline-hidden focus:border-primary"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-0.5">
                          {filteredModules.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setModuleFilter(m.id);
                                setModuleDropdownOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-xs transition-colors ${
                                moduleFilter === m.id
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-text hover:bg-surface-secondary"
                              }`}
                            >
                              <span>{m.label}</span>
                              {moduleFilter === m.id && <Icons.check className="size-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </th>
                  <th className="px-4 py-3 text-right">Düzen</th>
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
                    <td colSpan={8} className="py-20 text-center text-text-muted font-medium">
                      İnceleme Bekleyen Kayıt Yok
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedApprovalId(item.id)}
                      className="hover:bg-surface-secondary/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-text">{item.recordLabel}</td>
                      <td className="px-4 py-3 text-text-muted">1</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-surface-secondary text-text">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{item.submitter.name}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {new Date(item.submittedAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-3 text-text">{item.processName}</td>
                      <td className="px-4 py-3 text-text-muted">{item.module}</td>
                      <td className="px-4 py-3 text-right text-text-muted">
                        <Icons.columns className="size-4 inline-block" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: ONAYLAR (Approvals) */}
        {activeTab === "approval" && (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-secondary/50 text-xs font-semibold text-text-muted">
                <tr>
                  <th className="px-4 py-3">Kayıt Adı</th>
                  <th className="px-4 py-3">Modül</th>
                  <th className="px-4 py-3">İşlem Adı</th>
                  <th className="px-4 py-3">Adım</th>
                  <th className="px-4 py-3">Gönderen</th>
                  <th className="px-4 py-3">Gönderme Tarihi</th>
                  <th className="px-4 py-3">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-text-muted">
                      <Icons.spinner className="mx-auto size-6 animate-spin mb-2" />
                      Yükleniyor...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-text-muted font-medium">
                      Bekleyen onay yok
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedApprovalId(item.id)}
                      className="hover:bg-surface-secondary/40 cursor-pointer transition-colors"
                      data-testid={`approval-row-${item.id}`}
                    >
                      <td className="px-4 py-3 font-semibold text-text">{item.recordLabel}</td>
                      <td className="px-4 py-3 text-text-muted">{item.module}</td>
                      <td className="px-4 py-3 text-text">{item.processName}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {item.step}. {item.stepName}
                      </td>
                      <td className="px-4 py-3 text-text-muted">{item.submitter.name}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {new Date(item.submittedAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          {item.status === "pending" ? "Bekliyor" : item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: ŞEMA GEÇİŞLERİ (Blueprint) */}
        {activeTab === "blueprint" && (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-secondary/50 text-xs font-semibold text-text-muted">
                <tr>
                  <th className="px-4 py-3">Kayıt Adı</th>
                  <th className="px-4 py-3">Tüm Modüller ▾</th>
                  <th className="px-4 py-3">Tüm Sahipler ▾</th>
                  <th className="px-4 py-3">Tümü ▾</th>
                  <th className="px-4 py-3">Şema</th>
                  <th className="px-4 py-3">Eylemler</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="py-20 text-center text-text-muted font-medium">
                    Bekleyen onay yok
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: GÖRÜNTÜ DOĞRULAMALARI (Image validations) */}
        {activeTab === "image_validation" && (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-secondary/50 text-xs font-semibold text-text-muted">
                <tr>
                  <th className="px-4 py-3">Kayıt Adı</th>
                  <th className="px-4 py-3">Tüm Modüller ▾</th>
                  <th className="px-4 py-3">Oluşturan:</th>
                  <th className="px-4 py-3">Hata Durumundaki Eylem</th>
                  <th className="px-4 py-3">Bekleyen Resim Sayısı</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="py-20 text-center text-text-muted font-medium">
                    Bekleyen onay yok
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Detail Panel */}
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
