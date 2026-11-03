import { z } from "zod";

import { request } from "@/shared/api/http";

export const MAX_MESSAGE_LENGTH = 500;
export const MAX_HISTORY = 10;

export type ChatRole = "user" | "assistant";
export type ReplySource = "model" | "fallback";

export interface ChatEntry {
  id: number;
  role: ChatRole;
  content: string;
  source?: ReplySource;
}

const replySchema = z.object({
  reply: z.string(),
  source: z.enum(["model", "fallback"]),
  remaining_today: z.number().nullable(),
});

export type AssistantReply = z.infer<typeof replySchema>;

export const interfaceLocale = "es";

export function toWireMessages(entries: ChatEntry[]) {
  const recent = entries.slice(-MAX_HISTORY);
  const firstUser = recent.findIndex((entry) => entry.role === "user");
  return recent.slice(Math.max(firstUser, 0)).map((entry) => ({
    role: entry.role,
    content: entry.content.slice(0, MAX_MESSAGE_LENGTH),
  }));
}

export const assistantApi = {
  send: (entries: ChatEntry[]) =>
    request("/assistant/messages", {
      method: "POST",
      body: { messages: toWireMessages(entries), locale: interfaceLocale },
      schema: replySchema,
    }),
};
