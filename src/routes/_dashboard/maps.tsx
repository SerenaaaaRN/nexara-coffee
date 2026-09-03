import { createFileRoute } from "@tanstack/react-router";
import { MapsSkeleton } from "@/components/fallbacks/dashboard";

export const Route = createFileRoute("/_dashboard/maps")({
    component: () => <div>Maps Page</div>,
    pendingComponent: MapsSkeleton,
});
