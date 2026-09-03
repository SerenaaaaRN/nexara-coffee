import { createFileRoute } from "@tanstack/react-router";
import { KasirSkeleton } from "@/components/fallbacks/dashboard";

export const Route = createFileRoute("/_dashboard/kasir")({
    component: () => <div>Kasir Page</div>,
    pendingComponent: KasirSkeleton,
});
