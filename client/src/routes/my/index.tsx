import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/my/")({
    beforeLoad: async () => {
        throw redirect({ to: "/my/orders" });
    },
});
