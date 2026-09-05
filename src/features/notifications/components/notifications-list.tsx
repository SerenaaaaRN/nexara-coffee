import {
    Bell,
    BellOff,
    Calendar,
    Check,
    CheckCheck,
    ChevronDown,
    Loader2,
    MailOpen,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
    Empty,
    EmptyDescription,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    useMarkAllRead,
    useMarkNotificationRead,
} from "@/features/notifications/hooks/useNotificationMutations";
import { useNotificationsRealtime } from "@/features/notifications/hooks/useNotificationsRealtime";
import type { NotificationRow } from "@/features/notifications/types";
import {
    formatNotificationType,
    getNotificationIcon,
} from "@/features/notifications/utils";
import { timeAgo } from "@/utils/format";
import { groupByDate } from "@/utils/group-by";

interface NotificationsListProps {
    notifications: NotificationRow[];
    currentUserId: string;
    onRefresh: () => void;
}

type FilterMode = "all" | "unread" | "read";

const INITIAL_PAGE_SIZE = 30;

export function NotificationsList({
    notifications: initialNotifications,
    currentUserId,
    onRefresh,
}: NotificationsListProps) {
    const [notifications, setNotifications] =
        useState<NotificationRow[]>(initialNotifications);
    const [filter, setFilter] = useState<FilterMode>("all");
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const [confirmMarkAll, setConfirmMarkAll] = useState(false);
    const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);

    const markReadMutation = useMarkNotificationRead();
    const markAllReadMutation = useMarkAllRead();

    useEffect(() => {
        setNotifications(initialNotifications);
    }, [initialNotifications]);

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.isRead).length,
        [notifications],
    );

    const filtered = useMemo(() => {
        switch (filter) {
            case "unread":
                return notifications.filter((n) => !n.isRead);
            case "read":
                return notifications.filter((n) => n.isRead);
            default:
                return notifications;
        }
    }, [notifications, filter]);

    const pagedNotifications = useMemo(
        () => filtered.slice(0, visibleCount),
        [filtered, visibleCount],
    );

    const hasMore = visibleCount < filtered.length;

    const grouped = useMemo(
        () => groupByDate(pagedNotifications),
        [pagedNotifications],
    );

    const handleNewNotification = useCallback(
        (data: {
            id: string;
            type: string;
            title: string;
            body: string | null;
            createdAt: string;
        }) => {
            setNotifications((prev) => {
                if (prev.some((n) => n.id === data.id)) return prev;
                const next: NotificationRow[] = [
                    {
                        id: data.id,
                        userId: currentUserId,
                        type: data.type,
                        title: data.title,
                        body: data.body,
                        isRead: false,
                        createdAt: data.createdAt,
                    },
                    ...prev,
                ];
                return next;
            });
            toast(data.title, {
                description: data.body ?? undefined,
                icon: <Bell className="size-4" />,
            });
        },
        [currentUserId],
    );

    useNotificationsRealtime(currentUserId, handleNewNotification);

    async function handleMarkRead(id: string) {
        setMarkingId(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
        try {
            const res = await markReadMutation.mutateAsync({ id });
            if (!res.success) throw new Error("Failed");
        } catch {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
            );
        } finally {
            setMarkingId(null);
        }
    }

    async function handleMarkAllRead() {
        setConfirmMarkAll(false);
        setIsMarkingAll(true);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        try {
            const res = await markAllReadMutation.mutateAsync({});
            if (res.success) {
                toast.success("All notifications marked as read");
                onRefresh();
            } else {
                throw new Error("Failed");
            }
        } catch {
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: false })),
            );
        } finally {
            setIsMarkingAll(false);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Notifications
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {unreadCount > 0
                            ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                            : notifications.length === 0
                              ? "No notifications yet"
                              : "All caught up"}
                    </p>
                </div>
                {unreadCount > 1 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmMarkAll(true)}
                        disabled={isMarkingAll}>
                        {isMarkingAll ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                            <CheckCheck className="mr-2 size-4" />
                        )}
                        Mark all read
                    </Button>
                )}
            </div>

            <Tabs
                value={filter}
                onValueChange={(v) => {
                    setFilter(v as FilterMode);
                    setVisibleCount(INITIAL_PAGE_SIZE);
                }}>
                <TabsList>
                    <TabsTrigger value="all">
                        All
                        {notifications.length > 0 && (
                            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                                {notifications.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="unread">
                        Unread
                        {unreadCount > 0 && (
                            <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground tabular-nums">
                                {unreadCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="read">Read</TabsTrigger>
                </TabsList>
            </Tabs>

            {filtered.length === 0 ? (
                <Empty>
                    <EmptyMedia variant="icon">
                        {filter === "unread" ? (
                            <MailOpen className="size-8" />
                        ) : (
                            <BellOff className="size-8" />
                        )}
                    </EmptyMedia>
                    <EmptyTitle>
                        {filter === "unread"
                            ? "No unread notifications"
                            : filter === "read"
                              ? "No read notifications"
                              : "No notifications yet"}
                    </EmptyTitle>
                    <EmptyDescription>
                        {filter === "all"
                            ? "Notifications will appear here when something happens in the system."
                            : "Try switching to a different filter."}
                    </EmptyDescription>
                </Empty>
            ) : (
                <ScrollArea className="h-[calc(100vh-20rem)]">
                    <div className="flex flex-col gap-0">
                        {grouped.map((group) => (
                            <div key={group.label}>
                                <div className="sticky top-0 z-10 -mx-1 bg-background px-1 py-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="size-3.5 text-muted-foreground" />
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {group.label}
                                        </span>
                                        <Separator className="flex-1" />
                                    </div>
                                </div>

                                {group.items.map((notification, _idx) => {
                                    const Icon = getNotificationIcon(
                                        notification.type,
                                    );
                                    const isCurrentMarking =
                                        markingId === notification.id;

                                    return (
                                        <div
                                            key={notification.id}
                                            className={`group relative flex items-start gap-3 rounded-lg px-3 py-3 transition-all hover:bg-muted/50 ${
                                                !notification.isRead
                                                    ? "bg-muted/20"
                                                    : "opacity-75 hover:opacity-100"
                                            }`}>
                                            <div
                                                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                                                    !notification.isRead
                                                        ? "bg-primary/10 text-primary"
                                                        : "bg-muted text-muted-foreground"
                                                }`}>
                                                <Icon className="size-4" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p
                                                            className={`text-sm leading-snug ${
                                                                !notification.isRead
                                                                    ? "font-semibold text-foreground"
                                                                    : "font-medium text-muted-foreground"
                                                            }`}>
                                                            {notification.title}
                                                        </p>
                                                        {notification.body && (
                                                            <p className="mt-0.5 text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                                                                {
                                                                    notification.body
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2 self-start pt-0.5">
                                                        <span className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground/60">
                                                            {timeAgo(
                                                                new Date(
                                                                    notification.createdAt,
                                                                ),
                                                            )}
                                                        </span>
                                                        {!notification.isRead && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-7 opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100"
                                                                onClick={() =>
                                                                    handleMarkRead(
                                                                        notification.id,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isCurrentMarking
                                                                }>
                                                                {isCurrentMarking ? (
                                                                    <Loader2 className="size-3.5 animate-spin" />
                                                                ) : (
                                                                    <Check className="size-3.5" />
                                                                )}
                                                                <span className="sr-only">
                                                                    Mark as read
                                                                </span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">
                                                        {formatNotificationType(
                                                            notification.type,
                                                        )}
                                                    </span>
                                                    {!notification.isRead && (
                                                        <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}

                        {hasMore && (
                            <div className="flex justify-center py-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setVisibleCount((prev) => prev + 20)
                                    }>
                                    <ChevronDown className="mr-2 size-4" />
                                    Show more
                                </Button>
                            </div>
                        )}

                        {!hasMore && filtered.length > INITIAL_PAGE_SIZE && (
                            <div className="flex justify-center py-4">
                                <p className="text-xs text-muted-foreground">
                                    Showing all {filtered.length} notification
                                    {filtered.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            )}

            <ConfirmDialog
                open={confirmMarkAll}
                onOpenChange={setConfirmMarkAll}
                title="Mark all as read?"
                description={
                    <>
                        This will mark all {unreadCount} unread notification
                        {unreadCount !== 1 ? "s" : ""} as read. This action
                        cannot be undone.
                    </>
                }
                confirmLabel="Mark all read"
                onConfirm={handleMarkAllRead}
            />
        </div>
    );
}
