import { createFileRoute } from "@tanstack/react-router";
import { OverviewSkeleton } from "@/components/fallbacks/dashboard";

export const Route = createFileRoute("/_dashboard/overview")({
    component: () => <div>Over Page</div>,
    pendingComponent: OverviewSkeleton,
});
