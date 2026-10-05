import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import type { CustomerRow } from "@/features/customers/types";
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
