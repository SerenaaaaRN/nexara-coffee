import { db } from "../db/index.js";
import { auditLogs } from "../db/schema/system.js";
import { getAblyRest } from "../infra/ably.js";
import { fail } from "../lib/http.js";

export const publishAbly = async (
	channel: string,
	event: string,
	data: unknown,
) => {
	try {
		const ably = getAblyRest();
		await ably.channels.get(channel).publish(event, data);
	} catch (e) {
		console.error(`[ably] ${channel}:${event} failed:`, e);
	}
};

type Bucket = { tokens: number; updatedAt: number };
const buckets = new Map<string, Bucket>();

const sweepBuckets = (now: number) => {
	for (const [key, b] of buckets) {
		if (b.tokens >= 1 && now - b.updatedAt > 60_000) {
			buckets.delete(key);
		}
	}
};

/**
 * Token-bucket rate limiter O(1) per key. Burst awal sebesar `limit`,
 * rate sostenuto presisi `limit/windowMs` tanpa lonjakan 2x boundary
 * seperti fixed-window. Signature sama seperti sebelumnya sehingga
 * call-site tidak berubah. In-memory: reset saat restart/multi-instance.
 */
export function rateLimit(
	key: string,
	limit: number,
	windowMs: number,
): boolean {
	const now = Date.now();
	const refill = limit / windowMs; // token per ms
	const b = buckets.get(key);
	if (!b) {
		buckets.set(key, { tokens: limit - 1, updatedAt: now });
		if (buckets.size % 128 === 0) sweepBuckets(now);
		return true;
	}
	b.tokens = Math.min(limit, b.tokens + (now - b.updatedAt) * refill);
	b.updatedAt = now;
	if (b.tokens < 1) return false;
	b.tokens -= 1;
	return true;
}

export const checkRate = (key: string, max: number, windowMs: number) => {
	if (!rateLimit(key, max, windowMs)) {
		return fail(429, "Too many requests");
	}
	return null;
};

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
