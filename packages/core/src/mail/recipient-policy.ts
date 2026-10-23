import { z } from "zod";
import { ValidationError } from "../errors";
import { normalizeMailAddress } from "./service";
import { type MailParticipant, mailParticipantSchema } from "./types";

/** Development sender guard. Caller MUST include every envelope recipient, including CC/BCC. */
export function assertRecipientAllowed(
  recipients: readonly (string | MailParticipant)[],
  allowList: readonly string[],
): void {
  const address = z.string().trim().email();
  const allowed = z.array(address).length(1).safeParse(allowList);
  const targets = z
    .array(z.union([address, mailParticipantSchema]))
    .min(1)
    .safeParse(recipients);
  if (allowed.success && targets.success) {
    const permitted = allowed.data[0];
    if (
      permitted !== undefined &&
      targets.data.every(
        (recipient) =>
          normalizeMailAddress(typeof recipient === "string" ? recipient : recipient.address) ===
          normalizeMailAddress(permitted),
      )
    )
      return;
  }
  // Never echo addresses, provider errors or configuration into a public error.
  throw new ValidationError({
    recipients: ["Development sending requires the single allowed test recipient."],
  });
}
