"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Form } from "@/components/ui/form";
import { Select, SelectItem } from "@/components/ui/select";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUiTranslations } from "@/i18n/client-provider";
import { resolveAllowedType } from "../../../../../../packages/core/src/attachments/file-policy";
import { parseRecipientList } from "../../../../../../packages/core/src/mail/recipient-list";
import { browserComposeOrg, createHttpComposePort } from "./http-port";
import {
  type ComposeMailbox,
  type ComposeMailInput,
  composeAttachmentByteLimit,
  fixtureComposePort,
  type MailComposePort,
} from "./port";

const recipientFields = ["To", "Cc", "Bcc"] as const;

export function MailCompose({
  mailboxes,
  port,
  initialTo = "",
  onClose,
  onSent,
}: {
  mailboxes: readonly ComposeMailbox[];
  port?: MailComposePort;
  initialTo?: string;
  onClose: () => void;
  onSent: (result: { id: string }) => void;
}) {
  const t = useUiTranslations();
  const titleId = useId();
  const orgSlug = browserComposeOrg();
  // Existing app mounts pass the fixture; organization routes use the HTTP default.
  // Explicit custom ports and demos outside the app retain their injected behavior.
  const sendPort =
    (!port || port === fixtureComposePort) && orgSlug
      ? createHttpComposePort(orgSlug)
      : (port ?? fixtureComposePort);
  const [mailboxId, setMailboxId] = useState(mailboxes[0]?.id ?? "");
  const activeMailboxId = mailboxes.some((m) => m.id === mailboxId)
    ? mailboxId
    : (mailboxes[0]?.id ?? "");
  const [values, setValues] = useState({ To: initialTo, Cc: "", Bcc: "" });
  const [visible, setVisible] = useState({ Cc: false, Bcc: false });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<(File & { composeId: string })[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const sending = useRef(false);
  const [intent] = useState(() => crypto.randomUUID());
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty =
    values.To !== initialTo ||
    values.Cc ||
    values.Bcc ||
    subject ||
    body ||
    files.length ||
    activeMailboxId !== (mailboxes[0]?.id ?? "");
  function changed() {
    setError("");
  }
  function requestClose() {
    if (sending.current) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }
  async function send() {
    if (sending.current) return;
    const parsed = recipientFields.map((field) => parseRecipientList(values[field]));
    if (parsed.some((field) => field.invalid.length)) {
      setError(t("modules.emails.invalidRecipients"));
      return;
    }
    const count = parsed.reduce((total, field) => total + field.recipients.length, 0);
    if (!count || count > 100) {
      setError(count ? t("modules.emails.recipientLimit") : t("modules.emails.requireRecipient"));
      return;
    }
    const mailbox = mailboxes.find((item) => item.id === activeMailboxId);
    if (!mailbox) {
      setError(t("modules.emails.selectMailbox"));
      return;
    }
    sending.current = true;
    setPending(true);
    setError("");
    const input: ComposeMailInput = {
      idempotencyKey: intent,
      mailboxId: activeMailboxId,
      from: { address: mailbox.address, ...(mailbox.name ? { name: mailbox.name } : {}) },
      to: parsed[0]?.recipients ?? [],
      cc: parsed[1]?.recipients ?? [],
      bcc: parsed[2]?.recipients ?? [],
      subject,
      body,
      summary: body.slice(0, 2000),
      attachments: files.map((file, index) => ({
        id: `attachment-${index}`,
        name: file.name,
        size: file.size,
        contentType: resolveAllowedType({ fileName: file.name, mediaType: file.type }).mediaType,
        blobRef: `fixture:${intent}:${index}`,
      })),
    };
    try {
      const result = await sendPort.send(input);
      onSent(result);
      onClose();
    } catch {
      setError(t("modules.emails.sendError"));
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  const fieldLabel = (field: "To" | "Cc" | "Bcc") =>
    field === "To"
      ? t("modules.emails.toField")
      : field === "Cc"
        ? t("modules.emails.ccField")
        : t("modules.emails.bccField");

  return (
    <>
      <TopAlignedModal
        isOpen
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        aria-labelledby={titleId}
        panelClassName="max-w-full"
      >
        <div className="max-h-screen overflow-y-auto p-6 text-text">
          <h2 id={titleId} className="mb-4 text-xl font-semibold">
            {t("modules.emails.composeTitle")}
          </h2>
          <p className="mb-3 text-sm text-text-muted">{t("modules.emails.fixtureMode")}</p>
          <Form
            validationBehavior="aria"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <Select
              label={t("modules.emails.fromField")}
              items={mailboxes}
              value={activeMailboxId}
              onChange={(key) => {
                changed();
                setMailboxId(String(key));
              }}
              isDisabled={pending}
            >
              {(mailbox) => (
                <SelectItem id={mailbox.id} textValue={mailbox.address}>
                  {mailbox.address}
                </SelectItem>
              )}
            </Select>
            {recipientFields.map((field) => {
              if (field !== "To" && !visible[field]) return null;
              const parsed = parseRecipientList(values[field]);
              return (
                <div key={field}>
                  <TextField
                    label={fieldLabel(field)}
                    value={values[field]}
                    isDisabled={pending}
                    onChange={(value) => {
                      changed();
                      setValues((previous) => ({ ...previous, [field]: value }));
                    }}
                    isInvalid={parsed.invalid.length > 0}
                    errorMessage={t("modules.emails.enterValidEmail")}
                  />
                  <ul aria-label={`${field} recipients`} className="mt-1 flex flex-wrap gap-1">
                    {parsed.recipients.map((recipient) => (
                      <li
                        key={recipient.address}
                        className="rounded-md bg-primary-subtle px-2 py-1 text-sm"
                      >
                        {recipient.name
                          ? `${recipient.name} <${recipient.address}>`
                          : recipient.address}
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={t("modules.emails.removeRecipient", {
                            field,
                            address: recipient.address,
                          })}
                          isDisabled={pending}
                          onPress={() => {
                            changed();
                            setValues((previous) => ({
                              ...previous,
                              [field]: [
                                ...parsed.recipients
                                  .filter((item) => item.address !== recipient.address)
                                  .map((item) =>
                                    item.name
                                      ? `"${item.name.replace(/["\\]/g, "\\$&")}" <${item.address}>`
                                      : item.address,
                                  ),
                                ...parsed.invalid,
                              ].join("; "),
                            }));
                          }}
                        >
                          ×
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <div className="flex gap-2">
              {(["Cc", "Bcc"] as const)
                .filter((field) => !visible[field])
                .map((field) => (
                  <Button
                    key={field}
                    variant="ghost"
                    size="sm"
                    isDisabled={pending}
                    onPress={() => setVisible((previous) => ({ ...previous, [field]: true }))}
                  >
                    {fieldLabel(field)}
                  </Button>
                ))}
            </div>
            <TextField
              label={t("modules.emails.subject")}
              value={subject}
              maxLength={998}
              onChange={(value) => {
                changed();
                setSubject(value);
              }}
              isDisabled={pending}
            />
            <TextArea
              label={t("modules.emails.message")}
              value={body}
              rows={8}
              onChange={(value) => {
                changed();
                setBody(value);
              }}
              isDisabled={pending}
            />
            <div>
              <Button
                variant="secondary"
                isDisabled={pending}
                onPress={() => fileInput.current?.click()}
              >
                {t("modules.emails.attachFiles")}
              </Button>
              <input
                ref={fileInput}
                type="file"
                multiple
                hidden
                aria-label={t("modules.emails.attachFiles")}
                disabled={pending}
                onChange={(event) => {
                  const next = [
                    ...files,
                    ...Array.from(event.target.files ?? []).map((file) =>
                      Object.assign(file, { composeId: crypto.randomUUID() }),
                    ),
                  ];
                  event.target.value = "";
                  if (
                    next.length > 50 ||
                    next.reduce((total, file) => total + file.size, 0) > composeAttachmentByteLimit
                  ) {
                    setError(t("modules.emails.attachmentLimitError"));
                    return;
                  }
                  try {
                    for (const file of next) {
                      if (!file.name || file.name.length > 255) throw new Error("name");
                      resolveAllowedType({ fileName: file.name, mediaType: file.type });
                    }
                  } catch {
                    setError(t("modules.emails.attachmentTypeError"));
                    return;
                  }
                  changed();
                  setFiles(next);
                }}
              />
              <p className="text-sm text-text-muted">{t("modules.emails.attachmentsLimit")}</p>
              <ul aria-label={t("modules.emails.attachments")}>
                {files.map((file, index) => (
                  <li key={file.composeId} className="flex items-center justify-between gap-2">
                    <span>{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={t("modules.emails.removeAttachment", { index: index + 1 })}
                      isDisabled={pending}
                      onPress={() => {
                        changed();
                        setFiles(files.filter((_, i) => i !== index));
                      }}
                    >
                      {t("modules.emails.remove")}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
            {error && (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" isDisabled={pending} onPress={requestClose}>
                {t("modules.emails.cancel")}
              </Button>
              <Button
                variant="primary"
                type="submit"
                isPending={pending}
                isDisabled={pending || mailboxes.length === 0}
              >
                {pending ? t("modules.emails.sending") : t("modules.emails.send")}
              </Button>
            </div>
          </Form>
        </div>
      </TopAlignedModal>
      <ConfirmDialog
        isOpen={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title={t("modules.emails.discardTitle")}
        message={t("modules.emails.discardMessage")}
        confirmLabel={t("modules.emails.discardConfirm")}
        cancelLabel={t("modules.emails.keepEditing")}
        onConfirm={onClose}
      />
    </>
  );
}
