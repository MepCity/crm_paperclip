"use client";

import { useState } from "react";
import type { CreateInvitationAction } from "@/components/members/invite-member-dialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { useUiTranslations } from "@/i18n/client-provider";
import { type ChatDestination, ChatPanel } from "@/modules/chat/chat-panel";
import { EmptyChatDataSource } from "@/modules/chat/data";

/**
 * Bottom bar chat section with five entries plus the floating panel.
 * Mounts inside the app-shell footer; all chat code lives in modules/chat/.
 * Spec: ADR 0015 §7.1, controls #1–#3.
 * Refs: MEP-1419
 */
export function ChatBottomBar({
  user,
  inviteAction,
  canInvite = false,
  counts,
}: {
  user: { name: string; initials: string };
  inviteAction?: CreateInvitationAction;
  canInvite?: boolean;
  counts?: { chats?: number; channels?: number; threads?: number; pins?: number };
}) {
  const t = useUiTranslations();
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState<ChatDestination>("chats");

  // Empty data source (MEP-1420 will replace)
  const dataSource = new EmptyChatDataSource();
  dataSource.canInvite = canInvite;

  function handleEntry(d: ChatDestination) {
    if (open && destination === d) {
      // Toggle off same entry
      setOpen(false);
    } else {
      setDestination(d);
      setOpen(true);
    }
  }

  const entries: Array<{
    id: ChatDestination;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: "pins",
      label: t("chat.myPins"),
      icon: <Icons.pin className="size-4" aria-hidden />,
      badge: counts?.pins,
    },
    {
      id: "chats",
      label: t("chat.chats"),
      icon: <Icons.messageSquare className="size-4" aria-hidden />,
      badge: counts?.chats,
    },
    {
      id: "channels",
      label: t("chat.channels"),
      icon: <HashIcon className="size-4" aria-hidden />,
      badge: counts?.channels,
    },
    {
      id: "threads",
      label: t("chat.threads"),
      icon: <ThreadsIcon className="size-4" aria-hidden />,
      badge: counts?.threads,
    },
    {
      id: "contacts",
      label: t("chat.contacts"),
      icon: <Icons.users className="size-4" aria-hidden />,
    },
  ];

  return (
    <>
      {/* Five footer entries */}
      {entries.map((entry) => {
        const isActive = open && destination === entry.id;
        return (
          <Button
            key={entry.id}
            variant="ghost"
            size="compact"
            aria-pressed={isActive}
            aria-label={entry.label}
            onPress={() => handleEntry(entry.id)}
            className={`relative gap-1.5 ${isActive ? "text-text font-semibold bg-surface-hover" : ""}`}
            data-testid={`chat-footer-${entry.id}`}
          >
            {entry.icon}
            {entry.label}
            {/* Badge (#1–#3 count badges, hidden at 0) */}
            {!!entry.badge && entry.badge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white leading-none">
                <span className="sr-only">{entry.badge} unread</span>
                <span aria-hidden="true">{entry.badge > 99 ? "99+" : entry.badge}</span>
              </span>
            )}
          </Button>
        );
      })}

      {/* Chat panel overlay */}
      {open && (
        <ChatPanel
          destination={destination}
          user={user}
          dataSource={dataSource}
          inviteAction={inviteAction}
          onClose={() => setOpen(false)}
          onDestinationChange={setDestination}
        />
      )}
    </>
  );
}

/* ── Inline icon helpers ── */
function HashIcon(props: React.SVGProps<SVGSVGElement>) {
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

function ThreadsIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M9 10h6" />
      <path d="M9 14h4" />
    </svg>
  );
}
