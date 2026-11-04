"use client";

import "./chat.css";

import { type SVGProps, useCallback, useEffect, useRef, useState } from "react";
import type { CreateInvitationAction } from "@/components/members/invite-member-dialog";
import { Icons } from "@/components/ui/icon";
import { useUiTranslations } from "@/i18n/client-provider";
import { ContactList, ConversationList } from "./conversation-list";
import { ConversationView } from "./conversation-view";
import type { ChatConversation, ChatDataSource, PresenceStatus } from "./data";
import {
  ChatEmptyIllustration,
  ContactEmptyIllustration,
  PinEmptyIllustration,
  UnreadEmptyIllustration,
} from "./illustrations";
import { InvitePeopleDialog } from "./invite-people-dialog";
import { MemberPickerDialog, type PickerMode } from "./member-picker-dialog";

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
  const [openId, setOpenId] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerMode | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Follow the presence the data source reports (sync result or own change).
  const reportedPresence = dataSource.currentPresence?.status;
  useEffect(() => {
    if (reportedPresence) setPresence(reportedPresence);
  }, [reportedPresence]);

  // Reset tab and close menus when destination changes
  useEffect(() => {
    if (destination) {
      setOpenId(null);
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

  const needle = searchText.trim().toLowerCase();
  // Only Chats lists conversations in this feature; Channels, Threads and My Pins
  // stay empty states until their own issues land.
  const chatRows = dataSource.conversations
    .filter((c: ChatConversation) => destination === "chats" && c.kind !== "channel")
    .filter((c) => !needle || c.title.toLowerCase().includes(needle));
  const unreadRows = chatRows.filter((c) => c.unreadCount > 0);
  const visibleContacts = contacts.filter(
    (c) =>
      !needle ||
      c.name.toLowerCase().includes(needle) ||
      (c.email ?? "").toLowerCase().includes(needle),
  );
  const openConversation = openId
    ? dataSource.conversations.find((c) => c.id === openId)
    : undefined;
  const unreadTabCount = destination === "chats" ? (dataSource.counts?.chats ?? 0) : 0;

  async function openContact(userId: string) {
    try {
      const id = await dataSource.openDirect(userId);
      setOpenId(id);
      setSearchText("");
    } catch {
      /* the list stays; the user can retry */
    }
  }

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
            <button
              type="button"
              className="chat-header-btn"
              aria-label={t("chat.enlarge")}
              onClick={() => setMaximized((v) => !v)}
              data-testid="chat-maximize"
            >
              <Icons.diagonalExpand className="size-3.5" aria-hidden />
            </button>
            {/* Minimize / close (#7) */}
            <button
              type="button"
              className="chat-header-btn"
              aria-label={t("chat.minimize")}
              onClick={onClose}
              data-testid="chat-minimize"
            >
              <Icons.close className="size-3.5" aria-hidden />
            </button>
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

        {openConversation ? (
          <ConversationView
            dataSource={dataSource}
            conversation={openConversation}
            onBack={() => setOpenId(null)}
          />
        ) : (
          <>
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
              <button
                type="button"
                aria-label={t("chat.mentions")}
                className="chat-search-btn"
                data-testid="chat-mentions-btn"
              >
                <span className="text-sm font-semibold text-text-muted leading-none" aria-hidden>
                  @
                </span>
              </button>
              {/* Starred (#11) */}
              <button
                type="button"
                aria-label={t("chat.starred")}
                className="chat-search-btn"
                data-testid="chat-starred-btn"
              >
                <StarOutlineIcon className="size-4 text-text-muted" aria-hidden />
              </button>
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
                        className={`size-3.5 ${tab === "primary" ? "text-current" : "text-text-muted"}`}
                        aria-hidden
                      />
                    ) : (
                      <Icons.clock
                        className={`size-3.5 ${tab === "primary" ? "text-current" : "text-text-muted"}`}
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
                      className={`size-3 ${tab === "primary" ? "text-current" : "text-text-muted"}`}
                      aria-hidden
                    />
                  </button>

                  {/* Category dropdown menu for contacts */}
                  {showCategoryMenu && (
                    <div
                      className="chat-contact-categories-menu"
                      role="menu"
                      data-testid="chat-contact-categories"
                    >
                      {(["frequents", "recent"] as ContactCategory[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          role="menuitem"
                          className={`chat-category-menu-item${contactCategory === c ? " active" : ""}`}
                          onClick={() => {
                            setContactCategory(c);
                            setShowCategoryMenu(false);
                            setTab("primary");
                          }}
                          data-testid={`chat-category-${c}`}
                        >
                          {c === "frequents" ? (
                            <HeartIcon className="size-3.5" aria-hidden />
                          ) : (
                            <Icons.clock className="size-3.5" aria-hidden />
                          )}
                          <span className="flex-1 text-left">
                            {t(`chat.${c}` as Parameters<typeof t>[0])}
                          </span>
                          {contactCategory === c && (
                            <Icons.check className="size-3.5 text-[#1a73e8]" aria-hidden />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
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
                {unreadTabCount > 0 && (
                  <span className="chat-tab-badge ml-1" data-testid="chat-tab-unread-badge">
                    <span className="sr-only">
                      {t("chat.footerBadgeUnread", { count: unreadTabCount })}
                    </span>
                    <span aria-hidden="true">{unreadTabCount > 99 ? "99+" : unreadTabCount}</span>
                  </span>
                )}
              </button>
            </div>

            {/* === Body (#14 empty states) === */}
            <div className="chat-body" role="tabpanel">
              {tab === "unread" ? (
                unreadRows.length > 0 ? (
                  <ConversationList
                    conversations={unreadRows}
                    selfId={dataSource.selfId}
                    onOpen={setOpenId}
                  />
                ) : (
                  <div
                    className="chat-empty-state chat-empty-unread"
                    data-testid="chat-unread-empty"
                  >
                    <UnreadEmptyIllustration />
                    <p className="chat-empty-unread-text">{t("chat.emptyUnreadTitle")}</p>
                  </div>
                )
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
                  {destination === "chats" && chatRows.length > 0 && (
                    <ConversationList
                      conversations={chatRows}
                      selfId={dataSource.selfId}
                      onOpen={setOpenId}
                    />
                  )}
                  {destination === "chats" && chatRows.length === 0 && (
                    <div className="chat-empty-state chat-empty-chats">
                      <ChatEmptyIllustration />
                      <p className="chat-empty-description">{t("chat.emptyChatsDescription")}</p>
                    </div>
                  )}

                  {/* Contacts empty state */}
                  {destination === "contacts" && visibleContacts.length > 0 && (
                    <ContactList contacts={visibleContacts} onOpen={(id) => void openContact(id)} />
                  )}
                  {destination === "contacts" &&
                    visibleContacts.length === 0 &&
                    !showEmailInvite && (
                      <div
                        className="chat-empty-state chat-empty-contacts"
                        data-testid="chat-contacts-empty"
                      >
                        <ContactEmptyIllustration />
                        <p className="chat-empty-description">
                          {t("chat.emptyContactsDescription")}
                        </p>
                      </div>
                    )}

                  {/* My Pins empty state */}
                  {destination === "pins" && (
                    <div
                      className="chat-empty-state chat-empty-chats"
                      data-testid="chat-pins-empty"
                    >
                      <PinEmptyIllustration />
                      <p className="chat-empty-description">{t("chat.emptyPinsDescription")}</p>
                      {/* +Add Chats button (#17) */}
                      <button
                        type="button"
                        className="mt-4 rounded px-4 py-2 text-sm font-semibold text-accent-blue hover:bg-surface-hover outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        onClick={() => setPicker("direct")}
                        data-testid="chat-add-chats"
                      >
                        {t("chat.addChats")}
                      </button>
                    </div>
                  )}

                  {/* Channels empty state */}
                  {destination === "channels" && (
                    <div
                      className="chat-empty-state chat-empty-chats"
                      data-testid="chat-channels-empty"
                    >
                      <ChatEmptyIllustration />
                      <p className="chat-empty-description">{t("chat.emptyChannelsDescription")}</p>
                    </div>
                  )}

                  {/* Threads empty state */}
                  {destination === "threads" && (
                    <div
                      className="chat-empty-state chat-empty-chats"
                      data-testid="chat-threads-empty"
                    >
                      <ChatEmptyIllustration />
                      <p className="chat-empty-description">{t("chat.emptyThreadsDescription")}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quick Actions overlay & menu (#18–#28) */}
            {quickActionsOpen && (
              <div className="chat-quick-actions-overlay" data-testid="chat-quick-actions-overlay">
                <div
                  className="chat-quick-actions-backdrop"
                  onClick={() => setQuickActionsOpen(false)}
                  aria-hidden="true"
                />
                <div className="chat-quick-actions-card" data-testid="chat-quick-actions-menu">
                  <div className="chat-quick-actions-header">
                    <span className="chat-quick-actions-title">{t("chat.quickActions")}</span>
                  </div>
                  <div className="chat-quick-actions-list">
                    {/* 1. Send a Direct Message (#20) */}
                    <button
                      type="button"
                      className="chat-quick-action-item"
                      onClick={() => {
                        setPicker("direct");
                        setQuickActionsOpen(false);
                      }}
                      data-testid="chat-qa-direct"
                    >
                      <MessagePlusIcon className="size-4" aria-hidden />
                      <span>{t("chat.sendDirectMessage")}</span>
                    </button>
                    {/* 2. Start a Group Conversation (#21) */}
                    <button
                      type="button"
                      className="chat-quick-action-item"
                      onClick={() => {
                        setPicker("group");
                        setQuickActionsOpen(false);
                      }}
                      data-testid="chat-qa-group"
                    >
                      <Icons.users className="size-4" aria-hidden />
                      <span>{t("chat.startGroupConversation")}</span>
                    </button>
                    {/* 3. Invite People (#22) */}
                    <button
                      type="button"
                      className="chat-quick-action-item"
                      onClick={() => {
                        setQuickActionsOpen(false);
                        openInvite();
                      }}
                      data-testid="chat-qa-invite"
                    >
                      <Icons.userPlus className="size-4" aria-hidden />
                      <span>{t("chat.invitePeople")}</span>
                    </button>
                    {/* 4. Make a Call (#23) */}
                    <button
                      type="button"
                      className="chat-quick-action-item"
                      onClick={() => setQuickActionsOpen(false)}
                      data-testid="chat-qa-call"
                    >
                      <Icons.phone className="size-4" aria-hidden />
                      <span>{t("chat.makeCall")}</span>
                    </button>

                    {/* Notice banner (#24) */}
                    <div className="chat-quick-action-notice">
                      <span>{t("chat.accessNotice")}</span>
                      <svg
                        className="size-3"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        aria-hidden
                      >
                        <path d="M9 2h5v5M14 2 7.5 8.5M12 10v3.5H2.5V4H6" />
                      </svg>
                    </div>

                    {/* Lower items (#25–#28) */}
                    {/* 5. Create a Channel (#25) */}
                    <button
                      type="button"
                      className="chat-quick-action-item chat-quick-action-muted"
                      onClick={() => setQuickActionsOpen(false)}
                      data-testid="chat-qa-channel"
                    >
                      <HashIcon className="size-4" aria-hidden />
                      <span>{t("chat.createChannel")}</span>
                    </button>
                    {/* 6. Meet Now (#26) */}
                    <button
                      type="button"
                      className="chat-quick-action-item chat-quick-action-muted"
                      onClick={() => setQuickActionsOpen(false)}
                      data-testid="chat-qa-meet-now"
                    >
                      <VideoIcon className="size-4" aria-hidden />
                      <span>{t("chat.meetNow")}</span>
                    </button>
                    {/* 7. Schedule Meeting (#27) */}
                    <button
                      type="button"
                      className="chat-quick-action-item chat-quick-action-muted"
                      onClick={() => setQuickActionsOpen(false)}
                      data-testid="chat-qa-schedule-meeting"
                    >
                      <Icons.calendar className="size-4" aria-hidden />
                      <span>{t("chat.scheduleMeeting")}</span>
                    </button>
                    {/* 8. Schedule Live Event (#28) */}
                    <button
                      type="button"
                      className="chat-quick-action-item chat-quick-action-muted"
                      onClick={() => setQuickActionsOpen(false)}
                      data-testid="chat-qa-live-event"
                    >
                      <BroadcastIcon className="size-4" aria-hidden />
                      <span>{t("chat.scheduleLiveEvent")}</span>
                    </button>
                  </div>
                </div>
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
          </>
        )}
      </section>

      {picker && (
        <MemberPickerDialog
          mode={picker}
          directory={dataSource.directory}
          onClose={() => setPicker(null)}
          onSubmitDirect={async (userId) => {
            const id = await dataSource.openDirect(userId);
            setOpenId(id);
          }}
          onSubmitGroup={async (name, ids) => {
            const id = await dataSource.createGroup(name, ids);
            setOpenId(id);
          }}
        />
      )}

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

function VideoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      {...props}
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function BroadcastIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      {...props}
    >
      <path d="M4.93 19.07a10 10 0 0 1 0-14.14M19.07 4.93a10 10 0 0 1 0 14.14M7.76 16.24a6 6 0 0 1 0-8.48M16.24 7.76a6 6 0 0 1 0 8.48M12 12h.01" />
    </svg>
  );
}
