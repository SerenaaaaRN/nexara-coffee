import { Loader2, Plus, Send } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useChatMessages } from "@/features/chat/hooks/useChatMessages";
import { useChatTyping } from "@/features/chat/hooks/useChatTyping";
import { cn } from "@/utils/cn";
import { formatDateSeparator, formatTime } from "@/utils/format";

interface ChatPanelProps {
    channelId: string;
    currentUserId: string;
    currentUserName: string;
    canSend: boolean;
    onRefresh: () => void;
}

export const ChatPanel = ({
    channelId,
    currentUserId,
    currentUserName,
    canSend,
    onRefresh,
}: ChatPanelProps) => {
    const [inputValue, setInputValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        messageGroups,
        isLoadingMessages,
        isLoadingMore,
        hasMore,
        typingUserNames,
        handleLoadMore,
        sendMessage,
    } = useChatMessages({ channelId, currentUserId, onRefresh });

    const { startTyping, stopTyping } = useChatTyping(
        channelId,
        currentUserId,
        currentUserName,
    );

    const handleSend = useCallback(async () => {
        const content = inputValue.trim();
        if (!content || isSending) return;
        stopTyping();
        setIsSending(true);
        setInputValue("");
        const ok = await sendMessage(content);
        if (!ok) setInputValue(content);
        setIsSending(false);
        inputRef.current?.focus();
    }, [inputValue, isSending, stopTyping, sendMessage]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend],
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setInputValue(e.target.value);
            startTyping();
        },
        [startTyping],
    );

    if (isLoadingMessages) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-0">
            <div className="relative min-h-0 flex-1">
                <div className="absolute inset-0 flex flex-col-reverse overflow-y-auto px-1">
                    <div>
                        {messageGroups.map((group) => (
                            <div key={group.dateKey}>
                                <div className="py-3 text-center text-xs text-muted-foreground">
                                    {formatDateSeparator(
                                        group.messages[0].createdAt,
                                    )}
                                </div>
                                {group.messages.map((msg, i) => {
                                    const prevMsg =
                                        i > 0 ? group.messages[i - 1] : null;
                                    const isSameSender =
                                        prevMsg?.senderId === msg.senderId &&
                                        msg.createdAt.getTime() -
                                            prevMsg.createdAt.getTime() <
                                            300000;
                                    const isOwn =
                                        msg.senderId === currentUserId;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex flex-col",
                                                isOwn
                                                    ? "items-end"
                                                    : "items-start",
                                            )}>
                                            {!isOwn && !isSameSender ? (
                                                <div className="mb-1 ml-1 mt-3 flex items-center gap-2">
                                                    <Avatar className="size-7">
                                                        <AvatarFallback className="text-[10px]">
                                                            {(
                                                                msg.senderName ??
                                                                "U"
                                                            ).charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        {msg.senderName ??
                                                            "Unknown"}
                                                    </span>
                                                </div>
                                            ) : null}
                                            <div
                                                className={cn(
                                                    "max-w-[80%] px-4 py-2.5 shadow-xs",
                                                    isOwn
                                                        ? "rounded-[18px_18px_4px_18px] bg-primary text-primary-foreground"
                                                        : "rounded-[18px_18px_18px_4px] bg-muted",
                                                    isSameSender && "mt-0.5",
                                                    !isSameSender && "mt-2",
                                                )}>
                                                <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">
                                                    {msg.content}
                                                </p>
                                                <span
                                                    className={cn(
                                                        "mt-1.5 block text-[11px] font-light",
                                                        isOwn
                                                            ? "text-primary-foreground/70"
                                                            : "text-foreground/60",
                                                    )}>
                                                    {formatTime(msg.createdAt)}
                                                    {isOwn ? " · sent" : null}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        {typingUserNames.length > 0 ? (
                            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                <span className="flex gap-1">
                                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                                </span>
                                {typingUserNames.join(", ")} typing...
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            {hasMore ? (
                <div className="flex justify-center py-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="h-7 text-xs">
                        {isLoadingMore ? (
                            <Loader2 data-icon="inline-start" />
                        ) : null}
                        Load older messages
                    </Button>
                </div>
            ) : null}
            {canSend ? (
                <form
                    data-tour="chat-form"
                    className="flex w-full flex-none gap-2 pt-2">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-input bg-card px-3 py-1.5 focus-within:ring-1 focus-within:ring-ring lg:gap-4">
                        <Button
                            size="icon"
                            type="button"
                            variant="ghost"
                            className="hidden h-8 rounded-lg lg:inline-flex">
                            <Plus />
                        </Button>
                        <label className="flex-1">
                            <span className="sr-only">Chat Text Box</span>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Type a message..."
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onBlur={stopTyping}
                                disabled={isSending}
                                className="h-9 w-full bg-transparent text-sm focus-visible:outline-none"
                            />
                        </label>
                        <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            disabled={!inputValue.trim() || isSending}
                            className="hidden size-9 rounded-lg sm:inline-flex">
                            <Send />
                        </Button>
                    </div>
                    <Button
                        type="submit"
                        onClick={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        disabled={!inputValue.trim() || isSending}
                        className="h-9 rounded-xl sm:hidden">
                        <Send data-icon="inline-start" />
                        Send
                    </Button>
                </form>
            ) : (
                <p className="pt-2 text-center text-xs text-muted-foreground">
                    You don't have permission to send messages. Read-only.
                </p>
            )}
        </div>
    );
};
