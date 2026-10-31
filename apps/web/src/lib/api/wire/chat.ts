import { ValidationError } from "@crm/core/errors";
import { z } from "zod";

export function invalid(field: string, message = "Invalid value."): never {
  throw new ValidationError({ [field]: [message] });
}

export async function parseBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new ValidationError({ body: ["Send valid JSON."] });
  }
  if (!json || typeof json !== "object") {
    throw new ValidationError({ body: ["Send a JSON object."] });
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] !== undefined ? String(issue.path[0]) : "body";
      fieldErrors[field] ??= [];
      fieldErrors[field].push(issue.message);
    }
    throw new ValidationError(fieldErrors);
  }
  return result.data;
}

export const conversationKindSchema = z.enum(["direct", "group", "channel"]);
export const channelVisibilitySchema = z.enum(["public", "private"]);
export const presenceStatusSchema = z.enum(["available", "busy", "away", "invisible"]);
export const memberRoleSchema = z.enum(["owner", "member"]);

export const createConversationSchema = z
  .object({
    kind: conversationKindSchema,
    name: z.string().trim().min(1).max(80).optional(),
    visibility: channelVisibilitySchema.optional(),
    userId: z.string().uuid().optional(),
    memberUserIds: z.array(z.string().uuid()).min(2).max(50).optional(),
    clientId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "direct") {
      if (!data.userId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["userId"],
          message: "Target user ID is required for direct conversations.",
        });
      }
      if (data.name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["name"],
          message: "Direct conversations cannot have a name.",
        });
      }
    } else if (data.kind === "group") {
      if (!data.name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["name"],
          message: "Name is required for group conversations.",
        });
      }
      if (!data.memberUserIds || data.memberUserIds.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["memberUserIds"],
          message: "Group conversations require 2 to 50 other members.",
        });
      }
    } else if (data.kind === "channel") {
      if (!data.name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["name"],
          message: "Name is required for channels.",
        });
      }
      if (!data.visibility) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["visibility"],
          message: "Visibility is required for channels.",
        });
      }
    }
  });

export const updateConversationSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  archived: z.boolean().optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: memberRoleSchema.default("member"),
});

export const markReadSchema = z.object({
  seq: z.number().int().min(0),
});

export const postMessageSchema = z.object({
  body: z.string().min(1).max(10000),
  mentions: z.array(z.string().uuid()).optional(),
  clientId: z.string().uuid().optional(),
});

export const updateMessageSchema = z.object({
  body: z.string().min(1).max(10000),
  mentions: z.array(z.string().uuid()).optional(),
});

export const postReplySchema = z.object({
  body: z.string().min(1).max(10000),
  mentions: z.array(z.string().uuid()).optional(),
  clientId: z.string().uuid().optional(),
});

export const setPresenceSchema = z.object({
  status: presenceStatusSchema,
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
export type PostMessageInput = z.infer<typeof postMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type PostReplyInput = z.infer<typeof postReplySchema>;
export type SetPresenceInput = z.infer<typeof setPresenceSchema>;

export type ChatConversationWire = {
  id: string;
  kind: "direct" | "group" | "channel";
  name: string | null;
  visibility: "public" | "private" | null;
  directKey: string | null;
  createdBy: string;
  createdAt: string;
  lastSeq: number;
  lastMessageAt: string | null;
  archivedAt: string | null;
  changedSeq: number;
  unreadCount?: number;
  pinnedAt?: string | null;
  lastReadSeq?: number;
  membershipRole?: "owner" | "member" | null;
};

export type ChatMemberWire = {
  conversationId: string;
  userId: string;
  role: "owner" | "member";
  joinedAt: string;
  leftAt: string | null;
  lastReadSeq: number;
  pinnedAt: string | null;
  changedSeq: number;
  userName?: string;
  userEmail?: string;
};

export type ChatMessageWire = {
  id: string;
  conversationId: string;
  seq: number | null;
  threadRootId: string | null;
  authorUserId: string;
  authorName?: string;
  body: string;
  mentions: string[];
  replyCount: number;
  lastReplyAt: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  changedSeq: number;
  starred?: boolean;
};

export type ChatThreadReadWire = {
  threadRootId: string;
  userId: string;
  lastReadAt: string;
  changedSeq: number;
};

export type ChatPresenceWire = {
  userId: string;
  status: "available" | "busy" | "away" | "invisible" | "offline";
  lastSeenAt: string;
};

export type ChatContactWire = {
  userId: string;
  name: string;
  email: string;
  status: "available" | "busy" | "away" | "offline";
  lastSeenAt: string | null;
};

export type ChatBadgesWire = {
  unreadChats: number;
  unreadThreads: number;
  unreadPins: number;
  unreadMentions: number;
  unreadTotal: number;
};

export type ChatSyncResponse = {
  cursor: number;
  hasMore: boolean;
  conversations: ChatConversationWire[];
  members: ChatMemberWire[];
  messages: ChatMessageWire[];
  threadReads: ChatThreadReadWire[];
  presence: ChatPresenceWire[];
  badges: ChatBadgesWire;
};

export type ChatSearchFilters = {
  q?: string;
  from?: string;
  in?: string;
  type?: string;
  after?: string;
  before?: string;
  hasLink?: boolean;
  hasMention?: boolean;
  limit?: number;
  offset?: number;
};
