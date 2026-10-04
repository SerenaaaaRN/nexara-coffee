interface LogAuditParams {
    actorId: string;
    action: string;
    targetTable: string;
    targetId?: string;
    branchId?: string | null;
    metadata?: Record<string, unknown> | null;
}

/**
 * Mencatat activity ke tabel audit_logs. Fire-and-forget — dipanggil caller
 * dengan `void`. Tidak pernah reject: error DB ditangkap internal supaya
 * audit yang gagal tidak menggagalkan mutation utama (dan tidak menjadi
 * unhandled rejection). Caller sudah melakukan auth/RBAC sendiri.
 */
export async function logAudit(params: LogAuditParams) {
    try {
        const { supabaseAdmin } = await import("@database/server");
        type AuditLogInsert =
            import("@database/types").Database["public"]["Tables"]["audit_logs"]["Insert"];
        const { error } = await supabaseAdmin.from("audit_logs").insert({
            id: crypto.randomUUID(),
            actor_id: params.actorId,
            action: params.action,
            target_table: params.targetTable,
            target_id: params.targetId ?? null,
            branch_id: params.branchId ?? null,
            metadata: (params.metadata ?? null) as AuditLogInsert["metadata"],
        });
        if (error) throw error;
    } catch (error) {
        console.error("logAudit failed:", error);
    }
}
