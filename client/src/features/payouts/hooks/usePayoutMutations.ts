import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";
import type { Payout } from "@/features/payouts/types";
import {
    approvePayoutSchema,
    requestPayoutSchema,
} from "@/features/payouts/types";
import { payoutKeys } from "@/features/query-keys";

function toPayout(r: {
    id: string;
    franchise_owner_id: string;
    branch_id: string;
    amount: string;
    period_start: string;
    period_end: string;
    status: string;
    approved_by: string | null;
    created_at: string;
}): Payout {
    return {
        id: r.id,
        franchiseOwnerId: r.franchise_owner_id,
        branchId: r.branch_id,
        amount: r.amount,
        periodStart: r.period_start,
        periodEnd: r.period_end,
        status: r.status,
        approvedBy: r.approved_by,
        createdAt: r.created_at,
    };
}

/**
 * Mengajukan payout baru.
 * Memerlukan akses "create" pada module "payouts".
 *
 * @returns Data payout yang baru dibuat.
 */
export const requestPayoutFn = createServerFn({ method: "POST" })
    .validator(requestPayoutSchema)
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("create", "payouts");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data: payout, error } = await supabaseAdmin
            .from("payouts")
            .insert({
                id: crypto.randomUUID(),
                franchise_owner_id: auth.session.user.id,
                branch_id: data.branchId,
                amount: data.amount.toString(),
                period_start: data.periodStart,
                period_end: data.periodEnd,
            })
            .select()
            .single();

        if (error || !payout)
            return {
                success: false as const,
                error: error?.message ?? "Gagal mengajukan payout",
            };

        return { success: true as const, data: toPayout(payout) };
    });

/**
 * Menyetujui payout.
 * Memerlukan akses "approve" pada module "payouts".
 *
 * @returns Data payout yang sudah di-approve.
 */
export const approvePayoutFn = createServerFn({ method: "POST" })
    .validator(approvePayoutSchema)
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("approve", "payouts");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data: payout, error } = await supabaseAdmin
            .from("payouts")
            .update({ status: "approved", approved_by: auth.session.user.id })
            .eq("id", data.payoutId)
            .select()
            .single();

        if (error || !payout)
            return {
                success: false as const,
                error: error?.message ?? "Gagal menyetujui payout",
            };

        return { success: true as const, data: toPayout(payout) };
    });

/** @see {@link requestPayoutFn} */
export function useRequestPayout() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof requestPayoutSchema>) =>
            requestPayoutFn({ data }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: payoutKeys.all });
        },
    });
}

/** @see {@link approvePayoutFn} */
export function useApprovePayout() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof approvePayoutSchema>) =>
            approvePayoutFn({ data }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: payoutKeys.all });
        },
    });
}
