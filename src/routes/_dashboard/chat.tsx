import { createFileRoute } from "@tanstack/react-router";
import { ChatSkeleton } from "@/components/fallbacks/dashboard";
import { ChatPage } from "@/features/chat/components/chat-page";
import { userChannelsOptions } from "@/features/chat/hooks/useChatQueries";

export const Route = createFileRoute("/_dashboard/chat")({
    loader: ({ context: { queryClient } }) =>
        queryClient.ensureQueryData(userChannelsOptions()),
    head: () => ({
        meta: [
            { title: "Chat" },
            {
                name: "description",
                content: "Internal communication and direct messages.",
            },
        ],
    }),
    component: ChatPage,
    pendingMs: 0,
    pendingComponent: ChatSkeleton,
});
