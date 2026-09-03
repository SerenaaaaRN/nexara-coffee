import { createFileRoute } from "@tanstack/react-router";
import { BranchesSkeleton } from "@/components/fallbacks/dashboard";

export const Route = createFileRoute("/_dashboard/branches")({
    component: () => <div>Branches Page</div>,
    pendingComponent: BranchesSkeleton,
});
