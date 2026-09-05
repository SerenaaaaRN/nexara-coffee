import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { OrdersSkeleton } from "@/components/fallbacks/dashboard";
import { OrdersPage } from "@/features/orders/components/orders-page";
import { ORDER_STATUSES } from "@/features/orders/data";
import { ordersOptions } from "@/features/orders/hooks/useOrderQueries";
import { requireAccessRSC } from "@/lib/with-auth.server";

const ordersSearchSchema = z.object({
    branchId: z.string().optional(),
    status: z.enum(ORDER_STATUSES).optional().catch(undefined),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    view: z.enum(["table", "board"]).optional().catch("table"),
});

export const Route = createFileRoute("/_dashboard/orders")({
    beforeLoad: () => requireAccessRSC("read", "orders"),
    validateSearch: ordersSearchSchema,
    loaderDeps: ({ search: { branchId, status, dateFrom, dateTo } }) => ({
        branchId,
        status,
        dateFrom,
        dateTo,
    }),
    loader: ({ context: { queryClient }, deps }) =>
        queryClient.ensureQueryData(ordersOptions(deps)),
    head: () => ({
        meta: [
            { title: "Orders" },
            {
                name: "description",
                content: "View and manage orders across branches.",
            },
        ],
    }),
    component: OrdersPage,
    pendingMs: 0,
    pendingComponent: OrdersSkeleton,
});
