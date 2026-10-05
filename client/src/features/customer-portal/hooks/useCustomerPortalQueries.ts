import {
    infiniteQueryOptions,
    queryOptions,
    useSuspenseInfiniteQuery,
    useSuspenseQuery,
} from "@tanstack/react-query";
import { myPortalKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Mengambil satu halaman riwayat pesanan milik customer yang sedang login.
 */
export const getMyOrders = async (page: number) => {
    const { data, error } = await api.my.orders.get({ query: { page } });
    return toEnvelope(data, error);
};

/**
 * Mengambil profil loyalty milik customer yang sedang login.
 */
export const getMyLoyalty = async () => {
    const { data, error } = await api.my.loyalty.get();
    return toEnvelope(data, error);
};

export const myOrdersInfiniteOptions = () =>
    infiniteQueryOptions({
        queryKey: myPortalKeys.orders(),
        queryFn: ({ pageParam }) => getMyOrders(pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage.success
                ? (lastPage.data.nextPage ?? undefined)
                : undefined,
        staleTime: STALE.FREQUENT,
    });

export const myLoyaltyOptions = () =>
    queryOptions({
        queryKey: myPortalKeys.loyalty(),
        queryFn: () => getMyLoyalty(),
        staleTime: STALE.FREQUENT,
    });

export function useMyOrders() {
    return useSuspenseInfiniteQuery(myOrdersInfiniteOptions());
}

export function useMyLoyalty() {
    return useSuspenseQuery(myLoyaltyOptions());
}
