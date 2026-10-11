import { createFileRoute } from "@tanstack/react-router";
import { MyPortalSkeleton } from "@/components/fallbacks/dashboard";
import { ErrorPage } from "@/components/fallbacks/error-page";
import { MyLoyaltyPage } from "@/features/customer-portal/components/my-loyalty-page";
import { myLoyaltyOptions } from "@/features/customer-portal/hooks/useCustomerPortalQueries";

export const Route = createFileRoute("/my/member")({
    loader: async ({ context: { queryClient } }) => {
        await queryClient.ensureQueryData(myLoyaltyOptions());
    },
    component: MyLoyaltyPage,
    pendingMs: 0,
    pendingComponent: MyPortalSkeleton,
    errorComponent: ({ error }) => <ErrorPage error={error} />,
});
