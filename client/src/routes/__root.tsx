import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext } from "@tanstack/react-router";
import { ErrorPage, NotFoundPage } from "@/components/fallbacks/error-page";

interface MyRouterContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
    notFoundComponent: () => <NotFoundPage />,
    errorComponent: ErrorPage,
});
