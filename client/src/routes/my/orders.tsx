import { createFileRoute } from "@tanstack/react-router";
import { MyPortalSkeleton } from "@/components/fallbacks/dashboard";
import { ErrorPage } from "@/components/fallbacks/error-page";
import { MyOrdersPage } from "@/features/customer-portal/components/my-orders-page";
import { myOrdersInfiniteOptions } from "@/features/customer-portal/hooks/useCustomerPortalQueries";

export const Route = createFileRoute("/my/orders")({
    loader: async ({ context: { queryClient } }) => {
        await queryClient.prefetchInfiniteQuery(myOrdersInfiniteOptions());
    },
    component: MyOrdersPage,
    pendingMs: 0,
    pendingComponent: MyPortalSkeleton,
    errorComponent: ({ error }) => <ErrorPage error={error} />,
});
