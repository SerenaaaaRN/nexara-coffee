import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type {
    AuditLogJoined,
    AuditLogRow,
    AuditMetadata,
} from "@/features/audit/types";
import { auditKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";

/**
 * Mengambil semua audit log yang dapat diakses user.
 *
 * Data digabung dengan tabel user (actor) dan branches untuk menampilkan
 * nama aktor dan cabang. Scope otomatis berdasarkan role:
 *   - super_admin → semua audit log
 *   - branch_manager → audit log di cabang yang dikelola + system-level
 *   - lainnya → hanya dirinya sendiri
 *
 * Diurutkan dari yang terbaru.
 *
 * @returns {AuditLogRow[]} Daftar audit log
 */
export const getAuditLogsFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "system");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");
        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");

        const ids = await getAccessibleBranchIds(
            auth.session.user.id,
            auth.session.user.role,
        );

        let auditQuery = supabaseAdmin
            .from("audit_logs")
            .select(
                "id, actor_id, branch_id, action, target_table, target_id, metadata, created_at, user!audit_logs_actor_id_user_id_fk(id, name), branches!audit_logs_branch_id_branches_id_fk(id, name)",
            )
            .order("created_at", { ascending: false })
            .limit(100);

        if (ids !== null && ids.length > 0) {
            auditQuery = auditQuery.or(
                `branch_id.in.(${ids.join(",")}),branch_id.is.null`,
            );
        }

        const { data, error } = await auditQuery;
        if (error) return { success: false as const, error: error.message };

        const rows: AuditLogRow[] = (
            (data ?? []) as unknown as AuditLogJoined[]
        ).map((r) => ({
            id: r.id,
            actorId: r.actor_id,
            branchId: r.branch_id,
            action: r.action,
            targetTable: r.target_table,
            targetId: r.target_id,
            metadata: r.metadata as AuditMetadata | null,
            createdAt: r.created_at,
            actorName: r.user?.name ?? null,
            branchName: r.branches?.name ?? null,
        }));

        return { success: true as const, data: rows satisfies AuditLogRow[] };
    },
);

export const auditLogsOptions = () =>
    queryOptions({
        queryKey: auditKeys.lists(),
        queryFn: () => getAuditLogsFn(),
        staleTime: STALE.SLOW,
    });

export function useAuditLogs() {
    return useSuspenseQuery(auditLogsOptions());
}
