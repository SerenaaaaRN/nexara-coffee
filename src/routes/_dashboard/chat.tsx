import { createFileRoute } from "@tanstack/react-router";
import { ChatSkeleton } from "@/components/fallbacks/dashboard";

export const Route = createFileRoute("/_dashboard/chat")({
    component: () => <div>Chat Page</div>,
    pendingComponent: ChatSkeleton,
});
