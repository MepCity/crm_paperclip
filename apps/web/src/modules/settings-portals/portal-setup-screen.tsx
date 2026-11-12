"use client";

import { Edit, ExternalLink, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Spinner } from "@/components/ui/spinner";
import { useUiTranslations } from "@/i18n/client-provider";
import {
  changeUserType,
  createPortal,
  createUserType,
  deletePortal,
  deleteUserType,
  disablePortalUser,
  enablePortalUser,
  fetchAuthEvents,
  fetchContacts,
  fetchMembers,
  fetchPortal,
  fetchPortalUsers,
  fetchUserTypes,
  invitePortalUser,
  reinvitePortalUser,
  sendResetToUser,
  updatePortal,
  updateUserType,
} from "./api";
import { ChangeUserTypeModal } from "./change-user-type-modal";
import { InviteUserModal } from "./invite-user-modal";
import { PortalConfigModal } from "./portal-config-modal";
import { PortalLanding } from "./portal-landing";
import type {
  ContactOption,
  MemberOption,
  Portal,
  PortalAuthEvent,
  PortalIdentity,
  PortalModules,
  PortalUserType,
  PortalUserTypeSettings,
} from "./types";
import { UserTypeModal } from "./user-type-modal";

interface PortalSetupScreenProps {
  orgSlug: string;
}

export function PortalSetupScreen({ orgSlug }: PortalSetupScreenProps) {
  const t = useUiTranslations();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portal, setPortal] = useState<Portal | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<"user-types" | "users" | "auth-events">("user-types");

  // Portal Data
  const [userTypes, setUserTypes] = useState<PortalUserType[]>([]);
  const [portalUsers, setPortalUsers] = useState<PortalIdentity[]>([]);
  const [authEvents, setAuthEvents] = useState<PortalAuthEvent[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);

  // Modals state
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [userTypeModalOpen, setUserTypeModalOpen] = useState(false);
  const [editingUserType, setEditingUserType] = useState<PortalUserType | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [changeTypeModalOpen, setChangeTypeModalOpen] = useState(false);
  const [changeTypeUser, setChangeTypeUser] = useState<PortalIdentity | null>(null);

  // Confirm delete states
  const [deletePortalConfirmOpen, setDeletePortalConfirmOpen] = useState(false);
  const [deletingPortal, setDeletingPortal] = useState(false);
  const [deleteUserTypeTarget, setDeleteUserTypeTarget] = useState<PortalUserType | null>(null);
  const [deletingUserType, setDeletingUserType] = useState(false);

  // Filters & search for portal users
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const port = await fetchPortal(orgSlug);
      setPortal(port);
      if (port) {
        const [types, users, events, cts, mems] = await Promise.all([
          fetchUserTypes(orgSlug),
          fetchPortalUsers(orgSlug),
          fetchAuthEvents(orgSlug),
          fetchContacts(orgSlug),
          fetchMembers(orgSlug),
        ]);
        setUserTypes(types);
        setPortalUsers(users);
        setAuthEvents(events);
        setContacts(cts);
        setMembers(mems);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load portal configuration.");
    } finally {
      setLoading(false);
    }
  }, [orgSlug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const handleSavePortal = async (data: {
    name: string;
    slug?: string;
    status?: "active" | "disabled";
    defaultLanguage?: "en" | "tr";
  }) => {
    if (portal) {
      const updated = await updatePortal(orgSlug, data);
      setPortal(updated);
    } else {
      if (!data.slug) return;
      const created = await createPortal(orgSlug, {
        name: data.name,
        slug: data.slug,
        defaultLanguage: data.defaultLanguage,
      });
      setPortal(created);
      await loadData();
    }
  };

  const handleDeletePortal = async () => {
    setDeletingPortal(true);
    try {
      await deletePortal(orgSlug);
      setPortal(null);
      setDeletePortalConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete portal.");
    } finally {
      setDeletingPortal(false);
    }
  };

  const handleSaveUserType = async (data: {
    name: string;
    modules: PortalModules;
    settings: PortalUserTypeSettings;
  }) => {
    if (editingUserType) {
      const updated = await updateUserType(orgSlug, editingUserType.id, data);
      setUserTypes((prev) => prev.map((ut) => (ut.id === updated.id ? updated : ut)));
    } else {
      const created = await createUserType(orgSlug, data);
      setUserTypes((prev) => [...prev, created]);
    }
  };

  const handleDeleteUserType = async () => {
    if (!deleteUserTypeTarget) return;
    setDeletingUserType(true);
    try {
      await deleteUserType(orgSlug, deleteUserTypeTarget.id);
      setUserTypes((prev) => prev.filter((ut) => ut.id !== deleteUserTypeTarget.id));
      setDeleteUserTypeTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user type.");
    } finally {
      setDeletingUserType(false);
    }
  };

  const handleInviteUser = async (data: { contactId: string; userTypeId: string }) => {
    const created = await invitePortalUser(orgSlug, data);
    setPortalUsers((prev) => [created, ...prev]);
  };

  const handleReinvite = async (id: string) => {
    const updated = await reinvitePortalUser(orgSlug, id);
    setPortalUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const handleSendReset = async (id: string) => {
    await sendResetToUser(orgSlug, id);
  };

  const handleDisableUser = async (id: string) => {
    const updated = await disablePortalUser(orgSlug, id);
    setPortalUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const handleEnableUser = async (id: string) => {
    const updated = await enablePortalUser(orgSlug, id);
    setPortalUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const handleChangeUserType = async (userTypeId: string) => {
    if (!changeTypeUser) return;
    const updated = await changeUserType(orgSlug, changeTypeUser.id, userTypeId);
    setPortalUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const handleOpenInvite = async () => {
    try {
      const cts = await fetchContacts(orgSlug);
      setContacts(cts);
    } catch {
      // ignore
    }
    setInviteModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  // Not configured state: show P1 Landing!
  if (!portal) {
    return (
      <>
        <PortalLanding onGetStarted={() => setPortalModalOpen(true)} />
        <PortalConfigModal
          isOpen={portalModalOpen}
          onClose={() => setPortalModalOpen(false)}
          onSave={handleSavePortal}
          initialData={null}
        />
      </>
    );
  }

  // Configured state: Portal Management dashboard
  const filteredUsers = portalUsers.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesStatus = userStatusFilter === "all" || u.status === userStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-6xl space-y-6" data-testid="portal-setup-screen">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onPress={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground">{portal.name}</h2>
              <Badge variant={portal.status === "active" ? "success" : "neutral"}>
                {portal.status === "active"
                  ? t("modules.portals.statusActive")
                  : t("modules.portals.statusDisabled")}
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t("modules.portals.publicUrl")}:</span>
              <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono text-foreground">
                /portal/{portal.slug}
              </code>
              <Link
                href={`/portal/${portal.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 ml-1"
                data-testid="open-portal-link"
              >
                <span>{t("modules.portals.openPortal")}</span>
                <ExternalLink className="size-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onPress={() => setPortalModalOpen(true)}
              data-testid="edit-portal-button"
            >
              <Icons.settings className="size-3.5 mr-1.5" />
              {t("modules.portals.editPortal")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => setDeletePortalConfirmOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid="delete-portal-button"
            >
              <Trash2 className="size-3.5 mr-1.5" />
              {t("modules.portals.deletePortal")}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("user-types")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "user-types"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-user-types"
          >
            {t("modules.portals.tabs.userTypes")} ({userTypes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-users"
          >
            {t("modules.portals.tabs.users")} ({portalUsers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("auth-events")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "auth-events"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-auth-events"
          >
            {t("modules.portals.tabs.authEvents")} ({authEvents.length})
          </button>
        </div>
      </div>

      {/* TAB 1: User Types */}
      {activeTab === "user-types" && (
        <div className="space-y-4" data-testid="user-types-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              {t("modules.portals.tabs.userTypes")}
            </h3>
            <Button
              variant="primary"
              size="sm"
              onPress={() => {
                setEditingUserType(null);
                setUserTypeModalOpen(true);
              }}
              data-testid="new-user-type-button"
            >
              <Icons.plus className="size-4 mr-1.5" />
              {t("modules.portals.newUserType")}
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-left text-sm" data-testid="user-types-table">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">{t("modules.portals.userTypeName")}</th>
                  <th className="px-4 py-3">{t("modules.portals.primaryModule")}</th>
                  <th className="px-4 py-3">{t("modules.portals.userCount")}</th>
                  <th className="px-4 py-3 text-right">{t("modules.portals.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {userTypes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      {t("modules.portals.noUserTypes")}
                    </td>
                  </tr>
                ) : (
                  userTypes.map((ut) => (
                    <tr key={ut.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-semibold text-foreground">{ut.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ut.primaryModule}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ut.identityCount}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onPress={() => {
                              setEditingUserType(ut);
                              setUserTypeModalOpen(true);
                            }}
                            data-testid={`edit-user-type-${ut.id}`}
                          >
                            <Edit className="size-3.5 mr-1" />
                            {t("modules.portals.actionEdit")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onPress={() => setDeleteUserTypeTarget(ut)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`delete-user-type-${ut.id}`}
                          >
                            <Trash2 className="size-3.5 mr-1" />
                            {t("modules.portals.deleteUserType")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Portal Users */}
      {activeTab === "users" && (
        <div className="space-y-4" data-testid="portal-users-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder={t("modules.portals.searchContacts")}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="px-3 py-1.5 border border-border rounded-md text-sm bg-background w-64"
                data-testid="user-search-input"
              />
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-border rounded-md text-sm bg-background"
                data-testid="user-status-filter"
              >
                <option value="all">Tümü</option>
                <option value="invited">{t("modules.portals.statusInvited")}</option>
                <option value="active">{t("modules.portals.statusActive")}</option>
                <option value="disabled">{t("modules.portals.statusDisabled")}</option>
              </select>
            </div>

            <Button
              variant="primary"
              size="sm"
              onPress={handleOpenInvite}
              isDisabled={userTypes.length === 0}
              data-testid="invite-user-button"
            >
              <Icons.plus className="size-4 mr-1.5" />
              {t("modules.portals.inviteUser")}
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-left text-sm" data-testid="portal-users-table">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">{t("modules.portals.identity")}</th>
                  <th className="px-4 py-3">{t("modules.portals.email")}</th>
                  <th className="px-4 py-3">{t("modules.portals.userTypeName")}</th>
                  <th className="px-4 py-3">{t("modules.portals.status")}</th>
                  <th className="px-4 py-3">{t("modules.portals.lastLogin")}</th>
                  <th className="px-4 py-3 text-right">{t("modules.portals.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      {t("modules.portals.noUsers")}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const uType = userTypes.find((ut) => ut.id === u.userTypeId);
                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-muted/20"
                        data-testid={`portal-user-row-${u.id}`}
                      >
                        <td className="px-4 py-3 font-semibold text-foreground">{u.displayName}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {u.email}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {uType?.name ?? u.userTypeId}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              u.status === "active"
                                ? "success"
                                : u.status === "invited"
                                  ? "warning"
                                  : "neutral"
                            }
                          >
                            {u.status === "active"
                              ? t("modules.portals.statusActive")
                              : u.status === "invited"
                                ? t("modules.portals.statusInvited")
                                : t("modules.portals.statusDisabled")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {u.status === "invited" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onPress={() => handleReinvite(u.id)}
                                data-testid={`reinvite-user-${u.id}`}
                              >
                                {t("modules.portals.reinvite")}
                              </Button>
                            )}

                            {u.status === "active" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onPress={() => handleSendReset(u.id)}
                                  data-testid={`reset-user-${u.id}`}
                                >
                                  {t("modules.portals.sendReset")}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onPress={() => handleDisableUser(u.id)}
                                  className="text-amber-600 hover:text-amber-700"
                                  data-testid={`disable-user-${u.id}`}
                                >
                                  {t("modules.portals.disable")}
                                </Button>
                              </>
                            )}

                            {u.status === "disabled" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onPress={() => handleEnableUser(u.id)}
                                className="text-emerald-600 hover:text-emerald-700"
                                data-testid={`enable-user-${u.id}`}
                              >
                                {t("modules.portals.enable")}
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onPress={() => {
                                setChangeTypeUser(u);
                                setChangeTypeModalOpen(true);
                              }}
                              data-testid={`change-type-user-${u.id}`}
                            >
                              {t("modules.portals.changeUserType")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Auth Events */}
      {activeTab === "auth-events" && (
        <div className="space-y-4" data-testid="auth-events-panel">
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-left text-sm" data-testid="auth-events-table">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">{t("modules.portals.eventKind")}</th>
                  <th className="px-4 py-3">{t("modules.portals.identity")}</th>
                  <th className="px-4 py-3">{t("modules.portals.timestamp")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {authEvents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                      {t("modules.portals.noEvents")}
                    </td>
                  </tr>
                ) : (
                  authEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                        {evt.kind}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {evt.identityId ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(evt.at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <PortalConfigModal
        isOpen={portalModalOpen}
        onClose={() => setPortalModalOpen(false)}
        onSave={handleSavePortal}
        initialData={portal}
      />

      <UserTypeModal
        isOpen={userTypeModalOpen}
        onClose={() => {
          setUserTypeModalOpen(false);
          setEditingUserType(null);
        }}
        onSave={handleSaveUserType}
        initialData={editingUserType}
        members={members}
      />

      <InviteUserModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInviteUser}
        contacts={contacts}
        userTypes={userTypes}
      />

      <ChangeUserTypeModal
        isOpen={changeTypeModalOpen}
        onClose={() => {
          setChangeTypeModalOpen(false);
          setChangeTypeUser(null);
        }}
        onSave={handleChangeUserType}
        user={changeTypeUser}
        userTypes={userTypes}
      />

      <ConfirmDialog
        isOpen={deletePortalConfirmOpen}
        onOpenChange={setDeletePortalConfirmOpen}
        title={t("modules.portals.deletePortal")}
        message={t("modules.portals.deleteConfirm")}
        confirmLabel={t("modules.portals.deletePortal")}
        cancelLabel={t("modules.portals.cancel")}
        tone="danger"
        busy={deletingPortal}
        onConfirm={handleDeletePortal}
      />

      <ConfirmDialog
        isOpen={!!deleteUserTypeTarget}
        onOpenChange={(open) => !open && setDeleteUserTypeTarget(null)}
        title={t("modules.portals.deleteUserType")}
        message={t("modules.portals.deleteUserTypeConfirm")}
        confirmLabel={t("modules.portals.deleteUserType")}
        cancelLabel={t("modules.portals.cancel")}
        tone="danger"
        busy={deletingUserType}
        onConfirm={handleDeleteUserType}
      />
    </div>
  );
}
