import { createFileRoute } from "@tanstack/react-router";
import { OrdersSkeleton } from "@/components/fallbacks/dashboard";

export const Route = createFileRoute("/_dashboard/orders")({
    component: () => <div>Order Page</div>,
    pendingComponent: OrdersSkeleton,
});
