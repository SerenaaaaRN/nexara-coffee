import { createFileRoute } from "@tanstack/react-router";
import { NotificationsSkeleton } from "@/components/fallbacks/dashboard";
import { NotificationsPage } from "@/features/notifications/components/notifications-page";
import { notificationsOptions } from "@/features/notifications/hooks/useNotificationQueries";
import { requireAccessRSC } from "@/lib/with-auth.server";

export const Route = createFileRoute("/_dashboard/notifications")({
    beforeLoad: () => requireAccessRSC("read", "notifications"),
    loader: ({ context: { queryClient } }) =>
        queryClient.ensureQueryData(notificationsOptions()),
    head: () => ({
        meta: [
            { title: "Notifications" },
            {
                name: "description",
                content: "System notifications and updates.",
            },
        ],
    }),
    component: NotificationsPage,
    pendingMs: 0,
    pendingComponent: NotificationsSkeleton,
});
