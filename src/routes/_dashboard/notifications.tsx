import { createFileRoute } from "@tanstack/react-router";
import { NotificationsSkeleton } from "@/components/fallbacks/dashboard";

export const Route = createFileRoute("/_dashboard/notifications")({
    component: () => <div>Notif Page</div>,
    pendingComponent: NotificationsSkeleton,
});
