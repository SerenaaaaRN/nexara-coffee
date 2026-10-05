import type { api, GetData } from "@/lib/eden";

/**
 * Baris audit log — from eden treaty (source of truth: server).
 * Termasuk nama aktor dan cabang hasil join di service.
 */
export type AuditLogRow = GetData<typeof api.audit.logs.get>[number];

export type AuditMetadata =
    | string
    | number
    | boolean
    | null
    | AuditMetadata[]
    | { [key: string]: AuditMetadata };

export const AUDIT_ACTIONS = ["create", "update", "delete", "approve"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
