import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PayoutsSkeleton } from "@/components/fallbacks/dashboard";
import { PayoutsPage } from "@/features/payouts/components/payouts-page";
import { payoutsOptions } from "@/features/payouts/hooks/usePayoutQueries";

const payoutsSearchSchema = z.object({
    branch: z.string().optional(),
});

export const Route = createFileRoute("/_dashboard/payouts")({
    validateSearch: payoutsSearchSchema,
    loaderDeps: ({ search: { branch } }) => ({ branch }),
    loader: ({ context: { queryClient }, deps }) =>
        queryClient.ensureQueryData(
            payoutsOptions({ branchId: deps.branch, pageSize: 20 }),
        ),
    head: () => ({
        meta: [
            { title: "Payouts" },
            {
                name: "description",
                content: "Manage franchise owner payout requests.",
            },
        ],
    }),
    component: PayoutsPage,
    pendingMs: 0,
    pendingComponent: PayoutsSkeleton,
});
