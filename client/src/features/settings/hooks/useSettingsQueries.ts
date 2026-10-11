import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { userKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Mengambil daftar user untuk Settings > User Management.
 */
export const getUsers = async () => {
    const { data, error } = await api.settings.users.get();
    return toEnvelope(data, error);
};

export const usersOptions = () =>
    queryOptions({
        queryKey: userKeys.lists(),
        queryFn: () => getUsers(),
        staleTime: STALE.FREQUENT,
    });

export const useUsers = () => {
    return useSuspenseQuery(usersOptions());
};
