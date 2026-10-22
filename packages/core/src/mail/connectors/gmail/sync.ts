import type { MailMessage, MailRepository } from "../../types";
import type { ConnectorMailbox, MailConnector } from "./port";

/** Applies one batch; returns the cursor to persist only after every message is stored. Replay-safe. */
export async function syncMailbox(
  connector: MailConnector,
  repo: MailRepository,
  mailbox: ConnectorMailbox,
  cursor: string | null,
  afterStored?: (message: MailMessage) => Promise<void>,
  checkpoint?: () => Promise<void>,
): Promise<{ nextCursor: string; stored: number }> {
  await checkpoint?.();
  const changes = await connector.listChanges(mailbox, cursor);
  let stored = 0;
  for (const id of changes.messageIds) {
    await checkpoint?.();
    const mapped = await connector.fetchMessage(mailbox, id);
    if (!mapped || (mailbox.folder && mapped.message.folder !== mailbox.folder)) continue;
    await checkpoint?.();
    await repo.putThread(mapped.thread);
    await checkpoint?.();
    const message = await repo.upsertMessage(mapped.message);
    for (const a of mapped.attachments) {
      await checkpoint?.();
      await repo.putAttachment({ ...a, messageId: message.id });
    }
    await afterStored?.(message);
    stored++;
  }
  return { nextCursor: changes.nextCursor, stored };
}
