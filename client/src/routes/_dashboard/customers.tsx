import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CustomersSkeleton } from "@/components/fallbacks/dashboard";
import { ErrorPage } from "@/components/fallbacks/error-page";
import { CustomersPage } from "@/features/customers/components/customers-page";
import { customersInfiniteOptions } from "@/features/customers/hooks/useCustomerQueries";

const customersSearchSchema = z.object({
    customer: z.string().optional(),
});

export const Route = createFileRoute("/_dashboard/customers")({
    validateSearch: customersSearchSchema,
    loader: async ({ context: { queryClient } }) => {
        await queryClient.prefetchInfiniteQuery(customersInfiniteOptions({}));
    },
    component: CustomersPage,
    errorComponent: ({ error }) => <ErrorPage error={error} />,
    pendingMs: 0,
    pendingComponent: CustomersSkeleton,
});
