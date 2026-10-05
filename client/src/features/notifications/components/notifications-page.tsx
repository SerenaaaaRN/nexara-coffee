import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { NotificationsList } from "@/features/notifications/components/notifications-list";
import { notificationsOptions } from "@/features/notifications/hooks/useNotificationQueries";
import { notificationKeys } from "@/features/query-keys";
import { useSession } from "@/lib/auth-client";

export function NotificationsPage() {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const { data } = useSuspenseQuery(notificationsOptions());
    const notifications = data?.data ?? [];

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="mx-auto w-full max-w-2xl">
                <NotificationsList
                    notifications={notifications}
                    currentUserId={session?.user?.id ?? ""}
                    onRefresh={handleRefresh}
                />
            </div>
        </div>
    );
}
