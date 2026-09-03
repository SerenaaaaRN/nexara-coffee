import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pos")({
    component: () => <div>Pos Page</div>,
});
