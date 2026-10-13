import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TransactionsSkeleton } from "@/components/fallbacks/dashboard";
import { TransactionsPage } from "@/features/transactions/components/transactions-page";
import { transactionsOptions } from "@/features/transactions/hooks/useTransactionQueries";

const transactionsSearchSchema = z.object({
    branch: z.string().optional(),
});

export const Route = createFileRoute("/_dashboard/transactions")({
    validateSearch: transactionsSearchSchema,
    loaderDeps: ({ search: { branch } }) => ({ branch }),
    loader: ({ context: { queryClient }, deps }) =>
        queryClient.ensureQueryData(
            transactionsOptions({ branchId: deps.branch, pageSize: 20 }),
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
