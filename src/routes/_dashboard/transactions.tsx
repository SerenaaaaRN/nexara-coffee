import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TransactionsSkeleton } from "@/components/fallbacks/dashboard";
import { TransactionsPage } from "@/features/transactions/components/transactions-page";
import { transactionsOptions } from "@/features/transactions/hooks/useTransactionQueries";
import { requireAccessRSC } from "@/lib/with-auth.server";

const transactionsSearchSchema = z.object({
    branch: z.string().optional(),
});

export const Route = createFileRoute("/_dashboard/transactions")({
    beforeLoad: () => requireAccessRSC("read", "finance"),
    validateSearch: transactionsSearchSchema,
    loaderDeps: ({ search: { branch } }) => ({ branch }),
    loader: ({ context: { queryClient }, deps }) =>
        queryClient.ensureQueryData(
            transactionsOptions({ branchId: deps.branch }),
        ),
    head: () => ({
        meta: [
            { title: "Transactions" },
            {
                name: "description",
                content: "Manage financial transactions and refunds.",
            },
        ],
    }),
    component: TransactionsPage,
    pendingMs: 0,
    pendingComponent: TransactionsSkeleton,
});
