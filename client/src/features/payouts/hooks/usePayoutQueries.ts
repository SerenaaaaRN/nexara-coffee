import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { PayoutJoined, PayoutRow } from "@/features/payouts/types";
import { payoutKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";

/**
 * Mengambil data payout beserta informasi franchise owner, branch, dan approver.
 * Filterable berdasarkan branch dan status.
 * Data difilter berdasarkan role pengguna (franchise owner hanya melihat branch mereka).
 *
 * @param params.branchId - Filter per branch
 * @param params.status - Filter status payout
 * @returns Daftar payout
 */
export const getPayoutsFn = createServerFn({ method: "GET" })
    .validator(
        z
            .object({
                branchId: z.string().optional(),
                status: z.string().optional(),
            })
            .optional(),
    )
    .handler(async ({ data: params }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "payouts");
        if (!auth.success) throw new Error(auth.error);

        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");
        const ids = await getAccessibleBranchIds(
            auth.session.user.id,
            auth.session.user.role,
        );

        if (ids !== null && ids.length === 0) {
            return [] satisfies PayoutRow[];
        }

        const { supabaseAdmin } = await import("@database/server");

        let payoutQuery = supabaseAdmin
            .from("payouts")
            .select(
                "id, franchise_owner_id, branch_id, amount, period_start, period_end, status, approved_by, created_at, franchise_owner:user!payouts_franchise_owner_id_user_id_fk(id, name), branches!payouts_branch_id_branches_id_fk(id, name), approved_by_user:user!payouts_approved_by_user_id_fk(id, name)",
            )
            .order("created_at", { ascending: false });

        if (params?.branchId)
            payoutQuery = payoutQuery.eq("branch_id", params.branchId);
        if (params?.status)
            payoutQuery = payoutQuery.eq("status", params.status);
        if (ids !== null) payoutQuery = payoutQuery.in("branch_id", ids);

        const { data, error } = await payoutQuery;
        if (error) throw new Error(error.message);

        return ((data ?? []) as unknown as PayoutJoined[]).map((r) => ({
            id: r.id,
            franchiseOwnerId: r.franchise_owner_id,
            branchId: r.branch_id,
            amount: r.amount,
            periodStart: r.period_start,
            periodEnd: r.period_end,
            status: r.status,
            approvedBy: r.approved_by,
            createdAt: r.created_at,
            franchiseOwnerName: r.franchise_owner?.name ?? null,
            branchName: r.branches?.name ?? null,
            approvedByName: r.approved_by_user?.name ?? null,
        })) satisfies PayoutRow[];
    });

export const payoutsOptions = (params?: {
    branchId?: string;
    status?: string;
}) =>
    queryOptions({
        queryKey: payoutKeys.list(params),
        queryFn: () => getPayoutsFn({ data: params }),
        staleTime: STALE.FREQUENT,
    });

/** @see {@link getPayoutsFn} */
export function usePayouts(params?: { branchId?: string; status?: string }) {
    return useSuspenseQuery(payoutsOptions(params));
}
