import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";
import { transactionKeys } from "@/features/query-keys";
import type { Transaction } from "@/features/transactions/types";
import {
    recordTransactionSchema,
    refundTransactionSchema,
} from "@/features/transactions/types";

/**
 * Mencatat transaksi baru ke database.
 * Memerlukan akses "create" pada module "finance".
 *
 * @returns Data transaksi yang baru dibuat.
 */
export const recordTransactionFn = createServerFn({ method: "POST" })
    .validator(recordTransactionSchema)
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("create", "finance");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data: txn, error } = await supabaseAdmin
            .from("transactions")
            .insert({
                id: crypto.randomUUID(),
                order_id: data.orderId,
                branch_id: data.branchId,
                payment_method: data.paymentMethod,
                amount: data.amount.toString(),
            })
            .select()
            .single();

        if (error || !txn)
            return {
                success: false as const,
                error: error?.message ?? "Gagal mencatat transaksi",
            };

        return {
            success: true as const,
            data: {
                id: txn.id,
                orderId: txn.order_id,
                branchId: txn.branch_id,
                paymentMethod: txn.payment_method,
                amount: txn.amount,
                status: txn.status,
                createdAt: txn.created_at,
            } satisfies Transaction,
        };
    });

/**
 * Melakukan refund transaksi dengan mengubah statusnya menjadi "refunded".
 * Memerlukan akses "update" pada module "finance".
 *
 * @returns Data transaksi yang sudah diubah statusnya.
 */
export const refundTransactionFn = createServerFn({ method: "POST" })
    .validator(refundTransactionSchema)
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "finance");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data: txn, error } = await supabaseAdmin
            .from("transactions")
            .update({ status: "refunded" })
            .eq("id", data.transactionId)
            .select()
            .single();

        if (error || !txn)
            return {
                success: false as const,
                error: error?.message ?? "Gagal refund transaksi",
            };

        return {
            success: true as const,
            data: {
                id: txn.id,
                orderId: txn.order_id,
                branchId: txn.branch_id,
                paymentMethod: txn.payment_method,
                amount: txn.amount,
                status: txn.status,
                createdAt: txn.created_at,
            } satisfies Transaction,
        };
    });

/** @see {@link recordTransactionFn} */
export function useRecordTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof recordTransactionSchema>) =>
            recordTransactionFn({ data }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: transactionKeys.all });
        },
    });
}

/** @see {@link refundTransactionFn} */
export function useRefundTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof refundTransactionSchema>) =>
            refundTransactionFn({ data }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: transactionKeys.all });
        },
    });
}
