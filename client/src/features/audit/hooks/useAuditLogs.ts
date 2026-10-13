import {
    infiniteQueryOptions,
    queryOptions,
    useInfiniteQuery,
    useQuery,
} from "@tanstack/react-query";
import { auditKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, toEnvelope } from "@/lib/eden";

export type AuditLogFilters = {
    branch?: string;
    action?: string;
    targetTable?: string;
    q?: string;
    pageSize?: number;
};

/**
 * Mengambil satu halaman audit log yang dapat diakses user.
 * Search/filter/page di-resolve di server.
 */
export const getAuditLogs = async (params: AuditLogFilters, page: number) => {
    const { data, error } = await api.audit.logs.get({
        query: {
            branch: params.branch,
            action: params.action,
            targetTable: params.targetTable,
            q: params.q,
            page,
            pageSize: params.pageSize,
        },
    });
    return toEnvelope(data, error);
};

/**
 * Mengambil daftar tabel target + total baseline untuk filter bar.
 */
export const getAuditTables = async () => {
    const { data, error } = await api.audit.tables.get();
    return toEnvelope(data, error);
};

export const auditLogsInfiniteOptions = (params: AuditLogFilters) =>
    infiniteQueryOptions({
        queryKey: auditKeys.list(params),
        queryFn: ({ pageParam }) => getAuditLogs(params, pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage.success
                ? (lastPage.data.nextPage ?? undefined)
                : undefined,
        staleTime: STALE.SLOW,
    });

export const auditTablesOptions = () =>
    queryOptions({
        queryKey: [...auditKeys.all, "tables"] as const,
        queryFn: () => getAuditTables(),
        staleTime: STALE.SLOW,
    });

export const useAuditLogsInfinite = (params: AuditLogFilters) => {
    return useInfiniteQuery(auditLogsInfiniteOptions(params));
};

export const useAuditTables = () => {
    return useQuery(auditTablesOptions());
};
