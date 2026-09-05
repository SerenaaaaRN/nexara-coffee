import type {
    BranchRow as DBBranch,
    ChatChannelRow as DBChannel,
    ChatMessageRow as DBChatMessage,
    UserRow as DBUser,
} from "@database/types";
import { z } from "zod";
import type { ToCamelCase } from "@/utils/convert-types";

export type Channel = ToCamelCase<DBChannel>;

export type ChatMessage = Omit<ToCamelCase<DBChatMessage>, "createdAt"> & {
    createdAt: Date;
};

export type ChannelRow = Channel & {
    lastMessage: {
        content: string;
        senderName: string;
        createdAt: Date;
    } | null;
    memberCount: number;
    branchName: string | null;
};

export type MessageRow = ChatMessage & {
    senderName: string | null;
    senderImage: string | null;
    isOwn: boolean;
};

export type ChatChannelJoined = DBChannel & {
    branches: Pick<DBBranch, "id" | "name"> | null;
};

export type ChatMessageJoined = DBChatMessage & {
    sender: Pick<DBUser, "id" | "name" | "image"> | null;
};

export const sendMessageSchema = z.object({
    content: z.string().min(1, "Message cannot be empty").max(500),
});

export const createDirectChannelSchema = z.object({
    targetUserId: z.string().min(1),
});
