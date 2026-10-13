import {
    infiniteQueryOptions,
    queryOptions,
    useInfiniteQuery,
    useQuery,
} from "@tanstack/react-query";
import type {
    CustomerLookupResult,
    CustomerRow,
} from "@/features/customers/types";
import { customerKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, type Envelope, toEnvelope } from "@/lib/eden";

export type CustomerFilters = {
    segment?: string;
    tier?: string;
    q?: string;
    pageSize?: number;
};

/**
 * Mengambil satu halaman customer beserta jumlah order mereka.
 * Search/filter/page di-resolve di server.
 */
export const getCustomers = async (params: CustomerFilters, page: number) => {
    const { data, error } = await api.customers.get({
        query: {
            segment: params.segment,
            tier: params.tier,
            q: params.q,
            page,
            pageSize: params.pageSize,
        },
    });
    return toEnvelope(data, error);
};

/**
 * Mengambil satu customer untuk sheet detail (misal deep-link).
 */
export const getCustomerDetail = async (
    id: string,
): Promise<Envelope<CustomerRow>> => {
    const { data, error } = await api.customers({ id }).get();
    return toEnvelope(data, error);
};

/**
 * Mencari customer berdasarkan nomor HP (read-only, tanpa create).
 * Untuk verifikasi "atas nama siapa" sebelum charge di POS.
 */
export const lookupCustomerByPhone = async (
    phone: string,
): Promise<Envelope<CustomerLookupResult>> => {
    const { data, error } = await api.customers.lookup.post({ phone });
    return toEnvelope(data, error);
};

export const customersInfiniteOptions = (params: CustomerFilters) =>
    infiniteQueryOptions({
        queryKey: customerKeys.list(params),
        queryFn: ({ pageParam }) => getCustomers(params, pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage.success
                ? (lastPage.data.nextPage ?? undefined)
                : undefined,
        staleTime: STALE.FREQUENT,
    });

export const customerDetailOptions = (id: string) =>
    queryOptions({
        queryKey: customerKeys.detail(id),
        queryFn: () => getCustomerDetail(id),
        staleTime: STALE.FREQUENT,
    });

export const customerLookupOptions = (phoneDigits: string) =>
    queryOptions({
        queryKey: customerKeys.lookup(phoneDigits),
        queryFn: () => lookupCustomerByPhone(phoneDigits),
        staleTime: 0,
    });

/** @see {@link getCustomers} */
export const useCustomersInfinite = (params: CustomerFilters) =>
    useInfiniteQuery(customersInfiniteOptions(params));

export const useCustomerDetail = (id: string, enabled: boolean) =>
    useQuery({ ...customerDetailOptions(id), enabled });

/**
 * Lookup member reaktif terhadap input kasir. Hanya jalan saat digit
 * HP sudah sepanjang nomor valid (minimal 9 digit).
 */
export const useLookupCustomerByPhone = (phoneDigits: string) =>
    useQuery({
        ...customerLookupOptions(phoneDigits),
        enabled: phoneDigits.length >= 9,
        gcTime: 60_000,
    });
