"use client";

import { isAppError } from "@crm/core/errors";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { UnexpectedApiError } from "@/lib/api/wire/errors";
import { loadInboxHttp } from "./http-loader";
import { InboxScreen } from "./inbox-screen";
import { type EmailFolder, emailFolders, type InboxViewModel } from "./view-model";

export type InboxLoader = (folder: EmailFolder) => Promise<InboxViewModel>;

type LoadState = {
  folder: EmailFolder;
  load: InboxLoader;
  status: "loading" | "error" | "denied" | "ready";
  model: InboxViewModel;
};

const emptyModel: InboxViewModel = { connected: true, conversations: [] };

export function InboxClient({ load = loadInboxHttp }: { load?: InboxLoader }) {
  const params = useSearchParams();
  const folder = emailFolders.find((item) => item.id === params.get("folder"))?.id ?? "inbox";
  const [state, setState] = useState<LoadState | null>(null);

  useEffect(() => {
    let live = true;
    setState((previous) => ({
      folder,
      load,
      status: "loading",
      model: previous?.model ?? emptyModel,
    }));
    async function fetchFolder() {
      try {
        const model = await load(folder);
        if (live) setState({ folder, load, status: "ready", model });
      } catch (error) {
        const denied =
          (isAppError(error) && error.code === "forbidden") ||
          (error instanceof UnexpectedApiError && error.status === 403);
        if (live)
          setState({ folder, load, status: denied ? "denied" : "error", model: emptyModel });
      }
    }
    void fetchFolder();
    return () => {
      live = false;
    };
  }, [folder, load]);

  const status = state?.folder === folder && state.load === load ? state.status : "loading";
  return (
    <InboxScreen
      model={state?.model ?? emptyModel}
      loadState={status === "ready" ? undefined : status}
      folderParam={params.get("folder")}
      messageParam={params.get("message")}
      onNavigate={(folder, messageId) => {
        const next = new URLSearchParams(params.toString());
        next.set("folder", folder);
        if (messageId) next.set("message", messageId);
        else next.delete("message");
        // Next integrates native history with useSearchParams; message selection stays local.
        window.history.pushState(null, "", `?${next.toString()}`);
      }}
    />
  );
}
