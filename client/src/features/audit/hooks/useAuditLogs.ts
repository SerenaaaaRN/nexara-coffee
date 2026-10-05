import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { auditKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Mengambil semua audit log yang dapat diakses user.
 */
export const getAuditLogs = async () => {
    const { data, error } = await api.audit.logs.get();
    return toEnvelope(data, error);
};

export const auditLogsOptions = () =>
    queryOptions({
        queryKey: auditKeys.lists(),
        queryFn: () => getAuditLogs(),
        staleTime: STALE.SLOW,
    });

export function useAuditLogs() {
    return useSuspenseQuery(auditLogsOptions());
}
