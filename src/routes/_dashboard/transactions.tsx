import { createFileRoute } from "@tanstack/react-router";
import { TransactionsSkeleton } from "@/components/fallbacks/dashboard";

export const Route = createFileRoute("/_dashboard/transactions")({
    component: () => <div>Transcation Page</div>,
    pendingComponent: TransactionsSkeleton,
});
