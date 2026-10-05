import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Loader2, User } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { ChatLayout } from "@/features/chat/components/chat-layout";
import { useCreateDirectChannel } from "@/features/chat/hooks/useChatMutations";
import {
    availableUsersOptions,
    userChannelsOptions,
} from "@/features/chat/hooks/useChatQueries";
import { chatKeys } from "@/features/query-keys";
import { useSession } from "@/lib/auth-client";
import type { Role } from "@/lib/rbac";
import { can } from "@/lib/rbac";

export const ChatPage = () => {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const { data: channelsQuery } = useSuspenseQuery(userChannelsOptions());
    const channels = channelsQuery?.success ? channelsQuery.data : [];

    const [activeChannelId, setActiveChannelId] = useState<string | null>(() =>
        channels.length > 0 ? channels[0].id : null,
    );
    const [mobileSelected, setMobileSelected] = useState(!!activeChannelId);
    const [isDmSearchOpen, setIsDmSearchOpen] = useState(false);
    const [dmSearchQuery, setDmSearchQuery] = useState("");
    const [availableUsers, setAvailableUsers] = useState<
        { id: string; name: string | null; email: string }[]
    >([]);
    const [isCreatingDm, setIsCreatingDm] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    const userId = session?.user?.id ?? "";
    const userName = session?.user?.name ?? session?.user?.email ?? "";
    const userRole = session?.user.role ?? "";

    const createDirectChannelMutation = useCreateDirectChannel();
    const canSend = can(userRole as Role, "create", "chat");
    const canCreateChannel = can(userRole as Role, "create", "chat");

    const activeChannelInfo = useMemo(
        () => channels.find((c) => c.id === activeChannelId),
        [channels, activeChannelId],
    );
    const canSendInChannel = canSend;

    const channelName = activeChannelInfo
        ? activeChannelInfo.type === "direct"
            ? (activeChannelInfo.name ?? "Direct Message")
            : (activeChannelInfo.name ?? "Channel")
        : "";

    const channelInitial = channelName.charAt(0).toUpperCase();

    const handleRefresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: chatKeys.all });
    }, [queryClient]);

    const handleSelect = useCallback((id: string) => {
        setActiveChannelId(id);
        setMobileSelected(true);
    }, []);

    const handleBack = useCallback(() => {
        setMobileSelected(false);
    }, []);

    const handleOpenDmSearch = useCallback(() => {
        setIsDmSearchOpen(true);
        if (availableUsers.length === 0) {
            setIsLoadingUsers(true);
            queryClient
                .fetchQuery(availableUsersOptions())
                .then((result) => {
                    if (result.success) setAvailableUsers(result.data);
                })
                .catch(console.error)
                .finally(() => setIsLoadingUsers(false));
        }
    }, [availableUsers.length, queryClient]);

    const handleCreateDm = useCallback(
        async (targetUserId: string) => {
            if (isCreatingDm) return;
            setIsCreatingDm(true);
            try {
                const result = await createDirectChannelMutation.mutateAsync({
                    targetUserId,
                });
                if (result.success) {
                    handleSelect(result.data);
                    setIsDmSearchOpen(false);
                    setDmSearchQuery("");
                    handleRefresh();
                }
            } catch (err) {
                console.error("Failed to create DM", err);
            } finally {
                setIsCreatingDm(false);
            }
        },
        [
            isCreatingDm,
            handleSelect,
            handleRefresh,
            createDirectChannelMutation,
        ],
    );

    const filteredUsers = useMemo(
        () =>
            availableUsers.filter(
                (u) =>
                    !dmSearchQuery ||
                    u.name
                        ?.toLowerCase()
                        .includes(dmSearchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(dmSearchQuery.toLowerCase()),
            ),
        [availableUsers, dmSearchQuery],
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <ChatLayout
                channels={channels}
                activeChannelId={activeChannelId}
                currentUserId={userId}
                currentUserName={userName}
                canSendInChannel={canSendInChannel}
                canCreateChannel={canCreateChannel}
                mobileSelected={mobileSelected}
                channelName={channelName}
                channelInitial={channelInitial}
                activeChannelInfo={activeChannelInfo}
                onSelect={handleSelect}
                onBack={handleBack}
                onOpenDmSearch={handleOpenDmSearch}
                onRefresh={handleRefresh}
            />

            <CommandDialog
                open={isDmSearchOpen}
                onOpenChange={(open) => {
                    setIsDmSearchOpen(open);
                    if (!open) setDmSearchQuery("");
                }}>
                <CommandInput
                    placeholder="Search users..."
                    value={dmSearchQuery}
                    onValueChange={setDmSearchQuery}
                />
                <CommandList>
                    <CommandEmpty>
                        {isLoadingUsers ? "Loading..." : "No users found"}
                    </CommandEmpty>
                    <CommandGroup heading="Users">
                        {isLoadingUsers ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <CommandItem
                                    key={user.id}
                                    onSelect={() => handleCreateDm(user.id)}
                                    disabled={isCreatingDm}>
                                    <User className="mr-2 size-4" />
                                    <span>{user.name ?? user.email}</span>
                                    {isCreatingDm ? (
                                        <Loader2 className="ml-auto size-3 animate-spin" />
                                    ) : null}
                                </CommandItem>
                            ))
                        )}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </div>
    );
};
