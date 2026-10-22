"use client";

import { useSearchParams } from "next/navigation";
import { inboxFixture } from "./fixture";
import { InboxScreen } from "./inbox-screen";

export function InboxClient() {
  const params = useSearchParams();
  return (
    <InboxScreen
      model={inboxFixture}
      folderParam={params.get("folder")}
      messageParam={params.get("message")}
      onNavigate={(folder, messageId) => {
        const next = new URLSearchParams(params.toString());
        next.set("folder", folder);
        if (messageId) next.set("message", messageId);
        else next.delete("message");
        // Next integrates native history with useSearchParams; no mail or route fetch is needed.
        window.history.pushState(null, "", `?${next.toString()}`);
      }}
    />
  );
}
