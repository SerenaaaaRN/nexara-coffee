import { createFileRoute } from "@tanstack/react-router";
import { CustomersSkeleton } from "@/components/fallbacks/dashboard";

export const Route = createFileRoute("/_dashboard/customers")({
    component: () => <div>Customer Page</div>,
    pendingComponent: CustomersSkeleton,
});
