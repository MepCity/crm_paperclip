"use client";

import "./chat.css";

import { type SVGProps, useCallback, useEffect, useRef, useState } from "react";
import type { CreateInvitationAction } from "@/components/members/invite-member-dialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { useUiTranslations } from "@/i18n/client-provider";
import type { ChatDataSource, PresenceStatus } from "./data";
import {
  ChatEmptyIllustration,
  ContactEmptyIllustration,
  PinEmptyIllustration,
  UnreadEmptyIllustration,
} from "./illustrations";
import { InvitePeopleDialog } from "./invite-people-dialog";

/** Active destination (footer entry). */
export type ChatDestination = "pins" | "chats" | "channels" | "threads" | "contacts";

/** Contact category for Contacts tab. */
export type ContactCategory = "frequents" | "recent";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ChatPanelProps {
  destination: ChatDestination;
  user: { name: string; initials: string };
  dataSource: ChatDataSource;
  inviteAction?: CreateInvitationAction;
  onClose(): void;
  onDestinationChange(d: ChatDestination): void;
}

/**
 * Chat panel shell — overlay above the lower-left content area.
 * Spec controls #4–#17, states: chat-shell, chat-chats, chat-unread,
 * chat-contacts, chat-pins, chat-quick-actions.
 * Refs: MEP-1419, ADR 0015 §7
 */
export function ChatPanel({
  destination,
  user,
  dataSource,
  inviteAction,
  onClose,
  onDestinationChange: _onDestinationChange,
}: ChatPanelProps) {
  const t = useUiTranslations();

  // Panel state
  const [maximized, setMaximized] = useState(false);
  const [tab, setTab] = useState<"primary" | "unread">("primary");
  const [contactCategory, setContactCategory] = useState<ContactCategory>("frequents");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [presenceMenuOpen, setPresenceMenuOpen] = useState(false);
  const [presence, setPresence] = useState<PresenceStatus>(
    dataSource.currentPresence?.status ?? "available",
  );
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Reset tab and close menus when destination changes
  useEffect(() => {
    if (destination) {
      setTab("primary");
      setSearchText("");
      setQuickActionsOpen(false);
      setShowCategoryMenu(false);
    }
  }, [destination]);

  // Ctrl+Space or Cmd+Space focuses the search box (#8)
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.code === "Space" || e.key === " ")) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const inviteTriggerRef = useRef<HTMLElement | null>(null);

  const openInvite = useCallback(
    (email?: string) => {
      if (!inviteAction) return;
      inviteTriggerRef.current = (document.activeElement as HTMLElement) ?? null;
      setInviteEmail(email);
      setShowInvite(true);
      setQuickActionsOpen(false);
    },
    [inviteAction],
  );

  const closeInvite = useCallback(() => {
    setShowInvite(false);
    setInviteEmail(undefined);
    requestAnimationFrame(() => {
      if (inviteTriggerRef.current && document.contains(inviteTriggerRef.current)) {
        inviteTriggerRef.current.focus();
      } else {
        const fab = document.querySelector<HTMLElement>('[data-testid="chat-quick-actions-fab"]');
        fab?.focus();
      }
    });
  }, []);

  function presenceLabel(s: PresenceStatus | null) {
    if (!s) return t("chat.available");
    return t(`chat.presence.${s}` as Parameters<typeof t>[0]);
  }

  function presenceDotClass(s: PresenceStatus | "offline" | null) {
    if (!s) return "chat-presence-offline";
    return `chat-presence-${s}`;
  }

  const contacts =
    contactCategory === "frequents" ? dataSource.frequentContacts : dataSource.recentContacts;

  const showEmailInvite =
    destination === "contacts" &&
    EMAIL_RE.test(searchText.trim()) &&
    dataSource.canInvite &&
    Boolean(inviteAction);

  const leftTabLabel = (() => {
    switch (destination) {
      case "chats":
        return t("chat.recent");
      case "contacts":
        return contactCategory === "frequents" ? t("chat.frequents") : t("chat.recent");
      case "pins":
        return t("chat.myPins");
      case "channels":
        return t("chat.channels");
      case "threads":
        return t("chat.threads");
    }
  })();

  const leftTabTestId = (() => {
    switch (destination) {
      case "chats":
        return "chat-tab-recent";
      case "contacts":
        return "chat-tab-frequents";
      case "pins":
        return "chat-tab-pins";
      case "channels":
        return "chat-tab-channels";
      case "threads":
        return "chat-tab-threads";
    }
  })();

  return (
    <>
      {/* Backdrop for maximized */}
      {maximized && (
        <div className="chat-panel-backdrop" aria-hidden onClick={() => setMaximized(false)} />
      )}

      <section
        className={`chat-panel${maximized ? " chat-panel-maximized" : ""}`}
        aria-label={t("chat.panelLabel")}
        data-testid="chat-panel"
      >
        {/* === Header === */}
        <div className="chat-header">
          {/* Avatar + identity (#4) */}
          <div className="chat-header-avatar" aria-hidden>
            {user.initials}
          </div>
          <div className="chat-header-identity">
            <div className="chat-header-name">{user.name}</div>
            {/* Presence (#5) */}
            <button
              type="button"
              className="chat-presence-row"
              aria-haspopup="true"
              aria-expanded={presenceMenuOpen}
              aria-label={t("chat.presenceMenu")}
              onClick={() => setPresenceMenuOpen((v) => !v)}
              data-testid="chat-presence-trigger"
            >
              <span className={`chat-presence-dot ${presenceDotClass(presence)}`} />
              <span className="text-[11px] text-text-muted leading-none">
                {presenceLabel(presence)}
              </span>
              <Icons.chevronDown className="size-3 text-text-muted" aria-hidden />
            </button>
          </div>

          <div className="chat-header-actions">
            {/* Enlarge (#6) */}
            <Button
              variant="icon"
              size="compact"
              aria-label={t("chat.enlarge")}
              onPress={() => setMaximized((v) => !v)}
              className="size-7"
              data-testid="chat-maximize"
            >
              <Icons.diagonalExpand className="size-4" aria-hidden />
            </Button>
            {/* Minimize / close (#7) */}
            <Button
              variant="icon"
              size="compact"
              aria-label={t("chat.minimize")}
              onPress={onClose}
              className="size-7"
              data-testid="chat-minimize"
            >
              <Icons.close className="size-4" aria-hidden />
            </Button>
          </div>

          {/* Presence menu */}
          {presenceMenuOpen && (
            <div
              className="absolute left-0 top-14 z-10 w-44 rounded-md border border-border bg-surface shadow-lg"
              role="menu"
              aria-label={t("chat.presenceMenu")}
              data-testid="chat-presence-menu"
            >
              {(["available", "busy", "away", "invisible"] as PresenceStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-hover outline-none focus:bg-surface-hover"
                  onClick={() => {
                    setPresence(s);
                    dataSource.setPresence(s);
                    setPresenceMenuOpen(false);
                  }}
                  data-testid={`chat-presence-${s}`}
                >
                  <span className={`chat-presence-dot ${presenceDotClass(s)}`} />
                  {presenceLabel(s)}
                  {presence === s && (
                    <Icons.check className="ml-auto size-3 text-accent-blue" aria-hidden />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* === Search row === */}
        <div className="chat-search-row">
          <div className="chat-search-field">
            <Icons.filterSearch className="chat-search-icon" aria-hidden />
            <input
              ref={searchRef}
              type="search"
              className="chat-search-input"
              placeholder={`${t("chat.search")} (Ctrl+Space)`}
              aria-label={t("chat.search")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              data-testid="chat-search"
            />
            {/* Advanced search (#9) inside search field */}
            <button
              type="button"
              className="chat-search-advanced"
              aria-label={t("chat.advancedSearch")}
              data-testid="chat-advanced-search-btn"
            >
              <Icons.settingsSliders
                className="size-3.5 text-text-muted hover:text-text"
                aria-hidden
              />
            </button>
          </div>
          {/* @Mentions (#10) */}
          <Button
            variant="icon"
            size="compact"
            aria-label={t("chat.mentions")}
            className="size-7"
            data-testid="chat-mentions-btn"
          >
            <span className="text-sm font-semibold text-text-muted leading-none" aria-hidden>
              @
            </span>
          </Button>
          {/* Starred (#11) */}
          <Button
            variant="icon"
            size="compact"
            aria-label={t("chat.starred")}
            className="size-7"
            data-testid="chat-starred-btn"
          >
            <StarOutlineIcon className="size-4 text-text-muted" aria-hidden />
          </Button>
        </div>

        {/* === Tabs (#12 / #13) === */}
        <div className="chat-tabs" role="tablist">
          {destination === "contacts" ? (
            <div className="relative flex flex-1 items-center">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "primary"}
                className={`chat-tab w-full${tab === "primary" ? " chat-tab-active pr-7" : ""}`}
                onClick={() => setTab("primary")}
                data-testid={leftTabTestId}
              >
                {contactCategory === "frequents" ? (
                  <HeartIcon
                    className={`size-3.5 ${tab === "primary" ? "text-white" : "text-text-muted"}`}
                    aria-hidden
                  />
                ) : (
                  <Icons.clock
                    className={`size-3.5 ${tab === "primary" ? "text-white" : "text-text-muted"}`}
                    aria-hidden
                  />
                )}
                {leftTabLabel}
              </button>
              <button
                type="button"
                className="absolute right-1 flex size-5 items-center justify-center rounded text-current hover:bg-black/10 outline-none"
                aria-label={t("chat.contactCategories")}
                aria-haspopup="true"
                aria-expanded={showCategoryMenu}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCategoryMenu((v) => !v);
                }}
                data-testid="chat-category-caret"
              >
                <Icons.chevronDown
                  className={`size-3 ${tab === "primary" ? "text-white" : "text-text-muted"}`}
                  aria-hidden
                />
              </button>
            </div>
          ) : (
            <button
              type="button"
              role="tab"
              aria-selected={tab === "primary"}
              className={`chat-tab${tab === "primary" ? " chat-tab-active" : ""}`}
              onClick={() => setTab("primary")}
              data-testid={leftTabTestId}
            >
              {leftTabLabel}
            </button>
          )}

          <button
            type="button"
            role="tab"
            aria-selected={tab === "unread"}
            className={`chat-tab${tab === "unread" ? " chat-tab-active" : ""}`}
            onClick={() => setTab("unread")}
            data-testid="chat-tab-unread"
          >
            {t("chat.unread")}
          </button>
        </div>

        {/* Category dropdown menu for contacts */}
        {showCategoryMenu && destination === "contacts" && (
          <div
            className="absolute left-2 top-24 z-10 w-40 rounded-md border border-border bg-surface shadow-lg"
            role="menu"
            data-testid="chat-contact-categories"
          >
            {(["frequents", "recent"] as ContactCategory[]).map((c) => (
              <button
                key={c}
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-hover outline-none"
                onClick={() => {
                  setContactCategory(c);
                  setShowCategoryMenu(false);
                  setTab("primary");
                }}
                data-testid={`chat-category-${c}`}
              >
                {c === "frequents" ? (
                  <HeartIcon className="size-4 text-text-muted" aria-hidden />
                ) : (
                  <Icons.clock className="size-4 text-text-muted" aria-hidden />
                )}
                {t(`chat.${c}` as Parameters<typeof t>[0])}
                {contactCategory === c && (
                  <Icons.check className="ml-auto size-3 text-accent-blue" aria-hidden />
                )}
              </button>
            ))}
          </div>
        )}

        {/* === Body (#14 empty states) === */}
        <div className="chat-body" role="tabpanel">
          {tab === "unread" ? (
            <div className="chat-empty-state" data-testid="chat-unread-empty">
              <UnreadEmptyIllustration />
              <p className="chat-empty-title">{t("chat.emptyUnreadTitle")}</p>
            </div>
          ) : (
            <>
              {/* Email invite row at top of contacts search */}
              {showEmailInvite && (
                <button
                  type="button"
                  className="chat-invite-row"
                  onClick={() => openInvite(searchText.trim())}
                  data-testid="chat-email-invite-row"
                >
                  <Icons.userPlus className="size-4" aria-hidden />
                  {t("chat.inviteEmail", { email: searchText.trim() })}
                </button>
              )}

              {/* Chats empty state */}
              {destination === "chats" && (
                <div className="chat-empty-state">
                  <ChatEmptyIllustration />
                  <p className="chat-empty-title">{t("chat.emptyChatsTitle")}</p>
                  <p className="chat-empty-description">{t("chat.emptyChatsDescription")}</p>
                </div>
              )}

              {/* Contacts empty state */}
              {destination === "contacts" && contacts.length === 0 && !showEmailInvite && (
                <div className="chat-empty-state" data-testid="chat-contacts-empty">
                  <ContactEmptyIllustration />
                  <p className="chat-empty-title">{t("chat.emptyContactsTitle")}</p>
                  <p className="chat-empty-description">{t("chat.emptyContactsDescription")}</p>
                </div>
              )}

              {/* My Pins empty state */}
              {destination === "pins" && (
                <div className="chat-empty-state" data-testid="chat-pins-empty">
                  <PinEmptyIllustration />
                  <p className="chat-empty-title">{t("chat.emptyPinsTitle")}</p>
                  <p className="chat-empty-description">{t("chat.emptyPinsDescription")}</p>
                  {/* +Add Chats button (#17) */}
                  <button
                    type="button"
                    className="mt-4 rounded px-4 py-2 text-sm font-semibold text-accent-blue hover:bg-surface-hover outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    onClick={() => dataSource.actions.startDirectMessage()}
                    data-testid="chat-add-chats"
                  >
                    {t("chat.addChats")}
                  </button>
                </div>
              )}

              {/* Channels empty state */}
              {destination === "channels" && (
                <div className="chat-empty-state" data-testid="chat-channels-empty">
                  <ChatEmptyIllustration />
                  <p className="chat-empty-title">{t("chat.emptyChannelsTitle")}</p>
                  <p className="chat-empty-description">{t("chat.emptyChannelsDescription")}</p>
                </div>
              )}

              {/* Threads empty state */}
              {destination === "threads" && (
                <div className="chat-empty-state" data-testid="chat-threads-empty">
                  <ChatEmptyIllustration />
                  <p className="chat-empty-title">{t("chat.emptyThreadsTitle")}</p>
                  <p className="chat-empty-description">{t("chat.emptyThreadsDescription")}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Actions menu (#18–#22, #25) */}
        {quickActionsOpen && (
          <div className="chat-quick-actions-menu" data-testid="chat-quick-actions-menu">
            <div className="chat-quick-actions-title">{t("chat.quickActions")}</div>
            {/* Send a Direct Message (#20) */}
            <button
              type="button"
              className="chat-quick-action-item"
              onClick={() => {
                dataSource.actions.startDirectMessage();
                setQuickActionsOpen(false);
              }}
              data-testid="chat-qa-direct"
            >
              <MessagePlusIcon className="size-4" aria-hidden />
              {t("chat.sendDirectMessage")}
            </button>
            {/* Start a Group Conversation (#21) */}
            <button
              type="button"
              className="chat-quick-action-item"
              onClick={() => {
                dataSource.actions.startGroupConversation();
                setQuickActionsOpen(false);
              }}
              data-testid="chat-qa-group"
            >
              <Icons.users className="size-4" aria-hidden />
              {t("chat.startGroupConversation")}
            </button>
            {/* Create a Channel (#25) */}
            <button
              type="button"
              className="chat-quick-action-item"
              onClick={() => {
                dataSource.actions.createChannel();
                setQuickActionsOpen(false);
              }}
              data-testid="chat-qa-channel"
            >
              <HashIcon className="size-4" aria-hidden />
              {t("chat.createChannel")}
            </button>
            {/* Invite People (#22) — only when user has invite permission and inviteAction exists */}
            {dataSource.canInvite && Boolean(inviteAction) && (
              <button
                type="button"
                className="chat-quick-action-item"
                onClick={() => openInvite()}
                data-testid="chat-qa-invite"
              >
                <Icons.userPlus className="size-4" aria-hidden />
                {t("chat.invitePeople")}
              </button>
            )}
          </div>
        )}

        {/* === Quick Actions FAB (#15) — + turns to X when menu is open === */}
        <button
          type="button"
          className="chat-quick-actions-fab"
          aria-label={quickActionsOpen ? t("chat.closeQuickActions") : t("chat.quickActions")}
          aria-expanded={quickActionsOpen}
          onClick={() => setQuickActionsOpen((v) => !v)}
          data-testid="chat-quick-actions-fab"
        >
          {quickActionsOpen ? (
            <Icons.close className="size-4" aria-hidden />
          ) : (
            <Icons.plus className="size-4" aria-hidden />
          )}
        </button>
      </section>

      {/* Invite dialog */}
      {showInvite && inviteAction && (
        <InvitePeopleDialog
          action={inviteAction}
          initialEmail={inviteEmail}
          isOpen={showInvite}
          onClose={closeInvite}
        />
      )}
    </>
  );
}

/* ── Inline icon helpers — original art, no reference assets ── */

function StarOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      {...props}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      {...props}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function MessagePlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      {...props}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="12" y1="9" x2="12" y2="15" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  );
}

function HashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      {...props}
    >
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}
