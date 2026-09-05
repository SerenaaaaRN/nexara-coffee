import { z } from "zod";

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string | null;
    isRead: boolean;
    createdAt: string;
}

export interface NotificationRow extends Notification {}

export const markReadSchema = z.object({
    id: z.string().min(1),
});

export const markAllReadSchema = z.object({});
