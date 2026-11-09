"use client";

import { useEffect, useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icons } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { useUiTranslations } from "@/i18n/client-provider";
import { regenerateKey } from "./api";
import { getHostedUrl, getIframeEmbedCode, getScriptEmbedCode } from "./embed-snippets";
import type { WebformModule, WebformStatus } from "./types";

function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

export interface WebformEmbedDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
  formId: string;
  formName: string;
  module: WebformModule;
  status: WebformStatus;
  publicKey?: string | null;
  isPublished: boolean;
  onKeyRegenerated?: (newKey: string) => void;
}

type EmbedTab = "script" | "iframe" | "url" | "source";

export function WebformEmbedDialog({
  isOpen,
  onOpenChange,
  orgSlug,
  formId,
  formName,
  module,
  status,
  publicKey,
  isPublished,
  onKeyRegenerated,
}: WebformEmbedDialogProps) {
  const t = useUiTranslations();
  const [activeTab, setActiveTab] = useState<EmbedTab>("script");
  const [currentKey, setCurrentKey] = useState<string>(publicKey ?? "");
  const [copied, setCopied] = useState(false);
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      setCurrentKey(publicKey);
    }
  }, [publicKey]);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const publicUrl = currentKey ? `${origin}/f/${currentKey}` : "";

  const scriptCode = publicUrl ? getScriptEmbedCode(publicUrl) : "";
  const iframeCode = publicUrl ? getIframeEmbedCode(publicUrl) : "";
  const hostedUrl = publicUrl ? getHostedUrl(publicUrl) : "";

  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handleRegenerateKey = async () => {
    try {
      setRegenerating(true);
      setError(null);
      const res = await regenerateKey(orgSlug, formId);
      setCurrentKey(res.publicKey);
      onKeyRegenerated?.(res.publicKey);
      setConfirmRegenerateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate key.");
    } finally {
      setRegenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <ModalOverlay
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
      >
        <Modal className="w-full max-w-2xl rounded-(--radius-create-menu) bg-surface p-6 shadow-lg outline-none">
          <AriaDialog className="outline-none flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Heading slot="title" className="text-lg font-semibold text-foreground">
                  {t("modules.webforms.embed.title", { name: formName })}
                </Heading>
                <Badge variant="neutral">{module}</Badge>
                <Badge variant={status === "active" ? "success" : "neutral"}>
                  {status.toUpperCase()}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0"
                onClick={() => onOpenChange(false)}
              >
                <Icons.close className="size-4" />
              </Button>
            </div>

            {!isPublished && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded text-xs text-warning flex items-center gap-2">
                <Icons.help className="size-4 shrink-0" />
                <span>{t("modules.webforms.embed.unpublishedNotice")}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
                {error}
              </div>
            )}

            {/* Tab Selectors */}
            <div className="flex items-center border-b border-border gap-1">
              <button
                type="button"
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === "script"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("script")}
                data-testid="embed-tab-script"
              >
                {t("modules.webforms.embed.scriptEmbed")}
              </button>
              <button
                type="button"
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === "iframe"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("iframe")}
                data-testid="embed-tab-iframe"
              >
                {t("modules.webforms.embed.iframe")}
              </button>
              <button
                type="button"
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === "url"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("url")}
                data-testid="embed-tab-url"
              >
                {t("modules.webforms.embed.hostedUrl")}
              </button>
              <button
                type="button"
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === "source"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground opacity-60"
                }`}
                onClick={() => setActiveTab("source")}
                data-testid="embed-tab-source"
              >
                {t("modules.webforms.embed.sourceHtml")}
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex flex-col gap-3 py-2">
              {activeTab === "script" && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t("modules.webforms.embed.scriptEmbedDesc")}
                  </span>
                  <div className="relative">
                    <pre
                      data-testid="embed-snippet-script"
                      className="p-3 bg-muted/30 rounded border border-border text-xs font-mono overflow-x-auto max-h-48 text-foreground select-all whitespace-pre-wrap"
                    >
                      {scriptCode || "/* No active public key. Please regenerate key below. */"}
                    </pre>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopy(scriptCode)}
                      isDisabled={!scriptCode}
                      data-testid="copy-script-button"
                    >
                      {copied ? (
                        t("modules.webforms.embed.copied")
                      ) : (
                        <>
                          <CopyIcon className="size-3.5 mr-1" />
                          {t("modules.webforms.embed.copyCode")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "iframe" && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t("modules.webforms.embed.iframeDesc")}
                  </span>
                  <div className="relative">
                    <pre
                      data-testid="embed-snippet-iframe"
                      className="p-3 bg-muted/30 rounded border border-border text-xs font-mono overflow-x-auto max-h-48 text-foreground select-all whitespace-pre-wrap"
                    >
                      {iframeCode || "/* No active public key. Please regenerate key below. */"}
                    </pre>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopy(iframeCode)}
                      isDisabled={!iframeCode}
                      data-testid="copy-iframe-button"
                    >
                      {copied ? (
                        t("modules.webforms.embed.copied")
                      ) : (
                        <>
                          <CopyIcon className="size-3.5 mr-1" />
                          {t("modules.webforms.embed.copyCode")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "url" && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t("modules.webforms.embed.hostedUrlDesc")}
                  </span>
                  <div className="p-3 bg-muted/30 rounded border border-border flex items-center justify-between gap-2">
                    <span
                      data-testid="embed-snippet-url"
                      className="text-xs font-mono text-foreground break-all select-all"
                    >
                      {hostedUrl || "No active public key. Please regenerate key below."}
                    </span>
                  </div>
                  <div className="flex justify-end items-center gap-2">
                    {hostedUrl && (
                      <a
                        href={hostedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {t("modules.webforms.embed.openInNewTab")}
                        <Icons.diagonalExpand className="size-3" />
                      </a>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopy(hostedUrl)}
                      isDisabled={!hostedUrl}
                      data-testid="copy-url-button"
                    >
                      {copied ? (
                        t("modules.webforms.embed.copied")
                      ) : (
                        <>
                          <CopyIcon className="size-3.5 mr-1" />
                          {t("modules.webforms.embed.copyUrl")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "source" && (
                <div className="flex flex-col gap-2 p-4 bg-muted/20 border border-border rounded text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {t("modules.webforms.embed.sourceHtml")}
                  </span>
                  <span>{t("modules.webforms.embed.sourceHtmlDisabled")}</span>
                </div>
              )}
            </div>

            {/* Key Security & Rotation Footer */}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  {t("modules.webforms.builder.publicKeySecurity")}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {t("modules.webforms.builder.publicKeyDesc")}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmRegenerateOpen(true)}
                isDisabled={regenerating}
                data-testid="regenerate-key-button"
              >
                {regenerating ? (
                  <Spinner className="size-4" />
                ) : (
                  t("modules.webforms.builder.regenerateKey")
                )}
              </Button>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                {t("modules.webforms.embed.close")}
              </Button>
            </div>
          </AriaDialog>
        </Modal>
      </ModalOverlay>

      {/* Confirm Regenerate Key Dialog */}
      <ConfirmDialog
        isOpen={confirmRegenerateOpen}
        onOpenChange={setConfirmRegenerateOpen}
        title={t("modules.webforms.builder.regenerateDialog.title")}
        message={t("modules.webforms.builder.regenerateDialog.message")}
        confirmLabel={t("modules.webforms.builder.regenerateDialog.confirm")}
        cancelLabel={t("common.actions.cancel")}
        tone="danger"
        busy={regenerating}
        onConfirm={handleRegenerateKey}
      />
    </>
  );
}
