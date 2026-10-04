import {
    Bell,
    Coffee,
    CreditCard,
    MessageSquare,
    Receipt,
    Shield,
    Star,
    Users,
} from "lucide-react";
import type { ElementType } from "react";

export const NOTIFICATION_TYPES = [
    "setoran",
    "payout",
    "order",
    "review",
    "system",
    "employee",
    "chat",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const ICONS: Record<NotificationType, ElementType> = {
    setoran: Receipt,
    payout: CreditCard,
    order: Coffee,
    review: Star,
    system: Shield,
    employee: Users,
    chat: MessageSquare,
};

const LABELS: Record<NotificationType, string> = {
    setoran: "Setoran",
    payout: "Payout",
    order: "Order",
    review: "Review",
    system: "System",
    employee: "Employee",
    chat: "Chat Message",
};

export function getNotificationIcon(type: string): ElementType {
    if (isNotificationType(type)) return ICONS[type];
    return Bell;
}

export function formatNotificationType(type: string): string {
    if (isNotificationType(type)) return LABELS[type];
    return type.charAt(0).toUpperCase() + type.slice(1);
}

function isNotificationType(type: string): type is NotificationType {
    return NOTIFICATION_TYPES.includes(type as NotificationType);
}
