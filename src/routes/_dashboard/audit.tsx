import { createFileRoute } from "@tanstack/react-router";
import { AuditSkeleton } from "@/components/fallbacks/dashboard";

export const Route = createFileRoute("/_dashboard/audit")({
    component: () => <div>Audit Page </div>,
    pendingComponent: AuditSkeleton,
});
