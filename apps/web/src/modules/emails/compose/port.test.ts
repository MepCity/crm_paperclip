import { expect, test } from "vitest";
import { MAX_OUTBOUND_ATTACHMENT_BYTES } from "../../../../../../packages/core/src/mail/outbox";
import { composeAttachmentByteLimit } from "./port";

test("browser attachment limit matches the outbound contract", () => {
  expect(composeAttachmentByteLimit).toBe(MAX_OUTBOUND_ATTACHMENT_BYTES);
});
