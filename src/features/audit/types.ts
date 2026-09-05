import { z } from "zod";

export interface AuditLog {
    id: string;
    actorId: string | null;
    branchId: string | null;
    action: string;
    targetTable: string;
    targetId: string | null;
    metadata: unknown;
    createdAt: string;
}

export type AuditMetadata =
    | string
    | number
    | boolean
    | null
    | AuditMetadata[]
    | { [key: string]: AuditMetadata };

export interface AuditLogRow extends Omit<AuditLog, "metadata"> {
    metadata: AuditMetadata | null;
    actorName: string | null;
    branchName: string | null;
}

export interface AuditLogJoined {
    id: string;
    actor_id: string | null;
    branch_id: string | null;
    action: string;
    target_table: string;
    target_id: string | null;
    metadata: unknown;
    created_at: string;
    user: { id: string; name: string } | null;
    branches: { id: string; name: string } | null;
}

export const AUDIT_ACTIONS = ["create", "update", "delete", "approve"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const auditFilterSchema = z.object({
    action: z.enum(AUDIT_ACTIONS).optional(),
    targetTable: z.string().optional(),
    actorId: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
});

export type AuditFilters = z.infer<typeof auditFilterSchema>;
