import { ArrowLeft, Hash, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useOnlineUsers } from "@/features/chat/hooks/useOnlineUsers";
import { cn } from "@/utils/cn";
import type { ChannelRow } from "../types";
import { ChatChannelList } from "./chat-channel-list";
import { ChatPanel } from "./chat-panel";

interface ChatLayoutProps {
    channels: ChannelRow[];
    activeChannelId: string | null;
    currentUserId: string;
    currentUserName: string;
    canSendInChannel: boolean;
    canCreateChannel: boolean;
    mobileSelected: boolean;
    channelName: string;
    channelInitial: string;
    activeChannelInfo: ChannelRow | undefined;
    onSelect: (id: string) => void;
    onBack: () => void;
    onOpenDmSearch: () => void;
    onRefresh: () => void;
}

export const ChatLayout = ({
    channels,
    activeChannelId,
    currentUserId,
    currentUserName,
    canSendInChannel,
    canCreateChannel,
    mobileSelected,
    channelName,
    channelInitial,
    activeChannelInfo,
    onSelect,
    onBack,
    onOpenDmSearch,
    onRefresh,
}: ChatLayoutProps) => {
    useOnlineUsers(activeChannelId);

    return (
        <section className="flex min-h-0 flex-1 gap-6 overflow-hidden">
            <div
                className={cn(
                    "flex min-h-0 w-full flex-col sm:w-56 lg:w-72 2xl:w-80",
                    mobileSelected && "hidden sm:flex",
                )}>
                <ChatChannelList
                    channels={channels}
                    activeChannelId={activeChannelId}
                    onSelect={onSelect}
                    onNewChat={onOpenDmSearch}
                    canCreate={canCreateChannel}
                />
            </div>
            {activeChannelId ? (
                <div
                    data-tour="chat-conversation"
                    className={cn(
                        "absolute inset-0 inset-s-full z-50 hidden w-full min-h-0 flex-1 flex-col border bg-background shadow-xs sm:static sm:z-auto sm:flex sm:rounded-md",
                        mobileSelected && "inset-s-0 flex",
                    )}>
                    <div className="flex flex-none items-center justify-between bg-card p-4 shadow-sm sm:rounded-t-md">
                        <div className="flex items-center gap-3">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={onBack}
                                className="-ms-2 h-full sm:hidden">
                                <ArrowLeft className="rtl:rotate-180" />
                            </Button>
                            <div className="flex items-center gap-2 lg:gap-4">
                                <Avatar className="size-9 lg:size-11">
                                    <AvatarFallback className="text-sm">
                                        {channelInitial || "C"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-sm font-medium lg:text-base">
                                        {channelName}
                                    </div>
                                    <div className="line-clamp-1 max-w-32 text-xs text-nowrap text-ellipsis text-muted-foreground lg:max-w-none lg:text-sm">
                                        {activeChannelInfo?.memberCount ?? 0}{" "}
                                        members
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="-me-1 flex items-center gap-1 lg:gap-2">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="hidden size-8 rounded-full sm:inline-flex lg:size-10">
                                <Hash />
                            </Button>
                        </div>
                    </div>
                    <ChatPanel
                        key={activeChannelId}
                        channelId={activeChannelId}
                        currentUserId={currentUserId}
                        currentUserName={currentUserName}
                        canSend={canSendInChannel}
                        onRefresh={onRefresh}
                    />
                </div>
            ) : (
                <div
                    data-tour="chat-conversation"
                    className={cn(
                        "absolute inset-0 inset-s-full z-50 hidden w-full min-h-0 flex-1 flex-col justify-center rounded-md border bg-card shadow-xs sm:static sm:z-auto sm:flex",
                        mobileSelected && "inset-s-0 flex",
                    )}>
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex size-16 items-center justify-center rounded-full border-2 border-border">
                            <MessageSquare className="size-8 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col gap-2 text-center">
                            <h1 className="text-xl font-semibold">
                                Your messages
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Send a message to start a chat.
                            </p>
                        </div>
                        <Button onClick={onOpenDmSearch}>Send message</Button>
                    </div>
                </div>
            )}
        </section>
    );
};
