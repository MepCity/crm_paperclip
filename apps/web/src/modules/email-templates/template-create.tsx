"use client";

import { Code, Image, Link, Quote, Table } from "lucide-react";
import { useId, useRef, useState } from "react";
import {
  applyNoteEditorCommand,
  saveSelection,
} from "@/components/records/notes/note-editor-commands";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUiTranslations } from "@/i18n/client-provider";
import { useMetadataDisplayAdapter } from "@/i18n/metadata-adapter";

const categories = [
  "all",
  "basic",
  "celebration",
  "invitation",
  "followUp",
  "productPromotion",
  "notification",
] as const;
const layouts = [
  "blank",
  "singleColumn",
  "twoColumns",
  "twoColumnsImage1",
  "twoColumnsImage2",
  "threeColumns",
] as const;

/** Only the module → gallery → HTML editor transition was observed (L05–L11). */
export function TemplateCreate({
  modules,
  onClose,
}: {
  modules: readonly string[];
  onClose: () => void;
}) {
  const t = useUiTranslations();
  const display = useMetadataDisplayAdapter();
  const titleId = useId();
  const [step, setStep] = useState<"module" | "gallery" | "editor">("module");
  const [module, setModule] = useState("Leads");
  const [category, setCategory] = useState<(typeof categories)[number]>("all");
  return (
    <TopAlignedModal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      aria-labelledby={titleId}
      panelStyle={
        step === "module"
          ? { width: "min(560px, 95vw)" }
          : {
              width: "100vw",
              top: step === "gallery" ? "var(--size-topbar-height)" : 0,
              height: step === "gallery" ? "calc(100dvh - var(--size-topbar-height))" : "100dvh",
              overflow: "auto",
            }
      }
    >
      {step === "module" ? (
        <div className="p-8 space-y-6">
          <h2 id={titleId} className="text-xl font-semibold">
            {t("modules.observedFlows.createEmailTemplate")}
          </h2>
          <div className="flex items-center gap-5">
            <span>{t("modules.observedFlows.module")}</span>
            <div className="w-64">
              <Select
                label={t("modules.observedFlows.selectModule")}
                hideLabel
                items={modules.filter((m) => m !== "All Modules").map((id) => ({ id }))}
                value={module}
                onChange={(key) => setModule(String(key))}
              >
                {(item) => <SelectItem id={item.id}>{display.getModulePlural(item.id)}</SelectItem>}
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onPress={onClose}>
              {t("modules.observedFlows.cancel")}
            </Button>
            <Button onPress={() => setStep("gallery")}>{t("modules.observedFlows.next")}</Button>
          </div>
        </div>
      ) : step === "gallery" ? (
        <div className="min-h-full bg-surface">
          <header className="flex items-center gap-6 border-b border-border p-6">
            <Button
              variant="icon"
              aria-label={t("modules.observedFlows.back")}
              onPress={() => setStep("module")}
            >
              <Icons.chevronLeft className="size-5" />
            </Button>
            <h2 id={titleId} className="text-xl font-semibold">
              {t("modules.observedFlows.templateGallery")}
            </h2>
            <span>{module}</span>
            <Button variant="secondary" className="ml-auto" onPress={() => setStep("editor")}>
              {t("modules.observedFlows.addHTMLPlainText")}
            </Button>
          </header>
          <div className="flex min-h-screen">
            <nav
              aria-label={t("modules.observedFlows.galleryCategories")}
              className="w-64 shrink-0 border-r border-border bg-bg p-8 space-y-2"
            >
              {categories.map((item) => (
                <Button
                  key={item}
                  variant="ghost"
                  className="w-full justify-start"
                  aria-pressed={item === category}
                  onPress={() => setCategory(item)}
                >
                  {t(`modules.observedFlows.galleryCategoriesLabels.${item}`)}
                </Button>
              ))}
            </nav>
            <div className="flex-1 p-10">
              <h3 className="mb-6 flex items-center gap-2 font-semibold">
                {t(
                  `modules.observedFlows.galleryCategoriesLabels.${category === "all" ? "basic" : category}`,
                )}{" "}
                {(category === "all" || category === "basic") && (
                  <span className="inline-flex min-w-6 items-center justify-center rounded bg-surface-muted px-2 py-0.5 text-sm font-normal text-text-muted">
                    6
                  </span>
                )}
              </h3>
              {(category === "all" || category === "basic") && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
                  {layouts.map((layout, index) => (
                    <div key={layout} className="text-center">
                      <div className="h-64 rounded-lg border border-border p-3">
                        {index > 0 && (
                          <div aria-hidden className="h-full bg-surface-muted p-3">
                            <div className="h-24 bg-border" />
                            <div className="mt-5 space-y-2">
                              {[1, 2, 3, 4, 5].map((line) => (
                                <div key={line} className="h-1 bg-border" />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="mt-4 text-text-muted">
                        {t(`modules.observedFlows.galleryLayouts.${layout}`)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <TemplateEditor titleId={titleId} module={module} onClose={onClose} />
      )}
    </TopAlignedModal>
  );
}

function TemplateEditor({
  titleId,
  module,
  onClose,
}: {
  titleId: string;
  module: string;
  onClose: () => void;
}) {
  const t = useUiTranslations();
  const [plain, setPlain] = useState(false);
  const [body, setBody] = useState("");
  const editor = useRef<HTMLDivElement>(null);
  const range = useRef<Range | null>(null);
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <h2 id={titleId} className="sr-only">
        {t("modules.observedFlows.emailTemplateEditor")}
      </h2>
      <header className="flex items-center gap-4 bg-rail-surface text-rail-item-active-text p-5">
        <Icons.file className="size-8" aria-hidden />
        <div className="w-96 space-y-1 [&_input]:border-transparent [&_input]:bg-transparent [&_input]:text-rail-item-active-text">
          <TextField
            label={t("modules.observedFlows.templateName")}
            hideLabel
            placeholder={t("modules.observedFlows.enterATemplateName")}
          />
          <TextField
            label={t("modules.observedFlows.templateSubject")}
            hideLabel
            placeholder={t("modules.observedFlows.enterTemplateSubject")}
          />
        </div>
        <span className="rounded bg-surface/20 px-2">{module}</span>
        <div className="ml-auto flex items-center gap-3">
          <Button variant="ghost" isDisabled>
            {t("modules.observedFlows.attachments")}
          </Button>
          <Button variant="secondary" onPress={onClose}>
            {t("modules.observedFlows.cancel")}
          </Button>
          <Button variant="secondary" isDisabled>
            {t("modules.observedFlows.preview")}
          </Button>
          <MenuTrigger>
            <Button>
              {t("modules.observedFlows.save")}
              <Icons.chevronDown className="ml-2 size-3" />
            </Button>
            <Menu aria-label={t("modules.observedFlows.saveTemplate")}>
              <MenuItem id="save" isDisabled>
                {t("modules.observedFlows.saveNow")}
              </MenuItem>
              <MenuItem id="draft" isDisabled>
                {t("modules.observedFlows.saveAsDraft")}
              </MenuItem>
            </Menu>
          </MenuTrigger>
        </div>
      </header>
      <div className="relative mx-auto w-3/5">
        <div
          role="toolbar"
          aria-label={t("modules.observedFlows.templateFormatting")}
          className="flex flex-wrap items-center gap-2 border border-border bg-surface-muted p-2"
        >
          <span className="px-3">{t("modules.observedFlows.verdana")}</span>
          <span className="px-2">10⌄</span>
          {(
            [
              ["Bold", "B", "bold"],
              ["Italic", "I", "italic"],
              ["Underline", "U", "underline"],
              ["Strikethrough", "S", "strikeThrough"],
              ["Align left", "≡", "justifyLeft"],
              ["Center", "≡", "justifyCenter"],
              ["Numbered list", "1.", "insertOrderedList"],
              ["Bulleted list", "•", "insertUnorderedList"],
            ] as const
          ).map(([label, text, command]) => (
            <Button
              key={label}
              variant="ghost"
              size="compact"
              aria-label={label}
              isDisabled={command.startsWith("justify")}
              onPress={() => {
                if (editor.current)
                  applyNoteEditorCommand(
                    editor.current,
                    command,
                    undefined,
                    undefined,
                    range.current,
                  );
              }}
            >
              {text}
            </Button>
          ))}
          {[
            { label: t("modules.observedFlows.link"), icon: Link },
            { label: t("modules.observedFlows.image"), icon: Image },
            { label: t("modules.observedFlows.table"), icon: Table },
            { label: t("modules.observedFlows.source"), icon: Code },
            { label: t("modules.observedFlows.quote"), icon: Quote },
          ].map(({ label, icon: Icon }) => (
            <Button key={label} aria-label={label} variant="ghost" size="compact" isDisabled>
              <Icon className="size-4" aria-hidden />
            </Button>
          ))}
          <div className="absolute left-full top-0 ml-4 flex items-center whitespace-nowrap">
            <Button variant="ghost" aria-pressed={plain} onPress={() => setPlain(!plain)}>
              {t(plain ? "modules.observedFlows.html" : "modules.observedFlows.plainText")}
            </Button>
            <span aria-hidden>|</span>
            <Button variant="ghost" isDisabled className="data-disabled:opacity-100!">
              {t("modules.observedFlows.showTips")}
            </Button>
          </div>
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: Rich-text editing requires contenteditable. */}
        <div
          role="textbox"
          aria-label={t("modules.observedFlows.templateBody")}
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          tabIndex={0}
          onInput={(event) => setBody(event.currentTarget.textContent ?? "")}
          onBlur={() => {
            if (editor.current) range.current = saveSelection(editor.current);
          }}
          onPaste={(event) => {
            event.preventDefault();
            if (editor.current)
              applyNoteEditorCommand(
                editor.current,
                "insertText",
                undefined,
                event.clipboardData.getData("text/plain"),
                range.current,
              );
          }}
          className="mt-4 min-h-[65vh] border border-border bg-surface p-5 shadow-sm outline-none focus:ring-2 focus:ring-primary"
          ref={(node) => {
            editor.current = node;
            if (node && !node.hasChildNodes()) node.textContent = body;
          }}
        />
      </div>
      <p className="mt-auto bg-accent-yellow/10 p-3 text-center text-text-muted">
        {t("modules.observedFlows.typeToInsertAMergeField")}
      </p>
    </div>
  );
}
