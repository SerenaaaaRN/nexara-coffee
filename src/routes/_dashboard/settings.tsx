import { createFileRoute } from "@tanstack/react-router";
import { SettingsSkeleton } from "@/components/fallbacks/dashboard";

export const Route = createFileRoute("/_dashboard/settings")({
    component: () => <div>Settings Page</div>,
    pendingComponent: SettingsSkeleton,
});
