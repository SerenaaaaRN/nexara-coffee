import { z } from "zod";

export interface Channel {
    id: string;
    type: string;
    branchId: string | null;
    name: string | null;
    createdAt: string;
}

export interface ChatMessage {
    id: string;
    channelId: string;
    senderId: string;
    content: string;
    createdAt: Date;
}

export interface ChannelRow extends Channel {
    lastMessage: {
        content: string;
        senderName: string;
        createdAt: Date;
    } | null;
    memberCount: number;
    branchName: string | null;
}

export interface MessageRow extends ChatMessage {
    senderName: string | null;
    senderImage: string | null;
    isOwn: boolean;
}

export interface ChatChannelJoined {
    id: string;
    type: string;
    branch_id: string | null;
    name: string | null;
    created_at: string;
    branches: { id: string; name: string } | null;
}

export interface ChatMessageJoined {
    id: string;
    channel_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    sender: { id: string; name: string; image: string | null } | null;
}

export const sendMessageSchema = z.object({
    content: z.string().min(1, "Message cannot be empty").max(500),
});

export const createDirectChannelSchema = z.object({
    targetUserId: z.string().min(1),
});
