import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { BranchesSkeleton } from "@/components/fallbacks/dashboard";
import { ErrorPage } from "@/components/fallbacks/error-page";
import { BranchesPage } from "@/features/branches/components/branches-page";
import { branchesOptions } from "@/features/branches/hooks/useBranchQueries";

const branchesSearchSchema = z.object({
    branch: z.string().optional(),
});

export const Route = createFileRoute("/_dashboard/branches")({
    validateSearch: branchesSearchSchema,
    loader: async ({ context: { queryClient } }) => {
        await queryClient.ensureQueryData(branchesOptions());
    },
    component: BranchesPage,
    errorComponent: ({ error }) => <ErrorPage error={error} />,
    pendingMs: 0,
    pendingComponent: BranchesSkeleton,
});
