import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { OverviewSkeleton } from "@/components/fallbacks/dashboard";
import { OverviewPage } from "@/features/overview/components/overview-page";
import { overviewDashboardOptions } from "@/features/overview/hooks/useOverviewDashboard";

export const Route = createFileRoute("/_dashboard/overview")({
    validateSearch: z.object({
        branch: z.string().optional(),
    }),
    loaderDeps: ({ search: { branch } }) => ({ branch }),
    loader: async ({ deps: { branch }, context: { queryClient } }) => {
        await queryClient.ensureQueryData(overviewDashboardOptions(branch));
    },
    component: OverviewPage,
    pendingMs: 0,
    pendingComponent: OverviewSkeleton,
});
