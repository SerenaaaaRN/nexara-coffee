import type { NotificationRow as DBNotification } from "@database/types";
import { z } from "zod";
import type { ToCamelCase } from "@/utils/convert-types";

export type Notification = ToCamelCase<DBNotification>;

export type NotificationRow = Notification;

export const markReadSchema = z.object({
    id: z.string().min(1),
});

export const markAllReadSchema = z.object({});
