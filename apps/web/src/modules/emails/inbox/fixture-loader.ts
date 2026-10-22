import { inboxFixture } from "./fixture";
import type { EmailFolder, InboxViewModel } from "./view-model";

// Keep the complete fixture so the existing folder counters remain available.
// InboxScreen limits the displayed conversations to the requested folder.
export async function loadInboxFixture(_folder: EmailFolder): Promise<InboxViewModel> {
  return inboxFixture;
}
