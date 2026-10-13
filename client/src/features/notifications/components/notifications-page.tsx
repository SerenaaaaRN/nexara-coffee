import { NotificationsList } from "@/features/notifications/components/notifications-list";
import { useSession } from "@/lib/auth-client";

export const NotificationsPage = () => {
    const { data: session } = useSession();

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="mx-auto w-full max-w-2xl">
                <NotificationsList currentUserId={session?.user?.id ?? ""} />
            </div>
        </div>
    );
};
