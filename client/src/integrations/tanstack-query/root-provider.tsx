import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

let queryClient: QueryClient | undefined;

function getQueryClient() {
    if (!queryClient) {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    staleTime: 5 * 60 * 1000,
                    gcTime: 10 * 60 * 1000,
                    retry: 1,
                    retryDelay: (attemptIndex) =>
                        Math.min(1000 * 2 ** attemptIndex, 10_000),
                    refetchOnWindowFocus: false,
                },
            },
        });
    }
    return queryClient;
}

export function getContext() {
    return { queryClient: getQueryClient() };
}

export default function TanstackQueryProvider({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <QueryClientProvider client={getQueryClient()}>
            {children}
        </QueryClientProvider>
    );
}
