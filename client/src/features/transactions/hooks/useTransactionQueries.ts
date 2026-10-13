import { queryOptions, useQuery } from "@tanstack/react-query";
import { transactionKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, toEnvelope } from "@/lib/eden";

export type TransactionFilters = {
    branchId?: string;
    paymentMethod?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
};

export type TransactionsTableParams = {
    q?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
};

/**
 * Mengambil transaksi beserta info order & branch.
 * Search/sort/page di-resolve di server.
 */
export const getTransactions = async (
    params?: TransactionFilters & TransactionsTableParams,
) => {
    const { data, error } = await api.transactions.get({
        query: {
            branchId: params?.branchId,
            paymentMethod: params?.paymentMethod,
            status: params?.status,
            dateFrom: params?.dateFrom,
            dateTo: params?.dateTo,
            q: params?.q,
            page: params?.page,
            pageSize: params?.pageSize,
            sortBy: params?.sortBy,
            sortDir: params?.sortDir,
        },
    });
    return toEnvelope(data, error);
};

export const transactionsOptions = (
    params?: TransactionFilters & TransactionsTableParams,
) =>
    queryOptions({
        queryKey: transactionKeys.list(params),
        queryFn: () => getTransactions(params),
        staleTime: STALE.FREQUENT,
    });

/**
 * Query tabel transactions (non-suspense): `placeholderData` menahan halaman
 * lama saat `q/page/sort` berubah agar tidak kedip.
 */
export const transactionsTableOptions = (
    params?: TransactionFilters & TransactionsTableParams,
) =>
    queryOptions({
        queryKey: transactionKeys.list(params),
        queryFn: () => getTransactions(params),
        staleTime: STALE.FREQUENT,
        placeholderData: (previousData) => previousData,
    });

export const useTransactionsTableQuery = (
    params?: TransactionFilters & TransactionsTableParams,
) => {
    return useQuery(transactionsTableOptions(params));
};
