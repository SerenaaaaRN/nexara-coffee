import type {
    AuditLogRow as DBAuditLog,
    BranchRow as DBBranch,
    UserRow as DBUser,
} from "@database/types";
import { z } from "zod";
import type { ToCamelCase } from "@/utils/convert-types";

export type AuditLog = Pick<
    ToCamelCase<DBAuditLog>,
    | "id"
    | "actorId"
    | "branchId"
    | "action"
    | "targetTable"
    | "targetId"
    | "createdAt"
> & {
    metadata: unknown;
};

export type AuditMetadata =
    | string
    | number
    | boolean
    | null
    | AuditMetadata[]
    | { [key: string]: AuditMetadata };

export type AuditLogRow = Pick<
    AuditLog,
    | "id"
    | "actorId"
    | "branchId"
    | "action"
    | "targetTable"
    | "targetId"
    | "createdAt"
> & {
    metadata: AuditMetadata | null;
    actorName: string | null;
    branchName: string | null;
};

export type AuditLogJoined = DBAuditLog & {
    user: Pick<DBUser, "id" | "name"> | null;
    branches: Pick<DBBranch, "id" | "name"> | null;
};

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
