import { createFileRoute } from "@tanstack/react-router";
import { AuditSkeleton } from "@/components/fallbacks/dashboard";
import { AuditPage } from "@/features/audit/components/audit-page";
import { auditLogsOptions } from "@/features/audit/hooks/useAuditLogs";

export const Route = createFileRoute("/_dashboard/audit")({
    loader: ({ context: { queryClient } }) =>
        queryClient.ensureQueryData(auditLogsOptions()),
    head: () => ({
        meta: [
            { title: "Audit Log" },
            {
                name: "description",
                content: "System activity and change tracking.",
            },
        ],
    }),
    component: AuditPage,
    pendingMs: 0,
    pendingComponent: AuditSkeleton,
});
