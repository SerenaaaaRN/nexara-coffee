import { Check, ChefHat, Clock, Utensils, XCircle } from "lucide-react";
import type { ElementType } from "react";

export const ORDER_STATUSES = [
    "pending",
    "confirmed",
    "preparing",
    "completed",
    "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_ICONS: Record<string, ElementType> = {
    pending: Clock,
    confirmed: Check,
    preparing: ChefHat,
    completed: Utensils,
    cancelled: XCircle,
};
