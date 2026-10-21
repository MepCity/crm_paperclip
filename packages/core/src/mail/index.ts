export { assertRecipientAllowed } from "./recipient-policy";
export {
  forwardRecipients,
  forwardSubject,
  INTERIM_REPLY_ATTRIBUTION,
  type MailRecipients,
  normalizeSubject,
  type QuoteAttribution,
  quotePlainText,
  type ReplyHeadersResult,
  type ReplyMode,
  replyHeaders,
  replyRecipients,
  replySubject,
} from "./reply";
export { createInMemoryMailRepository } from "./repository";
export { createMailService, type MailServiceOptions, normalizeMailAddress } from "./service";
export * from "./types";
