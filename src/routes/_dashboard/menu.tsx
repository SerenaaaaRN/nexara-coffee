import { createFileRoute } from "@tanstack/react-router";
import { MenuSkeleton } from "@/components/fallbacks/dashboard";

export const Route = createFileRoute("/_dashboard/menu")({
    component: () => <div>Menu Page</div>,
    pendingComponent: MenuSkeleton,
});
