import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { transactionKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, toEnvelope } from "@/lib/eden";

export type TransactionFilters = {
    branchId?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
};

/**
 * Mengambil transaksi beserta info order & branch.
 * Filterable berdasarkan branch, metode, dan rentang tanggal.
 */
export const getTransactions = async (params?: TransactionFilters) => {
    const { data, error } = await api.transactions.get();
    const envelope = toEnvelope(data, error);
    if (!envelope.success) throw new Error(envelope.error);

    const timeOf = (v: string | Date) => new Date(v).getTime();
    return envelope.data
        .filter((t) => !params?.branchId || t.branchId === params.branchId)
        .filter(
            (t) =>
                !params?.paymentMethod ||
                t.paymentMethod === params.paymentMethod,
        )
        .filter(
            (t) =>
                !params?.dateFrom ||
                timeOf(t.createdAt) >= new Date(params.dateFrom).getTime(),
        )
        .filter(
            (t) =>
                !params?.dateTo ||
                timeOf(t.createdAt) <= new Date(params.dateTo).getTime(),
        )
        .sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt));
};

/**
 * Mengambil detail satu transaksi berdasarkan ID.
 */
export const getTransactionDetail = async (id: string) => {
    const { data, error } = await api.transactions({ id }).get();
    if (error && error.status === 404) return null;
    const envelope = toEnvelope(data, error);
    if (!envelope.success) throw new Error(envelope.error);
    return envelope.data;
};

export const transactionsOptions = (params?: TransactionFilters) =>
    queryOptions({
        queryKey: transactionKeys.list(params),
        queryFn: () => getTransactions(params),
        staleTime: STALE.FREQUENT,
    });

export const transactionDetailOptions = (id: string) =>
    queryOptions({
        queryKey: transactionKeys.detail(id),
        queryFn: () => getTransactionDetail(id),
        staleTime: STALE.FREQUENT,
    });

export function useTransactions(params?: TransactionFilters) {
    return useSuspenseQuery(transactionsOptions(params));
}

export function useTransactionDetail(id: string) {
    return useSuspenseQuery(transactionDetailOptions(id));
}
