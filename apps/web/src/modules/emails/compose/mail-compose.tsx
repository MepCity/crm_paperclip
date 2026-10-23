"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Form } from "@/components/ui/form";
import { Select, SelectItem } from "@/components/ui/select";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { resolveAllowedType } from "../../../../../../packages/core/src/attachments/file-policy";
import { parseRecipientList } from "../../../../../../packages/core/src/mail/recipient-list";
import {
  type ComposeMailbox,
  type ComposeMailInput,
  composeAttachmentByteLimit,
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
  port: MailComposePort;
  initialTo?: string;
  onClose: () => void;
  onSent: (result: { id: string }) => void;
}) {
  const titleId = useId();
  const [mailboxId, setMailboxId] = useState(mailboxes[0]?.id ?? "");
  const [values, setValues] = useState({ To: initialTo, Cc: "", Bcc: "" });
  const [visible, setVisible] = useState({ Cc: false, Bcc: false });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<(File & { composeId: string })[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const sending = useRef(false);
  const intent = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty =
    values.To !== initialTo ||
    values.Cc ||
    values.Bcc ||
    subject ||
    body ||
    files.length ||
    mailboxId !== (mailboxes[0]?.id ?? "");
  function changed() {
    intent.current = null;
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
      setError("Enter valid email addresses in To, Cc and Bcc.");
      return;
    }
    const count = parsed.reduce((total, field) => total + field.recipients.length, 0);
    if (!count || count > 100) {
      setError(count ? "Use at most 100 recipients." : "Add at least one recipient.");
      return;
    }
    const mailbox = mailboxes.find((item) => item.id === mailboxId);
    if (!mailbox) {
      setError("Select a connected mailbox.");
      return;
    }
    sending.current = true;
    setPending(true);
    setError("");
    intent.current ??= crypto.randomUUID();
    const input: ComposeMailInput = {
      idempotencyKey: intent.current,
      mailboxId,
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
        blobRef: `fixture:${intent.current}:${index}`,
      })),
    };
    try {
      const result = await port.send(input);
      onSent(result);
      onClose();
    } catch {
      setError("Unable to send your message. Please try again.");
    } finally {
      sending.current = false;
      setPending(false);
    }
  }
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
            Compose Email
          </h2>
          <p className="mb-3 text-sm text-text-muted">Fixture mode: no email will be delivered.</p>
          <Form
            validationBehavior="aria"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <Select
              label="From"
              items={mailboxes}
              value={mailboxId}
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
                    label={field}
                    value={values[field]}
                    isDisabled={pending}
                    onChange={(value) => {
                      changed();
                      setValues((previous) => ({ ...previous, [field]: value }));
                    }}
                    isInvalid={parsed.invalid.length > 0}
                    errorMessage="Enter valid email addresses."
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
                          aria-label={`Remove ${field} ${recipient.address}`}
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
                    {field}
                  </Button>
                ))}
            </div>
            <TextField
              label="Subject"
              value={subject}
              maxLength={998}
              onChange={(value) => {
                changed();
                setSubject(value);
              }}
              isDisabled={pending}
            />
            <TextArea
              label="Message"
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
                Attach files
              </Button>
              <input
                ref={fileInput}
                type="file"
                multiple
                hidden
                aria-label="Attach files"
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
                    setError("Attach at most 50 files, up to 20 MB in total.");
                    return;
                  }
                  try {
                    for (const file of next) {
                      if (!file.name || file.name.length > 255) throw new Error("name");
                      resolveAllowedType({ fileName: file.name, mediaType: file.type });
                    }
                  } catch {
                    setError("This attachment type or filename is not allowed.");
                    return;
                  }
                  changed();
                  setFiles(next);
                }}
              />
              <p className="text-sm text-text-muted">Up to 50 attachments, 20 MB total.</p>
              <ul aria-label="Attachments">
                {files.map((file, index) => (
                  <li key={file.composeId} className="flex items-center justify-between gap-2">
                    <span>{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove attachment ${index + 1}`}
                      isDisabled={pending}
                      onPress={() => {
                        changed();
                        setFiles(files.filter((_, i) => i !== index));
                      }}
                    >
                      Remove
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
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isPending={pending}
                isDisabled={pending || mailboxes.length === 0}
              >
                {pending ? "Sending…" : "Send"}
              </Button>
            </div>
          </Form>
        </div>
      </TopAlignedModal>
      <ConfirmDialog
        isOpen={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard message?"
        message="Your changes will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={onClose}
      />
    </>
  );
}
