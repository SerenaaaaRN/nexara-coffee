import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import type {
    approvePayoutSchema,
    requestPayoutSchema,
} from "@/features/payouts/types";
import { payoutKeys } from "@/features/query-keys";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Mengajukan payout baru.
 * Memerlukan akses "create" pada module "payouts".
 */
export const requestPayout = async (
    input: z.infer<typeof requestPayoutSchema>,
) => {
    const { data, error } = await api.payouts.request.post({
        branchId: input.branchId,
        amount: input.amount,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
    });
    return toEnvelope(data, error);
};

/**
 * Menyetujui payout.
 * Memerlukan akses "approve" pada module "payouts".
 */
export const approvePayout = async (
    input: z.infer<typeof approvePayoutSchema>,
) => {
    const { data, error } = await api
        .payouts({ id: input.payoutId })
        .approve.post();
    return toEnvelope(data, error);
};

export function useRequestPayout() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof requestPayoutSchema>) =>
            requestPayout(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: payoutKeys.all });
        },
    });
}

export function useApprovePayout() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof approvePayoutSchema>) =>
            approvePayout(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: payoutKeys.all });
        },
    });
}
