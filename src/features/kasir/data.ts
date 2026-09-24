import { Check, Timer, XCircle } from "lucide-react";
import type { ElementType } from "react";

export const KASIR_STATUSES = ["pending", "approved", "rejected"] as const;
export type KasirStatus = (typeof KASIR_STATUSES)[number];

export const KASIR_STATUS_ICONS: Record<string, ElementType> = {
    pending: Timer,
    approved: Check,
    rejected: XCircle,
};
