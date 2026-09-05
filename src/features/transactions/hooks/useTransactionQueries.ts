import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { transactionKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import type {
    TransactionJoined,
    TransactionRow,
} from "@/features/transactions/types";

const TRANSACTION_SELECT =
    "id, order_id, branch_id, payment_method, amount, status, created_at, orders!transactions_order_id_orders_id_fk(id, order_number), branches!transactions_branch_id_branches_id_fk(id, name)";

function toTransactionRow(r: TransactionJoined): TransactionRow {
    return {
        id: r.id,
        orderId: r.order_id,
        branchId: r.branch_id,
        paymentMethod: r.payment_method,
        amount: r.amount,
        status: r.status,
        createdAt: r.created_at,
        orderNumber: r.orders?.order_number ?? null,
        branchName: r.branches?.name ?? null,
    };
}

/**
 * Mengambil transaksi beserta info order & branch.
 * Filterable berdasarkan branch, metode, dan rentang tanggal.
 *
 * @param params.branchId - Filter per branch
 * @param params.paymentMethod - Filter metode pembayaran
 * @param params.dateFrom - Filter tanggal awal
 * @param params.dateTo - Filter tanggal akhir
 * @returns Daftar transaksi
 */
export const getTransactionsFn = createServerFn({ method: "GET" })
    .validator(
        z
            .object({
                branchId: z.string().optional(),
                paymentMethod: z.string().optional(),
                dateFrom: z.string().optional(),
                dateTo: z.string().optional(),
            })
            .optional(),
    )
    .handler(async ({ data: params }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "finance");
        if (!auth.success) throw new Error(auth.error);

        const { supabaseAdmin } = await import("@database/server");

        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");
        const ids = await getAccessibleBranchIds(
            auth.session.user.id,
            auth.session.user.role,
        );

        if (ids !== null && ids.length === 0) {
            return [] satisfies TransactionRow[];
        }

        let txnQuery = supabaseAdmin
            .from("transactions")
            .select(TRANSACTION_SELECT)
            .order("created_at", { ascending: false });

        if (params?.branchId)
            txnQuery = txnQuery.eq("branch_id", params.branchId);
        if (ids !== null) txnQuery = txnQuery.in("branch_id", ids);
        if (params?.paymentMethod)
            txnQuery = txnQuery.eq("payment_method", params.paymentMethod);
        if (params?.dateFrom)
            txnQuery = txnQuery.gte(
                "created_at",
                new Date(params.dateFrom).toISOString(),
            );
        if (params?.dateTo)
            txnQuery = txnQuery.lte(
                "created_at",
                new Date(params.dateTo).toISOString(),
            );

        const { data, error } = await txnQuery;
        if (error) throw new Error(error.message);

        return ((data ?? []) as unknown as TransactionJoined[]).map(
            toTransactionRow,
        ) satisfies TransactionRow[];
    });

/**
 * Mengambil detail satu transaksi berdasarkan ID.
 *
 * @param id - ID transaksi
 * @returns Data transaksi atau null jika tidak ditemukan
 */
export const getTransactionDetailFn = createServerFn({ method: "GET" })
    .validator(z.object({ id: z.string() }))
    .handler(async ({ data: { id } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "finance");
        if (!auth.success) throw new Error(auth.error);

        const { supabaseAdmin } = await import("@database/server");

        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");
        const ids = await getAccessibleBranchIds(
            auth.session.user.id,
            auth.session.user.role,
        );

        if (ids !== null && ids.length === 0) {
            return null satisfies TransactionRow | null;
        }

        let detailQuery = supabaseAdmin
            .from("transactions")
            .select(TRANSACTION_SELECT)
            .eq("id", id);

        if (ids !== null) detailQuery = detailQuery.in("branch_id", ids);

        const { data, error } = await detailQuery.maybeSingle();
        if (error) throw new Error(error.message);

        if (!data) return null satisfies TransactionRow | null;
        return toTransactionRow(data as unknown as TransactionJoined);
    });

export const transactionsOptions = (params?: {
    branchId?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
}) =>
    queryOptions({
        queryKey: transactionKeys.list(params),
        queryFn: () => getTransactionsFn({ data: params }),
        staleTime: STALE.FREQUENT,
    });

export const transactionDetailOptions = (id: string) =>
    queryOptions({
        queryKey: transactionKeys.detail(id),
        queryFn: () => getTransactionDetailFn({ data: { id } }),
        staleTime: STALE.FREQUENT,
    });

/** @see {@link getTransactionsFn} */
export function useTransactions(params?: {
    branchId?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
}) {
    return useSuspenseQuery(transactionsOptions(params));
}

/** @see {@link getTransactionDetailFn} */
export function useTransactionDetail(id: string) {
    return useSuspenseQuery(transactionDetailOptions(id));
}
