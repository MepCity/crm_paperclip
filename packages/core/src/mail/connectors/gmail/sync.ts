import type { MailRepository } from "../../types";
import type { ConnectorMailbox, MailConnector } from "./port";

/** Applies one batch; returns the cursor to persist only after every message is stored. Replay-safe. */
export async function syncMailbox(
  connector: MailConnector,
  repo: MailRepository,
  mailbox: ConnectorMailbox,
  cursor: string | null,
): Promise<{ nextCursor: string; stored: number }> {
  const changes = await connector.listChanges(mailbox, cursor);
  let stored = 0;
  for (const id of changes.messageIds) {
    const mapped = await connector.fetchMessage(mailbox, id);
    if (!mapped) continue;
    await repo.putThread(mapped.thread);
    await repo.upsertMessage(mapped.message);
    for (const a of mapped.attachments) await repo.putAttachment(a);
    stored++;
  }
  return { nextCursor: changes.nextCursor, stored };
}
