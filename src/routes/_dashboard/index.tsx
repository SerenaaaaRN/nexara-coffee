import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/")({
    loader: () => {
        throw redirect({ to: "/overview" });
    },
});
