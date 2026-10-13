import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ORDER_STATUSES } from "@/features/orders/data";
import { orderKeys } from "@/features/query-keys";
import { api, toEnvelope } from "@/lib/eden";

export type OrdersFilters = {
    branchId?: string;
    status?: (typeof ORDER_STATUSES)[number];
    dateFrom?: string;
    dateTo?: string;
};

export type OrdersTableParams = {
    q?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
};

/**
 * Mengambil daftar order dari server (search/sort/page di-resolve di server).
 * Param `undefined` tidak dikirim agar key cocok dengan prefetch loader.
 */
export const getOrders = async (params: OrdersFilters & OrdersTableParams) => {
    const { data, error } = await api.orders.get({
        query: {
            branchId: params.branchId,
            status: params.status,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            q: params.q,
            page: params.page,
            pageSize: params.pageSize,
            sortBy: params.sortBy,
            sortDir: params.sortDir,
        },
    });
    return toEnvelope(data, error);
};

/**
 * Query options provider untuk list orders (dipakai route loader).
 */
export const ordersOptions = (params: OrdersFilters & OrdersTableParams) =>
    queryOptions({
        queryKey: orderKeys.list(params),
        queryFn: () => getOrders(params),
        staleTime: 0,
    });

/**
 * Query options untuk tabel server-driven: `placeholderData` menahan halaman
 * lama saat `q/page/sort` berubah agar tidak kedip.
 */
export const ordersTableOptions = (params: OrdersFilters & OrdersTableParams) =>
    queryOptions({
        queryKey: orderKeys.list(params),
        queryFn: () => getOrders(params),
        staleTime: 0,
        placeholderData: (previousData) => previousData,
    });

/**
 * Query tabel orders (non-suspense, untuk paging/search reaktif).
 */
export const useOrdersTableQuery = (
    params: OrdersFilters & OrdersTableParams,
) => {
    return useQuery(ordersTableOptions(params));
};
