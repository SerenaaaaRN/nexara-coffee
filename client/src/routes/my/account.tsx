import { createFileRoute } from "@tanstack/react-router";
import { MyPortalSkeleton } from "@/components/fallbacks/dashboard";
import { ErrorPage } from "@/components/fallbacks/error-page";
import { MyAccountPage } from "@/features/customer-portal/components/my-account-page";

export const Route = createFileRoute("/my/account")({
    component: MyAccountPage,
    pendingMs: 0,
    pendingComponent: MyPortalSkeleton,
    errorComponent: ({ error }) => <ErrorPage error={error} />,
});
