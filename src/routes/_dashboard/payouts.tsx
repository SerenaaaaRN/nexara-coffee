import { createFileRoute } from "@tanstack/react-router";
import { PayoutsSkeleton } from "@/components/fallbacks/dashboard";

export const Route = createFileRoute("/_dashboard/payouts")({
    component: () => <div>Payout Page</div>,
    pendingComponent: PayoutsSkeleton,
});
