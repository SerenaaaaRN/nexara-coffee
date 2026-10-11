import { createFileRoute, redirect } from "@tanstack/react-router";
import { MyPortalSkeleton } from "@/components/fallbacks/dashboard";
import { ErrorPage } from "@/components/fallbacks/error-page";
import { MyPortalShell } from "@/features/customer-portal/components/my-portal-shell";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/my")({
    beforeLoad: async () => {
        const session = await getSession();
        if (!session) throw redirect({ to: "/login" });
        if (session.user.role !== "visitor")
            throw redirect({ to: "/overview" });
        return { session };
    },
    component: MyPortalShell,
    pendingMs: 0,
    pendingComponent: MyPortalSkeleton,
    errorComponent: ({ error }) => <ErrorPage error={error} />,
});
