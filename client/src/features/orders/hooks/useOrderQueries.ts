import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import type { ORDER_STATUSES } from "@/features/orders/data";
import { orderKeys } from "@/features/query-keys";
import { api, toEnvelope } from "@/lib/eden";

export type OrdersFilters = {
    branchId?: string;
    status?: (typeof ORDER_STATUSES)[number];
    dateFrom?: string;
    dateTo?: string;
};

/**
 * Mengambil daftar order dengan filter branch, status, dan rentang tanggal.
 */
export const getOrders = async (params: OrdersFilters) => {
    const { data, error } = await api.orders.get({
        query: {
            branchId: params.branchId,
            status: params.status,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
        },
    });
    return toEnvelope(data, error);
};

/**
 * Mengambil detail order beserta daftar item-nya.
 */
export const getOrderDetail = async (id: string) => {
    const { data, error } = await api.orders({ id }).get();
    return toEnvelope(data, error);
};

/**
 * Query options provider untuk list orders.
 */
export const ordersOptions = (params: OrdersFilters) =>
    queryOptions({
        queryKey: orderKeys.list(params),
        queryFn: () => getOrders(params),
        staleTime: 0,
    });

/**
 * Query options provider untuk detail order.
 */
export const orderDetailOptions = (id: string) =>
    queryOptions({
        queryKey: orderKeys.detail(id),
        queryFn: () => getOrderDetail(id),
        staleTime: 0,
    });

/**
 * Custom hook untuk mengambil data list order dengan suspense.
 */
export function useOrders(params: OrdersFilters) {
    return useSuspenseQuery(ordersOptions(params));
}

/**
 * Custom hook untuk mengambil detail order dengan suspense.
 */
export function useOrderDetail(id: string) {
    return useSuspenseQuery(orderDetailOptions(id));
}
