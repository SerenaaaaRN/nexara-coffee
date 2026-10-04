import { db } from "../db/index.js";
import { auditLogs } from "../db/schema/system.js";

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
    await db.insert(auditLogs).values({
      actorId: params.actorId,
      action: params.action,
      targetTable: params.targetTable,
      targetId: params.targetId ?? null,
      branchId: params.branchId ?? null,
      metadata: params.metadata ?? null,
    });
  } catch (error) {
    console.error("logAudit failed:", error);
  }
}
