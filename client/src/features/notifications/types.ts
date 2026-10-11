import { z } from "zod";
import type { api, GetData } from "@/lib/eden";

/** Notifikasi — from eden treaty  */
export type Notification = GetData<typeof api.notifications.get>[number];

export type NotificationRow = Notification;

export const markReadSchema = z.object({
    id: z.string().min(1),
});

export const markAllReadSchema = z.object({});
