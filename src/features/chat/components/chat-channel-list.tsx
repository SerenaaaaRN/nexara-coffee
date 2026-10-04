import {
    Building2,
    Hash,
    MessageSquare,
    Plus,
    Search,
    Store,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import type { ChannelRow } from "../types";

interface ChatChannelListProps {
    channels: ChannelRow[];
    activeChannelId: string | null;
    onSelect: (channelId: string) => void;
    onNewChat: () => void;
    canCreate: boolean;
}

export const ChatChannelList = ({
    channels,
    activeChannelId,
    onSelect,
    onNewChat,
    canCreate,
}: ChatChannelListProps) => {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search.trim()) return channels;
        const q = search.toLowerCase();
        return channels.filter(
            (c) =>
                c.name?.toLowerCase().includes(q) ||
                c.branchName?.toLowerCase().includes(q),
        );
    }, [channels, search]);

    const { globalChannels, directChannels, branchGroups } = useMemo(() => {
        const globalChannels: ChannelRow[] = [];
        const branchChannels: ChannelRow[] = [];
        const directChannels: ChannelRow[] = [];

        for (const ch of filtered) {
            if (ch.type === "global") globalChannels.push(ch);
            else if (ch.type === "branch") branchChannels.push(ch);
            else directChannels.push(ch);
        }

        const groups = new Map<string, ChannelRow[]>();
        for (const ch of branchChannels) {
            const name = ch.branchName ?? "Unknown Branch";
            const list = groups.get(name) ?? [];
            list.push(ch);
            groups.set(name, list);
        }
        const branchGroups = Array.from(groups.entries()).sort(([a], [b]) =>
            a.localeCompare(b),
        );

        return { globalChannels, directChannels, branchGroups };
    }, [filtered]);

    const getPreview = (ch: ChannelRow) => {
        if (!ch.lastMessage) return "";
        const t = ch.lastMessage.content;
        return t.length > 40 ? `${t.slice(0, 40)}...` : t;
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold">Inbox</h1>
                    <MessageSquare className="size-5 text-muted-foreground" />
                </div>
                {canCreate ? (
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onNewChat}
                        className="rounded-lg">
                        <Plus />
                    </Button>
                ) : null}
            </div>

            <label className="flex h-10 w-full items-center gap-2 rounded-md border border-input px-2 focus-within:ring-1 focus-within:ring-ring">
                <Search className="size-4 text-muted-foreground" />
                <span className="sr-only">Search</span>
                <input
                    type="text"
                    className="w-full flex-1 bg-transparent text-sm focus-visible:outline-none"
                    placeholder="Search chat..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </label>

            <div className="min-h-0 flex-1 overflow-y-auto -mx-3 px-3">
                {globalChannels.map((ch) => (
                    <button
                        key={ch.id}
                        type="button"
                        onClick={() => onSelect(ch.id)}
                        className={cn(
                            "group flex w-full rounded-md px-2 py-2 text-start text-sm hover:bg-accent hover:text-accent-foreground",
                            activeChannelId === ch.id && "sm:bg-muted",
                        )}>
                        <div className="flex gap-2">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                                <Hash className="size-4 text-muted-foreground" />
                            </div>
                            <div>
                                <div className="font-medium">
                                    {ch.name ?? "General"}
                                </div>
                                <div className="line-clamp-2 text-ellipsis text-muted-foreground group-hover:text-accent-foreground/90">
                                    {getPreview(ch) || "No messages yet"}
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
                {branchGroups.map(([branchName, chs]) => (
                    <div key={branchName}>
                        <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            <Store className="size-3" />
                            {branchName}
                        </div>
                        {chs.map((ch) => (
                            <button
                                key={ch.id}
                                type="button"
                                onClick={() => onSelect(ch.id)}
                                className={cn(
                                    "group flex w-full rounded-md px-2 py-2 text-start text-sm hover:bg-accent hover:text-accent-foreground",
                                    activeChannelId === ch.id && "sm:bg-muted",
                                )}>
                                <div className="flex gap-2">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                                        <Building2 className="size-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <div className="font-medium">
                                            {ch.name ?? "General"}
                                        </div>
                                        <div className="line-clamp-2 text-ellipsis text-muted-foreground group-hover:text-accent-foreground/90">
                                            {getPreview(ch) ||
                                                "No messages yet"}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                ))}
                {directChannels.length > 0 ? (
                    <div>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            Direct Messages
                        </div>
                        {directChannels.map((ch) => {
                            const otherName = ch.name ?? "Unknown";
                            return (
                                <button
                                    key={ch.id}
                                    type="button"
                                    onClick={() => onSelect(ch.id)}
                                    className={cn(
                                        "group flex w-full rounded-md px-2 py-2 text-start text-sm hover:bg-accent hover:text-accent-foreground",
                                        activeChannelId === ch.id &&
                                            "sm:bg-muted",
                                    )}>
                                    <div className="flex gap-2">
                                        <Avatar className="size-9">
                                            <AvatarFallback className="text-xs">
                                                {otherName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">
                                                {otherName}
                                            </div>
                                            <div className="line-clamp-2 text-ellipsis text-muted-foreground group-hover:text-accent-foreground/90">
                                                {getPreview(ch) ||
                                                    "No messages yet"}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : null}
                {channels.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                        No channels yet
                    </p>
                ) : null}
            </div>
        </div>
    );
};
