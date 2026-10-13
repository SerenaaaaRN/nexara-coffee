import { z } from "zod";
import type { api, GetData } from "@/lib/eden";

/** Notifikasi — from eden treaty  */
export type Notification = GetData<
    typeof api.notifications.get
>["rows"][number];

export type NotificationRow = Notification;

/** Ringkasan agregat notifikasi — from eden treaty. */
export type NotificationSummary = GetData<
    typeof api.notifications.get
>["summary"];

export const markReadSchema = z.object({
    id: z.string().min(1),
});

export const markAllReadSchema = z.object({});
