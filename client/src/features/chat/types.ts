import { z } from "zod";
import type { api, GetData } from "@/lib/eden";

/**
 * Baris channel — from eden treaty (source of truth: server).
 * Termasuk `branchName` + `lastMessage{content,senderName,createdAt}` +
 * `memberCount` dari service.
 */
export type ChannelRow = GetData<typeof api.chat.channels.get>[number];

export type Channel = Omit<
    ChannelRow,
    "branchName" | "lastMessage" | "memberCount"
>;

type ChannelMessagesRoute = ReturnType<typeof api.chat.channels>["messages"];

type ServerMessage = GetData<ChannelMessagesRoute["get"]>["messages"][number];

/**
 * Baris pesan — from eden treaty. `isOwn` dihitung client-side
 * dari sesi (server mengembalikan `false` sebagai default).
 */
export type MessageRow = ServerMessage & {
    isOwn: boolean;
};

export type ChatMessage = Omit<
    MessageRow,
    "senderName" | "senderImage" | "isOwn"
>;

export const sendMessageSchema = z.object({
    content: z.string().min(1, "Message cannot be empty").max(500),
});

export const createDirectChannelSchema = z.object({
    targetUserId: z.string().min(1),
});
