import { Check, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import type { ElementType } from "react";
import type { AuditAction } from "./types";

export const AUDIT_ACTION_ICONS: Record<AuditAction, ElementType> = {
    create: Plus,
    update: Pencil,
    delete: Trash2,
    approve: Check,
};

export const AUDIT_ACTION_DEFAULT_ICON: ElementType = Shield;

const ACTION_LABELS: Record<AuditAction, string> = {
    create: "Created",
    update: "Updated",
    delete: "Deleted",
    approve: "Approved",
};

export function formatActionLabel(action: AuditAction | string): string {
    return ACTION_LABELS[action as AuditAction] ?? action;
}
