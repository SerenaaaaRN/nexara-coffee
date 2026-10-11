import {
    queryOptions,
    useQuery,
    useSuspenseQuery,
} from "@tanstack/react-query";
import type {
    CustomerLookupResult,
    CustomerRow,
} from "@/features/customers/types";
import { customerKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, type Envelope, toEnvelope } from "@/lib/eden";

/**
 * Mengambil daftar semua customer beserta jumlah order mereka.
 */
export const getCustomers = async (): Promise<Envelope<CustomerRow[]>> => {
    const { data, error } = await api.customers.get();
    const envelope = toEnvelope(data, error);
    if (!envelope.success) return envelope;
    return {
        success: true as const,
        data: [...envelope.data].sort(
            (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
        ),
    };
};

/** @see {@link getCustomers} */
export const customersOptions = () =>
    queryOptions({
        queryKey: customerKeys.lists(),
        queryFn: () => getCustomers(),
        staleTime: STALE.FREQUENT,
    });

/** @see {@link getCustomers} */
export const useCustomers = () => useSuspenseQuery(customersOptions());

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

export const customerLookupOptions = (phoneDigits: string) =>
    queryOptions({
        queryKey: customerKeys.lookup(phoneDigits),
        queryFn: () => lookupCustomerByPhone(phoneDigits),
        staleTime: 0,
    });

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
