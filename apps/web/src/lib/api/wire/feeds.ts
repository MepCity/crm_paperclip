import { z } from "zod";
import { parseBody } from "./chat";

export { parseBody };

const body = z.string().min(1).max(20000);
const mentions = z.array(z.string().uuid()).max(50).optional();

export const feedFilterSchema = z.enum(["all", "followed", "mine"]);
export const likeTargetSchema = z.enum(["post", "comment", "history_event"]);

export const createPostSchema = z.object({
  body,
  mentionUserIds: mentions,
  recordModule: z.string().min(1).max(80).nullish(),
  recordId: z.string().min(1).max(80).nullish(),
});

export const editSchema = z.object({ body, mentionUserIds: mentions });

export const commentSchema = z.object({ body, mentionUserIds: mentions });

export const eventCommentSchema = z.object({
  body,
  mentionUserIds: mentions,
  recordModule: z.string().min(1).max(80),
  recordId: z.string().min(1).max(80),
});

export const eventLikeSchema = z.object({
  recordModule: z.string().min(1).max(80),
  recordId: z.string().min(1).max(80),
});

export const feedListQuerySchema = z.object({
  filter: feedFilterSchema.optional(),
  module: z.string().min(1).max(80).optional(),
  cursor: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type CreatePostBody = z.infer<typeof createPostSchema>;
