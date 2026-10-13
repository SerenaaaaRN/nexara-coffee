import { createFileRoute } from "@tanstack/react-router";
import { NotificationsSkeleton } from "@/components/fallbacks/dashboard";
import { NotificationsPage } from "@/features/notifications/components/notifications-page";
import { notificationsInfiniteOptions } from "@/features/notifications/hooks/useNotificationQueries";

export const Route = createFileRoute("/_dashboard/notifications")({
    loader: ({ context: { queryClient } }) =>
        queryClient.prefetchInfiniteQuery(notificationsInfiniteOptions({})),
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
