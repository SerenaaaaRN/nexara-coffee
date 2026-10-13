import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { transactionKeys } from "@/features/query-keys";
import type {
    recordTransactionSchema,
    refundTransactionSchema,
} from "@/features/transactions/types";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Mencatat transaksi baru ke database.
 * Memerlukan akses "create" pada module "finance".
 */
export const recordTransaction = async (
    input: z.infer<typeof recordTransactionSchema>,
) => {
    const { data, error } = await api.transactions.record.post({
        orderId: input.orderId,
        branchId: input.branchId,
        paymentMethod: input.paymentMethod,
        amount: input.amount,
    });
    return toEnvelope(data, error);
};

/**
 * Melakukan refund transaksi dengan mengubah statusnya menjadi "refunded".
 * Memerlukan akses "update" pada module "finance".
 */
export const refundTransaction = async (
    input: z.infer<typeof refundTransactionSchema>,
) => {
    const { data, error } = await api
        .transactions({ id: input.transactionId })
        .refund.post();
    return toEnvelope(data, error);
};

export const useRecordTransaction = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof recordTransactionSchema>) =>
            recordTransaction(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: transactionKeys.all });
        },
    });
};

export const useRefundTransaction = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof refundTransactionSchema>) =>
            refundTransaction(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: transactionKeys.all });
        },
    });
};
