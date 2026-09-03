import { ReviewsSkeleton } from "@/components/fallbacks/dashboard";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/reviews")({
    component: () => <div>Review Page</div>,
    pendingComponent: ReviewsSkeleton,
});
